/** TEMP: a single agent adds a generative UI widget as an iframe object. Delete it with the rest of this folder. */
import { useMemo, useRef, useState } from "react";
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

/** How long the widget shows its placeholder, as if its code were still being generated. */
const GENERATION_TIME = 1200;

/** Shown while the widget is "generated". */
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

/** The generated widget: a water tracker that keeps its count in the object's state. */
const widgetContent: KritzelIframeContent = {
  html: `
    <main class="card">
      <header>
        <h2>Water tracker</h2>
        <span class="goal">Goal: 8 glasses</span>
      </header>
      <div class="glasses" aria-label="Glasses of water"></div>
      <p class="count"></p>
      <div class="actions">
        <button data-step="-1" aria-label="Remove a glass">−</button>
        <button data-step="1" class="primary">Add a glass</button>
      </div>
    </main>
  `,
  css: `
    body { display: flex; font-family: Roboto, sans-serif; color: #202124; }
    .card { display: flex; flex-direction: column; gap: 10px; width: 100%; height: 100%; padding: 16px; box-sizing: border-box; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff; }
    header { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
    h2 { margin: 0; font-size: 17px; }
    .goal { color: #5f6368; font-size: 12px; }
    .glasses { display: grid; grid-template-columns: repeat(8, 1fr); gap: 5px; flex: 1; align-items: end; }
    .glass { height: 46px; border: 2px solid #90caf9; border-top: 0; border-radius: 0 0 6px 6px; background: #ffffff; }
    .glass.full { background: linear-gradient(#ffffff 25%, #42a5f5 25%); }
    .count { margin: 0; color: #1565c0; font-size: 13px; font-weight: 700; }
    .actions { display: flex; gap: 8px; }
    button { height: 32px; padding: 0 12px; border: 1px solid #dadce0; border-radius: 8px; background: #ffffff; font: inherit; font-size: 13px; font-weight: 700; }
    button.primary { flex: 1; border-color: #1565c0; background: #1565c0; color: #ffffff; }
  `,
  script: `
    const GOAL = 8;
    const glasses = document.querySelector('.glasses');
    const count = document.querySelector('.count');
    const render = () => {
      const filled = Number(kritzel.state.glasses ?? 0);
      glasses.innerHTML = Array.from({ length: GOAL }, (_, index) => '<span class="glass' + (index < filled ? ' full' : '') + '"></span>').join('');
      count.textContent = filled + ' of ' + GOAL + ' glasses today';
    };
    document.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => {
      const filled = Math.max(0, Math.min(GOAL, Number(kritzel.state.glasses ?? 0) + Number(button.dataset.step)));
      kritzel.setState({ ...kritzel.state, glasses: filled });
      render();
    }));
    globalThis.addEventListener('kritzelstatechange', render);
    render();
  `,
};

export function TempAgentWidgetPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [agent] = useState(() => new KritzelAgent({ id: "temp-agent", name: "Agent", color: "#7C3AED", position: { x: -460, y: -250 } }));
  const [state, setState] = useState("loading");
  const workspaces = useMemo(() => [new KritzelWorkspace({ id: "temp-widget", name: "Agent: add a widget", objects: [] })], []);

  async function onReady() {
    const editor = editorRef.current;
    if (!editor) return;
    await editor.zoomTo(1, 0, 0);
    await editor.addAgent(agent);
    setState("ready");
  }

  async function run() {
    setState("running");
    agent.setStatus("Generating a widget");
    const widget = new KritzelIframeObject({
      name: "Water tracker",
      title: "Water tracker",
      content: widgetContent,
      loadingContent,
      isLoading: true,
      state: { glasses: 3 },
      translateX: -150,
      translateY: -110,
      width: 300,
      height: 220,
      borderRadius: 12,
      boxShadow: "0 12px 32px rgba(32, 33, 36, 0.12)",
    });
    const result = await agent.addObject(widget);
    if (result.completed) {
      // The agent placed the widget with its placeholder; once the code is "generated", the widget shows it.
      await new Promise(resolve => setTimeout(resolve, GENERATION_TIME));
      widget.setLoading(false);
    }
    agent.setStatus(null);
    setState(result.completed ? "done" : `failed: ${result.reason}`);
  }

  return (
    <div style={hostStyle}>
      <Toolbar>
        <span className="label">Agent: add a widget</span>
        <button disabled={state !== "ready"} onClick={() => void run()}>Run</button>
        <button onClick={() => window.location.reload()}>Reset</button>
        <span className="status" data-testid="temp-demo-state">{state}</span>
      </Toolbar>
      <KritzelEditor
        ref={editorRef}
        editorId="temp-widget"
        syncConfig={syncConfig}
        theme="light"
        themes={themes}
        workspaces={workspaces}
        loginConfig={undefined}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        onIsReady={() => void onReady()}
        style={editorStyle}
      />
    </div>
  );
}
