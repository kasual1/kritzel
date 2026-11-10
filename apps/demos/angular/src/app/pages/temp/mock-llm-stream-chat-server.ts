// TEMP: mock of a streaming chat backend that answers with a real model, for the temp streaming demo; delete with pages/temp/.
import Anthropic from '@anthropic-ai/sdk';
import type { KritzelChatStreamEvent, KritzelChatTransport } from '@kritzel/angular-editor';
import { MODEL, SERVER_SYSTEM, STOP_REASONS, client, parseJson, toAnthropicMessages } from './mock-llm-chat-server';

/**
 * Stands in for a streaming `fetch('/api/chat')` (server-sent events): the same model step as `llmTransport`, streamed
 * while Claude writes it. Each tool call is announced when the model starts it and its input streams as written, so
 * the session can show a placeholder for it; it is sent complete as soon as its input is, so the session can run it
 * right away. The key is added by the dev-server proxy, as for `llmTransport`.
 */
export const llmStreamTransport: KritzelChatTransport = async function* (
  request,
  { signal },
): AsyncGenerator<KritzelChatStreamEvent> {
  const stream = client.beta.messages.stream(
    {
      model: MODEL,
      max_tokens: 64000,
      output_config: { effort: 'low' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: [request.system, SERVER_SYSTEM].filter(Boolean).join('\n\n'),
      // Tool inputs stream as the model writes them instead of in one piece at the end; the API no longer checks
      // them, so a call can end with invalid JSON.
      tools: request.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema,
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
};
