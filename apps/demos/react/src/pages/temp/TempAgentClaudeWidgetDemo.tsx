/**
 * TEMP: a hidden agent adds generative UI widgets that Claude writes. Type what you want into the chat box: the agent
 * places a placeholder as soon as Claude has picked the widget's size, and the widget fades in once Claude has written
 * it. No cursor, no avatar. Delete it with the rest of this folder.
 *
 * Needs `ANTHROPIC_API_KEY` in the `.env` file at the repository root and the dev server (`npm start`): the page calls
 * the Claude API straight from the browser, so the key is in the page. Only run it locally.
 */
import { useMemo, useRef, useState } from "react";
import Anthropic from "@anthropic-ai/sdk";
import {
  InMemorySyncProvider,
  KritzelAgent,
  KritzelEditor,
  KritzelIframeObject,
  KritzelWorkspace,
  type HTMLKritzelEditorElement,
  type KritzelIframeContent,
  type KritzelSyncConfig,
} from "@kritzel/react-editor";
import { reactThemeDark } from "../../const/react-theme-dark";
import { reactThemeLight } from "../../const/react-theme-light";
import { editorStyle, hostStyle } from "../shared/demo-shared";
import { Toolbar } from "../../components/Toolbar";

const themes = [reactThemeLight, reactThemeDark];
const syncConfig: KritzelSyncConfig = { providers: [InMemorySyncProvider] };

const API_KEY = import.meta.env.ANTHROPIC_API_KEY ?? "";
const MODEL = "claude-opus-5-5";

const MIN_WIDTH = 200;
const MAX_WIDTH = 560;
const MIN_HEIGHT = 160;
const MAX_HEIGHT = 420;

/** Room in world units between widgets placed next to each other. */
const GAP = 48;

/** How far the view's center sits below a new widget's center, so the widget clears the chat box. */
const CHAT_BOX_ROOM = 60;

const SYSTEM_PROMPT = `You build small, self-contained widgets for a canvas. The user describes a widget in a chat box and \
you answer with the widget.

The widget renders in a sandboxed iframe of the width and height you choose: width ${MIN_WIDTH} to ${MAX_WIDTH} and height \
${MIN_HEIGHT} to ${MAX_HEIGHT} CSS pixels. Fill the whole frame. "html" is the content of <body>, "css" the content of a \
<style> tag and "script" JavaScript that runs after the body. No external scripts, stylesheets, fonts or images: use \
inline SVG for icons. Make it polished and interactive where that makes sense.

To keep state such as counts or checked items, read the global \`kritzel.state\` object and save changes with \
\`kritzel.setState(nextState)\`.`;

/** Title, width and height come first, so the placeholder can be placed while Claude still writes the code. */
const WIDGET_FORMAT: Anthropic.Beta.BetaJSONOutputFormat = {
  type: "json_schema",
  schema: {
    type: "object",
    properties: {
      title: { type: "string", description: 'Short title for the titlebar, e.g. "Water tracker".' },
      width: { type: "integer", description: `Width in CSS pixels, ${MIN_WIDTH} to ${MAX_WIDTH}.` },
      height: { type: "integer", description: `Height in CSS pixels, ${MIN_HEIGHT} to ${MAX_HEIGHT}.` },
      html: { type: "string" },
      css: { type: "string" },
      script: { type: "string" },
    },
    required: ["title", "width", "height", "html", "css", "script"],
    additionalProperties: false,
  },
};

interface WidgetHead {
  title: string;
  width: number;
  height: number;
}

type Widget = WidgetHead & KritzelIframeContent;

