import * as Y from 'yjs';
import { KritzelObjectMap } from '../structures/object-map.structure';
import { KritzelAgenticCursorManager } from './agentic-cursor.manager';
import { KritzelAgenticActionManager } from './agentic-action.manager';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import type { KritzelCore } from '../core/core.class';
import type { KritzelAgenticActionResult } from '../../interfaces/agentic-action.interface';

/** How the test agent's cursor looks; agents own these values in the editor. */
const AGENT_APPEARANCE = { name: 'Agent', color: '#7C3AED', status: null, visible: true };

/** A persistable test object with the geometry the agentic actions use. */
class MockObject {
  translateX: number;
  translateY: number;
  width: number;
  height: number;
  rotation = 0;
  zIndex: number;
  scale = 1;
  isVisible = true;
  isSelected = false;
  markedForRemoval = false;

  constructor(public _core: any, public id: string, x = 0, y = 0, width = 100, height = 50, zIndex = 0) {
    this.translateX = x;
    this.translateY = y;
    this.width = width;
    this.height = height;
    this.zIndex = zIndex;
  }

  get boundingBox() {
    return { x: this.translateX, y: this.translateY, z: 1, width: this.width, height: this.height };
  }

  get rotatedBoundingBox() {
    return this.boundingBox;
  }

  get rotatedPolygon() {
    const { x, y, width, height } = this.boundingBox;
    return {
      topLeft: { x, y },
      topRight: { x: x + width, y },
      bottomRight: { x: x + width, y: y + height },
      bottomLeft: { x, y: y + height },
    };
  }

  hitTest() {
    return true;
  }

  move(startX: number, startY: number, endX: number, endY: number) {
    const scale = this._core.store.state.scale;
    this.translateX += (startX - endX) / scale;
    this.translateY += (startY - endY) / scale;
    this._core.store.objects.update(this);
  }

  serialize() {
    return { __class__: 'MockObject', id: this.id, translateX: this.translateX, translateY: this.translateY, width: this.width, height: this.height, zIndex: this.zIndex };
  }
}

/** A selection group with just what the map and the conflict checks use. */
function createMockSelection(objectIds: string[], clientId: number | undefined, id = `sg-${Math.round(Math.random() * 1e9)}`) {
  const group = Object.create(KritzelSelectionGroup.prototype);
  const fields: Record<string, unknown> = {
    objectIds,
    id,
    clientId,
    userId: undefined,
    rotatedBoundingBox: { x: 0, y: 0, z: 1, width: 1, height: 1 },
    serialize: () => ({ __class__: 'MockSelection', id, objectIds, clientId }),
    invalidateObjectsCache: jest.fn(),
    refreshObjectDimensions: jest.fn(),
    captureUnchangedSnapshots: jest.fn(),
    deselectAllChildren: jest.fn(),
  };
  for (const [key, value] of Object.entries(fields)) {
    Object.defineProperty(group, key, { value, writable: true, configurable: true, enumerable: true });
  }
  return group;
}

jest.mock('../core/reviver.class', () => ({
  KritzelReviver: jest.fn().mockImplementation((core: any) => ({
    revive: (data: any) => {
      if (data.__class__ === 'MockSelection') {
        return createMockSelection(data.objectIds, data.clientId, data.id);
      }
      return new MockObject(core, data.id, data.translateX, data.translateY, data.width, data.height, data.zIndex);
    },
  })),
}));
jest.mock('../../configs/default-sync.config', () => ({ DEFAULT_SYNC_CONFIG: { providers: [] } }));
jest.mock('../../helpers/migration.helper', () => ({ runMigrations: jest.fn() }));

const flushMicrotasks = async () => {
  for (let i = 0; i < 30; i++) {
    await Promise.resolve();
  }
};

