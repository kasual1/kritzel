import type { KritzelCore } from '../core/core.class';
import type { IKritzelUser } from '../../interfaces/user.interface';
import type { KritzelPoint } from '../../interfaces/point.interface';
import type {
  KritzelAgenticAnchor,
  KritzelAgenticMoveOptions,
  KritzelAgenticMoveResult,
  KritzelAgenticObjectTarget,
  KritzelAgenticPointTarget,
  KritzelAgenticTarget,
} from '../../interfaces/agentic-cursor.interface';
import type {
  KritzelAgenticAction,
  KritzelAgenticActionFailureReason,
  KritzelAgenticActionOptions,
  KritzelAgenticActionResult,
  KritzelAgenticCreateShapeAction,
  KritzelAgenticOrder,
  KritzelAgenticCreateTextAction,
  KritzelAgenticDrawLineAction,
  KritzelAgenticEditLineAction,
  KritzelAgenticUpdateIframeAction,
  KritzelAgenticLineStyle,
  KritzelAgenticObjectStyle,
  KritzelAgenticResizeObjectAction,
  KritzelAgenticStrokeStyle,
} from '../../interfaces/agentic-action.interface';
import type { KritzelBaseObject } from '../objects/base-object.class';
import type {
  KritzelAgentEventMap,
  KritzelAgentOptions,
  KritzelAgentPresence,
  KritzelAgentState,
  KritzelAgentTool,
  KritzelAgentToolsOptions,
  KritzelCanvasObject,
  KritzelCanvasSnapshot,
  KritzelObserveOptions,
} from '../../interfaces/agent.interface';
import { KritzelUserColorHelper } from '../../helpers/user-color.helper';
import { ObjectHelper } from '../../helpers/object.helper';
import { KritzelAgentActionError } from './agent-action-error.class';
import { createAgentTools } from './agent-tools';
import { buildCanvasSnapshot, describeObject } from './agent-snapshot';
import { KritzelEventHelper } from '../../helpers/event.helper';
import { isElementTarget } from '../../helpers/agentic-geometry.helper';

/** Brand that identifies agents across copies of `@kritzel/core`. */
export const KRITZEL_AGENT_BRAND = Symbol.for('kritzel.agent');

/** Reasons that mean someone else took over the objects of a running action. */
const INTERRUPTING_REASONS: ReadonlySet<KritzelAgenticActionFailureReason> = new Set([
  'user-selected',
  'user-interaction',
  'collaborator-editing',
  'conflict',
]);

type AgentListener<K extends keyof KritzelAgentEventMap> = (payload: KritzelAgentEventMap[K]) => void;

/** Whether the cursor can start at a position: any point or object target, or an element target the object can resolve. */
function canStartAt(core: KritzelCore, target: KritzelAgenticTarget): boolean {
  if (!isElementTarget(target)) {
    return true;
  }
  return target.selector.trim() !== '' && ObjectHelper.isKritzelElementAwareObject(core.store.objects?.findById(target.objectId));
}

/** Whether a value is a `KritzelAgent`, also when it comes from another copy of `@kritzel/core`. */
export function isKritzelAgent(value: unknown): value is KritzelAgent {
  return !!value && typeof value === 'object' && (value as Record<symbol, unknown>)[KRITZEL_AGENT_BRAND] === true;
}

/**
 * A participant on the canvas that is driven by code instead of a pointer, for example an AI agent.
 *
 * An agent has a cursor that flies to its targets, a name and color like a user, and its own
 * selection, action queue and undo history. Create it, add it to an editor with
 * `editor.addAgent(agent)`, then let it act:
 *
 * ```ts
 * const agent = new KritzelAgent({ name: 'Planner', color: '#7C3AED' });
 * await editor.addAgent(agent);
 * await agent.createShape({ x: 0, y: 0, width: 160, height: 80, text: 'Idea' });
 * ```
 *
 * Agents never take objects away from people: an action whose objects the user has selected or is
 * editing is refused or stopped, and the reason is reported in its result.
 */
