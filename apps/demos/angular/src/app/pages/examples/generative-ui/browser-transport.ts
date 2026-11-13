import type {
  KritzelChatMessage,
  KritzelChatPart,
  KritzelChatRequest,
  KritzelChatStopReason,
  KritzelChatStreamEvent,
  KritzelChatTransport,
} from '@kritzel/angular-editor';

/**
 * A chat transport that calls the model provider straight from the browser, with the API key the user typed in. It
 * translates Kritzel's chat protocol to the provider's API and streams the answer back, so tool calls run while the
 * model still writes. A real app sends the requests through its own backend instead, with `createHttpTransport()`, so
 * that no key ever reaches the browser.
 */

export type ProviderId = 'anthropic' | 'openai' | 'gemini';

export interface Provider {
  id: ProviderId;
  name: string;
  /** The model that builds the UIs. Other models of the provider that support tools work too. */
  model: string;
  keyPlaceholder: string;
  keyUrl: string;
}

export const PROVIDERS: readonly Provider[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    model: 'claude-opus-5-5',
    keyPlaceholder: 'sk-ant-…',
    keyUrl: 'https://platform.claude.com/settings/keys',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    model: 'gpt-5.5',
    keyPlaceholder: 'sk-…',
    keyUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    model: 'gemini-flash-latest',
    keyPlaceholder: 'AIza…',
    keyUrl: 'https://aistudio.google.com/apikey',
  },
];

export interface Credentials {
  provider: ProviderId;
  apiKey: string;
}

export function getProvider(id: ProviderId): Provider {
  const provider = PROVIDERS.find(option => option.id === id);
  if (!provider) {
    throw new Error(`Unknown provider "${id}".`);
  }
  return provider;
}

/** Recognizes the provider from the key's prefix, so pasting a key selects its provider. */
export function detectProvider(apiKey: string): ProviderId | undefined {
  const key = apiKey.trim();
  if (key.startsWith('sk-ant-')) return 'anthropic';
  if (key.startsWith('sk-')) return 'openai';
  if (key.startsWith('AIza')) return 'gemini';
  return undefined;
}

/** A transport, and the key it sends to the provider. */
export interface BrowserTransport {
  transport: KritzelChatTransport;
  /** Connects a key, or disconnects with `null`. The next request uses it. */
  setCredentials(credentials: Credentials | null): void;
}

/** Creates the transport without a key, so that the session can be created once and the key connected later. */
export function createBrowserTransport(): BrowserTransport {
  let credentials: Credentials | null = null;
  return {
    transport: (request, { signal }) => {
      if (!credentials) {
        throw new Error('Add an API key to start generating UIs.');
      }
      const provider = getProvider(credentials.provider);
      switch (provider.id) {
        case 'anthropic':
          return streamAnthropic(provider, credentials.apiKey, request, signal);
        case 'openai':
          return streamOpenAi(provider, credentials.apiKey, request, signal);
        case 'gemini':
          return streamGemini(provider, credentials.apiKey, request, signal);
      }
    },
    setCredentials(next) {
      credentials = next;
    },
  };
}

// ─── Anthropic ───────────────────────────────────────────────────────────────

type AnthropicBlock = Record<string, unknown> & { type: string };

interface AnthropicEvent {
  type: string;
  index?: number;
  content_block?: AnthropicBlock;
  delta?: {
    type?: string;
    text?: string;
    partial_json?: string;
    thinking?: string;
    signature?: string;
    stop_reason?: string;
  };
  error?: { message?: string };
}

