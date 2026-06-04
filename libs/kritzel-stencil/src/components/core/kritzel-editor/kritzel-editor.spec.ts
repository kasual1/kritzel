import { KritzelEditor } from './kritzel-editor';
import { KritzelBaseObject } from '../../../classes/objects/base-object.class';

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
      getCopiedObjects: jest.fn().mockResolvedValue([]),
      getObjectsInViewport: jest.fn().mockResolvedValue([]),
      hideContextMenu: jest.fn().mockResolvedValue(undefined),
      triggerSelectionChange: jest.fn().mockResolvedValue(undefined),
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

  describe('Watchers', () => {
    it('should update currentIsPublic when activeWorkspace changes', () => {
      component.isPublicChange = { emit: jest.fn() } as any;
      
      component.activeWorkspace = { id: '1', name: 'ws', isPublic: true } as any;
      
      // Simulate the watcher
      component.onActiveWorkspaceChange();
      
      expect(component.currentIsPublic).toBe(true);
      expect(component.isPublicChange.emit).toHaveBeenCalledWith({ isPublic: true, workspaceId: '1' });
    });
  });
});