export class KritzelAgent implements IKritzelUser {
  /** @internal */
  readonly [KRITZEL_AGENT_BRAND] = true;
  /** Keeps Vue from wrapping the agent in a reactive proxy. @internal */
  readonly __v_skip = true;
  /** Always `'agent'`. */
  readonly kind = 'agent' as const;
  /** Unique ID; the `userId` of the objects the agent creates. */
  readonly id: string;

  private _name: string;
  private _color: string;
  private _avatarUrl?: string;
  private _speed?: number;
  private _broadcast: boolean;
  private _status: string | null;
  private _visible: boolean;
  private _initialPosition?: KritzelAgenticTarget;
  private _core: KritzelCore | null = null;
  private _subscriptions: (() => void)[] = [];
  private readonly _listeners = new Map<keyof KritzelAgentEventMap, Set<(payload: unknown) => void>>();
  private _task: { cancelled: boolean } | null = null;
  private _lastStateKey: string | null = null;

  constructor(options: KritzelAgentOptions) {
    if (!options || typeof options.name !== 'string' || options.name.trim() === '') {
      throw new TypeError('A KritzelAgent needs a non-empty "name".');
    }
    this.id = options.id ?? `agent-${ObjectHelper.generateUUID(12)}`;
    this._name = options.name;
    this._color = options.color || KritzelUserColorHelper.generateColorFromName(options.name);
    this._avatarUrl = options.avatarUrl;
    this._speed = options.speed;
    this._broadcast = options.broadcast ?? true;
    this._status = options.status || null;
    this._visible = options.visible ?? true;
    this._initialPosition = options.position;
  }

  // ─── Identity ───────────────────────────────────────────────────────────────

  /** Name shown on the cursor label and in the avatar tooltip. */
  get name(): string {
    return this._name;
  }

  set name(name: string) {
    this._name = name;
    this._core?.agenticCursorManager.refresh(this.id);
    this.notifyChange();
  }

  /** Same as `name` (`IKritzelUser`). */
  get displayName(): string {
    return this._name;
  }

  /** Any CSS color. */
  get color(): string {
    return this._color;
  }

  set color(color: string) {
    this._color = color;
    this._core?.agenticCursorManager.refresh(this.id);
    this.notifyChange();
  }

  /** URL of the avatar image. */
  get avatarUrl(): string | undefined {
    return this._avatarUrl;
  }

  set avatarUrl(url: string | undefined) {
    this._avatarUrl = url;
    this.notifyChange();
  }

  /** Same as `avatarUrl` (`IKritzelUser`). */
  get profileImageUrl(): string | undefined {
    return this._avatarUrl;
  }

  /** Default speed of moves and actions in screen pixels per second; `undefined` uses 1200. */
  get speed(): number | undefined {
    return this._speed;
  }

  set speed(speed: number | undefined) {
    this._speed = speed;
  }

  /** Whether collaborators see the agent. */
  get broadcast(): boolean {
    return this._broadcast;
  }

  set broadcast(broadcast: boolean) {
    this._broadcast = broadcast;
    this.notifyChange();
  }

  /** Whether the agent is added to an editor. */
  get isAdded(): boolean {
    return this._core !== null;
  }

  /** A snapshot of the agent's state. */
  get state(): KritzelAgentState {
    const core = this._core;
    const cursor = core?.agenticCursorManager.get(this.id);
    if (!core || !cursor) {
      return {
        isAdded: false,
        position: null,
        attachedTo: null,
        isMoving: false,
        status: this._status,
        visible: this._visible,
        selection: [],
        activeAction: null,
        queueLength: 0,
        canUndo: false,
        canRedo: false,
      };
    }
    return {
      isAdded: true,
      position: cursor.position,
      attachedTo: cursor.attachedTo,
      isMoving: cursor.isMoving,
      status: this._status,
      visible: this._visible,
      selection: core.agenticActionManager.getSelection(this.id),
      activeAction: cursor.activeAction,
      queueLength: cursor.queueLength,
      canUndo: cursor.canUndo,
      canRedo: cursor.canRedo,
    };
  }