async function* streamAnthropic(
  provider: Provider,
  apiKey: string,
  request: KritzelChatRequest,
  signal: AbortSignal,
): AsyncGenerator<KritzelChatStreamEvent> {
  const response = await post(provider, 'https://api.anthropic.com/v1/messages', signal, {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2026-10-21',
      // Claude only answers browsers that opt in, because a key in a web page is readable by anyone who opens it.
      'anthropic-dangerous-direct-browser-access': 'true',
      // Lets block_binding below drop thinking blocks that no longer match the conversation, instead of failing.
      'anthropic-beta': 'thinking-binding-controls-2026-08-01',
    },
    body: {
      model: provider.model,
      max_tokens: 64000,
      stream: true,
      system: request.system,
      // An answer that the user stopped is kept without its thinking. The thinking after it is dropped, not rejected.
      thinking: { type: 'adaptive', block_binding: { prefix_mismatch_behavior: 'drop_block' } },
      output_config: { effort: 'medium' },
      // Streams each tool input while Claude writes it, so the canvas can show a placeholder early.
      tools: request.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema,
        eager_input_streaming: true,
      })),
      messages: toAnthropicMessages(request.messages),
    },
  });

  // Claude's own blocks, thinking included, are sent back unchanged with the next request.
  const blocks: AnthropicBlock[] = [];
  const inputs = new Map<number, string>();
  let stopReason: string | undefined;
  for await (const data of readServerSentEvents(response)) {
    const event = JSON.parse(data) as AnthropicEvent;
    const index = event.index ?? 0;
    if (event.type === 'content_block_start' && event.content_block) {
      const block = { ...event.content_block };
      blocks[index] = block;
      if (block.type === 'tool_use') {
        inputs.set(index, '');
        yield { type: 'tool-call-start', id: String(block['id']), name: String(block['name']) };
      }
    } else if (event.type === 'content_block_delta' && event.delta && blocks[index]) {
      const block = blocks[index];
      const delta = event.delta;
      if (delta.type === 'text_delta' && delta.text) {
        block['text'] = `${block['text'] ?? ''}${delta.text}`;
        yield { type: 'text-delta', text: delta.text };
      } else if (delta.type === 'input_json_delta' && delta.partial_json) {
        inputs.set(index, `${inputs.get(index) ?? ''}${delta.partial_json}`);
        yield { type: 'tool-call-delta', id: String(block['id']), inputDelta: delta.partial_json };
      } else if (delta.type === 'thinking_delta') {
        block['thinking'] = `${block['thinking'] ?? ''}${delta.thinking ?? ''}`;
      } else if (delta.type === 'signature_delta') {
        block['signature'] = delta.signature;
      }
    } else if (event.type === 'content_block_stop' && blocks[index]?.type === 'tool_use') {
      const block = blocks[index];
      const input = parseToolInput(inputs.get(index) ?? '');
      // Claude needs an object back; input that was cut off is answered by the tool with an error anyway.
      block['input'] = typeof input === 'string' ? {} : input;
      yield { type: 'part', part: { type: 'tool-call', id: String(block['id']), name: String(block['name']), input } };
    } else if (event.type === 'message_delta') {
      stopReason = event.delta?.stop_reason ?? stopReason;
    } else if (event.type === 'error') {
      throw new Error(`${provider.name}: ${event.error?.message ?? 'The answer broke off.'}`);
    }
  }

  if (stopReason === 'refusal') {
    throw new Error('Claude declined to answer. Try asking for something else.');
  }
  yield {
    type: 'finish',
    stopReason: stopReason === 'tool_use' ? 'tool-calls' : toStopReason(stopReason === 'max_tokens'),
    providerData: { anthropic: { content: blocks.filter(Boolean) } },
  };
}

/** Anthropic has no tool role: tool results are sent as user content. */
function toAnthropicMessages(messages: KritzelChatMessage[]): unknown[] {
  return messages.flatMap(message => {
    const original = (message.providerData?.['anthropic'] as { content?: unknown[] } | undefined)?.content;
    if (message.role === 'assistant' && original?.length) {
      return [{ role: 'assistant', content: original }];
    }
    const content = message.parts.flatMap(part => toAnthropicBlock(part));
    return content.length ? [{ role: message.role === 'assistant' ? 'assistant' : 'user', content }] : [];
  });
}

function toAnthropicBlock(part: KritzelChatPart): unknown[] {
  switch (part.type) {
    case 'text':
      return part.text ? [{ type: 'text', text: part.text }] : [];
    case 'image':
      return [
        {
          type: 'image',
          source: part.data
            ? { type: 'base64', media_type: part.mediaType, data: part.data }
            : { type: 'url', url: part.url },
        },
      ];
    case 'tool-call':
      return [{ type: 'tool_use', id: part.id, name: part.name, input: toInputObject(part.input) }];
    case 'tool-result':
      return [{ type: 'tool_result', tool_use_id: part.toolCallId, content: part.output, is_error: part.isError }];
  }
}

