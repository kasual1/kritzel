import Anthropic from '@anthropic-ai/sdk';
import {
  UpdrawIframeObject,
  type HTMLUpdrawEditorElement,
  type UpdrawAgent,
  type UpdrawAgentTool,
  type UpdrawBaseObject,
  type UpdrawIframeContent,
  type UpdrawObjectElementInfo,
} from '@updraw/react-editor';

/**
 * `ANTHROPIC_API_KEY` from the `.env` file at the repository root (see `.env.example`); `vite.config.ts` exposes it.
 * The page calls the Claude API straight from the browser, so anyone who opens it can read the key: only run it locally.
 * A real app would send the requests through its own backend.
 */
const API_KEY = import.meta.env.ANTHROPIC_API_KEY ?? '';

const MODEL = 'claude-opus-5-5';

const SYSTEM_PROMPT = `You design web pages on an infinite canvas. The user writes to you in a chat box.

When no page is selected, add a new page with add_page. When the user selected a page, its current source comes with \
the request: change that page with edit_page and keep everything the request does not touch. When they also picked \
elements of the page, the request is about those elements.

Pages are self-contained: no external scripts, stylesheets or images, except Google Fonts. Use inline SVG for icons and \
illustrations. Design modern, polished pages and size them so the content fits. Give every meaningful element a short, \
unique data-updraw-id, for example data-updraw-id="hero-title", so the user can point at it.

You can also look at the canvas with observe_canvas and move, resize or delete the pages you added.

Keep chat replies to one short sentence; the canvas shows the result.`;

const MIN_SIZE = 120;
const MAX_SIZE = 4000;

/** Room in world units between pages placed next to each other. */
const GAP = 64;

/** Room left around a new page when the viewport moves to it, enough to clear its titlebar and the chat box. */
const REVEAL_PADDING = 1.4;

/** Upper bound for model requests per prompt, so a confused loop cannot run forever. */
const MAX_REQUESTS = 8;

/** Consecutive retries when a streamed tool input is not valid JSON. */
const MAX_JSON_RETRIES = 2;

/** The tool inputs stream eagerly, so the API does not validate them: `readPage` and `applyEdits` check them. */
const ADD_PAGE_TOOL: Anthropic.Beta.BetaTool = {
  name: 'add_page',
  description:
    'Adds a new page to the canvas. It renders in an iframe, with its title in a titlebar above it. ' +
    '`html` is the content of <body>, `css` the content of a <style> tag and `script` JavaScript that runs after the body.',
  eager_input_streaming: true,
  input_schema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Short title for the titlebar, e.g. "Music player".' },
      width: { type: 'number', description: `Width in CSS pixels, ${MIN_SIZE} to ${MAX_SIZE}.` },
      height: { type: 'number', description: `Height in CSS pixels, ${MIN_SIZE} to ${MAX_SIZE}.` },
      html: { type: 'string' },
      css: { type: 'string' },
      script: { type: 'string' },
    },
    required: ['title', 'width', 'height', 'html', 'css'],
  },
};

const EDIT_PAGE_TOOL: Anthropic.Beta.BetaTool = {
  name: 'edit_page',
  description:
    'Changes the selected page with find-and-replace edits, applied in order. Each `find` must match exactly one place ' +
    'in that part of the current source, including whitespace. An empty `find` fills a part that is still empty. ' +
    'If one edit fails, none is applied.',
  eager_input_streaming: true,
  input_schema: {
    type: 'object',
    properties: {
      edits: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            part: { type: 'string', enum: ['html', 'css', 'script'] },
            find: { type: 'string' },
            replace: { type: 'string' },
          },
          required: ['part', 'find', 'replace'],
        },
      },
    },
    required: ['edits'],
  },
};

/** The Updraw tools Claude may use next to add_page and edit_page: look at the canvas and arrange the pages. */
const UPDRAW_TOOLS = ['observe_canvas', 'move_object', 'resize_object', 'delete_objects'];

/** Updraw tools are provider-neutral; Anthropic calls the schema `input_schema`. */
function toAnthropicTool(tool: UpdrawAgentTool): Anthropic.Beta.BetaTool {
  return { name: tool.name, description: tool.description, input_schema: tool.inputSchema, eager_input_streaming: true };
}

type PagePart = keyof UpdrawIframeContent;

/** Pages are iframe objects. */
export function isIframe(object: UpdrawBaseObject): object is UpdrawIframeObject {
  return object.__class__ === 'UpdrawIframeObject';
}

/** A page as Claude writes it with add_page. */
export interface PageInput extends UpdrawIframeContent {
  title: string;
  width: number;
  height: number;
}

/** The page a prompt is about, and the elements of it the user picked, if any. */
export interface PageReference {
  objectId: string;
  elements: UpdrawObjectElementInfo[];
}

