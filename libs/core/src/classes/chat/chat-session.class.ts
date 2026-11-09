import type { KritzelCore } from '../core/core.class';
import type { KritzelAgent } from '../agent/agent.class';
import type { KritzelAgentTool } from '../../interfaces/agent.interface';
import type { KritzelChatBoxChip } from '../../interfaces/chat-box.interface';
import type { KritzelObjectMap } from '../structures/object-map.structure';
import {
  KRITZEL_CHAT_PROTOCOL_VERSION,
  type KritzelChatInput,
  type KritzelChatMessage,
  type KritzelChatPart,
  type KritzelChatRequest,
  type KritzelChatResponse,
  type KritzelChatSendResult,
  type KritzelChatSessionEventMap,
  type KritzelChatSessionOptions,
  type KritzelChatStreamEvent,
  type KritzelChatToolCallPart,
  type KritzelChatToolResultPart,
} from '../../interfaces/chat-session.interface';
import { KritzelUserActor } from '../agent/user-actor.class';
import { KritzelEventHelper } from '../../helpers/event.helper';

/** Brand of `KritzelChatSession`, also across bundle copies. */
export const KRITZEL_CHAT_SESSION_BRAND = Symbol.for('kritzel.chatSession');

const DEFAULT_MAX_STEPS = 25;
const DEFAULT_THINKING_STATUS = 'Thinking…';
const STOPPED_OUTPUT = JSON.stringify({ completed: false, reason: 'aborted', hint: 'The user stopped the response. Do not retry unless asked.' });
const INTERRUPTED_OUTPUT = JSON.stringify({ completed: false, reason: 'aborted', hint: 'The tool call was interrupted and did not run.' });

/** Running sessions per agent and, working as the user, per editor. */
const busyAgents = new WeakSet<object>();
const busyCores = new WeakSet<object>();

/** Whether a value is a `KritzelChatSession`, also from another bundle copy. */
export function isKritzelChatSession(value: unknown): value is KritzelChatSession {
  return typeof value === 'object' && value !== null && (value as Record<symbol, unknown>)[KRITZEL_CHAT_SESSION_BRAND] === true;
}

type SessionListener<K extends keyof KritzelChatSessionEventMap> = (payload: KritzelChatSessionEventMap[K]) => void;

/** Thrown inside a run to end it with a status. */
class RunEnd {
  constructor(readonly result: KritzelChatSendResult) {}
}

/**
 * A conversation between the user and a model that acts on the canvas.
 *
 * `send()` runs the tool loop: the session sends the conversation to your server through the `transport`,
 * runs the tool calls of the answer on the canvas, sends the results back, and repeats until the model answers
 * without tool calls. Your server holds the API key and translates between this protocol and the model's API.
 *
 * With an `agent`, the model acts as that agent (its own cursor, selection and history). Without one it works as
 * the user: instantly, on the user's selection, and each prompt's changes undo as one step of the user's history.
 *
 * Bind it to an editor with the `chatSession` property; the chat box then sends its prompts to it.
 */
export class KritzelChatSession {
  readonly [KRITZEL_CHAT_SESSION_BRAND] = true;
  /** Keeps Vue from making the session reactive. */
  readonly __v_skip = true;

  private readonly _options: KritzelChatSessionOptions;
  private readonly _maxSteps: number;
  private _messages: KritzelChatMessage[];
  private _core: KritzelCore | null = null;
  private _userActor: KritzelUserActor | null = null;
  private _running = false;
  private _abort: AbortController | null = null;
  private _promptCount = 0;
  private _idleWaiters: (() => void)[] = [];
  private _pendingDetach = false;
  /** Why the running prompt was ended from outside. */
  private _endReason: 'stopped' | 'detached' | null = null;
  private readonly _listeners = new Map<keyof KritzelChatSessionEventMap, Set<SessionListener<any>>>();