// ─── OpenAI ──────────────────────────────────────────────────────────────────

interface OpenAiChunk {
  choices?: {
    finish_reason?: string | null;
    delta?: {
      content?: string | null;
      refusal?: string | null;
      tool_calls?: { index: number; id?: string; function?: { name?: string; arguments?: string } }[];
    };
  }[];
  error?: { message?: string };
}

async function* streamOpenAi(
  provider: Provider,
  apiKey: string,
  request: KritzelChatRequest,
  signal: AbortSignal,
): AsyncGenerator<KritzelChatStreamEvent> {
  const response = await post(provider, 'https://api.openai.com/v1/chat/completions', signal, {
    headers: { authorization: `Bearer ${apiKey}` },
    body: {
      model: provider.model,
      stream: true,
      messages: [
        ...(request.system ? [{ role: 'system', content: request.system }] : []),
        ...toOpenAiMessages(request.messages),
      ],
      tools: request.tools.map(tool => ({
        type: 'function',
        function: { name: tool.name, description: tool.description, parameters: tool.inputSchema },
      })),
    },
  });

  // The calls being written, by their index in the answer. A call is complete once the next one starts.
  const calls: { id: string; name: string; json: string; done: boolean }[] = [];
  let refusal = '';
  let finishReason: string | null | undefined;
  for await (const data of readServerSentEvents(response)) {
    if (data === '[DONE]') {
      break;
    }
    const chunk = JSON.parse(data) as OpenAiChunk;
    if (chunk.error) {
      throw new Error(`${provider.name}: ${chunk.error.message ?? 'The answer broke off.'}`);
    }
    const choice = chunk.choices?.[0];
    if (!choice) {
      continue;
    }
    const delta = choice.delta ?? {};
    if (delta.content) {
      yield { type: 'text-delta', text: delta.content };
    }
    refusal += delta.refusal ?? '';
    for (const toolCall of delta.tool_calls ?? []) {
      let call = calls[toolCall.index];
      if (!call) {
        yield* finishOpenAiCalls(calls);
        call = {
          id: toolCall.id ?? `call-${crypto.randomUUID()}`,
          name: toolCall.function?.name ?? '',
          json: '',
          done: false,
        };
        calls[toolCall.index] = call;
        yield { type: 'tool-call-start', id: call.id, name: call.name };
      }
      const json = toolCall.function?.arguments;
      if (json) {
        call.json += json;
        yield { type: 'tool-call-delta', id: call.id, inputDelta: json };
      }
    }
    finishReason = choice.finish_reason ?? finishReason;
  }
  yield* finishOpenAiCalls(calls);

  if (refusal) {
    throw new Error(`${provider.name}: ${refusal}`);
  }
  yield { type: 'finish', stopReason: calls.length ? 'tool-calls' : toStopReason(finishReason === 'length') };
}

function* finishOpenAiCalls(
  calls: { id: string; name: string; json: string; done: boolean }[],
): Generator<KritzelChatStreamEvent> {
  for (const call of calls) {
    if (call && !call.done) {
      call.done = true;
      yield {
        type: 'part',
        part: { type: 'tool-call', id: call.id, name: call.name, input: parseToolInput(call.json) },
      };
    }
  }
}

