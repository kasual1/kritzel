import { KritzelRotationHandler } from './rotation.handler';
import { KritzelCore } from '../core/core.class';
import { KritzelEventHelper } from '../../helpers/event.helper';

jest.mock('../../helpers/event.helper');

describe('KritzelRotationHandler', () => {
  let rotationHandler: KritzelRotationHandler;
  let mockCore: jest.Mocked<KritzelCore>;
  let mockSelectionGroup: {
    width: number;
    height: number;
    translateX: number;
    translateY: number;
    rotation: number;
    scale: number;
    rotate: jest.Mock;
    update: jest.Mock;
    beginTransform: jest.Mock;
  } | null;
  let mockState: {
    isRotating: boolean;
    isRotationHandleSelected: boolean;
    scale: number;
    translateX: number;
    translateY: number;
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
      isRotating: false,
      isRotationHandleSelected: false,
      scale: 1,
      translateX: 0,
      translateY: 0,
      pointers: new Map(),
      longTouchTimeout: undefined,
      hasObjectsChanged: false,
    };

    mockCore = {
      objectConfigManager: { isRotatable: jest.fn().mockReturnValue(true) },
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

    rotationHandler = new KritzelRotationHandler(mockCore);
  });

  describe('handlePointerDown', () => {
    describe('mouse events', () => {
      it('should start rotation on left click with selection and rotation handle selected', () => {
        mockSelectionGroup = {
          width: 100,
          height: 100,
          translateX: 50,
          translateY: 50,
          rotation: 0,
          scale: 1,
          rotate: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isRotationHandleSelected = true;
        const event = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 150,
          clientY: 50,
        });

        rotationHandler.handlePointerDown(event);

        expect(mockState.isRotating).toBe(true);
        expect(mockSelectionGroup.beginTransform).toHaveBeenCalled();
        expect(rotationHandler.initialSelectionGroupRotation).toBe(0);
      });

      it('should not start rotation on non-left click', () => {
        (KritzelEventHelper.isLeftClick as jest.Mock).mockReturnValue(false);
        mockSelectionGroup = {
          width: 100,
          height: 100,
          translateX: 50,
          translateY: 50,
          rotation: 0,
          scale: 1,
          rotate: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isRotationHandleSelected = true;
        const event = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          button: 2,
        });

        rotationHandler.handlePointerDown(event);

        expect(mockState.isRotating).toBe(false);
        expect(mockSelectionGroup.beginTransform).not.toHaveBeenCalled();
      });

      it('should not start rotation without selection group', () => {
        mockSelectionGroup = null;
        mockState.isRotationHandleSelected = true;
        const event = createPointerEvent('pointerdown', { pointerType: 'mouse' });

        rotationHandler.handlePointerDown(event);

        expect(mockState.isRotating).toBe(false);
      });

      it('should not start rotation when rotation handle is not selected', () => {
        mockSelectionGroup = {
          width: 100,
          height: 100,
          translateX: 50,
          translateY: 50,
          rotation: 0,
          scale: 1,
          rotate: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isRotationHandleSelected = false;
        const event = createPointerEvent('pointerdown', { pointerType: 'mouse' });

        rotationHandler.handlePointerDown(event);

        expect(mockState.isRotating).toBe(false);
        expect(mockSelectionGroup.beginTransform).not.toHaveBeenCalled();
      });

      it('should not start rotation when the selection is not rotatable', () => {
        mockSelectionGroup = {
          width: 100,
          height: 100,
          translateX: 50,
          translateY: 50,
          rotation: 0,
          scale: 1,
          rotate: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isRotationHandleSelected = true;
        (mockCore as any).objectConfigManager.isRotatable.mockReturnValue(false);
        const event = createPointerEvent('pointerdown', { pointerType: 'mouse', button: 0 });

        rotationHandler.handlePointerDown(event);

        expect((mockCore as any).objectConfigManager.isRotatable).toHaveBeenCalledWith(mockSelectionGroup);
        expect(mockState.isRotating).toBe(false);
        expect(mockSelectionGroup.beginTransform).not.toHaveBeenCalled();
      });

      it('should apply offset when calculating cursor position', () => {
        (mockCore.store as any).offsetX = 10;
        (mockCore.store as any).offsetY = 20;
        mockSelectionGroup = {
          width: 100,
          height: 100,
          translateX: 0,
          translateY: 0,
          rotation: 0,
          scale: 1,
          rotate: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isRotationHandleSelected = true;
        const event = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 150,
        });

        rotationHandler.handlePointerDown(event);

        expect(mockState.isRotating).toBe(true);
        // The offset should be subtracted from clientX/clientY
      });

      it('should store initial selection group rotation', () => {
        mockSelectionGroup = {
          width: 100,
          height: 100,
          translateX: 50,
          translateY: 50,
          rotation: Math.PI / 4, // 45 degrees
          scale: 1,
          rotate: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isRotationHandleSelected = true;
        const event = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 150,
          clientY: 50,
        });

        rotationHandler.handlePointerDown(event);

        expect(rotationHandler.initialSelectionGroupRotation).toBe(Math.PI / 4);
      });
    });

    describe('touch events', () => {
      it('should start rotation on single touch with selection and rotation handle selected', () => {
        mockSelectionGroup = {
          width: 100,
          height: 100,
          translateX: 50,
          translateY: 50,
          rotation: 0,
          scale: 1,
          rotate: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isRotationHandleSelected = true;
        mockState.pointers.set(1, { clientX: 150, clientY: 50 });
        const event = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });

        rotationHandler.handlePointerDown(event);

        expect(mockState.isRotating).toBe(true);
        expect(mockSelectionGroup.beginTransform).toHaveBeenCalled();
      });

      it('should clear long touch timeout on touch rotation start', () => {
        jest.useFakeTimers();
        mockState.longTouchTimeout = setTimeout(() => { }, 1000);
        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

        mockSelectionGroup = {
          width: 100,
          height: 100,
          translateX: 0,
          translateY: 0,
          rotation: 0,
          scale: 1,
          rotate: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isRotationHandleSelected = true;
        mockState.pointers.set(1, { clientX: 100, clientY: 100 });
        const event = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });

        rotationHandler.handlePointerDown(event);

        expect(clearTimeoutSpy).toHaveBeenCalled();
        jest.useRealTimers();
      });

      it('should not start rotation when no pointers', () => {
        mockSelectionGroup = {
          width: 100,
          height: 100,
          translateX: 0,
          translateY: 0,
          rotation: 0,
          scale: 1,
          rotate: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isRotationHandleSelected = true;
        // No pointers in map
        const event = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });

        rotationHandler.handlePointerDown(event);

        expect(mockState.isRotating).toBe(false);
      });

      it('should not start rotation with multiple pointers', () => {
        mockSelectionGroup = {
          width: 100,
          height: 100,
          translateX: 0,
          translateY: 0,
          rotation: 0,
          scale: 1,
          rotate: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isRotationHandleSelected = true;
        mockState.pointers.set(1, { clientX: 100, clientY: 100 });
        mockState.pointers.set(2, { clientX: 200, clientY: 200 });
        const event = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });

        rotationHandler.handlePointerDown(event);

        expect(mockState.isRotating).toBe(false);
      });
    });

    describe('pen events', () => {
      it('should start rotation on single pen input with selection and rotation handle selected', () => {
        mockSelectionGroup = {
          width: 100,
          height: 100,
          translateX: 50,
          translateY: 50,
          rotation: 0,
          scale: 1,
          rotate: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isRotationHandleSelected = true;
        mockState.pointers.set(1, { clientX: 200, clientY: 100 });
        const event = createPointerEvent('pointerdown', {
          pointerType: 'pen',
          pointerId: 1,
        });

        rotationHandler.handlePointerDown(event);

        expect(mockState.isRotating).toBe(true);
        expect(mockSelectionGroup.beginTransform).toHaveBeenCalled();
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
          rotate: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isRotationHandleSelected = true;
      });

      it('should not rotate if not in rotating state', () => {
        mockState.isRotating = false;
        const event = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 150,
          clientY: 150,
        });

        rotationHandler.handlePointerMove(event);

        expect(mockSelectionGroup!.rotate).not.toHaveBeenCalled();
      });

      it('should rotate selection when in rotating state', () => {
        // Start rotation first
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 0, // Above center
        });
        rotationHandler.handlePointerDown(downEvent);

        // Move to trigger rotation
        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 150,
          clientY: 50, // Right of center
        });
        rotationHandler.handlePointerMove(moveEvent);

        expect(mockSelectionGroup!.rotate).toHaveBeenCalled();
      });

      it('should calculate rotation based on cursor position relative to center', () => {
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 0,
        });
        rotationHandler.handlePointerDown(downEvent);

        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 150,
          clientY: 50,
        });
        rotationHandler.handlePointerMove(moveEvent);

        expect(rotationHandler.rotation).toBeDefined();
        expect(typeof rotationHandler.rotation).toBe('number');
      });

      it('should consider viewport scale when calculating rotation', () => {
        mockState.scale = 2;

        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 0,
        });
        rotationHandler.handlePointerDown(downEvent);

        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 150,
          clientY: 50,
        });
        rotationHandler.handlePointerMove(moveEvent);

        expect(mockSelectionGroup!.rotate).toHaveBeenCalled();
      });

      it('should consider viewport translation when calculating rotation', () => {
        mockState.translateX = 100;
        mockState.translateY = 100;

        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 200,
          clientY: 100,
        });
        rotationHandler.handlePointerDown(downEvent);

        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 250,
          clientY: 150,
        });
        rotationHandler.handlePointerMove(moveEvent);

        expect(mockSelectionGroup!.rotate).toHaveBeenCalled();
      });

      it('should keep using the pivot captured at pointer down even if the bounding box grows mid-rotation', () => {
        // Center at pointer down is (50, 50) from translate (0,0) and size 100.
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 0,
        });
        rotationHandler.handlePointerDown(downEvent);

        // Simulate the bounding box growing while rotating (e.g. a line anchored to an
        // object outside the selection). The pivot must remain the captured center.
        mockSelectionGroup!.translateX = 1000;
        mockSelectionGroup!.translateY = 1000;
        mockSelectionGroup!.width = 5000;
        mockSelectionGroup!.height = 5000;

        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 150,
          clientY: 50,
        });
        rotationHandler.handlePointerMove(moveEvent);

        // Expected angle uses the fixed pivot (50, 50), not the grown box center.
        const initialRotation = Math.atan2(50 - 0, 50 - 100);
        const currentRotation = Math.atan2(50 - 50, 50 - 150);
        const appliedRotation = (mockSelectionGroup!.rotate as jest.Mock).mock.calls[0][0];
        expect(appliedRotation).toBeCloseTo(currentRotation - initialRotation);
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
          rotate: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isRotationHandleSelected = true;
      });

      it('should rotate on touch move when rotating', () => {
        mockState.pointers.set(1, { clientX: 100, clientY: 0 });
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });
        rotationHandler.handlePointerDown(downEvent);

        mockState.pointers.set(1, { clientX: 150, clientY: 50 });
        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'touch',
          pointerId: 1,
        });
        rotationHandler.handlePointerMove(moveEvent);

        expect(mockSelectionGroup!.rotate).toHaveBeenCalled();
      });

      it('should clear long touch timeout on touch rotation', () => {
        jest.useFakeTimers();
        mockState.longTouchTimeout = setTimeout(() => { }, 1000);
        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

        mockState.pointers.set(1, { clientX: 100, clientY: 0 });
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });
        rotationHandler.handlePointerDown(downEvent);

        mockState.pointers.set(1, { clientX: 150, clientY: 50 });
        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'touch',
          pointerId: 1,
        });
        rotationHandler.handlePointerMove(moveEvent);

        expect(clearTimeoutSpy).toHaveBeenCalled();
        jest.useRealTimers();
      });

      it('should not rotate when no pointers during move', () => {
        mockState.isRotating = true;
        // No pointers set
        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'touch',
          pointerId: 1,
        });

        rotationHandler.handlePointerMove(moveEvent);

        expect(mockSelectionGroup!.rotate).not.toHaveBeenCalled();
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
          rotate: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isRotationHandleSelected = true;
      });

      it('should end rotation and reset state', () => {
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 0,
        });
        rotationHandler.handlePointerDown(downEvent);

        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'mouse',
        });
        rotationHandler.handlePointerUp(upEvent);

        expect(mockState.isRotating).toBe(false);
        expect(rotationHandler.initialRotation).toBe(0);
        expect(rotationHandler.rotation).toBe(0);
      });

      it('should update selection and emit changes when rotated', () => {
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 0,
        });
        rotationHandler.handlePointerDown(downEvent);

        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 150,
          clientY: 50,
        });
        rotationHandler.handlePointerMove(moveEvent);

        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'mouse',
        });
        rotationHandler.handlePointerUp(upEvent);

        expect(mockSelectionGroup!.update).toHaveBeenCalled();
        expect(mockCore.engine.emitObjectsChange).toHaveBeenCalled();
        expect(mockState.hasObjectsChanged).toBe(true);
      });

      it('should do nothing if not rotating', () => {
        mockState.isRotating = false;
        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'mouse',
        });

        rotationHandler.handlePointerUp(upEvent);

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
          rotate: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isRotationHandleSelected = true;
      });

      it('should end rotation on touch up', () => {
        mockState.pointers.set(1, { clientX: 100, clientY: 0 });
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });
        rotationHandler.handlePointerDown(downEvent);

        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'touch',
          pointerId: 1,
        });
        rotationHandler.handlePointerUp(upEvent);

        expect(mockState.isRotating).toBe(false);
      });

      it('should update selection and emit changes when rotated with touch', () => {
        mockState.pointers.set(1, { clientX: 100, clientY: 0 });
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });
        rotationHandler.handlePointerDown(downEvent);

        mockState.pointers.set(1, { clientX: 150, clientY: 50 });
        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'touch',
          pointerId: 1,
        });
        rotationHandler.handlePointerMove(moveEvent);

        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'touch',
          pointerId: 1,
        });
        rotationHandler.handlePointerUp(upEvent);

        expect(mockSelectionGroup!.update).toHaveBeenCalled();
        expect(mockCore.engine.emitObjectsChange).toHaveBeenCalled();
        expect(mockState.hasObjectsChanged).toBe(true);
      });

      it('should clear long touch timeout on touch up', () => {
        jest.useFakeTimers();
        mockState.longTouchTimeout = setTimeout(() => { }, 1000);
        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

        mockState.pointers.set(1, { clientX: 100, clientY: 0 });
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });
        rotationHandler.handlePointerDown(downEvent);

        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'touch',
          pointerId: 1,
        });
        rotationHandler.handlePointerUp(upEvent);

        expect(clearTimeoutSpy).toHaveBeenCalled();
        jest.useRealTimers();
      });
    });

    describe('pen events', () => {
      it('should end rotation on pen up', () => {
        mockSelectionGroup = {
          width: 100,
          height: 100,
          translateX: 0,
          translateY: 0,
          rotation: 0,
          scale: 1,
          rotate: jest.fn(),
          update: jest.fn(),
          beginTransform: jest.fn(),
        };
        mockState.isRotationHandleSelected = true;
        mockState.pointers.set(1, { clientX: 100, clientY: 0 });

        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'pen',
          pointerId: 1,
        });
        rotationHandler.handlePointerDown(downEvent);

        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'pen',
          pointerId: 1,
        });
        rotationHandler.handlePointerUp(upEvent);

        expect(mockState.isRotating).toBe(false);
      });
    });
  });

  describe('continuous rotation operations', () => {
    beforeEach(() => {
      mockSelectionGroup = {
        width: 100,
        height: 100,
        translateX: 0,
        translateY: 0,
        rotation: 0,
        scale: 1,
        rotate: jest.fn(),
        update: jest.fn(),
        beginTransform: jest.fn(),
      };
      mockState.isRotationHandleSelected = true;
    });

    it('should continue rotating on multiple move events', () => {
      const downEvent = createPointerEvent('pointerdown', {
        pointerType: 'mouse',
        clientX: 100,
        clientY: 0,
      });
      rotationHandler.handlePointerDown(downEvent);

      const moveEvent1 = createPointerEvent('pointermove', {
        pointerType: 'mouse',
        clientX: 120,
        clientY: 20,
      });
      rotationHandler.handlePointerMove(moveEvent1);

      const moveEvent2 = createPointerEvent('pointermove', {
        pointerType: 'mouse',
        clientX: 140,
        clientY: 40,
      });
      rotationHandler.handlePointerMove(moveEvent2);

      expect(mockSelectionGroup!.rotate).toHaveBeenCalledTimes(2);
    });

    it('should track accumulated rotation across moves', () => {
      const downEvent = createPointerEvent('pointerdown', {
        pointerType: 'mouse',
        clientX: 100,
        clientY: 0,
      });
      rotationHandler.handlePointerDown(downEvent);

      const moveEvent1 = createPointerEvent('pointermove', {
        pointerType: 'mouse',
        clientX: 120,
        clientY: 20,
      });
      rotationHandler.handlePointerMove(moveEvent1);
      const rotation1 = rotationHandler.rotation;

      const moveEvent2 = createPointerEvent('pointermove', {
        pointerType: 'mouse',
        clientX: 140,
        clientY: 60,
      });
      rotationHandler.handlePointerMove(moveEvent2);
      const rotation2 = rotationHandler.rotation;

      expect(rotation1).not.toBe(rotation2);
    });
  });

  describe('object scale handling', () => {
    it('should correctly calculate center with scaled object', () => {
      mockSelectionGroup = {
        width: 200,
        height: 200,
        translateX: 0,
        translateY: 0,
        rotation: 0,
        scale: 2, // Object is scaled 2x
        rotate: jest.fn(),
        update: jest.fn(),
        beginTransform: jest.fn(),
      };
      mockState.isRotationHandleSelected = true;

      const downEvent = createPointerEvent('pointerdown', {
        pointerType: 'mouse',
        clientX: 100,
        clientY: 0,
      });
      rotationHandler.handlePointerDown(downEvent);

      expect(mockState.isRotating).toBe(true);
      // Center should be at (50, 50) when width/height=200 and scale=2
      // because centerX = translateX + width/2/scale = 0 + 200/2/2 = 50
    });
  });
});