  // ─── Presence ───────────────────────────────────────────────────────────────

  /** Shows a status message below the cursor label; `null` or `''` hides it. */
  setStatus(status: string | null): void {
    this._status = status || null;
    this._core?.agenticCursorManager.refresh(this.id);
    this.notifyChange();
  }

  /** Shows the cursor. */
  show(): void {
    this.setVisible(true);
  }

  /** Hides the cursor. The agent keeps working. */
  hide(): void {
    this.setVisible(false);
  }

  /**
   * Moves the cursor to a world point, to an anchor on an object, or to an element inside an object
   * (`{ objectId, selector }`, e.g. a button in the page of a `KritzelIframeObject`), where it sticks by default.
   * Resolves when it arrives; `completed: false` when another move, an action or the agent's removal interrupted it.
   * A running action of the agent stops with `'agent-moved'`.
   *
   * A move to an element first asks the object where the element is: it rejects when the object can't point at
   * elements, isn't mounted or has no visible element that matches the selector, and until then the cursor keeps
   * its current move and attachment. While stuck to the element, the cursor follows it inside the content.
   */
  async moveTo(target: KritzelAgenticTarget, options: KritzelAgenticMoveOptions = {}): Promise<KritzelAgenticMoveResult> {
    const core = this.requireCore();
    return core.agenticCursorManager.move(this.id, target, { ...options, speed: options.speed ?? this._speed });
  }

  /** Releases the cursor from the object it sticks to. It stays where it is. */
  detach(): void {
    if (this._core?.agenticCursorManager.get(this.id)?.attachedTo) {
      this._core.agenticCursorManager.detach(this.id);
    }
  }

  // ─── Actions ────────────────────────────────────────────────────────────────

  /**
   * Performs an action: the cursor flies to the target, presses and animates the change. Actions of one
   * agent run one after another, in call order. Resolves when the action ends; `completed: false` with a
   * `reason` when it was refused or stopped. An action started while a `task()` runs belongs to that task:
   * such a result throws `KritzelAgentActionError` if the task is still running when the action ends.
   * Rejects for invalid actions and when the agent is not added to an editor.
   */
  async perform(action: KritzelAgenticAction, options: KritzelAgenticActionOptions = {}): Promise<KritzelAgenticActionResult> {
    const core = this.requireCore();
    // Decided when the action starts: an action started before a task, or by a task that has ended, never throws.
    const task = this._task;
    if (task?.cancelled) {
      return this.settle(action, { completed: false, reason: 'aborted' }, task);
    }
    const result = await core.agenticActionManager.perform(this.id, action, { ...options, speed: options.speed ?? this._speed });
    return this.settle(action, result, task);
  }

  /**
   * Presses at a point or object anchor. Nothing changes; `objectIds` holds the object under the cursor.
   * Elements inside objects can't be clicked; use `moveTo({ objectId, selector })` to point at one.
   */
  click(target: KritzelAgenticPointTarget | KritzelAgenticObjectTarget, options: { count?: 1 | 2 } & KritzelAgenticActionOptions = {}): Promise<KritzelAgenticActionResult> {
    const { count, ...actionOptions } = options;
    return this.perform({ type: 'click', target, ...(count ? { count } : {}) }, actionOptions);
  }

  /** Selects top-level objects for the agent. Never changes the user's selection. */
  select(objectIds: string[], options: { additive?: boolean } & KritzelAgenticActionOptions = {}): Promise<KritzelAgenticActionResult> {
    const { additive, ...actionOptions } = options;
    return this.perform({ type: 'select', objectIds, ...(additive !== undefined ? { additive } : {}) }, actionOptions);
  }

  /** Clears the agent's selection. */
  clearSelection(options: KritzelAgenticActionOptions = {}): Promise<KritzelAgenticActionResult> {
    return this.perform({ type: 'clearSelection' }, options);
  }

