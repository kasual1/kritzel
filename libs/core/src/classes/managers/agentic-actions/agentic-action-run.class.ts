import type { KritzelCore } from '../../core/core.class';
import type { KritzelObjectMap } from '../../structures/object-map.structure';
import type { KritzelAgentOrigin } from '../../structures/agent-origin.class';
import type { KritzelBaseObject } from '../../objects/base-object.class';
import type { KritzelAgenticCursorManager } from '../agentic-cursor.manager';
import type {
  KritzelAgenticAction,
  KritzelAgenticActionFailureReason,
  KritzelAgenticActionOptions,
  KritzelAgenticActionResult,
} from '../../../interfaces/agentic-action.interface';
import type { KritzelAgenticCursorObjectTarget, KritzelAgenticCursorTarget } from '../../../interfaces/agentic-cursor.interface';
import { KritzelEasingHelper } from '../../../helpers/easing.helper';
import {
  AGENTIC_ACTION_DEFAULT_SPEED,
  AGENTIC_ACTION_DRAG_MAX_MS,
  AGENTIC_ACTION_DRAG_MIN_MS,
  AGENTIC_ACTION_DRAG_SPEED,
  AGENTIC_ACTION_PERSIST_INTERVAL_MS,
  AGENTIC_ACTION_PRESS_MS,
  AGENTIC_ACTION_RELEASE_MS,
  KritzelAgenticAbortError,
  KritzelAgenticActionExecutor,
  KritzelAgenticPreparation,
} from './agentic-action.types';
import { collectAnchoredLines } from './agentic-conflict.helper';

type AnyObject = KritzelBaseObject<any>;
type ObjectMap = KritzelObjectMap<AnyObject>;

/** How a run ended. */
export type KritzelAgenticRunOutcome =
  | { kind: 'commit'; objectIds: string[] }
  | { kind: 'abort'; reason: KritzelAgenticActionFailureReason; objectIds?: string[] }
  | { kind: 'fail'; error: unknown };

/** Services of the action manager a run uses. @internal */
export interface KritzelAgenticRunHost {
  /** Timestamp of the current or last frame. */
  readonly lastFrameTime: number | null;
  /** Settles a run: persists or rolls back, releases claims, emits events and resolves the promise. */
  finishRun(run: KritzelAgenticActionRun, outcome: KritzelAgenticRunOutcome, options?: { sync?: boolean }): void;
  /** Runs the conflict checks now with fresh state and aborts the run on a conflict. */
  checkpoint(run: KritzelAgenticActionRun): void;
  /** Claims an additional object for the run. */
  claim(run: KritzelAgenticActionRun, objectId: string): void;
  /** Sets the explicit (`select`) selection of the run's cursor. */
  setSelection(cursorId: string, objectIds: string[]): void;
  /** The explicit selection of a cursor. */
  getSelection(cursorId: string): string[];
}

interface Waiter {
  kind: 'animate' | 'frame';
  duration: number;
  step?: (eased: number, raw: number, isLast: boolean) => void;
  easing: (t: number) => number;
  start: number | null;
  resolve: () => void;
  reject: (error: unknown) => void;
}

/**
 * The context of one `performAgenticAction` call: timing, scoped mutations, tracked objects and outcome.
 * Executors drive it; the action manager starts, checks and settles it.
 * @internal
 */
export class KritzelAgenticActionRun {
  /** The object map the action works on; set when the action starts. */
  map: ObjectMap | null = null;
  /** The agent origin of mutating actions. */
  origin: KritzelAgentOrigin | null = null;
  /** Host move generation of the cursor when the action started. */
  hostMoveGeneration = 0;
  /** Length of the agent's undo stack when the action started. */
  undoLengthAtStart = 0;
  /** Whether the action changed anything. */
  hasMutated = false;
  /** Whether the outcome is decided. */
  settled = false;
  /** Whether the manager started the action. */
  started = false;
  /** Whether the executor is running (conflict checks apply every frame). */
  executing = false;

  /** Targets with group relatives; full conflict checks. */
  targetIds: string[] = [];
  /** Top-level targets shown as selected while running. */
  displayIds: string[] = [];
  /** Objects the action only reads. */
  referenceIds: string[] = [];
  /** Whether lines anchored to the targets are checked as well. */
  includeAnchoredLines = false;
  /** Conflict check level. */
  checkLevel: 'full' | 'existence' = 'full';

