import Anthropic from '@anthropic-ai/sdk';
import { KritzelIframeObject, type HTMLKritzelEditorElement, type KritzelBaseObject } from '@kritzel/react-editor';

/**
 * `ANTHROPIC_API_KEY` from the `.env` file at the repository root (see `.env.example`).
 * The page calls the Claude API straight from the browser, so anyone who opens it can read the key: only run it locally.
 * A real app would send the requests through its own backend.
 */
const API_KEY = import.meta.env.ANTHROPIC_API_KEY ?? '';

const MODEL = 'claude-opus-5-5';

const SYSTEM_PROMPT = `You build small interactive web apps on an infinite canvas. The user describes what they want in a \
chat box, and you put it on the canvas with add_iframe: each call adds one object that renders its own web page in an \
iframe, with a titlebar above it.

Pages are self-contained: no external scripts, stylesheets or images, except Google Fonts. Use inline SVG for icons and \
illustrations. Design modern, polished pages, and size the object so the whole page fits, because it does not scroll.

Keep chat replies to one short sentence; the canvas shows the result.`;

const MIN_SIZE = 120;
const MAX_SIZE = 4000;

/** Room in world units between objects placed next to each other. */
const GAP = 64;

/** Room left around a new object when the viewport moves to it, enough to clear its titlebar and the chat box. */
const REVEAL_PADDING = 1.4;

/** Upper bound for model requests per prompt, so a confused loop cannot run forever. */
const MAX_REQUESTS = 8;

/** Consecutive retries when a streamed tool input is not valid JSON. */
const MAX_JSON_RETRIES = 2;

/** Its input streams eagerly, so the API does not validate it: `readInput` checks it before anything is added. */
const ADD_IFRAME_TOOL: Anthropic.Beta.BetaTool = {
  name: 'add_iframe',
  description:
    'Adds an object to the canvas that renders a web page in an iframe, with its title in a titlebar above it. ' +
    '`html` is the content of <body>, `css` the content of a <style> tag and `script` JavaScript that runs after the body.',
  eager_input_streaming: true,
  input_schema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Short title for the titlebar, e.g. "Pomodoro timer".' },
      width: { type: 'number', description: `Width in CSS pixels, ${MIN_SIZE} to ${MAX_SIZE}.` },
      height: { type: 'number', description: `Height in CSS pixels, ${MIN_SIZE} to ${MAX_SIZE}.` },
      html: { type: 'string' },
      css: { type: 'string' },
      script: { type: 'string' },
    },
    required: ['title', 'width', 'height', 'html', 'css'],
  },
};

interface IframeInput {
  title: string;
  width: number;
  height: number;
  html: string;
  css: string;
  script: string;
}

/** Thrown for invalid tool input; its message goes back to Claude as an error result. */
class ToolInputError extends Error {}

function isSize(value: unknown): value is number {
  return typeof value === 'number' && value >= MIN_SIZE && value <= MAX_SIZE;
}

function readInput(input: unknown): IframeInput {
  const { title, width, height, html, css, script = '' } = (input ?? {}) as Record<string, unknown>;
  if (typeof title !== 'string' || typeof html !== 'string' || typeof css !== 'string' || typeof script !== 'string') {
    throw new ToolInputError('"title", "html", "css" and "script" must be strings.');
  }
  if (!isSize(width) || !isSize(height)) {
    throw new ToolInputError(`"width" and "height" must be numbers from ${MIN_SIZE} to ${MAX_SIZE}.`);
  }
  return { title, width, height, html, css, script };
}

export function isIframe(object: KritzelBaseObject): object is KritzelIframeObject {
  return object.__class__ === 'KritzelIframeObject';
}

/**
 * A chat with Claude about the canvas. Each prompt runs a tool-use loop in which Claude adds iframe objects until it is done.
 * The conversation is kept between prompts, so follow-ups like "now a dark version of it" work.
 */
export class CanvasAgent {
  static readonly hasApiKey = API_KEY.length > 0;

  private readonly client = new Anthropic({ apiKey: API_KEY, dangerouslyAllowBrowser: true });
  private readonly messages: Anthropic.Beta.BetaMessageParam[] = [];

  constructor(private readonly editor: HTMLKritzelEditorElement) {}