  /** Drags an object so that its `align` point (default `'center'`) lands on `to`. */
  moveObject(
    objectId: string,
    to: KritzelAgenticPointTarget | KritzelAgenticObjectTarget,
    options: { align?: KritzelAgenticAnchor } & KritzelAgenticActionOptions = {},
  ): Promise<KritzelAgenticActionResult> {
    const { align, ...actionOptions } = options;
    return this.perform({ type: 'moveObject', objectId, to, ...(align ? { align } : {}) }, actionOptions);
  }

  /** Resizes an object by dragging a corner handle. */
  resizeObject(
    objectId: string,
    size: Omit<KritzelAgenticResizeObjectAction, 'type' | 'objectId'>,
    options: KritzelAgenticActionOptions = {},
  ): Promise<KritzelAgenticActionResult> {
    return this.perform({ ...size, type: 'resizeObject', objectId }, options);
  }

  /** Rotates an object to `angle` degrees clockwise, or by `angle` with `relative: true`. */
  rotateObject(objectId: string, angle: number, options: { relative?: boolean } & KritzelAgenticActionOptions = {}): Promise<KritzelAgenticActionResult> {
    const { relative, ...actionOptions } = options;
    return this.perform({ type: 'rotateObject', objectId, angle, ...(relative !== undefined ? { relative } : {}) }, actionOptions);
  }

  /**
   * Duplicates objects by Alt-dragging them so that the copies' center lands on `to` (by default right next to the
   * originals). `objectIds` holds the copies' IDs.
   */
  copyObjects(
    objectIds: string[],
    options: { to?: KritzelAgenticPointTarget | KritzelAgenticObjectTarget } & KritzelAgenticActionOptions = {},
  ): Promise<KritzelAgenticActionResult> {
    const { to, ...actionOptions } = options;
    return this.perform({ type: 'copyObjects', objectIds, ...(to ? { to } : {}) }, actionOptions);
  }

  /** Groups at least two objects. `objectIds` holds the group's ID. */
  groupObjects(objectIds: string[], options: KritzelAgenticActionOptions = {}): Promise<KritzelAgenticActionResult> {
    return this.perform({ type: 'groupObjects', objectIds }, options);
  }

  /** Dissolves groups. `objectIds` holds their children's IDs. */
  ungroupObjects(objectIds: string[], options: KritzelAgenticActionOptions = {}): Promise<KritzelAgenticActionResult> {
    return this.perform({ type: 'ungroupObjects', objectIds }, options);
  }

  /** Moves objects to the front or back of the stacking order, or one layer forward or backward. */
  orderObjects(objectIds: string[], order: KritzelAgenticOrder, options: KritzelAgenticActionOptions = {}): Promise<KritzelAgenticActionResult> {
    return this.perform({ type: 'orderObjects', objectIds, order }, options);
  }

  /** Drags out a new shape. `objectIds` holds its ID. */
  createShape(shape: Omit<KritzelAgenticCreateShapeAction, 'type'>, options: KritzelAgenticActionOptions = {}): Promise<KritzelAgenticActionResult> {
    return this.perform({ ...shape, type: 'createShape' }, options);
  }

  /** Creates a text object and types into it. `objectIds` holds its ID. */
  createText(text: Omit<KritzelAgenticCreateTextAction, 'type'>, options: KritzelAgenticActionOptions = {}): Promise<KritzelAgenticActionResult> {
    return this.perform({ ...text, type: 'createText' }, options);
  }

  /** Types into a text or shape; `mode: 'replace'` clears it first. */
  typeText(
    objectId: string,
    text: string,
    options: { mode?: 'append' | 'replace' } & KritzelAgenticActionOptions = {},
  ): Promise<KritzelAgenticActionResult> {
    const { mode, ...actionOptions } = options;
    return this.perform({ type: 'typeText', objectId, text, ...(mode ? { mode } : {}) }, actionOptions);
  }

