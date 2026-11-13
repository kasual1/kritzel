import { createActorTools, createAgentTools, formatAgentToolResult, MODEL_IFRAME_CONTENT_SECURITY_POLICY } from './agent-tools';
import { UpdrawImage } from '../objects/image.class';
import { UpdrawIframeObject } from '../objects/iframe.class';
import { UpdrawAgentActionError } from './agent-action-error.class';

/** The parts of an UpdrawAgent the tools use. */
const createFakeAgent = () => ({
  isAdded: true,
  perform: jest.fn().mockResolvedValue({ completed: true, objectIds: ['new-1'] }),
  observe: jest.fn().mockResolvedValue({ objects: [], totalObjects: 0 }),
  _whenIdle: jest.fn().mockResolvedValue(undefined),
  _describeObjects: jest.fn((ids: string[]) => ids.map(id => ({ id, type: 'shape', x: 0, y: 0, width: 10, height: 10 }))),
});

const tool = (agent: ReturnType<typeof createFakeAgent>, name: string, options = {}) => {
  const found = createAgentTools(agent as any, options).find(candidate => candidate.name === name);
  if (!found) throw new Error(`no tool ${name}`);
  return found;
};

const run = async (agent: ReturnType<typeof createFakeAgent>, name: string, input: unknown, context?: any) => JSON.parse(await tool(agent, name).run(input, context));

