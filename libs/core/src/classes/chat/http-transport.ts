import type {
  UpdrawChatRequest,
  UpdrawChatResponse,
  UpdrawChatStreamEvent,
  UpdrawChatTransport,
} from '../../interfaces/chat-session.interface';

/** Options of `createHttpTransport()`. */
export interface UpdrawHttpTransportOptions {
  /** The endpoint of your server, e.g. `'/api/chat'`. */
  url: string | URL;
  /**
   * Headers sent with every request, e.g. `Authorization`. A function is called per request, so it can return a
   * fresh token.
   */
  headers?: HeadersInit | ((request: UpdrawChatRequest) => HeadersInit | Promise<HeadersInit>);
  /** Whether cookies are sent, as in `fetch()`. Defaults to the browser's default (`'same-origin'`). */
  credentials?: RequestCredentials;
  /** The `fetch` to use, e.g. for tests or a client with retries. Defaults to the global `fetch`. */
  fetch?: typeof fetch;
}

/** Thrown by `createHttpTransport()` when the server answers with an error status. */
export class UpdrawChatHttpError extends Error {
  /** The HTTP status, e.g. `401`. */
  readonly status: number;
  /** The body of the answer, as text. */
  readonly body: string;

  constructor(status: number, body: string, message: string) {
    super(message);
    this.name = 'UpdrawChatHttpError';
    this.status = status;
    this.body = body;
  }
}

/**
 * A transport that posts each request as JSON to your server. The server answers with one of:
 *
 * - `application/json`: an `UpdrawChatResponse`.
 * - `application/x-ndjson`: one `UpdrawChatStreamEvent` as JSON per line.
 * - `text/event-stream`: server-sent events whose `data` is one `UpdrawChatStreamEvent` as JSON.
 *
 * Stopping the session aborts the request. An error status throws an `UpdrawChatHttpError`, with the `error`
 * or `message` of a JSON body as its message when there is one.
 */
export function createHttpTransport(urlOrOptions: string | URL | UpdrawHttpTransportOptions): UpdrawChatTransport {
  const options: UpdrawHttpTransportOptions =
    typeof urlOrOptions === 'string' || urlOrOptions instanceof URL ? { url: urlOrOptions } : urlOrOptions;
  if (!options || (typeof options.url !== 'string' && !(options.url instanceof URL))) {
    throw new TypeError('createHttpTransport() needs the URL of your chat endpoint.');
  }

  return async (request, { signal }) => {
    const fetchFn = options.fetch ?? globalThis.fetch;
    if (typeof fetchFn !== 'function') {
      throw new Error('createHttpTransport() needs fetch(). Pass one with the fetch option.');
    }
    const extraHeaders = typeof options.headers === 'function' ? await options.headers(request) : options.headers;
    const headers = new Headers(extraHeaders);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/x-ndjson, text/event-stream, application/json');
    }

    const response = await fetchFn(options.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
      signal,
      ...(options.credentials ? { credentials: options.credentials } : {}),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new UpdrawChatHttpError(response.status, body, errorMessage(response.status, body));
    }

    const contentType = (response.headers.get('Content-Type') ?? '').toLowerCase();
    if (contentType.includes('text/event-stream')) {
      return readServerSentEvents(response);
    }
    if (contentType.includes('ndjson') || contentType.includes('jsonl')) {
      return readJsonLines(response);
    }
    const text = await response.text();
    if (!text.trim()) {
      throw new Error('The chat server answered with an empty body.');
    }
    return parseJson(text) as UpdrawChatResponse;
  };
}

/** The message of an error answer: the `error` or `message` of a JSON body, or the status alone. */
function errorMessage(status: number, body: string): string {
  const prefix = `The chat request failed with status ${status}`;
  let detail: unknown;
  try {
    const json = JSON.parse(body);
    detail = typeof json?.error === 'string' ? json.error : (json?.error?.message ?? json?.message);
  } catch {
    detail = undefined;
  }
  return typeof detail === 'string' && detail.trim() ? `${prefix}: ${detail}` : `${prefix}.`;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const preview = text.length > 200 ? `${text.slice(0, 200)}…` : text;
    throw new Error(`The chat server sent invalid JSON: ${preview}`);
  }
}

/** Yields the lines of a body as they arrive, without line breaks. Cancels the body when the reader stops early. */
async function* readLines(response: Response): AsyncGenerator<string> {
  if (!response.body) {
    // Environments without streamed bodies: read the whole body at once.
    for (const line of (await response.text()).split(/\r\n|\r|\n/)) {
      yield line;
    }
    return;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let done = false;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) {
        break;
      }
      buffer += decoder.decode(chunk.value, { stream: true });
      // A trailing `\r` may be the first half of `\r\n`: keep it until the next chunk.
      const lines = buffer.split(/\r\n|\r(?!$)|\n/);
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        yield line;
      }
    }
    buffer += decoder.decode();
    done = true;
    for (const line of buffer.split(/\r\n|\r|\n/)) {
      yield line;
    }
  } finally {
    if (!done) {
      reader.cancel().catch(() => undefined);
    }
    try {
      reader.releaseLock();
    } catch {
      // Already released.
    }
  }
}

/** Reads newline-delimited JSON: one event per line, blank lines skipped. */
async function* readJsonLines(response: Response): AsyncGenerator<UpdrawChatStreamEvent> {
  for await (const line of readLines(response)) {
    if (line.trim()) {
      yield parseJson(line) as UpdrawChatStreamEvent;
    }
  }
}

/**
 * Reads server-sent events. Each event of type `message` (the default) carries one stream event as JSON in its
 * `data`; other event types, such as keep-alive pings, and a `data` of `[DONE]` are skipped.
 */
async function* readServerSentEvents(response: Response): AsyncGenerator<UpdrawChatStreamEvent> {
  let data: string[] = [];
  let eventType = '';
  const dispatch = (): UpdrawChatStreamEvent | undefined => {
    const payload = data.join('\n');
    const type = eventType;
    data = [];
    eventType = '';
    if ((type && type !== 'message') || !payload.trim() || payload.trim() === '[DONE]') {
      return undefined;
    }
    return parseJson(payload) as UpdrawChatStreamEvent;
  };

  for await (const line of readLines(response)) {
    if (line === '') {
      const event = dispatch();
      if (event) {
        yield event;
      }
      continue;
    }
    if (line.startsWith(':')) {
      continue;
    }
    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) {
      value = value.slice(1);
    }
    if (field === 'data') {
      data.push(value);
    } else if (field === 'event') {
      eventType = value;
    }
  }
  const last = dispatch();
  if (last) {
    yield last;
  }
}
