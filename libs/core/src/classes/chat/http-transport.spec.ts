import { createHttpTransport, UpdrawChatHttpError } from './http-transport';
import type { UpdrawChatRequest, UpdrawChatStreamEvent } from '../../interfaces/chat-session.interface';

const request: UpdrawChatRequest = { version: 1, messages: [{ role: 'user', parts: [{ type: 'text', text: 'hi' }] }], tools: [], mode: 'user' };

/** A body that arrives in the given chunks. */
function chunked(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;
  return new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index++]));
      } else {
        controller.close();
      }
    },
  });
}

/**
 * A minimal fetch `Response`. Stencil's test environment replaces `Response` with a mock without a streamed
 * body, so the specs build their own around a real `ReadableStream`.
 */
function fakeResponse(body: string | ReadableStream<Uint8Array> | null, init: { status?: number; headers?: Record<string, string> } = {}): Response {
  const status = init.status ?? 200;
  const headers = new Map(Object.entries(init.headers ?? {}).map(([key, value]) => [key.toLowerCase(), value]));
  const stream = typeof body === 'string' ? chunked([body]) : body;
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => headers.get(name.toLowerCase()) ?? null },
    body: stream,
    async text() {
      if (!stream) {
        return '';
      }
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let text = '';
      for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
        text += decoder.decode(chunk.value, { stream: true });
      }
      return text + decoder.decode();
    },
  } as unknown as Response;
}

function respond(body: string | ReadableStream<Uint8Array> | null, init: { status?: number; headers?: Record<string, string> } = {}) {
  const calls: { url: unknown; init: RequestInit }[] = [];
  const fetchFn = jest.fn(async (url: unknown, requestInit?: RequestInit) => {
    calls.push({ url, init: requestInit! });
    return fakeResponse(body, init);
  }) as unknown as typeof fetch;
  return { fetchFn, calls };
}

async function collect(answer: unknown): Promise<UpdrawChatStreamEvent[]> {
  const events: UpdrawChatStreamEvent[] = [];
  for await (const event of answer as AsyncIterable<UpdrawChatStreamEvent>) {
    events.push(event);
  }
  return events;
}

const signal = () => new AbortController().signal;

