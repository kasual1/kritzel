import { KritzelCore } from '../core/core.class';
import {
  KritzelAgenticCursor,
  KritzelAgenticCursorAnchor,
  KritzelAgenticCursorAttachment,
  KritzelAgenticCursorDetachedEvent,
  KritzelAgenticCursorMoveOptions,
  KritzelAgenticCursorMoveResult,
  KritzelAgenticCursorObjectTarget,
  KritzelAgenticCursorOptions,
  KritzelAgenticCursorPatch,
  KritzelAgenticCursorTarget,
} from '../../interfaces/agentic-cursor.interface';
import { KritzelPoint } from '../../interfaces/point.interface';
import { KritzelEasingHelper } from '../../helpers/easing.helper';
import { KritzelUserColorHelper } from '../../helpers/user-color.helper';

export const AGENTIC_CURSOR_DEFAULT_SPEED = 1200;
export const AGENTIC_CURSOR_MIN_DURATION = 250;
export const AGENTIC_CURSOR_MAX_DURATION = 1200;
const DEFAULT_COLOR = '#6B7280';

const ANCHOR_FACTORS: Record<KritzelAgenticCursorAnchor, [number, number]> = {
  'center': [0.5, 0.5],
  'top-left': [0, 0],
  'top': [0.5, 0],
  'top-right': [1, 0],
  'right': [1, 0.5],
  'bottom-right': [1, 1],
  'bottom': [0.5, 1],
  'bottom-left': [0, 1],
  'left': [0, 0.5],
};

interface AgenticCursorAnimation {
  from: KritzelPoint;
  target: KritzelAgenticCursorTarget;
  startTime: number;
  duration: number;
  easing: (t: number) => number;
  attach: boolean;
  resolve: (result: KritzelAgenticCursorMoveResult) => void;
}

interface AgenticCursorEntry {
  id: string;
  name?: string;
  color: string;
  status?: string;
  visible: boolean;
  position: KritzelPoint;
  attachedTo: KritzelAgenticCursorAttachment | null;
  animation: AgenticCursorAnimation | null;
}

/**
 * Manages locally rendered, programmatically controlled ("agentic") cursors.
 *
 * Cursors are kept in world coordinates. While at least one cursor exists, a
 * `requestAnimationFrame` loop advances animations and keeps attached cursors on
 * their object anchors. Object geometry is polled every frame because local
 * drags, resizes and rotations don't emit per-frame events.
 */
export class KritzelAgenticCursorManager {
  private readonly _core: KritzelCore;
  private readonly _cursors = new Map<string, AgenticCursorEntry>();
  private readonly _changeListeners = new Set<() => void>();
  private readonly _frameListeners = new Set<() => void>();
  private readonly _detachedListeners = new Set<(event: KritzelAgenticCursorDetachedEvent) => void>();
  private _rafId: number | null = null;
  private _idCounter = 0;

  constructor(core: KritzelCore) {
    this._core = core;
  }

  get count(): number {
    return this._cursors.size;
  }

  /** Creates a new agentic cursor. Throws if a cursor with the same ID exists. */
  add(options: KritzelAgenticCursorOptions = {}): KritzelAgenticCursor {
    const id = options.id ?? this.generateId();
    if (this._cursors.has(id)) {
      throw new Error(`Agentic cursor "${id}" already exists.`);
    }

    let position = this.getViewportCenter();
    let attachedTo: KritzelAgenticCursorAttachment | null = null;
    if (options.position) {
      position = this.resolveTargetOrThrow(options.position);
      if (this.isObjectTarget(options.position)) {
        attachedTo = this.toAttachment(options.position);
      }
    }

    const entry: AgenticCursorEntry = {
      id,
      name: options.name,
      color: options.color || (options.name ? KritzelUserColorHelper.generateColorFromName(options.name) : DEFAULT_COLOR),
      status: options.status || undefined,
      visible: options.visible ?? true,
      position,
      attachedTo,
      animation: null,
    };

    this._cursors.set(id, entry);
    this.emitChange();
    this.ensureLoop();
    return this.toSnapshot(entry);
  }

  /** Updates name, color, status or visibility of a cursor. */
  update(id: string, patch: KritzelAgenticCursorPatch): KritzelAgenticCursor {
    const entry = this.getEntryOrThrow(id);
    if (patch.name !== undefined) entry.name = patch.name;
    if (patch.color !== undefined) entry.color = patch.color;
    if (patch.status !== undefined) entry.status = patch.status || undefined;
    if (patch.visible !== undefined) entry.visible = patch.visible;
    this.emitChange();
    return this.toSnapshot(entry);
  }

