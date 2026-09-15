import { KritzelLineHandleHandler } from './line-handle.handler';
import { KritzelCore } from '../core/core.class';
import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelLine } from '../objects/line.class';
import { KritzelColorHelper } from '../../helpers/color.helper';

jest.mock('../../helpers/event.helper');
jest.mock('../../helpers/color.helper', () => ({
  KritzelColorHelper: {
    resolveThemeColor: jest.fn().mockImplementation(color => color),
  },
}));

describe('KritzelLineHandleHandler', () => {
  let lineHandleHandler: KritzelLineHandleHandler;
  let mockCore: jest.Mocked<KritzelCore>;
  let mockLine: jest.Mocked<KritzelLine>;
  let mockSelectionGroup: {
    objects: unknown[];
    refreshObjectDimensions: jest.Mock;
    update: jest.Mock;
  } | null;
  let mockState: {
    isLineHandleSelected: boolean;
    isLineHandleDragging: boolean;
    lineHandleType: 'start' | 'end' | 'center' | null;
    scale: number;
    translateX: number;
    translateY: number;
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

  const createMockLine = (): jest.Mocked<KritzelLine> => {
    const line = {
      id: 'line-1',
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 100,
      controlX: undefined,
      controlY: undefined,
      translateX: 50,
      translateY: 50,
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      totalWidth: 100,
      totalHeight: 100,
      scale: 1,
      rotation: 0,
      strokeWidth: 2,
      stroke: '#000000',
      startAnchor: undefined,
      endAnchor: undefined,
      hasStartArrow: false,
      hasEndArrow: false,
      arrows: undefined,
      getArrowSize: jest.fn().mockReturnValue(10),
      getArrowFill: jest.fn().mockReturnValue('#000000'),
      updateControlPoint: jest.fn(),
      _adjustedPoints: null,
      _clipInfo: null,
    } as unknown as jest.Mocked<KritzelLine>;

    Object.setPrototypeOf(line, KritzelLine.prototype);
    return line;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (KritzelEventHelper.isLeftClick as jest.Mock).mockReturnValue(true);

    mockLine = createMockLine();
    mockSelectionGroup = null;

    mockState = {
      isLineHandleSelected: false,
      isLineHandleDragging: false,
      lineHandleType: null,
      scale: 1,
      translateX: 0,
      translateY: 0,
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
        get objects() {
          return mockState.objects;
        },
        get selectionGroup() {
          return mockSelectionGroup;
        },
        get allNonSelectionObjects() {
          return [];
        },
        offsetX: 0,
        offsetY: 0,
      },
      themeManager: {
        currentTheme: 'light',
      },
      engine: {
        emitObjectsChange: jest.fn(),
        emitObjectsAdded: jest.fn(),
        emitObjectsRemoved: jest.fn(),
        emitObjectsUpdated: jest.fn(),
      },
      anchorManager: {
        removeAnchor: jest.fn(),
        findSnapPreviewTarget: jest.fn().mockReturnValue(null),
        findSnapTarget: jest.fn().mockReturnValue(null),
        setSnapCandidate: jest.fn(),
        clearSnapCandidate: jest.fn(),
        setSnapPreviewCandidate: jest.fn(),
        clearSnapPreviewCandidate: jest.fn(),
        setAnchor: jest.fn(),
        computeAnchorClipInfo: jest.fn().mockReturnValue(null),
      },
      rerender: jest.fn(),
    } as unknown as jest.Mocked<KritzelCore>;

    lineHandleHandler = new KritzelLineHandleHandler(mockCore);
  });

  describe('handlePointerDown', () => {
    describe('mouse events', () => {
      it('should start handle drag on left click with line and handle selected', () => {
        mockSelectionGroup = {
          objects: [mockLine],
          refreshObjectDimensions: jest.fn(),
          update: jest.fn(),
        };
        mockState.isLineHandleSelected = true;
        mockState.lineHandleType = 'start';

        const event = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 100,
        });

        lineHandleHandler.handlePointerDown(event);

        expect(mockState.isLineHandleDragging).toBe(true);
        expect(lineHandleHandler.initialMouseX).toBe(100);
        expect(lineHandleHandler.initialMouseY).toBe(100);
        expect(lineHandleHandler.initialStartX).toBe(mockLine.startX);
        expect(lineHandleHandler.initialStartY).toBe(mockLine.startY);
        expect(lineHandleHandler.initialEndX).toBe(mockLine.endX);
        expect(lineHandleHandler.initialEndY).toBe(mockLine.endY);
      });

      it('should not start handle drag on non-left click', () => {
        (KritzelEventHelper.isLeftClick as jest.Mock).mockReturnValue(false);
        mockSelectionGroup = {
          objects: [mockLine],
          refreshObjectDimensions: jest.fn(),
          update: jest.fn(),
        };
        mockState.isLineHandleSelected = true;

        const event = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          button: 2,
        });

        lineHandleHandler.handlePointerDown(event);

        expect(mockState.isLineHandleDragging).toBe(false);
      });

      it('should not start handle drag without selection group', () => {
        mockSelectionGroup = null;
        mockState.isLineHandleSelected = true;

        const event = createPointerEvent('pointerdown', { pointerType: 'mouse' });

        lineHandleHandler.handlePointerDown(event);

        expect(mockState.isLineHandleDragging).toBe(false);
      });

      it('should not start handle drag when handle is not selected', () => {
        mockSelectionGroup = {
          objects: [mockLine],
          refreshObjectDimensions: jest.fn(),
          update: jest.fn(),
        };
        mockState.isLineHandleSelected = false;

        const event = createPointerEvent('pointerdown', { pointerType: 'mouse' });

        lineHandleHandler.handlePointerDown(event);

        expect(mockState.isLineHandleDragging).toBe(false);
      });

      it('should not start handle drag when selection is not a line', () => {
        const nonLineObject = { id: 'shape-1' };
        mockSelectionGroup = {
          objects: [nonLineObject],
          refreshObjectDimensions: jest.fn(),
          update: jest.fn(),
        };
        mockState.isLineHandleSelected = true;

        const event = createPointerEvent('pointerdown', { pointerType: 'mouse' });

        lineHandleHandler.handlePointerDown(event);

        expect(mockState.isLineHandleDragging).toBe(false);
      });

      it('should not start handle drag when multiple objects selected', () => {
        mockSelectionGroup = {
          objects: [mockLine, createMockLine()],
          refreshObjectDimensions: jest.fn(),
          update: jest.fn(),
        };
        mockState.isLineHandleSelected = true;

        const event = createPointerEvent('pointerdown', { pointerType: 'mouse' });

        lineHandleHandler.handlePointerDown(event);

        expect(mockState.isLineHandleDragging).toBe(false);
      });

      it('should remove existing anchor for start endpoint', () => {
        mockSelectionGroup = {
          objects: [mockLine],
          refreshObjectDimensions: jest.fn(),
          update: jest.fn(),
        };
        mockState.isLineHandleSelected = true;
        mockState.lineHandleType = 'start';

        const event = createPointerEvent('pointerdown', { pointerType: 'mouse' });

        lineHandleHandler.handlePointerDown(event);

        expect(mockCore.anchorManager.removeAnchor).toHaveBeenCalledWith('line-1', 'start');
      });

      it('should remove existing anchor for end endpoint', () => {
        mockSelectionGroup = {
          objects: [mockLine],
          refreshObjectDimensions: jest.fn(),
          update: jest.fn(),
        };
        mockState.isLineHandleSelected = true;
        mockState.lineHandleType = 'end';

        const event = createPointerEvent('pointerdown', { pointerType: 'mouse' });

        lineHandleHandler.handlePointerDown(event);

        expect(mockCore.anchorManager.removeAnchor).toHaveBeenCalledWith('line-1', 'end');
      });

      it('should not remove anchor for center handle', () => {
        mockSelectionGroup = {
          objects: [mockLine],
          refreshObjectDimensions: jest.fn(),
          update: jest.fn(),
        };
        mockState.isLineHandleSelected = true;
        mockState.lineHandleType = 'center';

        const event = createPointerEvent('pointerdown', { pointerType: 'mouse' });

        lineHandleHandler.handlePointerDown(event);

        expect(mockCore.anchorManager.removeAnchor).not.toHaveBeenCalled();
      });

      it('should apply offset when calculating initial mouse position', () => {
        (mockCore.store as any).offsetX = 10;
        (mockCore.store as any).offsetY = 20;
        mockSelectionGroup = {
          objects: [mockLine],
          refreshObjectDimensions: jest.fn(),
          update: jest.fn(),
        };
        mockState.isLineHandleSelected = true;
        mockState.lineHandleType = 'start';

        const event = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 100,
        });

        lineHandleHandler.handlePointerDown(event);

        expect(lineHandleHandler.initialMouseX).toBe(90);
        expect(lineHandleHandler.initialMouseY).toBe(80);
      });

      it('should clear long touch timeout on drag start', () => {
        jest.useFakeTimers();
        mockState.longTouchTimeout = setTimeout(() => { }, 1000);
        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

        mockSelectionGroup = {
          objects: [mockLine],
          refreshObjectDimensions: jest.fn(),
          update: jest.fn(),
        };
        mockState.isLineHandleSelected = true;
        mockState.lineHandleType = 'start';

        const event = createPointerEvent('pointerdown', { pointerType: 'mouse' });

        lineHandleHandler.handlePointerDown(event);

        expect(clearTimeoutSpy).toHaveBeenCalled();
        jest.useRealTimers();
      });

      it('should store initial control point if present', () => {
        mockLine.controlX = 50;
        mockLine.controlY = 25;
        mockSelectionGroup = {
          objects: [mockLine],
          refreshObjectDimensions: jest.fn(),
          update: jest.fn(),
        };
        mockState.isLineHandleSelected = true;
        mockState.lineHandleType = 'center';

        const event = createPointerEvent('pointerdown', { pointerType: 'mouse' });

        lineHandleHandler.handlePointerDown(event);

        expect(lineHandleHandler.initialControlX).toBe(50);
        expect(lineHandleHandler.initialControlY).toBe(25);
      });
    });

    describe('touch events', () => {
      it('should start handle drag on single touch', () => {
        mockSelectionGroup = {
          objects: [mockLine],
          refreshObjectDimensions: jest.fn(),
          update: jest.fn(),
        };
        mockState.isLineHandleSelected = true;
        mockState.lineHandleType = 'start';
        mockState.pointers.set(1, { clientX: 100, clientY: 100 });

        const event = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
          clientX: 100,
          clientY: 100,
        });

        lineHandleHandler.handlePointerDown(event);

        expect(mockState.isLineHandleDragging).toBe(true);
      });

      it('should not start handle drag with multiple pointers', () => {
        mockSelectionGroup = {
          objects: [mockLine],
          refreshObjectDimensions: jest.fn(),
          update: jest.fn(),
        };
        mockState.isLineHandleSelected = true;
        mockState.pointers.set(1, { clientX: 100, clientY: 100 });
        mockState.pointers.set(2, { clientX: 200, clientY: 200 });

        const event = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });

        lineHandleHandler.handlePointerDown(event);

        expect(mockState.isLineHandleDragging).toBe(false);
      });
    });

    describe('pen events', () => {
      it('should start handle drag on single pen input', () => {
        mockSelectionGroup = {
          objects: [mockLine],
          refreshObjectDimensions: jest.fn(),
          update: jest.fn(),
        };
        mockState.isLineHandleSelected = true;
        mockState.lineHandleType = 'end';
        mockState.pointers.set(1, { clientX: 100, clientY: 100 });

        const event = createPointerEvent('pointerdown', {
          pointerType: 'pen',
          pointerId: 1,
          clientX: 100,
          clientY: 100,
        });

        lineHandleHandler.handlePointerDown(event);

        expect(mockState.isLineHandleDragging).toBe(true);
      });
    });
  });

  describe('handlePointerMove', () => {
    beforeEach(() => {
      mockSelectionGroup = {
        objects: [mockLine],
        refreshObjectDimensions: jest.fn(),
        update: jest.fn(),
      };
      mockState.isLineHandleSelected = true;
    });

    it('should not move if not dragging', () => {
      mockState.isLineHandleDragging = false;

      const event = createPointerEvent('pointermove', {
        pointerType: 'mouse',
        clientX: 150,
        clientY: 150,
      });

      lineHandleHandler.handlePointerMove(event);

      expect(mockCore.rerender).not.toHaveBeenCalled();
    });

    it('should not move without line', () => {
      mockSelectionGroup = null;
      mockState.isLineHandleDragging = true;

      const event = createPointerEvent('pointermove', {
        pointerType: 'mouse',
        clientX: 150,
        clientY: 150,
      });

      lineHandleHandler.handlePointerMove(event);

      expect(mockCore.rerender).not.toHaveBeenCalled();
    });

    it('should not move below threshold', () => {
      mockState.lineHandleType = 'start';
      const downEvent = createPointerEvent('pointerdown', {
        pointerType: 'mouse',
        clientX: 100,
        clientY: 100,
      });
      lineHandleHandler.handlePointerDown(downEvent);

      const moveEvent = createPointerEvent('pointermove', {
        pointerType: 'mouse',
        clientX: 101, // Less than 3px threshold
        clientY: 101,
      });
      lineHandleHandler.handlePointerMove(moveEvent);

      expect(lineHandleHandler.hasMoved).toBe(false);
    });

    it('should set hasMoved when above threshold', () => {
      mockState.lineHandleType = 'start';
      const downEvent = createPointerEvent('pointerdown', {
        pointerType: 'mouse',
        clientX: 100,
        clientY: 100,
      });
      lineHandleHandler.handlePointerDown(downEvent);

      const moveEvent = createPointerEvent('pointermove', {
        pointerType: 'mouse',
        clientX: 110, // More than 3px threshold
        clientY: 110,
      });
      lineHandleHandler.handlePointerMove(moveEvent);

      expect(lineHandleHandler.hasMoved).toBe(true);
    });

    describe('start handle', () => {
      beforeEach(() => {
        mockState.lineHandleType = 'start';
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 100,
        });
        lineHandleHandler.handlePointerDown(downEvent);
      });

      it('should update start endpoint on move', () => {
        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 120,
          clientY: 130,
        });

        lineHandleHandler.handlePointerMove(moveEvent);

        expect(mockCore.rerender).toHaveBeenCalled();
        expect(mockCore.anchorManager.findSnapPreviewTarget).toHaveBeenCalled();
        expect(mockCore.anchorManager.findSnapTarget).toHaveBeenCalled();
      });

      it('should clear snap candidate when no snap target', () => {
        (mockCore.anchorManager.findSnapTarget as jest.Mock).mockReturnValue(null);

        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 120,
          clientY: 130,
        });

        lineHandleHandler.handlePointerMove(moveEvent);

        expect(mockCore.anchorManager.clearSnapCandidate).toHaveBeenCalled();
        expect(mockCore.anchorManager.clearSnapPreviewCandidate).toHaveBeenCalled();
      });

      it('should set snap candidate when snap target found', () => {
        const snapTarget = {
          objectId: 'target-obj',
          centerX: 150,
          centerY: 150,
        };
        Object.defineProperty(mockCore.themeManager, 'currentTheme', { value: 'dark', configurable: true });
        (mockCore.anchorManager.findSnapTarget as jest.Mock).mockReturnValue(snapTarget);

        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 150,
          clientY: 150,
        });

        lineHandleHandler.handlePointerMove(moveEvent);

        expect(mockCore.anchorManager.setSnapCandidate).toHaveBeenCalled();
        expect(mockCore.anchorManager.setSnapPreviewCandidate).toHaveBeenCalledWith(null);
        expect(KritzelColorHelper.resolveThemeColor).toHaveBeenCalledWith(mockLine.stroke, 'dark');
      });

      it('should set a preview candidate before actual snapping engages', () => {
        const previewTarget = {
          objectId: 'preview-obj',
          centerX: 150,
          centerY: 150,
        };
        (mockCore.anchorManager.findSnapPreviewTarget as jest.Mock).mockReturnValue(previewTarget);
        (mockCore.anchorManager.findSnapTarget as jest.Mock).mockReturnValue(null);

        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 120,
          clientY: 130,
        });

        lineHandleHandler.handlePointerMove(moveEvent);

        expect(mockCore.anchorManager.setSnapPreviewCandidate).toHaveBeenCalled();
        expect(mockCore.anchorManager.clearSnapCandidate).toHaveBeenCalled();
      });

      it('should exclude other endpoint anchor from snap targets', () => {
        mockLine.endAnchor = { objectId: 'anchor-obj' } as any;

        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 120,
          clientY: 130,
        });

        lineHandleHandler.handlePointerMove(moveEvent);

        expect(mockCore.anchorManager.findSnapTarget).toHaveBeenCalledWith(
          expect.any(Number),
          expect.any(Number),
          'line-1',
          'anchor-obj',
          'mouse'
        );
      });

      it('should clear adjusted and clip caches when endpoint geometry updates', () => {
        const linePrivate = mockLine as unknown as {
          _adjustedPoints: number[][] | null;
          _clipInfo: { start?: { x: number; y: number; t?: number }; end?: { x: number; y: number; t?: number } } | null;
        };
        linePrivate._adjustedPoints = [[1, 2], [3, 4]];
        linePrivate._clipInfo = { start: { x: 10, y: 10, t: 0.2 } };

        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 120,
          clientY: 130,
        });

        lineHandleHandler.handlePointerMove(moveEvent);

        expect(linePrivate._adjustedPoints).toBeNull();
        expect(linePrivate._clipInfo).toBeNull();
      });
    });

    describe('end handle', () => {
      beforeEach(() => {
        mockState.lineHandleType = 'end';
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 100,
        });
        lineHandleHandler.handlePointerDown(downEvent);
      });

      it('should update end endpoint on move', () => {
        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 120,
          clientY: 130,
        });

        lineHandleHandler.handlePointerMove(moveEvent);

        expect(mockCore.rerender).toHaveBeenCalled();
        expect(mockCore.anchorManager.findSnapPreviewTarget).toHaveBeenCalled();
        expect(mockCore.anchorManager.findSnapTarget).toHaveBeenCalled();
      });

      it('should exclude other endpoint anchor from snap targets', () => {
        mockLine.startAnchor = { objectId: 'start-anchor-obj' } as any;

        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 120,
          clientY: 130,
        });

        lineHandleHandler.handlePointerMove(moveEvent);

        expect(mockCore.anchorManager.findSnapTarget).toHaveBeenCalledWith(
          expect.any(Number),
          expect.any(Number),
          'line-1',
          'start-anchor-obj',
          'mouse'
        );
      });

      it('should pass touch pointer type into snap detection', () => {
        mockState.lineHandleType = 'start';
        const touchDownEvent = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
          clientX: 100,
          clientY: 100,
        });
        mockState.pointers.set(1, { clientX: 100, clientY: 100 });
        lineHandleHandler.handlePointerDown(touchDownEvent);

        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'touch',
          pointerId: 1,
          clientX: 150,
          clientY: 150,
        });

        lineHandleHandler.handlePointerMove(moveEvent);

        expect(mockCore.anchorManager.findSnapTarget).toHaveBeenCalledWith(
          expect.any(Number),
          expect.any(Number),
          'line-1',
          undefined,
          'touch'
        );
      });
    });

    describe('center handle (control point)', () => {
      beforeEach(() => {
        mockState.lineHandleType = 'center';
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 100,
        });
        lineHandleHandler.handlePointerDown(downEvent);
      });

      it('should update control point on move', () => {
        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 150,
          clientY: 150,
        });

        lineHandleHandler.handlePointerMove(moveEvent);

        expect(mockLine.updateControlPoint).toHaveBeenCalled();
        expect(mockCore.rerender).toHaveBeenCalled();
      });

      it('should snap control point to straight line when close', () => {
        // Move close to the line (within threshold)
        mockLine.startX = 0;
        mockLine.startY = 0;
        mockLine.endX = 100;
        mockLine.endY = 100;

        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 105, // Close to line
          clientY: 105,
        });

        lineHandleHandler.handlePointerMove(moveEvent);

        expect(mockLine.updateControlPoint).toHaveBeenCalledWith(undefined, undefined);
      });

      it('should use line midpoint as initial control point if not set', () => {
        mockLine.controlX = undefined;
        mockLine.controlY = undefined;
        mockLine.startX = 0;
        mockLine.startY = 0;
        mockLine.endX = 100;
        mockLine.endY = 100;

        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 200, // Far from line
          clientY: 50,
        });

        lineHandleHandler.handlePointerMove(moveEvent);

        expect(mockLine.updateControlPoint).toHaveBeenCalled();
      });
    });

    describe('viewport scale handling', () => {
      it('should consider viewport scale when calculating delta', () => {
        mockState.scale = 2;
        mockState.lineHandleType = 'start';

        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 100,
        });
        lineHandleHandler.handlePointerDown(downEvent);

        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 120,
          clientY: 120,
        });

        lineHandleHandler.handlePointerMove(moveEvent);

        expect(mockCore.rerender).toHaveBeenCalled();
      });
    });

    describe('rotated line handling', () => {
      it('should handle rotation when calculating delta', () => {
        mockLine.rotation = Math.PI / 4; // 45 degrees
        mockState.lineHandleType = 'start';

        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 100,
        });
        lineHandleHandler.handlePointerDown(downEvent);

        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 120,
          clientY: 100, // Horizontal movement
        });

        lineHandleHandler.handlePointerMove(moveEvent);

        expect(mockCore.rerender).toHaveBeenCalled();
      });
    });
  });

  describe('handlePointerUp', () => {
    beforeEach(() => {
      mockSelectionGroup = {
        objects: [mockLine],
        refreshObjectDimensions: jest.fn(),
        update: jest.fn(),
      };
      mockState.isLineHandleSelected = true;
    });

    it('should do nothing if not dragging', () => {
      mockState.isLineHandleDragging = false;

      const event = createPointerEvent('pointerup', { pointerType: 'mouse' });

      lineHandleHandler.handlePointerUp(event);

      expect(mockCore.rerender).not.toHaveBeenCalled();
    });

    it('should end drag and reset state', () => {
      mockState.lineHandleType = 'start';
      const downEvent = createPointerEvent('pointerdown', {
        pointerType: 'mouse',
        clientX: 100,
        clientY: 100,
      });
      lineHandleHandler.handlePointerDown(downEvent);

      // Simulate move
      const moveEvent = createPointerEvent('pointermove', {
        pointerType: 'mouse',
        clientX: 150,
        clientY: 150,
      });
      lineHandleHandler.handlePointerMove(moveEvent);

      const upEvent = createPointerEvent('pointerup', { pointerType: 'mouse' });
      lineHandleHandler.handlePointerUp(upEvent);

      expect(mockState.isLineHandleDragging).toBe(false);
      expect(lineHandleHandler.hasMoved).toBe(false);
      expect(lineHandleHandler.initialMouseX).toBe(0);
      expect(mockCore.rerender).toHaveBeenCalled();
    });

    it('should update selection group and emit changes when moved', () => {
      mockState.lineHandleType = 'start';
      const downEvent = createPointerEvent('pointerdown', {
        pointerType: 'mouse',
        clientX: 100,
        clientY: 100,
      });
      lineHandleHandler.handlePointerDown(downEvent);

      const moveEvent = createPointerEvent('pointermove', {
        pointerType: 'mouse',
        clientX: 150,
        clientY: 150,
      });
      lineHandleHandler.handlePointerMove(moveEvent);

      const upEvent = createPointerEvent('pointerup', { pointerType: 'mouse' });
      lineHandleHandler.handlePointerUp(upEvent);

      expect(mockSelectionGroup!.refreshObjectDimensions).toHaveBeenCalled();
      expect(mockSelectionGroup!.update).toHaveBeenCalled();
      expect(mockCore.engine.emitObjectsChange).toHaveBeenCalled();
      expect(mockState.hasObjectsChanged).toBe(true);
    });

    it('should not update selection group when not moved', () => {
      mockState.lineHandleType = 'start';
      const downEvent = createPointerEvent('pointerdown', {
        pointerType: 'mouse',
        clientX: 100,
        clientY: 100,
      });
      lineHandleHandler.handlePointerDown(downEvent);

      const upEvent = createPointerEvent('pointerup', { pointerType: 'mouse' });
      lineHandleHandler.handlePointerUp(upEvent);

      expect(mockSelectionGroup!.refreshObjectDimensions).not.toHaveBeenCalled();
      expect(mockCore.engine.emitObjectsChange).not.toHaveBeenCalled();
    });

    it('should create anchor when snapped to target for start handle', () => {
      mockState.lineHandleType = 'start';
      const snapTarget = {
        objectId: 'target-obj',
        centerX: 150,
        centerY: 150,
      };
      (mockCore.anchorManager.findSnapTarget as jest.Mock).mockReturnValue(snapTarget);

      const downEvent = createPointerEvent('pointerdown', {
        pointerType: 'mouse',
        clientX: 100,
        clientY: 100,
      });
      lineHandleHandler.handlePointerDown(downEvent);

      const moveEvent = createPointerEvent('pointermove', {
        pointerType: 'mouse',
        clientX: 150,
        clientY: 150,
      });
      lineHandleHandler.handlePointerMove(moveEvent);

      const upEvent = createPointerEvent('pointerup', { pointerType: 'mouse' });
      lineHandleHandler.handlePointerUp(upEvent);

      expect(mockCore.anchorManager.setAnchor).toHaveBeenCalledWith('line-1', 'start', 'target-obj');
    });

    it('should create anchor when snapped to target for end handle', () => {
      mockState.lineHandleType = 'end';
      const snapTarget = {
        objectId: 'target-obj',
        centerX: 150,
        centerY: 150,
      };
      (mockCore.anchorManager.findSnapTarget as jest.Mock).mockReturnValue(snapTarget);

      const downEvent = createPointerEvent('pointerdown', {
        pointerType: 'mouse',
        clientX: 100,
        clientY: 100,
      });
      lineHandleHandler.handlePointerDown(downEvent);

      const moveEvent = createPointerEvent('pointermove', {
        pointerType: 'mouse',
        clientX: 150,
        clientY: 150,
      });
      lineHandleHandler.handlePointerMove(moveEvent);

      const upEvent = createPointerEvent('pointerup', { pointerType: 'mouse' });
      lineHandleHandler.handlePointerUp(upEvent);

      expect(mockCore.anchorManager.setAnchor).toHaveBeenCalledWith('line-1', 'end', 'target-obj');
    });

    it('should not create anchor for center handle', () => {
      mockState.lineHandleType = 'center';
      const snapTarget = {
        objectId: 'target-obj',
        centerX: 150,
        centerY: 150,
      };
      (mockCore.anchorManager.findSnapTarget as jest.Mock).mockReturnValue(snapTarget);

      const downEvent = createPointerEvent('pointerdown', {
        pointerType: 'mouse',
        clientX: 100,
        clientY: 100,
      });
      lineHandleHandler.handlePointerDown(downEvent);

      const moveEvent = createPointerEvent('pointermove', {
        pointerType: 'mouse',
        clientX: 150,
        clientY: 150,
      });
      lineHandleHandler.handlePointerMove(moveEvent);

      const upEvent = createPointerEvent('pointerup', { pointerType: 'mouse' });
      lineHandleHandler.handlePointerUp(upEvent);

      expect(mockCore.anchorManager.setAnchor).not.toHaveBeenCalled();
    });

    it('should clear snap candidate on up', () => {
      mockState.lineHandleType = 'start';
      const downEvent = createPointerEvent('pointerdown', {
        pointerType: 'mouse',
        clientX: 100,
        clientY: 100,
      });
      lineHandleHandler.handlePointerDown(downEvent);

      const upEvent = createPointerEvent('pointerup', { pointerType: 'mouse' });
      lineHandleHandler.handlePointerUp(upEvent);

      expect(mockCore.anchorManager.clearSnapCandidate).toHaveBeenCalled();
      expect(mockCore.anchorManager.clearSnapPreviewCandidate).toHaveBeenCalled();
    });
  });

  describe('touch and pen pointer up', () => {
    beforeEach(() => {
      mockSelectionGroup = {
        objects: [mockLine],
        refreshObjectDimensions: jest.fn(),
        update: jest.fn(),
      };
      mockState.isLineHandleSelected = true;
      mockState.lineHandleType = 'start';
      mockState.pointers.set(1, { clientX: 100, clientY: 100 });
    });

    it('should handle touch pointer up', () => {
      const downEvent = createPointerEvent('pointerdown', {
        pointerType: 'touch',
        pointerId: 1,
        clientX: 100,
        clientY: 100,
      });
      lineHandleHandler.handlePointerDown(downEvent);

      const moveEvent = createPointerEvent('pointermove', {
        pointerType: 'touch',
        pointerId: 1,
        clientX: 150,
        clientY: 150,
      });
      lineHandleHandler.handlePointerMove(moveEvent);

      const upEvent = createPointerEvent('pointerup', {
        pointerType: 'touch',
        pointerId: 1,
      });
      lineHandleHandler.handlePointerUp(upEvent);

      expect(mockState.isLineHandleDragging).toBe(false);
      expect(mockCore.rerender).toHaveBeenCalled();
    });

    it('should handle pen pointer up', () => {
      const downEvent = createPointerEvent('pointerdown', {
        pointerType: 'pen',
        pointerId: 1,
        clientX: 100,
        clientY: 100,
      });
      lineHandleHandler.handlePointerDown(downEvent);

      const moveEvent = createPointerEvent('pointermove', {
        pointerType: 'pen',
        pointerId: 1,
        clientX: 150,
        clientY: 150,
      });
      lineHandleHandler.handlePointerMove(moveEvent);

      const upEvent = createPointerEvent('pointerup', {
        pointerType: 'pen',
        pointerId: 1,
      });
      lineHandleHandler.handlePointerUp(upEvent);

      expect(mockState.isLineHandleDragging).toBe(false);
      expect(mockCore.rerender).toHaveBeenCalled();
    });
  });
});
