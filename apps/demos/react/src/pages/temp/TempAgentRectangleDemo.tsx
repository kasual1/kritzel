/** TEMP: a single agent adds one rectangle. Delete it with the rest of this folder. */
import { useMemo, useRef, useState } from "react";
import {
  InMemorySyncProvider,
  KritzelAgent,
  KritzelEditor,
  KritzelWorkspace,
  ShapeType,
  type HTMLKritzelEditorElement,
  type KritzelSyncConfig,
} from "@kritzel/react-editor";
import { reactThemeDark } from "../../const/react-theme-dark";
import { reactThemeLight } from "../../const/react-theme-light";
import { editorStyle, hostStyle } from "../shared/demo-shared";
import { Toolbar } from "../../components/Toolbar";

const themes = [reactThemeLight, reactThemeDark];
const syncConfig: KritzelSyncConfig = { providers: [InMemorySyncProvider] };

export function TempAgentRectanglePage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [agent] = useState(() => new KritzelAgent({ id: "temp-agent", name: "Agent", color: "#7C3AED", position: { x: -460, y: -250 } }));
  const [state, setState] = useState("loading");
  const workspaces = useMemo(() => [new KritzelWorkspace({ id: "temp-rectangle", name: "Agent: add a rectangle", objects: [] })], []);

  async function onReady() {
    const editor = editorRef.current;
    if (!editor) return;
    await editor.zoomTo(1, 0, 0);
    await editor.addAgent(agent);
    setState("ready");
  }

  async function run() {
    setState("running");
    agent.setStatus("Drawing a rectangle");
    const result = await agent.createShape({
      x: -100,
      y: -60,
      width: 200,
      height: 120,
      shapeType: ShapeType.Rectangle,
      style: { fillColor: "#fce4ec", strokeColor: "#c62828" },
    });
    agent.setStatus(null);
    setState(result.completed ? "done" : `failed: ${result.reason}`);
  }

  return (
    <div style={hostStyle}>
      <Toolbar>
        <span className="label">Agent: add a rectangle</span>
        <button disabled={state !== "ready"} onClick={() => void run()}>Run</button>
        <button onClick={() => window.location.reload()}>Reset</button>
        <span className="status" data-testid="temp-demo-state">{state}</span>
      </Toolbar>
      <KritzelEditor
        ref={editorRef}
        editorId="temp-rectangle"
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
