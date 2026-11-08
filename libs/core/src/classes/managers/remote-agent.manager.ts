import type { KritzelCore } from '../core/core.class';
import type { KritzelPoint } from '../../interfaces/point.interface';
import type { KritzelAgenticAttachment, KritzelAgenticCursor } from '../../interfaces/agentic-cursor.interface';
import type { KritzelAgenticActionType } from '../../interfaces/agentic-action.interface';
import type { KritzelAwarenessAgent, KritzelRemoteAgentPresence } from '../../interfaces/agent.interface';
import { AGENT_BROADCAST_INTERVAL_MS, AGENT_BROADCAST_MAX_IDS, AGENT_BROADCAST_MAX_STATUS_LENGTH } from './agent-broadcast.manager';
import { isAgenticAnchor } from '../../helpers/agentic-geometry.helper';

/** A collaborator's agent as the cursor overlay draws it. */
export interface KritzelRemoteAgentCursor extends KritzelAgenticCursor {
  /** Unique across clients: `r:<clientId>:<agentId>`. */
  key: string;
  clientId: number;
  isRemote: true;
  avatarUrl?: string;
}

interface RemoteAgentEntry {
  key: string;
  clientId: number;
  agent: KritzelAwarenessAgent;
  hostUser?: { id: string; displayName?: string; color?: string };
  /** Where the cursor is drawn. */
  rendered: KritzelPoint;
  from: KritzelPoint;
  to: KritzelPoint;
  startedAt: number;
}

const MAX_NAME_LENGTH = 100;

/**
 * The agents collaborators share through awareness. Keeps one entry per agent and client, glides each
 * cursor to its latest position (updates arrive at most every 100 ms) and keeps attached cursors on
 * their objects locally, so they stick exactly while the objects move.
 */
export class KritzelRemoteAgentManager {
  private readonly _core: KritzelCore;
  private readonly _entries = new Map<string, RemoteAgentEntry>();
  private readonly _changeListeners = new Set<() => void>();
  private readonly _frameListeners = new Set<() => void>();
  private _structureKey = '';
  private _rafId: number | null = null;
  private _claimed = new Set<string>();
  private _selected = new Set<string>();

  constructor(core: KritzelCore) {
    this._core = core;
  }

  get count(): number {
    return this._entries.size;
  }

  /** Reads the `agents` fields of all other clients. Called with every awareness change. @internal */
  handleAwarenessStates(states: Map<number, Record<string, unknown>>, localClientId: number | null): void {
    const now = this.now();
    const seen = new Set<string>();
    states.forEach((state, clientId) => {
      if (clientId === localClientId || !state || !Array.isArray(state['agents'])) {
        return;
      }
      const hostUser = parseHostUser(state['user']);
      for (const raw of state['agents'] as unknown[]) {
        const agent = parseAgent(raw);
        if (!agent) {
          continue;
        }
        const key = `r:${clientId}:${agent.id}`;
        seen.add(key);
        const existing = this._entries.get(key);
        if (existing) {
          if (existing.to.x !== agent.position.x || existing.to.y !== agent.position.y) {
            existing.from = { ...existing.rendered };
            existing.to = { ...agent.position };
            existing.startedAt = now;
          }
          existing.agent = agent;
          existing.hostUser = hostUser;
        } else {
          this._entries.set(key, {
            key,
            clientId,
            agent,
            hostUser,
            rendered: { ...agent.position },
            from: { ...agent.position },
            to: { ...agent.position },
            startedAt: now,
          });
        }
      }
    });
    for (const key of Array.from(this._entries.keys())) {
      if (!seen.has(key)) {
        this._entries.delete(key);
      }
    }
    this.rebuildClaims();
    this.emitChangeIfStructural();
    this.ensureLoop();
  }

  /** Remote agents as the cursor overlay draws them. */
  getAll(): KritzelRemoteAgentCursor[] {
    return Array.from(this._entries.values()).map(entry => ({
      key: entry.key,
      clientId: entry.clientId,
      isRemote: true as const,
      id: entry.agent.id,
      name: entry.agent.name,
      color: entry.agent.color,
      ...(entry.agent.avatarUrl ? { avatarUrl: entry.agent.avatarUrl } : {}),
      status: entry.agent.status ?? undefined,
      visible: entry.agent.visible,
      position: { ...entry.rendered },
      attachedTo: entry.agent.attachedTo,
      isMoving: this.isGliding(entry, this.now()),
      selectedObjectIds: [...entry.agent.selectedObjectIds],
      isPressed: entry.agent.isPressed,
      pressCount: entry.agent.pressCount,
      activeAction: entry.agent.activeAction as KritzelAgenticActionType | null,
      queueLength: entry.agent.queueLength,
      canUndo: false,
      canRedo: false,
    }));
  }

