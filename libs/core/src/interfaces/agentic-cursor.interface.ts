import { KritzelEasing } from './easing.interface';
import { KritzelPoint } from './point.interface';
import type { KritzelAgenticActionType } from './agentic-action.interface';

/** Where on an object an attached agentic cursor sits. The anchor rotates with the object. */
export type KritzelAgenticAnchor =
  | 'center'
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'right'
  | 'bottom-right'
  | 'bottom'
  | 'bottom-left'
  | 'left';

/** A free position on the canvas, in world coordinates. */
export interface KritzelAgenticPointTarget {
  x: number;
  y: number;
}

/** A canvas object to move to (and, by default, stick to). */
export interface KritzelAgenticObjectTarget {
  /** ID of the canvas object. */
  objectId: string;
  /** Anchor point on the object. Defaults to `'center'`. */
  anchor?: KritzelAgenticAnchor;
  /** Offset from the anchor in world units, in the object's local (unrotated) space. */
  offset?: KritzelPoint;
}

export type KritzelAgenticTarget = KritzelAgenticPointTarget | KritzelAgenticObjectTarget;

/** Options for creating an agentic cursor. */
export interface KritzelAgenticCursorOptions {
  /** Unique ID. Generated when omitted. */
  id?: string;
  /** Display name shown in the cursor label. */
  name?: string;
  /** Any CSS color. Derived from the name when omitted. */
  color?: string;
  /** Optional status message shown below the label (e.g. "Thinking…"). */
  status?: string;
  /** Whether the cursor is visible. Defaults to `true`. */
  visible?: boolean;
  /** Initial position. Defaults to the center of the viewport. An object target attaches the cursor immediately. */
  position?: KritzelAgenticTarget;
}

/** Properties of an agentic cursor that can be changed after creation. */
export interface KritzelAgenticCursorPatch {
  name?: string;
  color?: string;
  /** Pass `null` or an empty string to clear the status. */
  status?: string | null;
  visible?: boolean;
}

/** Options for moving an agentic cursor. */
export interface KritzelAgenticMoveOptions {
  /** Fixed animation duration in milliseconds. When omitted, the duration is derived from the distance and `speed`. */
  duration?: number;
  /** Easing curve. Defaults to `'ease-in-out'`. */
  easing?: KritzelEasing;
  /** Movement speed in screen pixels per second, used when `duration` is omitted. Defaults to 1200. */
  speed?: number;
  /** Whether the cursor sticks to the object after arriving. Only applies to object targets. Defaults to `true`. */
  attach?: boolean;
}

/** Result of a move. */
export interface KritzelAgenticMoveResult {
  /** `false` when the move was interrupted (by another move, removal, or the target object being deleted). */
  completed: boolean;
}

/** The object an agentic cursor is attached to. */
export interface KritzelAgenticAttachment {
  objectId: string;
  anchor: KritzelAgenticAnchor;
  offset: KritzelPoint;
}

/** Snapshot of an agentic cursor. */
export interface KritzelAgenticCursor {
  id: string;
  name?: string;
  color: string;
  status?: string;
  visible: boolean;
  /** Current position in world coordinates. */
  position: KritzelPoint;
  /** The object the cursor sticks to, or `null` when it is free. */
  attachedTo: KritzelAgenticAttachment | null;
  /** Whether the cursor is currently animating. */
  isMoving: boolean;
  /** Objects this cursor shows as selected: its `select` selection plus the targets of its running action. Local only. */
  selectedObjectIds: string[];
  /** Whether the cursor is pressed (during clicks and drags). */
  isPressed: boolean;
  /** Increases on every press. */
  pressCount: number;
  /** Type of the running action, or `null` when idle. */
  activeAction: KritzelAgenticActionType | null;
  /** Number of actions waiting behind the running one. */
  queueLength: number;
  /** Whether `{ type: 'undo' }` has a step to undo. */
  canUndo: boolean;
  /** Whether `{ type: 'redo' }` has a step to redo. */
  canRedo: boolean;
}

/** Emitted when an agentic cursor is detached from an object. */
export interface KritzelAgenticCursorDetachedEvent {
  id: string;
  objectId: string;
  /** `'object-removed'` when the object was deleted, `'manual'` when detached through the API. */
  reason: 'object-removed' | 'manual';
}