describe('agent tools', () => {
  let agent: ReturnType<typeof createFakeAgent>;

  beforeEach(() => {
    agent = createFakeAgent();
  });

  it('offers observe_canvas and one tool per action, filtered by only and renamed by prefix', () => {
    const names = createAgentTools(agent as any).map(candidate => candidate.name);
    expect(names).toEqual(
      expect.arrayContaining(['observe_canvas', 'create_shape', 'move_object', 'connect', 'set_style', 'undo', 'redo', 'delete_objects']),
    );
    expect(names).not.toContain('add_object');

    const limited = createAgentTools(agent as any, { only: ['observe_canvas', 'move_object'], prefix: 'updraw_' });
    expect(limited.map(candidate => candidate.name)).toEqual(['updraw_observe_canvas', 'updraw_move_object']);
  });

  it('turns the input into the action and passes the signal', async () => {
    const signal = new AbortController().signal;

    const result = await run(agent, 'create_shape', { x: 1, y: 2, width: 30, height: 40, text: 'Hi', style: { fillColor: 'red' } }, { signal });

    expect(agent.perform).toHaveBeenCalledWith({ x: 1, y: 2, width: 30, height: 40, text: 'Hi', style: { fillColor: 'red' }, type: 'createShape' }, { signal });
    expect(result).toEqual({ completed: true, objectIds: ['new-1'], objects: [{ id: 'new-1', type: 'shape', x: 0, y: 0, width: 10, height: 10 }] });
  });

  it('parses JSON strings and treats null as absent', async () => {
    await run(agent, 'move_object', JSON.stringify({ objectId: 'a', to: { x: 1, y: 2, objectId: null }, align: null }));

    expect(agent.perform).toHaveBeenCalledWith({ objectId: 'a', to: { x: 1, y: 2 }, type: 'moveObject' }, {});
  });

  it.each([
    ['not JSON', '{oops', 'Input is not valid JSON.'],
    ['not an object', [1, 2], 'Input must be an object.'],
    ['an unknown field', { objectId: 'a', to: { x: 1, y: 2 }, speed: 3 }, 'Unknown property "speed". Use objectId, to, align.'],
    ['an unknown nested field', { objectId: 'a', to: { x: 1, y: 2, z: 3 } }, 'Unknown property "to.z". Use x, y, objectId, anchor, offset.'],
    ['a missing required field', { to: { x: 1, y: 2 } }, '"objectId" is required.'],
    ['a value outside an enum', { objectId: 'a', to: { x: 1, y: 2 }, align: 'middle' }, '"align" must be one of center, top-left, top, top-right, right, bottom-right, bottom, bottom-left, left.'],
  ])('reports %s as invalid-input without acting', async (_case, input, message) => {
    const result = await run(agent, 'move_object', input);

    expect(result).toMatchObject({ completed: false, reason: 'invalid-input', message });
    expect(result.hint).toBeTruthy();
    expect(agent.perform).not.toHaveBeenCalled();
  });

  it("passes the action's own validation message on", async () => {
    const result = await run(agent, 'create_shape', { x: 0, y: 0, width: 0, height: 10 });

    expect(result).toMatchObject({ completed: false, reason: 'invalid-input', message: '"width" must be a number of at least 1.' });
  });

  it('never lets the input choose another action type', async () => {
    const result = await run(agent, 'undo', { type: 'deleteObjects' });

    expect(result.reason).toBe('invalid-input');
    expect(agent.perform).not.toHaveBeenCalled();
  });

  it('caps the length of typed text', async () => {
    const result = await JSON.parse(await tool(agent, 'create_text', { maxTextLength: 5 }).run({ x: 0, y: 0, text: 'too long' }));

    expect(result).toMatchObject({ reason: 'invalid-input' });
    expect(result.message).toContain('5 characters');
  });

  it('returns refusals with the reason, the objects and a hint', async () => {
    agent.perform.mockResolvedValue({ completed: false, reason: 'user-selected', objectIds: ['a'] });

    const result = await run(agent, 'delete_objects', { objectIds: ['a'] });

    expect(result).toEqual({
      completed: false,
      reason: 'user-selected',
      objectIds: ['a'],
      hint: 'The user is working on these objects. Leave them alone or ask the user.',
    });
  });

  it('reports refusals inside agent.task() instead of throwing', async () => {
    agent.perform.mockRejectedValue(new UpdrawAgentActionError({ type: 'undo' }, { completed: false, reason: 'nothing-to-undo' }));

    await expect(run(agent, 'undo', {})).resolves.toMatchObject({ completed: false, reason: 'nothing-to-undo' });
  });

  it('reports a removed agent', async () => {
    agent.isAdded = false;

    await expect(run(agent, 'undo', {})).resolves.toMatchObject({ completed: false, reason: 'agent-removed' });
    await expect(run(agent, 'observe_canvas', {})).resolves.toMatchObject({ completed: false, reason: 'agent-removed' });
  });

  it('rethrows real errors', async () => {
    agent.perform.mockRejectedValue(new Error('boom'));

    await expect(tool(agent, 'undo').run({})).rejects.toThrow('boom');
  });

  it('observes after the queued actions finished', async () => {
    const order: string[] = [];
    agent._whenIdle.mockImplementation(async () => {
      order.push('idle');
    });
    agent.observe.mockImplementation(async (options: unknown) => {
      order.push('observe');
      return { options };
    });

    const result = await run(agent, 'observe_canvas', { scope: 'viewport', objectIds: ['a'] });

    expect(order).toEqual(['idle', 'observe']);
    expect(result).toEqual({ options: { scope: 'viewport', objectIds: ['a'] } });
  });

  it('formats results for app-defined tools', () => {
    expect(formatAgentToolResult({ completed: true, objectIds: ['x'] })).toBe('{"completed":true,"objectIds":["x"]}');
  });
  describe('for an actor working as the user', () => {
    const userActor = () => ({ ...createFakeAgent(), kind: 'user' as const });

    it('leaves out click, selection and history tools, and words observe_canvas for the user', () => {
      const tools = createActorTools(userActor() as any);
      const names = tools.map(candidate => candidate.name);
      expect(names).toEqual(expect.arrayContaining(['observe_canvas', 'create_shape', 'move_object', 'delete_objects', 'group_objects']));
      for (const excluded of ['click', 'select', 'clear_selection', 'undo', 'redo']) {
        expect(names).not.toContain(excluded);
      }
      expect(tools.find(candidate => candidate.name === 'observe_canvas')!.description).toContain('You work as the user');
      expect(tools.find(candidate => candidate.name === 'delete_objects')!.description).toContain("the user's selection follows");
      expect(createActorTools(userActor() as any, { only: ['undo', 'observe_canvas'] }).map(candidate => candidate.name)).toEqual(['observe_canvas']);
    });

    it('uses user wording in hints', async () => {
      const actor = userActor();
      actor.isAdded = false;
      const removed = JSON.parse(await createActorTools(actor as any).find(candidate => candidate.name === 'move_object')!.run({ objectId: 'a', to: { x: 1, y: 2 } }));
      expect(removed).toEqual({ completed: false, reason: 'agent-removed', hint: 'The chat session ended. Stop working.' });
    });
  });

  describe('object tools', () => {
    const names = (options = {}) => createAgentTools(agent as any, options).map(candidate => candidate.name);
    const placed = () => agent.perform.mock.calls[0][0].object;
    const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>';

    it('offers create_image (SVG only) by default and create_iframe only when asked', () => {
      expect(names()).toContain('create_image');
      expect(names()).not.toContain('create_iframe');
      expect((tool(agent, 'create_image').inputSchema.properties as any).url).toBeUndefined();
      expect((tool(agent, 'create_image', { images: { urls: true } }).inputSchema.properties as any).url).toBeDefined();
      expect(names({ images: false })).not.toContain('create_image');
      expect(names({ iframes: true })).toContain('create_iframe');
      expect(names({ iframes: true, only: ['create_iframe'], prefix: 'k_' })).toEqual(['k_create_iframe']);
    });

    it('places SVG markup as an image with the addObject action', async () => {
      const signal = new AbortController().signal;
      const result = JSON.parse(await tool(agent, 'create_image').run({ name: 'Dot', svg: SVG, x: 10, y: 20, width: 40, height: 40 }, { signal }));

      expect(agent.perform).toHaveBeenCalledWith({ type: 'addObject', object: expect.any(UpdrawImage) }, { signal });
      expect(placed()).toMatchObject({ name: 'Dot', translateX: 10, translateY: 20, width: 40, height: 40 });
      expect(placed().src).toBe(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(SVG)}`);
      expect(result).toMatchObject({ completed: true, objectIds: ['new-1'] });
    });

    it('loads images from http(s) URLs only when allowed', async () => {
      const withUrls = tool(agent, 'create_image', { images: { urls: true } });
      await withUrls.run({ url: 'https://example.com/cat.png', x: 0, y: 0 });
      expect(placed().src).toBe('https://example.com/cat.png');

      expect(JSON.parse(await withUrls.run({ url: 'javascript:alert(1)', x: 0, y: 0 }))).toMatchObject({ completed: false, reason: 'invalid-input' });
      expect(JSON.parse(await tool(agent, 'create_image').run({ url: 'https://example.com/cat.png', x: 0, y: 0 }))).toMatchObject({
        completed: false,
        reason: 'invalid-input',
        message: expect.stringContaining('Unknown property "url"'),
      });
      expect(agent.perform).toHaveBeenCalledTimes(1);
    });

    it.each([
      [{ x: 0, y: 0 }, '"svg" is required'],
      [{ svg: '<div>not svg</div>', x: 0, y: 0 }, 'must be SVG markup'],
      [{ svg: SVG, x: 'left', y: 0 }, '"x" must be a number'],
      [{ svg: SVG, x: 0, y: 0, width: 10 }, 'width and height together'],
      [{ svg: SVG, x: 0, y: 0, width: -1, height: 10 }, '"width" must be greater than 0'],
    ])('rejects invalid image input %j', async (input, message) => {
      const result = JSON.parse(await tool(agent, 'create_image').run(input));
      expect(result).toMatchObject({ completed: false, reason: 'invalid-input', message: expect.stringContaining(message) });
      expect(agent.perform).not.toHaveBeenCalled();
    });

    it('reports an image that could not be loaded', async () => {
      agent.perform.mockRejectedValueOnce(new Error('Failed to load image source (HTTP 404)'));
      const result = JSON.parse(await tool(agent, 'create_image').run({ svg: SVG, x: 0, y: 0 }));
      expect(result).toMatchObject({ completed: false, reason: 'invalid-input', message: expect.stringContaining('HTTP 404') });
    });

    it('places model code as an iframe sandboxed to scripts with a policy that blocks the network', async () => {
      const iframeTool = tool(agent, 'create_iframe', { iframes: true });
      const result = JSON.parse(
        await iframeTool.run({ name: 'Counter', html: '<button>+</button>', css: 'button{}', script: 'let n = 0;', x: 5, y: 6, width: 200, height: 100 }),
      );

      expect(agent.perform).toHaveBeenCalledWith({ type: 'addObject', object: expect.any(UpdrawIframeObject) }, {});
      const iframe = placed() as UpdrawIframeObject;
      expect(iframe).toMatchObject({ name: 'Counter', title: 'Counter', translateX: 5, translateY: 6, width: 200, height: 100 });
      expect(iframe.content).toEqual({ html: '<button>+</button>', css: 'button{}', script: 'let n = 0;' });
      expect(iframe.sandbox).toEqual(['allow-scripts']);
      expect(iframe.contentSecurityPolicy).toBe(MODEL_IFRAME_CONTENT_SECURITY_POLICY);
      expect(MODEL_IFRAME_CONTENT_SECURITY_POLICY).toContain("default-src 'none'");
      expect(result).toMatchObject({ completed: true, objectIds: ['new-1'] });

      expect(JSON.parse(await iframeTool.run({ name: 'x', x: 0, y: 0, width: 1, height: 1 }))).toMatchObject({
        completed: false,
        message: expect.stringContaining('"html" is required'),
      });
    });
  });

  it('performs instantly with the instant option', async () => {
    const instantTool = createAgentTools(agent as any, { instant: true }).find(candidate => candidate.name === 'move_object')!;
    await instantTool.run({ objectId: 'a', to: { x: 1, y: 2 } });
    expect(agent.perform).toHaveBeenCalledWith({ objectId: 'a', to: { x: 1, y: 2 }, type: 'moveObject' }, { instant: true });
  });
});
