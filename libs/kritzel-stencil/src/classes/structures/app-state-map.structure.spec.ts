import { KritzelAppStateMap } from './app-state-map.structure';
import type { KritzelCore } from '../core/core.class';

// --- Mock Yjs ---
const mockMapObserve = jest.fn();
const mockMapUnobserve = jest.fn();
const mockMapSet = jest.fn();
const mockMapDelete = jest.fn();
const mockMapClear = jest.fn();
const mockMapGet = jest.fn();
const mockMapForEach = jest.fn();

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

jest.mock('yjs', () => ({
  Doc: jest.fn().mockImplementation(() => ({
    transact: mockYdocTransact,
    getMap: mockYdocGetMap,
    destroy: mockYdocDestroy,
  })),
}));

// --- Mock KritzelWorkspace ---
jest.mock('../core/workspace.class', () => ({
  KritzelWorkspace: jest.fn().mockImplementation((config: any) => ({
    id: config?.id ?? 'generated-id',
    name: config?.name ?? 'New Workspace',
    viewport: config?.viewport ?? { centerWorldX: 0, centerWorldY: 0, scale: 1 },
    createdAt: new Date(),
    updatedAt: new Date(),
    _core: null,
    serialize: jest.fn().mockReturnValue({
      id: config?.id ?? 'generated-id',
      name: config?.name ?? 'New Workspace',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewport: config?.viewport ?? { centerWorldX: 0, centerWorldY: 0, scale: 1 },
    }),
  })),
}));

// --- Mock default sync config ---
jest.mock('../../configs/default-sync.config', () => ({
  DEFAULT_SYNC_CONFIG: { providers: [] },
}));

// --- Mock ObjectHelper ---
jest.mock('../../helpers/object.helper', () => ({
  ObjectHelper: {
    generateUUID: jest.fn().mockReturnValue('test-uuid-1234'),
  },
}));

// --- Mock migration helper ---
const mockRunMigrations = jest.fn().mockReturnValue({ migrated: false, fromVersion: 1, toVersion: 1 });
jest.mock('../../helpers/migration.helper', () => ({
  runMigrations: (...args: unknown[]) => mockRunMigrations(...args),
}));

const localStorageData = new Map<string, string>();
const mockLocalStorage = {
  getItem: jest.fn((key: string) => (localStorageData.has(key) ? localStorageData.get(key)! : null)),
  setItem: jest.fn((key: string, value: string) => {
    localStorageData.set(key, value);
  }),
  removeItem: jest.fn((key: string) => {
    localStorageData.delete(key);
  }),
  clear: jest.fn(() => {
    localStorageData.clear();
  }),
};

const originalLocalStorage = globalThis.localStorage;
const setTestLocalStorage = (storage: unknown): void => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  });
};

type MockCore = jest.Mocked<Pick<KritzelCore, 'rerender' | 'editorId' | 'getStorageKey'>> & {
  store: {
    state: {
      workspaces: unknown[];
      debugInfo: {
        showSyncProviderInfo: boolean;
        showMigrationInfo: boolean;
        showAssetResolverInfo: boolean;
      };
    };
  };
};

const createMockCore = (overrides: Partial<MockCore> = {}): MockCore => {
  const editorId = overrides.editorId;

  return {
    rerender: jest.fn(),
    getStorageKey: jest.fn((base: string) => (editorId ? `${base}-${editorId}` : base)),
    store: {
      state: {
        workspaces: [],
        debugInfo: { showSyncProviderInfo: false, showMigrationInfo: false, showAssetResolverInfo: false },
      },
    },
    editorId: undefined,
    ...overrides,
  };
};

interface MockProvider {
  type: 'local';
  connect: jest.Mock<Promise<void>>;
  disconnect: jest.Mock<void>;
  reconnect: jest.Mock<Promise<void>>;
  destroy: jest.Mock<void>;
}

const createMockProvider = (): MockProvider => ({
  type: 'local',
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn(),
  reconnect: jest.fn().mockResolvedValue(undefined),
  destroy: jest.fn(),
});