/** A page object at the given position in world units, with the look every page on the canvas shares. */
export function createPageObject({ title, width, height, html, css, script }: PageInput, x: number, y: number): UpdrawIframeObject {
  return new UpdrawIframeObject({
    name: title,
    title,
    content: { html, css, script },
    translateX: x,
    translateY: y,
    width,
    height,
    borderRadius: 12,
    boxShadow: '0 1px 2px rgba(20, 18, 31, 0.06), 0 12px 32px -12px rgba(20, 18, 31, 0.18)',
  });
}

/** Centers a page in the viewport, zooming out when it does not fit but never zooming in past 100 %. */
export async function revealPage(editor: HTMLUpdrawEditorElement, page: UpdrawIframeObject): Promise<void> {
  const box = page.boundingBox;
  const viewport = await editor.getViewport();
  const scale = Math.min(
    viewport.width / (box.width * REVEAL_PADDING),
    viewport.height / (box.height * REVEAL_PADDING),
    1,
  );
  await editor.setViewport(box.x + box.width / 2, box.y + box.height / 2, scale);
}

/** Thrown for invalid tool input; its message goes back to Claude as an error result. */
class ToolInputError extends Error {}

function isSize(value: unknown): value is number {
  return typeof value === 'number' && value >= MIN_SIZE && value <= MAX_SIZE;
}

function isPagePart(value: unknown): value is PagePart {
  return value === 'html' || value === 'css' || value === 'script';
}

function readPage(input: unknown): PageInput {
  const { title, width, height, html, css, script = '' } = (input ?? {}) as Record<string, unknown>;
  if (typeof title !== 'string' || typeof html !== 'string' || typeof css !== 'string' || typeof script !== 'string') {
    throw new ToolInputError('"title", "html", "css" and "script" must be strings.');
  }
  if (!isSize(width) || !isSize(height)) {
    throw new ToolInputError(`"width" and "height" must be numbers from ${MIN_SIZE} to ${MAX_SIZE}.`);
  }
  return { title, width, height, html, css, script };
}

/** Returns the content with every edit applied, or throws without changing anything. */
function applyEdits(content: UpdrawIframeContent, input: unknown): UpdrawIframeContent {
  const { edits } = (input ?? {}) as Record<string, unknown>;
  if (!Array.isArray(edits) || !edits.length) {
    throw new ToolInputError('"edits" must be a non-empty array. No edit was applied.');
  }

  const next = { ...content };
  edits.forEach((edit: unknown, index) => {
    const { part, find, replace } = (edit ?? {}) as Record<string, unknown>;
    const fail = (reason: string) => new ToolInputError(`Edit ${index + 1}: ${reason} No edit was applied.`);
    if (!isPagePart(part) || typeof find !== 'string' || typeof replace !== 'string') {
      throw fail('"part" must be "html", "css" or "script", and "find" and "replace" must be strings.');
    }

    const source = next[part];
    if (!find) {
      if (source.trim()) {
        throw fail(`"find" is empty, but ${part} is not.`);
      }
      next[part] = replace;
      return;
    }

    const start = source.indexOf(find);
    if (start < 0) {
      throw fail(`"find" does not occur in ${part}.`);
    }
    if (source.indexOf(find, start + 1) >= 0) {
      throw fail(`"find" occurs more than once in ${part}; include more of the surrounding source.`);
    }
    next[part] = source.slice(0, start) + replace + source.slice(start + find.length);
  });
  return next;
}

/** The user's request with the source of the page it is about and the elements they picked. */
function createEditRequest(prompt: string, page: UpdrawIframeObject, elements: UpdrawObjectElementInfo[]): string {
  const { html, css, script } = page.content;
  const lines = [
    `<selected_page title=${JSON.stringify(page.name || page.title)}>`,
    `<html>\n${html}\n</html>`,
    `<css>\n${css}\n</css>`,
    `<script>\n${script}\n</script>`,
    '</selected_page>',
  ];
  for (const element of elements) {
    lines.push(
      `<picked_element selector=${JSON.stringify(element.selector)} tag=${JSON.stringify(element.tagName)}>` +
        `${element.text ?? ''}</picked_element>`,
    );
  }
  lines.push(`<request>\n${prompt}\n</request>`);
  return lines.join('\n');
}

/**
 * Turns prompts into pages. A prompt adds a new page, or changes the page it references with small edits.
 * Prompts don't share a conversation: the pages on the canvas are the state, so every edit starts from their current source.
 * Claude works as an UpdrawAgent with its own cursor, status and history: it places new pages through the agent, and
 * its cursor points at the page, or at the first picked element, that a prompt changes.
 */
export class GenerativeUiAgent {
  static readonly hasApiKey = API_KEY.length > 0;

  private readonly client = new Anthropic({ apiKey: API_KEY, dangerouslyAllowBrowser: true });

  private readonly updrawTools: UpdrawAgentTool[];

  constructor(
    private readonly editor: HTMLUpdrawEditorElement,
    private readonly agent: UpdrawAgent,
  ) {
    this.updrawTools = agent.tools({ only: UPDRAW_TOOLS });
  }

