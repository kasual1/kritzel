import type { KritzelPoint } from './point.interface';
import type { KritzelAgenticAttachment, KritzelAgenticTarget } from './agentic-cursor.interface';
import type {
  KritzelAgenticAction,
  KritzelAgenticActionFailureReason,
  KritzelAgenticActionType,
} from './agentic-action.interface';

/** Options for `new KritzelAgent(...)`. */
export interface KritzelAgentOptions {
  /** Unique ID. Becomes the `userId` of the objects the agent creates. Generated (`agent-…`) when omitted. */
  id?: string;
  /** Name shown on the cursor label and in the avatar tooltip. */
  name: string;
  /** Any CSS color. Derived from the name when omitted. */
  color?: string;
  /** URL of an avatar image. Initials of the name are shown when omitted. */
  avatarUrl?: string;
  /** Default speed of moves and actions in screen pixels per second (1200 when omitted). */
  speed?: number;
  /** Whether collaborators see the agent. Defaults to `true`. */
  broadcast?: boolean;
  /** Status message shown below the cursor label (e.g. "Thinking…"). */
  status?: string;
  /** Whether the cursor is visible. Defaults to `true`. */
  visible?: boolean;
  /** Where the cursor appears when the agent is added. Defaults to the center of the viewport. */
  position?: KritzelAgenticTarget;
}

/** Snapshot of an agent's state. */
export interface KritzelAgentState {
  /** Whether the agent is added to an editor. Every other field has its default while it is not. */
  isAdded: boolean;
  /** Cursor position in world coordinates, or `null` while the agent is not added. */
  position: KritzelPoint | null;
  /** The object the cursor sticks to (with the element's `selector` when it sticks to an element inside it), or `null`. */
  attachedTo: KritzelAgenticAttachment | null;
  /** Whether the cursor is animating. */
  isMoving: boolean;
  /** The status message, or `null`. */
  status: string | null;
  /** Whether the cursor is visible. */
  visible: boolean;
  /** Objects the agent selected with `select()`. */
  selection: string[];
  /** Type of the running action, or `null` when idle. */
  activeAction: KritzelAgenticActionType | null;
  /** Number of actions waiting behind the running one. */
  queueLength: number;
  /** Whether `undo()` has a step to undo. */
  canUndo: boolean;
  /** Whether `redo()` has a step to redo. */
  canRedo: boolean;
}

/** Emitted when the cursor stops sticking to an object. */
export interface KritzelAgentDetachedEvent {
  objectId: string;
  /** `'object-removed'` when the object was deleted, `'manual'` after `agent.detach()`. */
  reason: 'object-removed' | 'manual';
}

/**
 * Emitted when someone took over the objects of a running action: the user selected or grabbed
 * them, a collaborator started editing them, or they were changed elsewhere.
 */
export interface KritzelAgentInterruptedEvent {
  action: KritzelAgenticAction;
  reason: KritzelAgenticActionFailureReason;
  /** The objects that caused the interruption. */
  objectIds: string[];
  /** Whether the changes made before the interruption were kept (as one step of the agent's history). */
  keptChanges: boolean;
}

/** Events of `agent.on(...)`. */
export interface KritzelAgentEventMap {
  /** The state changed (status, visibility, activity, selection, history, attachment). Not emitted for plain motion. */
  change: KritzelAgentState;
  detached: KritzelAgentDetachedEvent;
  interrupted: KritzelAgentInterruptedEvent;
  /** The agent was removed from its editor. */
  removed: void;
}

/** An agent as shown in the avatar stack and in `agentsChange`. */
export interface KritzelAgentPresence {
  id: string;
  kind: 'agent';
  name: string;
  /** Same as `name`, for avatar components that read `IKritzelUser.displayName`. */
  displayName: string;
  color: string;
  avatarUrl?: string;
  /** Same as `avatarUrl`, for avatar components that read `IKritzelUser.profileImageUrl`. */
  profileImageUrl?: string;
  status: string | null;
  visible: boolean;
  activeAction: KritzelAgenticActionType | null;
  queueLength: number;
  /** `false`: an agent added to this editor. Agents of collaborators are `KritzelRemoteAgentPresence` (`true`). */
  isRemote: false;
}