const createMockWorkspace = (id: string, name: string = `Workspace ${id}`) => ({
  id,
  name,
  viewport: { centerWorldX: 0, centerWorldY: 0, scale: 1 },
  createdAt: new Date(),
  updatedAt: new Date(),
  _core: null,
  serialize: jest.fn().mockReturnValue({
    id,
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewport: { centerWorldX: 0, centerWorldY: 0, scale: 1 },
  }),
});

describe('KritzelAppStateMap', () => {
  let appStateMap: KritzelAppStateMap;
  let mockCore: MockCore;

  beforeAll(() => {
    setTestLocalStorage(mockLocalStorage);
  });

  afterAll(() => {
    setTestLocalStorage(originalLocalStorage);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageData.clear();
    setTestLocalStorage(mockLocalStorage);
    appStateMap = new KritzelAppStateMap();
    mockCore = createMockCore();
  });

  describe('constructor', () => {
    it('should start with isReady false', () => {
      expect(appStateMap.isReady).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should set isReady to true after initialization', async () => {
      await appStateMap.initialize(mockCore as unknown as KritzelCore, { providers: [] });

      expect(appStateMap.isReady).toBe(true);
    });

    it('should create Y.Doc and get workspaces map', async () => {
      const Y = require('yjs');
      await appStateMap.initialize(mockCore as unknown as KritzelCore, { providers: [] });

      expect(Y.Doc).toHaveBeenCalled();
      expect(mockYdocGetMap).toHaveBeenCalledWith('workspaces');
    });

    it('should observe the workspaces map', async () => {
      await appStateMap.initialize(mockCore as unknown as KritzelCore, { providers: [] });

      expect(mockMapObserve).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should connect factory providers', async () => {
      const provider = createMockProvider();
      const factory = { create: jest.fn().mockReturnValue(provider) };

      await appStateMap.initialize(mockCore as unknown as KritzelCore, { providers: [factory] });

      expect(factory.create).toHaveBeenCalledWith('kritzel-app-state-test-uuid-1234', expect.anything(), expect.anything());
      expect(provider.connect).toHaveBeenCalled();
    });

    it('should connect class constructor providers', async () => {
      const provider = createMockProvider();
      const ProviderClass = jest.fn().mockImplementation(() => provider) as new (
        name: string,
        doc: unknown
      ) => MockProvider;

      await appStateMap.initialize(mockCore as unknown as KritzelCore, { providers: [ProviderClass] });

      expect(ProviderClass).toHaveBeenCalledWith('kritzel-app-state-test-uuid-1234', expect.anything(), expect.anything());
      expect(provider.connect).toHaveBeenCalled();
    });

    it('should use editorId-namespaced doc name when editorId is set', async () => {
      const coreWithId = createMockCore({ editorId: 'homepage' });
      const provider = createMockProvider();
      const factory = { create: jest.fn().mockReturnValue(provider) };

      await appStateMap.initialize(coreWithId as unknown as KritzelCore, { providers: [factory] });

      expect(factory.create).toHaveBeenCalledWith('kritzel-app-state-homepage-test-uuid-1234', expect.anything(), expect.anything());
    });

    it('should use default doc name when editorId is undefined', async () => {
      const coreNoId = createMockCore({ editorId: undefined });
      const provider = createMockProvider();
      const factory = { create: jest.fn().mockReturnValue(provider) };

      await appStateMap.initialize(coreNoId as unknown as KritzelCore, { providers: [factory] });

      expect(factory.create).toHaveBeenCalledWith('kritzel-app-state-test-uuid-1234', expect.anything(), expect.anything());
    });

    it('should reuse persisted instance id across app state map re-initialization', async () => {
      const firstProvider = createMockProvider();
      const secondProvider = createMockProvider();
      const firstFactory = { create: jest.fn().mockReturnValue(firstProvider) };
      const secondFactory = { create: jest.fn().mockReturnValue(secondProvider) };
      const firstMap = new KritzelAppStateMap();
      const secondMap = new KritzelAppStateMap();

      await firstMap.initialize(mockCore as unknown as KritzelCore, { providers: [firstFactory] });
      await secondMap.initialize(mockCore as unknown as KritzelCore, { providers: [secondFactory] });

      expect(firstFactory.create).toHaveBeenCalledWith('kritzel-app-state-test-uuid-1234', expect.anything(), expect.anything());
      expect(secondFactory.create).toHaveBeenCalledWith('kritzel-app-state-test-uuid-1234', expect.anything(), expect.anything());

      const { ObjectHelper } = require('../../helpers/object.helper');
      expect(ObjectHelper.generateUUID).toHaveBeenCalledTimes(1);
    });

    it('should throw when localStorage is unavailable', async () => {
      setTestLocalStorage(undefined);

      await expect(appStateMap.initialize(mockCore as unknown as KritzelCore, { providers: [] })).rejects.toThrow(
        '[KritzelAppStateMap] localStorage is unavailable. Cannot persist app-state document identity.'
      );
    });

    it('should throw when localStorage write fails', async () => {
      const writeFailingStorage = {
        getItem: jest.fn().mockReturnValue(null),
        setItem: jest.fn(() => {
          throw new Error('blocked');
        }),
        removeItem: jest.fn(),
        clear: jest.fn(),
      };
      setTestLocalStorage(writeFailingStorage);

      await expect(appStateMap.initialize(mockCore as unknown as KritzelCore, { providers: [] })).rejects.toThrow(
        '[KritzelAppStateMap] Failed to persist app-state instance id to localStorage.'
      );
    });

    it('should use explicit appStateId as doc name instead of persisted instance id', async () => {
      const provider = createMockProvider();
      const factory = { create: jest.fn().mockReturnValue(provider) };

      await appStateMap.initialize(mockCore as unknown as KritzelCore, {
        providers: [factory],
        appStateId: 'shared-tenant-42',
      });

      expect(factory.create).toHaveBeenCalledWith('kritzel-app-state-shared-tenant-42', expect.anything(), expect.anything());
    });

    it('should combine editorId with explicit appStateId', async () => {
      const coreWithId = createMockCore({ editorId: 'sidebar' });
      const provider = createMockProvider();
      const factory = { create: jest.fn().mockReturnValue(provider) };

      await appStateMap.initialize(coreWithId as unknown as KritzelCore, {
        providers: [factory],
        appStateId: 'user-abc',
      });

      expect(factory.create).toHaveBeenCalledWith('kritzel-app-state-sidebar-user-abc', expect.anything(), expect.anything());
    });

    it('should not require localStorage when appStateId is provided', async () => {
      setTestLocalStorage(undefined);

      await expect(
        appStateMap.initialize(mockCore as unknown as KritzelCore, {
          providers: [],
          appStateId: 'explicit-id',
        })
      ).resolves.not.toThrow();

      expect(appStateMap.isReady).toBe(true);
    });

    it('should fall back to persisted instance id when appStateId is not provided', async () => {
      const provider = createMockProvider();
      const factory = { create: jest.fn().mockReturnValue(provider) };

      await appStateMap.initialize(mockCore as unknown as KritzelCore, { providers: [factory] });

      expect(factory.create).toHaveBeenCalledWith('kritzel-app-state-test-uuid-1234', expect.anything(), expect.anything());
    });

    it('should load workspaces from Yjs after connecting', async () => {
      await appStateMap.initialize(mockCore as unknown as KritzelCore, { providers: [] });

      expect(mockMapForEach).toHaveBeenCalled();
    });

    it('should use default sync config when none provided', async () => {
      await appStateMap.initialize(mockCore as unknown as KritzelCore);

      // Should not throw - uses DEFAULT_SYNC_CONFIG with empty providers
      expect(appStateMap.isReady).toBe(true);
    });
  });

  describe('insert', () => {
    beforeEach(async () => {
      await appStateMap.initialize(mockCore as unknown as KritzelCore, { providers: [] });
    });

    it('should insert workspace into local map and Yjs', () => {
      const ws = createMockWorkspace('ws-1');

      const result = appStateMap.insert(ws as any);

      expect(result).toBe(true);
      expect(appStateMap.get('ws-1')).toBe(ws);
      expect(mockMapSet).toHaveBeenCalledWith('ws-1', ws.serialize());
    });

    it('should return false for workspace without id', () => {
      const ws = createMockWorkspace('');

      const result = appStateMap.insert(ws as any);

      expect(result).toBe(false);
    });

    it('should transact with local origin', () => {
      const ws = createMockWorkspace('ws-1');

      appStateMap.insert(ws as any);

      expect(mockYdocTransact).toHaveBeenCalledWith(expect.any(Function), 'local');
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      await appStateMap.initialize(mockCore as unknown as KritzelCore, { providers: [] });
    });

    it('should update an existing workspace', () => {
      const ws = createMockWorkspace('ws-1');
      appStateMap.insert(ws as any);
      mockMapSet.mockClear();

      const updated = createMockWorkspace('ws-1', 'Updated Name');
      const result = appStateMap.update(updated as any);

      expect(result).toBe(true);
      expect(appStateMap.get('ws-1')).toBe(updated);
      expect(mockMapSet).toHaveBeenCalledWith('ws-1', updated.serialize());
    });

    it('should return false for workspace without id', () => {
      const ws = createMockWorkspace('');

      const result = appStateMap.update(ws as any);

      expect(result).toBe(false);
    });

    it('should return false when workspace does not exist', () => {
      const ws = createMockWorkspace('nonexistent');

      const result = appStateMap.update(ws as any);

      expect(result).toBe(false);
    });
  });

  describe('remove', () => {
    beforeEach(async () => {
      await appStateMap.initialize(mockCore as unknown as KritzelCore, { providers: [] });
    });

    it('should remove a workspace matching the predicate', () => {
      const ws = createMockWorkspace('ws-1');
      appStateMap.insert(ws as any);

      const result = appStateMap.remove((w: any) => w.id === 'ws-1');

      expect(result).toBe(true);
      expect(appStateMap.get('ws-1')).toBeUndefined();
      expect(mockMapDelete).toHaveBeenCalledWith('ws-1');
    });

    it('should return false when no workspace matches', () => {
      const result = appStateMap.remove((w: any) => w.id === 'nonexistent');

      expect(result).toBe(false);
      expect(mockMapDelete).not.toHaveBeenCalled();
    });
  });

  describe('get / has / allWorkspaces / filter / find', () => {
    beforeEach(async () => {
      await appStateMap.initialize(mockCore as unknown as KritzelCore, { providers: [] });
      appStateMap.insert(createMockWorkspace('ws-1', 'First') as any);
      appStateMap.insert(createMockWorkspace('ws-2', 'Second') as any);
    });

    it('should get a workspace by id', () => {
      const ws = appStateMap.get('ws-1');
      expect(ws).toBeDefined();
      expect((ws as any).id).toBe('ws-1');
    });

    it('should return undefined for missing id', () => {
      expect(appStateMap.get('ws-999')).toBeUndefined();
    });

    it('should check existence with has', () => {
      expect(appStateMap.has('ws-1')).toBe(true);
      expect(appStateMap.has('ws-999')).toBe(false);
    });

    it('should return all workspaces', () => {
      const all = appStateMap.allWorkspaces();
      expect(all).toHaveLength(2);
    });

    it('should filter workspaces by predicate', () => {
      const results = appStateMap.filter((w: any) => w.name === 'First');
      expect(results).toHaveLength(1);
      expect((results[0] as any).id).toBe('ws-1');
    });

    it('should find a workspace by predicate', () => {
      const found = appStateMap.find((w: any) => w.name === 'Second');
      expect(found).toBeDefined();
      expect((found as any).id).toBe('ws-2');
    });

    it('should return undefined from find when nothing matches', () => {
      expect(appStateMap.find((w: any) => w.name === 'Missing')).toBeUndefined();
    });
  });

  describe('transaction', () => {
    beforeEach(async () => {
      await appStateMap.initialize(mockCore as unknown as KritzelCore, { providers: [] });
    });

    it('should run callback inside a Y.Doc transaction with local origin', () => {
      const callback = jest.fn();
      mockYdocTransact.mockClear();

      appStateMap.transaction(callback);

      expect(mockYdocTransact).toHaveBeenCalledWith(callback, 'local');
    });
  });

  describe('reset', () => {
    beforeEach(async () => {
      await appStateMap.initialize(mockCore as unknown as KritzelCore, { providers: [] });
      appStateMap.insert(createMockWorkspace('ws-1') as any);
    });

    it('should clear local map and Yjs map', () => {
      appStateMap.reset();

      expect(appStateMap.allWorkspaces()).toHaveLength(0);
      expect(mockMapClear).toHaveBeenCalled();
    });
  });

  describe('loadFromYjs', () => {
    it('should clear local map and revive workspaces from Yjs', async () => {
      const serialized = {
        id: 'ws-loaded',
        name: 'Loaded',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        viewport: { translateX: 10, translateY: 20, scale: 2 },
      };
      mockMapForEach.mockImplementation((cb: (val: any, key: string) => void) => {
        cb(serialized, 'ws-loaded');
      });

      await appStateMap.initialize(mockCore as unknown as KritzelCore, { providers: [] });

      const ws = appStateMap.get('ws-loaded');
      expect(ws).toBeDefined();
      expect((ws as any).id).toBe('ws-loaded');
    });
  });

  describe('onRemoteChange', () => {
    it('should store callback for remote change notifications', async () => {
      await appStateMap.initialize(mockCore as unknown as KritzelCore, { providers: [] });
      const callback = jest.fn();

      appStateMap.onRemoteChange(callback);

      // Trigger a remote change via the observer
      const observer = mockMapObserve.mock.calls[0][0];
      observer({
        transaction: { origin: 'remote' },
        keysChanged: new Set(),
        changes: { keys: new Map() },
      });

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('handleWorkspacesChange (via observer)', () => {
    let observer: (event: any) => void;

    beforeEach(async () => {
      await appStateMap.initialize(mockCore as unknown as KritzelCore, { providers: [] });
      observer = mockMapObserve.mock.calls[0][0];
    });

    it('should only rerender for local origin changes', () => {
      observer({
        transaction: { origin: 'local' },
        keysChanged: new Set(),
        changes: { keys: new Map() },
      });

      expect(mockCore.rerender).toHaveBeenCalled();
    });

    it('should delete workspaces for remote delete events', () => {
      appStateMap.insert(createMockWorkspace('ws-del') as any);

      observer({
        transaction: { origin: 'remote' },
        keysChanged: new Set(['ws-del']),
        changes: { keys: new Map([['ws-del', { action: 'delete' }]]) },
      });

      expect(appStateMap.get('ws-del')).toBeUndefined();
    });

    it('should add or update workspaces for remote add/update events', () => {
      const serialized = {
        id: 'ws-remote',
        name: 'Remote',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        viewport: { translateX: 0, translateY: 0, scale: 1 },
      };
      mockMapGet.mockReturnValueOnce(serialized);

      observer({
        transaction: { origin: 'remote' },
        keysChanged: new Set(['ws-remote']),
        changes: { keys: new Map([['ws-remote', { action: 'add' }]]) },
      });

      expect(appStateMap.get('ws-remote')).toBeDefined();
    });

    it('should update the store workspace list on remote changes', () => {
      mockMapGet.mockReturnValueOnce({
        id: 'ws-r',
        name: 'R',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        viewport: { translateX: 0, translateY: 0, scale: 1 },
      });

      observer({
        transaction: { origin: 'remote' },
        keysChanged: new Set(['ws-r']),
        changes: { keys: new Map([['ws-r', { action: 'add' }]]) },
      });

      expect(mockCore.store.state.workspaces.length).toBeGreaterThan(0);
    });

    it('should skip entries where serialized is falsy', () => {
      mockMapGet.mockReturnValueOnce(undefined);

      observer({
        transaction: { origin: 'remote' },
        keysChanged: new Set(['ws-missing']),
        changes: { keys: new Map([['ws-missing', { action: 'update' }]]) },
      });

      expect(appStateMap.get('ws-missing')).toBeUndefined();
    });

    it('should call rerender after processing remote changes', () => {
      mockCore.rerender.mockClear();

      observer({
        transaction: { origin: 'remote' },
        keysChanged: new Set(),
        changes: { keys: new Map() },
      });

      expect(mockCore.rerender).toHaveBeenCalled();
    });

    it('should skip processing for migration origin changes', () => {
      appStateMap.insert(createMockWorkspace('ws-1') as any);
      mockCore.rerender.mockClear();

      observer({
        transaction: { origin: 'migration' },
        keysChanged: new Set(['ws-1']),
        changes: { keys: new Map([['ws-1', { action: 'update' }]]) },
      });

      // Should not rerender or process changes
      expect(mockCore.rerender).not.toHaveBeenCalled();
    });
  });

  describe('schema migrations', () => {
    it('should call runMigrations during initialization', async () => {
      await appStateMap.initialize(mockCore as unknown as KritzelCore, { providers: [] });

      expect(mockRunMigrations).toHaveBeenCalledWith(
        expect.anything(), // ydoc
        expect.anything(), // metadataMap
        expect.objectContaining({ workspaces: expect.anything() }),
        expect.any(Array), // APP_STATE_MIGRATIONS
        expect.any(Number), // CURRENT_APP_STATE_SCHEMA_VERSION
        expect.objectContaining({ quiet: expect.any(Boolean) }),
      );
    });

    it('should set schemaVersion in metadata for new documents', async () => {
      mockMapGet.mockReturnValue(undefined);

      await appStateMap.initialize(mockCore as unknown as KritzelCore, { providers: [] });

      // initializeMetadata should set schemaVersion
      expect(mockMapSet).toHaveBeenCalledWith('schemaVersion', expect.any(Number));
    });

    it('should not overwrite schemaVersion if already set', async () => {
      // Simulate schemaVersion already existing
      mockMapGet.mockImplementation((key: string) => {
        if (key === 'schemaVersion') return 1;
        if (key === 'type') return 'state';
        if (key === 'isPublic') return false;
        return undefined;
      });

      await appStateMap.initialize(mockCore as unknown as KritzelCore, { providers: [] });

      // schemaVersion should not be re-set if it already exists
      const schemaVersionCalls = mockMapSet.mock.calls.filter(
        (call: unknown[]) => call[0] === 'schemaVersion'
      );
      expect(schemaVersionCalls).toHaveLength(0);
    });
  });

  describe('destroy', () => {
    beforeEach(async () => {
      await appStateMap.initialize(mockCore as unknown as KritzelCore, { providers: [] });
    });

    it('should unobserve the workspaces map', () => {
      appStateMap.destroy();

      expect(mockMapUnobserve).toHaveBeenCalled();
    });

    it('should destroy Y.Doc', () => {
      appStateMap.destroy();

      expect(mockYdocDestroy).toHaveBeenCalled();
    });

    it('should clear local map', () => {
      appStateMap.insert(createMockWorkspace('ws-1') as any);

      appStateMap.destroy();

      expect(appStateMap.isReady).toBe(false);
    });

    it('should disconnect and destroy providers', async () => {
      const provider = createMockProvider();
      const factory = { create: jest.fn().mockReturnValue(provider) };

      const map2 = new KritzelAppStateMap();
      await map2.initialize(mockCore as unknown as KritzelCore, { providers: [factory] });

      map2.destroy();

      expect(provider.disconnect).toHaveBeenCalled();
      expect(provider.destroy).toHaveBeenCalled();
    });

    it('should set isReady to false', () => {
      appStateMap.destroy();

      expect(appStateMap.isReady).toBe(false);
    });
  });
});
