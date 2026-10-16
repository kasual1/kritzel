import { useMemo, useRef, useState } from "react";
import { KritzelEditor, KritzelWorkspace, type HTMLKritzelEditorElement } from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { createSeedObjects } from "../../getting-started/seed-objects";
import { Toolbar } from "../../../components/Toolbar";

const PLANNER = "planner";
const WRITER = "writer";

export function AgenticCursorsBasicPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
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

  async function addCursors() {
    const editor = editorRef.current;
    if (!editor) return;

    const [rectangleId] = await getShapeIds();
    await editor.clearAgenticCursors();
    await editor.addAgenticCursor({
      id: PLANNER,
      name: "Planner",
      color: "#7C3AED",
      position: rectangleId ? { objectId: rectangleId, anchor: "top-right" } : { x: 0, y: 0 },
    });
    await editor.addAgenticCursor({
      id: WRITER,
      name: "Writer",
      color: "#0EA5E9",
      status: "Waiting…",
      position: { x: -220, y: 60 },
    });
  }

  async function runAgent() {
    const editor = editorRef.current;
    if (!editor || isRunning) return;
    setIsRunning(true);
    setMessage("");

    try {
      const [rectangleId, ellipseId] = await getShapeIds();
    if (!rectangleId || !ellipseId) return;
      if (!(await editor.getAgenticCursor(PLANNER))) {
        await addCursors();
      }

      await editor.updateAgenticCursor(PLANNER, { status: "Thinking…" });
      await editor.updateAgenticCursor(WRITER, { status: "Waiting…" });
      await editor.moveAgenticCursor(PLANNER, { x: -40, y: -20 });

      await editor.updateAgenticCursor(PLANNER, { status: "Reviewing shapes" });
      await editor.updateAgenticCursor(WRITER, { status: "Writing notes" });
      await Promise.all([
        editor.moveAgenticCursor(PLANNER, { objectId: ellipseId, anchor: "top-left" }),
        editor.moveAgenticCursor(WRITER, { objectId: rectangleId, anchor: "bottom-right" }, { duration: 900, easing: "ease-out" }),
      ]);

      await editor.updateAgenticCursor(PLANNER, { status: "Done" });
      await editor.updateAgenticCursor(WRITER, { status: null });
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
    if (!(await editor.getAgenticCursor(PLANNER))) {
      await addCursors();
    }
    await editor.updateAgenticCursor(PLANNER, { status: "Following selection" });
    await editor.moveAgenticCursor(PLANNER, { objectId: selected.id, anchor: "center" });
    setMessage("Drag the object - the Planner cursor follows it.");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "sans-serif" }}>
      <Toolbar>
        <span className="label">Agentic Cursors</span>
        <button disabled={isRunning} onClick={() => void runAgent()}>Run Agent</button>
        <button onClick={() => void attachToSelection()}>Attach to Selection</button>
        <button onClick={() => void addCursors()}>Reset</button>
        {message && <span className="label">{message}</span>}
      </Toolbar>
      <KritzelEditor
        ref={editorRef}
        editorId="agentic-cursors-basic"
        theme="light"
        themes={[reactThemeLight, reactThemeDark]}
        workspaces={workspaces}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        onIsReady={() => void addCursors()}
        onAgenticCursorDetached={event => setMessage(`"${event.detail.id}" detached (${event.detail.reason}).`)}
        style={{ flex: 1, minHeight: 0 }}
      />
    </div>
  );
}