/** Detail of the `agentsChange` event: the agents of this editor, then those of collaborators. Narrow with `isRemote`. */
export interface KritzelAgentsChangeEvent {
  agents: (KritzelAgentPresence | KritzelRemoteAgentPresence)[];
}

// ─── LLM tools ────────────────────────────────────────────────────────────────

/**
 * A JSON Schema of an agent tool's input, limited to keywords every LLM provider accepts. A type alias, not an
 * interface, so that it fits SDK types that index schemas by string (`input_schema`, `parameters`).
 */
export type KritzelAgentToolSchema = {
  type: 'object';
  description?: string;
  properties: Record<string, object>;
  required?: string[];
  additionalProperties?: false;
};

/** Context passed by tool runners; the signal aborts the action like `options.signal`. */
export interface KritzelAgentToolContext {
  signal?: AbortSignal | null;
  /** The ID of the tool call being run, when the runner has one. A chat session always passes it. */
  toolCallId?: string;
}

/**
 * A provider-neutral tool definition for LLMs: hand `name`, `description` and `inputSchema` to the model
 * (Anthropic calls the schema `input_schema`, OpenAI `parameters`) and call `run` with the model's input.
 * `run` never throws for mistakes of the model; it returns a JSON `KritzelAgentToolResult`.
 */
export interface KritzelAgentTool {
  name: string;
  description: string;
  inputSchema: KritzelAgentToolSchema;
  run: (input: unknown, context?: KritzelAgentToolContext) => Promise<string>;
  /**
   * Optional: begins a call while the model is still writing its input, e.g. to place a loading placeholder
   * once its position and size are known (`create_iframe` and `create_image` do). A runner that streams tool
   * calls, like a chat session, calls it when a call starts and then finishes the call through the returned
   * handle instead of `run`. Runners that don't stream just call `run`.
   */
  begin?: (context: KritzelAgentToolContext) => KritzelAgentToolCall;
}

/** A tool call that began while the model was still writing its input (see `KritzelAgentTool.begin`). */
export interface KritzelAgentToolCall {
  /** More input arrived: the input's JSON text written so far. */
  update(inputText: string): void;
  /** The input is complete: finishes the call and resolves with its result, exactly like `run()`. */
  finish(input: unknown): Promise<string>;
  /**
   * The call won't run (dropped, stopped, or the prompt ended): undoes whatever the call began. A promise makes
   * the runner wait until that is done.
   */
  cancel(): void | Promise<void>;
}

/** Options of `agent.tools()`. */
export interface KritzelAgentToolsOptions {
  /** Only these tools (names without prefix), e.g. `['observe_canvas', 'create_shape']`. */
  only?: string[];
  /** Prefix for every tool name, e.g. `'kritzel_'`, to avoid clashes with other tools. */
  prefix?: string;
  /** Longest text an action may type. Defaults to 2000 characters. */
  maxTextLength?: number;
  /** Skips all animation in the actions of these tools: the changes appear at once. Defaults to `false`. */
  instant?: boolean;
  /**
   * Offers `create_image`, which places images drawn as SVG markup by the model. With `{ urls: true }` it also
   * loads images from URLs the model chooses, fetched by the user's browser. Defaults to `true` (SVG only).
   */
  images?: boolean | { urls?: boolean };
  /**
   * Offers `create_iframe`, which places widgets of model-written HTML, CSS and JavaScript. They run in an iframe
   * sandboxed to scripts only, with a content security policy that blocks network access. Defaults to `false`.
   */
  iframes?: boolean;
  /**
   * Offers `set_viewport` and `fit_viewport`, which pan and zoom the local user's view of the canvas (never the view
   * of collaborators). Defaults to `true`.
   */
  viewport?: boolean;
}

