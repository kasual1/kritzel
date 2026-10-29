import Anthropic from '@anthropic-ai/sdk';
import type { HTMLKritzelEditorElement } from '@kritzel/react-editor';
import { ANTHROPIC_API_KEY, CLAUDE_EFFORT, CLAUDE_MODEL } from './agent-config';
import { CANVAS_TOOLS, CanvasToolError, CanvasToolRunner } from './canvas-tools';
import { isFrame } from './frame';
import { describeProductPhotos } from './product-photos';

const SYSTEM_PROMPT = `You are a web designer working on an infinite canvas, like Framer. The canvas holds frames: \
fixed-size viewports that each render one web page. The user talks to you through a chat box and sees every change live.

To build a page, create a frame for it with create_frame, then write the page with write_frame. To change an existing page, \
read it with read_frame first and then write the complete new version. Lay out related frames side by side, e.g. the desktop, \
tablet and phone version of the same page.

Pages are self-contained: no external scripts or stylesheets, except Google Fonts. Use inline SVG for icons and illustrations \
and CSS gradients instead of photos, except for the product photos below. Design modern, polished pages with a clear visual \
hierarchy, generous whitespace and realistic copy. Make the frame tall enough to show the whole page, because a frame does not \
scroll on the canvas.

The canvas has photos of one product, the red running shoe, shot on a light grey studio background. Use them with <img> and \
these exact URLs whenever a page is about the shoe, its variants, sneakers or running:
${describeProductPhotos()}

A page about the shoe is a modern fashion website, like a sneaker drop from a luxury label: an editorial, magazine-like layout \
with big confident typography, a calm off-white and grey palette that lets the shoe's red accents stand out, and the shoe as \
the hero. The photo backgrounds are a soft grey around #e6e6e6, so blend them in by placing them on that color or using \
mix-blend-mode: multiply on a lighter background, and give them room.

Keep chat replies to one short sentence; the canvas shows the result.`;

/** Upper bound for model requests per prompt, so a confused loop cannot run forever. */
const MAX_REQUESTS = 24;

/** Consecutive retries when a streamed tool input is not valid JSON. */
const MAX_JSON_RETRIES = 2;

export interface CanvasAgentCallbacks {
  /** Short description of what Claude is doing right now. */
  onStatus: (status: string) => void;
  /** Claude started working on this frame. */
  onFrameFocus: (frameId: string) => void;
}

/** The last sentence of streamed text, shortened to fit a cursor label. */
function toStatus(text: string): string {
  const sentences = text.trim().split(/(?<=[.!?])\s+/);
  const sentence = sentences[sentences.length - 1] ?? '';
  return sentence.length > 64 ? `${sentence.slice(0, 63)}…` : sentence;
}

/**
 * A chat with Claude about the canvas. Each prompt runs an agentic loop: Claude calls canvas tools until the request is done.
 * The conversation is kept between prompts, so follow-ups like "make it darker" work.
 */
export class CanvasAgent {
  private readonly client = new Anthropic({ apiKey: ANTHROPIC_API_KEY, dangerouslyAllowBrowser: true });
  private readonly tools: CanvasToolRunner;
  private readonly messages: Anthropic.Beta.BetaMessageParam[] = [];

  constructor(
    private readonly editor: HTMLKritzelEditorElement,
    private readonly callbacks: CanvasAgentCallbacks,
  ) {
    this.tools = new CanvasToolRunner(editor);
  }

  static get hasApiKey(): boolean {
    return ANTHROPIC_API_KEY.length > 0;
  }

  async send(prompt: string, signal: AbortSignal): Promise<string> {
    const historyLength = this.messages.length;
    this.messages.push({ role: 'user', content: await this.withSelection(prompt) });

    try {
      return await this.runLoop(signal);
    } catch (error) {
      // Drop the unfinished exchange: a tool call without its result would make every later request fail.
      this.messages.length = historyLength;
      throw error;
    } finally {
      // Frames left loading belong to an exchange that ended early; show their last content again.
      for (const frame of await this.tools.getFrames()) {
        await this.tools.setLoading(frame.id, false);
      }
    }
  }

