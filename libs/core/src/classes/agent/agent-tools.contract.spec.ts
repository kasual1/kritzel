import { AGENT_TOOL_REASON_HINTS, createActorTools } from './agent-tools';
import { UpdrawAgentActionError } from './agent-action-error.class';
import type { UpdrawAgentToolsOptions } from '../../interfaces/agent.interface';

/**
 * Pins what models see of the canvas tools and how the tools answer, so refactors of the tool definitions keep
 * names, descriptions, schemas, order and results byte for byte.
 */

const createFakeActor = (kind: 'agent' | 'user' = 'agent') => ({
  kind,
  isAdded: true,
  perform: jest.fn().mockResolvedValue({ completed: true, objectIds: ['new-1'] }),
  observe: jest.fn().mockResolvedValue({ objects: [], totalObjects: 0 }),
  _whenIdle: jest.fn().mockResolvedValue(undefined),
  _describeObjects: jest.fn((ids: string[]) => ids.map(id => ({ id, type: 'shape', x: 0, y: 0, width: 10, height: 10 }))),
  _inspectElements: jest.fn().mockResolvedValue({ completed: true, objectIds: ['w'], elements: [] }),
});

type FakeActor = ReturnType<typeof createFakeActor>;

const toolOf = (actor: FakeActor, name: string, options: UpdrawAgentToolsOptions = {}) => {
  const found = createActorTools(actor as any, options).find(candidate => candidate.name === name);
  if (!found) throw new Error(`no tool ${name}`);
  return found;
};

const run = async (actor: FakeActor, name: string, input: unknown, options: UpdrawAgentToolsOptions = {}) =>
  JSON.parse(await toolOf(actor, name, options).run(input));

const OPTION_SETS: [string, UpdrawAgentToolsOptions][] = [
  ['default', {}],
  ['no images', { images: false }],
  ['image urls', { images: { urls: true } }],
  ['iframes', { iframes: true }],
  ['prefix', { prefix: 'k_', iframes: true }],
  ['only, prefixed and plain', { prefix: 'k_', only: ['k_observe_canvas', 'create_shape', 'undo', 'create_image'] }],
];

const SVG = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';

