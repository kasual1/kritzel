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

class MockKritzelSelectionTool {
  toolType = 'selection';
}
class MockKritzelTextTool {
  toolType = 'text';
}
class MockKritzelShapeTool {
  toolType = 'shape';
}
class MockKritzelEraserTool {
  toolType = 'eraser';
}
class MockKritzelBrushTool {
  toolType = 'brush';
}
class MockKritzelLineTool {
  toolType = 'line';
}
class MockKritzelImageTool {
  toolType = 'image';
}
class MockKritzelBaseTool {}
class MockKritzelSelectionBox {}
class MockKritzelSelectionGroup {}
class MockKritzelGroup {}

jest.mock('../../../classes/tools/selection-tool.class', () => ({ KritzelSelectionTool: MockKritzelSelectionTool }));
jest.mock('../../../classes/tools/text-tool.class', () => ({ KritzelTextTool: MockKritzelTextTool }));
jest.mock('../../../classes/tools/shape-tool.class', () => ({ KritzelShapeTool: MockKritzelShapeTool }));
jest.mock('../../../classes/tools/eraser-tool.class', () => ({ KritzelEraserTool: MockKritzelEraserTool }));
jest.mock('../../../classes/tools/brush-tool.class', () => ({ KritzelBrushTool: MockKritzelBrushTool }));
jest.mock('../../../classes/tools/line-tool.class', () => ({ KritzelLineTool: MockKritzelLineTool }));
jest.mock('../../../classes/tools/image-tool.class', () => ({ KritzelImageTool: MockKritzelImageTool }));
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

jest.mock('../../../helpers/class.helper', () => ({
  KritzelClassHelper: {
    isInstanceOf: jest.fn().mockReturnValue(false),
  },
}));

