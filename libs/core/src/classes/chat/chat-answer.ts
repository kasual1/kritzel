import type {
  KritzelChatMessage,
  KritzelChatPart,
  KritzelChatProviderData,
  KritzelChatStreamEvent,
  KritzelChatToolCallPart,
  KritzelChatToolCallState,
  KritzelChatToolCallUpdate,
  KritzelChatToolResultPart,
} from '../../interfaces/chat-session.interface';

/** What running one tool call gave. `ran`: the tool was called (`false`: there is no such tool). */
export interface ChatAnswerRunOutcome {
  result: KritzelChatToolResultPart;
  ran: boolean;
}

/** Options of a `ChatAnswer`. */
export interface ChatAnswerOptions {
  /** Runs the tool calls of a streamed answer as their parts arrive, while the stream goes on. */
  eager: boolean;
  /** The prompt's signal: once it aborts, calls that have not started get `stoppedOutput`. */
  signal: AbortSignal;
  /** Result of calls that did not run because the prompt was stopped. */
  stoppedOutput: string;
  /** Result of calls that did not run because the answer failed. */
  interruptedOutput: string;
  /** Receives the progress of the streamed calls. */
  report: (update: KritzelChatToolCallUpdate) => void;
  /** Runs one call; calls `onRunning` right before its tool runs. Never rejects. */
  run: (call: KritzelChatToolCallPart, onRunning: () => void) => Promise<ChatAnswerRunOutcome>;
}

/**
 * Where a streamed call is: written (`streaming`), complete (`ready`), waiting for its turn (`queued`), handed to
 * its tool runner (`taken`, before its tool runs or when there is no such tool), running, ended with its result
 * (`done`) or dropped without running (`discarded`).
 */
type CallState = 'streaming' | 'ready' | 'queued' | 'taken' | 'running' | 'done' | 'discarded';

interface StreamedCall {
  readonly id: string;
  name: string;
  inputText: string;
  /** The complete tool-call part, from `ready` on. */
  part: KritzelChatToolCallPart | null;
  state: CallState;
  /** Its result, once it is queued. */
  pending: Promise<KritzelChatToolResultPart | null> | null;
}

/**
 * One model step's answer: reads it (a stream or a whole response) and runs its tool calls one at a time, in
 * order. The calls of a streamed answer are reported as they stream and, when eager, run as their parts arrive
 * while the rest of the answer streams. Each reported call ends once: `'done'` or `'discarded'`.
 */
export class ChatAnswer {
  /** Whether a call was handed to its tool runner (as opposed to ending without running). */
  executed = false;

  private readonly calls = new Map<string, StreamedCall>();
  private parts: KritzelChatPart[] = [];
  private providerData: KritzelChatProviderData | undefined;
  /** The calls run one after another. */
  private tail: Promise<unknown> = Promise.resolve();
  /** Set once the answer ends early: calls that have not started get it as their result. */
  private haltOutput: string | null = null;
  /** Set once the calls of the final (or kept) message run: from then on, every one of them gets a result. */
  private committed = false;
  private readonly warned = new Set<string>();

  constructor(private readonly options: ChatAnswerOptions) {}

  /** Reads a streamed answer into one message, reporting (and, when eager, running) its calls on the way. */
  async read(stream: AsyncIterable<KritzelChatStreamEvent>, signal: AbortSignal): Promise<KritzelChatMessage> {
    try {
      for await (const event of stream) {
        if (signal.aborted) {
          break;
        }
        if (!event || typeof event !== 'object') {
          continue;
        }
        if (event.type === 'text-delta') {
          const last = this.parts[this.parts.length - 1];
          if (last && last.type === 'text') {
            this.parts[this.parts.length - 1] = { ...last, text: last.text + event.text };
          } else {
            this.parts.push({ type: 'text', text: event.text });
          }
        } else if (event.type === 'tool-call-start') {
          this.start(event.id, event.name);
        } else if (event.type === 'tool-call-delta') {
          this.input(event.id, event.inputDelta);
        } else if (event.type === 'part') {
          if (!isPart(event.part)) {
            continue;
          }
          // Tool calls get their ID on arrival: they can run (and are reported) before the answer ends.
          const part = isToolCallPart(event.part) ? (normalizePart(event.part) as KritzelChatToolCallPart) : event.part;
          this.parts.push(part);
          if (isToolCallPart(part)) {
            this.complete(part, true);
          }
        } else if (event.type === 'message') {
          const parts = [...event.message.parts].filter(isPart).map(part => (isToolCallPart(part) ? normalizePart(part) : part));
          this.parts = this.replace(parts);
          this.providerData = event.message.providerData;
        } else if (event.type === 'finish') {
          if (event.providerData) {
            this.providerData = { ...this.providerData, ...event.providerData };
          }
          break;
        }
      }
    } catch (error) {
      // No call starts once the answer has failed; the running one ends.
      this.halt(signal.aborted ? this.options.stoppedOutput : this.options.interruptedOutput);
      throw error;
    }
    this.endStream(!signal.aborted);
    return { role: 'assistant', ...this.snapshot() };
  }