  constructor(options: KritzelChatSessionOptions) {
    if (!options || typeof options.transport !== 'function') {
      throw new TypeError('A chat session needs a transport function.');
    }
    const maxSteps = options.maxSteps ?? DEFAULT_MAX_STEPS;
    if (!Number.isInteger(maxSteps) || maxSteps < 1) {
      throw new TypeError('"maxSteps" must be a positive integer.');
    }
    this._options = { ...options };
    this._maxSteps = maxSteps;
    this._messages = closeOpenToolCalls(options.messages ?? []);
  }

  /** The conversation so far. Store it to restore the conversation later (`messages` option). */
  get messages(): readonly KritzelChatMessage[] {
    return this._messages;
  }

  /** Whether a prompt is running. */
  get running(): boolean {
    return this._running;
  }

  /** The agent the model acts as, or `null` when it works as the user. */
  get agent(): KritzelAgent | null {
    return this._options.agent ?? null;
  }

  /** `'agent'` with an agent, otherwise `'user'`. */
  get mode(): 'agent' | 'user' {
    return this._options.agent ? 'agent' : 'user';
  }

  /** Whether the session is bound to an editor. */
  get isAttached(): boolean {
    return this._core !== null;
  }

  /** The tools the model gets: the canvas tools of the agent or of the user, plus the app's tools. */
  get tools(): KritzelAgentTool[] {
    return this.buildTools();
  }

  /**
   * Sends a prompt and runs the tool loop until the model answers without tool calls. Never rejects: the
   * result tells how it ended.
   */
  async send(input: KritzelChatInput): Promise<KritzelChatSendResult> {
    const core = this._core;
    if (!core) {
      return { status: 'detached' };
    }
    const agent = this._options.agent;
    const lockKey: object = agent ?? core;
    const locks = agent ? busyAgents : busyCores;
    if (this._running || locks.has(lockKey)) {
      return { status: 'busy' };
    }
    if (agent && !agent.isAdded) {
      return { status: 'detached' };
    }
    const userMessage = toUserMessage(input);
    if (!userMessage) {
      throw new TypeError('A prompt needs text.');
    }

    locks.add(lockKey);
    this._running = true;
    const abort = new AbortController();
    this._abort = abort;
    this._promptCount++;
    if (this._userActor) {
      this._userActor.historyGroup = `chat-${this._promptCount}-${Date.now()}`;
    }
    const unsubscribe = this.watchRun(core);
    this.pushMessage(userMessage);

    let result: KritzelChatSendResult;
    try {
      result = await this.runLoop(abort.signal);
    } catch (error) {
      result = error instanceof RunEnd ? error.result : { status: 'error', error };
    } finally {
      unsubscribe();
      locks.delete(lockKey);
      this._running = false;
      this._abort = null;
      if (this._userActor) {
        this._userActor.historyGroup = undefined;
      }
    }
    if (this._endReason && result.status !== 'error') {
      result = { status: this._endReason };
    }
    this._endReason = null;
    this.emit('change', undefined);
    this.emit('end', result);
    this.resolveIdle();
    return result;
  }

  /** Stops the running prompt: the request is aborted and the running action rolled back. */
  stop(): void {
    this.endRun('stopped');
  }

  /** Subscribes to an event; returns a function that unsubscribes. */
  on<K extends keyof KritzelChatSessionEventMap>(event: K, listener: SessionListener<K>): () => void {
    let listeners = this._listeners.get(event);
    if (!listeners) {
      listeners = new Set();
      this._listeners.set(event, listeners);
    }
    listeners.add(listener);
    return () => listeners!.delete(listener);
  }

  /** Resolves when no prompt is running. */
  whenIdle(): Promise<void> {
    if (!this._running) {
      return Promise.resolve();
    }
    return new Promise(resolve => this._idleWaiters.push(resolve));
  }

  // ─── Binding ────────────────────────────────────────────────────────────────

