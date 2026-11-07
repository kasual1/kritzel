import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  KritzelAgent,
  KritzelEditor,
  KritzelWorkspace,
  type HTMLKritzelEditorElement,
  type KritzelAgentToolResult,
  type KritzelCanvasSnapshot,
} from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { Toolbar } from "../../../components/Toolbar";
import { NOTE_COLORS, stickyNote } from "./shared/sticky-note";
import { CLAUDE_MODEL, createClaudeModel, runCopilot, type CopilotEvent, type CopilotMessage } from "./copilot/copilot-loop";
import { OFFLINE_PROMPTS, offlineModel } from "./copilot/offline-model";
import "./copilot/copilot.css";

type Provider = "offline" | "claude";

type Entry =
  | { kind: "user" | "assistant" | "error" | "note"; id: string; text: string }
  | { kind: "tool"; id: string; name: string; summary: string; status: "running" | "done" | "failed"; reason?: string; hint?: string };

const COPILOT = "copilot";

/** A brainstorm about a team offsite, scattered over the board. */
function createBoard() {
  const { yellow } = NOTE_COLORS;
  const note = (x: number, y: number, text: string, rotation = 0) => stickyNote({ x, y, width: 180, height: 86, text, rotation, ...yellow });
  return [
    note(-400, -290, "Book a venue", -4),
    note(-130, -250, "Hiking trip"),
    note(190, -295, "Pizza night", 5),
    note(40, -120, "Budget sheet"),
    note(-390, -110, "Escape room", 3),
    note(230, -40, "Vegan options"),
    note(-170, 20, "Rent a bus", -5),
    note(90, 110, "Board games"),
    note(-400, 100, "Coffee bar"),
  ];
}

let entryCounter = 0;
const nextId = () => `entry-${++entryCounter}`;

function shorten(text: string, max = 22) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

/** A short, readable line for a tool call, e.g. `“Pizza night” → 140, -80`. */
function summarize(name: string, input: unknown, labels: Map<string, string>) {
  const value = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const object = (id: unknown) => (typeof id === "string" && labels.has(id) ? `“${labels.get(id)}”` : "an object");
  const point = (target: unknown) => {
    const { x, y, objectId } = (target ?? {}) as { x?: unknown; y?: unknown; objectId?: unknown };
    return typeof x === "number" && typeof y === "number" ? `${Math.round(x)}, ${Math.round(y)}` : object(objectId);
  };
  switch (name) {
    case "observe_canvas":
      return value.scope === "viewport" ? "what the user sees" : "the whole board";
    case "create_text":
    case "create_shape":
      return value.text ? `“${shorten(String(value.text))}”` : `${value.shapeType ?? "shape"} at ${point(value)}`;
    case "move_object":
      return `${object(value.objectId)} → ${point(value.to)}`;
    case "rotate_object":
      return `${object(value.objectId)} to ${value.angle}°`;
    case "resize_object":
      return `${object(value.objectId)} to ${value.width ?? "…"} × ${value.height ?? "…"}`;
    case "set_style": {
      const ids: unknown[] = Array.isArray(value.objectIds) ? value.objectIds : [];
      const style = Object.entries(value.style ?? {}).map(([key, color]) => `${key.replace("Color", "")} ${color}`)[0];
      return `${ids.length === 1 ? object(ids[0]) : `${ids.length} objects`}${style ? ` · ${style}` : ""}`;
    }
    case "connect":
      return `${object(value.from)} → ${object(value.to)}`;
    case "type_text":
      return `${object(value.objectId)}: “${shorten(String(value.text ?? ""))}”`;
    case "select":
    case "delete_objects":
      return `${Array.isArray(value.objectIds) ? value.objectIds.length : 0} objects`;
    case "draw_path":
      return `${Array.isArray(value.points) ? value.points.length : 0} points`;
    default:
      return "";
  }
}

