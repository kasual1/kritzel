// Mock Stencil decorators so the @Component class can be instantiated as a
// plain class in unit tests. Mirrors the pattern used in other component specs
// (e.g. updraw-awareness-cursors.spec.ts).
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

// UpdrawEngine's constructor instantiates `new UpdrawCore(this)`. Replace
// it with a lightweight mock so we don't pull in Yjs, IndexedDB, etc.
const mockCoreInstance: any = {};
jest.mock('@updraw/core/src/classes/core/core.class', () => ({
  UpdrawCore: jest.fn().mockImplementation(() => mockCoreInstance),
}));

// Avoid heavy class graphs the engine module imports at top-level.
jest.mock('@updraw/core/src/classes/core/viewport.class', () => ({ UpdrawViewport: jest.fn() }));
jest.mock('@updraw/core/src/classes/handlers/key.handler', () => ({ UpdrawKeyHandler: jest.fn() }));
jest.mock('@updraw/core/src/classes/handlers/context-menu.handler', () => ({ UpdrawContextMenuHandler: jest.fn() }));

class MockUpdrawSelectionTool {
  toolType = 'selection';
}
class MockUpdrawTextTool {
  toolType = 'text';
}
class MockUpdrawShapeTool {
  toolType = 'shape';
}
class MockUpdrawEraserTool {
  toolType = 'eraser';
}
class MockUpdrawBrushTool {
  toolType = 'brush';
}
class MockUpdrawLineTool {
  toolType = 'line';
}
class MockUpdrawImageTool {
  toolType = 'image';
}
class MockUpdrawBaseTool {}
class MockUpdrawSelectionBox {}
class MockUpdrawSelectionGroup {}
class MockUpdrawGroup {}

jest.mock('@updraw/core/src/classes/tools/selection-tool.class', () => ({ UpdrawSelectionTool: MockUpdrawSelectionTool }));
jest.mock('@updraw/core/src/classes/tools/text-tool.class', () => ({ UpdrawTextTool: MockUpdrawTextTool }));
jest.mock('@updraw/core/src/classes/tools/shape-tool.class', () => ({ UpdrawShapeTool: MockUpdrawShapeTool }));
jest.mock('@updraw/core/src/classes/tools/eraser-tool.class', () => ({ UpdrawEraserTool: MockUpdrawEraserTool }));
jest.mock('@updraw/core/src/classes/tools/brush-tool.class', () => ({ UpdrawBrushTool: MockUpdrawBrushTool }));
jest.mock('@updraw/core/src/classes/tools/line-tool.class', () => ({ UpdrawLineTool: MockUpdrawLineTool }));
jest.mock('@updraw/core/src/classes/tools/image-tool.class', () => ({ UpdrawImageTool: MockUpdrawImageTool }));
jest.mock('@updraw/core/src/classes/tools/base-tool.class', () => ({ UpdrawBaseTool: MockUpdrawBaseTool }));
jest.mock('@updraw/core/src/classes/objects/selection-box.class', () => ({ UpdrawSelectionBox: MockUpdrawSelectionBox }));
jest.mock('@updraw/core/src/classes/objects/selection-group.class', () => ({ UpdrawSelectionGroup: MockUpdrawSelectionGroup }));
jest.mock('@updraw/core/src/classes/objects/group.class', () => ({ UpdrawGroup: MockUpdrawGroup }));

jest.mock('html-to-image', () => ({
  toPng: jest.fn().mockResolvedValue('data:image/png;base64,xxx'),
  toSvg: jest.fn().mockResolvedValue('data:image/svg+xml;base64,xxx'),
}));

jest.mock('@updraw/core/src/helpers/keyboard.helper', () => ({
  UpdrawKeyboardHelper: {
    forceHideKeyboard: jest.fn(),
  },
}));

import { UpdrawEngine } from './updraw-engine';
import {
  UpdrawAlignment,
  UpdrawWorkspace,
  UpdrawBaseObject,
  UpdrawDynamicObject,
  UpdrawIframeObject,
  UpdrawImage,
  UpdrawObjectAppearManager,
  UPDRAW_OBJECT_APPEAR_MAX_BATCH,
  DEFAULT_TEXT_TOOL_AVAILABLE_FONTS,
} from '@updraw/core';

/** Builds a fake object whose prototype makes `instanceof` checks in the engine pass. */
const withPrototype = <T = any>(cls: { prototype: object }, fields: Record<string, unknown>): T =>
  Object.assign(Object.create(cls.prototype), fields);

