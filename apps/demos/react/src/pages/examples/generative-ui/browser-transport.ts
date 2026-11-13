import type {
  KritzelChatMessage,
  KritzelChatPart,
  KritzelChatRequest,
  KritzelChatStopReason,
  KritzelChatStreamEvent,
  KritzelChatTransport,
} from "@kritzel/react-editor";

/**
 * A chat transport that calls the model provider straight from the browser, with the API key the user typed in. It
 * translates Kritzel's chat protocol to the provider's API and streams the answer back, so tool calls run while the
 * model still writes. A real app sends the requests through its own backend instead, with `createHttpTransport()`, so
 * that no key ever reaches the browser.
 */

export type ProviderId = "anthropic" | "openai" | "gemini";

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
    id: "anthropic",
    name: "Anthropic",
    model: "claude-opus-5-5",
    keyPlaceholder: "sk-ant-…",
    keyUrl: "https://platform.claude.com/settings/keys",
  },
  {
    id: "openai",
    name: "OpenAI",
    model: "gpt-5.5",
    keyPlaceholder: "sk-…",
    keyUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "gemini",
    name: "Gemini",
    model: "gemini-flash-latest",
    keyPlaceholder: "AIza…",
    keyUrl: "https://aistudio.google.com/apikey",
  },
];

export interface Credentials {
  provider: ProviderId;
  apiKey: string;
}

export function getProvider(id: ProviderId): Provider {
  const provider = PROVIDERS.find((option) => option.id === id);
  if (!provider) {
    throw new Error(`Unknown provider "${id}".`);
  }
  return provider;
}

/** Recognizes the provider from the key's prefix, so pasting a key selects its provider. */
export function detectProvider(apiKey: string): ProviderId | undefined {
  const key = apiKey.trim();
  if (key.startsWith("sk-ant-")) return "anthropic";
  if (key.startsWith("sk-")) return "openai";
  if (key.startsWith("AIza")) return "gemini";
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
        throw new Error("Add an API key to start generating UIs.");
      }
      const provider = getProvider(credentials.provider);
      switch (provider.id) {
        case "anthropic":
          return streamAnthropic(provider, credentials.apiKey, request, signal);
        case "openai":
          return streamOpenAi(provider, credentials.apiKey, request, signal);
        case "gemini":
          return streamGemini(provider, credentials.apiKey, request, signal);
      }
    },
    setCredentials(next) {
      credentials = next;
    },
  };
}

// ─── Anthropic ───────────────────────────────────────────────────────────────

interface AnthropicBlock {
  type: string;
  id?: string;
  name?: string;
  text?: string;
  thinking?: string;
  signature?: string;
  input?: unknown;
  [key: string]: unknown;
}

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
    stop_details?: { explanation?: string | null } | null;
  };
  error?: { message?: string };
}

