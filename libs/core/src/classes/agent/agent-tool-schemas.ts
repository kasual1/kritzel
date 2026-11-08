import type {
  KritzelAgenticAction,
  KritzelAgenticActionType,
  KritzelAgenticLineStyle,
  KritzelAgenticObjectStyle,
  KritzelAgenticShapeStyle,
  KritzelAgenticStrokeStyle,
  KritzelAgenticTextStyle,
} from '../../interfaces/agentic-action.interface';
import type { ArrowHeadConfig, LineArrowConfig } from '../../interfaces/arrow-head.interface';
import type { KritzelPoint } from '../../interfaces/point.interface';
import type { KritzelAgentToolSchema } from '../../interfaces/agent.interface';
import {
  AGENTIC_ANCHORS,
  AGENTIC_ARROW_HEAD_STYLES,
  AGENTIC_ORDERS,
  AGENTIC_RESIZE_HANDLES,
  AGENTIC_SHAPE_TYPES,
} from '../../helpers/agentic-validation.helper';

/** A JSON Schema node, limited to keywords every LLM provider accepts (no anyOf, const, $ref, min/max). */
export interface KritzelJsonSchemaNode {
  type?: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean';
  description?: string;
  enum?: readonly string[];
  properties?: Record<string, KritzelJsonSchemaNode>;
  required?: string[];
  additionalProperties?: false;
  items?: KritzelJsonSchemaNode;
  minItems?: number;
}

type RequiredKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? never : K }[keyof T];
interface Req {
  schema: KritzelJsonSchemaNode;
  required: true;
}
interface Opt {
  schema: KritzelJsonSchemaNode;
  required?: false;
}
const req = (schema: KritzelJsonSchemaNode): Req => ({ schema, required: true });
const opt = (schema: KritzelJsonSchemaNode): Opt => ({ schema });

/**
 * Every field of `T` must be listed: required fields with `req()`, optional fields with `opt()` or `null`
 * (not offered to models). A new field in an action type therefore fails the build until it is decided here.
 */
type Params<T> = { [K in keyof T]-?: K extends RequiredKeys<T> ? Req : Opt | null };

function object<T>(params: Params<T>, description?: string): KritzelJsonSchemaNode {
  const properties: Record<string, KritzelJsonSchemaNode> = {};
  const required: string[] = [];
  for (const [key, value] of Object.entries(params) as [string, Req | Opt | null][]) {
    if (!value) {
      continue;
    }
    properties[key] = value.schema;
    if (value.required) {
      required.push(key);
    }
  }
  return {
    type: 'object',
    ...(description ? { description } : {}),
    properties,
    ...(required.length > 0 ? { required } : {}),
    additionalProperties: false,
  };
}

const id = (description = 'Object ID from observe_canvas.'): KritzelJsonSchemaNode => ({ type: 'string', description });
const ids: KritzelJsonSchemaNode = {
  type: 'array',
  items: id(),
  minItems: 1,
  description: 'IDs of top-level objects (objects without parentId).',
};
const num = (description: string): KritzelJsonSchemaNode => ({ type: 'number', description });
const bool = (description: string): KritzelJsonSchemaNode => ({ type: 'boolean', description });
const str = (description: string): KritzelJsonSchemaNode => ({ type: 'string', description });
const color = (description: string): KritzelJsonSchemaNode => ({ type: 'string', description: `${description} Any CSS color, e.g. "#1e88e5" or "tomato".` });
const anchor = (description: string): KritzelJsonSchemaNode => ({ type: 'string', enum: AGENTIC_ANCHORS, description });
const point = object<KritzelPoint>({ x: req(num('World x.')), y: req(num('World y.')) });

/** A point-or-object target flattened into one object (portable: no anyOf). An `objectId` wins over x/y. */
const target = (description: string): KritzelJsonSchemaNode => ({
  type: 'object',
  description: `${description} Either a world point {x, y} or a point on an object {objectId, anchor?, offset?}; the anchor turns with the object.`,
  properties: {
    x: num('World x (point target).'),
    y: num('World y (point target).'),
    objectId: id(),
    anchor: anchor("Point on the object's box. Defaults to 'center'."),
    offset: { ...point, description: "Offset from the anchor in world units, in the object's unrotated frame." },
  },
  additionalProperties: false,
});

const opacity = num('0 (transparent) to 1 (opaque).');
const positive = (description: string) => num(`${description} Greater than 0.`);

