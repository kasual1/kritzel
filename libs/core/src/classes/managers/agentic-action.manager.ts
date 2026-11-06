import type { KritzelCore } from '../core/core.class';
import type { KritzelObjectMap } from '../structures/object-map.structure';
import type { KritzelBaseObject } from '../objects/base-object.class';
import type {
  KritzelAgenticAction,
  KritzelAgenticActionFailureReason,
  KritzelAgenticActionOptions,
  KritzelAgenticActionResult,
} from '../../interfaces/agentic-action.interface';
import type { KritzelObjectChangeSource } from '../../interfaces/object-change-event.interface';
import { getAgenticActionExecutor } from './agentic-actions';
import { KritzelAgenticAbortError, isAgenticRefusal } from './agentic-actions/agentic-action.types';
import { KritzelAgenticActionRun, KritzelAgenticRunHost, KritzelAgenticRunOutcome } from './agentic-actions/agentic-action-run.class';
import { KritzelAgenticFrameCache, buildFrameCache, detectObjectConflict, expandWithRelatives } from './agentic-actions/agentic-conflict.helper';

type AnyObject = KritzelBaseObject<any>;
type ObjectMap = KritzelObjectMap<AnyObject>;

interface AgenticSelection {
  /** Top-level IDs, as shown. */
  ids: string[];
  /** IDs with group relatives, as claimed. */
  expanded: Set<string>;
}

interface Conflict {
  reason: KritzelAgenticActionFailureReason;
  objectIds?: string[];
}

interface DeferredTask {
  map: ObjectMap | null;
  run: () => void;
}

/** Reasons after which an aborted action keeps its partial change: the user has taken over the objects. */
const KEEP_REASONS: ReadonlySet<KritzelAgenticActionFailureReason> = new Set(['user-selected', 'user-interaction']);
/** Reasons after which nothing is emitted: the workspace is going away. */
const SILENT_REASONS: ReadonlySet<KritzelAgenticActionFailureReason> = new Set(['workspace-changed', 'engine-disconnected']);

/**
 * Runs `performAgenticAction` calls: one FIFO queue per agentic cursor, cursors in parallel.
 *
 * Each action is cursor choreography (driven by the cursor manager's frame loop) plus changes
 * through core APIs under the cursor's own transaction origin, so agent changes sync like user
 * edits but land in a separate per-agent history. Before an action starts and on every frame
 * while it runs, its objects are checked for conflicts with the local user, collaborators and
 * other agents. Agent selections and claims exist only in this manager and are never synced.
 */
export class KritzelAgenticActionManager implements KritzelAgenticRunHost {
  private readonly _core: KritzelCore;
  private readonly _queues = new Map<string, KritzelAgenticActionRun[]>();
  private readonly _running = new Map<string, KritzelAgenticActionRun>();
  private readonly _runClaims = new Map<string, Set<string>>();
  private readonly _runReferences = new Map<string, Set<string>>();
  private readonly _selections = new Map<string, AgenticSelection>();
  private readonly _boundMaps = new WeakSet<object>();
  private readonly _deferred: DeferredTask[] = [];
  private _deferredScheduled = false;
  private _unsubscribers: (() => void)[] = [];
  private _subscribed = false;
  private _disposing = false;
  private _lastFrameTime: number | null = null;

  constructor(core: KritzelCore) {
    this._core = core;
  }

  get lastFrameTime(): number | null {
    return this._lastFrameTime;
  }

  /**
   * Queues an action for a cursor. Rejects for unknown cursors and invalid actions; every runtime
   * condition resolves with `completed: false` and a reason.
   */
  perform(cursorId: string, action: KritzelAgenticAction, options: KritzelAgenticActionOptions = {}): Promise<KritzelAgenticActionResult> {
    const cursors = this._core.agenticCursorManager;
    if (!cursors.get(cursorId)) {
      throw new Error(`Agentic cursor "${cursorId}" not found.`);
    }
    const executor = getAgenticActionExecutor((action as { type?: unknown } | null)?.type);
    if (!action || typeof action !== 'object' || !executor) {
      throw new TypeError(`Unknown agentic action type "${String((action as { type?: unknown } | null)?.type)}".`);
    }
    executor.validate(action);

    if (options.signal?.aborted) {
      return Promise.resolve({ completed: false, reason: 'aborted' });
    }

    this.ensureSubscribed();
    const run = new KritzelAgenticActionRun(this, this._core, cursorId, action, options ?? {}, executor);
    this.getQueue(cursorId).push(run);

    if (options.signal) {
      run.abortListener = () => this.handleSignalAbort(run);
      options.signal.addEventListener('abort', run.abortListener, { once: true });
    }

    this.updateActivity(cursorId);
    queueMicrotask(() => this.pump(cursorId));
    return run.promise;
  }

