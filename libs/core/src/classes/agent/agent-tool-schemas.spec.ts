import { AGENT_TOOL_SPECS, OBSERVE_CANVAS_SCHEMA, agentToolInputSchema, type KritzelJsonSchemaNode } from './agent-tool-schemas';
import { AGENTIC_ACTION_EXECUTORS, getAgenticActionExecutor } from '../registries/agentic-action-executor.registry';
import {
  AGENTIC_ANCHORS,
  AGENTIC_ARROW_HEAD_STYLES,
  AGENTIC_RESIZE_HANDLES,
  AGENTIC_SHAPE_TYPES,
} from '../../helpers/agentic-validation.helper';
import { AGENTIC_ANCHOR_FACTORS } from '../../helpers/agentic-geometry.helper';
import { ShapeType } from '../../enums/shape-type.enum';
import type { KritzelAgenticActionType } from '../../interfaces/agentic-action.interface';

const ALLOWED_KEYWORDS = new Set(['type', 'description', 'properties', 'required', 'items', 'enum', 'minItems', 'additionalProperties']);

/** Valid input for every tool, as a model would send it. */
const FIXTURES: Partial<Record<KritzelAgenticActionType, Record<string, unknown>>> = {
  click: { target: { objectId: 'a', anchor: 'top-left' }, count: 2 },
  select: { objectIds: ['a'], additive: true },
  clearSelection: {},
  moveObject: { objectId: 'a', to: { x: 10, y: 20 }, align: 'top-left' },
  deleteObjects: { objectIds: ['a'] },
  undo: {},
  redo: {},
  resizeObject: { objectId: 'a', width: 100, keepAspectRatio: false, handle: 'top-left' },
  rotateObject: { objectId: 'a', angle: 15, relative: true },
  copyObjects: { objectIds: ['a'], to: { objectId: 'b', anchor: 'right', offset: { x: 20, y: 0 } } },
  groupObjects: { objectIds: ['a', 'b'] },
  ungroupObjects: { objectIds: ['g'] },
  orderObjects: { objectIds: ['a'], order: 'front' },
  createShape: { shapeType: 'ellipse', x: 0, y: 0, width: 10, height: 10, text: 'Hi', style: { fillColor: 'tomato', opacity: 0.5 } },
  createText: { x: 0, y: 0, text: 'Hi', style: { fontSize: 20 } },
  typeText: { objectId: 'a', text: 'Hi', mode: 'replace' },
  drawPath: { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }], style: { strokeColor: 'red', strokeWidth: 2 } },
  connect: { from: 'a', to: 'b', style: { strokeColor: 'red', arrows: { end: { enabled: true, style: 'open' } } } },
  setStyle: { objectIds: ['a'], style: { fillColor: '#fff', arrows: { start: { enabled: true } } } },
};

function walk(node: KritzelJsonSchemaNode, path: string, visit: (node: KritzelJsonSchemaNode, path: string) => void): void {
  visit(node, path);
  Object.entries(node.properties ?? {}).forEach(([key, child]) => walk(child, `${path}.${key}`, visit));
  if (node.items) {
    walk(node.items, `${path}[]`, visit);
  }
}

describe('agent tool schemas', () => {
  const specs = Object.entries(AGENT_TOOL_SPECS).filter(([, spec]) => spec !== null) as [KritzelAgenticActionType, NonNullable<(typeof AGENT_TOOL_SPECS)[KritzelAgenticActionType]>][];

  it('has a decision for every action type', () => {
    expect(Object.keys(AGENT_TOOL_SPECS).sort()).toEqual(Object.keys(AGENTIC_ACTION_EXECUTORS).sort());
    expect(AGENT_TOOL_SPECS.addObject).toBeNull();
  });

  it('uses unique snake_case names', () => {
    const names = specs.map(([, spec]) => spec.name);
    names.forEach(name => expect(name).toMatch(/^[a-z][a-z0-9_]{0,63}$/));
    expect(new Set(names).size).toBe(names.length);
  });

  it('uses only portable keywords, closes every object and keeps required fields defined', () => {
    const schemas = [...specs.map(([type, spec]) => [type, agentToolInputSchema(spec)] as const), ['observe_canvas', OBSERVE_CANVAS_SCHEMA] as const];
    for (const [name, schema] of schemas) {
      walk(schema as unknown as KritzelJsonSchemaNode, name, (node, path) => {
        Object.keys(node).forEach(key => expect({ path, key, allowed: ALLOWED_KEYWORDS.has(key) }).toEqual({ path, key, allowed: true }));
        if (node.type === 'object') {
          expect({ path, additionalProperties: node.additionalProperties }).toEqual({ path, additionalProperties: false });
          (node.required ?? []).forEach(key => expect(Object.keys(node.properties ?? {})).toContain(key));
        }
        (node.enum ?? []).forEach(value => expect(typeof value).toBe('string'));
      });
    }
  });

  it('takes enums from the runtime constants', () => {
    expect(AGENTIC_ANCHORS).toEqual(Object.keys(AGENTIC_ANCHOR_FACTORS));
    expect(AGENTIC_SHAPE_TYPES).toEqual(Object.values(ShapeType));
    const move = agentToolInputSchema(AGENT_TOOL_SPECS.moveObject!) as any;
    expect(move.properties.align.enum).toEqual(AGENTIC_ANCHORS);
    expect((agentToolInputSchema(AGENT_TOOL_SPECS.resizeObject!) as any).properties.handle.enum).toEqual(AGENTIC_RESIZE_HANDLES);
    expect((agentToolInputSchema(AGENT_TOOL_SPECS.createShape!) as any).properties.shapeType.enum).toEqual(AGENTIC_SHAPE_TYPES);
    expect((agentToolInputSchema(AGENT_TOOL_SPECS.connect!) as any).properties.style.properties.arrows.properties.end.properties.style.enum).toEqual(
      AGENTIC_ARROW_HEAD_STYLES,
    );
  });

  it.each(specs.map(([type]) => type))('accepts a valid %s input and refuses it without a required field', type => {
    const fixture = FIXTURES[type]!;
    const validate = getAgenticActionExecutor(type)!.validate;
    expect(() => validate({ ...fixture, type } as any)).not.toThrow();

    const schema = agentToolInputSchema(AGENT_TOOL_SPECS[type]!);
    for (const key of schema.required ?? []) {
      const { [key]: _removed, ...rest } = fixture;
      expect(() => validate({ ...rest, type } as any)).toThrow();
    }
  });
});