  /** Draws a freehand stroke through the world points. */
  drawPath(points: KritzelPoint[], options: { style?: KritzelAgenticStrokeStyle } & KritzelAgenticActionOptions = {}): Promise<KritzelAgenticActionResult> {
    const { style, ...actionOptions } = options;
    return this.perform({ type: 'drawPath', points, ...(style ? { style } : {}) }, actionOptions);
  }

  /** Draws a line from one object to another and anchors both ends, so it follows them. */
  connect(from: string, to: string, options: { style?: KritzelAgenticLineStyle } & KritzelAgenticActionOptions = {}): Promise<KritzelAgenticActionResult> {
    const { style, ...actionOptions } = options;
    return this.perform({ type: 'connect', from, to, ...(style ? { style } : {}) }, actionOptions);
  }

  /**
   * Draws a line like the line tool: each end is a free point or an object (the end then follows it), and
   * `through` curves the line through a point halfway along it.
   */
  drawLine(line: Omit<KritzelAgenticDrawLineAction, 'type'>, options: KritzelAgenticActionOptions = {}): Promise<KritzelAgenticActionResult> {
    return this.perform({ type: 'drawLine', ...line }, options);
  }

  /** Changes a line with its handles: moves or attaches its ends, and curves or straightens it. */
  editLine(lineId: string, changes: Omit<KritzelAgenticEditLineAction, 'type' | 'lineId'>, options: KritzelAgenticActionOptions = {}): Promise<KritzelAgenticActionResult> {
    return this.perform({ type: 'editLine', lineId, ...changes }, options);
  }

  /**
   * Replaces parts of an iframe's code (`html`, `css`, `script`) and its name; parts left out stay. The iframe
   * reloads with the new code.
   */
  updateIframe(
    objectId: string,
    changes: Omit<KritzelAgenticUpdateIframeAction, 'type' | 'objectId'>,
    options: KritzelAgenticActionOptions = {},
  ): Promise<KritzelAgenticActionResult> {
    return this.perform({ type: 'updateIframe', objectId, ...changes }, options);
  }

  /** Restyles top-level objects; groups style their children. Fields that don't apply to an object are ignored. */
  setStyle(objectIds: string[], style: KritzelAgenticObjectStyle, options: KritzelAgenticActionOptions = {}): Promise<KritzelAgenticActionResult> {
    return this.perform({ type: 'setStyle', objectIds, style }, options);
  }

  /**
   * Places an object the app built, e.g. `new KritzelIframeObject({ ... })`, as the agent's change: the
   * cursor hops there and the object appears. The object gets a fresh ID (also in `objectIds`).
   * Unlike `editor.addObject()`, the user's selection and undo history stay untouched.
   */
  addObject(object: KritzelBaseObject<any>, options: KritzelAgenticActionOptions = {}): Promise<KritzelAgenticActionResult> {
    return this.perform({ type: 'addObject', object }, options);
  }

  /** Deletes top-level objects. */
  deleteObjects(objectIds: string[], options: KritzelAgenticActionOptions = {}): Promise<KritzelAgenticActionResult> {
    return this.perform({ type: 'deleteObjects', objectIds }, options);
  }

  /** Undoes the agent's last action. Never touches the user's or other agents' history. */
  undo(options: KritzelAgenticActionOptions = {}): Promise<KritzelAgenticActionResult> {
    return this.perform({ type: 'undo' }, options);
  }

  /** Redoes the agent's last undone action. */
  redo(options: KritzelAgenticActionOptions = {}): Promise<KritzelAgenticActionResult> {
    return this.perform({ type: 'redo' }, options);
  }

  /**
   * Stops the running action (its changes are rolled back) and drops the queued ones; they resolve
   * with `reason: 'aborted'`. While a `task()` runs, every action started later resolves (and throws) as
   * aborted until the task returns.
   */
  cancel(): void {
    if (this._task) {
      this._task.cancelled = true;
    }
    this._core?.agenticActionManager.cancel(this.id);
  }

