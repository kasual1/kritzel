import {
  UPMADE_CHAT_PROTOCOL_VERSION,
  type UpmadeChatMessage,
  type UpmadeChatPart,
  type UpmadeChatRequest,
  type UpmadeChatResponse,
  type UpmadeChatStopReason,
  type UpmadeChatStreamEvent,
  type UpmadeChatToolCallPart,
  type UpmadeChatTransport,
} from '../../interfaces/chat-session.interface';

/** A tool call in a script; the ID is generated when left out. */
export type UpmadeScriptedToolCall = { tool: string; input?: Record<string, unknown>; id?: string };

/** One scripted answer: text, tool calls and parts in any mix. */
export interface UpmadeScriptedAnswer {
  text?: string;
  toolCalls?: UpmadeScriptedToolCall[];
  parts?: UpmadeChatPart[];
  /** Overrides the transport's `delayMs` for this answer. */
  delayMs?: number;
}

/**
 * A scripted step: a text answer, an answer object, or a function of the request (e.g. to answer the ID of an
 * object created by an earlier tool call, found in the request's messages).
 */
export type UpmadeScriptedStep = string | UpmadeScriptedAnswer | ((request: UpmadeChatRequest, index: number) => string | UpmadeScriptedAnswer);

/** Options of `createScriptedTransport()`. */
export interface UpmadeScriptedTransportOptions {
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
  steps: UpmadeScriptedStep[] | ((request: UpmadeChatRequest, index: number) => string | UpmadeScriptedAnswer),
  options: UpmadeScriptedTransportOptions = {},
): UpmadeChatTransport {
  let index = 0;
  let callCount = 0;
  return async (request, { signal }) => {
    const current = index++;
    let step: UpmadeScriptedStep | undefined;
    if (typeof steps === 'function') {
      step = steps;
    } else {
      if (steps.length === 0) {
        throw new Error('The chat script has no steps.');
      }
      step = steps[Math.min(current, steps.length - 1)];
    }
    const answer = typeof step === 'function' ? step(request, current) : step;
    const resolved: UpmadeScriptedAnswer = typeof answer === 'string' ? { text: answer } : answer;
    await delay(resolved.delayMs ?? options.delayMs ?? 0, signal);

    const calls = (resolved.toolCalls ?? []).map<UpmadeChatToolCallPart>(call => ({
      type: 'tool-call',
      id: call.id ?? `scripted-${++callCount}`,
      name: call.tool,
      input: call.input ?? {},
    }));
    const extra = resolved.parts ?? [];
    const parts: UpmadeChatPart[] = [...(resolved.text ? [{ type: 'text' as const, text: resolved.text }] : []), ...calls, ...extra];
    const stopReason: UpmadeChatStopReason = parts.some(part => part.type === 'tool-call') ? 'tool-calls' : 'end';
    if (options.stream) {
      const { chunkSize = 16, chunkDelayMs = 0 } = options.stream === true ? {} : options.stream;
      return streamAnswer(resolved.text ?? '', calls, extra, stopReason, Math.max(1, Math.floor(chunkSize)), chunkDelayMs, signal);
    }
    const message: UpmadeChatMessage = { role: 'assistant', parts };
    const response: UpmadeChatResponse = { version: UPMADE_CHAT_PROTOCOL_VERSION, message, stopReason };
    return response;
  };
}

/** One scripted answer as a stream of events, like a model writing it. */
async function* streamAnswer(
  text: string,
  calls: UpmadeChatToolCallPart[],
  extra: UpmadeChatPart[],
  stopReason: UpmadeChatStopReason,
  chunkSize: number,
  chunkDelayMs: number,
  signal: AbortSignal,
): AsyncGenerator<UpmadeChatStreamEvent> {
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
