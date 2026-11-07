import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  BroadcastSyncProvider,
  KritzelAgent,
  KritzelEditor,
  KritzelWorkspace,
  type HTMLKritzelEditorElement,
  type IKritzelUser,
  type KritzelAgentState,
  type KritzelAgentsChangeEvent,
  type KritzelAgenticActionResult,
  type KritzelObjectChangeSource,
  type KritzelSyncConfig,
} from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { Toolbar } from "../../../components/Toolbar";
import { NOTE_COLORS } from "./shared/sticky-note";
import "./team/team.css";

type Presence = KritzelAgentsChangeEvent["agents"][number];

interface FeedEntry {
  id: number;
  color?: string;
  text: string;
  code?: string;
  warning?: boolean;
}

const TEAM = [
  { id: "planner", name: "Planner", color: "#7C3AED", position: { x: -320, y: 40 } },
  { id: "writer", name: "Writer", color: "#0EA5E9", position: { x: 300, y: -40 } },
  { id: "designer", name: "Designer", color: "#F59E0B", position: { x: 300, y: 180 } },
] as const;

const COLORS: Record<string, string> = Object.fromEntries(TEAM.map(member => [member.id, member.color]));
const NAMES: Record<string, string> = Object.fromEntries(TEAM.map(member => [member.id, member.name]));

// A sprint board: three columns of 190 x 60 cards, centered on the origin.
const CARD = { width: 190, height: 60 };
const GAP = 24;
const LEFT = -(3 * CARD.width + 2 * GAP) / 2;
const columnX = (column: number) => LEFT + column * (CARD.width + GAP);
const rowY = (row: number) => -206 + row * (CARD.height + 12);
const COLUMNS = ["To do", "Doing", "Done"];
const CARDS = [
  { text: "Presence avatars", points: 3, color: NOTE_COLORS.violet },
  { text: "Remote cursors", points: 5, color: NOTE_COLORS.blue },
  { text: "Activity feed", points: 2, color: NOTE_COLORS.pink },
  { text: "Docs & demos", points: 3, color: NOTE_COLORS.yellow },
];
const PLAIN = { fill: "#f8fafc", stroke: "#94a3b8" };

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => (resolve = done));
  return { promise, resolve };
}

let feedCounter = 0;

/** One user per tab, so the agents of the other tab count as a collaborator's. */
const TAB_ID = Math.random().toString(36).slice(2, 6);