export function AgentsCopilotPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const historyRef = useRef<CopilotMessage[]>([]);
  const controllerRef = useRef<AbortController | null>(null);
  // Texts of the objects the model saw, to show tool calls with names instead of IDs.
  const labelsRef = useRef(new Map<string, string>());
  const [agent] = useState(() => new KritzelAgent({ id: COPILOT, name: "Copilot", color: "#7C3AED", speed: 900, position: { x: 330, y: 220 } }));
  const [agentState, setAgentState] = useState(() => agent.state);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useState<Provider>("offline");
  const [apiKey, setApiKey] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const workspaces = useMemo(() => [new KritzelWorkspace({ id: "agents-copilot", name: "Agent Copilot", objects: createBoard() })], []);
  const toolNames = useMemo(() => agent.tools().map(tool => tool.name), [agent]);

  useEffect(() => agent.on("change", setAgentState), [agent]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [entries, isThinking]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const append = (entry: Entry) => setEntries(current => [...current, entry]);

  function rememberLabels(event: Extract<CopilotEvent, { type: "tool-end" }>) {
    if (event.name === "observe_canvas") {
      try {
        const snapshot = JSON.parse(event.output) as KritzelCanvasSnapshot;
        snapshot.objects?.forEach(object => object.text && labelsRef.current.set(object.id, shorten(object.text)));
      } catch {
        // Not a snapshot, e.g. a refusal.
      }
    }
    event.result?.objects?.forEach(object => object.text && labelsRef.current.set(object.id, shorten(object.text)));
  }

  function onEvent(event: CopilotEvent) {
    switch (event.type) {
      case "thinking":
        setIsThinking(event.active);
        break;
      case "text":
        append({ kind: "assistant", id: nextId(), text: event.text });
        break;
      case "tool-start":
        append({ kind: "tool", id: event.id, name: event.name, summary: summarize(event.name, event.input, labelsRef.current), status: "running" });
        break;
      case "tool-end": {
        rememberLabels(event);
        const result: KritzelAgentToolResult | null = event.result;
        // observe_canvas answers with a snapshot, not with a result: it only fails with `completed: false`.
        const failed = result ? !result.completed : false;
        setEntries(current =>
          current.map(entry =>
            entry.kind === "tool" && entry.id === event.id
              ? { ...entry, status: failed ? "failed" : "done", reason: result?.reason, hint: result?.hint ?? result?.message }
              : entry,
          ),
        );
        break;
      }
    }
  }

  async function send(text: string) {
    const editor = editorRef.current;
    const trimmed = text.trim();
    if (!editor || isRunning || !trimmed) return;
    if (provider === "claude" && !apiKey.trim()) {
      append({ kind: "error", id: nextId(), text: "Enter your Anthropic API key in the toolbar, or switch to the offline model." });
      return;
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    setPrompt("");
    append({ kind: "user", id: nextId(), text: trimmed });
    setIsRunning(true);
    try {
      // Adding the agent again does nothing, so this also works after the first prompt.
      await editor.addAgent(agent);
      await runCopilot({
        agent,
        model: provider === "claude" ? createClaudeModel(apiKey.trim()) : offlineModel,
        history: historyRef.current,
        prompt: trimmed,
        signal: controller.signal,
        onEvent,
      });
    } catch (error) {
      if (controller.signal.aborted) {
        append({ kind: "note", id: nextId(), text: "Stopped. The running action was rolled back." });
      } else {
        append({ kind: "error", id: nextId(), text: error instanceof Error ? error.message : String(error) });
      }
    } finally {
      // Tool calls that never got a result were cut off by Stop.
      setEntries(current => current.map(entry => (entry.kind === "tool" && entry.status === "running" ? { ...entry, status: "failed", reason: "aborted" } : entry)));
      setIsThinking(false);
      setIsRunning(false);
      controllerRef.current = null;
    }
  }

  function stop() {
    // Aborting the signal stops the request to the model and the agent's running action.
    controllerRef.current?.abort();
  }

  function changeProvider(next: Provider) {
    if (next === provider || isRunning) return;
    setProvider(next);
    // The models answer differently, so each starts its own conversation.
    historyRef.current = [];
    append({ kind: "note", id: nextId(), text: next === "claude" ? `Switched to Claude (${CLAUDE_MODEL}).` : "Switched to the offline demo model." });
  }

  async function reset() {
    const editor = editorRef.current;
    if (!editor || isRunning) return;
    await editor.clearSelection();
    // Removing the agent also clears its undo history.
    await editor.removeAgent(agent);
    const objects = (await editor.getAllObjects()).filter(
      object => object.__class__ !== "KritzelSelectionGroup" && object.__class__ !== "KritzelSelectionBox",
    );
    if (objects.length > 0) {
      await editor.removeObjects(objects);
    }
    await editor.addObjects(createBoard());
    await editor.addAgent(agent);
    historyRef.current = [];
    labelsRef.current.clear();
    setEntries([]);
  }

  async function undo() {
    if (isRunning) return;
    const result = await agent.undo();
    append({ kind: "note", id: nextId(), text: result.completed ? "Undid the copilot's last step." : `Nothing undone (${result.reason}).` });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void send(prompt);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send(prompt);
    }
  }

  return (
    <div className="copilot-page">
      <Toolbar>
        <span className="label">Agent Copilot</span>
        <div className="copilot-segmented" role="group" aria-label="Model">
          <button type="button" aria-pressed={provider === "offline"} disabled={isRunning} onClick={() => changeProvider("offline")}>Offline demo</button>
          <button type="button" aria-pressed={provider === "claude"} disabled={isRunning} onClick={() => changeProvider("claude")}>Claude</button>
        </div>
        {provider === "claude" && (
          <input
            className="copilot-key"
            type="password"
            autoComplete="off"
            placeholder="Anthropic API key (sk-ant-…)"
            aria-label="Anthropic API key"
            value={apiKey}
            onChange={event => setApiKey(event.target.value)}
          />
        )}
        <button disabled={isRunning || !agentState.canUndo} onClick={() => void undo()}>Undo copilot</button>
        <button disabled={isRunning} onClick={() => void reset()}>Reset</button>
      </Toolbar>
      <div className="copilot-body">
        <KritzelEditor
          ref={editorRef}
          editorId="agents-copilot"
          theme="light"
          themes={[reactThemeLight, reactThemeDark]}
          workspaces={workspaces}
          isPanningEnabled={false}
          isZoomingEnabled={false}
          isMoreMenuVisible={false}
          isWorkspaceManagerVisible={false}
          onIsReady={() => void editorRef.current?.addAgent(agent)}
          style={{ flex: 1, minWidth: 0, minHeight: 0 }}
        />
        <aside className="copilot-panel" aria-label="Copilot chat">
          <header className="copilot-header">
            <span className="copilot-avatar" aria-hidden="true">✦</span>
            <div>
              <div className="copilot-title">Copilot</div>
              <div className="copilot-subtitle">{provider === "claude" ? CLAUDE_MODEL : "Offline demo model"} · {toolNames.length} tools</div>
            </div>
            <span className={`copilot-state${isRunning ? " busy" : ""}`} data-testid="copilot-state" data-running={isRunning}>
              {isRunning ? agentState.status ?? "Working" : "Idle"}
            </span>
          </header>
          <div className="copilot-log" ref={logRef} data-testid="copilot-log">
            {entries.length === 0 && (
              <div className="copilot-empty">
                <p>Ask the copilot to work on the board. It sees the canvas through <code>observe_canvas</code> and acts with the agent's tools, so every step shows up as its cursor at work.</p>
                <p>Select a note while it works: it leaves that note alone.</p>
              </div>
            )}
            {entries.map(entry =>
              entry.kind === "tool" ? (
                <div key={entry.id} className={`copilot-tool ${entry.status}`} title={entry.hint} data-testid="copilot-tool" data-status={entry.status}>
                  <span className="copilot-tool-icon" aria-hidden="true">{entry.status === "running" ? "" : entry.status === "done" ? "✓" : "✕"}</span>
                  <code className="copilot-tool-name">{entry.name}</code>
                  <span className="copilot-tool-summary">{entry.summary}</span>
                  {entry.status === "failed" && entry.reason && (
                    <div className="copilot-tool-reason">
                      <code>{entry.reason}</code> {entry.hint}
                    </div>
                  )}
                </div>
              ) : (
                <div key={entry.id} className={`copilot-message ${entry.kind}`} data-testid={`copilot-${entry.kind}`}>
                  {entry.text}
                </div>
              ),
            )}
            {isThinking && (
              <div className="copilot-thinking" aria-live="polite">
                <span /><span /><span />
              </div>
            )}
          </div>
          <div className="copilot-chips">
            {OFFLINE_PROMPTS.map(suggestion => (
              <button key={suggestion} type="button" disabled={isRunning} onClick={() => void send(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
          <form className="copilot-input" onSubmit={onSubmit}>
            <textarea
              rows={2}
              placeholder="Ask the copilot…"
              aria-label="Prompt"
              value={prompt}
              disabled={isRunning}
              onChange={event => setPrompt(event.target.value)}
              onKeyDown={onKeyDown}
            />
            {isRunning ? (
              <button type="button" className="stop" onClick={stop}>Stop</button>
            ) : (
              <button type="submit" disabled={!prompt.trim()}>Send</button>
            )}
          </form>
          <details className="copilot-tools">
            <summary>What the model gets: <code>agent.tools()</code></summary>
            <div>{toolNames.map(name => <code key={name}>{name}</code>)}</div>
          </details>
        </aside>
      </div>
    </div>
  );
}
