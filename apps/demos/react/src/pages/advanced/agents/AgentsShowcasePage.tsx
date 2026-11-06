import { useMemo, useRef, useState } from "react";
import {
  KritzelAgent,
  KritzelEditor,
  KritzelShape,
  KritzelWorkspace,
  ShapeType,
  type HTMLKritzelEditorElement,
  type KritzelAgenticAction,
  type KritzelObjectChangeSource,
} from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { Toolbar } from "../../../components/Toolbar";

type ScenarioId = "tidy" | "flowchart" | "review" | "together";
type ScenarioState = "idle" | "running" | "done" | "failed";

/** Showcase pace: a little slower than the default, so every step is easy to follow. */
const SPEED = 800;

/** A ProseMirror document with one paragraph per line. */
function textDoc(text: string) {
  return {
    type: "doc",
    content: text.split("\n").map(line => ({ type: "paragraph", content: line ? [{ type: "text", text: line }] : [] })),
  };
}

interface NoteOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  fill: string;
  stroke: string;
  rotation?: number;
  shapeType?: ShapeType;
  fontColor?: string;
}

function note({ x, y, width, height, text, fill, stroke, rotation = 0, shapeType = ShapeType.Rectangle, fontColor }: NoteOptions) {
  const shape = new KritzelShape({
    translateX: x,
    translateY: y,
    width,
    height,
    rotation,
    shapeType,
    fillColor: { light: fill, dark: fill },
    strokeColor: { light: stroke, dark: stroke },
    strokeWidth: 2,
    fontSize: 16,
    ...(fontColor ? { fontColor: { light: fontColor, dark: fontColor } } : {}),
  });
  if (text) {
    shape.setContent(textDoc(text));
  }
  return shape;
}

const YELLOW = { fill: "#fff3c4", stroke: "#e0a800" };
const PINK = { fill: "#fde2ea", stroke: "#d6336c" };
const BLUE = { fill: "#dbeafe", stroke: "#2563eb" };
const GREEN = { fill: "#dcfce7", stroke: "#16a34a" };

const SCENARIOS: { id: ScenarioId; label: string; hint: string }[] = [
  { id: "tidy", label: "Tidy up", hint: "The Organizer arranges scattered notes into a grid." },
  { id: "flowchart", label: "Flowchart", hint: "The Architect draws a flowchart and connects the steps." },
  { id: "review", label: "Review", hint: "The Reviewer circles a problem, comments on it and straightens a card." },
  { id: "together", label: "Agents + human", hint: "Two agents work at once; then you can take a note from Agent A." },
];

/** One agent per persona; a scenario adds the ones it needs, Reset removes them again. */
function createAgents() {
  return {
    organizer: new KritzelAgent({ id: "organizer", name: "Organizer", color: "#7C3AED", speed: SPEED, position: { x: 0, y: 0 } }),
    architect: new KritzelAgent({ id: "architect", name: "Architect", color: "#0EA5E9", speed: SPEED, position: { x: -520, y: -200 } }),
    reviewer: new KritzelAgent({ id: "reviewer", name: "Reviewer", color: "#DB2777", speed: SPEED, position: { x: -400, y: 150 } }),
    agentA: new KritzelAgent({ id: "agent-a", name: "Agent A", color: "#7C3AED", speed: SPEED, position: { x: -560, y: -300 } }),
    agentB: new KritzelAgent({ id: "agent-b", name: "Agent B", color: "#F59E0B", speed: SPEED, position: { x: -300, y: -300 } }),
  };
}

