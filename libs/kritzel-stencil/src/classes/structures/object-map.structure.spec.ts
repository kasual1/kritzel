import { KritzelObjectMap } from './object-map.structure';
import { KritzelSelectionBox } from '../objects/selection-box.class';
import type { KritzelCore } from '../core/core.class';

// --- Mock Yjs ---
const mockMapObserve = jest.fn();
const mockMapUnobserve = jest.fn();
const mockMapSet = jest.fn();
const mockMapDelete = jest.fn();
const mockMapClear = jest.fn();
const mockMapGet = jest.fn();
const mockMapForEach = jest.fn();

const mockUndoManagerOn = jest.fn();
const mockUndoManagerOff = jest.fn();
const mockUndoManagerUndo = jest.fn();
const mockUndoManagerRedo = jest.fn();
const mockUndoManagerCanUndo = jest.fn().mockReturnValue(false);
const mockUndoManagerCanRedo = jest.fn().mockReturnValue(false);
const mockUndoManagerClear = jest.fn();
const mockUndoManagerDestroy = jest.fn();
const mockUndoManagerStopCapturing = jest.fn();
const mockUndoStack: any[] = [];
const mockRedoStack: any[] = [];

const mockYdocTransact = jest.fn((cb: () => void) => cb());
const mockYdocGetMap = jest.fn().mockReturnValue({
  observe: mockMapObserve,
  unobserve: mockMapUnobserve,
  set: mockMapSet,
  delete: mockMapDelete,
  clear: mockMapClear,
  get: mockMapGet,
  forEach: mockMapForEach,
});
const mockYdocDestroy = jest.fn();
const mockYdocOn = jest.fn();
const mockYdocOff = jest.fn();

jest.mock('yjs', () => ({
  Doc: jest.fn().mockImplementation(() => ({
    transact: mockYdocTransact,
    getMap: mockYdocGetMap,
    destroy: mockYdocDestroy,
    on: mockYdocOn,
    off: mockYdocOff,
  })),
  UndoManager: jest.fn().mockImplementation(() => ({
    on: mockUndoManagerOn,
    off: mockUndoManagerOff,
    undo: mockUndoManagerUndo,
    redo: mockUndoManagerRedo,
    canUndo: mockUndoManagerCanUndo,
    canRedo: mockUndoManagerCanRedo,
    clear: mockUndoManagerClear,
    destroy: mockUndoManagerDestroy,
    stopCapturing: mockUndoManagerStopCapturing,
    get undoStack() { return mockUndoStack; },
    get redoStack() { return mockRedoStack; },
  })),
}));

// --- Mock Quadtree ---
const mockQuadtreeInsert = jest.fn().mockReturnValue(true);
const mockQuadtreeUpdate = jest.fn().mockReturnValue(true);
const mockQuadtreeReindex = jest.fn().mockReturnValue(true);
const mockQuadtreeRemove = jest.fn().mockReturnValue(1);
const mockQuadtreeFilter = jest.fn().mockReturnValue([]);
const mockQuadtreeAllObjects = jest.fn().mockReturnValue([]);
const mockQuadtreeQuery = jest.fn().mockReturnValue([]);
const mockQuadtreeReset = jest.fn();
let mockQuadtreeSize = 0;

jest.mock('./quadtree.structure', () => ({
  KritzelQuadtree: jest.fn().mockImplementation(() => ({
    insert: mockQuadtreeInsert,
    update: mockQuadtreeUpdate,
    reindex: mockQuadtreeReindex,
    remove: mockQuadtreeRemove,
    filter: mockQuadtreeFilter,
    allObjects: mockQuadtreeAllObjects,
    query: mockQuadtreeQuery,
    reset: mockQuadtreeReset,
    get size() { return mockQuadtreeSize; },
  })),
}));

// --- Mock Reviver ---
const mockRevive = jest.fn();
jest.mock('../core/reviver.class', () => ({
  KritzelReviver: jest.fn().mockImplementation(() => ({
    revive: mockRevive,
  })),
}));

// --- Mock SelectionBox (for isPersistable) ---
jest.mock('../objects/selection-box.class');

// --- Mock SelectionGroup (for handleObjectsChange) ---
jest.mock('../objects/selection-group.class');

// --- Mock default sync config ---
jest.mock('../../configs/default-sync.config', () => ({
  DEFAULT_SYNC_CONFIG: { providers: [] },
}));

// --- Mock migration helper ---
const mockRunMigrations = jest.fn().mockReturnValue({ migrated: false, fromVersion: 1, toVersion: 1 });
jest.mock('../../helpers/migration.helper', () => ({
  runMigrations: (...args: unknown[]) => mockRunMigrations(...args),
}));

// --- Mock barrel export for KritzelUndoState ---
jest.mock('../..', () => ({}));

type MockCore = jest.Mocked<Pick<KritzelCore, 'rerender' | 'editorId'>> & {
  anchorManager: {
    rebuildIndex: jest.Mock;
  };
  engine: {
    emitObjectsChange: jest.Mock;
    emitObjectsAdded: jest.Mock;
    emitObjectsRemoved: jest.Mock;
    emitObjectsUpdated: jest.Mock;
  };
  store?: {
    invalidateSelectionCache: jest.Mock;
  };
};

const createMockCore = (overrides: Partial<MockCore> = {}): MockCore => ({
  rerender: jest.fn(),
  editorId: undefined,
  anchorManager: {
    rebuildIndex: jest.fn(),
  },
  engine: {
    emitObjectsChange: jest.fn(),
    emitObjectsAdded: jest.fn(),
    emitObjectsRemoved: jest.fn(),
    emitObjectsUpdated: jest.fn(),
  },
  ...overrides,
});

interface MockProvider {
  type: 'local' | 'network';
  connect: jest.Mock<Promise<void>>;
  disconnect: jest.Mock<void>;
  reconnect: jest.Mock<Promise<void>>;
  destroy: jest.Mock<void>;
  awareness?: any;
}

const createMockProvider = (type: 'local' | 'network' = 'local'): MockProvider => ({
  type,
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn(),
  reconnect: jest.fn().mockResolvedValue(undefined),
  destroy: jest.fn(),
});

