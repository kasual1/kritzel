import { KritzelLineTool } from './line-tool.class';
import { KritzelCore } from '../core/core.class';
import { KritzelLine } from '../objects/line.class';
import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { DEFAULT_COLOR_PALETTE } from '../../constants/color-palette.constants';

jest.mock('../core/core.class');
jest.mock('../objects/line.class');
jest.mock('../../helpers/event.helper');
jest.mock('../objects/selection-group.class');

describe('KritzelLineTool', () => {
  let tool: KritzelLineTool;
  let mockCore: any;
  let mockObjectsMap: any;
  let mockState: any;
  let mockCreatedLine: any;
  let mockSelectionGroup: any;
  let mockSelectionTool: any;

  const createMouseEvent = (overrides: Partial<PointerEvent> = {}): PointerEvent => {
    return {
      pointerType: 'mouse',
      button: 0,
      clientX: 100,
      clientY: 200,
      cancelable: true,
      preventDefault: jest.fn(),
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
      ...overrides,
    } as unknown as PointerEvent;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockObjectsMap = {
      insert: jest.fn(),
      update: jest.fn(),
      findById: jest.fn().mockReturnValue(undefined),
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

    mockSelectionGroup = {
      addOrRemove: jest.fn(),
      isSelected: false,
      rotation: 0,
    };
    (KritzelSelectionGroup.create as jest.Mock).mockReturnValue(mockSelectionGroup);

    mockCreatedLine = {
      id: 'line-1',
      workspaceId: 'ws-1',
      zIndex: 1,
      isCompleted: false,
      rotation: 0,
    };

    (KritzelLine.create as jest.Mock).mockReturnValue(mockCreatedLine);
    (KritzelEventHelper.isLeftClick as jest.Mock).mockReturnValue(true);

    mockCore = {
      store: {
        get state() { return mockState; },
        get objects() { return mockState.objects; },
        offsetX: 0,
        offsetY: 0,
        setState: jest.fn(),
      },
      engine: {
        emitObjectsChange: jest.fn(),
        emitObjectsAdded: jest.fn(),
        emitObjectsRemoved: jest.fn(),
        emitObjectsUpdated: jest.fn(),
      },
      addSelectionGroup: jest.fn(),
      rerender: jest.fn(),
      toolRegistry: { getTool: jest.fn().mockReturnValue(mockSelectionTool) },
    } as unknown as jest.Mocked<KritzelCore>;

    tool = new KritzelLineTool(mockCore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // Default properties
  // ============================================

  describe('default properties', () => {
    it('should have default color from palette', () => {
      expect(tool.color).toEqual(DEFAULT_COLOR_PALETTE[0]);
    });

    it('should have default size of 4', () => {
      expect(tool.size).toBe(4);
    });

    it('should have default opacity of 1', () => {
      expect(tool.opacity).toBe(1);
    });

    it('should have default palette matching DEFAULT_COLOR_PALETTE', () => {
      expect(tool.palette).toEqual(DEFAULT_COLOR_PALETTE);
    });

    it('should have undefined arrows by default', () => {
      expect(tool.arrows).toBeUndefined();
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

    it('should create a line on left click', () => {
      const event = createMouseEvent({ clientX: 150, clientY: 250 });

      tool.handlePointerDown(event);

      expect(KritzelLine.create).toHaveBeenCalledWith(mockCore, expect.objectContaining({
        startX: 150,
        startY: 250,
        endX: 150,
        endY: 250,
        stroke: tool.color,
        strokeWidth: tool.size,
        opacity: tool.opacity,
      }));
      expect(mockObjectsMap.insert).toHaveBeenCalledWith(mockCreatedLine);
      expect(mockState.isDrawing).toBe(true);
      expect(mockCreatedLine.isCompleted).toBe(false);
    });

    it('should broadcast activeObjectId on left click', () => {
      const event = createMouseEvent({ clientX: 150, clientY: 250 });

      tool.handlePointerDown(event);

      expect(mockObjectsMap.setActiveDrawingObject).toHaveBeenCalledWith(mockCreatedLine.id);
    });

    it('should not create a line on non-left click', () => {
      (KritzelEventHelper.isLeftClick as jest.Mock).mockReturnValue(false);
      const event = createMouseEvent({ button: 2 });

      tool.handlePointerDown(event);

      expect(KritzelLine.create).not.toHaveBeenCalled();
      expect(mockState.isDrawing).toBe(false);
    });

    it('should apply viewport offset to coordinates', () => {
      mockCore.store.offsetX = 50;
      mockCore.store.offsetY = 30;
      const event = createMouseEvent({ clientX: 200, clientY: 300 });

      tool.handlePointerDown(event);

      expect(KritzelLine.create).toHaveBeenCalledWith(mockCore, expect.objectContaining({
        startX: 200 - 50,
        startY: 300 - 30,
        endX: 200 - 50,
        endY: 300 - 30,
      }));
    });

    it('should use viewport scale as divider when lockDrawingScale is true', () => {
      mockState.scale = 2;
      mockState.lockDrawingScale = true;
      mockState.translateX = 100;
      mockState.translateY = 50;
      const event = createMouseEvent({ clientX: 200, clientY: 300 });

      tool.handlePointerDown(event);

      expect(KritzelLine.create).toHaveBeenCalledWith(mockCore, expect.objectContaining({
        startX: 200 / 2,
        startY: 300 / 2,
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

      expect(KritzelLine.create).toHaveBeenCalledWith(mockCore, expect.objectContaining({
        startX: 200,
        startY: 300,
        translateX: -100,
        translateY: -50,
        scale: 2,
      }));
    });

    it('should pass arrows config to created line', () => {
      const arrows = { start: { enabled: true }, end: { enabled: false } };
      tool.arrows = arrows;
      const event = createMouseEvent();

      tool.handlePointerDown(event);

      expect(KritzelLine.create).toHaveBeenCalledWith(mockCore, expect.objectContaining({
        arrows,
      }));
    });
  });

  // ============================================
  // handlePointerDown - Touch / Pen
  // ============================================

  describe('handlePointerDown (touch/pen)', () => {
    it('should create a line when exactly one pointer is active (touch)', () => {
      mockState.pointers.set(1, { clientX: 120, clientY: 220 });
      const event = createTouchEvent();

      tool.handlePointerDown(event);

      expect(KritzelLine.create).toHaveBeenCalledWith(mockCore, expect.objectContaining({
        startX: 120,
        startY: 220,
        endX: 120,
        endY: 220,
      }));
      expect(mockObjectsMap.insert).toHaveBeenCalled();
      expect(mockState.isDrawing).toBe(true);
    });

    it('should broadcast activeObjectId on single touch', () => {
      mockState.pointers.set(1, { clientX: 120, clientY: 220 });
      const event = createTouchEvent();

      tool.handlePointerDown(event);

      expect(mockObjectsMap.setActiveDrawingObject).toHaveBeenCalledWith(mockCreatedLine.id);
    });

    it('should create a line when exactly one pointer is active (pen)', () => {
      mockState.pointers.set(1, { clientX: 120, clientY: 220 });
      const event = createPenEvent();

      tool.handlePointerDown(event);

      expect(KritzelLine.create).toHaveBeenCalled();
      expect(mockState.isDrawing).toBe(true);
    });

    it('should not create a line when multiple pointers are active', () => {
      mockState.pointers.set(1, { clientX: 120, clientY: 220 });
      mockState.pointers.set(2, { clientX: 300, clientY: 400 });
      const event = createTouchEvent();

      tool.handlePointerDown(event);

      expect(mockState.isDrawing).toBe(false);
    });

    it('should not create a line when no pointers are active', () => {
      const event = createTouchEvent();

      tool.handlePointerDown(event);

      expect(mockState.isDrawing).toBe(false);
    });

    it('should round coordinates for touch input', () => {
      mockState.pointers.set(1, { clientX: 120.7, clientY: 220.3 });
      const event = createTouchEvent();

      tool.handlePointerDown(event);

      expect(KritzelLine.create).toHaveBeenCalledWith(mockCore, expect.objectContaining({
        startX: 121,
        startY: 220,
        endX: 121,
        endY: 220,
      }));
    });

    it('should apply viewport offset for touch input', () => {
      mockCore.store.offsetX = 50;
      mockCore.store.offsetY = 30;
      mockState.pointers.set(1, { clientX: 200, clientY: 300 });
      const event = createTouchEvent();

      tool.handlePointerDown(event);

      expect(KritzelLine.create).toHaveBeenCalledWith(mockCore, expect.objectContaining({
        startX: Math.round((200 - 50) / 1),
        startY: Math.round((300 - 30) / 1),
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

      expect(KritzelLine.create).toHaveBeenCalledWith(mockCore, expect.objectContaining({
        startX: Math.round(200 / 2),
        startY: Math.round(300 / 2),
        translateX: -100 / 2,
        translateY: -50 / 2,
        scale: 1,
      }));
    });

    it('should pass arrows config for touch line', () => {
      const arrows = { end: { enabled: true, style: 'triangle' as const } };
      tool.arrows = arrows;
      mockState.pointers.set(1, { clientX: 100, clientY: 200 });
      const event = createTouchEvent();

      tool.handlePointerDown(event);

      expect(KritzelLine.create).toHaveBeenCalledWith(mockCore, expect.objectContaining({
        arrows,
      }));
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

    it('should update line end point when drawing', () => {
      // Start drawing
      tool.handlePointerDown(createMouseEvent({ clientX: 50, clientY: 60 }));

      mockObjectsMap.findById.mockReturnValue(mockCreatedLine);
      const updatedLine = { id: 'new-id', workspaceId: 'new-ws', zIndex: 99, isCompleted: true };
      (KritzelLine.create as jest.Mock).mockReturnValue(updatedLine);

      const moveEvent = createMouseEvent({ clientX: 150, clientY: 260 });
      tool.handlePointerMove(moveEvent);

      expect(KritzelLine.create).toHaveBeenLastCalledWith(mockCore, expect.objectContaining({
        startX: 50,
        startY: 60,
        endX: 150,
        endY: 260,
      }));
      expect(mockObjectsMap.update).toHaveBeenCalledWith(updatedLine);
    });

    it('should preserve line id, workspaceId, and zIndex on update', () => {
      tool.handlePointerDown(createMouseEvent({ clientX: 50, clientY: 60 }));

      const currentLine = { ...mockCreatedLine, id: 'line-1', workspaceId: 'ws-1', zIndex: 5 };
      mockObjectsMap.findById.mockReturnValue(currentLine);

      const updatedLine = { id: 'new-id', workspaceId: 'new-ws', zIndex: 99, isCompleted: true };
      (KritzelLine.create as jest.Mock).mockReturnValue(updatedLine);

      tool.handlePointerMove(createMouseEvent({ clientX: 150, clientY: 260 }));

      expect(updatedLine.id).toBe('line-1');
      expect(updatedLine.workspaceId).toBe('ws-1');
      expect(updatedLine.zIndex).toBe(5);
      expect(updatedLine.isCompleted).toBe(false);
    });

    it('should not update when not drawing', () => {
      tool.handlePointerMove(createMouseEvent({ clientX: 150, clientY: 260 }));

      expect(mockObjectsMap.update).not.toHaveBeenCalled();
    });

    it('should not update when current line is not found by findById', () => {
      tool.handlePointerDown(createMouseEvent({ clientX: 50, clientY: 60 }));
      mockObjectsMap.findById.mockReturnValue(undefined);

      tool.handlePointerMove(createMouseEvent({ clientX: 150, clientY: 260 }));

      expect(mockObjectsMap.update).not.toHaveBeenCalled();
    });

    it('should apply viewport offset during move', () => {
      mockCore.store.offsetX = 50;
      mockCore.store.offsetY = 30;
      tool.handlePointerDown(createMouseEvent({ clientX: 200, clientY: 300 }));

      mockObjectsMap.findById.mockReturnValue(mockCreatedLine);
      (KritzelLine.create as jest.Mock).mockReturnValue({ ...mockCreatedLine });

      tool.handlePointerMove(createMouseEvent({ clientX: 400, clientY: 500 }));

      expect(KritzelLine.create).toHaveBeenLastCalledWith(mockCore, expect.objectContaining({
        startX: 200 - 50,
        startY: 300 - 30,
        endX: 400 - 50,
        endY: 500 - 30,
      }));
    });

    it('should apply lockDrawingScale during move', () => {
      mockState.scale = 2;
      mockState.lockDrawingScale = true;
      mockState.translateX = 100;
      mockState.translateY = 50;

      tool.handlePointerDown(createMouseEvent({ clientX: 200, clientY: 300 }));

      mockObjectsMap.findById.mockReturnValue(mockCreatedLine);
      (KritzelLine.create as jest.Mock).mockReturnValue({ ...mockCreatedLine });

      tool.handlePointerMove(createMouseEvent({ clientX: 400, clientY: 500 }));

      expect(KritzelLine.create).toHaveBeenLastCalledWith(mockCore, expect.objectContaining({
        startX: 200 / 2,
        startY: 300 / 2,
        endX: 400 / 2,
        endY: 500 / 2,
        translateX: -100 / 2,
        translateY: -50 / 2,
        scale: 1,
      }));
    });
  });

  // ============================================
  // handlePointerMove - Touch / Pen
  // ============================================

  describe('handlePointerMove (touch/pen)', () => {
    it('should update line end point when exactly one pointer is active', () => {
      mockState.pointers.set(1, { clientX: 50, clientY: 60 });
      tool.handlePointerDown(createTouchEvent());

      mockObjectsMap.findById.mockReturnValue(mockCreatedLine);
      (KritzelLine.create as jest.Mock).mockReturnValue({ ...mockCreatedLine });

      mockState.pointers.clear();
      mockState.pointers.set(1, { clientX: 150, clientY: 260 });
      tool.handlePointerMove(createTouchEvent());

      expect(KritzelLine.create).toHaveBeenLastCalledWith(mockCore, expect.objectContaining({
        startX: 50,
        startY: 60,
        endX: 150,
        endY: 260,
      }));
      expect(mockObjectsMap.update).toHaveBeenCalled();
    });

    it('should not update when multiple pointers are active', () => {
      mockState.pointers.set(1, { clientX: 50, clientY: 60 });
      tool.handlePointerDown(createTouchEvent());
      jest.clearAllMocks();

      mockState.pointers.set(2, { clientX: 300, clientY: 400 });
      tool.handlePointerMove(createTouchEvent());

      expect(mockObjectsMap.update).not.toHaveBeenCalled();
    });

    it('should round coordinates for touch move', () => {
      mockState.pointers.set(1, { clientX: 50, clientY: 60 });
      tool.handlePointerDown(createTouchEvent());

      mockObjectsMap.findById.mockReturnValue(mockCreatedLine);
      (KritzelLine.create as jest.Mock).mockReturnValue({ ...mockCreatedLine });

      mockState.pointers.clear();
      mockState.pointers.set(1, { clientX: 150.7, clientY: 260.3 });
      tool.handlePointerMove(createTouchEvent());

      expect(KritzelLine.create).toHaveBeenLastCalledWith(mockCore, expect.objectContaining({
        endX: 151,
        endY: 260,
      }));
    });

    it('should not update when current line is not found by findById (touch)', () => {
      mockState.pointers.set(1, { clientX: 50, clientY: 60 });
      tool.handlePointerDown(createTouchEvent());
      jest.clearAllMocks();

      mockObjectsMap.findById.mockReturnValue(undefined);
      mockState.pointers.clear();
      mockState.pointers.set(1, { clientX: 150, clientY: 260 });
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

    it('should mark line as completed and emit change', () => {
      tool.handlePointerDown(createMouseEvent());
      mockObjectsMap.findById.mockReturnValue(mockCreatedLine);

      tool.handlePointerUp(createMouseEvent());

      expect(mockCreatedLine.isCompleted).toBe(true);
      expect(mockObjectsMap.update).toHaveBeenCalledWith(mockCreatedLine);
      expect(mockCore.engine.emitObjectsChange).toHaveBeenCalled();
      expect(mockState.isDrawing).toBe(false);
    });

    it('should clear activeObjectId on pointer up', () => {
      tool.handlePointerDown(createMouseEvent());
      mockObjectsMap.findById.mockReturnValue(mockCreatedLine);

      tool.handlePointerUp(createMouseEvent());

      expect(mockObjectsMap.setActiveDrawingObject).toHaveBeenCalledWith(null);
    });

    it('should create selection group and switch to selection tool', () => {
      tool.handlePointerDown(createMouseEvent());
      mockObjectsMap.findById.mockReturnValue(mockCreatedLine);

      tool.handlePointerUp(createMouseEvent());

      expect(KritzelSelectionGroup.create).toHaveBeenCalledWith(mockCore);
      expect(mockSelectionGroup.addOrRemove).toHaveBeenCalledWith(mockCreatedLine);
      expect(mockSelectionGroup.isSelected).toBe(true);
      expect(mockSelectionGroup.rotation).toBe(mockCreatedLine.rotation);
      expect(mockCore.addSelectionGroup).toHaveBeenCalledWith(mockSelectionGroup);
      expect(mockCore.toolRegistry.getTool).toHaveBeenCalledWith('selection');
      expect(mockCore.store.setState).toHaveBeenCalledWith('activeTool', mockSelectionTool);
      expect(mockCore.rerender).toHaveBeenCalled();
    });

    it('should do nothing when not drawing', () => {
      tool.handlePointerUp(createMouseEvent());

      expect(mockObjectsMap.update).not.toHaveBeenCalled();
      expect(mockCore.engine.emitObjectsChange).not.toHaveBeenCalled();
      expect(KritzelSelectionGroup.create).not.toHaveBeenCalled();
    });

    it('should handle case where current line is not found by findById', () => {
      tool.handlePointerDown(createMouseEvent());
      mockObjectsMap.findById.mockReturnValue(undefined);

      tool.handlePointerUp(createMouseEvent());

      expect(mockState.isDrawing).toBe(false);
      expect(mockCore.engine.emitObjectsChange).not.toHaveBeenCalled();
      expect(KritzelSelectionGroup.create).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // handlePointerUp - Touch / Pen
  // ============================================

  describe('handlePointerUp (touch/pen)', () => {
    it('should mark line as completed for touch', () => {
      mockState.pointers.set(1, { clientX: 50, clientY: 60 });
      tool.handlePointerDown(createTouchEvent());
      mockObjectsMap.findById.mockReturnValue(mockCreatedLine);

      tool.handlePointerUp(createTouchEvent());

      expect(mockCreatedLine.isCompleted).toBe(true);
      expect(mockObjectsMap.update).toHaveBeenCalledWith(mockCreatedLine);
      expect(mockCore.engine.emitObjectsChange).toHaveBeenCalled();
      expect(mockState.isDrawing).toBe(false);
    });

    it('should clear activeObjectId on touch pointer up', () => {
      mockState.pointers.set(1, { clientX: 50, clientY: 60 });
      tool.handlePointerDown(createTouchEvent());
      mockObjectsMap.findById.mockReturnValue(mockCreatedLine);

      tool.handlePointerUp(createTouchEvent());

      expect(mockObjectsMap.setActiveDrawingObject).toHaveBeenCalledWith(null);
    });

    it('should mark line as completed for pen', () => {
      mockState.pointers.set(1, { clientX: 50, clientY: 60 });
      tool.handlePointerDown(createPenEvent());
      mockObjectsMap.findById.mockReturnValue(mockCreatedLine);

      tool.handlePointerUp(createPenEvent());

      expect(mockCreatedLine.isCompleted).toBe(true);
      expect(mockCore.engine.emitObjectsChange).toHaveBeenCalled();
    });

    it('should create selection group and switch to selection tool (touch)', () => {
      mockState.pointers.set(1, { clientX: 50, clientY: 60 });
      tool.handlePointerDown(createTouchEvent());
      mockObjectsMap.findById.mockReturnValue(mockCreatedLine);

      tool.handlePointerUp(createTouchEvent());

      expect(KritzelSelectionGroup.create).toHaveBeenCalledWith(mockCore);
      expect(mockSelectionGroup.addOrRemove).toHaveBeenCalledWith(mockCreatedLine);
      expect(mockSelectionGroup.isSelected).toBe(true);
      expect(mockCore.addSelectionGroup).toHaveBeenCalledWith(mockSelectionGroup);
      expect(mockCore.store.setState).toHaveBeenCalledWith('activeTool', mockSelectionTool);
      expect(mockCore.rerender).toHaveBeenCalled();
    });

    it('should do nothing when not drawing (touch)', () => {
      tool.handlePointerUp(createTouchEvent());

      expect(mockObjectsMap.update).not.toHaveBeenCalled();
      expect(mockCore.engine.emitObjectsChange).not.toHaveBeenCalled();
    });

    it('should handle case where current line is not found by findById (touch)', () => {
      mockState.pointers.set(1, { clientX: 50, clientY: 60 });
      tool.handlePointerDown(createTouchEvent());
      mockObjectsMap.findById.mockReturnValue(undefined);

      tool.handlePointerUp(createTouchEvent());

      expect(mockState.isDrawing).toBe(false);
      expect(mockCore.engine.emitObjectsChange).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // Full drawing flow
  // ============================================

  describe('full drawing flow', () => {
    it('should complete a full mouse line drawing cycle', () => {
      // 1. Pointer down - start line
      const downEvent = createMouseEvent({ clientX: 10, clientY: 20 });
      tool.handlePointerDown(downEvent);
      expect(mockState.isDrawing).toBe(true);
      expect(mockObjectsMap.insert).toHaveBeenCalledTimes(1);

      // 2. Pointer move - extend line end point
      mockObjectsMap.findById.mockReturnValue(mockCreatedLine);
      const updatedLine = { ...mockCreatedLine };
      (KritzelLine.create as jest.Mock).mockReturnValue(updatedLine);

      const moveEvent = createMouseEvent({ clientX: 300, clientY: 400 });
      tool.handlePointerMove(moveEvent);
      expect(KritzelLine.create).toHaveBeenLastCalledWith(mockCore, expect.objectContaining({
        startX: 10,
        startY: 20,
        endX: 300,
        endY: 400,
      }));
      expect(mockObjectsMap.update).toHaveBeenCalledTimes(1);

      // 3. Pointer up - finish line, select, switch tool
      tool.handlePointerUp(createMouseEvent());
      expect(mockState.isDrawing).toBe(false);
      expect(mockCreatedLine.isCompleted).toBe(true);
      expect(mockCore.engine.emitObjectsChange).toHaveBeenCalledTimes(1);
      expect(KritzelSelectionGroup.create).toHaveBeenCalled();
      expect(mockCore.store.setState).toHaveBeenCalledWith('activeTool', mockSelectionTool);
    });

    it('should complete a full touch line drawing cycle', () => {
      // 1. Pointer down
      mockState.pointers.set(1, { clientX: 10, clientY: 20 });
      tool.handlePointerDown(createTouchEvent());
      expect(mockState.isDrawing).toBe(true);

      // 2. Pointer move
      mockObjectsMap.findById.mockReturnValue(mockCreatedLine);
      (KritzelLine.create as jest.Mock).mockReturnValue({ ...mockCreatedLine });
      mockState.pointers.clear();
      mockState.pointers.set(1, { clientX: 300, clientY: 400 });
      tool.handlePointerMove(createTouchEvent());
      expect(mockObjectsMap.update).toHaveBeenCalled();

      // 3. Pointer up
      tool.handlePointerUp(createTouchEvent());
      expect(mockState.isDrawing).toBe(false);
      expect(mockCreatedLine.isCompleted).toBe(true);
      expect(KritzelSelectionGroup.create).toHaveBeenCalled();
    });
  });
});
