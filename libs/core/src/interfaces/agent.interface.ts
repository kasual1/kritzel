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
  /** The object the cursor sticks to, or `null`. */
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
  /** `true` for agents of collaborators. */
  isRemote: boolean;
}

/** Detail of the `agentsChange` event. */
export interface KritzelAgentsChangeEvent {
  agents: KritzelAgentPresence[];
}
