import { KritzelBrushTool } from './brush-tool.class';
import { KritzelCore } from '../core/core.class';
import { KritzelPath } from '../objects/path.class';
import { KritzelEventHelper } from '../../helpers/event.helper';
import { DEFAULT_COLOR_PALETTE } from '../../constants/color-palette.constants';

jest.mock('../core/core.class');
jest.mock('../objects/path.class');
jest.mock('../../helpers/event.helper');

describe('KritzelBrushTool', () => {
  let tool: KritzelBrushTool;
  let mockCore: any;
  let mockObjectsMap: any;
  let mockState: any;
  let mockCreatedPath: any;

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

    mockCore = {
      store: {
        get state() { return mockState; },
        get objects() { return mockState.objects; },
        offsetX: 0,
        offsetY: 0,
      },
      engine: {
        emitObjectsChange: jest.fn(),
        emitObjectsAdded: jest.fn(),
        emitObjectsRemoved: jest.fn(),
        emitObjectsUpdated: jest.fn(),
      },
    } as unknown as jest.Mocked<KritzelCore>;

    mockCreatedPath = {
      id: 'path-1',
      workspaceId: 'ws-1',
      zIndex: 1,
      points: [[100, 200]],
      isCompleted: false,
    };

    (KritzelPath.create as jest.Mock).mockReturnValue(mockCreatedPath);
    (KritzelEventHelper.isLeftClick as jest.Mock).mockReturnValue(true);

    tool = new KritzelBrushTool(mockCore);
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

    it('should have default size of 6', () => {
      expect(tool.size).toBe(6);
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

    it('should create a path on left click', () => {
      const event = createMouseEvent({ clientX: 150, clientY: 250 });

      tool.handlePointerDown(event);

      expect(KritzelPath.create).toHaveBeenCalledWith(mockCore, expect.objectContaining({
        points: [[150, 250]],
        fill: tool.color,
        strokeWidth: tool.size,
        opacity: tool.opacity,
      }));
      expect(mockObjectsMap.insert).toHaveBeenCalledWith(mockCreatedPath);
      expect(mockState.isDrawing).toBe(true);
      expect(mockCreatedPath.isCompleted).toBe(false);
    });

    it('should broadcast activeObjectId on left click', () => {
      const event = createMouseEvent({ clientX: 150, clientY: 250 });

      tool.handlePointerDown(event);

      expect(mockObjectsMap.setActiveDrawingObject).toHaveBeenCalledWith('path-1');
    });

    it('should not create a path on non-left click', () => {
      (KritzelEventHelper.isLeftClick as jest.Mock).mockReturnValue(false);
      const event = createMouseEvent({ button: 2 });

      tool.handlePointerDown(event);

      expect(KritzelPath.create).not.toHaveBeenCalled();
      expect(mockState.isDrawing).toBe(false);
    });

    it('should apply viewport offset to coordinates', () => {
      mockCore.store.offsetX = 50;
      mockCore.store.offsetY = 30;
      const event = createMouseEvent({ clientX: 200, clientY: 300 });

      tool.handlePointerDown(event);

      expect(KritzelPath.create).toHaveBeenCalledWith(mockCore, expect.objectContaining({
        points: [[200 - 50, 300 - 30]],
      }));
    });

    it('should use viewport scale as divider when lockDrawingScale is true', () => {
      mockState.scale = 2;
      mockState.lockDrawingScale = true;
      mockState.translateX = 100;
      mockState.translateY = 50;
      const event = createMouseEvent({ clientX: 200, clientY: 300 });

      tool.handlePointerDown(event);

      expect(KritzelPath.create).toHaveBeenCalledWith(mockCore, expect.objectContaining({
        points: [[200 / 2, 300 / 2]],
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

      expect(KritzelPath.create).toHaveBeenCalledWith(mockCore, expect.objectContaining({
        points: [[200, 300]],
        translateX: -100,
        translateY: -50,
        scale: 2,
      }));
    });
  });

  // ============================================
  // handlePointerDown - Touch / Pen
  // ============================================

  describe('handlePointerDown (touch/pen)', () => {
    it('should create a path when exactly one pointer is active (touch)', () => {
      mockState.pointers.set(1, { clientX: 120, clientY: 220 });
      const event = createTouchEvent();

      tool.handlePointerDown(event);

      expect(KritzelPath.create).toHaveBeenCalledWith(mockCore, expect.objectContaining({
        points: [[120, 220]],
      }));
      expect(mockObjectsMap.insert).toHaveBeenCalled();
      expect(mockState.isDrawing).toBe(true);
    });

    it('should broadcast activeObjectId on single touch', () => {
      mockState.pointers.set(1, { clientX: 120, clientY: 220 });
      const event = createTouchEvent();

      tool.handlePointerDown(event);

      expect(mockObjectsMap.setActiveDrawingObject).toHaveBeenCalledWith('path-1');
    });

    it('should create a path when exactly one pointer is active (pen)', () => {
      mockState.pointers.set(1, { clientX: 120, clientY: 220 });
      const event = createPenEvent();

      tool.handlePointerDown(event);

      expect(KritzelPath.create).toHaveBeenCalled();
      expect(mockState.isDrawing).toBe(true);
    });

    it('should not create a path when multiple pointers are active', () => {
      mockState.pointers.set(1, { clientX: 120, clientY: 220 });
      mockState.pointers.set(2, { clientX: 300, clientY: 400 });
      const event = createTouchEvent();

      tool.handlePointerDown(event);

      // Only the mouse branch would fire for creation; touch requires exactly 1 pointer
      expect(mockState.isDrawing).toBe(false);
    });

    it('should not create a path when no pointers are active', () => {
      const event = createTouchEvent();

      tool.handlePointerDown(event);

      expect(mockState.isDrawing).toBe(false);
    });

    it('should round coordinates for touch input', () => {
      mockState.pointers.set(1, { clientX: 120.7, clientY: 220.3 });
      const event = createTouchEvent();

      tool.handlePointerDown(event);

      expect(KritzelPath.create).toHaveBeenCalledWith(mockCore, expect.objectContaining({
        points: [[121, 220]],
      }));
    });

    it('should apply lockDrawingScale for touch', () => {
      mockState.scale = 2;
      mockState.lockDrawingScale = true;
      mockState.pointers.set(1, { clientX: 200, clientY: 300 });
      const event = createTouchEvent();

      tool.handlePointerDown(event);

      expect(KritzelPath.create).toHaveBeenCalledWith(mockCore, expect.objectContaining({
        points: [[Math.round(200 / 2), Math.round(300 / 2)]],
        scale: 1,
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

    it('should add point to existing path when drawing', () => {
      // Start drawing first
      tool.handlePointerDown(createMouseEvent({ clientX: 50, clientY: 60 }));

      const existingPath = { ...mockCreatedPath, points: [[50, 60]] };
      mockObjectsMap.findById.mockReturnValue(existingPath);

      const moveEvent = createMouseEvent({ clientX: 150, clientY: 260 });
      tool.handlePointerMove(moveEvent);

      expect(KritzelPath.create).toHaveBeenLastCalledWith(mockCore, expect.objectContaining({
        points: [[50, 60], [150, 260]],
      }));
      expect(mockObjectsMap.update).toHaveBeenCalled();
    });

    it('should preserve path id, workspaceId, and zIndex on update', () => {
      tool.handlePointerDown(createMouseEvent({ clientX: 50, clientY: 60 }));

      const existingPath = { ...mockCreatedPath, points: [[50, 60]], id: 'path-1', workspaceId: 'ws-1', zIndex: 5 };
      mockObjectsMap.findById.mockReturnValue(existingPath);

      const newPath = { id: 'new-id', workspaceId: 'new-ws', zIndex: 99, isCompleted: true };
      (KritzelPath.create as jest.Mock).mockReturnValue(newPath);

      tool.handlePointerMove(createMouseEvent({ clientX: 150, clientY: 260 }));

      expect(newPath.id).toBe('path-1');
      expect(newPath.workspaceId).toBe('ws-1');
      expect(newPath.zIndex).toBe(5);
      expect(newPath.isCompleted).toBe(false);
    });

    it('should not update when not drawing', () => {
      tool.handlePointerMove(createMouseEvent({ clientX: 150, clientY: 260 }));

      expect(mockObjectsMap.update).not.toHaveBeenCalled();
    });

    it('should not update when current path is not found', () => {
      tool.handlePointerDown(createMouseEvent());
      mockObjectsMap.findById.mockReturnValue(undefined);

      tool.handlePointerMove(createMouseEvent({ clientX: 150, clientY: 260 }));

      expect(mockObjectsMap.update).not.toHaveBeenCalled();
    });

    // ============================================
    // Min-distance point filter
    // ============================================

    describe('min-distance point filter', () => {
      it('should not append a point when delta is below 3 screen pixels', () => {
        tool.handlePointerDown(createMouseEvent({ clientX: 50, clientY: 60 }));

        const existingPath = { ...mockCreatedPath, points: [[50, 60]] };
        mockObjectsMap.findById.mockReturnValue(existingPath);
        (KritzelPath.create as jest.Mock).mockClear();

        // Sub-threshold delta (2 px) — should be filtered out.
        tool.handlePointerMove(createMouseEvent({ clientX: 52, clientY: 60 }));

        expect(KritzelPath.create).not.toHaveBeenCalled();
        expect(mockObjectsMap.update).not.toHaveBeenCalled();
      });

      it('should append a point when delta is at or above 3 screen pixels', () => {
        tool.handlePointerDown(createMouseEvent({ clientX: 50, clientY: 60 }));

        const existingPath = { ...mockCreatedPath, points: [[50, 60]] };
        mockObjectsMap.findById.mockReturnValue(existingPath);
        (KritzelPath.create as jest.Mock).mockClear();

        // Exactly 3 px delta — should pass.
        tool.handlePointerMove(createMouseEvent({ clientX: 53, clientY: 60 }));

        expect(KritzelPath.create).toHaveBeenCalledTimes(1);
        expect(mockObjectsMap.update).toHaveBeenCalledTimes(1);
      });

      it('should drop multiple sub-threshold moves but accept the first above-threshold move', () => {
        tool.handlePointerDown(createMouseEvent({ clientX: 50, clientY: 60 }));

        const existingPath = { ...mockCreatedPath, points: [[50, 60]] };
        mockObjectsMap.findById.mockReturnValue(existingPath);
        (KritzelPath.create as jest.Mock).mockClear();

        // Sub-threshold jitters (each < 3 px from origin).
        tool.handlePointerMove(createMouseEvent({ clientX: 51, clientY: 60 }));
        tool.handlePointerMove(createMouseEvent({ clientX: 52, clientY: 60 }));

        expect(mockObjectsMap.update).not.toHaveBeenCalled();

        // Then a real move >= 3 px away.
        tool.handlePointerMove(createMouseEvent({ clientX: 53, clientY: 60 }));

        expect(mockObjectsMap.update).toHaveBeenCalledTimes(1);
      });

      it('should treat threshold as ~3 screen pixels when zoomed in (lockDrawingScale=true)', () => {
        // At scale 4 with lockDrawingScale=true, points are stored in world units
        // (screen / 4), so 4 screen px = 1 world unit > threshold 3/4=0.75 -> must append.
        mockState.scale = 4;
        mockState.lockDrawingScale = true;

        tool.handlePointerDown(createMouseEvent({ clientX: 200, clientY: 240 }));

        const existingPath = { ...mockCreatedPath, points: [[50, 60]] };
        mockObjectsMap.findById.mockReturnValue(existingPath);
        (KritzelPath.create as jest.Mock).mockClear();

        // Move by 4 screen pixels: clientX 204 -> world 51 (delta 1 world unit > 0.75 threshold).
        tool.handlePointerMove(createMouseEvent({ clientX: 204, clientY: 240 }));

        expect(mockObjectsMap.update).toHaveBeenCalledTimes(1);
      });

      it('should drop a sub-threshold screen move when zoomed in (lockDrawingScale=true)', () => {
        // At scale 4, threshold = 3/4 = 0.75 world units. A 2 screen px move = 0.5 world units -> below threshold.
        mockState.scale = 4;
        mockState.lockDrawingScale = true;

        tool.handlePointerDown(createMouseEvent({ clientX: 200, clientY: 240 }));

        const existingPath = { ...mockCreatedPath, points: [[50, 60]] };
        mockObjectsMap.findById.mockReturnValue(existingPath);
        (KritzelPath.create as jest.Mock).mockClear();

        // 2 screen px = 0.5 world units, which is < 0.75 threshold -> should be dropped.
        tool.handlePointerMove(createMouseEvent({ clientX: 202, clientY: 240 }));

        expect(mockObjectsMap.update).not.toHaveBeenCalled();
      });
    });
  });

  // ============================================
  // handlePointerMove - Touch / Pen
  // ============================================

  describe('handlePointerMove (touch/pen)', () => {
    it('should add point when exactly one pointer is active', () => {
      // Start drawing with touch
      mockState.pointers.set(1, { clientX: 50, clientY: 60 });
      tool.handlePointerDown(createTouchEvent());

      const existingPath = { ...mockCreatedPath, points: [[50, 60]] };
      mockObjectsMap.findById.mockReturnValue(existingPath);

      mockState.pointers.clear();
      mockState.pointers.set(1, { clientX: 150, clientY: 260 });
      tool.handlePointerMove(createTouchEvent());

      expect(KritzelPath.create).toHaveBeenLastCalledWith(mockCore, expect.objectContaining({
        points: [[50, 60], [150, 260]],
      }));
      expect(mockObjectsMap.update).toHaveBeenCalled();
    });

    it('should not add point when multiple pointers are active', () => {
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

      const existingPath = { ...mockCreatedPath, points: [[50, 60]] };
      mockObjectsMap.findById.mockReturnValue(existingPath);

      mockState.pointers.clear();
      mockState.pointers.set(1, { clientX: 150.7, clientY: 260.3 });
      tool.handlePointerMove(createTouchEvent());

      expect(KritzelPath.create).toHaveBeenLastCalledWith(mockCore, expect.objectContaining({
        points: [[50, 60], [151, 260]],
      }));
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

    it('should mark path as completed and emit change', () => {
      // Start drawing
      tool.handlePointerDown(createMouseEvent());

      const existingPath = { ...mockCreatedPath, isCompleted: false };
      mockObjectsMap.findById.mockReturnValue(existingPath);

      tool.handlePointerUp(createMouseEvent());

      expect(existingPath.isCompleted).toBe(true);
      expect(mockObjectsMap.update).toHaveBeenCalledWith(existingPath);
      expect(mockCore.engine.emitObjectsChange).toHaveBeenCalled();
      expect(mockState.isDrawing).toBe(false);
    });

    it('should clear activeObjectId on pointer up', () => {
      tool.handlePointerDown(createMouseEvent());

      const existingPath = { ...mockCreatedPath, isCompleted: false };
      mockObjectsMap.findById.mockReturnValue(existingPath);

      tool.handlePointerUp(createMouseEvent());

      expect(mockObjectsMap.setActiveDrawingObject).toHaveBeenCalledWith(null);
    });

    it('should clear current path id after completion', () => {
      tool.handlePointerDown(createMouseEvent());
      mockObjectsMap.findById.mockReturnValue(mockCreatedPath);

      tool.handlePointerUp(createMouseEvent());

      // Subsequent move should not update anything
      jest.clearAllMocks();
      tool.handlePointerMove(createMouseEvent());
      expect(mockObjectsMap.update).not.toHaveBeenCalled();
    });

    it('should do nothing when not drawing', () => {
      tool.handlePointerUp(createMouseEvent());

      expect(mockObjectsMap.update).not.toHaveBeenCalled();
      expect(mockCore.engine.emitObjectsChange).not.toHaveBeenCalled();
    });

    it('should handle case where path is not found', () => {
      tool.handlePointerDown(createMouseEvent());
      mockObjectsMap.findById.mockReturnValue(undefined);

      tool.handlePointerUp(createMouseEvent());

      expect(mockState.isDrawing).toBe(false);
      expect(mockCore.engine.emitObjectsChange).not.toHaveBeenCalled();
    });

    it('should call stopUndoCapturing once at the end of the stroke', () => {
      // Regression: a brush stroke must close its undo step on pointerup so
      // that a long pointerdown→pause→pointermove→pointerup gesture results
      // in exactly one undo step (preventing the "ghost dot" bug).
      tool.handlePointerDown(createMouseEvent());
      mockObjectsMap.findById.mockReturnValue(mockCreatedPath);

      tool.handlePointerUp(createMouseEvent());

      expect(mockObjectsMap.stopUndoCapturing).toHaveBeenCalledTimes(1);
    });

    it('should not call stopUndoCapturing when no stroke was active', () => {
      // No pointerdown — pointerup with isDrawing=false should not mark a boundary.
      tool.handlePointerUp(createMouseEvent());

      expect(mockObjectsMap.stopUndoCapturing).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // handlePointerUp - Touch / Pen
  // ============================================

  describe('handlePointerUp (touch/pen)', () => {
    it('should mark path as completed for touch', () => {
      mockState.pointers.set(1, { clientX: 50, clientY: 60 });
      tool.handlePointerDown(createTouchEvent());

      mockObjectsMap.findById.mockReturnValue(mockCreatedPath);

      tool.handlePointerUp(createTouchEvent());

      expect(mockCreatedPath.isCompleted).toBe(true);
      expect(mockObjectsMap.update).toHaveBeenCalledWith(mockCreatedPath);
      expect(mockCore.engine.emitObjectsChange).toHaveBeenCalled();
      expect(mockState.isDrawing).toBe(false);
    });

    it('should clear activeObjectId on touch pointer up', () => {
      mockState.pointers.set(1, { clientX: 50, clientY: 60 });
      tool.handlePointerDown(createTouchEvent());

      mockObjectsMap.findById.mockReturnValue(mockCreatedPath);

      tool.handlePointerUp(createTouchEvent());

      expect(mockObjectsMap.setActiveDrawingObject).toHaveBeenCalledWith(null);
    });

    it('should mark path as completed for pen', () => {
      mockState.pointers.set(1, { clientX: 50, clientY: 60 });
      tool.handlePointerDown(createPenEvent());

      mockObjectsMap.findById.mockReturnValue(mockCreatedPath);

      tool.handlePointerUp(createPenEvent());

      expect(mockCreatedPath.isCompleted).toBe(true);
      expect(mockCore.engine.emitObjectsChange).toHaveBeenCalled();
    });

    it('should do nothing when not drawing (touch)', () => {
      tool.handlePointerUp(createTouchEvent());

      expect(mockObjectsMap.update).not.toHaveBeenCalled();
      expect(mockCore.engine.emitObjectsChange).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // Full drawing flow
  // ============================================

  describe('full drawing flow', () => {
    it('should complete a full mouse draw cycle', () => {
      // 1. Pointer down - start drawing
      const downEvent = createMouseEvent({ clientX: 10, clientY: 20 });
      tool.handlePointerDown(downEvent);
      expect(mockState.isDrawing).toBe(true);
      expect(mockObjectsMap.insert).toHaveBeenCalledTimes(1);

      // 2. Pointer move - extend path
      const existingPath = { ...mockCreatedPath, points: [[10, 20]] };
      mockObjectsMap.findById.mockReturnValue(existingPath);

      const moveEvent = createMouseEvent({ clientX: 30, clientY: 40 });
      tool.handlePointerMove(moveEvent);
      expect(mockObjectsMap.update).toHaveBeenCalledTimes(1);

      // 3. Pointer up - finish drawing
      mockObjectsMap.findById.mockReturnValue(existingPath);
      const upEvent = createMouseEvent();
      tool.handlePointerUp(upEvent);
      expect(mockState.isDrawing).toBe(false);
      expect(existingPath.isCompleted).toBe(true);
      expect(mockCore.engine.emitObjectsChange).toHaveBeenCalledTimes(1);
    });

    it('should complete a full touch draw cycle', () => {
      // 1. Pointer down
      mockState.pointers.set(1, { clientX: 10, clientY: 20 });
      tool.handlePointerDown(createTouchEvent());
      expect(mockState.isDrawing).toBe(true);

      // 2. Pointer move
      const existingPath = { ...mockCreatedPath, points: [[10, 20]] };
      mockObjectsMap.findById.mockReturnValue(existingPath);
      mockState.pointers.clear();
      mockState.pointers.set(1, { clientX: 30, clientY: 40 });
      tool.handlePointerMove(createTouchEvent());
      expect(mockObjectsMap.update).toHaveBeenCalled();

      // 3. Pointer up
      mockObjectsMap.findById.mockReturnValue(existingPath);
      tool.handlePointerUp(createTouchEvent());
      expect(mockState.isDrawing).toBe(false);
      expect(existingPath.isCompleted).toBe(true);
    });
  });
});