export function AgentsTeamPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [agents] = useState(() => TEAM.map(({ id, name, color, position }) => new KritzelAgent({ id, name, color, speed: 900, position })));
  const [presences, setPresences] = useState<Presence[]>([]);
  const [states, setStates] = useState<Record<string, KritzelAgentState>>({});
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const feedRef = useRef<HTMLDivElement | null>(null);
  // Agents whose last action was interrupted: the feed already has a line for it.
  const interruptedRef = useRef(new Set<string>());

  // Awareness shares presence between tabs: open this page twice to watch the team from the second tab.
  const syncConfig = useMemo<KritzelSyncConfig>(() => ({ providers: [BroadcastSyncProvider.with({ awareness: true })] }), []);
  const user = useMemo<IKritzelUser>(() => ({ id: `tab-${TAB_ID}`, displayName: `Tab ${TAB_ID}` }), []);
  const workspaces = useMemo(() => [new KritzelWorkspace({ id: "agents-team-demo", name: "Agent Team" })], []);

  const [planner, writer, designer] = agents;

  function log(entry: Omit<FeedEntry, "id">) {
    setFeed(current => [...current.slice(-40), { ...entry, id: ++feedCounter }]);
  }

  useEffect(() => {
    const offs = agents.flatMap(agent => [
      agent.on("change", state => setStates(current => ({ ...current, [agent.id]: state }))),
      // Someone took over the objects of a running action. A refused undo is reported by undo() below.
      agent.on("interrupted", ({ action, reason, keptChanges }) => {
        if (action.type === "undo") return;
        interruptedRef.current.add(agent.id);
        log({
          color: agent.color,
          warning: true,
          text: `${agent.name} was interrupted (${reason}) and ${keptChanges ? "kept its changes" : "rolled back"}`,
          code: action.type,
        });
      }),
    ]);
    return () => offs.forEach(off => off());
  }, [agents]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [feed]);

  /** Runs an action; a refusal goes to the feed instead of stopping the whole team. */
  async function act(agent: KritzelAgent, promise: Promise<KritzelAgenticActionResult>) {
    const result = await promise;
    const reported = interruptedRef.current.delete(agent.id);
    if (!result.completed && result.reason !== "aborted" && !reported) {
      log({ color: agent.color, warning: true, text: `${agent.name} was refused: ${result.reason}` });
    }
    return result.completed ? (result.objectIds?.[0] ?? null) : null;
  }

  async function runTeam() {
    const editor = editorRef.current;
    if (!editor || isRunning) return;
    setIsRunning(true);
    try {
      await clearBoard();
      for (const agent of agents) {
        await editor.addAgent(agent);
      }

      // ─── 1. Everyone sets up at once ───────────────────────────────────────
      planner.setStatus("Adding columns");
      writer.setStatus("Writing the sprint goal");
      designer.setStatus("Drawing dividers");
      await Promise.all([
        (async () => {
          for (const [column, title] of COLUMNS.entries()) {
            await act(planner, planner.createText({ x: columnX(column), y: -262, text: title, style: { fontSize: 22, fontColor: "#334155" } }));
          }
        })(),
        act(
          writer,
          writer.createShape({
            x: LEFT,
            y: 100,
            width: 3 * CARD.width + 2 * GAP,
            height: 56,
            text: "Sprint goal: share agents with collaborators",
            style: { fillColor: "#f1f5f9", strokeColor: "#cbd5e1", strokeWidth: 2, fontSize: 17 },
          }),
        ),
        (async () => {
          for (const column of [1, 2]) {
            const x = columnX(column) - GAP / 2;
            await act(designer, designer.drawPath([{ x, y: -258 }, { x: x + 2, y: -100 }, { x, y: 70 }], { style: { strokeColor: "#cbd5e1", strokeWidth: 3 } }));
          }
        })(),
      ]);

      // ─── 2. An assembly line: create → write → style, each agent on its own card ──
      planner.setStatus("Adding cards");
      writer.setStatus("Estimating");
      designer.setStatus("Coloring cards");
      const created = CARDS.map(() => deferred<string | null>());
      const written = CARDS.map(() => deferred<string | null>());
      await Promise.all([
        (async () => {
          for (const [row, card] of CARDS.entries()) {
            created[row].resolve(
              await act(
                planner,
                planner.createShape({
                  x: columnX(0),
                  y: rowY(row),
                  ...CARD,
                  text: card.text,
                  style: { fillColor: PLAIN.fill, strokeColor: PLAIN.stroke, strokeWidth: 2, fontSize: 15 },
                }),
              ),
            );
          }
        })(),
        (async () => {
          for (const [row, card] of CARDS.entries()) {
            const id = await created[row].promise;
            written[row].resolve(id && (await act(writer, writer.typeText(id, `\n${card.points} pts`))) ? id : null);
          }
        })(),
        (async () => {
          for (const [row, card] of CARDS.entries()) {
            const id = await written[row].promise;
            if (id) await act(designer, designer.setStyle([id], { fillColor: card.color.fill, strokeColor: card.color.stroke }));
          }
        })(),
      ]);
      const cards = await Promise.all(created.map(card => card.promise));

      // ─── 3. Work moves across the board ──────────────────────────────────────
      planner.setStatus("Updating the board");
      writer.setStatus(null);
      designer.setStatus(null);
      const [done, doing, ...rest] = cards;
      if (done) await act(planner, planner.moveObject(done, { x: columnX(2), y: rowY(0) }, { align: "top-left" }));
      await Promise.all([
        (async () => {
          // A slower move, so there is time to grab the card and see the agent back off.
          if (doing) await act(planner, planner.moveObject(doing, { x: columnX(1), y: rowY(0) }, { align: "top-left", speed: 110 }));
          for (const [index, id] of rest.entries()) {
            if (id) await act(planner, planner.moveObject(id, { x: columnX(0), y: rowY(index) }, { align: "top-left" }));
          }
        })(),
        (async () => {
          if (!done) return;
          designer.setStatus("Marking it done");
          await act(designer, designer.setStyle([done], { fillColor: NOTE_COLORS.green.fill, strokeColor: NOTE_COLORS.green.stroke }));
          writer.setStatus("Checking it off");
          await act(writer, writer.typeText(done, " ✓"));
        })(),
      ]);
      for (const agent of agents) agent.setStatus("Done");
      log({ text: "The team is done. Undo on an agent takes back only that agent's last step." });
    } finally {
      setIsRunning(false);
    }
  }

  async function clearBoard() {
    const editor = editorRef.current;
    if (!editor) return;
    for (const agent of agents) {
      agent.cancel();
      await editor.removeAgent(agent);
      agent.setStatus(null);
    }
    await editor.clearSelection();
    const objects = (await editor.getAllObjects()).filter(
      object => object.__class__ !== "KritzelSelectionGroup" && object.__class__ !== "KritzelSelectionBox",
    );
    if (objects.length > 0) await editor.removeObjects(objects);
    setFeed([]);
  }

  async function undo(agent: KritzelAgent) {
    const result = await agent.undo();
    if (result.completed) return;
    // An agent only undoes a step while nobody changed its objects since, e.g. the Designer's color on the card
    // the Writer checked off afterwards.
    log({
      color: agent.color,
      warning: true,
      text: result.reason === "conflict" ? `${agent.name} can't undo: its card changed since its last step` : `${agent.name} could not undo`,
      code: result.reason,
    });
  }

  function onChange(source: KritzelObjectChangeSource | undefined, kind: string) {
    if (source?.type !== "agent") return;
    // One event per completed action, named by the agent and the action.
    log({ color: COLORS[source.agentId], text: `${NAMES[source.agentId] ?? source.agentId} ${kind}`, code: source.actionType });
  }

  return (
    <div className="team-page">
      <Toolbar>
        <span className="label">Agent Team</span>
        <button disabled={isRunning} onClick={() => void runTeam()} data-testid="team-run" data-running={isRunning}>Run team</button>
        <button disabled={isRunning} onClick={() => void clearBoard()}>Reset</button>
        <span className="status">Open this page in a second tab to watch the team from there.</span>
      </Toolbar>
      <div className="team-body">
        <KritzelEditor
          ref={editorRef}
          editorId="agents-team"
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
          onAgentsChange={event => setPresences(event.detail.agents)}
          onObjectsAdded={event => onChange(event.detail.source, "added")}
          onObjectsUpdated={event => onChange(event.detail.source, "updated")}
          onObjectsRemoved={event => onChange(event.detail.source, "removed")}
          style={{ flex: 1, minWidth: 0, minHeight: 0 }}
        />
        <aside className="team-panel" aria-label="Team">
          <h2>Agents on this board</h2>
          <div className="team-agents" data-testid="team-agents">
            {presences.length === 0 && <div className="team-empty">No agents yet. Press Run team here or in another tab.</div>}
            {presences.map(presence => {
              const local = presence.isRemote ? null : agents.find(agent => agent.id === presence.id);
              const state = local ? states[local.id] : undefined;
              const busy = !!presence.activeAction || presence.queueLength > 0;
              return (
                <div
                  key={presence.isRemote ? `${presence.clientId}:${presence.id}` : presence.id}
                  className={`team-agent${busy ? " busy" : ""}`}
                  style={{ "--agent-color": presence.color } as CSSProperties}
                  data-testid="team-agent"
                  data-remote={presence.isRemote}
                >
                  <span className="team-avatar">{presence.name.charAt(0)}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="team-name">
                      {presence.name}
                      {presence.isRemote && <small>via {presence.hostUser?.displayName ?? "another tab"}</small>}
                    </div>
                    <div className="team-status">{presence.status ?? "Idle"}</div>
                    {presence.activeAction && (
                      <span className="team-action">
                        {presence.activeAction}
                        {presence.queueLength > 0 ? ` +${presence.queueLength}` : ""}
                      </span>
                    )}
                  </div>
                  {local && (
                    <div className="team-buttons">
                      <button disabled={!busy} onClick={() => local.cancel()}>Stop</button>
                      <button disabled={isRunning || !state?.canUndo} onClick={() => void undo(local)}>Undo</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <h2>Activity</h2>
          <div className="team-feed" ref={feedRef} data-testid="team-feed">
            {feed.map(entry => (
              <div key={entry.id} className={`team-event${entry.warning ? " warning" : ""}`} style={{ "--agent-color": entry.color } as CSSProperties}>
                <i />
                <span>
                  {entry.text} {entry.code && <code>{entry.code}</code>}
                </span>
              </div>
            ))}
          </div>
          <p className="team-hint">Select a card while the Planner moves it: the agent backs off and leaves the card to you.</p>
        </aside>
      </div>
    </div>
  );
}
