import { KritzelMoveHandler } from './move.handler';
import { KritzelCore } from '../core/core.class';
import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelLine } from '../objects/line.class';

jest.mock('../../helpers/event.helper');

describe('KritzelMoveHandler', () => {
  let moveHandler: KritzelMoveHandler;
  let mockCore: jest.Mocked<KritzelCore>;
  let mockSelectionGroup: {
    isSelected: boolean;
    objects: unknown[];
    move: jest.Mock;
    update: jest.Mock;
    persistChildren?: jest.Mock;
    refreshObjectDimensions?: jest.Mock;
  } | null;
  let mockState: {
    isDragging: boolean;
    isResizeHandleSelected: boolean;
    isRotationHandleSelected: boolean;
    isLineHandleSelected: boolean;
    isScaling: boolean;
    pointers: Map<number, { clientX: number; clientY: number }>;
    longTouchTimeout: ReturnType<typeof setTimeout> | undefined;
    hasObjectsChanged: boolean;
    objects: { update: jest.Mock; stopUndoCapturing: jest.Mock };
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
      isDragging: false,
      isResizeHandleSelected: false,
      isRotationHandleSelected: false,
      isLineHandleSelected: false,
      isScaling: false,
      pointers: new Map(),
      longTouchTimeout: undefined,
      hasObjectsChanged: false,
      objects: { update: jest.fn(), stopUndoCapturing: jest.fn() },
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
        objects: mockState.objects,
      },
      engine: {
        emitObjectsChange: jest.fn(),
        emitObjectsAdded: jest.fn(),
        emitObjectsRemoved: jest.fn(),
        emitObjectsUpdated: jest.fn(),
      },
      anchorManager: {
        removeAnchor: jest.fn(),
      },
    } as unknown as jest.Mocked<KritzelCore>;

    moveHandler = new KritzelMoveHandler(mockCore);
  });

  describe('cancelPendingDrag', () => {
    it('should set isDragging to false and reset handler state', () => {
      mockState.isDragging = true;
      moveHandler.hasMoved = true;
      moveHandler.dragStartX = 100;
      moveHandler.dragStartY = 200;

      moveHandler.cancelPendingDrag();

      expect(mockState.isDragging).toBe(false);
      expect(moveHandler.hasMoved).toBe(false);
      expect(moveHandler.dragStartX).toBe(0);
      expect(moveHandler.dragStartY).toBe(0);
    });
  });

  describe('handlePointerDown', () => {
    describe('mouse events', () => {
      it('should start drag on left click with selected selection group', () => {
        mockSelectionGroup = {
          isSelected: true,
          objects: [],
          move: jest.fn(),
          update: jest.fn(),
        };
        const event = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          pointerId: 1,
          clientX: 100,
          clientY: 150,
        });

        moveHandler.handlePointerDown(event);

        expect(mockState.isDragging).toBe(true);
        expect(moveHandler.dragStartX).toBe(100);
        expect(moveHandler.dragStartY).toBe(150);
        expect(moveHandler.startX).toBe(100);
        expect(moveHandler.startY).toBe(150);
      });

      it('should not start drag on non-left click', () => {
        (KritzelEventHelper.isLeftClick as jest.Mock).mockReturnValue(false);
        mockSelectionGroup = {
          isSelected: true,
          objects: [],
          move: jest.fn(),
          update: jest.fn(),
        };
        const event = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          button: 2,
        });

        moveHandler.handlePointerDown(event);

        expect(mockState.isDragging).toBe(false);
      });

      it('should not start drag without selection group', () => {
        mockSelectionGroup = null;
        const event = createPointerEvent('pointerdown', { pointerType: 'mouse' });

        moveHandler.handlePointerDown(event);

        expect(mockState.isDragging).toBe(false);
      });

      it('should not start drag when selection group is not selected', () => {
        mockSelectionGroup = {
          isSelected: false,
          objects: [],
          move: jest.fn(),
          update: jest.fn(),
        };
        const event = createPointerEvent('pointerdown', { pointerType: 'mouse' });

        moveHandler.handlePointerDown(event);

        expect(mockState.isDragging).toBe(false);
      });

      it('should not start drag when resize handle is selected', () => {
        mockState.isResizeHandleSelected = true;
        mockSelectionGroup = {
          isSelected: true,
          objects: [],
          move: jest.fn(),
          update: jest.fn(),
        };
        const event = createPointerEvent('pointerdown', { pointerType: 'mouse' });

        moveHandler.handlePointerDown(event);

        expect(mockState.isDragging).toBe(false);
      });

      it('should not start drag when rotation handle is selected', () => {
        mockState.isRotationHandleSelected = true;
        mockSelectionGroup = {
          isSelected: true,
          objects: [],
          move: jest.fn(),
          update: jest.fn(),
        };
        const event = createPointerEvent('pointerdown', { pointerType: 'mouse' });

        moveHandler.handlePointerDown(event);

        expect(mockState.isDragging).toBe(false);
      });

      it('should not start drag when line handle is selected', () => {
        mockState.isLineHandleSelected = true;
        mockSelectionGroup = {
          isSelected: true,
          objects: [],
          move: jest.fn(),
          update: jest.fn(),
        };
        const event = createPointerEvent('pointerdown', { pointerType: 'mouse' });

        moveHandler.handlePointerDown(event);

        expect(mockState.isDragging).toBe(false);
      });

      it('should apply offset when calculating drag start position', () => {
        (mockCore.store as any).offsetX = 10;
        (mockCore.store as any).offsetY = 20;
        mockSelectionGroup = {
          isSelected: true,
          objects: [],
          move: jest.fn(),
          update: jest.fn(),
        };
        const event = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 150,
        });

        moveHandler.handlePointerDown(event);

        expect(moveHandler.dragStartX).toBe(90);
        expect(moveHandler.dragStartY).toBe(130);
      });
    });

    describe('touch events', () => {
      it('should start drag on single touch with selected selection group', () => {
        mockSelectionGroup = {
          isSelected: true,
          objects: [],
          move: jest.fn(),
          update: jest.fn(),
        };
        mockState.pointers.set(1, { clientX: 100, clientY: 150 });
        const event = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });

        moveHandler.handlePointerDown(event);

        expect(moveHandler.dragStartX).toBe(100);
        expect(moveHandler.dragStartY).toBe(150);
      });

      it('should not start drag when scaling', () => {
        mockState.isScaling = true;
        mockState.pointers.set(1, { clientX: 100, clientY: 150 });
        mockSelectionGroup = {
          isSelected: true,
          objects: [],
          move: jest.fn(),
          update: jest.fn(),
        };
        const initialDragStartX = moveHandler.dragStartX;
        const event = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });

        moveHandler.handlePointerDown(event);

        expect(moveHandler.dragStartX).toBe(initialDragStartX);
      });

      it('should not start drag without selection on touch', () => {
        mockState.pointers.set(1, { clientX: 100, clientY: 150 });
        mockSelectionGroup = null;
        const initialDragStartX = moveHandler.dragStartX;
        const event = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });

        moveHandler.handlePointerDown(event);

        expect(moveHandler.dragStartX).toBe(initialDragStartX);
      });
    });

    describe('pen events', () => {
      it('should start drag on single pen input with selected selection group', () => {
        mockSelectionGroup = {
          isSelected: true,
          objects: [],
          move: jest.fn(),
          update: jest.fn(),
        };
        mockState.pointers.set(1, { clientX: 200, clientY: 250 });
        const event = createPointerEvent('pointerdown', {
          pointerType: 'pen',
          pointerId: 1,
        });

        moveHandler.handlePointerDown(event);

        expect(moveHandler.dragStartX).toBe(200);
        expect(moveHandler.dragStartY).toBe(250);
      });
    });
  });

  describe('handlePointerMove', () => {
    describe('mouse events', () => {
      beforeEach(() => {
        mockSelectionGroup = {
          isSelected: true,
          objects: [],
          move: jest.fn(),
          update: jest.fn(),
          persistChildren: jest.fn(),
          refreshObjectDimensions: jest.fn(),
        };
      });

      it('should not move if trackedPointerId is null', () => {
        mockState.isDragging = true;
        const event = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          pointerId: 1,
        });

        moveHandler.handlePointerMove(event);

        expect(mockSelectionGroup!.move).not.toHaveBeenCalled();
      });

      it('should not move if pointerId does not match', () => {
        // First, start a drag to set the trackedPointerId
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          pointerId: 1,
        });
        moveHandler.handlePointerDown(downEvent);

        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          pointerId: 2, // Different pointerId
          clientX: 200,
          clientY: 200,
        });

        moveHandler.handlePointerMove(moveEvent);

        expect(mockSelectionGroup!.move).not.toHaveBeenCalled();
      });

      it('should not move below threshold', () => {
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          pointerId: 1,
          clientX: 100,
          clientY: 100,
        });
        moveHandler.handlePointerDown(downEvent);

        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          pointerId: 1,
          clientX: 102, // Less than 5px threshold
          clientY: 102,
        });

        moveHandler.handlePointerMove(moveEvent);

        expect(mockSelectionGroup!.move).not.toHaveBeenCalled();
        expect(moveHandler.hasMoved).toBe(false);
      });

      it('should move selection when above threshold', () => {
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          pointerId: 1,
          clientX: 100,
          clientY: 100,
        });
        moveHandler.handlePointerDown(downEvent);

        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          pointerId: 1,
          clientX: 120, // More than 5px threshold
          clientY: 120,
        });

        moveHandler.handlePointerMove(moveEvent);

        expect(mockSelectionGroup!.move).toHaveBeenCalledWith(120, 120, 100, 100);
        expect(moveHandler.hasMoved).toBe(true);
      });

      it('should update dragStart position after move', () => {
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          pointerId: 1,
          clientX: 100,
          clientY: 100,
        });
        moveHandler.handlePointerDown(downEvent);

        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          pointerId: 1,
          clientX: 150,
          clientY: 150,
        });

        moveHandler.handlePointerMove(moveEvent);

        expect(moveHandler.dragStartX).toBe(150);
        expect(moveHandler.dragStartY).toBe(150);
      });

      it('should continue moving after hasMoved is true regardless of threshold', () => {
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          pointerId: 1,
          clientX: 100,
          clientY: 100,
        });
        moveHandler.handlePointerDown(downEvent);

        // First move to set hasMoved
        const moveEvent1 = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          pointerId: 1,
          clientX: 120,
          clientY: 120,
        });
        moveHandler.handlePointerMove(moveEvent1);
        expect(moveHandler.hasMoved).toBe(true);

        // Second move with small delta
        const moveEvent2 = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          pointerId: 1,
          clientX: 121,
          clientY: 121,
        });

        moveHandler.handlePointerMove(moveEvent2);

        expect(mockSelectionGroup!.move).toHaveBeenCalledTimes(2);
      });
    });

    describe('touch events', () => {
      beforeEach(() => {
        mockSelectionGroup = {
          isSelected: true,
          objects: [],
          move: jest.fn(),
          update: jest.fn(),
          persistChildren: jest.fn(),
          refreshObjectDimensions: jest.fn(),
        };
      });

      it('should move selection on single touch drag above threshold', () => {
        mockState.pointers.set(1, { clientX: 100, clientY: 100 });
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });
        moveHandler.handlePointerDown(downEvent);

        mockState.pointers.set(1, { clientX: 150, clientY: 150 });
        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'touch',
          pointerId: 1,
        });

        moveHandler.handlePointerMove(moveEvent);

        expect(mockSelectionGroup!.move).toHaveBeenCalledWith(150, 150, 100, 100);
        expect(moveHandler.hasMoved).toBe(true);
      });

      it('should clear long touch timeout on move', () => {
        jest.useFakeTimers();
        mockState.longTouchTimeout = setTimeout(() => { }, 1000);
        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

        mockState.pointers.set(1, { clientX: 100, clientY: 100 });
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });
        moveHandler.handlePointerDown(downEvent);

        mockState.pointers.set(1, { clientX: 150, clientY: 150 });
        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'touch',
          pointerId: 1,
        });

        moveHandler.handlePointerMove(moveEvent);

        expect(clearTimeoutSpy).toHaveBeenCalled();
        jest.useRealTimers();
      });

      it('should not move when scaling', () => {
        mockState.isScaling = true;
        mockState.pointers.set(1, { clientX: 100, clientY: 100 });
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });
        moveHandler.handlePointerDown(downEvent);

        mockState.pointers.set(1, { clientX: 150, clientY: 150 });
        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'touch',
          pointerId: 1,
        });

        moveHandler.handlePointerMove(moveEvent);

        expect(mockSelectionGroup!.move).not.toHaveBeenCalled();
      });

      it('should not move when resize handle is selected', () => {
        mockState.isResizeHandleSelected = true;
        mockState.pointers.set(1, { clientX: 100, clientY: 100 });
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });
        moveHandler.handlePointerDown(downEvent);

        mockState.pointers.set(1, { clientX: 150, clientY: 150 });
        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'touch',
          pointerId: 1,
        });

        moveHandler.handlePointerMove(moveEvent);

        expect(mockSelectionGroup!.move).not.toHaveBeenCalled();
      });
    });
  });

  describe('handlePointerUp', () => {
    describe('mouse events', () => {
      beforeEach(() => {
        mockSelectionGroup = {
          isSelected: true,
          objects: [],
          move: jest.fn(),
          update: jest.fn(),
          persistChildren: jest.fn(),
          refreshObjectDimensions: jest.fn(),
        };
      });

      it('should not do anything if trackedPointerId is null', () => {
        mockState.isDragging = true;
        const event = createPointerEvent('pointerup', {
          pointerType: 'mouse',
          pointerId: 1,
        });

        moveHandler.handlePointerUp(event);

        expect(mockState.isDragging).toBe(true);
      });

      it('should not do anything if pointerId does not match', () => {
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          pointerId: 1,
        });
        moveHandler.handlePointerDown(downEvent);

        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'mouse',
          pointerId: 2,
        });

        moveHandler.handlePointerUp(upEvent);

        expect(mockState.isDragging).toBe(true);
      });

      it('should end drag and reset state', () => {
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          pointerId: 1,
          clientX: 100,
          clientY: 100,
        });
        moveHandler.handlePointerDown(downEvent);

        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'mouse',
          pointerId: 1,
        });

        moveHandler.handlePointerUp(upEvent);

        expect(mockState.isDragging).toBe(false);
        expect(moveHandler.hasMoved).toBe(false);
        expect(moveHandler.dragStartX).toBe(0);
      });

      it('should update selection and emit changes when moved', () => {
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          pointerId: 1,
          clientX: 100,
          clientY: 100,
        });
        moveHandler.handlePointerDown(downEvent);

        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          pointerId: 1,
          clientX: 150,
          clientY: 150,
        });
        moveHandler.handlePointerMove(moveEvent);

        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'mouse',
          pointerId: 1,
        });
        moveHandler.handlePointerUp(upEvent);

        expect(mockSelectionGroup!.persistChildren).toHaveBeenCalled();
        expect(mockSelectionGroup!.refreshObjectDimensions).toHaveBeenCalledWith(undefined, false);
        expect(mockSelectionGroup!.update).toHaveBeenCalled();
        expect(mockCore.engine.emitObjectsChange).toHaveBeenCalled();
        expect(mockState.hasObjectsChanged).toBe(true);
      });

      it('should not update selection or emit changes when not moved', () => {
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          pointerId: 1,
          clientX: 100,
          clientY: 100,
        });
        moveHandler.handlePointerDown(downEvent);

        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'mouse',
          pointerId: 1,
        });
        moveHandler.handlePointerUp(upEvent);

        expect(mockSelectionGroup!.update).not.toHaveBeenCalled();
        expect(mockCore.engine.emitObjectsChange).not.toHaveBeenCalled();
      });
    });

    describe('touch events', () => {
      beforeEach(() => {
        mockSelectionGroup = {
          isSelected: true,
          objects: [],
          move: jest.fn(),
          update: jest.fn(),
          persistChildren: jest.fn(),
          refreshObjectDimensions: jest.fn(),
        };
      });

      it('should end drag on touch up', () => {
        mockState.pointers.set(1, { clientX: 100, clientY: 100 });
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });
        moveHandler.handlePointerDown(downEvent);

        mockState.isDragging = true;
        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'touch',
          pointerId: 1,
        });

        moveHandler.handlePointerUp(upEvent);

        expect(mockState.isDragging).toBe(false);
      });

      it('should update selection and emit changes when moved with touch', () => {
        mockState.pointers.set(1, { clientX: 100, clientY: 100 });
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });
        moveHandler.handlePointerDown(downEvent);

        mockState.pointers.set(1, { clientX: 150, clientY: 150 });
        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'touch',
          pointerId: 1,
        });
        moveHandler.handlePointerMove(moveEvent);

        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'touch',
          pointerId: 1,
        });
        moveHandler.handlePointerUp(upEvent);

        expect(mockSelectionGroup!.persistChildren).toHaveBeenCalled();
        expect(mockSelectionGroup!.refreshObjectDimensions).toHaveBeenCalledWith(undefined, false);
        expect(mockSelectionGroup!.update).toHaveBeenCalled();
        expect(mockCore.engine.emitObjectsChange).toHaveBeenCalled();
        expect(mockState.hasObjectsChanged).toBe(true);
      });
    });
  });

  describe('anchor disconnection', () => {
    let mockLine: jest.Mocked<KritzelLine>;

    beforeEach(() => {
      mockLine = {
        id: 'line-1',
        startAnchor: { objectId: 'obj-1', position: 'top' },
        endAnchor: { objectId: 'obj-2', position: 'bottom' },
      } as unknown as jest.Mocked<KritzelLine>;

      // Make mockLine pass instanceof check
      Object.setPrototypeOf(mockLine, KritzelLine.prototype);

      mockSelectionGroup = {
        isSelected: true,
        objects: [mockLine],
        move: jest.fn(),
        update: jest.fn(),
      };
    });

    it('should disconnect anchors when drag distance exceeds threshold', () => {
      const downEvent = createPointerEvent('pointerdown', {
        pointerType: 'mouse',
        pointerId: 1,
        clientX: 0,
        clientY: 0,
      });
      moveHandler.handlePointerDown(downEvent);

      // Move beyond threshold (30px)
      const moveEvent = createPointerEvent('pointermove', {
        pointerType: 'mouse',
        pointerId: 1,
        clientX: 40,
        clientY: 40,
      });
      moveHandler.handlePointerMove(moveEvent);

      expect(mockCore.anchorManager.removeAnchor).toHaveBeenCalledWith('line-1', 'start');
      expect(mockCore.anchorManager.removeAnchor).toHaveBeenCalledWith('line-1', 'end');
      expect(mockState.objects.update).toHaveBeenCalledWith(mockLine);
    });

    it('should not disconnect anchors when drag distance is below threshold', () => {
      const downEvent = createPointerEvent('pointerdown', {
        pointerType: 'mouse',
        pointerId: 1,
        clientX: 0,
        clientY: 0,
      });
      moveHandler.handlePointerDown(downEvent);

      // Move below threshold (30px)
      const moveEvent = createPointerEvent('pointermove', {
        pointerType: 'mouse',
        pointerId: 1,
        clientX: 15,
        clientY: 15,
      });
      moveHandler.handlePointerMove(moveEvent);

      expect(mockCore.anchorManager.removeAnchor).not.toHaveBeenCalled();
    });

    it('should not disconnect anchors if selection contains non-line objects', () => {
      const nonLineObject = { id: 'shape-1' };
      mockSelectionGroup!.objects = [mockLine, nonLineObject];

      const downEvent = createPointerEvent('pointerdown', {
        pointerType: 'mouse',
        pointerId: 1,
        clientX: 0,
        clientY: 0,
      });
      moveHandler.handlePointerDown(downEvent);

      const moveEvent = createPointerEvent('pointermove', {
        pointerType: 'mouse',
        pointerId: 1,
        clientX: 40,
        clientY: 40,
      });
      moveHandler.handlePointerMove(moveEvent);

      expect(mockCore.anchorManager.removeAnchor).not.toHaveBeenCalled();
    });

    it('should only disconnect once per drag session', () => {
      const downEvent = createPointerEvent('pointerdown', {
        pointerType: 'mouse',
        pointerId: 1,
        clientX: 0,
        clientY: 0,
      });
      moveHandler.handlePointerDown(downEvent);

      // First move beyond threshold
      let moveEvent = createPointerEvent('pointermove', {
        pointerType: 'mouse',
        pointerId: 1,
        clientX: 40,
        clientY: 40,
      });
      moveHandler.handlePointerMove(moveEvent);

      // Second move
      moveEvent = createPointerEvent('pointermove', {
        pointerType: 'mouse',
        pointerId: 1,
        clientX: 80,
        clientY: 80,
      });
      moveHandler.handlePointerMove(moveEvent);

      // Should only be called once for each anchor
      expect(mockCore.anchorManager.removeAnchor).toHaveBeenCalledTimes(2);
    });

    it('should not disconnect if line has no anchors', () => {
      mockLine.startAnchor = undefined;
      mockLine.endAnchor = undefined;

      const downEvent = createPointerEvent('pointerdown', {
        pointerType: 'mouse',
        pointerId: 1,
        clientX: 0,
        clientY: 0,
      });
      moveHandler.handlePointerDown(downEvent);

      const moveEvent = createPointerEvent('pointermove', {
        pointerType: 'mouse',
        pointerId: 1,
        clientX: 40,
        clientY: 40,
      });
      moveHandler.handlePointerMove(moveEvent);

      expect(mockCore.anchorManager.removeAnchor).not.toHaveBeenCalled();
    });

    it('should only disconnect start anchor if end anchor is not set', () => {
      mockLine.endAnchor = undefined;

      const downEvent = createPointerEvent('pointerdown', {
        pointerType: 'mouse',
        pointerId: 1,
        clientX: 0,
        clientY: 0,
      });
      moveHandler.handlePointerDown(downEvent);

      const moveEvent = createPointerEvent('pointermove', {
        pointerType: 'mouse',
        pointerId: 1,
        clientX: 40,
        clientY: 40,
      });
      moveHandler.handlePointerMove(moveEvent);

      expect(mockCore.anchorManager.removeAnchor).toHaveBeenCalledWith('line-1', 'start');
      expect(mockCore.anchorManager.removeAnchor).toHaveBeenCalledTimes(1);
    });
  });
});
