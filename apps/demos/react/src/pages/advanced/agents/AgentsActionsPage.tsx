import { useEffect, useMemo, useRef, useState } from "react";
import {
  BroadcastSyncProvider,
  UpdrawAgent,
  UpdrawAgentActionError,
  UpdrawEditor,
  UpdrawShape,
  UpdrawWorkspace,
  ShapeType,
  type HTMLUpdrawEditorElement,
  type IUpdrawUser,
  type UpdrawAgentState,
  type UpdrawObjectChangeSource,
  type UpdrawSyncConfig,
} from "@updraw/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { Toolbar } from "../../../components/Toolbar";

const AGENT = "agent";
const RECTANGLE_ID = "agentic-actions-rectangle";
const ELLIPSE_ID = "agentic-actions-ellipse";

/** Seeds with fixed IDs, so every tab of this page works on the same objects. */
function createActionSeeds() {
  const rectangle = new UpdrawShape({
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
  const ellipse = new UpdrawShape({
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
  const editorRef = useRef<HTMLUpdrawEditorElement | null>(null);
  const [agent] = useState(() => new UpdrawAgent({ id: AGENT, name: "Agent", color: "#7C3AED", position: { x: -400, y: -200 } }));
  const [isRunning, setIsRunning] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [message, setMessage] = useState("");
  const [lastChange, setLastChange] = useState("");

  // Awareness shares presence between the tabs: each tab sees the other tab's agent and cursor.
  const syncConfig = useMemo<UpdrawSyncConfig>(() => ({ providers: [BroadcastSyncProvider.with({ awareness: true })] }), []);
  // One user per tab, so selections in other tabs count as collaborators.
  const user = useMemo<IUpdrawUser>(() => {
    const id = Math.random().toString(36).slice(2, 8);
    return { id: `tab-${id}`, displayName: `Tab ${id}` };
  }, []);
  const workspaces = useMemo(
    () => [new UpdrawWorkspace({ id: "agentic-actions-demo", name: "Agentic Actions", objects: createActionSeeds() })],
    [],
  );

  useEffect(() => {
    const syncHistory = (state: UpdrawAgentState) => {
      setCanUndo(state.canUndo);
      setCanRedo(state.canRedo);
    };
    syncHistory(agent.state);
    return agent.on("change", syncHistory);
  }, [agent]);

  async function addAgent() {
    await editorRef.current?.addAgent(agent);
  }

  async function runScript() {
    const editor = editorRef.current;
    if (!editor || isRunning) return;
    setIsRunning(true);
    setMessage("");

    try {
      await addAgent();
      // The first action that does not complete throws out of the task.
      await agent.task("Selecting", async () => {
        await agent.select([RECTANGLE_ID]);
        agent.setStatus("Moving");
        await agent.moveObject(RECTANGLE_ID, { x: 40, y: -140 }, { align: "top-left" });
        agent.setStatus("Resizing");
        await agent.resizeObject(RECTANGLE_ID, { width: 220 });
        agent.setStatus("Rotating");
        await agent.rotateObject(RECTANGLE_ID, 10);
        agent.setStatus("Adding a note");
        const { objectIds: [note] = [] } = await agent.createShape({
          x: 60,
          y: 90,
          width: 180,
          height: 90,
          text: "Agent note",
          style: { fillColor: "#fff8e1", strokeColor: "#f59e0b" },
        });
        if (!note) throw new Error("createShape returned no object");
        agent.setStatus("Connecting");
        await agent.connect(ELLIPSE_ID, note);
        agent.setStatus("Underlining");
        await agent.drawPath([{ x: 60, y: 200 }, { x: 120, y: 215 }, { x: 180, y: 195 }, { x: 240, y: 210 }], { style: { strokeColor: "#7C3AED" } });
        agent.setStatus("Done");
        await agent.clearSelection();
      });
      setMessage("Script finished. Undo the agent's steps one by one, or open a second tab to watch the changes sync.");
    } catch (error) {
      if (error instanceof UpdrawAgentActionError) {
        setMessage(`${error.action.type} stopped: ${error.reason}`);
      } else {
        setMessage(error instanceof Error ? error.message : String(error));
      }
    } finally {
      setIsRunning(false);
    }
  }

  async function history(type: "undo" | "redo") {
    if (!editorRef.current || isRunning) return;
    await addAgent();
    const result = await agent[type]();
    setMessage(result.completed ? `Agent ${type} done.` : `Agent ${type} stopped: ${result.reason}`);
  }

  function onChange(source: UpdrawObjectChangeSource | undefined, kind: string) {
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
        <button disabled={!isRunning} onClick={() => agent.cancel()}>Abort</button>
        {message && <span className="label">{message}</span>}
        {lastChange && <span className="status">{lastChange}</span>}
      </Toolbar>
      <UpdrawEditor
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
        onIsReady={() => void addAgent()}
        onObjectsAdded={event => onChange(event.detail.source, "Added")}
        onObjectsUpdated={event => onChange(event.detail.source, "Updated")}
        onObjectsRemoved={event => onChange(event.detail.source, "Removed")}
        style={{ flex: 1, minHeight: 0 }}
      />
    </div>
  );
}
