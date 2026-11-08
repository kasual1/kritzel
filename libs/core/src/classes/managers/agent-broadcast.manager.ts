import type { KritzelCore } from '../core/core.class';
import type { KritzelAwarenessAgent } from '../../interfaces/agent.interface';

/** How often agent motion is shared, in milliseconds (the same rate collaborators receive awareness at). */
export const AGENT_BROADCAST_INTERVAL_MS = 100;
/** Longest status message shared with collaborators. */
export const AGENT_BROADCAST_MAX_STATUS_LENGTH = 200;
/** Most selected or claimed object IDs shared per agent. */
export const AGENT_BROADCAST_MAX_IDS = 50;

/**
 * Shares the local agents that have `broadcast` on with collaborators through the awareness field
 * `agents`: identity, status, activity, cursor position and the objects each agent works on.
 *
 * The payload is built at most every 100 ms (leading and trailing) and only sent when it changed, so
 * idle agents send nothing. Adding or removing an agent, renaming, recoloring or hiding it and turning
 * `broadcast` on or off are sent at once; status, activity, motion and selections follow the throttle.
 */
export class KritzelAgentBroadcaster {
  private readonly _core: KritzelCore;
  private _lastSent: string | null = null;
  /** Which agents were last sent, with what collaborators see of them at once (see `structureOf`). */
  private _lastStructure: string | null = null;
  private _lastSentAt = -Infinity;
  private _timer: ReturnType<typeof setTimeout> | null = null;
  private _dirty = false;
  private _started = false;

  constructor(core: KritzelCore) {
    this._core = core;
  }

  /** Starts listening to the agents. Called once by the core. @internal */
  start(): void {
    if (this._started) {
      return;
    }
    this._started = true;
    // Added, removed, renamed, recolored, hidden, broadcast toggled: send at once. Any other change of an
    // agent (status, activity, selection, history) follows the throttle.
    this._core.agentManager.onChange(() => (structureOf(this.buildPayload()) !== this._lastStructure ? this.flush() : this.schedule()));
    this._core.agenticCursorManager.onChange(() => this.schedule());
    this._core.agenticCursorManager.onFrame(() => this.schedule());
  }

  /** Sends the agents to a newly loaded workspace (each workspace has its own awareness). @internal */
  reset(): void {
    this._lastSent = null;
    this._lastStructure = null;
    this.flush();
  }

  /** Removes the agents from awareness, e.g. when the engine disconnects. */
  clear(): void {
    this.cancelTimer();
    this._dirty = false;
    this._lastSent = null;
    this._lastStructure = null;
    this.objectMap()?.setLocalAgents(null);
  }

  /** The payload of the local agents that have `broadcast` on. */
  buildPayload(): KritzelAwarenessAgent[] {
    const cursors = this._core.agenticCursorManager;
    const actions = this._core.agenticActionManager;
    const payload: KritzelAwarenessAgent[] = [];
    for (const agent of this._core.agentManager.getAll()) {
      const cursor = cursors.get(agent.id);
      if (!agent.broadcast || !cursor) {
        continue;
      }
      const status = cursor.status ? cursor.status.slice(0, AGENT_BROADCAST_MAX_STATUS_LENGTH) : null;
      payload.push({
        id: agent.id,
        name: agent.name,
        color: cursor.color,
        ...(agent.avatarUrl ? { avatarUrl: agent.avatarUrl } : {}),
        status,
        visible: cursor.visible,
        activeAction: cursor.activeAction,
        queueLength: cursor.queueLength,
        position: { x: round(cursor.position.x), y: round(cursor.position.y) },
        // Collaborators can't resolve an element inside an object (element positions are reported by the local
        // content only): a cursor on an element is shared by its position, which follows the element.
        attachedTo: cursor.attachedTo && cursor.attachedTo.selector === undefined ? cursor.attachedTo : null,
        isPressed: cursor.isPressed,
        pressCount: cursor.pressCount,
        selectedObjectIds: cursor.selectedObjectIds.slice(0, AGENT_BROADCAST_MAX_IDS),
        claimedObjectIds: actions.getClaimedObjectIds(agent.id).slice(0, AGENT_BROADCAST_MAX_IDS),
      });
    }
    return payload;
  }

  private schedule(): void {
    this._dirty = true;
    if (this._timer !== null) {
      return;
    }
    const wait = Math.max(0, this._lastSentAt + AGENT_BROADCAST_INTERVAL_MS - performance.now());
    if (wait === 0) {
      this.flush();
      return;
    }
    this._timer = setTimeout(() => {
      this._timer = null;
      if (this._dirty) {
        this.flush();
      }
    }, wait);
    (this._timer as { unref?: () => void }).unref?.();
  }

  private flush(): void {
    this.cancelTimer();
    this._dirty = false;
    const map = this.objectMap();
    if (!map?.hasAwareness) {
      return;
    }
    const payload = this.buildPayload();
    const serialized = JSON.stringify(payload);
    // Awareness sends every update, even an unchanged one: skip it here.
    if (serialized === this._lastSent) {
      return;
    }
    this._lastSent = serialized;
    this._lastStructure = structureOf(payload);
    this._lastSentAt = performance.now();
    map.setLocalAgents(payload);
  }

  private cancelTimer(): void {
    if (this._timer !== null) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  private objectMap() {
    try {
      return this._core.store.objects ?? null;
    } catch {
      return null;
    }
  }
}

/** The part of a payload that is sent without waiting for the throttle. */
function structureOf(payload: KritzelAwarenessAgent[]): string {
  return JSON.stringify(payload.map(agent => [agent.id, agent.name, agent.color, agent.avatarUrl ?? null, agent.visible]));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
