import type { KritzelEasing } from './easing.interface';
import type { KritzelAgenticCursorAnchor, KritzelAgenticCursorTarget } from './agentic-cursor.interface';

/** Presses at a world point or an anchor on an object. Visual only: nothing is selected or changed. */
export interface KritzelAgenticClickAction {
  type: 'click';
  /** World point, or an anchor on an object (the anchor rotates with the object). */
  target: KritzelAgenticCursorTarget;
  /** `2` plays a double press. Defaults to `1`. */
  count?: 1 | 2;
}

/** Selects top-level objects for this agent. Agent selections are local only and never change the user's selection. */
export interface KritzelAgenticSelectAction {
  type: 'select';
  /** Non-empty list of IDs of top-level objects (not inside a group, not selections). */
  objectIds: string[];
  /** Adds to the agent's selection instead of replacing it. Defaults to `false`. */
  additive?: boolean;
}

/** Clears this agent's selection. */
export interface KritzelAgenticClearSelectionAction {
  type: 'clearSelection';
}

/** Drags a top-level object so that its `align` point ends up at `to`. */
export interface KritzelAgenticMoveObjectAction {
  type: 'moveObject';
  /** ID of a top-level object. */
  objectId: string;
  /** World point, or an anchor (with an optional offset in world units) on another object. Resolved once when the drag starts. */
  to: KritzelAgenticCursorTarget;
  /** Point of the moved object that lands on `to`. Defaults to `'center'`. */
  align?: KritzelAgenticCursorAnchor;
}

/** Deletes top-level objects. Children of a group are deleted with their group. */
export interface KritzelAgenticDeleteObjectsAction {
  type: 'deleteObjects';
  /** Non-empty list of IDs of top-level objects. */
  objectIds: string[];
}

/** Undoes this agent's last completed action. Never touches the user's or other agents' history. */
export interface KritzelAgenticUndoAction {
  type: 'undo';
}

/** Redoes this agent's last undone action. */
export interface KritzelAgenticRedoAction {
  type: 'redo';
}

/** An action performed by an agentic cursor through `performAgenticAction`. */
export type KritzelAgenticAction =
  | KritzelAgenticClickAction
  | KritzelAgenticSelectAction
  | KritzelAgenticClearSelectionAction
  | KritzelAgenticMoveObjectAction
  | KritzelAgenticDeleteObjectsAction
  | KritzelAgenticUndoAction
  | KritzelAgenticRedoAction;

/** The `type` of an agentic action. */
export type KritzelAgenticActionType = KritzelAgenticAction['type'];

/** Options for `performAgenticAction`. */
export interface KritzelAgenticActionOptions {
  /**
   * Speed in screen pixels per second. Defaults to 1200.
   * Cursor flights use the same rule as `moveAgenticCursor`; presses and drags scale by `speed / 1200`.
   */
  speed?: number;
  /** Skips all animation: the cursor jumps and the change is applied at once. Defaults to `false`. */
  instant?: boolean;
  /** Aborts the action, also while it waits in the queue. Changes made so far are rolled back. */
  signal?: AbortSignal;
  /** Easing of the cursor flight and of drag phases. Defaults to `'ease-in-out'`. */
  easing?: KritzelEasing;
}

/** Why an agentic action did not complete. */
export type KritzelAgenticActionFailureReason =
  /** `options.signal` was aborted. */
  | 'aborted'
  /** `moveAgenticCursor` was called for this cursor while the action was running. */
  | 'interrupted'
  /** The cursor was removed while the action was queued or running. */
  | 'cursor-removed'
  /** A target existed when the action started but was deleted. */
  | 'object-removed'
  /** The local user has a target selected. Changes made before the user selected it are kept. */
  | 'user-selected'
  /** The local user is dragging, resizing, rotating, drawing, editing or erasing a target. Changes made before are kept. */
  | 'user-interaction'
  /** A collaborator has a target selected or is editing it. */
  | 'collaborator-editing'
  /** Another agentic cursor's running action or selection covers a target. */
  | 'claimed-by-agent'
  /** The workspace was switched, reloaded or deleted. */
  | 'workspace-changed'
  /** The object configuration forbids the change. */
  | 'not-allowed'
  /** This agent has no action to undo. */
  | 'nothing-to-undo'
  /** This agent has no action to redo. */
  | 'nothing-to-redo'
  /** A target was changed elsewhere during the action, or the agent's history step was superseded. */
  | 'conflict'
  /** An ID is unknown, a selection, inside a group, or of the wrong type. */
  | 'invalid-target'
  /** No workspace is ready (the engine is disconnected, headless or still loading). */
  | 'engine-disconnected';

/** Result of `performAgenticAction`. */
export interface KritzelAgenticActionResult {
  /** `true` when the action ran to the end. */
  completed: boolean;
  /** Set only when `completed` is `false`. */
  reason?: KritzelAgenticActionFailureReason;
  /**
   * On success: the new agent selection, the moved or deleted IDs, the object under a click
   * (empty on a miss), or the objects changed by undo/redo. On failure: the objects that caused it, when known.
   */
  objectIds?: string[];
}