  /**
   * Animates a cursor to a world point or an object anchor.
   * Resolves when the animation ends. An interrupted move resolves with `completed: false`.
   */
  move(id: string, target: KritzelAgenticCursorTarget, options: KritzelAgenticCursorMoveOptions = {}): Promise<KritzelAgenticCursorMoveResult> {
    const entry = this.getEntryOrThrow(id);
    const destination = this.resolveTargetOrThrow(target);

    this.finishAnimation(entry, false);
    entry.attachedTo = null;

    const duration = options.duration ?? this.computeDuration(entry.position, destination, options.speed);

    return new Promise<KritzelAgenticCursorMoveResult>(resolve => {
      entry.animation = {
        from: { ...entry.position },
        target,
        startTime: this.now(),
        duration: Math.max(0, duration),
        easing: KritzelEasingHelper.resolve(options.easing),
        attach: options.attach ?? true,
        resolve,
      };
      this.emitChange();
      this.ensureLoop();
    });
  }

  /** Detaches a cursor from its object. The cursor stays at its current position. */
  detach(id: string): void {
    const entry = this.getEntryOrThrow(id);
    if (!entry.attachedTo) return;
    const objectId = entry.attachedTo.objectId;
    entry.attachedTo = null;
    this.emitChange();
    this.emitDetached({ id, objectId, reason: 'manual' });
  }

  /** Removes a cursor. A running move resolves with `completed: false`. */
  remove(id: string): boolean {
    const entry = this._cursors.get(id);
    if (!entry) return false;
    this.finishAnimation(entry, false);
    this._cursors.delete(id);
    this.emitChange();
    if (this._cursors.size === 0) this.stopLoop();
    return true;
  }

  /** Removes all cursors. */
  clear(): void {
    if (this._cursors.size === 0) return;
    this._cursors.forEach(entry => this.finishAnimation(entry, false));
    this._cursors.clear();
    this.emitChange();
    this.stopLoop();
  }

  get(id: string): KritzelAgenticCursor | null {
    const entry = this._cursors.get(id);
    return entry ? this.toSnapshot(entry) : null;
  }

  getAll(): KritzelAgenticCursor[] {
    return Array.from(this._cursors.values()).map(entry => this.toSnapshot(entry));
  }

  /** Subscribes to structural changes (added, removed, restyled, attached or detached cursors). */
  onChange(listener: () => void): () => void {
    this._changeListeners.add(listener);
    return () => this._changeListeners.delete(listener);
  }

  /** Subscribes to animation frames. Called after positions were updated. */
  onFrame(listener: () => void): () => void {
    this._frameListeners.add(listener);
    return () => this._frameListeners.delete(listener);
  }

  /** Subscribes to detach events. */
  onDetached(listener: (event: KritzelAgenticCursorDetachedEvent) => void): () => void {
    this._detachedListeners.add(listener);
    return () => this._detachedListeners.delete(listener);
  }

  /**
   * Advances animations and attachments to the given timestamp.
   * Called by the internal animation loop; public for testing.
   */
  tick(now: number = this.now()): void {
    let structuralChange = false;

    this._cursors.forEach(entry => {
      if (entry.animation) {
        const animation = entry.animation;
        const destination = this.resolveTarget(animation.target);

        if (!destination) {
          // Target object disappeared mid-flight: stay where we are.
          entry.animation = null;
          animation.resolve({ completed: false });
          structuralChange = true;
          this.emitDetached({ id: entry.id, objectId: (animation.target as KritzelAgenticCursorObjectTarget).objectId, reason: 'object-removed' });
          return;
        }

        const progress = animation.duration <= 0 ? 1 : Math.min(1, Math.max(0, (now - animation.startTime) / animation.duration));
        const eased = animation.easing(progress);
        entry.position = {
          x: animation.from.x + (destination.x - animation.from.x) * eased,
          y: animation.from.y + (destination.y - animation.from.y) * eased,
        };

        if (progress >= 1) {
          entry.position = destination;
          entry.animation = null;
          if (animation.attach && this.isObjectTarget(animation.target)) {
            entry.attachedTo = this.toAttachment(animation.target);
          }
          animation.resolve({ completed: true });
          structuralChange = true;
        }
        return;
      }

      if (entry.attachedTo) {
        const anchored = this.resolveTarget(entry.attachedTo);
        if (anchored) {
          entry.position = anchored;
        } else {
          const objectId = entry.attachedTo.objectId;
          entry.attachedTo = null;
          structuralChange = true;
          this.emitDetached({ id: entry.id, objectId, reason: 'object-removed' });
        }
      }
    });

    if (structuralChange) this.emitChange();
    this._frameListeners.forEach(listener => listener());
  }

