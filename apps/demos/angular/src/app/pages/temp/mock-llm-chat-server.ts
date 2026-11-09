// TEMP: mock of a chat backend that answers with a real model, for the temp command-mode demo; delete with pages/temp/.
import Anthropic from '@anthropic-ai/sdk';
import type {
  KritzelChatMessage,
  KritzelChatPart,
  KritzelChatRequest,
  KritzelChatResponse,
  KritzelChatStopReason,
  KritzelChatTransport,
} from '@kritzel/angular-editor';

/**
 * The browser never sees the key: `proxy.conf.mjs` forwards this path to api.anthropic.com and adds
 * `ANTHROPIC_API_KEY` from the `.env` file at the repository root. Only `ng serve` has the proxy.
 */
const client = new Anthropic({
  baseURL: `${location.origin}/temp-anthropic`,
  apiKey: 'set-by-the-dev-server-proxy',
  dangerouslyAllowBrowser: true,
});

const MODEL = 'claude-opus-5-5';

/** What a real server adds to the app's instructions. */
const SERVER_SYSTEM = `You work on an infinite whiteboard through the tools you are given, as the user: your changes \
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
function toAnthropicMessages(messages: KritzelChatMessage[]): Anthropic.Beta.BetaMessageParam[] {
  return messages.map(message => {
    if (message.role === 'assistant') {
      // Send the model's own content back unchanged (thinking blocks included), as the API expects.
      const content = message.providerData?.['anthropicContent'] as Anthropic.Beta.BetaContentBlockParam[] | undefined;
      return { role: 'assistant', content: content ?? message.parts.flatMap(toAnthropicBlock) };
    }
    return { role: 'user', content: message.parts.flatMap(toAnthropicBlock) };
  });
}

function toAnthropicBlock(part: KritzelChatPart): Anthropic.Beta.BetaContentBlockParam[] {
  switch (part.type) {
    case 'text':
      return part.text ? [{ type: 'text', text: part.text }] : [];
    case 'image':
      if (part.data) return [{ type: 'image', source: { type: 'base64', media_type: part.mediaType as 'image/png', data: part.data } }];
      return part.url ? [{ type: 'image', source: { type: 'url', url: part.url } }] : [];
    case 'tool-call':
      return [{ type: 'tool_use', id: part.id, name: part.name, input: typeof part.input === 'string' ? JSON.parse(part.input) : part.input }];
    case 'tool-result':
      return [{ type: 'tool_result', tool_use_id: part.toolCallId, content: part.output, ...(part.isError ? { is_error: true } : {}) }];
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

const STOP_REASONS: Record<string, KritzelChatStopReason> = {
  end_turn: 'end',
  tool_use: 'tool-calls',
  max_tokens: 'max-tokens',
  refusal: 'refusal',
};