  /** The editor core the session is bound to. @internal */
  get _owner(): KritzelCore | null {
    return this._core;
  }

  /** Binds the session to an editor core. Working as the user, it registers its actor there. @internal */
  _attach(core: KritzelCore): void {
    this._pendingDetach = false;
    if (this._core === core) {
      return;
    }
    this._detach();
    this._core = core;
    if (!this._options.agent) {
      this._userActor = new KritzelUserActor();
      this._userActor._attach(core);
    }
  }

  /** Unbinds the session: a running prompt ends with `'detached'`. @internal */
  _detach(): void {
    if (!this._core) {
      return;
    }
    this.endRun('detached');
    this._userActor?._detach();
    this._userActor = null;
    this._core = null;
  }

  /** Unbinds the session once its running prompt ends (right away when idle). @internal */
  _detachWhenIdle(): void {
    if (!this._running) {
      this._detach();
      return;
    }
    this._pendingDetach = true;
  }

  // ─── Loop ───────────────────────────────────────────────────────────────────

  /** Ends the running prompt: the abort reaches the transport and the running action, which is rolled back. */
  private endRun(reason: 'stopped' | 'detached'): void {
    if (!this._running || !this._abort) {
      return;
    }
    this._endReason ??= reason;
    this._abort.abort();
  }

  /** Ends the run when the workspace goes away or the agent is removed. */
  private watchRun(core: KritzelCore): () => void {
    const unsubscribers: (() => void)[] = [];
    const map = core.store?.objects as KritzelObjectMap<any> | undefined;
    if (map && typeof map.onBeforeDestroy === 'function') {
      unsubscribers.push(map.onBeforeDestroy(() => this.endRun('detached')));
    }
    const agent = this._options.agent;
    if (agent) {
      unsubscribers.push(agent.on('removed', () => this.endRun('detached')));
    }
    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }

  private async runLoop(signal: AbortSignal): Promise<KritzelChatSendResult> {
    const tools = this.buildTools();
    const byName = new Map(tools.map(tool => [tool.name, tool]));
    const definitions = tools.map(tool => ({ name: tool.name, description: tool.description, inputSchema: tool.inputSchema }));

    for (let step = 0; step < this._maxSteps; step++) {
      this.throwIfEnded(signal);
      const request: KritzelChatRequest = {
        version: KRITZEL_CHAT_PROTOCOL_VERSION,
        ...(this._options.system ? { system: this._options.system } : {}),
        messages: this._messages.map(cloneMessage),
        tools: definitions,
        mode: this.mode,
        ...this.resolveContext(),
      };

      const message = await this.withThinkingStatus(() => this.callTransport(request, signal));
      this.throwIfEnded(signal);
      const assistant: KritzelChatMessage = { ...message, role: 'assistant', parts: (message.parts ?? []).map(normalizePart) };
      this.pushMessage(assistant);

      const calls = assistant.parts.filter((part): part is KritzelChatToolCallPart => part.type === 'tool-call');
      if (calls.length === 0) {
        return { status: 'completed' };
      }
      const results: KritzelChatToolResultPart[] = [];
      for (const call of calls) {
        if (signal.aborted) {
          results.push({ type: 'tool-result', toolCallId: call.id, name: call.name, output: STOPPED_OUTPUT, isError: true });
          continue;
        }
        const tool = byName.get(call.name);
        if (!tool) {
          results.push({
            type: 'tool-result',
            toolCallId: call.id,
            name: call.name,
            output: JSON.stringify({ completed: false, reason: 'unknown-tool', message: `There is no tool "${call.name}".` }),
            isError: true,
          });
          continue;
        }
        try {
          const output = await tool.run(call.input, { signal });
          results.push({ type: 'tool-result', toolCallId: call.id, name: call.name, output: typeof output === 'string' ? output : JSON.stringify(output) });
        } catch (error) {
          results.push({
            type: 'tool-result',
            toolCallId: call.id,
            name: call.name,
            output: JSON.stringify({ completed: false, reason: 'error', message: error instanceof Error ? error.message : String(error) }),
            isError: true,
          });
          if (!(error instanceof Error && error.name === 'AbortError')) {
            console.error(`[Kritzel] Chat tool "${call.name}" failed:`, error);
          }
        }
      }
      this.pushMessage({ role: 'tool', parts: results });
      this.throwIfEnded(signal);
    }
    return { status: 'step-limit' };
  }