  /** Instances the action saw; a different instance in the map means someone else replaced the object. */
  readonly knownInstances = new Map<string, AnyObject>();
  /** Objects created or replaced by the action itself. */
  readonly trackedIds = new Set<string>();
  /** Objects the action deleted or handed over; no longer checked. */
  readonly releasedIds = new Set<string>();
  /** Snapshots of deleted objects, for `objectsRemoved`. */
  readonly removedSnapshots = new Map<string, AnyObject>();
  /** Changed properties per object, for `objectsUpdated`. */
  readonly changedProperties = new Map<string, string[]>();
  /** Where the cursor attaches when the action completes. */
  finalAttachment: KritzelAgenticCursorObjectTarget | null = null;

  /** The promise returned to the caller. */
  readonly promise: Promise<KritzelAgenticActionResult>;
  /** Resolves once the run is fully cleaned up (rollback, claims, events). */
  readonly done: Promise<void>;
  /** Abort listener registered on `options.signal`. */
  abortListener: (() => void) | null = null;

  private readonly _waiters = new Set<Waiter>();
  private readonly _settleHooks: (() => void)[] = [];
  private _flying = false;
  private _lastPersistAt = -Infinity;
  private _resolve!: (result: KritzelAgenticActionResult) => void;
  private _reject!: (error: unknown) => void;
  private _resolveDone!: () => void;

  constructor(
    readonly host: KritzelAgenticRunHost,
    readonly core: KritzelCore,
    readonly cursorId: string,
    readonly action: KritzelAgenticAction,
    readonly options: KritzelAgenticActionOptions,
    readonly executor: KritzelAgenticActionExecutor,
  ) {
    this.promise = new Promise<KritzelAgenticActionResult>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
    this.done = new Promise<void>(resolve => {
      this._resolveDone = resolve;
    });
  }

  get cursorManager(): KritzelAgenticCursorManager {
    return this.core.agenticCursorManager;
  }

  /** Whether all animation is skipped. */
  get instant(): boolean {
    return !!this.options.instant;
  }

  /** Factor all non-flight phase durations are divided by. */
  get speedFactor(): number {
    const speed = this.options.speed;
    return typeof speed === 'number' && speed > 0 ? speed / AGENTIC_ACTION_DEFAULT_SPEED : 1;
  }

  /** Whether the cursor is flying for this run. */
  get isFlying(): boolean {
    return this._flying;
  }

  /** Applies the executor's preparation. `expandedTargets` includes group relatives. */
  applyPreparation(preparation: KritzelAgenticPreparation, expandedTargets: Set<string>): void {
    this.displayIds = [...preparation.targetIds];
    this.targetIds = Array.from(expandedTargets);
    this.referenceIds = [...preparation.referenceIds];
    this.includeAnchoredLines = !!preparation.includeAnchoredLines;
    this.checkLevel = preparation.checkLevel ?? 'full';
  }

  /** All objects checked every frame: targets, anchored lines (when enabled) and tracked objects. */
  checkedIds(): Set<string> {
    const ids = new Set<string>(this.targetIds);
    if (this.includeAnchoredLines && this.executing) {
      collectAnchoredLines(this.core, this.targetIds).forEach(id => ids.add(id));
    }
    this.trackedIds.forEach(id => ids.add(id));
    this.releasedIds.forEach(id => ids.delete(id));
    return ids;
  }

  /** Throws once the run has settled. */
  assertActive(): void {
    if (this.settled) {
      throw new KritzelAgenticAbortError();
    }
  }

  /** Aborts the run and throws, for use inside executors. */
  stop(reason: KritzelAgenticActionFailureReason, objectIds?: string[]): never {
    this.abort(reason, objectIds);
    throw new KritzelAgenticAbortError();
  }

  // ─── Timing ─────────────────────────────────────────────────────────────────

  /** Advances waiting phases to `now`. Called by the action manager once per frame. */
  advance(now: number): void {
    for (const waiter of Array.from(this._waiters)) {
      if (this.settled) {
        return;
      }
      if (waiter.kind === 'frame') {
        this._waiters.delete(waiter);
        waiter.resolve();
        continue;
      }
      if (waiter.start === null) {
        waiter.start = now;
      }
      const raw = waiter.duration <= 0 ? 1 : Math.min(1, Math.max(0, (now - waiter.start) / waiter.duration));
      const isLast = raw >= 1;
      try {
        waiter.step?.(waiter.easing(raw), raw, isLast);
      } catch (error) {
        this._waiters.delete(waiter);
        waiter.reject(error);
        continue;
      }
      if (isLast) {
        this._waiters.delete(waiter);
        waiter.resolve();
      }
    }
  }