/** What a tool's `run` returns, as JSON. */
export interface KritzelAgentToolResult {
  completed: boolean;
  /** Why the action did not complete; `'invalid-input'` when the input was rejected. */
  reason?: KritzelAgenticActionFailureReason | 'invalid-input';
  objectIds?: string[];
  /** What was wrong with the input. */
  message?: string;
  /** What to do about the failure. */
  hint?: string;
  /** The visible area after a viewport tool (`set_viewport`, `fit_viewport`) moved the view, as `observe_canvas` reports it. */
  viewport?: KritzelCanvasSnapshot['viewport'];
  /** Snapshots of the objects the action created or changed. */
  objects?: KritzelCanvasObject[];
}

// ─── Canvas snapshot ──────────────────────────────────────────────────────────

/** Options of `agent.observe()`. */
export interface KritzelObserveOptions {
  /** `'all'` (default) or only objects in the viewport. */
  scope?: 'all' | 'viewport';
  /** Only these objects (and their group children). */
  objectIds?: string[];
  /** At most this many objects (default 100); selected and visible objects are kept first. */
  maxObjects?: number;
  /** Longer texts are cut with "…" (default 300 characters). */
  maxTextLength?: number;
}

/** One object of a canvas snapshot. Coordinates are world units; boxes are unrotated. */
export interface KritzelCanvasObject {
  id: string;
  type: 'shape' | 'text' | 'path' | 'line' | 'image' | 'iframe' | 'group' | 'custom' | 'object';
  shapeType?: string;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Degrees clockwise around the center; omitted when 0. */
  rotation?: number;
  text?: string;
  /** Set for children of a group: such objects are not top-level. */
  parentId?: string;
  childIds?: string[];
  /** For lines: the objects the ends are connected to. */
  from?: string;
  to?: string;
  style?: {
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    fontSize?: number;
    fontFamily?: string;
    fontColor?: string;
    opacity?: number;
    arrows?: { start?: string; end?: string };
  };
  /** Someone else is working on the object; actions on it will be refused. */
  busy?: 'user' | 'collaborator' | 'agent';
  /** Who created it: an agent ID, a user ID, or omitted. */
  createdBy?: string;
}

/** What an agent sees of the canvas (`agent.observe()`). */
export interface KritzelCanvasSnapshot {
  /** The visible part of the canvas in world coordinates. */
  viewport: { x: number; y: number; width: number; height: number; scale: number };
  theme: string;
  /** Objects the user has selected. */
  userSelection: string[];
  agent: { id: string; position: KritzelPoint | null; selection: string[] };
  /** Back to front. */
  objects: KritzelCanvasObject[];
  totalObjects: number;
  /** `true` when objects were left out because of `maxObjects`. */
  truncated?: true;
}

// ─── Presence ─────────────────────────────────────────────────────────────────

/** One agent in the awareness field `agents` that a client shares with collaborators. @internal */
export interface KritzelAwarenessAgent {
  id: string;
  name: string;
  color: string;
  avatarUrl?: string;
  status: string | null;
  visible: boolean;
  activeAction: string | null;
  queueLength: number;
  /** World position, rounded to 0.1. */
  position: KritzelPoint;
  /** The object the cursor sticks to. `null` while it sticks to an element inside an object: `position` follows the element. */
  attachedTo: KritzelAgenticAttachment | null;
  isPressed: boolean;
  pressCount: number;
  /** Objects the agent shows as selected. */
  selectedObjectIds: string[];
  /** Objects of the agent's running action. */
  claimedObjectIds: string[];
}

/** An agent of a collaborator as shown in avatar stacks and `agentsChange` (`isRemote: true`). */
export interface KritzelRemoteAgentPresence extends Omit<KritzelAgentPresence, 'isRemote'> {
  isRemote: true;
  /** Awareness client ID of the collaborator's tab. */
  clientId: number;
  /** The collaborator whose tab runs the agent, when known. */
  hostUser?: { id: string; displayName?: string; color?: string };
}
