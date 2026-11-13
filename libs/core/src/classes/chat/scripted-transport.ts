import {
  UPDRAW_CHAT_PROTOCOL_VERSION,
  type UpdrawChatMessage,
  type UpdrawChatPart,
  type UpdrawChatRequest,
  type UpdrawChatResponse,
  type UpdrawChatStopReason,
  type UpdrawChatStreamEvent,
  type UpdrawChatToolCallPart,
  type UpdrawChatTransport,
} from '../../interfaces/chat-session.interface';

/** A tool call in a script; the ID is generated when left out. */
export type UpdrawScriptedToolCall = { tool: string; input?: Record<string, unknown>; id?: string };

/** One scripted answer: text, tool calls and parts in any mix. */
export interface UpdrawScriptedAnswer {
  text?: string;
  toolCalls?: UpdrawScriptedToolCall[];
  parts?: UpdrawChatPart[];
  /** Overrides the transport's `delayMs` for this answer. */
  delayMs?: number;
}

/**
 * A scripted step: a text answer, an answer object, or a function of the request (e.g. to answer the ID of an
 * object created by an earlier tool call, found in the request's messages).
 */
export type UpdrawScriptedStep = string | UpdrawScriptedAnswer | ((request: UpdrawChatRequest, index: number) => string | UpdrawScriptedAnswer);

/** Options of `createScriptedTransport()`. */
export interface UpdrawScriptedTransportOptions {
  /** How long each answer takes, like a model thinking. Defaults to 0. */
  delayMs?: number;
  /**
   * Streams each answer like a model: its text in `text-delta` chunks, each tool call as `tool-call-start`, its
   * input's JSON in `tool-call-delta` chunks and its complete part, then the extra `parts` and `finish`. The
   * messages are the same as without streaming. `chunkSize` in characters (default 16); `chunkDelayMs` before each
   * chunk (default 0).
   */
  stream?: boolean | { chunkSize?: number; chunkDelayMs?: number };
}

/**
 * A transport that answers from a script instead of a model: for demos, tests and trying the chat UI without a
 * server. The steps answer the model steps in order, across prompts; once they run out, every request is
 * answered with the last step. With a function, the script decides per request.
 */
export function createScriptedTransport(
  steps: UpdrawScriptedStep[] | ((request: UpdrawChatRequest, index: number) => string | UpdrawScriptedAnswer),
  options: UpdrawScriptedTransportOptions = {},
): UpdrawChatTransport {
  let index = 0;
  let callCount = 0;
  return async (request, { signal }) => {
    const current = index++;
    let step: UpdrawScriptedStep | undefined;
    if (typeof steps === 'function') {
      step = steps;
    } else {
      if (steps.length === 0) {
        throw new Error('The chat script has no steps.');
      }
      step = steps[Math.min(current, steps.length - 1)];
    }
    const answer = typeof step === 'function' ? step(request, current) : step;
    const resolved: UpdrawScriptedAnswer = typeof answer === 'string' ? { text: answer } : answer;
    await delay(resolved.delayMs ?? options.delayMs ?? 0, signal);

    const calls = (resolved.toolCalls ?? []).map<UpdrawChatToolCallPart>(call => ({
      type: 'tool-call',
      id: call.id ?? `scripted-${++callCount}`,
      name: call.tool,
      input: call.input ?? {},
    }));
    const extra = resolved.parts ?? [];
    const parts: UpdrawChatPart[] = [...(resolved.text ? [{ type: 'text' as const, text: resolved.text }] : []), ...calls, ...extra];
    const stopReason: UpdrawChatStopReason = parts.some(part => part.type === 'tool-call') ? 'tool-calls' : 'end';
    if (options.stream) {
      const { chunkSize = 16, chunkDelayMs = 0 } = options.stream === true ? {} : options.stream;
      return streamAnswer(resolved.text ?? '', calls, extra, stopReason, Math.max(1, Math.floor(chunkSize)), chunkDelayMs, signal);
    }
    const message: UpdrawChatMessage = { role: 'assistant', parts };
    const response: UpdrawChatResponse = { version: UPDRAW_CHAT_PROTOCOL_VERSION, message, stopReason };
    return response;
  };
}

/** One scripted answer as a stream of events, like a model writing it. */
async function* streamAnswer(
  text: string,
  calls: UpdrawChatToolCallPart[],
  extra: UpdrawChatPart[],
  stopReason: UpdrawChatStopReason,
  chunkSize: number,
  chunkDelayMs: number,
  signal: AbortSignal,
): AsyncGenerator<UpdrawChatStreamEvent> {
  for (const chunk of chunks(text, chunkSize)) {
    await delay(chunkDelayMs, signal);
    yield { type: 'text-delta', text: chunk };
  }
  for (const call of calls) {
    yield { type: 'tool-call-start', id: call.id, name: call.name };
    for (const chunk of chunks(JSON.stringify(call.input), chunkSize)) {
      await delay(chunkDelayMs, signal);
      yield { type: 'tool-call-delta', id: call.id, inputDelta: chunk };
    }
    yield { type: 'part', part: call };
  }
  for (const part of extra) {
    yield { type: 'part', part };
  }
  yield { type: 'finish', stopReason };
}

function chunks(text: string, size: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    result.push(text.slice(i, i + size));
  }
  return result;
}

/** Waits, rejecting with an `AbortError` when the signal aborts. */
function delay(ms: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) {
    return Promise.reject(abortError());
  }
  if (ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

function abortError(): Error {
  const error = new Error('The chat request was aborted.');
  error.name = 'AbortError';
  return error;
}