  private throwIfEnded(signal: AbortSignal): void {
    if (signal.aborted) {
      throw new RunEnd({ status: this._endReason ?? 'stopped' });
    }
  }

  private async callTransport(request: KritzelChatRequest, signal: AbortSignal): Promise<KritzelChatMessage> {
    let answer: KritzelChatResponse | AsyncIterable<KritzelChatStreamEvent>;
    try {
      answer = await this._options.transport(request, { signal });
      if (isAsyncIterable(answer)) {
        return await collectStream(answer, signal);
      }
    } catch (error) {
      if (signal.aborted) {
        throw new RunEnd({ status: this._endReason ?? 'stopped' });
      }
      throw error;
    }
    if (!answer || typeof answer !== 'object' || !answer.message || !Array.isArray(answer.message.parts)) {
      throw new Error('The chat transport returned no message.');
    }
    return answer.message;
  }

  private async withThinkingStatus<T>(fn: () => Promise<T>): Promise<T> {
    const agent = this._options.agent;
    const status = this._options.thinkingStatus ?? DEFAULT_THINKING_STATUS;
    if (!agent || status === false || !agent.isAdded) {
      return fn();
    }
    const previous = agent.state.status;
    agent.setStatus(status);
    try {
      return await fn();
    } finally {
      if (agent.isAdded && agent.state.status === status) {
        agent.setStatus(previous);
      }
    }
  }

  private buildTools(): KritzelAgentTool[] {
    const instant = !!this._options.instant;
    const canvas = this._options.agent
      ? this._options.agent.tools({ instant })
      : this._userActor
        ? this._userActor.tools()
        : new KritzelUserActor('unbound').tools();
    const names = new Set(canvas.map(tool => tool.name));
    for (const tool of this._options.tools ?? []) {
      if (names.has(tool.name)) {
        throw new Error(`The chat tool "${tool.name}" clashes with a canvas tool.`);
      }
      names.add(tool.name);
    }
    return [...canvas, ...(this._options.tools ?? [])];
  }

  private resolveContext(): { context?: Record<string, unknown> } {
    const option = this._options.context;
    const context = typeof option === 'function' ? option() : option;
    return context ? { context } : {};
  }

  private pushMessage(message: KritzelChatMessage): void {
    this._messages = [...this._messages, message];
    this.emit('message', message);
    this.emit('change', undefined);
  }

  private resolveIdle(): void {
    const waiters = this._idleWaiters.splice(0);
    waiters.forEach(resolve => resolve());
    if (this._pendingDetach) {
      this._pendingDetach = false;
      this._detach();
    }
  }

  private emit<K extends keyof KritzelChatSessionEventMap>(event: K, payload: KritzelChatSessionEventMap[K]): void {
    this._listeners.get(event)?.forEach(listener => KritzelEventHelper.callListener(() => listener(payload), 'Chat session listener'));
  }
}

function toUserMessage(input: KritzelChatInput): KritzelChatMessage | null {
  const text = typeof input === 'string' ? input : input?.text;
  if (typeof text !== 'string' || text.trim() === '') {
    return null;
  }
  const parts: KritzelChatPart[] = [{ type: 'text', text }];
  if (typeof input !== 'string') {
    const chips = describeChips(input.chips ?? []);
    if (chips) {
      parts.push({ type: 'text', text: chips });
    }
    for (const image of input.images ?? []) {
      parts.push({ type: 'image', ...image });
    }
  }
  return { role: 'user', parts };
}