  /** The explicit (`select`) selection of a cursor. */
  getSelection(cursorId: string): string[] {
    return [...(this._selections.get(cursorId)?.ids ?? [])];
  }

  /** Sets the explicit selection of a cursor. */
  setSelection(cursorId: string, objectIds: string[]): void {
    const map = this._core.store.objects as ObjectMap | undefined;
    // A removed cursor must never keep a selection: it would claim the objects forever.
    if (objectIds.length === 0 || !map || !this._core.agenticCursorManager.get(cursorId)) {
      this._selections.delete(cursorId);
    } else {
      this._selections.set(cursorId, { ids: [...objectIds], expanded: expandWithRelatives(map, objectIds) });
    }
    this.showSelection(cursorId);
  }

  claim(run: KritzelAgenticActionRun, objectId: string): void {
    let claims = this._runClaims.get(run.cursorId);
    if (!claims) {
      claims = new Set();
      this._runClaims.set(run.cursorId, claims);
    }
    claims.add(objectId);
  }

  checkpoint(run: KritzelAgenticActionRun): void {
    run.assertActive();
    const map = run.map;
    if (!map) {
      return;
    }
    const conflict = this.detectConflicts(run, this.buildCache(map));
    if (conflict) {
      run.stop(conflict.reason, conflict.objectIds);
    }
  }

  /** Cancels everything, e.g. when the engine disconnects. */
  cleanup(): void {
    this._disposing = true;
    try {
      this.cancelAll('engine-disconnected', null);
      this.drainDeferred(true);
      this._unsubscribers.forEach(unsubscribe => unsubscribe());
      this._unsubscribers = [];
      this._subscribed = false;
      this._core.agenticCursorManager.setHistoryProvider(null);
    } finally {
      this._disposing = false;
    }
  }

  // ─── Settling ───────────────────────────────────────────────────────────────

  finishRun(run: KritzelAgenticActionRun, outcome: KritzelAgenticRunOutcome, options?: { sync?: boolean }): void {
    if (run.settled) {
      return;
    }
    if (run.applyingHistory && outcome.kind === 'abort') {
      // An undo/redo step is being applied and its events are already out: it can't be rolled back.
      // The executor decides once the step returns (the abort stands only if nothing was applied).
      run.heldAbort ??= { reason: outcome.reason, objectIds: outcome.objectIds };
      return;
    }
    run.settled = true;
    const cursors = this._core.agenticCursorManager;
    // Stop the run's own flight, never a move the host started.
    if (run.isFlying && cursors.getHostMoveGeneration(run.cursorId) === run.hostMoveGeneration) {
      cursors.stopAnimation(run.cursorId);
    }
    cursors.setPressed(run.cursorId, false);
    run.rejectWaiters();
    run.removeAbortListener();

    const map = run.map;
    if (map && map.isInsideYjsCallback && !options?.sync) {
      // Undo managers must not run inside a Yjs callback (e.g. an abort from an event listener
      // during a remote change); finish once the callback is over.
      this.defer(map, () => this.cleanupRun(run, outcome));
    } else {
      this.cleanupRun(run, outcome);
    }
  }

