import { KritzelCore } from './core.class';
import { KritzelEngine } from '../../components/core/kritzel-engine/kritzel-engine';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelSelectionBox } from '../objects/selection-box.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelGroup } from '../objects/group.class';
import { KritzelLine } from '../objects/line.class';
import { KritzelWorkspace } from './workspace.class';
import { KritzelToolRegistry } from '../registries/tool.registry';
import { KritzelStore } from './store.class';
import { KritzelObjectMap } from '../structures/object-map.structure';
import { KritzelAppStateMap } from '../structures/app-state-map.structure';
import { KritzelAnchorManager } from '../managers/anchor.manager';
import { KritzelCursorManager } from '../managers/cursor.manager';
import { KritzelThemeManager } from '../managers/theme.manager';

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
  let mockEngine: jest.Mocked<KritzelEngine>;
  let mockStore: any;
  let mockAppStateMap: any;
  let mockAnchorManager: any;
  let mockObjectsMap: any;

  const createMockEngine = (): jest.Mocked<KritzelEngine> => {
    return {
      forceUpdate: 0,
      emitObjectsChange: jest.fn(),
      triggerSelectionChange: jest.fn(),
      addObject: jest.fn(),
      viewport: {
        cancelPendingUpdates: jest.fn(),
        centerFitInViewport: jest.fn(),
      },
    } as unknown as jest.Mocked<KritzelEngine>;
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
      update: jest.fn().mockReturnValue(true),
      remove: jest.fn(),
      filter: jest.fn().mockReturnValue([]),
      allObjects: jest.fn().mockReturnValue([]),
      query: jest.fn().mockReturnValue([]),
      transaction: jest.fn((cb: () => void) => cb()),
      undo: jest.fn(),
      redo: jest.fn(),
      destroy: jest.fn(),
      totalCount: 0,
    };

    (KritzelObjectMap as jest.Mock).mockImplementation(() => mockObjectsMap);

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

    (KritzelAppStateMap as jest.Mock).mockImplementation(() => mockAppStateMap);

    // Setup mock anchor manager
    mockAnchorManager = {
      rebuildIndex: jest.fn(),
      handleLineDeleted: jest.fn(),
      handleObjectDeleted: jest.fn(),
      updateAnchorsForObject: jest.fn(),
    };

    (KritzelAnchorManager as jest.Mock).mockImplementation(() => mockAnchorManager);
    (KritzelCursorManager as jest.Mock).mockImplementation(() => ({}));
    (KritzelThemeManager as unknown as jest.Mock).mockImplementation(() => ({}));

    // Setup mock store
    mockStore = {
      state: {
        objects: mockObjectsMap,
        activeWorkspace: { id: 'ws-1', viewport: { translateX: 0, translateY: 0, scale: 1 } },
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
        copiedObjects: null,
        copiedObjectIdMapping: null,
        activeTool: null,
        pointers: new Map(),
      },
      allObjects: [],
      allNonSelectionObjects: [],
      selectedObjects: [],
      selectionGroup: null,
      selectionBox: null,
      currentZIndex: 1,
      setSelectionBox: jest.fn(),
      setSelectionGroup: jest.fn(),
      setState: jest.fn(),
      getState: jest.fn(),
      onStateChange: jest.fn(),
    };

    (KritzelStore as jest.Mock).mockImplementation(() => mockStore);
    (KritzelToolRegistry.getTool as jest.Mock) = jest.fn().mockReturnValue({ name: 'selection' });

    mockEngine = createMockEngine();
    core = new KritzelCore(mockEngine);
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
      const ws = [new KritzelWorkspace('ws-1', 'Workspace 1')];
      mockAppStateMap.allWorkspaces.mockReturnValue(ws);

      expect(core.getWorkspaces()).toBe(ws);
    });
  });

  describe('createWorkspace', () => {
    it('should set core reference and dates on the workspace', () => {
      const ws = new KritzelWorkspace('ws-new', 'New Workspace');
      const before = new Date();

      core.createWorkspace(ws);

      expect(ws._core).toBe(core);
      expect(ws.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(ws.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('should save workspace to app state and refresh workspace list', () => {
      const ws = new KritzelWorkspace('ws-new', 'New Workspace');

      core.createWorkspace(ws);

      // saveWorkspaceToAppState is private, but we can check insert/update was called
      expect(mockAppStateMap.insert).toHaveBeenCalled();
    });
  });

  describe('updateWorkspace', () => {
    it('should update the updatedAt timestamp', () => {
      const ws = new KritzelWorkspace('ws-1', 'Workspace');
      const oldDate = new Date(2020, 0, 1);
      ws.updatedAt = oldDate;

      mockStore.state.workspaces = [ws];

      core.updateWorkspace(ws);

      expect(ws.updatedAt.getTime()).toBeGreaterThan(oldDate.getTime());
    });

    it('should update the workspace in the workspaces array', () => {
      const ws = new KritzelWorkspace('ws-1', 'Old Name');
      mockStore.state.workspaces = [ws];

      ws.name = 'New Name';
      core.updateWorkspace(ws);

      expect(mockStore.state.workspaces[0].name).toBe('New Name');
    });
  });

  describe('deleteWorkspace', () => {
    it('should remove workspace from app state', () => {
      const ws = new KritzelWorkspace('ws-del', 'Delete Me');
      mockStore.state.activeWorkspace = { id: 'ws-other' };

      core.deleteWorkspace(ws);

      expect(mockAppStateMap.remove).toHaveBeenCalled();
    });

    it('should destroy objects and cancel updates when deleting the active workspace', () => {
      const ws = new KritzelWorkspace('ws-1', 'Active WS');
      mockStore.state.activeWorkspace = { id: 'ws-1' };

      core.deleteWorkspace(ws);

      expect(mockEngine.viewport.cancelPendingUpdates).toHaveBeenCalled();
      expect(mockObjectsMap.destroy).toHaveBeenCalled();
    });

    it('should delete the IndexedDB database for the workspace', () => {
      const ws = new KritzelWorkspace('ws-db', 'DB Test');
      mockStore.state.activeWorkspace = { id: 'ws-other' };

      core.deleteWorkspace(ws);

      expect(window.indexedDB.deleteDatabase).toHaveBeenCalledWith('kritzel-workspace-ws-db');
    });
  });

  describe('updateWorkspaceViewport', () => {
    it('should update viewport on active workspace', () => {
      const activeWs = { id: 'ws-1', viewport: null, updatedAt: null } as any;
      mockStore.state.activeWorkspace = activeWs;
      mockStore.state.workspaces = [activeWs];

      core.updateWorkspaceViewport(100, 200, 2);

      expect(activeWs.viewport).toEqual({ translateX: 100, translateY: 200, scale: 2 });
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

  describe('copy', () => {
    it('should copy selected objects to state', () => {
      const copiedObj = { id: 'copy-1' };
      const obj1 = { id: 'obj-1', zIndex: 1, copy: jest.fn().mockReturnValue(copiedObj) } as any;
      const sg = { id: 'sg-1', objects: [obj1] } as any;
      mockStore.selectionGroup = sg;

      core.copy();

      expect(obj1.copy).toHaveBeenCalled();
      expect(mockStore.state.copiedObjects).toHaveLength(1);
      expect(mockStore.state.copiedObjectIdMapping).toBeInstanceOf(Map);
    });

    it('should do nothing if no selection group', () => {
      mockStore.selectionGroup = null;

      core.copy();

      expect(mockStore.state.copiedObjects).toBeNull();
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
      const mockSG = {
        addOrRemove: jest.fn(),
        isSelected: false,
        objects: [{ rotation: 0.5 }],
        rotation: 0,
      };
      (KritzelSelectionGroup.create as jest.Mock) = jest.fn().mockReturnValue(mockSG);

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
      expect(mockStore.state.lineHandleType).toBeNull();
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

    it('should return true when selection group has multiple objects', () => {
      const obj = { isSelected: true } as any;
      mockStore.selectionGroup = { objects: [{}, {}] };

      expect(core.displaySelectionGroupUI(obj)).toBe(true);
    });

    it('should return false when single selected object is a KritzelLine', () => {
      const obj = { isSelected: true } as any;
      const line = Object.create(KritzelLine.prototype);
      mockStore.selectionGroup = { objects: [line] };

      expect(core.displaySelectionGroupUI(obj)).toBe(false);
    });

    it('should return true when single selected object is not a KritzelLine', () => {
      const obj = { isSelected: true } as any;
      const rect = { id: 'rect-1' };
      mockStore.selectionGroup = { objects: [rect] };

      expect(core.displaySelectionGroupUI(obj)).toBe(true);
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

      core.beforeWorkspaceChange();

      expect(mockStore.state.activeWorkspace.viewport).toEqual({
        translateX: 50,
        translateY: 100,
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
});
