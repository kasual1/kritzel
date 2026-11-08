import { KritzelCore } from '../core/core.class';
import {
  KritzelAgenticCursor,
  KritzelAgenticAttachment,
  KritzelAgenticCursorDetachedEvent,
  KritzelAgenticElementTarget,
  KritzelAgenticMoveOptions,
  KritzelAgenticMoveResult,
  KritzelAgenticObjectTarget,
  KritzelAgenticCursorOptions,
  KritzelAgenticCursorAppearance,
  KritzelAgenticRotationHandle,
  KritzelAgenticTarget,
} from '../../interfaces/agentic-cursor.interface';
import type { KritzelAgenticActionType } from '../../interfaces/agentic-action.interface';
import type { KritzelBaseObject } from '../objects/base-object.class';
import { KRITZEL_ROTATION_HANDLE_DISTANCE } from '../../constants/engine.constants';
import { KritzelPoint } from '../../interfaces/point.interface';
import { KritzelElementAwareObject } from '../../interfaces/object-element.interface';
import { KritzelEasingHelper } from '../../helpers/easing.helper';
import { ObjectHelper } from '../../helpers/object.helper';
import { AGENTIC_ANCHOR_FACTORS, isAgenticAnchor, isElementTarget, isObjectTarget, KritzelAnchorableGeometry, resolveObjectAnchor } from '../../helpers/agentic-geometry.helper';
import { KritzelEventHelper } from '../../helpers/event.helper';

export const AGENTIC_CURSOR_DEFAULT_SPEED = 1200;
export const AGENTIC_CURSOR_MIN_DURATION = 250;
export const AGENTIC_CURSOR_MAX_DURATION = 1200;

interface AgenticCursorAnimation {
  from: KritzelPoint;
  target: KritzelAgenticTarget;
  startTime: number;
  duration: number;
  easing: (t: number) => number;
  attach: boolean;
  /** Whether the host started the move (`move()`), not an agentic action (`fly()`). */
  host: boolean;
  resolve: (result: KritzelAgenticMoveResult) => void;
}

interface AgenticCursorTrackedElement {
  objectId: string;
  selector: string;
}

interface AgenticCursorEntry {
  id: string;
  appearance: KritzelAgenticCursorAppearance;
  position: KritzelPoint;
  attachedTo: KritzelAgenticAttachment | null;
  animation: AgenticCursorAnimation | null;
  isPressed: boolean;
  pressCount: number;
  selectedObjectIds: string[];
  activeAction: KritzelAgenticActionType | null;
  queueLength: number;
  /** Incremented by every public `move()`, so a running action can tell that the host took over. */
  hostMoveGeneration: number;
  /** The element whose position the cursor needs while moving to or attached to it. */
  trackedElement: AgenticCursorTrackedElement | null;
  /** Incremented whenever pending host moves are superseded, so a move that waits for its element can tell. */
  moveToken: number;
  /** Settles the pending element lookup of a move with `completed: false`. */
  cancelLookup: (() => void) | null;
}