const createMockObject = (id: string, opts: { isSelectionBox?: boolean } = {}): any => {
  const obj: any = {
    id,
    rotatedBoundingBox: { x: 0, y: 0, z: 0, width: 10, height: 10 },
    serialize: jest.fn().mockReturnValue({ id, type: 'mock' }),
  };
  if (opts.isSelectionBox) {
    Object.setPrototypeOf(obj, KritzelSelectionBox.prototype);
  }
  return obj;
};

describe('KritzelObjectMap', () => {
  let objectMap: KritzelObjectMap<any>;
  let mockCore: MockCore;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUndoStack.length = 0;
    mockRedoStack.length = 0;
    mockQuadtreeSize = 0;
    mockUndoManagerCanUndo.mockReturnValue(false);
    mockUndoManagerCanRedo.mockReturnValue(false);
    mockQuadtreeFilter.mockReturnValue([]);

    objectMap = new KritzelObjectMap();
    mockCore = createMockCore();
  });

  describe('constructor', () => {
    it('should create a quadtree with infinite bounds', () => {
      const { KritzelQuadtree } = require('./quadtree.structure');
      expect(KritzelQuadtree).toHaveBeenCalledWith(
        { x: -Infinity, y: -Infinity, z: 0, width: Infinity, height: Infinity },
        8,
      );
    });

    it('should start with isReady false', () => {
      expect(objectMap.isReady).toBe(false);
    });

    it('should start with null undoManager', () => {
      expect(objectMap.undoManager).toBeNull();
    });

    it('should start with null workspaceId', () => {
      expect(objectMap.workspaceId).toBeNull();
    });
  });

  describe('initialize', () => {
    it('should set isReady to true after initialization', async () => {
      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [] });

      expect(objectMap.isReady).toBe(true);
    });

    it('should set workspaceId', async () => {
      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-42', { providers: [] });

      expect(objectMap.workspaceId).toBe('ws-42');
    });

    it('should create Y.Doc and get objects map', async () => {
      const Y = require('yjs');
      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [] });

      expect(Y.Doc).toHaveBeenCalled();
      expect(mockYdocGetMap).toHaveBeenCalledWith('objects');
    });

    it('should create UndoManager', async () => {
      const Y = require('yjs');
      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [] });

      expect(Y.UndoManager).toHaveBeenCalled();
    });

    it('should observe the objects map', async () => {
      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [] });

      expect(mockMapObserve).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should connect providers from config', async () => {
      const provider = createMockProvider();
      const factory = { create: jest.fn().mockReturnValue(provider) };
      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [factory] });

      expect(factory.create).toHaveBeenCalledWith('kritzel-workspace-ws-1', expect.anything(), expect.anything());
      expect(provider.connect).toHaveBeenCalled();
    });

    it('should support class constructor providers', async () => {
      const provider = createMockProvider();
      const ProviderClass = jest.fn().mockImplementation(() => provider) as any;

      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [ProviderClass] });

      expect(ProviderClass).toHaveBeenCalledWith('kritzel-workspace-ws-1', expect.anything(), expect.anything());
      expect(provider.connect).toHaveBeenCalled();
    });

    it('should use editorId-namespaced doc name when editorId is set', async () => {
      const coreWithId = createMockCore({ editorId: 'homepage' });
      const provider = createMockProvider();
      const factory = { create: jest.fn().mockReturnValue(provider) };

      await objectMap.initialize(coreWithId as unknown as KritzelCore, 'ws-1', { providers: [factory] });

      expect(factory.create).toHaveBeenCalledWith('kritzel-workspace-homepage-ws-1', expect.anything(), expect.anything());
    });

    it('should use default doc name when editorId is undefined', async () => {
      const coreNoId = createMockCore({ editorId: undefined });
      const provider = createMockProvider();
      const factory = { create: jest.fn().mockReturnValue(provider) };

      await objectMap.initialize(coreNoId as unknown as KritzelCore, 'ws-1', { providers: [factory] });

      expect(factory.create).toHaveBeenCalledWith('kritzel-workspace-ws-1', expect.anything(), expect.anything());
    });

    it('should load objects from Yjs after connecting', async () => {
      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [] });

      expect(mockQuadtreeReset).toHaveBeenCalled();
      expect(mockMapForEach).toHaveBeenCalled();
    });

    it('should register undo manager event listeners', async () => {
      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [] });

      expect(mockUndoManagerOn).toHaveBeenCalledWith('stack-item-added', expect.any(Function));
      expect(mockUndoManagerOn).toHaveBeenCalledWith('stack-item-popped', expect.any(Function));
    });
  });

  describe('whenNetworkSynced', () => {
    it('resolves immediately when there are no network providers', async () => {
      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [] });

      await expect(objectMap.whenNetworkSynced()).resolves.toBeUndefined();
    });

    it('resolves immediately when only local providers are configured', async () => {
      const provider = createMockProvider('local');
      const factory = { create: jest.fn().mockReturnValue(provider) };

      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [factory] });

      await expect(objectMap.whenNetworkSynced()).resolves.toBeUndefined();
    });

    it('stays pending until network providers finish connecting', async () => {
      let resolveConnect!: () => void;
      const provider = createMockProvider('network');
      provider.connect.mockReturnValue(
        new Promise<void>(res => {
          resolveConnect = res;
        }),
      );
      const factory = { create: jest.fn().mockReturnValue(provider) };

      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [factory] });

      let settled = false;
      const syncPromise = objectMap.whenNetworkSynced().then(() => {
        settled = true;
      });

      await Promise.resolve();
      expect(settled).toBe(false);

      resolveConnect();
      await syncPromise;
      expect(settled).toBe(true);
    });

    it('settles even when a network provider fails to connect', async () => {
      const provider = createMockProvider('network');
      provider.connect.mockRejectedValue(new Error('connection timeout'));
      const factory = { create: jest.fn().mockReturnValue(provider) };

      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [factory] });

      await expect(objectMap.whenNetworkSynced()).resolves.toBeUndefined();
    });

    it('does not block initialization on the network sync completing', async () => {
      const provider = createMockProvider('network');
      provider.connect.mockReturnValue(new Promise<void>(() => undefined));
      const factory = { create: jest.fn().mockReturnValue(provider) };

      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [factory] });

      expect(objectMap.isReady).toBe(true);
    });
  });

  describe('insert', () => {
    beforeEach(async () => {
      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [] });
      mockMapSet.mockClear();
      mockYdocTransact.mockClear();
    });

    it('should insert object into quadtree and Yjs map', () => {
      const obj = createMockObject('obj-1');

      const result = objectMap.insert(obj);

      expect(result).toBe(true);
      expect(mockQuadtreeInsert).toHaveBeenCalledWith(obj);
      expect(mockMapSet).toHaveBeenCalledWith('obj-1', { id: 'obj-1', type: 'mock' });
    });

    it('should return false for object without id', () => {
      const obj = createMockObject('');

      const result = objectMap.insert(obj);

      expect(result).toBe(false);
    });

    it('should not persist SelectionBox objects', () => {
      const obj = createMockObject('sb-1', { isSelectionBox: true });

      objectMap.insert(obj);

      expect(mockQuadtreeInsert).toHaveBeenCalledWith(obj);
      expect(mockMapSet).not.toHaveBeenCalled();
    });

    it('should transact with local origin', () => {
      const obj = createMockObject('obj-1');

      objectMap.insert(obj);

      expect(mockYdocTransact).toHaveBeenCalledWith(expect.any(Function), 'local');
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [] });
    });

    it('should update existing object in quadtree and Yjs', () => {
      const obj = createMockObject('obj-1');
      objectMap.insert(obj);
      jest.clearAllMocks();

      const result = objectMap.update(obj);

      expect(result).toBe(true);
      expect(mockQuadtreeReindex).toHaveBeenCalledWith(obj);
      expect(mockMapSet).toHaveBeenCalledWith('obj-1', { id: 'obj-1', type: 'mock' });
    });

    it('should return false for object without id', () => {
      const obj = createMockObject('');

      const result = objectMap.update(obj);

      expect(result).toBe(false);
    });

    it('should return false when object does not exist', () => {
      const result = objectMap.update(createMockObject('nonexistent'));

      expect(result).toBe(false);
    });

    it('should use temporary origin when option is set', () => {
      const obj = createMockObject('obj-1');
      objectMap.insert(obj);
      mockYdocTransact.mockClear();

      objectMap.update(obj, { temporary: true });

      expect(mockYdocTransact).toHaveBeenCalledWith(expect.any(Function), 'temporary');
    });

    it('should use local origin by default', () => {
      const obj = createMockObject('obj-1');
      objectMap.insert(obj);
      mockYdocTransact.mockClear();

      objectMap.update(obj);

      expect(mockYdocTransact).toHaveBeenCalledWith(expect.any(Function), 'local');
    });

    it('should not persist SelectionBox objects', () => {
      const obj = createMockObject('sb-1', { isSelectionBox: true });
      objectMap.insert(obj);
      jest.clearAllMocks();

      objectMap.update(obj);

      expect(mockQuadtreeReindex).toHaveBeenCalledWith(obj);
      // mapSet should not have been called during update (SelectionBox is not persistable)
      const setCallsAfterInit = mockMapSet.mock.calls;
      expect(setCallsAfterInit.filter((c: any) => c[0] === 'sb-1')).toHaveLength(0);
    });

    it('should skip reindex when skipReindex option is true', () => {
      const obj = createMockObject('obj-1');
      objectMap.insert(obj);
      jest.clearAllMocks();

      const result = objectMap.update(obj, { skipReindex: true });

      expect(result).toBe(true);
      expect(mockQuadtreeUpdate).toHaveBeenCalledWith(obj);
      expect(mockQuadtreeReindex).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    beforeEach(async () => {
      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [] });
    });

    it('should remove matching objects from quadtree and Yjs', () => {
      const obj = createMockObject('obj-1');
      mockQuadtreeFilter.mockReturnValueOnce([obj]);

      objectMap.remove(o => o.id === 'obj-1');

      expect(mockQuadtreeRemove).toHaveBeenCalled();
      expect(mockMapDelete).toHaveBeenCalledWith('obj-1');
    });

    it('should not delete from Yjs for SelectionBox objects', () => {
      const obj = createMockObject('sb-1', { isSelectionBox: true });
      mockQuadtreeFilter.mockReturnValueOnce([obj]);

      objectMap.remove(o => o.id === 'sb-1');

      expect(mockQuadtreeRemove).toHaveBeenCalled();
      expect(mockMapDelete).not.toHaveBeenCalled();
    });

    it('should do nothing when no objects match', () => {
      mockQuadtreeFilter.mockReturnValueOnce([]);

      objectMap.remove(o => o.id === 'nonexistent');

      expect(mockQuadtreeRemove).not.toHaveBeenCalled();
    });
  });

  describe('filter / allObjects / query', () => {
    beforeEach(async () => {
      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [] });
    });

    it('should delegate filter to quadtree', () => {
      const predicate = (o: any) => o.id === 'a';
      objectMap.filter(predicate);

      expect(mockQuadtreeFilter).toHaveBeenCalledWith(predicate);
    });

    it('should delegate allObjects to quadtree', () => {
      objectMap.allObjects();

      expect(mockQuadtreeAllObjects).toHaveBeenCalled();
    });

    it('should delegate query to quadtree', () => {
      const range = { x: 0, y: 0, z: 0, width: 100, height: 100 };
      objectMap.query(range);

      expect(mockQuadtreeQuery).toHaveBeenCalledWith(range);
    });
  });

  describe('totalCount', () => {
    it('should return quadtree size', () => {
      mockQuadtreeSize = 42;

      expect(objectMap.totalCount).toBe(42);
    });
  });

  describe('transaction', () => {
    beforeEach(async () => {
      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [] });
    });

    it('should run callback inside a Y.Doc transaction with local origin', () => {
      const callback = jest.fn();
      mockYdocTransact.mockClear();

      objectMap.transaction(callback);

      expect(mockYdocTransact).toHaveBeenCalledWith(callback, 'local');
    });
  });

  describe('reset', () => {
    beforeEach(async () => {
      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [] });
    });

    it('should reset quadtree and clear Yjs map', () => {
      mockQuadtreeReset.mockClear();

      objectMap.reset();

      expect(mockQuadtreeReset).toHaveBeenCalled();
      expect(mockMapClear).toHaveBeenCalled();
    });
  });

  describe('undo / redo', () => {
    beforeEach(async () => {
      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [] });
    });

    it('should call undoManager.undo when canUndo is true', () => {
      mockUndoManagerCanUndo.mockReturnValue(true);

      objectMap.undo();

      expect(mockUndoManagerUndo).toHaveBeenCalled();
      expect(mockCore.anchorManager.rebuildIndex).toHaveBeenCalled();
      expect(mockCore.engine.emitObjectsChange).toHaveBeenCalled();
    });

    it('should not call undo when canUndo is false', () => {
      mockUndoManagerCanUndo.mockReturnValue(false);

      objectMap.undo();

      expect(mockUndoManagerUndo).not.toHaveBeenCalled();
    });

    it('should call undoManager.redo when canRedo is true', () => {
      mockUndoManagerCanRedo.mockReturnValue(true);

      objectMap.redo();

      expect(mockUndoManagerRedo).toHaveBeenCalled();
      expect(mockCore.anchorManager.rebuildIndex).toHaveBeenCalled();
      expect(mockCore.engine.emitObjectsChange).toHaveBeenCalled();
    });

    it('should not call redo when canRedo is false', () => {
      mockUndoManagerCanRedo.mockReturnValue(false);

      objectMap.redo();

      expect(mockUndoManagerRedo).not.toHaveBeenCalled();
    });
  });

  describe('canUndo / canRedo', () => {
    beforeEach(async () => {
      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [] });
    });

    it('should delegate canUndo to undoManager', () => {
      mockUndoManagerCanUndo.mockReturnValue(true);
      expect(objectMap.canUndo()).toBe(true);

      mockUndoManagerCanUndo.mockReturnValue(false);
      expect(objectMap.canUndo()).toBe(false);
    });

    it('should delegate canRedo to undoManager', () => {
      mockUndoManagerCanRedo.mockReturnValue(true);
      expect(objectMap.canRedo()).toBe(true);

      mockUndoManagerCanRedo.mockReturnValue(false);
      expect(objectMap.canRedo()).toBe(false);
    });

    it('should return false when undoManager is null', () => {
      const freshMap = new KritzelObjectMap();
      expect(freshMap.canUndo()).toBe(false);
      expect(freshMap.canRedo()).toBe(false);
    });
  });

  describe('undoState', () => {
    it('should return all-false state when undoManager is null', () => {
      const freshMap = new KritzelObjectMap();

      expect(freshMap.undoState).toEqual({
        canUndo: false,
        canRedo: false,
        undoStackSize: 0,
        redoStackSize: 0,
      });
    });

    it('should reflect undoManager state after initialization', async () => {
      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [] });
      mockUndoManagerCanUndo.mockReturnValue(true);
      mockUndoManagerCanRedo.mockReturnValue(false);
      mockUndoStack.push({}, {});
      mockRedoStack.push({});

      const state = objectMap.undoState;

      expect(state).toEqual({
        canUndo: true,
        canRedo: false,
        undoStackSize: 2,
        redoStackSize: 1,
      });
    });
  });

  describe('clearHistory', () => {
    beforeEach(async () => {
      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [] });
    });

    it('should clear the undoManager', () => {
      objectMap.clearHistory();

      expect(mockUndoManagerClear).toHaveBeenCalled();
    });
  });

  describe('consolidateTemporaryItems', () => {
    beforeEach(async () => {
      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [] });
    });

    it('should do nothing when temporaryItemsCount is 0', () => {
      objectMap.consolidateTemporaryItems();

      expect(mockUndoManagerStopCapturing).not.toHaveBeenCalled();
    });

    it('should reset temporaryItemsCount when undo stack is empty', () => {
      // Simulate adding a temporary item via the stack-item-added handler
      const addedHandler = mockUndoManagerOn.mock.calls.find(
        (c: any) => c[0] === 'stack-item-added'
      )[1];
      addedHandler({ type: 'undo', origin: 'temporary' });

      objectMap.consolidateTemporaryItems();

      // When stack is empty, returns early without calling stopCapturing
      expect(mockUndoManagerStopCapturing).not.toHaveBeenCalled();
      // Verify count was reset - clearTemporaryItems should be a no-op now
      mockUndoStack.push({});
      objectMap.clearTemporaryItems();
      expect(mockUndoStack.length).toBe(1);
    });
  });

  describe('clearTemporaryItems', () => {
    beforeEach(async () => {
      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [] });
    });

    it('should do nothing when temporaryItemsCount is 0', () => {
      objectMap.clearTemporaryItems();

      // No stack manipulation should occur
      expect(mockUndoStack.length).toBe(0);
    });

    it('should pop items from undo stack', () => {
      // Simulate adding temporary items
      const addedHandler = mockUndoManagerOn.mock.calls.find(
        (c: any) => c[0] === 'stack-item-added'
      )[1];
      addedHandler({ type: 'undo', origin: 'temporary' });
      addedHandler({ type: 'undo', origin: 'temporary' });

      mockUndoStack.push({}, {});

      objectMap.clearTemporaryItems();

      expect(mockUndoStack.length).toBe(0);
    });
  });

  describe('stack-item event handlers', () => {
    beforeEach(async () => {
      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [] });
    });

    it('should increment temporaryItemsCount on temporary stack-item-added', () => {
      const addedHandler = mockUndoManagerOn.mock.calls.find(
        (c: any) => c[0] === 'stack-item-added'
      )[1];

      addedHandler({ type: 'undo', origin: 'temporary' });

      // Verify by checking clearTemporaryItems removes one item
      mockUndoStack.push({});
      objectMap.clearTemporaryItems();
      expect(mockUndoStack.length).toBe(0);
    });

    it('should not increment for non-temporary stack-item-added', () => {
      const addedHandler = mockUndoManagerOn.mock.calls.find(
        (c: any) => c[0] === 'stack-item-added'
      )[1];

      addedHandler({ type: 'undo', origin: 'local' });

      // clearTemporaryItems should do nothing since count is 0
      mockUndoStack.push({});
      objectMap.clearTemporaryItems();
      expect(mockUndoStack.length).toBe(1);
    });

    it('should not increment for non-undo type events', () => {
      const addedHandler = mockUndoManagerOn.mock.calls.find(
        (c: any) => c[0] === 'stack-item-added'
      )[1];

      addedHandler({ type: 'redo', origin: 'temporary' });

      mockUndoStack.push({});
      objectMap.clearTemporaryItems();
      expect(mockUndoStack.length).toBe(1);
    });

    it('should decrement temporaryItemsCount on temporary stack-item-popped', () => {
      const addedHandler = mockUndoManagerOn.mock.calls.find(
        (c: any) => c[0] === 'stack-item-added'
      )[1];
      const poppedHandler = mockUndoManagerOn.mock.calls.find(
        (c: any) => c[0] === 'stack-item-popped'
      )[1];

      // Add two, pop one
      addedHandler({ type: 'undo', origin: 'temporary' });
      addedHandler({ type: 'undo', origin: 'temporary' });
      poppedHandler({ type: 'undo', origin: 'temporary' });

      // Should have count of 1 now
      mockUndoStack.push({}, {});
      objectMap.clearTemporaryItems();
      expect(mockUndoStack.length).toBe(1);
    });
  });

  describe('handleObjectsChange with SelectionGroup', () => {
    let mockSelectionGroup: any;
    let mockStore: any;
    let observerCallback: (event: any) => void;

    beforeEach(async () => {
      // Create a mock SelectionGroup
      mockSelectionGroup = {
        id: 'sg-1',
        __class__: 'KritzelSelectionGroup',
        objectIds: ['obj-1', 'obj-2'],
        deselectAllChildren: jest.fn(),
        invalidateObjectsCache: jest.fn(),
        refreshObjectDimensions: jest.fn(),
        captureUnchangedSnapshots: jest.fn(),
        rotatedBoundingBox: { x: 0, y: 0, z: 0, width: 100, height: 100 },
        serialize: jest.fn().mockReturnValue({ id: 'sg-1', __class__: 'KritzelSelectionGroup' }),
      };

      // Make the mock a SelectionGroup instance
      const { KritzelSelectionGroup } = require('../objects/selection-group.class');
      Object.setPrototypeOf(mockSelectionGroup, KritzelSelectionGroup.prototype);

      // Setup mock store with invalidateSelectionCache
      mockStore = {
        invalidateSelectionCache: jest.fn(),
      };

      mockCore = {
        ...createMockCore(),
        store: mockStore,
      };

      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [] });

      // Capture the observer callback
      observerCallback = mockMapObserve.mock.calls[0][0];
    });

    it('should call refreshObjectDimensions with skipPersist=true when processing SelectionGroup via undo/redo', () => {
      // Mock the reviver to return our SelectionGroup
      mockRevive.mockReturnValueOnce(mockSelectionGroup);

      // Mock that the object exists in the quadtree (so it's an update, not insert)
      mockQuadtreeFilter.mockReturnValue([mockSelectionGroup]);

      // Mock the serialized data in Yjs map
      mockMapGet.mockReturnValueOnce({ id: 'sg-1', __class__: 'KritzelSelectionGroup' });

      // Create a mock YMapEvent for a non-local transaction (undo/redo scenario)
      const mockEvent = {
        transaction: { origin: null }, // null origin = remote or undo/redo
        keysChanged: new Set(['sg-1']),
        changes: {
          keys: new Map([['sg-1', { action: 'update' }]]),
        },
      };

      // Trigger the observer callback
      observerCallback(mockEvent);

      // Verify refreshObjectDimensions was called with skipPersist=true
      expect(mockSelectionGroup.invalidateObjectsCache).toHaveBeenCalled();
      expect(mockSelectionGroup.refreshObjectDimensions).toHaveBeenCalledWith(undefined, true);
      expect(mockSelectionGroup.captureUnchangedSnapshots).toHaveBeenCalled();
    });

    it('should not create additional undo entries when refreshing SelectionGroup dimensions after undo/redo', () => {
      // Mock the reviver to return our SelectionGroup
      mockRevive.mockReturnValueOnce(mockSelectionGroup);
      mockQuadtreeFilter.mockReturnValue([mockSelectionGroup]);
      mockMapGet.mockReturnValueOnce({ id: 'sg-1', __class__: 'KritzelSelectionGroup' });

      // Clear transact calls after initialization
      mockYdocTransact.mockClear();

      const mockEvent = {
        transaction: { origin: null },
        keysChanged: new Set(['sg-1']),
        changes: {
          keys: new Map([['sg-1', { action: 'update' }]]),
        },
      };

      observerCallback(mockEvent);

      // Verify that no additional Yjs transactions were created for updating the SelectionGroup
      // The only transact calls should not be for persisting the SelectionGroup
      const updateCalls = mockYdocTransact.mock.calls.filter(
        (call: any) => call[1] === 'local'
      );
      expect(updateCalls.length).toBe(0);
    });

    it('should refresh existing SelectionGroups when their child objects change via undo/redo', () => {
      const mockChildObject = {
        id: 'obj-1',
        __class__: 'KritzelPath',
        rotatedBoundingBox: { x: 0, y: 0, z: 0, width: 50, height: 50 },
        serialize: jest.fn().mockReturnValue({ id: 'obj-1', __class__: 'KritzelPath' }),
      };

      // Insert the child object first so _idMap.has('obj-1') returns true (simulates existing object)
      objectMap.insert(mockChildObject as any);

      // First call returns the child object (regular object update)
      mockRevive.mockReturnValueOnce(mockChildObject);

      // Mock quadtree to return the existing SelectionGroup when filtering for SelectionGroups
      mockQuadtreeFilter
        .mockReturnValueOnce([mockSelectionGroup]); // filter: find SelectionGroups

      mockMapGet.mockReturnValueOnce({ id: 'obj-1', __class__: 'KritzelPath' });

      mockYdocTransact.mockClear();

      const mockEvent = {
        transaction: { origin: null },
        keysChanged: new Set(['obj-1']),
        changes: {
          keys: new Map([['obj-1', { action: 'update' }]]),
        },
      };

      observerCallback(mockEvent);

      // Verify the SelectionGroup was refreshed with skipPersist=true
      expect(mockSelectionGroup.invalidateObjectsCache).toHaveBeenCalled();
      expect(mockSelectionGroup.refreshObjectDimensions).toHaveBeenCalledWith(undefined, true);
      expect(mockSelectionGroup.captureUnchangedSnapshots).toHaveBeenCalled();

      // Verify no local transactions were created
      const localTransactCalls = mockYdocTransact.mock.calls.filter(
        (call: any) => call[1] === 'local'
      );
      expect(localTransactCalls.length).toBe(0);
    });

    it('should invalidate store selection cache after processing undo/redo changes', () => {
      mockRevive.mockReturnValueOnce(mockSelectionGroup);
      mockQuadtreeFilter.mockReturnValue([mockSelectionGroup]);
      mockMapGet.mockReturnValueOnce({ id: 'sg-1', __class__: 'KritzelSelectionGroup' });

      const mockEvent = {
        transaction: { origin: null },
        keysChanged: new Set(['sg-1']),
        changes: {
          keys: new Map([['sg-1', { action: 'update' }]]),
        },
      };

      observerCallback(mockEvent);

      expect(mockStore.invalidateSelectionCache).toHaveBeenCalled();
    });

    it('should deselect children when a remote SelectionGroup is deleted', () => {
      const child = { id: 'obj-1', isSelected: true };
      mockSelectionGroup.deselectAllChildren = jest.fn(() => {
        child.isSelected = false;
      });

      // Ensure the SelectionGroup exists in the local id map before delete arrives.
      objectMap.insert(mockSelectionGroup as any);

      const mockEvent = {
        transaction: { origin: null },
        keysChanged: new Set(['sg-1']),
        changes: {
          keys: new Map([['sg-1', { action: 'delete' }]]),
        },
      };

      observerCallback(mockEvent);

      expect(mockSelectionGroup.deselectAllChildren).toHaveBeenCalled();
      expect(child.isSelected).toBe(false);
    });

    it('should rebuild the anchor index when a remote line is updated', () => {
      const { KritzelLine } = require('../objects/line.class');
      const mockLine: any = {
        id: 'line-1',
        __class__: 'KritzelLine',
        serialize: jest.fn().mockReturnValue({ id: 'line-1', __class__: 'KritzelLine' }),
        adoptTransientStateFrom: jest.fn(),
      };
      Object.setPrototypeOf(mockLine, KritzelLine.prototype);

      mockRevive.mockReturnValueOnce(mockLine);
      mockMapGet.mockReturnValueOnce({ id: 'line-1', __class__: 'KritzelLine' });

      const mockEvent = {
        transaction: { origin: null },
        keysChanged: new Set(['line-1']),
        changes: {
          keys: new Map([['line-1', { action: 'update' }]]),
        },
      };

      observerCallback(mockEvent);

      expect(mockCore.anchorManager.rebuildIndex).toHaveBeenCalled();
    });

    it('should rebuild the anchor index when a remote line is deleted', () => {
      const { KritzelLine } = require('../objects/line.class');
      const mockLine: any = { id: 'line-1', __class__: 'KritzelLine' };
      Object.setPrototypeOf(mockLine, KritzelLine.prototype);

      // The line must already exist locally so the delete path can detect its type.
      objectMap.insert(mockLine);

      const mockEvent = {
        transaction: { origin: null },
        keysChanged: new Set(['line-1']),
        changes: {
          keys: new Map([['line-1', { action: 'delete' }]]),
        },
      };

      observerCallback(mockEvent);

      expect(mockCore.anchorManager.rebuildIndex).toHaveBeenCalled();
    });

    it('should not rebuild the anchor index when only non-line objects change remotely', () => {
      const mockPath = {
        id: 'obj-1',
        __class__: 'KritzelPath',
        serialize: jest.fn().mockReturnValue({ id: 'obj-1', __class__: 'KritzelPath' }),
      };

      mockRevive.mockReturnValueOnce(mockPath);
      mockMapGet.mockReturnValueOnce({ id: 'obj-1', __class__: 'KritzelPath' });

      const mockEvent = {
        transaction: { origin: null },
        keysChanged: new Set(['obj-1']),
        changes: {
          keys: new Map([['obj-1', { action: 'update' }]]),
        },
      };

      observerCallback(mockEvent);

      expect(mockCore.anchorManager.rebuildIndex).not.toHaveBeenCalled();
    });
  });

  describe('loadFromYjs', () => {
    it('should reset quadtree and revive objects from Yjs map', async () => {
      const revived = createMockObject('revived-1');
      mockRevive.mockReturnValue(revived);
      mockMapForEach.mockImplementation((cb: (val: any) => void) => {
        cb({ id: 'revived-1', type: 'path' });
      });

      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [] });

      expect(mockQuadtreeReset).toHaveBeenCalled();
      expect(mockRevive).toHaveBeenCalledWith({ id: 'revived-1', type: 'path' });
      expect(mockQuadtreeInsert).toHaveBeenCalledWith(revived);
    });
  });

  describe('destroy', () => {
    beforeEach(async () => {
      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [] });
    });

    it('should unobserve the objects map', () => {
      objectMap.destroy();

      expect(mockMapUnobserve).toHaveBeenCalled();
    });

    it('should remove undo manager event listeners and destroy it', () => {
      objectMap.destroy();

      expect(mockUndoManagerOff).toHaveBeenCalledWith('stack-item-added', expect.any(Function));
      expect(mockUndoManagerOff).toHaveBeenCalledWith('stack-item-popped', expect.any(Function));
      expect(mockUndoManagerDestroy).toHaveBeenCalled();
    });

    it('should reset quadtree', () => {
      mockQuadtreeReset.mockClear();

      objectMap.destroy();

      expect(mockQuadtreeReset).toHaveBeenCalled();
    });

    it('should destroy Y.Doc', () => {
      objectMap.destroy();

      expect(mockYdocDestroy).toHaveBeenCalled();
    });

    it('should reset state properties', () => {
      objectMap.destroy();

      expect(objectMap.isReady).toBe(false);
      expect(objectMap.workspaceId).toBeNull();
      expect(objectMap.undoManager).toBeNull();
    });

    it('should destroy providers', async () => {
      const provider = createMockProvider();
      const factory = { create: jest.fn().mockReturnValue(provider) };

      const map2 = new KritzelObjectMap();
      await map2.initialize(mockCore as unknown as KritzelCore, 'ws-2', { providers: [factory] });

      map2.destroy();

      expect(provider.destroy).toHaveBeenCalled();
    });
  });

  describe('schema migrations', () => {
    it('should call runMigrations during initialization', async () => {
      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [] });

      expect(mockRunMigrations).toHaveBeenCalledWith(
        expect.anything(), // ydoc
        expect.anything(), // metadataMap
        expect.objectContaining({ objects: expect.anything() }),
        expect.any(Array), // WORKSPACE_MIGRATIONS
        expect.any(Number), // CURRENT_WORKSPACE_SCHEMA_VERSION
        expect.objectContaining({ quiet: expect.any(Boolean) }),
      );
    });

    it('should set schemaVersion in metadata for new documents', async () => {
      mockMapGet.mockReturnValue(undefined);

      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [] });

      expect(mockMapSet).toHaveBeenCalledWith('schemaVersion', expect.any(Number));
    });

    it('should not overwrite schemaVersion if already set', async () => {
      mockMapGet.mockImplementation((key: string) => {
        if (key === 'schemaVersion') return 1;
        if (key === 'type') return 'workspace';
        if (key === 'isPublic') return false;
        return undefined;
      });

      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [] });

      const schemaVersionCalls = mockMapSet.mock.calls.filter(
        (call: unknown[]) => call[0] === 'schemaVersion'
      );
      expect(schemaVersionCalls).toHaveLength(0);
    });

    it('should skip processing for migration origin in handleObjectsChange', async () => {
      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [] });
      const observerCallback = mockMapObserve.mock.calls[0][0];

      mockCore.rerender.mockClear();
      mockRevive.mockClear();

      observerCallback({
        transaction: { origin: 'migration' },
        keysChanged: new Set(['obj-1']),
        changes: { keys: new Map([['obj-1', { action: 'update' }]]) },
      });

      expect(mockCore.rerender).not.toHaveBeenCalled();
      expect(mockRevive).not.toHaveBeenCalled();
    });
  });

  describe('hasAwareness', () => {
    it('should return false when no awareness is available', () => {
      expect(objectMap.hasAwareness).toBe(false);
    });

    it('should return true when awareness is available', async () => {
      const mockAwareness = {
        clientID: 42,
        on: jest.fn(),
        off: jest.fn(),
        getStates: jest.fn().mockReturnValue(new Map()),
        setLocalStateField: jest.fn(),
      };
      const provider = createMockProvider('network');
      provider.awareness = mockAwareness;
      const factory = { create: jest.fn().mockReturnValue(provider) };

      const map2 = new KritzelObjectMap();
      await map2.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [factory] });

      expect(map2.hasAwareness).toBe(true);
    });
  });

  describe('localClientId', () => {
    it('should return null when no awareness is available', () => {
      expect(objectMap.localClientId).toBeNull();
    });

    it('should return the awareness clientID when available', async () => {
      const mockAwareness = {
        clientID: 42,
        on: jest.fn(),
        off: jest.fn(),
        getStates: jest.fn().mockReturnValue(new Map()),
        setLocalStateField: jest.fn(),
      };
      const provider = createMockProvider('network');
      provider.awareness = mockAwareness;
      const factory = { create: jest.fn().mockReturnValue(provider) };

      const map2 = new KritzelObjectMap();
      await map2.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [factory] });

      expect(map2.localClientId).toBe(42);
    });
  });

  describe('setActiveDrawingObject', () => {
    it('should do nothing when no awareness is available', () => {
      // No awareness set up — should not throw
      objectMap.setActiveDrawingObject('obj-1');
    });

    it('should call setLocalStateField with the objectId', async () => {
      const mockAwareness = {
        clientID: 42,
        on: jest.fn(),
        off: jest.fn(),
        getStates: jest.fn().mockReturnValue(new Map()),
        setLocalStateField: jest.fn(),
      };
      const provider = createMockProvider('network');
      provider.awareness = mockAwareness;
      const factory = { create: jest.fn().mockReturnValue(provider) };

      const map2 = new KritzelObjectMap();
      await map2.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [factory] });

      map2.setActiveDrawingObject('obj-123');

      expect(mockAwareness.setLocalStateField).toHaveBeenCalledWith('activeObjectId', 'obj-123');
    });

    it('should call setLocalStateField with null to clear', async () => {
      const mockAwareness = {
        clientID: 42,
        on: jest.fn(),
        off: jest.fn(),
        getStates: jest.fn().mockReturnValue(new Map()),
        setLocalStateField: jest.fn(),
      };
      const provider = createMockProvider('network');
      provider.awareness = mockAwareness;
      const factory = { create: jest.fn().mockReturnValue(provider) };

      const map2 = new KritzelObjectMap();
      await map2.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [factory] });

      map2.setActiveDrawingObject(null);

      expect(mockAwareness.setLocalStateField).toHaveBeenCalledWith('activeObjectId', null);
    });
  });

  describe('onObjectsChange', () => {
    it('should register a callback', () => {
      const callback = jest.fn();
      objectMap.onObjectsChange(callback);
      // No error means it registered successfully
    });
  });

  describe('removeOrphanedSelectionGroups', () => {
    const createMockAwareness = (states: Map<number, Record<string, unknown>> = new Map()) => ({
      clientID: 1,
      on: jest.fn(),
      off: jest.fn(),
      getStates: jest.fn().mockReturnValue(states),
      setLocalStateField: jest.fn(),
    });

    const createMockSelectionGroup = (id: string, userId: string | null) => {
      const { KritzelSelectionGroup } = require('../objects/selection-group.class');
      const sg: any = {
        id,
        userId,
        __class__: 'KritzelSelectionGroup',
        rotatedBoundingBox: { x: 0, y: 0, z: 0, width: 10, height: 10 },
        serialize: jest.fn().mockReturnValue({ id, __class__: 'KritzelSelectionGroup' }),
      };
      Object.setPrototypeOf(sg, KritzelSelectionGroup.prototype);
      return sg;
    };

    it('should do nothing when no awareness is available', async () => {
      await objectMap.initialize(mockCore as unknown as KritzelCore, 'ws-1', { providers: [] });

      objectMap.removeOrphanedSelectionGroups();

      expect(mockQuadtreeFilter).not.toHaveBeenCalled();
    });

    it('should remove selection groups whose userId is not in awareness', async () => {
      const states = new Map<number, Record<string, unknown>>([
        [1, { user: { id: 'local-user' } }],
      ]);
      const mockAwareness = createMockAwareness(states);
      const provider = createMockProvider('network');
      provider.awareness = mockAwareness;
      const factory = { create: jest.fn().mockReturnValue(provider) };

      const coreWithUser = {
        ...createMockCore(),
        user: { id: 'local-user' },
        store: { invalidateSelectionCache: jest.fn() },
      };

      const map2 = new KritzelObjectMap();
      await map2.initialize(coreWithUser as unknown as KritzelCore, 'ws-1', { providers: [factory] });

      const orphanedGroup = createMockSelectionGroup('sg-remote', 'disconnected-user');
      mockQuadtreeFilter.mockReturnValueOnce([orphanedGroup]);
      mockYdocTransact.mockClear();

      map2.removeOrphanedSelectionGroups();

      expect(mockQuadtreeRemove).toHaveBeenCalled();
      expect(mockMapDelete).toHaveBeenCalledWith('sg-remote');
      expect(coreWithUser.store.invalidateSelectionCache).toHaveBeenCalled();
      expect(coreWithUser.rerender).toHaveBeenCalled();
    });

    it('should not remove the local user selection group', async () => {
      const states = new Map<number, Record<string, unknown>>([
        [1, { user: { id: 'local-user' } }],
      ]);
      const mockAwareness = createMockAwareness(states);
      const provider = createMockProvider('network');
      provider.awareness = mockAwareness;
      const factory = { create: jest.fn().mockReturnValue(provider) };

      const coreWithUser = {
        ...createMockCore(),
        user: { id: 'local-user' },
        store: { invalidateSelectionCache: jest.fn() },
      };

      const map2 = new KritzelObjectMap();
      await map2.initialize(coreWithUser as unknown as KritzelCore, 'ws-1', { providers: [factory] });

      // The filter should receive a predicate that excludes the local user's group
      mockQuadtreeFilter.mockReturnValueOnce([]);

      map2.removeOrphanedSelectionGroups();

      expect(mockQuadtreeRemove).not.toHaveBeenCalled();
      expect(coreWithUser.store.invalidateSelectionCache).not.toHaveBeenCalled();
    });

    it('should not remove selection groups for users still in awareness', async () => {
      const states = new Map<number, Record<string, unknown>>([
        [1, { user: { id: 'local-user' } }],
        [2, { user: { id: 'remote-user' } }],
      ]);
      const mockAwareness = createMockAwareness(states);
      const provider = createMockProvider('network');
      provider.awareness = mockAwareness;
      const factory = { create: jest.fn().mockReturnValue(provider) };

      const coreWithUser = {
        ...createMockCore(),
        user: { id: 'local-user' },
        store: { invalidateSelectionCache: jest.fn() },
      };

      const map2 = new KritzelObjectMap();
      await map2.initialize(coreWithUser as unknown as KritzelCore, 'ws-1', { providers: [factory] });

      // The filter should return nothing since no groups are orphaned
      mockQuadtreeFilter.mockReturnValueOnce([]);

      map2.removeOrphanedSelectionGroups();

      expect(mockQuadtreeRemove).not.toHaveBeenCalled();
    });

    it('should be triggered when awareness reports removed clients', async () => {
      const states = new Map<number, Record<string, unknown>>([
        [1, { user: { id: 'local-user' } }],
      ]);
      const mockAwareness = createMockAwareness(states);
      const provider = createMockProvider('network');
      provider.awareness = mockAwareness;
      const factory = { create: jest.fn().mockReturnValue(provider) };

      const coreWithUser = {
        ...createMockCore(),
        user: { id: 'local-user' },
        store: { invalidateSelectionCache: jest.fn() },
      };

      const map2 = new KritzelObjectMap();
      await map2.initialize(coreWithUser as unknown as KritzelCore, 'ws-1', { providers: [factory] });

      // Get the awareness change handler that was registered
      const awarenessHandler = mockAwareness.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'change',
      )?.[1];
      expect(awarenessHandler).toBeDefined();

      const orphanedGroup = createMockSelectionGroup('sg-orphan', 'gone-user');
      mockQuadtreeFilter.mockReturnValueOnce([orphanedGroup]);

      // Simulate a client disconnect
      awarenessHandler({ added: [], updated: [], removed: [2] });

      expect(mockQuadtreeRemove).toHaveBeenCalled();
      expect(mockMapDelete).toHaveBeenCalledWith('sg-orphan');
    });
  });

  describe('loadFromYjs - stale selection group cleanup', () => {
    it('should skip remote selection groups during load', async () => {
      const { KritzelSelectionGroup } = require('../objects/selection-group.class');

      const normalObject = createMockObject('obj-1');
      const remoteSelGroup: any = {
        id: 'sg-remote',
        userId: 'other-user',
        __class__: 'KritzelSelectionGroup',
        rotatedBoundingBox: { x: 0, y: 0, z: 0, width: 10, height: 10 },
        serialize: jest.fn(),
      };
      Object.setPrototypeOf(remoteSelGroup, KritzelSelectionGroup.prototype);

      let callIndex = 0;
      mockRevive.mockImplementation(() => {
        return callIndex++ === 0 ? normalObject : remoteSelGroup;
      });

      mockMapForEach.mockImplementation((cb: (val: any, key: string) => void) => {
        cb({ id: 'obj-1', type: 'path' }, 'obj-1');
        cb({ id: 'sg-remote', __class__: 'KritzelSelectionGroup' }, 'sg-remote');
      });

      const coreWithUser = {
        ...createMockCore(),
        user: { id: 'local-user' },
      };

      await objectMap.initialize(coreWithUser as unknown as KritzelCore, 'ws-1', { providers: [] });

      // Normal object should be inserted
      expect(mockQuadtreeInsert).toHaveBeenCalledWith(normalObject);
      // Remote selection group should be deleted from Yjs
      expect(mockMapDelete).toHaveBeenCalledWith('sg-remote');
    });

    it('should keep the local user selection group during load', async () => {
      const { KritzelSelectionGroup } = require('../objects/selection-group.class');

      const localSelGroup: any = {
        id: 'sg-local',
        userId: 'local-user',
        __class__: 'KritzelSelectionGroup',
        rotatedBoundingBox: { x: 0, y: 0, z: 0, width: 10, height: 10 },
        serialize: jest.fn().mockReturnValue({ id: 'sg-local', __class__: 'KritzelSelectionGroup' }),
      };
      Object.setPrototypeOf(localSelGroup, KritzelSelectionGroup.prototype);

      mockRevive.mockReturnValue(localSelGroup);
      mockMapForEach.mockImplementation((cb: (val: any, key: string) => void) => {
        cb({ id: 'sg-local', __class__: 'KritzelSelectionGroup' }, 'sg-local');
      });

      const coreWithUser = {
        ...createMockCore(),
        user: { id: 'local-user' },
      };

      await objectMap.initialize(coreWithUser as unknown as KritzelCore, 'ws-1', { providers: [] });

      // Local user's selection group should be inserted, not deleted
      expect(mockQuadtreeInsert).toHaveBeenCalledWith(localSelGroup);
      expect(mockMapDelete).not.toHaveBeenCalledWith('sg-local');
    });
  });
});