  /** Calls `step` every frame for `durationMs`, ending with `isLast = true`. Instant runs call it once. */
  animate(durationMs: number, step: (eased: number, raw: number, isLast: boolean) => void, easing?: KritzelAgenticActionOptions['easing']): Promise<void> {
    this.assertActive();
    if (this.instant) {
      step(1, 1, true);
      return Promise.resolve();
    }
    return this.wait({ kind: 'animate', duration: Math.max(0, durationMs), step, easing: KritzelEasingHelper.resolve(easing ?? 'linear') });
  }

  /** Resolves on the next frame (immediately for instant runs). */
  nextFrame(): Promise<void> {
    this.assertActive();
    if (this.instant) {
      return Promise.resolve();
    }
    return this.wait({ kind: 'frame', duration: 0, easing: t => t });
  }

  /** Resolves on the next rendered frame, also for instant runs (e.g. to wait for DOM measurement). */
  nextRenderedFrame(): Promise<void> {
    this.assertActive();
    return this.wait({ kind: 'frame', duration: 0, easing: t => t });
  }

  /** Duration of a phase given a rate (units per second at default speed) and clamps, scaled by speed. */
  phaseDuration(amount: number, ratePerSecond: number, minMs: number, maxMs: number): number {
    const k = this.speedFactor;
    const duration = (Math.abs(amount) / (ratePerSecond * k)) * 1000;
    return Math.min(maxMs / k, Math.max(minMs / k, duration));
  }

  /** Flies the cursor to a target, like `moveAgenticCursor`. Instant runs jump. */
  async fly(target: KritzelAgenticCursorTarget, attach = false): Promise<void> {
    this.assertActive();
    const cursors = this.cursorManager;
    const isObjectTarget = typeof (target as KritzelAgenticCursorObjectTarget).objectId === 'string';

    if (this.instant) {
      if (attach && isObjectTarget) {
        cursors.attach(this.cursorId, target as KritzelAgenticCursorObjectTarget);
        return;
      }
      const point = cursors.resolveTarget(target);
      if (!point) {
        this.stop('object-removed');
      }
      cursors.setPosition(this.cursorId, point);
      return;
    }

    let completed = false;
    this._flying = true;
    try {
      const result = await cursors.fly(this.cursorId, target, { speed: this.options.speed, easing: this.options.easing, attach });
      completed = result.completed;
    } catch {
      this._flying = false;
      this.stop('object-removed');
    } finally {
      this._flying = false;
    }

    this.assertActive();
    if (!completed) {
      if (!cursors.get(this.cursorId)) {
        this.stop('cursor-removed');
      }
      if (!cursors.resolveTarget(target)) {
        this.stop('object-removed');
      }
      this.stop('interrupted');
    }
  }

  /** Presses the cursor, after re-checking for conflicts. */
  async press(): Promise<void> {
    this.assertActive();
    this.host.checkpoint(this);
    if (this.instant) {
      return;
    }
    this.cursorManager.setPressed(this.cursorId, true);
    await this.animate(AGENTIC_ACTION_PRESS_MS / this.speedFactor, () => undefined);
  }

  /** Releases the cursor. */
  async release(): Promise<void> {
    this.assertActive();
    if (this.instant) {
      return;
    }
    this.cursorManager.setPressed(this.cursorId, false);
    await this.animate(AGENTIC_ACTION_RELEASE_MS / this.speedFactor, () => undefined);
  }

  /** Presses and releases the cursor. */
  async click(): Promise<void> {
    await this.press();
    await this.release();
  }

  /** Duration of a drag over a screen distance, scaled by speed. */
  dragDuration(screenDistance: number): number {
    const k = this.speedFactor;
    const duration = (Math.abs(screenDistance) / (AGENTIC_ACTION_DRAG_SPEED * k)) * 1000;
    return Math.min(AGENTIC_ACTION_DRAG_MAX_MS / k, Math.max(AGENTIC_ACTION_DRAG_MIN_MS / k, duration));
  }

  // ─── Mutation ───────────────────────────────────────────────────────────────

