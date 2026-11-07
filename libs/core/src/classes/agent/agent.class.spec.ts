import { KritzelObjectMap } from '../structures/object-map.structure';
import { KritzelAgenticCursorManager } from '../managers/agentic-cursor.manager';
import { KritzelAgenticActionManager } from '../managers/agentic-action.manager';
import { KritzelAgentManager } from '../managers/agent.manager';
import { KritzelAnchorManager } from '../managers/anchor.manager';
import { KritzelShape } from '../objects/shape.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelGroup } from '../objects/group.class';
import { KritzelAgent, isKritzelAgent } from './agent.class';
import { KritzelAgentActionError } from './agent-action-error.class';
import type { KritzelCore } from '../core/core.class';

// A KritzelAgent on a real Yjs object map with real object classes and the real agentic managers.

jest.mock('../../configs/default-sync.config', () => ({ DEFAULT_SYNC_CONFIG: { providers: [] } }));
jest.mock('../../helpers/migration.helper', () => ({ runMigrations: jest.fn() }));

/** Same-realm deep clone: Yjs rejects objects from Jest's structuredClone realm. */
const sameRealmClone = (value: any): any => {
  if (Array.isArray(value)) return value.map(sameRealmClone);
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      if (value[key] !== undefined) result[key] = sameRealmClone(value[key]);
    }
    return result;
  }
  return value;
};

let originalStructuredClone: typeof structuredClone;
beforeAll(() => {
  originalStructuredClone = globalThis.structuredClone;
  (globalThis as any).structuredClone = sameRealmClone;
});
afterAll(() => {
  (globalThis as any).structuredClone = originalStructuredClone;
});

const flushMicrotasks = async () => {
  for (let i = 0; i < 30; i++) {
    await Promise.resolve();
  }
};

interface Harness {
  core: any;
  map: KritzelObjectMap<any>;
}