  async send(prompt: string, signal: AbortSignal): Promise<void> {
    const historyLength = this.messages.length;
    this.messages.push({ role: 'user', content: prompt });

    try {
      await this.runLoop(signal);
    } catch (error) {
      // Drop the unfinished exchange: a tool call without its result would make every later request fail.
      this.messages.length = historyLength;
      throw error;
    }
  }

  private async runLoop(signal: AbortSignal): Promise<void> {
    let jsonRetries = 0;

    for (let request = 0; request < MAX_REQUESTS; request++) {
      let message: Anthropic.Beta.BetaMessage;
      try {
        message = await this.client.beta.messages
          .stream(
            {
              model: MODEL,
              max_tokens: 64000,
              system: SYSTEM_PROMPT,
              tools: [ADD_IFRAME_TOOL],
              messages: this.messages,
              output_config: { effort: 'medium' },
              cache_control: { type: 'ephemeral' },
              // Lets a declined request continue on a model chosen by the API instead of stopping.
              betas: ['server-side-fallback-2026-07-01'],
              fallbacks: 'default',
            },
            { signal },
          )
          .finalMessage();
        jsonRetries = 0;
      } catch (error) {
        // An eagerly streamed tool input can be unparseable JSON: re-issue that turn. Everything else is a real failure.
        if (error instanceof Anthropic.APIError || signal.aborted || jsonRetries++ >= MAX_JSON_RETRIES) {
          throw error;
        }
        continue;
      }

      if (message.stop_reason === 'refusal') {
        return;
      }

      const toolUses = message.content.filter((block): block is Anthropic.Beta.BetaToolUseBlock => block.type === 'tool_use');
      if (message.stop_reason === 'max_tokens' && toolUses.length) {
        throw new Error('The page got too long to write in one go. Try asking for something smaller.');
      }

      this.messages.push({ role: 'assistant', content: message.content });
      if (!toolUses.length) {
        return;
      }

      const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
      for (const toolUse of toolUses) {
        results.push(await this.runTool(toolUse));
      }
      this.messages.push({ role: 'user', content: results });
    }
  }

  private async runTool(toolUse: Anthropic.Beta.BetaToolUseBlock): Promise<Anthropic.Beta.BetaToolResultBlockParam> {
    try {
      if (toolUse.name !== ADD_IFRAME_TOOL.name) {
        throw new ToolInputError(`Unknown tool "${toolUse.name}".`);
      }
      const object = await this.addIframe(readInput(toolUse.input));
      return { type: 'tool_result', tool_use_id: toolUse.id, content: `Added "${object.name}" to the canvas.` };
    } catch (error) {
      if (!(error instanceof ToolInputError)) {
        throw error;
      }
      return { type: 'tool_result', tool_use_id: toolUse.id, is_error: true, content: error.message };
    }
  }

  /** Adds the object to the right of the existing ones and moves the viewport to it. */
  private async addIframe({ title, width, height, html, css, script }: IframeInput): Promise<KritzelIframeObject> {
    const boxes = (await this.editor.getAllObjects()).filter(isIframe).map(object => object.boundingBox);
    const object = await this.editor.addObject(
      new KritzelIframeObject({
        name: title,
        title,
        content: { html, css, script },
        translateX: boxes.length ? Math.max(...boxes.map(box => box.x + box.width)) + GAP : 0,
        translateY: boxes.length ? Math.min(...boxes.map(box => box.y)) : 0,
        width,
        height,
        borderRadius: 12,
        boxShadow: '0 1px 2px rgba(20, 18, 31, 0.06), 0 12px 32px -12px rgba(20, 18, 31, 0.18)',
      }),
    );
    if (!object) {
      throw new Error(`"${title}" could not be added to the canvas.`);
    }

    // Centers the object, zooming out when it does not fit but never zooming in past 100 %.
    const box = object.boundingBox;
    const viewport = await this.editor.getViewport();
    const scale = Math.min(
      viewport.width / (box.width * REVEAL_PADDING),
      viewport.height / (box.height * REVEAL_PADDING),
      1,
    );
    await this.editor.setViewport(box.x + box.width / 2, box.y + box.height / 2, scale);
    return object;
  }
}
