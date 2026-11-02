import { KritzelCore } from '../core/core.class';
import {
  KritzelAgenticCursor,
  KritzelAgenticCursorAnchor,
  KritzelAgenticCursorAttachment,
  KritzelAgenticCursorDetachedEvent,
  KritzelAgenticCursorElementTarget,
  KritzelAgenticCursorMoveOptions,
  KritzelAgenticCursorMoveResult,
  KritzelAgenticCursorObjectTarget,
  KritzelAgenticCursorOptions,
  KritzelAgenticCursorPatch,
  KritzelAgenticCursorTarget,
} from '../../interfaces/agentic-cursor.interface';
import { KritzelPoint } from '../../interfaces/point.interface';
import { KritzelElementAwareObject } from '../../interfaces/object-element.interface';
import { KritzelEasingHelper } from '../../helpers/easing.helper';
import { KritzelUserColorHelper } from '../../helpers/user-color.helper';
import { ObjectHelper } from '../../helpers/object.helper';

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

interface AgenticCursorTrackedElement {
  objectId: string;
  selector: string;
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
  /** The element whose position the cursor needs while moving to or attached to it. */
  trackedElement: AgenticCursorTrackedElement | null;
  /** Incremented by every move, so a move that waits for its element can tell it was superseded. */
  moveToken: number;
}