describe('agent tools contract', () => {
  describe.each(['agent', 'user'] as const)('as %s', kind => {
    it.each(OPTION_SETS)('offers the same tools with %s', (_name, options) => {
      const tools = createActorTools(createFakeActor(kind) as any, options).map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
      expect(tools).toMatchSnapshot();
    });
  });

  it('treats images: null like the default', () => {
    const surface = (options: UpdrawAgentToolsOptions) =>
      createActorTools(createFakeActor() as any, options).map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
    expect(surface({ images: null as any })).toEqual(surface({}));
  });

  it('hands out a fresh top-level schema per tools() call, so adapting one in place never leaks', async () => {
    const actor = createFakeActor();
    const first = createActorTools(actor as any).find(candidate => candidate.name === 'create_shape')!;
    const second = createActorTools(actor as any).find(candidate => candidate.name === 'create_shape')!;
    expect(first.inputSchema).not.toBe(second.inputSchema);

    delete (first.inputSchema.properties as Record<string, unknown>).style;
    expect(second.inputSchema.properties).toHaveProperty('style');
    expect(JSON.parse(await second.run({ x: 0, y: 0, width: 10, height: 10, style: { fillColor: 'red' } }))).toMatchObject({ completed: true });
  });

  it('treats empty input as no arguments, as some runners send for tools without parameters', async () => {
    const actor = createFakeActor();
    expect(await run(actor, 'undo', '')).toMatchObject({ completed: true });
    expect(await run(actor, 'undo', '  ')).toMatchObject({ completed: true });
    expect(await run(actor, 'observe_canvas', '')).toEqual({ objects: [], totalObjects: 0 });
  });

  it('caps text at 2000 characters by default and accepts text of exactly the cap', async () => {
    const actor = createFakeActor();
    expect(await run(actor, 'create_text', { x: 0, y: 0, text: 'x'.repeat(2001) })).toMatchObject({
      message: '"text" is longer than 2000 characters. Split it into several actions.',
    });
    expect(await run(actor, 'create_text', { x: 0, y: 0, text: 'abc' }, { maxTextLength: 3 })).toMatchObject({ completed: true });
  });

  describe('create_image input', () => {
    it.each([
      [{ svg: '<div>x</div><svg></svg>', x: 0, y: 0 }, '"svg" must be SVG markup starting with an <svg> element.'],
      [{ svg: 'x'.repeat(200_001), x: 0, y: 0 }, '"svg" is longer than 200000 characters.'],
      [{ svg: SVG, x: 0, y: 0, name: 5 }, '"name" must be a string.'],
    ])('rejects %j', async (input, message) => {
      const actor = createFakeActor();
      expect(await run(actor, 'create_image', input)).toMatchObject({ reason: 'invalid-input', message });
      expect(actor.perform).not.toHaveBeenCalled();
    });

    it('trims the markup before turning it into a data URL', async () => {
      const actor = createFakeActor();
      await run(actor, 'create_image', { svg: `  ${SVG}\n`, x: 0, y: 0 });
      expect(actor.perform.mock.calls[0][0].object.src).toBe(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(SVG)}`);
    });

    it('takes exactly one of svg or url when URLs are allowed, and plain http URLs too', async () => {
      const actor = createFakeActor();
      const options = { images: { urls: true } };
      for (const input of [{ x: 0, y: 0 }, { svg: SVG, url: 'https://example.com/a.png', x: 0, y: 0 }]) {
        expect(await run(actor, 'create_image', input, options)).toMatchObject({ message: 'Give exactly one of "svg" or "url".' });
      }
      expect(await run(actor, 'create_image', { url: 'http://example.com/a.png', x: 0, y: 0 }, options)).toMatchObject({ completed: true });
      expect(actor.perform.mock.calls[0][0].object.src).toBe('http://example.com/a.png');
    });
  });

  it('starts every tool action in the same tick as its call, so parallel calls keep their order', () => {
    const actor = createFakeActor();
    const tools = createActorTools(actor as any, { iframes: true });
    const runOf = (name: string) => tools.find(candidate => candidate.name === name)!.run;

    void runOf('create_shape')({ x: 0, y: 0, width: 10, height: 10 });
    void runOf('move_object')({ objectId: 'a', to: { x: 1, y: 2 } });
    void runOf('create_iframe')({ name: 'w', html: '<p></p>', x: 0, y: 0, width: 10, height: 10 });
    void runOf('create_image')({ svg: '<svg xmlns="http://www.w3.org/2000/svg"></svg>', x: 0, y: 0 });

    expect(actor.perform.mock.calls.map(call => call[0].type)).toEqual(['createShape', 'moveObject', 'addObject', 'addObject']);
  });

  describe('results', () => {
    it.each(['click', 'select', 'clear_selection', 'delete_objects'])('lists no objects for %s', async name => {
      const actor = createFakeActor();
      actor.perform.mockResolvedValue({ completed: true, objectIds: ['a'] });
      const input = {
        click: { target: { objectId: 'a' } },
        select: { objectIds: ['a'] },
        clear_selection: {},
        delete_objects: { objectIds: ['a'] },
      }[name];

      expect(await run(actor, name, input)).toEqual({ completed: true, objectIds: ['a'] });
      expect(actor._describeObjects).not.toHaveBeenCalled();
    });

    it('describes at most ten objects, and none when describing fails', async () => {
      const actor = createFakeActor();
      const ids = Array.from({ length: 12 }, (_, index) => `o${index}`);
      actor.perform.mockResolvedValue({ completed: true, objectIds: ids });

      const result = await run(actor, 'copy_objects', { objectIds: ['a'] });
      expect(result.objectIds).toEqual(ids);
      expect(result.objects).toHaveLength(10);
      expect(actor._describeObjects).toHaveBeenCalledWith(ids.slice(0, 10));

      actor._describeObjects.mockImplementation(() => {
        throw new Error('gone');
      });
      expect(await run(actor, 'copy_objects', { objectIds: ['a'] })).toEqual({ completed: true, objectIds: ids });
    });

    it('answers completed: true with an empty objectIds list when the action reports none', async () => {
      const actor = createFakeActor();
      actor.perform.mockResolvedValue({ completed: true });
      expect(await run(actor, 'undo', {})).toEqual({ completed: true, objectIds: [] });
    });

    it('falls back to conflict for a refusal without a reason and leaves out an empty objectIds list', async () => {
      const actor = createFakeActor();
      actor.perform.mockResolvedValue({ completed: false, objectIds: [] });
      expect(await run(actor, 'undo', {})).toEqual({
        completed: false,
        reason: 'conflict',
        hint: 'The objects were changed elsewhere meanwhile. Call observe_canvas and try again.',
      });
    });

    it('passes the signal and the instant option to the action', async () => {
      const actor = createFakeActor();
      const signal = new AbortController().signal;
      await toolOf(actor, 'create_iframe', { iframes: true, instant: true }).run({ name: 'w', html: '<p></p>', x: 0, y: 0, width: 10, height: 10 }, { signal });
      expect(actor.perform).toHaveBeenCalledWith(expect.objectContaining({ type: 'addObject' }), { signal, instant: true });
    });
  });

  describe('elements', () => {
    it.each(['agent', 'user'] as const)('turns interact_with_element into an interactWithElement action for %s and describes the element', async kind => {
      const actor = createFakeActor(kind);
      const rect = { x: 0, y: 0, width: 10, height: 10 };
      actor.perform.mockResolvedValue({
        completed: true,
        objectIds: ['w'],
        element: { selector: '#play', tagName: 'button', classList: [], attributes: {}, rect, visibleRect: rect, state: { pressed: true } },
      });

      const result = await run(actor, 'interact_with_element', { target: { objectId: 'w', selector: '#play' }, interaction: { type: 'click', count: 2 } });

      expect(actor.perform).toHaveBeenCalledWith(
        { type: 'interactWithElement', target: { objectId: 'w', selector: '#play' }, interaction: { type: 'click', count: 2 } },
        {},
      );
      expect(result).toEqual({ completed: true, objectIds: ['w'], element: { selector: '#play', tagName: 'button', state: { pressed: true }, visible: true } });
      expect(actor._describeObjects).not.toHaveBeenCalled();
    });

    it('passes the message of an element refusal on', async () => {
      const actor = createFakeActor();
      actor.perform.mockResolvedValue({ completed: false, reason: 'element-interaction-failed', objectIds: ['w'], elementReason: 'disabled', message: 'Element "#a": It is disabled.' });

      await expect(run(actor, 'interact_with_element', { target: { objectId: 'w', selector: '#a' }, interaction: { type: 'click' } })).resolves.toEqual({
        completed: false,
        reason: 'element-interaction-failed',
        objectIds: ['w'],
        message: 'Element "#a": It is disabled.',
        hint: AGENT_TOOL_REASON_HINTS['element-interaction-failed'],
      });
    });

    it('lets inspect_elements wait for queued actions, then asks the actor', async () => {
      const actor = createFakeActor();

      await expect(run(actor, 'inspect_elements', { objectId: 'w', selector: 'button', limit: 5 })).resolves.toEqual({ completed: true, objectIds: ['w'], elements: [] });

      expect(actor._whenIdle).toHaveBeenCalled();
      expect(actor._inspectElements).toHaveBeenCalledWith('w', { selector: 'button', limit: 5 });
      await expect(run(actor, 'inspect_elements', { objectId: 'w', selector: ' ' })).resolves.toMatchObject({ completed: false, reason: 'invalid-input' });
    });
  });

  describe('hints for an actor working as the user', () => {
    it.each([
      ['user-selected', 'The user is working on these objects right now. Leave them alone or ask the user.'],
      ['not-allowed', 'This is not possible when working as the user.'],
      ['conflict', 'The objects were changed elsewhere meanwhile. Call observe_canvas and try again.'],
    ])('words %s for the user', async (reason, hint) => {
      const actor = createFakeActor('user');
      actor.perform.mockResolvedValue({ completed: false, reason });
      expect(await run(actor, 'move_object', { objectId: 'a', to: { x: 1, y: 2 } })).toEqual({ completed: false, reason, hint });
    });

    it('keeps the general hint for invalid input', async () => {
      const result = await run(createFakeActor('user'), 'move_object', {});
      expect(result).toEqual({
        completed: false,
        reason: 'invalid-input',
        message: '"objectId" is required.',
        hint: 'Fix the input as the message says and try again.',
      });
    });
  });

  describe('a removed actor', () => {
    it('loses to invalid input for action tools: the model learns about its mistake first', async () => {
      const actor = createFakeActor();
      actor.isAdded = false;
      expect(await run(actor, 'move_object', {})).toMatchObject({ reason: 'invalid-input' });
      expect(await run(actor, 'create_image', {})).toMatchObject({ reason: 'invalid-input' });
      expect(await run(actor, 'create_iframe', {}, { iframes: true })).toMatchObject({ reason: 'invalid-input' });
    });

    it('wins over invalid input for observe_canvas', async () => {
      const actor = createFakeActor();
      actor.isAdded = false;
      expect(await run(actor, 'observe_canvas', { scope: 'everything' })).toEqual({
        completed: false,
        reason: 'agent-removed',
        hint: 'You were removed from the canvas. Stop working.',
      });
    });

    it('is reported when it happens while observe_canvas waits for queued actions', async () => {
      const actor = createFakeActor();
      actor._whenIdle.mockImplementation(async () => {
        actor.isAdded = false;
      });
      expect(await run(actor, 'observe_canvas', {})).toMatchObject({ reason: 'agent-removed' });
      expect(actor.observe).not.toHaveBeenCalled();
    });

    it('is reported when observing fails after the removal', async () => {
      const actor = createFakeActor();
      actor.observe.mockImplementation(async () => {
        actor.isAdded = false;
        throw new Error('gone');
      });
      expect(await run(actor, 'observe_canvas', {})).toMatchObject({ reason: 'agent-removed' });
    });

    it('is worded for the user by observe_canvas, without waiting for queued actions', async () => {
      const actor = createFakeActor('user');
      actor.isAdded = false;
      const removed = { completed: false, reason: 'agent-removed', hint: 'The chat session ended. Stop working.' };
      expect(await run(actor, 'observe_canvas', { scope: 'everything' })).toEqual(removed);
      expect(await run(actor, 'observe_canvas', {})).toEqual(removed);
      expect(actor._whenIdle).not.toHaveBeenCalled();
    });

    it('is reported by object tools before they act', async () => {
      const actor = createFakeActor();
      actor.isAdded = false;
      expect(await run(actor, 'create_iframe', { name: 'w', html: '<p></p>', x: 0, y: 0, width: 10, height: 10 }, { iframes: true })).toMatchObject({
        reason: 'agent-removed',
      });
      expect(actor.perform).not.toHaveBeenCalled();
    });
  });

  describe('errors', () => {
    it('reports a canvas that is not ready while observing as engine-disconnected', async () => {
      const actor = createFakeActor();
      actor.observe.mockRejectedValue(new Error('Engine is not ready'));
      expect(await run(actor, 'observe_canvas', {})).toEqual({
        completed: false,
        reason: 'engine-disconnected',
        hint: 'The canvas is not available right now. Try again later.',
      });
    });

    it('rethrows other errors of observe_canvas', async () => {
      const actor = createFakeActor();
      actor.observe.mockRejectedValue(new Error('boom'));
      await expect(toolOf(actor, 'observe_canvas').run({})).rejects.toThrow('boom');
    });

    it('rethrows errors of create_iframe actions, but reports create_image load failures', async () => {
      const actor = createFakeActor();
      actor.perform.mockRejectedValue(new Error('boom'));
      await expect(toolOf(actor, 'create_iframe', { iframes: true }).run({ name: 'w', html: '<p></p>', x: 0, y: 0, width: 10, height: 10 })).rejects.toThrow('boom');
      expect(await run(actor, 'create_image', { svg: '<svg xmlns="http://www.w3.org/2000/svg"></svg>', x: 0, y: 0 })).toEqual({
        completed: false,
        reason: 'invalid-input',
        message: 'The image could not be loaded: boom',
        hint: 'Check the markup or use another image.',
      });
    });

    it('reports refusals thrown inside agent.task() by object tools', async () => {
      const actor = createFakeActor();
      actor.perform.mockRejectedValue(new UpdrawAgentActionError({ type: 'addObject' } as any, { completed: false, reason: 'conflict' }));
      expect(await run(actor, 'create_iframe', { name: 'w', html: '<p></p>', x: 0, y: 0, width: 10, height: 10 }, { iframes: true })).toMatchObject({
        completed: false,
        reason: 'conflict',
      });
    });

    it('checks iframe input in order and keeps non-string code out', async () => {
      const actor = createFakeActor();
      const iframe = (input: Record<string, unknown>) => run(actor, 'create_iframe', input, { iframes: true });
      const base = { name: 'w', html: '<p></p>', x: 0, y: 0, width: 10, height: 10 };
      expect((await iframe({ ...base, name: 5 })).message).toBe('"name" must be a string.');
      expect((await iframe({ ...base, css: 5 })).message).toBe('"css" must be a string.');
      expect((await iframe({ ...base, script: {} })).message).toBe('"script" must be a string.');
      expect((await iframe({ ...base, html: 'x'.repeat(200_001) })).message).toBe('html, css and script together are longer than 200000 characters.');
      expect((await iframe({ ...base, x: 'left', width: 0 })).message).toBe('"x" must be a number.');
      expect(actor.perform).not.toHaveBeenCalled();
    });

    it('caps typed text only for tools that type text', async () => {
      const actor = createFakeActor();
      const options = { maxTextLength: 3, iframes: true };
      expect(await run(actor, 'create_shape', { x: 0, y: 0, width: 10, height: 10, text: 'long' }, options)).toMatchObject({
        message: '"text" is longer than 3 characters. Split it into several actions.',
      });
      expect(await run(actor, 'create_iframe', { name: 'long', html: '<p>long</p>', x: 0, y: 0, width: 10, height: 10 }, options)).toMatchObject({ completed: true });
    });
  });
});