/** OpenAI has a message per tool result, and takes the input of a tool call as JSON text. */
function toOpenAiMessages(messages: KritzelChatMessage[]): unknown[] {
  return messages.flatMap((message): unknown[] => {
    if (message.role === 'tool') {
      return message.parts.flatMap(part =>
        part.type === 'tool-result' ? [{ role: 'tool', tool_call_id: part.toolCallId, content: part.output }] : [],
      );
    }
    const text = message.parts.flatMap(part => (part.type === 'text' && part.text ? [part.text] : [])).join('\n');
    if (message.role === 'assistant') {
      const toolCalls = message.parts.flatMap(part =>
        part.type === 'tool-call'
          ? [
              {
                id: part.id,
                type: 'function',
                function: { name: part.name, arguments: JSON.stringify(toInputObject(part.input)) },
              },
            ]
          : [],
      );
      return text || toolCalls.length
        ? [{ role: 'assistant', content: text || null, ...(toolCalls.length ? { tool_calls: toolCalls } : {}) }]
        : [];
    }
    const images = message.parts.flatMap(part =>
      part.type === 'image'
        ? [
            {
              type: 'image_url',
              image_url: { url: part.data ? `data:${part.mediaType};base64,${part.data}` : part.url },
            },
          ]
        : [],
    );
    return [{ role: 'user', content: images.length ? [{ type: 'text', text }, ...images] : text }];
  });
}

// ─── Gemini ──────────────────────────────────────────────────────────────────

type GeminiPart = Record<string, unknown> & {
  text?: string;
  thought?: boolean;
  functionCall?: { id?: string; name: string; args?: Record<string, unknown> };
};

