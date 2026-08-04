import { KritzelResizeHandler } from './resize.handler';
import { KritzelCore } from '../core/core.class';
import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelHandleType } from '../../enums/handle-type.enum';

jest.mock('../../helpers/event.helper');

describe('KritzelResizeHandler', () => {
  let resizeHandler: KritzelResizeHandler;
  let mockCore: jest.Mocked<KritzelCore>;
  let mockSelectionGroup: {
    width: number;
    height: number;
    translateX: number;
    translateY: number;
    rotation: number;
    scale: number;
    hasExternalAnchoredLineConnections?: jest.Mock;
    resize: jest.Mock;
    update: jest.Mock;
    beginTransform: jest.Mock;
  } | null;
  let mockState: {
    isResizing: boolean;
    isResizeHandleSelected: boolean;
    resizeHandleType: KritzelHandleType | null;
    scale: number;
    pointers: Map<number, { clientX: number; clientY: number }>;
    longTouchTimeout: ReturnType<typeof setTimeout> | undefined;
    hasObjectsChanged: boolean;
  };

  const createPointerEvent = (
    type: string,
    options: {
      pointerType?: string;
      pointerId?: number;
      clientX?: number;
      clientY?: number;
      button?: number;
    } = {}
  ): PointerEvent => {
    return {
      pointerType: options.pointerType ?? 'mouse',
      pointerId: options.pointerId ?? 1,
      clientX: options.clientX ?? 0,
      clientY: options.clientY ?? 0,
      button: options.button ?? 0,
      type,
    } as PointerEvent;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (KritzelEventHelper.isLeftClick as jest.Mock).mockReturnValue(true);

    mockSelectionGroup = null;
    mockState = {
      isResizing: false,
      isResizeHandleSelected: false,
      resizeHandleType: null,
      scale: 1,
      pointers: new Map(),
      longTouchTimeout: undefined,
      hasObjectsChanged: false,
    };

    mockCore = {
      store: {
        get state() {
          return mockState;
        },
        get selectionGroup() {
          return mockSelectionGroup;
        },
        offsetX: 0,
        offsetY: 0,
        objects: {
          stopUndoCapturing: jest.fn(),
        },
      },
      engine: {
        emitObjectsChange: jest.fn(),
        emitObjectsAdded: jest.fn(),
        emitObjectsRemoved: jest.fn(),
        emitObjectsUpdated: jest.fn(),
      },
    } as unknown as jest.Mocked<KritzelCore>;

    resizeHandler = new KritzelResizeHandler(mockCore);
  });

  describe('handlePointerDown', () => {
    describe('mouse events', () => {
      it('should start resize on left click with selection and resize handle selected', () => {
        mockSelectionGroup = {
          width: 100,
          height: 50,
          translateX: 10,
          translateY: 20,
          rotation: 0,
          scale: 1,
          hasExternalAnchoredLineConnections: jest.fn().mockReturnValue(false),
          resize: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isResizeHandleSelected = true;
        const event = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 150,
          clientY: 200,
        });

        resizeHandler.handlePointerDown(event);

        expect(mockState.isResizing).toBe(true);
        expect(resizeHandler.initialMouseX).toBe(150);
        expect(resizeHandler.initialMouseY).toBe(200);
        expect(resizeHandler.initialSize.width).toBe(100);
        expect(resizeHandler.initialSize.height).toBe(50);
        expect(resizeHandler.initialSize.x).toBe(10);
        expect(resizeHandler.initialSize.y).toBe(20);
      });

      it('should not start resize on non-left click', () => {
        (KritzelEventHelper.isLeftClick as jest.Mock).mockReturnValue(false);
        mockSelectionGroup = {
          width: 100,
          height: 50,
          translateX: 10,
          translateY: 20,
          rotation: 0,
          scale: 1,
          hasExternalAnchoredLineConnections: jest.fn().mockReturnValue(false),
          resize: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isResizeHandleSelected = true;
        const event = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          button: 2,
        });

        resizeHandler.handlePointerDown(event);

        expect(mockState.isResizing).toBe(false);
      });

      it('should not start resize without selection group', () => {
        mockSelectionGroup = null;
        mockState.isResizeHandleSelected = true;
        const event = createPointerEvent('pointerdown', { pointerType: 'mouse' });

        resizeHandler.handlePointerDown(event);

        expect(mockState.isResizing).toBe(false);
      });

      it('should not start resize when resize handle is not selected', () => {
        mockSelectionGroup = {
          width: 100,
          height: 50,
          translateX: 10,
          translateY: 20,
          rotation: 0,
          scale: 1,
          hasExternalAnchoredLineConnections: jest.fn().mockReturnValue(false),
          resize: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isResizeHandleSelected = false;
        const event = createPointerEvent('pointerdown', { pointerType: 'mouse' });

        resizeHandler.handlePointerDown(event);

        expect(mockState.isResizing).toBe(false);
      });

      it('should apply offset when calculating initial mouse position', () => {
        (mockCore.store as any).offsetX = 10;
        (mockCore.store as any).offsetY = 20;
        mockSelectionGroup = {
          width: 100,
          height: 50,
          translateX: 0,
          translateY: 0,
          rotation: 0,
          scale: 1,
          hasExternalAnchoredLineConnections: jest.fn().mockReturnValue(false),
          resize: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isResizeHandleSelected = true;
        const event = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 150,
        });

        resizeHandler.handlePointerDown(event);

        expect(resizeHandler.initialMouseX).toBe(90);
        expect(resizeHandler.initialMouseY).toBe(130);
      });
    });

    describe('touch events', () => {
      it('should start resize on single touch with selection and resize handle selected', () => {
        mockSelectionGroup = {
          width: 200,
          height: 100,
          translateX: 50,
          translateY: 60,
          rotation: 0,
          scale: 1,
          hasExternalAnchoredLineConnections: jest.fn().mockReturnValue(false),
          resize: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isResizeHandleSelected = true;
        mockState.pointers.set(1, { clientX: 150, clientY: 200 });
        const event = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });

        resizeHandler.handlePointerDown(event);

        expect(mockState.isResizing).toBe(true);
        expect(resizeHandler.initialMouseX).toBe(150);
        expect(resizeHandler.initialMouseY).toBe(200);
        expect(resizeHandler.initialSize.width).toBe(200);
        expect(resizeHandler.initialSize.height).toBe(100);
      });

      it('should clear long touch timeout on touch resize start', () => {
        jest.useFakeTimers();
        mockState.longTouchTimeout = setTimeout(() => { }, 1000);
        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

        mockSelectionGroup = {
          width: 100,
          height: 50,
          translateX: 0,
          translateY: 0,
          rotation: 0,
          scale: 1,
          hasExternalAnchoredLineConnections: jest.fn().mockReturnValue(false),
          resize: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isResizeHandleSelected = true;
        mockState.pointers.set(1, { clientX: 100, clientY: 100 });
        const event = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });

        resizeHandler.handlePointerDown(event);

        expect(clearTimeoutSpy).toHaveBeenCalled();
        jest.useRealTimers();
      });

      it('should not start resize when no pointers', () => {
        mockSelectionGroup = {
          width: 100,
          height: 50,
          translateX: 0,
          translateY: 0,
          rotation: 0,
          scale: 1,
          hasExternalAnchoredLineConnections: jest.fn().mockReturnValue(false),
          resize: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isResizeHandleSelected = true;
        // No pointers in map
        const event = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });

        resizeHandler.handlePointerDown(event);

        expect(mockState.isResizing).toBe(false);
      });

      it('should not start resize with multiple pointers', () => {
        mockSelectionGroup = {
          width: 100,
          height: 50,
          translateX: 0,
          translateY: 0,
          rotation: 0,
          scale: 1,
          hasExternalAnchoredLineConnections: jest.fn().mockReturnValue(false),
          resize: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isResizeHandleSelected = true;
        mockState.pointers.set(1, { clientX: 100, clientY: 100 });
        mockState.pointers.set(2, { clientX: 200, clientY: 200 });
        const event = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });

        resizeHandler.handlePointerDown(event);

        expect(mockState.isResizing).toBe(false);
      });
    });

    describe('pen events', () => {
      it('should start resize on single pen input with selection and resize handle selected', () => {
        mockSelectionGroup = {
          width: 150,
          height: 75,
          translateX: 30,
          translateY: 40,
          rotation: 0,
          scale: 1,
          resize: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isResizeHandleSelected = true;
        mockState.pointers.set(1, { clientX: 200, clientY: 250 });
        const event = createPointerEvent('pointerdown', {
          pointerType: 'pen',
          pointerId: 1,
        });

        resizeHandler.handlePointerDown(event);

        expect(mockState.isResizing).toBe(true);
        expect(resizeHandler.initialMouseX).toBe(200);
        expect(resizeHandler.initialMouseY).toBe(250);
      });
    });
  });

  describe('handlePointerMove', () => {
    describe('mouse events', () => {
      beforeEach(() => {
        mockSelectionGroup = {
          width: 100,
          height: 100,
          translateX: 0,
          translateY: 0,
          rotation: 0,
          scale: 1,
          hasExternalAnchoredLineConnections: jest.fn().mockReturnValue(false),
          resize: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isResizeHandleSelected = true;
      });

      it('should not resize if not in resizing state', () => {
        mockState.isResizing = false;
        const event = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 150,
          clientY: 150,
        });

        resizeHandler.handlePointerMove(event);

        expect(mockSelectionGroup!.resize).not.toHaveBeenCalled();
      });

      it('should not resize below threshold', () => {
        // Start resize
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 100,
        });
        resizeHandler.handlePointerDown(downEvent);

        // Move below threshold
        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 102,
          clientY: 102,
        });
        resizeHandler.handlePointerMove(moveEvent);

        expect(mockSelectionGroup!.resize).not.toHaveBeenCalled();
        expect(resizeHandler.hasResized).toBe(false);
      });

      it('should resize when above threshold', () => {
        mockState.resizeHandleType = KritzelHandleType.BottomRight;

        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 100,
        });
        resizeHandler.handlePointerDown(downEvent);

        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 120,
          clientY: 120,
        });
        resizeHandler.handlePointerMove(moveEvent);

        expect(mockSelectionGroup!.resize).toHaveBeenCalled();
        expect(resizeHandler.hasResized).toBe(true);
      });

      describe('handle types', () => {
        beforeEach(() => {
          // Start resize at 100,100 with initial size 100x100 at position 0,0
          const downEvent = createPointerEvent('pointerdown', {
            pointerType: 'mouse',
            clientX: 100,
            clientY: 100,
          });
          resizeHandler.handlePointerDown(downEvent);
        });

        it('should resize correctly with BottomRight handle', () => {
          mockState.resizeHandleType = KritzelHandleType.BottomRight;

          const moveEvent = createPointerEvent('pointermove', {
            pointerType: 'mouse',
            clientX: 120,
            clientY: 130,
          });
          resizeHandler.handlePointerMove(moveEvent);

          // BottomRight: width += dx, height += dy
          expect(resizeHandler.newSize.width).toBe(120); // 100 + 20
          expect(resizeHandler.newSize.height).toBe(130); // 100 + 30
        });

        it('should resize correctly with TopLeft handle', () => {
          mockState.resizeHandleType = KritzelHandleType.TopLeft;

          const moveEvent = createPointerEvent('pointermove', {
            pointerType: 'mouse',
            clientX: 120,
            clientY: 130,
          });
          resizeHandler.handlePointerMove(moveEvent);

          // TopLeft: width -= dx, height -= dy
          expect(resizeHandler.newSize.width).toBe(80); // 100 - 20
          expect(resizeHandler.newSize.height).toBe(70); // 100 - 30
        });

        it('should resize correctly with TopRight handle', () => {
          mockState.resizeHandleType = KritzelHandleType.TopRight;

          const moveEvent = createPointerEvent('pointermove', {
            pointerType: 'mouse',
            clientX: 120,
            clientY: 130,
          });
          resizeHandler.handlePointerMove(moveEvent);

          // TopRight: width += dx, height -= dy
          expect(resizeHandler.newSize.width).toBe(120); // 100 + 20
          expect(resizeHandler.newSize.height).toBe(70); // 100 - 30
        });

        it('should resize correctly with BottomLeft handle', () => {
          mockState.resizeHandleType = KritzelHandleType.BottomLeft;

          const moveEvent = createPointerEvent('pointermove', {
            pointerType: 'mouse',
            clientX: 120,
            clientY: 130,
          });
          resizeHandler.handlePointerMove(moveEvent);

          // BottomLeft: width -= dx, height += dy
          expect(resizeHandler.newSize.width).toBe(80); // 100 - 20
          expect(resizeHandler.newSize.height).toBe(130); // 100 + 30
        });
      });

      it('should consider current scale when calculating resize', () => {
        mockState.resizeHandleType = KritzelHandleType.BottomRight;
        mockState.scale = 2;

        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 100,
        });
        resizeHandler.handlePointerDown(downEvent);

        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 120,
          clientY: 120,
        });
        resizeHandler.handlePointerMove(moveEvent);

        // With scale 2, the local delta is halved
        expect(resizeHandler.newSize.width).toBe(110); // 100 + 20/2
        expect(resizeHandler.newSize.height).toBe(110); // 100 + 20/2
      });

      it('should handle rotated selection group', () => {
        mockSelectionGroup!.rotation = Math.PI / 2; // 90 degrees
        mockState.resizeHandleType = KritzelHandleType.BottomRight;

        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 100,
        });
        resizeHandler.handlePointerDown(downEvent);

        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 120,
          clientY: 100,
        });
        resizeHandler.handlePointerMove(moveEvent);

        // With 90 degree rotation, horizontal movement becomes vertical in local space
        expect(mockSelectionGroup!.resize).toHaveBeenCalled();
      });

      it('should rebase resize baseline when external anchored lines reshape the group', () => {
        mockState.resizeHandleType = KritzelHandleType.BottomRight;
        mockSelectionGroup!.hasExternalAnchoredLineConnections = jest.fn().mockReturnValue(true);

        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 100,
        });
        resizeHandler.handlePointerDown(downEvent);

        const moveEvent1 = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 120,
          clientY: 120,
        });
        resizeHandler.handlePointerMove(moveEvent1);

        // Simulate anchor-constrained line geometry expanding the selection bounds.
        mockSelectionGroup!.width = 140;
        mockSelectionGroup!.height = 140;
        mockSelectionGroup!.translateX = -10;
        mockSelectionGroup!.translateY = -10;

        const moveEvent2 = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 130,
          clientY: 130,
        });
        resizeHandler.handlePointerMove(moveEvent2);

        expect(mockSelectionGroup!.resize).toHaveBeenNthCalledWith(2, expect.any(Number), expect.any(Number), 110, 110);
      });
    });

    describe('touch events', () => {
      beforeEach(() => {
        mockSelectionGroup = {
          width: 100,
          height: 100,
          translateX: 0,
          translateY: 0,
          rotation: 0,
          scale: 1,
          hasExternalAnchoredLineConnections: jest.fn().mockReturnValue(false),
          resize: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isResizeHandleSelected = true;
      });

      it('should resize on touch move above threshold', () => {
        mockState.resizeHandleType = KritzelHandleType.BottomRight;
        mockState.pointers.set(1, { clientX: 100, clientY: 100 });
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });
        resizeHandler.handlePointerDown(downEvent);

        mockState.pointers.set(1, { clientX: 150, clientY: 150 });
        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'touch',
          pointerId: 1,
        });
        resizeHandler.handlePointerMove(moveEvent);

        expect(mockSelectionGroup!.resize).toHaveBeenCalled();
        expect(resizeHandler.hasResized).toBe(true);
      });

      it('should clear long touch timeout on touch resize', () => {
        jest.useFakeTimers();
        mockState.longTouchTimeout = setTimeout(() => { }, 1000);
        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

        mockState.resizeHandleType = KritzelHandleType.BottomRight;
        mockState.pointers.set(1, { clientX: 100, clientY: 100 });
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });
        resizeHandler.handlePointerDown(downEvent);

        mockState.pointers.set(1, { clientX: 150, clientY: 150 });
        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'touch',
          pointerId: 1,
        });
        resizeHandler.handlePointerMove(moveEvent);

        expect(clearTimeoutSpy).toHaveBeenCalled();
        jest.useRealTimers();
      });

      it('should not resize when no pointers during move', () => {
        mockState.isResizing = true;
        // No pointers set
        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'touch',
          pointerId: 1,
        });

        resizeHandler.handlePointerMove(moveEvent);

        expect(mockSelectionGroup!.resize).not.toHaveBeenCalled();
      });
    });
  });

  describe('handlePointerUp', () => {
    describe('mouse events', () => {
      beforeEach(() => {
        mockSelectionGroup = {
          width: 100,
          height: 100,
          translateX: 0,
          translateY: 0,
          rotation: 0,
          scale: 1,
          hasExternalAnchoredLineConnections: jest.fn().mockReturnValue(false),
          resize: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isResizeHandleSelected = true;
      });

      it('should end resize and reset state', () => {
        mockState.resizeHandleType = KritzelHandleType.BottomRight;

        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 100,
        });
        resizeHandler.handlePointerDown(downEvent);

        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'mouse',
        });
        resizeHandler.handlePointerUp(upEvent);

        expect(mockState.isResizing).toBe(false);
        expect(resizeHandler.initialMouseX).toBe(0);
        expect(resizeHandler.initialMouseY).toBe(0);
        expect(resizeHandler.hasResized).toBe(false);
      });

      it('should update selection and emit changes when resized', () => {
        mockState.resizeHandleType = KritzelHandleType.BottomRight;

        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 100,
        });
        resizeHandler.handlePointerDown(downEvent);

        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 150,
          clientY: 150,
        });
        resizeHandler.handlePointerMove(moveEvent);

        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'mouse',
        });
        resizeHandler.handlePointerUp(upEvent);

        expect(mockSelectionGroup!.update).toHaveBeenCalled();
        expect(mockCore.engine.emitObjectsChange).toHaveBeenCalled();
        expect(mockState.hasObjectsChanged).toBe(true);
      });

      it('should not update selection or emit changes when not resized', () => {
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 100,
        });
        resizeHandler.handlePointerDown(downEvent);

        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'mouse',
        });
        resizeHandler.handlePointerUp(upEvent);

        expect(mockSelectionGroup!.update).not.toHaveBeenCalled();
        expect(mockCore.engine.emitObjectsChange).not.toHaveBeenCalled();
      });

      it('should do nothing if not resizing', () => {
        mockState.isResizing = false;
        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'mouse',
        });

        resizeHandler.handlePointerUp(upEvent);

        expect(mockSelectionGroup!.update).not.toHaveBeenCalled();
      });
    });

    describe('touch events', () => {
      beforeEach(() => {
        mockSelectionGroup = {
          width: 100,
          height: 100,
          translateX: 0,
          translateY: 0,
          rotation: 0,
          scale: 1,
          hasExternalAnchoredLineConnections: jest.fn().mockReturnValue(false),
          resize: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isResizeHandleSelected = true;
      });

      it('should end resize on touch up', () => {
        mockState.resizeHandleType = KritzelHandleType.BottomRight;
        mockState.pointers.set(1, { clientX: 100, clientY: 100 });
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });
        resizeHandler.handlePointerDown(downEvent);

        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'touch',
          pointerId: 1,
        });
        resizeHandler.handlePointerUp(upEvent);

        expect(mockState.isResizing).toBe(false);
      });

      it('should update selection and emit changes when resized with touch', () => {
        mockState.resizeHandleType = KritzelHandleType.BottomRight;
        mockState.pointers.set(1, { clientX: 100, clientY: 100 });
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });
        resizeHandler.handlePointerDown(downEvent);

        mockState.pointers.set(1, { clientX: 150, clientY: 150 });
        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'touch',
          pointerId: 1,
        });
        resizeHandler.handlePointerMove(moveEvent);

        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'touch',
          pointerId: 1,
        });
        resizeHandler.handlePointerUp(upEvent);

        expect(mockSelectionGroup!.update).toHaveBeenCalled();
        expect(mockCore.engine.emitObjectsChange).toHaveBeenCalled();
        expect(mockState.hasObjectsChanged).toBe(true);
      });

      it('should clear long touch timeout on touch up', () => {
        jest.useFakeTimers();
        mockState.longTouchTimeout = setTimeout(() => { }, 1000);
        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

        mockState.resizeHandleType = KritzelHandleType.BottomRight;
        mockState.pointers.set(1, { clientX: 100, clientY: 100 });
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });
        resizeHandler.handlePointerDown(downEvent);

        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'touch',
          pointerId: 1,
        });
        resizeHandler.handlePointerUp(upEvent);

        expect(clearTimeoutSpy).toHaveBeenCalled();
        jest.useRealTimers();
      });
    });

    describe('pen events', () => {
      it('should end resize on pen up', () => {
        mockSelectionGroup = {
          width: 100,
          height: 100,
          translateX: 0,
          translateY: 0,
          rotation: 0,
          scale: 1,
          resize: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isResizeHandleSelected = true;
        mockState.resizeHandleType = KritzelHandleType.BottomRight;
        mockState.pointers.set(1, { clientX: 100, clientY: 100 });

        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'pen',
          pointerId: 1,
        });
        resizeHandler.handlePointerDown(downEvent);

        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'pen',
          pointerId: 1,
        });
        resizeHandler.handlePointerUp(upEvent);

        expect(mockState.isResizing).toBe(false);
      });
    });
  });

  describe('continuous resize operations', () => {
    beforeEach(() => {
      mockSelectionGroup = {
        width: 100,
        height: 100,
        translateX: 0,
        translateY: 0,
        rotation: 0,
        scale: 1,
        hasExternalAnchoredLineConnections: jest.fn().mockReturnValue(false),
        resize: jest.fn(),
        update: jest.fn(),
        beginTransform: jest.fn(),
      };
      mockState.isResizeHandleSelected = true;
      mockState.resizeHandleType = KritzelHandleType.BottomRight;
    });

    it('should continue resizing after initial threshold is met', () => {
      const downEvent = createPointerEvent('pointerdown', {
        pointerType: 'mouse',
        clientX: 100,
        clientY: 100,
      });
      resizeHandler.handlePointerDown(downEvent);

      // First move above threshold
      const moveEvent1 = createPointerEvent('pointermove', {
        pointerType: 'mouse',
        clientX: 120,
        clientY: 120,
      });
      resizeHandler.handlePointerMove(moveEvent1);
      expect(resizeHandler.hasResized).toBe(true);

      // Second move with small delta
      const moveEvent2 = createPointerEvent('pointermove', {
        pointerType: 'mouse',
        clientX: 121,
        clientY: 121,
      });
      resizeHandler.handlePointerMove(moveEvent2);

      expect(mockSelectionGroup!.resize).toHaveBeenCalledTimes(2);
    });
  });
});