  private cleanupRun(run: KritzelAgenticActionRun, outcome: KritzelAgenticRunOutcome): void {
    const cursors = this._core.agenticCursorManager;
    const map = run.map;
    const reason = outcome.kind === 'abort' ? outcome.reason : null;
    const keep = outcome.kind === 'commit' || (reason !== null && KEEP_REASONS.has(reason));
    let events: ReturnType<KritzelAgenticActionManager['deriveEvents']> | null = null;

    try {
      if (run.hasMutated && run.origin && map && map.isReady) {
        const canWrite = !map.isInsideYjsCallback;
        if (canWrite) {
          run.flushLocalOnly();
        }
        if (keep) {
          map.stopAgentCapturing(run.cursorId);
          const recording = run.origin.takeRecording();
          if (map.getAgentUndoStackLength(run.cursorId) > run.undoLengthAtStart) {
            map.tagLastAgentStackItem(run.cursorId, Array.from(recording.keys()));
          }
          events = this.deriveEvents(run, map, recording);
        } else {
          run.origin.takeRecording();
          if (canWrite) {
            map.rollbackAgent(run.cursorId, run.undoLengthAtStart);
          }
        }
      } else {
        run.origin?.takeRecording();
      }
      if (run.suspendedRedo && map && map.isReady) {
        // A kept change invalidates the earlier redo steps; a rolled-back (or empty) action leaves them as they were.
        map.resumeAgentRedo(run.cursorId, run.suspendedRedo, !(run.hasMutated && keep));
      }
    } catch (error) {
      console.error('[Kritzel] Failed to finish an agentic action:', error);
    } finally {
      run.suspendedRedo = null;
    }

    run.runSettleHooks();
    if (outcome.kind === 'commit' && run.finalAttachment) {
      cursors.attach(run.cursorId, run.finalAttachment);
    }
    this._runClaims.delete(run.cursorId);
    this._runReferences.delete(run.cursorId);
    if (this._running.get(run.cursorId) === run) {
      this._running.delete(run.cursorId);
    }
    this.showSelection(run.cursorId);
    this.updateActivity(run.cursorId);

    if (events && !(reason && SILENT_REASONS.has(reason))) {
      this.emitEvents(run, events);
    }

    if (outcome.kind === 'commit') {
      run.settleWith({ completed: true, objectIds: outcome.objectIds });
    } else if (outcome.kind === 'abort') {
      const result: KritzelAgenticActionResult = { completed: false, reason: outcome.reason };
      if (outcome.objectIds && outcome.objectIds.length > 0) {
        result.objectIds = outcome.objectIds;
      }
      run.settleWith(result);
    } else {
      run.settleWith({ error: outcome.error });
    }
  }

  private deriveEvents(run: KritzelAgenticActionRun, map: ObjectMap, recording: Map<string, boolean>) {
    const added: AnyObject[] = [];
    const removed: AnyObject[] = [];
    const updated: { object: AnyObject; changedProperties: string[] }[] = [];
    recording.forEach((existedBefore, id) => {
      const current = map.findById(id);
      if (!existedBefore && current) {
        added.push(current);
      } else if (existedBefore && !current) {
        removed.push(run.removedSnapshots.get(id) ?? ({ id } as AnyObject));
      } else if (existedBefore && current) {
        updated.push({ object: current, changedProperties: run.changedProperties.get(id) ?? [] });
      }
    });
    return { added, removed, updated };
  }

  private emitEvents(run: KritzelAgenticActionRun, events: { added: AnyObject[]; removed: AnyObject[]; updated: { object: AnyObject; changedProperties: string[] }[] }): void {
    const engine = this._core.engine;
    const source: KritzelObjectChangeSource = { type: 'agentic-cursor', cursorId: run.cursorId, actionType: run.action.type };
    try {
      if (events.added.length > 0) engine.emitObjectsAdded(events.added, source);
      if (events.removed.length > 0) engine.emitObjectsRemoved(events.removed, source);
      if (events.updated.length > 0) engine.emitObjectsUpdated(events.updated, source);
      engine.emitObjectsChange();
      if (events.added.length > 0 || events.removed.length > 0) {
        engine.emitObjectsInViewportChange();
      }
    } catch (error) {
      console.error('[Kritzel] Agentic action event listener failed:', error);
    }
    this._core.rerender();
  }

  // ─── Queue ──────────────────────────────────────────────────────────────────

  private pump(cursorId: string): void {
    if (this._running.has(cursorId) || this._disposing) {
      return;
    }
    const queue = this._queues.get(cursorId);
    const run = queue?.shift();
    if (!run) {
      this.updateActivity(cursorId);
      return;
    }
    if (run.settled) {
      this.pump(cursorId);
      return;
    }
    this._running.set(cursorId, run);
    void run.done.then(() => {
      if (this._running.get(cursorId) === run) {
        this._running.delete(cursorId);
      }
      this.updateActivity(cursorId);
      this.pump(cursorId);
    });
    void this.start(run);
  }

