import { bindCanvasTool, defineCanvasTool } from './canvas-tool';

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