describe('KritzelAgenticActionManager', () => {
  let now: number;
  let map: KritzelObjectMap<any>;
  let cursors: KritzelAgenticCursorManager;
  let actions: KritzelAgenticActionManager;
  let core: any;
  let state: any;

  const step = async (ms = 16) => {
    now += ms;
    cursors.tick(now);
    await flushMicrotasks();
  };

  /** Ticks frames until the promise settles. */
  const settle = async <T>(promise: Promise<T>, maxFrames = 400): Promise<T> => {
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

  const add = (id: string, x = 0, y = 0, width = 100, height = 50, zIndex = 0) => {
    const object = new MockObject(core, id, x, y, width, height, zIndex);
    map.insert(object as any);
    map.stopUndoCapturing();
    return object;
  };

  const obj = (id: string) => map.findById(id) as MockObject | undefined;

  /** Inserts a selection group like the selection tool does (same tab when `clientId` is the doc client ID). */
  const addSelection = (objectIds: string[], clientId: number | undefined = map.docClientId ?? undefined) => {
    const group = makeSelection(objectIds, clientId);
    map.insert(group);
    map.stopUndoCapturing();
    return group;
  };

  const makeSelection = (objectIds: string[], clientId: number | undefined = map.docClientId ?? undefined) => createMockSelection(objectIds, clientId);

  const selectionGroups = () => map.filter(o => o instanceof KritzelSelectionGroup) as any[];

  const ydoc = () => (map as unknown as { _ydoc: Y.Doc })._ydoc;

  /** Applies a change as if it came from a collaborator. */
  const applyRemote = (id: string, patch: Record<string, unknown>) => {
    const doc = ydoc();
    const peer = new Y.Doc();
    Y.applyUpdate(peer, Y.encodeStateAsUpdate(doc));
    const before = Y.encodeStateVector(peer);
    const objects = peer.getMap('objects');
    objects.set(id, { ...(objects.get(id) as object), ...patch });
    Y.applyUpdate(doc, Y.encodeStateAsUpdate(peer, before), 'peer');
    peer.destroy();
  };

  beforeEach(async () => {
    now = 1000;
    jest.spyOn(performance, 'now').mockImplementation(() => now);
    state = {
      scale: 1,
      translateX: 0,
      translateY: 0,
      viewportWidth: 800,
      viewportHeight: 600,
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
    core = {
      user: undefined,
      editorId: undefined,
      rerender: jest.fn(),
      store: {
        state,
        get objects() {
          return map;
        },
        invalidateSelectionCache: jest.fn(),
      },
      anchorManager: {
        rebuildIndex: jest.fn(),
        getLinesAnchoredTo: jest.fn().mockReturnValue([]),
        updateAnchorsForObject: jest.fn(),
        removeAnchor: jest.fn(),
      },
      objectTitlebarManager: { editingTitle: null },
      engine: {
        emitObjectsChange: jest.fn(),
        emitObjectsAdded: jest.fn(),
        emitObjectsRemoved: jest.fn(),
        emitObjectsUpdated: jest.fn(),
        emitObjectsInViewportChange: jest.fn(),
        triggerSelectionChange: jest.fn().mockResolvedValue(undefined),
      },
      // Like the core: the user's selection is a selection group in the map.
      removeSelectionGroup: jest.fn(() => {
        const ids = new Set(selectionGroups().map(group => group.id));
        if (ids.size > 0) map.remove((o: any) => ids.has(o.id));
      }),
      selectObjects: jest.fn((objects: any[]) => {
        core.removeSelectionGroup();
        map.insert(makeSelection(objects.map(object => object.id)));
      }),
      removeObject: jest.fn((object: any) => map.remove((o: any) => o.id === object.id)),
    };
    map = new KritzelObjectMap<any>();
    await map.initialize(core as unknown as KritzelCore, 'ws', { providers: [] });
    cursors = new KritzelAgenticCursorManager(core);
    core.agenticCursorManager = cursors;
    actions = new KritzelAgenticActionManager(core);
    core.agenticActionManager = actions;
    cursors.add({ appearance: AGENT_APPEARANCE, id: 'agent', position: { x: 0, y: 0 } });
  });

  afterEach(() => {
    actions.cleanup();
    cursors.cleanup();
    map.destroy();
    jest.restoreAllMocks();
  });

  describe('validation', () => {
    it('rejects unknown cursors, unknown actions and invalid actions', () => {
      expect(() => actions.perform('nope', { type: 'clearSelection' })).toThrow('not found');
      expect(() => actions.perform('agent', { type: 'teleport' } as any)).toThrow(TypeError);
      expect(() => actions.perform('agent', { type: 'select', objectIds: [] })).toThrow(TypeError);
      expect(() => actions.perform('agent', { type: 'moveObject', objectId: 'a', to: { x: 'no' } } as any)).toThrow(TypeError);
    });

    it('refuses unknown ids and selection ids as invalid targets', async () => {
      add('a');
      const group = addSelection(['a'], 12345);
      await expect(settle(actions.perform('agent', { type: 'moveObject', objectId: 'missing', to: { x: 0, y: 0 } }))).resolves.toEqual({
        completed: false,
        reason: 'invalid-target',
        objectIds: ['missing'],
      });
      await expect(settle(actions.perform('agent', { type: 'deleteObjects', objectIds: [group.id] }))).resolves.toMatchObject({
        completed: false,
        reason: 'invalid-target',
      });
    });

    it('resolves engine-disconnected when no workspace is ready', async () => {
      add('a');
      map.destroy();
      await expect(settle(actions.perform('agent', { type: 'clearSelection' }))).resolves.toEqual({ completed: false, reason: 'engine-disconnected' });
    });
  });

  describe('moveObject', () => {
    it('moves instantly as one agent undo step, outside the user history, with a source on the event', async () => {
      add('a', 0, 0);
      const userStack = map.undoManager!.undoStack.length;

      const result = await settle(actions.perform('agent', { type: 'moveObject', objectId: 'a', to: { x: 250, y: 125 } }, { instant: true }));

      expect(result).toEqual({ completed: true, objectIds: ['a'] });
      expect(obj('a')).toMatchObject({ translateX: 200, translateY: 100 });
      expect(map.undoManager!.undoStack.length).toBe(userStack);
      expect(map.getAgentUndoStackLength('agent')).toBe(1);
      expect(core.engine.emitObjectsUpdated).toHaveBeenCalledWith(
        [{ object: obj('a'), changedProperties: ['translateX', 'translateY'] }],
        { type: 'agent', agentId: 'agent', actionType: 'moveObject' },
      );
      expect(cursors.get('agent')).toMatchObject({ attachedTo: { objectId: 'a', anchor: 'center' }, activeAction: null, canUndo: true });
    });

    it('animates the drag and shows the target as selected while running', async () => {
      add('a', 0, 0);
      const promise = actions.perform('agent', { type: 'moveObject', objectId: 'a', to: { x: 650, y: 25 } });
      await flushMicrotasks();
      expect(cursors.get('agent')).toMatchObject({ activeAction: 'moveObject', selectedObjectIds: ['a'] });

      const xs: number[] = [];
      for (let i = 0; i < 200; i++) {
        await step();
        xs.push(obj('a')!.translateX);
        if (cursors.get('agent')!.activeAction === null) break;
      }
      await expect(promise).resolves.toEqual({ completed: true, objectIds: ['a'] });
      expect(obj('a')!.translateX).toBeCloseTo(600);
      expect(xs.some(x => x > 0 && x < 600)).toBe(true);
      expect(cursors.get('agent')!.selectedObjectIds).toEqual([]);
      expect(cursors.get('agent')!.pressCount).toBe(1);
    });

    it('runs actions of one cursor in order and different cursors in parallel', async () => {
      add('a', 0, 0);
      add('b', 0, 200);
      cursors.add({ appearance: AGENT_APPEARANCE, id: 'other', position: { x: 0, y: 0 } });

      const first = actions.perform('agent', { type: 'moveObject', objectId: 'a', to: { x: 300, y: 25 } });
      const second = actions.perform('agent', { type: 'moveObject', objectId: 'a', to: { x: 600, y: 25 } });
      const parallel = actions.perform('other', { type: 'moveObject', objectId: 'b', to: { x: 300, y: 225 } });
      await flushMicrotasks();

      expect(cursors.get('agent')).toMatchObject({ activeAction: 'moveObject', queueLength: 1 });
      expect(cursors.get('other')).toMatchObject({ activeAction: 'moveObject', queueLength: 0 });

      const order: string[] = [];
      first.then(() => order.push('first'));
      second.then(() => order.push('second'));
      parallel.then(() => order.push('parallel'));
      await settle(Promise.all([first, second, parallel]));

      expect(order.indexOf('first')).toBeLessThan(order.indexOf('second'));
      expect(order.indexOf('parallel')).toBeLessThan(order.indexOf('second'));
      expect(obj('a')!.translateX).toBeCloseTo(550);
      expect(obj('b')!.translateX).toBeCloseTo(250);
      expect(map.getAgentUndoStackLength('agent')).toBe(2);
      expect(map.getAgentUndoStackLength('other')).toBe(1);
    });

    it('rolls back without events when aborted mid-drag', async () => {
      add('a', 0, 0);
      const controller = new AbortController();
      const promise = actions.perform('agent', { type: 'moveObject', objectId: 'a', to: { x: 650, y: 25 } }, { signal: controller.signal });
      for (let i = 0; i < 60 && obj('a')!.translateX === 0; i++) await step();
      await step();
      expect(obj('a')!.translateX).toBeGreaterThan(0);

      controller.abort();
      await expect(settle(promise)).resolves.toEqual({ completed: false, reason: 'aborted' });
      expect(obj('a')!.translateX).toBe(0);
      expect(map.getAgentUndoState('agent')).toMatchObject({ canUndo: false, canRedo: false });
      expect(core.engine.emitObjectsUpdated).not.toHaveBeenCalled();
      expect(cursors.get('agent')).toMatchObject({ isPressed: false, activeAction: null });
    });

    it('resolves queued actions with aborted without starting them', async () => {
      add('a', 0, 0);
      const controller = new AbortController();
      const first = actions.perform('agent', { type: 'moveObject', objectId: 'a', to: { x: 300, y: 25 } });
      const queued = actions.perform('agent', { type: 'moveObject', objectId: 'a', to: { x: 600, y: 25 } }, { signal: controller.signal });
      controller.abort();
      await expect(queued).resolves.toEqual({ completed: false, reason: 'aborted' });
      await expect(settle(first)).resolves.toMatchObject({ completed: true });
      expect(obj('a')!.translateX).toBeCloseTo(250);
    });

    it('is interrupted and rolled back by a host cursor move', async () => {
      add('a', 0, 0);
      const promise = actions.perform('agent', { type: 'moveObject', objectId: 'a', to: { x: 650, y: 25 } });
      for (let i = 0; i < 60 && obj('a')!.translateX === 0; i++) await step();
      void cursors.move('agent', { x: 0, y: 500 });
      await expect(settle(promise)).resolves.toEqual({ completed: false, reason: 'agent-moved' });
      expect(obj('a')!.translateX).toBe(0);
    });

    it('takes over a still running host move instead of being interrupted by it', async () => {
      add('a', 0, 0);
      const hostMove = cursors.move('agent', { x: 400, y: 400 }, { duration: 1000 });
      const result = await settle(actions.perform('agent', { type: 'moveObject', objectId: 'a', to: { x: 150, y: 25 } }));
      await expect(hostMove).resolves.toEqual({ completed: false });
      expect(result.completed).toBe(true);
    });

    it('drains the queue and rolls back when the cursor is removed', async () => {
      add('a', 0, 0);
      const running = actions.perform('agent', { type: 'moveObject', objectId: 'a', to: { x: 650, y: 25 } });
      const queued = actions.perform('agent', { type: 'clearSelection' });
      for (let i = 0; i < 60 && obj('a')!.translateX === 0; i++) await step();
      cursors.remove('agent');
      await expect(settle(running)).resolves.toEqual({ completed: false, reason: 'agent-removed' });
      await expect(queued).resolves.toEqual({ completed: false, reason: 'agent-removed' });
      expect(obj('a')!.translateX).toBe(0);
      expect(map.getAgentUndoStackLength('agent')).toBe(0);
    });
  });

  describe('conflicts', () => {
    it('refuses objects the user has selected before changing anything', async () => {
      add('a', 0, 0);
      addSelection(['a']);
      const userStack = map.undoManager!.undoStack.length;

      await expect(settle(actions.perform('agent', { type: 'moveObject', objectId: 'a', to: { x: 300, y: 0 } }))).resolves.toEqual({
        completed: false,
        reason: 'user-selected',
        objectIds: ['a'],
      });
      expect(obj('a')!.translateX).toBe(0);
      expect(map.getAgentUndoStackLength('agent')).toBe(0);
      expect(map.undoManager!.undoStack.length).toBe(userStack);
      expect(obj('a')!.isSelected).toBe(false);
    });

    it('refuses even with instant when the user selected the object right before', async () => {
      add('a', 0, 0);
      await step();
      addSelection(['a']);
      await expect(settle(actions.perform('agent', { type: 'moveObject', objectId: 'a', to: { x: 300, y: 0 } }, { instant: true }))).resolves.toMatchObject({
        reason: 'user-selected',
      });
      expect(obj('a')!.translateX).toBe(0);
    });

    it('keeps the partial change as an agent step when the user selects the object mid-action', async () => {
      add('a', 0, 0);
      const promise = actions.perform('agent', { type: 'moveObject', objectId: 'a', to: { x: 650, y: 25 } });
      for (let i = 0; i < 60 && obj('a')!.translateX < 50; i++) await step();
      addSelection(['a']);

      await expect(settle(promise)).resolves.toEqual({ completed: false, reason: 'user-selected', objectIds: ['a'] });
      const partial = obj('a')!.translateX;
      expect(partial).toBeGreaterThan(0);
      expect(partial).toBeLessThan(600);
      expect(map.getAgentUndoStackLength('agent')).toBe(1);
      expect(core.engine.emitObjectsUpdated).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ agentId: 'agent' }));
    });

    it('reports user-interaction when the user starts a gesture on the object', async () => {
      add('a', 0, 0);
      const promise = actions.perform('agent', { type: 'moveObject', objectId: 'a', to: { x: 650, y: 25 } });
      for (let i = 0; i < 60 && obj('a')!.translateX === 0; i++) await step();
      addSelection(['a']);
      state.isDragging = true;
      await expect(settle(promise)).resolves.toMatchObject({ completed: false, reason: 'user-interaction' });
    });

    it('refuses objects a collaborator has selected', async () => {
      add('a', 0, 0);
      addSelection(['a'], 987654);
      await expect(settle(actions.perform('agent', { type: 'moveObject', objectId: 'a', to: { x: 300, y: 0 } }))).resolves.toMatchObject({
        completed: false,
        reason: 'collaborator-editing',
      });
      expect(obj('a')!.translateX).toBe(0);
    });

    it('refuses objects claimed by another agent', async () => {
      add('a', 0, 0);
      cursors.add({ appearance: AGENT_APPEARANCE, id: 'other' });
      await settle(actions.perform('other', { type: 'select', objectIds: ['a'] }, { instant: true }));
      await expect(settle(actions.perform('agent', { type: 'moveObject', objectId: 'a', to: { x: 300, y: 0 } }))).resolves.toMatchObject({
        completed: false,
        reason: 'claimed-by-agent',
      });
    });

    it('stops with conflict and keeps a remote edit when the object is replaced mid-action', async () => {
      add('a', 0, 0);
      const promise = actions.perform('agent', { type: 'moveObject', objectId: 'a', to: { x: 650, y: 25 } });
      for (let i = 0; i < 60 && obj('a')!.translateX === 0; i++) await step();
      await step(120);
      applyRemote('a', { translateY: 999 });

      await expect(settle(promise)).resolves.toMatchObject({ completed: false, reason: 'conflict' });
      expect(obj('a')!.translateY).toBe(999);
    });

    it('stops with workspace-changed and rolls back when the map is destroyed', async () => {
      add('a', 0, 0);
      const promise = actions.perform('agent', { type: 'moveObject', objectId: 'a', to: { x: 650, y: 25 } });
      for (let i = 0; i < 60 && obj('a')!.translateX === 0; i++) await step();
      const updatesBefore = core.engine.emitObjectsUpdated.mock.calls.length;
      const doc = ydoc();
      map.destroy();
      await expect(settle(promise)).resolves.toEqual({ completed: false, reason: 'workspace-changed' });
      expect(core.engine.emitObjectsUpdated.mock.calls.length).toBe(updatesBefore);
      expect(doc).toBeTruthy();
    });

    it('defers the rollback when aborted from a listener during a remote change', async () => {
      add('a', 0, 0);
      add('b', 0, 300);
      const controller = new AbortController();
      const promise = actions.perform('agent', { type: 'moveObject', objectId: 'a', to: { x: 650, y: 25 } }, { signal: controller.signal });
      for (let i = 0; i < 60 && obj('a')!.translateX === 0; i++) await step();
      await step(120);

      core.engine.emitObjectsUpdated.mockImplementationOnce(() => controller.abort());
      applyRemote('b', { translateY: 400 });

      await expect(settle(promise)).resolves.toEqual({ completed: false, reason: 'aborted' });
      expect(obj('a')!.translateX).toBe(0);
      expect(map.getAgentUndoState('agent')).toMatchObject({ canUndo: false, canRedo: false });
    });
  });

  describe('review regressions', () => {
    it('refuses a newcomer whose anchored line is already claimed instead of killing the running action', async () => {
      add('p', 0, 0);
      add('q', 0, 300);
      add('L', 0, 150, 10, 10);
      core.anchorManager.getLinesAnchoredTo.mockImplementation((id: string) => (id === 'p' || id === 'q' ? [{ lineId: 'L', endpoint: id === 'p' ? 'start' : 'end' }] : []));
      cursors.add({ appearance: AGENT_APPEARANCE, id: 'other', position: { x: 0, y: 0 } });

      const running = actions.perform('other', { type: 'moveObject', objectId: 'q', to: { x: 650, y: 325 } });
      for (let i = 0; i < 60 && obj('q')!.translateX === 0; i++) await step();
      const newcomer = await settle(actions.perform('agent', { type: 'moveObject', objectId: 'p', to: { x: 300, y: 25 } }));

      expect(newcomer).toEqual({ completed: false, reason: 'claimed-by-agent', objectIds: ['L'] });
      await expect(settle(running)).resolves.toMatchObject({ completed: true });
      expect(obj('q')!.translateX).toBeCloseTo(600);
      expect(obj('p')!.translateX).toBe(0);
    });

    it('never keeps a selection for a removed cursor', async () => {
      add('a', 0, 0);
      cursors.remove('agent');
      actions.setSelection('agent', ['a']);
      expect(actions.getSelection('agent')).toEqual([]);
      cursors.add({ appearance: AGENT_APPEARANCE, id: 'other' });
      await expect(settle(actions.perform('other', { type: 'select', objectIds: ['a'] }, { instant: true }))).resolves.toMatchObject({ completed: true });
    });

    it('reports an undo as completed when its own change event aborts it', async () => {
      add('a', 0, 0);
      await settle(actions.perform('agent', { type: 'moveObject', objectId: 'a', to: { x: 150, y: 25 } }, { instant: true }));
      const controller = new AbortController();
      core.engine.emitObjectsUpdated.mockImplementationOnce(() => controller.abort());

      await expect(settle(actions.perform('agent', { type: 'undo' }, { instant: true, signal: controller.signal }))).resolves.toEqual({ completed: true, objectIds: ['a'] });
      expect(obj('a')!.translateX).toBe(0);
      expect(cursors.get('agent')).toMatchObject({ canRedo: true });
    });

    it('stops with user-interaction when the user writes the target mid-action, without overwriting that write', async () => {
      add('a', 0, 0);
      const userStack = map.undoManager!.undoStack.length;
      const promise = actions.perform('agent', { type: 'moveObject', objectId: 'a', to: { x: 650, y: 25 } });
      for (let i = 0; i < 60 && obj('a')!.translateX === 0; i++) await step();

      // e.g. a z-order change by the user that renumbers the target
      const target = obj('a')!;
      target.zIndex = 7;
      map.update(target as any);

      await expect(settle(promise)).resolves.toMatchObject({ completed: false, reason: 'user-interaction', objectIds: ['a'] });
      expect(map.undoManager!.undoStack.length).toBe(userStack + 1);
      expect(obj('a')!.zIndex).toBe(7);
    });

    it('keeps earlier redo steps when an action is rolled back', async () => {
      add('a', 0, 0);
      add('b', 0, 200);
      await settle(actions.perform('agent', { type: 'moveObject', objectId: 'a', to: { x: 150, y: 25 } }, { instant: true }));
      await settle(actions.perform('agent', { type: 'undo' }, { instant: true }));
      expect(cursors.get('agent')!.canRedo).toBe(true);

      const controller = new AbortController();
      const aborted = actions.perform('agent', { type: 'moveObject', objectId: 'b', to: { x: 650, y: 225 } }, { signal: controller.signal });
      for (let i = 0; i < 60 && obj('b')!.translateX === 0; i++) await step();
      controller.abort();
      await expect(settle(aborted)).resolves.toMatchObject({ reason: 'aborted' });

      expect(cursors.get('agent')!.canRedo).toBe(true);
      await expect(settle(actions.perform('agent', { type: 'redo' }, { instant: true }))).resolves.toMatchObject({ completed: true });
      expect(obj('a')!.translateX).toBe(100);
      expect(obj('b')!.translateX).toBe(0);
    });

    it('discards earlier redo steps once a new change is kept', async () => {
      add('a', 0, 0);
      add('b', 0, 200);
      await settle(actions.perform('agent', { type: 'moveObject', objectId: 'a', to: { x: 150, y: 25 } }, { instant: true }));
      await settle(actions.perform('agent', { type: 'undo' }, { instant: true }));
      await settle(actions.perform('agent', { type: 'moveObject', objectId: 'b', to: { x: 150, y: 225 } }, { instant: true }));
      expect(cursors.get('agent')!.canRedo).toBe(false);
    });

    it('reports user-selected for an idle selection even after a handle was used', async () => {
      add('a', 0, 0);
      addSelection(['a']);
      state.isResizeHandleSelected = true;
      state.pointers = new Map();
      await expect(settle(actions.perform('agent', { type: 'moveObject', objectId: 'a', to: { x: 300, y: 0 } }))).resolves.toMatchObject({ reason: 'user-selected' });
      state.pointers.set(1, {});
      await expect(settle(actions.perform('agent', { type: 'moveObject', objectId: 'a', to: { x: 300, y: 0 } }))).resolves.toMatchObject({ reason: 'user-interaction' });
    });
  });

  describe('select, click and delete', () => {
    it('keeps agent selections local and never touches the user selection flags', async () => {
      add('a', 0, 0);
      add('b', 200, 0);
      await settle(actions.perform('agent', { type: 'select', objectIds: ['a'] }, { instant: true }));
      await settle(actions.perform('agent', { type: 'select', objectIds: ['b'], additive: true }, { instant: true }));
      expect(cursors.get('agent')!.selectedObjectIds).toEqual(['a', 'b']);
      expect(obj('a')!.isSelected).toBe(false);
      expect(map.filter(o => o instanceof KritzelSelectionGroup)).toHaveLength(0);
      expect(map.getAgentUndoStackLength('agent')).toBe(0);

      await settle(actions.perform('agent', { type: 'clearSelection' }));
      expect(cursors.get('agent')!.selectedObjectIds).toEqual([]);
    });

    it('returns the top-most object under a click without changing anything', async () => {
      add('low', 0, 0, 100, 100, 1);
      add('high', 50, 50, 100, 100, 2);
      const result = await settle(actions.perform('agent', { type: 'click', target: { x: 75, y: 75 } }));
      expect(result).toEqual({ completed: true, objectIds: ['high'] });
      expect(await settle(actions.perform('agent', { type: 'click', target: { x: 500, y: 500 } }, { instant: true }))).toEqual({ completed: true, objectIds: [] });
      expect(core.engine.emitObjectsUpdated).not.toHaveBeenCalled();
      expect(cursors.get('agent')!.pressCount).toBe(1);
    });

    it('deletes objects with snapshots and a source, and agent undo restores them', async () => {
      add('a', 10, 20);
      await settle(actions.perform('agent', { type: 'select', objectIds: ['a'] }, { instant: true }));
      const result = await settle(actions.perform('agent', { type: 'deleteObjects', objectIds: ['a'] }, { instant: true }));

      expect(result).toEqual({ completed: true, objectIds: ['a'] });
      expect(map.findById('a')).toBeUndefined();
      expect(cursors.get('agent')!.selectedObjectIds).toEqual([]);
      expect(core.engine.emitObjectsRemoved).toHaveBeenCalledWith(
        [expect.objectContaining({ id: 'a', translateX: 10 })],
        { type: 'agent', agentId: 'agent', actionType: 'deleteObjects' },
      );

      const undo = await settle(actions.perform('agent', { type: 'undo' }, { instant: true }));
      expect(undo).toEqual({ completed: true, objectIds: ['a'] });
      expect(obj('a')).toMatchObject({ translateX: 10, translateY: 20 });
      expect(core.engine.emitObjectsAdded).toHaveBeenCalledWith(expect.any(Array), { type: 'agent', agentId: 'agent', actionType: 'undo' });
    });
  });

  describe('user actors', () => {
    beforeEach(() => {
      actions.registerUserActor('me');
    });

    it('registers actors with unique IDs and resolves who performs an ID', () => {
      expect(actions.getActor('me')).toEqual({ id: 'me', kind: 'user' });
      expect(actions.getActor('agent')).toEqual({ id: 'agent', kind: 'agent' });
      expect(actions.getActor('nope')).toBeNull();
      expect(() => actions.registerUserActor('me')).toThrow('already exists');
      expect(() => actions.registerUserActor('agent')).toThrow('already exists');
      expect(actions.unregisterUserActor('me')).toBe(true);
      expect(actions.unregisterUserActor('me')).toBe(false);
      expect(() => actions.perform('me', { type: 'clearSelection' })).toThrow('not found');
    });

    it('changes objects instantly as one step of the user history, without a source', async () => {
      add('a', 0, 0);
      const userSteps = map.undoManager!.undoStack.length;
      const promise = actions.perform('me', { type: 'moveObject', objectId: 'a', to: { x: 150, y: 25 } });
      await flushMicrotasks();
      await expect(promise).resolves.toEqual({ completed: true, objectIds: ['a'] });
      expect(obj('a')!.translateX).toBe(100);
      expect(map.getAgentUndoStackLength('me')).toBe(0);
      expect(map.undoManager!.undoStack.length).toBe(userSteps + 1);
      expect(core.engine.emitObjectsUpdated).toHaveBeenCalledWith([expect.objectContaining({ object: expect.objectContaining({ id: 'a' }) })]);

      map.undo();
      expect(obj('a')!.translateX).toBe(0);
      map.redo();
      expect(obj('a')!.translateX).toBe(100);
    });

    it('merges the actions of one history group into one user step', async () => {
      add('a', 0, 0);
      add('b', 0, 200);
      const userSteps = map.undoManager!.undoStack.length;
      await settle(actions.perform('me', { type: 'moveObject', objectId: 'a', to: { x: 150, y: 25 } }, { historyGroup: 'p1' } as any));
      await settle(actions.perform('me', { type: 'moveObject', objectId: 'b', to: { x: 150, y: 225 } }, { historyGroup: 'p1' } as any));
      await settle(actions.perform('me', { type: 'moveObject', objectId: 'b', to: { x: 350, y: 225 } }, { historyGroup: 'p2' } as any));
      expect(map.undoManager!.undoStack.length).toBe(userSteps + 2);

      map.undo();
      expect(obj('b')!.translateX).toBe(100);
      map.undo();
      expect(obj('a')!.translateX).toBe(0);
      expect(obj('b')!.translateX).toBe(0);
    });

    it('refuses undo and redo: they belong to the user', async () => {
      await expect(settle(actions.perform('me', { type: 'undo' }))).resolves.toEqual({ completed: false, reason: 'not-allowed' });
      await expect(settle(actions.perform('me', { type: 'redo' }))).resolves.toEqual({ completed: false, reason: 'not-allowed' });
    });

    it('works on objects the user has selected, but not during a gesture', async () => {
      add('a', 0, 0);
      addSelection(['a']);
      await expect(settle(actions.perform('me', { type: 'moveObject', objectId: 'a', to: { x: 150, y: 25 } }))).resolves.toMatchObject({ completed: true });

      state.isDragging = true;
      await expect(settle(actions.perform('me', { type: 'moveObject', objectId: 'a', to: { x: 250, y: 25 } }))).resolves.toMatchObject({
        completed: false,
        reason: 'user-interaction',
      });
    });

    it('is blocked by running actions of agents, but not by their selections', async () => {
      add('a', 0, 0);
      add('b', 0, 200);
      await settle(actions.perform('agent', { type: 'select', objectIds: ['b'] }, { instant: true }));
      await expect(settle(actions.perform('me', { type: 'moveObject', objectId: 'b', to: { x: 150, y: 225 } }))).resolves.toMatchObject({ completed: true });

      const slow = actions.perform('agent', { type: 'moveObject', objectId: 'a', to: { x: 400, y: 25 } });
      await step();
      await step();
      await expect(settle(actions.perform('me', { type: 'moveObject', objectId: 'a', to: { x: 150, y: 25 } }))).resolves.toMatchObject({
        completed: false,
        reason: 'claimed-by-agent',
      });
      await settle(slow);
    });

    it('runs one user actor at a time', async () => {
      actions.registerUserActor('me-too');
      add('a', 0, 0);
      const first = actions.perform('me', { type: 'moveObject', objectId: 'a', to: { x: 150, y: 25 } });
      const second = actions.perform('me-too', { type: 'moveObject', objectId: 'a', to: { x: 250, y: 25 } });
      await expect(settle(first)).resolves.toMatchObject({ completed: true });
      await expect(settle(second)).resolves.toMatchObject({ completed: true });
      expect(obj('a')!.translateX).toBe(200);
    });

    it("changes the user's selection, leaves selection groups out of events and undoes it with the action", async () => {
      add('a', 0, 0);
      add('b', 200, 0);
      addSelection(['a', 'b']);
      const userSteps = map.undoManager!.undoStack.length;

      await expect(settle(actions.perform('me', { type: 'deleteObjects', objectIds: ['a'] }))).resolves.toEqual({ completed: true, objectIds: ['a'] });
      expect(selectionGroups().map(group => group.objectIds)).toEqual([['b']]);
      expect(core.engine.emitObjectsRemoved).toHaveBeenCalledWith([expect.objectContaining({ id: 'a' })]);
      expect(core.engine.emitObjectsAdded).not.toHaveBeenCalled();
      expect(map.undoManager!.undoStack.length).toBe(userSteps + 1);

      map.undo();
      expect(obj('a')).toBeDefined();
      expect(selectionGroups().map(group => group.objectIds)).toEqual([['a', 'b']]);
    });

    it('rolls back a selection change of an aborted action and reports the selection change', async () => {
      add('a', 0, 0);
      addSelection(['a']);
      const controller = new AbortController();
      core.selectObjects.mockImplementationOnce((objects: any[]) => {
        core.removeSelectionGroup();
        map.insert(makeSelection(objects.map(object => object.id)));
        controller.abort();
      });
      add('b', 200, 0);
      const result = await settle(actions.perform('me', { type: 'select', objectIds: ['b'] }, { signal: controller.signal }));
      expect(result).toEqual({ completed: false, reason: 'aborted' });
      expect(selectionGroups().map(group => group.objectIds)).toEqual([['a']]);
      expect(core.engine.triggerSelectionChange).toHaveBeenCalled();
    });

    it('settles queued actions when the actor is unregistered', async () => {
      add('a', 0, 0);
      const first = actions.perform('me', { type: 'moveObject', objectId: 'a', to: { x: 150, y: 25 } });
      const second = actions.perform('me', { type: 'moveObject', objectId: 'a', to: { x: 250, y: 25 } });
      actions.unregisterUserActor('me');
      await expect(settle(first)).resolves.toEqual({ completed: false, reason: 'agent-removed' });
      await expect(settle(second)).resolves.toEqual({ completed: false, reason: 'agent-removed' });
      expect(obj('a')!.translateX).toBe(0);
    });
  });

  describe('undo and redo', () => {
    it('reports when there is nothing to undo or redo', async () => {
      await expect(settle(actions.perform('agent', { type: 'undo' }))).resolves.toEqual({ completed: false, reason: 'nothing-to-undo' });
      await expect(settle(actions.perform('agent', { type: 'redo' }))).resolves.toEqual({ completed: false, reason: 'nothing-to-redo' });
    });

    it('undoes and redoes only this agent and only after the conflict checks', async () => {
      add('a', 0, 0);
      add('b', 0, 200);
      cursors.add({ appearance: AGENT_APPEARANCE, id: 'other' });
      await settle(actions.perform('agent', { type: 'moveObject', objectId: 'a', to: { x: 150, y: 25 } }, { instant: true }));
      await settle(actions.perform('other', { type: 'moveObject', objectId: 'b', to: { x: 150, y: 225 } }, { instant: true }));

      await expect(settle(actions.perform('agent', { type: 'undo' }))).resolves.toEqual({ completed: true, objectIds: ['a'] });
      expect(obj('a')!.translateX).toBe(0);
      expect(obj('b')!.translateX).toBe(100);
      expect(cursors.get('agent')).toMatchObject({ canUndo: false, canRedo: true });

      addSelection(['a']);
      await expect(settle(actions.perform('agent', { type: 'redo' }))).resolves.toMatchObject({ completed: false, reason: 'user-selected' });
      expect(obj('a')!.translateX).toBe(0);
    });

    it('keeps agent changes out of the user undo/redo', async () => {
      add('a', 0, 0);
      add('b', 0, 200);
      const userObject = obj('b')!;
      userObject.translateX = 30;
      map.update(userObject as any);
      map.stopUndoCapturing();

      await settle(actions.perform('agent', { type: 'moveObject', objectId: 'a', to: { x: 150, y: 25 } }, { instant: true }));
      map.undo();
      expect(obj('b')!.translateX).toBe(0);
      expect(obj('a')!.translateX).toBe(100);
    });
  });
});

// Keep the type import used.
export type _Result = KritzelAgenticActionResult;