describe('UpdrawEngine', () => {
  let engine: UpdrawEngine;
  let core: any;

  /** Builds a fresh mock core for the engine to delegate to. */
  const createMockCore = () => ({
    objectConfigManager: {
      isResizable: jest.fn().mockReturnValue(true),
      isRotatable: jest.fn().mockReturnValue(true),
      resetWarnings: jest.fn(),
    },
    objectAppearManager: new UpdrawObjectAppearManager(),
    objectTitlebarManager: {
      config: undefined,
      getOwnerFromEvent: jest.fn().mockReturnValue(null),
      isControlEvent: jest.fn().mockReturnValue(false),
      isTitleInputEvent: jest.fn().mockReturnValue(false),
      resetWarnings: jest.fn(),
      closeMenu: jest.fn(),
    },
    setEditorId: jest.fn(),
    setUser: jest.fn(),
    setSyncConfig: jest.fn(),
    setAssetStorageConfig: jest.fn(),
    addObject: jest.fn(),
    // Mirrors the real preparation for plain objects; group flushing is covered by the core spec.
    prepareObjectForInsert: jest.fn(function (this: any, object: any) {
      object.id = object.generateId();
      object._core = this;
      object.scale = object.scale ?? this.store.state.scale;
      object.zIndex = this.store.currentZIndex;
      object.workspaceId = this.store.state.activeWorkspace?.id;
      return [];
    }),
    insertPreparedObject: jest.fn(function (this: any, object: any, descendants: any[]) {
      descendants.forEach((child: any) => this.addObject(child));
      this.addObject(object);
    }),
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
    anchorManager: {
      rebuildIndex: jest.fn(),
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
    agenticCursorManager: {
      cleanup: jest.fn(),
    },
    agenticActionManager: {
      cleanup: jest.fn(),
    },
    agentManager: {
      add: jest.fn((agent: any) => agent),
      remove: jest.fn().mockReturnValue(true),
      get: jest.fn().mockReturnValue(null),
      getAll: jest.fn().mockReturnValue([]),
      getPresences: jest.fn().mockReturnValue([]),
      onChange: jest.fn(),
      setDisposed: jest.fn(),
    },
    agentBroadcaster: {
      clear: jest.fn(),
    },
    remoteAgentManager: {
      getPresences: jest.fn().mockReturnValue([]),
      onChange: jest.fn(),
      clear: jest.fn(),
    },
    themeManager: {
      setTargetElement: jest.fn(),
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
        activeWorkspace: null as UpdrawWorkspace | null,
        workspaces: [] as UpdrawWorkspace[],
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

    engine = new UpdrawEngine();

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
      'agentsChange',
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

  describe('watermark', () => {
    it('shows the watermark by default', () => {
      expect(engine.isWatermarkVisible).toBe(true);
    });
  });

  describe('startup readiness', () => {
    it('emits isEngineReady after the initialized workspace has rendered', async () => {
      jest.useFakeTimers();
      const frameCallbacks: FrameRequestCallback[] = [];
      const animationFrameSpy = jest
        .spyOn(globalThis, 'requestAnimationFrame')
        .mockImplementation(callback => {
          frameCallbacks.push(callback);
          return frameCallbacks.length;
        });
      const workspace = new UpdrawWorkspace({ id: 'seeded-workspace' });
      const seedObject = { id: 'seed-object' };
      let resolveReady!: () => void;
      const readyPromise = new Promise<void>(resolve => {
        resolveReady = resolve;
      });

      core.store.state.isReady = false;
      (engine as any).isEngineReady.emit.mockImplementation(resolveReady);
      jest.spyOn(engine as any, 'registerConfiguredTools').mockResolvedValue(undefined);
      jest.spyOn(engine as any, 'initializeSyncAndWorkspace').mockImplementation(async () => {
        core.store.state.activeWorkspace = workspace;
        core.store.allObjects = [seedObject];
      });

      engine.componentDidLoad();
      jest.runOnlyPendingTimers();
      for (let index = 0; index < 4; index++) {
        await Promise.resolve();
      }

      expect((engine as any).isEngineReady.emit).not.toHaveBeenCalled();
      expect(frameCallbacks).toHaveLength(1);

      frameCallbacks.shift()!(0);
      expect((engine as any).isEngineReady.emit).not.toHaveBeenCalled();
      expect(frameCallbacks).toHaveLength(1);

      frameCallbacks.shift()!(0);
  await readyPromise;

      expect(core.store.allObjects).toEqual([seedObject]);
      expect((engine as any).isEngineReady.emit).toHaveBeenCalledWith(core.store.state);

      animationFrameSpy.mockRestore();
      jest.useRealTimers();
    });
  });

  describe('workspace syncing state', () => {
    it('uses provided workspaces as the visible catalog when controlled', async () => {
      const workspace = new UpdrawWorkspace({ id: 'workspace-1', name: 'Workspace 1' });
      const providerOnlyWorkspace = new UpdrawWorkspace({ id: 'provider-only', name: 'Provider Only' });
      engine.workspaces = [workspace];
      core.getWorkspaces.mockReturnValue([workspace, providerOnlyWorkspace]);

      await expect(engine.getWorkspaces()).resolves.toEqual([workspace]);
    });

    it('creates provided workspaces that are missing from provider state', async () => {
      const workspace = new UpdrawWorkspace({ id: 'workspace-1', name: 'Workspace 1' });
      engine.workspaces = [workspace];
      core.getWorkspaces.mockReturnValue([]);

      await (engine as any).reconcileProvidedWorkspaces();

      expect(core.createWorkspace).toHaveBeenCalledWith(workspace);
    });

    it('reconciles and activates workspaces provided after initialization', async () => {
      const workspace = new UpdrawWorkspace({ id: 'workspace-1', name: 'Workspace 1' });
      engine.workspaces = [workspace];
      core.getWorkspaces.mockReturnValue([]);
      (engine as any)._isYjsInitialized = true;

      await engine.onWorkspacesPropChange();

      expect(core.createWorkspace).toHaveBeenCalledWith(workspace);
      expect(core.initializeWorkspace).toHaveBeenCalledWith(workspace, undefined);
      expect((engine as any).workspacesChange.emit).toHaveBeenCalledWith([workspace]);
    });

    it('updates provider metadata when a provided workspace differs', async () => {
      const existingWorkspace = new UpdrawWorkspace({ id: 'workspace-1', name: 'Old Name' });
      const providedWorkspace = new UpdrawWorkspace({ id: 'workspace-1', name: 'New Name' });
      providedWorkspace.objects = [{ id: 'seed-object' }] as UpdrawBaseObject<any>[];
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
      const firstWorkspace = new UpdrawWorkspace({ id: 'first-workspace', name: 'First Workspace' });
      const activeWorkspace = new UpdrawWorkspace({ id: 'active-workspace', name: 'Active Workspace' });
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
      const visibleWorkspace = new UpdrawWorkspace({ id: 'visible-workspace', name: 'Visible Workspace' });
      const hiddenWorkspace = new UpdrawWorkspace({ id: 'hidden-workspace', name: 'Hidden Workspace' });
      engine.workspaces = [visibleWorkspace];
      core.getWorkspaces.mockReturnValue([visibleWorkspace, hiddenWorkspace]);
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      await engine.setActiveWorkspace(hiddenWorkspace.id);

      expect(core.initializeWorkspace).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(`[UpdrawEngine] No workspace found with ID: ${hiddenWorkspace.id}`);

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
      const remoteWorkspace = new UpdrawWorkspace({ id: 'remote-workspace', name: 'Remote' });

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
        new UpdrawWorkspace({ id: 'cached-workspace', name: 'Cached' }),
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

      const initializationPromise = (engine as any).initializeWorkspaceIfNeeded(new UpdrawWorkspace({ id: 'workspace-1', name: 'Workspace 1' }));

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

      const initializationA = (engine as any).initializeWorkspaceIfNeeded(new UpdrawWorkspace({ id: 'workspace-a', name: 'Workspace A' }));
      const initializationB = (engine as any).initializeWorkspaceIfNeeded(new UpdrawWorkspace({ id: 'workspace-b', name: 'Workspace B' }));

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

  describe('chatSession', () => {
    const createSession = (agent: unknown = null) => ({
      [Symbol.for('updraw.chatSession')]: true,
      agent,
      _attach: jest.fn(),
      _detach: jest.fn(),
      _detachWhenIdle: jest.fn(),
    });

    it('binds once, adds its agent, and unbinds a replaced session once idle', () => {
      const agent = { id: 'planner' };
      const first = createSession(agent);
      (engine as any).chatSession = first;
      engine.onChatSessionChange();
      engine.onChatSessionChange();

      expect(core.agentManager.add).toHaveBeenCalledWith(agent);
      expect(first._attach).toHaveBeenCalledWith(core);

      const second = createSession();
      (engine as any).chatSession = second;
      engine.onChatSessionChange();
      expect(first._detachWhenIdle).toHaveBeenCalledTimes(1);
      expect(second._attach).toHaveBeenCalledWith(core);

      (engine as any).chatSession = null;
      engine.onChatSessionChange();
      expect(second._detachWhenIdle).toHaveBeenCalledTimes(1);
    });

    it('detaches the session when the engine disconnects and binds it again on reconnect', () => {
      const session = createSession();
      (engine as any).chatSession = session;
      engine.onChatSessionChange();
      (engine as any).unbindChatSession();
      expect(session._detach).toHaveBeenCalled();
      (engine as any).bindChatSession();
      expect(session._attach).toHaveBeenCalledTimes(2);
    });

    it('binds a session set before its watcher runs on componentDidLoad, and not twice', () => {
      const session = { ...createSession(), _owner: null as unknown };
      session._attach = jest.fn(() => (session._owner = (engine as any).core));
      (engine as any).chatSession = session;
      (engine as any).bindChatSession();
      (engine as any).bindChatSession();
      expect(session._attach).toHaveBeenCalledTimes(1);
    });

    it('rejects values that are not chat sessions', () => {
      const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      (engine as any).chatSession = { send: () => undefined };
      engine.onChatSessionChange();
      expect(error).toHaveBeenCalledWith('[Updraw] chatSession expects an UpdrawChatSession.');
      error.mockRestore();
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

  describe('object titlebar', () => {
    it('re-renders and resets warnings when objectTitlebar changes', () => {
      engine.onObjectTitlebarChange();

      expect(core.objectTitlebarManager.resetWarnings).toHaveBeenCalled();
      expect(core.rerender).toHaveBeenCalled();
    });

    it('does not track pointers that start on titlebar controls', () => {
      (core.objectTitlebarManager.isControlEvent as jest.Mock).mockReturnValue(true);
      const activeTool = { handlePointerDown: jest.fn() };
      core.store.state.activeTool = activeTool;
      const setPointerCapture = jest.fn();
      (engine.host as any).setPointerCapture = setPointerCapture;
      const event = { pointerId: 3, composedPath: jest.fn().mockReturnValue([]) } as unknown as PointerEvent;

      engine.handlePointerDown(event);

      expect(setPointerCapture).not.toHaveBeenCalled();
      expect(core.store.state.pointers.has(3)).toBe(false);
      expect(activeTool.handlePointerDown).not.toHaveBeenCalled();
    });

    it('does not run tool logic for cancelled pointers that were never tracked', () => {
      const activeTool = { handlePointerUp: jest.fn() };
      (engine.host as any).hasPointerCapture = jest.fn().mockReturnValue(false);
      (engine.host as any).releasePointerCapture = jest.fn();
      core.cursorManager.resetToDefault = jest.fn();
      core.store.state.activeTool = activeTool;

      engine.handlePointerCancel({ pointerId: 4 } as PointerEvent);

      expect(activeTool.handlePointerUp).not.toHaveBeenCalled();
      expect((engine.viewport as any).handlePointerUp).not.toHaveBeenCalled();
    });

    it('still finishes tracked pointers on cancel', () => {
      const activeTool = { handlePointerUp: jest.fn() };
      (engine.host as any).hasPointerCapture = jest.fn().mockReturnValue(false);
      (engine.host as any).releasePointerCapture = jest.fn();
      core.cursorManager.resetToDefault = jest.fn();
      core.store.state.activeTool = activeTool;
      core.store.state.pointers.set(4, {} as PointerEvent);
      const event = { pointerId: 4 } as PointerEvent;

      engine.handlePointerCancel(event);

      expect(activeTool.handlePointerUp).toHaveBeenCalledWith(event);
    });

    it('leaves activation keys on titlebar controls to the focused control', () => {
      (core.objectTitlebarManager.isControlEvent as jest.Mock).mockReturnValue(true);
      const event = { key: 'Enter', composedPath: () => [engine.host] } as unknown as KeyboardEvent;

      expect((engine as any).shouldHandleGlobalShortcutEvent(event)).toBe(false);
    });

    it('keeps other shortcuts working while a titlebar control has focus', () => {
      (core.objectTitlebarManager.isControlEvent as jest.Mock).mockReturnValue(true);
      const event = { key: 'Delete', composedPath: () => [engine.host] } as unknown as KeyboardEvent;

      expect((engine as any).shouldHandleGlobalShortcutEvent(event)).toBe(true);
    });

    it('excludes titlebars from screenshots', async () => {
      const { toPng } = jest.requireMock('html-to-image');
      (toPng as jest.Mock).mockClear();

      await engine.getScreenshot('png');

      const { filter } = (toPng as jest.Mock).mock.calls[0][1];
      const titlebarLayer = document.createElement('div');
      titlebarLayer.classList.add('object-titlebar-layer');
      expect(filter(titlebarLayer)).toBe(false);
      expect(filter(document.createElement('div'))).toBe(true);
    });

    it('excludes agentic cursors and their selections from screenshots', async () => {
      const { toPng } = jest.requireMock('html-to-image');
      (toPng as jest.Mock).mockClear();

      await engine.getScreenshot('png');

      const { filter } = (toPng as jest.Mock).mock.calls[0][1];
      expect(filter({ tagName: 'UPDRAW-AGENTIC-CURSORS' })).toBe(false);
    });

    it('emits titlebar actions', () => {
      (engine as any).objectTitlebarAction = { emit: jest.fn() };
      const detail = { itemId: 'play', section: 'left', objectId: 'a', objectType: 'UpdrawShape', workspaceId: 'w', anchorRect: {} } as any;

      engine.emitObjectTitlebarAction(detail);

      expect((engine as any).objectTitlebarAction.emit).toHaveBeenCalledWith(detail);
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
        __class__: 'UpdrawPath',
        getSupportedExportFormats: () => ['svg'],
        exportAs: jest.fn(),
      } as any;
      core.store.selectionGroup = { objects: [exportableObject] };

      await expect(engine.canExportSelectedObjectAs('svg')).resolves.toBe(true);
      await expect(engine.canExportSelectedObjectAs('png')).resolves.toBe(false);
    });

    it('exportSelectedObject no-ops when object is not exportable', async () => {
      core.store.selectionGroup = { objects: [{ id: 'a', __class__: 'UpdrawText' }] };
      const createElementSpy = jest.spyOn(document, 'createElement');

      await engine.exportSelectedObject('png');

      expect(createElementSpy).not.toHaveBeenCalled();
      createElementSpy.mockRestore();
    });

    it('exportSelectedObject downloads exported data URL for single exportable object', async () => {
      const exportAs = jest.fn().mockResolvedValue('data:image/png;base64,abc');
      const exportableObject = {
        id: 'a',
        __class__: 'UpdrawImage',
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

      const dynamicObjectObject = withPrototype(UpdrawDynamicObject, {
        id: 'custom-1',
        isInteractive: true,
        isSelected: true,
        mount: jest.fn(),
        unmount: jest.fn(),
        setIsInteractive: jest.fn(),
        hasFocusedInputElement: jest.fn(),
        getEmbeddedContentRoots: jest.fn(() => [embeddedRoot]),
      });

      (core.store.objects.findById as jest.Mock).mockReturnValue(dynamicObjectObject);
      core.store.selectionGroup = { objects: [dynamicObjectObject] };

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

      const createEmbeddedObject = (id: string) =>
        withPrototype(UpdrawDynamicObject, {
          id,
          isInteractive: true,
          isSelected: true,
          mount: jest.fn(),
          unmount: jest.fn(),
          setIsInteractive: jest.fn(),
          hasFocusedInputElement: jest.fn(),
          getEmbeddedContentRoots: jest.fn(() => []),
        });
      const nonSelectedDynamicObject = createEmbeddedObject('custom-2');
      const differentSelectedDynamicObject = createEmbeddedObject('custom-1');
      (core.store.objects.findById as jest.Mock).mockReturnValue(nonSelectedDynamicObject);
      core.store.selectionGroup = { objects: [differentSelectedDynamicObject] };

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

      const dynamicObjectObject = withPrototype(UpdrawDynamicObject, {
        id: 'custom-3',
        isInteractive: true,
        isSelected: true,
        mount: jest.fn(),
        unmount: jest.fn(),
        setIsInteractive: jest.fn(),
        hasFocusedInputElement: jest.fn(),
        getEmbeddedContentRoots: jest.fn(() => [rendererContainer]),
      });

      (core.store.objects.findById as jest.Mock).mockReturnValue(dynamicObjectObject);
      core.store.selectionGroup = { objects: [dynamicObjectObject] };

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

      const dynamicObjectObject = withPrototype(UpdrawDynamicObject, {
        id: 'custom-4',
        isInteractive: true,
        isSelected: true,
        mount: jest.fn(),
        unmount: jest.fn(),
        setIsInteractive: jest.fn(),
        hasFocusedInputElement: jest.fn(),
        getEmbeddedContentRoots: jest.fn(() => [rendererContainer]),
      });

      (core.store.objects.findById as jest.Mock).mockReturnValue(dynamicObjectObject);
      core.store.selectionGroup = { objects: [dynamicObjectObject] };

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
    it('allows both handles when the object config manager allows both', () => {
      const object = {} as UpdrawBaseObject<any>;

      const result = (engine as any).getSelectionHandleCapabilities(object);

      expect(result).toEqual({ canRenderResizeHandles: true, canRenderRotationHandle: true });
      expect(core.objectConfigManager.isResizable).toHaveBeenCalledWith(object);
      expect(core.objectConfigManager.isRotatable).toHaveBeenCalledWith(object);
    });

    it('hides the handles the object config manager forbids', () => {
      core.objectConfigManager.isResizable.mockReturnValue(false);

      const result = (engine as any).getSelectionHandleCapabilities({} as UpdrawBaseObject<any>);

      expect(result).toEqual({ canRenderResizeHandles: false, canRenderRotationHandle: true });
    });
  });

  describe('titlebar title input', () => {
    it('keeps keyboard input in the rename input away from canvas shortcuts', () => {
      const engineCore = (engine as any).core;
      engineCore.objectTitlebarManager.isTitleInputEvent.mockReturnValue(true);
      const event = { key: 'Delete', composedPath: () => [engine.host] } as unknown as KeyboardEvent;

      expect((engine as any).shouldHandleGlobalShortcutEvent(event)).toBe(false);
    });
  });

  describe('objectConfig', () => {
    it('resets warnings and rerenders when the config changes', () => {
      const engineCore = (engine as any).core;
      engineCore.rerender = jest.fn();

      engine.onObjectConfigChange();

      expect(engineCore.objectConfigManager.resetWarnings).toHaveBeenCalled();
      expect(engineCore.objectTitlebarManager.resetWarnings).toHaveBeenCalled();
      expect(engineCore.rerender).toHaveBeenCalled();
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
      await engine.alignObjects(UpdrawAlignment.CenterHorizontal);
      expect(core.alignObjects).toHaveBeenCalledWith(UpdrawAlignment.CenterHorizontal);
    });

    it('group passes explicit objects to core.group and returns the created group', async () => {
      const objects = [{ id: 'a' }, { id: 'b' }] as any[];
      const created = { id: 'group' };
      core.group.mockReturnValue(created);

      await expect(engine.group(objects)).resolves.toBe(created);
      expect(core.group).toHaveBeenCalledWith(objects);
    });

    it('ungroup passes explicit groups to core.ungroup and returns the extracted children', async () => {
      const groups = [{ id: 'g1' }] as any[];
      const children = [{ id: 'a' }, { id: 'b' }];
      core.ungroup.mockReturnValue(children);

      await expect(engine.ungroup(groups)).resolves.toBe(children);
      expect(core.ungroup).toHaveBeenCalledWith(groups);
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
    const createEmbeddedObject = (roots: HTMLElement[]) => ({
      isInteractive: true,
      isSelected: true,
      mount: jest.fn(),
      unmount: jest.fn(),
      setIsInteractive: jest.fn(),
      hasFocusedInputElement: jest.fn(),
      getEmbeddedContentRoots: jest.fn(() => roots),
    });

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
        ...createEmbeddedObject([objectElement]),
        __class__: 'UpdrawDynamicObject',
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
        ...createEmbeddedObject([objectElement]),
        __class__: 'UpdrawDynamicObject',
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
        __class__: 'UpdrawDynamicObject',
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
        __class__: 'UpdrawDynamicObject',
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
        ...createEmbeddedObject([objectElement]),
        __class__: 'UpdrawDynamicObject',
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
        __class__: 'UpdrawDynamicObject',
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
        ...createEmbeddedObject([]),
        __class__: 'UpdrawDynamicObject',
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
        ...createEmbeddedObject([objectElement]),
        __class__: 'UpdrawDynamicObject',
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
        ...createEmbeddedObject([objectElement]),
        __class__: 'UpdrawDynamicObject',
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
        ...createEmbeddedObject([objectElement]),
        __class__: 'UpdrawDynamicObject',
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
        __class__: 'UpdrawDynamicObject',
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
      // Only one menu is open at a time: the context menu closes an open titlebar menu.
      expect(core.objectTitlebarManager.closeMenu).toHaveBeenCalled();
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
      const a: any = { id: 'a', __class__: 'UpdrawText' };
      const b: any = { id: 'b', __class__: 'UpdrawPath' };
      core.store.allNonSelectionObjects = [a, b];

      const result = await engine.findObjects(o => (o as any).__class__ === 'UpdrawText');

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
      const objects = [{ id: 'obj-1' }] as unknown as UpdrawBaseObject[];
      const result = await engine.centerObjects(objects, false);

      expect(engine.viewport.centerFitObjects).toHaveBeenCalledWith(objects, false);
      expect(result).toBe(true);
    });
  });

  describe('workspace management', () => {
    it('setActiveWorkspace initializes a visible workspace and emits activeWorkspaceChange', async () => {
      const workspace = new UpdrawWorkspace({ id: 'w1', name: 'Test' });
      core.getWorkspaces.mockReturnValue([workspace]);
      core.initializeWorkspace.mockImplementation(async (nextWorkspace: UpdrawWorkspace) => {
        core.store.state.activeWorkspace = nextWorkspace;
      });

      await engine.setActiveWorkspace('w1');

      expect(core.beforeWorkspaceChange).toHaveBeenCalledTimes(1);
      expect(core.initializeWorkspace).toHaveBeenCalledWith(workspace, undefined);
      expect((engine as any).activeWorkspaceChange.emit).toHaveBeenCalledWith(workspace);
    });

    it('createWorkspace delegates to core and emits workspacesChange', async () => {
      const workspace = { id: 'w1', name: 'Test' } as UpdrawWorkspace;
      core.store.state.workspaces = [workspace];
      core.getWorkspaces.mockReturnValue([workspace]);

      const result = await engine.createWorkspace(workspace);

      expect(core.createWorkspace).toHaveBeenCalledWith(workspace);
      expect((engine as any).workspacesChange.emit).toHaveBeenCalledWith([workspace]);
      expect(result).toBe(workspace);
    });

    it('updateWorkspace delegates to core and emits workspacesChange', async () => {
      const workspace = { id: 'w1', name: 'Updated' } as UpdrawWorkspace;
      core.store.state.workspaces = [workspace];
      core.getWorkspaces.mockReturnValue([workspace]);

      await engine.updateWorkspace(workspace);

      expect(core.updateWorkspace).toHaveBeenCalledWith(workspace);
      expect((engine as any).workspacesChange.emit).toHaveBeenCalledWith([workspace]);
    });

    it('deleteWorkspace delegates to core and emits workspacesChange', async () => {
      const workspace = { id: 'w1', name: 'Doomed' } as UpdrawWorkspace;
      core.store.state.workspaces = [];
      core.getWorkspaces.mockReturnValue([]);

      await engine.deleteWorkspace(workspace);

      expect(core.deleteWorkspace).toHaveBeenCalledWith(workspace);
      expect((engine as any).workspacesChange.emit).toHaveBeenCalledWith([]);
    });

    it('getWorkspaces returns the list from core', async () => {
      const workspaces = [{ id: 'w1', name: 'A' }] as UpdrawWorkspace[];
      core.getWorkspaces.mockReturnValue(workspaces);

      const result = await engine.getWorkspaces();

      expect(result).toBe(workspaces);
    });

    it('getActiveWorkspace returns the active workspace', async () => {
      const workspace = { id: 'active' } as UpdrawWorkspace;
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

  describe('object elements', () => {
    const createElementAwareObject = (id = 'frame') => ({
      id,
      isElementPicking: false,
      setElementPicking: jest.fn(),
      setElementHighlights: jest.fn(),
      getElementHighlights: jest.fn().mockReturnValue([{ selector: 'p' }]),
      queryElements: jest.fn().mockResolvedValue([{ selector: 'p' }]),
      trackElement: jest.fn(),
      untrackElement: jest.fn(),
      getTrackedElementRect: jest.fn().mockReturnValue(null),
      contentToObjectLocal: jest.fn(),
      refreshElementTheme: jest.fn(),
    });

    it('delegates picking, highlights and queries to the object', async () => {
      const object = createElementAwareObject();
      core.store.objects.findById.mockImplementation((id: string) => (id === 'frame' ? object : null));

      await engine.setObjectElementPicking('frame', true, { selector: 'button' });
      await engine.highlightObjectElements('frame', [{ selector: '#run', label: 'Run' }]);
      await engine.clearObjectElementHighlights('frame');
      const elements = await engine.queryObjectElements('frame', 'p', 3);

      expect(object.setElementPicking).toHaveBeenCalledWith(true, { selector: 'button' });
      expect(object.setElementHighlights).toHaveBeenNthCalledWith(1, [{ selector: '#run', label: 'Run' }]);
      expect(object.setElementHighlights).toHaveBeenNthCalledWith(2, []);
      expect(object.queryElements).toHaveBeenCalledWith('p', 3);
      expect(elements).toEqual([{ selector: 'p' }]);
    });

    it('rejects for missing objects and objects without elements', async () => {
      core.store.objects.findById.mockImplementation((id: string) => (id === 'shape' ? { id: 'shape' } : null));

      await expect(engine.setObjectElementPicking('missing', true)).rejects.toThrow('Object "missing" not found.');
      await expect(engine.highlightObjectElements('shape', [])).rejects.toThrow('Object "shape" has no content elements.');
      await expect(engine.queryObjectElements('shape', 'p')).rejects.toThrow('has no content elements');
    });

    it('clears the highlights of all objects when no object is given', async () => {
      const highlighted = createElementAwareObject('a');
      const plain = createElementAwareObject('b');
      plain.getElementHighlights.mockReturnValue([]);
      core.store.objects.allObjects = jest.fn().mockReturnValue([highlighted, plain, { id: 'shape' }]);

      await engine.clearObjectElementHighlights();

      expect(highlighted.setElementHighlights).toHaveBeenCalledWith([]);
      expect(plain.setElementHighlights).not.toHaveBeenCalled();
    });

    it('refreshes element highlight colors when the theme changes', () => {
      const object = createElementAwareObject();
      core.store.objects.allObjects = jest.fn().mockReturnValue([object, { id: 'shape' }]);

      engine.onThemeChange('dark');

      expect(core.themeManager.setTheme).toHaveBeenCalledWith('dark');
      expect(object.refreshElementTheme).toHaveBeenCalledTimes(1);
    });

    it('emits hover, click and pick events', () => {
      (engine as any).objectElementHover = { emit: jest.fn() };
      (engine as any).objectElementClick = { emit: jest.fn() };
      (engine as any).objectElementPick = { emit: jest.fn() };
      const element = { selector: 'p', tagName: 'p', classList: [], attributes: {}, rect: { x: 0, y: 0, width: 1, height: 1 } };
      const modifiers = { shiftKey: false, ctrlKey: false, altKey: false, metaKey: false };

      engine.emitObjectElementHover({ objectId: 'frame', element, isPicking: false });
      engine.emitObjectElementClick({ objectId: 'frame', element, ...modifiers });
      engine.emitObjectElementPick({ objectId: 'frame', element, ...modifiers });

      expect((engine as any).objectElementHover.emit).toHaveBeenCalledWith({ objectId: 'frame', element, isPicking: false });
      expect((engine as any).objectElementClick.emit).toHaveBeenCalledWith({ objectId: 'frame', element, ...modifiers });
      expect((engine as any).objectElementPick.emit).toHaveBeenCalledWith({ objectId: 'frame', element, ...modifiers });
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

    it('includes the source of agentic changes in object events', () => {
      const source = { type: 'agent' as const, agentId: 'agent', actionType: 'moveObject' as const };
      const objects: any[] = [{ id: 'a' }];
      engine.emitObjectsAdded(objects, source);
      engine.emitObjectsRemoved(objects, source);
      engine.emitObjectsUpdated([{ object: objects[0], changedProperties: [] }], source);

      expect((engine as any).objectsAdded.emit).toHaveBeenCalledWith({ objects, source });
      expect((engine as any).objectsRemoved.emit).toHaveBeenCalledWith({ objects, source });
      expect((engine as any).objectsUpdated.emit).toHaveBeenCalledWith({ objects: [{ object: objects[0], changedProperties: [] }], source });
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
        __class__: 'UpdrawWorkspace',
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

  describe('importing exports made before the rename', () => {
    it('accepts a legacy workspace export and restores its assets', async () => {
      const payload = {
        __class__: 'KritzelWorkspace',
        name: 'Legacy Workspace',
        viewport: { centerWorldX: 0, centerWorldY: 0, scale: 1 },
        objects: [],
        assets: { 'asset-1': 'data:image/png;base64,AA==' },
      };
      jest.spyOn(engine as any, 'dataUrlToBlob').mockResolvedValue(new Blob(['png-bytes'], { type: 'image/png' }));

      await engine.importFromJson(JSON.stringify(payload));

      expect(core.assetResolver.put).toHaveBeenCalledWith(expect.any(Blob), expect.objectContaining({ id: 'asset-1' }));
    });

    it('loads objects from a legacy workspace export into the current workspace', async () => {
      core.store.state.activeWorkspace = { id: 'w1' } as UpdrawWorkspace;

      await expect(engine.loadObjectsFromJson(JSON.stringify({ __class__: 'KritzelWorkspace' }))).resolves.toBe(0);
    });

    it('embeds the assets of legacy images in portable exports', async () => {
      core.assetResolver.fetchBlob = jest.fn().mockResolvedValue(new Blob(['png-bytes'], { type: 'image/png' }));
      jest.spyOn(engine as any, 'blobToDataUrl').mockResolvedValue('data:image/png;base64,AA==');

      const assets = await (engine as any).collectPortableAssets([
        { __class__: 'KritzelImage', assetId: 'legacy-asset' },
        { __class__: 'UpdrawImage', assetId: 'current-asset' },
        { __class__: 'KritzelPath', assetId: 'not-an-image' },
      ]);

      expect(Object.keys(assets).sort()).toEqual(['current-asset', 'legacy-asset']);
    });
  });

  describe('loadObjectsFromJson validation', () => {
    it('throws when no workspace is currently loaded', async () => {
      core.store.state.activeWorkspace = null;
      const json = JSON.stringify({ __class__: 'UpdrawWorkspace', objects: [] });

      await expect(engine.loadObjectsFromJson(json)).rejects.toThrow(
        /no active workspace/,
      );
    });

    it('throws when the JSON is not a workspace export', async () => {
      core.store.state.activeWorkspace = { id: 'w1' } as UpdrawWorkspace;
      const invalid = JSON.stringify({ foo: 'bar' });

      await expect(engine.loadObjectsFromJson(invalid)).rejects.toThrow(
        /Invalid workspace data/,
      );
    });

    it('returns 0 when the export contains no objects array', async () => {
      core.store.state.activeWorkspace = { id: 'w1' } as UpdrawWorkspace;
      const json = JSON.stringify({ __class__: 'UpdrawWorkspace' });

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
      const serialized = { __class__: 'UpdrawWorkspace', id: 'w1', objects: [] };
      core.store.state.activeWorkspace = {
        serialize: jest.fn().mockReturnValue(serialized),
      } as unknown as UpdrawWorkspace;

      const json = await engine.exportAsJson();

      expect(JSON.parse(json)).toEqual({
        ...serialized,
        exportMode: 'portable',
      });
      expect(core.initializeAssetStorage).toHaveBeenCalled();
      expect((core.store.state.activeWorkspace as any).serialize).toHaveBeenCalledWith({ includeObjects: true });
    });

    it('uses lightweight export mode when a remote asset provider exists', async () => {
      const serialized = { __class__: 'UpdrawWorkspace', id: 'w1', objects: [] };
      core.assetResolver.hasRemoteProvider = true;
      core.store.state.activeWorkspace = {
        serialize: jest.fn().mockReturnValue(serialized),
      } as unknown as UpdrawWorkspace;

      const json = await engine.exportAsJson();

      expect(JSON.parse(json)).toEqual({
        ...serialized,
        exportMode: 'lightweight',
      });
      expect(core.assetResolver.fetchBlob).not.toHaveBeenCalled();
    });

    it('embeds image assets for portable exports when no remote provider exists', async () => {
      const serialized = {
        __class__: 'UpdrawWorkspace',
        id: 'w1',
        objects: [
          { __class__: 'UpdrawImage', assetId: 'asset-1' },
          { __class__: 'UpdrawImage', assetId: 'asset-1' },
        ],
      };
      core.assetResolver.hasRemoteProvider = false;
      core.assetResolver.fetchBlob.mockResolvedValue(new Blob(['png-bytes'], { type: 'image/png' }));
      jest
        .spyOn(engine as any, 'blobToDataUrl')
        .mockResolvedValue('data:image/png;base64,cG5nLWJ5dGVz');
      core.store.state.activeWorkspace = {
        serialize: jest.fn().mockReturnValue(serialized),
      } as unknown as UpdrawWorkspace;

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

      const eraserTool = new MockUpdrawEraserTool();
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

      const selectionTool = new MockUpdrawSelectionTool();
      invokeHandler(selectionTool);

      expect(core.clearSelection).not.toHaveBeenCalled();
      expect(core.store.setSelectionBox).not.toHaveBeenCalled();
      expect(core.store.state.isSelecting).toBe(true);
    });

    it('resets active text when switching to a non-text tool', () => {
      const eraserTool = new MockUpdrawEraserTool();
      invokeHandler(eraserTool);

      expect(core.resetActiveText).toHaveBeenCalledTimes(1);
    });

    it('does not reset active text when switching to the text tool', () => {
      const textTool = new MockUpdrawTextTool();
      invokeHandler(textTool);

      expect(core.resetActiveText).not.toHaveBeenCalled();
    });

    it('resets active shape when switching to a non-shape tool', () => {
      const eraserTool = new MockUpdrawEraserTool();
      invokeHandler(eraserTool);

      expect(core.resetActiveShape).toHaveBeenCalledTimes(1);
    });

    it('does not reset active shape when switching to the shape tool', () => {
      const shapeTool = new MockUpdrawShapeTool();
      invokeHandler(shapeTool);

      expect(core.resetActiveShape).not.toHaveBeenCalled();
    });

    it('resets transient flags and rerenders', () => {
      core.store.state.skipContextMenu = true;

      const eraserTool = new MockUpdrawEraserTool();
      invokeHandler(eraserTool);

      expect(core.store.state.skipContextMenu).toBe(false);
      expect(core.rerender).toHaveBeenCalledTimes(1);
    });

    it('emits activeToolChange when a tool is provided', () => {
      const eraserTool = new MockUpdrawEraserTool();
      invokeHandler(eraserTool);

      expect((engine as any).activeToolChange.emit).toHaveBeenCalledWith(eraserTool);
    });

    it('does not emit activeToolChange when the new tool is null', () => {
      invokeHandler(null);

      expect((engine as any).activeToolChange.emit).not.toHaveBeenCalled();
    });
  });

  describe('registerTool', () => {
    it('registers declarative tools and exposes them through getTool', async () => {
      const registeredTool = { name: 'custom' };
      (core.toolRegistry.hasTool as jest.Mock).mockReturnValue(false);
      (core.toolRegistry.registerTool as jest.Mock).mockReturnValue(registeredTool);

      class CustomTool extends MockUpdrawBaseTool {}
      engine.tools = [{ name: 'custom', tool: CustomTool as unknown as typeof engine.tools[number]['tool'] }];
      (engine as any)._toolsRevision++;

      await (engine as any).registerConfiguredTools();

      expect(core.toolRegistry.registerTool).toHaveBeenCalledWith('custom', CustomTool);
      (core.toolRegistry.getTool as jest.Mock).mockReturnValue(registeredTool);
      await expect(engine.getTool('custom')).resolves.toBe(registeredTool);
    });

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
      // (dual-package hazard): does not extend the local UpdrawBaseTool but
      // identifies itself via the toolType discriminator.
      class ForeignSelectionTool {
        toolType = 'selection';
      }
      const result = await engine.registerTool('selection', ForeignSelectionTool, undefined);

      expect(core.toolRegistry.registerTool).toHaveBeenCalledWith('selection', MockUpdrawSelectionTool);
      expect(result).toBe(newTool);
    });

    it('registers a tool class extending the local base tool as-is', async () => {
      const newTool = { name: 'custom' };
      (core.toolRegistry.hasTool as jest.Mock).mockReturnValue(false);
      (core.toolRegistry.registerTool as jest.Mock).mockReturnValue(newTool);

      class LocalCustomTool extends MockUpdrawBaseTool {
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
      core.store.state.activeWorkspace = { id: 'ws1' } as UpdrawWorkspace;
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

    it('addObject calls prepareForInsert for UpdrawImage objects', async () => {
      const imageObject = withPrototype(UpdrawImage, {
        ...makeObject(1),
        prepareForInsert: jest.fn().mockResolvedValue(undefined),
      });

      await engine.addObject(imageObject as any);

      expect(imageObject.prepareForInsert).toHaveBeenCalledTimes(1);
    });

    it('addObjects calls prepareForInsert for each UpdrawImage object before transaction insert', async () => {
      const a = withPrototype(UpdrawImage, {
        ...makeObject(1),
        prepareForInsert: jest.fn().mockResolvedValue(undefined),
      });
      const b = withPrototype(UpdrawImage, {
        ...makeObject(2),
        prepareForInsert: jest.fn().mockResolvedValue(undefined),
      });

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
      core.store.state.activeWorkspace = { id: 'ws1' } as UpdrawWorkspace;
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

  describe('addObject / addObjects insertion', () => {
    const makeObject = (id: string): any => ({
      id,
      scale: 1,
      workspaceId: '',
      zIndex: 0,
      _core: null,
      generateId: jest.fn().mockReturnValue(id),
    });

    beforeEach(() => {
      core.store.state.activeWorkspace = { id: 'ws1' } as UpdrawWorkspace;
      jest.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(cb => { cb(0); return 0; });
    });

    it('addObject prepares and inserts the object through the core', async () => {
      const object = makeObject('a');

      await engine.addObject(object);

      expect(core.prepareObjectForInsert).toHaveBeenCalledWith(object);
      expect(core.insertPreparedObject).toHaveBeenCalledWith(object, []);
      expect(core.deselectAllObjects).toHaveBeenCalled();
    });

    it('addObjects prepares and inserts every object inside one transaction', async () => {
      const a = makeObject('a');
      const b = makeObject('b');
      let inTransaction = false;
      core.store.objects.transaction = jest.fn((callback: () => void) => {
        inTransaction = true;
        callback();
        inTransaction = false;
      });
      const insertedInTransaction: boolean[] = [];
      core.insertPreparedObject.mockImplementation(() => insertedInTransaction.push(inTransaction));

      await engine.addObjects([a, b]);

      expect(core.store.objects.transaction).toHaveBeenCalledTimes(1);
      expect(core.prepareObjectForInsert.mock.calls.map((call: any[]) => call[0])).toEqual([a, b]);
      expect(insertedInTransaction).toEqual([true, true]);
    });

    it('addObjects staggers the appear animation of its objects in their order', async () => {
      const objects = [makeObject('a'), makeObject('b'), makeObject('c')];

      await engine.addObjects(objects);

      expect(core.insertPreparedObject.mock.calls.map((call: any[]) => call[2])).toEqual([0, 1, 2]);
    });

    it('addObjects skips the appear animation for big batches', async () => {
      const objects = Array.from({ length: UPDRAW_OBJECT_APPEAR_MAX_BATCH + 1 }, (_, index) => makeObject(`o${index}`));

      await engine.addObjects(objects);

      expect(core.insertPreparedObject.mock.calls.every((call: any[]) => call[2] === null)).toBe(true);
    });
  });

  describe('agents', () => {
    it('delegates addAgent, removeAgent, getAgent and getAgents to the agent manager', async () => {
      const agent = { id: 'planner' } as any;
      const remote = [{ id: 'writer', kind: 'agent', isRemote: true, clientId: 2 }];
      core.agentManager.get.mockReturnValue(agent);
      core.agentManager.getAll.mockReturnValue([agent]);
      core.remoteAgentManager.getPresences.mockReturnValue(remote);

      await expect(engine.addAgent(agent)).resolves.toBe(agent);
      await expect(engine.removeAgent('planner')).resolves.toBe(true);
      await expect(engine.getAgent('planner')).resolves.toBe(agent);
      await expect(engine.getAgents()).resolves.toEqual([agent]);
      await expect(engine.getRemoteAgents()).resolves.toEqual(remote);
      expect(core.agentManager.add).toHaveBeenCalledWith(agent);
      expect(core.agentManager.remove).toHaveBeenCalledWith('planner');
    });

    it('emits agentsChange with local agents first, then remote ones, when either manager changes', () => {
      const presences = [{ id: 'planner', kind: 'agent', isRemote: false }];
      const remote = [{ id: 'writer', kind: 'agent', isRemote: true, clientId: 2 }];
      core.agentManager.getPresences.mockReturnValue(presences);
      core.remoteAgentManager.getPresences.mockReturnValue(remote);

      core.agentManager.onChange.mock.calls[0][0]();
      core.remoteAgentManager.onChange.mock.calls[0][0]();

      const emit = (engine as any).agentsChange.emit as jest.Mock;
      expect(emit).toHaveBeenCalledTimes(2);
      expect(emit).toHaveBeenLastCalledWith({ agents: [...presences, ...remote] });
    });

    it('stops agent actions before tearing down objects on disconnect, and frees its agents', () => {
      core.store.objects.destroy = core.store.objects.destroy ?? jest.fn();
      engine.disconnectedCallback();

      const cleanupOrder = (core.agenticActionManager.cleanup as jest.Mock).mock.invocationCallOrder[0];
      const destroyOrder = (core.store.objects.destroy as jest.Mock).mock.invocationCallOrder[0];
      expect(cleanupOrder).toBeLessThan(destroyOrder);
      expect(core.agentManager.setDisposed).toHaveBeenLastCalledWith(true);
      // Collaborators stop seeing this editor's agents, and its remote agents are forgotten.
      expect(core.agentBroadcaster.clear).toHaveBeenCalled();
      expect(core.remoteAgentManager.clear).toHaveBeenCalled();

      engine.connectedCallback();
      expect(core.agentManager.setDisposed).toHaveBeenLastCalledWith(false);
    });
  });

  describe('loading placeholder', () => {
    type VNode = { $tag$?: unknown; $attrs$?: Record<string, any> | null; $children$?: VNode[] | null };

    /** Depth-first search through a rendered Stencil vnode tree. */
    const findVNodes = (node: VNode | null | undefined, predicate: (node: VNode) => boolean): VNode[] => {
      if (!node) {
        return [];
      }
      const own = predicate(node) ? [node] : [];
      return own.concat(...(node.$children$ ?? []).map(child => findVNodes(child, predicate)));
    };

    const hasClass = (node: VNode, className: string) =>
      typeof node.$attrs$?.class === 'string' && node.$attrs$.class.split(/\s+/).includes(className);

    /** The object's `.object` wrapper in the rendered tree. */
    const renderObjectWrapper = (object: UpdrawBaseObject): VNode => {
      const wrappers = findVNodes(engine.render() as VNode, node => hasClass(node, 'object') && node.$attrs$?.id === object.id);
      expect(wrappers).toHaveLength(1);
      return wrappers[0];
    };

    const findPlaceholders = (node: VNode) => findVNodes(node, child => hasClass(child, 'updraw-loading-placeholder'));

    let object: UpdrawBaseObject;

    beforeEach(() => {
      // The parts of the core that render() reads but no other test needs.
      Object.assign(core.objectTitlebarManager, {
        getMetrics: jest.fn().mockReturnValue({}),
        getCullingPadding: jest.fn().mockReturnValue(0),
        resolveTitlebars: jest.fn().mockReturnValue([]),
        getRotationHandleDistance: jest.fn().mockReturnValue(0),
      });
      core.cursorManager.applyCursor = jest.fn();
      Object.assign(core.anchorManager, {
        getSnapIndicatorRenderData: jest.fn().mockReturnValue(null),
        getSnapPreviewRenderData: jest.fn().mockReturnValue(null),
        getAnchorLinesRenderData: jest.fn().mockReturnValue(null),
      });
      // The engine holds a shallow copy of the mock core, so top-level members go onto the engine's instance.
      Object.assign((engine as any).core, {
        displaySelectionGroupUI: jest.fn().mockReturnValue(false),
        displaySelectionLineUI: jest.fn().mockReturnValue(false),
        user: { id: 'user-1' },
        localizationManager: { translate: jest.fn((key: string) => key) },
      });
      core.store.objects.update = jest.fn();

      object = new UpdrawBaseObject();
      object.id = 'object-1';
      object.width = 200;
      object.height = 120;
      object.padding = 4;
      object._core = core;
      core.store.getObjectsInViewport = jest.fn().mockReturnValue([object]);
    });

    it('is not rendered by default', () => {
      expect(object.isLoading).toBe(false);
      expect(findPlaceholders(renderObjectWrapper(object))).toHaveLength(0);
    });

    it('covers the whole object inside its wrapper while the object is loading', () => {
      object.setLoading(true);

      const placeholders = findPlaceholders(renderObjectWrapper(object));
      expect(placeholders).toHaveLength(1);
      expect(placeholders[0].$attrs$?.['data-testid']).toBe('updraw-loading-placeholder');
      expect(placeholders[0].$attrs$?.style).toEqual(
        expect.objectContaining({
          width: `${object.totalWidth}px`,
          height: `${object.totalHeight}px`,
          pointerEvents: 'auto',
        }),
      );
      expect(core.store.objects.update).toHaveBeenCalledWith(object);
      expect(core.rerender).toHaveBeenCalled();
    });

    it('follows the rotation of the object', () => {
      object.rotation = Math.PI / 4;
      object.setLoading(true);

      const [placeholder] = findPlaceholders(renderObjectWrapper(object));
      expect(placeholder.$attrs$?.style).toEqual(
        expect.objectContaining({
          transform: `rotate(${object.rotationDegrees}deg)`,
          transformOrigin: `${object.totalWidth / 2}px ${object.totalHeight / 2}px`,
        }),
      );
    });

    it('disappears once loading is turned off', () => {
      object.setLoading(true);
      expect(findPlaceholders(renderObjectWrapper(object))).toHaveLength(1);

      object.setLoading(false);

      expect(findPlaceholders(renderObjectWrapper(object))).toHaveLength(0);
    });
  });

  describe('card objects', () => {
    type VNode = { $attrs$?: Record<string, any> | null; $children$?: VNode[] | null };
    const findVNodes = (node: VNode | null | undefined, predicate: (node: VNode) => boolean): VNode[] =>
      !node ? [] : (predicate(node) ? [node] : []).concat(...(node.$children$ ?? []).map(child => findVNodes(child, predicate)));
    const classes = (node: VNode) => (typeof node.$attrs$?.class === 'string' ? node.$attrs$.class.split(/\s+/) : []);

    /** The container (`.object`) of an object, and the element with `className` inside it. */
    const renderParts = (object: UpdrawBaseObject<any>, className: string) => {
      core.store.getObjectsInViewport = jest.fn().mockReturnValue([object]);
      const [container] = findVNodes(engine.render() as VNode, node => classes(node).includes('object') && node.$attrs$?.id === object.id);
      const [card] = findVNodes(container, node => classes(node).includes(className));
      return { container, card };
    };

    beforeEach(() => {
      Object.assign(core.objectTitlebarManager, {
        getMetrics: jest.fn().mockReturnValue({}),
        getCullingPadding: jest.fn().mockReturnValue(0),
        resolveTitlebars: jest.fn().mockReturnValue([]),
        getRotationHandleDistance: jest.fn().mockReturnValue(0),
      });
      core.cursorManager.applyCursor = jest.fn();
      Object.assign(core.anchorManager, {
        getSnapIndicatorRenderData: jest.fn().mockReturnValue(null),
        getSnapPreviewRenderData: jest.fn().mockReturnValue(null),
        getAnchorLinesRenderData: jest.fn().mockReturnValue(null),
      });
      Object.assign((engine as any).core, {
        displaySelectionGroupUI: jest.fn().mockReturnValue(false),
        displaySelectionLineUI: jest.fn().mockReturnValue(false),
        user: { id: 'user-1' },
        localizationManager: { translate: jest.fn((key: string) => key) },
      });
    });

    it('uses the theme radius unless the object sets its own, as a variable its content can read', () => {
      const themed = new UpdrawIframeObject({ width: 200, height: 120 });
      themed.id = 'iframe-1';
      const themedParts = renderParts(themed, 'updraw-iframe-object');
      expect(classes(themedParts.container)).toContain('object--iframe');
      expect(themedParts.container.$attrs$?.style).not.toHaveProperty('--updraw-content-border-radius');

      const own = new UpdrawIframeObject({ width: 200, height: 120, borderRadius: 20 });
      own.id = 'iframe-2';
      expect(renderParts(own, 'updraw-iframe-object').container.$attrs$?.style).toEqual(
        expect.objectContaining({ '--updraw-content-border-radius': '20px' }),
      );
    });

    it('clips the content of a dynamic object to its box unless clipContent is off', () => {
      const clipped = new UpdrawDynamicObject({ width: 200, height: 120, borderRadius: '1rem' });
      clipped.id = 'dynamic-1';
      const parts = renderParts(clipped, 'updraw-dynamic-object');
      expect(classes(parts.container)).toContain('object--dynamic-object');
      expect(parts.container.$attrs$?.style).toEqual(expect.objectContaining({ '--updraw-content-border-radius': '1rem' }));
      // No inline overflow: the stylesheet clips.
      expect(parts.card.$attrs$?.style?.overflow).toBeUndefined();

      const overflowing = new UpdrawDynamicObject({ width: 200, height: 120, clipContent: false });
      overflowing.id = 'dynamic-2';
      expect(renderParts(overflowing, 'updraw-dynamic-object').card.$attrs$?.style?.overflow).toBe('visible');
    });

    it('lets an image set its own radius, falling back to the theme image radius', () => {
      const themed = new UpdrawImage({ width: 200, height: 120 });
      themed.id = 'image-1';
      const themedContainer = renderParts(themed, 'updraw-image-placeholder').container;
      expect(classes(themedContainer)).toContain('object--image');
      expect(themedContainer.$attrs$?.style).not.toHaveProperty('--updraw-content-border-radius');

      const own = new UpdrawImage({ width: 200, height: 120, borderRadius: 16 });
      own.id = 'image-2';
      expect(renderParts(own, 'updraw-image-object').container.$attrs$?.style).toEqual(
        expect.objectContaining({ '--updraw-content-border-radius': '16px' }),
      );
    });

    describe('appear animation', () => {
      afterEach(() => {
        core.objectAppearManager.clear();
        jest.restoreAllMocks();
      });

      /** Shows a titlebar for the given owners. */
      const withTitlebars = (...ownerIds: string[]) => {
        Object.assign(core.objectTitlebarManager, {
          isEnabled: true,
          resolveTitlebars: jest.fn().mockReturnValue(ownerIds.map(id => ({ owner: { id } }))),
        });
      };
      const renderTitlebarLayer = () => findVNodes(engine.render() as VNode, node => node.$attrs$?.appearingOwners instanceof Map)[0];

      it('plays on objects marked by an insert, with their stagger index, also on their titlebars', () => {
        withTitlebars('image-appear');
        const image = new UpdrawImage({ width: 200, height: 120 });
        image.id = 'image-appear';
        core.objectAppearManager.mark([image], 2);

        const { container } = renderParts(image, 'updraw-image-placeholder');
        expect(classes(container)).toContain('object--appearing');
        expect(container.$attrs$?.style).toEqual(expect.objectContaining({ '--updraw-object-appear-index': '2' }));

        expect(renderTitlebarLayer()?.$attrs$?.appearingOwners.get('image-appear')).toBe(2);
      });

      it('hides the titlebar of an object waiting to appear, then lets it appear with the object', () => {
        withTitlebars('iframe-waiting');
        const iframe = new UpdrawIframeObject({ width: 200, height: 120 });
        iframe.id = 'iframe-waiting';
        core.objectAppearManager.mark([iframe]);
        core.store.getObjectsInViewport = jest.fn().mockReturnValue([iframe]);

        const waiting = renderTitlebarLayer();
        expect(waiting?.$attrs$?.titlebars).toEqual([]);

        Object.defineProperty(iframe, 'isDocumentLoaded', { get: () => true });
        const appearing = renderTitlebarLayer();
        expect(appearing?.$attrs$?.titlebars).toEqual([{ owner: { id: 'iframe-waiting' } }]);
        expect(appearing?.$attrs$?.appearingOwners.get('iframe-waiting')).toBe(0);
      });

      it('shows a titlebar that comes up while its object appears at once, without the animation', () => {
        withTitlebars();
        const image = new UpdrawImage({ width: 200, height: 120 });
        image.id = 'image-late-titlebar';
        core.objectAppearManager.mark([image]);
        core.store.getObjectsInViewport = jest.fn().mockReturnValue([image]);
        renderTitlebarLayer();

        withTitlebars('image-late-titlebar');
        const layer = renderTitlebarLayer();
        expect(layer?.$attrs$?.titlebars).toHaveLength(1);
        expect(layer?.$attrs$?.appearingOwners.has('image-late-titlebar')).toBe(false);
      });

      it('lets a group appear once its children can', () => {
        const iframe = new UpdrawIframeObject({ width: 200, height: 120 });
        const group = withPrototype(MockUpdrawGroup, { isLoading: false, children: [iframe] });
        expect((engine as any).isReadyToAppear(group)).toBe(false);

        Object.defineProperty(iframe, 'isDocumentLoaded', { get: () => true });
        expect((engine as any).isReadyToAppear(group)).toBe(true);
      });

      it('does not play on objects that were not marked', () => {
        const image = new UpdrawImage({ width: 200, height: 120 });
        image.id = 'image-plain';

        const { container } = renderParts(image, 'updraw-image-placeholder');
        expect(classes(container)).not.toContain('object--appearing');
        expect(container.$attrs$?.style).not.toHaveProperty('--updraw-object-appear-index');
      });

      it('waits for an iframe to load, unless it shows its loading placeholder', () => {
        const iframe = new UpdrawIframeObject({ width: 200, height: 120 });
        iframe.id = 'iframe-appear';
        core.objectAppearManager.mark([iframe]);
        expect(classes(renderParts(iframe, 'updraw-iframe-object').container)).not.toContain('object--appearing');

        Object.defineProperty(iframe, 'isDocumentLoaded', { get: () => true });
        expect(classes(renderParts(iframe, 'updraw-iframe-object').container)).toContain('object--appearing');

        const placeholder = new UpdrawIframeObject({ width: 200, height: 120 });
        placeholder.id = 'iframe-placeholder';
        placeholder.isLoading = true;
        core.objectAppearManager.mark([placeholder]);
        expect(classes(renderParts(placeholder, 'updraw-iframe-object').container)).toContain('object--appearing');
      });

      it('does not play when the theme sets a zero duration', () => {
        const computed = window.getComputedStyle(engine.host);
        jest.spyOn(window, 'getComputedStyle').mockReturnValue({
          getPropertyValue: (name: string) => (name === '--updraw-object-appear-animation-duration' ? ' 0s' : computed.getPropertyValue(name)),
        } as CSSStyleDeclaration);
        const image = new UpdrawImage({ width: 200, height: 120 });
        image.id = 'image-off';
        core.objectAppearManager.mark([image]);

        expect(classes(renderParts(image, 'updraw-image-placeholder').container)).not.toContain('object--appearing');
        expect(core.objectAppearManager.has('image-off')).toBe(false);
      });
    });

    it('gives other objects no card radius', () => {
      const plain = new UpdrawBaseObject();
      plain.id = 'plain-1';
      core.store.getObjectsInViewport = jest.fn().mockReturnValue([plain]);
      const [container] = findVNodes(engine.render() as VNode, node => node.$attrs$?.id === plain.id);
      expect(classes(container)).toEqual(['object']);
      expect(container.$attrs$?.style).not.toHaveProperty('--updraw-content-border-radius');
    });
  });
});