  private async start(run: KritzelAgenticActionRun): Promise<void> {
    try {
      run.started = true;
      const cursors = this._core.agenticCursorManager;
      if (!cursors.get(run.cursorId)) {
        run.abort('cursor-removed');
        return;
      }
      const map = this._core.store.objects as ObjectMap | undefined;
      if (!map || !map.isReady || map.isHeadless) {
        run.abort('engine-disconnected');
        return;
      }
      run.map = map;
      this.bindMap(map);

      // Take over the cursor: a host move still running is cancelled.
      run.hostMoveGeneration = cursors.getHostMoveGeneration(run.cursorId);
      cursors.stopAnimation(run.cursorId);
      this.updateActivity(run.cursorId);

      const preparation = run.executor.prepare(run, run.action);
      if (isAgenticRefusal(preparation)) {
        run.abort(preparation.reason, preparation.objectIds);
        return;
      }
      const expanded = preparation.checkLevel === 'existence' ? new Set(preparation.targetIds) : expandWithRelatives(map, preparation.targetIds);
      run.applyPreparation(preparation, expanded);

      const conflict = this.detectConflicts(run, this.buildCache(map));
      if (conflict) {
        run.abort(conflict.reason, conflict.objectIds);
        return;
      }

      if (run.executor.mutates) {
        const origin = map.getAgentOrigin(run.cursorId);
        if (!origin) {
          run.abort('engine-disconnected');
          return;
        }
        run.origin = origin;
        map.stopAgentCapturing(run.cursorId);
        run.undoLengthAtStart = map.getAgentUndoStackLength(run.cursorId);
        run.suspendedRedo = map.suspendAgentRedo(run.cursorId);
        origin.startRecording();
      }

      run.executing = true;
      this._runClaims.set(run.cursorId, new Set(run.checkedIds()));
      this._runReferences.set(run.cursorId, new Set(run.referenceIds));
      run.checkedIds().forEach(id => {
        const object = map.findById(id);
        if (object) run.knownInstances.set(id, object);
      });
      run.referenceIds.forEach(id => {
        const object = map.findById(id);
        if (object) run.knownInstances.set(id, object);
      });
      this.showSelection(run.cursorId);

      const objectIds = await run.executor.execute(run, run.action);
      if (!run.settled) {
        run.commit(objectIds);
      }
    } catch (error) {
      if (error instanceof KritzelAgenticAbortError || run.settled) {
        return;
      }
      run.fail(error);
    }
  }

  private handleSignalAbort(run: KritzelAgenticActionRun): void {
    if (run.settled) {
      return;
    }
    if (run.started) {
      run.abort('aborted');
      return;
    }
    const queue = this._queues.get(run.cursorId);
    const index = queue?.indexOf(run) ?? -1;
    if (queue && index >= 0) {
      queue.splice(index, 1);
    }
    this.settleQueued(run, 'aborted');
  }

  private settleQueued(run: KritzelAgenticActionRun, reason: KritzelAgenticActionFailureReason): void {
    if (run.settled) {
      return;
    }
    run.settled = true;
    run.removeAbortListener();
    run.settleWith({ completed: false, reason });
    this.updateActivity(run.cursorId);
  }

  private getQueue(cursorId: string): KritzelAgenticActionRun[] {
    let queue = this._queues.get(cursorId);
    if (!queue) {
      queue = [];
      this._queues.set(cursorId, queue);
    }
    return queue;
  }

  // ─── Frames and conflicts ───────────────────────────────────────────────────

  private handleBeforeFrame(now: number): void {
    this._lastFrameTime = now;
    this.pruneSelections();
    if (this._running.size === 0) {
      return;
    }
    let cache: KritzelAgenticFrameCache | null = null;
    for (const run of Array.from(this._running.values())) {
      if (run.settled || !run.executing || !run.map) {
        continue;
      }
      try {
        if (!cache && this._core.store.objects === run.map) {
          cache = this.buildCache(run.map);
        }
        const conflict = this.detectConflicts(run, cache ?? this.buildCache(run.map));
        if (conflict) {
          run.abort(conflict.reason, conflict.objectIds);
          continue;
        }
        this.recordNewInstances(run);
        run.advance(now);
      } catch (error) {
        if (!(error instanceof KritzelAgenticAbortError)) {
          run.fail(error);
        }
      }
    }
  }

  private buildCache(map: ObjectMap): KritzelAgenticFrameCache {
    return buildFrameCache(this._core, map);
  }

