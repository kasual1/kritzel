import type { KritzelEasing } from './easing.interface';
import type { KritzelAgenticAnchor, KritzelAgenticObjectTarget, KritzelAgenticPointTarget } from './agentic-cursor.interface';
import type { KritzelPoint } from './point.interface';
import type { LineArrowConfig } from './arrow-head.interface';
import type { ThemeAwareColor } from '../constants/color-palette.constants';
import type { ShapeType } from '../enums/shape-type.enum';
import type { KritzelBaseObject } from '../classes/objects/base-object.class';

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
  strokeColor?: KritzelAgenticColor;
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
  /**
   * World point, or an anchor on an object (the anchor rotates with the object). Elements inside objects can't be
   * clicked; point at one with `agent.moveTo({ objectId, selector })`.
   */
  target: KritzelAgenticPointTarget | KritzelAgenticObjectTarget;
  /** `2` plays a double press. Defaults to `1`. */
  count?: 1 | 2;
}

/**
 * Selects top-level objects for this agent. Agent selections are never synced as objects (collaborators see them only as
 * presence) and never change the user's selection.
 */
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
  to: KritzelAgenticPointTarget | KritzelAgenticObjectTarget;
  /** Point of the moved object that lands on `to`. Defaults to `'center'`. */
  align?: KritzelAgenticAnchor;
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

/**
 * Duplicates top-level objects like Alt-dragging them: the copies appear on the originals and are dragged so that
 * their center lands on `to`. Group children and lines between copied objects are copied along. The copies take
 * the place of the originals in the agent's selection.
 */
export interface KritzelAgenticCopyObjectsAction {
  type: 'copyObjects';
  /** Non-empty list of IDs of top-level objects. */
  objectIds: string[];
  /** Where the center of the copies lands. Defaults to right next to the originals. */
  to?: KritzelAgenticPointTarget | KritzelAgenticObjectTarget;
}

/**
 * Groups top-level objects into one group, which takes their place in the stacking order (at the topmost object)
 * and in the agent's selection. `objectIds` of the result holds the group's ID.
 */
export interface KritzelAgenticGroupObjectsAction {
  type: 'groupObjects';
  /** IDs of at least two top-level objects. */
  objectIds: string[];
}

/**
 * Dissolves top-level groups. Their children keep their place in the stacking order and take the group's place in
 * the agent's selection. `objectIds` of the result holds the children's IDs.
 */
export interface KritzelAgenticUngroupObjectsAction {
  type: 'ungroupObjects';
  /** Non-empty list of IDs of top-level groups. */
  objectIds: string[];
}

/** Where `orderObjects` moves objects in the stacking order. */
export type KritzelAgenticOrder = 'front' | 'back' | 'forward' | 'backward';