  /** Resolves a target to a world point, or `null` if the target object doesn't exist. */
  resolveTarget(target: KritzelAgenticCursorTarget): KritzelPoint | null {
    if (!this.isObjectTarget(target)) {
      return { x: target.x, y: target.y };
    }

    const object = this._core.store.objects?.findById(target.objectId);
    if (!object) return null;

    const box = object.boundingBox;
    const [ax, ay] = ANCHOR_FACTORS[target.anchor ?? 'center'] ?? ANCHOR_FACTORS.center;
    const localX = box.x + ax * box.width + (target.offset?.x ?? 0);
    const localY = box.y + ay * box.height + (target.offset?.y ?? 0);

    const rotation = object.rotation ?? 0;
    if (!rotation) {
      return { x: localX, y: localY };
    }

    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    return {
      x: cos * (localX - cx) - sin * (localY - cy) + cx,
      y: sin * (localX - cx) + cos * (localY - cy) + cy,
    };
  }

  /** Stops the animation loop and resolves pending moves. Cursors are kept. */
  cleanup(): void {
    this._cursors.forEach(entry => this.finishAnimation(entry, false));
    this.stopLoop();
  }

  private computeDuration(from: KritzelPoint, to: KritzelPoint, speed: number = AGENTIC_CURSOR_DEFAULT_SPEED): number {
    const scale = this._core.store.state.scale || 1;
    const screenDistance = Math.hypot(to.x - from.x, to.y - from.y) * scale;
    const effectiveSpeed = speed > 0 ? speed : AGENTIC_CURSOR_DEFAULT_SPEED;
    const duration = (screenDistance / effectiveSpeed) * 1000;
    return Math.min(AGENTIC_CURSOR_MAX_DURATION, Math.max(AGENTIC_CURSOR_MIN_DURATION, duration));
  }

  private finishAnimation(entry: AgenticCursorEntry, completed: boolean): void {
    if (!entry.animation) return;
    const { resolve } = entry.animation;
    entry.animation = null;
    resolve({ completed });
  }

  private getViewportCenter(): KritzelPoint {
    const { translateX, translateY, scale, viewportWidth, viewportHeight } = this._core.store.state;
    const s = scale || 1;
    return {
      x: ((viewportWidth || 0) / 2 - (translateX || 0)) / s,
      y: ((viewportHeight || 0) / 2 - (translateY || 0)) / s,
    };
  }

  private isObjectTarget(target: KritzelAgenticCursorTarget): target is KritzelAgenticCursorObjectTarget {
    return typeof (target as KritzelAgenticCursorObjectTarget).objectId === 'string';
  }

  private toAttachment(target: KritzelAgenticCursorObjectTarget): KritzelAgenticCursorAttachment {
    return {
      objectId: target.objectId,
      anchor: target.anchor ?? 'center',
      offset: { x: target.offset?.x ?? 0, y: target.offset?.y ?? 0 },
    };
  }

  private resolveTargetOrThrow(target: KritzelAgenticCursorTarget): KritzelPoint {
    if (!target || (!this.isObjectTarget(target) && (typeof target.x !== 'number' || typeof target.y !== 'number'))) {
      throw new Error('Invalid agentic cursor target. Expected { x, y } or { objectId }.');
    }
    const point = this.resolveTarget(target);
    if (!point) {
      throw new Error(`Object "${(target as KritzelAgenticCursorObjectTarget).objectId}" not found.`);
    }
    return point;
  }

  private getEntryOrThrow(id: string): AgenticCursorEntry {
    const entry = this._cursors.get(id);
    if (!entry) {
      throw new Error(`Agentic cursor "${id}" not found.`);
    }
    return entry;
  }

  private toSnapshot(entry: AgenticCursorEntry): KritzelAgenticCursor {
    return {
      id: entry.id,
      name: entry.name,
      color: entry.color,
      status: entry.status,
      visible: entry.visible,
      position: { ...entry.position },
      attachedTo: entry.attachedTo ? { ...entry.attachedTo, offset: { ...entry.attachedTo.offset } } : null,
      isMoving: entry.animation !== null,
    };
  }

  private generateId(): string {
    let id: string;
    do {
      id = `agentic-cursor-${++this._idCounter}`;
    } while (this._cursors.has(id));
    return id;
  }

  private emitChange(): void {
    this._changeListeners.forEach(listener => listener());
  }

  private emitDetached(event: KritzelAgenticCursorDetachedEvent): void {
    this._detachedListeners.forEach(listener => listener(event));
  }

  private now(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }

  private ensureLoop(): void {
    if (this._rafId !== null || this._cursors.size === 0 || typeof requestAnimationFrame !== 'function') return;
    const loop = (time: number) => {
      this._rafId = null;
      this.tick(time);
      if (this._cursors.size > 0) {
        this._rafId = requestAnimationFrame(loop);
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
}
