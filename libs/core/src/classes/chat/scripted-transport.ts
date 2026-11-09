import type {
  KritzelChatMessage,
  KritzelChatPart,
  KritzelChatRequest,
  KritzelChatResponse,
  KritzelChatTransport,
} from '../../interfaces/chat-session.interface';

/** A tool call in a script; the ID is generated when left out. */
export type KritzelScriptedToolCall = { tool: string; input?: Record<string, unknown>; id?: string };

/** One scripted answer: text, tool calls and parts in any mix. */
export interface KritzelScriptedAnswer {
  text?: string;
  toolCalls?: KritzelScriptedToolCall[];
  parts?: KritzelChatPart[];
  /** Overrides the transport's `delayMs` for this answer. */
  delayMs?: number;
}

/**
 * A scripted step: a text answer, an answer object, or a function of the request (e.g. to answer the ID of an
 * object created by an earlier tool call, found in the request's messages).
 */
export type KritzelScriptedStep = string | KritzelScriptedAnswer | ((request: KritzelChatRequest, index: number) => string | KritzelScriptedAnswer);

/** Options of `createScriptedTransport()`. */
export interface KritzelScriptedTransportOptions {
  /** How long each answer takes, like a model thinking. Defaults to 0. */
  delayMs?: number;
}

/**
 * A transport that answers from a script instead of a model: for demos, tests and trying the chat UI without a
 * server. The steps answer the model steps in order, across prompts; once they run out, every request is
 * answered with the last step. With a function, the script decides per request.
 */
export function createScriptedTransport(
  steps: KritzelScriptedStep[] | ((request: KritzelChatRequest, index: number) => string | KritzelScriptedAnswer),
  options: KritzelScriptedTransportOptions = {},
): KritzelChatTransport {
  let index = 0;
  let callCount = 0;
  return async (request, { signal }) => {
    const current = index++;
    let step: KritzelScriptedStep | undefined;
    if (typeof steps === 'function') {
      step = steps;
    } else {
      if (steps.length === 0) {
        throw new Error('The chat script has no steps.');
      }
      step = steps[Math.min(current, steps.length - 1)];
    }
    const answer = typeof step === 'function' ? step(request, current) : step;
    const resolved: KritzelScriptedAnswer = typeof answer === 'string' ? { text: answer } : answer;
    await delay(resolved.delayMs ?? options.delayMs ?? 0, signal);

    const parts: KritzelChatPart[] = [];
    if (resolved.text) {
      parts.push({ type: 'text', text: resolved.text });
    }
    for (const call of resolved.toolCalls ?? []) {
      parts.push({ type: 'tool-call', id: call.id ?? `scripted-${++callCount}`, name: call.tool, input: call.input ?? {} });
    }
    parts.push(...(resolved.parts ?? []));
    const message: KritzelChatMessage = { role: 'assistant', parts };
    const response: KritzelChatResponse = { version: 1, message, stopReason: parts.some(part => part.type === 'tool-call') ? 'tool-calls' : 'end' };
    return response;
  };
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
