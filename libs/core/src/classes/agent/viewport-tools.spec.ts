import { createActorTools } from './agent-tools';
import type { KritzelAgentToolsOptions } from '../../interfaces/agent.interface';
import { KritzelViewport } from '../core/viewport.class';

/** The viewport tools on a real KritzelViewport of a minimal core: 1000×500 screen pixels at scale 1. */

const createCore = (objects: Record<string, { x: number; y: number; width: number; height: number }> = {}) => {
  const state: Record<string, any> = {
    scale: 1,
    scaleMin: 0.1,
    scaleMax: 5,
    viewportBoundaryLeft: -Infinity,
    viewportBoundaryRight: Infinity,
    viewportBoundaryTop: -Infinity,
    viewportBoundaryBottom: Infinity,
  };
  const toObject = (id: string) => (objects[id] ? { id, rotatedBoundingBox: objects[id] } : null);
  const core: any = {
    store: {
      state,
      objects: { isReady: true, findById: (id: string) => toObject(id) },
      get allNonSelectionObjects() {
        return Object.keys(objects).map(toObject);
      },
    },
    rerender: jest.fn(),
    updateWorkspaceViewport: jest.fn(),
  };
  const host = { clientWidth: 1000, clientHeight: 500 } as unknown as HTMLElement;
  core.engine = { viewport: new KritzelViewport(core, host) };
  return core;
};

const createActor = (core: any, kind: 'agent' | 'user' = 'user') => ({
  kind,
  isAdded: true,
  _owner: core,
  perform: jest.fn(),
  observe: jest.fn(),
  _whenIdle: jest.fn().mockResolvedValue(undefined),
  _describeObjects: jest.fn(() => []),
});

const run = async (actor: ReturnType<typeof createActor>, name: string, input: unknown, options: KritzelAgentToolsOptions = { instant: true }) => {
  const tool = createActorTools(actor as any, options).find(candidate => candidate.name === name);
  if (!tool) throw new Error(`no tool ${name}`);
  return JSON.parse(await tool.run(input));
};

describe('viewport tools', () => {
  it('are offered to agents and to actors working as the user, unless viewport is false', () => {
    for (const kind of ['agent', 'user'] as const) {
      const names = (options: KritzelAgentToolsOptions) => createActorTools(createActor(null, kind) as any, options).map(tool => tool.name);
      expect(names({})).toEqual(expect.arrayContaining(['set_viewport', 'fit_viewport']));
      expect(names({ viewport: false })).not.toContain('set_viewport');
      expect(names({ viewport: false })).not.toContain('fit_viewport');
    }
  });

  it('centers the view on a point at a zoom level', async () => {
    const core = createCore();
    const answer = await run(createActor(core), 'set_viewport', { x: 1000, y: 500, zoom: 2 });
    expect(answer).toEqual({ completed: true, viewport: { x: 750, y: 375, width: 500, height: 250, scale: 2 } });
    expect(core.store.state).toMatchObject({ scale: 2, translateX: -1500, translateY: -750 });
  });

  it('zooms in and out around the current center, and clamps the zoom', async () => {
    const core = createCore();
    const actor = createActor(core);
    await run(actor, 'set_viewport', { x: 100, y: 100 });
    expect(await run(actor, 'set_viewport', { zoomBy: 0.5 })).toMatchObject({ viewport: { x: -900, y: -400, width: 2000, height: 1000, scale: 0.5 } });
    expect(await run(actor, 'set_viewport', { zoom: 100 })).toMatchObject({ viewport: { scale: 5 } });
    expect(await run(actor, 'set_viewport', { zoomBy: 0.0001 })).toMatchObject({ viewport: { scale: 0.1 } });
  });

  it('fits objects, never zooming in past maxZoom', async () => {
    const core = createCore({ a: { x: 0, y: 0, width: 100, height: 100 }, b: { x: 900, y: 0, width: 100, height: 100 } });
    const actor = createActor(core);
    expect(await run(actor, 'fit_viewport', { objectIds: ['a'] })).toMatchObject({ viewport: { x: -450, y: -200, scale: 1 } });
    expect(await run(actor, 'fit_viewport', { objectIds: ['a'], maxZoom: 10 })).toMatchObject({ viewport: { scale: 4.545 } });
    // All objects: 1000 wide with 10% padding in 1000 pixels.
    expect(await run(actor, 'fit_viewport', {})).toMatchObject({ viewport: { scale: 0.909 } });
  });

  it('refuses unknown objects, an empty canvas and invalid input without moving the view', async () => {
    const core = createCore();
    const actor = createActor(core);
    expect(await run(actor, 'fit_viewport', { objectIds: ['nope'] })).toMatchObject({ completed: false, reason: 'invalid-target', objectIds: ['nope'] });
    expect(await run(actor, 'fit_viewport', {})).toMatchObject({ completed: false, reason: 'invalid-input' });
    expect(await run(actor, 'set_viewport', {})).toMatchObject({ completed: false, reason: 'invalid-input' });
    expect(await run(actor, 'set_viewport', { x: 1 })).toMatchObject({ completed: false, reason: 'invalid-input' });
    expect(await run(actor, 'set_viewport', { zoom: 1, zoomBy: 2 })).toMatchObject({ completed: false, reason: 'invalid-input' });
    expect(await run(actor, 'set_viewport', { zoom: -1 })).toMatchObject({ completed: false, reason: 'invalid-input' });
    expect(core.store.state).toMatchObject({ scale: 1, translateX: 0, translateY: 0 });
  });

  it('waits for the queued actions of the actor before moving the view', async () => {
    const core = createCore();
    const actor = createActor(core);
    let finish!: () => void;
    actor._whenIdle.mockReturnValue(new Promise<void>(resolve => (finish = resolve)));
    const pending = run(actor, 'set_viewport', { zoom: 2 });
    await Promise.resolve();
    expect(core.store.state.scale).toBe(1);
    finish();
    await expect(pending).resolves.toMatchObject({ completed: true });
    expect(core.store.state.scale).toBe(2);
  });

  it('animates unless instant and resolves when the animation ends', async () => {
    const frames: FrameRequestCallback[] = [];
    const raf = jest.spyOn(global, 'requestAnimationFrame').mockImplementation(callback => frames.push(callback));
    try {
      const core = createCore();
      const pending = run(createActor(core), 'set_viewport', { zoom: 2 }, {});
      for (let i = 0; i < 20 && frames.length === 0; i++) await Promise.resolve();
      expect(frames).toHaveLength(1);
      frames.shift()!(performance.now() + 10_000);
      await expect(pending).resolves.toMatchObject({ completed: true, viewport: { scale: 2 } });
    } finally {
      raf.mockRestore();
    }
  });

  it('answers agent-removed and engine-disconnected', async () => {
    const removed = { ...createActor(createCore()), isAdded: false };
    expect(await run(removed, 'set_viewport', { zoom: 2 })).toMatchObject({ completed: false, reason: 'agent-removed' });
    expect(await run(createActor(null), 'fit_viewport', {})).toMatchObject({ completed: false, reason: 'engine-disconnected' });
  });
});
