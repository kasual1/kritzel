// TEMP: mock of the chat server that the agentic-canvas blog post assumes at `/api/chat`, for the temp demo
// (pages/temp/GenerativeUi.tsx); delete with pages/temp/ and its plugin in vite.config.ts.
//
// It runs inside the Vite dev server (`npm run demo:react`), not in the browser: it reads `ANTHROPIC_API_KEY` from
// the `.env` file at the repository root, so the key never reaches the page. Each request is one model step in
// Kritzel's chat protocol; the answer streams back as newline-delimited JSON, one `KritzelChatStreamEvent` per line,
// which `createHttpTransport()` reads.
import { readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { parse } from 'dotenv';
import type { Plugin } from 'vite';
import type {
  KritzelChatMessage,
  KritzelChatPart,
  KritzelChatRequest,
  KritzelChatStopReason,
  KritzelChatStreamEvent,
} from '@kritzel/react-editor';

const MODEL = 'claude-opus-5-5';

/** What a real server adds to the app's instructions. */
const SERVER_SYSTEM = `You work on an infinite whiteboard through the tools you are given, as the user: your changes \
are made with the user's own hands, on their selection, and undo like theirs. When the user's message lists objects \
(chips), the request is about those objects. Use the object IDs returned by earlier tool calls to refer to what you \
created. Look at the canvas before you change it. Reply in one short sentence; the canvas shows the result.`;

/** The Vite plugin that answers `POST /api/chat` on the dev server. */
export function mockChatServer(): Plugin {
  return {
    name: 'temp-mock-chat-server',
    apply: 'serve',
    configureServer(server) {
      const apiKey = readRootEnv('ANTHROPIC_API_KEY');
      if (!apiKey) {
        server.config.logger.warn(
          '[mock-chat-server] ANTHROPIC_API_KEY is not set in the root .env: /temp/agentic-canvas cannot reach the model.',
        );
      }
      const client = apiKey ? new Anthropic({ apiKey }) : null;
      server.middlewares.use('/api/chat', (req, res, next) => {
        if (req.method !== 'POST') {
          next();
          return;
        }
        handleChat(client, req, res).catch(error => {
          server.config.logger.error(`[mock-chat-server] ${errorMessage(error)}`);
          if (!res.headersSent) {
            sendJson(res, 500, { error: 'The chat server failed.' });
          } else {
            res.end();
          }
        });
      });
    },
  };
}

/**
 * `ANTHROPIC_API_KEY` from the env files at the repository root (later files win), and only from there: never from
 * the shell environment, so a key exported for other tools isn't used by accident.
 */
function readRootEnv(name: string): string {
  let value = '';
  for (const file of ['.env', '.env.local']) {
    try {
      const parsed = parse(readFileSync(fileURLToPath(new URL(`../../../../../../${file}`, import.meta.url)), 'utf8'));
      if (name in parsed) value = parsed[name];
    } catch {
      // No such file.
    }
  }
  return value;
}

async function handleChat(client: Anthropic | null, req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!client) {
    sendJson(res, 500, { error: 'ANTHROPIC_API_KEY is not set in the .env file at the repository root.' });
    return;
  }
  let request: KritzelChatRequest;
  try {
    request = JSON.parse(await readBody(req));
  } catch {
    sendJson(res, 400, { error: 'The request is not valid JSON.' });
    return;
  }
  if (!request || !Array.isArray(request.messages) || !Array.isArray(request.tools)) {
    sendJson(res, 400, { error: 'The request is not a Kritzel chat request.' });
    return;
  }

  // The user stopped the prompt (or closed the page): stop the model too.
  const abort = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) abort.abort();
  });

  // The status is sent with the first event, so that a failure before it (a wrong key, a rate limit) still gets
  // an error status. Once the answer has started, a failure is sent as an `error` event.
  const send = (event: KritzelChatStreamEvent) => {
    if (!res.headersSent) {
      res.writeHead(200, { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-cache' });
    }
    res.write(JSON.stringify(event) + '\n');
  };
  try {
    for await (const event of streamChat(client, request, abort.signal)) {
      send(event);
    }
  } catch (error) {
    if (abort.signal.aborted) {
      res.end();
      return;
    }
    console.error('[mock-chat-server]', error);
    if (!res.headersSent) {
      sendJson(res, error instanceof Anthropic.APIError && error.status ? error.status : 502, { error: errorMessage(error) });
      return;
    }
    send({ type: 'error', message: errorMessage(error) });
  }
  res.end();
}

/**
 * One model step, streamed while Claude writes it. Each tool call is announced when the model starts it and its
 * input streams as written; it is sent complete as soon as its input is, so the session can run it right away.
 */
async function* streamChat(client: Anthropic, request: KritzelChatRequest, signal: AbortSignal): AsyncGenerator<KritzelChatStreamEvent> {
  const stream = client.beta.messages.stream(
    {
      model: MODEL,
      max_tokens: 64000,
      // A canvas assistant should answer quickly; the tools do the heavy lifting.
      output_config: { effort: 'low' },
      // On a refusal, the API retries the step on a fallback model.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: [request.system, SERVER_SYSTEM].filter(Boolean).join('\n\n'),
      // Tool inputs stream as the model writes them instead of in one piece at the end; the API no longer checks
      // them, so a call can end with invalid JSON.
      tools: request.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema as Anthropic.Beta.BetaTool.InputSchema,
        eager_input_streaming: true,
      })),
      messages: toAnthropicMessages(request.messages),
    },
    { signal },
  );

  // The tool calls being written, by content block index.
  const open = new Map<number, { id: string; name: string; json: string }>();
  try {
    for await (const event of stream) {
      if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
        const { id, name } = event.content_block;
        open.set(event.index, { id, name, json: '' });
        yield { type: 'tool-call-start', id, name };
      } else if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { type: 'text-delta', text: event.delta.text };
      } else if (event.type === 'content_block_delta' && event.delta.type === 'input_json_delta') {
        const call = open.get(event.index);
        if (call) {
          call.json += event.delta.partial_json;
          yield { type: 'tool-call-delta', id: call.id, inputDelta: event.delta.partial_json };
        }
      } else if (event.type === 'content_block_stop') {
        const call = open.get(event.index);
        if (call) {
          open.delete(event.index);
          // Invalid JSON goes on as the raw text: the tool answers that the input is invalid.
          const input = parseJson(call.json || '{}', call.json);
          yield { type: 'part', part: { type: 'tool-call', id: call.id, name: call.name, input } };
        }
      }
    }
    const final = await stream.finalMessage();
    const stopReason = STOP_REASONS[final.stop_reason ?? ''] ?? 'other';
    yield { type: 'finish', stopReason, providerData: { anthropicContent: final.content } };
  } catch (error) {
    // The SDK fails the stream when a tool input it reads is not JSON, which can only happen while a call is open.
    // Everything else is a real failure.
    if (error instanceof Anthropic.APIError || signal.aborted || !open.size) {
      throw error;
    }
    // The SDK ignores the rest of the answer: stop the model writing it.
    stream.abort();
    for (const call of open.values()) {
      yield { type: 'part', part: { type: 'tool-call', id: call.id, name: call.name, input: call.json } };
    }
    // Without the model's content, the next step sends the parts back instead.
    yield { type: 'finish', stopReason: 'other' };
  }
}