  /** The answer read so far, e.g. when it failed: its text and the calls that completed. */
  partial(): Omit<KritzelChatMessage, 'role'> {
    return this.snapshot();
  }

  /**
   * Runs the calls of the final message that have not run yet, in order, and resolves with the results of all
   * of them. Streamed calls the message does not hold are dropped, unless they already ran.
   */
  runRest(calls: KritzelChatToolCallPart[]): Promise<KritzelChatToolResultPart[]> {
    this.committed = true;
    const used = new Set<StreamedCall>();
    const pending = calls.map(part => {
      const call = this.calls.get(part.id);
      if (call && !used.has(call) && call.state !== 'streaming' && call.state !== 'discarded') {
        used.add(call);
        return call.pending ?? this.enqueue(call);
      }
      // A whole answer's call, or a second call with the same ID: runs unreported, as before.
      return this.schedule(() => this.execute(null, part));
    });
    for (const call of this.calls.values()) {
      if (!used.has(call)) {
        this.discard(call);
      }
    }
    return Promise.all(pending) as Promise<KritzelChatToolResultPart[]>;
  }

  /**
   * Ends the answer early (stopped, detached, failed): no call starts any more. Without a call that ran, the
   * answer is dropped and its calls are discarded; otherwise the calls that completed get `output` as their result.
   */
  halt(output: string): void {
    this.haltOutput ??= output;
    for (const call of this.calls.values()) {
      if (call.state === 'streaming' || (!this.executed && (call.state === 'ready' || call.state === 'queued'))) {
        this.discard(call);
      }
    }
  }

  /** Resolves once the running call and the queued ones have ended. */
  settled(): Promise<void> {
    return this.tail.then(noop);
  }

  // ─── Streamed calls ─────────────────────────────────────────────────────────

  /**
   * `tool-call-start`: ignored without ID or name, and for a known ID: a call is reported once, and an ID that
   * ended is never reported again.
   */
  private start(id: unknown, name: unknown): StreamedCall | null {
    if (typeof id !== 'string' || id === '' || typeof name !== 'string' || this.calls.has(id)) {
      return null;
    }
    const call: StreamedCall = { id, name, inputText: '', part: null, state: 'streaming', pending: null };
    this.calls.set(id, call);
    this.emit(call, 'started');
    return call;
  }

  /** `tool-call-delta`: ignored for unknown or complete calls and empty deltas. */
  private input(id: unknown, delta: unknown): void {
    const call = typeof id === 'string' ? this.calls.get(id) : undefined;
    if (!call || call.state !== 'streaming' || typeof delta !== 'string' || delta === '') {
      return;
    }
    call.inputText += delta;
    this.emit(call, 'input', { inputDelta: delta });
  }

  /** A complete tool-call part. `queue`: from a `part` event, which runs right away when eager. */
  private complete(part: KritzelChatToolCallPart, queue: boolean): void {
    const known = this.calls.get(part.id);
    if (known && known.state !== 'streaming') {
      // A second part with the same ID, or one of a dropped call: not reported; it runs as its own call once the
      // answer has ended (when it is in it).
      return;
    }
    const call = known ?? this.start(part.id, nameOf(part));
    if (!call) {
      return;
    }
    call.name = nameOf(part);
    call.part = part;
    call.state = 'ready';
    this.emit(call, 'ready');
    // A listener may have stopped the prompt: the call then waits, and is dropped with the answer.
    if (queue && this.options.eager && this.haltOutput === null && !this.options.signal.aborted) {
      this.enqueue(call);
    }
  }

  /**
   * A `message` event replaced the answer. Complete calls it leaves out are discarded, unless they already ran
   * (those stay in the answer as they ran); calls still being written wait for their part. Calls it holds are
   * complete, and run once the answer has ended unless queued.
   */
  private replace(parts: KritzelChatPart[]): KritzelChatPart[] {
    const ids = new Set(parts.filter(isToolCallPart).map(part => part.id));
    for (const call of this.calls.values()) {
      if (ids.has(call.id) || call.state === 'streaming') {
        continue;
      }
      if (hasStarted(call)) {
        this.warnOnce(call, `A message event left out tool call "${call.id}" (${call.name}), which already ran; it stays in the answer.`);
      } else {
        this.discard(call);
      }
    }
    // Only the first call with an ID is the tracked one; repeats run as their own calls, as before.
    const seen = new Set<string>();
    return parts.map(part => {
      if (!isToolCallPart(part) || seen.has(part.id)) {
        return part;
      }
      seen.add(part.id);
      const call = this.calls.get(part.id);
      if (call && hasStarted(call)) {
        // It ran with the input it had: the conversation keeps that one.
        return call.part!;
      }
      if (call && (call.state === 'ready' || call.state === 'queued')) {
        call.name = nameOf(part);
        call.part = part;
        this.emit(call, 'ready');
        return part;
      }
      this.complete(part, false);
      return part;
    });
  }