const shapeStyle = object<KritzelAgenticShapeStyle>(
  {
    fillColor: opt(color('Fill.')),
    strokeColor: opt(color('Outline.')),
    strokeWidth: opt(positive('Outline width.')),
    opacity: opt(opacity),
    fontSize: opt(positive('Font size.')),
    fontFamily: opt(str('Font family name.')),
    fontColor: opt(color('Text color.')),
  },
  "Unset fields use the user's current shape tool settings.",
);
const textStyle = object<KritzelAgenticTextStyle>({
  fontSize: opt(positive('Font size.')),
  fontFamily: opt(str('Font family name.')),
  fontColor: opt(color('Text color.')),
  opacity: opt(opacity),
});
const strokeStyle = object<KritzelAgenticStrokeStyle>({
  strokeColor: opt(color('Stroke color.')),
  strokeWidth: opt(positive('Stroke width.')),
  opacity: opt(opacity),
});
const arrowHead = object<ArrowHeadConfig>({
  enabled: req(bool('Whether this end has an arrow head.')),
  style: opt({ type: 'string', enum: AGENTIC_ARROW_HEAD_STYLES, description: "Defaults to 'triangle'." }),
  size: opt(positive('Head size. Defaults to 3 x the stroke width.')),
  // Theme-aware colors only; the head takes the line color otherwise.
  fill: null,
});
const arrows = object<LineArrowConfig>({ start: opt(arrowHead), end: opt(arrowHead) }, 'Arrow heads at the ends of the line.');
const lineStyle = object<KritzelAgenticLineStyle>({
  strokeColor: opt(color('Line color.')),
  strokeWidth: opt(positive('Line width.')),
  opacity: opt(opacity),
  arrows: opt(arrows),
});
const objectStyle = object<KritzelAgenticObjectStyle>(
  {
    fillColor: opt(color('Fill of shapes.')),
    strokeColor: opt(color('Outline of shapes, color of pen strokes and lines.')),
    strokeWidth: opt(positive('Outline or stroke width.')),
    opacity: opt(opacity),
    fontSize: opt(positive('Font size of shapes and texts.')),
    fontFamily: opt(str('Font family of shapes and texts.')),
    fontColor: opt(color('Text color of shapes and texts.')),
    arrows: opt(object<LineArrowConfig>({ start: opt(arrowHead), end: opt(arrowHead) }, 'Arrow heads of lines to change; an end left out keeps its head.')),
  },
  'At least one field. Fields that do not apply to an object are ignored.',
);

type ActionInput<K extends KritzelAgenticActionType> = Omit<Extract<KritzelAgenticAction, { type: K }>, 'type'>;

/** How an action is offered to models. */
export interface KritzelAgentToolSpec<K extends KritzelAgenticActionType = KritzelAgenticActionType> {
  name: string;
  description: string;
  params: Params<ActionInput<K>>;
}