describe('createHttpTransport', () => {
  it('posts the request as JSON and returns a JSON response', async () => {
    const answer = { version: 1, message: { role: 'assistant', parts: [{ type: 'text', text: 'Hello' }] }, stopReason: 'end' };
    const { fetchFn, calls } = respond(JSON.stringify(answer), { headers: { 'Content-Type': 'application/json' } });
    const abort = new AbortController();

    const result = await createHttpTransport({ url: '/api/chat', fetch: fetchFn })(request, { signal: abort.signal });

    expect(result).toEqual(answer);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('/api/chat');
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.signal).toBe(abort.signal);
    expect(JSON.parse(calls[0].init.body as string)).toEqual(request);
    const headers = calls[0].init.headers as Headers;
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('Accept')).toContain('application/x-ndjson');
    expect('credentials' in calls[0].init).toBe(false);
  });

  it('accepts a URL alone and uses the global fetch', async () => {
    const original = globalThis.fetch;
    const { fetchFn, calls } = respond(JSON.stringify({ message: { role: 'assistant', parts: [] } }));
    globalThis.fetch = fetchFn;
    try {
      await createHttpTransport('/chat')(request, { signal: signal() });
    } finally {
      globalThis.fetch = original;
    }
    expect(calls[0].url).toBe('/chat');
  });

  it('rejects a missing URL', () => {
    expect(() => createHttpTransport(undefined as any)).toThrow(TypeError);
    expect(() => createHttpTransport({} as any)).toThrow(TypeError);
  });

  it('sends headers, from a function per request, and credentials', async () => {
    const { fetchFn, calls } = respond(JSON.stringify({ message: { role: 'assistant', parts: [] } }));
    let token = 0;
    const transport = createHttpTransport({
      url: '/api/chat',
      fetch: fetchFn,
      credentials: 'include',
      headers: async seen => {
        expect(seen).toBe(request);
        return { Authorization: `Bearer ${++token}` };
      },
    });
    await transport(request, { signal: signal() });
    await transport(request, { signal: signal() });
    expect((calls[0].init.headers as Headers).get('Authorization')).toBe('Bearer 1');
    expect((calls[1].init.headers as Headers).get('Authorization')).toBe('Bearer 2');
    expect(calls[0].init.credentials).toBe('include');
  });

  it('keeps a Content-Type and Accept that the app sets', async () => {
    const { fetchFn, calls } = respond(JSON.stringify({ message: { role: 'assistant', parts: [] } }));
    await createHttpTransport({ url: '/x', fetch: fetchFn, headers: { 'content-type': 'application/vnd.app+json', accept: 'application/json' } })(request, {
      signal: signal(),
    });
    const headers = calls[0].init.headers as Headers;
    expect(headers.get('Content-Type')).toBe('application/vnd.app+json');
    expect(headers.get('Accept')).toBe('application/json');
  });

  describe('errors', () => {
    it('throws an UpdrawChatHttpError with the error of a JSON body', async () => {
      const { fetchFn } = respond(JSON.stringify({ error: 'Rate limit reached.' }), { status: 429 });
      const error = await Promise.resolve(createHttpTransport({ url: '/x', fetch: fetchFn })(request, { signal: signal() })).then(
        () => null,
        e => e,
      );
      expect(error).toBeInstanceOf(UpdrawChatHttpError);
      expect(error).toBeInstanceOf(Error);
      expect(error.status).toBe(429);
      expect(error.body).toBe('{"error":"Rate limit reached."}');
      expect(error.message).toBe('The chat request failed with status 429: Rate limit reached.');
    });

    it('reads error.message and message of a JSON body', async () => {
      for (const body of [{ error: { message: 'Nested.' } }, { message: 'Nested.' }]) {
        const { fetchFn } = respond(JSON.stringify(body), { status: 500 });
        await expect(createHttpTransport({ url: '/x', fetch: fetchFn })(request, { signal: signal() })).rejects.toThrow(
          'The chat request failed with status 500: Nested.',
        );
      }
    });

    it('falls back to the status for other bodies', async () => {
      const { fetchFn } = respond('<html>Bad gateway</html>', { status: 502 });
      await expect(createHttpTransport({ url: '/x', fetch: fetchFn })(request, { signal: signal() })).rejects.toThrow(
        'The chat request failed with status 502.',
      );
    });

    it('rejects an empty or invalid JSON body', async () => {
      await expect(createHttpTransport({ url: '/x', fetch: respond('').fetchFn })(request, { signal: signal() })).rejects.toThrow('empty body');
      await expect(createHttpTransport({ url: '/x', fetch: respond('nope').fetchFn })(request, { signal: signal() })).rejects.toThrow('invalid JSON');
    });

    it('reports a missing fetch', async () => {
      const original = globalThis.fetch;
      (globalThis as any).fetch = undefined;
      try {
        await expect(createHttpTransport('/x')(request, { signal: signal() })).rejects.toThrow('fetch()');
      } finally {
        globalThis.fetch = original;
      }
    });

    it('passes on a rejected fetch, e.g. an abort', async () => {
      const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' });
      const fetchFn = jest.fn(async () => Promise.reject(abortError)) as unknown as typeof fetch;
      await expect(createHttpTransport({ url: '/x', fetch: fetchFn })(request, { signal: signal() })).rejects.toBe(abortError);
    });
  });

  describe('newline-delimited JSON', () => {
    it('yields one event per line across chunk boundaries', async () => {
      const lines = [
        '{"type":"text-delta","text":"Hel"}\n{"type":"text-',
        'delta","text":"lo"}\r\n\n',
        '{"type":"finish","stopReason":"end"}',
      ];
      const { fetchFn } = respond(chunked(lines), { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8' } });
      const events = await collect(await createHttpTransport({ url: '/x', fetch: fetchFn })(request, { signal: signal() }));
      expect(events).toEqual([
        { type: 'text-delta', text: 'Hel' },
        { type: 'text-delta', text: 'lo' },
        { type: 'finish', stopReason: 'end' },
      ]);
    });

    it('decodes characters split across chunks', async () => {
      const bytes = new TextEncoder().encode('{"type":"text-delta","text":"größe 🎨"}\n');
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          for (const byte of bytes) {
            controller.enqueue(new Uint8Array([byte]));
          }
          controller.close();
        },
      });
      const { fetchFn } = respond(body, { headers: { 'Content-Type': 'application/jsonl' } });
      const events = await collect(await createHttpTransport({ url: '/x', fetch: fetchFn })(request, { signal: signal() }));
      expect(events).toEqual([{ type: 'text-delta', text: 'größe 🎨' }]);
    });

    it('reads the whole body when it is not streamed', async () => {
      const { fetchFn } = respond(null, { headers: { 'Content-Type': 'application/x-ndjson' } });
      const streamless = jest.fn(async (url: string, init: RequestInit) => {
        const response = await fetchFn(url, init);
        return { ...response, headers: response.headers, body: null, text: async () => '{"type":"text-delta","text":"a"}\n{"type":"finish"}\n' };
      }) as unknown as typeof fetch;
      const events = await collect(await createHttpTransport({ url: '/x', fetch: streamless })(request, { signal: signal() }));
      expect(events).toEqual([{ type: 'text-delta', text: 'a' }, { type: 'finish' }]);
    });

    it('throws on an invalid line', async () => {
      const { fetchFn } = respond('{"type":"text-delta","text":"a"}\nnot json\n', { headers: { 'Content-Type': 'application/x-ndjson' } });
      await expect(collect(await createHttpTransport({ url: '/x', fetch: fetchFn })(request, { signal: signal() }))).rejects.toThrow(
        'invalid JSON: not json',
      );
    });

    it('cancels the body when the reader stops early', async () => {
      let cancelled = false;
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('{"type":"finish"}\n{"type":"text-delta","text":"late"}\n'));
        },
        cancel() {
          cancelled = true;
        },
      });
      const { fetchFn } = respond(body, { headers: { 'Content-Type': 'application/x-ndjson' } });
      const answer = (await createHttpTransport({ url: '/x', fetch: fetchFn })(request, { signal: signal() })) as AsyncIterable<UpdrawChatStreamEvent>;
      for await (const event of answer) {
        expect(event).toEqual({ type: 'finish' });
        break;
      }
      expect(cancelled).toBe(true);
    });
  });

  describe('server-sent events', () => {
    it('yields the data of message events and skips the rest', async () => {
      const body = [
        ': keep-alive\n\n',
        'event: ping\ndata: {}\n\n',
        'data: {"type":"text-delta",',
        '"text":"Hi"}\r\n\r\n',
        'event: message\ndata:{"type":"part",\ndata: "part":{"type":"text","text":"!"}}\n\n',
        'id: 3\nretry: 100\ndata: {"type":"finish"}\n\n',
        'data: [DONE]\n\n',
      ];
      const { fetchFn } = respond(chunked(body), { headers: { 'Content-Type': 'text/event-stream' } });
      const events = await collect(await createHttpTransport({ url: '/x', fetch: fetchFn })(request, { signal: signal() }));
      expect(events).toEqual([
        { type: 'text-delta', text: 'Hi' },
        { type: 'part', part: { type: 'text', text: '!' } },
        { type: 'finish' },
      ]);
    });

    it('dispatches a last event without a trailing blank line', async () => {
      const { fetchFn } = respond('data: {"type":"finish"}', { headers: { 'Content-Type': 'text/event-stream' } });
      const events = await collect(await createHttpTransport({ url: '/x', fetch: fetchFn })(request, { signal: signal() }));
      expect(events).toEqual([{ type: 'finish' }]);
    });
  });
});
