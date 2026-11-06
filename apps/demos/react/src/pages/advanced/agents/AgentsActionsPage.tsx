import { useMemo, useRef, useState } from "react";
import {
  BroadcastSyncProvider,
  KritzelEditor,
  KritzelShape,
  KritzelWorkspace,
  ShapeType,
  type HTMLKritzelEditorElement,
  type IKritzelUser,
  type KritzelAgenticAction,
  type KritzelObjectChangeSource,
  type KritzelSyncConfig,
} from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { Toolbar } from "../../../components/Toolbar";

const AGENT = "agent";
const RECTANGLE_ID = "agentic-actions-rectangle";
const ELLIPSE_ID = "agentic-actions-ellipse";

/** Seeds with fixed IDs, so every tab of this page works on the same objects. */
function createActionSeeds() {
  const rectangle = new KritzelShape({
    translateX: -260,
    translateY: -120,
    width: 140,
    height: 90,
    shapeType: ShapeType.Rectangle,
    fillColor: { light: "#fce4ec", dark: "#880e4f" },
    strokeColor: { light: "#c62828", dark: "#ef9a9a" },
    strokeWidth: 3,
  });
  rectangle.id = RECTANGLE_ID;
  const ellipse = new KritzelShape({
    translateX: -260,
    translateY: 80,
    width: 120,
    height: 120,
    shapeType: ShapeType.Ellipse,
    fillColor: { light: "#e3f2fd", dark: "#1a237e" },
    strokeColor: { light: "#1565c0", dark: "#90caf9" },
    strokeWidth: 3,
  });
  ellipse.id = ELLIPSE_ID;
  return [rectangle, ellipse];
}

export function AgentsActionsPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [message, setMessage] = useState("");
  const [lastChange, setLastChange] = useState("");

  const syncConfig = useMemo<KritzelSyncConfig>(() => ({ providers: [BroadcastSyncProvider] }), []);
  // One user per tab, so selections in other tabs count as collaborators.
  const user = useMemo<IKritzelUser>(() => {
    const id = Math.random().toString(36).slice(2, 8);
    return { id: `tab-${id}`, displayName: `Tab ${id}` };
  }, []);
  const workspaces = useMemo(
    () => [new KritzelWorkspace({ id: "agentic-actions-demo", name: "Agentic Actions", objects: createActionSeeds() })],
    [],
  );

  async function ensureAgent(editor: HTMLKritzelEditorElement) {
    if (!(await editor.getAgenticCursor(AGENT))) {
      await editor.addAgenticCursor({ id: AGENT, name: "Agent", color: "#7C3AED", position: { x: -400, y: -200 } });
    }
  }

  async function refreshHistory() {
    const cursor = await editorRef.current?.getAgenticCursor(AGENT);
    setCanUndo(!!cursor?.canUndo);
    setCanRedo(!!cursor?.canRedo);
  }

  async function perform(action: KritzelAgenticAction, status: string) {
    const editor = editorRef.current!;
    await editor.updateAgenticCursor(AGENT, { status });
    const result = await editor.performAgenticAction(AGENT, action, { signal: abortRef.current?.signal });
    if (!result.completed) {
      throw new Error(`${action.type} stopped: ${result.reason}`);
    }
    return result.objectIds ?? [];
  }

  async function runScript() {
    const editor = editorRef.current;
    if (!editor || isRunning) return;
    setIsRunning(true);
    setMessage("");
    abortRef.current = new AbortController();

    try {
      await ensureAgent(editor);
      await perform({ type: "select", objectIds: [RECTANGLE_ID] }, "Selecting");
      await perform({ type: "moveObject", objectId: RECTANGLE_ID, to: { x: 40, y: -140 }, align: "top-left" }, "Moving");
      await perform({ type: "resizeObject", objectId: RECTANGLE_ID, width: 220 }, "Resizing");
      await perform({ type: "rotateObject", objectId: RECTANGLE_ID, angle: 10 }, "Rotating");
      const [note] = await perform(
        { type: "createShape", x: 60, y: 90, width: 180, height: 90, text: "Agent note", style: { fillColor: "#fff8e1", strokeColor: "#f59e0b" } },
        "Adding a note",
      );
      if (!note) throw new Error("createShape returned no object");
      await perform({ type: "connect", from: ELLIPSE_ID, to: note }, "Connecting");
      await perform(
        { type: "drawPath", points: [{ x: 60, y: 200 }, { x: 120, y: 215 }, { x: 180, y: 195 }, { x: 240, y: 210 }], style: { strokeColor: "#7C3AED" } },
        "Underlining",
      );
      await perform({ type: "clearSelection" }, "Done");
      setMessage("Script finished. Undo the agent's steps one by one, or open a second tab to watch the changes sync.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      await editor.updateAgenticCursor(AGENT, { status: null }).catch(() => undefined);
      abortRef.current = null;
      setIsRunning(false);
      await refreshHistory();
    }
  }

  async function history(type: "undo" | "redo") {
    const editor = editorRef.current;
    if (!editor || isRunning) return;
    await ensureAgent(editor);
    const result = await editor.performAgenticAction(AGENT, { type });
    setMessage(result.completed ? `Agent ${type} done.` : `Agent ${type} stopped: ${result.reason}`);
    await refreshHistory();
  }

  function onChange(source: KritzelObjectChangeSource | undefined, kind: string) {
    if (source) {
      setLastChange(`${kind} by ${source.agentId} (${source.actionType})`);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "sans-serif" }}>
      <Toolbar>
        <span className="label">Agentic Actions</span>
        <button disabled={isRunning} onClick={() => void runScript()}>Run Script</button>
        <button disabled={isRunning || !canUndo} onClick={() => void history("undo")}>Undo Agent</button>
        <button disabled={isRunning || !canRedo} onClick={() => void history("redo")}>Redo Agent</button>
        <button disabled={!isRunning} onClick={() => abortRef.current?.abort()}>Abort</button>
        {message && <span className="label">{message}</span>}
        {lastChange && <span className="status">{lastChange}</span>}
      </Toolbar>
      <KritzelEditor
        ref={editorRef}
        editorId="agents-actions"
        syncConfig={syncConfig}
        user={user}
        theme="light"
        themes={[reactThemeLight, reactThemeDark]}
        workspaces={workspaces}
        loginConfig={undefined}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        onObjectsAdded={event => onChange(event.detail.source, "Added")}
        onObjectsUpdated={event => onChange(event.detail.source, "Updated")}
        onObjectsRemoved={event => onChange(event.detail.source, "Removed")}
        style={{ flex: 1, minHeight: 0 }}
      />
    </div>
  );
}