/** Moves top-level objects in the stacking order; a group moves with all of its children. */
export interface KritzelAgenticOrderObjectsAction {
  type: 'orderObjects';
  /** Non-empty list of IDs of top-level objects. */
  objectIds: string[];
  /** `'front'` and `'back'` move them above or below all other objects, `'forward'` and `'backward'` one layer. */
  order: KritzelAgenticOrder;
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

/**
 * One end of a line: a free world point, or an object. An end on an object sits at the object's center and
 * follows it when it moves (the line is anchored there).
 */
export type KritzelAgenticLineEnd = KritzelAgenticPointTarget | { objectId: string };

/**
 * Draws a line (or arrow) like the line tool: from `from` to `to`, each a free point or an object, optionally
 * bent through a point. Lines, selections and hidden objects can't be ends; both ends can't be the same object.
 */
export interface KritzelAgenticDrawLineAction {
  type: 'drawLine';
  from: KritzelAgenticLineEnd;
  to: KritzelAgenticLineEnd;
  /** A world point the line curves through, halfway along it (where the line's middle handle sits). */
  through?: KritzelPoint;
  style?: KritzelAgenticLineStyle;
}

/**
 * Changes an existing top-level line like its handles do: moves an end to a free point (detaching it) or onto an
 * object (anchoring it there), and bends the line through a point or straightens it. At least one change.
 */
export interface KritzelAgenticEditLineAction {
  type: 'editLine';
  /** ID of a top-level line. */
  lineId: string;
  /** New start. */
  from?: KritzelAgenticLineEnd;
  /** New end. */
  to?: KritzelAgenticLineEnd;
  /** A world point the line curves through, halfway along it. Can't be combined with `straight`. */
  through?: KritzelPoint;
  /** Removes the curve. */
  straight?: boolean;
}

/**
 * Style applied by `setStyle`. Fields apply where they make sense and are ignored elsewhere:
 * `fillColor` to shapes; `strokeColor` and `strokeWidth` to shapes, pen strokes and lines;
 * `fontSize`, `fontFamily` and `fontColor` to shapes and texts; `arrows` to lines (per end: an end left out
 * keeps its arrow head); `opacity` to all.
 */
export interface KritzelAgenticObjectStyle {
  fillColor?: KritzelAgenticColor;
  strokeColor?: KritzelAgenticColor;
  strokeWidth?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: KritzelAgenticColor;
  arrows?: LineArrowConfig;
}

/** Restyles top-level objects; groups style their children. */
export interface KritzelAgenticSetStyleAction {
  type: 'setStyle';
  /** Non-empty list of IDs of top-level objects. */
  objectIds: string[];
  /** At least one field. */
  style: KritzelAgenticObjectStyle;
}

/**
 * Places an object built by the app, e.g. `new KritzelIframeObject(...)`: the cursor hops to it and
 * the object appears as the agent's change. The object gets a fresh ID, which `objectIds` reports.
 */
export interface KritzelAgenticAddObjectAction {
  type: 'addObject';
  /** A new object that is not on the canvas yet. Selections can't be added. */
  object: KritzelBaseObject<any>;
  /**
   * Places `object` as a loading placeholder (`isLoading`) and keeps the action open until this resolves with
   * what fills it in, e.g. once a model has written a widget's code. While it waits, the user can move, resize or
   * delete the placeholder. Then `content` is prepared like an added object (an image is fetched and stored),
   * `apply` copies it onto the placeholder and loading ends, all in the same step of the history. A rejection, a
   * stop or a deleted placeholder rolls the whole action back.
   */
  fill?: Promise<KritzelAgenticFill>;
}

/** What fills in an `addObject` placeholder. */
export interface KritzelAgenticFill {
  /** The object the placeholder stands in for. It is prepared like an added object, but never inserted. */
  content: KritzelBaseObject<any>;
  /** Copies `content` onto the placeholder, e.g. a widget's code. Runs synchronously inside the action. */
  apply(placeholder: KritzelBaseObject<any>, content: KritzelBaseObject<any>): void;
}

/**
 * Changes the code or name of an iframe (`KritzelIframeObject`), also inside a group: the given parts replace the
 * current ones, parts left out stay. The iframe reloads with the new code.
 */
export interface KritzelAgenticUpdateIframeAction {
  type: 'updateIframe';
  /** ID of an iframe. */
  objectId: string;
  /** New name, shown in the titlebar (also sets the title). */
  name?: string;
  /** New body content. */
  html?: string;
  /** New styles. */
  css?: string;
  /** New script. */
  script?: string;
}

/** Undoes this agent's last completed action. Never touches the user's or other agents' history. */
export interface KritzelAgenticUndoAction {
  type: 'undo';
}

/** Redoes this agent's last undone action. */
export interface KritzelAgenticRedoAction {
  type: 'redo';
}

/** An action performed by a `KritzelAgent` (`agent.perform(action)`). */
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
  | KritzelAgenticCopyObjectsAction
  | KritzelAgenticGroupObjectsAction
  | KritzelAgenticUngroupObjectsAction
  | KritzelAgenticOrderObjectsAction
  | KritzelAgenticCreateShapeAction
  | KritzelAgenticCreateTextAction
  | KritzelAgenticTypeTextAction
  | KritzelAgenticUpdateIframeAction
  | KritzelAgenticDrawPathAction
  | KritzelAgenticConnectAction
  | KritzelAgenticDrawLineAction
  | KritzelAgenticEditLineAction
  | KritzelAgenticSetStyleAction
  | KritzelAgenticAddObjectAction;

/** The `type` of an agentic action. */
export type KritzelAgenticActionType = KritzelAgenticAction['type'];

/** Options for `agent.perform()` and the action shortcuts of `KritzelAgent`. */
export interface KritzelAgenticActionOptions {
  /**
   * Speed in screen pixels per second. Defaults to 1200.
   * Cursor flights use the same rule as `agent.moveTo()`; presses, drags, rotation, drawing and typing
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
  /** `agent.moveTo()` was called while the action was running. */
  | 'agent-moved'
  /** The agent was removed while the action was queued or running. */
  | 'agent-removed'
  /** A target existed when the action started but was deleted. */
  | 'object-removed'
  /** The local user has a target selected. Changes made before the user selected it are kept. */
  | 'user-selected'
  /** The local user is dragging, resizing, rotating, drawing, editing or erasing a target. Changes made before are kept. */
  | 'user-interaction'
  /** A collaborator has a target selected or is editing it. */
  | 'collaborator-editing'
  /** Another agent's running action or selection covers a target. */
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

/** Result of `agent.perform()` and the action shortcuts of `KritzelAgent`. */
export interface KritzelAgenticActionResult {
  /** `true` when the action ran to the end. */
  completed: boolean;
  /** Set only when `completed` is `false`. */
  reason?: KritzelAgenticActionFailureReason;
  /**
   * On success: the created or added object, the new agent selection, the changed or deleted IDs, the
   * object under a click (empty on a miss), or the objects changed by undo/redo. On failure: the objects that
   * caused it, when known.
   */
  objectIds?: string[];
}