/** Tells the model what the prompt refers to. */
function describeChips(chips: KritzelChatBoxChip[]): string | null {
  const lines = chips.map(chip => {
    const name = chip.detail ? `${chip.label} › ${chip.detail}` : chip.label;
    const refs = [chip.objectId ? `objectId: ${chip.objectId}` : null, chip.selector ? `element: ${chip.selector}` : null].filter(Boolean);
    return `- ${name}${refs.length > 0 ? ` (${refs.join(', ')})` : ''}`;
  });
  return lines.length > 0 ? `The prompt refers to:\n${lines.join('\n')}` : null;
}

/** Gives every tool call without a result an error result, so a restored conversation is valid. */
function closeOpenToolCalls(messages: KritzelChatMessage[]): KritzelChatMessage[] {
  const result: KritzelChatMessage[] = [];
  for (let i = 0; i < messages.length; i++) {
    const message = cloneMessage(messages[i]);
    result.push(message);
    if (message.role !== 'assistant') {
      continue;
    }
    const calls = message.parts.filter((part): part is KritzelChatToolCallPart => part.type === 'tool-call');
    if (calls.length === 0) {
      continue;
    }
    const next = messages[i + 1];
    const answered = new Set(
      next?.role === 'tool' ? next.parts.filter((part): part is KritzelChatToolResultPart => part.type === 'tool-result').map(part => part.toolCallId) : [],
    );
    const missing = calls
      .filter(call => !answered.has(call.id))
      .map<KritzelChatToolResultPart>(call => ({ type: 'tool-result', toolCallId: call.id, name: call.name, output: INTERRUPTED_OUTPUT, isError: true }));
    if (missing.length === 0) {
      continue;
    }
    if (next?.role === 'tool') {
      result.push({ ...cloneMessage(next), parts: [...next.parts.map(part => ({ ...part })), ...missing] });
      i++;
    } else {
      result.push({ role: 'tool', parts: missing });
    }
  }
  return result;
}

function cloneMessage(message: KritzelChatMessage): KritzelChatMessage {
  return { ...message, parts: (message.parts ?? []).map(part => ({ ...part })) };
}

let generatedCallIds = 0;

function normalizePart(part: KritzelChatPart): KritzelChatPart {
  if (part.type === 'tool-call' && (typeof part.id !== 'string' || part.id === '')) {
    return { ...part, id: `call-${Date.now().toString(36)}-${++generatedCallIds}` };
  }
  return { ...part };
}

function isAsyncIterable(value: unknown): value is AsyncIterable<KritzelChatStreamEvent> {
  return typeof value === 'object' && value !== null && typeof (value as AsyncIterable<unknown>)[Symbol.asyncIterator] === 'function';
}

/** Buffers a streamed answer into one message (protocol version 1). */
async function collectStream(stream: AsyncIterable<KritzelChatStreamEvent>, signal: AbortSignal): Promise<KritzelChatMessage> {
  let parts: KritzelChatPart[] = [];
  let providerData: KritzelChatMessage['providerData'];
  for await (const event of stream) {
    if (signal.aborted) {
      break;
    }
    if (!event || typeof event !== 'object') {
      continue;
    }
    if (event.type === 'text-delta') {
      const last = parts[parts.length - 1];
      if (last && last.type === 'text') {
        parts[parts.length - 1] = { ...last, text: last.text + event.text };
      } else {
        parts.push({ type: 'text', text: event.text });
      }
    } else if (event.type === 'part') {
      parts.push(event.part);
    } else if (event.type === 'message') {
      parts = [...event.message.parts];
      providerData = event.message.providerData;
    } else if (event.type === 'finish') {
      if (event.providerData) {
        providerData = { ...providerData, ...event.providerData };
      }
      break;
    }
  }
  return { role: 'assistant', parts, ...(providerData ? { providerData } : {}) };
}