  /**
   * Runs a script of actions as one task: `label` is shown as the status while it runs, and the first
   * action that does not complete throws a `KritzelAgentActionError` out of `fn`. `cancel()` stops the
   * task. Every action of the agent started while the task runs belongs to it, also one started outside `fn`.
   * An agent runs one task at a time.
   */
  async task<T>(label: string, fn: () => Promise<T> | T): Promise<T> {
    if (this._task) {
      throw new Error(`Agent "${this.id}" is already running a task.`);
    }
    const task = { cancelled: false };
    this._task = task;
    const previousStatus = this._status;
    this.setStatus(label);
    try {
      return await fn();
    } finally {
      if (this._task === task) {
        this._task = null;
      }
      this.setStatus(previousStatus);
    }
  }

  // ─── LLM tools ──────────────────────────────────────────────────────────────

  /**
   * Tool definitions for any LLM framework: `observe_canvas` plus one tool per action (`create_shape`,
   * `move_object`, `connect`, `set_style`, …) and the viewport tools `set_viewport` and `fit_viewport`, which pan
   * and zoom the local user's view. Hand `name`, `description` and `inputSchema` to the model and
   * call `run(input, { signal })` with its input; the result is JSON for the model. `only` limits what the
   * model may do.
   */
  tools(options: KritzelAgentToolsOptions = {}): KritzelAgentTool[] {
    return createAgentTools(this, options);
  }

  /**
   * What the agent sees of the canvas: the viewport, the user's selection, its own cursor and selection, and
   * the objects with their geometry, text, connections and style. Rejects while the agent is not added.
   */
  async observe(options: KritzelObserveOptions = {}): Promise<KritzelCanvasSnapshot> {
    return buildCanvasSnapshot(this.requireCore(), this.id, options);
  }

  /** Resolves when the agent has no running or queued action. @internal */
  _whenIdle(): Promise<void> {
    return this._core ? this._core.agenticActionManager.whenIdle(this.id) : Promise.resolve();
  }

  /** Snapshot entries of objects, for tool results. @internal */
  _describeObjects(objectIds: string[]): KritzelCanvasObject[] {
    const core = this.requireCore();
    const theme = core.themeManager?.currentTheme ?? 'light';
    return objectIds
      .map(id => core.store.objects.findById(id))
      .filter((object): object is NonNullable<typeof object> => !!object)
      .map(object => describeObject(object, theme));
  }

  // ─── Events ─────────────────────────────────────────────────────────────────

  /** Subscribes to an event; returns a function that unsubscribes. */
  on<K extends keyof KritzelAgentEventMap>(event: K, listener: AgentListener<K>): () => void {
    let listeners = this._listeners.get(event);
    if (!listeners) {
      listeners = new Set();
      this._listeners.set(event, listeners);
    }
    listeners.add(listener as (payload: unknown) => void);
    return () => listeners!.delete(listener as (payload: unknown) => void);
  }

  /** How the agent is shown in avatar stacks and `agentsChange`. */
  toPresence(): KritzelAgentPresence {
    const state = this.state;
    return {
      id: this.id,
      kind: 'agent',
      name: this._name,
      displayName: this._name,
      color: this._color,
      ...(this._avatarUrl ? { avatarUrl: this._avatarUrl, profileImageUrl: this._avatarUrl } : {}),
      status: state.status,
      visible: state.visible,
      activeAction: state.activeAction,
      queueLength: state.queueLength,
      isRemote: false,
    };
  }

  // ─── Lifecycle (called by the editor's agent manager) ───────────────────────

  /** The core the agent is added to. @internal */
  get _owner(): KritzelCore | null {
    return this._core;
  }