export function AgentsShowcasePage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [state, setState] = useState<ScenarioState>("idle");
  const [scenario, setScenario] = useState<ScenarioId | null>(null);
  const [message, setMessage] = useState("Pick a use case.");
  const [lastChange, setLastChange] = useState("");
  // Published for tests and recordings that play the human in "Agents + human".
  const [greenId, setGreenId] = useState("");
  const [phase, setPhase] = useState("");
  const workspaces = useMemo(() => [new KritzelWorkspace({ id: "agentic-showcase", name: "Agentic Showcase" })], []);
  const [agents] = useState(createAgents);

  const editor = () => editorRef.current!;

  /** Runs an action and throws when it does not complete, so a script stops at the first problem. */
  async function act(agent: KritzelAgent, action: KritzelAgenticAction, status?: string): Promise<string[]> {
    if (status) {
      agent.setStatus(status);
    }
    const result = await agent.perform(action);
    if (!result.completed) {
      throw new Error(`${agent.id}: ${action.type} stopped (${result.reason})`);
    }
    return result.objectIds ?? [];
  }

  async function resetBoard() {
    const current = editor();
    await current.clearSelection();
    for (const agent of await current.getAgents()) {
      await current.removeAgent(agent);
    }
    // A removed agent keeps its status; start the next scenario without one.
    Object.values(agents).forEach(agent => agent.setStatus(null));
    const objects = (await current.getAllObjects()).filter(
      object => object.__class__ !== "KritzelSelectionGroup" && object.__class__ !== "KritzelSelectionBox",
    );
    if (objects.length > 0) {
      await current.removeObjects(objects);
    }
    setLastChange("");
  }

  // ─── Use case 1: tidy up a board ──────────────────────────────────────────

  async function tidyUp() {
    const notes = [
      note({ x: -560, y: -250, width: 150, height: 90, text: "Research", rotation: -8, ...YELLOW }),
      note({ x: 330, y: -270, width: 190, height: 120, text: "Interviews", rotation: 6, ...PINK }),
      note({ x: -470, y: 120, width: 130, height: 80, text: "Personas", rotation: 4, ...BLUE }),
      note({ x: 140, y: 150, width: 200, height: 130, text: "Journey map", rotation: -5, ...GREEN }),
      note({ x: -160, y: -230, width: 120, height: 70, text: "Pain points", rotation: 9, ...YELLOW }),
      note({ x: 400, y: 40, width: 140, height: 110, text: "Ideas", rotation: -10, ...PINK }),
    ];
    await editor().addObjects(notes);
    const { organizer } = agents;
    await editor().addAgent(organizer);

    // A 3 x 2 grid of 160 x 100 cells.
    const cells = [-270, -80, 110].flatMap(x => [-140, 0].map(y => ({ x, y })));
    cells.sort((a, b) => a.y - b.y || a.x - b.x);
    for (const [index, item] of notes.entries()) {
      const cell = cells[index];
      await act(organizer, { type: "select", objectIds: [item.id] }, `Note ${index + 1} of ${notes.length}`);
      await act(organizer, { type: "rotateObject", objectId: item.id, angle: 0 });
      await act(organizer, { type: "moveObject", objectId: item.id, to: cell, align: "top-left" });
      await act(organizer, { type: "resizeObject", objectId: item.id, width: 160, height: 100, keepAspectRatio: false });
    }
    await act(organizer, { type: "clearSelection" }, "All tidy");
  }

  // ─── Use case 2: build a flowchart ────────────────────────────────────────

  async function flowchart() {
    const { architect } = agents;
    await editor().addAgent(architect);
    const step = (x: number, y: number, text: string, shapeType: ShapeType, fill: string, stroke: string, status: string) =>
      act(
        architect,
        { type: "createShape", shapeType, x, y, width: 150, height: 80, text, style: { fillColor: fill, strokeColor: stroke, strokeWidth: 2 } },
        status,
      ).then(([id]) => id!);

    const start = await step(-540, -60, "Start", ShapeType.Ellipse, "#dcfce7", "#16a34a", "Adding the start");
    const load = await step(-320, -60, "Load data", ShapeType.Rectangle, "#dbeafe", "#2563eb", "Adding a step");
    const valid = await step(-100, -60, "Valid?", ShapeType.Rectangle, "#fff3c4", "#e0a800", "Adding a decision");
    const save = await step(120, -60, "Save", ShapeType.Rectangle, "#dbeafe", "#2563eb", "Adding a step");
    const retry = await step(-100, 120, "Retry", ShapeType.Rectangle, "#fde2ea", "#d6336c", "Adding the error path");
    const done = await step(340, -60, "Done", ShapeType.Ellipse, "#dcfce7", "#16a34a", "Adding the end");

    const lineStyle = { strokeColor: "#475569", strokeWidth: 3 };
    await act(architect, { type: "connect", from: start, to: load, style: lineStyle }, "Connecting the steps");
    await act(architect, { type: "connect", from: load, to: valid, style: lineStyle });
    await act(architect, { type: "connect", from: valid, to: save, style: lineStyle });
    await act(architect, { type: "connect", from: save, to: done, style: lineStyle });
    await act(architect, { type: "connect", from: valid, to: retry, style: lineStyle }, "Connecting the error path");
    await act(architect, { type: "connect", from: retry, to: load, style: lineStyle });
    await act(architect, { type: "typeText", objectId: save, text: " ✓" }, "Marking the happy path");
    architect.setStatus("Flowchart ready");
  }

  // ─── Use case 3: review and annotate ──────────────────────────────────────

  async function review() {
    const card = note({ x: 220, y: 30, width: 220, height: 150, text: "Monthly report", rotation: 14, ...BLUE });
    await editor().addObjects([
      note({ x: -460, y: -260, width: 920, height: 60, text: "Dashboard", fill: "#1e293b", stroke: "#1e293b", fontColor: "#ffffff" }),
      note({ x: -150, y: -60, width: 200, height: 60, text: "Buy now", fill: "#e2e8f0", stroke: "#cbd5e1", fontColor: "#cbd5e1" }),
      card,
    ]);
    const { reviewer } = agents;
    await editor().addAgent(reviewer);

    // A loose, slightly uneven loop around the button.
    const loop = Array.from({ length: 40 }, (_, i) => {
      const angle = (i / 39) * Math.PI * 2.1 - Math.PI / 2;
      const wobble = 1 + 0.05 * Math.sin(i * 1.7);
      return { x: -50 + Math.cos(angle) * 150 * wobble, y: -30 + Math.sin(angle) * 65 * wobble };
    });
    await act(reviewer, { type: "drawPath", points: loop, style: { strokeColor: "#DB2777", strokeWidth: 4 } }, "Spotted a problem");
    const [comment] = await act(
      reviewer,
      { type: "createText", x: -440, y: 90, text: "Contrast is too low here.", style: { fontColor: "#DB2777", fontSize: 18 } },
      "Writing a comment",
    );
    await act(reviewer, { type: "rotateObject", objectId: card.id, angle: 0 }, "Straightening the card");
    await act(reviewer, { type: "typeText", objectId: comment!, text: "\nTry #1e293b on white." }, "Suggesting a fix");
    reviewer.setStatus("Review done");
  }

  // ─── Use case 4: agents and a human together ──────────────────────────────

  async function together() {
    const intro = note({ x: -540, y: -240, width: 150, height: 80, text: "Draft intro", ...YELLOW });
    const outline = note({ x: -540, y: -120, width: 150, height: 80, text: "Draft outline", ...YELLOW });
    const feedback = note({ x: -320, y: -240, width: 150, height: 80, text: "Feedback", ...PINK });
    const green = note({ x: -540, y: 120, width: 150, height: 80, text: "Grab me!", ...GREEN });
    await editor().addObjects([intro, outline, feedback, green]);
    setGreenId(green.id);
    const { agentA, agentB } = agents;
    await editor().addAgent(agentA);
    await editor().addAgent(agentB);

    // Both agents work at the same time; each runs its own queue.
    await Promise.all([
      (async () => {
        await act(agentA, { type: "moveObject", objectId: intro.id, to: { x: 150, y: -240 }, align: "top-left" }, "Moving drafts");
        await act(agentA, { type: "moveObject", objectId: outline.id, to: { x: 150, y: -130 }, align: "top-left" });
      })(),
      (async () => {
        const [summary] = await act(
          agentB,
          { type: "createShape", x: -320, y: -60, width: 170, height: 80, text: "Summary", style: { fillColor: "#ede9fe", strokeColor: "#7c3aed" } },
          "Summarizing feedback",
        );
        await act(agentB, { type: "connect", from: feedback.id, to: summary!, style: { strokeColor: "#475569", strokeWidth: 3 } });
      })(),
    ]);

    // A slow move the user can interrupt by grabbing the note.
    agentA.setStatus("Moving the green note");
    setPhase("grab");
    setMessage("Now grab the green note: Agent A is moving it.");
    const grab = await agentA.moveObject(green.id, { x: 300, y: 140 }, { align: "top-left", speed: 300 });
    setPhase("");
    agentA.setStatus(grab.completed ? "Moved the note" : `Backed off (${grab.reason})`);

    // Each agent has its own history: Agent B takes back its connector.
    await act(agentB, { type: "undo" }, "Undoing my connector");
    agentB.setStatus("Undid my last step");
    setMessage(
      grab.completed
        ? "Agent A moved the green note. Agent B undid its connector."
        : `Agent A backed off when you took the note (${grab.reason}). Agent B undid its connector.`,
    );
  }

  const SCRIPTS: Record<ScenarioId, () => Promise<void>> = { tidy: tidyUp, flowchart, review, together };

  async function run(id: ScenarioId) {
    if (state === "running" || !editorRef.current) return;
    setScenario(id);
    setState("running");
    setPhase("");
    setMessage(SCENARIOS.find(item => item.id === id)!.hint);
    try {
      await resetBoard();
      await SCRIPTS[id]();
      setState("done");
      if (id !== "together") {
        setMessage(`${SCENARIOS.find(item => item.id === id)!.label} finished.`);
      }
    } catch (error) {
      setState("failed");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function reset() {
    if (state === "running") return;
    await resetBoard();
    setScenario(null);
    setState("idle");
    setMessage("Pick a use case.");
  }

  function onChange(source: KritzelObjectChangeSource | undefined, kind: string) {
    if (source) {
      setLastChange(`${kind} by ${source.agentId} (${source.actionType})`);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "sans-serif" }}>
      <Toolbar>
        <span className="label">Agentic Showcase</span>
        {SCENARIOS.map(item => (
          <button key={item.id} disabled={state === "running"} onClick={() => void run(item.id)} aria-pressed={scenario === item.id}>
            {item.label}
          </button>
        ))}
        <button disabled={state === "running"} onClick={() => void reset()}>Reset</button>
        <span className="label" data-testid="showcase-message" data-scenario={scenario ?? ""} data-scenario-state={state} data-green-id={greenId} data-phase={phase}>
          {message}
        </span>
        {lastChange && <span className="status">{lastChange}</span>}
      </Toolbar>
      <KritzelEditor
        ref={editorRef}
        editorId="agents-showcase"
        theme="light"
        themes={[reactThemeLight, reactThemeDark]}
        workspaces={workspaces}
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
