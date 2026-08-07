import { KritzelEditor } from './kritzel-editor';
import { KritzelBaseObject } from '../../../classes/objects/base-object.class';
import { KritzelFontRegistry } from '../../../classes/registries/font-registry.class';
import { KritzelKeyboardHelper } from '../../../helpers/keyboard.helper';
import { DEFAULT_TEXT_TOOL_AVAILABLE_FONTS } from '../../../constants/text-tool-fonts.constants';

// Simple mock for decorators
jest.mock('@stencil/core', () => ({
  ...jest.requireActual('@stencil/core/internal/testing'),
  Component: () => (cls: any) => cls,
  Prop: () => () => {},
  State: () => () => {},
  Watch: () => () => {},
  Event: () => () => {},
  Method: () => () => {},
  Listen: () => () => {},
  Element: () => () => {},
}));

describe('KritzelEditor', () => {
  let component: KritzelEditor;
  let mockEngine: any;

  beforeEach(() => {
    component = new KritzelEditor();
    component.host = {
      style: {
        setProperty: jest.fn(),
      },
    } as any;
    
    // Mock the engine ref
    mockEngine = {
      getObjectById: jest.fn().mockResolvedValue(null),
      addObject: jest.fn().mockResolvedValue(null),
      updateObject: jest.fn().mockResolvedValue(null),
      removeObject: jest.fn().mockResolvedValue(null),
      getSelectedObjects: jest.fn().mockResolvedValue([]),
      selectObjects: jest.fn().mockResolvedValue(undefined),
      selectAllObjectsInViewport: jest.fn().mockResolvedValue(undefined),
      clearSelection: jest.fn().mockReturnValue(undefined),
      centerObjectInViewport: jest.fn().mockResolvedValue(undefined),
      centerObjects: jest.fn().mockResolvedValue(true),
      backToContent: jest.fn().mockResolvedValue(true),
      centerAllObjects: jest.fn().mockResolvedValue(true),
      setViewport: jest.fn().mockResolvedValue(undefined),
      panTo: jest.fn().mockResolvedValue(undefined),
      zoomTo: jest.fn().mockResolvedValue(undefined),
      getViewport: jest.fn().mockResolvedValue({ x: 0, y: 0, scale: 1 }),
      screenToWorld: jest.fn().mockResolvedValue({ x: 0, y: 0 }),
      worldToScreen: jest.fn().mockResolvedValue({ x: 0, y: 0 }),
      createWorkspace: jest.fn().mockResolvedValue(null),
      updateWorkspace: jest.fn().mockResolvedValue(undefined),
      deleteWorkspace: jest.fn().mockResolvedValue(undefined),
      getWorkspaces: jest.fn().mockResolvedValue([]),
      getActiveWorkspace: jest.fn().mockResolvedValue({ id: '1', name: 'Test' }),
      loadSharedWorkspace: jest.fn().mockResolvedValue(undefined),
      reinitSync: jest.fn().mockResolvedValue(undefined),
      registerTool: jest.fn().mockResolvedValue(null),
      changeActiveTool: jest.fn().mockResolvedValue(undefined),
      changeActiveToolByName: jest.fn().mockResolvedValue(undefined),
      disable: jest.fn().mockResolvedValue(undefined),
      enable: jest.fn().mockResolvedValue(undefined),
      copy: jest.fn().mockResolvedValue(undefined),
      cut: jest.fn().mockResolvedValue(undefined),
      paste: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      bringForward: jest.fn().mockResolvedValue(undefined),
      sendBackward: jest.fn().mockResolvedValue(undefined),
      bringToFront: jest.fn().mockResolvedValue(undefined),
      sendToBack: jest.fn().mockResolvedValue(undefined),
      alignObjects: jest.fn().mockResolvedValue(undefined),
      group: jest.fn().mockResolvedValue(undefined),
      ungroup: jest.fn().mockResolvedValue(undefined),
      undo: jest.fn().mockResolvedValue(undefined),
      redo: jest.fn().mockResolvedValue(undefined),
      getScreenshot: jest.fn().mockResolvedValue(null),
      exportViewportAsPng: jest.fn().mockResolvedValue(undefined),
      exportViewportAsSvg: jest.fn().mockResolvedValue(undefined),
      exportSelectedObjectsAsPng: jest.fn().mockResolvedValue(undefined),
      exportSelectedObjectsAsSvg: jest.fn().mockResolvedValue(undefined),
      downloadAsJson: jest.fn().mockResolvedValue(undefined),
      importFromFile: jest.fn().mockResolvedValue(undefined),
      loadObjectsFromJson: jest.fn().mockResolvedValue(0),
      getObjectsTotalCount: jest.fn().mockResolvedValue(0),
      getAllObjects: jest.fn().mockResolvedValue([]),
      findObjects: jest.fn().mockResolvedValue([]),
      getObjectsInViewport: jest.fn().mockResolvedValue([]),
      hideContextMenu: jest.fn().mockResolvedValue(undefined),
      triggerSelectionChange: jest.fn().mockResolvedValue(undefined),
      beginSceneBootstrap: jest.fn().mockResolvedValue(undefined),
      endSceneBootstrap: jest.fn().mockResolvedValue(undefined),
      getDisplayableShortcuts: jest.fn().mockResolvedValue([]),
      getIsPublic: jest.fn().mockResolvedValue(false),
    };
    
    component.engineRef = mockEngine as any;
  });

  describe('Component Initialization', () => {
    it('should be created correctly', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Object Manipulation Methods', () => {
    it('should call getObjectById on engine', async () => {
      await component.getObjectById('123');
      expect(mockEngine.getObjectById).toHaveBeenCalledWith('123');
    });

    it('should call beginSceneBootstrap on engine', async () => {
      await component.beginSceneBootstrap();
      expect(mockEngine.beginSceneBootstrap).toHaveBeenCalledTimes(1);
    });

    it('should call endSceneBootstrap on engine', async () => {
      await component.endSceneBootstrap();
      expect(mockEngine.endSceneBootstrap).toHaveBeenCalledTimes(1);
    });

    it('should call addObject on engine', async () => {
      const obj = { id: '1' } as any;
      await component.addObject(obj);
      expect(mockEngine.addObject).toHaveBeenCalledWith(obj);
    });

    it('should call updateObject on engine', async () => {
      const obj = { id: '1' } as any;
      await component.updateObject(obj, { name: 'test' });
      expect(mockEngine.updateObject).toHaveBeenCalledWith(obj, { name: 'test' });
    });

    it('should call removeObject on engine', async () => {
      const obj = { id: '1' } as any;
      await component.removeObject(obj);
      expect(mockEngine.removeObject).toHaveBeenCalledWith(obj);
    });
  });

  describe('Workspace Methods', () => {
    it('should call createWorkspace on engine', async () => {
      const ws = { id: '1', name: 'ws' } as any;
      await component.createWorkspace(ws);
      expect(mockEngine.createWorkspace).toHaveBeenCalledWith(ws);
    });

    it('should call updateWorkspace on engine', async () => {
      const ws = { id: '1' } as any;
      await component.updateWorkspace(ws);
      expect(mockEngine.updateWorkspace).toHaveBeenCalledWith(ws);
    });

    it('should call deleteWorkspace on engine', async () => {
      const ws = { id: '1' } as any;
      await component.deleteWorkspace(ws);
      expect(mockEngine.deleteWorkspace).toHaveBeenCalledWith(ws);
    });

    it('should call getWorkspaces on engine', async () => {
      await component.getWorkspaces();
      expect(mockEngine.getWorkspaces).toHaveBeenCalled();
    });
  });

  describe('Toolbar/Clipboard Methods', () => {
    it('should call copy on engine', async () => {
      await component.copy();
      expect(mockEngine.copy).toHaveBeenCalled();
    });

    it('should call cut on engine', async () => {
      await component.cut();
      expect(mockEngine.cut).toHaveBeenCalled();
    });

    it('should call paste on engine', async () => {
      await component.paste(10, 20);
      expect(mockEngine.paste).toHaveBeenCalledWith(10, 20);
    });

    it('should call delete on engine', async () => {
      await component.delete();
      expect(mockEngine.delete).toHaveBeenCalled();
    });

    it('should call undo and redo on engine', async () => {
      await component.undo();
      expect(mockEngine.undo).toHaveBeenCalled();

      await component.redo();
      expect(mockEngine.redo).toHaveBeenCalled();
    });
  });

  describe('Viewport and Settings Methods', () => {
    it('should call setViewport on engine', async () => {
      await component.setViewport(0, 0, 2);
      expect(mockEngine.setViewport).toHaveBeenCalledWith(0, 0, 2);
    });

    it('should call getViewport on engine', async () => {
      await component.getViewport();
      expect(mockEngine.getViewport).toHaveBeenCalled();
    });
    
    it('should call panTo on engine', async () => {
      await component.panTo(10, 10);
      expect(mockEngine.panTo).toHaveBeenCalledWith(10, 10);
    });

    it('should call zoomTo on engine', async () => {
      await component.zoomTo(2, 50, 50);
      expect(mockEngine.zoomTo).toHaveBeenCalledWith(2, 50, 50);
    });

    it('should call centerObjects on engine', async () => {
      const objects = [{ id: 'obj-1' }] as unknown as KritzelBaseObject[];
      await component.centerObjects(objects, false);
      expect(mockEngine.centerObjects).toHaveBeenCalledWith(objects, false);
    });
  });

  describe('Notification Methods', () => {
    afterEach(() => {
      component.disconnectedCallback();
    });

    it('should trigger notification with provided type', async () => {
      await component.triggerNotification({
        type: 'warning',
        message: 'Heads up',
      });

      expect(component.activeNotification).toEqual(
        expect.objectContaining({
          type: 'warning',
          message: 'Heads up',
        }),
      );
      expect(component.activeNotification?.id).toBeTruthy();
      expect(component.activeNotification?.timestamp).toBeInstanceOf(Date);
    });

    it('should preserve provided id and timestamp when triggering notification', async () => {
      const timestamp = new Date('2026-01-01T00:00:00.000Z');

      await component.triggerNotification({
        id: 'custom-id',
        type: 'error',
        message: 'Something failed',
        timestamp,
      });

      expect(component.activeNotification).toEqual({
        id: 'custom-id',
        type: 'error',
        message: 'Something failed',
        timestamp,
      });
    });

    it('should trigger notification of type info', async () => {
      await component.triggerNotification({
        type: 'info',
        message: 'Everything is up to date.',
      });

      expect(component.activeNotification).toEqual(
        expect.objectContaining({
          type: 'info',
          message: 'Everything is up to date.',
        }),
      );
    });
  });

  describe('Context Menu State Handling', () => {
    it('stores context menu state when menu is visible', () => {
      const event = {
        stopPropagation: jest.fn(),
        detail: {
          isVisible: true,
          isObjectMenu: false,
          items: [{ label: 'menu.copy', action: jest.fn() }],
          objects: [],
          position: { x: 10, y: 20 },
          worldPosition: { x: 100, y: 200 },
        },
      } as any;

      component.handleContextMenuStateChange(event);

      expect(event.stopPropagation).toHaveBeenCalledTimes(1);
      expect(component.contextMenuState).toEqual(event.detail);
    });

    it('clears context menu state when menu is hidden', () => {
      (component as any).contextMenuState = {
        isVisible: true,
        isObjectMenu: false,
        items: [],
        objects: [],
        position: { x: 10, y: 20 },
        worldPosition: { x: 100, y: 200 },
      };

      const event = {
        stopPropagation: jest.fn(),
        detail: {
          isVisible: false,
          isObjectMenu: false,
          items: [],
          objects: [],
          position: { x: 0, y: 0 },
          worldPosition: { x: 0, y: 0 },
        },
      } as any;

      component.handleContextMenuStateChange(event);

      expect(component.contextMenuState).toBeUndefined();
    });

    it('executes context menu item action with emitted world coordinates and objects', async () => {
      const action = jest.fn();
      const objects = [{ id: 'obj-1' }] as any;
      (component as any).contextMenuState = {
        isVisible: true,
        isObjectMenu: true,
        items: [{ label: 'menu.delete', action }],
        objects,
        position: { x: 8, y: 12 },
        worldPosition: { x: 80, y: 120 },
      };

      const hideSpy = jest.spyOn(component, 'hideContextMenu').mockResolvedValue(undefined);

      (component as any).handleContextMenuActionSelected({
        detail: {
          label: 'menu.delete',
          action,
        },
      } as any);

      expect(action).toHaveBeenCalledWith({ x: 80, y: 120 }, objects);
      expect(hideSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Watchers', () => {
    it('should update currentIsPublic when activeWorkspace changes', () => {
      component.isPublicChange = { emit: jest.fn() } as any;
      
      component.activeWorkspace = { id: '1', name: 'ws', isPublic: true } as any;
      
      // Simulate the watcher
      component.onActiveWorkspaceChange();
      
      expect(component.currentIsPublic).toBe(true);
      expect(component.isPublicChange.emit).toHaveBeenCalledWith({ isPublic: true, workspaceId: '1' });
    });

    it('should register custom fonts when the customFonts prop changes', () => {
      const spy = jest.spyOn(KritzelFontRegistry, 'registerFonts').mockImplementation();
      const customFonts = {
        'editor-lora': {
          family: 'Lora',
          cssFontFamily: "'Lora', serif",
        },
      };

      component.onCustomFontsChange(customFonts);

      expect(spy).toHaveBeenCalledWith(customFonts);
    });

    it('should register custom fonts in componentDidLoad', () => {
      const spy = jest.spyOn(KritzelFontRegistry, 'registerFonts').mockImplementation();
      const keyboardSpy = jest.spyOn(KritzelKeyboardHelper, 'onKeyboardVisibleChanged').mockReturnValue(() => {});
      component.customFonts = {
        'editor-inter': {
          family: 'Inter',
          cssFontFamily: "'Inter', sans-serif",
        },
      };

      component.componentDidLoad();

      expect(spy).toHaveBeenCalledWith(component.customFonts);
      keyboardSpy.mockRestore();
    });

    it('should register custom fonts through the public method', async () => {
      const spy = jest.spyOn(KritzelFontRegistry, 'registerFonts').mockImplementation();
      const runtimeFonts = {
        'editor-space-grotesk': {
          family: 'Space Grotesk',
          cssFontFamily: "'Space Grotesk', sans-serif",
        },
      };

      await component.registerFonts(runtimeFonts);

      expect(spy).toHaveBeenCalledWith(runtimeFonts);
    });

    it('should normalize controls with default text fonts when availableFonts is missing', () => {
      component.controls = [
        {
          name: 'text',
          type: 'tool',
          config: {
            color: { light: '#000', dark: '#fff' },
            size: 16,
            fontFamily: 'Arial',
            palette: [],
          } as any,
        } as any,
      ];

      component.onControlsChange(component.controls);

      const normalizedConfig = (component as any).normalizedControls[0].config;
      expect(normalizedConfig.availableFonts).toEqual(DEFAULT_TEXT_TOOL_AVAILABLE_FONTS);
    });

    it('should preserve explicitly configured text fonts in controls', () => {
      component.controls = [
        {
          name: 'text',
          type: 'tool',
          config: {
            color: { light: '#000', dark: '#fff' },
            size: 16,
            fontFamily: 'Lora',
            availableFonts: [
              {
                family: 'Lora',
                cssFontFamily: "'Lora', serif",
              },
            ],
            palette: [],
          } as any,
        } as any,
      ];

      component.onControlsChange(component.controls);

      const normalizedConfig = (component as any).normalizedControls[0].config;
      expect(normalizedConfig.availableFonts).toEqual([
        {
          family: 'Lora',
          cssFontFamily: "'Lora', serif",
        },
      ]);
    });

    it('should wait for custom fonts before emitting isReady', async () => {
      const deferred = (() => {
        let resolve!: () => void;
        const promise = new Promise<void>(res => {
          resolve = res;
        });
        return { promise, resolve };
      })();

      const customElementsSpy = jest.spyOn(customElements, 'whenDefined').mockResolvedValue(undefined as any);
      const waitForFontsSpy = jest.spyOn(KritzelFontRegistry, 'waitForFonts').mockReturnValue(deferred.promise);
      const keyboardSpy = jest.spyOn(KritzelKeyboardHelper, 'onKeyboardVisibleChanged').mockReturnValue(() => {});
      component.isReady = { emit: jest.fn() } as any;
      component.customFonts = {
        'editor-racing': {
          family: 'Racing Sans One',
          cssFontFamily: "'Racing Sans One', sans-serif",
        },
      };
      component.isEngineReady = true;
      component.isControlsReady = true;
      component.isWorkspaceManagerReady = true;
      component.activeWorkspace = { id: 'workspace-1', name: 'Workspace 1', isPublic: false } as any;

      component.componentDidLoad();

      const readyPromise = component.checkIsReady();

      expect(waitForFontsSpy).toHaveBeenCalledWith(component.customFonts);
      expect(component.isReady.emit).not.toHaveBeenCalled();

      deferred.resolve();
      await readyPromise;

      expect(component.isEditorVisible).toBe(true);
      expect(component.isReady.emit).toHaveBeenCalled();

      customElementsSpy.mockRestore();
      waitForFontsSpy.mockRestore();
      keyboardSpy.mockRestore();
    });
  });
});