import { UpdrawBaseObject } from '../objects/base-object.class';

/**
 * Batches bigger than this don't play the appear animation: many objects appearing at once read as a page load rather
 * than as content arriving, and animating them all costs frames.
 */
export const UPDRAW_OBJECT_APPEAR_MAX_BATCH = 50;

/** Objects later than this in a batch appear together with it, so a long batch doesn't keep the canvas waiting. */
export const UPDRAW_OBJECT_APPEAR_MAX_STAGGER_INDEX = 8;

/** Timing of the appear animation, from the theme (`objectAppear`), in milliseconds. */
export interface UpdrawObjectAppearTiming {
  duration: number;
  stagger: number;
}

/** The appear state of the rendered objects, resolved once per render. */
export interface UpdrawObjectAppearResolution {
  /** The objects whose animation runs, with their stagger index, by object ID. */
  appearing: Map<string, number>;
  /** The objects whose animation started in this render (also in `appearing`). */
  started: Set<string>;
  /** The objects marked to appear that can't be shown yet, e.g. an iframe whose document is loading. */
  pending: Set<string>;
}

interface UpdrawObjectAppearEntry {
  /** Position in its batch; the animation is delayed by `index` times the theme's stagger. */
  index: number;
  /** When the animation started (`performance.now()`), once the object was first rendered ready to show. */
  startedAt?: number;
}

/**
 * Tracks the objects that play the appear animation: objects inserted by app code (`addObject(s)`), by agents
 * (`agent.addObject()`) or from the image picker. Objects the user draws, pastes or duplicates, remote and restored
 * objects and loaded documents don't appear.
 *
 * Purely visual: the state lives here, keyed by object ID, and never reaches the document, so it survives the object
 * being replaced by a fresh instance (e.g. after a remote update) and is never synced, persisted or copied.
 */
export class UpdrawObjectAppearManager {
  private readonly _entries = new Map<string, UpdrawObjectAppearEntry>();

  /**
   * Marks inserted objects to appear: a top-level object together with its group descendants, which are rendered as
   * objects of their own and appear with it.
   * @param objects - The inserted objects
   * @param index - Position of the top-level object in its batch, for the stagger
   */
  mark(objects: UpdrawBaseObject<any>[], index = 0): void {
    const entryIndex = Math.min(Math.max(0, Math.floor(index)), UPDRAW_OBJECT_APPEAR_MAX_STAGGER_INDEX);
    objects.forEach(object => {
      if (object.id) {
        this._entries.set(object.id, { index: entryIndex });
      }
    });
  }

  /**
   * Resolves which of the rendered objects are appearing, once per render, and forgets objects that are done.
   *
   * An object starts appearing the first time it is rendered ready to show (an iframe once its document loaded) and
   * keeps its animation until it ends, also over rerenders. An object that isn't rendered (it was inserted off-screen,
   * removed, or scrolled away) is forgotten, so it never appears later, when it comes into view.
   *
   * @param renderedObjects - The objects of this render
   * @param isReady - Whether an object can be shown yet; the animation waits until it can
   * @param timing - The theme's timing; a zero duration turns the animation off
   * @param now - The current time (`performance.now()`)
   * @returns The appearing, just started and pending objects
   */
  resolve(
    renderedObjects: UpdrawBaseObject<any>[],
    isReady: (object: UpdrawBaseObject<any>) => boolean,
    timing: UpdrawObjectAppearTiming,
    now: number,
  ): UpdrawObjectAppearResolution {
    const appearing = new Map<string, number>();
    const started = new Set<string>();
    const pending = new Set<string>();
    if (this._entries.size === 0) {
      return { appearing, started, pending };
    }
    if (!(timing.duration > 0)) {
      this._entries.clear();
      return { appearing, started, pending };
    }

    const rendered = new Map(renderedObjects.map(object => [object.id, object]));
    this._entries.forEach((entry, id) => {
      const object = rendered.get(id);
      if (!object) {
        this._entries.delete(id);
        return;
      }
      if (entry.startedAt === undefined) {
        if (!isReady(object)) {
          pending.add(id);
          return;
        }
        entry.startedAt = now;
        started.add(id);
      }
      if (now - entry.startedAt >= entry.index * Math.max(0, timing.stagger) + timing.duration) {
        this._entries.delete(id);
        return;
      }
      appearing.set(id, entry.index);
    });
    return { appearing, started, pending };
  }

  /** Whether an object is marked to appear (and hasn't finished). */
  has(objectId: string): boolean {
    return this._entries.has(objectId);
  }

  /** Forgets all objects, e.g. when the workspace changes. */
  clear(): void {
    this._entries.clear();
  }
}
