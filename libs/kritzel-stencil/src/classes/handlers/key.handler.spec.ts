import { KritzelKeyHandler } from './key.handler';
import { KritzelCore } from '../core/core.class';
import { KritzelToolRegistry } from '../registries/tool.registry';
import { KritzelBaseTool } from '../tools/base-tool.class';

jest.mock('../registries/tool.registry');

describe('KritzelKeyHandler', () => {
  let keyHandler: KritzelKeyHandler;
  let mockCore: jest.Mocked<KritzelCore>;
  let mockTool: jest.Mocked<KritzelBaseTool>;
  let mockSelectionGroup: { objects: unknown[] } | null;
  let mockActiveText: unknown | null;
  let mockState: {
    isCtrlKeyPressed: boolean;
    copiedObjects: unknown[] | null;
  };

  beforeEach(() => {
    mockTool = {
      onActivate: jest.fn(),
      name: 'mockTool',
    } as unknown as jest.Mocked<KritzelBaseTool>;

    (KritzelToolRegistry.getTool as jest.Mock).mockReturnValue(mockTool);

    mockSelectionGroup = null;
    mockActiveText = null;
    mockState = {
      isCtrlKeyPressed: false,
      copiedObjects: null,
    };

    mockCore = {
      store: {
        get state() {
          return mockState;
        },
        get selectionGroup() {
          return mockSelectionGroup;
        },
        get activeText() {
          return mockActiveText;
        },
        setState: jest.fn(),
      },
      clearSelection: jest.fn(),
      delete: jest.fn(),
      undo: jest.fn(),
      redo: jest.fn(),
      copy: jest.fn(),
      paste: jest.fn(),
      rerender: jest.fn(),
      bringForward: jest.fn(),
      sendBackward: jest.fn(),
      bringToFront: jest.fn(),
      sendToBack: jest.fn(),
      group: jest.fn(),
      ungroup: jest.fn(),
      deselectAllObjects: jest.fn(),
    } as unknown as jest.Mocked<KritzelCore>;

    keyHandler = new KritzelKeyHandler(mockCore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleKeyDown', () => {
    describe('isCtrlKeyPressed state', () => {
      it('should set isCtrlKeyPressed to true when ctrl is pressed', () => {
        const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true });

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
      it('should switch to selection tool when Ctrl+S is pressed', () => {
        const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        keyHandler.handleKeyDown(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(KritzelToolRegistry.getTool).toHaveBeenCalledWith('selection');
        expect(mockCore.store.setState).toHaveBeenCalledWith('activeTool', mockTool);
        expect(mockCore.deselectAllObjects).toHaveBeenCalled();
        expect(mockTool.onActivate).toHaveBeenCalled();
      });

      it('should switch to brush tool when Ctrl+B is pressed', () => {
        const event = new KeyboardEvent('keydown', { key: 'b', ctrlKey: true });

        keyHandler.handleKeyDown(event);

        expect(KritzelToolRegistry.getTool).toHaveBeenCalledWith('brush');
        expect(mockCore.store.setState).toHaveBeenCalledWith('activeTool', mockTool);
      });

      it('should switch to eraser tool when Ctrl+E is pressed', () => {
        const event = new KeyboardEvent('keydown', { key: 'e', ctrlKey: true });

        keyHandler.handleKeyDown(event);

        expect(KritzelToolRegistry.getTool).toHaveBeenCalledWith('eraser');
        expect(mockCore.store.setState).toHaveBeenCalledWith('activeTool', mockTool);
      });

      it('should switch to image tool when Ctrl+I is pressed', () => {
        const event = new KeyboardEvent('keydown', { key: 'i', ctrlKey: true });

        keyHandler.handleKeyDown(event);

        expect(KritzelToolRegistry.getTool).toHaveBeenCalledWith('image');
        expect(mockCore.store.setState).toHaveBeenCalledWith('activeTool', mockTool);
      });

      it('should switch to text tool when Ctrl+X is pressed', () => {
        const event = new KeyboardEvent('keydown', { key: 'x', ctrlKey: true });

        keyHandler.handleKeyDown(event);

        expect(KritzelToolRegistry.getTool).toHaveBeenCalledWith('text');
        expect(mockCore.store.setState).toHaveBeenCalledWith('activeTool', mockTool);
      });
    });

    describe('Clipboard shortcuts', () => {
      it('should call copy and rerender when Ctrl+C is pressed with selection', () => {
        mockSelectionGroup = { objects: [] };
        const event = new KeyboardEvent('keydown', { key: 'c', ctrlKey: true });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        keyHandler.handleKeyDown(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(mockCore.copy).toHaveBeenCalled();
        expect(mockCore.rerender).toHaveBeenCalled();
      });

      it('should not call copy when Ctrl+C is pressed without selection', () => {
        mockSelectionGroup = null;
        const event = new KeyboardEvent('keydown', { key: 'c', ctrlKey: true });

        keyHandler.handleKeyDown(event);

        expect(mockCore.copy).not.toHaveBeenCalled();
      });

      it('should call paste when Ctrl+V is pressed with copied objects and no active text', () => {
        mockState.copiedObjects = [{}];
        mockActiveText = null;
        const event = new KeyboardEvent('keydown', { key: 'v', ctrlKey: true });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        keyHandler.handleKeyDown(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(mockCore.paste).toHaveBeenCalled();
      });

      it('should not call paste when Ctrl+V is pressed without copied objects', () => {
        mockState.copiedObjects = null;
        const event = new KeyboardEvent('keydown', { key: 'v', ctrlKey: true });

        keyHandler.handleKeyDown(event);

        expect(mockCore.paste).not.toHaveBeenCalled();
      });

      it('should not call paste when Ctrl+V is pressed with active text', () => {
        mockState.copiedObjects = [{}];
        mockActiveText = {};
        const event = new KeyboardEvent('keydown', { key: 'v', ctrlKey: true });

        keyHandler.handleKeyDown(event);

        expect(mockCore.paste).not.toHaveBeenCalled();
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
      it('should call group when Ctrl+G is pressed with 2+ objects selected', () => {
        mockSelectionGroup = { objects: [{}, {}] };
        const event = new KeyboardEvent('keydown', { key: 'g', ctrlKey: true });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        keyHandler.handleKeyDown(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(mockCore.group).toHaveBeenCalled();
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

      it('should call ungroup when Ctrl+Shift+G is pressed with selection', () => {
        mockSelectionGroup = { objects: [] };
        const event = new KeyboardEvent('keydown', { key: 'G', ctrlKey: true, shiftKey: true });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        keyHandler.handleKeyDown(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(mockCore.ungroup).toHaveBeenCalled();
      });

      it('should not call ungroup when Ctrl+Shift+G is pressed without selection', () => {
        mockSelectionGroup = null;
        const event = new KeyboardEvent('keydown', { key: 'G', ctrlKey: true, shiftKey: true });

        keyHandler.handleKeyDown(event);

        expect(mockCore.ungroup).not.toHaveBeenCalled();
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
        expect(mockCore.copy).not.toHaveBeenCalled();
        expect(mockCore.paste).not.toHaveBeenCalled();
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
