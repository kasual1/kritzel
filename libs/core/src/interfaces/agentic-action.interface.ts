import type { UpdrawEasing } from './easing.interface';
import type { UpdrawAgenticAnchor, UpdrawAgenticElementTarget, UpdrawAgenticObjectTarget, UpdrawAgenticPointTarget } from './agentic-cursor.interface';
import type {
  UpdrawObjectElementInfo,
  UpdrawObjectElementInteraction,
  UpdrawObjectElementInteractionFailureReason,
} from './object-element.interface';
import type { UpdrawPoint } from './point.interface';
import type { LineArrowConfig } from './arrow-head.interface';
import type { ThemeAwareColor } from '../constants/color-palette.constants';
import type { ShapeType } from '../enums/shape-type.enum';
import type { UpdrawBaseObject } from '../classes/objects/base-object.class';

/** Any CSS color (used for light and dark themes) or a theme-aware color. */
export type UpdrawAgenticColor = string | ThemeAwareColor;

/** Corner dragged by `resizeObject`; the opposite corner stays in place. */
export type UpdrawAgenticResizeHandle = 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left';

/** Style of shapes created by agents. Unset fields use the shape tool's current settings. */
export interface UpdrawAgenticShapeStyle {
  fillColor?: UpdrawAgenticColor;
  strokeColor?: UpdrawAgenticColor;
  strokeWidth?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: UpdrawAgenticColor;
}

/** Style of text created by agents. Unset fields use the text tool's defaults. */
export interface UpdrawAgenticTextStyle {
  fontSize?: number;
  fontFamily?: string;
  fontColor?: UpdrawAgenticColor;
  opacity?: number;
}

/** Style of freehand paths drawn by agents. Unset fields use the brush tool's current settings. */
export interface UpdrawAgenticStrokeStyle {
  strokeColor?: UpdrawAgenticColor;
  strokeWidth?: number;
  opacity?: number;
}

/** Style of lines drawn by agents. Unset fields use the line tool's current settings. */
export interface UpdrawAgenticLineStyle extends UpdrawAgenticStrokeStyle {
  arrows?: LineArrowConfig;
}

/**
 * Presses at a world point, an anchor on an object or an element inside an object. On the canvas it is visual
 * only: nothing is selected or changed. On an element (`{ objectId, selector }`), the element is really clicked,
 * like `interactWithElement` with `{ type: 'click' }`.
 */
export interface UpdrawAgenticClickAction {
  type: 'click';
  /** World point, an anchor on an object (the anchor rotates with the object), or an element inside an object. */
  target: UpdrawAgenticPointTarget | UpdrawAgenticObjectTarget | UpdrawAgenticElementTarget;
  /** `2` plays a double press. Defaults to `1`. */
  count?: 1 | 2;
}

/**
 * Interacts with an element inside an object's content, e.g. a button in an `UpdrawIframeObject`: the agent's
 * cursor flies to the element and the interaction is performed as a user would (see
 * `UpdrawObjectElementInteraction`). Works for actors working as the user too. The content's own state changes,
 * not the object, so the action has no undo step. The object must be mounted (in or near the viewport).
 */
export interface UpdrawAgenticInteractWithElementAction {
  type: 'interactWithElement';
  /** The element: `{ objectId, selector }`; the first element that matches the selector is used. */
  target: UpdrawAgenticElementTarget;
  interaction: UpdrawObjectElementInteraction;
}

/**
 * Selects top-level objects for this agent. Agent selections are never synced as objects (collaborators see them only as
 * presence) and never change the user's selection.
 */
export interface UpdrawAgenticSelectAction {
  type: 'select';
  /** Non-empty list of IDs of top-level objects (not inside a group, not selections). */
  objectIds: string[];
  /** Adds to the agent's selection instead of replacing it. Defaults to `false`. */
  additive?: boolean;
}

/** Clears this agent's selection. */
export interface UpdrawAgenticClearSelectionAction {
  type: 'clearSelection';
}

