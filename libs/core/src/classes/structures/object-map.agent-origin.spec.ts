import * as Y from 'yjs';
import { KritzelObjectMap } from './object-map.structure';
import { KritzelAgentOrigin } from './agent-origin.class';
import type { KritzelCore } from '../core/core.class';

// Real Yjs on purpose: these tests pin the Yjs behaviour per-agent undo relies on.

/** Minimal persistable object; the reviver turns serialized data back into one. */
class FakeObject {
  id: string;
  x = 0;
  label = '';
  constructor(id: string, x = 0, label = '') {
    this.id = id;
    this.x = x;
    this.label = label;
  }
  get rotatedBoundingBox() {
    return { x: this.x, y: 0, z: 1, width: 10, height: 10 };
  }
  serialize() {
    return { __class__: 'FakeObject', id: this.id, x: this.x, label: this.label };
  }
}

jest.mock('../core/reviver.class', () => ({
  KritzelReviver: jest.fn().mockImplementation(() => ({
    revive: (data: { id: string; x: number; label: string }) => new FakeObject(data.id, data.x, data.label),
  })),
}));
jest.mock('../objects/selection-box.class');
jest.mock('../objects/selection-group.class');
jest.mock('../../configs/default-sync.config', () => ({ DEFAULT_SYNC_CONFIG: { providers: [] } }));
jest.mock('../../helpers/migration.helper', () => ({ runMigrations: jest.fn() }));

const createCore = () => {
  const engine = {
    emitObjectsChange: jest.fn(),
    emitObjectsAdded: jest.fn(),
    emitObjectsRemoved: jest.fn(),
    emitObjectsUpdated: jest.fn(),
  };
  const core = {
    rerender: jest.fn(),
    editorId: undefined,
    user: undefined,
    anchorManager: { rebuildIndex: jest.fn() },
    engine,
    store: {
      state: { debugInfo: {}, isDragging: false, isResizing: false, isRotating: false },
      invalidateSelectionCache: jest.fn(),
    },
  };
  return core;
};

type Core = ReturnType<typeof createCore>;

const createMap = async () => {
  const core = createCore();
  const map = new KritzelObjectMap<any>();
  await map.initialize(core as unknown as KritzelCore, 'ws', { providers: [] });
  return { map, core };
};

const ydocOf = (map: KritzelObjectMap<any>): Y.Doc => (map as unknown as { _ydoc: Y.Doc })._ydoc;

/** Writes the object as an agent, inside one transaction (like an action's mutate). */
const agentWrite = (map: KritzelObjectMap<any>, origin: KritzelAgentOrigin, fn: () => void) => {
  map.withOrigin(origin, () => map.transaction(fn));
};

const xOf = (map: KritzelObjectMap<any>, id: string) => (map.findById(id) as FakeObject | undefined)?.x;