/**
 * Manages locally rendered, programmatically controlled ("agentic") cursors.
 *
 * Cursors are kept in world coordinates. While at least one cursor exists, a
 * `requestAnimationFrame` loop advances animations and keeps attached cursors on
 * their object anchors. Object geometry is polled every frame because local
 * drags, resizes and rotations don't emit per-frame events.
 *
 * Element targets point at an element inside an object's content. The object
 * tracks the element and reports its position asynchronously, so a cursor reads
 * the last reported position every frame.
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
    let trackedElement: AgenticCursorTrackedElement | null = null;
    if (options.position) {
      if (this.isElementTarget(options.position)) {
        // Tracked before resolving, so an element the object already knows is used right away. Until the
        // content reports the element, the cursor sits at the center of the object.
        this.validateElementTarget(options.position).trackElement(options.position.selector);
        trackedElement = { objectId: options.position.objectId, selector: options.position.selector };
      }
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
      trackedElement,
      moveToken: 0,
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
   * Animates a cursor to a world point, an object anchor or an element inside an object.
   * Resolves when the animation ends. An interrupted move resolves with `completed: false`.
   * A move to an element first asks the object where the element is, and rejects if the
   * object isn't mounted or has no element that matches the selector.
   */
  move(id: string, target: KritzelAgenticCursorTarget, options: KritzelAgenticCursorMoveOptions = {}): Promise<KritzelAgenticCursorMoveResult> {
    const entry = this.getEntryOrThrow(id);
    if (this.isElementTarget(target)) {
      return this.moveToElement(entry, target, options);
    }

    const destination = this.resolveTargetOrThrow(target);
    entry.moveToken++;
    this.finishAnimation(entry, false);
    entry.attachedTo = null;
    this.setTrackedElement(entry, null);
    return this.startAnimation(entry, target, destination, options);
  }

  /** Detaches a cursor from its object. The cursor stays at its current position. */
  detach(id: string): void {
    const entry = this.getEntryOrThrow(id);
    if (!entry.attachedTo) return;
    const objectId = entry.attachedTo.objectId;
    entry.attachedTo = null;
    this.setTrackedElement(entry, null);
    this.emitChange();
    this.emitDetached({ id, objectId, reason: 'manual' });
  }

  /** Removes a cursor. A running move resolves with `completed: false`. */
  remove(id: string): boolean {
    const entry = this._cursors.get(id);
    if (!entry) return false;
    this.finishAnimation(entry, false);
    this.setTrackedElement(entry, null);
    this._cursors.delete(id);
    this.emitChange();
    if (this._cursors.size === 0) this.stopLoop();
    return true;
  }

  /** Removes all cursors. */
  clear(): void {
    if (this._cursors.size === 0) return;
    this._cursors.forEach(entry => {
      this.finishAnimation(entry, false);
      this.setTrackedElement(entry, null);
    });
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
          entry.trackedElement = null;
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
          } else {
            this.setTrackedElement(entry, null);
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
          entry.trackedElement = null;
          structuralChange = true;
          this.emitDetached({ id: entry.id, objectId, reason: 'object-removed' });
        }
      }
    });

    if (structuralChange) this.emitChange();
    this._frameListeners.forEach(listener => listener());
  }

  /**
   * Resolves a target to a world point, or `null` if the target object doesn't exist.
   * An element target resolves to the element's last reported position, or to the
   * center of its object while the element hasn't been reported yet.
   */
  resolveTarget(target: KritzelAgenticCursorTarget): KritzelPoint | null {
    if (!this.isObjectTarget(target)) {
      return { x: target.x, y: target.y };
    }

    const object = this._core.store.objects?.findById(target.objectId);
    if (!object) return null;

    const box = object.boundingBox;
    const [ax, ay] = ANCHOR_FACTORS[target.anchor ?? 'center'] ?? ANCHOR_FACTORS.center;
    let localX = box.x + ax * box.width + (target.offset?.x ?? 0);
    let localY = box.y + ay * box.height + (target.offset?.y ?? 0);

    if (this.isElementTarget(target)) {
      const elementAware = ObjectHelper.isKritzelElementAwareObject(object) ? object : null;
      const rect = elementAware?.getTrackedElementRect(target.selector) ?? null;
      if (elementAware && rect) {
        const local = elementAware.contentToObjectLocal({ x: rect.x + ax * rect.width, y: rect.y + ay * rect.height });
        localX = box.x + local.x + (target.offset?.x ?? 0);
        localY = box.y + local.y + (target.offset?.y ?? 0);
      } else {
        localX = box.x + box.width / 2 + (target.offset?.x ?? 0);
        localY = box.y + box.height / 2 + (target.offset?.y ?? 0);
      }
    }

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

  private moveToElement(
    entry: AgenticCursorEntry,
    target: KritzelAgenticCursorElementTarget,
    options: KritzelAgenticCursorMoveOptions,
  ): Promise<KritzelAgenticCursorMoveResult> {
    const object = this.validateElementTarget(target);
    // Tracking starts before the lookup, so the object keeps the element's position from the lookup's answer.
    this.setTrackedElement(entry, { objectId: target.objectId, selector: target.selector });
    const token = ++entry.moveToken;
    this.finishAnimation(entry, false);
    entry.attachedTo = null;
    this.emitChange();

    const isCurrent = () => entry.moveToken === token && this._cursors.get(entry.id) === entry;
    return object.queryElements(target.selector, 1).then(
      elements => {
        if (!isCurrent()) {
          return { completed: false };
        }
        if (elements.length === 0) {
          this.setTrackedElement(entry, null);
          this.emitChange();
          throw new Error(`Element "${target.selector}" not found in object "${target.objectId}".`);
        }
        const destination = this.resolveTarget(target) ?? entry.position;
        return this.startAnimation(entry, target, destination, options);
      },
      error => {
        if (isCurrent()) {
          this.setTrackedElement(entry, null);
          this.emitChange();
        }
        throw error;
      },
    );
  }

  private startAnimation(
    entry: AgenticCursorEntry,
    target: KritzelAgenticCursorTarget,
    destination: KritzelPoint,
    options: KritzelAgenticCursorMoveOptions,
  ): Promise<KritzelAgenticCursorMoveResult> {
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

  /** Throws unless the target names an existing object that supports elements and a non-empty selector. */
  private validateElementTarget(target: KritzelAgenticCursorElementTarget): KritzelElementAwareObject {
    if (typeof target.selector !== 'string' || target.selector.trim() === '') {
      throw new Error('Invalid agentic cursor target. An element target needs a non-empty selector.');
    }
    const object = this._core.store.objects?.findById(target.objectId);
    if (!object) {
      throw new Error(`Object "${target.objectId}" not found.`);
    }
    if (!ObjectHelper.isKritzelElementAwareObject(object)) {
      throw new Error(`Object "${target.objectId}" has no elements a cursor can point at.`);
    }
    return object;
  }

  /** Switches the element a cursor tracks. The new element is tracked before the old one is released. */
  private setTrackedElement(entry: AgenticCursorEntry, next: AgenticCursorTrackedElement | null): void {
    const previous = entry.trackedElement;
    if (previous && next && previous.objectId === next.objectId && previous.selector === next.selector) {
      return;
    }
    if (next) {
      const object = this._core.store.objects?.findById(next.objectId);
      if (ObjectHelper.isKritzelElementAwareObject(object)) {
        object.trackElement(next.selector);
      }
    }
    if (previous) {
      const object = this._core.store.objects?.findById(previous.objectId);
      if (ObjectHelper.isKritzelElementAwareObject(object)) {
        object.untrackElement(previous.selector);
      }
    }
    entry.trackedElement = next;
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

  private isObjectTarget(target: KritzelAgenticCursorTarget): target is KritzelAgenticCursorObjectTarget | KritzelAgenticCursorElementTarget {
    return typeof (target as KritzelAgenticCursorObjectTarget).objectId === 'string';
  }

  private isElementTarget(target: KritzelAgenticCursorTarget): target is KritzelAgenticCursorElementTarget {
    return this.isObjectTarget(target) && typeof (target as KritzelAgenticCursorElementTarget).selector === 'string';
  }

  private toAttachment(target: KritzelAgenticCursorObjectTarget | KritzelAgenticCursorElementTarget): KritzelAgenticCursorAttachment {
    const attachment: KritzelAgenticCursorAttachment = {
      objectId: target.objectId,
      anchor: target.anchor ?? 'center',
      offset: { x: target.offset?.x ?? 0, y: target.offset?.y ?? 0 },
    };
    if (this.isElementTarget(target)) {
      attachment.selector = target.selector;
    }
    return attachment;
  }

  private resolveTargetOrThrow(target: KritzelAgenticCursorTarget): KritzelPoint {
    if (!target || (!this.isObjectTarget(target) && (typeof target.x !== 'number' || typeof target.y !== 'number'))) {
      throw new Error('Invalid agentic cursor target. Expected { x, y }, { objectId } or { objectId, selector }.');
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