async function* streamAnthropic(provider: Provider, apiKey: string, request: KritzelChatRequest, signal: AbortSignal): AsyncGenerator<KritzelChatStreamEvent> {
  const response = await post(provider, "https://api.anthropic.com/v1/messages", signal, {
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2026-10-21",
      // Claude only answers browsers that opt in, because a key in a web page is readable by anyone who opens it.
      "anthropic-dangerous-direct-browser-access": "true",
      // Lets block_binding below drop thinking blocks that no longer match the conversation, instead of failing.
      "anthropic-beta": "thinking-binding-controls-2026-08-01",
    },
    body: {
      model: provider.model,
      max_tokens: 64000,
      stream: true,
      // Every step of the tool loop sends the whole conversation again: the part that was sent before is cached.
      cache_control: { type: "ephemeral" },
      system: request.system,
      // A safety net: tool input that was cut off goes back as {}, which can invalidate the thinking after it.
      // That thinking is dropped instead of failing the conversation.
      thinking: { type: "adaptive", block_binding: { prefix_mismatch_behavior: "drop_block" } },
      output_config: { effort: "medium" },
      // Streams each tool input while Claude writes it, so the canvas can show a placeholder early.
      tools: request.tools.map((tool) => ({ name: tool.name, description: tool.description, input_schema: tool.inputSchema, eager_input_streaming: true })),
      messages: toAnthropicMessages(request.messages),
    },
  });

  // Claude's own blocks, thinking included, are sent back unchanged with the next request. Only complete blocks count.
  const blocks: AnthropicBlock[] = [];
  const closed = new Set<number>();
  const inputs = new Map<number, string>();
  // A call whose input is not valid JSON waits for the stop reason: a refusal can cut it off, and then it must not run.
  let held: KritzelChatStreamEvent | undefined;
  let stopReason: string | undefined;
  let explanation: string | null | undefined;
  let ended = false;
  for await (const data of readServerSentEvents(provider, response)) {
    const event = parseEvent<AnthropicEvent>(provider, data);
    const index = event.index ?? 0;
    if (event.type === "content_block_start" && event.content_block) {
      if (held) {
        yield held;
        held = undefined;
      }
      const block = { ...event.content_block };
      blocks[index] = block;
      if (block.type === "tool_use") {
        inputs.set(index, "");
        yield { type: "tool-call-start", id: String(block.id), name: String(block.name) };
      }
    } else if (event.type === "content_block_delta" && event.delta && blocks[index]) {
      const block = blocks[index];
      const delta = event.delta;
      if (delta.type === "text_delta" && delta.text) {
        block.text = `${block.text ?? ""}${delta.text}`;
        yield { type: "text-delta", text: delta.text };
      } else if (delta.type === "input_json_delta" && delta.partial_json) {
        inputs.set(index, `${inputs.get(index) ?? ""}${delta.partial_json}`);
        yield { type: "tool-call-delta", id: String(block.id), inputDelta: delta.partial_json };
      } else if (delta.type === "thinking_delta") {
        block.thinking = `${block.thinking ?? ""}${delta.thinking ?? ""}`;
      } else if (delta.type === "signature_delta") {
        block.signature = delta.signature;
      }
    } else if (event.type === "content_block_stop" && blocks[index]) {
      closed.add(index);
      const block = blocks[index];
      if (block.type === "tool_use") {
        const input = parseToolInput(inputs.get(index) ?? "");
        // Claude needs an object back; input that was cut off is answered by the tool with an error anyway.
        block.input = toInputObject(input);
        const part: KritzelChatStreamEvent = { type: "part", part: { type: "tool-call", id: String(block.id), name: String(block.name), input } };
        if (typeof input === "string") {
          held = part;
        } else {
          yield part;
        }
      }
    } else if (event.type === "message_delta") {
      stopReason = event.delta?.stop_reason ?? stopReason;
      explanation = event.delta?.stop_details?.explanation ?? explanation;
      if (held && stopReason !== "refusal") {
        yield held;
        held = undefined;
      }
    } else if (event.type === "message_stop") {
      ended = true;
    } else if (event.type === "error") {
      throw new Error(`${provider.name}: ${event.error?.message ?? "The answer broke off."}`);
    }
  }

  if (stopReason === "refusal") {
    throw new Error(explanation ? `Claude declined to answer: ${explanation}` : "Claude declined to answer. Try asking for something else.");
  }
  if (!ended || !stopReason) {
    throw new Error(`${provider.name}: The answer broke off. Try again.`);
  }
  yield {
    type: "finish",
    stopReason: stopReason === "tool_use" ? "tool-calls" : toStopReason(stopReason === "max_tokens" || stopReason === "model_context_window_exceeded"),
    providerData: { anthropic: { content: blocks.filter((block, index) => block && closed.has(index)) } },
  };
}

/** Anthropic has no tool role: tool results are sent as user content. */
function toAnthropicMessages(messages: KritzelChatMessage[]): unknown[] {
  return messages.flatMap((message) => {
    const original = (message.providerData?.["anthropic"] as { content?: unknown[] } | undefined)?.content;
    if (message.role === "assistant" && original?.length) {
      return [{ role: "assistant", content: original }];
    }
    const content = message.parts.flatMap((part) => toAnthropicBlock(part));
    return content.length ? [{ role: message.role === "assistant" ? "assistant" : "user", content }] : [];
  });
}

