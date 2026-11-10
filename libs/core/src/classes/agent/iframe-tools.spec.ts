import { createActorTools } from './agent-tools';
import { createModelIframe } from './canvas-tool-definitions';

/** read_iframe and update_iframe with a fake actor: input checks and the edits, before the action runs. */

const createActor = () => {
  const widget = createModelIframe({ name: 'W', html: '<b>a</b><b>a</b>', css: 'p {}', script: 'go();' });
  const core = { store: { objects: { isReady: true, findById: (id: string) => (id === widget.id ? widget : null) } } };
  const actor = {
    kind: 'agent' as const,
    isAdded: true,
    _owner: core,
    perform: jest.fn().mockResolvedValue({ completed: true, objectIds: [widget.id] }),
    observe: jest.fn(),
    _whenIdle: jest.fn().mockResolvedValue(undefined),
    _describeObjects: jest.fn(() => []),
  };
  return { actor, widget };
};

const run = async (actor: ReturnType<typeof createActor>['actor'], name: string, input: unknown) =>
  JSON.parse(await createActorTools(actor as any, { iframes: true }).find(tool => tool.name === name)!.run(input));

describe('iframe tools', () => {
  it('are offered only with iframes', () => {
    const names = (iframes: boolean) => createActorTools(createActor().actor as any, { iframes }).map(tool => tool.name);
    expect(names(true)).toEqual(expect.arrayContaining(['read_iframe', 'update_iframe']));
    expect(names(false)).not.toContain('read_iframe');
    expect(names(false)).not.toContain('update_iframe');
  });

  it('turns edits into the new code of the edited parts only', async () => {
    const { actor, widget } = createActor();
    const answer = await run(actor, 'update_iframe', {
      objectId: widget.id,
      edits: [
        { part: 'script', find: 'go', replace: 'start' },
        { part: 'html', find: '</b><b>', replace: '</b> <b>' },
      ],
    });
    expect(answer).toMatchObject({ completed: true });
    expect(actor.perform).toHaveBeenCalledWith({ type: 'updateIframe', objectId: widget.id, html: '<b>a</b> <b>a</b>', css: 'p {}', script: 'start();' }, {});
  });

  it('rejects edits that do not match exactly once, without acting', async () => {
    const { actor, widget } = createActor();
    expect(await run(actor, 'update_iframe', { objectId: widget.id, edits: [{ part: 'html', find: '<b>a</b>', replace: '' }] })).toMatchObject({
      reason: 'invalid-input',
      message: 'edits[0].find occurs 2 times in the html. Include more surrounding code so it occurs once.',
    });
    expect(await run(actor, 'update_iframe', { objectId: widget.id, edits: [{ part: 'css', find: 'div', replace: '' }] })).toMatchObject({
      reason: 'invalid-input',
      message: 'edits[0].find does not occur in the css. Call read_iframe to see the current code.',
    });
    expect(await run(actor, 'update_iframe', { objectId: widget.id, css: '', edits: [{ part: 'css', find: 'p', replace: 'q' }] })).toMatchObject({
      reason: 'invalid-input',
    });
    expect(await run(actor, 'update_iframe', { objectId: widget.id })).toMatchObject({ reason: 'invalid-input' });
    expect(await run(actor, 'update_iframe', { objectId: widget.id, name: ' ' })).toMatchObject({ reason: 'invalid-input' });
    expect(await run(actor, 'update_iframe', { objectId: widget.id, html: 'x'.repeat(200_001) })).toMatchObject({ reason: 'invalid-input' });
    expect(actor.perform).not.toHaveBeenCalled();
  });

  it('refuses unknown objects', async () => {
    const { actor } = createActor();
    expect(await run(actor, 'update_iframe', { objectId: 'nope', html: '' })).toMatchObject({ completed: false, reason: 'invalid-target', objectIds: ['nope'] });
    expect(await run(actor, 'read_iframe', { objectId: 'nope' })).toMatchObject({ completed: false, reason: 'invalid-target' });
  });
});
