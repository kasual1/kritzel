import { bindCanvasTool, defineCanvasTool } from './canvas-tool';
import { KritzelShape } from '../objects/shape.class';

const actor = () => ({
  kind: 'agent' as const,
  isAdded: true,
  perform: jest.fn().mockResolvedValue({ completed: true, objectIds: [] }),
  observe: jest.fn(),
  _whenIdle: jest.fn().mockResolvedValue(undefined),
  _describeObjects: jest.fn(() => []),
});

const schema = { type: 'object' as const, properties: { value: { type: 'string' } }, additionalProperties: false as const };

describe('bindCanvasTool', () => {
  it('answers ctx.invalid() from execute as invalid input', async () => {
    const tool = bindCanvasTool(
      actor(),
      defineCanvasTool<{ value?: string }>({
        name: 'check_late',
        description: 'Rejects in execute.',
        inputSchema: schema,
        example: {},
        execute: async (_payload, ctx) => ctx.invalid('Too late.'),
      }),
    );
    expect(JSON.parse(await tool.run({}))).toEqual({
      completed: false,
      reason: 'invalid-input',
      message: 'Too late.',
      hint: 'Fix the input as the message says and try again.',
    });
  });

  it('answers other errors through onError, and rethrows them without it', async () => {
    const failing = (onError?: () => string | undefined) =>
      bindCanvasTool(
        actor(),
        defineCanvasTool<{ value?: string }>({
          name: 'fail',
          description: 'Fails.',
          inputSchema: schema,
          example: {},
          execute: async () => {
            throw new Error('boom');
          },
          onError,
        }),
      );
    await expect(failing().run({})).rejects.toThrow('boom');
    await expect(failing(() => undefined).run({})).rejects.toThrow('boom');
    await expect(failing(() => '{"handled":true}').run({})).resolves.toBe('{"handled":true}');
  });

  it('freezes definitions', () => {
    const definition = defineCanvasTool({ name: 'x', description: 'X.', inputSchema: schema, example: {}, execute: async () => '{}' });
    expect(Object.isFrozen(definition)).toBe(true);
  });
});

describe('bindCanvasTool with a placeholder', () => {
  const boxSchema = {
    type: 'object' as const,
    properties: { x: { type: 'number' }, width: { type: 'number' }, body: { type: 'string' } },
    required: ['x', 'width', 'body'],
    additionalProperties: false as const,
  };
  type BoxInput = { x: number; width: number; body: string };

  /** A tool that adds a shape and shows a placeholder once `x` and `width` are written. */
  const boxTool = (performed: any[]) => {
    const placingActor = actor();
    const fills: Promise<any>[] = [];
    placingActor.perform = jest.fn(async (action: any) => {
      performed.push(action);
      if (action.fill) {
        fills.push(action.fill);
        try {
          await action.fill;
          return { completed: true, objectIds: ['placeholder'] };
        } catch {
          return { completed: false, reason: 'aborted' };
        }
      }
      return { completed: true, objectIds: ['plain'] };
    });
    const tool = bindCanvasTool(
      placingActor,
      defineCanvasTool<BoxInput, KritzelShape>({
        name: 'box',
        description: 'Adds a box.',
        inputSchema: boxSchema,
        example: { x: 0, width: 10, body: 'b' },
        prepare: (input, ctx) => (input.body === 'bad' ? ctx.invalid('Bad body.') : new KritzelShape({ translateX: input.x, width: input.width, height: 10 })),
        execute: (shape, ctx) => ctx.perform({ type: 'addObject', object: shape }),
        placeholder: {
          create: input => (typeof input.x === 'number' && typeof input.width === 'number' ? new KritzelShape({ translateX: input.x, width: input.width, height: 10 }) : null),
          fill: (placeholder, content) => {
            (placeholder as KritzelShape).height = (content as KritzelShape).height;
          },
        },
      }),
    );
    return { tool, fills, actor: placingActor };
  };

  it('places the placeholder once the input holds what it needs, and fills it with what execute adds', async () => {
    const performed: any[] = [];
    const { tool, fills } = boxTool(performed);
    const call = tool.begin!({ toolCallId: 'c1' });
    call.update('{"x":10,"wid');
    expect(performed).toEqual([]);
    call.update('{"x":10,"width":20,"bo');
    call.update('{"x":10,"width":20,"body":"b');
    expect(performed).toHaveLength(1);
    expect(performed[0]).toMatchObject({ type: 'addObject', object: { translateX: 10, width: 20 } });

    const answer = await call.finish({ x: 10, width: 20, body: 'b' });
    expect(JSON.parse(answer)).toEqual({ completed: true, objectIds: ['placeholder'] });
    // The object execute adds became the fill: it is not added on its own.
    expect(performed).toHaveLength(1);
    const fill = await fills[0];
    expect(fill.content).toMatchObject({ translateX: 10, width: 20 });
  });

  it('takes the placeholder back for invalid input and on cancel, and runs plainly without one', async () => {
    const performed: any[] = [];
    const invalid = boxTool(performed);
    const call = invalid.tool.begin!({});
    call.update('{"x":1,"width":2,');
    expect(JSON.parse(await call.finish({ x: 1, width: 2, body: 'bad' }))).toMatchObject({ completed: false, reason: 'invalid-input', message: 'Bad body.' });
    await expect(invalid.fills[0]).rejects.toThrow('without filling');

    const cancelled = boxTool([]);
    const second = cancelled.tool.begin!({});
    second.update('{"x":1,"width":2,');
    await second.cancel();
    await expect(cancelled.fills[0]).rejects.toThrow('without filling');

    const plain: any[] = [];
    const unplaced = boxTool(plain);
    const third = unplaced.tool.begin!({});
    third.update('{"x":');
    expect(JSON.parse(await third.finish({ x: 1, width: 2, body: 'b' }))).toEqual({ completed: true, objectIds: ['plain'] });
    expect(plain).toHaveLength(1);
    expect(plain[0].fill).toBeUndefined();
  });

  it('gives up on a placeholder when the input runs long without what it needs', () => {
    const performed: any[] = [];
    const { tool } = boxTool(performed);
    const call = tool.begin!({});
    call.update(`{"body":"${'x'.repeat(5000)}`);
    call.update(`{"body":"${'x'.repeat(5000)}","x":1,"width":2,`);
    expect(performed).toEqual([]);
  });

  it('only offers begin to tools with a placeholder', () => {
    const tool = bindCanvasTool(actor(), defineCanvasTool({ name: 'x', description: 'X.', inputSchema: schema, example: {}, execute: async () => '{}' }));
    expect(tool.begin).toBeUndefined();
  });
});