import { KritzelEngine } from './kritzel-engine';
import { KritzelAlignment } from '../../../enums/alignment.enum';
import { KritzelWorkspace } from '../../../classes/core/workspace.class';
import { KritzelBaseObject } from '../../../classes/objects/base-object.class';
import { KritzelClassHelper } from '../../../helpers/class.helper';
import { DEFAULT_TEXT_TOOL_AVAILABLE_FONTS } from '../../../constants/text-tool-fonts.constants';

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
    getObjectFromPointerEvent: jest.fn().mockReturnValue(null),
    beforeWorkspaceChange: jest.fn(),
    initializeWorkspace: jest.fn().mockResolvedValue(undefined),
    initializeAssetStorage: jest.fn().mockResolvedValue(undefined),
    setActiveWorkspace: jest.fn().mockResolvedValue(undefined),
    createWorkspace: jest.fn().mockImplementation(async (ws) => ws),
    updateWorkspace: jest.fn().mockResolvedValue(undefined),
    deleteWorkspace: jest.fn().mockResolvedValue(undefined),
    getWorkspaces: jest.fn().mockReturnValue([]),
    getIsPublic: jest.fn().mockReturnValue(false),
    getObjectsInViewport: jest.fn().mockReturnValue([]),
    clipboardManager: {
      copy: jest.fn(),
      cut: jest.fn(),
      paste: jest.fn(),
    },
    permissionManager: {
      requestPermission: jest.fn().mockResolvedValue('granted'),
    },
    appStateMap: {
      destroy: jest.fn(),
      hasNetworkSyncProvider: false,
      whenNetworkSynced: jest.fn().mockResolvedValue(undefined),
    },
    cursorManager: {
      setTargetElement: jest.fn(),
      cleanup: jest.fn(),
    },
    themeManager: {
      setTheme: jest.fn(),
      getStoredTheme: jest.fn().mockReturnValue('light'),
      cleanup: jest.fn(),
    },
    licenseManager: {
      isLicensed: false,
      validate: jest.fn(),
      startPeriodicValidation: jest.fn(),
      stopPeriodicValidation: jest.fn(),
      destroy: jest.fn(),
    },
    store: {
      isDisabled: false,
      currentZIndex: 0,
      totalObjectCount: 0,
      allObjects: [] as any[],
      allNonSelectionObjects: [] as any[],
      objectsInViewport: [] as any[],
      selectionGroup: null as any,
      activeText: null as any,
      activeShape: null as any,
      objects: {
        remove: jest.fn(),
        clearLocalSelectionBox: jest.fn(),
        clearCursorPosition: jest.fn(),
        findById: jest.fn().mockReturnValue(null),
        destroy: jest.fn(),
        whenNetworkSynced: jest.fn().mockResolvedValue(undefined),
        transaction: jest.fn().mockImplementation((cb: () => void) => cb()),
        undoState: { canUndo: false, canRedo: false, undoStackSize: 0, redoStackSize: 0 },
      },
      state: {
        isEnabled: true,
        isReady: true,
        isLoading: false,
        isContextMenuVisible: false,
        contextMenuItems: [],
        contextMenuX: 0,
        contextMenuY: 0,
        contextMenuWorldX: 0,
        contextMenuWorldY: 0,
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
      },
      setState: jest.fn(),
      setSelectionBox: jest.fn(),
    },
    toolRegistry: {
      getTool: jest.fn(),
      hasTool: jest.fn(),
      registerTool: jest.fn(),
    },
    assetResolver: {
      hasRemoteProvider: false,
      fetchBlob: jest.fn(),
      put: jest.fn().mockResolvedValue({ id: 'asset-1' }),
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
      'notificationsChange',
      'contextMenuStateChange',
      'isLoadingChange',
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
      centerFitObjects: jest.fn().mockReturnValue(true),
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

  describe('license key watcher', () => {
    it('validates the license key when the prop changes after initialization', () => {
      engine.onLicenseKeyChange('new-license-key');

      expect(core.licenseManager.validate).toHaveBeenCalledWith('new-license-key');
    });

    it('treats clearing the license key as an unlicensed re-validation', () => {
      engine.onLicenseKeyChange(undefined);

      expect(core.licenseManager.validate).toHaveBeenCalledWith(undefined);
    });
  });

  describe('workspace syncing state', () => {
    it('uses provided workspaces as the visible catalog when controlled', async () => {
      const workspace = new KritzelWorkspace({ id: 'workspace-1', name: 'Workspace 1' });
      const providerOnlyWorkspace = new KritzelWorkspace({ id: 'provider-only', name: 'Provider Only' });
      engine.workspaces = [workspace];
      core.getWorkspaces.mockReturnValue([workspace, providerOnlyWorkspace]);

      await expect(engine.getWorkspaces()).resolves.toEqual([workspace]);
    });

    it('creates provided workspaces that are missing from provider state', async () => {
      const workspace = new KritzelWorkspace({ id: 'workspace-1', name: 'Workspace 1' });
      engine.workspaces = [workspace];
      core.getWorkspaces.mockReturnValue([]);

      await (engine as any).reconcileProvidedWorkspaces();

      expect(core.createWorkspace).toHaveBeenCalledWith(workspace);
    });

    it('updates provider metadata when a provided workspace differs', async () => {
      const existingWorkspace = new KritzelWorkspace({ id: 'workspace-1', name: 'Old Name' });
      const providedWorkspace = new KritzelWorkspace({ id: 'workspace-1', name: 'New Name' });
      providedWorkspace.objects = [{ id: 'seed-object' }] as KritzelBaseObject<any>[];
      engine.workspaces = [providedWorkspace];
      core.getWorkspaces.mockReturnValue([existingWorkspace]);

      await (engine as any).reconcileProvidedWorkspaces();

      expect(core.updateWorkspace).toHaveBeenCalledWith(
        expect.objectContaining({
          id: providedWorkspace.id,
          name: providedWorkspace.name,
          objects: undefined,
        }),
      );
    });

    it('prefers activeWorkspaceId over the first provided workspace during startup', async () => {
      const firstWorkspace = new KritzelWorkspace({ id: 'first-workspace', name: 'First Workspace' });
      const activeWorkspace = new KritzelWorkspace({ id: 'active-workspace', name: 'Active Workspace' });
      engine.workspaces = [firstWorkspace, activeWorkspace];
      engine.activeWorkspaceId = activeWorkspace.id;
      core.getWorkspaces.mockReturnValue([firstWorkspace, activeWorkspace]);

      await (engine as any).initializeStartupWorkspace();

      expect(core.initializeWorkspace).toHaveBeenCalledWith(activeWorkspace, undefined);
    });

    it('does not create a fallback workspace for an empty controlled catalog', async () => {
      engine.workspaces = [];

      await (engine as any).initializeStartupWorkspace();

      expect(core.initializeWorkspace).toHaveBeenCalledWith(undefined, { skipFallbackCreation: true });
    });

    it('rejects active workspace ids outside the controlled catalog', async () => {
      const visibleWorkspace = new KritzelWorkspace({ id: 'visible-workspace', name: 'Visible Workspace' });
      const hiddenWorkspace = new KritzelWorkspace({ id: 'hidden-workspace', name: 'Hidden Workspace' });
      engine.workspaces = [visibleWorkspace];
      core.getWorkspaces.mockReturnValue([visibleWorkspace, hiddenWorkspace]);
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      await engine.setActiveWorkspace(hiddenWorkspace.id);

      expect(core.initializeWorkspace).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(`[KritzelEngine] No workspace found with ID: ${hiddenWorkspace.id}`);

      warnSpy.mockRestore();
    });

  });

  describe('remote app state startup', () => {
    const withNavigatorOnline = async (isOnline: boolean, run: () => Promise<void>): Promise<void> => {
      const navigatorDescriptor = Object.getOwnPropertyDescriptor(global, 'navigator');
      Object.defineProperty(global, 'navigator', { configurable: true, value: { onLine: isOnline } });

      try {
        await run();
      } finally {
        if (navigatorDescriptor) {
          Object.defineProperty(global, 'navigator', navigatorDescriptor);
        } else {
          delete (global as { navigator?: unknown }).navigator;
        }
      }
    };

    it('waits for the remote workspace list before resolving a startup workspace on a cold start', async () => {
      let resolveNetworkSync!: () => void;
      const networkSyncPromise = new Promise<void>(resolve => {
        resolveNetworkSync = resolve;
      });
      const remoteWorkspace = new KritzelWorkspace({ id: 'remote-workspace', name: 'Remote' });

      core.appStateMap.hasNetworkSyncProvider = true;
      core.appStateMap.whenNetworkSynced.mockReturnValue(networkSyncPromise);
      core.getWorkspaces.mockReturnValue([]);

      await withNavigatorOnline(true, async () => {
        const waitPromise = (engine as any).waitForRemoteAppStateIfEmpty();

        await Promise.resolve();
        expect(core.initializeWorkspace).not.toHaveBeenCalled();

        core.getWorkspaces.mockReturnValue([remoteWorkspace]);
        resolveNetworkSync();
        await waitPromise;

        expect((engine as any).core.getWorkspaces()).toEqual([remoteWorkspace]);
      });
    });

    it('does not wait when workspaces are already available locally', async () => {
      core.appStateMap.hasNetworkSyncProvider = true;
      core.getWorkspaces.mockReturnValue([
        new KritzelWorkspace({ id: 'cached-workspace', name: 'Cached' }),
      ]);

      await withNavigatorOnline(true, async () => {
        await (engine as any).waitForRemoteAppStateIfEmpty();
      });

      expect(core.appStateMap.whenNetworkSynced).not.toHaveBeenCalled();
    });

    it('does not wait when no network sync provider is configured', async () => {
      core.appStateMap.hasNetworkSyncProvider = false;
      core.getWorkspaces.mockReturnValue([]);

      await withNavigatorOnline(true, async () => {
        await (engine as any).waitForRemoteAppStateIfEmpty();
      });

      expect(core.appStateMap.whenNetworkSynced).not.toHaveBeenCalled();
    });

    it('does not wait while the browser is offline', async () => {
      core.appStateMap.hasNetworkSyncProvider = true;
      core.getWorkspaces.mockReturnValue([]);

      await withNavigatorOnline(false, async () => {
        await (engine as any).waitForRemoteAppStateIfEmpty();
      });

      expect(core.appStateMap.whenNetworkSynced).not.toHaveBeenCalled();
    });
  });

  describe('loading lifecycle', () => {
    it('does not emit loading while waiting for the workspace list', async () => {
      let resolveNetworkSync!: () => void;
      const networkSyncPromise = new Promise<void>(resolve => {
        resolveNetworkSync = resolve;
      });

      core.appStateMap.hasNetworkSyncProvider = true;
      core.appStateMap.whenNetworkSynced.mockReturnValue(networkSyncPromise);
      core.getWorkspaces.mockReturnValue([]);

      const waitPromise = (engine as any).waitForRemoteAppStateIfEmpty();

      await Promise.resolve();
      expect((engine as any).isLoadingChange.emit).not.toHaveBeenCalled();

      resolveNetworkSync();
      await waitPromise;

      expect((engine as any).isLoadingChange.emit).not.toHaveBeenCalled();
    });

    it('emits loading until the selected workspace object map is synchronized', async () => {
      let resolveObjectSync!: () => void;
      const objectSyncPromise = new Promise<void>(resolve => {
        resolveObjectSync = resolve;
      });
      core.store.objects.whenNetworkSynced.mockReturnValue(objectSyncPromise);

      const initializationPromise = (engine as any).initializeWorkspaceIfNeeded(new KritzelWorkspace({ id: 'workspace-1', name: 'Workspace 1' }));

      await Promise.resolve();
      expect((engine as any).isLoadingChange.emit).toHaveBeenCalledWith(true);
      expect((engine as any).isLoadingChange.emit).toHaveBeenCalledTimes(1);
      expect(core.store.objects.whenNetworkSynced).toHaveBeenCalledTimes(1);

      resolveObjectSync();
      await initializationPromise;

      expect((engine as any).isLoadingChange.emit).toHaveBeenLastCalledWith(false);
      expect((engine as any).isLoadingChange.emit).toHaveBeenCalledTimes(2);
    });

    it('does not let a stale workspace initialization clear loading for a newer workspace', async () => {
      let resolveInitializationA!: () => void;
      let resolveInitializationB!: () => void;
      let resolveObjectSyncA!: () => void;
      let resolveObjectSyncB!: () => void;
      const objectMapA = {
        whenNetworkSynced: jest.fn(() => new Promise<void>(resolve => {
          resolveObjectSyncA = resolve;
        })),
      };
      const objectMapB = {
        whenNetworkSynced: jest.fn(() => new Promise<void>(resolve => {
          resolveObjectSyncB = resolve;
        })),
      };

      core.initializeWorkspace
        .mockImplementationOnce(() => {
          core.store.objects = objectMapA;
          return new Promise<void>(resolve => {
            resolveInitializationA = resolve;
          });
        })
        .mockImplementationOnce(() => {
          core.store.objects = objectMapB;
          return new Promise<void>(resolve => {
            resolveInitializationB = resolve;
          });
        });

      const initializationA = (engine as any).initializeWorkspaceIfNeeded(new KritzelWorkspace({ id: 'workspace-a', name: 'Workspace A' }));
      const initializationB = (engine as any).initializeWorkspaceIfNeeded(new KritzelWorkspace({ id: 'workspace-b', name: 'Workspace B' }));

      resolveInitializationA();
      await Promise.resolve();
      resolveObjectSyncA();
      await Promise.resolve();

      expect((engine as any).isLoadingChange.emit).toHaveBeenCalledTimes(1);
      expect((engine as any).isLoadingChange.emit).toHaveBeenLastCalledWith(true);

      resolveInitializationB();
  await Promise.resolve();
      resolveObjectSyncB();
      await Promise.all([initializationA, initializationB]);

      expect((engine as any).isLoadingChange.emit).toHaveBeenLastCalledWith(false);
      expect((engine as any).isLoadingChange.emit).toHaveBeenCalledTimes(2);
    });
  });

  describe('context menu item watchers', () => {
    it('updates handler global items when globalContextMenuItems changes', () => {
      const globalItems = [{ label: 'Paste' }] as any;
      (engine as any).contextMenuHandler = { globalContextMenuItems: [] };

      engine.onGlobalContextMenuItemsChange(globalItems);

      expect((engine as any).contextMenuHandler.globalContextMenuItems).toBe(globalItems);
    });

    it('updates handler object items when objectContextMenuItems changes', () => {
      const objectItems = [{ label: 'Copy' }] as any;
      (engine as any).contextMenuHandler = { objectContextMenuItems: [] };

      engine.onObjectContextMenuItemsChange(objectItems);

      expect((engine as any).contextMenuHandler.objectContextMenuItems).toBe(objectItems);
    });
  });

  describe('selection delegation', () => {
    it('triggerSelectionChange emits the current selection and synchronizes transition tracking', async () => {
      const selectedObjects = [{ id: 'selected-object' }];
      core.store.selectedObjects = selectedObjects;
      core.store.selectionGroup = { objects: selectedObjects };

      await engine.triggerSelectionChange();
      engine.emitObjectsChange();

      expect((engine as any).objectsSelectionChange.emit).toHaveBeenCalledTimes(1);
      expect((engine as any).objectsSelectionChange.emit).toHaveBeenCalledWith(selectedObjects);
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

    it('getSelectedObjectSupportedExportFormats returns empty when selection is not a single exportable object', async () => {
      core.store.selectionGroup = { objects: [{ id: 'a' }, { id: 'b' }] };

      const formats = await engine.getSelectedObjectSupportedExportFormats();

      expect(formats).toEqual([]);
    });

    it('canExportSelectedObjectAs checks supported formats for a single exportable object', async () => {
      const exportableObject = {
        id: 'a',
        __class__: 'KritzelPath',
        getSupportedExportFormats: () => ['svg'],
        exportAs: jest.fn(),
      } as any;
      core.store.selectionGroup = { objects: [exportableObject] };

      await expect(engine.canExportSelectedObjectAs('svg')).resolves.toBe(true);
      await expect(engine.canExportSelectedObjectAs('png')).resolves.toBe(false);
    });

    it('exportSelectedObject no-ops when object is not exportable', async () => {
      core.store.selectionGroup = { objects: [{ id: 'a', __class__: 'KritzelText' }] };
      const createElementSpy = jest.spyOn(document, 'createElement');

      await engine.exportSelectedObject('png');

      expect(createElementSpy).not.toHaveBeenCalled();
      createElementSpy.mockRestore();
    });

    it('exportSelectedObject downloads exported data URL for single exportable object', async () => {
      const exportAs = jest.fn().mockResolvedValue('data:image/png;base64,abc');
      const exportableObject = {
        id: 'a',
        __class__: 'KritzelImage',
        getSupportedExportFormats: () => ['png'],
        exportAs,
      } as any;
      core.store.selectionGroup = { objects: [exportableObject] };
      core.store.state.activeWorkspace = { name: 'Test Workspace' } as any;

      const click = jest.fn();
      const anchor = { click } as any;
      const originalCreateElement = document.createElement.bind(document);
      const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
        if (tagName.toLowerCase() === 'a') {
          return anchor;
        }
        return originalCreateElement(tagName);
      }) as any);

      await engine.exportSelectedObject('png');

      expect(exportAs).toHaveBeenCalledTimes(1);
      expect(click).toHaveBeenCalledTimes(1);
      expect(anchor.href).toBe('data:image/png;base64,abc');
      expect(anchor.download).toMatch(/^Test Workspace-image-.*\.png$/);
      createElementSpy.mockRestore();
    });
  });

  describe('clipboard / object lifecycle delegation', () => {
    it('delete delegates to core.delete', async () => {
      await engine.delete();
      expect(core.delete).toHaveBeenCalledTimes(1);
    });

    it('copy delegates to core.clipboardManager.copy', async () => {
      await engine.copy();
      expect(core.clipboardManager.copy).toHaveBeenCalledTimes(1);
    });

    it('cut delegates to core.clipboardManager.cut', async () => {
      await engine.cut();
      expect(core.clipboardManager.cut).toHaveBeenCalledTimes(1);
    });

    it('paste forwards coordinates to core.clipboardManager.paste', async () => {
      await engine.paste(42, 99);
      expect(core.permissionManager.requestPermission).toHaveBeenCalledWith('clipboard-read');
      expect(core.clipboardManager.paste).toHaveBeenCalledWith(42, 99);
    });

    it('paste does not emit a notification when clipboard permission is granted', async () => {
      await engine.paste(42, 99);

      expect(core.permissionManager.requestPermission).toHaveBeenCalledWith('clipboard-read');
      expect(core.clipboardManager.paste).toHaveBeenCalledWith(42, 99);
      expect((engine as any).notificationsChange.emit).not.toHaveBeenCalled();
    });

    it('paste emits notification and aborts when clipboard permission is denied', async () => {
      (core.permissionManager.requestPermission as jest.Mock).mockResolvedValueOnce('denied');

      await engine.paste(42, 99);

      expect(core.permissionManager.requestPermission).toHaveBeenCalledWith('clipboard-read');
      expect(core.clipboardManager.paste).not.toHaveBeenCalled();
      expect((engine as any).notificationsChange.emit).toHaveBeenCalledTimes(1);
      expect((engine as any).notificationsChange.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'Clipboard read permission is required to paste content. Please grant permission and try again.',
        }),
      );
    });

    it('paste emits notification for any non-granted permission state', async () => {
      (core.permissionManager.requestPermission as jest.Mock).mockResolvedValueOnce('prompt');

      await engine.paste(42, 99);

      expect(core.clipboardManager.paste).not.toHaveBeenCalled();
      expect((engine as any).notificationsChange.emit).toHaveBeenCalledTimes(1);
      expect((engine as any).notificationsChange.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'Clipboard read permission is required to paste content. Please grant permission and try again.',
        }),
      );
    });
  });

  describe('embedded dynamic object interaction', () => {
    const setupInteractiveDynamicObjectEvent = (target: HTMLElement) => {
      const objectElement = document.createElement('div');
      objectElement.id = 'custom-1';
      objectElement.classList.add('object');

      const embeddedRoot = document.createElement('div');
      embeddedRoot.appendChild(target);

      const dynamicObjectObject = {
        id: 'custom-1',
        isInteractive: true,
        element: embeddedRoot,
      } as any;

      (core.store.objects.findById as jest.Mock).mockReturnValue(dynamicObjectObject);
      core.store.selectionGroup = { objects: [dynamicObjectObject] };
      (KritzelClassHelper.isInstanceOf as unknown as jest.Mock).mockImplementation((obj: unknown, className: string) => {
        return obj === dynamicObjectObject && className === 'KritzelDynamicObject';
      });

      const event = {
        pointerId: 11,
        composedPath: jest.fn().mockReturnValue([target, embeddedRoot, objectElement]),
      } as unknown as PointerEvent;

      return { event, dynamicObjectObject };
    };

    it('keeps default pointer handling for unselected interactive dynamic objects', () => {
      const objectElement = document.createElement('div');
      objectElement.id = 'custom-2';
      objectElement.classList.add('object');

      const nonSelectedDynamicObject = { id: 'custom-2', isInteractive: true } as any;
      const differentSelectedDynamicObject = { id: 'custom-1', isInteractive: true } as any;
      (core.store.objects.findById as jest.Mock).mockReturnValue(nonSelectedDynamicObject);
      core.store.selectionGroup = { objects: [differentSelectedDynamicObject] };
      (KritzelClassHelper.isInstanceOf as unknown as jest.Mock).mockImplementation((obj: unknown, className: string) => {
        return (obj === nonSelectedDynamicObject || obj === differentSelectedDynamicObject) && className === 'KritzelDynamicObject';
      });

      const activeTool = { handlePointerDown: jest.fn() };
      core.store.state.activeTool = activeTool;

      const setPointerCapture = jest.fn();
      (engine.host as any).setPointerCapture = setPointerCapture;

      const event = {
        pointerId: 8,
        composedPath: jest.fn().mockReturnValue([document.createElement('div'), objectElement]),
      } as unknown as PointerEvent;

      engine.handlePointerDown(event);

      expect(setPointerCapture).toHaveBeenCalledWith(8);
      expect(core.store.state.pointers.has(8)).toBe(true);
      expect((engine.viewport as any).handlePointerDown).toHaveBeenCalledWith(event);
      expect(activeTool.handlePointerDown).toHaveBeenCalledWith(event);
    });

    it('bypasses canvas pointer handling for native interactive descendants', () => {
      const input = document.createElement('input');
      const { event } = setupInteractiveDynamicObjectEvent(input);

      const activeTool = { handlePointerDown: jest.fn() };
      core.store.state.activeTool = activeTool;

      const setPointerCapture = jest.fn();
      (engine.host as any).setPointerCapture = setPointerCapture;

      engine.handlePointerDown(event);

      expect(setPointerCapture).not.toHaveBeenCalled();
      expect(core.store.state.pointers.has(11)).toBe(false);
      expect((engine.viewport as any).handlePointerDown).not.toHaveBeenCalled();
      expect(activeTool.handlePointerDown).not.toHaveBeenCalled();
    });

    it('keeps default pointer handling for non-interactive descendants', () => {
      const container = document.createElement('div');
      const { event } = setupInteractiveDynamicObjectEvent(container);

      const activeTool = { handlePointerDown: jest.fn() };
      core.store.state.activeTool = activeTool;

      const setPointerCapture = jest.fn();
      (engine.host as any).setPointerCapture = setPointerCapture;

      engine.handlePointerDown(event);

      expect(setPointerCapture).toHaveBeenCalledWith(11);
      expect(core.store.state.pointers.has(11)).toBe(true);
      expect((engine.viewport as any).handlePointerDown).toHaveBeenCalledWith(event);
      expect(activeTool.handlePointerDown).toHaveBeenCalledWith(event);
    });

    it('bypasses canvas pointer handling for contenteditable descendants', () => {
      const editable = document.createElement('div');
      editable.setAttribute('contenteditable', 'true');
      const { event } = setupInteractiveDynamicObjectEvent(editable);

      const activeTool = { handlePointerDown: jest.fn() };
      core.store.state.activeTool = activeTool;

      const setPointerCapture = jest.fn();
      (engine.host as any).setPointerCapture = setPointerCapture;

      engine.handlePointerDown(event);

      expect(setPointerCapture).not.toHaveBeenCalled();
      expect(core.store.state.pointers.has(11)).toBe(false);
      expect((engine.viewport as any).handlePointerDown).not.toHaveBeenCalled();
      expect(activeTool.handlePointerDown).not.toHaveBeenCalled();
    });

    it('bypasses canvas pointer handling for renderer-mounted interactive descendants', () => {
      const objectElement = document.createElement('div');
      objectElement.id = 'custom-3';
      objectElement.classList.add('object');

      const rendererContainer = document.createElement('div');
      const input = document.createElement('input');
      rendererContainer.appendChild(input);

      const dynamicObjectObject = {
        id: 'custom-3',
        isInteractive: true,
        element: document.createElement('div'),
        elementRef: rendererContainer,
      } as any;

      (core.store.objects.findById as jest.Mock).mockReturnValue(dynamicObjectObject);
      core.store.selectionGroup = { objects: [dynamicObjectObject] };
      (KritzelClassHelper.isInstanceOf as unknown as jest.Mock).mockImplementation((obj: unknown, className: string) => {
        return obj === dynamicObjectObject && className === 'KritzelDynamicObject';
      });

      const activeTool = { handlePointerDown: jest.fn() };
      core.store.state.activeTool = activeTool;

      const setPointerCapture = jest.fn();
      (engine.host as any).setPointerCapture = setPointerCapture;

      const event = {
        pointerId: 13,
        composedPath: jest.fn().mockReturnValue([input, rendererContainer, objectElement]),
      } as unknown as PointerEvent;

      engine.handlePointerDown(event);

      expect(setPointerCapture).not.toHaveBeenCalled();
      expect(core.store.state.pointers.has(13)).toBe(false);
      expect((engine.viewport as any).handlePointerDown).not.toHaveBeenCalled();
      expect(activeTool.handlePointerDown).not.toHaveBeenCalled();
    });

    it('bypasses canvas pointer handling for interactive descendants inside shadow DOM', () => {
      const objectElement = document.createElement('div');
      objectElement.id = 'custom-4';
      objectElement.classList.add('object');

      const rendererContainer = document.createElement('div');
      const shadowHost = document.createElement('app-shadow-host');
      const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
      const input = document.createElement('input');
      shadowRoot.appendChild(input);
      rendererContainer.appendChild(shadowHost);

      const dynamicObjectObject = {
        id: 'custom-4',
        isInteractive: true,
        element: document.createElement('div'),
        elementRef: rendererContainer,
      } as any;

      (core.store.objects.findById as jest.Mock).mockReturnValue(dynamicObjectObject);
      core.store.selectionGroup = { objects: [dynamicObjectObject] };
      (KritzelClassHelper.isInstanceOf as unknown as jest.Mock).mockImplementation((obj: unknown, className: string) => {
        return obj === dynamicObjectObject && className === 'KritzelDynamicObject';
      });

      const activeTool = { handlePointerDown: jest.fn() };
      core.store.state.activeTool = activeTool;

      const setPointerCapture = jest.fn();
      (engine.host as any).setPointerCapture = setPointerCapture;

      const event = {
        pointerId: 14,
        composedPath: jest.fn().mockReturnValue([input, shadowRoot, shadowHost, rendererContainer, objectElement]),
      } as unknown as PointerEvent;

      engine.handlePointerDown(event);

      expect(setPointerCapture).not.toHaveBeenCalled();
      expect(core.store.state.pointers.has(14)).toBe(false);
      expect((engine.viewport as any).handlePointerDown).not.toHaveBeenCalled();
      expect(activeTool.handlePointerDown).not.toHaveBeenCalled();
    });
  });

  describe('selection handle capabilities', () => {
    it('allows both handles for a single object when both capabilities are enabled', () => {
      const object = { isResizable: true, isRotatable: true } as unknown as KritzelBaseObject<any>;

      const result = (engine as any).getSelectionHandleCapabilities(object);

      expect(result).toEqual({ canRenderResizeHandles: true, canRenderRotationHandle: true });
    });

    it('hides individual handles for a single object when capability is disabled', () => {
      const object = { isResizable: false, isRotatable: true } as unknown as KritzelBaseObject<any>;

      const result = (engine as any).getSelectionHandleCapabilities(object);

      expect(result).toEqual({ canRenderResizeHandles: false, canRenderRotationHandle: true });
    });

    it('uses restrictive policy for selection groups and hides a handle when any child disables it', () => {
      const selectionGroup = {
        objects: [
          { isResizable: true, isRotatable: true },
          { isResizable: false, isRotatable: true },
        ],
      } as unknown as KritzelBaseObject<any>;

      (KritzelClassHelper.isInstanceOf as unknown as jest.Mock).mockImplementation((obj: unknown, className: string) => {
        return obj === selectionGroup && className === 'KritzelSelectionGroup';
      });

      const result = (engine as any).getSelectionHandleCapabilities(selectionGroup);

      expect(result).toEqual({ canRenderResizeHandles: false, canRenderRotationHandle: true });
    });
  });

  describe('native clipboard events', () => {
    const createCancelableClipboardEvent = (type: 'copy' | 'cut' | 'paste'): ClipboardEvent =>
      new Event(type, { cancelable: true }) as ClipboardEvent;

    it('handles copy via native browser event when selection is active', () => {
      core.store.selectionGroup = { objects: [{}] };
      core.store.activeText = null;
      core.store.activeShape = null;

      const event = createCancelableClipboardEvent('copy');
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      engine.handleCopy(event);

      expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
      expect(core.clipboardManager.copy).toHaveBeenCalledTimes(1);
      expect(core.rerender).toHaveBeenCalledTimes(1);
    });

    it('ignores copy when a text editor is active', () => {
      core.store.selectionGroup = { objects: [{}] };
      core.store.activeText = { isEditing: true };

      const event = createCancelableClipboardEvent('copy');
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      engine.handleCopy(event);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
      expect(core.clipboardManager.copy).not.toHaveBeenCalled();
      expect(core.rerender).not.toHaveBeenCalled();
    });

    it('handles cut via native browser event when selection is active', () => {
      core.store.selectionGroup = { objects: [{}] };
      core.store.activeText = null;
      core.store.activeShape = null;

      const event = createCancelableClipboardEvent('cut');
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      engine.handleCut(event);

      expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
      expect(core.clipboardManager.cut).toHaveBeenCalledTimes(1);
    });

    it('handles paste via native browser event', () => {
      core.store.activeText = null;
      core.store.activeShape = null;

      const event = createCancelableClipboardEvent('paste');
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      engine.handlePaste(event);

      expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
      expect(core.clipboardManager.paste).toHaveBeenCalledWith(undefined, undefined, event);
    });

    it('forwards paste to the clipboard manager', () => {
      const event = createCancelableClipboardEvent('paste');
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      engine.handlePaste(event);

      expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
      expect(core.clipboardManager.paste).toHaveBeenCalledWith(undefined, undefined, event);
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

  describe('scene bootstrap controls', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('beginSceneBootstrap hides the scene immediately and rerenders', async () => {
      await engine.beginSceneBootstrap();

      expect((engine as any)._sceneBootstrapOpacity).toBe(0);
      expect((engine as any)._sceneBootstrapTransitionEnabled).toBe(false);
      expect(core.rerender).toHaveBeenCalledTimes(1);
    });

    it('endSceneBootstrap fades the scene back in and clears the transition flag after the timeout', async () => {
      await engine.beginSceneBootstrap();
      (core.rerender as jest.Mock).mockClear();

      await engine.endSceneBootstrap();

      expect((engine as any)._sceneBootstrapOpacity).toBe(1);
      expect((engine as any)._sceneBootstrapTransitionEnabled).toBe(true);
      expect(core.rerender).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(220);

      expect((engine as any)._sceneBootstrapTransitionEnabled).toBe(false);
      expect(core.rerender).toHaveBeenCalledTimes(2);
    });
  });

  describe('wheel interaction gating', () => {
    const createWheelEvent = (overrides: Partial<WheelEvent> = {}): WheelEvent =>
      ({
        ctrlKey: false,
        deltaY: 0,
        composedPath: () => [],
        ...overrides,
      }) as WheelEvent;

    it('applies viewport wheel handling for Ctrl+wheel when zooming is enabled', () => {
      const activeTool = { handleWheel: jest.fn() } as any;
      core.store.state.activeTool = activeTool;
      engine.isZoomingEnabled = true;

      engine.handleWheel(createWheelEvent({ ctrlKey: true }));

      expect(engine.viewport.handleWheel).toHaveBeenCalledTimes(1);
      expect(activeTool.handleWheel).toHaveBeenCalledTimes(1);
    });

    it('skips viewport wheel handling for Ctrl+wheel when zooming is disabled and still forwards to the active tool', () => {
      const activeTool = { handleWheel: jest.fn() } as any;
      core.store.state.activeTool = activeTool;
      engine.isZoomingEnabled = false;

      engine.handleWheel(createWheelEvent({ ctrlKey: true }));

      expect(engine.viewport.handleWheel).not.toHaveBeenCalled();
      expect(activeTool.handleWheel).toHaveBeenCalledTimes(1);
    });

    it('applies viewport wheel handling for regular wheel input when panning is enabled', () => {
      const activeTool = { handleWheel: jest.fn() } as any;
      core.store.state.activeTool = activeTool;
      engine.isPanningEnabled = true;

      engine.handleWheel(createWheelEvent());

      expect(engine.viewport.handleWheel).toHaveBeenCalledTimes(1);
      expect(activeTool.handleWheel).toHaveBeenCalledTimes(1);
    });

    it('skips viewport wheel handling for regular wheel input when panning is disabled and still forwards to the active tool', () => {
      const activeTool = { handleWheel: jest.fn() } as any;
      core.store.state.activeTool = activeTool;
      engine.isPanningEnabled = false;

      engine.handleWheel(createWheelEvent());

      expect(engine.viewport.handleWheel).not.toHaveBeenCalled();
      expect(activeTool.handleWheel).toHaveBeenCalledTimes(1);
    });

    it('returns early when the engine is disabled', () => {
      const activeTool = { handleWheel: jest.fn() } as any;
      core.store.state.activeTool = activeTool;
      core.store.isDisabled = true;

      engine.handleWheel(createWheelEvent());

      expect(engine.viewport.handleWheel).not.toHaveBeenCalled();
      expect(activeTool.handleWheel).not.toHaveBeenCalled();
    });

    it('keeps wheel handling in hovered dynamic object while it can still scroll down', () => {
      const activeTool = { handleWheel: jest.fn() } as any;
      core.store.state.activeTool = activeTool;

      const scrollHost = document.createElement('div');
      scrollHost.style.overflowY = 'auto';
      Object.defineProperty(scrollHost, 'scrollHeight', { value: 300, configurable: true });
      Object.defineProperty(scrollHost, 'clientHeight', { value: 100, configurable: true });
      scrollHost.scrollTop = 50;

      const objectElement = document.createElement('div');
      objectElement.appendChild(scrollHost);

      const hoveredDynamicObject = {
        __class__: 'KritzelDynamicObject',
        isSelected: true,
        elementRef: objectElement,
      } as any;

      (core.getObjectFromPointerEvent as jest.Mock).mockReturnValue(hoveredDynamicObject);

      engine.handleWheel(
        createWheelEvent({
          deltaY: 10,
          composedPath: () => [scrollHost, objectElement],
        }),
      );

      expect(engine.viewport.handleWheel).not.toHaveBeenCalled();
      expect(activeTool.handleWheel).not.toHaveBeenCalled();
    });

    it('passes wheel handling through when a hovered dynamic object is not scrollable', () => {
      const activeTool = { handleWheel: jest.fn() } as any;
      core.store.state.activeTool = activeTool;

      const objectElement = document.createElement('div');

      const hoveredDynamicObject = {
        __class__: 'KritzelDynamicObject',
        isSelected: true,
        elementRef: objectElement,
      } as any;

      (core.getObjectFromPointerEvent as jest.Mock).mockReturnValue(hoveredDynamicObject);

      engine.handleWheel(
        createWheelEvent({
          deltaY: 10,
          composedPath: () => [objectElement],
        }),
      );

      expect(engine.viewport.handleWheel).toHaveBeenCalledTimes(1);
      expect(activeTool.handleWheel).toHaveBeenCalledTimes(1);
    });

    it('allows Ctrl+wheel viewport handling while hovering a dynamic object', () => {
      const activeTool = { handleWheel: jest.fn() } as any;
      core.store.state.activeTool = activeTool;
      engine.isZoomingEnabled = true;

      const hoveredDynamicObject = {
        __class__: 'KritzelDynamicObject',
      } as any;

      (core.getObjectFromPointerEvent as jest.Mock).mockReturnValue(hoveredDynamicObject);

      engine.handleWheel(createWheelEvent({ ctrlKey: true, deltaY: -8 }));

      expect(engine.viewport.handleWheel).toHaveBeenCalledTimes(1);
      expect(activeTool.handleWheel).toHaveBeenCalledTimes(1);
    });

    it('hands wheel handling to the viewport at the bottom edge of a dynamic object scroll container', () => {
      const activeTool = { handleWheel: jest.fn() } as any;
      core.store.state.activeTool = activeTool;
      engine.isPanningEnabled = true;

      const scrollHost = document.createElement('div');
      scrollHost.style.overflowY = 'auto';
      Object.defineProperty(scrollHost, 'scrollHeight', { value: 300, configurable: true });
      Object.defineProperty(scrollHost, 'clientHeight', { value: 100, configurable: true });
      scrollHost.scrollTop = 200;

      const objectElement = document.createElement('div');
      objectElement.appendChild(scrollHost);

      const hoveredDynamicObject = {
        __class__: 'KritzelDynamicObject',
        isSelected: true,
        elementRef: objectElement,
      } as any;

      (core.getObjectFromPointerEvent as jest.Mock).mockReturnValue(hoveredDynamicObject);

      engine.handleWheel(
        createWheelEvent({
          deltaY: 10,
          composedPath: () => [scrollHost, objectElement],
        }),
      );

      expect(engine.viewport.handleWheel).toHaveBeenCalledTimes(1);
      expect(activeTool.handleWheel).toHaveBeenCalledTimes(1);
    });

    it('keeps wheel handling in hovered dynamic object while it can still scroll up', () => {
      const activeTool = { handleWheel: jest.fn() } as any;
      core.store.state.activeTool = activeTool;

      const scrollHost = document.createElement('div');
      scrollHost.style.overflowY = 'auto';
      Object.defineProperty(scrollHost, 'scrollHeight', { value: 300, configurable: true });
      Object.defineProperty(scrollHost, 'clientHeight', { value: 100, configurable: true });
      scrollHost.scrollTop = 25;

      const objectElement = document.createElement('div');
      objectElement.appendChild(scrollHost);

      const hoveredDynamicObject = {
        __class__: 'KritzelDynamicObject',
        isSelected: true,
        elementRef: objectElement,
      } as any;

      (core.getObjectFromPointerEvent as jest.Mock).mockReturnValue(hoveredDynamicObject);

      engine.handleWheel(
        createWheelEvent({
          deltaY: -10,
          composedPath: () => [scrollHost, objectElement],
        }),
      );

      expect(engine.viewport.handleWheel).not.toHaveBeenCalled();
      expect(activeTool.handleWheel).not.toHaveBeenCalled();
    });

    it('hands wheel handling to the viewport at the top edge of a dynamic object scroll container', () => {
      const activeTool = { handleWheel: jest.fn() } as any;
      core.store.state.activeTool = activeTool;
      engine.isPanningEnabled = true;

      const scrollHost = document.createElement('div');
      scrollHost.style.overflowY = 'auto';
      Object.defineProperty(scrollHost, 'scrollHeight', { value: 300, configurable: true });
      Object.defineProperty(scrollHost, 'clientHeight', { value: 100, configurable: true });
      scrollHost.scrollTop = 0;

      const objectElement = document.createElement('div');
      objectElement.appendChild(scrollHost);

      const hoveredDynamicObject = {
        __class__: 'KritzelDynamicObject',
        isSelected: true,
        elementRef: objectElement,
      } as any;

      (core.getObjectFromPointerEvent as jest.Mock).mockReturnValue(hoveredDynamicObject);

      engine.handleWheel(
        createWheelEvent({
          deltaY: -10,
          composedPath: () => [scrollHost, objectElement],
        }),
      );

      expect(engine.viewport.handleWheel).toHaveBeenCalledTimes(1);
      expect(activeTool.handleWheel).toHaveBeenCalledTimes(1);
    });

    it('uses the elmeentRef firstChild when present to decide wheel handoff', () => {
      const activeTool = { handleWheel: jest.fn() } as any;
      core.store.state.activeTool = activeTool;

      const scrollHost = document.createElement('div');
      Object.defineProperty(scrollHost, 'scrollHeight', { value: 240, configurable: true });
      Object.defineProperty(scrollHost, 'clientHeight', { value: 100, configurable: true });
      scrollHost.scrollTop = 10;

      const typoRefContainer = document.createElement('div');
      typoRefContainer.appendChild(scrollHost);

      const hoveredDynamicObject = {
        __class__: 'KritzelDynamicObject',
        isSelected: true,
        elmeentRef: typoRefContainer,
      } as any;

      (core.getObjectFromPointerEvent as jest.Mock).mockReturnValue(hoveredDynamicObject);

      engine.handleWheel(createWheelEvent({ deltaY: -5 }));

      expect(engine.viewport.handleWheel).not.toHaveBeenCalled();
      expect(activeTool.handleWheel).not.toHaveBeenCalled();
    });

    it('keeps wheel handling in hovered dynamic object while it can still scroll right', () => {
      const activeTool = { handleWheel: jest.fn() } as any;
      core.store.state.activeTool = activeTool;

      const scrollHost = document.createElement('div');
      scrollHost.style.overflowX = 'auto';
      Object.defineProperty(scrollHost, 'scrollWidth', { value: 300, configurable: true });
      Object.defineProperty(scrollHost, 'clientWidth', { value: 100, configurable: true });
      scrollHost.scrollLeft = 40;

      const objectElement = document.createElement('div');
      objectElement.appendChild(scrollHost);

      const hoveredDynamicObject = {
        __class__: 'KritzelDynamicObject',
        isSelected: true,
        elementRef: objectElement,
      } as any;

      (core.getObjectFromPointerEvent as jest.Mock).mockReturnValue(hoveredDynamicObject);

      engine.handleWheel(
        createWheelEvent({
          deltaX: 12,
          deltaY: 0,
          composedPath: () => [scrollHost, objectElement],
        }),
      );

      expect(engine.viewport.handleWheel).not.toHaveBeenCalled();
      expect(activeTool.handleWheel).not.toHaveBeenCalled();
    });

    it('hands wheel handling to the viewport at the right edge of a dynamic object scroll container', () => {
      const activeTool = { handleWheel: jest.fn() } as any;
      core.store.state.activeTool = activeTool;
      engine.isPanningEnabled = true;

      const scrollHost = document.createElement('div');
      scrollHost.style.overflowX = 'auto';
      Object.defineProperty(scrollHost, 'scrollWidth', { value: 300, configurable: true });
      Object.defineProperty(scrollHost, 'clientWidth', { value: 100, configurable: true });
      scrollHost.scrollLeft = 200;

      const objectElement = document.createElement('div');
      objectElement.appendChild(scrollHost);

      const hoveredDynamicObject = {
        __class__: 'KritzelDynamicObject',
        isSelected: true,
        elementRef: objectElement,
      } as any;

      (core.getObjectFromPointerEvent as jest.Mock).mockReturnValue(hoveredDynamicObject);

      engine.handleWheel(
        createWheelEvent({
          deltaX: 12,
          deltaY: 0,
          composedPath: () => [scrollHost, objectElement],
        }),
      );

      expect(engine.viewport.handleWheel).toHaveBeenCalledTimes(1);
      expect(activeTool.handleWheel).toHaveBeenCalledTimes(1);
    });

    it('keeps wheel handling in hovered dynamic object while it can still scroll left', () => {
      const activeTool = { handleWheel: jest.fn() } as any;
      core.store.state.activeTool = activeTool;

      const scrollHost = document.createElement('div');
      scrollHost.style.overflowX = 'auto';
      Object.defineProperty(scrollHost, 'scrollWidth', { value: 300, configurable: true });
      Object.defineProperty(scrollHost, 'clientWidth', { value: 100, configurable: true });
      scrollHost.scrollLeft = 20;

      const objectElement = document.createElement('div');
      objectElement.appendChild(scrollHost);

      const hoveredDynamicObject = {
        __class__: 'KritzelDynamicObject',
        isSelected: true,
        elementRef: objectElement,
      } as any;

      (core.getObjectFromPointerEvent as jest.Mock).mockReturnValue(hoveredDynamicObject);

      engine.handleWheel(
        createWheelEvent({
          deltaX: -12,
          deltaY: 0,
          composedPath: () => [scrollHost, objectElement],
        }),
      );

      expect(engine.viewport.handleWheel).not.toHaveBeenCalled();
      expect(activeTool.handleWheel).not.toHaveBeenCalled();
    });

    it('hands wheel handling to the viewport at the left edge of a dynamic object scroll container', () => {
      const activeTool = { handleWheel: jest.fn() } as any;
      core.store.state.activeTool = activeTool;
      engine.isPanningEnabled = true;

      const scrollHost = document.createElement('div');
      scrollHost.style.overflowX = 'auto';
      Object.defineProperty(scrollHost, 'scrollWidth', { value: 300, configurable: true });
      Object.defineProperty(scrollHost, 'clientWidth', { value: 100, configurable: true });
      scrollHost.scrollLeft = 0;

      const objectElement = document.createElement('div');
      objectElement.appendChild(scrollHost);

      const hoveredDynamicObject = {
        __class__: 'KritzelDynamicObject',
        isSelected: true,
        elementRef: objectElement,
      } as any;

      (core.getObjectFromPointerEvent as jest.Mock).mockReturnValue(hoveredDynamicObject);

      engine.handleWheel(
        createWheelEvent({
          deltaX: -12,
          deltaY: 0,
          composedPath: () => [scrollHost, objectElement],
        }),
      );

      expect(engine.viewport.handleWheel).toHaveBeenCalledTimes(1);
      expect(activeTool.handleWheel).toHaveBeenCalledTimes(1);
    });
  });

  describe('image first reveal policy', () => {
    const createImage = (overrides: Partial<any> = {}) => ({
      id: 'obj-1',
      assetId: 'asset-1',
      loadState: 'ready',
      ...overrides,
    });

    it('animates first reveal for a ready unseen asset', () => {
      const shouldAnimate = (engine as any).shouldAnimateImageFirstReveal(createImage());

      expect(shouldAnimate).toBe(true);
    });

    it('does not animate repeated reveals for the same asset id', () => {
      (engine as any).shouldAnimateImageFirstReveal(createImage({ id: 'obj-1' }));

      const shouldAnimateAgain = (engine as any).shouldAnimateImageFirstReveal(createImage({ id: 'obj-2' }));

      expect(shouldAnimateAgain).toBe(false);
    });

    it('does not animate while image is not ready', () => {
      const shouldAnimate = (engine as any).shouldAnimateImageFirstReveal(createImage({ loadState: 'loading' }));

      expect(shouldAnimate).toBe(false);
    });

    it('falls back to object id when asset id is missing', () => {
      const firstReveal = (engine as any).shouldAnimateImageFirstReveal(createImage({ assetId: '', id: 'legacy-1' }));
      const secondReveal = (engine as any).shouldAnimateImageFirstReveal(createImage({ assetId: '', id: 'legacy-1' }));

      expect(firstReveal).toBe(true);
      expect(secondReveal).toBe(false);
    });

    it('clears tracked reveal keys on disconnect', () => {
      (engine as any).shouldAnimateImageFirstReveal(createImage());

      engine.disconnectedCallback();

      const shouldAnimateAfterDisconnect = (engine as any).shouldAnimateImageFirstReveal(createImage());
      expect(shouldAnimateAfterDisconnect).toBe(true);
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
      expect((engine as any).contextMenuStateChange.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          isVisible: false,
          isObjectMenu: false,
          position: { x: 0, y: 0 },
          worldPosition: { x: 0, y: 0 },
          items: [],
          objects: [],
        }),
      );
      expect(core.rerender).toHaveBeenCalled();
    });
  });

  describe('context-menu state event bridge', () => {
    it('openContextMenu delegates to handler and emits context menu state', async () => {
      const open = jest.fn().mockImplementation(() => {
        core.store.state.isContextMenuVisible = true;
        core.store.state.contextMenuItems = [{ label: 'menu.copy' } as any];
        core.store.state.contextMenuX = 12;
        core.store.state.contextMenuY = 24;
        core.store.state.contextMenuWorldX = 120;
        core.store.state.contextMenuWorldY = 240;
        core.store.selectionGroup = { objects: [{ id: 'obj-1' }] };
      });

      (engine as any).contextMenuHandler = { open };

      await engine.openContextMenu({ x: 120, y: 240 });

      expect(open).toHaveBeenCalledWith({ x: 120, y: 240 });
      expect((engine as any).contextMenuStateChange.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          isVisible: true,
          isObjectMenu: true,
          position: { x: 12, y: 24 },
          worldPosition: { x: 120, y: 240 },
          objects: [{ id: 'obj-1' }],
        }),
      );
    });

    it('handleContextMenu emits context menu state after handler updates state', () => {
      const handleContextMenu = jest.fn().mockImplementation(() => {
        core.store.state.isContextMenuVisible = true;
        core.store.state.contextMenuItems = [{ label: 'menu.paste' } as any];
        core.store.state.contextMenuX = 8;
        core.store.state.contextMenuY = 10;
        core.store.state.contextMenuWorldX = 80;
        core.store.state.contextMenuWorldY = 100;
      });

      (engine as any).contextMenuHandler = { handleContextMenu };

      const event = {
        cancelable: true,
        pointerType: 'mouse',
        preventDefault: jest.fn(),
      } as unknown as PointerEvent;

      engine.handleContextMenu(event);

      expect(event.preventDefault).toHaveBeenCalledTimes(1);
      expect(handleContextMenu).toHaveBeenCalledWith(event);
      expect((engine as any).contextMenuStateChange.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          isVisible: true,
          position: { x: 8, y: 10 },
          worldPosition: { x: 80, y: 100 },
        }),
      );
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

    it('centerObjects delegates to viewport.centerFitObjects', async () => {
      const objects = [{ id: 'obj-1' }] as unknown as KritzelBaseObject[];
      const result = await engine.centerObjects(objects, false);

      expect(engine.viewport.centerFitObjects).toHaveBeenCalledWith(objects, false);
      expect(result).toBe(true);
    });
  });

  describe('workspace management', () => {
    it('setActiveWorkspace initializes a visible workspace and emits activeWorkspaceChange', async () => {
      const workspace = new KritzelWorkspace({ id: 'w1', name: 'Test' });
      core.getWorkspaces.mockReturnValue([workspace]);
      core.initializeWorkspace.mockImplementation(async (nextWorkspace: KritzelWorkspace) => {
        core.store.state.activeWorkspace = nextWorkspace;
      });

      await engine.setActiveWorkspace('w1');

      expect(core.beforeWorkspaceChange).toHaveBeenCalledTimes(1);
      expect(core.initializeWorkspace).toHaveBeenCalledWith(workspace, undefined);
      expect((engine as any).activeWorkspaceChange.emit).toHaveBeenCalledWith(workspace);
    });

    it('createWorkspace delegates to core and emits workspacesChange', async () => {
      const workspace = { id: 'w1', name: 'Test' } as KritzelWorkspace;
      core.store.state.workspaces = [workspace];
      core.getWorkspaces.mockReturnValue([workspace]);

      const result = await engine.createWorkspace(workspace);

      expect(core.createWorkspace).toHaveBeenCalledWith(workspace);
      expect((engine as any).workspacesChange.emit).toHaveBeenCalledWith([workspace]);
      expect(result).toBe(workspace);
    });

    it('updateWorkspace delegates to core and emits workspacesChange', async () => {
      const workspace = { id: 'w1', name: 'Updated' } as KritzelWorkspace;
      core.store.state.workspaces = [workspace];
      core.getWorkspaces.mockReturnValue([workspace]);

      await engine.updateWorkspace(workspace);

      expect(core.updateWorkspace).toHaveBeenCalledWith(workspace);
      expect((engine as any).workspacesChange.emit).toHaveBeenCalledWith([workspace]);
    });

    it('deleteWorkspace delegates to core and emits workspacesChange', async () => {
      const workspace = { id: 'w1', name: 'Doomed' } as KritzelWorkspace;
      core.store.state.workspaces = [];
      core.getWorkspaces.mockReturnValue([]);

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

    it('restores embedded portable assets before importing', async () => {
      const payload = {
        __class__: 'KritzelWorkspace',
        name: 'Imported Workspace',
        viewport: { centerWorldX: 0, centerWorldY: 0, scale: 1 },
        objects: [],
        assets: {
          'asset-1': 'data:image/png;base64,AA==',
        },
      };

      jest
        .spyOn(engine as any, 'dataUrlToBlob')
        .mockResolvedValue(new Blob(['png-bytes'], { type: 'image/png' }));

      await engine.importFromJson(JSON.stringify(payload));

      expect(core.initializeAssetStorage).toHaveBeenCalled();
      expect(core.assetResolver.put).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.objectContaining({ id: 'asset-1', mimeType: 'image/png', kind: 'image' }),
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

      expect(JSON.parse(json)).toEqual({
        ...serialized,
        exportMode: 'portable',
      });
      expect(core.initializeAssetStorage).toHaveBeenCalled();
      expect((core.store.state.activeWorkspace as any).serialize).toHaveBeenCalledWith({ includeObjects: true });
    });

    it('uses lightweight export mode when a remote asset provider exists', async () => {
      const serialized = { __class__: 'KritzelWorkspace', id: 'w1', objects: [] };
      core.assetResolver.hasRemoteProvider = true;
      core.store.state.activeWorkspace = {
        serialize: jest.fn().mockReturnValue(serialized),
      } as unknown as KritzelWorkspace;

      const json = await engine.exportAsJson();

      expect(JSON.parse(json)).toEqual({
        ...serialized,
        exportMode: 'lightweight',
      });
      expect(core.assetResolver.fetchBlob).not.toHaveBeenCalled();
    });

    it('embeds image assets for portable exports when no remote provider exists', async () => {
      const serialized = {
        __class__: 'KritzelWorkspace',
        id: 'w1',
        objects: [
          { __class__: 'KritzelImage', assetId: 'asset-1' },
          { __class__: 'KritzelImage', assetId: 'asset-1' },
        ],
      };
      core.assetResolver.hasRemoteProvider = false;
      core.assetResolver.fetchBlob.mockResolvedValue(new Blob(['png-bytes'], { type: 'image/png' }));
      jest
        .spyOn(engine as any, 'blobToDataUrl')
        .mockResolvedValue('data:image/png;base64,cG5nLWJ5dGVz');
      core.store.state.activeWorkspace = {
        serialize: jest.fn().mockReturnValue(serialized),
      } as unknown as KritzelWorkspace;

      const json = await engine.exportAsJson();

      expect(JSON.parse(json)).toEqual({
        ...serialized,
        exportMode: 'portable',
        assets: {
          'asset-1': 'data:image/png;base64,cG5nLWJ5dGVz',
        },
      });
      expect(core.assetResolver.fetchBlob).toHaveBeenCalledTimes(1);
      expect(core.assetResolver.fetchBlob).toHaveBeenCalledWith('asset-1');
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

      const eraserTool = new MockKritzelEraserTool();
      invokeHandler(eraserTool);

      expect(core.store.state.skipContextMenu).toBe(false);
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

    it('applies opacity from toolConfig to existing tool instance', async () => {
      const existingTool: any = { name: 'brush', opacity: 1 };
      (core.toolRegistry.hasTool as jest.Mock).mockReturnValue(true);
      (core.toolRegistry.getTool as jest.Mock).mockReturnValue(existingTool);

      class FakeBrushTool {}
      const config = { color: 'blue', size: 10, opacity: 0.5 } as any;
      const result = await engine.registerTool('brush', FakeBrushTool, config);

      expect(result).toBe(existingTool);
      expect(existingTool.opacity).toBe(0.5);
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

    it('substitutes the internal built-in class when a foreign copy of a built-in tool is registered', async () => {
      const newTool = { name: 'selection' };
      (core.toolRegistry.hasTool as jest.Mock).mockReturnValue(false);
      (core.toolRegistry.registerTool as jest.Mock).mockReturnValue(newTool);

      // Simulates a built-in tool class from another compiled copy of the library
      // (dual-package hazard): does not extend the local KritzelBaseTool but
      // identifies itself via the toolType discriminator.
      class ForeignSelectionTool {
        toolType = 'selection';
      }
      const result = await engine.registerTool('selection', ForeignSelectionTool, undefined);

      expect(core.toolRegistry.registerTool).toHaveBeenCalledWith('selection', MockKritzelSelectionTool);
      expect(result).toBe(newTool);
    });

    it('registers a tool class extending the local base tool as-is', async () => {
      const newTool = { name: 'custom' };
      (core.toolRegistry.hasTool as jest.Mock).mockReturnValue(false);
      (core.toolRegistry.registerTool as jest.Mock).mockReturnValue(newTool);

      class LocalCustomTool extends MockKritzelBaseTool {
        toolType = 'selection';
      }
      await engine.registerTool('custom', LocalCustomTool, undefined);

      expect(core.toolRegistry.registerTool).toHaveBeenCalledWith('custom', LocalCustomTool);
    });

    it('registers the original class when probing a foreign tool class throws', async () => {
      const newTool = { name: 'throwing' };
      (core.toolRegistry.hasTool as jest.Mock).mockReturnValue(false);
      (core.toolRegistry.registerTool as jest.Mock).mockReturnValue(newTool);

      class ThrowingTool {
        constructor() {
          throw new Error('boom');
        }
      }
      await engine.registerTool('throwing', ThrowingTool, undefined);

      expect(core.toolRegistry.registerTool).toHaveBeenCalledWith('throwing', ThrowingTool);
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

    it('applies opacity from toolConfig to a newly registered tool', async () => {
      const newTool: any = { name: 'line', opacity: 1 };
      (core.toolRegistry.hasTool as jest.Mock).mockReturnValue(false);
      (core.toolRegistry.registerTool as jest.Mock).mockReturnValue(newTool);

      class FakeLineTool {}
      const config = { color: { light: '#000', dark: '#fff' }, size: 4, opacity: 0.25, palette: [] } as any;
      await engine.registerTool('line', FakeLineTool, config);

      expect(newTool.opacity).toBe(0.25);
    });

    it('passes palette array directly for brush tool config', async () => {
      const newTool: any = { name: 'pen', palette: [] };
      (core.toolRegistry.hasTool as jest.Mock).mockReturnValue(false);
      (core.toolRegistry.registerTool as jest.Mock).mockReturnValue(newTool);

      class FakeBrushTool {}
      const customPalette = [{ light: '#ff0000', dark: '#ff0000' }];
      const config = { color: customPalette[0], size: 6, palette: customPalette } as any;
      await engine.registerTool('pen', FakeBrushTool, config);

      expect(newTool.palette).toBe(customPalette);
    });

    it('passes palette array directly for existing brush tool', async () => {
      const existingTool: any = { name: 'pen', palette: [{ light: '#000', dark: '#fff' }] };
      (core.toolRegistry.hasTool as jest.Mock).mockReturnValue(true);
      (core.toolRegistry.getTool as jest.Mock).mockReturnValue(existingTool);

      class FakeBrushTool {}
      const customPalette = [{ light: '#ff0000', dark: '#ff0000' }];
      const config = { color: customPalette[0], size: 6, palette: customPalette } as any;
      await engine.registerTool('pen', FakeBrushTool, config);

      expect(existingTool.palette).toBe(customPalette);
    });

    it('passes sizes array directly for brush tool config', async () => {
      const newTool: any = { name: 'pen', sizes: [] };
      (core.toolRegistry.hasTool as jest.Mock).mockReturnValue(false);
      (core.toolRegistry.registerTool as jest.Mock).mockReturnValue(newTool);

      class FakeBrushTool {}
      const customSizes = [2, 4, 8];
      const config = { color: { light: '#000', dark: '#fff' }, size: 6, palette: [], sizes: customSizes } as any;
      await engine.registerTool('pen', FakeBrushTool, config);

      expect(newTool.sizes).toBe(customSizes);
    });

    it('passes sizes array directly for existing brush tool', async () => {
      const existingTool: any = { name: 'pen', sizes: [4, 6, 8, 12, 16, 24] };
      (core.toolRegistry.hasTool as jest.Mock).mockReturnValue(true);
      (core.toolRegistry.getTool as jest.Mock).mockReturnValue(existingTool);

      class FakeBrushTool {}
      const customSizes = [1, 2, 4];
      const config = { color: { light: '#000', dark: '#fff' }, size: 4, palette: [], sizes: customSizes } as any;
      await engine.registerTool('pen', FakeBrushTool, config);

      expect(existingTool.sizes).toBe(customSizes);
    });

    it('passes sizes array directly for line tool config', async () => {
      const newTool: any = { name: 'line', sizes: [] };
      (core.toolRegistry.hasTool as jest.Mock).mockReturnValue(false);
      (core.toolRegistry.registerTool as jest.Mock).mockReturnValue(newTool);

      class FakeLineTool {}
      const customSizes = [1, 2, 4, 8];
      const config = { color: { light: '#000', dark: '#fff' }, size: 4, palette: [], sizes: customSizes } as any;
      await engine.registerTool('line', FakeLineTool, config);

      expect(newTool.sizes).toEqual(customSizes);
    });

    it('passes sizes array directly for shape tool config', async () => {
      const newTool: any = { name: 'shape', sizes: [] };
      (core.toolRegistry.hasTool as jest.Mock).mockReturnValue(false);
      (core.toolRegistry.registerTool as jest.Mock).mockReturnValue(newTool);

      class FakeShapeTool {}
      const customSizes = [2, 4, 6, 10];
      const config = { shapeType: 'rectangle', strokeColor: { light: '#000', dark: '#fff' }, strokeWidth: 4, fillColor: { light: 'transparent', dark: 'transparent' }, fontColor: { light: '#000', dark: '#fff' }, fontSize: 16, fontFamily: 'Arial', palette: [], sizes: customSizes } as any;
      await engine.registerTool('shape', FakeShapeTool, config);

      expect(newTool.sizes).toEqual(customSizes);
    });

    it('passes sizes array directly for text tool config', async () => {
      const newTool: any = { name: 'text', sizes: [] };
      (core.toolRegistry.hasTool as jest.Mock).mockReturnValue(false);
      (core.toolRegistry.registerTool as jest.Mock).mockReturnValue(newTool);

      class FakeTextTool {}
      const customSizes = [16, 12, 8];
      const config = { color: { light: '#000', dark: '#fff' }, size: 16, fontFamily: 'Arial', palette: [], sizes: customSizes } as any;
      await engine.registerTool('text', FakeTextTool, config);

      expect(newTool.sizes).toEqual(customSizes);
    });

    it('applies default availableFonts for text tool config when availableFonts is missing', async () => {
      const newTool: any = { name: 'text' };
      (core.toolRegistry.hasTool as jest.Mock).mockReturnValue(false);
      (core.toolRegistry.registerTool as jest.Mock).mockReturnValue(newTool);

      class FakeTextTool {}
      const config = {
        color: { light: '#000', dark: '#fff' },
        size: 16,
        fontFamily: 'Arial',
        palette: [],
      } as any;
      await engine.registerTool('text', FakeTextTool, config);

      expect(newTool.availableFonts).toEqual(DEFAULT_TEXT_TOOL_AVAILABLE_FONTS);
    });

    it('preserves explicit availableFonts for text tool config', async () => {
      const newTool: any = { name: 'text' };
      (core.toolRegistry.hasTool as jest.Mock).mockReturnValue(false);
      (core.toolRegistry.registerTool as jest.Mock).mockReturnValue(newTool);

      class FakeTextTool {}
      const config = {
        color: { light: '#000', dark: '#fff' },
        size: 16,
        fontFamily: 'Lora',
        availableFonts: [{ family: 'Lora', cssFontFamily: "'Lora', serif" }],
        palette: [],
      } as any;
      await engine.registerTool('text', FakeTextTool, config);

      expect(newTool.availableFonts).toEqual([{ family: 'Lora', cssFontFamily: "'Lora', serif" }]);
    });
  });

  describe('addObject / addObjects scale preservation', () => {
    const makeObject = (scale: number): any => ({
      scale,
      workspaceId: '',
      zIndex: 0,
      _core: null,
      generateId: jest.fn().mockReturnValue('generated-id'),
    });

    beforeEach(() => {
      core.store.state.activeWorkspace = { id: 'ws1' } as KritzelWorkspace;
      jest.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(cb => { cb(0); return 0; });
    });

    it('addObject preserves an explicitly set scale', async () => {
      const object = makeObject(0.5);

      await engine.addObject(object);

      expect(object.scale).toBe(0.5);
    });

    it('addObject does not overwrite scale 1 with the viewport scale', async () => {
      core.store.state.scale = 3;
      const object = makeObject(1);

      await engine.addObject(object);

      expect(object.scale).toBe(1);
    });

    it('addObject preserves a large scale value', async () => {
      const object = makeObject(10);

      await engine.addObject(object);

      expect(object.scale).toBe(10);
    });

    it('addObjects preserves the caller-supplied scale on every object in the batch', async () => {
      const a = makeObject(0.2);
      const b = makeObject(5);

      await engine.addObjects([a, b]);

      expect(a.scale).toBe(0.2);
      expect(b.scale).toBe(5);
    });

    it('addObjects does not overwrite scale 1 with the viewport scale', async () => {
      core.store.state.scale = 2;
      const object = makeObject(1);

      await engine.addObjects([object]);

      expect(object.scale).toBe(1);
    });

    it('addObject calls prepareForInsert for KritzelImage objects', async () => {
      (KritzelClassHelper.isInstanceOf as unknown as jest.Mock).mockImplementation((_: unknown, className: string) => className === 'KritzelImage');
      const imageObject = {
        ...makeObject(1),
        prepareForInsert: jest.fn().mockResolvedValue(undefined),
      };

      await engine.addObject(imageObject as any);

      expect(imageObject.prepareForInsert).toHaveBeenCalledTimes(1);
    });

    it('addObjects calls prepareForInsert for each KritzelImage object before transaction insert', async () => {
      (KritzelClassHelper.isInstanceOf as unknown as jest.Mock).mockImplementation((_: unknown, className: string) => className === 'KritzelImage');
      const a = {
        ...makeObject(1),
        prepareForInsert: jest.fn().mockResolvedValue(undefined),
      };
      const b = {
        ...makeObject(2),
        prepareForInsert: jest.fn().mockResolvedValue(undefined),
      };

      await engine.addObjects([a as any, b as any]);

      expect(a.prepareForInsert).toHaveBeenCalledTimes(1);
      expect(b.prepareForInsert).toHaveBeenCalledTimes(1);
    });
  });

  describe('programmatic API emits objectsChange', () => {
    const makeObject = (id = 'obj-1'): any => ({
      id,
      scale: 1,
      workspaceId: '',
      zIndex: 0,
      _core: null,
      generateId: jest.fn().mockReturnValue(id),
    });

    beforeEach(() => {
      (KritzelClassHelper.isInstanceOf as unknown as jest.Mock).mockReturnValue(false);
      core.store.state.activeWorkspace = { id: 'ws1' } as KritzelWorkspace;
      core.store.allObjects = [];
      jest.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(cb => { cb(0); return 0; });
    });

    it('addObject emits objectsChange', async () => {
      const object = makeObject();

      await engine.addObject(object);

      expect((engine as any).objectsChange.emit).toHaveBeenCalled();
    });

    it('addObjects emits objectsChange', async () => {
      const objects = [makeObject('a'), makeObject('b')];

      await engine.addObjects(objects);

      expect((engine as any).objectsChange.emit).toHaveBeenCalled();
    });

    it('updateObject emits objectsChange', async () => {
      const object = makeObject();

      await engine.updateObject(object, { scale: 2 } as any);

      expect((engine as any).objectsChange.emit).toHaveBeenCalled();
    });

    it('removeObject emits objectsChange', async () => {
      const object = makeObject();

      await engine.removeObject(object);

      expect((engine as any).objectsChange.emit).toHaveBeenCalled();
    });

    it('removeObjects emits objectsChange', async () => {
      const objects = [makeObject('a'), makeObject('b')];

      await engine.removeObjects(objects);

      expect((engine as any).objectsChange.emit).toHaveBeenCalled();
    });

    it('addObject emits objectsChange before objectsAdded', async () => {
      const callOrder: string[] = [];
      (engine as any).objectsChange.emit = jest.fn(() => callOrder.push('objectsChange'));
      (engine as any).objectsAdded.emit = jest.fn(() => callOrder.push('objectsAdded'));

      await engine.addObject(makeObject());

      expect(callOrder).toEqual(['objectsChange', 'objectsAdded']);
    });

    it('removeObject emits objectsChange before objectsRemoved', async () => {
      const callOrder: string[] = [];
      (engine as any).objectsChange.emit = jest.fn(() => callOrder.push('objectsChange'));
      (engine as any).objectsRemoved.emit = jest.fn(() => callOrder.push('objectsRemoved'));

      await engine.removeObject(makeObject());

      expect(callOrder).toEqual(['objectsChange', 'objectsRemoved']);
    });

    it('updateObject emits objectsChange before objectsUpdated', async () => {
      const callOrder: string[] = [];
      (engine as any).objectsChange.emit = jest.fn(() => callOrder.push('objectsChange'));
      (engine as any).objectsUpdated.emit = jest.fn(() => callOrder.push('objectsUpdated'));

      await engine.updateObject(makeObject(), { scale: 2 } as any);

      expect(callOrder).toEqual(['objectsChange', 'objectsUpdated']);
    });
  });
});
