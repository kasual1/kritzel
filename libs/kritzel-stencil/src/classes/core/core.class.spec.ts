import { KritzelCore } from './core.class';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelSelectionBox } from '../objects/selection-box.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelGroup } from '../objects/group.class';
import { KritzelLine } from '../objects/line.class';
import { KritzelPath } from '../objects/path.class';
import { KritzelText } from '../objects/text.class';
import { KritzelImage } from '../objects/image.class';
import { KritzelShape } from '../objects/shape.class';
import { KritzelDynamicObject } from '../objects/dynamic-object.class';
import { KritzelBaseTool } from '../tools/base-tool.class';
import { KritzelWorkspace } from './workspace.class';
import { KritzelStore } from './store.class';
import { KritzelObjectMap } from '../structures/object-map.structure';
import { KritzelAppStateMap } from '../structures/app-state-map.structure';
import { KritzelAnchorManager } from '../managers/anchor.manager';
import { KritzelCursorManager } from '../managers/cursor.manager';
import { KritzelThemeManager } from '../managers/theme.manager';
import { ShapeType } from '../../enums/shape-type.enum';
// Mock the asset resolver so `initializeYjs` doesn't hit the real IndexedDB
// provider during unit tests (jsdom does not expose a global `indexedDB`).
jest.mock('../providers/assets/asset-resolver.class');
jest.mock('../../components/core/kritzel-engine/kritzel-engine', () => ({
  KritzelEngine: jest.fn(),
}));
jest.mock('../../components/ui/kritzel-context-menu/kritzel-context-menu', () => ({
  KritzelContextMenu: jest.fn(),
}));
jest.mock('../structures/object-map.structure');
jest.mock('../structures/app-state-map.structure');
jest.mock('../managers/anchor.manager');
jest.mock('../managers/cursor.manager');
jest.mock('../managers/theme.manager');
jest.mock('./store.class');
jest.mock('../registries/tool.registry');

