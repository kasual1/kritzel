import { KritzelShapeTool } from './shape-tool.class';
import { KritzelCore } from '../core/core.class';
import { KritzelShape } from '../objects/shape.class';
import { KritzelEventHelper } from '../../helpers/event.helper';
import { ShapeType } from '../../enums/shape-type.enum';
import { DEFAULT_COLOR_PALETTE } from '../../constants/color-palette.constants';

jest.mock('../core/core.class');
jest.mock('../objects/shape.class');
jest.mock('../../helpers/event.helper');

describe('KritzelShapeTool', () => {
  let tool: KritzelShapeTool;
  let mockCore: any;
  let mockObjectsMap: any;
  let mockState: any;
  let mockCreatedShape: any;
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
      update: jest.fn(),
      remove: jest.fn(),
      setActiveDrawingObject: jest.fn(),
      stopUndoCapturing: jest.fn(),
      transaction: jest.fn((cb: () => void) => cb()),
    };

    mockState = {
      isDrawing: false,
      scale: 1,
      translateX: 0,
      translateY: 0,
      lockDrawingScale: false,
      objects: mockObjectsMap,
      pointers: new Map(),
    };

    mockSelectionTool = { name: 'selection' };

    mockCreatedShape = {
      id: 'shape-1',
      workspaceId: 'ws-1',
      zIndex: 1,
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      translateX: 0,
      translateY: 0,
      updateDimensions: jest.fn(),
    };

    (KritzelShape.create as jest.Mock).mockReturnValue(mockCreatedShape);
    (KritzelEventHelper.isLeftClick as jest.Mock).mockReturnValue(true);

    mockCore = {
      store: {
        get state() { return mockState; },
        get objects() { return mockState.objects; },
        offsetX: 0,
        offsetY: 0,
        activeShape: null as any,
        currentZIndex: 5,
        setState: jest.fn(),
      },
      engine: {
        emitObjectsChange: jest.fn(),
        emitObjectsAdded: jest.fn(),
        emitObjectsRemoved: jest.fn(),
        emitObjectsUpdated: jest.fn(),
      },
      rerender: jest.fn(),
      findObjectById: jest.fn().mockReturnValue(undefined),
      selectObjects: jest.fn(),
      resetActiveShape: jest.fn(),
      toolRegistry: { getTool: jest.fn().mockReturnValue(mockSelectionTool) },
    } as unknown as jest.Mocked<KritzelCore>;

    tool = new KritzelShapeTool(mockCore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // Default properties
  // ============================================

  describe('default properties', () => {
    it('should have default shapeType of Rectangle', () => {
      expect(tool.shapeType).toBe(ShapeType.Rectangle);
    });

    it('should have transparent fillColor', () => {
      expect(tool.fillColor).toEqual({ light: 'transparent', dark: 'transparent' });
    });

    it('should have default strokeColor from palette', () => {
      expect(tool.strokeColor).toEqual(DEFAULT_COLOR_PALETTE[0]);
    });

    it('should have default strokeWidth of 4', () => {
      expect(tool.strokeWidth).toBe(4);
    });

    it('should have default opacity of 1', () => {
      expect(tool.opacity).toBe(1);
    });

    it('should have default fontFamily of Arial', () => {
      expect(tool.fontFamily).toBe('Arial');
    });

    it('should have default fontSize of 16', () => {
      expect(tool.fontSize).toBe(16);
    });

    it('should have default fontColor from palette', () => {
      expect(tool.fontColor).toEqual(DEFAULT_COLOR_PALETTE[0]);
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

    it('should create a shape on left click', () => {
      const event = createMouseEvent({ clientX: 150, clientY: 250 });

      tool.handlePointerDown(event);

      expect(KritzelShape.create).toHaveBeenCalledWith(mockCore, expect.objectContaining({
        x: 150,
        y: 250,
        width: 1,
        height: 1,
        shapeType: ShapeType.Rectangle,
        fillColor: tool.fillColor,
        strokeColor: tool.strokeColor,
        strokeWidth: tool.strokeWidth,
        opacity: tool.opacity,
        fontSize: tool.fontSize,
        fontFamily: tool.fontFamily,
      }));
      expect(mockObjectsMap.insert).toHaveBeenCalledWith(mockCreatedShape);
      expect(mockCore.rerender).toHaveBeenCalled();
    });

    it('should broadcast activeObjectId on left click', () => {
      const event = createMouseEvent({ clientX: 150, clientY: 250 });

      tool.handlePointerDown(event);

      expect(mockObjectsMap.setActiveDrawingObject).toHaveBeenCalledWith(mockCreatedShape.id);
    });

    it('should not create a shape on non-left click', () => {
      (KritzelEventHelper.isLeftClick as jest.Mock).mockReturnValue(false);
      const event = createMouseEvent({ button: 2 });

      tool.handlePointerDown(event);

      expect(KritzelShape.create).not.toHaveBeenCalled();
    });

    it('should apply viewport offset to coordinates', () => {
      mockCore.store.offsetX = 50;
      mockCore.store.offsetY = 30;
      const event = createMouseEvent({ clientX: 200, clientY: 300 });

      tool.handlePointerDown(event);

      expect(KritzelShape.create).toHaveBeenCalledWith(mockCore, expect.objectContaining({
        x: 200 - 50,
        y: 300 - 30,
      }));
    });

    it('should use viewport scale as divider when lockDrawingScale is true', () => {
      mockState.scale = 2;
      mockState.lockDrawingScale = true;
      mockState.translateX = 100;
      mockState.translateY = 50;
      const event = createMouseEvent({ clientX: 200, clientY: 300 });

      tool.handlePointerDown(event);

      expect(KritzelShape.create).toHaveBeenCalledWith(mockCore, expect.objectContaining({
        x: 200 / 2,
        y: 300 / 2,
        translateX: -100 / 2,
        translateY: -50 / 2,
        scale: 1,
      }));
    });

    it('should use scale=viewportScale when lockDrawingScale is false', () => {
      mockState.scale = 2;
      mockState.lockDrawingScale = false;
      mockState.translateX = 100;
      mockState.translateY = 50;
      const event = createMouseEvent({ clientX: 200, clientY: 300 });

      tool.handlePointerDown(event);

      expect(KritzelShape.create).toHaveBeenCalledWith(mockCore, expect.objectContaining({
        x: 200,
        y: 300,
        translateX: -100,
        translateY: -50,
        scale: 2,
      }));
    });

    it('should use custom shapeType when changed', () => {
      tool.shapeType = ShapeType.Ellipse;
      const event = createMouseEvent();

      tool.handlePointerDown(event);

      expect(KritzelShape.create).toHaveBeenCalledWith(mockCore, expect.objectContaining({
        shapeType: ShapeType.Ellipse,
      }));
    });

    it('should edit existing shape when clicking on it with no active shape', () => {
      const existingShape = Object.create(KritzelShape.prototype);
      existingShape.edit = jest.fn();
      existingShape.id = 'existing-shape';

      const objectElement = { id: 'existing-shape', classList: { contains: (cls: string) => cls === 'object' } };
      const event = createMouseEvent({
        composedPath: jest.fn().mockReturnValue([{}, objectElement]) as any,
      });
      mockCore.findObjectById.mockReturnValue(existingShape);
      mockCore.store.activeShape = null;

      tool.handlePointerDown(event);

      expect(existingShape.edit).toHaveBeenCalledWith(event);
      expect(KritzelShape.create).not.toHaveBeenCalled();
    });

    it('should save active shape and edit new one when clicking on different shape', () => {
      const activeShape = Object.create(KritzelShape.prototype);
      activeShape.save = jest.fn();
      mockCore.store.activeShape = activeShape;

      const clickedShape = Object.create(KritzelShape.prototype);
      clickedShape.edit = jest.fn();
      clickedShape.id = 'clicked-shape';

      const objectElement = { id: 'clicked-shape', classList: { contains: (cls: string) => cls === 'object' } };
      const event = createMouseEvent({
        composedPath: jest.fn().mockReturnValue([{}, objectElement]) as any,
      });
      mockCore.findObjectById.mockReturnValue(clickedShape);

      tool.handlePointerDown(event);

      expect(activeShape.save).toHaveBeenCalled();
      expect(clickedShape.edit).toHaveBeenCalledWith(event);
      expect(KritzelShape.create).not.toHaveBeenCalled();
    });

    it('should reset active shape and switch to selection when clicking on non-shape', () => {
      const activeShape = Object.create(KritzelShape.prototype);
      activeShape.save = jest.fn();
      mockCore.store.activeShape = activeShape;

      tool.handlePointerDown(createMouseEvent());

      expect(mockCore.resetActiveShape).toHaveBeenCalled();
      expect(mockCore.store.setState).toHaveBeenCalledWith('activeTool', mockSelectionTool);
      expect(KritzelShape.create).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // handlePointerDown - Touch / Pen
  // ============================================

  describe('handlePointerDown (touch/pen)', () => {
    it('should create a shape when exactly one pointer is active (touch)', () => {
      mockState.pointers.set(1, { clientX: 120, clientY: 220 });
      const event = createTouchEvent();

      tool.handlePointerDown(event);

      expect(KritzelShape.create).toHaveBeenCalledWith(mockCore, expect.objectContaining({
        x: 120,
        y: 220,
        width: 1,
        height: 1,
      }));
      expect(mockObjectsMap.insert).toHaveBeenCalled();
    });

    it('should broadcast activeObjectId on single touch', () => {
      mockState.pointers.set(1, { clientX: 120, clientY: 220 });
      const event = createTouchEvent();

      tool.handlePointerDown(event);

      expect(mockObjectsMap.setActiveDrawingObject).toHaveBeenCalledWith(mockCreatedShape.id);
    });

    it('should create a shape when exactly one pointer is active (pen)', () => {
      mockState.pointers.set(1, { clientX: 120, clientY: 220 });
      const event = createPenEvent();

      tool.handlePointerDown(event);

      expect(KritzelShape.create).toHaveBeenCalled();
    });

    it('should not create a shape when multiple pointers are active', () => {
      mockState.pointers.set(1, { clientX: 120, clientY: 220 });
      mockState.pointers.set(2, { clientX: 300, clientY: 400 });
      const event = createTouchEvent();

      tool.handlePointerDown(event);

      expect(KritzelShape.create).not.toHaveBeenCalled();
    });

    it('should round coordinates for touch input', () => {
      mockState.pointers.set(1, { clientX: 120.7, clientY: 220.3 });
      const event = createTouchEvent();

      tool.handlePointerDown(event);

      expect(KritzelShape.create).toHaveBeenCalledWith(mockCore, expect.objectContaining({
        x: 121,
        y: 220,
      }));
    });

    it('should apply lockDrawingScale for touch', () => {
      mockState.scale = 2;
      mockState.lockDrawingScale = true;
      mockState.translateX = 100;
      mockState.translateY = 50;
      mockState.pointers.set(1, { clientX: 200, clientY: 300 });
      const event = createTouchEvent();

      tool.handlePointerDown(event);

      expect(KritzelShape.create).toHaveBeenCalledWith(mockCore, expect.objectContaining({
        x: Math.round(200 / 2),
        y: Math.round(300 / 2),
        translateX: -100 / 2,
        translateY: -50 / 2,
        scale: 1,
      }));
    });

    it('should edit existing shape on touch (no active shape)', () => {
      const existingShape = Object.create(KritzelShape.prototype);
      existingShape.edit = jest.fn();
      existingShape.id = 'existing-shape';

      const objectElement = { id: 'existing-shape', classList: { contains: (cls: string) => cls === 'object' } };
      const event = createTouchEvent({
        composedPath: jest.fn().mockReturnValue([{}, objectElement]) as any,
      });
      mockCore.findObjectById.mockReturnValue(existingShape);
      mockCore.store.activeShape = null;
      mockState.pointers.set(1, { clientX: 100, clientY: 200 });

      tool.handlePointerDown(event);

      expect(existingShape.edit).toHaveBeenCalledWith(event);
      expect(KritzelShape.create).not.toHaveBeenCalled();
    });

    it('should reset active shape and switch to selection on touch when clicking non-shape', () => {
      const activeShape = Object.create(KritzelShape.prototype);
      activeShape.save = jest.fn();
      mockCore.store.activeShape = activeShape;
      mockState.pointers.set(1, { clientX: 100, clientY: 200 });

      tool.handlePointerDown(createTouchEvent());

      expect(mockCore.resetActiveShape).toHaveBeenCalled();
      expect(mockCore.store.setState).toHaveBeenCalledWith('activeTool', mockSelectionTool);
    });
  });

  // ============================================
  // handlePointerMove - Mouse
  // ============================================

  describe('handlePointerMove (mouse)', () => {
    it('should call preventDefault when event is cancelable', () => {
      const event = createMouseEvent();

      tool.handlePointerMove(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should not call preventDefault when event is not cancelable', () => {
      const event = createMouseEvent({ cancelable: false });

      tool.handlePointerMove(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should do nothing when not drawing', () => {
      tool.handlePointerMove(createMouseEvent({ clientX: 300, clientY: 400 }));

      expect(mockObjectsMap.update).not.toHaveBeenCalled();
    });

    it('should update shape size during mouse drag', () => {
      // Start drawing at (100, 200)
      tool.handlePointerDown(createMouseEvent({ clientX: 100, clientY: 200 }));

      // Move to (300, 400)
      tool.handlePointerMove(createMouseEvent({ clientX: 300, clientY: 400 }));

      expect(mockCreatedShape.x).toBe(100);
      expect(mockCreatedShape.y).toBe(200);
      expect(mockCreatedShape.width).toBe(200);
      expect(mockCreatedShape.height).toBe(200);
      expect(mockCreatedShape.updateDimensions).toHaveBeenCalled();
      expect(mockObjectsMap.update).toHaveBeenCalledWith(mockCreatedShape);
    });

    it('should handle negative direction drag (left/up)', () => {
      // Start at (300, 400), drag to (100, 200)
      tool.handlePointerDown(createMouseEvent({ clientX: 300, clientY: 400 }));

      tool.handlePointerMove(createMouseEvent({ clientX: 100, clientY: 200 }));

      expect(mockCreatedShape.x).toBe(100);
      expect(mockCreatedShape.y).toBe(200);
      expect(mockCreatedShape.width).toBe(200);
      expect(mockCreatedShape.height).toBe(200);
    });

    it('should enforce minimum width/height of 1', () => {
      tool.handlePointerDown(createMouseEvent({ clientX: 100, clientY: 200 }));

      // Move to same position
      tool.handlePointerMove(createMouseEvent({ clientX: 100, clientY: 200 }));

      expect(mockCreatedShape.width).toBe(1);
      expect(mockCreatedShape.height).toBe(1);
    });

    it('should apply viewport offset during move', () => {
      mockCore.store.offsetX = 50;
      mockCore.store.offsetY = 30;

      tool.handlePointerDown(createMouseEvent({ clientX: 150, clientY: 230 }));

      tool.handlePointerMove(createMouseEvent({ clientX: 350, clientY: 430 }));

      // startX = (150-50) = 100, currentX = (350-50) = 300
      // startY = (230-30) = 200, currentY = (430-30) = 400
      expect(mockCreatedShape.x).toBe(100);
      expect(mockCreatedShape.y).toBe(200);
      expect(mockCreatedShape.width).toBe(200);
      expect(mockCreatedShape.height).toBe(200);
    });

    it('should apply lockDrawingScale during move', () => {
      mockState.scale = 2;
      mockState.lockDrawingScale = true;

      tool.handlePointerDown(createMouseEvent({ clientX: 100, clientY: 200 }));

      tool.handlePointerMove(createMouseEvent({ clientX: 300, clientY: 400 }));

      // startX = 100/2 = 50, currentX = 300/2 = 150
      // startY = 200/2 = 100, currentY = 400/2 = 200
      expect(mockCreatedShape.x).toBe(50);
      expect(mockCreatedShape.y).toBe(100);
      expect(mockCreatedShape.width).toBe(100);
      expect(mockCreatedShape.height).toBe(100);
    });
  });

  // ============================================
  // handlePointerMove - Touch / Pen
  // ============================================

  describe('handlePointerMove (touch/pen)', () => {
    it('should update shape size when exactly one pointer is active', () => {
      mockState.pointers.set(1, { clientX: 100, clientY: 200 });
      tool.handlePointerDown(createTouchEvent());

      mockState.pointers.clear();
      mockState.pointers.set(1, { clientX: 300, clientY: 400 });
      tool.handlePointerMove(createTouchEvent());

      expect(mockCreatedShape.width).toBe(200);
      expect(mockCreatedShape.height).toBe(200);
      expect(mockObjectsMap.update).toHaveBeenCalledWith(mockCreatedShape);
    });

    it('should not update when multiple pointers are active', () => {
      mockState.pointers.set(1, { clientX: 100, clientY: 200 });
      tool.handlePointerDown(createTouchEvent());
      jest.clearAllMocks();

      mockState.pointers.set(2, { clientX: 300, clientY: 400 });
      tool.handlePointerMove(createTouchEvent());

      expect(mockObjectsMap.update).not.toHaveBeenCalled();
    });

    it('should round coordinates for touch move', () => {
      mockState.pointers.set(1, { clientX: 100, clientY: 200 });
      tool.handlePointerDown(createTouchEvent());

      mockState.pointers.clear();
      mockState.pointers.set(1, { clientX: 300.7, clientY: 400.3 });
      tool.handlePointerMove(createTouchEvent());

      // currentX = round(300.7) = 301, currentY = round(400.3) = 400
      expect(mockCreatedShape.width).toBe(201);
      expect(mockCreatedShape.height).toBe(200);
    });

    it('should do nothing when not drawing (touch)', () => {
      tool.handlePointerMove(createTouchEvent());

      expect(mockObjectsMap.update).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // handlePointerUp - Mouse
  // ============================================

  describe('handlePointerUp (mouse)', () => {
    it('should call preventDefault when event is cancelable', () => {
      const event = createMouseEvent();

      tool.handlePointerUp(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should not call preventDefault when event is not cancelable', () => {
      const event = createMouseEvent({ cancelable: false });

      tool.handlePointerUp(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should do nothing when not drawing', () => {
      tool.handlePointerUp(createMouseEvent());

      expect(mockCore.rerender).not.toHaveBeenCalled();
      expect(mockCore.engine.emitObjectsChange).not.toHaveBeenCalled();
    });

    it('should finish drawing and select shape when large enough', () => {
      // Start drawing
      tool.handlePointerDown(createMouseEvent({ clientX: 100, clientY: 200 }));

      // Move to create a large shape
      mockCreatedShape.width = 100;
      mockCreatedShape.height = 100;
      tool.handlePointerMove(createMouseEvent({ clientX: 200, clientY: 300 }));

      jest.clearAllMocks();

      // Finish drawing
      tool.handlePointerUp(createMouseEvent());

      expect(mockCreatedShape.zIndex).toBe(5);
      expect(mockObjectsMap.update).toHaveBeenCalledWith(mockCreatedShape);
      expect(mockCore.engine.emitObjectsChange).toHaveBeenCalled();
      expect(mockCore.selectObjects).toHaveBeenCalledWith([mockCreatedShape]);
      expect(mockCore.store.setState).toHaveBeenCalledWith('activeTool', mockSelectionTool);
      expect(mockCore.rerender).toHaveBeenCalled();
    });

    it('should clear activeObjectId on pointer up', () => {
      tool.handlePointerDown(createMouseEvent({ clientX: 100, clientY: 200 }));

      mockCreatedShape.width = 100;
      mockCreatedShape.height = 100;
      tool.handlePointerMove(createMouseEvent({ clientX: 200, clientY: 300 }));

      tool.handlePointerUp(createMouseEvent());

      expect(mockObjectsMap.setActiveDrawingObject).toHaveBeenCalledWith(null);
    });

    it('should remove shape when too small (accidental click)', () => {
      // Start drawing
      tool.handlePointerDown(createMouseEvent({ clientX: 100, clientY: 200 }));

      // Shape stays small
      mockCreatedShape.width = 5;
      mockCreatedShape.height = 5;

      jest.clearAllMocks();

      // Finish drawing
      tool.handlePointerUp(createMouseEvent());

      expect(mockObjectsMap.remove).toHaveBeenCalledWith(expect.any(Function));
      expect(mockCore.engine.emitObjectsChange).not.toHaveBeenCalled();
      expect(mockCore.selectObjects).not.toHaveBeenCalled();
      expect(mockCore.rerender).toHaveBeenCalled();
    });

    it('should not remove shape when only width is below threshold', () => {
      tool.handlePointerDown(createMouseEvent());
      mockCreatedShape.width = 9;
      mockCreatedShape.height = 50;

      tool.handlePointerUp(createMouseEvent());

      expect(mockObjectsMap.remove).not.toHaveBeenCalled();
      expect(mockCore.selectObjects).toHaveBeenCalledWith([mockCreatedShape]);
    });

    it('should not remove shape when only height is below threshold', () => {
      tool.handlePointerDown(createMouseEvent());
      mockCreatedShape.width = 50;
      mockCreatedShape.height = 9;

      tool.handlePointerUp(createMouseEvent());

      expect(mockObjectsMap.remove).not.toHaveBeenCalled();
      expect(mockCore.selectObjects).toHaveBeenCalledWith([mockCreatedShape]);
    });

    it('should keep shape when exactly at threshold (10)', () => {
      tool.handlePointerDown(createMouseEvent());
      mockCreatedShape.width = 10;
      mockCreatedShape.height = 10;

      tool.handlePointerUp(createMouseEvent());

      expect(mockObjectsMap.remove).not.toHaveBeenCalled();
      expect(mockCore.selectObjects).toHaveBeenCalledWith([mockCreatedShape]);
    });

    it('should clear drawing state after finish', () => {
      tool.handlePointerDown(createMouseEvent());
      mockCreatedShape.width = 100;
      mockCreatedShape.height = 100;

      tool.handlePointerUp(createMouseEvent());

      // Subsequent move should not update anything
      jest.clearAllMocks();
      tool.handlePointerMove(createMouseEvent({ clientX: 500, clientY: 500 }));
      expect(mockObjectsMap.update).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // handlePointerUp - Touch / Pen
  // ============================================

  describe('handlePointerUp (touch/pen)', () => {
    it('should finish drawing and select shape for touch', () => {
      mockState.pointers.set(1, { clientX: 100, clientY: 200 });
      tool.handlePointerDown(createTouchEvent());
      mockCreatedShape.width = 100;
      mockCreatedShape.height = 100;

      jest.clearAllMocks();

      tool.handlePointerUp(createTouchEvent());

      expect(mockCore.engine.emitObjectsChange).toHaveBeenCalled();
      expect(mockCore.selectObjects).toHaveBeenCalledWith([mockCreatedShape]);
      expect(mockCore.store.setState).toHaveBeenCalledWith('activeTool', mockSelectionTool);
      expect(mockCore.rerender).toHaveBeenCalled();
    });

    it('should finish drawing and select shape for pen', () => {
      mockState.pointers.set(1, { clientX: 100, clientY: 200 });
      tool.handlePointerDown(createPenEvent());
      mockCreatedShape.width = 100;
      mockCreatedShape.height = 100;

      jest.clearAllMocks();

      tool.handlePointerUp(createPenEvent());

      expect(mockCore.selectObjects).toHaveBeenCalledWith([mockCreatedShape]);
    });

    it('should remove small shape for touch', () => {
      mockState.pointers.set(1, { clientX: 100, clientY: 200 });
      tool.handlePointerDown(createTouchEvent());
      mockCreatedShape.width = 3;
      mockCreatedShape.height = 3;

      tool.handlePointerUp(createTouchEvent());

      expect(mockObjectsMap.remove).toHaveBeenCalled();
      expect(mockCore.selectObjects).not.toHaveBeenCalled();
    });

    it('should do nothing when not drawing (touch)', () => {
      tool.handlePointerUp(createTouchEvent());

      expect(mockCore.rerender).not.toHaveBeenCalled();
      expect(mockCore.engine.emitObjectsChange).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // Full drawing flow
  // ============================================

  describe('full drawing flow', () => {
    it('should complete a full mouse shape drawing cycle', () => {
      // 1. Pointer down - start drawing
      tool.handlePointerDown(createMouseEvent({ clientX: 50, clientY: 60 }));
      expect(KritzelShape.create).toHaveBeenCalledTimes(1);
      expect(mockObjectsMap.insert).toHaveBeenCalledTimes(1);

      // 2. Pointer move - resize shape
      tool.handlePointerMove(createMouseEvent({ clientX: 200, clientY: 300 }));
      expect(mockCreatedShape.width).toBe(150);
      expect(mockCreatedShape.height).toBe(240);
      expect(mockObjectsMap.update).toHaveBeenCalledTimes(1);

      // 3. Pointer up - finish drawing
      tool.handlePointerUp(createMouseEvent());
      expect(mockCreatedShape.zIndex).toBe(5);
      expect(mockCore.engine.emitObjectsChange).toHaveBeenCalledTimes(1);
      expect(mockCore.selectObjects).toHaveBeenCalledWith([mockCreatedShape]);
      expect(mockCore.store.setState).toHaveBeenCalledWith('activeTool', mockSelectionTool);
    });

    it('should complete a full touch shape drawing cycle', () => {
      // 1. Pointer down
      mockState.pointers.set(1, { clientX: 50, clientY: 60 });
      tool.handlePointerDown(createTouchEvent());
      expect(KritzelShape.create).toHaveBeenCalledTimes(1);

      // 2. Pointer move
      mockState.pointers.clear();
      mockState.pointers.set(1, { clientX: 200, clientY: 300 });
      tool.handlePointerMove(createTouchEvent());
      expect(mockObjectsMap.update).toHaveBeenCalled();

      // 3. Pointer up
      tool.handlePointerUp(createTouchEvent());
      expect(mockCore.selectObjects).toHaveBeenCalledWith([mockCreatedShape]);
    });

    it('should handle accidental click (too small shape)', () => {
      // 1. Pointer down
      tool.handlePointerDown(createMouseEvent({ clientX: 100, clientY: 200 }));
      expect(mockObjectsMap.insert).toHaveBeenCalledTimes(1);

      // 2. Small move
      tool.handlePointerMove(createMouseEvent({ clientX: 105, clientY: 205 }));

      // 3. Pointer up - shape too small, removed
      tool.handlePointerUp(createMouseEvent());
      expect(mockObjectsMap.remove).toHaveBeenCalled();
      expect(mockCore.selectObjects).not.toHaveBeenCalled();
      expect(mockCore.rerender).toHaveBeenCalled();
    });
  });
});