  /** Creates the cursor in `core` and starts listening. Throws if the cursor can't be created. @internal */
  _attach(core: KritzelCore): void {
    // The start position may name an object that is gone, that this editor's document never had (an agent added
    // again, or moved from a removed editor), that has no position, or that can't point at elements for an element
    // target: the cursor then starts at the viewport center.
    const initial = this._initialPosition;
    const start = initial && canStartAt(core, initial) ? core.agenticCursorManager.resolveTarget(initial) : null;
    const position = start && Number.isFinite(start.x) && Number.isFinite(start.y) ? initial : undefined;
    // The cursor reads how it looks from the agent, so name, color, status and visibility live only here.
    const agent = this;
    const cursor = {
      id: this.id,
      appearance: {
        get name() {
          return agent._name;
        },
        get color() {
          return agent._color;
        },
        get status() {
          return agent._status;
        },
        get visible() {
          return agent._visible;
        },
      },
    };
    try {
      core.agenticCursorManager.add({ ...cursor, position });
    } catch (error) {
      // The object can still refuse to track the start element, for example a selector the browser can't parse or
      // one more element than it can track: the cursor then starts at the viewport center too.
      if (!position || !isElementTarget(position)) {
        throw error;
      }
      core.agenticCursorManager.add(cursor);
    }
    this._core = core;
    this._lastStateKey = null;
    this._subscriptions = [
      core.agenticCursorManager.onChange(id => {
        if (id === undefined || id === this.id) {
          this.notifyChange();
        }
      }),
      core.agenticCursorManager.onDetached(event => {
        if (event.id === this.id) {
          this.emit('detached', { objectId: event.objectId, reason: event.reason });
        }
      }),
      core.agenticActionManager.onActionSettled(event => {
        if (event.cursorId !== this.id) {
          return;
        }
        const reason = event.result.reason;
        if (event.executing && !event.result.completed && reason && INTERRUPTING_REASONS.has(reason)) {
          this.emit('interrupted', {
            action: event.action,
            reason,
            objectIds: event.result.objectIds ?? [],
            keptChanges: event.keptChanges,
          });
        }
        // The agent's history may have changed.
        this.notifyChange();
      }),
    ];
    this.notifyChange();
  }

  /** Removes the cursor (its running action is rolled back) and stops listening. @internal */
  _detach(): void {
    const core = this._core;
    if (!core) {
      return;
    }
    this._subscriptions.forEach(unsubscribe => unsubscribe());
    this._subscriptions = [];
    core.agenticCursorManager.remove(this.id);
    this._core = null;
    this._lastStateKey = null;
    this.notifyChange();
    this.emit('removed', undefined);
  }

  // ─── Internals ──────────────────────────────────────────────────────────────

  private setVisible(visible: boolean): void {
    this._visible = visible;
    this._core?.agenticCursorManager.refresh(this.id);
    this.notifyChange();
  }

  private requireCore(): KritzelCore {
    if (!this._core) {
      throw new Error(`Agent "${this.id}" is not added to an editor. Call editor.addAgent(agent) first.`);
    }
    return this._core;
  }

  private settle(
    action: KritzelAgenticAction,
    result: KritzelAgenticActionResult,
    task: { cancelled: boolean } | null,
  ): KritzelAgenticActionResult {
    if (task && task === this._task && !result.completed) {
      throw new KritzelAgentActionError(action, result);
    }
    return result;
  }

  /** Emits `change` when the state differs from the last emitted one (plain motion is ignored). */
  private notifyChange(): void {
    if (!this._listeners.get('change')?.size) {
      this._lastStateKey = null;
      return;
    }
    const state = this.state;
    const { position: _position, ...rest } = state;
    const key = JSON.stringify([rest, this._name, this._color, this._avatarUrl, this._broadcast]);
    if (key === this._lastStateKey) {
      return;
    }
    this._lastStateKey = key;
    this.emit('change', state);
  }

  private emit<K extends keyof KritzelAgentEventMap>(event: K, payload: KritzelAgentEventMap[K]): void {
    this._listeners.get(event)?.forEach(listener => KritzelEventHelper.callListener(() => listener(payload), `Agent "${event}" listener`));
  }
}