describe('KritzelAgent', () => {
  let now: number;
  let harnesses: Harness[];
  let core: any;
  let map: KritzelObjectMap<any>;

  const createHarness = async (user?: { id: string }): Promise<Harness> => {
    const state = {
      scale: 1,
      translateX: 0,
      translateY: 0,
      viewportWidth: 2000,
      viewportHeight: 2000,
      lockDrawingScale: true,
      activeWorkspace: { id: 'ws' },
      debugInfo: {},
      isDragging: false,
      isResizing: false,
      isRotating: false,
      isSelecting: false,
      isDrawing: false,
      isErasing: false,
      isLineHandleDragging: false,
      isResizeHandleSelected: false,
      isRotationHandleSelected: false,
      isLineHandleSelected: false,
    };
    const harness = { core: null as any, map: new KritzelObjectMap<any>() };
    const fakeCore: any = {
      user,
      editorId: undefined,
      rerender: jest.fn(),
      store: {
        state,
        get objects() {
          return harness.map;
        },
        get currentZIndex() {
          return harness.map.allObjects().length;
        },
        get allObjects() {
          return harness.map.allObjects();
        },
        selectionGroup: null,
        invalidateSelectionCache: jest.fn(),
      },
      objectConfigManager: { isResizable: jest.fn(() => true), isRotatable: jest.fn(() => true) },
      objectTitlebarManager: { editingTitle: null, isEnabled: false },
      toolRegistry: { getToolByIndex: () => null },
      engine: {
        emitObjectsChange: jest.fn(),
        emitObjectsAdded: jest.fn(),
        emitObjectsRemoved: jest.fn(),
        emitObjectsUpdated: jest.fn(),
        emitObjectsInViewportChange: jest.fn(),
      },
      addObject: (object: any) => harness.map.insert(object),
      removeObject: (object: any) => harness.map.remove((o: any) => o.id === object.id),
    };
    fakeCore.anchorManager = new KritzelAnchorManager(fakeCore);
    await harness.map.initialize(fakeCore as unknown as KritzelCore, 'ws', { providers: [] });
    fakeCore.agenticCursorManager = new KritzelAgenticCursorManager(fakeCore);
    fakeCore.agenticActionManager = new KritzelAgenticActionManager(fakeCore);
    fakeCore.agentManager = new KritzelAgentManager(fakeCore);
    harness.core = fakeCore;
    harnesses.push(harness);
    return harness;
  };

  const settle = async <T>(promise: Promise<T>, maxFrames = 600): Promise<T> => {
    let done = false;
    promise.then(
      () => (done = true),
      () => (done = true),
    );
    await flushMicrotasks();
    for (let i = 0; i < maxFrames && !done; i++) {
      await step();
    }
    return promise;
  };

  const step = async () => {
    now += 16;
    harnesses.forEach(harness => harness.core.agenticCursorManager.tick(now));
    await flushMicrotasks();
  };

  const addShape = (x: number, y: number, width = 100, height = 50) => {
    const shape = KritzelShape.create(core, { x, y, translateX: 0, translateY: 0, width, height, scale: 1 });
    map.insert(shape);
    map.stopUndoCapturing();
    return shape;
  };

  const add = (agent: KritzelAgent): KritzelAgent => core.agentManager.add(agent);

  /** Selects objects as the local user (a synced selection group of this client). */
  const selectAsUser = (objectIds: string[]) => {
    const group = Object.create(KritzelSelectionGroup.prototype);
    const fields: Record<string, unknown> = {
      objectIds,
      id: `sg-${Math.round(Math.random() * 1e9)}`,
      clientId: map.docClientId ?? undefined,
      userId: undefined,
      rotatedBoundingBox: { x: 0, y: 0, z: 1, width: 1, height: 1 },
      serialize: () => ({ __class__: 'MockSelection', id: group.id }),
      invalidateObjectsCache: jest.fn(),
      refreshObjectDimensions: jest.fn(),
      captureUnchangedSnapshots: jest.fn(),
    };
    for (const [key, value] of Object.entries(fields)) {
      Object.defineProperty(group, key, { value, writable: true, configurable: true, enumerable: true });
    }
    map.insert(group);
    map.stopUndoCapturing();
  };

  beforeEach(async () => {
    now = 1000;
    jest.spyOn(performance, 'now').mockImplementation(() => now);
    harnesses = [];
    ({ core, map } = await createHarness({ id: 'human' }));
  });

  afterEach(() => {
    harnesses.forEach(harness => {
      harness.core.agentManager.clear();
      harness.core.agenticActionManager.cleanup();
      harness.core.agenticCursorManager.clear();
      harness.map.destroy();
    });
    jest.restoreAllMocks();
  });

  describe('identity', () => {
    it('requires a name and derives id, color and the IKritzelUser aliases', () => {
      expect(() => new KritzelAgent({ name: '' })).toThrow(TypeError);

      const agent = new KritzelAgent({ name: 'Planner', avatarUrl: '/bot.png' });

      expect(agent.id).toMatch(/^agent-[0-9a-zA-Z]{12}$/);
      expect(agent.kind).toBe('agent');
      expect(agent.displayName).toBe('Planner');
      expect(agent.profileImageUrl).toBe('/bot.png');
      expect(agent.color).toMatch(/^(#|hsl|rgb)/);
      expect(agent.broadcast).toBe(true);
      expect(isKritzelAgent(agent)).toBe(true);
      expect(isKritzelAgent({ id: 'x', kind: 'agent' })).toBe(false);
    });

    it('opts out of Vue reactivity', () => {
      expect((new KritzelAgent({ name: 'A' }) as any).__v_skip).toBe(true);
    });
  });

  describe('before it is added', () => {
    it('rejects actions and moves with a hint', async () => {
      const agent = new KritzelAgent({ name: 'A' });

      await expect(agent.perform({ type: 'clearSelection' })).rejects.toThrow('editor.addAgent(agent)');
      await expect(agent.moveTo({ x: 0, y: 0 })).rejects.toThrow('not added');
      expect(agent.state).toMatchObject({ isAdded: false, position: null, queueLength: 0 });
    });

    it('keeps the status and visibility for when it is added', () => {
      const agent = new KritzelAgent({ name: 'A', position: { x: 10, y: 20 } });
      agent.setStatus('Warming up');
      agent.hide();

      core.agentManager.add(agent);

      expect(agent.state).toMatchObject({ isAdded: true, status: 'Warming up', visible: false, position: { x: 10, y: 20 } });
      expect(core.agenticCursorManager.get(agent.id)).toMatchObject({ name: 'A', color: agent.color, status: 'Warming up' });
    });
  });

  describe('agent manager', () => {
    it('ignores adding the same agent twice and refuses a second agent with the same ID', () => {
      const agent = new KritzelAgent({ id: 'a', name: 'A' });

      expect(core.agentManager.add(agent)).toBe(agent);
      expect(core.agentManager.add(agent)).toBe(agent);
      expect(() => core.agentManager.add(new KritzelAgent({ id: 'a', name: 'B' }))).toThrow('already added');
      expect(() => core.agentManager.add({ id: 'x' })).toThrow(TypeError);
      expect(core.agentManager.getAll()).toEqual([agent]);
    });

    it('refuses an agent of another connected editor, but takes one over from a disconnected editor', async () => {
      const other = await createHarness();
      const agent = new KritzelAgent({ name: 'A' });
      const removed = jest.fn();
      agent.on('removed', removed);
      other.core.agentManager.add(agent);

      expect(() => core.agentManager.add(agent)).toThrow('another editor');

      other.core.agentManager.setDisposed(true);
      core.agentManager.add(agent);

      expect(removed).toHaveBeenCalledTimes(1);
      expect(other.core.agenticCursorManager.get(agent.id)).toBeNull();
      expect(other.core.agentManager.get(agent.id)).toBeNull();
      expect(core.agenticCursorManager.get(agent.id)).not.toBeNull();
      expect(agent._owner).toBe(core);
    });

    it('rolls back the running action when the agent is removed, and the agent can be added again', async () => {
      const shape = addShape(0, 0);
      const agent = add(new KritzelAgent({ name: 'A', position: { x: 0, y: 0 } }));
      const removed = jest.fn();
      agent.on('removed', removed);

      const move = agent.moveObject(shape.id, { x: 600, y: 0 });
      for (let i = 0; i < 60 && map.findById(shape.id).translateX < 50; i++) await step();
      core.agentManager.remove(agent);

      await expect(settle(move)).resolves.toMatchObject({ completed: false, reason: 'agent-removed' });
      expect(map.findById(shape.id).translateX).toBe(0);
      expect(removed).toHaveBeenCalledTimes(1);
      expect(agent.isAdded).toBe(false);
      expect(core.agenticCursorManager.get(agent.id)).toBeNull();

      core.agentManager.add(agent);
      expect(agent.isAdded).toBe(true);
    });

    it('starts at the viewport center when its start object is gone, when added again or taken over', async () => {
      const shape = addShape(0, 0);
      const agent = add(new KritzelAgent({ name: 'A', position: { objectId: shape.id, anchor: 'top-left' } }));
      expect(agent.state.attachedTo).toMatchObject({ objectId: shape.id });

      core.agentManager.remove(agent);
      map.remove((object: any) => object.id === shape.id);
      core.agentManager.add(agent);
      expect(agent.isAdded).toBe(true);
      expect(agent.state).toMatchObject({ attachedTo: null, position: { x: 1000, y: 1000 } });

      // An object without a position (an empty group) is ignored too.
      const empty = new KritzelGroup();
      map.insert(empty);
      map.stopUndoCapturing();
      const atEmpty = add(new KritzelAgent({ name: 'B', position: { objectId: empty.id } }));
      expect(atEmpty.state.position).toEqual({ x: 1000, y: 1000 });

      // Taken over by an editor whose document never had the object.
      const other = await createHarness();
      core.agentManager.setDisposed(true);
      other.core.agentManager.add(agent);
      expect(agent._owner).toBe(other.core);
      expect(core.agentManager.get(agent.id)).toBeNull();
    });

    it('notifies changes once per microtask and lists presences', async () => {
      const listener = jest.fn();
      core.agentManager.onChange(listener);
      const agent = add(new KritzelAgent({ id: 'a', name: 'A', avatarUrl: '/a.png' }));
      agent.setStatus('Busy');
      agent.hide();
      await flushMicrotasks();

      expect(listener).toHaveBeenCalledTimes(1);
      expect(core.agentManager.getPresences()).toEqual([
        {
          id: 'a',
          kind: 'agent',
          name: 'A',
          displayName: 'A',
          color: agent.color,
          avatarUrl: '/a.png',
          profileImageUrl: '/a.png',
          status: 'Busy',
          visible: false,
          activeAction: null,
          queueLength: 0,
          isRemote: false,
        },
      ]);
    });
  });

  describe('actions', () => {
    it('creates objects as itself, not as the local user, and undoes them in its own history', async () => {
      const agent = add(new KritzelAgent({ id: 'writer', name: 'Writer' }));

      const result = await settle(agent.createShape({ x: 0, y: 0, width: 120, height: 60, text: 'Hi' }, { instant: true }));

      expect(result.completed).toBe(true);
      const shape = map.findById(result.objectIds![0]);
      expect(shape.userId).toBe('writer');
      expect(agent.state.canUndo).toBe(true);
      expect(core.engine.emitObjectsAdded).toHaveBeenCalledWith([shape], { type: 'agent', agentId: 'writer', actionType: 'createShape' });

      await expect(settle(agent.undo({ instant: true }))).resolves.toMatchObject({ completed: true });
      expect(map.findById(shape.id)).toBeUndefined();
      expect(agent.state).toMatchObject({ canUndo: false, canRedo: true });
    });

    it('maps the shortcuts onto actions with the default speed', async () => {
      const shape = addShape(0, 0);
      const agent = add(new KritzelAgent({ name: 'A', speed: 900 }));
      const perform = jest.spyOn(core.agenticActionManager, 'perform');

      await settle(agent.moveObject(shape.id, { x: 300, y: 0 }, { align: 'top-left', instant: true }));
      await settle(agent.select([shape.id], { additive: true, instant: true }));

      expect(perform).toHaveBeenNthCalledWith(1, agent.id, { type: 'moveObject', objectId: shape.id, to: { x: 300, y: 0 }, align: 'top-left' }, { instant: true, speed: 900 });
      expect(perform).toHaveBeenNthCalledWith(2, agent.id, { type: 'select', objectIds: [shape.id], additive: true }, { instant: true, speed: 900 });
      expect(agent.state.selection).toEqual([shape.id]);
    });
  });

  describe('cancel', () => {
    it('rolls back the running action, drops the queued ones and keeps the selection', async () => {
      const [a, b] = [addShape(0, 0), addShape(0, 200)];
      const agent = add(new KritzelAgent({ name: 'A', position: { x: 0, y: 0 } }));
      await settle(agent.select([b.id], { instant: true }));

      const running = agent.moveObject(a.id, { x: 600, y: 0 });
      const queued = agent.moveObject(a.id, { x: 0, y: 600 });
      for (let i = 0; i < 60 && map.findById(a.id).translateX < 50; i++) await step();
      agent.cancel();

      await expect(settle(running)).resolves.toEqual({ completed: false, reason: 'aborted' });
      await expect(settle(queued)).resolves.toEqual({ completed: false, reason: 'aborted' });
      expect(map.findById(a.id).translateX).toBe(0);
      expect(agent.state).toMatchObject({ activeAction: null, queueLength: 0, selection: [b.id] });

      await expect(settle(agent.moveObject(a.id, { x: 50, y: 0 }, { instant: true }))).resolves.toMatchObject({ completed: true });
    });
  });

  describe('task', () => {
    it('shows the label while it runs and restores the status afterwards', async () => {
      const agent = add(new KritzelAgent({ name: 'A', status: 'Idle' }));
      let during: string | null = null;

      const result = await agent.task('Tidying up', async () => {
        during = agent.state.status;
        return 42;
      });

      expect(result).toBe(42);
      expect(during).toBe('Tidying up');
      expect(agent.state.status).toBe('Idle');
    });

    it('throws KritzelAgentActionError on the first action that does not complete', async () => {
      const shape = addShape(0, 0);
      selectAsUser([shape.id]);
      const agent = add(new KritzelAgent({ name: 'A' }));
      const after = jest.fn();

      const task = agent.task('Moving', async () => {
        await agent.moveObject(shape.id, { x: 300, y: 0 }, { instant: true });
        after();
      });

      const error: any = await settle(task).catch(e => e);
      expect(error).toBeInstanceOf(KritzelAgentActionError);
      expect(error).toMatchObject({ reason: 'user-selected', objectIds: [shape.id] });
      expect(error.action).toMatchObject({ type: 'moveObject' });
      expect(after).not.toHaveBeenCalled();
      // Outside a task, results are returned again.
      await expect(settle(agent.moveObject(shape.id, { x: 300, y: 0 }, { instant: true }))).resolves.toMatchObject({ reason: 'user-selected' });
    });

    it('refuses a second task while one runs', async () => {
      const agent = add(new KritzelAgent({ name: 'A' }));
      let release!: () => void;
      const first = agent.task('One', () => new Promise<void>(resolve => (release = resolve)));

      await expect(agent.task('Two', async () => undefined)).rejects.toThrow('already running a task');
      release();
      await first;
    });

    it('leaves actions started before the task, or by a task that has ended, alone', async () => {
      const shape = addShape(0, 0);
      selectAsUser([shape.id]);
      const agent = add(new KritzelAgent({ name: 'A' }));

      // Started before the task, ends while it runs: resolves with the result.
      const before = agent.moveObject(shape.id, { x: 300, y: 0 });
      let release!: () => void;
      const task = agent.task('Waiting', () => new Promise<void>(resolve => (release = resolve)));
      await expect(settle(before)).resolves.toMatchObject({ completed: false, reason: 'user-selected' });

      release();
      await task;
      await expect(settle(agent.undo())).resolves.toMatchObject({ completed: false, reason: 'nothing-to-undo' });
    });

    it('stops at the next action after cancel()', async () => {
      const shape = addShape(0, 0);
      const agent = add(new KritzelAgent({ name: 'A', position: { x: 0, y: 0 } }));
      const steps: string[] = [];

      const task = agent.task('Script', async () => {
        await agent.moveObject(shape.id, { x: 100, y: 0 }, { instant: true });
        steps.push('first');
        agent.cancel();
        await agent.moveObject(shape.id, { x: 200, y: 0 }, { instant: true });
        steps.push('second');
      });

      await expect(settle(task)).rejects.toMatchObject({ reason: 'aborted' });
      expect(steps).toEqual(['first']);
      expect(map.findById(shape.id).translateX).toBe(50); // centered on x 100, the second move never ran
    });
  });

  describe('events', () => {
    it('emits interrupted when the user takes over the objects mid-action', async () => {
      const shape = addShape(0, 0);
      const agent = add(new KritzelAgent({ name: 'A', position: { x: 0, y: 0 } }));
      const interrupted = jest.fn();
      agent.on('interrupted', interrupted);

      const move = agent.moveObject(shape.id, { x: 650, y: 25 });
      for (let i = 0; i < 60 && map.findById(shape.id).translateX < 50; i++) await step();
      selectAsUser([shape.id]);
      await settle(move);

      expect(interrupted).toHaveBeenCalledTimes(1);
      expect(interrupted).toHaveBeenCalledWith({
        action: expect.objectContaining({ type: 'moveObject' }),
        reason: 'user-selected',
        objectIds: [shape.id],
        keptChanges: true,
      });
    });

    it('does not emit interrupted for refusals before the action started', async () => {
      const shape = addShape(0, 0);
      selectAsUser([shape.id]);
      const agent = add(new KritzelAgent({ name: 'A' }));
      const interrupted = jest.fn();
      agent.on('interrupted', interrupted);

      await settle(agent.moveObject(shape.id, { x: 300, y: 0 }, { instant: true }));

      expect(interrupted).not.toHaveBeenCalled();
    });

    it('emits change for state changes but not for plain motion', async () => {
      const agent = add(new KritzelAgent({ name: 'A', position: { x: 0, y: 0 } }));
      const change = jest.fn();
      agent.on('change', change);

      agent.setStatus('Thinking');
      expect(change).toHaveBeenCalledTimes(1);
      expect(change.mock.calls[0][0]).toMatchObject({ status: 'Thinking' });

      const move = agent.moveTo({ x: 500, y: 0 });
      await step();
      const callsWhileMoving = change.mock.calls.length;
      await step();
      await step();
      expect(change.mock.calls.length).toBe(callsWhileMoving);
      await settle(move);
      expect(change.mock.calls.at(-1)![0]).toMatchObject({ isMoving: false });
    });

    it('emits change when added and removed, and for setters before it is added', async () => {
      const agent = new KritzelAgent({ name: 'A' });
      const change = jest.fn();
      agent.on('change', change);

      agent.setStatus('Ready');
      agent.hide();
      agent.name = 'B';
      expect(change.mock.calls.map(([state]) => [state.status, state.visible])).toEqual([
        ['Ready', true],
        ['Ready', false],
        ['Ready', false],
      ]);

      add(agent);
      expect(change.mock.calls.at(-1)![0]).toMatchObject({ isAdded: true, status: 'Ready', visible: false });

      core.agentManager.remove(agent);
      expect(change.mock.calls.at(-1)![0]).toMatchObject({ isAdded: false, canUndo: false });
    });

    it('reports canUndo again when the history is cleared or the workspace map is destroyed', async () => {
      const agent = add(new KritzelAgent({ name: 'A' }));
      const change = jest.fn();
      agent.on('change', change);
      await settle(agent.createShape({ x: 0, y: 0, width: 120, height: 60 }, { instant: true }));
      expect(change.mock.calls.at(-1)![0]).toMatchObject({ canUndo: true });

      map.clearHistory();
      expect(change.mock.calls.at(-1)![0]).toMatchObject({ canUndo: false });

      await settle(agent.createShape({ x: 200, y: 0, width: 120, height: 60 }, { instant: true }));
      expect(change.mock.calls.at(-1)![0]).toMatchObject({ canUndo: true });
      map.destroy();
      await flushMicrotasks();
      expect(change.mock.calls.at(-1)![0]).toMatchObject({ canUndo: false });
    });

    it('emits detached after detach()', async () => {
      const shape = addShape(0, 0);
      const agent = add(new KritzelAgent({ name: 'A' }));
      const detached = jest.fn();
      agent.on('detached', detached);

      await settle(agent.moveTo({ objectId: shape.id }));
      agent.detach();

      expect(detached).toHaveBeenCalledWith({ objectId: shape.id, reason: 'manual' });
      expect(agent.state.attachedTo).toBeNull();
    });
  });
  describe('tools and observe', () => {
    const toolOf = (agent: KritzelAgent, name: string) => agent.tools().find(candidate => candidate.name === name)!;
    const call = async (agent: KritzelAgent, name: string, input: unknown) => {
      const promise = toolOf(agent, name).run(input);
      return JSON.parse(await settle(promise));
    };

    it('builds a flowchart through tool calls, sees it with observe_canvas and undoes a step', async () => {
      const agent = add(new KritzelAgent({ id: 'claude', name: 'Claude', speed: 100000 }));

      const start = await call(agent, 'create_shape', { x: 0, y: 0, width: 120, height: 60, text: 'Start', shapeType: 'ellipse' });
      const end = await call(agent, 'create_shape', { x: 300, y: 0, width: 120, height: 60, text: 'End', style: { fillColor: '#dcfce7' } });
      const line = await call(agent, 'connect', { from: start.objectIds[0], to: end.objectIds[0], style: { strokeColor: '#475569' } });

      expect(start).toMatchObject({ completed: true, objects: [{ type: 'shape', shapeType: 'ellipse', text: 'Start', createdBy: 'claude' }] });
      expect(line).toMatchObject({ completed: true, objects: [{ type: 'line', from: start.objectIds[0], to: end.objectIds[0] }] });

      const snapshot = await call(agent, 'observe_canvas', {});
      expect(snapshot.agent).toMatchObject({ id: 'claude', selection: [] });
      expect(snapshot.totalObjects).toBe(3);
      expect(snapshot.objects.map((object: any) => object.type)).toEqual(['shape', 'shape', 'line']);
      expect(snapshot.objects[1]).toMatchObject({ text: 'End', style: { fillColor: '#dcfce7' } });

      await expect(call(agent, 'undo', {})).resolves.toMatchObject({ completed: true });
      expect((await agent.observe()).totalObjects).toBe(2);
    });

    it('reports refusals as results the model can act on', async () => {
      const shape = addShape(0, 0);
      selectAsUser([shape.id]);
      const agent = add(new KritzelAgent({ name: 'Claude' }));

      await expect(call(agent, 'move_object', { objectId: shape.id, to: { x: 400, y: 0 } })).resolves.toMatchObject({
        completed: false,
        reason: 'user-selected',
        objectIds: [shape.id],
      });
      const snapshot = await agent.observe();
      expect(snapshot.userSelection).toEqual([shape.id]);
      expect(snapshot.objects.find(object => object.id === shape.id)?.busy).toBe('user');
    });

    it('keeps the objects that matter when the board is too big, children only with their group', async () => {
      const shapes = Array.from({ length: 6 }, (_, index) => addShape(index * 5000, 0, 50, 50));
      const agent = add(new KritzelAgent({ name: 'Claude' }));
      await settle(agent.select([shapes[5].id], { instant: true }));

      const snapshot = await agent.observe({ maxObjects: 2, maxTextLength: 10 });

      expect(snapshot.truncated).toBe(true);
      expect(snapshot.totalObjects).toBe(6);
      expect(snapshot.objects.map(object => object.id)).toContain(shapes[5].id);
      expect(snapshot.objects).toHaveLength(2);
    });

    it('keeps a visible child with its group even when the child comes up before the group', async () => {
      // Viewport 0..2000: a is at its center, b (a's sibling) and d are off-screen, c is visible.
      const a = addShape(950, 975, 50, 50);
      const b = addShape(2950, 975, 50, 50);
      const c = addShape(1400, 975, 50, 50);
      addShape(9000, 9000, 50, 50);
      const group = KritzelGroup.createFromObjects(core, [a, b]);
      map.insert(group);
      map.stopUndoCapturing();
      const agent = add(new KritzelAgent({ name: 'Claude' }));

      const snapshot = await agent.observe({ maxObjects: 3 });

      expect(snapshot.totalObjects).toBe(5);
      expect(snapshot.objects.map(object => object.id).sort()).toEqual([a.id, c.id, group.id].sort());
    });

    it('observe_canvas answers agent-removed when the agent is removed while its actions finish', async () => {
      const shape = addShape(0, 0);
      const agent = add(new KritzelAgent({ name: 'Claude', position: { x: 0, y: 0 } }));
      const move = toolOf(agent, 'move_object').run({ objectId: shape.id, to: { x: 600, y: 0 } });
      const observe = toolOf(agent, 'observe_canvas').run({});
      await step();

      core.agentManager.remove(agent);

      expect(JSON.parse(await settle(move))).toMatchObject({ completed: false, reason: 'agent-removed' });
      expect(JSON.parse(await settle(observe))).toMatchObject({ completed: false, reason: 'agent-removed' });
    });

    it('rejects observe while the agent is not added', async () => {
      await expect(new KritzelAgent({ name: 'A' }).observe()).rejects.toThrow('not added');
    });
  });
});