function toAnthropicBlock(part: KritzelChatPart): unknown[] {
  switch (part.type) {
    case "text":
      return part.text ? [{ type: "text", text: part.text }] : [];
    case "image":
      return [{ type: "image", source: part.data ? { type: "base64", media_type: part.mediaType, data: part.data } : { type: "url", url: part.url } }];
    case "tool-call":
      return [{ type: "tool_use", id: part.id, name: part.name, input: toInputObject(part.input) }];
    case "tool-result":
      return [{ type: "tool_result", tool_use_id: part.toolCallId, content: part.output, is_error: part.isError }];
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

interface OpenAiCall {
  id: string;
  name: string;
  json: string;
  done: boolean;
}

async function* streamOpenAi(provider: Provider, apiKey: string, request: KritzelChatRequest, signal: AbortSignal): AsyncGenerator<KritzelChatStreamEvent> {
  const response = await post(provider, "https://api.openai.com/v1/chat/completions", signal, {
    headers: { authorization: `Bearer ${apiKey}` },
    body: {
      model: provider.model,
      stream: true,
      // Reasoning models take their instructions as developer messages.
      messages: [...(request.system ? [{ role: "developer", content: request.system }] : []), ...toOpenAiMessages(request.messages)],
      tools: request.tools.map((tool) => ({ type: "function", function: { name: tool.name, description: tool.description, parameters: tool.inputSchema } })),
    },
  });

  // The calls being written, by their index in the answer. A call is complete once the next one starts.
  const calls: OpenAiCall[] = [];
  let refusal = "";
  let finishReason: string | null | undefined;
  for await (const data of readServerSentEvents(provider, response)) {
    if (data === "[DONE]") {
      break;
    }
    const chunk = parseEvent<OpenAiChunk>(provider, data);
    if (chunk.error) {
      throw new Error(`${provider.name}: ${chunk.error.message ?? "The answer broke off."}`);
    }
    const choice = chunk.choices?.[0];
    if (!choice) {
      continue;
    }
    const delta = choice.delta ?? {};
    if (delta.content) {
      yield { type: "text-delta", text: delta.content };
    }
    refusal += delta.refusal ?? "";
    for (const toolCall of delta.tool_calls ?? []) {
      let call = calls[toolCall.index];
      if (!call) {
        yield* finishOpenAiCalls(calls);
        call = { id: toolCall.id ?? `call-${crypto.randomUUID()}`, name: toolCall.function?.name ?? "", json: "", done: false };
        calls[toolCall.index] = call;
        yield { type: "tool-call-start", id: call.id, name: call.name };
      } else if (!call.name && toolCall.function?.name) {
        call.name = toolCall.function.name;
      }
      const json = toolCall.function?.arguments;
      if (json) {
        call.json += json;
        yield { type: "tool-call-delta", id: call.id, inputDelta: json };
      }
    }
    finishReason = choice.finish_reason ?? finishReason;
  }
  yield* finishOpenAiCalls(calls);

  if (refusal) {
    throw new Error(`${provider.name}: ${refusal}`);
  }
  if (finishReason === "content_filter") {
    throw new Error(`${provider.name} stopped the answer because its content filter flagged it. Try asking for something else.`);
  }
  if (!finishReason) {
    throw new Error(`${provider.name}: The answer broke off. Try again.`);
  }
  yield { type: "finish", stopReason: calls.length ? "tool-calls" : toStopReason(finishReason === "length") };
}

function* finishOpenAiCalls(calls: OpenAiCall[]): Generator<KritzelChatStreamEvent> {
  for (const call of calls) {
    if (call && !call.done) {
      call.done = true;
      yield { type: "part", part: { type: "tool-call", id: call.id, name: call.name, input: parseToolInput(call.json) } };
    }
  }
}

/** OpenAI has a message per tool result, and takes the input of a tool call as JSON text. */
function toOpenAiMessages(messages: KritzelChatMessage[]): unknown[] {
  return messages.flatMap((message): unknown[] => {
    if (message.role === "tool") {
      return message.parts.flatMap((part) => (part.type === "tool-result" ? [{ role: "tool", tool_call_id: part.toolCallId, content: part.output }] : []));
    }
    const text = message.parts.flatMap((part) => (part.type === "text" && part.text ? [part.text] : [])).join("\n");
    if (message.role === "assistant") {
      const toolCalls = message.parts.flatMap((part) =>
        part.type === "tool-call" ? [{ id: part.id, type: "function", function: { name: part.name, arguments: JSON.stringify(toInputObject(part.input)) } }] : [],
      );
      return text || toolCalls.length ? [{ role: "assistant", content: text || null, ...(toolCalls.length ? { tool_calls: toolCalls } : {}) }] : [];
    }
    const images = message.parts.flatMap((part) =>
      part.type === "image" ? [{ type: "image_url", image_url: { url: part.data ? `data:${part.mediaType};base64,${part.data}` : part.url } }] : [],
    );
    return [{ role: "user", content: images.length ? [{ type: "text", text }, ...images] : text }];
  });
}

// ─── Gemini ──────────────────────────────────────────────────────────────────

interface GeminiPart {
  text?: string;
  thought?: boolean;
  thoughtSignature?: string;
  functionCall?: { id?: string; name: string; args?: Record<string, unknown> };
  [key: string]: unknown;
}

interface GeminiChunk {
  candidates?: { finishReason?: string; finishMessage?: string; content?: { parts?: GeminiPart[] } }[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
}

/** Gemini doesn't always name its calls, so the transport does. The prefix tells these IDs apart from Gemini's own. */
const GEMINI_CALL_ID_PREFIX = "kritzel-call-";

/**
 * Gemini wants a thought signature on the first call of every model turn. A turn that Gemini didn't write in one piece,
 * e.g. one that the user stopped or that another provider wrote, gets this placeholder, which skips the check.
 */
const GEMINI_SKIP_SIGNATURE = "skip_thought_signature_validator";

async function* streamGemini(provider: Provider, apiKey: string, request: KritzelChatRequest, signal: AbortSignal): AsyncGenerator<KritzelChatStreamEvent> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:streamGenerateContent?alt=sse`;
  const response = await post(provider, url, signal, {
    headers: { "x-goog-api-key": apiKey },
    body: {
      ...(request.system ? { systemInstruction: { parts: [{ text: request.system }] } } : {}),
      contents: toGeminiContents(request.messages),
      tools: [{ functionDeclarations: request.tools.map((tool) => ({ name: tool.name, description: tool.description, parametersJsonSchema: tool.inputSchema })) }],
    },
  });

  // Gemini's own parts, thought signatures included, are sent back unchanged with the next request.
  const parts: GeminiPart[] = [];
  let calls = 0;
  let finishReason: string | undefined;
  let finishMessage: string | undefined;
  for await (const data of readServerSentEvents(provider, response)) {
    const chunk = parseEvent<GeminiChunk>(provider, data);
    if (chunk.error) {
      throw new Error(`${provider.name}: ${chunk.error.message ?? "The answer broke off."}`);
    }
    if (chunk.promptFeedback?.blockReason) {
      throw new Error(`${provider.name} blocked the prompt (${chunk.promptFeedback.blockReason}).`);
    }
    const candidate = chunk.candidates?.[0];
    for (const part of candidate?.content?.parts ?? []) {
      parts.push(part);
      if (part.functionCall) {
        // Gemini writes each call in one piece, so it runs as soon as it arrives. Its signature stays with it, so that
        // the call can be sent back with it even when the rest of the answer is lost.
        const id = part.functionCall.id ?? `${GEMINI_CALL_ID_PREFIX}${crypto.randomUUID()}`;
        const providerData = part.thoughtSignature ? { gemini: { thoughtSignature: part.thoughtSignature } } : undefined;
        calls++;
        yield { type: "tool-call-start", id, name: part.functionCall.name };
        yield { type: "part", part: { type: "tool-call", id, name: part.functionCall.name, input: part.functionCall.args ?? {}, providerData } };
      } else if (part.text && !part.thought) {
        yield { type: "text-delta", text: part.text };
      }
    }
    finishReason = candidate?.finishReason ?? finishReason;
    finishMessage = candidate?.finishMessage ?? finishMessage;
  }

  if (!finishReason) {
    throw new Error(`${provider.name}: The answer broke off. Try again.`);
  }
  const cutOff = finishReason === "MAX_TOKENS" || finishReason === "CONTINUATION";
  if (!calls && finishReason !== "STOP" && !cutOff) {
    throw new Error(`${provider.name} stopped without an answer (${finishMessage || finishReason}).`);
  }
  yield { type: "finish", stopReason: calls ? "tool-calls" : toStopReason(cutOff), providerData: { gemini: { parts } } };
}

/** Gemini calls the assistant "model" and takes tool results as user content. */
function toGeminiContents(messages: KritzelChatMessage[]): { role: string; parts: unknown[] }[] {
  const contents: { role: string; parts: unknown[] }[] = [];
  for (const message of messages) {
    const original = (message.providerData?.["gemini"] as { parts?: unknown[] } | undefined)?.parts;
    const role = message.role === "assistant" ? "model" : "user";
    const parts = message.role === "assistant" && original?.length ? original : toGeminiParts(message);
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

/** The parts of a message that Gemini didn't send in one piece. */
function toGeminiParts(message: KritzelChatMessage): GeminiPart[] {
  const parts = message.parts.flatMap((part) => toGeminiPart(part));
  const firstCall = parts.find((part) => part.functionCall);
  if (message.role === "assistant" && firstCall && !firstCall.thoughtSignature) {
    firstCall.thoughtSignature = GEMINI_SKIP_SIGNATURE;
  }
  return parts;
}

function toGeminiPart(part: KritzelChatPart): GeminiPart[] {
  switch (part.type) {
    case "text":
      return part.text ? [{ text: part.text }] : [];
    case "image":
      return part.data ? [{ inlineData: { mimeType: part.mediaType, data: part.data } }] : [{ text: `Image: ${part.url}` }];
    case "tool-call": {
      const signature = (part.providerData?.["gemini"] as { thoughtSignature?: string } | undefined)?.thoughtSignature;
      return [{ functionCall: { ...geminiCallId(part.id), name: part.name, args: toInputObject(part.input) }, ...(signature ? { thoughtSignature: signature } : {}) }];
    }
    case "tool-result": {
      // Gemini takes the details of a failed call under "error".
      const response = toResponseObject(part.output);
      return [{ functionResponse: { ...geminiCallId(part.toolCallId), name: part.name, response: part.isError ? { error: response } : response } }];
    }
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
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : { result: value };
  } catch {
    return { result: output };
  }
}

// ─── Shared ──────────────────────────────────────────────────────────────────

interface PostOptions {
  headers: Record<string, string>;
  body: unknown;
}

/** How often a request is tried when the provider is busy or can't be reached, before anything was streamed. */
const ATTEMPTS = 3;

/**
 * Posts JSON to a provider and turns every failure into an error with a message that can be shown to the user. Rate
 * limits, server errors and connection errors are tried again after a short wait.
 */
async function post(provider: Provider, url: string, signal: AbortSignal, { headers, body }: PostOptions): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        signal,
        headers: { "content-type": "application/json", ...headers },
        body: JSON.stringify(body),
      });
    } catch (error) {
      if (signal.aborted) {
        throw error;
      }
      if (attempt < ATTEMPTS) {
        await wait(500 * 2 ** attempt, signal);
        continue;
      }
      // Fetch only fails like this without a response, e.g. offline or blocked, so the cause is kept for the console.
      throw Object.assign(new Error(`Could not reach ${provider.name}. Check your connection and try again.`), { cause: error });
    }
    if (response.ok) {
      return response;
    }
    const retry = (response.status === 429 || response.status >= 500) && response.headers.get("x-should-retry") !== "false";
    if (retry && attempt < ATTEMPTS) {
      await response.body?.cancel().catch(() => undefined);
      await wait(Number(response.headers.get("retry-after")) * 1000 || 500 * 2 ** attempt, signal);
      continue;
    }
    const json = (await response.json().catch(() => undefined)) as { error?: { message?: string } } | { error?: { message?: string } }[] | undefined;
    // Gemini wraps its error in an array.
    const message = (Array.isArray(json) ? json[0] : json)?.error?.message || response.statusText || "The request failed.";
    throw new Error(`${provider.name}: ${message} (${response.status})`);
  }
}

/** Waits, or rejects as soon as the user stops the response. */
function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(done, Math.min(ms, 10_000));
    signal.addEventListener("abort", abort, { once: true });
    function done() {
      signal.removeEventListener("abort", abort);
      resolve();
    }
    function abort() {
      clearTimeout(timer);
      reject(signal.reason);
    }
  });
}

/**
 * Yields the data of each event of a server-sent events stream. An event that the stream ends in the middle of is
 * dropped; the provider's own end of the answer is missing then, which tells that the answer broke off.
 */
async function* readServerSentEvents(provider: Provider, response: Response): AsyncGenerator<string> {
  if (!response.body) {
    throw new Error(`${provider.name}: The answer was empty.`);
  }
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      // A line ends with CRLF, LF or CR. A CR at the end of a chunk can be the first half of a CRLF, so it waits.
      const text = `${buffer}${value ?? ""}`;
      const pendingCr = !done && text.endsWith("\r");
      buffer = (pendingCr ? text.slice(0, -1) : text).replace(/\r\n?/g, "\n") + (pendingCr ? "\r" : "");
      for (let end = buffer.indexOf("\n\n"); end >= 0; end = buffer.indexOf("\n\n")) {
        const event = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        const data = event
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).replace(/^ /, ""))
          .join("\n");
        if (data) {
          yield data;
        }
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

/** Parses the JSON of an event, with an error that can be shown to the user when the stream was garbled. */
function parseEvent<T>(provider: Provider, data: string): T {
  try {
    return JSON.parse(data) as T;
  } catch {
    throw new Error(`${provider.name}: The answer broke off. Try again.`);
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
  const value = typeof input === "string" ? parseToolInput(input) : input;
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function toStopReason(cutOff: boolean): KritzelChatStopReason {
  return cutOff ? "max-tokens" : "end";
}
