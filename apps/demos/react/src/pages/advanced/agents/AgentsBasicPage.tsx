import { useMemo, useRef, useState } from "react";
import {
  KritzelAgent,
  KritzelEditor,
  KritzelWorkspace,
  type HTMLKritzelEditorElement,
  type KritzelAgentOptions,
} from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { createSeedObjects } from "../../getting-started/seed-objects";
import { Toolbar } from "../../../components/Toolbar";

const PLANNER = "planner";
const WRITER = "writer";

export function AgentsBasicPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  // Recreated by Reset, so the Planner starts at the rectangle again.
  const plannerRef = useRef<KritzelAgent | null>(null);
  const writerRef = useRef<KritzelAgent | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState("");
  const workspaces = useMemo(
    () => [new KritzelWorkspace({ objects: createSeedObjects() })],
    [],
  );

  async function getShapeIds() {
    const shapes = (await editorRef.current?.findObjects(obj => obj.__class__ === "KritzelShape")) ?? [];
    return shapes.map(shape => shape.id);
  }

  async function addAgents() {
    const editor = editorRef.current;
    if (!editor) return;

    const [rectangleId] = await getShapeIds();
    for (const agent of await editor.getAgents()) {
      await editor.removeAgent(agent);
    }
    plannerRef.current = createAgent({
      id: PLANNER,
      name: "Planner",
      color: "#7C3AED",
      position: rectangleId ? { objectId: rectangleId, anchor: "top-right" } : { x: 0, y: 0 },
    });
    writerRef.current = createAgent({
      id: WRITER,
      name: "Writer",
      color: "#0EA5E9",
      status: "Waiting…",
      position: { x: -220, y: 60 },
    });
    await editor.addAgent(plannerRef.current);
    await editor.addAgent(writerRef.current);
  }

  function createAgent(options: KritzelAgentOptions) {
    const agent = new KritzelAgent(options);
    agent.on("detached", ({ reason }) => setMessage(`"${agent.id}" detached (${reason}).`));
    return agent;
  }

  async function ensureAgents() {
    if (!plannerRef.current?.isAdded || !writerRef.current?.isAdded) {
      await addAgents();
    }
    return { planner: plannerRef.current!, writer: writerRef.current! };
  }

  async function runAgent() {
    const editor = editorRef.current;
    if (!editor || isRunning) return;
    setIsRunning(true);
    setMessage("");

    try {
      const [rectangleId, ellipseId] = await getShapeIds();
      if (!rectangleId || !ellipseId) return;
      const { planner, writer } = await ensureAgents();

      planner.setStatus("Thinking…");
      writer.setStatus("Waiting…");
      await planner.moveTo({ x: -40, y: -20 });

      planner.setStatus("Reviewing shapes");
      writer.setStatus("Writing notes");
      await Promise.all([
        planner.moveTo({ objectId: ellipseId, anchor: "top-left" }),
        writer.moveTo({ objectId: rectangleId, anchor: "bottom-right" }, { duration: 900, easing: "ease-out" }),
      ]);

      planner.setStatus("Done");
      writer.setStatus(null);
    } finally {
      setIsRunning(false);
    }
  }

  async function attachToSelection() {
    const editor = editorRef.current;
    if (!editor) return;
    const [selected] = await editor.getSelectedObjects();
    if (!selected) {
      setMessage("Select an object first.");
      return;
    }
    const { planner } = await ensureAgents();
    planner.setStatus("Following selection");
    await planner.moveTo({ objectId: selected.id, anchor: "center" });
    setMessage("Drag the object - the Planner cursor follows it.");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "sans-serif" }}>
      <Toolbar>
        <span className="label">Agentic Cursors</span>
        <button disabled={isRunning} onClick={() => void runAgent()}>Run Agent</button>
        <button onClick={() => void attachToSelection()}>Attach to Selection</button>
        <button onClick={() => void addAgents()}>Reset</button>
        {message && <span className="label">{message}</span>}
      </Toolbar>
      <KritzelEditor
        ref={editorRef}
        editorId="agents-basic"
        theme="light"
        themes={[reactThemeLight, reactThemeDark]}
        workspaces={workspaces}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        onIsReady={() => void addAgents()}
        style={{ flex: 1, minHeight: 0 }}
      />
    </div>
  );
}