  /**
   * Runs a synchronous change under this agent's origin. `'final'` writes to Yjs in one transaction;
   * `'throttled'` writes at most every 100 ms and only updates locally in between.
   */
  mutate<R>(fn: () => R, persist: 'final' | 'throttled' = 'final'): R {
    this.assertActive();
    const map = this.map;
    if (!map || this.core.store.objects !== map || !map.isReady) {
      this.stop('workspace-changed');
    }
    const origin = this.origin;
    if (!origin) {
      throw new Error('Only mutating agentic actions can change objects.');
    }
    this.hasMutated = true;

    const now = this.host.lastFrameTime ?? (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const persistNow = persist === 'final' || now - this._lastPersistAt >= AGENTIC_ACTION_PERSIST_INTERVAL_MS;
    if (persistNow) {
      this._lastPersistAt = now;
    }

    let result!: R;
    map.withOrigin(origin, () => {
      if (persistNow) {
        map.transaction(() => {
          result = fn();
        });
      } else {
        result = map.withLocalUpdatesOnly(fn);
      }
    });
    this.core.rerender();
    return result;
  }

  /** Writes objects that were only updated locally, skipping ones someone else replaced meanwhile. */
  flushLocalOnly(): void {
    const map = this.map;
    const origin = this.origin;
    if (!map || !origin || !map.isReady) {
      return;
    }
    const ids = origin.takeLocalOnly();
    if (ids.length === 0) {
      return;
    }
    map.withOrigin(origin, () =>
      map.transaction(() => {
        for (const id of ids) {
          const object = map.findById(id);
          const known = this.knownInstances.get(id);
          if (object && (!known || known === object)) {
            map.update(object);
          }
        }
      }),
    );
  }

  /** Tracks an object the action created or replaced: it is checked and claimed from now on. */
  track(object: AnyObject): void {
    this.knownInstances.set(object.id, object);
    this.trackedIds.add(object.id);
    this.releasedIds.delete(object.id);
    this.host.claim(this, object.id);
  }

  /** Stops checking objects the action itself deletes or replaces through history. */
  untrack(ids: Iterable<string>): void {
    for (const id of ids) {
      this.knownInstances.delete(id);
      this.trackedIds.delete(id);
      this.releasedIds.add(id);
    }
  }

  /** Registers a hook that runs when the run settles, whatever the outcome. */
  onSettle(hook: () => void): void {
    this._settleHooks.push(hook);
  }

  // ─── Outcome ────────────────────────────────────────────────────────────────

  /** Completes the action. */
  commit(objectIds: string[]): void {
    this.host.finishRun(this, { kind: 'commit', objectIds });
  }

  /** Stops the action with a reason. */
  abort(reason: KritzelAgenticActionFailureReason, objectIds?: string[], options?: { sync?: boolean }): void {
    this.host.finishRun(this, { kind: 'abort', reason, objectIds }, options);
  }

  /** Stops the action because of an unexpected error; the promise rejects with it. */
  fail(error: unknown): void {
    this.host.finishRun(this, { kind: 'fail', error });
  }

  /** Rejects all pending phases. @internal */
  rejectWaiters(): void {
    const waiters = Array.from(this._waiters);
    this._waiters.clear();
    waiters.forEach(waiter => waiter.reject(new KritzelAgenticAbortError()));
  }

  /** Runs the settle hooks once. @internal */
  runSettleHooks(): void {
    const hooks = this._settleHooks.splice(0);
    for (const hook of hooks) {
      try {
        hook();
      } catch (error) {
        console.error('[Kritzel] Agentic action settle hook failed:', error);
      }
    }
  }

  /** Removes the abort listener. @internal */
  removeAbortListener(): void {
    if (this.abortListener) {
      this.options.signal?.removeEventListener('abort', this.abortListener);
      this.abortListener = null;
    }
  }

  /** Resolves or rejects the caller's promise and marks the run as done. @internal */
  settleWith(result: KritzelAgenticActionResult | { error: unknown }): void {
    if ('error' in result) {
      this._reject(result.error);
    } else {
      this._resolve(result);
    }
    this._resolveDone();
  }

  private wait(waiter: Omit<Waiter, 'start' | 'resolve' | 'reject'>): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._waiters.add({ ...waiter, start: null, resolve, reject });
      this.cursorManager.requestFrames();
    });
  }
}