  /** Tells Claude which frames are selected, so "this page" means something. */
  private async withSelection(prompt: string): Promise<string> {
    const selected = (await this.editor.getSelectedObjects()).filter(isFrame);
    if (!selected.length) {
      return prompt;
    }
    const frames = selected.map(frame => `"${frame.name ?? frame.title}" (id ${frame.id})`).join(', ');
    return `${prompt}\n\n<selection>The user has selected: ${frames}.</selection>`;
  }

  private async runLoop(signal: AbortSignal): Promise<string> {
    let reply = '';
    let jsonRetries = 0;

    for (let request = 0; request < MAX_REQUESTS; request++) {
      this.callbacks.onStatus('Thinking…');

      let message: Anthropic.Beta.BetaMessage;
      try {
        message = await this.streamTurn(signal);
        jsonRetries = 0;
      } catch (error) {
        // Eagerly streamed tool input may be unparseable JSON; re-issue that turn. Everything else is a real failure.
        if (error instanceof Anthropic.APIError || signal.aborted || jsonRetries++ >= MAX_JSON_RETRIES) {
          throw error;
        }
        continue;
      }

      reply = message.content.map(block => (block.type === 'text' ? block.text : '')).join('').trim() || reply;

      if (message.stop_reason === 'refusal') {
        return 'Claude declined this request.';
      }

      const toolUses = message.content.filter((block): block is Anthropic.Beta.BetaToolUseBlock => block.type === 'tool_use');
      if (message.stop_reason === 'max_tokens' && toolUses.length) {
        throw new Error('The page got too long to write in one go. Try asking for a smaller page.');
      }

      this.messages.push({ role: 'assistant', content: message.content });
      if (!toolUses.length) {
        return reply;
      }

      const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
      for (const toolUse of toolUses) {
        results.push(await this.runTool(toolUse));
      }
      this.messages.push({ role: 'user', content: results });
    }

    return reply || 'Stopped after too many steps.';
  }

  /** Streams one model response, reporting progress and showing the skeleton in a frame as soon as Claude starts rewriting it. */
  private async streamTurn(signal: AbortSignal): Promise<Anthropic.Beta.BetaMessage> {
    const stream = this.client.beta.messages.stream(
      {
        model: CLAUDE_MODEL,
        max_tokens: 64000,
        system: SYSTEM_PROMPT,
        tools: CANVAS_TOOLS,
        messages: this.messages,
        output_config: { effort: CLAUDE_EFFORT },
        cache_control: { type: 'ephemeral' },
        // Lets a declined request continue on a model chosen by the API instead of stopping.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
      },
      { signal },
    );

    let text = '';
    let toolName = '';
    let toolInput = '';
    let editedFrameId: string | undefined;

    for await (const event of stream) {
      if (event.type === 'content_block_start') {
        if (event.content_block.type === 'tool_use') {
          toolName = event.content_block.name;
          toolInput = '';
          editedFrameId = undefined;
          this.callbacks.onStatus(toolName === 'create_frame' ? 'Adding a frame…' : toolName === 'write_frame' ? 'Designing…' : 'Working…');
        } else if (event.content_block.type === 'text') {
          text = '';
        }
      } else if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          text += event.delta.text;
          this.callbacks.onStatus(toStatus(text));
        } else if (event.delta.type === 'input_json_delta' && toolName === 'write_frame' && !editedFrameId) {
          // `frame_id` is the first property, so it arrives long before the page itself.
          toolInput += event.delta.partial_json;
          editedFrameId = /"frame_id"\s*:\s*"([^"]+)"/.exec(toolInput)?.[1];
          if (editedFrameId) {
            await this.tools.setLoading(editedFrameId, true);
            this.callbacks.onFrameFocus(editedFrameId);
          }
        }
      }
    }

    return stream.finalMessage();
  }

  private async runTool(toolUse: Anthropic.Beta.BetaToolUseBlock): Promise<Anthropic.Beta.BetaToolResultBlockParam> {
    const input = toolUse.input;
    try {
      if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new CanvasToolError('The input must be a JSON object.');
      }
      const result = await this.tools.run(toolUse.name, input as Record<string, unknown>);
      if (toolUse.name === 'create_frame') {
        this.callbacks.onFrameFocus((result as { id: string }).id);
      }
      return { type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(result) };
    } catch (error) {
      if (!(error instanceof CanvasToolError)) {
        throw error;
      }
      return { type: 'tool_result', tool_use_id: toolUse.id, is_error: true, content: error.message };
    }
  }
}