  /** Remote agents as shown in avatar stacks. */
  getPresences(): KritzelRemoteAgentPresence[] {
    return Array.from(this._entries.values()).map(entry => ({
      id: entry.agent.id,
      kind: 'agent' as const,
      name: entry.agent.name,
      displayName: entry.agent.name,
      color: entry.agent.color,
      ...(entry.agent.avatarUrl ? { avatarUrl: entry.agent.avatarUrl, profileImageUrl: entry.agent.avatarUrl } : {}),
      status: entry.agent.status,
      visible: entry.agent.visible,
      activeAction: entry.agent.activeAction as KritzelAgenticActionType | null,
      queueLength: entry.agent.queueLength,
      isRemote: true as const,
      clientId: entry.clientId,
      ...(entry.hostUser ? { hostUser: entry.hostUser } : {}),
    }));
  }

  /**
   * Whether a remote agent works on the object. Targets conflict with remote agents' running actions and
   * selections, references only with their running actions.
   */
  isClaimed(objectId: string, kind: 'target' | 'reference'): boolean {
    return this._claimed.has(objectId) || (kind === 'target' && this._selected.has(objectId));
  }

  /** Subscribes to structural changes (agents added or removed, name, color, status, activity, selection). */
  onChange(listener: () => void): () => void {
    this._changeListeners.add(listener);
    return () => this._changeListeners.delete(listener);
  }

  /** Subscribes to animation frames while remote agents exist. */
  onFrame(listener: () => void): () => void {
    this._frameListeners.add(listener);
    return () => this._frameListeners.delete(listener);
  }

  /**
   * Advances gliding cursors and resolves attachments. Called by the internal loop; public for testing.
   */
  tick(now: number = this.now()): void {
    this._entries.forEach(entry => {
      // One entry that fails (it comes from another client) must not stop the others or the frame listeners.
      this.safeCall(() => {
        const attached = entry.agent.attachedTo ? this._core.agenticCursorManager?.resolveTarget(entry.agent.attachedTo) : null;
        if (attached && !this.isGliding(entry, now)) {
          entry.rendered = attached;
          return;
        }
        const progress = Math.min(1, Math.max(0, (now - entry.startedAt) / AGENT_BROADCAST_INTERVAL_MS));
        entry.rendered = {
          x: entry.from.x + (entry.to.x - entry.from.x) * progress,
          y: entry.from.y + (entry.to.y - entry.from.y) * progress,
        };
      });
    });
    this._frameListeners.forEach(listener => this.safeCall(listener));
  }

  /** Forgets all remote agents, e.g. on a workspace switch. */
  clear(): void {
    if (this._entries.size === 0) {
      return;
    }
    this._entries.clear();
    this.rebuildClaims();
    this.emitChangeIfStructural();
    this.stopLoop();
  }

  private isGliding(entry: RemoteAgentEntry, now: number): boolean {
    return now - entry.startedAt < AGENT_BROADCAST_INTERVAL_MS && (entry.from.x !== entry.to.x || entry.from.y !== entry.to.y);
  }

  private rebuildClaims(): void {
    this._claimed = new Set();
    this._selected = new Set();
    this._entries.forEach(entry => {
      entry.agent.claimedObjectIds.forEach(id => this._claimed.add(id));
      entry.agent.selectedObjectIds.forEach(id => this._selected.add(id));
    });
  }

  private emitChangeIfStructural(): void {
    const key = JSON.stringify(
      Array.from(this._entries.values()).map(entry => {
        const { position: _position, attachedTo: _attachedTo, isPressed: _isPressed, ...rest } = entry.agent;
        return [entry.key, rest, entry.hostUser?.displayName ?? null];
      }),
    );
    if (key === this._structureKey) {
      return;
    }
    this._structureKey = key;
    this._changeListeners.forEach(listener => this.safeCall(listener));
  }

