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
    createWorkspace: jest.fn().mockResolvedValue(undefined),
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
        transaction: jest.fn().mockImplementation((cb: () => void) => cb()),
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
      'notificationsChange',
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

  describe('embedded custom element interaction', () => {
    it('bypasses engine pointer handling for selected interactive custom elements', () => {
      const objectElement = document.createElement('div');
      objectElement.id = 'custom-1';
      objectElement.classList.add('object');

      const customElementObject = { id: 'custom-1', isInteractive: true } as any;
      (core.store.objects.findById as jest.Mock).mockReturnValue(customElementObject);
      core.store.selectionGroup = { objects: [customElementObject] };
      (KritzelClassHelper.isInstanceOf as unknown as jest.Mock).mockImplementation((obj: unknown, className: string) => {
        return obj === customElementObject && className === 'KritzelCustomElement';
      });

      const activeTool = { handlePointerDown: jest.fn() };
      core.store.state.activeTool = activeTool;

      const setPointerCapture = jest.fn();
      (engine.host as any).setPointerCapture = setPointerCapture;

      const event = {
        pointerId: 7,
        composedPath: jest.fn().mockReturnValue([document.createElement('button'), objectElement]),
      } as unknown as PointerEvent;

      engine.handlePointerDown(event);

      expect(setPointerCapture).not.toHaveBeenCalled();
      expect(core.store.state.pointers.has(7)).toBe(false);
      expect((engine.viewport as any).handlePointerDown).not.toHaveBeenCalled();
      expect(activeTool.handlePointerDown).not.toHaveBeenCalled();
    });

    it('keeps default pointer handling for unselected interactive custom elements', () => {
      const objectElement = document.createElement('div');
      objectElement.id = 'custom-2';
      objectElement.classList.add('object');

      const nonSelectedCustomElement = { id: 'custom-2', isInteractive: true } as any;
      const differentSelectedCustomElement = { id: 'custom-1', isInteractive: true } as any;
      (core.store.objects.findById as jest.Mock).mockReturnValue(nonSelectedCustomElement);
      core.store.selectionGroup = { objects: [differentSelectedCustomElement] };
      (KritzelClassHelper.isInstanceOf as unknown as jest.Mock).mockImplementation((obj: unknown, className: string) => {
        return (obj === nonSelectedCustomElement || obj === differentSelectedCustomElement) && className === 'KritzelCustomElement';
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

  describe('wheel interaction gating', () => {
    const createWheelEvent = (overrides: Partial<WheelEvent> = {}): WheelEvent =>
      ({
        ctrlKey: false,
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

    it('keeps wheel handling in hovered custom element while it can still scroll down', () => {
      const activeTool = { handleWheel: jest.fn() } as any;
      core.store.state.activeTool = activeTool;

      const scrollHost = document.createElement('div');
      Object.defineProperty(scrollHost, 'scrollHeight', { value: 300, configurable: true });
      Object.defineProperty(scrollHost, 'clientHeight', { value: 100, configurable: true });
      scrollHost.scrollTop = 50;

      const objectElement = document.createElement('div');
      objectElement.appendChild(scrollHost);

      const hoveredCustomElement = {
        __class__: 'KritzelCustomElement',
        elementRef: objectElement,
      } as any;

      (core.getObjectFromPointerEvent as jest.Mock).mockReturnValue(hoveredCustomElement);

      engine.handleWheel(createWheelEvent({ deltaY: 10 }));

      expect(engine.viewport.handleWheel).not.toHaveBeenCalled();
      expect(activeTool.handleWheel).not.toHaveBeenCalled();
    });

    it('keeps wheel handling inside hovered custom element even at bottom edge', () => {
      const activeTool = { handleWheel: jest.fn() } as any;
      core.store.state.activeTool = activeTool;
      engine.isPanningEnabled = true;

      const scrollHost = document.createElement('div');
      Object.defineProperty(scrollHost, 'scrollHeight', { value: 300, configurable: true });
      Object.defineProperty(scrollHost, 'clientHeight', { value: 100, configurable: true });
      scrollHost.scrollTop = 200;

      const objectElement = document.createElement('div');
      objectElement.appendChild(scrollHost);

      const hoveredCustomElement = {
        __class__: 'KritzelCustomElement',
        elementRef: objectElement,
      } as any;

      (core.getObjectFromPointerEvent as jest.Mock).mockReturnValue(hoveredCustomElement);

      engine.handleWheel(createWheelEvent({ deltaY: 10 }));

      expect(engine.viewport.handleWheel).not.toHaveBeenCalled();
      expect(activeTool.handleWheel).not.toHaveBeenCalled();
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

      const hoveredCustomElement = {
        __class__: 'KritzelCustomElement',
        elmeentRef: typoRefContainer,
      } as any;

      (core.getObjectFromPointerEvent as jest.Mock).mockReturnValue(hoveredCustomElement);

      engine.handleWheel(createWheelEvent({ deltaY: -5 }));

      expect(engine.viewport.handleWheel).not.toHaveBeenCalled();
      expect(activeTool.handleWheel).not.toHaveBeenCalled();
    });

    it('keeps wheel handling in hovered custom element while it can still scroll right', () => {
      const activeTool = { handleWheel: jest.fn() } as any;
      core.store.state.activeTool = activeTool;

      const scrollHost = document.createElement('div');
      Object.defineProperty(scrollHost, 'scrollWidth', { value: 300, configurable: true });
      Object.defineProperty(scrollHost, 'clientWidth', { value: 100, configurable: true });
      scrollHost.scrollLeft = 40;

      const objectElement = document.createElement('div');
      objectElement.appendChild(scrollHost);

      const hoveredCustomElement = {
        __class__: 'KritzelCustomElement',
        elementRef: objectElement,
      } as any;

      (core.getObjectFromPointerEvent as jest.Mock).mockReturnValue(hoveredCustomElement);

      engine.handleWheel(createWheelEvent({ deltaX: 12, deltaY: 0 }));

      expect(engine.viewport.handleWheel).not.toHaveBeenCalled();
      expect(activeTool.handleWheel).not.toHaveBeenCalled();
    });

    it('keeps wheel handling inside hovered custom element at horizontal edge', () => {
      const activeTool = { handleWheel: jest.fn() } as any;
      core.store.state.activeTool = activeTool;
      engine.isPanningEnabled = true;

      const scrollHost = document.createElement('div');
      Object.defineProperty(scrollHost, 'scrollWidth', { value: 300, configurable: true });
      Object.defineProperty(scrollHost, 'clientWidth', { value: 100, configurable: true });
      scrollHost.scrollLeft = 200;

      const objectElement = document.createElement('div');
      objectElement.appendChild(scrollHost);

      const hoveredCustomElement = {
        __class__: 'KritzelCustomElement',
        elementRef: objectElement,
      } as any;

      (core.getObjectFromPointerEvent as jest.Mock).mockReturnValue(hoveredCustomElement);

      engine.handleWheel(createWheelEvent({ deltaX: 12, deltaY: 0 }));

      expect(engine.viewport.handleWheel).not.toHaveBeenCalled();
      expect(activeTool.handleWheel).not.toHaveBeenCalled();
    });
  });

  describe('object distance fading', () => {
    const computeFade = (objectScale = 1, viewportScale = 1) =>
      (engine as any).getObjectDistanceFadeMultiplier(objectScale, viewportScale);

    it('returns 1 when fading is disabled', () => {
      engine.isObjectDistanceFadingActive = false;

      expect(computeFade(5.8, 0.1)).toBe(1);
    });

    it('returns 1 at or above near scale threshold', () => {
      engine.isObjectDistanceFadingActive = true;

      expect(computeFade(1, 1)).toBe(1);
      expect(computeFade(1, 2)).toBe(1);
    });

    it('returns minimum opacity multiplier beyond far-distance threshold', () => {
      engine.isObjectDistanceFadingActive = true;

      expect(computeFade(1, 0.01)).toBeCloseTo(0, 6);
    });

    it('interpolates smoothly between near and far scales', () => {
      engine.isObjectDistanceFadingActive = true;

      const midFade = computeFade(1, 0.5);

      expect(midFade).toBeGreaterThan(0);
      expect(midFade).toBeLessThan(1);
    });

    it('fades more when zoomed out and less when zoomed in', () => {
      engine.isObjectDistanceFadingActive = true;

      const fadeAtSmallScale = computeFade(1, 0.2);
      const fadeAtLargeScale = computeFade(1, 2.0);

      expect(fadeAtSmallScale).toBeLessThan(fadeAtLargeScale);
    });

    it('fades high-scale objects earlier than low-scale objects at the same viewport scale', () => {
      engine.isObjectDistanceFadingActive = true;

      const viewportScale = 0.8;
      const lowScaleObjectFade = computeFade(0.5, viewportScale);
      const highScaleObjectFade = computeFade(2, viewportScale);

      expect(lowScaleObjectFade).toBeGreaterThan(highScaleObjectFade);
    });

    it('rerenders when isObjectDistanceFadingActive changes', () => {
      (engine as any).onIsObjectDistanceFadingActiveChange();

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

    it('centerObjects delegates to viewport.centerFitObjects', async () => {
      const objects = [{ id: 'obj-1' }] as unknown as KritzelBaseObject[];
      const result = await engine.centerObjects(objects, false);

      expect(engine.viewport.centerFitObjects).toHaveBeenCalledWith(objects, false);
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

    it('resolves palettes map into palette for brush tool config', async () => {
      const newTool: any = { name: 'pen', palette: [] };
      (core.toolRegistry.hasTool as jest.Mock).mockReturnValue(false);
      (core.toolRegistry.registerTool as jest.Mock).mockReturnValue(newTool);

      class FakeBrushTool {}
      const customPalette = [{ light: '#ff0000', dark: '#ff0000' }];
      const config = { type: 'pen', color: customPalette[0], size: 6, palettes: { pen: customPalette } } as any;
      await engine.registerTool('pen', FakeBrushTool, config);

      expect(newTool.palette).toBe(customPalette);
    });

    it('resolves palettes map into palette for existing brush tool', async () => {
      const existingTool: any = { name: 'pen', palette: [{ light: '#000', dark: '#fff' }] };
      (core.toolRegistry.hasTool as jest.Mock).mockReturnValue(true);
      (core.toolRegistry.getTool as jest.Mock).mockReturnValue(existingTool);

      class FakeBrushTool {}
      const customPalette = [{ light: '#ff0000', dark: '#ff0000' }];
      const config = { type: 'pen', color: customPalette[0], size: 6, palettes: { pen: customPalette } } as any;
      await engine.registerTool('pen', FakeBrushTool, config);

      expect(existingTool.palette).toBe(customPalette);
    });

    it('resolves sizes map into sizes for brush tool config', async () => {
      const newTool: any = { name: 'pen', sizes: [] };
      (core.toolRegistry.hasTool as jest.Mock).mockReturnValue(false);
      (core.toolRegistry.registerTool as jest.Mock).mockReturnValue(newTool);

      class FakeBrushTool {}
      const customSizes = [2, 4, 8];
      const config = { type: 'pen', color: { light: '#000', dark: '#fff' }, size: 6, palettes: { pen: [] }, sizes: { pen: customSizes } } as any;
      await engine.registerTool('pen', FakeBrushTool, config);

      expect(newTool.sizes).toBe(customSizes);
    });

    it('resolves sizes map into sizes for existing brush tool', async () => {
      const existingTool: any = { name: 'pen', sizes: [4, 6, 8, 12, 16, 24] };
      (core.toolRegistry.hasTool as jest.Mock).mockReturnValue(true);
      (core.toolRegistry.getTool as jest.Mock).mockReturnValue(existingTool);

      class FakeBrushTool {}
      const customSizes = [1, 2, 4];
      const config = { type: 'pen', color: { light: '#000', dark: '#fff' }, size: 4, palettes: { pen: [] }, sizes: { pen: customSizes } } as any;
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
