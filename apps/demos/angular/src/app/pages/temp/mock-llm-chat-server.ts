// TEMP: mock of a chat backend that answers with a real model, for the temp command-mode and streaming demos; delete with pages/temp/.
// The streaming variant (`mock-llm-stream-chat-server.ts`) reuses the client and conversion helpers exported here.
import Anthropic from '@anthropic-ai/sdk';
import type {
  KritzelChatMessage,
  KritzelChatPart,
  KritzelChatResponse,
  KritzelChatStopReason,
  KritzelChatTransport,
} from '@kritzel/angular-editor';

/**
 * The browser never sees the key: `proxy.conf.mjs` forwards this path to api.anthropic.com and adds
 * `ANTHROPIC_API_KEY` from the `.env` file at the repository root. Only `ng serve` has the proxy.
 */
export const client = new Anthropic({
  baseURL: `${location.origin}/temp-anthropic`,
  apiKey: 'set-by-the-dev-server-proxy',
  dangerouslyAllowBrowser: true,
});

export const MODEL = 'claude-opus-5-5';

/** What a real server adds to the app's instructions. */
export const SERVER_SYSTEM = `You work on an infinite whiteboard through the tools you are given, as the user: your changes \
are made with the user's own hands, on their selection, and undo like theirs. When the user's message lists objects \
(chips), the request is about those objects. Use the object IDs returned by earlier tool calls to refer to what you \
created. Reply in one short sentence; the canvas shows the result.`;

/** Stands in for `fetch('/api/chat')`: one model step per request, answered by Claude. */
export const llmTransport: KritzelChatTransport = async (request, { signal }) => {
  const response = await client.beta.messages.create(
    {
      model: MODEL,
      max_tokens: 16000,
      // A canvas assistant should answer quickly; the tools do the heavy lifting.
      output_config: { effort: 'low' },
      // On a refusal, the API retries the step on a fallback model.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: [request.system, SERVER_SYSTEM].filter(Boolean).join('\n\n'),
      tools: request.tools.map(tool => ({ name: tool.name, description: tool.description, input_schema: tool.inputSchema })),
      messages: toAnthropicMessages(request.messages),
    },
    { signal },
  );
  return toChatResponse(response);
};

/** The conversation in the Messages API's shape. Tool results go back as user messages. */
export function toAnthropicMessages(messages: KritzelChatMessage[]): Anthropic.Beta.BetaMessageParam[] {
  const result: Anthropic.Beta.BetaMessageParam[] = [];
  // Tool calls left out of the assistant message before (see `withoutDeclined`), by ID, with their names.
  let leftOut = new Map<string, string>();
  for (const message of messages) {
    if (message.role === 'assistant') {
      // Send the model's own content back (thinking blocks included), as the API expects: unchanged, except after
      // a fallback.
      const content = message.providerData?.['anthropicContent'] as Anthropic.Beta.BetaContentBlockParam[] | undefined;
      const echoed = content ? withoutDeclined(content) : { content: message.parts.flatMap(toAnthropicBlock), leftOut: new Map<string, string>() };
      leftOut = echoed.leftOut;
      result.push({ role: 'assistant', content: echoed.content });
      continue;
    }
    const calls = leftOut;
    // The results of left-out calls go back as text: the calls ran on the canvas, and the model should know it
    // (and the message never ends up empty, which would leave the conversation ending with the assistant).
    const content = message.parts.flatMap(toAnthropicBlock).map<Anthropic.Beta.BetaContentBlockParam>(block =>
      block.type === 'tool_result' && calls.has(block.tool_use_id)
        ? { type: 'text', text: `Before the switch to another model, the tool call ${block.tool_use_id} (${calls.get(block.tool_use_id)}) already ran with this result: ${typeof block.content === 'string' ? block.content : JSON.stringify(block.content ?? '')}` }
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
 * left out (ID to name). With eager tool calls, such a call may already have run on the canvas, and the fallback
 * model, which never saw it, may make it again.
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
export function parseJson(text: string, fallback: unknown): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

/** The model's answer in the chat protocol's shape; its raw content rides along to be sent back next step. */
function toChatResponse(response: Anthropic.Beta.BetaMessage): KritzelChatResponse {
  const parts: KritzelChatPart[] = [];
  for (const block of response.content) {
    if (block.type === 'text' && block.text) parts.push({ type: 'text', text: block.text });
    if (block.type === 'tool_use') parts.push({ type: 'tool-call', id: block.id, name: block.name, input: block.input });
  }
  return {
    version: 1,
    message: { role: 'assistant', parts, providerData: { anthropicContent: response.content } },
    stopReason: STOP_REASONS[response.stop_reason ?? ''] ?? 'other',
  };
}

export const STOP_REASONS: Record<string, KritzelChatStopReason> = {
  end_turn: 'end',
  tool_use: 'tool-calls',
  max_tokens: 'max-tokens',
  refusal: 'refusal',
};