/** Drags a top-level object so that its `align` point ends up at `to`. */
export interface UpdrawAgenticMoveObjectAction {
  type: 'moveObject';
  /** ID of a top-level object. */
  objectId: string;
  /** World point, or an anchor (with an optional offset in world units) on another object. Resolved once when the drag starts. */
  to: UpdrawAgenticPointTarget | UpdrawAgenticObjectTarget;
  /** Point of the moved object that lands on `to`. Defaults to `'center'`. */
  align?: UpdrawAgenticAnchor;
}

/** Deletes top-level objects. Children of a group are deleted with their group. */
export interface UpdrawAgenticDeleteObjectsAction {
  type: 'deleteObjects';
  /** Non-empty list of IDs of top-level objects. */
  objectIds: string[];
}

/** Resizes a top-level object by dragging a corner handle. Sizes are world units of the unrotated box. */
export interface UpdrawAgenticResizeObjectAction {
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
  handle?: UpdrawAgenticResizeHandle;
}

/** Rotates a top-level object with the rotation handle. */
export interface UpdrawAgenticRotateObjectAction {
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
export interface UpdrawAgenticCopyObjectsAction {
  type: 'copyObjects';
  /** Non-empty list of IDs of top-level objects. */
  objectIds: string[];
  /** Where the center of the copies lands. Defaults to right next to the originals. */
  to?: UpdrawAgenticPointTarget | UpdrawAgenticObjectTarget;
}

/**
 * Groups top-level objects into one group, which takes their place in the stacking order (at the topmost object)
 * and in the agent's selection. `objectIds` of the result holds the group's ID.
 */
export interface UpdrawAgenticGroupObjectsAction {
  type: 'groupObjects';
  /** IDs of at least two top-level objects. */
  objectIds: string[];
}

/**
 * Dissolves top-level groups. Their children keep their place in the stacking order and take the group's place in
 * the agent's selection. `objectIds` of the result holds the children's IDs.
 */
export interface UpdrawAgenticUngroupObjectsAction {
  type: 'ungroupObjects';
  /** Non-empty list of IDs of top-level groups. */
  objectIds: string[];
}

/** Where `orderObjects` moves objects in the stacking order. */
export type UpdrawAgenticOrder = 'front' | 'back' | 'forward' | 'backward';

/** Moves top-level objects in the stacking order; a group moves with all of its children. */
export interface UpdrawAgenticOrderObjectsAction {
  type: 'orderObjects';
  /** Non-empty list of IDs of top-level objects. */
  objectIds: string[];
  /** `'front'` and `'back'` move them above or below all other objects, `'forward'` and `'backward'` one layer. */
  order: UpdrawAgenticOrder;
}

/** Drags out a new shape. */
export interface UpdrawAgenticCreateShapeAction {
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
  style?: UpdrawAgenticShapeStyle;
}

/** Clicks to create a text object and types into it. */
export interface UpdrawAgenticCreateTextAction {
  type: 'createText';
  /** Top-left corner in world coordinates. */
  x: number;
  y: number;
  /** Non-empty text. `\n` starts a new paragraph. */
  text: string;
  style?: UpdrawAgenticTextStyle;
}

/** Types into an existing text or shape. */
export interface UpdrawAgenticTypeTextAction {
  type: 'typeText';
  /** ID of a text or shape object. */
  objectId: string;
  /** The text to type. `\n` starts a new paragraph. */
  text: string;
  /** `'append'` (default) types after the existing content; `'replace'` clears it first. */
  mode?: 'append' | 'replace';
}

/** Draws a freehand path through the points, in order. */
export interface UpdrawAgenticDrawPathAction {
  type: 'drawPath';
  /** At least two world points. */
  points: UpdrawPoint[];
  style?: UpdrawAgenticStrokeStyle;
}

/** Draws a line from one object to another and anchors both ends, so it follows them. */
export interface UpdrawAgenticConnectAction {
  type: 'connect';
  /** ID of the start object. Lines, selections and hidden objects can't be connected. */
  from: string;
  /** ID of the end object; must differ from `from`. */
  to: string;
  style?: UpdrawAgenticLineStyle;
}

/**
 * One end of a line: a free world point, or an object. An end on an object sits at the object's center and
 * follows it when it moves (the line is anchored there).
 */
export type UpdrawAgenticLineEnd = UpdrawAgenticPointTarget | { objectId: string };

/**
 * Draws a line (or arrow) like the line tool: from `from` to `to`, each a free point or an object, optionally
 * bent through a point. Lines, selections and hidden objects can't be ends; both ends can't be the same object.
 */
export interface UpdrawAgenticDrawLineAction {
  type: 'drawLine';
  from: UpdrawAgenticLineEnd;
  to: UpdrawAgenticLineEnd;
  /** A world point the line curves through, halfway along it (where the line's middle handle sits). */
  through?: UpdrawPoint;
  style?: UpdrawAgenticLineStyle;
}

/**
 * Changes an existing top-level line like its handles do: moves an end to a free point (detaching it) or onto an
 * object (anchoring it there), and bends the line through a point or straightens it. At least one change.
 */
export interface UpdrawAgenticEditLineAction {
  type: 'editLine';
  /** ID of a top-level line. */
  lineId: string;
  /** New start. */
  from?: UpdrawAgenticLineEnd;
  /** New end. */
  to?: UpdrawAgenticLineEnd;
  /** A world point the line curves through, halfway along it. Can't be combined with `straight`. */
  through?: UpdrawPoint;
  /** Removes the curve. */
  straight?: boolean;
}

/**
 * Style applied by `setStyle`. Fields apply where they make sense and are ignored elsewhere:
 * `fillColor` to shapes; `strokeColor` and `strokeWidth` to shapes, pen strokes and lines;
 * `fontSize`, `fontFamily` and `fontColor` to shapes and texts; `arrows` to lines (per end: an end left out
 * keeps its arrow head); `opacity` to all.
 */
export interface UpdrawAgenticObjectStyle {
  fillColor?: UpdrawAgenticColor;
  strokeColor?: UpdrawAgenticColor;
  strokeWidth?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: UpdrawAgenticColor;
  arrows?: LineArrowConfig;
}

/** Restyles top-level objects; groups style their children. */
export interface UpdrawAgenticSetStyleAction {
  type: 'setStyle';
  /** Non-empty list of IDs of top-level objects. */
  objectIds: string[];
  /** At least one field. */
  style: UpdrawAgenticObjectStyle;
}

/**
 * Places an object built by the app, e.g. `new UpdrawIframeObject(...)`: the cursor hops to it and
 * the object appears as the agent's change. The object gets a fresh ID, which `objectIds` reports.
 */
export interface UpdrawAgenticAddObjectAction {
  type: 'addObject';
  /** A new object that is not on the canvas yet. Selections can't be added. */
  object: UpdrawBaseObject<any>;
  /**
   * Places `object` as a loading placeholder (`isLoading`) and keeps the action open until this resolves with
   * what fills it in, e.g. once a model has written a widget's code. While it waits, the user can move, resize or
   * delete the placeholder. Then `content` is prepared like an added object (an image is fetched and stored),
   * `apply` copies it onto the placeholder and loading ends, all in the same step of the history. A rejection, a
   * stop or a deleted placeholder rolls the whole action back.
   */
  fill?: Promise<UpdrawAgenticFill>;
}

/** What fills in an `addObject` placeholder. */
export interface UpdrawAgenticFill {
  /** The object the placeholder stands in for. It is prepared like an added object, but never inserted. */
  content: UpdrawBaseObject<any>;
  /** Copies `content` onto the placeholder, e.g. a widget's code. Runs synchronously inside the action. */
  apply(placeholder: UpdrawBaseObject<any>, content: UpdrawBaseObject<any>): void;
}

/**
 * Changes the code or name of an iframe (`UpdrawIframeObject`), also inside a group: the given parts replace the
 * current ones, parts left out stay. The iframe reloads with the new code.
 */
export interface UpdrawAgenticUpdateIframeAction {
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
  /**
   * Shows the iframe as loading (`isLoading`) and keeps the action open until this resolves with the changes,
   * e.g. while a model still writes the new code. Called once, when the action runs after its click. The
   * changes resolved with (`name`, `html`, `css`, `script`; the `objectId` must match) replace the ones given
   * here, and loading ends in the same step of the history. A rejection or a stop rolls the whole action back.
   */
  fill?: () => Promise<UpdrawAgenticIframeChanges>;
}

/** The changes that fill in a loading `updateIframe` action. */
export type UpdrawAgenticIframeChanges = Omit<UpdrawAgenticUpdateIframeAction, 'type' | 'fill'>;

/** Undoes this agent's last completed action. Never touches the user's or other agents' history. */
export interface UpdrawAgenticUndoAction {
  type: 'undo';
}

/** Redoes this agent's last undone action. */
export interface UpdrawAgenticRedoAction {
  type: 'redo';
}

/** An action performed by an `UpdrawAgent` (`agent.perform(action)`). */
export type UpdrawAgenticAction =
  | UpdrawAgenticClickAction
  | UpdrawAgenticInteractWithElementAction
  | UpdrawAgenticSelectAction
  | UpdrawAgenticClearSelectionAction
  | UpdrawAgenticMoveObjectAction
  | UpdrawAgenticDeleteObjectsAction
  | UpdrawAgenticUndoAction
  | UpdrawAgenticRedoAction
  | UpdrawAgenticResizeObjectAction
  | UpdrawAgenticRotateObjectAction
  | UpdrawAgenticCopyObjectsAction
  | UpdrawAgenticGroupObjectsAction
  | UpdrawAgenticUngroupObjectsAction
  | UpdrawAgenticOrderObjectsAction
  | UpdrawAgenticCreateShapeAction
  | UpdrawAgenticCreateTextAction
  | UpdrawAgenticTypeTextAction
  | UpdrawAgenticUpdateIframeAction
  | UpdrawAgenticDrawPathAction
  | UpdrawAgenticConnectAction
  | UpdrawAgenticDrawLineAction
  | UpdrawAgenticEditLineAction
  | UpdrawAgenticSetStyleAction
  | UpdrawAgenticAddObjectAction;

/** The `type` of an agentic action. */
export type UpdrawAgenticActionType = UpdrawAgenticAction['type'];

/** Options for `agent.perform()` and the action shortcuts of `UpdrawAgent`. */
export interface UpdrawAgenticActionOptions {
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
  easing?: UpdrawEasing;
}

/** Why an agentic action did not complete. */
export type UpdrawAgenticActionFailureReason =
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
  | 'engine-disconnected'
  /**
   * An interaction with an element inside an object could not be performed: see `elementReason` and `message`.
   * Changes the interaction made before it failed are kept.
   */
  | 'element-interaction-failed';

/** Result of `agent.perform()` and the action shortcuts of `UpdrawAgent`. */
export interface UpdrawAgenticActionResult {
  /** `true` when the action ran to the end. */
  completed: boolean;
  /** Set only when `completed` is `false`. */
  reason?: UpdrawAgenticActionFailureReason;
  /**
   * On success: the created or added object, the new agent selection, the changed or deleted IDs, the
   * object under a click (empty on a miss), or the objects changed by undo/redo. On failure: the objects that
   * caused it, when known.
   */
  objectIds?: string[];
  /**
   * For interactions with elements: the element as it is afterwards (or the element that refused the interaction),
   * as described by the object's content, which may be untrusted.
   */
  element?: UpdrawObjectElementInfo;
  /** For `'element-interaction-failed'`: why the element refused the interaction. */
  elementReason?: UpdrawObjectElementInteractionFailureReason;
  /** For `'element-interaction-failed'`: what went wrong, in words. */
  message?: string;
}