describe('KritzelCore', () => {
  let core: KritzelCore;
  let mockEngine: any;
  let mockStore: any;
  let mockAppStateMap: any;
  let mockAnchorManager: any;
  let mockObjectsMap: any;

  const createMockEngine = () => {
    return {
      forceUpdate: 0,
      emitObjectsChange: jest.fn(),
      emitObjectsAdded: jest.fn(),
      emitObjectsRemoved: jest.fn(),
      emitObjectsUpdated: jest.fn(),
      emitObjectsInViewportChange: jest.fn(),
      triggerSelectionChange: jest.fn(),
      addObject: jest.fn(),
      viewport: {
        cancelPendingUpdates: jest.fn(),
        centerFitInViewport: jest.fn(),
      },
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock window.indexedDB
    if (!window.indexedDB) {
      Object.defineProperty(window, 'indexedDB', {
        value: { deleteDatabase: jest.fn().mockReturnValue({}) },
        writable: true,
      });
    } else {
      jest.spyOn(window.indexedDB, 'deleteDatabase').mockReturnValue({} as IDBOpenDBRequest);
    }

    // Setup mock objects map
    mockObjectsMap = {
      isReady: false,
      initialize: jest.fn().mockResolvedValue(undefined),
      insert: jest.fn().mockReturnValue(true),
      findById: jest.fn(),
      update: jest.fn().mockReturnValue(true),
      remove: jest.fn(),
      filter: jest.fn().mockReturnValue([]),
      allObjects: jest.fn().mockReturnValue([]),
      query: jest.fn().mockReturnValue([]),
      transaction: jest.fn((cb: () => void) => cb()),
      stopUndoCapturing: jest.fn(),
      undo: jest.fn(),
      redo: jest.fn(),
      destroy: jest.fn(),
      totalCount: 0,
      setWorkspaceName: jest.fn(),
      onAwarenessChange: jest.fn(),
      setLocalSelectionBox: jest.fn(),
      clearLocalSelectionBox: jest.fn(),
      setLocalUser: jest.fn(),
    };

    jest.mocked(KritzelObjectMap).mockImplementation(() => mockObjectsMap);

    // Setup mock app state map
    mockAppStateMap = {
      initialize: jest.fn().mockResolvedValue(undefined),
      allWorkspaces: jest.fn().mockReturnValue([]),
      has: jest.fn().mockReturnValue(false),
      update: jest.fn().mockReturnValue(true),
      insert: jest.fn().mockReturnValue(true),
      remove: jest.fn().mockReturnValue(true),
      get: jest.fn(),
      isReady: false,
      destroy: jest.fn(),
    };

    jest.mocked(KritzelAppStateMap).mockImplementation(() => mockAppStateMap);

    // Setup mock anchor manager
    mockAnchorManager = {
      rebuildIndex: jest.fn(),
      handleLineDeleted: jest.fn(),
      handleObjectDeleted: jest.fn(),
      updateAnchorsForObject: jest.fn(),
    };

    jest.mocked(KritzelAnchorManager).mockImplementation(() => mockAnchorManager);
    jest.mocked(KritzelCursorManager).mockImplementation(function (this: KritzelCursorManager) {
      Object.assign(this, {
        setTargetElement: jest.fn(),
        setShadowRoot: jest.fn(),
        resetToDefault: jest.fn(),
        cleanup: jest.fn(),
        updateHoverState: jest.fn(),
      });
      return this;
    });
    jest.mocked(KritzelThemeManager).mockImplementation(function (this: KritzelThemeManager) {
      Object.assign(this, {
        setTheme: jest.fn(),
        setTargetElement: jest.fn(),
        cleanup: jest.fn(),
      });
      return this;
    });

    // Setup mock store
    mockStore = {
      state: {
        objects: mockObjectsMap,
        activeWorkspace: { id: 'ws-1', viewport: { centerWorldX: 0, centerWorldY: 0, scale: 1 } },
        workspaces: [],
        scale: 1,
        translateX: 0,
        translateY: 0,
        viewportWidth: 1000,
        viewportHeight: 800,
        host: null,
        isEnabled: true,
        isReady: true,
        isPanning: false,
        isScaling: false,
        isSelecting: false,
        isResizeHandleSelected: false,
        isRotationHandleSelected: false,
        isLineHandleSelected: false,
        isLineHandleDragging: false,
        lineHandleType: null,
        activeTool: null,
        pointers: new Map(),
      },
      get objects() { return this.state.objects; },
      allObjects: [],
      allNonSelectionObjects: [],
      selectedObjects: [],
      selectionGroup: null,
      selectionBox: null,
      currentZIndex: 1,
      setSelectionBox: jest.fn(),
      setSelectionGroup: jest.fn(),
      setLocalUserId: jest.fn(),
      setState: jest.fn(),
      getState: jest.fn(),
      onStateChange: jest.fn(),
    };

    jest.mocked(KritzelStore).mockImplementation(() => mockStore);
    const selectionTool = new KritzelBaseTool(Object.create(KritzelCore.prototype));
    selectionTool.name = 'selection';

    mockEngine = createMockEngine();
    core = new KritzelCore(mockEngine);
    (core.toolRegistry.getTool as jest.Mock).mockReturnValue(selectionTool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a KritzelCore instance', () => {
      expect(core).toBeDefined();
    });

    it('should initialize the store', () => {
      expect(KritzelStore).toHaveBeenCalled();
    });

    it('should initialize the app state map', () => {
      expect(KritzelAppStateMap).toHaveBeenCalled();
    });

    it('should initialize the anchor manager', () => {
      expect(KritzelAnchorManager).toHaveBeenCalledWith(core);
    });

    it('should initialize the cursor manager', () => {
      expect(KritzelCursorManager).toHaveBeenCalledWith(core);
    });

    it('should initialize the theme manager', () => {
      expect(KritzelThemeManager).toHaveBeenCalledWith(core);
    });

    it('should have undefined editorId by default', () => {
      expect(core.editorId).toBeUndefined();
    });

    it('should accept an editorId parameter', () => {
      const coreWithId = new KritzelCore(mockEngine, 'my-editor');
      expect(coreWithId.editorId).toBe('my-editor');
    });
  });

  describe('getters', () => {
    it('should return the engine', () => {
      expect(core.engine).toBe(mockEngine);
    });

    it('should return the store', () => {
      expect(core.store).toBeDefined();
    });

    it('should return the appStateMap', () => {
      expect(core.appStateMap).toBeDefined();
    });

    it('should return the anchorManager', () => {
      expect(core.anchorManager).toBeDefined();
    });

    it('should return the cursorManager', () => {
      expect(core.cursorManager).toBeDefined();
    });

    it('should return the themeManager', () => {
      expect(core.themeManager).toBeDefined();
    });
  });

  describe('getStorageKey', () => {
    it('should return the base key when no editorId is set', () => {
      expect(core.getStorageKey('kritzel-settings')).toBe('kritzel-settings');
    });

    it('should append editorId to the base key when set', () => {
      const coreWithId = new KritzelCore(mockEngine, 'homepage');
      expect(coreWithId.getStorageKey('kritzel-settings')).toBe('kritzel-settings-homepage');
    });

    it('should work with different base keys', () => {
      const coreWithId = new KritzelCore(mockEngine, 'demo');
      expect(coreWithId.getStorageKey('kritzel-active-workspace-id')).toBe('kritzel-active-workspace-id-demo');
    });
  });

  describe('setEditorId', () => {
    it('should update the editorId', () => {
      core.setEditorId('new-id');
      expect(core.editorId).toBe('new-id');
    });

    it('should update getStorageKey results', () => {
      core.setEditorId('instance-1');
      expect(core.getStorageKey('kritzel-theme')).toBe('kritzel-theme-instance-1');
    });

    it('should re-create the theme manager', () => {
      const callCountBefore = jest.mocked(KritzelThemeManager).mock.calls.length;
      core.setEditorId('new-id');
      expect(jest.mocked(KritzelThemeManager).mock.calls.length).toBe(callCountBefore + 1);
    });

    it('should clear editorId when called with undefined', () => {
      core.setEditorId('temp-id');
      core.setEditorId(undefined);
      expect(core.editorId).toBeUndefined();
      expect(core.getStorageKey('kritzel-theme')).toBe('kritzel-theme');
    });
  });

  describe('setSyncConfig', () => {
    it('should set the sync configuration', () => {
      const config = { providers: [] };
      core.setSyncConfig(config);
      // No error means it was set successfully
      expect(true).toBe(true);
    });

    it('should accept undefined', () => {
      core.setSyncConfig(undefined);
      expect(true).toBe(true);
    });
  });

  describe('initializeYjs', () => {
    it('should call appStateMap.initialize', async () => {
      await core.initializeYjs();
      expect(mockAppStateMap.initialize).toHaveBeenCalledWith(core, undefined);
    });
  });

  describe('rerender', () => {
    it('should increment forceUpdate on the engine', () => {
      const initialValue = mockEngine.forceUpdate;
      core.rerender();
      expect(mockEngine.forceUpdate).toBe(initialValue + 1);
    });
  });

  describe('findObjectById', () => {
    it('should return the object when found', () => {
      const obj = { id: 'obj-1' } as KritzelBaseObject<any>;
      mockStore.allObjects = [obj];

      expect(core.findObjectById('obj-1')).toBe(obj);
    });

    it('should return null when not found', () => {
      mockStore.allObjects = [];
      expect(core.findObjectById('nonexistent')).toBeNull();
    });

    it('should return the first match among multiple objects', () => {
      const obj1 = { id: 'obj-1' } as KritzelBaseObject<any>;
      const obj2 = { id: 'obj-2' } as KritzelBaseObject<any>;
      mockStore.allObjects = [obj1, obj2];

      expect(core.findObjectById('obj-2')).toBe(obj2);
    });
  });

  describe('getWorkspaces', () => {
    it('should return workspaces from app state map', () => {
      const ws = [new KritzelWorkspace({ id: 'ws-1', name: 'Workspace 1' })];
      mockAppStateMap.allWorkspaces.mockReturnValue(ws);

      expect(core.getWorkspaces()).toBe(ws);
    });
  });

  describe('createWorkspace', () => {
    it('should set core reference and dates on the workspace', async () => {
      const ws = new KritzelWorkspace({ id: 'ws-new', name: 'New Workspace' });
      const before = new Date();

      await core.createWorkspace(ws);

      expect(ws._core).toBe(core);
      expect(ws.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(ws.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('should save workspace to app state and refresh workspace list', async () => {
      const ws = new KritzelWorkspace({ id: 'ws-new', name: 'New Workspace' });

      await core.createWorkspace(ws);

      // saveWorkspaceToAppState is private, but we can check insert/update was called
      expect(mockAppStateMap.insert).toHaveBeenCalled();
    });

  });

  describe('setActiveWorkspace', () => {
    it('should switch to workspace by ID', async () => {
      const ws = new KritzelWorkspace({ id: 'ws-target', name: 'Target Workspace' });
      jest.spyOn(core, 'getWorkspaces').mockReturnValue([ws]);
      const initSpy = jest.spyOn(core, 'initializeWorkspace').mockResolvedValue(undefined);

      await core.setActiveWorkspace('ws-target');

      expect(initSpy).toHaveBeenCalledWith(ws);
    });

    it('should warn and do nothing if workspace ID is not found', async () => {
      jest.spyOn(core, 'getWorkspaces').mockReturnValue([]);
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const initSpy = jest.spyOn(core, 'initializeWorkspace');

      await core.setActiveWorkspace('ws-unknown');

      expect(warnSpy).toHaveBeenCalled();
      expect(initSpy).not.toHaveBeenCalled();
    });
  });

  describe('updateWorkspace', () => {
    const createStubObject = (id: string, zIndex = 0) =>
      ({
        id,
        zIndex,
        scale: 1,
        isMounted: true,
        workspaceId: 'ws-1',
        generateId: jest.fn().mockReturnValue(`generated-${id}`),
      }) as unknown as KritzelBaseObject<any>;

    const removeCallsFor = (object: KritzelBaseObject<any>) =>
      (mockObjectsMap.remove.mock.calls as [(o: any) => boolean][]).filter(([predicate]) => predicate(object));

    it('should update the updatedAt timestamp', async () => {
      const ws = new KritzelWorkspace({ id: 'ws-1', name: 'Workspace' });
      const oldDate = new Date(2020, 0, 1);
      ws.updatedAt = oldDate;

      mockStore.state.workspaces = [ws];

      await core.updateWorkspace(ws);

      expect(ws.updatedAt.getTime()).toBeGreaterThan(oldDate.getTime());
    });

    it('should update the workspace in the workspaces array', async () => {
      const ws = new KritzelWorkspace({ id: 'ws-1', name: 'Old Name' });
      mockStore.state.workspaces = [ws];

      ws.name = 'New Name';
      await core.updateWorkspace(ws);

      expect(mockStore.state.workspaces[0].name).toBe('New Name');
    });

    it('should leave objects untouched when no object set is declared', async () => {
      const existing = createStubObject('obj-1');
      mockObjectsMap.allObjects.mockReturnValue([existing]);
      const ws = new KritzelWorkspace({ id: 'ws-1', name: 'Renamed' });

      const diff = await core.updateWorkspace(ws);

      expect(diff).toBeNull();
      expect(mockObjectsMap.insert).not.toHaveBeenCalled();
      expect(mockObjectsMap.remove).not.toHaveBeenCalled();
    });

    it('should remove all objects when an empty object set is declared', async () => {
      const existing = createStubObject('obj-1');
      mockObjectsMap.allObjects.mockReturnValue([existing]);
      const ws = new KritzelWorkspace({ id: 'ws-1', name: 'Workspace', objects: [] });

      const diff = await core.updateWorkspace(ws);

      expect(removeCallsFor(existing)).toHaveLength(1);
      expect(diff?.removed).toEqual([existing]);
    });

    it('should add declared objects that are missing, preserving their ids', async () => {
      mockObjectsMap.allObjects.mockReturnValue([]);
      const incoming = createStubObject('obj-new');
      const ws = new KritzelWorkspace({ id: 'ws-1', name: 'Workspace', objects: [incoming] });

      const diff = await core.updateWorkspace(ws);

      expect(mockObjectsMap.insert).toHaveBeenCalledWith(incoming);
      expect(incoming.id).toBe('obj-new');
      expect(incoming.workspaceId).toBe('ws-1');
      expect(diff?.added).toEqual([incoming]);
    });

    it('should update objects passed by the same instance reference', async () => {
      const existing = createStubObject('obj-1');
      mockObjectsMap.allObjects.mockReturnValue([existing]);
      const ws = new KritzelWorkspace({ id: 'ws-1', name: 'Workspace', objects: [existing] });

      const diff = await core.updateWorkspace(ws);

      expect(mockObjectsMap.update).toHaveBeenCalledWith(existing);
      expect(removeCallsFor(existing)).toHaveLength(0);
      expect(diff?.updated).toEqual([existing]);
    });

    it('should replace the live instance when a different object with the same id is declared', async () => {
      const existing = createStubObject('obj-1');
      const incoming = createStubObject('obj-1', 7);
      mockObjectsMap.allObjects.mockReturnValue([existing]);
      const ws = new KritzelWorkspace({ id: 'ws-1', name: 'Workspace', objects: [incoming] });

      const diff = await core.updateWorkspace(ws);

      expect(removeCallsFor(existing)).toHaveLength(1);
      expect(mockObjectsMap.insert).toHaveBeenCalledWith(incoming);
      expect(incoming.zIndex).toBe(7);
      expect(diff?.updated).toEqual([incoming]);
    });

    it('should rebuild the anchor index after reconciling the active workspace', async () => {
      mockObjectsMap.allObjects.mockReturnValue([]);
      const ws = new KritzelWorkspace({ id: 'ws-1', name: 'Workspace', objects: [createStubObject('obj-new')] });

      await core.updateWorkspace(ws);

      expect(mockAnchorManager.rebuildIndex).toHaveBeenCalled();
    });

    it('should clear the declared object set so it is not re-seeded later', async () => {
      mockObjectsMap.allObjects.mockReturnValue([]);
      const ws = new KritzelWorkspace({ id: 'ws-1', name: 'Workspace', objects: [createStubObject('obj-new')] });

      await core.updateWorkspace(ws);

      expect(ws.objects).toBeUndefined();
    });

    it('should apply the declared viewport to the active workspace', async () => {
      mockStore.state.workspaces = [];
      const ws = new KritzelWorkspace({ id: 'ws-1', name: 'Workspace', viewport: { centerWorldX: 100, centerWorldY: 50, scale: 2 } });

      await core.updateWorkspace(ws);

      expect(mockEngine.viewport.cancelPendingUpdates).toHaveBeenCalled();
      expect(mockStore.state.scale).toBe(2);
      expect(mockStore.state.translateX).toBe(1000 / 2 - 100 * 2);
      expect(mockStore.state.translateY).toBe(800 / 2 - 50 * 2);
    });

    it('should not touch the viewport when the workspace is passed back unchanged', async () => {
      const ws = new KritzelWorkspace({ id: 'ws-1', name: 'Workspace', viewport: { centerWorldX: 0, centerWorldY: 0, scale: 1 } });

      await core.updateWorkspace(ws);

      expect(mockEngine.viewport.cancelPendingUpdates).not.toHaveBeenCalled();
    });

    it('should warn and skip object changes for a non-active workspace without a sync provider', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const ws = new KritzelWorkspace({ id: 'ws-other', name: 'Other', objects: [createStubObject('obj-new')] });

      const diff = await core.updateWorkspace(ws);

      expect(warnSpy).toHaveBeenCalled();
      expect(diff).toBeNull();
      expect(mockObjectsMap.insert).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should reconcile a non-active workspace through a headless object map when a provider is configured', async () => {
      const syncConfig = { providers: [jest.fn() as any] };
      core.setSyncConfig(syncConfig);

      const headlessMap = { ...mockObjectsMap, whenNetworkSynced: jest.fn().mockResolvedValue(undefined) };
      jest.mocked(KritzelObjectMap).mockImplementationOnce(() => headlessMap);

      const incoming = createStubObject('obj-new');
      const ws = new KritzelWorkspace({ id: 'ws-other', name: 'Other', objects: [incoming] });

      const diff = await core.updateWorkspace(ws);

      expect(headlessMap.initialize).toHaveBeenCalledWith(core, 'ws-other', syncConfig, { headless: true, workspaceName: 'Other' });
      expect(headlessMap.insert).toHaveBeenCalledWith(incoming);
      expect(headlessMap.destroy).toHaveBeenCalled();
      expect(diff?.added).toEqual([incoming]);
    });
  });

  describe('deleteWorkspace', () => {
    it('should remove workspace from app state', () => {
      const ws = new KritzelWorkspace({ id: 'ws-del', name: 'Delete Me' });
      mockStore.state.activeWorkspace = { id: 'ws-other' };

      core.deleteWorkspace(ws);

      expect(mockAppStateMap.remove).toHaveBeenCalled();
    });

    it('should destroy objects and cancel updates when deleting the active workspace', () => {
      const ws = new KritzelWorkspace({ id: 'ws-1', name: 'Active WS' });
      mockStore.state.activeWorkspace = { id: 'ws-1' };

      core.deleteWorkspace(ws);

      expect(mockEngine.viewport.cancelPendingUpdates).toHaveBeenCalled();
      expect(mockObjectsMap.destroy).toHaveBeenCalled();
    });

    it('should delete the IndexedDB database for the workspace', () => {
      const ws = new KritzelWorkspace({ id: 'ws-db', name: 'DB Test' });
      mockStore.state.activeWorkspace = { id: 'ws-other' };

      core.deleteWorkspace(ws);

      expect(window.indexedDB.deleteDatabase).toHaveBeenCalledWith('kritzel-workspace-ws-db');
    });

    it('should use editorId-namespaced database name when editorId is set', () => {
      const coreWithId = new KritzelCore(mockEngine, 'homepage');
      // Point the new core at the same mock store
      (coreWithId as any)._store = mockStore;
      mockStore.state.activeWorkspace = { id: 'ws-other' };

      const ws = new KritzelWorkspace({ id: 'ws-db', name: 'DB Test' });
      coreWithId.deleteWorkspace(ws);

      expect(window.indexedDB.deleteDatabase).toHaveBeenCalledWith('kritzel-workspace-homepage-ws-db');
    });
  });

  describe('updateWorkspaceViewport', () => {
    it('should convert translate to world-space center and update viewport on active workspace', () => {
      const activeWs = { id: 'ws-1', viewport: null, updatedAt: null } as any;
      mockStore.state.activeWorkspace = activeWs;
      mockStore.state.workspaces = [activeWs];
      mockStore.state.viewportWidth = 1000;
      mockStore.state.viewportHeight = 800;

      core.updateWorkspaceViewport(100, 200, 2);

      // centerWorldX = (1000/2 - 100) / 2 = 400/2 = 200
      // centerWorldY = (800/2 - 200) / 2 = 200/2 = 100
      expect(activeWs.viewport).toEqual({ centerWorldX: 200, centerWorldY: 100, scale: 2 });
      expect(activeWs.updatedAt).toBeInstanceOf(Date);
    });

    it('should do nothing if no active workspace', () => {
      mockStore.state.activeWorkspace = null;

      core.updateWorkspaceViewport(100, 200, 2);

      // Should not throw
      expect(mockAppStateMap.update).not.toHaveBeenCalled();
      expect(mockAppStateMap.insert).not.toHaveBeenCalled();
    });

    it('should do nothing if workspace was deleted', () => {
      mockStore.state.activeWorkspace = { id: 'ws-deleted' };
      mockStore.state.workspaces = [];

      core.updateWorkspaceViewport(100, 200, 2);

      expect(mockAppStateMap.update).not.toHaveBeenCalled();
      expect(mockAppStateMap.insert).not.toHaveBeenCalled();
    });
  });

  describe('addObject', () => {
    it('should insert object into the objects map', () => {
      const obj = { id: 'obj-1' } as KritzelBaseObject<any>;

      core.addObject(obj);

      expect(mockObjectsMap.insert).toHaveBeenCalledWith(obj);
    });

    it('should add a rotated path object', () => {
      const obj = new KritzelPath({
        points: [[0, 0], [10, 10]],
        rotation: -90,
      });

      core.addObject(obj);

      expect(mockObjectsMap.insert).toHaveBeenCalledWith(obj);
      expect(obj.rotation).toBeCloseTo(-Math.PI / 2);
    });

    it('should add a rotated line object', () => {
      const obj = new KritzelLine({
        startX: 0,
        startY: 0,
        endX: 100,
        endY: 50,
        rotation: -90,
      });

      core.addObject(obj);

      expect(mockObjectsMap.insert).toHaveBeenCalledWith(obj);
      expect(obj.rotation).toBeCloseTo(-Math.PI / 2);
    });

    it('should add a rotated text object', () => {
      const obj = new KritzelText({
        rotation: -90,
      });

      core.addObject(obj);

      expect(mockObjectsMap.insert).toHaveBeenCalledWith(obj);
      expect(obj.rotation).toBeCloseTo(-Math.PI / 2);
    });

    it('should add a rotated image object', () => {
      const obj = new KritzelImage({
        rotation: -90,
      });

      core.addObject(obj);

      expect(mockObjectsMap.insert).toHaveBeenCalledWith(obj);
      expect(obj.rotation).toBeCloseTo(-Math.PI / 2);
    });

    it('should add a rotated shape object', () => {
      const obj = new KritzelShape({
        shapeType: ShapeType.Rectangle,
        rotation: -90,
      });

      core.addObject(obj);

      expect(mockObjectsMap.insert).toHaveBeenCalledWith(obj);
      expect(obj.rotation).toBeCloseTo(-Math.PI / 2);
    });

    it('should add a rotated dynamic object object', () => {
      const element = document.createElement('div');
      const obj = new KritzelDynamicObject({
        element,
        rotation: -90,
      });

      core.addObject(obj);

      expect(mockObjectsMap.insert).toHaveBeenCalledWith(obj);
      expect(obj.rotation).toBeCloseTo(-Math.PI / 2);
    });

    it('should add a rotated group object', () => {
      const obj = new KritzelGroup({
        rotation: -90,
      });

      core.addObject(obj);

      expect(mockObjectsMap.insert).toHaveBeenCalledWith(obj);
      expect(obj.rotation).toBeCloseTo(-Math.PI / 2);
    });

    it('should add a rotated selection group object', () => {
      const obj = new KritzelSelectionGroup({
        rotation: -90,
      });

      core.addObject(obj);

      expect(mockObjectsMap.insert).toHaveBeenCalledWith(obj);
      expect(obj.rotation).toBeCloseTo(-Math.PI / 2);
    });
  });

  describe('removeObject', () => {
    it('should remove an object from the store', () => {
      const obj = { id: 'obj-1', isMounted: true } as any;

      core.removeObject(obj);

      expect(obj.isMounted).toBe(false);
      expect(mockObjectsMap.remove).toHaveBeenCalled();
    });

    it('should cleanup anchors for line objects', () => {
      const line = Object.create(KritzelLine.prototype);
      line.__class__ = 'KritzelLine';
      line.id = 'line-1';
      line.isMounted = true;

      core.removeObject(line);

      expect(mockAnchorManager.handleLineDeleted).toHaveBeenCalledWith('line-1');
    });

    it('should detach anchored lines for non-line objects', () => {
      const obj = { id: 'obj-1', isMounted: true } as any;

      core.removeObject(obj);

      expect(mockAnchorManager.handleObjectDeleted).toHaveBeenCalledWith('obj-1');
    });

    it('should recursively remove children for group objects', () => {
      const child1 = { id: 'child-1', isMounted: true } as any;
      const child2 = { id: 'child-2', isMounted: true } as any;

      const group = Object.create(KritzelGroup.prototype);
      group.__class__ = 'KritzelGroup';
      group.id = 'group-1';
      group.isMounted = true;
      Object.defineProperty(group, 'children', { get: () => [child1, child2] });

      core.removeObject(group);

      expect(child1.isMounted).toBe(false);
      expect(child2.isMounted).toBe(false);
    });

    it('should preserve children when preserveChildren is true', () => {
      const child = { id: 'child-1', isMounted: true } as any;

      const group = Object.create(KritzelGroup.prototype);
      group.__class__ = 'KritzelGroup';
      group.id = 'group-1';
      group.isMounted = true;
      Object.defineProperty(group, 'children', { get: () => [child] });

      core.removeObject(group, true);

      expect(child.isMounted).toBe(true);
    });
  });

  describe('updateObject', () => {
    it('should update properties on the object', () => {
      const obj = {
        id: 'obj-1',
        translateX: 0,
        translateY: 0,
        onAfterUpdate: jest.fn(),
      } as any;

      core.updateObject(obj, { translateX: 100, translateY: 200 });

      expect(obj.translateX).toBe(100);
      expect(obj.translateY).toBe(200);
    });

    it('should call onAfterUpdate with changed keys', () => {
      const obj = {
        id: 'obj-1',
        translateX: 0,
        onAfterUpdate: jest.fn(),
      } as any;

      core.updateObject(obj, { translateX: 50 });

      expect(obj.onAfterUpdate).toHaveBeenCalledWith(['translateX']);
    });

    it('should update the object in the store', () => {
      const obj = {
        id: 'obj-1',
        zIndex: 1,
        onAfterUpdate: jest.fn(),
      } as any;

      core.updateObject(obj, { zIndex: 5 });

      expect(mockObjectsMap.update).toHaveBeenCalledWith(obj);
    });
  });

  describe('addSelectionGroup', () => {
    it('should remove existing selection group and box before adding', () => {
      const existingGroup = { id: 'existing-sg' } as any;
      const existingBox = { id: 'existing-sb' } as any;
      mockStore.selectionGroup = existingGroup;
      mockStore.selectionBox = existingBox;

      const newGroup = { id: 'new-sg' } as KritzelSelectionGroup;

      core.addSelectionGroup(newGroup);

      expect(mockObjectsMap.insert).toHaveBeenCalledWith(newGroup);
      expect(mockStore.setSelectionGroup).toHaveBeenCalledWith(newGroup);
      expect(mockEngine.triggerSelectionChange).toHaveBeenCalled();
    });

    it('should enable isInteractive for selected dynamic objects', () => {
      const dynamicObjectObject = {
        id: 'custom-1',
        __class__: 'KritzelDynamicObject',
        isInteractive: false,
      } as unknown as KritzelBaseObject<any>;
      const regularObject = {
        id: 'shape-1',
        __class__: 'KritzelShape',
        isInteractive: false,
      } as unknown as KritzelBaseObject<any>;

      const newGroup = {
        id: 'new-sg',
        objects: [dynamicObjectObject, regularObject],
      } as unknown as KritzelSelectionGroup;

      core.addSelectionGroup(newGroup);

      expect(dynamicObjectObject.isInteractive).toBe(true);
      expect(regularObject.isInteractive).toBe(false);
    });

    it('should remove orphaned local selection groups before adding a new one', () => {
      const orphanChild = {
        id: 'orphan-child',
        __class__: 'KritzelShape',
        isSelected: true,
      } as unknown as KritzelBaseObject<any>;

      const orphanGroup = {
        id: 'orphan-sg',
        __class__: 'KritzelSelectionGroup',
        userId: undefined,
        objects: [orphanChild],
        deselectAllChildren: jest.fn(() => {
          orphanChild.isSelected = false;
        }),
      } as unknown as KritzelSelectionGroup;

      mockObjectsMap.allObjects.mockReturnValue([orphanGroup]);

      const newGroup = { id: 'new-sg', objects: [] } as unknown as KritzelSelectionGroup;

      core.addSelectionGroup(newGroup);

      expect(orphanGroup.deselectAllChildren).toHaveBeenCalled();
      expect(orphanChild.isSelected).toBe(false);
      expect(mockObjectsMap.remove).toHaveBeenCalled();
      expect(mockObjectsMap.insert).toHaveBeenCalledWith(newGroup);
      expect(mockStore.setSelectionGroup).toHaveBeenCalledWith(newGroup);
    });
  });

  describe('removeSelectionGroup', () => {
    it('should remove the selection group from the store', () => {
      const sg = { id: 'sg-1' } as any;
      mockStore.selectionGroup = sg;

      core.removeSelectionGroup();

      expect(mockObjectsMap.remove).toHaveBeenCalled();
      expect(mockStore.setSelectionGroup).toHaveBeenCalledWith(null);
      expect(mockEngine.triggerSelectionChange).toHaveBeenCalled();
    });

    it('should do nothing if no selection group exists', () => {
      mockStore.selectionGroup = null;

      core.removeSelectionGroup();

      expect(mockObjectsMap.remove).not.toHaveBeenCalled();
    });

    it('should disable isInteractive for deselected dynamic objects', () => {
      const dynamicObjectObject = {
        id: 'custom-1',
        __class__: 'KritzelDynamicObject',
        isInteractive: true,
      } as unknown as KritzelBaseObject<any>;
      const regularObject = {
        id: 'shape-1',
        __class__: 'KritzelShape',
        isInteractive: true,
      } as unknown as KritzelBaseObject<any>;

      const sg = {
        id: 'sg-1',
        objects: [dynamicObjectObject, regularObject],
      } as unknown as KritzelSelectionGroup;
      mockStore.selectionGroup = sg;

      core.removeSelectionGroup();

      expect(dynamicObjectObject.isInteractive).toBe(false);
      expect(regularObject.isInteractive).toBe(true);
    });

    it('should remove orphaned local selection groups that are not in store.selectionGroup', () => {
      const selectedChild = {
        id: 'obj-1',
        __class__: 'KritzelShape',
        isSelected: true,
      } as unknown as KritzelBaseObject<any>;

      const referencedGroup = {
        id: 'sg-1',
        __class__: 'KritzelSelectionGroup',
        userId: undefined,
        objects: [selectedChild],
        deselectAllChildren: jest.fn(() => {
          selectedChild.isSelected = false;
        }),
      } as unknown as KritzelSelectionGroup;

      const orphanChild = {
        id: 'obj-2',
        __class__: 'KritzelShape',
        isSelected: true,
      } as unknown as KritzelBaseObject<any>;

      const orphanGroup = {
        id: 'sg-2',
        __class__: 'KritzelSelectionGroup',
        userId: undefined,
        objects: [orphanChild],
        deselectAllChildren: jest.fn(() => {
          orphanChild.isSelected = false;
        }),
      } as unknown as KritzelSelectionGroup;

      mockStore.selectionGroup = referencedGroup;
      mockObjectsMap.allObjects.mockReturnValue([referencedGroup, orphanGroup]);

      core.removeSelectionGroup();

      expect(referencedGroup.deselectAllChildren).toHaveBeenCalled();
      expect(orphanGroup.deselectAllChildren).toHaveBeenCalled();
      expect(selectedChild.isSelected).toBe(false);
      expect(orphanChild.isSelected).toBe(false);
      expect(mockObjectsMap.remove).toHaveBeenCalled();
      expect(mockStore.setSelectionGroup).toHaveBeenCalledWith(null);
      expect(mockEngine.triggerSelectionChange).toHaveBeenCalled();
    });
  });

  describe('removeSelectionBox', () => {
    it('should remove the selection box from the store', () => {
      const sb = { id: 'sb-1' } as any;
      mockStore.selectionBox = sb;

      core.removeSelectionBox();

      expect(mockObjectsMap.remove).toHaveBeenCalled();
      expect(mockStore.setSelectionBox).toHaveBeenCalledWith(null);
    });

    it('should do nothing if no selection box exists', () => {
      mockStore.selectionBox = null;

      core.removeSelectionBox();

      expect(mockObjectsMap.remove).not.toHaveBeenCalled();
    });
  });

  describe('deselectAllObjects', () => {
    it('should remove selection group and rerender', () => {
      const sg = { id: 'sg-1' } as any;
      mockStore.selectionGroup = sg;

      core.deselectAllObjects();

      expect(mockStore.setSelectionGroup).toHaveBeenCalledWith(null);
      expect(mockEngine.forceUpdate).toBe(1);
    });
  });

  describe('delete', () => {
    it('should remove all selected objects and the selection group', () => {
      const obj1 = { id: 'obj-1', isMounted: true } as any;
      const obj2 = { id: 'obj-2', isMounted: true } as any;
      const sg = { id: 'sg-1', objects: [obj1, obj2] } as any;
      mockStore.selectionGroup = sg;

      core.delete();

      expect(obj1.isMounted).toBe(false);
      expect(obj2.isMounted).toBe(false);
    });

    it('should do nothing if no selection group exists', () => {
      mockStore.selectionGroup = null;

      core.delete();

      expect(mockObjectsMap.remove).not.toHaveBeenCalled();
    });
  });

  describe('undo', () => {
    it('should call undo on the objects map', () => {
      core.undo();
      expect(mockObjectsMap.undo).toHaveBeenCalled();
    });
  });

  describe('redo', () => {
    it('should call redo on the objects map', () => {
      core.redo();
      expect(mockObjectsMap.redo).toHaveBeenCalled();
    });
  });

  describe('deleteObject', () => {
    it('should remove the object by id and rerender', () => {
      const obj = { id: 'obj-del', isMounted: true } as any;
      mockStore.allObjects = [obj];

      core.deleteObject('obj-del');

      expect(obj.isMounted).toBe(false);
      expect(mockEngine.forceUpdate).toBe(1);
    });

    it('should do nothing if object not found', () => {
      mockStore.allObjects = [];

      core.deleteObject('nonexistent');

      expect(mockObjectsMap.remove).not.toHaveBeenCalled();
    });
  });

  describe('bringForward', () => {
    it('should increment zIndex of selected objects', () => {
      const obj = { id: 'obj-1', zIndex: 3, onAfterUpdate: jest.fn() } as any;
      const sg = { objects: [obj] } as any;
      mockStore.selectionGroup = sg;
      mockStore.allNonSelectionObjects = [
        { id: 'other', zIndex: 5 },
      ];

      core.bringForward();

      expect(obj.zIndex).toBe(4);
      expect(mockEngine.forceUpdate).toBe(1);
    });

    it('should accept an explicit object parameter', () => {
      const obj = { id: 'obj-1', zIndex: 2, onAfterUpdate: jest.fn() } as any;
      mockStore.allNonSelectionObjects = [
        { id: 'other', zIndex: 5 },
      ];

      core.bringForward(obj);

      expect(obj.zIndex).toBe(3);
    });
  });

  describe('sendBackward', () => {
    it('should decrement zIndex of selected objects', () => {
      const obj = { id: 'obj-1', zIndex: 5, onAfterUpdate: jest.fn() } as any;
      const sg = { objects: [obj] } as any;
      mockStore.selectionGroup = sg;
      mockStore.allNonSelectionObjects = [
        { id: 'other', zIndex: 2 },
      ];

      core.sendBackward();

      expect(obj.zIndex).toBe(4);
      expect(mockEngine.forceUpdate).toBe(1);
    });
  });

  describe('bringToFront', () => {
    it('should set zIndex to max + 1 of all other objects', () => {
      const obj = { id: 'obj-1', zIndex: 1, onAfterUpdate: jest.fn() } as any;
      const sg = { objects: [obj] } as any;
      mockStore.selectionGroup = sg;
      mockStore.allNonSelectionObjects = [
        { id: 'other', zIndex: 10 },
      ];

      core.bringToFront();

      expect(obj.zIndex).toBe(11);
    });
  });

  describe('sendToBack', () => {
    it('should set zIndex to min - 1 of all other objects', () => {
      const obj = { id: 'obj-1', zIndex: 5, onAfterUpdate: jest.fn() } as any;
      const sg = { objects: [obj] } as any;
      mockStore.selectionGroup = sg;
      mockStore.allNonSelectionObjects = [
        { id: 'other', zIndex: 3 },
      ];

      core.sendToBack();

      expect(obj.zIndex).toBe(2);
    });
  });

  describe('selectObjects', () => {
    it('should do nothing with empty array', () => {
      core.selectObjects([]);

      expect(mockObjectsMap.insert).not.toHaveBeenCalled();
    });

    it('should create selection group with provided objects', () => {
      const mockSG: any = {
        addOrRemove: jest.fn(),
        isSelected: false,
        objects: [{ rotation: 0.5 }],
        rotation: 0,
      };
      jest.spyOn(KritzelSelectionGroup, 'create').mockReturnValue(mockSG);

      const obj = { id: 'obj-1', isSelected: true } as any;

      core.selectObjects([obj]);

      expect(obj.isSelected).toBe(false);
      expect(mockSG.addOrRemove).toHaveBeenCalledWith(obj);
      expect(mockSG.isSelected).toBe(true);
      expect(mockSG.rotation).toBe(0.5);
    });
  });

  describe('clearSelection', () => {
    it('should remove selection group, box, and reset selection state', () => {
      mockStore.selectionGroup = { id: 'sg-1' };

      core.clearSelection();

      expect(mockStore.setSelectionBox).toHaveBeenCalledWith(null);
      expect(mockStore.setSelectionGroup).toHaveBeenCalledWith(null);
      expect(mockStore.state.isSelecting).toBe(false);
      expect(mockStore.state.isResizeHandleSelected).toBe(false);
      expect(mockStore.state.isRotationHandleSelected).toBe(false);
      expect(mockStore.state.isLineHandleSelected).toBe(false);
      expect(mockStore.state.isLineHandleDragging).toBe(false);
      expect(mockStore.state.lineHandleType).toBeUndefined();
    });
  });

  describe('resetActiveText', () => {
    it('should save active text that is not empty', () => {
      const activeText = { isEmpty: false, save: jest.fn(), id: 'text-1' };
      mockStore.activeText = activeText;

      core.resetActiveText();

      expect(activeText.save).toHaveBeenCalled();
    });

    it('should delete active text that is empty', () => {
      const activeText = { isEmpty: true, save: jest.fn(), id: 'text-empty' };
      mockStore.activeText = activeText;
      mockStore.allObjects = [activeText];

      core.resetActiveText();

      expect(activeText.save).not.toHaveBeenCalled();
    });

    it('should do nothing when no active text', () => {
      mockStore.activeText = null;

      core.resetActiveText();
      // should not throw
      expect(true).toBe(true);
    });
  });

  describe('resetActiveShape', () => {
    it('should save active shape', () => {
      const activeShape = { save: jest.fn() };
      mockStore.activeShape = activeShape;

      core.resetActiveShape();

      expect(activeShape.save).toHaveBeenCalled();
    });

    it('should do nothing when no active shape', () => {
      mockStore.activeShape = null;

      core.resetActiveShape();
      // should not throw
      expect(true).toBe(true);
    });
  });

  describe('getCanvasPoint', () => {
    it('should convert client coordinates to canvas coordinates', () => {
      mockStore.state.host = {
        getBoundingClientRect: jest.fn().mockReturnValue({ left: 10, top: 20 }),
      };
      mockStore.state.translateX = 50;
      mockStore.state.translateY = 100;
      mockStore.state.scale = 2;

      const event = { clientX: 110, clientY: 220 } as PointerEvent;
      const point = core.getCanvasPoint(event);

      // xRelativeToHost = 110 - 10 = 100
      // xWithoutTranslate = 100 - 50 = 50
      // worldX = 50 / 2 = 25
      expect(point.x).toBe(25);

      // yRelativeToHost = 220 - 20 = 200
      // yWithoutTranslate = 200 - 100 = 100
      // worldY = 100 / 2 = 50
      expect(point.y).toBe(50);
    });

    it('should return (0, 0) when no host', () => {
      mockStore.state.host = null;

      const event = { clientX: 100, clientY: 200 } as PointerEvent;
      const point = core.getCanvasPoint(event);

      expect(point).toEqual({ x: 0, y: 0 });
    });
  });

  describe('getObjectsInViewport', () => {
    it('should query objects within viewport bounds', () => {
      const obj = { zIndex: 1 } as any;
      mockObjectsMap.query.mockReturnValue([obj]);

      const result = core.getObjectsInViewport();

      expect(mockObjectsMap.query).toHaveBeenCalled();
      expect(result).toContain(obj);
    });

    it('should exclude selection group and selection box', () => {
      const obj = { zIndex: 1 } as any;
      const selGroup = Object.create(KritzelSelectionGroup.prototype);
      selGroup.zIndex = 99999;
      const selBox = Object.create(KritzelSelectionBox.prototype);
      selBox.zIndex = 99999;

      mockObjectsMap.query.mockReturnValue([obj, selGroup, selBox]);

      const result = core.getObjectsInViewport();

      expect(result).toContain(obj);
      expect(result).not.toContain(selGroup);
      expect(result).not.toContain(selBox);
    });

    it('should sort results by zIndex', () => {
      const objA = { zIndex: 10 } as any;
      const objB = { zIndex: 2 } as any;
      mockObjectsMap.query.mockReturnValue([objA, objB]);

      const result = core.getObjectsInViewport();

      expect(result[0].zIndex).toBeLessThanOrEqual(result[1].zIndex);
    });
  });

  describe('displaySelectionGroupUI', () => {
    it('should return false if object is not selected', () => {
      const obj = { isSelected: false } as any;

      expect(core.displaySelectionGroupUI(obj)).toBe(false);
    });

    it('should return true for selected non-line objects when no selection group', () => {
      const obj = { isSelected: true } as any;
      mockStore.selectionGroup = null;

      expect(core.displaySelectionGroupUI(obj)).toBe(true);
    });

    it('should return false for selected KritzelLine when no selection group', () => {
      const line = Object.create(KritzelLine.prototype);
      line.isSelected = true;
      mockStore.selectionGroup = null;

      expect(core.displaySelectionGroupUI(line)).toBe(false);
    });

    it('should render group UI only on the local selection group when multiple objects are selected', () => {
      const obj = { id: 'obj-1', isSelected: true } as any;
      const localGroup = Object.create(KritzelSelectionGroup.prototype);
      localGroup.id = 'sg-1';
      localGroup.isSelected = true;
      Object.defineProperty(localGroup, 'objects', { value: [{}, {}], writable: true });
      mockStore.selectionGroup = localGroup;

      expect(core.displaySelectionGroupUI(obj)).toBe(false);
      expect(core.displaySelectionGroupUI(localGroup)).toBe(true);
    });

    it('should return false when local selection group contains a single KritzelLine', () => {
      const localGroup = Object.create(KritzelSelectionGroup.prototype);
      localGroup.id = 'sg-1';
      localGroup.isSelected = true;
      const line = Object.create(KritzelLine.prototype);
      Object.defineProperty(localGroup, 'objects', { value: [line], writable: true });
      mockStore.selectionGroup = localGroup;

      expect(core.displaySelectionGroupUI(localGroup)).toBe(false);
    });

    it('should return true when local selection group contains a single non-line object', () => {
      const localGroup = Object.create(KritzelSelectionGroup.prototype);
      localGroup.id = 'sg-1';
      localGroup.isSelected = true;
      const rect = { id: 'rect-1' };
      Object.defineProperty(localGroup, 'objects', { value: [rect], writable: true });
      mockStore.selectionGroup = localGroup;

      expect(core.displaySelectionGroupUI(localGroup)).toBe(true);
    });

    it('should return true for a remote selection group regardless of content', () => {
      const remoteGroup = Object.create(KritzelSelectionGroup.prototype);
      remoteGroup.isSelected = true;
      remoteGroup.userId = 'remote-user';
      const line = Object.create(KritzelLine.prototype);
      Object.defineProperty(remoteGroup, 'objects', { value: [line], writable: true });
      core.setUser({ id: 'local-user', displayName: 'Local' } as any);

      expect(core.displaySelectionGroupUI(remoteGroup)).toBe(true);
    });
  });

  describe('displaySelectionLineUI', () => {
    it('should return false for non-line objects', () => {
      const obj = { isSelected: true } as any;

      expect(core.displaySelectionLineUI(obj)).toBe(false);
    });

    it('should return true for selected line when no selection group', () => {
      const line = Object.create(KritzelLine.prototype);
      line.isSelected = true;
      line.id = 'line-1';
      mockStore.selectionGroup = null;

      expect(core.displaySelectionLineUI(line)).toBe(true);
    });

    it('should return false for unselected line when no selection group', () => {
      const line = Object.create(KritzelLine.prototype);
      line.isSelected = false;
      mockStore.selectionGroup = null;

      expect(core.displaySelectionLineUI(line)).toBe(false);
    });

    it('should return false when selection group is not selected', () => {
      const line = Object.create(KritzelLine.prototype);
      line.isSelected = true;
      line.id = 'line-1';
      mockStore.selectionGroup = { isSelected: false, objects: [line] };

      expect(core.displaySelectionLineUI(line)).toBe(false);
    });

    it('should return true for a single selected line in selection group', () => {
      const line = Object.create(KritzelLine.prototype);
      line.isSelected = true;
      line.id = 'line-1';
      mockStore.selectionGroup = { isSelected: true, objects: [line] };

      expect(core.displaySelectionLineUI(line)).toBe(true);
    });

    it('should return false when selection group has multiple objects', () => {
      const line = Object.create(KritzelLine.prototype);
      line.isSelected = true;
      line.id = 'line-1';
      const otherObj = { id: 'other' };
      mockStore.selectionGroup = { isSelected: true, objects: [line, otherObj] };

      expect(core.displaySelectionLineUI(line)).toBe(false);
    });
  });

  describe('beforeWorkspaceChange', () => {
    it('should cancel pending viewport updates', () => {
      core.beforeWorkspaceChange();

      expect(mockEngine.viewport.cancelPendingUpdates).toHaveBeenCalled();
    });

    it('should save current workspace viewport', () => {
      mockStore.state.activeWorkspace = { id: 'ws-1', viewport: null, updatedAt: null };
      mockStore.state.workspaces = [mockStore.state.activeWorkspace];
      mockStore.state.translateX = 50;
      mockStore.state.translateY = 100;
      mockStore.state.scale = 2;
      mockStore.state.viewportWidth = 1000;
      mockStore.state.viewportHeight = 800;

      core.beforeWorkspaceChange();

      // centerWorldX = (1000/2 - 50) / 2 = 225
      // centerWorldY = (800/2 - 100) / 2 = 150
      expect(mockStore.state.activeWorkspace.viewport).toEqual({
        centerWorldX: 225,
        centerWorldY: 150,
        scale: 2,
      });
    });

    it('should switch active tool to selection', () => {
      core.beforeWorkspaceChange();

      expect(mockStore.setState).toHaveBeenCalledWith('activeTool', expect.anything());
    });
  });

  describe('getObjectFromPointerEvent', () => {
    it('should return null when no shadow root', () => {
      mockStore.state.host = {};

      const event = { clientX: 100, clientY: 200 } as PointerEvent;

      expect(core.getObjectFromPointerEvent(event)).toBeNull();
    });

    it('should return null when no element at point', () => {
      mockStore.state.host = {
        shadowRoot: {
          elementFromPoint: jest.fn().mockReturnValue(null),
        },
      };

      const event = { clientX: 100, clientY: 200 } as PointerEvent;

      expect(core.getObjectFromPointerEvent(event)).toBeNull();
    });

    it('should return matching object that passes hit test', () => {
      const obj = { id: 'obj-1', hitTest: jest.fn().mockReturnValue(true) };
      mockStore.allObjects = [obj];

      const closestEl = { id: 'obj-1' };
      const element = { closest: jest.fn().mockReturnValue(closestEl) };

      mockStore.state.host = {
        shadowRoot: {
          elementFromPoint: jest.fn().mockReturnValue(element),
        },
      };

      const event = { clientX: 100, clientY: 200 } as PointerEvent;

      expect(core.getObjectFromPointerEvent(event)).toBe(obj);
    });

    it('should return null when hit test fails', () => {
      const obj = { id: 'obj-1', hitTest: jest.fn().mockReturnValue(false) };
      mockStore.allObjects = [obj];

      const closestEl = { id: 'obj-1' };
      const element = { closest: jest.fn().mockReturnValue(closestEl) };

      mockStore.state.host = {
        shadowRoot: {
          elementFromPoint: jest.fn().mockReturnValue(element),
        },
      };

      const event = { clientX: 100, clientY: 200 } as PointerEvent;

      expect(core.getObjectFromPointerEvent(event)).toBeNull();
    });
  });

  describe('getObjectsFromPointerEvent', () => {
    it('should return empty array when no shadow root', () => {
      mockStore.state.host = {};

      const event = { clientX: 100, clientY: 200 } as PointerEvent;

      expect(core.getObjectsFromPointerEvent(event)).toEqual([]);
    });

    it('should return empty array when no elements at point', () => {
      mockStore.state.host = {
        shadowRoot: {
          elementsFromPoint: jest.fn().mockReturnValue([]),
        },
      };

      const event = { clientX: 100, clientY: 200 } as PointerEvent;

      expect(core.getObjectsFromPointerEvent(event)).toEqual([]);
    });

    it('should return matching objects sorted by zIndex descending', () => {
      const obj1 = { id: 'obj-1', zIndex: 1 };
      const obj2 = { id: 'obj-2', zIndex: 5 };
      mockStore.allObjects = [obj1, obj2];

      const el1 = { closest: jest.fn().mockReturnValue({ id: 'obj-1' }) };
      const el2 = { closest: jest.fn().mockReturnValue({ id: 'obj-2' }) };

      mockStore.state.host = {
        shadowRoot: {
          elementsFromPoint: jest.fn().mockReturnValue([el1, el2]),
        },
      };

      const event = { clientX: 100, clientY: 200 } as PointerEvent;
      const result = core.getObjectsFromPointerEvent(event);

      expect(result).toHaveLength(2);
      expect(result[0].zIndex).toBeGreaterThanOrEqual(result[1].zIndex);
    });
  });

  describe('getElementsAtPoint', () => {
    it('should return empty array when no shadow root', () => {
      mockStore.state.host = {};

      const event = { clientX: 100, clientY: 200 } as PointerEvent;

      expect(core.getElementsAtPoint(event, '.object')).toEqual([]);
    });

    it('should filter elements matching the selector', () => {
      const match = { matches: jest.fn().mockReturnValue(true) };
      const noMatch = { matches: jest.fn().mockReturnValue(false) };

      mockStore.state.host = {
        shadowRoot: {
          elementsFromPoint: jest.fn().mockReturnValue([match, noMatch]),
        },
      };

      const event = { clientX: 100, clientY: 200 } as PointerEvent;
      const result = core.getElementsAtPoint(event, '.handle');

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(match);
    });
  });

  describe('isPointerOverElement', () => {
    it('should return true when elements match selector', () => {
      const match = { matches: jest.fn().mockReturnValue(true) };
      mockStore.state.host = {
        shadowRoot: {
          elementsFromPoint: jest.fn().mockReturnValue([match]),
        },
      };

      const event = { clientX: 100, clientY: 200 } as PointerEvent;

      expect(core.isPointerOverElement(event, '.handle')).toBe(true);
    });

    it('should return false when no elements match selector', () => {
      mockStore.state.host = {
        shadowRoot: {
          elementsFromPoint: jest.fn().mockReturnValue([]),
        },
      };

      const event = { clientX: 100, clientY: 200 } as PointerEvent;

      expect(core.isPointerOverElement(event, '.handle')).toBe(false);
    });
  });

  describe('initializeWorkspace', () => {
    const STORAGE_KEY = 'kritzel-active-workspace-id';

    function createWorkspace(id: string, name: string, createdAt: Date, updatedAt?: Date): KritzelWorkspace {
      const ws = new KritzelWorkspace({ id, name });
      ws.createdAt = createdAt;
      ws.updatedAt = updatedAt ?? createdAt;
      return ws;
    }

    beforeEach(() => {
      localStorage.removeItem(STORAGE_KEY);
    });

    afterEach(() => {
      localStorage.removeItem(STORAGE_KEY);
    });

    it('should use the provided workspace when one is passed', async () => {
      const ws = createWorkspace('ws-explicit', 'Explicit', new Date('2025-06-01'));
      mockAppStateMap.allWorkspaces.mockReturnValue([]);
      mockAppStateMap.has.mockReturnValue(false);

      await core.initializeWorkspace(ws);

      expect(mockStore.state.activeWorkspace).toBe(ws);
    });

    it('should use last-active workspace from localStorage when no workspace argument is given', async () => {
      const wsOld = createWorkspace('ws-old', 'Old', new Date('2025-01-01'));
      const wsNew = createWorkspace('ws-new', 'New', new Date('2025-06-01'));
      mockAppStateMap.allWorkspaces.mockReturnValue([wsOld, wsNew]);
      localStorage.setItem(STORAGE_KEY, 'ws-old');

      await core.initializeWorkspace();

      expect(mockStore.state.activeWorkspace).toBe(wsOld);
    });

    it('should prefer newest createdAt when last-active is absent', async () => {
      const wsOld = createWorkspace('ws-old', 'Old', new Date('2025-01-01'), new Date('2025-12-01'));
      const wsNew = createWorkspace('ws-new', 'New', new Date('2025-06-01'), new Date('2025-06-01'));
      mockAppStateMap.allWorkspaces.mockReturnValue([wsOld, wsNew]);

      await core.initializeWorkspace();

      expect(mockStore.state.activeWorkspace).toBe(wsNew);
    });

    it('should use updatedAt as tie-breaker when createdAt is identical', async () => {
      const sameDate = new Date('2025-05-01');
      const wsA = createWorkspace('ws-a', 'A', sameDate, new Date('2025-06-01'));
      const wsB = createWorkspace('ws-b', 'B', sameDate, new Date('2025-09-01'));
      mockAppStateMap.allWorkspaces.mockReturnValue([wsA, wsB]);

      await core.initializeWorkspace();

      expect(mockStore.state.activeWorkspace).toBe(wsB);
    });

    it('should select the single existing workspace when exactly one exists', async () => {
      const ws = createWorkspace('ws-only', 'Only', new Date('2025-03-01'));
      mockAppStateMap.allWorkspaces.mockReturnValue([ws]);

      await core.initializeWorkspace();

      expect(mockStore.state.activeWorkspace).toBe(ws);
    });

    it('should create a new workspace when none exist', async () => {
      mockAppStateMap.allWorkspaces.mockReturnValue([]);
      mockAppStateMap.has.mockReturnValue(false);

      await core.initializeWorkspace();

      expect(mockStore.state.activeWorkspace).toBeDefined();
      expect(mockStore.state.activeWorkspace).not.toBeNull();
      expect(mockAppStateMap.insert).toHaveBeenCalled();
    });

    it('should set activeWorkspace to null when skipFallbackCreation is true and no workspaces exist', async () => {
      mockAppStateMap.allWorkspaces.mockReturnValue([]);

      await core.initializeWorkspace(undefined, { skipFallbackCreation: true });

      expect(mockStore.state.activeWorkspace).toBeNull();
    });

    it('should persist active workspace id to localStorage', async () => {
      const ws = createWorkspace('ws-persist', 'Persist', new Date('2025-04-01'));
      mockAppStateMap.allWorkspaces.mockReturnValue([ws]);

      await core.initializeWorkspace(ws);

      expect(localStorage.getItem(STORAGE_KEY)).toBe('ws-persist');
    });

    it('should seed configured objects into an empty workspace object map', async () => {
      const object = { id: 'seed-object', workspaceId: 'other-workspace' } as KritzelBaseObject<any>;
      const ws = new KritzelWorkspace({ id: 'ws-seeded', name: 'Seeded', objects: [object] });
      mockAppStateMap.allWorkspaces.mockReturnValue([]);
      mockAppStateMap.has.mockReturnValue(false);

      await core.initializeWorkspace(ws);

      expect(mockObjectsMap.insert).toHaveBeenCalledWith(object);
      expect(object.workspaceId).toBe('ws-seeded');
    });

    it('should initialize runtime fields on seeded objects like addObject does', async () => {
      const object = { id: 'seed-object' } as KritzelBaseObject<any>;
      const ws = new KritzelWorkspace({ id: 'ws-seeded', name: 'Seeded', viewport: { scale: 2 }, objects: [object] });
      mockAppStateMap.allWorkspaces.mockReturnValue([]);
      mockAppStateMap.has.mockReturnValue(false);

      await core.initializeWorkspace(ws);

      expect(object._core).toBe(core);
      expect(object.scale).toBe(2);
      expect(object.zIndex).toBe(mockStore.currentZIndex);
    });

    it('should preserve an explicit scale on seeded objects', async () => {
      const object = { id: 'seed-object', scale: 0.5 } as KritzelBaseObject<any>;
      const ws = new KritzelWorkspace({ id: 'ws-seeded', name: 'Seeded', objects: [object] });
      mockAppStateMap.allWorkspaces.mockReturnValue([]);
      mockAppStateMap.has.mockReturnValue(false);
      mockStore.state.scale = 2;

      await core.initializeWorkspace(ws);

      expect(object.scale).toBe(0.5);
    });

    it('should not insert a configured object that already exists in the workspace map', async () => {
      const object = { id: 'seed-object', workspaceId: 'ws-seeded' } as KritzelBaseObject<any>;
      const ws = new KritzelWorkspace({ id: 'ws-seeded', name: 'Seeded', objects: [object] });
      mockAppStateMap.allWorkspaces.mockReturnValue([]);
      mockAppStateMap.has.mockReturnValue(false);
      mockObjectsMap.findById.mockReturnValue(object);

      await core.initializeWorkspace(ws);

      expect(mockObjectsMap.insert).not.toHaveBeenCalledWith(object);
    });
  });
});
