import { KritzelKeyHandler } from './key.handler';
import { KritzelCore } from '../core/core.class';
import { KritzelBaseTool } from '../tools/base-tool.class';

describe('KritzelKeyHandler', () => {
  let keyHandler: KritzelKeyHandler;
  let mockCore: jest.Mocked<KritzelCore>;
  let mockTool: jest.Mocked<KritzelBaseTool>;
  let mockSelectionGroup: { objects: unknown[] } | null;
  let mockActiveText: unknown | null;
  let mockActiveInteractiveDynamicObject: unknown | null;
  let mockState: {
    isCtrlKeyPressed: boolean;
  };

  beforeEach(() => {
    mockTool = {
      onActivate: jest.fn(),
      name: 'mockTool',
    } as unknown as jest.Mocked<KritzelBaseTool>;

    mockSelectionGroup = null;
    mockActiveText = null;
    mockActiveInteractiveDynamicObject = null;
    mockState = {
      isCtrlKeyPressed: false,
    };

    mockCore = {
      store: {
        get state() {
          return mockState;
        },
        get selectionGroup() {
          return mockSelectionGroup;
        },
        get selectedGroups() {
          return (mockSelectionGroup?.objects ?? []).filter((obj: any) => obj.__class__ === 'KritzelGroup');
        },
        get activeText() {
          return mockActiveText;
        },
        get activeInteractiveDynamicObject() {
          return mockActiveInteractiveDynamicObject;
        },
        get activeShape() {
          return null;
        },
        setState: jest.fn(),
      },
      clearSelection: jest.fn(),
      delete: jest.fn(),
      undo: jest.fn(),
      redo: jest.fn(),
      rerender: jest.fn(),
      bringForward: jest.fn(),
      sendBackward: jest.fn(),
      bringToFront: jest.fn(),
      sendToBack: jest.fn(),
      group: jest.fn(),
      ungroup: jest.fn(),
      deselectAllObjects: jest.fn(),
      selectAllObjectsInViewport: jest.fn(),
      selectAllObjects: jest.fn(),
      toolRegistry: {
        getTool: jest.fn().mockReturnValue(mockTool),
        getToolByIndex: jest.fn(),
      },
    } as unknown as jest.Mocked<KritzelCore>;

    keyHandler = new KritzelKeyHandler(mockCore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleKeyDown', () => {
    describe('isCtrlKeyPressed state', () => {
      it('should set isCtrlKeyPressed to true when ctrl is pressed', () => {
        const event = new KeyboardEvent('keydown', { key: 'q', ctrlKey: true });

        keyHandler.handleKeyDown(event);

        expect(mockCore.store.state.isCtrlKeyPressed).toBe(true);
      });

      it('should set isCtrlKeyPressed to false when ctrl is not pressed', () => {
        mockCore.store.state.isCtrlKeyPressed = true;
        const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: false });

        keyHandler.handleKeyDown(event);

        expect(mockCore.store.state.isCtrlKeyPressed).toBe(false);
      });
    });

    describe('Escape shortcut', () => {
      it('should call clearSelection when Escape is pressed with selection', () => {
        mockSelectionGroup = { objects: [] };
        const event = new KeyboardEvent('keydown', { key: 'Escape' });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        keyHandler.handleKeyDown(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(mockCore.clearSelection).toHaveBeenCalled();
      });

      it('should not call clearSelection when Escape is pressed without selection', () => {
        mockSelectionGroup = null;
        const event = new KeyboardEvent('keydown', { key: 'Escape' });

        keyHandler.handleKeyDown(event);

        expect(mockCore.clearSelection).not.toHaveBeenCalled();
      });
    });

    describe('Delete shortcut', () => {
      it('should call delete when Delete is pressed with selection', () => {
        mockSelectionGroup = { objects: [] };
        const event = new KeyboardEvent('keydown', { key: 'Delete' });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        keyHandler.handleKeyDown(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(mockCore.delete).toHaveBeenCalled();
      });

      it('should not call delete when Delete is pressed without selection', () => {
        mockSelectionGroup = null;
        const event = new KeyboardEvent('keydown', { key: 'Delete' });

        keyHandler.handleKeyDown(event);

        expect(mockCore.delete).not.toHaveBeenCalled();
      });
    });

    describe('Undo/Redo shortcuts', () => {
      it('should call undo when Ctrl+Z is pressed', () => {
        const event = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        keyHandler.handleKeyDown(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(mockCore.undo).toHaveBeenCalled();
      });

      it('should call redo when Ctrl+Y is pressed', () => {
        const event = new KeyboardEvent('keydown', { key: 'y', ctrlKey: true });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        keyHandler.handleKeyDown(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(mockCore.redo).toHaveBeenCalled();
      });
    });

    describe('Tool selection shortcuts', () => {
      beforeEach(() => {
        (mockCore.toolRegistry.getToolByIndex as jest.Mock).mockReturnValue(mockTool);
      });

      it('should switch to tool 1 when Ctrl+1 is pressed', () => {
        const event = new KeyboardEvent('keydown', { key: '1', ctrlKey: true });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        keyHandler.handleKeyDown(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(mockCore.toolRegistry.getToolByIndex).toHaveBeenCalledWith(0);
        expect(mockCore.store.setState).toHaveBeenCalledWith('activeTool', mockTool);
        expect(mockCore.deselectAllObjects).toHaveBeenCalled();
        expect(mockTool.onActivate).toHaveBeenCalled();
      });

      it('should switch to tool 2 when Ctrl+2 is pressed', () => {
        const event = new KeyboardEvent('keydown', { key: '2', ctrlKey: true });

        keyHandler.handleKeyDown(event);

        expect(mockCore.toolRegistry.getToolByIndex).toHaveBeenCalledWith(1);
        expect(mockCore.store.setState).toHaveBeenCalledWith('activeTool', mockTool);
      });

      it('should switch to tool 3 when Ctrl+3 is pressed', () => {
        const event = new KeyboardEvent('keydown', { key: '3', ctrlKey: true });

        keyHandler.handleKeyDown(event);

        expect(mockCore.toolRegistry.getToolByIndex).toHaveBeenCalledWith(2);
        expect(mockCore.store.setState).toHaveBeenCalledWith('activeTool', mockTool);
      });

      it('should not switch tool when getToolByIndex returns undefined', () => {
        (mockCore.toolRegistry.getToolByIndex as jest.Mock).mockReturnValue(undefined);
        const event = new KeyboardEvent('keydown', { key: '9', ctrlKey: true });

        keyHandler.handleKeyDown(event);

        expect(mockCore.toolRegistry.getToolByIndex).toHaveBeenCalledWith(8);
        expect(mockCore.store.setState).not.toHaveBeenCalled();
      });
    });

    describe('Object layering shortcuts', () => {
      it('should call bringForward when Ctrl++ is pressed with selection', () => {
        mockSelectionGroup = { objects: [] };
        const event = new KeyboardEvent('keydown', { key: '+', ctrlKey: true });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        keyHandler.handleKeyDown(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(mockCore.bringForward).toHaveBeenCalled();
      });

      it('should call sendBackward when Ctrl+- is pressed with selection', () => {
        mockSelectionGroup = { objects: [] };
        const event = new KeyboardEvent('keydown', { key: '-', ctrlKey: true });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        keyHandler.handleKeyDown(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(mockCore.sendBackward).toHaveBeenCalled();
      });

      it('should call bringToFront when Shift+* is pressed with selection', () => {
        mockSelectionGroup = { objects: [] };
        const event = new KeyboardEvent('keydown', { key: '*', shiftKey: true });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        keyHandler.handleKeyDown(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(mockCore.bringToFront).toHaveBeenCalled();
      });

      it('should call sendToBack when Shift+_ is pressed with selection', () => {
        mockSelectionGroup = { objects: [] };
        const event = new KeyboardEvent('keydown', { key: '_', shiftKey: true });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        keyHandler.handleKeyDown(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(mockCore.sendToBack).toHaveBeenCalled();
      });

      it('should not call layering methods without selection', () => {
        mockSelectionGroup = null;

        keyHandler.handleKeyDown(new KeyboardEvent('keydown', { key: '+', ctrlKey: true }));
        keyHandler.handleKeyDown(new KeyboardEvent('keydown', { key: '-', ctrlKey: true }));
        keyHandler.handleKeyDown(new KeyboardEvent('keydown', { key: '*', shiftKey: true }));
        keyHandler.handleKeyDown(new KeyboardEvent('keydown', { key: '_', shiftKey: true }));

        expect(mockCore.bringForward).not.toHaveBeenCalled();
        expect(mockCore.sendBackward).not.toHaveBeenCalled();
        expect(mockCore.bringToFront).not.toHaveBeenCalled();
        expect(mockCore.sendToBack).not.toHaveBeenCalled();
      });
    });

    describe('Grouping shortcuts', () => {
      it('should group the selected objects when Ctrl+G is pressed with 2+ objects selected', () => {
        const objects = [{}, {}];
        mockSelectionGroup = { objects };
        const event = new KeyboardEvent('keydown', { key: 'g', ctrlKey: true });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        keyHandler.handleKeyDown(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(mockCore.group).toHaveBeenCalledWith(objects);
      });

      it('should not call group when Ctrl+G is pressed with less than 2 objects', () => {
        mockSelectionGroup = { objects: [{}] };
        const event = new KeyboardEvent('keydown', { key: 'g', ctrlKey: true });

        keyHandler.handleKeyDown(event);

        expect(mockCore.group).not.toHaveBeenCalled();
      });

      it('should not call group when Ctrl+G is pressed without selection', () => {
        mockSelectionGroup = null;
        const event = new KeyboardEvent('keydown', { key: 'g', ctrlKey: true });

        keyHandler.handleKeyDown(event);

        expect(mockCore.group).not.toHaveBeenCalled();
      });

      it('should ungroup the selected groups when Ctrl+Shift+G is pressed with selection', () => {
        const group = { __class__: 'KritzelGroup' };
        mockSelectionGroup = { objects: [group, { __class__: 'KritzelPath' }] };
        const event = new KeyboardEvent('keydown', { key: 'G', ctrlKey: true, shiftKey: true });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        keyHandler.handleKeyDown(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(mockCore.ungroup).toHaveBeenCalledWith([group]);
      });

      it('should not call ungroup when Ctrl+Shift+G is pressed without selection', () => {
        mockSelectionGroup = null;
        const event = new KeyboardEvent('keydown', { key: 'G', ctrlKey: true, shiftKey: true });

        keyHandler.handleKeyDown(event);

        expect(mockCore.ungroup).not.toHaveBeenCalled();
      });
    });

    describe('Active text editing', () => {
      it('should not execute Select All shortcut when a text object is being edited', () => {
        mockActiveText = { isEditing: true };
        const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        keyHandler.handleKeyDown(event);

        expect(preventDefaultSpy).not.toHaveBeenCalled();
        expect(mockCore.selectAllObjectsInViewport).not.toHaveBeenCalled();
      });

      it('should not execute Delete shortcut when a text object is being edited', () => {
        mockActiveText = { isEditing: true };
        mockSelectionGroup = { objects: [] };
        const event = new KeyboardEvent('keydown', { key: 'Delete' });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        keyHandler.handleKeyDown(event);

        expect(preventDefaultSpy).not.toHaveBeenCalled();
        expect(mockCore.delete).not.toHaveBeenCalled();
      });

      it('should not execute arrow key movement when a text object is being edited', () => {
        mockActiveText = { isEditing: true };
        mockSelectionGroup = { objects: [] };
        const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        keyHandler.handleKeyDown(event);

        expect(preventDefaultSpy).not.toHaveBeenCalled();
        expect(mockCore.rerender).not.toHaveBeenCalled();
      });

      it('should still update isCtrlKeyPressed state when a text object is being edited', () => {
        mockActiveText = { isEditing: true };
        const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true });

        keyHandler.handleKeyDown(event);

        expect(mockCore.store.state.isCtrlKeyPressed).toBe(true);
      });

      it('should execute shortcuts normally when no text object is being edited', () => {
        mockActiveText = null;
        const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        keyHandler.handleKeyDown(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(mockCore.selectAllObjectsInViewport).toHaveBeenCalled();
      });

      it('should clear text selection when Escape is pressed while editing', () => {
        const handleEscape = jest.fn();
        mockActiveText = { isEditing: true, handleEscape };
        const event = new KeyboardEvent('keydown', { key: 'Escape' });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        keyHandler.handleKeyDown(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(handleEscape).toHaveBeenCalled();
        expect(mockCore.clearSelection).not.toHaveBeenCalled();
      });
    });

    describe('Interactive dynamic object selection', () => {
      it('should not execute Select All shortcut when focused input-like content exists in a selected dynamic object', () => {
        mockActiveInteractiveDynamicObject = { __class__: 'KritzelDynamicObject', isInteractive: true };
        const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        keyHandler.handleKeyDown(event);

        expect(preventDefaultSpy).not.toHaveBeenCalled();
        expect(mockCore.selectAllObjectsInViewport).not.toHaveBeenCalled();
      });

      it('should still execute Escape shortcut when focused input-like content exists in a selected dynamic object', () => {
        mockSelectionGroup = { objects: [] };
        mockActiveInteractiveDynamicObject = { __class__: 'KritzelDynamicObject', isInteractive: true };
        const event = new KeyboardEvent('keydown', { key: 'Escape' });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        keyHandler.handleKeyDown(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(mockCore.clearSelection).toHaveBeenCalled();
      });

      it('should execute shortcuts when no selected dynamic object has focused input-like content', () => {
        mockActiveInteractiveDynamicObject = null;
        const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        keyHandler.handleKeyDown(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(mockCore.selectAllObjectsInViewport).toHaveBeenCalled();
      });
    });

    describe('Unmatched shortcuts', () => {
      it('should not prevent default for unmatched key combinations', () => {
        const event = new KeyboardEvent('keydown', { key: 'a' });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        keyHandler.handleKeyDown(event);

        expect(preventDefaultSpy).not.toHaveBeenCalled();
      });

      it('should not execute any action for unmatched key combinations', () => {
        const event = new KeyboardEvent('keydown', { key: 'q', ctrlKey: true });

        keyHandler.handleKeyDown(event);

        expect(mockCore.undo).not.toHaveBeenCalled();
        expect(mockCore.redo).not.toHaveBeenCalled();
        expect(mockCore.delete).not.toHaveBeenCalled();
      });
    });
  });

  describe('handleKeyUp', () => {
    it('should set isCtrlKeyPressed to false when ctrl is released', () => {
      mockCore.store.state.isCtrlKeyPressed = true;
      const event = new KeyboardEvent('keyup', { key: 'Control', ctrlKey: false });

      keyHandler.handleKeyUp(event);

      expect(mockCore.store.state.isCtrlKeyPressed).toBe(false);
    });

    it('should keep isCtrlKeyPressed true when another key is released but ctrl is still held', () => {
      const event = new KeyboardEvent('keyup', { key: 'z', ctrlKey: true });

      keyHandler.handleKeyUp(event);

      expect(mockCore.store.state.isCtrlKeyPressed).toBe(true);
    });
  });
});
