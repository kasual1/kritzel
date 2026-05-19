// Mock Stencil decorators so the @Component class can be instantiated as a
// plain class in unit tests. Mirrors the pattern used in other component specs
// (e.g. kritzel-awareness-cursors.spec.ts).
jest.mock('@stencil/core', () => ({
  ...jest.requireActual('@stencil/core/internal/testing'),
  Component: () => (cls: any) => cls,
  Prop: () => () => {},
  State: () => () => {},
  Watch: () => () => {},
  Method: () => () => {},
  Listen: () => () => {},
  Event: () => () => {},
  Element: () => () => {},
}));

// KritzelEngine's constructor instantiates `new KritzelCore(this)`. Replace
// it with a lightweight mock so we don't pull in Yjs, IndexedDB, etc.
const mockCoreInstance: any = {};
jest.mock('../../../classes/core/core.class', () => ({
  KritzelCore: jest.fn().mockImplementation(() => mockCoreInstance),
}));

// Avoid heavy class graphs the engine module imports at top-level.
jest.mock('../../../classes/core/viewport.class', () => ({ KritzelViewport: jest.fn() }));
jest.mock('../../../classes/handlers/key.handler', () => ({ KritzelKeyHandler: jest.fn() }));
jest.mock('../../../classes/handlers/context-menu.handler', () => ({ KritzelContextMenuHandler: jest.fn() }));

class MockKritzelSelectionTool {}
class MockKritzelTextTool {}
class MockKritzelShapeTool {}
class MockKritzelEraserTool {}
class MockKritzelBaseTool {}
class MockKritzelSelectionBox {}
class MockKritzelSelectionGroup {}
class MockKritzelGroup {}

jest.mock('../../../classes/tools/selection-tool.class', () => ({ KritzelSelectionTool: MockKritzelSelectionTool }));
jest.mock('../../../classes/tools/text-tool.class', () => ({ KritzelTextTool: MockKritzelTextTool }));
jest.mock('../../../classes/tools/shape-tool.class', () => ({ KritzelShapeTool: MockKritzelShapeTool }));
jest.mock('../../../classes/tools/eraser-tool.class', () => ({ KritzelEraserTool: MockKritzelEraserTool }));
jest.mock('../../../classes/tools/base-tool.class', () => ({ KritzelBaseTool: MockKritzelBaseTool }));
jest.mock('../../../classes/objects/selection-box.class', () => ({ KritzelSelectionBox: MockKritzelSelectionBox }));
jest.mock('../../../classes/objects/selection-group.class', () => ({ KritzelSelectionGroup: MockKritzelSelectionGroup }));
jest.mock('../../../classes/objects/group.class', () => ({ KritzelGroup: MockKritzelGroup }));

jest.mock('html-to-image', () => ({
  toPng: jest.fn().mockResolvedValue('data:image/png;base64,xxx'),
  toSvg: jest.fn().mockResolvedValue('data:image/svg+xml;base64,xxx'),
}));

jest.mock('../../../helpers/keyboard.helper', () => ({
  KritzelKeyboardHelper: {
    forceHideKeyboard: jest.fn(),
  },
}));

import { KritzelEngine } from './kritzel-engine';
import { KritzelAlignment } from '../../../enums/alignment.enum';
import { KritzelWorkspace } from '../../../classes/core/workspace.class';

