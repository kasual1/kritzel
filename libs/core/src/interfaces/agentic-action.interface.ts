import type { KritzelEasing } from './easing.interface';
import type { KritzelAgenticCursorAnchor, KritzelAgenticCursorTarget } from './agentic-cursor.interface';
import type { KritzelPoint } from './point.interface';
import type { LineArrowConfig } from './arrow-head.interface';
import type { ThemeAwareColor } from '../constants/color-palette.constants';
import type { ShapeType } from '../enums/shape-type.enum';

/** Any CSS color (used for light and dark themes) or a theme-aware color. */
export type KritzelAgenticColor = string | ThemeAwareColor;

/** Corner dragged by `resizeObject`; the opposite corner stays in place. */
export type KritzelAgenticResizeHandle = 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left';

/** Style of shapes created by agents. Unset fields use the shape tool's current settings. */
export interface KritzelAgenticShapeStyle {
  fillColor?: KritzelAgenticColor;
  strokeColor?: KritzelAgenticColor;
  strokeWidth?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: KritzelAgenticColor;
}

/** Style of text created by agents. Unset fields use the text tool's defaults. */
export interface KritzelAgenticTextStyle {
  fontSize?: number;
  fontFamily?: string;
  fontColor?: KritzelAgenticColor;
  opacity?: number;
}

/** Style of freehand paths drawn by agents. Unset fields use the brush tool's current settings. */
export interface KritzelAgenticStrokeStyle {
  color?: KritzelAgenticColor;
  strokeWidth?: number;
  opacity?: number;
}

/** Style of lines drawn by agents. Unset fields use the line tool's current settings. */
export interface KritzelAgenticLineStyle extends KritzelAgenticStrokeStyle {
  arrows?: LineArrowConfig;
}

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

/** Resizes a top-level object by dragging a corner handle. Sizes are world units of the unrotated box. */
export interface KritzelAgenticResizeObjectAction {
  type: 'resizeObject';
  /** ID of a top-level object. */
  objectId: string;
  /** New width (> 0). At least one of `width` and `height` is required. */
  width?: number;
  /** New height (> 0). */
  height?: number;
  /** Defaults to `true` when only one of `width` / `height` is given, otherwise `false`. */
  keepAspectRatio?: boolean;
  /** The dragged corner. Defaults to `'bottom-right'`. */
  handle?: KritzelAgenticResizeHandle;
}

/** Rotates a top-level object with the rotation handle. */
export interface KritzelAgenticRotateObjectAction {
  type: 'rotateObject';
  /** ID of a top-level object. */
  objectId: string;
  /** Angle in degrees, clockwise. Absolute (the short way round) unless `relative`. */
  angle: number;
  /** Adds `angle` to the current rotation. Defaults to `false`. */
  relative?: boolean;
}

/** Drags out a new shape. */
export interface KritzelAgenticCreateShapeAction {
  type: 'createShape';
  /** Defaults to the shape tool's current type. */
  shapeType?: ShapeType | `${ShapeType}`;
  /** Top-left corner in world coordinates. */
  x: number;
  y: number;
  /** Size in world units, each at least 1. */
  width: number;
  height: number;
  /** Text typed into the shape after it is drawn (same undo step). */
  text?: string;
  style?: KritzelAgenticShapeStyle;
}

/** Clicks to create a text object and types into it. */
export interface KritzelAgenticCreateTextAction {
  type: 'createText';
  /** Top-left corner in world coordinates. */
  x: number;
  y: number;
  /** Non-empty text. `\n` starts a new paragraph. */
  text: string;
  style?: KritzelAgenticTextStyle;
}

/** Types into an existing text or shape. */
export interface KritzelAgenticTypeTextAction {
  type: 'typeText';
  /** ID of a text or shape object. */
  objectId: string;
  /** The text to type. `\n` starts a new paragraph. */
  text: string;
  /** `'append'` (default) types after the existing content; `'replace'` clears it first. */
  mode?: 'append' | 'replace';
}

/** Draws a freehand path through the points, in order. */
export interface KritzelAgenticDrawPathAction {
  type: 'drawPath';
  /** At least two world points. */
  points: KritzelPoint[];
  style?: KritzelAgenticStrokeStyle;
}

/** Draws a line from one object to another and anchors both ends, so it follows them. */
export interface KritzelAgenticConnectAction {
  type: 'connect';
  /** ID of the start object. Lines, selections and hidden objects can't be connected. */
  from: string;
  /** ID of the end object; must differ from `from`. */
  to: string;
  style?: KritzelAgenticLineStyle;
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
  | KritzelAgenticRedoAction
  | KritzelAgenticResizeObjectAction
  | KritzelAgenticRotateObjectAction
  | KritzelAgenticCreateShapeAction
  | KritzelAgenticCreateTextAction
  | KritzelAgenticTypeTextAction
  | KritzelAgenticDrawPathAction
  | KritzelAgenticConnectAction;

/** The `type` of an agentic action. */
export type KritzelAgenticActionType = KritzelAgenticAction['type'];

/** Options for `performAgenticAction`. */
export interface KritzelAgenticActionOptions {
  /**
   * Speed in screen pixels per second. Defaults to 1200.
   * Cursor flights use the same rule as `moveAgenticCursor`; presses, drags, rotation, drawing and typing
   * scale by `speed / 1200`.
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
   * On success: the created object, the new agent selection, the changed or deleted IDs, the object
   * under a click (empty on a miss), or the objects changed by undo/redo. On failure: the objects that
   * caused it, when known.
   */
  objectIds?: string[];
}