describe('KritzelObjectMap agent origins (real Yjs)', () => {
  let map: KritzelObjectMap<any>;
  let core: Core;

  beforeEach(async () => {
    ({ map, core } = await createMap());
    map.insert(new FakeObject('a', 0) as any);
    map.insert(new FakeObject('b', 0) as any);
    map.stopUndoCapturing();
  });

  afterEach(() => {
    map.destroy();
  });

  it('keeps agent writes out of the user undo stack', () => {
    const userStack = map.undoManager!.undoStack.length;
    const origin = map.getAgentOrigin('agent')!;

    agentWrite(map, origin, () => {
      const a = map.findById('a');
      a.x = 50;
      map.update(a);
      map.insert(new FakeObject('c', 5) as any);
    });

    expect(map.undoManager!.undoStack.length).toBe(userStack);
    expect(map.getAgentUndoStackLength('agent')).toBe(1);
  });

  it('does not split an in-progress user step when an agent inserts', () => {
    const before = map.undoManager!.undoStack.length;
    const a = map.findById('a');
    a.x = 1;
    map.update(a);

    const origin = map.getAgentOrigin('agent')!;
    map.withOrigin(origin, () => {
      map.insert(new FakeObject('c', 5) as any);
    });

    a.x = 2;
    map.update(a);

    expect(map.undoManager!.undoStack.length).toBe(before + 1);
  });

  it('groups a nested transaction under one origin into a single agent step', () => {
    const origin = map.getAgentOrigin('agent')!;
    map.stopAgentCapturing('agent');
    agentWrite(map, origin, () => {
      map.transaction(() => {
        const a = map.findById('a');
        a.x = 10;
        map.update(a);
      });
      map.insert(new FakeObject('c', 5) as any);
    });
    expect(map.getAgentUndoStackLength('agent')).toBe(1);
  });

  it('keeps instances and emits nothing for agent writes, and records added/updated/deleted keys', () => {
    const origin = map.getAgentOrigin('agent')!;
    origin.startRecording();
    const instance = map.findById('a');

    agentWrite(map, origin, () => {
      instance.x = 20;
      map.update(instance);
      map.insert(new FakeObject('c', 5) as any);
      map.remove((o: FakeObject) => o.id === 'b');
    });

    expect(map.findById('a')).toBe(instance);
    expect(core.engine.emitObjectsUpdated).not.toHaveBeenCalled();
    expect(core.engine.emitObjectsAdded).not.toHaveBeenCalled();
    expect(core.engine.emitObjectsRemoved).not.toHaveBeenCalled();
    const recording = origin.takeRecording();
    expect(recording.get('a')).toBe(true);
    expect(recording.get('c')).toBe(false);
    expect(recording.get('b')).toBe(true);
  });

  it('isolates the histories of two agents', () => {
    const originA = map.getAgentOrigin('A')!;
    const originB = map.getAgentOrigin('B')!;

    agentWrite(map, originA, () => {
      const a = map.findById('a');
      a.x = 10;
      map.update(a);
    });
    map.stopAgentCapturing('A');
    agentWrite(map, originB, () => {
      const b = map.findById('b');
      b.x = 30;
      map.update(b);
    });
    map.stopAgentCapturing('B');

    expect(map.undoAgent('A').status).toBe('done');
    expect(xOf(map, 'a')).toBe(0);
    expect(xOf(map, 'b')).toBe(30);
  });

  it('reports a conflict instead of overwriting a later user change', () => {
    const origin = map.getAgentOrigin('agent')!;
    agentWrite(map, origin, () => {
      const a = map.findById('a');
      a.x = 10;
      map.update(a);
    });
    map.stopAgentCapturing('agent');
    map.tagLastAgentStackItem('agent', ['a']);

    const a = map.findById('a');
    a.x = 99;
    map.update(a);

    const result = map.undoAgent('agent');
    expect(result).toEqual({ status: 'conflict', objectIds: ['a'] });
    expect(xOf(map, 'a')).toBe(99);
  });

  it('never falls through to an older step when the newest one conflicts', () => {
    const origin = map.getAgentOrigin('agent')!;
    agentWrite(map, origin, () => {
      const a = map.findById('a');
      a.x = 10;
      map.update(a);
    });
    map.stopAgentCapturing('agent');
    agentWrite(map, origin, () => {
      const b = map.findById('b');
      b.x = 20;
      map.update(b);
    });
    map.stopAgentCapturing('agent');

    // A peer overwrites b.
    const b = map.findById('b');
    b.x = 77;
    map.update(b);

    expect(map.undoAgent('agent').status).toBe('conflict');
    expect(xOf(map, 'a')).toBe(10);

    expect(map.undoAgent('agent').status).toBe('done');
    expect(xOf(map, 'a')).toBe(0);
  });

  it('documents that a user undo overwrites a later agent change to the same object', () => {
    const a = map.findById('a');
    a.x = 5;
    map.update(a);
    map.stopUndoCapturing();

    const origin = map.getAgentOrigin('agent')!;
    agentWrite(map, origin, () => {
      const current = map.findById('a');
      current.x = 40;
      map.update(current);
    });

    map.undo();
    expect(xOf(map, 'a')).toBe(0);
  });

  it('rolls back an action without touching older steps and without leaving it redoable', () => {
    const origin = map.getAgentOrigin('agent')!;
    agentWrite(map, origin, () => {
      const a = map.findById('a');
      a.x = 10;
      map.update(a);
    });
    map.stopAgentCapturing('agent');
    const before = map.getAgentUndoStackLength('agent');

    agentWrite(map, origin, () => {
      const b = map.findById('b');
      b.x = 20;
      map.update(b);
      map.insert(new FakeObject('c', 5) as any);
    });

    core.engine.emitObjectsUpdated.mockClear();
    core.engine.emitObjectsRemoved.mockClear();
    expect(map.rollbackAgent('agent', before)).toBe(true);

    expect(xOf(map, 'a')).toBe(10);
    expect(xOf(map, 'b')).toBe(0);
    expect(map.findById('c')).toBeUndefined();
    expect(map.getAgentUndoState('agent')).toEqual(expect.objectContaining({ canUndo: true, canRedo: false, undoStackSize: 1 }));
    expect(core.engine.emitObjectsUpdated).not.toHaveBeenCalled();
    expect(core.engine.emitObjectsRemoved).not.toHaveBeenCalled();
  });

  it('carries step object IDs from undo to redo and tags their events with the agent', () => {
    const origin = map.getAgentOrigin('agent')!;
    agentWrite(map, origin, () => {
      const a = map.findById('a');
      a.x = 10;
      map.update(a);
    });
    map.stopAgentCapturing('agent');
    map.tagLastAgentStackItem('agent', ['a']);

    expect(map.undoAgent('agent')).toEqual({ status: 'done', objectIds: ['a'] });
    expect(core.engine.emitObjectsUpdated).toHaveBeenLastCalledWith(
      [{ object: expect.objectContaining({ id: 'a', x: 0 }), changedProperties: [] }],
      { type: 'agent', agentId: 'agent', actionType: 'undo' },
    );
    expect(map.peekAgentObjectIds('agent', 'redo')).toEqual(['a']);

    expect(map.redoAgent('agent')).toEqual({ status: 'done', objectIds: ['a'] });
    expect(xOf(map, 'a')).toBe(10);
    expect(core.engine.emitObjectsUpdated).toHaveBeenLastCalledWith(
      [{ object: expect.objectContaining({ id: 'a' }), changedProperties: [] }],
      { type: 'agent', agentId: 'agent', actionType: 'redo' },
    );
  });

  it('routes temporary writes inside an agent scope to the agent', () => {
    const origin = map.getAgentOrigin('agent')!;
    const userStack = map.undoManager!.undoStack.length;
    map.withOrigin(origin, () => {
      const a = map.findById('a');
      a.label = 'typed';
      map.update(a, { temporary: true });
    });
    expect(map.undoManager!.undoStack.length).toBe(userStack);
    expect((map as unknown as { _temporaryItemsCount: number })._temporaryItemsCount).toBe(0);
    expect(map.getAgentUndoStackLength('agent')).toBe(1);
  });

  it('marks local-only agent updates so they can be flushed later', () => {
    const origin = map.getAgentOrigin('agent')!;
    origin.startRecording();
    map.withOrigin(origin, () => {
      map.withLocalUpdatesOnly(() => {
        const a = map.findById('a');
        a.x = 3;
        map.update(a);
      });
    });
    expect(origin.takeLocalOnly()).toEqual(['a']);
    expect(map.getAgentUndoStackLength('agent')).toBe(0);
  });

  it('syncs agent changes to a peer document like any other change', () => {
    const peer = new Y.Doc();
    const doc = ydocOf(map);
    Y.applyUpdate(peer, Y.encodeStateAsUpdate(doc));
    doc.on('update', (update: Uint8Array, origin: unknown) => {
      if (origin !== 'peer') Y.applyUpdate(peer, update, 'peer');
    });

    const origin = map.getAgentOrigin('agent')!;
    agentWrite(map, origin, () => {
      const a = map.findById('a');
      a.x = 42;
      map.update(a);
    });

    expect(peer.getMap('objects').get('a')).toEqual(expect.objectContaining({ x: 42 }));
    peer.destroy();
  });

  it('detects when it runs inside a Yjs transaction or observer', () => {
    expect(map.isInsideYjsCallback).toBe(false);
    const doc = ydocOf(map);
    let insideTransact = false;
    let insideObserver = false;
    const observer = () => {
      insideObserver = map.isInsideYjsCallback;
    };
    doc.getMap('objects').observe(observer);
    doc.transact(() => {
      insideTransact = map.isInsideYjsCallback;
      doc.getMap('objects').set('z', { id: 'z', x: 0, label: '' });
    }, 'peer');
    doc.getMap('objects').unobserve(observer);
    expect(insideTransact).toBe(true);
    expect(insideObserver).toBe(true);
    expect(map.isInsideYjsCallback).toBe(false);
  });

  it('refuses to change agent history from inside a Yjs callback', () => {
    const doc = ydocOf(map);
    let error: unknown = null;
    doc.transact(() => {
      try {
        map.undoAgent('agent');
      } catch (e) {
        error = e;
      }
    });
    expect(error).toBeInstanceOf(Error);
  });

  it('exposes the doc client ID', () => {
    expect(map.docClientId).toBe(ydocOf(map).clientID);
  });

  it('runs onBeforeDestroy callbacks first, then destroys agent histories', async () => {
    const { map: other } = await createMap();
    other.getAgentOrigin('agent');
    const calls: string[] = [];
    other.onBeforeDestroy(() => calls.push(`ready:${other.isReady}:${other.getAgentUndoState('agent').undoStackSize}`));
    other.destroy();
    expect(calls).toEqual(['ready:true:0']);
    expect(other.getAgentOrigin('agent')).toBeNull();
  });

  it('withOrigin rejects asynchronous callbacks', () => {
    const origin = map.getAgentOrigin('agent')!;
    expect(() => map.withOrigin(origin, () => Promise.resolve() as unknown as void)).toThrow(TypeError);
    expect(map.activeAgentOrigin).toBeNull();
  });

  describe('moveActorStepToUser', () => {
    const userStack = () => map.undoManager!.undoStack;

    const actorMoveA = (origin: KritzelAgentOrigin, x: number) =>
      agentWrite(map, origin, () => {
        const a = map.findById('a');
        a.x = x;
        map.update(a);
      });

    it('moves an actor step to the top of the user stack, where the user can undo and redo it', () => {
      const before = userStack().length;
      const origin = map.getAgentOrigin('user-actor')!;
      actorMoveA(origin, 30);

      expect(map.moveActorStepToUser('user-actor', { fromLength: 0, userIndex: before })).toBe(true);
      expect(map.getAgentUndoStackLength('user-actor')).toBe(0);
      expect(userStack().length).toBe(before + 1);

      map.undo();
      expect(xOf(map, 'a')).toBe(0);
      map.redo();
      expect(xOf(map, 'a')).toBe(30);
    });

    it('does not let the next user change merge into the moved step', () => {
      const before = userStack().length;
      const origin = map.getAgentOrigin('user-actor')!;
      actorMoveA(origin, 30);
      map.moveActorStepToUser('user-actor', { fromLength: 0, userIndex: before });

      const b = map.findById('b');
      b.x = 7;
      map.update(b);
      expect(userStack().length).toBe(before + 2);

      map.undo();
      expect(xOf(map, 'b')).toBe(0);
      expect(xOf(map, 'a')).toBe(30);
    });

    it('clears the user redo stack like a new change', () => {
      const b = map.findById('b');
      b.x = 9;
      map.update(b);
      map.stopUndoCapturing();
      map.undo();
      expect(map.canRedo()).toBe(true);

      const origin = map.getAgentOrigin('user-actor')!;
      actorMoveA(origin, 30);
      map.moveActorStepToUser('user-actor', { fromLength: 0, userIndex: userStack().length });
      expect(map.canRedo()).toBe(false);
    });

    it('merges consecutive steps of the same group into one user step', () => {
      const before = userStack().length;
      const origin = map.getAgentOrigin('user-actor')!;
      actorMoveA(origin, 30);
      map.moveActorStepToUser('user-actor', { fromLength: 0, userIndex: before, group: 'prompt-1' });
      map.insert(new FakeObject('c', 5) as any);
      // The insert above is a user step: the next action of the prompt is no longer adjacent.
      map.stopUndoCapturing();
      const afterUser = userStack().length;

      agentWrite(map, origin, () => map.insert(new FakeObject('d', 1) as any));
      map.moveActorStepToUser('user-actor', { fromLength: 0, userIndex: afterUser, group: 'prompt-1' });
      agentWrite(map, origin, () => map.insert(new FakeObject('e', 1) as any));
      map.moveActorStepToUser('user-actor', { fromLength: 0, userIndex: userStack().length, group: 'prompt-1' });

      expect(userStack().length).toBe(afterUser + 1);
      map.undo();
      expect(map.findById('d')).toBeUndefined();
      expect(map.findById('e')).toBeUndefined();
      expect(map.findById('c')).toBeDefined();
    });

    it('keeps steps of different groups apart', () => {
      const before = userStack().length;
      const origin = map.getAgentOrigin('user-actor')!;
      agentWrite(map, origin, () => map.insert(new FakeObject('d', 1) as any));
      map.moveActorStepToUser('user-actor', { fromLength: 0, userIndex: before, group: 'prompt-1' });
      agentWrite(map, origin, () => map.insert(new FakeObject('e', 1) as any));
      map.moveActorStepToUser('user-actor', { fromLength: 0, userIndex: before + 1, group: 'prompt-2' });
      expect(userStack().length).toBe(before + 2);
    });

    it('inserts below user changes made during the action', () => {
      const before = userStack().length;
      const origin = map.getAgentOrigin('user-actor')!;
      actorMoveA(origin, 30);

      const b = map.findById('b');
      b.x = 11;
      map.update(b);
      map.stopUndoCapturing();

      map.moveActorStepToUser('user-actor', { fromLength: 0, userIndex: before });
      expect(userStack().length).toBe(before + 2);
      map.undo();
      expect(xOf(map, 'b')).toBe(0);
      expect(xOf(map, 'a')).toBe(30);
      map.undo();
      expect(xOf(map, 'a')).toBe(0);
    });

    it('inserts below pending temporary items, which still consolidate', () => {
      const before = userStack().length;
      const b = map.findById('b');
      b.label = 'x';
      map.update(b, { temporary: true });
      map.stopUndoCapturing();
      b.label = 'xy';
      map.update(b, { temporary: true });
      map.stopUndoCapturing();

      const origin = map.getAgentOrigin('user-actor')!;
      actorMoveA(origin, 30);
      map.moveActorStepToUser('user-actor', { fromLength: 0, userIndex: userStack().length });
      expect(userStack().length).toBe(before + 3);

      map.consolidateTemporaryItems();
      expect(userStack().length).toBe(before + 2);
      map.undo();
      expect((map.findById('b') as FakeObject).label).toBe('');
      expect(xOf(map, 'a')).toBe(30);
      map.undo();
      expect(xOf(map, 'a')).toBe(0);
    });

    it('merges several actor steps above fromLength into one', () => {
      const before = userStack().length;
      const origin = map.getAgentOrigin('user-actor')!;
      actorMoveA(origin, 10);
      map.stopAgentCapturing('user-actor');
      agentWrite(map, origin, () => map.insert(new FakeObject('d', 1) as any));
      expect(map.getAgentUndoStackLength('user-actor')).toBe(2);

      map.moveActorStepToUser('user-actor', { fromLength: 0, userIndex: before });
      expect(userStack().length).toBe(before + 1);
      map.undo();
      expect(xOf(map, 'a')).toBe(0);
      expect(map.findById('d')).toBeUndefined();
    });

    it('returns false without steps', () => {
      map.getAgentOrigin('user-actor');
      expect(map.moveActorStepToUser('user-actor', { fromLength: 0, userIndex: 0 })).toBe(false);
      expect(map.moveActorStepToUser('unknown', { fromLength: 0, userIndex: 0 })).toBe(false);
    });
  });

  it('keeps user undo grouping unchanged for a nested transaction followed by an insert', () => {
    const stopCapturing = jest.spyOn(map.undoManager!, 'stopCapturing');
    map.transaction(() => {
      map.transaction(() => {
        const a = map.findById('a');
        a.x = 1;
        map.update(a);
      });
      map.insert(new FakeObject('c', 0) as any);
    });
    // The inner transaction resets the flag early, so the insert closes the step (existing behaviour).
    expect(stopCapturing).toHaveBeenCalledTimes(1);
  });
});