interface GeminiChunk {
  candidates?: { finishReason?: string; content?: { parts?: GeminiPart[] } }[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
}

/** Gemini doesn't always name its calls, so the transport does. The prefix tells these IDs apart from Gemini's own. */
const GEMINI_CALL_ID_PREFIX = 'kritzel-call-';

async function* streamGemini(
  provider: Provider,
  apiKey: string,
  request: KritzelChatRequest,
  signal: AbortSignal,
): AsyncGenerator<KritzelChatStreamEvent> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:streamGenerateContent?alt=sse`;
  const response = await post(provider, url, signal, {
    headers: { 'x-goog-api-key': apiKey },
    body: {
      ...(request.system ? { systemInstruction: { parts: [{ text: request.system }] } } : {}),
      contents: toGeminiContents(request.messages),
      tools: [
        {
          functionDeclarations: request.tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            parametersJsonSchema: tool.inputSchema,
          })),
        },
      ],
    },
  });

  // Gemini's own parts, thought signatures included, are sent back unchanged with the next request.
  const parts: GeminiPart[] = [];
  let calls = 0;
  let finishReason: string | undefined;
  for await (const data of readServerSentEvents(response)) {
    const chunk = JSON.parse(data) as GeminiChunk;
    if (chunk.error) {
      throw new Error(`${provider.name}: ${chunk.error.message ?? 'The answer broke off.'}`);
    }
    if (chunk.promptFeedback?.blockReason) {
      throw new Error(`${provider.name} blocked the prompt (${chunk.promptFeedback.blockReason}).`);
    }
    const candidate = chunk.candidates?.[0];
    for (const part of candidate?.content?.parts ?? []) {
      parts.push(part);
      if (part.functionCall) {
        // Gemini writes each call in one piece, so it runs as soon as it arrives.
        const id = part.functionCall.id ?? `${GEMINI_CALL_ID_PREFIX}${crypto.randomUUID()}`;
        calls++;
        yield { type: 'tool-call-start', id, name: part.functionCall.name };
        yield {
          type: 'part',
          part: { type: 'tool-call', id, name: part.functionCall.name, input: part.functionCall.args ?? {} },
        };
      } else if (part.text && !part.thought) {
        yield { type: 'text-delta', text: part.text };
      }
    }
    finishReason = candidate?.finishReason ?? finishReason;
  }

  if (!parts.length && finishReason && finishReason !== 'STOP') {
    throw new Error(`${provider.name} stopped without an answer (${finishReason}).`);
  }
  yield {
    type: 'finish',
    stopReason: calls ? 'tool-calls' : toStopReason(finishReason === 'MAX_TOKENS'),
    providerData: { gemini: { parts } },
  };
}

/** Gemini calls the assistant "model" and takes tool results as user content. */
function toGeminiContents(messages: KritzelChatMessage[]): { role: string; parts: unknown[] }[] {
  const contents: { role: string; parts: unknown[] }[] = [];
  for (const message of messages) {
    const original = (message.providerData?.['gemini'] as { parts?: unknown[] } | undefined)?.parts;
    const role = message.role === 'assistant' ? 'model' : 'user';
    const parts =
      message.role === 'assistant' && original?.length ? original : message.parts.flatMap(part => toGeminiPart(part));
    if (!parts.length) {
      continue;
    }
    // Gemini expects the roles to take turns, e.g. the tool results and the next prompt in one user turn.
    const last = contents[contents.length - 1];
    if (last?.role === role) {
      last.parts.push(...parts);
    } else {
      contents.push({ role, parts: [...parts] });
    }
  }
  return contents;
}

function toGeminiPart(part: KritzelChatPart): unknown[] {
  switch (part.type) {
    case 'text':
      return part.text ? [{ text: part.text }] : [];
    case 'image':
      return part.data
        ? [{ inlineData: { mimeType: part.mediaType, data: part.data } }]
        : [{ text: `Image: ${part.url}` }];
    case 'tool-call':
      return [{ functionCall: { ...geminiCallId(part.id), name: part.name, args: toInputObject(part.input) } }];
    case 'tool-result':
      return [
        {
          functionResponse: {
            ...geminiCallId(part.toolCallId),
            name: part.name,
            response: toResponseObject(part.output),
          },
        },
      ];
  }
}

/** The ID of a call as Gemini knows it: none when the transport made it up. */
function geminiCallId(id: string): { id?: string } {
  return id.startsWith(GEMINI_CALL_ID_PREFIX) ? {} : { id };
}

/** Gemini takes a tool result as an object. */
function toResponseObject(output: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(output);
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : { result: value };
  } catch {
    return { result: output };
  }
}

// ─── Shared ──────────────────────────────────────────────────────────────────

interface PostOptions {
  headers: Record<string, string>;
  body: unknown;
}

/** Posts JSON to a provider and turns every failure into an error with a message that can be shown to the user. */
async function post(
  provider: Provider,
  url: string,
  signal: AbortSignal,
  { headers, body }: PostOptions,
): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      signal,
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (signal.aborted) {
      throw error;
    }
    // Fetch only fails like this without a response, e.g. offline or blocked, so the cause is kept for the console.
    throw Object.assign(new Error(`Could not reach ${provider.name}. Check your connection and try again.`), {
      cause: error,
    });
  }
  if (!response.ok) {
    const json = (await response.json().catch(() => undefined)) as
      { error?: { message?: string } } | { error?: { message?: string } }[] | undefined;
    // Gemini wraps its error in an array.
    const message =
      (Array.isArray(json) ? json[0] : json)?.error?.message || response.statusText || 'The request failed.';
    throw new Error(`${provider.name}: ${message} (${response.status})`);
  }
  return response;
}

/** Yields the data of each event of a server-sent events stream. */
async function* readServerSentEvents(response: Response): AsyncGenerator<string> {
  if (!response.body) {
    return;
  }
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      buffer = `${buffer}${value ?? ''}`.replace(/\r\n?/g, '\n');
      let end = buffer.indexOf('\n\n');
      while (end >= 0 || (done && buffer.trim())) {
        const event = end >= 0 ? buffer.slice(0, end) : buffer;
        buffer = end >= 0 ? buffer.slice(end + 2) : '';
        const data = event
          .split('\n')
          .filter(line => line.startsWith('data:'))
          .map(line => line.slice(5).replace(/^ /, ''))
          .join('\n');
        if (data) {
          yield data;
        }
        end = buffer.indexOf('\n\n');
      }
      if (done) {
        return;
      }
    }
  } finally {
    // Stops the download when the session stops reading, e.g. because the user pressed stop.
    await reader.cancel().catch(() => undefined);
  }
}

/** The input of a tool call: an object, or the raw text when it is not valid JSON, e.g. because it was cut off. */
function parseToolInput(json: string): unknown {
  if (!json.trim()) {
    return {};
  }
  try {
    return JSON.parse(json);
  } catch {
    return json;
  }
}

/** Providers take the input of an earlier call as an object, also when it was cut off. */
function toInputObject(input: unknown): Record<string, unknown> {
  const value = typeof input === 'string' ? parseToolInput(input) : input;
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function toStopReason(cutOff: boolean): KritzelChatStopReason {
  return cutOff ? 'max-tokens' : 'end';
}
