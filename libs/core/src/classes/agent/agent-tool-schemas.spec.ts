import { AGENT_TOOL_SPECS, agentToolInputSchema, type KritzelJsonSchemaNode } from './agent-tool-schemas';
import { KRITZEL_CANVAS_TOOLS } from './canvas-tool-definitions';
import { bindCanvasTool, canvasToolSchema, canvasToolText, isCanvasToolOffered, type KritzelCanvasToolEnv } from './canvas-tool';
import { AGENTIC_ACTION_EXECUTORS, getAgenticActionExecutor } from '../registries/agentic-action-executor.registry';
import {
  AGENTIC_ANCHORS,
  AGENTIC_ARROW_HEAD_STYLES,
  AGENTIC_RESIZE_HANDLES,
  AGENTIC_SHAPE_TYPES,
} from '../../helpers/agentic-validation.helper';
import { AGENTIC_ANCHOR_FACTORS } from '../../helpers/agentic-geometry.helper';
import { ShapeType } from '../../enums/shape-type.enum';
import type { KritzelAgentToolsOptions } from '../../interfaces/agent.interface';
import type { KritzelAgenticActionType } from '../../interfaces/agentic-action.interface';

const ALLOWED_KEYWORDS = new Set(['type', 'description', 'properties', 'required', 'items', 'enum', 'minItems', 'additionalProperties']);

/** Every way a tool can be bound: both actor kinds, with the option values that change texts or schemas. */
const ENVS: KritzelCanvasToolEnv[] = (['agent', 'user'] as const).flatMap(kind =>
  ([{ iframes: true }, { iframes: true, images: { urls: true } }] as KritzelAgentToolsOptions[]).map(options => ({ kind, options })),
);

function walk(node: KritzelJsonSchemaNode, path: string, visit: (node: KritzelJsonSchemaNode, path: string) => void): void {
  visit(node, path);
  Object.entries(node.properties ?? {}).forEach(([key, child]) => walk(child, `${path}.${key}`, visit));
  if (node.items) {
    walk(node.items, `${path}[]`, visit);
  }
}

/** An actor whose actions all complete. */
const fakeActor = (kind: 'agent' | 'user') => ({
  kind,
  isAdded: true,
  perform: jest.fn().mockResolvedValue({ completed: true, objectIds: ['new-1'] }),
  observe: jest.fn().mockResolvedValue({ objects: [], totalObjects: 0 }),
  _whenIdle: jest.fn().mockResolvedValue(undefined),
  _describeObjects: jest.fn(() => []),
});

describe('agent tool schemas', () => {
  const specs = Object.entries(AGENT_TOOL_SPECS).filter(([, spec]) => spec !== null) as [KritzelAgenticActionType, NonNullable<(typeof AGENT_TOOL_SPECS)[KritzelAgenticActionType]>][];

  it('has a decision for every action type', () => {
    expect(Object.keys(AGENT_TOOL_SPECS).sort()).toEqual(Object.keys(AGENTIC_ACTION_EXECUTORS).sort());
    expect(AGENT_TOOL_SPECS.addObject).toBeNull();
  });

  it('defines every tool once, with a unique snake_case name', () => {
    const names = KRITZEL_CANVAS_TOOLS.map(definition => definition.name);
    names.forEach(name => expect(name).toMatch(/^[a-z][a-z0-9_]{0,63}$/));
    expect(new Set(names).size).toBe(names.length);
    expect(names).toEqual(expect.arrayContaining(['observe_canvas', 'create_image', 'create_iframe', ...specs.map(([, spec]) => spec.name)]));
    expect(names).toHaveLength(specs.length + 3);
  });

  it('uses only portable keywords, closes every object and keeps required fields defined, in every environment', () => {
    for (const env of ENVS) {
      for (const definition of KRITZEL_CANVAS_TOOLS) {
        expect(canvasToolText(definition.description, env)).toEqual(expect.any(String));
        walk(canvasToolSchema(definition, env) as unknown as KritzelJsonSchemaNode, `${definition.name} (${env.kind})`, (node, path) => {
          Object.keys(node).forEach(key => expect({ path, key, allowed: ALLOWED_KEYWORDS.has(key) }).toEqual({ path, key, allowed: true }));
          if (node.type === 'object') {
            expect({ path, additionalProperties: node.additionalProperties }).toEqual({ path, additionalProperties: false });
            (node.required ?? []).forEach(key => expect(Object.keys(node.properties ?? {})).toContain(key));
          }
          (node.enum ?? []).forEach(value => expect(typeof value).toBe('string'));
        });
      }
    }
  });

  it.each(KRITZEL_CANVAS_TOOLS.map(definition => definition.name))('runs %s with its example wherever it is offered', async name => {
    const definition = KRITZEL_CANVAS_TOOLS.find(candidate => candidate.name === name)!;
    for (const env of ENVS.filter(candidate => isCanvasToolOffered(definition, candidate))) {
      const actor = fakeActor(env.kind);
      const answer = JSON.parse(await bindCanvasTool(actor, definition, env.options).run(definition.example));
      expect({ name, kind: env.kind, invalid: answer.reason === 'invalid-input' ? answer.message : undefined }).toEqual({ name, kind: env.kind, invalid: undefined });
    }
  });

  it('offers undo and redo only to agents, as the history executor refuses actors working as the user', () => {
    expect(AGENT_TOOL_SPECS.undo!.actors).toEqual(['agent']);
    expect(AGENT_TOOL_SPECS.redo!.actors).toEqual(['agent']);
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

  it.each(specs.map(([type]) => type))('accepts the %s example and refuses it without a required field', type => {
    const example = AGENT_TOOL_SPECS[type]!.example as Record<string, unknown>;
    const validate = getAgenticActionExecutor(type)!.validate;
    expect(() => validate({ ...example, type } as any)).not.toThrow();

    const schema = agentToolInputSchema(AGENT_TOOL_SPECS[type]!);
    for (const key of schema.required ?? []) {
      const { [key]: _removed, ...rest } = example;
      expect(() => validate({ ...rest, type } as any)).toThrow();
    }
  });
});
