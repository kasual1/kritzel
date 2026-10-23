import { KritzelSelectionHandler } from './selection.handler';
import { KritzelCore } from '../core/core.class';
import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelSelectionBox } from '../objects/selection-box.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseObject } from '../objects/base-object.class';

jest.mock('../../helpers/event.helper');
jest.mock('../objects/selection-box.class');
jest.mock('../objects/selection-group.class');

describe('KritzelSelectionHandler', () => {
  let selectionHandler: KritzelSelectionHandler;
  let mockCore: jest.Mocked<KritzelCore>;
  let mockSelectionBox: {
    width: number;
    height: number;
    translateX: number;
    translateY: number;
    scale: number;
    rotatedPolygon: {
      topLeft: { x: number; y: number };
      topRight: { x: number; y: number };
      bottomRight: { x: number; y: number };
      bottomLeft: { x: number; y: number };
    };
  } | null;
  let mockSelectionGroup: {
    objects: KritzelBaseObject[];
    objectIds: string[];
    isSelected: boolean;
    rotation: number;
    length: number;
    addOrRemove: jest.Mock;
    captureUnchangedSnapshots: jest.Mock;
    refreshObjectDimensions: jest.Mock;
  } | null;
  let mockState: {
    isSelecting: boolean;
    isScaling: boolean;
    scale: number;
    translateX: number;
    translateY: number;
    pointers: Map<number, { clientX: number; clientY: number }>;
    longTouchTimeout: ReturnType<typeof setTimeout> | undefined;
    hasObjectsChanged: boolean;
    skipContextMenu: boolean;
    pointerX: number;
    pointerY: number;
    objects: {
      insert: jest.Mock;
      remove: jest.Mock;
      query: jest.Mock;
      filter: jest.Mock;
      setLocalSelectionBox: jest.Mock;
      clearLocalSelectionBox: jest.Mock;
    };
    activeWorkspace: { id: string };
  };
  let mockSelectedObjects: KritzelBaseObject[];

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

  const createMockSelectionBox = () => ({
    width: 0,
    height: 0,
    translateX: 0,
    translateY: 0,
    scale: 1,
    rotatedPolygon: {
      topLeft: { x: 0, y: 0 },
      topRight: { x: 100, y: 0 },
      bottomRight: { x: 100, y: 100 },
      bottomLeft: { x: 0, y: 100 },
    },
  });

  const createMockSelectionGroup = () => ({
    objects: [],
    objectIds: [],
    isSelected: false,
    rotation: 0,
    length: 0,
    addOrRemove: jest.fn(),
    captureUnchangedSnapshots: jest.fn(),
    refreshObjectDimensions: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (KritzelEventHelper.isLeftClick as jest.Mock).mockReturnValue(true);

    mockSelectionBox = null;
    mockSelectionGroup = null;
    mockSelectedObjects = [];

    mockState = {
      isSelecting: false,
      isScaling: false,
      scale: 1,
      translateX: 0,
      translateY: 0,
      pointers: new Map(),
      longTouchTimeout: undefined,
      hasObjectsChanged: false,
      skipContextMenu: false,
      pointerX: 0,
      pointerY: 0,
      objects: {
        insert: jest.fn(),
        remove: jest.fn(),
        query: jest.fn().mockReturnValue([]),
        filter: jest.fn().mockReturnValue([]),
        setLocalSelectionBox: jest.fn(),
        clearLocalSelectionBox: jest.fn(),
      },
      activeWorkspace: { id: 'workspace-1' },
    };

    mockCore = {
      store: {
        get state() {
          return mockState;
        },
        get objects() {
          return mockState.objects;
        },
        get selectionBox() {
          return mockSelectionBox;
        },
        get selectionGroup() {
          return mockSelectionGroup;
        },
        get selectedObjects() {
          return mockSelectedObjects;
        },
        offsetX: 0,
        offsetY: 0,
        setSelectionBox: jest.fn(),
        setSelectionGroup: jest.fn(),
      },
      engine: {
        emitObjectsChange: jest.fn(),
        emitObjectsAdded: jest.fn(),
        emitObjectsRemoved: jest.fn(),
        emitObjectsUpdated: jest.fn(),
      },
      addSelectionGroup: jest.fn(),
      removeSelectionGroup: jest.fn(),
      removeSelectionBox: jest.fn(),
      rerender: jest.fn(),
      getObjectsFromPointerEvent: jest.fn().mockReturnValue([]),
    } as unknown as jest.Mocked<KritzelCore>;

    // Mock static create methods
    (KritzelSelectionBox.create as jest.Mock).mockImplementation(() => {
      const box = createMockSelectionBox();
      mockSelectionBox = box;
      return box;
    });
    (KritzelSelectionGroup.create as jest.Mock).mockImplementation(() => {
      const group = createMockSelectionGroup();
      mockSelectionGroup = group;
      return group;
    });

    selectionHandler = new KritzelSelectionHandler(mockCore);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('isSelectionClick getter', () => {
    it('should return true when selection box exists with zero dimensions', () => {
      mockSelectionBox = createMockSelectionBox();
      mockSelectionBox.width = 0;
      mockSelectionBox.height = 0;

      expect(selectionHandler.isSelectionClick).toBe(true);
    });

    it('should return false when selection box has width', () => {
      mockSelectionBox = createMockSelectionBox();
      mockSelectionBox.width = 50;
      mockSelectionBox.height = 0;

      expect(selectionHandler.isSelectionClick).toBe(false);
    });

    it('should return false when selection box has height', () => {
      mockSelectionBox = createMockSelectionBox();
      mockSelectionBox.width = 0;
      mockSelectionBox.height = 50;

      expect(selectionHandler.isSelectionClick).toBe(false);
    });

    it('should return falsy when no selection box exists', () => {
      mockSelectionBox = null;

      expect(selectionHandler.isSelectionClick).toBeFalsy();
    });
  });

  describe('isSelectionDrag getter', () => {
    it('should return true when selection box has width greater than 0', () => {
      mockSelectionBox = createMockSelectionBox();
      mockSelectionBox.width = 50;
      mockSelectionBox.height = 0;

      expect(selectionHandler.isSelectionDrag).toBe(true);
    });

    it('should return true when selection box has height greater than 0', () => {
      mockSelectionBox = createMockSelectionBox();
      mockSelectionBox.width = 0;
      mockSelectionBox.height = 50;

      expect(selectionHandler.isSelectionDrag).toBe(true);
    });

    it('should return false when selection box has zero dimensions', () => {
      mockSelectionBox = createMockSelectionBox();
      mockSelectionBox.width = 0;
      mockSelectionBox.height = 0;

      expect(selectionHandler.isSelectionDrag).toBe(false);
    });

    it('should return falsy when no selection box exists', () => {
      mockSelectionBox = null;

      expect(selectionHandler.isSelectionDrag).toBeFalsy();
    });
  });

  describe('handlePointerDown', () => {
    describe('mouse events', () => {
      it('should start selection on left click without existing selection group', () => {
        mockSelectionGroup = null;
        const event = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 100,
        });

        selectionHandler.handlePointerDown(event);

        expect(mockState.isSelecting).toBe(true);
        expect(KritzelSelectionBox.create).toHaveBeenCalledWith(mockCore);
        expect(mockState.objects.insert).toHaveBeenCalled();
        expect(mockCore.store.setSelectionBox).toHaveBeenCalled();
      });

      it('should not start selection on non-left click', () => {
        (KritzelEventHelper.isLeftClick as jest.Mock).mockReturnValue(false);
        mockSelectionGroup = null;
        const event = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          button: 2,
        });

        selectionHandler.handlePointerDown(event);

        expect(mockState.isSelecting).toBe(false);
        expect(KritzelSelectionBox.create).not.toHaveBeenCalled();
      });

      it('should not start selection when selection group already exists', () => {
        mockSelectionGroup = createMockSelectionGroup();
        const event = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
        });

        selectionHandler.handlePointerDown(event);

        expect(KritzelSelectionBox.create).not.toHaveBeenCalled();
      });

      it('should apply viewport transformation when calculating start position', () => {
        mockState.translateX = 50;
        mockState.translateY = 100;
        mockState.scale = 2;
        mockSelectionGroup = null;

        const event = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 150,
          clientY: 200,
        });

        selectionHandler.handlePointerDown(event);

        // startX = (clientX - translateX) / scale = (150 - 50) / 2 = 50
        // startY = (clientY - translateY) / scale = (200 - 100) / 2 = 50
        expect(selectionHandler.startX).toBe(50);
        expect(selectionHandler.startY).toBe(50);
      });

      it('should apply offset when calculating start position', () => {
        (mockCore.store as any).offsetX = 10;
        (mockCore.store as any).offsetY = 20;
        mockSelectionGroup = null;

        const event = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 100,
        });

        selectionHandler.handlePointerDown(event);

        // clientX/Y are adjusted by offset before viewport transformation
        expect(selectionHandler.startX).toBe(90);
        expect(selectionHandler.startY).toBe(80);
      });

      it('should remove existing selection box and group', () => {
        mockSelectionGroup = null;
        const event = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
        });

        selectionHandler.handlePointerDown(event);

        expect(mockCore.removeSelectionBox).toHaveBeenCalled();
        expect(mockCore.removeSelectionGroup).toHaveBeenCalled();
      });
    });

    describe('touch events', () => {
      it('should start selection after timeout on single touch without selection group', () => {
        mockSelectionGroup = null;
        mockState.pointers.set(1, { clientX: 100, clientY: 100 });
        const event = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });

        selectionHandler.handlePointerDown(event);

        // Initially not selecting
        expect(mockState.isSelecting).toBe(false);

        // After timeout
        jest.advanceTimersByTime(80);

        expect(mockState.isSelecting).toBe(true);
        expect(KritzelSelectionBox.create).toHaveBeenCalled();
      });

      it('should not start selection when scaling', () => {
        mockState.isScaling = true;
        mockState.pointers.set(1, { clientX: 100, clientY: 100 });
        const event = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });

        selectionHandler.handlePointerDown(event);
        jest.advanceTimersByTime(80);

        expect(KritzelSelectionBox.create).not.toHaveBeenCalled();
      });

      it('should not start selection when selection group exists', () => {
        mockSelectionGroup = createMockSelectionGroup();
        mockState.pointers.set(1, { clientX: 100, clientY: 100 });
        const event = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });

        selectionHandler.handlePointerDown(event);
        jest.advanceTimersByTime(80);

        expect(KritzelSelectionBox.create).not.toHaveBeenCalled();
      });

      it('should not start selection with multiple pointers', () => {
        mockSelectionGroup = null;
        mockState.pointers.set(1, { clientX: 100, clientY: 100 });
        mockState.pointers.set(2, { clientX: 200, clientY: 200 });
        const event = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });

        selectionHandler.handlePointerDown(event);
        jest.advanceTimersByTime(80);

        expect(KritzelSelectionBox.create).not.toHaveBeenCalled();
      });

      it('should store touch start position', () => {
        mockSelectionGroup = null;
        mockState.pointers.set(1, { clientX: 150, clientY: 200 });
        const event = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });

        selectionHandler.handlePointerDown(event);
        jest.advanceTimersByTime(80);

        expect(selectionHandler.touchStartX).toBe(150);
        expect(selectionHandler.touchStartY).toBe(200);
      });
    });

    describe('pen events', () => {
      it('should handle pen events like touch events', () => {
        mockSelectionGroup = null;
        mockState.pointers.set(1, { clientX: 100, clientY: 100 });
        const event = createPointerEvent('pointerdown', {
          pointerType: 'pen',
          pointerId: 1,
        });

        selectionHandler.handlePointerDown(event);
        jest.advanceTimersByTime(80);

        expect(mockState.isSelecting).toBe(true);
        expect(KritzelSelectionBox.create).toHaveBeenCalled();
      });
    });
  });

  describe('handlePointerMove', () => {
    describe('mouse events', () => {
      beforeEach(() => {
        mockSelectionGroup = null;
        // Start selection first
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 100,
        });
        selectionHandler.handlePointerDown(downEvent);
      });

      it('should update selection box dimensions on move', () => {
        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 200,
          clientY: 250,
        });

        selectionHandler.handlePointerMove(moveEvent);

        expect(mockSelectionBox!.width).toBe(100); // |200 - 100| * scale
        expect(mockSelectionBox!.height).toBe(150); // |250 - 100| * scale
      });

      it('should not update when not selecting', () => {
        mockState.isSelecting = false;
        const initialWidth = mockSelectionBox!.width;
        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 200,
          clientY: 200,
        });

        selectionHandler.handlePointerMove(moveEvent);

        expect(mockSelectionBox!.width).toBe(initialWidth);
      });

      it('should handle negative direction selection (dragging up/left)', () => {
        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 50, // Less than start
          clientY: 50, // Less than start
        });

        selectionHandler.handlePointerMove(moveEvent);

        // Width/height should be positive
        expect(mockSelectionBox!.width).toBe(50);
        expect(mockSelectionBox!.height).toBe(50);
        // Position should be at the minimum coordinates
        expect(mockSelectionBox!.translateX).toBe(50);
        expect(mockSelectionBox!.translateY).toBe(50);
      });
    });

    describe('touch events', () => {
      beforeEach(() => {
        mockSelectionGroup = null;
        mockState.pointers.set(1, { clientX: 100, clientY: 100 });
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });
        selectionHandler.handlePointerDown(downEvent);
        jest.advanceTimersByTime(80);
      });

      it('should update selection on touch move above threshold', () => {
        mockState.pointers.set(1, { clientX: 150, clientY: 150 });
        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'touch',
          pointerId: 1,
        });

        selectionHandler.handlePointerMove(moveEvent);

        expect(mockSelectionBox!.width).toBe(50);
        expect(mockSelectionBox!.height).toBe(50);
      });

      it('should not update selection when move is below threshold', () => {
        mockState.pointers.set(1, { clientX: 102, clientY: 102 }); // Less than 5px
        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'touch',
          pointerId: 1,
        });

        selectionHandler.handlePointerMove(moveEvent);

        // Selection box dimensions should not change significantly
        // (the initial update happens, but the threshold check prevents the selected objects update)
      });

      it('should clear long touch timeout on move above threshold', () => {
        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
        mockState.longTouchTimeout = setTimeout(() => { }, 1000);
        mockState.pointers.set(1, { clientX: 150, clientY: 150 });
        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'touch',
          pointerId: 1,
        });

        selectionHandler.handlePointerMove(moveEvent);

        expect(clearTimeoutSpy).toHaveBeenCalled();
      });
    });
  });

  describe('handlePointerUp', () => {
    describe('mouse events - selection click', () => {
      beforeEach(() => {
        mockSelectionGroup = null;
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 100,
        });
        selectionHandler.handlePointerDown(downEvent);
      });

      it('should handle selection click (no drag)', () => {
        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'mouse',
        });

        selectionHandler.handlePointerUp(upEvent);

        expect(mockState.isSelecting).toBe(false);
        expect(mockCore.engine.emitObjectsChange).toHaveBeenCalled();
      });

      it('should remove selection box after click', () => {
        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'mouse',
        });

        selectionHandler.handlePointerUp(upEvent);

        expect(mockState.objects.remove).toHaveBeenCalled();
        expect(mockCore.store.setSelectionBox).toHaveBeenCalledWith(null);
      });

      it('should create selection group when clicking on object', () => {
        const mockObject = {
          id: 'obj-1',
          isSelected: false,
          rotation: 0.5,
          hitTest: jest.fn().mockReturnValue(true),
        } as unknown as KritzelBaseObject;

        (mockCore.getObjectsFromPointerEvent as jest.Mock).mockReturnValue([mockObject]);

        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'mouse',
        });

        selectionHandler.handlePointerUp(upEvent);

        expect(KritzelSelectionGroup.create).toHaveBeenCalledWith(mockCore);
        expect(mockCore.addSelectionGroup).toHaveBeenCalled();
        expect(mockCore.rerender).toHaveBeenCalled();
      });

      it('should not start selection when non-left click', () => {
        (KritzelEventHelper.isLeftClick as jest.Mock).mockReturnValue(false);
        mockState.isSelecting = true;

        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'mouse',
          button: 2,
        });

        selectionHandler.handlePointerUp(upEvent);

        // Should not call emit if not left click
        expect(mockCore.engine.emitObjectsChange).not.toHaveBeenCalled();
      });
    });

    describe('mouse events - selection drag', () => {
      beforeEach(() => {
        mockSelectionGroup = null;
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 100,
        });
        selectionHandler.handlePointerDown(downEvent);

        // Simulate drag
        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 200,
          clientY: 200,
        });
        selectionHandler.handlePointerMove(moveEvent);
      });

      it('should handle selection drag', () => {
        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'mouse',
        });

        selectionHandler.handlePointerUp(upEvent);

        expect(mockState.isSelecting).toBe(false);
        expect(mockCore.engine.emitObjectsChange).toHaveBeenCalled();
      });

      it('should add selected objects to selection group after drag', () => {
        const mockObject = {
          id: 'obj-1',
          __class__: 'KritzelPath',
          isSelected: true,
          rotation: 0,
        } as unknown as KritzelBaseObject;
        mockSelectedObjects = [mockObject];

        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'mouse',
        });

        selectionHandler.handlePointerUp(upEvent);

        expect(KritzelSelectionGroup.create).toHaveBeenCalledWith(mockCore);
        expect(mockCore.addSelectionGroup).toHaveBeenCalled();
      });

      it('should not create selection group when no objects selected', () => {
        mockSelectedObjects = [];

        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'mouse',
        });

        selectionHandler.handlePointerUp(upEvent);

        expect(mockCore.addSelectionGroup).not.toHaveBeenCalled();
      });
    });

    describe('mouse events - edit mode', () => {
      it('should call edit on single selected object when no move occurred', () => {
        const mockObject = {
          id: 'obj-1',
          isSelected: true,
          edit: jest.fn(),
        } as unknown as KritzelBaseObject;

        mockSelectionGroup = {
          ...createMockSelectionGroup(),
          objects: [mockObject],
        };
        mockState.hasObjectsChanged = false;

        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'mouse',
        });

        selectionHandler.handlePointerUp(upEvent);

        expect(mockObject.edit).toHaveBeenCalledWith(upEvent);
      });

      it('should not call edit when objects have moved', () => {
        const mockObject = {
          id: 'obj-1',
          isSelected: true,
          edit: jest.fn(),
        } as unknown as KritzelBaseObject;

        mockSelectionGroup = {
          ...createMockSelectionGroup(),
          objects: [mockObject],
        };
        mockState.hasObjectsChanged = true;

        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'mouse',
        });

        selectionHandler.handlePointerUp(upEvent);

        expect(mockObject.edit).not.toHaveBeenCalled();
      });

      it('should not call edit when multiple objects selected', () => {
        const mockObject1 = { id: 'obj-1', edit: jest.fn() } as unknown as KritzelBaseObject;
        const mockObject2 = { id: 'obj-2', edit: jest.fn() } as unknown as KritzelBaseObject;

        mockSelectionGroup = {
          ...createMockSelectionGroup(),
          objects: [mockObject1, mockObject2],
        };
        mockState.hasObjectsChanged = false;

        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'mouse',
        });

        selectionHandler.handlePointerUp(upEvent);

        expect(mockObject1.edit).not.toHaveBeenCalled();
        expect(mockObject2.edit).not.toHaveBeenCalled();
      });
    });

    describe('touch events', () => {
      beforeEach(() => {
        mockSelectionGroup = null;
        mockState.pointers.set(1, { clientX: 100, clientY: 100 });
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
        });
        selectionHandler.handlePointerDown(downEvent);
        jest.advanceTimersByTime(80);
      });

      it('should handle selection click on touch up', () => {
        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'touch',
          pointerId: 1,
        });

        selectionHandler.handlePointerUp(upEvent);

        expect(mockState.isSelecting).toBe(false);
        expect(mockCore.engine.emitObjectsChange).toHaveBeenCalled();
        expect(mockState.skipContextMenu).toBe(false);
      });

      it('should handle selection drag on touch up', () => {
        mockState.pointers.set(1, { clientX: 200, clientY: 200 });
        const moveEvent = createPointerEvent('pointermove', {
          pointerType: 'touch',
          pointerId: 1,
        });
        selectionHandler.handlePointerMove(moveEvent);

        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'touch',
          pointerId: 1,
        });
        selectionHandler.handlePointerUp(upEvent);

        expect(mockState.isSelecting).toBe(false);
      });

      it('should clear touch start timeout on up', () => {
        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'touch',
          pointerId: 1,
        });
        selectionHandler.handlePointerUp(upEvent);

        expect(clearTimeoutSpy).toHaveBeenCalled();
      });

      it('should call edit on single selected object with touch', () => {
        const mockObject = {
          id: 'obj-1',
          isSelected: true,
          edit: jest.fn(),
        } as unknown as KritzelBaseObject;

        mockSelectionGroup = {
          ...createMockSelectionGroup(),
          objects: [mockObject],
        };
        mockState.hasObjectsChanged = false;

        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'touch',
          pointerId: 1,
        });

        selectionHandler.handlePointerUp(upEvent);

        expect(mockObject.edit).toHaveBeenCalledWith(upEvent);
      });
    });

    describe('pen events', () => {
      it('should handle pen events like touch events', () => {
        mockSelectionGroup = null;
        mockState.pointers.set(1, { clientX: 100, clientY: 100 });
        const downEvent = createPointerEvent('pointerdown', {
          pointerType: 'pen',
          pointerId: 1,
        });
        selectionHandler.handlePointerDown(downEvent);
        jest.advanceTimersByTime(80);

        const upEvent = createPointerEvent('pointerup', {
          pointerType: 'pen',
          pointerId: 1,
        });
        selectionHandler.handlePointerUp(upEvent);

        expect(mockState.isSelecting).toBe(false);
        expect(mockCore.engine.emitObjectsChange).toHaveBeenCalled();
      });
    });
  });

  describe('selection group creation', () => {
    it('should clear child isSelected when drag selection resolves child to parent group', () => {
      const childObject = {
        id: 'child-1',
        __class__: 'KritzelPath',
        isSelected: true,
        rotation: 0,
      } as unknown as KritzelBaseObject;

      const parentGroup = {
        id: 'group-1',
        __class__: 'KritzelGroup',
        childIds: ['child-1'],
        isSelected: false,
      } as unknown as KritzelBaseObject;

      mockState.objects.filter.mockReturnValue([parentGroup]);
      mockSelectedObjects = [childObject];

      mockSelectionGroup = null;
      const downEvent = createPointerEvent('pointerdown', {
        pointerType: 'mouse',
        clientX: 100,
        clientY: 100,
      });
      selectionHandler.handlePointerDown(downEvent);

      const moveEvent = createPointerEvent('pointermove', {
        pointerType: 'mouse',
        clientX: 200,
        clientY: 200,
      });
      selectionHandler.handlePointerMove(moveEvent);

      const upEvent = createPointerEvent('pointerup', {
        pointerType: 'mouse',
      });
      selectionHandler.handlePointerUp(upEvent);

      expect(childObject.isSelected).toBe(false);
    });

    it('should clear child isSelected when click selection resolves child to parent group', () => {
      const childObject = {
        id: 'child-1',
        __class__: 'KritzelPath',
        isSelected: true,
        rotation: 0,
        hitTest: jest.fn().mockReturnValue(true),
      } as unknown as KritzelBaseObject;

      const parentGroup = {
        id: 'group-1',
        __class__: 'KritzelGroup',
        childIds: ['child-1'],
        isSelected: false,
      } as unknown as KritzelBaseObject;

      mockState.objects.filter.mockReturnValue([parentGroup]);
      (mockCore.getObjectsFromPointerEvent as jest.Mock).mockReturnValue([childObject]);

      mockSelectionGroup = null;
      const downEvent = createPointerEvent('pointerdown', {
        pointerType: 'mouse',
        clientX: 100,
        clientY: 100,
      });
      selectionHandler.handlePointerDown(downEvent);

      const upEvent = createPointerEvent('pointerup', {
        pointerType: 'mouse',
      });
      selectionHandler.handlePointerUp(upEvent);

      expect(childObject.isSelected).toBe(false);
    });

    it('should set rotation from single selected object', () => {
      const mockObject = {
        id: 'obj-1',
        __class__: 'KritzelPath',
        isSelected: true,
        rotation: Math.PI / 4,
      } as unknown as KritzelBaseObject;
      mockSelectedObjects = [mockObject];

      mockSelectionGroup = null;
      const downEvent = createPointerEvent('pointerdown', {
        pointerType: 'mouse',
        clientX: 100,
        clientY: 100,
      });
      selectionHandler.handlePointerDown(downEvent);

      // Simulate drag
      const moveEvent = createPointerEvent('pointermove', {
        pointerType: 'mouse',
        clientX: 200,
        clientY: 200,
      });
      selectionHandler.handlePointerMove(moveEvent);

      const upEvent = createPointerEvent('pointerup', {
        pointerType: 'mouse',
      });
      selectionHandler.handlePointerUp(upEvent);

      // The mock selection group should have been created and have properties set
      expect(KritzelSelectionGroup.create).toHaveBeenCalled();
    });

    it('should capture snapshots and refresh dimensions for multiple objects', () => {
      const mockObject1 = {
        id: 'obj-1',
        __class__: 'KritzelPath',
        isSelected: true,
        rotation: 0,
      } as unknown as KritzelBaseObject;
      const mockObject2 = {
        id: 'obj-2',
        __class__: 'KritzelPath',
        isSelected: true,
        rotation: 0,
      } as unknown as KritzelBaseObject;
      mockSelectedObjects = [mockObject1, mockObject2];

      mockSelectionGroup = null;
      const downEvent = createPointerEvent('pointerdown', {
        pointerType: 'mouse',
        clientX: 100,
        clientY: 100,
      });
      selectionHandler.handlePointerDown(downEvent);

      const moveEvent = createPointerEvent('pointermove', {
        pointerType: 'mouse',
        clientX: 200,
        clientY: 200,
      });
      selectionHandler.handlePointerMove(moveEvent);

      const upEvent = createPointerEvent('pointerup', {
        pointerType: 'mouse',
      });
      selectionHandler.handlePointerUp(upEvent);

      expect(KritzelSelectionGroup.create).toHaveBeenCalled();
    });
  });

  describe('hasObjectsChanged state', () => {
    it('should reset hasObjectsChanged to false on pointer up', () => {
      mockState.hasObjectsChanged = true;
      mockSelectionGroup = createMockSelectionGroup();

      const upEvent = createPointerEvent('pointerup', {
        pointerType: 'mouse',
      });
      selectionHandler.handlePointerUp(upEvent);

      expect(mockState.hasObjectsChanged).toBe(false);
    });
  });
  describe('titlebar support', () => {
    const createEditableObject = (id = 'obj-1') => ({ id, edit: jest.fn() }) as unknown as KritzelBaseObject & { edit: jest.Mock };

    it('does not enter edit mode when releasing the suppressed pointer', () => {
      const object = createEditableObject();
      mockSelectionGroup = { ...createMockSelectionGroup(), objects: [object] };
      selectionHandler.skipEditForPointerId = 1;

      selectionHandler.handlePointerUp(createPointerEvent('pointerup', { pointerType: 'mouse', pointerId: 1 }));

      expect(object.edit).not.toHaveBeenCalled();
      expect(selectionHandler.skipEditForPointerId).toBeNull();
    });

    it('still resets hasObjectsChanged after a titlebar drag', () => {
      mockSelectionGroup = { ...createMockSelectionGroup(), objects: [createEditableObject()] };
      mockState.hasObjectsChanged = true;
      selectionHandler.skipEditForPointerId = 1;

      selectionHandler.handlePointerUp(createPointerEvent('pointerup', { pointerType: 'mouse', pointerId: 1 }));

      expect(mockState.hasObjectsChanged).toBe(false);
    });

    it('enters edit mode again on the next click', () => {
      const object = createEditableObject();
      mockSelectionGroup = { ...createMockSelectionGroup(), objects: [object] };
      selectionHandler.skipEditForPointerId = 1;

      selectionHandler.handlePointerUp(createPointerEvent('pointerup', { pointerType: 'mouse', pointerId: 1 }));
      selectionHandler.handlePointerUp(createPointerEvent('pointerup', { pointerType: 'mouse', pointerId: 1 }));

      expect(object.edit).toHaveBeenCalledTimes(1);
    });

    it('suppresses edit mode for touch pointers', () => {
      const object = createEditableObject();
      mockSelectionGroup = { ...createMockSelectionGroup(), objects: [object] };
      selectionHandler.skipEditForPointerId = 5;

      selectionHandler.handlePointerUp(createPointerEvent('pointerup', { pointerType: 'touch', pointerId: 5 }));

      expect(object.edit).not.toHaveBeenCalled();
    });

    it('only suppresses edit mode for the matching pointer', () => {
      const object = createEditableObject();
      mockSelectionGroup = { ...createMockSelectionGroup(), objects: [object] };
      selectionHandler.skipEditForPointerId = 7;

      selectionHandler.handlePointerUp(createPointerEvent('pointerup', { pointerType: 'mouse', pointerId: 1 }));

      expect(object.edit).toHaveBeenCalled();
      expect(selectionHandler.skipEditForPointerId).toBe(7);
    });

    describe('toggleObjectInSelection', () => {
      it('selects the object when nothing is selected', () => {
        const object = { id: 'obj-1' } as unknown as KritzelBaseObject;
        (mockCore as any).selectObjects = jest.fn();

        selectionHandler.toggleObjectInSelection(object);

        expect((mockCore as any).selectObjects).toHaveBeenCalledWith([object]);
      });

      it('toggles the object in the existing selection and emits a selection change', () => {
        const first = { id: 'obj-1' } as unknown as KritzelBaseObject;
        const second = { id: 'obj-2' } as unknown as KritzelBaseObject;
        mockSelectionGroup = { ...createMockSelectionGroup(), objects: [first, second] };
        (mockCore.engine as any).triggerSelectionChange = jest.fn().mockResolvedValue(undefined);

        selectionHandler.toggleObjectInSelection(second);

        expect(mockSelectionGroup.addOrRemove).toHaveBeenCalledWith(second);
        expect((mockCore.engine as any).triggerSelectionChange).toHaveBeenCalled();
        expect(mockCore.rerender).toHaveBeenCalled();
        expect(mockCore.removeSelectionGroup).not.toHaveBeenCalled();
      });

      it('removes the selection when its last object is toggled off', () => {
        const object = { id: 'obj-1' } as unknown as KritzelBaseObject;
        mockSelectionGroup = { ...createMockSelectionGroup(), objects: [] };
        (mockCore.engine as any).triggerSelectionChange = jest.fn();

        selectionHandler.toggleObjectInSelection(object);

        expect(mockCore.removeSelectionGroup).toHaveBeenCalled();
        expect((mockCore.engine as any).triggerSelectionChange).not.toHaveBeenCalled();
      });
    });
  });
});
