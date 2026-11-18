import { UpmadeEasing } from './easing.interface';
import { UpmadePoint } from './point.interface';
import type { UpmadeAgenticActionType } from './agentic-action.interface';

/** A point on an object, e.g. where an agent's cursor sticks. The anchor rotates with the object. */
export type UpmadeAgenticAnchor =
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
export interface UpmadeAgenticPointTarget {
  x: number;
  y: number;
}

/** A canvas object to move to (and, by default, stick to). */
export interface UpmadeAgenticObjectTarget {
  /** ID of the canvas object. */
  objectId: string;
  /** Anchor point on the object. Defaults to `'center'`. */
  anchor?: UpmadeAgenticAnchor;
  /** Offset from the anchor in world units, in the object's local (unrotated) space. */
  offset?: UpmadePoint;
}

/**
 * An element inside an object's content to move to (and, by default, stick to), e.g. a button in the page of a
 * `UpmadeIframeObject`. The object must support elements (see `UpmadeElementAwareObject`) and be mounted, and the
 * element must be visible, when the agent's cursor starts moving. While attached, the cursor follows the element when
 * it moves inside the content. If the element disappears or is scrolled out of view, e.g. while the content is
 * regenerated, the cursor stays at the element's last visible position and returns to the element once it reappears.
 */
export interface UpmadeAgenticElementTarget {
  /** ID of the canvas object. */
  objectId: string;
  /** CSS selector of the element. The first match is used. */
  selector: string;
  /** Anchor point on the element. Defaults to `'center'`. */
  anchor?: UpmadeAgenticAnchor;
  /** Offset from the anchor in world units, in the object's local (unrotated) space. */
  offset?: UpmadePoint;
}

export type UpmadeAgenticTarget = UpmadeAgenticPointTarget | UpmadeAgenticObjectTarget | UpmadeAgenticElementTarget;

/** Options for creating the cursor of an agent. @internal */
export interface UpmadeAgenticCursorOptions {
  /** The ID of the agent the cursor belongs to. */
  id: string;
  /** How the cursor looks. Read for every snapshot, so the agent is the only place that stores it. */
  appearance: UpmadeAgenticCursorAppearance;
  /** Initial position. Defaults to the center of the viewport. An object or element target attaches the cursor immediately. */
  position?: UpmadeAgenticTarget;
}

/** How an agent's cursor looks: its label, color, status and visibility. @internal */
export interface UpmadeAgenticCursorAppearance {
  readonly name: string;
  /** Any CSS color. */
  readonly color: string;
  /** Status message shown below the label, or `null` for none. */
  readonly status: string | null;
  readonly visible: boolean;
}

/** Options for `agent.moveTo()`. */
export interface UpmadeAgenticMoveOptions {
  /** Fixed animation duration in milliseconds. When omitted, the duration is derived from the distance and `speed`. */
  duration?: number;
  /** Easing curve. Defaults to `'ease-in-out'`. */
  easing?: UpmadeEasing;
  /** Movement speed in screen pixels per second, used when `duration` is omitted. Defaults to 1200. */
  speed?: number;
  /** Whether the cursor sticks to the object or element after arriving. Only applies to object and element targets. Defaults to `true`. */
  attach?: boolean;
}

/** Result of a move. */
export interface UpmadeAgenticMoveResult {
  /** `false` when the move was interrupted (by another move, removal, or the target object being deleted). */
  completed: boolean;
}

/** The object, or the element inside an object, an agent's cursor sticks to. */
export interface UpmadeAgenticAttachment {
  objectId: string;
  /** Selector of the element inside the object, when attached to an element. */
  selector?: string;
  anchor: UpmadeAgenticAnchor;
  offset: UpmadePoint;
}

/** World points of an object's rotation handle as agents show and grab it. It turns with the object. */
export interface UpmadeAgenticRotationHandle {
  /** Middle of the object's top edge, where the handle's stem starts. */
  base: UpmadePoint;
  /** Center of the handle. */
  handle: UpmadePoint;
}

/** Snapshot of an agent's cursor, used by the cursor overlay. @internal */
export interface UpmadeAgenticCursor {
  id: string;
  name?: string;
  color: string;
  status?: string;
  visible: boolean;
  /** Current position in world coordinates. */
  position: UpmadePoint;
  /** The object the cursor sticks to, or `null` when it is free. */
  attachedTo: UpmadeAgenticAttachment | null;
  /** Whether the cursor is currently animating. */
  isMoving: boolean;
  /**
   * Objects this cursor shows as selected: its `select` selection plus the targets of its running action. Never synced
   * as objects; shared with collaborators only as presence when the agent broadcasts.
   */
  selectedObjectIds: string[];
  /** Whether the cursor is pressed (during clicks and drags). */
  isPressed: boolean;
  /** Increases on every press. */
  pressCount: number;
  /** Type of the running action, or `null` when idle. */
  activeAction: UpmadeAgenticActionType | null;
  /** Number of actions waiting behind the running one. */
  queueLength: number;
  /** Whether `{ type: 'undo' }` has a step to undo. */
  canUndo: boolean;
  /** Whether `{ type: 'redo' }` has a step to redo. */
  canRedo: boolean;
}

/** Emitted when an agent's cursor is detached from an object. @internal */
export interface UpmadeAgenticCursorDetachedEvent {
  id: string;
  objectId: string;
  /** `'object-removed'` when the object was deleted, `'manual'` when detached through the API. */
  reason: 'object-removed' | 'manual';
}