  /** The stream ended: calls still being written never run. */
  private endStream(normal: boolean): void {
    for (const call of this.calls.values()) {
      if (call.state !== 'streaming') {
        continue;
      }
      if (normal) {
        this.warnOnce(call, `The chat stream ended before tool call "${call.id}" (${call.name}) was complete; it does not run.`);
      }
      this.discard(call);
    }
  }

  private discard(call: StreamedCall): void {
    if (call.state !== 'streaming' && call.state !== 'ready' && call.state !== 'queued') {
      return;
    }
    call.state = 'discarded';
    this.emit(call, 'discarded');
  }

  /** The parts so far; calls that ran but were left out by a `message` event are appended. */
  private snapshot(): Omit<KritzelChatMessage, 'role'> {
    const ids = new Set(this.parts.filter(isToolCallPart).map(part => part.id));
    const retained = [...this.calls.values()].filter(call => hasStarted(call) && !ids.has(call.id)).map(call => call.part!);
    return { parts: [...this.parts, ...retained], ...(this.providerData ? { providerData: this.providerData } : {}) };
  }

  // ─── Running ────────────────────────────────────────────────────────────────

  private enqueue(call: StreamedCall): Promise<KritzelChatToolResultPart | null> {
    call.state = 'queued';
    call.pending = this.schedule(() => this.execute(call, null));
    return call.pending;
  }

  /** Runs `task` after everything scheduled before it. */
  private schedule<T>(task: () => Promise<T>): Promise<T> {
    const result = this.tail.then(task);
    this.tail = result.then(noop, noop);
    return result;
  }

  /** Runs a streamed call (reported) or a call of a whole answer (`part`, unreported). */
  private async execute(call: StreamedCall | null, part: KritzelChatToolCallPart | null): Promise<KritzelChatToolResultPart | null> {
    if (call?.state === 'discarded') {
      return null;
    }
    const target = call ? call.part! : part!;
    const ending = this.haltOutput ?? (this.options.signal.aborted ? this.options.stoppedOutput : null);
    let outcome: ChatAnswerRunOutcome;
    if (ending !== null) {
      if (call && !this.executed && !this.committed) {
        // The prompt ended before any call ran: the call waits, and is dropped with the answer.
        call.state = 'ready';
        call.pending = null;
        return null;
      }
      outcome = { result: { type: 'tool-result', toolCallId: target.id, name: target.name, output: ending, isError: true }, ran: false };
    } else {
      this.executed = true;
      if (call) {
        // Taken: a message event can't drop it any more.
        call.state = 'taken';
      }
      outcome = await this.options.run(target, () => {
        if (call) {
          call.state = 'running';
          this.emit(call, 'running');
        }
      });
    }
    if (call) {
      call.state = 'done';
      this.emit(call, 'done', { result: outcome.result, ran: outcome.ran });
    }
    return outcome.result;
  }

  // ─── Reports ────────────────────────────────────────────────────────────────

  /** Every report is a fresh object: listeners never see or change the answer's state. */
  private emit(call: StreamedCall, state: KritzelChatToolCallState, extra: Partial<KritzelChatToolCallUpdate> = {}): void {
    this.options.report({
      id: call.id,
      name: call.name,
      state,
      inputText: call.inputText,
      ...(call.part ? { input: call.part.input } : {}),
      ...extra,
    });
  }

  private warnOnce(call: StreamedCall, message: string): void {
    if (this.warned.has(call.id)) {
      return;
    }
    this.warned.add(call.id);
    console.warn(`[Kritzel] ${message}`);
  }
}

let generatedCallIds = 0;

/** A copy of the part; a tool call without an ID gets one. */
export function normalizePart(part: KritzelChatPart): KritzelChatPart {
  if (part.type === 'tool-call' && (typeof part.id !== 'string' || part.id === '')) {
    return { ...part, id: `call-${Date.now().toString(36)}-${++generatedCallIds}` };
  }
  return { ...part };
}

export function isToolCallPart(part: unknown): part is KritzelChatToolCallPart {
  return typeof part === 'object' && part !== null && (part as KritzelChatPart).type === 'tool-call';
}

/** Whether the call's turn came: it runs or ran, so it can't be taken back. */
function hasStarted(call: StreamedCall): boolean {
  return call.state === 'taken' || call.state === 'running' || call.state === 'done';
}

function isPart(part: unknown): part is KritzelChatPart {
  return typeof part === 'object' && part !== null;
}

function nameOf(part: KritzelChatToolCallPart): string {
  return typeof part.name === 'string' ? part.name : '';
}

function noop(): void {}