/** Undo availability of a cursor's own history; provided by the agentic action manager. */
export type KritzelAgenticCursorHistoryProvider = (cursorId: string) => { canUndo: boolean; canRedo: boolean };

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
  private readonly _changeListeners = new Set<(id?: string) => void>();
  private readonly _frameListeners = new Set<() => void>();
  private readonly _beforeFrameListeners = new Set<(now: number) => void>();
  private readonly _removedListeners = new Set<(id: string) => void>();
  private readonly _detachedListeners = new Set<(event: KritzelAgenticCursorDetachedEvent) => void>();
  private _historyProvider: KritzelAgenticCursorHistoryProvider | null = null;
  private _rafId: number | null = null;

  constructor(core: KritzelCore) {
    this._core = core;
  }

  /** Creates the cursor of an agent. Throws if a cursor with the same ID exists. */
  add(options: KritzelAgenticCursorOptions): KritzelAgenticCursor {
    const id = options.id;
    if (this._cursors.has(id)) {
      throw new Error(`Agentic cursor "${id}" already exists.`);
    }

    let position = this.getViewportCenter();
    let attachedTo: KritzelAgenticAttachment | null = null;
    let trackedElement: AgenticCursorTrackedElement | null = null;
    if (options.position) {
      if (isElementTarget(options.position)) {
        // Tracked before resolving, so an element the object already knows is used right away. Until the
        // content reports the element, the cursor sits at the center of the object.
        this.validateElementTarget(options.position).trackElement(options.position.selector);
        trackedElement = { objectId: options.position.objectId, selector: options.position.selector };
      }
      try {
        position = this.resolveTargetOrThrow(options.position);
      } catch (error) {
        if (trackedElement) this.untrack(trackedElement);
        throw error;
      }
      if (isObjectTarget(options.position)) {
        attachedTo = this.toAttachment(options.position);
      }
    }

    const entry: AgenticCursorEntry = {
      id,
      appearance: options.appearance,
      position,
      attachedTo,
      animation: null,
      isPressed: false,
      pressCount: 0,
      selectedObjectIds: [],
      activeAction: null,
      queueLength: 0,
      hostMoveGeneration: 0,
      trackedElement,
      moveToken: 0,
      cancelLookup: null,
    };

    this._cursors.set(id, entry);
    this.emitChange(id);
    this.ensureLoop();
    return this.toSnapshot(entry);
  }

  /**
   * Animates a cursor to a world point, an object anchor or an element inside an object.
   * Resolves when the animation ends. An interrupted move resolves with `completed: false`.
   * A move also interrupts an agentic action running on this cursor, a move to an element as soon as it is called.
   * A move to an element first asks the object where the element is, and rejects if the object isn't mounted or
   * has no visible element that matches the selector. Until the element is found, the cursor keeps its current
   * attachment and host move (the flight of an interrupted action stops right away).
   */
  move(id: string, target: KritzelAgenticTarget, options: KritzelAgenticMoveOptions = {}): Promise<KritzelAgenticMoveResult> {
    const entry = this.getEntryOrThrow(id);
    if (isElementTarget(target)) {
      return this.moveToElement(entry, target, options);
    }

    const destination = this.resolveTargetOrThrow(target);
    this.supersede(entry);
    entry.hostMoveGeneration++;
    return this.startMove(entry, target, destination, options, true);
  }

  /**
   * Animates a cursor like `move()`, on behalf of an agentic action. Unlike `move()`, it does
   * not count as a host move, so the action does not interrupt itself. A host move to an element that
   * is still looking up its element keeps going and takes over once the element is found.
   * Element targets are not supported.
   * @internal
   */
  fly(id: string, target: KritzelAgenticTarget, options: KritzelAgenticMoveOptions = {}): Promise<KritzelAgenticMoveResult> {
    const entry = this.getEntryOrThrow(id);
    if (isElementTarget(target)) {
      throw new Error('Invalid agentic cursor target. Actions cannot target elements inside objects.');
    }
    const destination = this.resolveTargetOrThrow(target);
    return this.startMove(entry, target, destination, options, false);
  }

  /** Number of host `move()` calls for a cursor so far. @internal */
  getHostMoveGeneration(id: string): number {
    return this._cursors.get(id)?.hostMoveGeneration ?? 0;
  }

  /**
   * Stops a running animation; its promise resolves with `completed: false`. A host move that is still looking up
   * its element resolves with `completed: false` too. @internal
   */
  stopAnimation(id: string): void {
    const entry = this._cursors.get(id);
    if (!entry) return;
    this.supersede(entry);
    if (!entry.animation) return;
    this.finishAnimation(entry, false);
    this.releaseUnattachedElement(entry);
    this.emitChange(id);
  }

  /** Places a cursor at a world point immediately, cancelling any animation and attachment. @internal */
  setPosition(id: string, point: KritzelPoint): void {
    const entry = this._cursors.get(id);
    if (!entry || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
    const wasAnimating = entry.animation !== null;
    this.finishAnimation(entry, false);
    entry.position = { x: point.x, y: point.y };
    entry.attachedTo = null;
    this.setTrackedElement(entry, null);
    if (wasAnimating) this.emitChange(id);
    this.ensureLoop();
  }

  /** Attaches a cursor to an object anchor and moves it there immediately. @internal */
  attach(id: string, target: KritzelAgenticObjectTarget): void {
    const entry = this._cursors.get(id);
    if (!entry) return;
    const point = this.resolveTarget(target);
    if (!point) return;
    this.finishAnimation(entry, false);
    this.setTrackedElement(entry, this.toTrackedElement(target));
    entry.position = point;
    entry.attachedTo = this.toAttachment(target);
    this.emitChange(id);
  }

  /** Sets the pressed state; every press increments `pressCount`. @internal */
  setPressed(id: string, pressed: boolean): void {
    const entry = this._cursors.get(id);
    if (!entry || entry.isPressed === pressed) return;
    entry.isPressed = pressed;
    if (pressed) entry.pressCount++;
    this.emitChange(id);
  }

  /** Sets the objects the cursor shows as selected. @internal */
  setSelectedObjectIds(id: string, objectIds: string[]): void {
    const entry = this._cursors.get(id);
    if (!entry) return;
    if (entry.selectedObjectIds.length === objectIds.length && entry.selectedObjectIds.every((value, i) => value === objectIds[i])) {
      return;
    }
    entry.selectedObjectIds = [...objectIds];
    this.emitChange(id);
  }

  /** Sets the running action type and queue length. @internal */
  setActivity(id: string, activeAction: KritzelAgenticActionType | null, queueLength: number): void {
    const entry = this._cursors.get(id);
    if (!entry || (entry.activeAction === activeAction && entry.queueLength === queueLength)) return;
    entry.activeAction = activeAction;
    entry.queueLength = queueLength;
    this.emitChange(id);
  }

  /** Sets the provider of `canUndo` / `canRedo` for snapshots. @internal */
  setHistoryProvider(provider: KritzelAgenticCursorHistoryProvider | null): void {
    this._historyProvider = provider;
  }

  /** Detaches a cursor from its object. The cursor stays at its current position. */
  detach(id: string): void {
    const entry = this.getEntryOrThrow(id);
    if (!entry.attachedTo) return;
    const objectId = entry.attachedTo.objectId;
    entry.attachedTo = null;
    this.setTrackedElement(entry, null);
    this.emitChange(id);
    this.emitDetached({ id, objectId, reason: 'manual' });
  }

  /** Removes a cursor. A running move resolves with `completed: false`. */
  remove(id: string): boolean {
    const entry = this._cursors.get(id);
    if (!entry) return false;
    this.supersede(entry);
    this.finishAnimation(entry, false);
    this.setTrackedElement(entry, null);
    this._cursors.delete(id);
    this.emitChange(id);
    if (this._cursors.size === 0) this.stopLoop();
    this.emitRemoved(id);
    return true;
  }

  get(id: string): KritzelAgenticCursor | null {
    const entry = this._cursors.get(id);
    return entry ? this.toSnapshot(entry) : null;
  }

  getAll(): KritzelAgenticCursor[] {
    return Array.from(this._cursors.values()).map(entry => this.toSnapshot(entry));
  }

  /**
   * Subscribes to structural changes (added, removed, restyled, attached or detached cursors).
   * The listener receives the ID of the changed cursor, or nothing when several may have changed.
   */
  onChange(listener: (id?: string) => void): () => void {
    this._changeListeners.add(listener);
    return () => this._changeListeners.delete(listener);
  }

  /** Subscribes to animation frames. Called after positions were updated. */
  onFrame(listener: () => void): () => void {
    this._frameListeners.add(listener);
    return () => this._frameListeners.delete(listener);
  }

  /** Subscribes to the start of each frame, before animations and attachments are advanced. @internal */
  onBeforeFrame(listener: (now: number) => void): () => void {
    this._beforeFrameListeners.add(listener);
    return () => this._beforeFrameListeners.delete(listener);
  }

  /** Subscribes to cursor removal (`remove()` and `clear()`). @internal */
  onRemoved(listener: (id: string) => void): () => void {
    this._removedListeners.add(listener);
    return () => this._removedListeners.delete(listener);
  }

  /** Subscribes to detach events. */
  onDetached(listener: (event: KritzelAgenticCursorDetachedEvent) => void): () => void {
    this._detachedListeners.add(listener);
    return () => this._detachedListeners.delete(listener);
  }

  /** Makes sure the frame loop runs while cursors exist. @internal */
  requestFrames(): void {
    this.ensureLoop();
  }

  /**
   * Advances animations and attachments to the given timestamp.
   * Called by the internal animation loop; public for testing.
   */
  tick(now: number = performance.now()): void {
    this._beforeFrameListeners.forEach(listener => KritzelEventHelper.callListener(() => listener(now), 'Agentic cursor listener'));

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
          this.emitDetached({ id: entry.id, objectId: (animation.target as KritzelAgenticObjectTarget).objectId, reason: 'object-removed' });
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
          if (animation.attach && isObjectTarget(animation.target)) {
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
    this._frameListeners.forEach(listener => KritzelEventHelper.callListener(listener, 'Agentic cursor listener'));
  }

  /**
   * Resolves a target to a world point, or `null` if the target object doesn't exist.
   * An element target resolves to the element's last reported position, or to the
   * center of its object while the element hasn't been reported yet.
   */
  resolveTarget(target: KritzelAgenticTarget): KritzelPoint | null {
    if (!isObjectTarget(target)) {
      return { x: target.x, y: target.y };
    }

    const object = this._core.store.objects?.findById(target.objectId);
    if (!object) return null;

    if (isElementTarget(target)) {
      return this.resolveElementTarget(object, target);
    }
    return resolveObjectAnchor(object, target.anchor ?? 'center', target.offset);
  }

  /**
   * Target on the rotation handle of an object, where agents grab it. Like the engine's handle, it sits a
   * fixed screen distance above the middle of the top edge (above a shown titlebar) and turns with the object.
   */
  getRotationHandleTarget(objectId: string): KritzelAgenticObjectTarget {
    const object = this._core.store.objects?.findById(objectId);
    return { objectId, anchor: 'top', offset: { x: 0, y: -this.getRotationHandleDistance(object) } };
  }

  /** World points of an object's rotation handle as agents show it, or `null` if the object doesn't exist. */
  getRotationHandle(objectId: string): KritzelAgenticRotationHandle | null {
    const object = this._core.store.objects?.findById(objectId);
    if (!object) return null;
    return {
      base: resolveObjectAnchor(object, 'top'),
      handle: resolveObjectAnchor(object, 'top', { x: 0, y: -this.getRotationHandleDistance(object) }),
    };
  }

  /** World distance of the rotation handle above the top edge, for the current zoom. */
  private getRotationHandleDistance(object: KritzelBaseObject<any> | null | undefined): number {
    const distance = object ? this._core.objectTitlebarManager.getRotationHandleDistance(object) : KRITZEL_ROTATION_HANDLE_DISTANCE;
    return distance / (this._core.store.state.scale || 1);
  }

  /**
   * Notifies the change listeners about one cursor, e.g. after its agent changed how it looks, or about all
   * cursors, e.g. after a workspace switch dropped the agents' histories, so that `canUndo` and `canRedo` are
   * read again. @internal
   */
  refresh(id?: string): void {
    this.emitChange(id);
  }

  /** Stops the animation loop and resolves pending moves. Cursors are kept. */
  cleanup(): void {
    this._cursors.forEach(entry => {
      this.supersede(entry);
      this.finishAnimation(entry, false);
      this.releaseUnattachedElement(entry);
    });
    this.stopLoop();
  }

  private startMove(
    entry: AgenticCursorEntry,
    target: KritzelAgenticTarget,
    destination: KritzelPoint,
    options: KritzelAgenticMoveOptions,
    host: boolean,
  ): Promise<KritzelAgenticMoveResult> {
    this.finishAnimation(entry, false);
    entry.attachedTo = null;
    this.setTrackedElement(entry, null);
    return this.startAnimation(entry, target, destination, options, host);
  }

  private startAnimation(
    entry: AgenticCursorEntry,
    target: KritzelAgenticTarget,
    destination: KritzelPoint,
    options: KritzelAgenticMoveOptions,
    host: boolean,
  ): Promise<KritzelAgenticMoveResult> {
    const duration = options.duration ?? this.computeDuration(entry.position, destination, options.speed);

    return new Promise<KritzelAgenticMoveResult>(resolve => {
      entry.animation = {
        from: { ...entry.position },
        target,
        startTime: performance.now(),
        duration: Math.max(0, duration),
        easing: KritzelEasingHelper.resolve(options.easing),
        attach: options.attach ?? true,
        host,
        resolve,
      };
      this.emitChange(entry.id);
      this.ensureLoop();
    });
  }

  /** Marks the cursor's host moves as superseded: a move still looking up its element resolves with `completed: false`. */
  private supersede(entry: AgenticCursorEntry): void {
    entry.moveToken++;
    const cancelLookup = entry.cancelLookup;
    entry.cancelLookup = null;
    cancelLookup?.();
  }

  /**
   * Moves to an element once the object confirms that it exists and can be seen. Until then the cursor keeps its
   * current move, attachment and element, so a failed lookup changes nothing. A host move, removal, clear, cleanup or
   * an action taking over the cursor during the lookup resolves this move with `completed: false` right away.
   * Counts as a host move from the start, so a running action stops even if the element is never found.
   */
  private moveToElement(
    entry: AgenticCursorEntry,
    target: KritzelAgenticElementTarget,
    options: KritzelAgenticMoveOptions,
  ): Promise<KritzelAgenticMoveResult> {
    const object = this.validateElementTarget(target);
    const lookup: AgenticCursorTrackedElement = { objectId: target.objectId, selector: target.selector };
    // The lookup tracks the element, so the object keeps the element's position from the lookup's answer.
    object.trackElement(lookup.selector);
    this.supersede(entry);
    entry.hostMoveGeneration++;
    // The host takes the cursor over now: the flight of an agentic action stops (the action stops with
    // 'agent-moved'), while an earlier host move keeps going until the element is found.
    if (entry.animation && !entry.animation.host) {
      this.finishAnimation(entry, false);
      this.emitChange(entry.id);
    }
    const token = entry.moveToken;
    const isCurrent = () => entry.moveToken === token && this._cursors.get(entry.id) === entry;

    return new Promise<KritzelAgenticMoveResult>((resolve, reject) => {
      let settled = false;
      const settle = (callback: () => void) => {
        if (!settled) {
          settled = true;
          callback();
        }
      };
      entry.cancelLookup = () => settle(() => resolve({ completed: false }));

      object.queryElements(lookup.selector, 1).then(
        elements => {
          if (!isCurrent()) {
            this.untrack(lookup);
            settle(() => resolve({ completed: false }));
            return;
          }
          entry.cancelLookup = null;
          if (elements.length === 0 || !elements[0].visibleRect) {
            this.untrack(lookup);
            settle(() => reject(new Error(elements.length === 0
              ? `Element "${lookup.selector}" not found in object "${lookup.objectId}".`
              : `Element "${lookup.selector}" in object "${lookup.objectId}" is not visible.`)));
            return;
          }
          // The move starts: it interrupts the running move and replaces the attachment and the tracked element.
          this.finishAnimation(entry, false);
          entry.attachedTo = null;
          this.setTrackedElement(entry, null);
          entry.trackedElement = lookup;
          const resolved = this.resolveTarget(target);
          const destination = resolved && Number.isFinite(resolved.x) && Number.isFinite(resolved.y) ? resolved : entry.position;
          this.startAnimation(entry, target, destination, options, true).then(result => settle(() => resolve(result)));
        },
        error => {
          this.untrack(lookup);
          if (!isCurrent()) {
            settle(() => resolve({ completed: false }));
            return;
          }
          entry.cancelLookup = null;
          settle(() => reject(error));
        },
      );
    });
  }

  /** World point of an element target: its anchor on the last reported element box, or the object center until then. */
  private resolveElementTarget(object: KritzelAnchorableGeometry, target: KritzelAgenticElementTarget): KritzelPoint {
    const elementAware = ObjectHelper.isKritzelElementAwareObject(object) ? object : null;
    const rect = elementAware?.getTrackedElementRect(target.selector) ?? null;
    if (!elementAware || !rect) {
      return resolveObjectAnchor(object, 'center', target.offset);
    }
    const anchor = target.anchor ?? 'center';
    // Own keys only: an anchor from untrusted input such as "toString" must not reach Object.prototype.
    const [ax, ay] = isAgenticAnchor(anchor) ? AGENTIC_ANCHOR_FACTORS[anchor] : AGENTIC_ANCHOR_FACTORS.center;
    const local = elementAware.contentToObjectLocal({ x: rect.x + ax * rect.width, y: rect.y + ay * rect.height });
    // Relative to the object's top-left corner, rotated with the object around its center.
    return resolveObjectAnchor(object, 'top-left', { x: local.x + (target.offset?.x ?? 0), y: local.y + (target.offset?.y ?? 0) });
  }

  /** Throws unless the target names an existing object that supports elements and a non-empty selector. */
  private validateElementTarget(target: KritzelAgenticElementTarget): KritzelElementAwareObject {
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

  private untrack(tracked: AgenticCursorTrackedElement): void {
    const object = this._core.store.objects?.findById(tracked.objectId);
    if (ObjectHelper.isKritzelElementAwareObject(object)) {
      object.untrackElement(tracked.selector);
    }
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
      this.untrack(previous);
    }
    entry.trackedElement = next;
  }

  /** Releases the tracked element of a cursor that neither moves to nor sticks to it any more. */
  private releaseUnattachedElement(entry: AgenticCursorEntry): void {
    if (!entry.animation && !entry.attachedTo?.selector) {
      this.setTrackedElement(entry, null);
    }
  }

  private toTrackedElement(target: KritzelAgenticTarget): AgenticCursorTrackedElement | null {
    return isElementTarget(target) ? { objectId: target.objectId, selector: target.selector } : null;
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

  private toAttachment(target: KritzelAgenticObjectTarget | KritzelAgenticElementTarget): KritzelAgenticAttachment {
    const attachment: KritzelAgenticAttachment = {
      objectId: target.objectId,
      anchor: target.anchor ?? 'center',
      offset: { x: target.offset?.x ?? 0, y: target.offset?.y ?? 0 },
    };
    if (isElementTarget(target)) {
      attachment.selector = target.selector;
    }
    return attachment;
  }

  private resolveTargetOrThrow(target: KritzelAgenticTarget): KritzelPoint {
    if (!target || (!isObjectTarget(target) && (!Number.isFinite(target.x) || !Number.isFinite(target.y)))) {
      throw new Error('Invalid agentic cursor target. Expected { x, y } with finite numbers, { objectId } or { objectId, selector }.');
    }
    const point = this.resolveTarget(target);
    if (!point) {
      throw new Error(`Object "${(target as KritzelAgenticObjectTarget).objectId}" not found.`);
    }
    // An object without geometry (e.g. an empty group) must not move the cursor to NaN, where it would stay.
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      throw new Error(`Object "${(target as KritzelAgenticObjectTarget).objectId}" has no position.`);
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
    const history = this._historyProvider?.(entry.id) ?? { canUndo: false, canRedo: false };
    return {
      id: entry.id,
      name: entry.appearance.name,
      color: entry.appearance.color,
      status: entry.appearance.status || undefined,
      visible: entry.appearance.visible,
      position: { ...entry.position },
      attachedTo: entry.attachedTo ? { ...entry.attachedTo, offset: { ...entry.attachedTo.offset } } : null,
      isMoving: entry.animation !== null,
      selectedObjectIds: [...entry.selectedObjectIds],
      isPressed: entry.isPressed,
      pressCount: entry.pressCount,
      activeAction: entry.activeAction,
      queueLength: entry.queueLength,
      canUndo: history.canUndo,
      canRedo: history.canRedo,
    };
  }

  private emitChange(id?: string): void {
    this._changeListeners.forEach(listener => KritzelEventHelper.callListener(() => listener(id), 'Agentic cursor listener'));
  }

  private emitDetached(event: KritzelAgenticCursorDetachedEvent): void {
    this._detachedListeners.forEach(listener => KritzelEventHelper.callListener(() => listener(event), 'Agentic cursor listener'));
  }

  private emitRemoved(id: string): void {
    this._removedListeners.forEach(listener => KritzelEventHelper.callListener(() => listener(id), 'Agentic cursor listener'));
  }

  /** Runs a listener so that one failing listener never stops the others or the frame loop. */

  private ensureLoop(): void {
    if (this._rafId !== null || this._cursors.size === 0 || typeof requestAnimationFrame !== 'function') return;
    const loop = (time: number) => {
      this._rafId = null;
      try {
        this.tick(time);
      } finally {
        if (this._cursors.size > 0 && this._rafId === null) {
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
}