  /** Objects that join the checked set mid-action (e.g. newly anchored lines) are claimed when first seen. */
  private recordNewInstances(run: KritzelAgenticActionRun): void {
    const map = run.map!;
    run.checkedIds().forEach(id => {
      if (!run.knownInstances.has(id)) {
        const object = map.findById(id);
        if (object) {
          run.knownInstances.set(id, object);
          this.claim(run, id);
        }
      }
    });
  }

  private detectConflicts(run: KritzelAgenticActionRun, cache: KritzelAgenticFrameCache): Conflict | null {
    const runReason = this.detectRunConflict(run);
    if (runReason) {
      return { reason: runReason };
    }
    const map = run.map!;

    if (run.checkLevel === 'existence') {
      for (const id of [...run.targetIds, ...run.referenceIds]) {
        if (!map.findById(id)) {
          return { reason: 'object-removed', objectIds: [id] };
        }
      }
      return null;
    }

    for (const id of run.checkedIds()) {
      const reason = detectObjectConflict(this._core, map, cache, id, run.knownInstances.get(id), this.isClaimedByOther(id, run.cursorId, 'target'));
      if (reason) {
        return { reason: !run.executing && reason === 'object-removed' ? 'invalid-target' : reason, objectIds: [id] };
      }
    }
    for (const id of run.referenceIds) {
      if (!map.findById(id)) {
        return { reason: run.executing ? 'object-removed' : 'invalid-target', objectIds: [id] };
      }
      if (this.isClaimedByOther(id, run.cursorId, 'reference')) {
        return { reason: 'claimed-by-agent', objectIds: [id] };
      }
    }
    return null;
  }

  private detectRunConflict(run: KritzelAgenticActionRun): KritzelAgenticActionFailureReason | null {
    const cursors = this._core.agenticCursorManager;
    if (run.options.signal?.aborted) {
      return 'aborted';
    }
    if (!cursors.get(run.cursorId)) {
      return 'cursor-removed';
    }
    if (!run.map || this._core.store.objects !== run.map || !run.map.isReady) {
      return 'workspace-changed';
    }
    if (cursors.getHostMoveGeneration(run.cursorId) !== run.hostMoveGeneration) {
      return 'interrupted';
    }
    return null;
  }

  /**
   * Whether another cursor claims the object. Targets conflict with other cursors' running actions,
   * references and selections; references only conflict with other cursors' running actions.
   */
  private isClaimedByOther(objectId: string, cursorId: string, kind: 'target' | 'reference'): boolean {
    for (const [owner, claims] of this._runClaims) {
      if (owner !== cursorId && claims.has(objectId)) {
        return true;
      }
    }
    if (kind === 'reference') {
      return false;
    }
    for (const [owner, references] of this._runReferences) {
      if (owner !== cursorId && references.has(objectId)) {
        return true;
      }
    }
    for (const [owner, selection] of this._selections) {
      if (owner !== cursorId && selection.expanded.has(objectId)) {
        return true;
      }
    }
    return false;
  }

  // ─── Selection display ──────────────────────────────────────────────────────

  private showSelection(cursorId: string): void {
    const explicit = this._selections.get(cursorId)?.ids ?? [];
    const running = this._running.get(cursorId);
    const shown = running && !running.settled && running.executing ? [...explicit, ...running.displayIds] : [...explicit];
    this._core.agenticCursorManager.setSelectedObjectIds(cursorId, Array.from(new Set(shown)));
  }

  /** Drops deleted objects from explicit selections. */
  private pruneSelections(): void {
    if (this._selections.size === 0) {
      return;
    }
    const map = this._core.store.objects as ObjectMap | undefined;
    if (!map) {
      return;
    }
    for (const [cursorId, selection] of Array.from(this._selections)) {
      const ids = selection.ids.filter(id => !!map.findById(id));
      if (ids.length !== selection.ids.length) {
        this.setSelection(cursorId, ids);
      }
    }
  }