  private ensureLoop(): void {
    if (this._rafId !== null || this._entries.size === 0 || typeof requestAnimationFrame !== 'function') {
      return;
    }
    const loop = (time: number) => {
      this._rafId = null;
      try {
        this.tick(time);
      } finally {
        if (this._entries.size > 0 && this._rafId === null) {
          this._rafId = requestAnimationFrame(loop);
        }
      }
    };
    this._rafId = requestAnimationFrame(loop);
  }

  private stopLoop(): void {
    if (this._rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this._rafId);
    }
    this._rafId = null;
  }

  private safeCall(fn: () => void): void {
    try {
      fn();
    } catch (error) {
      console.error('[Kritzel] Remote agent listener failed:', error);
    }
  }

  private now(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }
}

/** Awareness comes from other clients: accept only well-formed agents, with bounded strings and lists. */
function parseAgent(raw: unknown): KritzelAwarenessAgent | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const value = raw as Record<string, unknown>;
  const position = value['position'] as Record<string, unknown> | undefined;
  if (
    typeof value['id'] !== 'string' ||
    value['id'].length === 0 ||
    typeof value['name'] !== 'string' ||
    typeof value['color'] !== 'string' ||
    !position ||
    !isFiniteNumber(position['x']) ||
    !isFiniteNumber(position['y'])
  ) {
    return null;
  }
  return {
    id: value['id'].slice(0, MAX_NAME_LENGTH),
    name: value['name'].slice(0, MAX_NAME_LENGTH),
    color: value['color'].slice(0, MAX_NAME_LENGTH),
    ...(isSafeImageUrl(value['avatarUrl']) ? { avatarUrl: value['avatarUrl'] } : {}),
    status: typeof value['status'] === 'string' && value['status'] ? value['status'].slice(0, AGENT_BROADCAST_MAX_STATUS_LENGTH) : null,
    visible: value['visible'] !== false,
    activeAction: typeof value['activeAction'] === 'string' ? value['activeAction'] : null,
    queueLength: isFiniteNumber(value['queueLength']) ? Math.max(0, Math.floor(value['queueLength'])) : 0,
    position: { x: position['x'] as number, y: position['y'] as number },
    attachedTo: parseAttachment(value['attachedTo']),
    isPressed: value['isPressed'] === true,
    pressCount: isFiniteNumber(value['pressCount']) ? Math.max(0, Math.floor(value['pressCount'])) : 0,
    selectedObjectIds: parseIds(value['selectedObjectIds']),
    claimedObjectIds: parseIds(value['claimedObjectIds']),
  };
}

function parseAttachment(raw: unknown): KritzelAgenticAttachment | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const value = raw as Record<string, unknown>;
  const offset = value['offset'] as Record<string, unknown> | undefined;
  if (typeof value['objectId'] !== 'string' || value['objectId'].length === 0 || value['objectId'].length > MAX_NAME_LENGTH) {
    return null;
  }
  // An element inside an object can only be resolved where its content reports it: follow the position instead
  // of sticking to the object's anchor.
  if (value['selector'] !== undefined) {
    return null;
  }
  return {
    objectId: value['objectId'],
    // Known anchors only: an inherited key such as "toString" would break the anchor lookup.
    anchor: isAgenticAnchor(value['anchor']) ? value['anchor'] : 'center',
    offset: { x: isFiniteNumber(offset?.['x']) ? (offset!['x'] as number) : 0, y: isFiniteNumber(offset?.['y']) ? (offset!['y'] as number) : 0 },
  };
}

function parseIds(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((id): id is string => typeof id === 'string' && id.length > 0).slice(0, AGENT_BROADCAST_MAX_IDS) : [];
}

function parseHostUser(raw: unknown): { id: string; displayName?: string; color?: string } | undefined {
  if (!raw || typeof raw !== 'object' || typeof (raw as Record<string, unknown>)['id'] !== 'string') {
    return undefined;
  }
  const value = raw as Record<string, unknown>;
  return {
    id: value['id'] as string,
    ...(typeof value['displayName'] === 'string' ? { displayName: value['displayName'] } : {}),
    ...(typeof value['color'] === 'string' ? { color: value['color'] } : {}),
  };
}

/** http(s), `data:image/` and relative URLs only, so a collaborator cannot point avatars at other schemes. */
function isSafeImageUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) {
    return false;
  }
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(value.trim())?.[1]?.toLowerCase();
  return scheme === undefined || scheme === 'http' || scheme === 'https' || (scheme === 'data' && /^data:image\//i.test(value.trim()));
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
