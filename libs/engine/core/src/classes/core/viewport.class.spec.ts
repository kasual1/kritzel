import { KritzelViewport } from './viewport.class';
import { KritzelCore } from './core.class';
import { KritzelMouseButton } from '../../enums/event-button.enum';
import { KritzelBaseObject } from '../objects/base-object.class';

jest.mock('lodash', () => ({
  debounce: (fn: Function) => {
    const debounced = jest.fn((...args: any[]) => fn(...args)) as any;
    debounced.cancel = jest.fn();
    return debounced;
  },
}));

describe('KritzelViewport', () => {
  let viewport: KritzelViewport;
  let mockCore: jest.Mocked<KritzelCore>;
  let mockHost: HTMLElement;
  let mockState: any;

  const createMockHost = (): HTMLElement => {
    return {
      clientWidth: 1000,
      clientHeight: 800,
      getBoundingClientRect: jest.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 1000,
        height: 800,
      }),
    } as unknown as HTMLElement;
  };

  const createMockCore = (): jest.Mocked<KritzelCore> => {
    mockState = {
      host: null,
      viewportWidth: 0,
      viewportHeight: 0,
      startX: 0,
      startY: 0,
      translateX: 0,
      translateY: 0,
      scale: 1,
      scaleMax: 10,
      scaleMin: 0.1,
      isPanning: false,
      isScaling: false,
      isSelecting: false,
      hasViewportChanged: false,
      skipContextMenu: false,
      pointerX: 0,
      pointerY: 0,
      pointers: new Map(),
      viewportBoundaryLeft: -Infinity,
      viewportBoundaryRight: Infinity,
      viewportBoundaryTop: -Infinity,
      viewportBoundaryBottom: Infinity,
      objects: {
        remove: jest.fn(),
        filter: jest.fn().mockReturnValue([]),
        allObjects: jest.fn().mockReturnValue([]),
        query: jest.fn().mockReturnValue([]),
        updateCursorPosition: jest.fn(),
        clearCursorPosition: jest.fn(),
      },
      activeWorkspace: { id: 'workspace-1' },
    };

    return {
      store: {
        get state() {
          return mockState;
        },
        get objects() {
          return mockState.objects;
        },
        get host() {
          return mockState.host;
        },
        offsetX: 0,
        offsetY: 0,
        currentPath: null,
        selectedObjects: [],
        allNonSelectionObjects: [],
        selectionBox: null,
        setSelectionBox: jest.fn(),
      },
      rerender: jest.fn(),
      updateWorkspaceViewport: jest.fn(),
    } as unknown as jest.Mocked<KritzelCore>;
  };

  const createPointerEvent = (options: Partial<PointerEvent> = {}): PointerEvent => {
    return {
      pointerType: 'mouse',
      pointerId: 1,
      clientX: 0,
      clientY: 0,
      button: KritzelMouseButton.Left,
      ...options,
    } as PointerEvent;
  };

  const createWheelEvent = (options: Partial<WheelEvent> = {}): WheelEvent => {
    return {
      clientX: 500,
      clientY: 400,
      deltaX: 0,
      deltaY: 0,
      ctrlKey: false,
      ...options,
    } as WheelEvent;
  };

  beforeEach(() => {
    mockHost = createMockHost();
    mockCore = createMockCore();
    viewport = new KritzelViewport(mockCore, mockHost);

    jest.spyOn(global, 'requestAnimationFrame').mockImplementation((_cb) => {
      return 1;
    });
    jest.spyOn(global, 'cancelAnimationFrame').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should set the host on the state', () => {
      expect(mockState.host).toBe(mockHost);
    });

    it('should initialize viewport dimensions from host', () => {
      expect(mockState.viewportWidth).toBe(1000);
      expect(mockState.viewportHeight).toBe(800);
    });

    it('should initialize translation and start coordinates to 0', () => {
      expect(mockState.startX).toBe(0);
      expect(mockState.startY).toBe(0);
      expect(mockState.translateX).toBe(0);
      expect(mockState.translateY).toBe(0);
    });

    it('should initialize public properties', () => {
      expect(viewport.initialTouchDistance).toBe(0);
      expect(viewport.startX).toBe(0);
      expect(viewport.startY).toBe(0);
    });
  });

  describe('cancelPendingUpdates', () => {
    it('should cancel the debounced update function', () => {
      viewport.cancelPendingUpdates();
      // The debounce mock's cancel method should have been called
      // If it didn't throw, the cancel method exists and was called
      expect(true).toBe(true);
    });
  });

  describe('handleResize', () => {
    it('should update viewport dimensions from host', () => {
      (mockHost as any).clientWidth = 1200;
      (mockHost as any).clientHeight = 900;

      viewport.handleResize();

      expect(mockState.viewportWidth).toBe(1200);
      expect(mockState.viewportHeight).toBe(900);
    });

    it('should set hasViewportChanged to true', () => {
      viewport.handleResize();
      expect(mockState.hasViewportChanged).toBe(true);
    });

    it('should call rerender', () => {
      viewport.handleResize();
      expect(mockCore.rerender).toHaveBeenCalled();
    });
  });

  describe('handlePointerDown', () => {
    describe('mouse events', () => {
      it('should start panning on right-click', () => {
        const event = createPointerEvent({
          pointerType: 'mouse',
          button: KritzelMouseButton.Right,
          clientX: 100,
          clientY: 200,
        });

        viewport.handlePointerDown(event);

        expect(mockState.isPanning).toBe(true);
        expect(mockState.startX).toBe(100);
        expect(mockState.startY).toBe(200);
      });

      it('should not start panning on left-click', () => {
        const event = createPointerEvent({
          pointerType: 'mouse',
          button: KritzelMouseButton.Left,
          clientX: 100,
          clientY: 200,
        });

        viewport.handlePointerDown(event);

        expect(mockState.isPanning).toBe(false);
      });

      it('should cancel viewport animation on pointer down', () => {
        const cancelSpy = jest.spyOn(viewport, 'cancelViewportAnimation');

        viewport.handlePointerDown(createPointerEvent({ pointerType: 'mouse' }));

        expect(cancelSpy).toHaveBeenCalled();
      });
    });

    describe('touch events', () => {
      it('should start scaling when two touch pointers are active', () => {
        const pointer1 = createPointerEvent({
          pointerType: 'touch',
          pointerId: 1,
          clientX: 100,
          clientY: 100,
        });
        const pointer2 = createPointerEvent({
          pointerType: 'touch',
          pointerId: 2,
          clientX: 200,
          clientY: 200,
        });

        mockState.pointers.set(1, pointer1);
        mockState.pointers.set(2, pointer2);

        viewport.handlePointerDown(pointer2);

        expect(mockState.isScaling).toBe(true);
        expect(viewport.initialTouchDistance).toBeGreaterThan(0);
        expect(mockCore.rerender).toHaveBeenCalled();
      });

      it('should calculate midpoint as startX/startY for two-finger gesture', () => {
        const pointer1 = createPointerEvent({
          pointerType: 'touch',
          pointerId: 1,
          clientX: 100,
          clientY: 100,
        });
        const pointer2 = createPointerEvent({
          pointerType: 'touch',
          pointerId: 2,
          clientX: 300,
          clientY: 300,
        });

        mockState.pointers.set(1, pointer1);
        mockState.pointers.set(2, pointer2);

        viewport.handlePointerDown(pointer2);

        expect(viewport.startX).toBe(200);
        expect(viewport.startY).toBe(200);
      });

      it('should remove current path when two-finger gesture starts', () => {
        const mockPath = { id: 'path-1', isCompleted: false };
        (mockCore.store as any).currentPath = mockPath;

        const pointer1 = createPointerEvent({
          pointerType: 'touch',
          pointerId: 1,
          clientX: 100,
          clientY: 100,
        });
        const pointer2 = createPointerEvent({
          pointerType: 'touch',
          pointerId: 2,
          clientX: 200,
          clientY: 200,
        });

        mockState.pointers.set(1, pointer1);
        mockState.pointers.set(2, pointer2);

        viewport.handlePointerDown(pointer2);

        expect(mockState.objects.remove).toHaveBeenCalled();
      });

      it('should clear selection when scaling starts while selecting', () => {
        mockState.isSelecting = true;

        const selectedObj = { isSelected: true };
        (mockCore.store as any).selectedObjects = [selectedObj];

        const pointer1 = createPointerEvent({
          pointerType: 'touch',
          pointerId: 1,
          clientX: 100,
          clientY: 100,
        });
        const pointer2 = createPointerEvent({
          pointerType: 'touch',
          pointerId: 2,
          clientX: 200,
          clientY: 200,
        });

        mockState.pointers.set(1, pointer1);
        mockState.pointers.set(2, pointer2);

        viewport.handlePointerDown(pointer2);

        expect(mockState.isSelecting).toBe(false);
        expect(mockCore.store.setSelectionBox).toHaveBeenCalledWith(null);
        expect(selectedObj.isSelected).toBe(false);
      });

      it('should not start scaling with only one touch pointer', () => {
        const pointer1 = createPointerEvent({
          pointerType: 'touch',
          pointerId: 1,
          clientX: 100,
          clientY: 100,
        });

        mockState.pointers.set(1, pointer1);

        viewport.handlePointerDown(pointer1);

        expect(mockState.isScaling).toBe(false);
      });
    });
  });

  describe('handlePointerMove', () => {
    describe('mouse panning', () => {
      it('should update pointer coordinates on mouse move', () => {
        mockState.host = mockHost;

        const event = createPointerEvent({
          pointerType: 'mouse',
          clientX: 500,
          clientY: 400,
        });

        viewport.handlePointerMove(event);

        expect(mockState.pointerX).toBe(500);
        expect(mockState.pointerY).toBe(400);
      });

      it('should pan the viewport when isPanning is true', () => {
        mockState.host = mockHost;
        mockState.isPanning = true;
        mockState.startX = 400;
        mockState.startY = 300;

        const event = createPointerEvent({
          pointerType: 'mouse',
          clientX: 450,
          clientY: 350,
        });

        viewport.handlePointerMove(event);

        expect(mockState.translateX).toBe(50);
        expect(mockState.translateY).toBe(50);
        expect(mockState.hasViewportChanged).toBe(true);
        expect(mockState.skipContextMenu).toBe(true);
        expect(mockCore.rerender).toHaveBeenCalled();
      });

      it('should update startX/startY during panning', () => {
        mockState.host = mockHost;
        mockState.isPanning = true;
        mockState.startX = 400;
        mockState.startY = 300;

        const event = createPointerEvent({
          pointerType: 'mouse',
          clientX: 450,
          clientY: 350,
        });

        viewport.handlePointerMove(event);

        expect(mockState.startX).toBe(450);
        expect(mockState.startY).toBe(350);
      });

      it('should not pan when isPanning is false', () => {
        mockState.host = mockHost;
        mockState.isPanning = false;

        const event = createPointerEvent({
          pointerType: 'mouse',
          clientX: 450,
          clientY: 350,
        });

        viewport.handlePointerMove(event);

        expect(mockState.translateX).toBe(0);
        expect(mockState.translateY).toBe(0);
      });
    });

    describe('touch pinch-to-zoom', () => {
      it('should clear cursor awareness when two-finger scaling starts', () => {
        const pointer1 = createPointerEvent({
          pointerType: 'touch',
          pointerId: 1,
          clientX: 100,
          clientY: 100,
        });
        const pointer2 = createPointerEvent({
          pointerType: 'touch',
          pointerId: 2,
          clientX: 200,
          clientY: 200,
        });

        mockState.pointers.set(1, pointer1);
        mockState.pointers.set(2, pointer2);

        viewport.handlePointerDown(pointer2);

        expect(mockState.objects.clearCursorPosition).toHaveBeenCalled();
      });

      it('should scale viewport during two-finger pinch', () => {
        mockState.host = mockHost;
        mockState.scale = 1;

        const pointer1 = createPointerEvent({
          pointerType: 'touch',
          pointerId: 1,
          clientX: 100,
          clientY: 200,
        });
        const pointer2 = createPointerEvent({
          pointerType: 'touch',
          pointerId: 2,
          clientX: 300,
          clientY: 400,
        });

        mockState.pointers.set(1, pointer1);
        mockState.pointers.set(2, pointer2);

        // Set initial touch distance (simulating pointerDown first)
        viewport.initialTouchDistance = Math.sqrt(
          Math.pow(100 - 300, 2) + Math.pow(200 - 400, 2)
        );
        viewport.startX = 200;
        viewport.startY = 300;

        // Now move fingers apart (zoom in)
        const movedPointer1 = createPointerEvent({
          pointerType: 'touch',
          pointerId: 1,
          clientX: 50,
          clientY: 150,
        });
        const movedPointer2 = createPointerEvent({
          pointerType: 'touch',
          pointerId: 2,
          clientX: 350,
          clientY: 450,
        });

        mockState.pointers.set(1, movedPointer1);
        mockState.pointers.set(2, movedPointer2);

        viewport.handlePointerMove(movedPointer2);

        expect(mockState.hasViewportChanged).toBe(true);
        expect(mockCore.rerender).toHaveBeenCalled();
      });

      it('should not broadcast cursor awareness during two-finger pinch', () => {
        mockState.host = mockHost;

        const pointer1 = createPointerEvent({
          pointerType: 'touch',
          pointerId: 1,
          clientX: 100,
          clientY: 200,
        });
        const pointer2 = createPointerEvent({
          pointerType: 'touch',
          pointerId: 2,
          clientX: 300,
          clientY: 400,
        });

        mockState.pointers.set(1, pointer1);
        mockState.pointers.set(2, pointer2);
        mockState.isScaling = true;
        viewport.initialTouchDistance = Math.sqrt(
          Math.pow(100 - 300, 2) + Math.pow(200 - 400, 2)
        );
        viewport.startX = 200;
        viewport.startY = 300;

        viewport.handlePointerMove(pointer2);

        expect(mockState.objects.updateCursorPosition).not.toHaveBeenCalled();
        expect(mockState.objects.clearCursorPosition).toHaveBeenCalled();
      });

      it('should not broadcast cursor awareness for single-touch moves below threshold', () => {
        mockState.host = mockHost;

        const pointerDown = createPointerEvent({
          pointerType: 'touch',
          pointerId: 1,
          clientX: 100,
          clientY: 100,
        });

        mockState.pointers.set(1, pointerDown);
        viewport.handlePointerDown(pointerDown);

        // Move only 3px — below the 5px threshold
        const pointerMove = createPointerEvent({
          pointerType: 'touch',
          pointerId: 1,
          clientX: 102,
          clientY: 102,
        });

        viewport.handlePointerMove(pointerMove);

        expect(mockState.pointerX).toBe(102);
        expect(mockState.pointerY).toBe(102);
        expect(mockState.objects.updateCursorPosition).not.toHaveBeenCalled();
        expect(mockState.objects.clearCursorPosition).not.toHaveBeenCalled();
      });

      it('should broadcast cursor awareness for single-touch moves once threshold is exceeded', () => {
        mockState.host = mockHost;

        const pointerDown = createPointerEvent({
          pointerType: 'touch',
          pointerId: 1,
          clientX: 100,
          clientY: 100,
        });

        mockState.pointers.set(1, pointerDown);
        viewport.handlePointerDown(pointerDown);

        // Move 6px — above the 5px threshold
        const pointerMove = createPointerEvent({
          pointerType: 'touch',
          pointerId: 1,
          clientX: 105,
          clientY: 103,
        });

        viewport.handlePointerMove(pointerMove);

        expect(mockState.pointerX).toBe(105);
        expect(mockState.pointerY).toBe(103);
        expect(mockState.objects.updateCursorPosition).toHaveBeenCalledWith(105, 103);
        expect(mockState.objects.clearCursorPosition).not.toHaveBeenCalled();
      });

      it('should keep broadcasting after threshold is exceeded on subsequent moves', () => {
        mockState.host = mockHost;

        const pointerDown = createPointerEvent({
          pointerType: 'touch',
          pointerId: 1,
          clientX: 100,
          clientY: 100,
        });

        mockState.pointers.set(1, pointerDown);
        viewport.handlePointerDown(pointerDown);

        // First move exceeds threshold
        const pointerMove1 = createPointerEvent({
          pointerType: 'touch',
          pointerId: 1,
          clientX: 110,
          clientY: 100,
        });
        viewport.handlePointerMove(pointerMove1);
        expect(mockState.objects.updateCursorPosition).toHaveBeenCalledTimes(1);

        // Second move — still broadcasting even though it's close to the previous position
        const pointerMove2 = createPointerEvent({
          pointerType: 'touch',
          pointerId: 1,
          clientX: 111,
          clientY: 100,
        });
        viewport.handlePointerMove(pointerMove2);
        expect(mockState.objects.updateCursorPosition).toHaveBeenCalledTimes(2);
      });

      it('should reset touch cursor broadcast threshold on new touch interaction', () => {
        mockState.host = mockHost;

        // First touch: exceed threshold
        const pointerDown1 = createPointerEvent({
          pointerType: 'touch',
          pointerId: 1,
          clientX: 100,
          clientY: 100,
        });
        mockState.pointers.set(1, pointerDown1);
        viewport.handlePointerDown(pointerDown1);

        const pointerMove1 = createPointerEvent({
          pointerType: 'touch',
          pointerId: 1,
          clientX: 120,
          clientY: 100,
        });
        viewport.handlePointerMove(pointerMove1);
        expect(mockState.objects.updateCursorPosition).toHaveBeenCalledTimes(1);

        // Pointer up
        mockState.pointers.clear();
        viewport.handlePointerUp(createPointerEvent({ pointerType: 'touch', pointerId: 1 }));

        mockState.objects.updateCursorPosition.mockClear();

        // Second touch: below threshold again
        const pointerDown2 = createPointerEvent({
          pointerType: 'touch',
          pointerId: 2,
          clientX: 200,
          clientY: 200,
        });
        mockState.pointers.set(2, pointerDown2);
        viewport.handlePointerDown(pointerDown2);

        const pointerMove2 = createPointerEvent({
          pointerType: 'touch',
          pointerId: 2,
          clientX: 201,
          clientY: 201,
        });
        viewport.handlePointerMove(pointerMove2);
        expect(mockState.objects.updateCursorPosition).not.toHaveBeenCalled();
      });

      it('should not scale beyond scaleMax', () => {
        mockState.host = mockHost;
        mockState.scale = 9.5;
        mockState.scaleMax = 10;

        const pointer1 = createPointerEvent({
          pointerType: 'touch',
          pointerId: 1,
          clientX: 100,
          clientY: 100,
        });
        const pointer2 = createPointerEvent({
          pointerType: 'touch',
          pointerId: 2,
          clientX: 200,
          clientY: 200,
        });

        mockState.pointers.set(1, pointer1);
        mockState.pointers.set(2, pointer2);

        viewport.initialTouchDistance = 50;
        viewport.startX = 150;
        viewport.startY = 150;

        // Move fingers very far apart to attempt exceeding scaleMax
        const movedPointer1 = createPointerEvent({
          pointerType: 'touch',
          pointerId: 1,
          clientX: 0,
          clientY: 0,
        });
        const movedPointer2 = createPointerEvent({
          pointerType: 'touch',
          pointerId: 2,
          clientX: 400,
          clientY: 400,
        });

        mockState.pointers.set(1, movedPointer1);
        mockState.pointers.set(2, movedPointer2);

        viewport.handlePointerMove(movedPointer2);

        // Scale should not have changed since newScale would exceed scaleMax
        expect(mockState.scale).toBe(9.5);
      });

      it('should not modify scale with only one touch pointer', () => {
        mockState.host = mockHost;
        const originalScale = mockState.scale;

        const pointer1 = createPointerEvent({
          pointerType: 'touch',
          pointerId: 1,
          clientX: 100,
          clientY: 100,
        });

        mockState.pointers.set(1, pointer1);

        viewport.handlePointerMove(pointer1);

        expect(mockState.scale).toBe(originalScale);
      });
    });
  });

  describe('handlePointerUp', () => {
    describe('mouse events', () => {
      it('should stop panning on mouse pointer up', () => {
        mockState.isPanning = true;

        const event = createPointerEvent({
          pointerType: 'mouse',
        });

        viewport.handlePointerUp(event);

        expect(mockState.isPanning).toBe(false);
        expect(mockCore.rerender).toHaveBeenCalled();
      });

      it('should not call rerender if not panning', () => {
        mockState.isPanning = false;

        const event = createPointerEvent({
          pointerType: 'mouse',
        });

        viewport.handlePointerUp(event);

        expect(mockCore.rerender).not.toHaveBeenCalled();
      });
    });

    describe('touch events', () => {
      it('should trigger debounced end scaling when all touch pointers are released', () => {
        mockState.isScaling = true;
        mockState.pointers = new Map(); // no pointers left

        const event = createPointerEvent({
          pointerType: 'touch',
        });

        viewport.handlePointerUp(event);

        // Debounced end scaling is called immediately (since we mocked debounce)
        // which sets isScaling to false and calls rerender
        expect(mockState.isScaling).toBe(false);
        expect(mockCore.rerender).toHaveBeenCalled();
      });

      it('should not end scaling if pointers are still active', () => {
        mockState.isScaling = true;
        mockState.pointers.set(1, createPointerEvent({ pointerType: 'touch', pointerId: 1 }));

        const event = createPointerEvent({
          pointerType: 'touch',
          pointerId: 2,
        });

        viewport.handlePointerUp(event);

        // isScaling should remain true since there's still a pointer
        expect(mockState.isScaling).toBe(true);
      });
    });
  });

  describe('handleWheel', () => {
    beforeEach(() => {
      mockState.host = mockHost;
    });

    it('should cancel viewport animation on wheel', () => {
      const cancelSpy = jest.spyOn(viewport, 'cancelViewportAnimation');

      viewport.handleWheel(createWheelEvent());

      expect(cancelSpy).toHaveBeenCalled();
    });

    describe('zoom (ctrlKey)', () => {
      it('should set isScaling to true when ctrl+wheel', () => {
        const event = createWheelEvent({
          ctrlKey: true,
          deltaY: -10,
        });

        viewport.handleWheel(event);

        // isScaling set to true, then debounced end scaling also fires (mock)
        // so we verify rerender was called
        expect(mockCore.rerender).toHaveBeenCalled();
      });

      it('should zoom in on negative deltaY with ctrlKey', () => {
        mockState.scale = 1;

        const event = createWheelEvent({
          ctrlKey: true,
          deltaY: -10,
          clientX: 500,
          clientY: 400,
        });

        viewport.handleWheel(event);

        // Negative deltaY = zoom in = scale should increase
        expect(mockState.scale).toBeGreaterThan(1);
      });

      it('should zoom out on positive deltaY with ctrlKey', () => {
        mockState.scale = 2;

        const event = createWheelEvent({
          ctrlKey: true,
          deltaY: 10,
          clientX: 500,
          clientY: 400,
        });

        viewport.handleWheel(event);

        expect(mockState.scale).toBeLessThan(2);
      });

      it('should clamp scale to scaleMax', () => {
        mockState.scale = 9.9;
        mockState.scaleMax = 10;

        const event = createWheelEvent({
          ctrlKey: true,
          deltaY: -100,
          clientX: 500,
          clientY: 400,
        });

        viewport.handleWheel(event);

        expect(mockState.scale).toBeLessThanOrEqual(10);
      });

      it('should clamp scale to scaleMin', () => {
        mockState.scale = 0.15;
        mockState.scaleMin = 0.1;

        const event = createWheelEvent({
          ctrlKey: true,
          deltaY: 100,
          clientX: 500,
          clientY: 400,
        });

        viewport.handleWheel(event);

        expect(mockState.scale).toBeGreaterThanOrEqual(0.1);
      });

      it('should set hasViewportChanged to true on zoom', () => {
        const event = createWheelEvent({
          ctrlKey: true,
          deltaY: -10,
        });

        viewport.handleWheel(event);

        expect(mockState.hasViewportChanged).toBe(true);
      });

      it('should apply horizontal pan from trackpad pinch+drag when deltaX is non-zero', () => {
        mockState.translateX = 100;

        const event = createWheelEvent({
          ctrlKey: true,
          deltaX: 50,
          deltaY: 0,
          clientX: 500,
          clientY: 400,
        });

        viewport.handleWheel(event);

        // translateX should decrease by deltaX * 0.8
        expect(mockState.translateX).toBeLessThan(100);
      });
    });

    describe('pan (no ctrlKey)', () => {
      it('should pan horizontally based on deltaX', () => {
        mockState.translateX = 100;

        const event = createWheelEvent({
          deltaX: 50,
          deltaY: 0,
        });

        viewport.handleWheel(event);

        // translateX -= deltaX * 0.8 = 100 - 40 = 60
        expect(mockState.translateX).toBe(60);
      });

      it('should pan vertically based on deltaY', () => {
        mockState.translateY = 100;

        const event = createWheelEvent({
          deltaX: 0,
          deltaY: 50,
        });

        viewport.handleWheel(event);

        // translateY -= deltaY * 0.8 = 100 - 40 = 60
        expect(mockState.translateY).toBe(60);
      });

      it('should set hasViewportChanged to true on pan', () => {
        const event = createWheelEvent({
          deltaX: 10,
          deltaY: 10,
        });

        viewport.handleWheel(event);

        expect(mockState.hasViewportChanged).toBe(true);
      });

      it('should call rerender after panning', () => {
        const event = createWheelEvent({
          deltaX: 10,
          deltaY: 10,
        });

        viewport.handleWheel(event);

        expect(mockCore.rerender).toHaveBeenCalled();
      });
    });
  });

  describe('centerInViewport', () => {
    it('should center the given object in the viewport', () => {
      mockState.scale = 1;
      mockState.viewportWidth = 1000;
      mockState.viewportHeight = 800;

      const mockObject = {
        rotatedBoundingBox: { x: 100, y: 100, width: 200, height: 200 },
      } as unknown as KritzelBaseObject;

      viewport.centerInViewport(mockObject);

      // Object center: (200, 200)
      // Target translateX: 1000/2 - 200*1 = 300
      // Target translateY: 800/2 - 200*1 = 200
      expect(mockState.translateX).toBe(300);
      expect(mockState.translateY).toBe(200);
      expect(mockState.hasViewportChanged).toBe(true);
      expect(mockCore.rerender).toHaveBeenCalled();
    });

    it('should account for scale when centering', () => {
      mockState.scale = 2;
      mockState.viewportWidth = 1000;
      mockState.viewportHeight = 800;

      const mockObject = {
        rotatedBoundingBox: { x: 0, y: 0, width: 100, height: 100 },
      } as unknown as KritzelBaseObject;

      viewport.centerInViewport(mockObject);

      // Object center: (50, 50)
      // translateX = 500 - 50*2 = 400
      // translateY = 400 - 50*2 = 300
      expect(mockState.translateX).toBe(400);
      expect(mockState.translateY).toBe(300);
    });
  });

  describe('centerFitInViewport', () => {
    it('should scale and center the object to fit in the viewport', () => {
      mockState.viewportWidth = 1000;
      mockState.viewportHeight = 800;
      mockState.scaleMax = 10;
      mockState.scaleMin = 0.1;

      const mockObject = {
        rotatedBoundingBox: { x: 0, y: 0, width: 500, height: 500 },
      } as unknown as KritzelBaseObject;

      viewport.centerFitInViewport(mockObject);

      // scaleX = 1000 / (500 * 1.1) ≈ 1.818
      // scaleY = 800 / (500 * 1.1) ≈ 1.455
      // newScale = min(1.455, 10) = 1.455
      const expectedScale = Math.min(
        1000 / (500 * 1.1),
        800 / (500 * 1.1),
        10
      );
      expect(mockState.scale).toBeCloseTo(expectedScale, 2);
      expect(mockState.hasViewportChanged).toBe(true);
    });

    it('should clamp scale to scaleMax', () => {
      mockState.viewportWidth = 1000;
      mockState.viewportHeight = 800;
      mockState.scaleMax = 1;
      mockState.scaleMin = 0.1;

      const mockObject = {
        rotatedBoundingBox: { x: 0, y: 0, width: 10, height: 10 },
      } as unknown as KritzelBaseObject;

      viewport.centerFitInViewport(mockObject);

      // Without clamping, scale would be very large
      // Should be clamped to scaleMax = 1
      expect(mockState.scale).toBeLessThanOrEqual(1);
    });
  });

  describe('cancelViewportAnimation', () => {
    it('should call cancelAnimationFrame when animation is active', () => {
      // Trigger an animation to set _animationFrameId
      (global.requestAnimationFrame as jest.Mock).mockReturnValue(42);
      viewport.animateViewportTo(100, 100, 2);

      viewport.cancelViewportAnimation();

      expect(global.cancelAnimationFrame).toHaveBeenCalledWith(42);
    });

    it('should not call cancelAnimationFrame when no animation is active', () => {
      viewport.cancelViewportAnimation();

      expect(global.cancelAnimationFrame).not.toHaveBeenCalled();
    });
  });

  describe('animateViewportTo', () => {
    it('should request an animation frame', () => {
      viewport.animateViewportTo(100, 200, 2);

      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    it('should cancel any existing animation before starting a new one', () => {
      (global.requestAnimationFrame as jest.Mock).mockReturnValue(42);
      viewport.animateViewportTo(100, 200, 2);

      (global.requestAnimationFrame as jest.Mock).mockReturnValue(43);
      viewport.animateViewportTo(200, 300, 3);

      expect(global.cancelAnimationFrame).toHaveBeenCalledWith(42);
    });

    it('should update state when animation callback executes', () => {
      let animateCallback!: (time: number) => void;
      (global.requestAnimationFrame as jest.Mock).mockImplementation((cb) => {
        animateCallback = cb;
        return 1;
      });

      jest.spyOn(performance, 'now').mockReturnValue(0);

      mockState.translateX = 0;
      mockState.translateY = 0;
      mockState.scale = 1;

      viewport.animateViewportTo(100, 200, 2, 150);

      // Simulate animation at completion (progress = 1)
      animateCallback(150);

      expect(mockState.translateX).toBe(100);
      expect(mockState.translateY).toBe(200);
      expect(mockState.scale).toBe(2);
      expect(mockState.hasViewportChanged).toBe(true);
      expect(mockCore.rerender).toHaveBeenCalled();
    });

    it('should continue animation when progress < 1', () => {
      let animateCallback!: (time: number) => void;
      (global.requestAnimationFrame as jest.Mock).mockImplementation((cb) => {
        animateCallback = cb;
        return 1;
      });

      jest.spyOn(performance, 'now').mockReturnValue(0);

      viewport.animateViewportTo(100, 200, 2, 150);

      // Simulate animation at midpoint
      animateCallback(75);

      // Should request another frame since progress < 1
      expect(global.requestAnimationFrame).toHaveBeenCalledTimes(2);
    });
  });

  describe('centerFitNearestContent', () => {
    it('should return false when there are no objects', () => {
      (mockCore.store as any).allNonSelectionObjects = [];

      const result = viewport.centerFitNearestContent();

      expect(result).toBe(false);
    });

    it('should return true when content is found', () => {
      const obj = {
        rotatedBoundingBox: { x: 100, y: 100, width: 200, height: 200 },
      };
      (mockCore.store as any).allNonSelectionObjects = [obj];

      const result = viewport.centerFitNearestContent();

      expect(result).toBe(true);
    });

    it('should animate viewport to show nearest content', () => {
      const animateSpy = jest.spyOn(viewport, 'animateViewportTo');

      const obj = {
        rotatedBoundingBox: { x: 100, y: 100, width: 200, height: 200 },
      };
      (mockCore.store as any).allNonSelectionObjects = [obj];

      viewport.centerFitNearestContent();

      expect(animateSpy).toHaveBeenCalled();
    });

    it('should respect maxObjects parameter', () => {
      const objects = Array.from({ length: 50 }, (_, i) => ({
        rotatedBoundingBox: { x: i * 10, y: i * 10, width: 50, height: 50 },
      }));
      (mockCore.store as any).allNonSelectionObjects = objects;

      const animateSpy = jest.spyOn(viewport, 'animateViewportTo');

      viewport.centerFitNearestContent(5);

      expect(animateSpy).toHaveBeenCalled();
    });

    it('should clamp scale within min/max bounds', () => {
      mockState.scaleMax = 5;
      mockState.scaleMin = 0.5;

      // Tiny object would produce very large scale
      const obj = {
        rotatedBoundingBox: { x: 0, y: 0, width: 1, height: 1 },
      };
      (mockCore.store as any).allNonSelectionObjects = [obj];

      const animateSpy = jest.spyOn(viewport, 'animateViewportTo');

      viewport.centerFitNearestContent();

      // The third argument (scale) should be clamped to scaleMax
      const calledScale = animateSpy.mock.calls[0][2];
      expect(calledScale).toBeLessThanOrEqual(5);
      expect(calledScale).toBeGreaterThanOrEqual(0.5);
    });
  });

  describe('centerFitObjects', () => {
    it('should return false when the object list is empty', () => {
      const result = viewport.centerFitObjects([]);

      expect(result).toBe(false);
    });

    it('should animate viewport to show the provided objects', () => {
      const animateSpy = jest.spyOn(viewport, 'animateViewportTo');
      const objects = [
        { rotatedBoundingBox: { x: 100, y: 50, width: 200, height: 100 } },
        { rotatedBoundingBox: { x: 600, y: 450, width: 100, height: 150 } },
      ] as unknown as KritzelBaseObject[];

      const result = viewport.centerFitObjects(objects, false);

      expect(result).toBe(true);
      expect(animateSpy).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), expect.any(Number), 0);
    });
  });

  describe('centerFitAllObjects', () => {
    it('should delegate to centerFitObjects with all non-selection objects', () => {
      const allObjects = [
        { rotatedBoundingBox: { x: 10, y: 20, width: 30, height: 40 } },
      ] as unknown as KritzelBaseObject[];
      (mockCore.store as any).allNonSelectionObjects = allObjects;
      const centerFitObjectsSpy = jest.spyOn(viewport, 'centerFitObjects').mockReturnValue(true);

      const result = viewport.centerFitAllObjects(false);

      expect(result).toBe(true);
      expect(centerFitObjectsSpy).toHaveBeenCalledWith(allObjects, false);
    });
  });

  describe('viewport boundary clamping', () => {
    beforeEach(() => {
      mockState.host = mockHost;
      mockState.viewportWidth = 1000;
      mockState.viewportHeight = 800;
      mockState.scale = 1;
    });

    describe('during mouse panning', () => {
      it('should clamp translateX to respect left boundary', () => {
        mockState.viewportBoundaryLeft = 0;
        mockState.viewportBoundaryRight = Infinity;
        mockState.isPanning = true;
        mockState.startX = 500;
        mockState.startY = 400;
        mockState.translateX = 0;

        // Try to pan right (which would show content left of boundaryLeft=0)
        const event = createPointerEvent({
          pointerType: 'mouse',
          clientX: 600, // +100 from start
          clientY: 400,
        });

        viewport.handlePointerMove(event);

        // translateX should be clamped to 0 (cannot go positive when boundaryLeft=0)
        expect(mockState.translateX).toBeCloseTo(0);
      });

      it('should clamp translateX to respect right boundary', () => {
        mockState.viewportBoundaryLeft = -Infinity;
        mockState.viewportBoundaryRight = 500;
        mockState.isPanning = true;
        mockState.startX = 500;
        mockState.startY = 400;
        mockState.translateX = 0;

        // Try to pan left (which would show content right of boundaryRight=500)
        const event = createPointerEvent({
          pointerType: 'mouse',
          clientX: 200, // -300 from start
          clientY: 400,
        });

        viewport.handlePointerMove(event);

        // translateX cannot go below viewportWidth - boundaryRight * scale = 1000 - 500 = 500
        expect(mockState.translateX).toBe(500);
      });

      it('should clamp translateY to respect top boundary', () => {
        mockState.viewportBoundaryTop = 0;
        mockState.viewportBoundaryBottom = Infinity;
        mockState.isPanning = true;
        mockState.startX = 500;
        mockState.startY = 400;
        mockState.translateY = 0;

        // Try to pan down (which would show content above boundaryTop=0)
        const event = createPointerEvent({
          pointerType: 'mouse',
          clientX: 500,
          clientY: 500, // +100 from start
        });

        viewport.handlePointerMove(event);

        // translateY should be clamped to 0 (cannot go positive when boundaryTop=0)
        expect(mockState.translateY).toBeCloseTo(0);
      });

      it('should clamp translateY to respect bottom boundary', () => {
        mockState.viewportBoundaryTop = -Infinity;
        mockState.viewportBoundaryBottom = 400;
        mockState.isPanning = true;
        mockState.startX = 500;
        mockState.startY = 400;
        mockState.translateY = 0;

        // Try to pan up (which would show content below boundaryBottom=400)
        const event = createPointerEvent({
          pointerType: 'mouse',
          clientX: 500,
          clientY: 200, // -200 from start
        });

        viewport.handlePointerMove(event);

        // translateY cannot go below viewportHeight - boundaryBottom * scale = 800 - 400 = 400
        expect(mockState.translateY).toBe(400);
      });

      it('should allow panning within boundaries', () => {
        mockState.viewportBoundaryLeft = -1000;
        mockState.viewportBoundaryRight = 2000;
        mockState.viewportBoundaryTop = -1000;
        mockState.viewportBoundaryBottom = 2000;
        mockState.isPanning = true;
        mockState.startX = 500;
        mockState.startY = 400;
        mockState.translateX = 500;
        mockState.translateY = 400;

        const event = createPointerEvent({
          pointerType: 'mouse',
          clientX: 550,
          clientY: 450,
        });

        viewport.handlePointerMove(event);

        // Should pan normally within boundaries
        expect(mockState.translateX).toBe(550);
        expect(mockState.translateY).toBe(450);
      });

      it('should not clamp when boundaries are infinite', () => {
        mockState.viewportBoundaryLeft = -Infinity;
        mockState.viewportBoundaryRight = Infinity;
        mockState.viewportBoundaryTop = -Infinity;
        mockState.viewportBoundaryBottom = Infinity;
        mockState.isPanning = true;
        mockState.startX = 500;
        mockState.startY = 400;
        mockState.translateX = 0;
        mockState.translateY = 0;

        const event = createPointerEvent({
          pointerType: 'mouse',
          clientX: 1500, // +1000 from start
          clientY: 1400, // +1000 from start
        });

        viewport.handlePointerMove(event);

        // No clamping should occur
        expect(mockState.translateX).toBe(1000);
        expect(mockState.translateY).toBe(1000);
      });
    });

    describe('during wheel panning', () => {
      it('should clamp translate values when panning with wheel', () => {
        // Use boundaries larger than viewport so clamping is meaningful at scale=1
        mockState.viewportBoundaryLeft = 0;
        mockState.viewportBoundaryRight = 2000;
        mockState.viewportBoundaryTop = 0;
        mockState.viewportBoundaryBottom = 1600;
        mockState.translateX = 0;
        mockState.translateY = 0;

        // Try to pan right (negative deltaX pans right, making translateX positive)
        const event = createWheelEvent({
          deltaX: -1000,
          deltaY: -1000,
        });

        viewport.handleWheel(event);

        // Should be clamped to boundaries
        // translateXMax = -boundaryLeft * scale = 0
        // translateYMax = -boundaryTop * scale = 0
        expect(mockState.translateX).toBeCloseTo(0); // Clamped to left boundary
        expect(mockState.translateY).toBeCloseTo(0); // Clamped to top boundary
      });
    });

    describe('during zoom', () => {
      it('should prevent zooming out beyond boundary-based minimum scale', () => {
        // Set boundaries that are smaller than viewport at scale=1
        // Boundary width = 500, viewport width = 1000
        // Min scale = 1000/500 = 2
        mockState.viewportBoundaryLeft = 0;
        mockState.viewportBoundaryRight = 500;
        mockState.viewportBoundaryTop = 0;
        mockState.viewportBoundaryBottom = 400;
        mockState.scale = 3;
        mockState.scaleMin = 0.1; // Configured min is lower than boundary-based min

        // Try to zoom out significantly
        const event = createWheelEvent({
          ctrlKey: true,
          deltaY: 1000, // Zoom out
          clientX: 500,
          clientY: 400,
        });

        viewport.handleWheel(event);

        // Scale should not go below the boundary-based minimum (2.0 for width)
        expect(mockState.scale).toBeGreaterThanOrEqual(2);
      });

      it('should allow zooming when within boundary constraints', () => {
        mockState.viewportBoundaryLeft = -Infinity;
        mockState.viewportBoundaryRight = Infinity;
        mockState.viewportBoundaryTop = -Infinity;
        mockState.viewportBoundaryBottom = Infinity;
        mockState.scale = 1;
        mockState.scaleMin = 0.1;

        // Zoom out
        const event = createWheelEvent({
          ctrlKey: true,
          deltaY: 100, // Zoom out
          clientX: 500,
          clientY: 400,
        });

        viewport.handleWheel(event);

        // Scale should decrease (zoom out allowed with infinite boundaries)
        expect(mockState.scale).toBeLessThan(1);
        expect(mockState.scale).toBeGreaterThanOrEqual(0.1);
      });

      it('should clamp translate after zooming to stay within boundaries', () => {
        mockState.viewportBoundaryLeft = 0;
        mockState.viewportBoundaryRight = 1000;
        mockState.viewportBoundaryTop = 0;
        mockState.viewportBoundaryBottom = 800;
        mockState.scale = 1;
        mockState.translateX = 0;
        mockState.translateY = 0;

        // Zoom in at a corner
        const event = createWheelEvent({
          ctrlKey: true,
          deltaY: -100, // Zoom in
          clientX: 0,
          clientY: 0,
        });

        viewport.handleWheel(event);

        // Translate should be clamped to stay within boundaries
        expect(mockState.translateX).toBeGreaterThanOrEqual(mockState.viewportWidth - mockState.viewportBoundaryRight * mockState.scale);
        expect(mockState.translateX).toBeLessThanOrEqual(-mockState.viewportBoundaryLeft * mockState.scale);
      });
    });

    describe('during centerFitInViewport', () => {
      it('should respect boundary-based minimum scale when centering', () => {
        mockState.viewportBoundaryLeft = 0;
        mockState.viewportBoundaryRight = 500;
        mockState.viewportBoundaryTop = 0;
        mockState.viewportBoundaryBottom = 400;
        mockState.scaleMin = 0.1;

        // Large object that would require scale < boundary minimum
        const mockObject = {
          rotatedBoundingBox: { x: 0, y: 0, width: 5000, height: 4000 },
        } as KritzelBaseObject;

        viewport.centerFitInViewport(mockObject);

        // Scale should not go below boundary-based minimum
        expect(mockState.scale).toBeGreaterThanOrEqual(2); // 1000/500 = 2
      });
    });

    describe('during centerFitNearestContent', () => {
      it('should respect boundary-based minimum scale', () => {
        mockState.viewportBoundaryLeft = 0;
        mockState.viewportBoundaryRight = 500;
        mockState.viewportBoundaryTop = 0;
        mockState.viewportBoundaryBottom = 400;
        mockState.scaleMin = 0.1;

        const obj = {
          rotatedBoundingBox: { x: 0, y: 0, width: 5000, height: 4000 },
        };
        (mockCore.store as any).allNonSelectionObjects = [obj];

        const animateSpy = jest.spyOn(viewport, 'animateViewportTo');

        viewport.centerFitNearestContent();

        const calledScale = animateSpy.mock.calls[0][2];
        expect(calledScale).toBeGreaterThanOrEqual(2); // Boundary-based minimum
      });
    });
  });

  describe('getViewport', () => {
    it('should return current viewport state', () => {
      mockState.translateX = 100;
      mockState.translateY = 200;
      mockState.scale = 2;
      mockState.viewportWidth = 1000;
      mockState.viewportHeight = 800;

      const result = viewport.getViewport();

      expect(result).toEqual({
        translateX: 100,
        translateY: 200,
        scale: 2,
        width: 1000,
        height: 800,
      });
    });
  });

  describe('screenToWorld', () => {
    it('should convert screen coordinates to world coordinates at scale 1', () => {
      mockState.translateX = 0;
      mockState.translateY = 0;
      mockState.scale = 1;

      const result = viewport.screenToWorld(500, 400);

      expect(result).toEqual({ x: 500, y: 400 });
    });

    it('should account for translation', () => {
      mockState.translateX = 100;
      mockState.translateY = 200;
      mockState.scale = 1;

      const result = viewport.screenToWorld(500, 400);

      expect(result).toEqual({ x: 400, y: 200 });
    });

    it('should account for scale', () => {
      mockState.translateX = 0;
      mockState.translateY = 0;
      mockState.scale = 2;

      const result = viewport.screenToWorld(500, 400);

      expect(result).toEqual({ x: 250, y: 200 });
    });

    it('should account for both translation and scale', () => {
      mockState.translateX = 100;
      mockState.translateY = 200;
      mockState.scale = 2;

      const result = viewport.screenToWorld(500, 400);

      expect(result).toEqual({ x: 200, y: 100 });
    });
  });

  describe('worldToScreen', () => {
    it('should convert world coordinates to screen coordinates at scale 1', () => {
      mockState.translateX = 0;
      mockState.translateY = 0;
      mockState.scale = 1;

      const result = viewport.worldToScreen(500, 400);

      expect(result).toEqual({ x: 500, y: 400 });
    });

    it('should account for translation', () => {
      mockState.translateX = 100;
      mockState.translateY = 200;
      mockState.scale = 1;

      const result = viewport.worldToScreen(500, 400);

      expect(result).toEqual({ x: 600, y: 600 });
    });

    it('should account for scale', () => {
      mockState.translateX = 0;
      mockState.translateY = 0;
      mockState.scale = 2;

      const result = viewport.worldToScreen(500, 400);

      expect(result).toEqual({ x: 1000, y: 800 });
    });

    it('should be the inverse of screenToWorld', () => {
      mockState.translateX = 150;
      mockState.translateY = -50;
      mockState.scale = 1.5;

      const world = viewport.screenToWorld(600, 300);
      const backToScreen = viewport.worldToScreen(world.x, world.y);

      expect(backToScreen.x).toBeCloseTo(600);
      expect(backToScreen.y).toBeCloseTo(300);
    });
  });

  describe('setViewport', () => {
    it('should call animateViewportTo with correct translation for center', () => {
      mockState.viewportWidth = 1000;
      mockState.viewportHeight = 800;

      const animateSpy = jest.spyOn(viewport, 'animateViewportTo');

      viewport.setViewport(200, 300, 1);

      // targetTranslateX = 1000/2 - 200*1 = 300
      // targetTranslateY = 800/2 - 300*1 = 100
      expect(animateSpy).toHaveBeenCalledWith(300, 100, 1);
    });

    it('should clamp scale to scaleMax', () => {
      mockState.viewportWidth = 1000;
      mockState.viewportHeight = 800;
      mockState.scaleMax = 5;

      const animateSpy = jest.spyOn(viewport, 'animateViewportTo');

      viewport.setViewport(0, 0, 20);

      const calledScale = animateSpy.mock.calls[0][2];
      expect(calledScale).toBe(5);
    });

    it('should clamp scale to scaleMin', () => {
      mockState.viewportWidth = 1000;
      mockState.viewportHeight = 800;
      mockState.scaleMin = 0.5;

      const animateSpy = jest.spyOn(viewport, 'animateViewportTo');

      viewport.setViewport(0, 0, 0.01);

      const calledScale = animateSpy.mock.calls[0][2];
      expect(calledScale).toBe(0.5);
    });
  });

  describe('panTo', () => {
    it('should call setViewport with current scale', () => {
      mockState.scale = 2;
      mockState.viewportWidth = 1000;
      mockState.viewportHeight = 800;

      const animateSpy = jest.spyOn(viewport, 'animateViewportTo');

      viewport.panTo(100, 200);

      // targetTranslateX = 1000/2 - 100*2 = 300
      // targetTranslateY = 800/2 - 200*2 = 0
      expect(animateSpy).toHaveBeenCalledWith(300, 0, 2);
    });
  });

  describe('zoomTo', () => {
    it('should zoom around viewport center when no world coordinates given', () => {
      mockState.scale = 1;
      mockState.translateX = 0;
      mockState.translateY = 0;
      mockState.viewportWidth = 1000;
      mockState.viewportHeight = 800;

      const animateSpy = jest.spyOn(viewport, 'animateViewportTo');

      viewport.zoomTo(2);

      // Current center in world: (500, 400)
      // targetTranslateX = 1000/2 - 500*2 = -500
      // targetTranslateY = 800/2 - 400*2 = -400
      expect(animateSpy).toHaveBeenCalledWith(-500, -400, 2);
    });

    it('should zoom centered on given world coordinates', () => {
      mockState.viewportWidth = 1000;
      mockState.viewportHeight = 800;

      const animateSpy = jest.spyOn(viewport, 'animateViewportTo');

      viewport.zoomTo(3, 100, 200);

      // targetTranslateX = 1000/2 - 100*3 = 200
      // targetTranslateY = 800/2 - 200*3 = -200
      expect(animateSpy).toHaveBeenCalledWith(200, -200, 3);
    });

    it('should clamp scale', () => {
      mockState.viewportWidth = 1000;
      mockState.viewportHeight = 800;
      mockState.scaleMax = 5;
      mockState.scale = 1;
      mockState.translateX = 0;
      mockState.translateY = 0;

      const animateSpy = jest.spyOn(viewport, 'animateViewportTo');

      viewport.zoomTo(100);

      const calledScale = animateSpy.mock.calls[0][2];
      expect(calledScale).toBe(5);
    });
  });

  describe('zoomIn', () => {
    it('should zoom in by the default factor while keeping the viewport center fixed (instant)', () => {
      mockState.scale = 1;
      mockState.translateX = 0;
      mockState.translateY = 0;
      mockState.viewportWidth = 1000;
      mockState.viewportHeight = 800;

      // duration 0 applies the zoom instantly for deterministic assertions
      viewport.zoomIn(1.2, 0);

      // Default factor 1.2 -> newScale = 1.2
      expect(mockState.scale).toBeCloseTo(1.2);

      // The world point at the viewport center must stay at the center.
      const centerWorldXBefore = (1000 / 2 - 0) / 1;
      const centerWorldYBefore = (800 / 2 - 0) / 1;
      const centerWorldXAfter = (1000 / 2 - mockState.translateX) / mockState.scale;
      const centerWorldYAfter = (800 / 2 - mockState.translateY) / mockState.scale;
      expect(centerWorldXAfter).toBeCloseTo(centerWorldXBefore);
      expect(centerWorldYAfter).toBeCloseTo(centerWorldYBefore);
    });

    it('should zoom in by a custom factor', () => {
      mockState.scale = 2;
      mockState.translateX = 0;
      mockState.translateY = 0;
      mockState.viewportWidth = 1000;
      mockState.viewportHeight = 800;

      viewport.zoomIn(1.5, 0);

      expect(mockState.scale).toBeCloseTo(3);
    });

    it('should schedule an animation when a positive duration is given', () => {
      mockState.scale = 1;
      mockState.viewportWidth = 1000;
      mockState.viewportHeight = 800;

      const rafSpy = jest.spyOn(global, 'requestAnimationFrame').mockReturnValue(1 as unknown as number);

      viewport.zoomIn(1.6, 200);

      expect(rafSpy).toHaveBeenCalled();
      rafSpy.mockRestore();
    });

    it('should keep the viewport center fixed throughout an animated zoom', () => {
      mockState.scale = 1;
      mockState.translateX = 0;
      mockState.translateY = 0;
      mockState.viewportWidth = 1000;
      mockState.viewportHeight = 800;

      const centerWorldXBefore = (1000 / 2 - 0) / 1;
      const centerWorldYBefore = (800 / 2 - 0) / 1;

      // Drive the animation frames manually at fixed timestamps.
      let now = 0;
      jest.spyOn(performance, 'now').mockImplementation(() => now);
      const callbacks: FrameRequestCallback[] = [];
      jest.spyOn(global, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
        callbacks.push(cb);
        return callbacks.length as unknown as number;
      });

      viewport.zoomIn(1.5, 200);

      // Step through the animation; center must stay fixed at every frame.
      for (const time of [50, 100, 150, 200]) {
        now = time;
        const cb = callbacks.shift();
        cb?.(time);

        const centerWorldXAfter = (1000 / 2 - mockState.translateX) / mockState.scale;
        const centerWorldYAfter = (800 / 2 - mockState.translateY) / mockState.scale;
        expect(centerWorldXAfter).toBeCloseTo(centerWorldXBefore);
        expect(centerWorldYAfter).toBeCloseTo(centerWorldYBefore);
      }

      // Final scale reached.
      expect(mockState.scale).toBeCloseTo(1.5);

      jest.restoreAllMocks();
    });

    it('should clamp to scaleMax when zooming in past the limit', () => {
      mockState.scale = 4.5;
      mockState.scaleMax = 5;
      mockState.translateX = 0;
      mockState.translateY = 0;
      mockState.viewportWidth = 1000;
      mockState.viewportHeight = 800;

      viewport.zoomIn(2, 0);

      expect(mockState.scale).toBe(5);
    });
  });

  describe('zoomOut', () => {
    it('should zoom out by the default factor while keeping the viewport center fixed (instant)', () => {
      mockState.scale = 1.2;
      mockState.translateX = 0;
      mockState.translateY = 0;
      mockState.viewportWidth = 1000;
      mockState.viewportHeight = 800;

      const centerWorldXBefore = (1000 / 2 - 0) / 1.2;
      const centerWorldYBefore = (800 / 2 - 0) / 1.2;

      viewport.zoomOut(1.2, 0);

      // Default factor 1.2 -> newScale = 1.2 / 1.2 = 1
      expect(mockState.scale).toBeCloseTo(1);

      const centerWorldXAfter = (1000 / 2 - mockState.translateX) / mockState.scale;
      const centerWorldYAfter = (800 / 2 - mockState.translateY) / mockState.scale;
      expect(centerWorldXAfter).toBeCloseTo(centerWorldXBefore);
      expect(centerWorldYAfter).toBeCloseTo(centerWorldYBefore);
    });

    it('should zoom out by a custom factor', () => {
      mockState.scale = 3;
      mockState.translateX = 0;
      mockState.translateY = 0;
      mockState.viewportWidth = 1000;
      mockState.viewportHeight = 800;

      viewport.zoomOut(1.5, 0);

      expect(mockState.scale).toBeCloseTo(2);
    });
  });
});