describe('KritzelEngine', () => {
  let engine: KritzelEngine;
  let core: any;

  /** Builds a fresh mock core for the engine to delegate to. */
  const createMockCore = () => ({
    setEditorId: jest.fn(),
    setUser: jest.fn(),
    setSyncConfig: jest.fn(),
    setAssetStorageConfig: jest.fn(),
    addObject: jest.fn(),
    updateObject: jest.fn(),
    removeObject: jest.fn(),
    delete: jest.fn(),
    copy: jest.fn(),
    cut: jest.fn(),
    paste: jest.fn(),
    bringForward: jest.fn(),
    sendBackward: jest.fn(),
    bringToFront: jest.fn(),
    sendToBack: jest.fn(),
    alignObjects: jest.fn(),
    group: jest.fn(),
    ungroup: jest.fn(),
    undo: jest.fn(),
    redo: jest.fn(),
    deselectAllObjects: jest.fn(),
    selectObjects: jest.fn(),
    selectAllObjectsInViewport: jest.fn(),
    clearSelection: jest.fn(),
    resetActiveText: jest.fn(),
    resetActiveShape: jest.fn(),
    rerender: jest.fn(),
    beforeWorkspaceChange: jest.fn(),
    initializeWorkspace: jest.fn().mockResolvedValue(undefined),
    createWorkspace: jest.fn().mockResolvedValue(undefined),
    updateWorkspace: jest.fn().mockResolvedValue(undefined),
    deleteWorkspace: jest.fn().mockResolvedValue(undefined),
    getWorkspaces: jest.fn().mockReturnValue([]),
    getIsPublic: jest.fn().mockReturnValue(false),
    getObjectsInViewport: jest.fn().mockReturnValue([]),
    cursorManager: {
      setTargetElement: jest.fn(),
      cleanup: jest.fn(),
    },
    themeManager: {
      setTheme: jest.fn(),
      getStoredTheme: jest.fn().mockReturnValue('light'),
      cleanup: jest.fn(),
    },
    store: {
      isDisabled: false,
      currentZIndex: 0,
      totalObjectCount: 0,
      allObjects: [] as any[],
      allNonSelectionObjects: [] as any[],
      objectsInViewport: [] as any[],
      selectionGroup: null as any,
      objects: {
        remove: jest.fn(),
        clearLocalSelectionBox: jest.fn(),
        clearCursorPosition: jest.fn(),
        destroy: jest.fn(),
        undoState: { canUndo: false, canRedo: false, undoStackSize: 0, redoStackSize: 0 },
      },
      state: {
        isEnabled: true,
        isReady: true,
        isContextMenuVisible: false,
        isSelecting: false,
        isResizeHandleSelected: false,
        isRotationHandleSelected: false,
        skipContextMenu: false,
        scale: 1,
        scaleMin: 0.1,
        scaleMax: 10,
        translateX: 0,
        translateY: 0,
        viewportWidth: 1000,
        viewportHeight: 800,
        viewportBoundaryLeft: -Infinity,
        viewportBoundaryRight: Infinity,
        viewportBoundaryTop: -Infinity,
        viewportBoundaryBottom: Infinity,
        debugInfo: {},
        pointers: new Map(),
        activeTool: null as any,
        activeWorkspace: null as KritzelWorkspace | null,
        workspaces: [] as KritzelWorkspace[],
        copiedObjects: undefined as any,
      },
      setState: jest.fn(),
      setSelectionBox: jest.fn(),
    },
    toolRegistry: {
      getTool: jest.fn(),
      hasTool: jest.fn(),
      registerTool: jest.fn(),
    },
  });

  beforeEach(() => {
    core = createMockCore();
    Object.assign(mockCoreInstance, core);

    engine = new KritzelEngine();

    // Wire up event emitters (decorators are mocked, so @Event fields are undefined).
    const emitterFields = [
      'isEngineReady',
      'activeToolChange',
      'objectsSelectionChange',
      'workspacesChange',
      'activeWorkspaceChange',
      'longpress',
      'objectsChange',
      'objectsAdded',
      'objectsRemoved',
      'objectsUpdated',
      'undoStateChange',
      'objectsInViewportChange',
      'viewportChange',
      'awarenessChange',
    ];
    for (const field of emitterFields) {
      (engine as any)[field] = { emit: jest.fn() };
    }

    engine.host = document.createElement('div') as any;
    engine.viewport = {
      handleWheel: jest.fn(),
      handlePointerDown: jest.fn(),
      handlePointerMove: jest.fn(),
      handlePointerUp: jest.fn(),
      handleResize: jest.fn(),
      centerFitNearestContent: jest.fn().mockReturnValue(true),
      centerFitAllObjects: jest.fn().mockReturnValue(true),
      setViewport: jest.fn(),
      panTo: jest.fn(),
      zoomTo: jest.fn(),
      getViewport: jest.fn().mockReturnValue({
        translateX: 0,
        translateY: 0,
        scale: 1,
        viewportWidth: 1000,
        viewportHeight: 800,
        centerWorldX: 0,
        centerWorldY: 0,
      }),
      screenToWorld: jest.fn().mockReturnValue({ x: 0, y: 0 }),
      worldToScreen: jest.fn().mockReturnValue({ x: 0, y: 0 }),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('selection delegation', () => {
    it('triggerSelectionChange emits the objectsSelectionChange event', async () => {
      await engine.triggerSelectionChange();

      expect((engine as any).objectsSelectionChange.emit).toHaveBeenCalledTimes(1);
    });

    it('clearSelection delegates to core', async () => {
      await engine.clearSelection();

      expect(core.clearSelection).toHaveBeenCalledTimes(1);
    });

    it('selectObjects no-ops if the selection tool is not registered', async () => {
      (core.toolRegistry.getTool as jest.Mock).mockReturnValue(null);

      await engine.selectObjects([]);

      expect(core.selectObjects).not.toHaveBeenCalled();
    });

    it('selectObjects switches to the selection tool and forwards the objects', async () => {
      const selectionTool = { onActivate: jest.fn(), onDeactivate: jest.fn() };
      (core.toolRegistry.getTool as jest.Mock).mockReturnValue(selectionTool);

      const objects: any[] = [{ id: 'a' }, { id: 'b' }];
      await engine.selectObjects(objects);

      expect(core.toolRegistry.getTool).toHaveBeenCalledWith('selection');
      expect(core.store.setState).toHaveBeenCalledWith('activeTool', selectionTool);
      expect(core.deselectAllObjects).toHaveBeenCalledTimes(1);
      expect(core.selectObjects).toHaveBeenCalledWith(objects);
    });

    it('selectAllObjectsInViewport delegates after switching to the selection tool', async () => {
      const selectionTool = { onActivate: jest.fn(), onDeactivate: jest.fn() };
      (core.toolRegistry.getTool as jest.Mock).mockReturnValue(selectionTool);

      await engine.selectAllObjectsInViewport();

      expect(core.selectAllObjectsInViewport).toHaveBeenCalledTimes(1);
    });

    it('getSelectedObjects returns an empty array when nothing is selected', async () => {
      core.store.selectionGroup = null;

      const result = await engine.getSelectedObjects();

      expect(result).toEqual([]);
    });

    it('getSelectedObjects returns the active selection group objects', async () => {
      const objects: any[] = [{ id: 'a' }];
      core.store.selectionGroup = { objects };

      const result = await engine.getSelectedObjects();

      expect(result).toBe(objects);
    });
  });

  describe('clipboard / object lifecycle delegation', () => {
    it('delete delegates to core.delete', async () => {
      await engine.delete();
      expect(core.delete).toHaveBeenCalledTimes(1);
    });

    it('copy delegates to core.copy', async () => {
      await engine.copy();
      expect(core.copy).toHaveBeenCalledTimes(1);
    });

    it('cut delegates to core.cut', async () => {
      await engine.cut();
      expect(core.cut).toHaveBeenCalledTimes(1);
    });

    it('paste forwards coordinates to core.paste', async () => {
      await engine.paste(42, 99);
      expect(core.paste).toHaveBeenCalledWith(42, 99);
    });

    it('getCopiedObjects returns an empty array when nothing has been copied', async () => {
      core.store.state.copiedObjects = undefined;

      const result = await engine.getCopiedObjects();

      expect(result).toEqual([]);
    });

    it('getCopiedObjects returns the previously copied objects', async () => {
      const copied: any[] = [{ id: 'x' }];
      core.store.state.copiedObjects = copied;

      const result = await engine.getCopiedObjects();

      expect(result).toBe(copied);
    });
  });

  describe('z-order delegation', () => {
    it('bringForward delegates to core', async () => {
      const obj: any = { id: 'a' };
      await engine.bringForward(obj);
      expect(core.bringForward).toHaveBeenCalledWith(obj);
    });

    it('sendBackward delegates to core', async () => {
      const obj: any = { id: 'a' };
      await engine.sendBackward(obj);
      expect(core.sendBackward).toHaveBeenCalledWith(obj);
    });

    it('bringToFront delegates to core', async () => {
      const obj: any = { id: 'a' };
      await engine.bringToFront(obj);
      expect(core.bringToFront).toHaveBeenCalledWith(obj);
    });

    it('sendToBack delegates to core', async () => {
      const obj: any = { id: 'a' };
      await engine.sendToBack(obj);
      expect(core.sendToBack).toHaveBeenCalledWith(obj);
    });

    it('alignObjects forwards the alignment to core', async () => {
      await engine.alignObjects(KritzelAlignment.CenterHorizontal);
      expect(core.alignObjects).toHaveBeenCalledWith(KritzelAlignment.CenterHorizontal);
    });

    it('group delegates to core.group', async () => {
      await engine.group();
      expect(core.group).toHaveBeenCalledTimes(1);
    });

    it('ungroup delegates to core.ungroup', async () => {
      await engine.ungroup();
      expect(core.ungroup).toHaveBeenCalledTimes(1);
    });
  });

  describe('history delegation', () => {
    it('undo delegates to core.undo', async () => {
      await engine.undo();
      expect(core.undo).toHaveBeenCalledTimes(1);
    });

    it('redo delegates to core.redo', async () => {
      await engine.redo();
      expect(core.redo).toHaveBeenCalledTimes(1);
    });
  });

  describe('enable / disable', () => {
    it('disable flips the engine into a disabled state and rerenders', async () => {
      await engine.disable();

      expect(core.store.state.isEnabled).toBe(false);
      expect(core.rerender).toHaveBeenCalledTimes(1);
    });

    it('enable flips the engine back into an enabled state and rerenders', async () => {
      core.store.state.isEnabled = false;

      await engine.enable();

      expect(core.store.state.isEnabled).toBe(true);
      expect(core.rerender).toHaveBeenCalledTimes(1);
    });
  });

  describe('hideContextMenu', () => {
    it('resets transient context-menu state and rerenders', async () => {
      core.store.state.isContextMenuVisible = true;
      core.store.state.isSelecting = true;
      core.store.state.isEnabled = false;
      core.store.state.pointers.set(1, {} as any);

      await engine.hideContextMenu();

      expect(core.store.state.isContextMenuVisible).toBe(false);
      expect(core.store.state.isSelecting).toBe(false);
      expect(core.store.state.isEnabled).toBe(true);
      expect(core.store.state.pointers.size).toBe(0);
      expect(core.store.objects.remove).toHaveBeenCalled();
      expect(core.store.setSelectionBox).toHaveBeenCalledWith(null);
      expect(core.store.objects.clearLocalSelectionBox).toHaveBeenCalled();
      expect(core.rerender).toHaveBeenCalled();
    });
  });

  describe('object queries', () => {
    it('getObjectById returns a matching object from the store', async () => {
      const target: any = { id: 'find-me' };
      core.store.allObjects = [{ id: 'other' }, target];

      const result = await engine.getObjectById('find-me');

      expect(result).toBe(target);
    });

    it('getObjectById returns null when no match exists', async () => {
      core.store.allObjects = [{ id: 'other' }];

      const result = await engine.getObjectById('missing');

      expect(result).toBeNull();
    });

    it('getAllObjects returns the full object list from the store', async () => {
      const objects: any[] = [{ id: 'a' }, { id: 'b' }];
      core.store.allObjects = objects;

      const result = await engine.getAllObjects();

      expect(result).toBe(objects);
    });

    it('findObjects filters non-selection objects by the predicate', async () => {
      const a: any = { id: 'a', __class__: 'KritzelText' };
      const b: any = { id: 'b', __class__: 'KritzelPath' };
      core.store.allNonSelectionObjects = [a, b];

      const result = await engine.findObjects(o => (o as any).__class__ === 'KritzelText');

      expect(result).toEqual([a]);
    });

    it('getObjectsTotalCount reports the store total', async () => {
      core.store.totalObjectCount = 7;

      const result = await engine.getObjectsTotalCount();

      expect(result).toBe(7);
    });

    it('getObjectsInViewport delegates to core', async () => {
      const objects: any[] = [{ id: 'visible' }];
      core.getObjectsInViewport.mockReturnValue(objects);

      const result = await engine.getObjectsInViewport();

      expect(result).toBe(objects);
      expect(core.getObjectsInViewport).toHaveBeenCalledTimes(1);
    });
  });

  describe('viewport delegation', () => {
    it('setViewport forwards to viewport.setViewport', async () => {
      await engine.setViewport(10, 20, 2);
      expect(engine.viewport.setViewport).toHaveBeenCalledWith(10, 20, 2);
    });

    it('panTo forwards to viewport.panTo', async () => {
      await engine.panTo(5, 6);
      expect(engine.viewport.panTo).toHaveBeenCalledWith(5, 6);
    });

    it('zoomTo forwards to viewport.zoomTo', async () => {
      await engine.zoomTo(1.5, 100, 200);
      expect(engine.viewport.zoomTo).toHaveBeenCalledWith(1.5, 100, 200);
    });

    it('getViewport returns the viewport state', async () => {
      const result = await engine.getViewport();

      expect(result).toEqual(
        expect.objectContaining({ scale: 1, translateX: 0, translateY: 0 }),
      );
    });

    it('screenToWorld forwards to viewport.screenToWorld', async () => {
      await engine.screenToWorld(50, 60);
      expect(engine.viewport.screenToWorld).toHaveBeenCalledWith(50, 60);
    });

    it('worldToScreen forwards to viewport.worldToScreen', async () => {
      await engine.worldToScreen(50, 60);
      expect(engine.viewport.worldToScreen).toHaveBeenCalledWith(50, 60);
    });

    it('backToContent delegates to viewport.centerFitNearestContent', async () => {
      const result = await engine.backToContent();

      expect(engine.viewport.centerFitNearestContent).toHaveBeenCalledWith(20);
      expect(result).toBe(true);
    });

    it('centerAllObjects delegates to viewport.centerFitAllObjects', async () => {
      const result = await engine.centerAllObjects(false);

      expect(engine.viewport.centerFitAllObjects).toHaveBeenCalledWith(false);
      expect(result).toBe(true);
    });
  });

  describe('workspace management', () => {
    it('createWorkspace delegates to core and emits workspacesChange', async () => {
      const workspace = { id: 'w1', name: 'Test' } as KritzelWorkspace;
      core.store.state.workspaces = [workspace];

      const result = await engine.createWorkspace(workspace);

      expect(core.createWorkspace).toHaveBeenCalledWith(workspace);
      expect((engine as any).workspacesChange.emit).toHaveBeenCalledWith([workspace]);
      expect(result).toBe(workspace);
    });

    it('updateWorkspace delegates to core and emits workspacesChange', async () => {
      const workspace = { id: 'w1', name: 'Updated' } as KritzelWorkspace;
      core.store.state.workspaces = [workspace];

      await engine.updateWorkspace(workspace);

      expect(core.updateWorkspace).toHaveBeenCalledWith(workspace);
      expect((engine as any).workspacesChange.emit).toHaveBeenCalledWith([workspace]);
    });

    it('deleteWorkspace delegates to core and emits workspacesChange', async () => {
      const workspace = { id: 'w1', name: 'Doomed' } as KritzelWorkspace;
      core.store.state.workspaces = [];

      await engine.deleteWorkspace(workspace);

      expect(core.deleteWorkspace).toHaveBeenCalledWith(workspace);
      expect((engine as any).workspacesChange.emit).toHaveBeenCalledWith([]);
    });

    it('getWorkspaces returns the list from core', async () => {
      const workspaces = [{ id: 'w1', name: 'A' }] as KritzelWorkspace[];
      core.getWorkspaces.mockReturnValue(workspaces);

      const result = await engine.getWorkspaces();

      expect(result).toBe(workspaces);
    });

    it('getActiveWorkspace returns the active workspace', async () => {
      const workspace = { id: 'active' } as KritzelWorkspace;
      core.store.state.activeWorkspace = workspace;

      const result = await engine.getActiveWorkspace();

      expect(result).toBe(workspace);
    });

    it('getActiveWorkspace throws when no workspace is loaded', async () => {
      core.store.state.activeWorkspace = null;

      await expect(engine.getActiveWorkspace()).rejects.toThrow(/No active workspace/);
    });

    it('getIsPublic delegates to core.getIsPublic', async () => {
      core.getIsPublic.mockReturnValue(true);

      const result = await engine.getIsPublic();

      expect(result).toBe(true);
      expect(core.getIsPublic).toHaveBeenCalledTimes(1);
    });
  });

  describe('event emission helpers', () => {
    it('emitObjectsAdded emits with the provided objects', () => {
      const objects: any[] = [{ id: 'a' }];
      engine.emitObjectsAdded(objects);

      expect((engine as any).objectsAdded.emit).toHaveBeenCalledWith({ objects });
    });

    it('emitObjectsRemoved emits with the provided objects', () => {
      const objects: any[] = [{ id: 'a' }];
      engine.emitObjectsRemoved(objects);

      expect((engine as any).objectsRemoved.emit).toHaveBeenCalledWith({ objects });
    });

    it('emitObjectsUpdated emits with the provided change descriptors', () => {
      const objects = [{ object: { id: 'a' } as any, changedProperties: ['x'] }];
      engine.emitObjectsUpdated(objects);

      expect((engine as any).objectsUpdated.emit).toHaveBeenCalledWith({ objects });
    });

    it('emitAwarenessChange emits the awareness state map', () => {
      const states = new Map<number, Record<string, any>>([[1, { user: { id: 'u1' } }]]);
      engine.emitAwarenessChange(states);

      expect((engine as any).awarenessChange.emit).toHaveBeenCalledWith(states);
    });

    it('emitObjectsInViewportChange forwards the visible objects from the store', () => {
      const visible: any[] = [{ id: 'visible' }];
      core.store.objectsInViewport = visible;

      engine.emitObjectsInViewportChange();

      expect((engine as any).objectsInViewportChange.emit).toHaveBeenCalledWith(visible);
    });

    it('emitObjectsChange emits empty arrays when no objects map exists', () => {
      core.store.objects = null;

      engine.emitObjectsChange();

      expect((engine as any).objectsChange.emit).toHaveBeenCalledWith([]);
      expect((engine as any).undoStateChange.emit).toHaveBeenCalledWith(
        expect.objectContaining({ canUndo: false, canRedo: false }),
      );
    });

    it('emitObjectsChange emits the live object list and undo state', () => {
      const objects: any[] = [{ id: 'a' }];
      core.store.allObjects = objects;
      core.store.objects.undoState = { canUndo: true, canRedo: false, undoStackSize: 1, redoStackSize: 0 };

      engine.emitObjectsChange();

      expect((engine as any).objectsChange.emit).toHaveBeenCalledWith(objects);
      expect((engine as any).undoStateChange.emit).toHaveBeenCalledWith(
        expect.objectContaining({ canUndo: true, undoStackSize: 1 }),
      );
    });
  });

  describe('importFromJson validation', () => {
    it('throws when the data is not a workspace export', async () => {
      const invalid = JSON.stringify({ foo: 'bar' });

      await expect(engine.importFromJson(invalid)).rejects.toThrow(
        /Invalid workspace data/,
      );
    });
  });

  describe('loadObjectsFromJson validation', () => {
    it('throws when no workspace is currently loaded', async () => {
      core.store.state.activeWorkspace = null;
      const json = JSON.stringify({ __class__: 'KritzelWorkspace', objects: [] });

      await expect(engine.loadObjectsFromJson(json)).rejects.toThrow(
        /no active workspace/,
      );
    });

    it('throws when the JSON is not a workspace export', async () => {
      core.store.state.activeWorkspace = { id: 'w1' } as KritzelWorkspace;
      const invalid = JSON.stringify({ foo: 'bar' });

      await expect(engine.loadObjectsFromJson(invalid)).rejects.toThrow(
        /Invalid workspace data/,
      );
    });

    it('returns 0 when the export contains no objects array', async () => {
      core.store.state.activeWorkspace = { id: 'w1' } as KritzelWorkspace;
      const json = JSON.stringify({ __class__: 'KritzelWorkspace' });

      const result = await engine.loadObjectsFromJson(json);

      expect(result).toBe(0);
    });
  });

  describe('exportAsJson', () => {
    it('throws when no workspace is loaded', async () => {
      core.store.state.activeWorkspace = null;

      await expect(engine.exportAsJson()).rejects.toThrow(/no active workspace/);
    });

    it('serializes the active workspace including its objects', async () => {
      const serialized = { __class__: 'KritzelWorkspace', id: 'w1', objects: [] };
      core.store.state.activeWorkspace = {
        serialize: jest.fn().mockReturnValue(serialized),
      } as unknown as KritzelWorkspace;

      const json = await engine.exportAsJson();

      expect(JSON.parse(json)).toEqual(serialized);
      expect((core.store.state.activeWorkspace as any).serialize).toHaveBeenCalledWith({ includeObjects: true });
    });
  });

  describe('selecting state getters', () => {
    it('isSelecting is false when the active tool is not the selection tool', () => {
      core.store.state.activeTool = {} as any;
      core.store.state.isSelecting = true;

      expect(engine.isSelecting).toBe(false);
    });

    it('isSelectionActive is false when there is no selection group', () => {
      core.store.selectionGroup = null;

      expect(engine.isSelectionActive).toBe(false);
    });
  });

  describe('_handleActiveToolChange', () => {
    /** Invokes the private state-change handler that runs whenever activeTool changes. */
    const invokeHandler = (activeTool: any) => (engine as any)._handleActiveToolChange(activeTool);

    it('clears selection state when switching to a non-selection tool', () => {
      core.store.state.isSelecting = true;
      core.store.state.isResizeHandleSelected = true;
      core.store.state.isRotationHandleSelected = true;

      const eraserTool = new MockKritzelEraserTool();
      invokeHandler(eraserTool);

      expect(core.clearSelection).toHaveBeenCalledTimes(1);
      expect(core.store.objects.remove).toHaveBeenCalled();
      expect(core.store.setSelectionBox).toHaveBeenCalledWith(null);
      expect(core.store.objects.clearLocalSelectionBox).toHaveBeenCalled();
      expect(core.store.state.isSelecting).toBe(false);
      expect(core.store.state.isResizeHandleSelected).toBe(false);
      expect(core.store.state.isRotationHandleSelected).toBe(false);
    });

    it('preserves selection state when switching to the selection tool', () => {
      core.store.state.isSelecting = true;

      const selectionTool = new MockKritzelSelectionTool();
      invokeHandler(selectionTool);

      expect(core.clearSelection).not.toHaveBeenCalled();
      expect(core.store.setSelectionBox).not.toHaveBeenCalled();
      expect(core.store.state.isSelecting).toBe(true);
    });

    it('resets active text when switching to a non-text tool', () => {
      const eraserTool = new MockKritzelEraserTool();
      invokeHandler(eraserTool);

      expect(core.resetActiveText).toHaveBeenCalledTimes(1);
    });

    it('does not reset active text when switching to the text tool', () => {
      const textTool = new MockKritzelTextTool();
      invokeHandler(textTool);

      expect(core.resetActiveText).not.toHaveBeenCalled();
    });

    it('resets active shape when switching to a non-shape tool', () => {
      const eraserTool = new MockKritzelEraserTool();
      invokeHandler(eraserTool);

      expect(core.resetActiveShape).toHaveBeenCalledTimes(1);
    });

    it('does not reset active shape when switching to the shape tool', () => {
      const shapeTool = new MockKritzelShapeTool();
      invokeHandler(shapeTool);

      expect(core.resetActiveShape).not.toHaveBeenCalled();
    });

    it('resets transient flags and rerenders', () => {
      core.store.state.skipContextMenu = true;
      core.store.state.copiedObjects = [{ id: 'x' }];

      const eraserTool = new MockKritzelEraserTool();
      invokeHandler(eraserTool);

      expect(core.store.state.skipContextMenu).toBe(false);
      expect(core.store.state.copiedObjects).toBeUndefined();
      expect(core.rerender).toHaveBeenCalledTimes(1);
    });

    it('emits activeToolChange when a tool is provided', () => {
      const eraserTool = new MockKritzelEraserTool();
      invokeHandler(eraserTool);

      expect((engine as any).activeToolChange.emit).toHaveBeenCalledWith(eraserTool);
    });

    it('does not emit activeToolChange when the new tool is null', () => {
      invokeHandler(null);

      expect((engine as any).activeToolChange.emit).not.toHaveBeenCalled();
    });
  });

  describe('registerTool', () => {
    it('returns null and logs error when toolClass is not a function', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();

      const result = await engine.registerTool('brush', 'not-a-function', undefined);

      expect(result).toBeNull();
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('Tool class must be a constructor function'),
      );
      spy.mockRestore();
    });

    it('returns null and logs error when toolClass is an object instance', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();

      const result = await engine.registerTool('brush', { name: 'brush' }, undefined);

      expect(result).toBeNull();
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('Tool class must be a constructor function'),
      );
      spy.mockRestore();
    });

    it('returns existing tool instance when tool with same name is already registered', async () => {
      const existingTool = { name: 'selection', color: 'red' };
      (core.toolRegistry.hasTool as jest.Mock).mockReturnValue(true);
      (core.toolRegistry.getTool as jest.Mock).mockReturnValue(existingTool);

      class FakeSelectionTool {}
      const result = await engine.registerTool('selection', FakeSelectionTool, undefined);

      expect(result).toBe(existingTool);
      expect(core.toolRegistry.registerTool).not.toHaveBeenCalled();
    });

    it('applies toolConfig to existing tool instance', async () => {
      const existingTool: any = { name: 'brush', color: 'red', size: 5 };
      (core.toolRegistry.hasTool as jest.Mock).mockReturnValue(true);
      (core.toolRegistry.getTool as jest.Mock).mockReturnValue(existingTool);

      class FakeBrushTool {}
      const config = { color: 'blue', size: 10 } as any;
      const result = await engine.registerTool('brush', FakeBrushTool, config);

      expect(result).toBe(existingTool);
      expect(existingTool.color).toBe('blue');
      expect(existingTool.size).toBe(10);
    });

    it('does not apply config to existing tool when config is undefined', async () => {
      const existingTool: any = { name: 'eraser', size: 8 };
      (core.toolRegistry.hasTool as jest.Mock).mockReturnValue(true);
      (core.toolRegistry.getTool as jest.Mock).mockReturnValue(existingTool);

      class FakeEraserTool {}
      await engine.registerTool('eraser', FakeEraserTool, undefined);

      expect(existingTool.size).toBe(8);
    });

    it('registers a new tool when no tool with that name exists', async () => {
      const newTool = { name: 'line' };
      (core.toolRegistry.hasTool as jest.Mock).mockReturnValue(false);
      (core.toolRegistry.registerTool as jest.Mock).mockReturnValue(newTool);

      class FakeLineTool {}
      const result = await engine.registerTool('line', FakeLineTool, undefined);

      expect(core.toolRegistry.hasTool).toHaveBeenCalledWith('line');
      expect(core.toolRegistry.registerTool).toHaveBeenCalledWith('line', FakeLineTool);
      expect(result).toBe(newTool);
    });

    it('applies toolConfig to a newly registered tool', async () => {
      const newTool: any = { name: 'shape' };
      (core.toolRegistry.hasTool as jest.Mock).mockReturnValue(false);
      (core.toolRegistry.registerTool as jest.Mock).mockReturnValue(newTool);

      class FakeShapeTool {}
      const config = { shapeType: 'rectangle', fillColor: '#000' } as any;
      await engine.registerTool('shape', FakeShapeTool, config);

      expect(newTool.shapeType).toBe('rectangle');
      expect(newTool.fillColor).toBe('#000');
    });
  });
});