/** Shown while Claude writes the widget. */
const loadingContent: KritzelIframeContent = {
  html: `
    <main class="skeleton" aria-busy="true">
      <span class="bar title"></span>
      <span class="bar line"></span>
      <span class="block"></span>
      <span class="bar action"></span>
    </main>
  `,
  css: `
    body { display: flex; background: #eef1f4; }
    .skeleton { display: flex; flex-direction: column; gap: 12px; width: 100%; height: 100%; padding: 18px; box-sizing: border-box; border-radius: 12px;
      background: linear-gradient(90deg, #edf1f4 0%, #f6f8fa 50%, #edf1f4 100%); background-size: 200% 100%; animation: shimmer 1.2s linear infinite; }
    .bar, .block { display: block; border-radius: 6px; background: rgba(255, 255, 255, 0.7); }
    .title { width: 55%; height: 18px; }
    .line { width: 75%; height: 10px; }
    .block { flex: 1; }
    .action { width: 100%; height: 30px; }
    @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
  `,
  script: "",
};

/**
 * Appended to Claude's CSS: a layer in the placeholder's grey covers the widget and fades out, so the widget fades in
 * over the placeholder instead of snapping in. It leaves Claude's own html and body styles alone.
 */
const REVEAL_CSS = `
html::after { content: ""; position: fixed; inset: 0; z-index: 2147483647; background: #eef1f4; pointer-events: none;
  animation: kritzel-uncover 450ms ease-out forwards; }
@keyframes kritzel-uncover { to { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { html::after { display: none; } }`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(value)));

/**
 * Title, width and height from the JSON Claude has streamed so far, once all three are complete: a number counts once
 * a comma or brace follows it, so a width of 320 is not read as 32.
 */
function readHead(json: string): WidgetHead | null {
  const title = /"title"\s*:\s*("(?:[^"\\]|\\.)*")/.exec(json)?.[1];
  const width = /"width"\s*:\s*(\d+(?:\.\d+)?)\s*[,}]/.exec(json)?.[1];
  const height = /"height"\s*:\s*(\d+(?:\.\d+)?)\s*[,}]/.exec(json)?.[1];
  if (!title || !width || !height) return null;
  return { title: JSON.parse(title) as string, width: clamp(Number(width), MIN_WIDTH, MAX_WIDTH), height: clamp(Number(height), MIN_HEIGHT, MAX_HEIGHT) };
}

/** The finished widget; structured outputs guarantee the shape, the sizes are clamped here. */
function readWidget(json: string): Widget {
  const { title, width, height, html, css, script } = JSON.parse(json) as Widget;
  return { title, width: clamp(width, MIN_WIDTH, MAX_WIDTH), height: clamp(height, MIN_HEIGHT, MAX_HEIGHT), html, css, script };
}

function describeError(error: unknown): string {
  if (error instanceof Anthropic.APIUserAbortError) return "stopped";
  if (error instanceof Anthropic.AuthenticationError) return "failed: the API key in .env was rejected";
  if (error instanceof Anthropic.RateLimitError) return "failed: rate limited, try again in a moment";
  if (error instanceof Anthropic.APIError) return `failed: API error ${error.status ?? ""} ${error.message}`.trim();
  return `failed: ${error instanceof Error ? error.message : String(error)}`;
}

export function TempAgentClaudeWidgetPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [agent] = useState(() => new KritzelAgent({ id: "temp-agent", name: "Claude", color: "#7C3AED", visible: false }));
  const [client] = useState(() => new Anthropic({ apiKey: API_KEY, dangerouslyAllowBrowser: true }));
  const [state, setState] = useState("loading");
  const [isWorking, setIsWorking] = useState(false);
  const workspaces = useMemo(() => [new KritzelWorkspace({ id: "temp-claude-widget", name: "Claude agent: add a widget", objects: [] })], []);

  async function onReady() {
    const editor = editorRef.current;
    if (!editor) return;
    await editor.zoomTo(1, 0, 0);
    await editor.addAgent(agent);
    setState(API_KEY ? "ready: describe a widget in the chat box" : "no ANTHROPIC_API_KEY: add it to .env at the repository root and restart the dev server");
  }

  /** Where the next widget goes: centered at the origin, or to the right of the widgets already on the canvas. */
  async function nextPosition(editor: HTMLKritzelEditorElement, { width, height }: WidgetHead) {
    const boxes = (await editor.getAllObjects()).filter(object => object instanceof KritzelIframeObject).map(object => object.boundingBox);
    if (!boxes.length) return { x: -width / 2, y: -height / 2 - CHAT_BOX_ROOM };
    return { x: Math.max(...boxes.map(box => box.x + box.width)) + GAP, y: Math.min(...boxes.map(box => box.y)) };
  }

  /** The hidden agent places the widget with its placeholder, after the view has moved to where it goes. */
  async function placePlaceholder(editor: HTMLKritzelEditorElement, head: WidgetHead, signal: AbortSignal): Promise<KritzelIframeObject> {
    const { x, y } = await nextPosition(editor, head);
    await editor.setViewport(x + head.width / 2, y + head.height / 2 + CHAT_BOX_ROOM, 1);
    const widget = new KritzelIframeObject({
      name: head.title,
      title: head.title,
      loadingContent,
      isLoading: true,
      translateX: x,
      translateY: y,
      width: head.width,
      height: head.height,
      borderRadius: 12,
      boxShadow: "0 12px 32px rgba(32, 33, 36, 0.12)",
    });
    const result = await agent.addObject(widget, { instant: true, signal });
    if (!result.completed) throw new Error(`the widget could not be placed (${result.reason})`);
    return widget;
  }

  async function onChatSubmit(prompt: string) {
    const editor = editorRef.current;
    if (!editor || isWorking || !prompt.trim()) return;
    if (!API_KEY) {
      setState("no ANTHROPIC_API_KEY: add it to .env at the repository root and restart the dev server");
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setIsWorking(true);
    setState("Claude is designing the widget…");

    let placing: Promise<KritzelIframeObject> | null = null;
    try {
      const stream = client.beta.messages.stream(
        {
          model: MODEL,
          max_tokens: 64000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: prompt }],
          output_config: { effort: "medium", format: WIDGET_FORMAT },
          // Lets a declined request continue on a model chosen by the API instead of stopping.
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
        },
        { signal: controller.signal },
      );
      // The placeholder goes onto the canvas as soon as Claude has picked the title and size; the code follows.
      stream.on("text", (_delta, snapshot) => {
        const head = placing ? null : readHead(snapshot);
        if (head) {
          placing = placePlaceholder(editor, head, controller.signal);
          placing.catch(() => undefined);
          setState(`Claude is writing "${head.title}"…`);
        }
      });
      const message = await stream.finalMessage();

      if (message.stop_reason === "refusal") throw new Error("Claude declined this request");
      if (message.stop_reason === "max_tokens") throw new Error("the widget got too long; ask for something smaller");
      const text = message.content.find(block => block.type === "text")?.text;
      if (!text) throw new Error("Claude sent no widget");
      const widget = readWidget(text);

      const placed = await (placing ?? (placing = placePlaceholder(editor, widget, controller.signal)));
      placed.setContent({ html: widget.html, css: `${widget.css}\n${REVEAL_CSS}`, script: widget.script });
      placed.setLoading(false);
      setState(`done: added "${widget.title}"`);
    } catch (error) {
      // Take back a placeholder whose widget never came.
      const placed = await (placing as Promise<KritzelIframeObject> | null)?.catch(() => null);
      if (placed) await agent.deleteObjects([placed.id], { instant: true });
      setState(describeError(error));
    } finally {
      abortRef.current = null;
      setIsWorking(false);
    }
  }

  return (
    <div style={hostStyle}>
      <Toolbar>
        <span className="label">Claude agent: add a widget</span>
        <button onClick={() => window.location.reload()}>Reset</button>
        <span className="status" data-testid="temp-demo-state">{state}</span>
      </Toolbar>
      <KritzelEditor
        ref={editorRef}
        editorId="temp-claude-widget"
        syncConfig={syncConfig}
        theme="light"
        themes={themes}
        workspaces={workspaces}
        loginConfig={undefined}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        isAgentAvatarsVisible={false}
        isChatBoxVisible
        isChatBoxLoading={isWorking}
        onIsReady={() => void onReady()}
        onChatSubmit={event => void onChatSubmit(event.detail)}
        onChatStop={() => abortRef.current?.abort()}
        style={editorStyle}
      />
    </div>
  );
}
