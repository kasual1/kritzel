import type { UpdrawCore } from '../core/core.class';
import { UpdrawAgent, isUpdrawAgent } from '../agent/agent.class';
import type { UpdrawAgentPresence } from '../../interfaces/agent.interface';
import { UpdrawEventHelper } from '../../helpers/event.helper';

/**
 * The agents added to one editor. Behind `editor.addAgent()`, `removeAgent()`, `getAgent()`,
 * `getAgents()` and the `agentsChange` event.
 *
 * An agent belongs to one editor at a time. Agents stay added when the engine is disconnected
 * (Stencil disconnects and reconnects elements that move in the DOM); an agent of an engine that was
 * torn down can be added to another editor, which removes it from the old one.
 */
export class UpdrawAgentManager {
  private readonly _core: UpdrawCore;
  private readonly _agents = new Map<string, UpdrawAgent>();
  private readonly _agentSubscriptions = new Map<string, () => void>();
  private readonly _changeListeners = new Set<() => void>();
  private _changeScheduled = false;
  private _disposed = false;

  constructor(core: UpdrawCore) {
    this._core = core;
  }

  /** Whether the engine of this core is disconnected. */
  get isDisposed(): boolean {
    return this._disposed;
  }

  /** Called by the engine when it disconnects (`true`) or connects (`false`). @internal */
  setDisposed(disposed: boolean): void {
    this._disposed = disposed;
  }

  /**
   * Adds an agent and shows its cursor. Adding the same agent again does nothing.
   * Throws for anything that is not an `UpdrawAgent`, for a second agent with the same ID, and for an
   * agent that belongs to another editor that is still connected.
   */
  add(agent: UpdrawAgent): UpdrawAgent {
    if (!isUpdrawAgent(agent)) {
      throw new TypeError('addAgent() expects an UpdrawAgent.');
    }
    const existing = this._agents.get(agent.id);
    if (existing === agent) {
      return agent;
    }
    if (existing) {
      throw new Error(`An agent with the ID "${agent.id}" is already added.`);
    }
    const owner = agent._owner;
    if (owner && owner !== this._core) {
      if (!owner.agentManager.isDisposed) {
        throw new Error(`Agent "${agent.id}" belongs to another editor. Remove it there first.`);
      }
      owner.agentManager.remove(agent);
    }

    agent._attach(this._core);
    this._agents.set(agent.id, agent);
    this._agentSubscriptions.set(agent.id, agent.on('change', () => this.scheduleChange()));
    this.scheduleChange();
    return agent;
  }

  /**
   * Removes an agent: its running action is rolled back, queued actions resolve with `'agent-removed'`,
   * and its cursor and history are dropped. Returns `false` if the agent was not added.
   */
  remove(agentOrId: UpdrawAgent | string): boolean {
    const id = typeof agentOrId === 'string' ? agentOrId : agentOrId?.id;
    const agent = id !== undefined ? this._agents.get(id) : undefined;
    if (!agent || (typeof agentOrId !== 'string' && agentOrId !== agent)) {
      return false;
    }
    this._agents.delete(agent.id);
    this._agentSubscriptions.get(agent.id)?.();
    this._agentSubscriptions.delete(agent.id);
    agent._detach();
    this.scheduleChange();
    return true;
  }

  get(id: string): UpdrawAgent | null {
    return this._agents.get(id) ?? null;
  }

  getAll(): UpdrawAgent[] {
    return Array.from(this._agents.values());
  }

  /** The added agents as shown in the avatar stack. */
  getPresences(): UpdrawAgentPresence[] {
    return this.getAll().map(agent => agent.toPresence());
  }

  /**
   * Subscribes to changes of the agent list and of what the avatar stack shows (name, color, avatar,
   * status, visibility, activity). Coalesced to one call per microtask; never called for plain motion.
   */
  onChange(listener: () => void): () => void {
    this._changeListeners.add(listener);
    return () => this._changeListeners.delete(listener);
  }

  private scheduleChange(): void {
    if (this._changeScheduled) {
      return;
    }
    this._changeScheduled = true;
    queueMicrotask(() => {
      this._changeScheduled = false;
      this._changeListeners.forEach(listener => UpdrawEventHelper.callListener(listener, 'Agents change listener'));
    });
  }
}