/** One entry per action type; `null` means the action is not offered as a tool. */
export const AGENT_TOOL_SPECS: { [K in KritzelAgenticActionType]: KritzelAgentToolSpec<K> | null } = {
  click: {
    name: 'click',
    description: 'Moves your cursor to the target and clicks. Visual only: nothing is selected or changed. Returns the top-most object under the click.',
    params: { target: req(target('Where to click.')), count: opt({ type: 'integer', description: '1 (default) or 2 for a double click.' }) },
  },
  select: {
    name: 'select',
    description: "Makes top-level objects your selection, shown in your color. Never changes the user's selection.",
    params: { objectIds: req(ids), additive: opt(bool('Add to your selection instead of replacing it.')) },
  },
  clearSelection: { name: 'clear_selection', description: 'Clears your selection.', params: {} },
  moveObject: {
    name: 'move_object',
    description: 'Drags a top-level object so that its align point lands on `to`. Lines connected to it follow.',
    params: {
      objectId: req(id('ID of a top-level object.')),
      to: req(target('Destination.')),
      align: opt(anchor("Point of the moved object that lands on `to`. Defaults to 'center'.")),
    },
  },
  deleteObjects: { name: 'delete_objects', description: 'Deletes top-level objects; a group is deleted with its children.', params: { objectIds: req(ids) } },
  undo: { name: 'undo', description: "Undoes your last completed action. Never touches the user's or other agents' changes.", params: {} },
  redo: { name: 'redo', description: 'Redoes your last undone action.', params: {} },
  resizeObject: {
    name: 'resize_object',
    description:
      'Resizes a top-level object by dragging a corner; the opposite corner stays. Sizes are world units of the unrotated box. Give width, height or both.',
    params: {
      objectId: req(id('ID of a top-level object.')),
      width: opt(positive('New width.')),
      height: opt(positive('New height.')),
      keepAspectRatio: opt(bool('Defaults to true when only one of width/height is given.')),
      handle: opt({ type: 'string', enum: AGENTIC_RESIZE_HANDLES, description: "Dragged corner. Defaults to 'bottom-right'." }),
    },
  },
  rotateObject: {
    name: 'rotate_object',
    description: 'Rotates a top-level object around its center.',
    params: {
      objectId: req(id('ID of a top-level object.')),
      angle: req(num('Degrees clockwise. Absolute (0 straightens it) unless relative is true.')),
      relative: opt(bool('Add angle to the current rotation.')),
    },
  },
  copyObjects: {
    name: 'copy_objects',
    description:
      'Duplicates top-level objects by Alt-dragging them; group children and lines between them are copied too. Returns the copies\' IDs.',
    params: {
      objectIds: req(ids),
      to: opt(target('Where the center of the copies lands. Defaults to right next to the originals.')),
    },
  },
  groupObjects: {
    name: 'group_objects',
    description: 'Groups at least two top-level objects into one group at the position of the topmost one. Returns the group\'s ID.',
    params: { objectIds: req({ ...ids, minItems: 2 }) },
  },
  ungroupObjects: {
    name: 'ungroup_objects',
    description: "Dissolves top-level groups; their children keep their place. Returns the children's IDs.",
    params: { objectIds: req({ ...ids, description: 'IDs of top-level groups.' }) },
  },
  orderObjects: {
    name: 'order_objects',
    description: 'Moves top-level objects in the stacking order; a group moves with its children.',
    params: {
      objectIds: req(ids),
      order: req({
        type: 'string',
        enum: AGENTIC_ORDERS,
        description: "'front' or 'back' moves them above or below all other objects, 'forward' or 'backward' one layer.",
      }),
    },
  },
  createShape: {
    name: 'create_shape',
    description: 'Draws a new shape with its top-left corner at (x, y) in world coordinates, optionally with centered text. Returns its ID.',
    params: {
      shapeType: opt({ type: 'string', enum: AGENTIC_SHAPE_TYPES, description: "Defaults to the user's current shape type." }),
      x: req(num('Left edge.')),
      y: req(num('Top edge.')),
      width: req(num('At least 1.')),
      height: req(num('At least 1.')),
      text: opt(str('Text inside the shape. \\n starts a new paragraph.')),
      style: opt(shapeStyle),
    },
  },
  createText: {
    name: 'create_text',
    description: 'Places a new text object with its top-left corner at (x, y) and types the text. Its size follows the text. Returns its ID.',
    params: { x: req(num('Left edge.')), y: req(num('Top edge.')), text: req(str('Non-empty. \\n starts a new paragraph.')), style: opt(textStyle) },
  },
  typeText: {
    name: 'type_text',
    description: 'Types into an existing text or shape (also inside a group).',
    params: {
      objectId: req(id('ID of a text or shape.')),
      text: req(str('The text to type. \\n starts a new paragraph.')),
      mode: opt({ type: 'string', enum: ['append', 'replace'], description: "'append' (default) or 'replace' (clears it first)." }),
    },
  },
  drawPath: {
    name: 'draw_path',
    description: 'Draws a freehand stroke through world points, in order.',
    params: { points: req({ type: 'array', items: point, minItems: 2, description: 'At least two world points.' }), style: opt(strokeStyle) },
  },
  connect: {
    name: 'connect',
    description: 'Draws a line between the centers of two objects and anchors both ends, so it follows them. Lines cannot be connected.',
    params: { from: req(id('Start object.')), to: req(id('End object; must differ from `from`.')), style: opt(lineStyle) },
  },
  setStyle: {
    name: 'set_style',
    description: 'Restyles top-level objects; a group restyles its children.',
    params: { objectIds: req(ids), style: req(objectStyle) },
  },
  // Needs an object instance; apps offer their own tools (e.g. add_iframe) that call agent.addObject().
  addObject: null,
};

/** The input schema of a tool. */
export function agentToolInputSchema(spec: KritzelAgentToolSpec): KritzelAgentToolSchema {
  return object<Record<string, unknown>>(spec.params as Params<Record<string, unknown>>) as KritzelAgentToolSchema;
}

/** The input schema of `observe_canvas`. */
export const OBSERVE_CANVAS_SCHEMA: KritzelAgentToolSchema = object<{ scope?: string; objectIds?: string[] }>({
  scope: opt({ type: 'string', enum: ['all', 'viewport'], description: "'all' (default) or only what the user sees." }),
  objectIds: opt({ ...ids, description: 'Only these objects (and their group children).' }),
}) as KritzelAgentToolSchema;