/** The conversation in the Messages API's shape. Tool results go back as user messages. */
function toAnthropicMessages(messages: KritzelChatMessage[]): Anthropic.Beta.BetaMessageParam[] {
  const result: Anthropic.Beta.BetaMessageParam[] = [];
  // Tool calls left out of the assistant message before (see `withoutDeclined`), by ID, with their names.
  let leftOut = new Map<string, string>();
  for (const message of messages) {
    if (message.role === 'assistant') {
      // Send the model's own content back (thinking blocks included), as the API expects: unchanged, except after
      // a fallback.
      const content = message.providerData?.['anthropicContent'] as Anthropic.Beta.BetaContentBlockParam[] | undefined;
      const echoed = content
        ? withoutDeclined(content)
        : { content: message.parts.flatMap(toAnthropicBlock), leftOut: new Map<string, string>() };
      leftOut = echoed.leftOut;
      result.push({ role: 'assistant', content: echoed.content });
      continue;
    }
    const calls = leftOut;
    // The results of left-out calls go back as text: the calls ran on the canvas, and the model should know it
    // (and the message never ends up empty, which would leave the conversation ending with the assistant).
    const content = message.parts.flatMap(toAnthropicBlock).map<Anthropic.Beta.BetaContentBlockParam>(block =>
      block.type === 'tool_result' && calls.has(block.tool_use_id)
        ? {
            type: 'text',
            text: `Before the switch to another model, the tool call ${block.tool_use_id} (${calls.get(block.tool_use_id)}) already ran with this result: ${typeof block.content === 'string' ? block.content : JSON.stringify(block.content ?? '')}`,
          }
        : block,
    );
    leftOut = new Map();
    result.push({ role: 'user', content });
  }
  return result;
}

/** Blocks of a model that declined mid-answer that the API does not take back. */
const DECLINED_BLOCK_TYPES = new Set(['thinking', 'redacted_thinking', 'tool_use']);

/**
 * After a fallback mid-answer, the API wants the thinking and tool calls before the last `fallback` block left out;
 * the text before it, the block itself (in place) and everything after it go back unchanged. Returns the tool calls
 * left out (ID to name).
 */
function withoutDeclined(content: Anthropic.Beta.BetaContentBlockParam[]): {
  content: Anthropic.Beta.BetaContentBlockParam[];
  leftOut: Map<string, string>;
} {
  // -1 without a fallback: every block is after it.
  const boundary = content.map(block => block.type).lastIndexOf('fallback');
  const leftOut = new Map<string, string>();
  const kept = content.filter((block, index) => {
    if (index > boundary || !DECLINED_BLOCK_TYPES.has(block.type)) {
      return true;
    }
    if (block.type === 'tool_use') {
      leftOut.set(block.id, block.name);
    }
    return false;
  });
  return { content: kept, leftOut };
}

function toAnthropicBlock(part: KritzelChatPart): Anthropic.Beta.BetaContentBlockParam[] {
  switch (part.type) {
    case 'text':
      return part.text ? [{ type: 'text', text: part.text }] : [];
    case 'image':
      if (part.data) return [{ type: 'image', source: { type: 'base64', media_type: part.mediaType as 'image/png', data: part.data } }];
      return part.url ? [{ type: 'image', source: { type: 'url', url: part.url } }] : [];
    case 'tool-call': {
      // A string input is JSON text, which a streamed call may have left invalid; the API wants an object.
      const input = typeof part.input === 'string' ? parseJson(part.input, {}) : part.input;
      return [{ type: 'tool_use', id: part.id, name: part.name, input }];
    }
    case 'tool-result':
      return [{ type: 'tool_result', tool_use_id: part.toolCallId, content: part.output, ...(part.isError ? { is_error: true } : {}) }];
  }
}

/** The value of a JSON text, or `fallback` when the text is not valid JSON. */
function parseJson(text: string, fallback: unknown): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

const STOP_REASONS: Record<string, KritzelChatStopReason> = {
  end_turn: 'end',
  tool_use: 'tool-calls',
  max_tokens: 'max-tokens',
  refusal: 'refusal',
};

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', chunk => (body += chunk));
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
