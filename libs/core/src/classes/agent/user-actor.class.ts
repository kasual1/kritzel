import type { KritzelCore } from '../core/core.class';
import type { KritzelAgenticAction, KritzelAgenticActionOptions, KritzelAgenticActionResult } from '../../interfaces/agentic-action.interface';
import type {
  KritzelAgentTool,
  KritzelAgentToolResult,
  KritzelAgentToolsOptions,
  KritzelCanvasObject,
  KritzelCanvasSnapshot,
  KritzelObserveOptions,
} from '../../interfaces/agent.interface';
import type { KritzelToolActor } from './agent-tools';
import { createActorTools } from './agent-tools';
import { buildCanvasSnapshot, describeObject } from './agent-snapshot';
import { inspectObjectElements, type KritzelInspectElementsOptions } from './agent-elements';
import { ObjectHelper } from '../../helpers/object.helper';

/**
 * Acts on the canvas as the local user, without a cursor: its actions are instant, change the user's selection
 * and land in the user's history. A chat session uses one when it has no agent.
 * @internal
 */
export class KritzelUserActor implements KritzelToolActor {
  readonly kind = 'user' as const;
  readonly id: string;
  /** Kept changes of actions with the same group become one step of the user's history (e.g. one prompt). */
  historyGroup: string | undefined;
  private _core: KritzelCore | null = null;

  constructor(id: string = `user-actor-${ObjectHelper.generateUUID(12)}`) {
    this.id = id;
  }

  get isAdded(): boolean {
    return this._core !== null;
  }

  /** The core the actor is registered with. */
  get _owner(): KritzelCore | null {
    return this._core;
  }

  /** Registers the actor with a core. */
  _attach(core: KritzelCore): void {
    if (this._core === core) {
      return;
    }
    this._detach();
    core.agenticActionManager.registerUserActor(this.id);
    this._core = core;
  }

  /** Unregisters the actor: its running action is rolled back and its queued actions settle. */
  _detach(): void {
    const core = this._core;
    this._core = null;
    core?.agenticActionManager.unregisterUserActor(this.id);
  }

  perform(action: KritzelAgenticAction, options: KritzelAgenticActionOptions = {}): Promise<KritzelAgenticActionResult> {
    const core = this.requireCore();
    return core.agenticActionManager.perform(this.id, action, { ...options, historyGroup: this.historyGroup });
  }

  /** Stops the running action (rolled back) and drops the queued ones. */
  cancel(): void {
    this._core?.agenticActionManager.cancel(this.id);
  }

  async observe(options: KritzelObserveOptions = {}): Promise<KritzelCanvasSnapshot> {
    return buildCanvasSnapshot(this.requireCore(), { kind: 'user', id: this.id }, options);
  }

  tools(options: KritzelAgentToolsOptions = {}): KritzelAgentTool[] {
    return createActorTools(this, options);
  }

  _whenIdle(): Promise<void> {
    return this._core ? this._core.agenticActionManager.whenIdle(this.id) : Promise.resolve();
  }

  /** The elements inside an object's content, for `inspect_elements`. @internal */
  _inspectElements(objectId: string, options: KritzelInspectElementsOptions = {}): Promise<KritzelAgentToolResult> {
    if (!this._core) {
      return Promise.resolve({ completed: false, reason: 'agent-removed' });
    }
    return inspectObjectElements(this._core, objectId, options);
  }

  _describeObjects(objectIds: string[]): KritzelCanvasObject[] {
    const core = this.requireCore();
    const theme = core.themeManager?.currentTheme ?? 'light';
    return objectIds
      .map(id => core.store.objects.findById(id))
      .filter((object): object is NonNullable<typeof object> => !!object)
      .map(object => describeObject(object, theme));
  }

  private requireCore(): KritzelCore {
    if (!this._core) {
      throw new Error('The user actor is not added to an editor.');
    }
    return this._core;
  }
}