  async send(prompt: string, reference: PageReference | null, signal: AbortSignal): Promise<void> {
    const page = reference ? await this.getPage(reference.objectId) : undefined;
    if (reference && !page) {
      throw new Error('The selected page is no longer on the canvas.');
    }

    const elements = reference?.elements ?? [];
    this.agent.setStatus('Thinking…');
    try {
      if (page) {
        this.pointAt(page, elements);
      }
      await this.runLoop(prompt, page, elements, signal);
    } finally {
      this.agent.setStatus(null);
    }
  }

  /**
   * Moves Claude's cursor to the first picked element of the page, where it sticks while the page changes, or to the
   * page itself. Only the cursor moves, so the request doesn't wait for it, and an element that can't be found right
   * now (e.g. scrolled out of view) leaves the cursor where it is.
   */
  private pointAt(page: UpdrawIframeObject, elements: UpdrawObjectElementInfo[]): void {
    const [element] = elements;
    this.agent
      .moveTo(element ? { objectId: page.id, selector: element.selector } : { objectId: page.id })
      .catch(() => undefined);
  }

  private async runLoop(
    prompt: string,
    page: UpdrawIframeObject | undefined,
    elements: UpdrawObjectElementInfo[],
    signal: AbortSignal,
  ): Promise<void> {
    const messages: Anthropic.Beta.BetaMessageParam[] = [
      { role: 'user', content: page ? createEditRequest(prompt, page, elements) : prompt },
    ];
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
              tools: [ADD_PAGE_TOOL, EDIT_PAGE_TOOL, ...this.updrawTools.map(toAnthropicTool)],
              messages,
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

      messages.push({ role: 'assistant', content: message.content });
      if (!toolUses.length) {
        return;
      }

      const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
      for (const toolUse of toolUses) {
        results.push(await this.runTool(toolUse, page?.id, signal));
      }
      messages.push({ role: 'user', content: results });
    }
  }

  private async runTool(
    toolUse: Anthropic.Beta.BetaToolUseBlock,
    pageId: string | undefined,
    signal: AbortSignal,
  ): Promise<Anthropic.Beta.BetaToolResultBlockParam> {
    const updrawTool = this.updrawTools.find(tool => tool.name === toolUse.name);
    if (updrawTool) {
      // Refusals (e.g. the user has the page selected) are ordinary results; only rejected input is an error.
      const content = await updrawTool.run(toolUse.input, { signal });
      const isError = (JSON.parse(content) as { reason?: string }).reason === 'invalid-input';
      return { type: 'tool_result', tool_use_id: toolUse.id, content, ...(isError ? { is_error: true } : {}) };
    }
    try {
      let result: string;
      if (toolUse.name === ADD_PAGE_TOOL.name) {
        const page = await this.addPage(readPage(toolUse.input), signal);
        result = `Added "${page.name}" to the canvas.`;
      } else if (toolUse.name === EDIT_PAGE_TOOL.name) {
        await this.editPage(pageId, toolUse.input);
        result = 'Edited the page.';
      } else {
        throw new ToolInputError(`Unknown tool "${toolUse.name}".`);
      }
      return { type: 'tool_result', tool_use_id: toolUse.id, content: result };
    } catch (error) {
      if (!(error instanceof ToolInputError)) {
        throw error;
      }
      return { type: 'tool_result', tool_use_id: toolUse.id, is_error: true, content: error.message };
    }
  }

  private async getPage(id: string): Promise<UpdrawIframeObject | undefined> {
    const object = await this.editor.getObjectById(id);
    return object && isIframe(object) ? object : undefined;
  }

  private async editPage(pageId: string | undefined, input: unknown): Promise<void> {
    if (!pageId) {
      throw new ToolInputError('No page is selected, so there is nothing to edit. Use add_page instead.');
    }
    // Look the page up again: the instance in the store can be replaced while Claude writes, e.g. by undo.
    const page = await this.getPage(pageId);
    if (!page) {
      throw new Error('The selected page is no longer on the canvas.');
    }
    page.setContent(applyEdits(page.content, input));
  }

  /**
   * Places the page to the right of the existing ones as the agent's change (its cursor hops there, and the user's
   * selection and undo history stay untouched), then moves the viewport to it.
   */
  private async addPage(input: PageInput, signal: AbortSignal): Promise<UpdrawIframeObject> {
    const boxes = (await this.editor.getAllObjects()).filter(isIframe).map(object => object.boundingBox);
    const x = boxes.length ? Math.max(...boxes.map(box => box.x + box.width)) + GAP : 0;
    const y = boxes.length ? Math.min(...boxes.map(box => box.y)) : 0;
    this.agent.setStatus(`Placing "${input.title}"`);
    const result = await this.agent.addObject(createPageObject(input, x, y), { signal });
    const page = result.completed && result.objectIds?.[0] ? await this.getPage(result.objectIds[0]) : undefined;
    if (!page) {
      throw new ToolInputError(`"${input.title}" could not be added to the canvas (${result.reason ?? 'unknown reason'}).`);
    }
    await revealPage(this.editor, page);
    return page;
  }
}