  private updateActivity(cursorId: string): void {
    const running = this._running.get(cursorId);
    const activeAction = running && !running.settled ? running.action.type : null;
    const queueLength = this._queues.get(cursorId)?.filter(run => !run.settled).length ?? 0;
    this._core.agenticCursorManager.setActivity(cursorId, activeAction, queueLength);
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  private ensureSubscribed(): void {
    if (this._subscribed) {
      return;
    }
    this._subscribed = true;
    const cursors = this._core.agenticCursorManager;
    this._unsubscribers.push(
      cursors.onBeforeFrame(now => this.handleBeforeFrame(now)),
      cursors.onRemoved(id => this.handleCursorRemoved(id)),
    );
    cursors.setHistoryProvider(cursorId => {
      const map = this._core.store.objects as ObjectMap | undefined;
      if (!map || !map.isReady || typeof map.getAgentUndoState !== 'function') {
        return { canUndo: false, canRedo: false };
      }
      const state = map.getAgentUndoState(cursorId);
      return { canUndo: state.canUndo, canRedo: state.canRedo };
    });
  }

  private handleCursorRemoved(cursorId: string): void {
    this._running.get(cursorId)?.abort('cursor-removed');
    const queue = this._queues.get(cursorId);
    if (queue) {
      queue.splice(0).forEach(run => this.settleQueued(run, 'cursor-removed'));
      this._queues.delete(cursorId);
    }
    this._selections.delete(cursorId);
    const map = this._core.store.objects as ObjectMap | undefined;
    if (map && typeof map.disposeAgent === 'function') {
      // After a possibly deferred rollback of the running action (FIFO).
      this.runOrDefer(map, () => map.disposeAgent(cursorId));
    }
  }

  private bindMap(map: ObjectMap): void {
    if (this._boundMaps.has(map)) {
      return;
    }
    this._boundMaps.add(map);
    map.onBeforeDestroy(() => this.cancelAll(this._disposing ? 'engine-disconnected' : 'workspace-changed', map));
    // The user (or host code) wrote an object an agent is working on, e.g. a z-order change
    // or engine.updateObject: the user has taken it over, so the agent stops and keeps its progress.
    map.onLocalObjectsChange(keys => {
      for (const run of Array.from(this._running.values())) {
        if (run.settled || !run.executing || run.map !== map) {
          continue;
        }
        const checked = run.checkedIds();
        const hit = Array.from(keys).filter(id => checked.has(id));
        if (hit.length > 0) {
          run.abort('user-interaction', hit);
        }
      }
    });
  }

  /** Cancels running and queued actions; with a map, only runs bound to it are rolled back. */
  private cancelAll(reason: KritzelAgenticActionFailureReason, map: ObjectMap | null): void {
    // Finish deferred work for the map while it is still alive.
    this.drainDeferred(true, map);
    for (const run of Array.from(this._running.values())) {
      if (!map || run.map === map || !run.map) {
        run.abort(reason, undefined, { sync: true });
      }
    }
    for (const [cursorId, queue] of Array.from(this._queues)) {
      queue.splice(0).forEach(run => this.settleQueued(run, reason));
      this.updateActivity(cursorId);
    }
    for (const cursorId of Array.from(this._selections.keys())) {
      this._selections.delete(cursorId);
      this.showSelection(cursorId);
    }
    this._runClaims.clear();
    this._runReferences.clear();
  }

  private runOrDefer(map: ObjectMap, task: () => void): void {
    if (this._deferred.length > 0 || map.isInsideYjsCallback) {
      this.defer(map, task);
      return;
    }
    task();
  }

  private defer(map: ObjectMap | null, task: () => void): void {
    this._deferred.push({ map, run: task });
    this.scheduleDrain();
  }

  private scheduleDrain(): void {
    if (this._deferredScheduled) {
      return;
    }
    this._deferredScheduled = true;
    queueMicrotask(() => {
      this._deferredScheduled = false;
      this.drainDeferred(false);
    });
  }

  /**
   * Runs deferred tasks in order. With `force`, tasks run even inside a Yjs callback (best effort,
   * used during teardown); otherwise draining waits until the callback is over.
   */
  private drainDeferred(force: boolean, onlyMap?: ObjectMap | null): void {
    let index = 0;
    while (index < this._deferred.length) {
      const task = this._deferred[index];
      if (onlyMap && task.map !== onlyMap) {
        index++;
        continue;
      }
      if (!force && task.map?.isInsideYjsCallback) {
        this.scheduleDrain();
        return;
      }
      this._deferred.splice(index, 1);
      try {
        task.run();
      } catch (error) {
        if (!(error instanceof KritzelAgenticAbortError)) {
          console.error('[Kritzel] Deferred agentic action task failed:', error);
        }
      }
    }
  }
}
