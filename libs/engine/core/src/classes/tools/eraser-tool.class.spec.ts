import { KritzelEraserTool } from './eraser-tool.class';
import { KritzelCore } from '../core/core.class';
import { KritzelEventHelper } from '../../helpers/event.helper';

jest.mock('../core/core.class');
jest.mock('../../helpers/event.helper');

describe('KritzelEraserTool', () => {
  let tool: KritzelEraserTool;
  let mockCore: any;
  let mockState: any;

  const createMouseEvent = (overrides: Partial<PointerEvent> = {}): PointerEvent => {
    return {
      pointerType: 'mouse',
      button: 0,
      clientX: 100,
      clientY: 200,
      ...overrides,
    } as unknown as PointerEvent;
  };

  const createTouchEvent = (overrides: Partial<PointerEvent> = {}): PointerEvent => {
    return {
      pointerType: 'touch',
      clientX: 100,
      clientY: 200,
      ...overrides,
    } as unknown as PointerEvent;
  };

  const createPenEvent = (overrides: Partial<PointerEvent> = {}): PointerEvent => {
    return {
      pointerType: 'pen',
      clientX: 100,
      clientY: 200,
      ...overrides,
    } as unknown as PointerEvent;
  };

  const createMockObject = (id: string, hitTestResult: boolean = false) => ({
    id,
    markedForRemoval: false,
    hitTest: jest.fn().mockReturnValue(hitTestResult),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockState = {
      isErasing: false,
      isScaling: false,
      pointers: new Map(),
      pointerX: 50,
      pointerY: 60,
      host: { shadowRoot: {} },
    };

    mockCore = {
      store: {
        get state() { return mockState; },
        allObjects: [],
        objects: {
          transaction: jest.fn((cb: () => void) => cb()),
          stopUndoCapturing: jest.fn(),
        },
      },
      getObjectsFromPointerEvent: jest.fn().mockReturnValue([]),
      removeObject: jest.fn(),
      rerender: jest.fn(),
      engine: {
        emitObjectsChange: jest.fn(),
        emitObjectsAdded: jest.fn(),
        emitObjectsRemoved: jest.fn(),
        emitObjectsUpdated: jest.fn(),
      },
    } as unknown as jest.Mocked<KritzelCore>;

    (KritzelEventHelper.isLeftClick as jest.Mock).mockReturnValue(true);

    tool = new KritzelEraserTool(mockCore);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  // ============================================
  // handlePointerDown - Mouse
  // ============================================

  describe('handlePointerDown (mouse)', () => {
    it('should set isErasing to true on left click', () => {
      tool.handlePointerDown(createMouseEvent());

      expect(mockState.isErasing).toBe(true);
    });

    it('should not set isErasing on non-left click', () => {
      (KritzelEventHelper.isLeftClick as jest.Mock).mockReturnValue(false);

      tool.handlePointerDown(createMouseEvent({ button: 2 }));

      expect(mockState.isErasing).toBe(false);
    });
  });

  // ============================================
  // handlePointerDown - Touch / Pen
  // ============================================

  describe('handlePointerDown (touch/pen)', () => {
    it('should set isErasing after 80ms timeout when one pointer active (touch)', () => {
      mockState.pointers.set(1, {});

      tool.handlePointerDown(createTouchEvent());

      expect(mockState.isErasing).toBe(false);

      jest.advanceTimersByTime(80);

      expect(mockState.isErasing).toBe(true);
    });

    it('should set isErasing after 80ms timeout when one pointer active (pen)', () => {
      mockState.pointers.set(1, {});

      tool.handlePointerDown(createPenEvent());

      jest.advanceTimersByTime(80);

      expect(mockState.isErasing).toBe(true);
    });

    it('should not set isErasing when multiple pointers are active', () => {
      mockState.pointers.set(1, {});
      mockState.pointers.set(2, {});

      tool.handlePointerDown(createTouchEvent());
      jest.advanceTimersByTime(80);

      expect(mockState.isErasing).toBe(false);
    });

    it('should not set isErasing when isScaling is true', () => {
      mockState.pointers.set(1, {});
      mockState.isScaling = true;

      tool.handlePointerDown(createTouchEvent());
      jest.advanceTimersByTime(80);

      expect(mockState.isErasing).toBe(false);
    });

    it('should not set isErasing before 80ms elapses', () => {
      mockState.pointers.set(1, {});

      tool.handlePointerDown(createTouchEvent());
      jest.advanceTimersByTime(79);

      expect(mockState.isErasing).toBe(false);
    });
  });

  // ============================================
  // handlePointerMove - Mouse
  // ============================================

  describe('handlePointerMove (mouse)', () => {
    it('should mark objects for removal when erasing and hit test passes', () => {
      mockState.isErasing = true;
      const obj = createMockObject('obj-1', true);
      mockCore.getObjectsFromPointerEvent.mockReturnValue([obj]);

      tool.handlePointerMove(createMouseEvent());

      expect(obj.hitTest).toHaveBeenCalledWith(mockState.pointerX, mockState.pointerY);
      expect(obj.markedForRemoval).toBe(true);
      expect(mockCore.rerender).toHaveBeenCalled();
    });

    it('should not mark objects when hit test fails', () => {
      mockState.isErasing = true;
      const obj = createMockObject('obj-1', false);
      mockCore.getObjectsFromPointerEvent.mockReturnValue([obj]);

      tool.handlePointerMove(createMouseEvent());

      expect(obj.markedForRemoval).toBe(false);
      expect(mockCore.rerender).toHaveBeenCalled();
    });

    it('should not do anything when not erasing', () => {
      mockState.isErasing = false;

      tool.handlePointerMove(createMouseEvent());

      expect(mockCore.getObjectsFromPointerEvent).not.toHaveBeenCalled();
    });

    it('should not rerender when no objects are at pointer position', () => {
      mockState.isErasing = true;
      mockCore.getObjectsFromPointerEvent.mockReturnValue([]);

      tool.handlePointerMove(createMouseEvent());

      expect(mockCore.rerender).not.toHaveBeenCalled();
    });

    it('should mark multiple objects independently', () => {
      mockState.isErasing = true;
      const obj1 = createMockObject('obj-1', true);
      const obj2 = createMockObject('obj-2', false);
      const obj3 = createMockObject('obj-3', true);
      mockCore.getObjectsFromPointerEvent.mockReturnValue([obj1, obj2, obj3]);

      tool.handlePointerMove(createMouseEvent());

      expect(obj1.markedForRemoval).toBe(true);
      expect(obj2.markedForRemoval).toBe(false);
      expect(obj3.markedForRemoval).toBe(true);
    });
  });

  // ============================================
  // handlePointerMove - Touch / Pen
  // ============================================

  describe('handlePointerMove (touch/pen)', () => {
    it('should mark objects for removal when erasing with single pointer', () => {
      mockState.isErasing = true;
      mockState.pointers.set(1, {});
      const obj = createMockObject('obj-1', true);
      mockCore.getObjectsFromPointerEvent.mockReturnValue([obj]);

      tool.handlePointerMove(createTouchEvent());

      expect(obj.markedForRemoval).toBe(true);
      expect(mockCore.rerender).toHaveBeenCalled();
    });

    it('should not erase when multiple pointers are active', () => {
      mockState.isErasing = true;
      mockState.pointers.set(1, {});
      mockState.pointers.set(2, {});

      tool.handlePointerMove(createTouchEvent());

      expect(mockCore.getObjectsFromPointerEvent).not.toHaveBeenCalled();
    });

    it('should not erase when not in erasing state', () => {
      mockState.isErasing = false;
      mockState.pointers.set(1, {});

      tool.handlePointerMove(createTouchEvent());

      expect(mockCore.getObjectsFromPointerEvent).not.toHaveBeenCalled();
    });

    it('should return early when shadowRoot is not available', () => {
      mockState.isErasing = true;
      mockState.pointers.set(1, {});
      mockState.host = { shadowRoot: null };

      tool.handlePointerMove(createTouchEvent());

      expect(mockCore.getObjectsFromPointerEvent).not.toHaveBeenCalled();
    });

    it('should return early when host is not available', () => {
      mockState.isErasing = true;
      mockState.pointers.set(1, {});
      mockState.host = null;

      tool.handlePointerMove(createTouchEvent());

      expect(mockCore.getObjectsFromPointerEvent).not.toHaveBeenCalled();
    });

    it('should not rerender when no objects found at pointer for touch', () => {
      mockState.isErasing = true;
      mockState.pointers.set(1, {});
      mockCore.getObjectsFromPointerEvent.mockReturnValue([]);

      tool.handlePointerMove(createTouchEvent());

      expect(mockCore.rerender).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // handlePointerUp - Mouse
  // ============================================

  describe('handlePointerUp (mouse)', () => {
    it('should remove marked objects and emit change', () => {
      mockState.isErasing = true;
      const obj1 = createMockObject('obj-1');
      obj1.markedForRemoval = true;
      const obj2 = createMockObject('obj-2');
      obj2.markedForRemoval = false;
      mockCore.store.allObjects = [obj1, obj2];

      tool.handlePointerUp(createMouseEvent());

      expect(obj1.markedForRemoval).toBe(false);
      expect(mockCore.removeObject).toHaveBeenCalledWith(obj1);
      expect(mockCore.removeObject).toHaveBeenCalledTimes(1);
      expect(mockCore.rerender).toHaveBeenCalled();
      expect(mockState.isErasing).toBe(false);
      expect(mockCore.engine.emitObjectsChange).toHaveBeenCalled();
    });

    it('should not rerender when no objects are marked for removal', () => {
      mockState.isErasing = true;
      const obj = createMockObject('obj-1');
      obj.markedForRemoval = false;
      mockCore.store.allObjects = [obj];

      tool.handlePointerUp(createMouseEvent());

      expect(mockCore.removeObject).not.toHaveBeenCalled();
      expect(mockCore.rerender).not.toHaveBeenCalled();
      expect(mockState.isErasing).toBe(false);
      expect(mockCore.engine.emitObjectsChange).toHaveBeenCalled();
    });

    it('should do nothing when not erasing', () => {
      mockState.isErasing = false;

      tool.handlePointerUp(createMouseEvent());

      expect(mockCore.removeObject).not.toHaveBeenCalled();
      expect(mockCore.engine.emitObjectsChange).not.toHaveBeenCalled();
    });

    it('should remove multiple marked objects', () => {
      mockState.isErasing = true;
      const obj1 = createMockObject('obj-1');
      obj1.markedForRemoval = true;
      const obj2 = createMockObject('obj-2');
      obj2.markedForRemoval = true;
      mockCore.store.allObjects = [obj1, obj2];

      tool.handlePointerUp(createMouseEvent());

      expect(mockCore.removeObject).toHaveBeenCalledTimes(2);
      expect(mockCore.removeObject).toHaveBeenCalledWith(obj1);
      expect(mockCore.removeObject).toHaveBeenCalledWith(obj2);
    });
  });

  // ============================================
  // handlePointerUp - Touch / Pen
  // ============================================

  describe('handlePointerUp (touch/pen)', () => {
    it('should clear the touch start timeout', () => {
      mockState.pointers.set(1, {});
      tool.handlePointerDown(createTouchEvent());

      tool.handlePointerUp(createTouchEvent());

      // Advancing timers after clearTimeout should not set isErasing
      jest.advanceTimersByTime(80);
      expect(mockState.isErasing).toBe(false);
    });

    it('should remove marked objects when erasing (touch)', () => {
      mockState.isErasing = true;
      const obj = createMockObject('obj-1');
      obj.markedForRemoval = true;
      mockCore.store.allObjects = [obj];

      tool.handlePointerUp(createTouchEvent());

      expect(mockCore.removeObject).toHaveBeenCalledWith(obj);
      expect(mockState.isErasing).toBe(false);
      expect(mockCore.engine.emitObjectsChange).toHaveBeenCalled();
    });

    it('should remove marked objects when erasing (pen)', () => {
      mockState.isErasing = true;
      const obj = createMockObject('obj-1');
      obj.markedForRemoval = true;
      mockCore.store.allObjects = [obj];

      tool.handlePointerUp(createPenEvent());

      expect(mockCore.removeObject).toHaveBeenCalledWith(obj);
      expect(mockState.isErasing).toBe(false);
    });

    it('should not rerender when no objects marked for removal (touch)', () => {
      mockState.isErasing = true;
      mockCore.store.allObjects = [];

      tool.handlePointerUp(createTouchEvent());

      expect(mockCore.rerender).not.toHaveBeenCalled();
      expect(mockState.isErasing).toBe(false);
    });

    it('should do nothing when not erasing (touch)', () => {
      mockState.isErasing = false;

      tool.handlePointerUp(createTouchEvent());

      expect(mockCore.removeObject).not.toHaveBeenCalled();
      expect(mockCore.engine.emitObjectsChange).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // Full erase flow
  // ============================================

  describe('full erase flow', () => {
    it('should complete a full mouse erase cycle', () => {
      // 1. Pointer down - start erasing
      tool.handlePointerDown(createMouseEvent());
      expect(mockState.isErasing).toBe(true);

      // 2. Pointer move - mark objects
      const obj = createMockObject('obj-1', true);
      mockCore.getObjectsFromPointerEvent.mockReturnValue([obj]);
      tool.handlePointerMove(createMouseEvent());
      expect(obj.markedForRemoval).toBe(true);

      // 3. Pointer up - remove marked objects
      mockCore.store.allObjects = [obj];
      tool.handlePointerUp(createMouseEvent());
      expect(mockCore.removeObject).toHaveBeenCalledWith(obj);
      expect(mockState.isErasing).toBe(false);
      expect(mockCore.engine.emitObjectsChange).toHaveBeenCalled();
    });

    it('should complete a full touch erase cycle', () => {
      // 1. Pointer down - delayed start
      mockState.pointers.set(1, {});
      tool.handlePointerDown(createTouchEvent());
      jest.advanceTimersByTime(80);
      expect(mockState.isErasing).toBe(true);

      // 2. Pointer move - mark objects
      const obj = createMockObject('obj-1', true);
      mockCore.getObjectsFromPointerEvent.mockReturnValue([obj]);
      tool.handlePointerMove(createTouchEvent());
      expect(obj.markedForRemoval).toBe(true);

      // 3. Pointer up - remove marked objects
      mockCore.store.allObjects = [obj];
      tool.handlePointerUp(createTouchEvent());
      expect(mockCore.removeObject).toHaveBeenCalledWith(obj);
      expect(mockState.isErasing).toBe(false);
    });

    it('should cancel touch erase when pointer up comes before timeout', () => {
      mockState.pointers.set(1, {});
      tool.handlePointerDown(createTouchEvent());

      // Pointer up before timeout fires
      tool.handlePointerUp(createTouchEvent());
      jest.advanceTimersByTime(80);

      expect(mockState.isErasing).toBe(false);
      expect(mockCore.removeObject).not.toHaveBeenCalled();
    });
  });
});
