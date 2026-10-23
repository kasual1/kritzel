import { KritzelTextTool } from './text-tool.class';
import { KritzelCore } from '../core/core.class';
import { KritzelText } from '../objects/text.class';
import { KritzelEventHelper } from '../../helpers/event.helper';
import { DEFAULT_COLOR_PALETTE } from '../../constants/color-palette.constants';

jest.mock('../core/core.class');
jest.mock('../objects/text.class');
jest.mock('../../helpers/event.helper');

describe('KritzelTextTool', () => {
  let tool: KritzelTextTool;
  let mockCore: any;
  let mockObjectsMap: any;
  let mockState: any;
  let mockCreatedText: any;
  let mockSelectionTool: any;

  const createMouseEvent = (overrides: Partial<PointerEvent> = {}): PointerEvent => {
    return {
      pointerType: 'mouse',
      button: 0,
      clientX: 100,
      clientY: 200,
      cancelable: true,
      preventDefault: jest.fn(),
      composedPath: jest.fn().mockReturnValue([
        { classList: { contains: jest.fn().mockReturnValue(false) } },
      ]),
      ...overrides,
    } as unknown as PointerEvent;
  };

  const createTouchEvent = (overrides: Partial<PointerEvent> = {}): PointerEvent => {
    return {
      pointerType: 'touch',
      clientX: 100,
      clientY: 200,
      cancelable: true,
      preventDefault: jest.fn(),
      composedPath: jest.fn().mockReturnValue([
        { classList: { contains: jest.fn().mockReturnValue(false) } },
      ]),
      ...overrides,
    } as unknown as PointerEvent;
  };

  const createPenEvent = (overrides: Partial<PointerEvent> = {}): PointerEvent => {
    return {
      pointerType: 'pen',
      clientX: 100,
      clientY: 200,
      cancelable: true,
      preventDefault: jest.fn(),
      composedPath: jest.fn().mockReturnValue([
        { classList: { contains: jest.fn().mockReturnValue(false) } },
      ]),
      ...overrides,
    } as unknown as PointerEvent;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockObjectsMap = {
      insert: jest.fn(),
    };

    mockState = {
      scale: 1,
      translateX: 0,
      translateY: 0,
      lockDrawingScale: false,
      objects: mockObjectsMap,
      pointers: new Map(),
    };

    mockSelectionTool = { name: 'selection' };

    mockCreatedText = {
      id: 'text-1',
      fontColor: DEFAULT_COLOR_PALETTE[0],
      opacity: 1,
      translateX: 0,
      translateY: 0,
      zIndex: 0,
      edit: jest.fn(),
    };

    (KritzelText.create as jest.Mock).mockReturnValue(mockCreatedText);
    (KritzelEventHelper.isLeftClick as jest.Mock).mockReturnValue(true);

    mockCore = {
      objectTitlebarManager: {
        config: undefined,
        getOwnerFromEvent: jest.fn().mockReturnValue(null),
        isControlEvent: jest.fn().mockReturnValue(false),
        resetWarnings: jest.fn(),
      },
      store: {
        get state() { return mockState; },
        get objects() { return mockState.objects; },
        offsetX: 0,
        offsetY: 0,
        activeText: null as any,
        currentZIndex: 5,
        setState: jest.fn(),
      },
      rerender: jest.fn(),
      findObjectById: jest.fn().mockReturnValue(undefined),
      resetActiveText: jest.fn(),
      updateObject: jest.fn(),
      toolRegistry: { getTool: jest.fn().mockReturnValue(mockSelectionTool) },
    } as unknown as jest.Mocked<KritzelCore>;

    tool = new KritzelTextTool(mockCore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // Default properties
  // ============================================

  describe('default properties', () => {
    it('should have default fontFamily of Arial', () => {
      expect(tool.fontFamily).toBe('Arial');
    });

    it('should have default fontSize of 16', () => {
      expect(tool.fontSize).toBe(16);
    });

    it('should have default fontColor from palette', () => {
      expect(tool.fontColor).toEqual(DEFAULT_COLOR_PALETTE[0]);
    });

    it('should have default opacity of 1', () => {
      expect(tool.opacity).toBe(1);
    });

    it('should have default palette matching DEFAULT_COLOR_PALETTE', () => {
      expect(tool.palette).toEqual(DEFAULT_COLOR_PALETTE);
    });
  });

  // ============================================
  // handlePointerDown - Mouse
  // ============================================

  describe('handlePointerDown (mouse)', () => {
    it('should call preventDefault when event is cancelable', () => {
      const event = createMouseEvent();

      tool.handlePointerDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should not call preventDefault when event is not cancelable', () => {
      const event = createMouseEvent({ cancelable: false });

      tool.handlePointerDown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should create a text object on left click', () => {
      const event = createMouseEvent({ clientX: 150, clientY: 250 });

      tool.handlePointerDown(event);

      expect(KritzelText.create).toHaveBeenCalledWith(mockCore, 16, 'Arial', 1);
      expect(mockCreatedText.fontColor).toEqual(tool.fontColor);
      expect(mockCreatedText.opacity).toBe(tool.opacity);
      expect(mockCreatedText.zIndex).toBe(5);
      expect(mockObjectsMap.insert).toHaveBeenCalledWith(mockCreatedText);
      expect(mockCore.rerender).toHaveBeenCalled();
      expect(mockCreatedText.edit).toHaveBeenCalledWith(event);
    });

    it('should not create a text object on non-left click', () => {
      (KritzelEventHelper.isLeftClick as jest.Mock).mockReturnValue(false);
      const event = createMouseEvent({ button: 2 });

      tool.handlePointerDown(event);

      expect(KritzelText.create).not.toHaveBeenCalled();
    });

    it('should position text using viewport offset', () => {
      mockCore.store.offsetX = 50;
      mockCore.store.offsetY = 30;
      const event = createMouseEvent({ clientX: 200, clientY: 300 });

      tool.handlePointerDown(event);

      // translateX = (clientX - offsetX - translateX) / scale = (200 - 50 - 0) / 1 = 150
      // translateY = (clientY - offsetY - translateY) / scale = (300 - 30 - 0) / 1 = 270
      expect(mockCreatedText.translateX).toBe(150);
      expect(mockCreatedText.translateY).toBe(270);
    });

    it('should account for viewport scale and translate in positioning', () => {
      mockState.scale = 2;
      mockState.translateX = 100;
      mockState.translateY = 50;
      const event = createMouseEvent({ clientX: 200, clientY: 300 });

      tool.handlePointerDown(event);

      // translateX = (clientX - offsetX - translateX) / scale = (200 - 0 - 100) / 2 = 50
      // translateY = (clientY - offsetY - translateY) / scale = (300 - 0 - 50) / 2 = 125
      expect(mockCreatedText.translateX).toBe(50);
      expect(mockCreatedText.translateY).toBe(125);
    });

    it('should pass scale=1 when lockDrawingScale is true', () => {
      mockState.scale = 2;
      mockState.lockDrawingScale = true;

      tool.handlePointerDown(createMouseEvent());

      expect(KritzelText.create).toHaveBeenCalledWith(mockCore, 16, 'Arial', 1);
    });

    it('should pass viewportScale when lockDrawingScale is false', () => {
      mockState.scale = 2;
      mockState.lockDrawingScale = false;

      tool.handlePointerDown(createMouseEvent());

      expect(KritzelText.create).toHaveBeenCalledWith(mockCore, 16, 'Arial', 2);
    });

    it('should use custom fontSize and fontFamily', () => {
      tool.fontSize = 24;
      tool.fontFamily = 'Courier';

      tool.handlePointerDown(createMouseEvent());

      expect(KritzelText.create).toHaveBeenCalledWith(mockCore, 24, 'Courier', 1);
    });

    it('should use custom fontColor and opacity', () => {
      const customColor = { light: '#ff0000', dark: '#ff0000' };
      tool.fontColor = customColor;
      tool.opacity = 0.5;

      tool.handlePointerDown(createMouseEvent());

      expect(mockCreatedText.fontColor).toEqual(customColor);
      expect(mockCreatedText.opacity).toBe(0.5);
    });

    it('should edit existing text when clicking on it with no active text', () => {
      const existingText = Object.create(KritzelText.prototype);
      existingText.edit = jest.fn();
      existingText.id = 'existing-text';

      const objectElement = { id: 'existing-text', classList: { contains: (cls: string) => cls === 'object' } };
      const event = createMouseEvent({
        composedPath: jest.fn().mockReturnValue([{}, objectElement]) as any,
      });
      mockCore.findObjectById.mockReturnValue(existingText);
      mockCore.store.activeText = null;

      tool.handlePointerDown(event);

      expect(existingText.edit).toHaveBeenCalledWith(event);
      expect(KritzelText.create).not.toHaveBeenCalled();
    });

    it('should save active text and edit new one when clicking on different text', () => {
      const activeText = Object.create(KritzelText.prototype);
      activeText.save = jest.fn();
      mockCore.store.activeText = activeText;

      const clickedText = Object.create(KritzelText.prototype);
      clickedText.edit = jest.fn();
      clickedText.id = 'clicked-text';

      const objectElement = { id: 'clicked-text', classList: { contains: (cls: string) => cls === 'object' } };
      const event = createMouseEvent({
        composedPath: jest.fn().mockReturnValue([{}, objectElement]) as any,
      });
      mockCore.findObjectById.mockReturnValue(clickedText);

      tool.handlePointerDown(event);

      expect(activeText.save).toHaveBeenCalled();
      expect(clickedText.edit).toHaveBeenCalledWith(event);
      expect(KritzelText.create).not.toHaveBeenCalled();
    });

    it('should reset active text and switch to selection when clicking on non-text', () => {
      const activeText = Object.create(KritzelText.prototype);
      activeText.save = jest.fn();
      mockCore.store.activeText = activeText;

      tool.handlePointerDown(createMouseEvent());

      expect(mockCore.resetActiveText).toHaveBeenCalled();
      expect(mockCore.store.setState).toHaveBeenCalledWith('activeTool', mockSelectionTool);
      expect(KritzelText.create).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // handlePointerDown - Touch / Pen
  // ============================================

  describe('handlePointerDown (touch/pen)', () => {
    it('should create a text object when exactly one pointer is active (touch)', () => {
      mockState.pointers.set(1, { clientX: 120, clientY: 220 });
      const event = createTouchEvent();

      tool.handlePointerDown(event);

      expect(KritzelText.create).toHaveBeenCalledWith(mockCore, 16, 'Arial', 1);
      expect(mockObjectsMap.insert).toHaveBeenCalledWith(mockCreatedText);
      expect(mockCore.rerender).toHaveBeenCalled();
      expect(mockCreatedText.edit).toHaveBeenCalledWith(event);
    });

    it('should create a text object when exactly one pointer is active (pen)', () => {
      mockState.pointers.set(1, { clientX: 120, clientY: 220 });
      const event = createPenEvent();

      tool.handlePointerDown(event);

      expect(KritzelText.create).toHaveBeenCalled();
      expect(mockCreatedText.edit).toHaveBeenCalledWith(event);
    });

    it('should not create a text object when multiple pointers are active', () => {
      mockState.pointers.set(1, { clientX: 120, clientY: 220 });
      mockState.pointers.set(2, { clientX: 300, clientY: 400 });
      const event = createTouchEvent();

      tool.handlePointerDown(event);

      expect(KritzelText.create).not.toHaveBeenCalled();
    });

    it('should round coordinates for touch input', () => {
      mockCore.store.offsetX = 0;
      mockCore.store.offsetY = 0;
      mockState.pointers.set(1, { clientX: 120.7, clientY: 220.3 });
      const event = createTouchEvent();

      tool.handlePointerDown(event);

      // translateX = round(clientX - offsetX) - translateX) / scale = (121 - 0) / 1 = 121
      // translateY = round(clientY - offsetY) - translateY) / scale = (220 - 0) / 1 = 220
      expect(mockCreatedText.translateX).toBe(121);
      expect(mockCreatedText.translateY).toBe(220);
    });

    it('should apply viewport offset for touch', () => {
      mockCore.store.offsetX = 50;
      mockCore.store.offsetY = 30;
      mockState.pointers.set(1, { clientX: 200, clientY: 300 });
      const event = createTouchEvent();

      tool.handlePointerDown(event);

      // translateX = round(200 - 50) = 150, then (150 - 0) / 1 = 150
      expect(mockCreatedText.translateX).toBe(150);
      expect(mockCreatedText.translateY).toBe(270);
    });

    it('should pass scale=1 when lockDrawingScale is true (touch)', () => {
      mockState.scale = 2;
      mockState.lockDrawingScale = true;
      mockState.pointers.set(1, { clientX: 100, clientY: 200 });

      tool.handlePointerDown(createTouchEvent());

      expect(KritzelText.create).toHaveBeenCalledWith(mockCore, 16, 'Arial', 1);
    });

    it('should pass viewportScale when lockDrawingScale is false (touch)', () => {
      mockState.scale = 2;
      mockState.lockDrawingScale = false;
      mockState.pointers.set(1, { clientX: 100, clientY: 200 });

      tool.handlePointerDown(createTouchEvent());

      expect(KritzelText.create).toHaveBeenCalledWith(mockCore, 16, 'Arial', 2);
    });

    it('should edit existing text on touch (no active text)', () => {
      const existingText = Object.create(KritzelText.prototype);
      existingText.edit = jest.fn();
      existingText.id = 'existing-text';

      const objectElement = { id: 'existing-text', classList: { contains: (cls: string) => cls === 'object' } };
      const event = createTouchEvent({
        composedPath: jest.fn().mockReturnValue([{}, objectElement]) as any,
      });
      mockCore.findObjectById.mockReturnValue(existingText);
      mockCore.store.activeText = null;
      mockState.pointers.set(1, { clientX: 100, clientY: 200 });

      tool.handlePointerDown(event);

      expect(existingText.edit).toHaveBeenCalledWith(event);
      expect(KritzelText.create).not.toHaveBeenCalled();
    });

    it('should save active text and edit new one on touch', () => {
      const activeText = Object.create(KritzelText.prototype);
      activeText.save = jest.fn();
      mockCore.store.activeText = activeText;

      const clickedText = Object.create(KritzelText.prototype);
      clickedText.edit = jest.fn();
      clickedText.id = 'clicked-text';

      const objectElement = { id: 'clicked-text', classList: { contains: (cls: string) => cls === 'object' } };
      const event = createTouchEvent({
        composedPath: jest.fn().mockReturnValue([{}, objectElement]) as any,
      });
      mockCore.findObjectById.mockReturnValue(clickedText);
      mockState.pointers.set(1, { clientX: 100, clientY: 200 });

      tool.handlePointerDown(event);

      expect(activeText.save).toHaveBeenCalled();
      expect(clickedText.edit).toHaveBeenCalledWith(event);
    });

    it('should reset active text and switch to selection on touch when clicking non-text', () => {
      const activeText = Object.create(KritzelText.prototype);
      activeText.save = jest.fn();
      mockCore.store.activeText = activeText;
      mockState.pointers.set(1, { clientX: 100, clientY: 200 });

      tool.handlePointerDown(createTouchEvent());

      expect(mockCore.resetActiveText).toHaveBeenCalled();
      expect(mockCore.store.setState).toHaveBeenCalledWith('activeTool', mockSelectionTool);
    });
  });

  // ============================================
  // handlePointerUp
  // ============================================

  describe('handlePointerUp', () => {
    it('should focus active text when mounted but not focused', () => {
      const activeText = {
        isMounted: true,
        editor: { hasFocus: jest.fn().mockReturnValue(false) },
        focus: jest.fn(),
      };
      mockCore.store.activeText = activeText;
      const event = createMouseEvent({ clientX: 150, clientY: 250 });

      tool.handlePointerUp(event);

      expect(activeText.focus).toHaveBeenCalledWith({ x: 150, y: 250 });
    });

    it('should not focus when active text is already focused', () => {
      const activeText = {
        isMounted: true,
        editor: { hasFocus: jest.fn().mockReturnValue(true) },
        focus: jest.fn(),
      };
      mockCore.store.activeText = activeText;

      tool.handlePointerUp(createMouseEvent());

      expect(activeText.focus).not.toHaveBeenCalled();
    });

    it('should not focus when active text is not mounted', () => {
      const activeText = {
        isMounted: false,
        editor: { hasFocus: jest.fn().mockReturnValue(false) },
        focus: jest.fn(),
      };
      mockCore.store.activeText = activeText;

      tool.handlePointerUp(createMouseEvent());

      expect(activeText.focus).not.toHaveBeenCalled();
    });

    it('should not throw when no active text', () => {
      mockCore.store.activeText = null;

      expect(() => tool.handlePointerUp(createMouseEvent())).not.toThrow();
    });

    it('should focus when editor is null (optional chaining returns undefined, treated as not focused)', () => {
      const activeText = {
        isMounted: true,
        editor: null,
        focus: jest.fn(),
      };
      mockCore.store.activeText = activeText;

      tool.handlePointerUp(createMouseEvent());

      expect(activeText.focus).toHaveBeenCalledWith({ x: 100, y: 200 });
    });

    it('should focus for touch events', () => {
      const activeText = {
        isMounted: true,
        editor: { hasFocus: jest.fn().mockReturnValue(false) },
        focus: jest.fn(),
      };
      mockCore.store.activeText = activeText;
      const event = createTouchEvent({ clientX: 200, clientY: 300 });

      tool.handlePointerUp(event);

      expect(activeText.focus).toHaveBeenCalledWith({ x: 200, y: 300 });
    });
  });

  // ============================================
  // Live propagation of style changes to the active text
  // ============================================

  describe('style property setters propagate to active text', () => {
    let activeText: any;

    beforeEach(() => {
      activeText = Object.create(KritzelText.prototype);
      activeText.id = 'active-text';
      mockCore.store.activeText = activeText;
    });

    it('should update active text when fontFamily changes', () => {
      tool.fontFamily = 'Courier';

      expect(tool.fontFamily).toBe('Courier');
      expect(mockCore.updateObject).toHaveBeenCalledWith(activeText, { fontFamily: 'Courier' });
      expect(mockCore.rerender).toHaveBeenCalled();
    });

    it('should update active text when fontSize changes', () => {
      tool.fontSize = 24;

      expect(tool.fontSize).toBe(24);
      expect(mockCore.updateObject).toHaveBeenCalledWith(activeText, { fontSize: 24 });
      expect(mockCore.rerender).toHaveBeenCalled();
    });

    it('should update active text when fontColor changes', () => {
      const newColor = { light: '#ff0000', dark: '#ff0000' };

      tool.fontColor = newColor;

      expect(tool.fontColor).toEqual(newColor);
      expect(mockCore.updateObject).toHaveBeenCalledWith(activeText, { fontColor: newColor });
      expect(mockCore.rerender).toHaveBeenCalled();
    });

    it('should update active text when opacity changes', () => {
      tool.opacity = 0.5;

      expect(tool.opacity).toBe(0.5);
      expect(mockCore.updateObject).toHaveBeenCalledWith(activeText, { opacity: 0.5 });
      expect(mockCore.rerender).toHaveBeenCalled();
    });

    it('should not call updateObject when there is no active text', () => {
      mockCore.store.activeText = null;

      tool.fontFamily = 'Courier';
      tool.fontSize = 24;
      tool.fontColor = { light: '#ff0000', dark: '#ff0000' };
      tool.opacity = 0.5;

      expect(mockCore.updateObject).not.toHaveBeenCalled();
      expect(mockCore.rerender).not.toHaveBeenCalled();
    });

    it('should still persist the value on the tool when there is no active text', () => {
      mockCore.store.activeText = null;

      tool.fontFamily = 'Courier';
      tool.fontSize = 24;

      expect(tool.fontFamily).toBe('Courier');
      expect(tool.fontSize).toBe(24);
    });
  });
  // ============================================
  // Object titlebar
  // ============================================

  describe('object titlebar', () => {
    const startEditing = () => {
      const activeText = Object.create(KritzelText.prototype);
      activeText.save = jest.fn();
      mockCore.store.activeText = activeText;
      // setState is mocked, so install the selection tool the way the real store would
      const selectionTool = { handlePointerDown: jest.fn() };
      mockState.activeTool = selectionTool;
      return selectionTool;
    };

    it('continues a titlebar press as select-and-drag after ending the edit', () => {
      const selectionTool = startEditing();
      mockCore.objectTitlebarManager.getOwnerFromEvent.mockReturnValue({ id: 'owner-1' });
      const event = createMouseEvent();

      tool.handlePointerDown(event);

      expect(mockCore.resetActiveText).toHaveBeenCalled();
      expect(selectionTool.handlePointerDown).toHaveBeenCalledWith(event);
    });

    it('only ends the edit for presses outside titlebars', () => {
      const selectionTool = startEditing();

      tool.handlePointerDown(createMouseEvent());

      expect(mockCore.resetActiveText).toHaveBeenCalled();
      expect(selectionTool.handlePointerDown).not.toHaveBeenCalled();
    });
  });
});
