import { KritzelAnchorManager } from './anchor.manager';
import { KritzelCore } from '../core/core.class';
import { KritzelLine } from '../objects/line.class';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelSelectionBox } from '../objects/selection-box.class';
import { KritzelGeometryHelper } from '../../helpers/geometry.helper';
import { KritzelClassHelper } from '../../helpers/class.helper';
import { SnapCandidate, SnapPreviewCandidate } from '../../interfaces/anchor.interface';
import { KritzelPolygon } from '../../interfaces/polygon.interface';

jest.mock('../core/core.class');
jest.mock('../objects/line.class');
jest.mock('../objects/base-object.class');
jest.mock('../objects/selection-box.class');
jest.mock('../objects/selection-group.class');
jest.mock('../objects/shape.class');
jest.mock('../objects/path.class');
jest.mock('../../helpers/geometry.helper');
jest.mock('../../helpers/class.helper');

describe('KritzelAnchorManager', () => {
  let manager: KritzelAnchorManager;
  let mockCore: any;
  let mockObjectsMap: any;
  let mockState: any;

  const createMockLine = (overrides: Partial<KritzelLine> = {}): KritzelLine => {
    const line = Object.create(KritzelLine.prototype) as KritzelLine;
    Object.assign(line, {
      __class__: 'KritzelLine',
      id: 'line-1',
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 100,
      controlX: undefined,
      controlY: undefined,
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      padding: 0,
      translateX: 0,
      translateY: 0,
      scale: 1,
      rotation: 0,
      strokeWidth: 4,
      startAnchor: undefined,
      endAnchor: undefined,
      arrows: undefined,
      isVisible: true,
      zIndex: 1,
      updateEndpoint: jest.fn(),
      getArrowSize: jest.fn().mockReturnValue(12),
      ...overrides,
    });
    Object.defineProperties(line, {
      totalWidth: { get() { return this.width + this.padding * 2; } },
      totalHeight: { get() { return this.height + this.padding * 2; } },
      centerX: { get() { return this.translateX + this.totalWidth / 2 / this.scale; } },
      centerY: { get() { return this.translateY + this.totalHeight / 2 / this.scale; } },
      d: {
        get() {
          if (this.controlX !== undefined && this.controlY !== undefined) {
            return `M ${this.startX} ${this.startY} Q ${this.controlX} ${this.controlY} ${this.endX} ${this.endY}`;
          }
          return `M ${this.startX} ${this.startY} L ${this.endX} ${this.endY}`;
        },
      },
      hasStartArrow: { get() { return this.arrows?.start?.enabled === true; } },
      hasEndArrow: { get() { return this.arrows?.end?.enabled === true; } },
      rotatedPolygon: {
        get(): KritzelPolygon {
          return {
            topLeft: { x: this.translateX, y: this.translateY },
            topRight: { x: this.translateX + this.totalWidth / this.scale, y: this.translateY },
            bottomRight: { x: this.translateX + this.totalWidth / this.scale, y: this.translateY + this.totalHeight / this.scale },
            bottomLeft: { x: this.translateX, y: this.translateY + this.totalHeight / this.scale },
          };
        },
      },
    });
    return line;
  };

  const createMockObject = (overrides: Partial<KritzelBaseObject<Element>> = {}): KritzelBaseObject<Element> => {
    const obj = {
      __class__: 'KritzelBaseObject',
      id: 'obj-1',
      x: 0,
      y: 0,
      width: 50,
      height: 50,
      padding: 0,
      translateX: 100,
      translateY: 100,
      scale: 1,
      rotation: 0,
      zIndex: 0,
      isVisible: true,
      get totalWidth() { return this.width + this.padding * 2; },
      get totalHeight() { return this.height + this.padding * 2; },
      get centerX() { return this.translateX + this.totalWidth / 2 / this.scale; },
      get centerY() { return this.translateY + this.totalHeight / 2 / this.scale; },
      get rotatedPolygon(): KritzelPolygon {
        return {
          topLeft: { x: this.translateX, y: this.translateY },
          topRight: { x: this.translateX + this.totalWidth / this.scale, y: this.translateY },
          bottomRight: { x: this.translateX + this.totalWidth / this.scale, y: this.translateY + this.totalHeight / this.scale },
          bottomLeft: { x: this.translateX, y: this.translateY + this.totalHeight / this.scale },
        };
      },
    };
    return Object.assign(obj, overrides) as unknown as KritzelBaseObject<Element>;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockObjectsMap = {
      filter: jest.fn().mockReturnValue([]),
      update: jest.fn().mockReturnValue(true),
    };

    mockState = {
      objects: mockObjectsMap,
      scale: 1,
      snapCandidate: null,
      snapPreviewCandidate: null,
      isDragging: false,
    };

    mockCore = {
      store: {
        get state() { return mockState; },
        get objects() { return mockState.objects; },
        allObjects: [],
        allNonSelectionObjects: [],
        selectionGroup: null,
        get currentZIndex() { return 1; },
      },
      rerender: jest.fn(),
    } as unknown as jest.Mocked<KritzelCore>;

    manager = new KritzelAnchorManager(mockCore);

    // Default: KritzelClassHelper.isInstanceOf compares __class__ like the real implementation
    (KritzelClassHelper.isInstanceOf as unknown as jest.Mock).mockImplementation(
      (object: any, className: string) => !!object && object.__class__ === className,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // Anchor CRUD Operations
  // ============================================

  describe('setAnchor', () => {
    it('should set an anchor from a line endpoint to a target object', () => {
      const line = createMockLine({ id: 'line-1' });
      const targetObject = createMockObject({ id: 'obj-1' });
      mockObjectsMap.filter
        .mockReturnValueOnce([line])   // getLineById in removeAnchor (no existing anchor)
        .mockReturnValueOnce([line])   // getLineById for setting anchor
        .mockReturnValueOnce([targetObject]); // getObjectById in snapEndpointToObject

      // First call is for removeAnchor -> getLineById
      // We need the filter to return the line for the initial getLineById call
      mockObjectsMap.filter.mockReset();
      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line)) return [line];
        if (fn(targetObject)) return [targetObject];
        return [];
      });

      manager.setAnchor('line-1', 'start', 'obj-1');

      expect(line.startAnchor).toEqual({ objectId: 'obj-1' });
      expect(line.updateEndpoint).toHaveBeenCalledWith('start', expect.any(Number), expect.any(Number));
      expect(mockObjectsMap.update).toHaveBeenCalledWith(line);
    });

    it('should set an anchor on the end endpoint', () => {
      const line = createMockLine({ id: 'line-1' });
      const targetObject = createMockObject({ id: 'obj-1' });
      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line)) return [line];
        if (fn(targetObject)) return [targetObject];
        return [];
      });

      manager.setAnchor('line-1', 'end', 'obj-1');

      expect(line.endAnchor).toEqual({ objectId: 'obj-1' });
      expect(line.updateEndpoint).toHaveBeenCalledWith('end', expect.any(Number), expect.any(Number));
    });

    it('should not set anchor if line is not found', () => {
      mockObjectsMap.filter.mockReturnValue([]);

      manager.setAnchor('nonexistent', 'start', 'obj-1');

      expect(mockObjectsMap.update).not.toHaveBeenCalled();
    });

    it('should prevent anchoring both endpoints to the same object (start already anchored)', () => {
      const line = createMockLine({
        id: 'line-1',
        endAnchor: { objectId: 'obj-1' },
      });
      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line)) return [line];
        return [];
      });

      manager.setAnchor('line-1', 'start', 'obj-1');

      expect(line.startAnchor).toBeUndefined();
    });

    it('should prevent anchoring both endpoints to the same object (end already anchored)', () => {
      const line = createMockLine({
        id: 'line-1',
        startAnchor: { objectId: 'obj-1' },
      });
      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line)) return [line];
        return [];
      });

      manager.setAnchor('line-1', 'end', 'obj-1');

      expect(line.endAnchor).toBeUndefined();
    });

    it('should remove existing anchor before setting a new one', () => {
      const line = createMockLine({
        id: 'line-1',
        startAnchor: { objectId: 'old-obj' },
      });
      const newTarget = createMockObject({ id: 'new-obj' });
      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line)) return [line];
        if (fn(newTarget)) return [newTarget];
        return [];
      });

      // First, register the old anchor in the index
      manager.setAnchor('line-1', 'start', 'new-obj');

      expect(line.startAnchor).toEqual({ objectId: 'new-obj' });
    });
  });

  describe('removeAnchor', () => {
    it('should remove an existing start anchor', () => {
      const line = createMockLine({
        id: 'line-1',
        startAnchor: { objectId: 'obj-1' },
      });
      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line)) return [line];
        return [];
      });

      manager.removeAnchor('line-1', 'start');

      expect(line.startAnchor).toBeUndefined();
    });

    it('should remove an existing end anchor', () => {
      const line = createMockLine({
        id: 'line-1',
        endAnchor: { objectId: 'obj-1' },
      });
      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line)) return [line];
        return [];
      });

      manager.removeAnchor('line-1', 'end');

      expect(line.endAnchor).toBeUndefined();
    });

    it('should do nothing if line is not found', () => {
      mockObjectsMap.filter.mockReturnValue([]);

      manager.removeAnchor('nonexistent', 'start');
      // No error thrown
    });

    it('should do nothing if no anchor exists on the endpoint', () => {
      const line = createMockLine({ id: 'line-1' });
      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line)) return [line];
        return [];
      });

      manager.removeAnchor('line-1', 'start');

      expect(line.startAnchor).toBeUndefined();
    });
  });

  describe('getAnchor', () => {
    it('should return the start anchor of a line', () => {
      const line = createMockLine({
        id: 'line-1',
        startAnchor: { objectId: 'obj-1' },
      });
      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line)) return [line];
        return [];
      });

      const anchor = manager.getAnchor('line-1', 'start');

      expect(anchor).toEqual({ objectId: 'obj-1' });
    });

    it('should return the end anchor of a line', () => {
      const line = createMockLine({
        id: 'line-1',
        endAnchor: { objectId: 'obj-2' },
      });
      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line)) return [line];
        return [];
      });

      const anchor = manager.getAnchor('line-1', 'end');

      expect(anchor).toEqual({ objectId: 'obj-2' });
    });

    it('should return null if line has no anchor on specified endpoint', () => {
      const line = createMockLine({ id: 'line-1' });
      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line)) return [line];
        return [];
      });

      const anchor = manager.getAnchor('line-1', 'start');

      expect(anchor).toBeNull();
    });

    it('should return null if line is not found', () => {
      mockObjectsMap.filter.mockReturnValue([]);

      const anchor = manager.getAnchor('nonexistent', 'start');

      expect(anchor).toBeNull();
    });
  });

  // ============================================
  // Query Operations
  // ============================================

  describe('getLinesAnchoredTo', () => {
    it('should return empty array when no lines are anchored to an object', () => {
      const result = manager.getLinesAnchoredTo('obj-1');

      expect(result).toEqual([]);
    });

    it('should return anchored lines after setAnchor', () => {
      const line = createMockLine({ id: 'line-1' });
      const targetObject = createMockObject({ id: 'obj-1' });
      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line)) return [line];
        if (fn(targetObject)) return [targetObject];
        return [];
      });

      manager.setAnchor('line-1', 'start', 'obj-1');

      const result = manager.getLinesAnchoredTo('obj-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ lineId: 'line-1', endpoint: 'start' });
    });

    it('should return multiple entries when multiple lines are anchored', () => {
      const line1 = createMockLine({ id: 'line-1' });
      const line2 = createMockLine({ id: 'line-2' });
      const targetObject = createMockObject({ id: 'obj-1' });
      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line1)) return [line1];
        if (fn(line2)) return [line2];
        if (fn(targetObject)) return [targetObject];
        return [];
      });

      manager.setAnchor('line-1', 'start', 'obj-1');
      manager.setAnchor('line-2', 'end', 'obj-1');

      const result = manager.getLinesAnchoredTo('obj-1');

      expect(result).toHaveLength(2);
    });
  });

  // ============================================
  // Position Updates
  // ============================================

  describe('updateAnchorsForObject', () => {
    it('should do nothing when no lines are anchored to the object', () => {
      manager.updateAnchorsForObject('obj-1');

      // No errors, no calls to update
      expect(mockObjectsMap.filter).not.toHaveBeenCalled();
    });

    it('should update anchored line endpoints when object moves', () => {
      const line = createMockLine({ id: 'line-1' });
      const targetObject = createMockObject({ id: 'obj-1', translateX: 100, translateY: 100 });
      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line)) return [line];
        if (fn(targetObject)) return [targetObject];
        return [];
      });

      // Set up anchor first
      manager.setAnchor('line-1', 'start', 'obj-1');
      jest.clearAllMocks();
      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line)) return [line];
        if (fn(targetObject)) return [targetObject];
        return [];
      });

      // Now update when object moves
      manager.updateAnchorsForObject('obj-1');

      expect(line.updateEndpoint).toHaveBeenCalledWith('start', expect.any(Number), expect.any(Number));
    });

    it('should skip lines that no longer exist', () => {
      const line = createMockLine({ id: 'line-1' });
      const targetObject = createMockObject({ id: 'obj-1' });
      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line)) return [line];
        if (fn(targetObject)) return [targetObject];
        return [];
      });

      manager.setAnchor('line-1', 'start', 'obj-1');
      jest.clearAllMocks();

      // Now the line is gone
      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(targetObject)) return [targetObject];
        return [];
      });

      // Should not throw
      manager.updateAnchorsForObject('obj-1');
    });

    it('should refresh selection group dimensions locally while dragging when external anchored lines are selected', () => {
      const line = createMockLine({ id: 'line-1' });
      const targetObject = createMockObject({ id: 'obj-1', translateX: 100, translateY: 100 });
      const selectionGroup = {
        hasExternalAnchoredLineConnections: jest.fn().mockReturnValue(true),
        refreshObjectDimensions: jest.fn(),
      };

      mockCore.store.selectionGroup = selectionGroup;
      mockState.isDragging = true;

      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line)) return [line];
        if (fn(targetObject)) return [targetObject];
        return [];
      });

      manager.setAnchor('line-1', 'start', 'obj-1');
      jest.clearAllMocks();

      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line)) return [line];
        if (fn(targetObject)) return [targetObject];
        return [];
      });

      manager.updateAnchorsForObject('obj-1');

      expect(selectionGroup.hasExternalAnchoredLineConnections).toHaveBeenCalled();
      expect(selectionGroup.refreshObjectDimensions).toHaveBeenCalledWith(undefined, true);
    });

    it('should not refresh selection group dimensions when not dragging', () => {
      const line = createMockLine({ id: 'line-1' });
      const targetObject = createMockObject({ id: 'obj-1', translateX: 100, translateY: 100 });
      const selectionGroup = {
        hasExternalAnchoredLineConnections: jest.fn().mockReturnValue(true),
        refreshObjectDimensions: jest.fn(),
      };

      mockCore.store.selectionGroup = selectionGroup;
      mockState.isDragging = false;

      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line)) return [line];
        if (fn(targetObject)) return [targetObject];
        return [];
      });

      manager.setAnchor('line-1', 'start', 'obj-1');
      jest.clearAllMocks();

      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line)) return [line];
        if (fn(targetObject)) return [targetObject];
        return [];
      });

      manager.updateAnchorsForObject('obj-1');

      expect(selectionGroup.hasExternalAnchoredLineConnections).not.toHaveBeenCalled();
      expect(selectionGroup.refreshObjectDimensions).not.toHaveBeenCalled();
    });

    it('should not refresh selection group dimensions when no external anchored lines are selected', () => {
      const line = createMockLine({ id: 'line-1' });
      const targetObject = createMockObject({ id: 'obj-1', translateX: 100, translateY: 100 });
      const selectionGroup = {
        hasExternalAnchoredLineConnections: jest.fn().mockReturnValue(false),
        refreshObjectDimensions: jest.fn(),
      };

      mockCore.store.selectionGroup = selectionGroup;
      mockState.isDragging = true;

      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line)) return [line];
        if (fn(targetObject)) return [targetObject];
        return [];
      });

      manager.setAnchor('line-1', 'start', 'obj-1');
      jest.clearAllMocks();

      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line)) return [line];
        if (fn(targetObject)) return [targetObject];
        return [];
      });

      manager.updateAnchorsForObject('obj-1');

      expect(selectionGroup.hasExternalAnchoredLineConnections).toHaveBeenCalled();
      expect(selectionGroup.refreshObjectDimensions).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // Snap Detection
  // ============================================

  describe('findSnapTarget', () => {
    it('should return null when no objects are in range', () => {
      mockCore.store.allNonSelectionObjects = [];

      const result = manager.findSnapTarget(50, 50, 'line-1');

      expect(result).toBeNull();
    });

    it('should return the target when point is inside an anchorable object', () => {
      const obj = createMockObject({ id: 'obj-1', zIndex: 1 });
      mockCore.store.allNonSelectionObjects = [obj];

      (KritzelGeometryHelper.isPointInPolygon as jest.Mock).mockReturnValue(true);

      const result = manager.findSnapTarget(125, 125, 'line-1');

      expect(result).toEqual({
        objectId: 'obj-1',
        centerX: obj.centerX,
        centerY: obj.centerY,
      });
    });

    it('should skip the line being edited', () => {
      const lineObj = createMockLine({ id: 'line-1', zIndex: 2 });
      const obj = createMockObject({ id: 'obj-1', zIndex: 1 });
      mockCore.store.allNonSelectionObjects = [lineObj as any, obj];

      (KritzelGeometryHelper.isPointInPolygon as jest.Mock).mockReturnValue(true);

      const result = manager.findSnapTarget(125, 125, 'line-1');

      // Should skip 'line-1' and not return it as a snap target
      // The line is also excluded by isAnchorable check
      expect(result?.objectId).not.toBe('line-1');
    });

    it('should skip the object anchored to the other endpoint', () => {
      const obj = createMockObject({ id: 'obj-1', zIndex: 1 });
      mockCore.store.allNonSelectionObjects = [obj];

      (KritzelGeometryHelper.isPointInPolygon as jest.Mock).mockReturnValue(true);

      const result = manager.findSnapTarget(125, 125, 'line-1', 'obj-1');

      expect(result).toBeNull();
    });

    it('should skip non-anchorable objects (lines, selection boxes)', () => {
      const selectionBox = Object.create(KritzelSelectionBox.prototype);
      selectionBox.id = 'sel-box-1';
      selectionBox.isVisible = true;
      selectionBox.zIndex = 1;
      selectionBox.rotatedPolygon = {
        topLeft: { x: 0, y: 0 },
        topRight: { x: 100, y: 0 },
        bottomRight: { x: 100, y: 100 },
        bottomLeft: { x: 0, y: 100 },
      };
      mockCore.store.allNonSelectionObjects = [selectionBox];

      (KritzelGeometryHelper.isPointInPolygon as jest.Mock).mockReturnValue(true);

      const result = manager.findSnapTarget(50, 50, 'line-1');

      expect(result).toBeNull();
    });

    it('should return the topmost object when multiple objects overlap', () => {
      const obj1 = createMockObject({ id: 'obj-1', zIndex: 1 });
      const obj2 = createMockObject({ id: 'obj-2', zIndex: 5 });
      const obj3 = createMockObject({ id: 'obj-3', zIndex: 3 });
      mockCore.store.allNonSelectionObjects = [obj1, obj2, obj3];

      (KritzelGeometryHelper.isPointInPolygon as jest.Mock).mockReturnValue(true);

      const result = manager.findSnapTarget(125, 125, 'line-1');

      expect(result?.objectId).toBe('obj-2');
    });

    it('should skip invisible objects', () => {
      const obj = createMockObject({ id: 'obj-1', zIndex: 1, isVisible: false });
      mockCore.store.allNonSelectionObjects = [obj];

      (KritzelGeometryHelper.isPointInPolygon as jest.Mock).mockReturnValue(true);

      const result = manager.findSnapTarget(125, 125, 'line-1');

      expect(result).toBeNull();
    });

    it('should allow a larger snap radius for touch input', () => {
      const obj = createMockObject({ id: 'obj-1', zIndex: 1 });
      mockCore.store.allNonSelectionObjects = [obj];

      (KritzelGeometryHelper.isPointInPolygon as jest.Mock).mockReturnValue(true);

      expect(manager.findSnapTarget(111, 125, 'line-1', undefined, 'mouse')).toBeNull();
      expect(manager.findSnapTarget(111, 125, 'line-1', undefined, 'touch')).toEqual({
        objectId: 'obj-1',
        centerX: obj.centerX,
        centerY: obj.centerY,
      });
    });

    it('should apply a screen-space snap radius floor for mouse input when zoomed out', () => {
      const obj = createMockObject({ id: 'obj-1', zIndex: 1 });
      mockCore.store.allNonSelectionObjects = [obj];
      // Zoom out so the base radius (min(w,h)/5 = 10 world units) shrinks in screen space.
      mockState.scale = 0.25;

      (KritzelGeometryHelper.isPointInPolygon as jest.Mock).mockReturnValue(true);

      // Distance 40 from center (125,125) exceeds the base radius of 10, but the
      // mouse floor of 12 / 0.25 = 48 world units keeps snapping usable when zoomed out.
      const result = manager.findSnapTarget(85, 125, 'line-1', undefined, 'mouse');

      expect(result).toEqual({
        objectId: 'obj-1',
        centerX: obj.centerX,
        centerY: obj.centerY,
      });
    });
  });

  describe('findSnapPreviewTarget', () => {
    it('should return the target as soon as the pointer enters an anchorable object', () => {
      const obj = createMockObject({ id: 'obj-1', zIndex: 1 });
      mockCore.store.allNonSelectionObjects = [obj];

      (KritzelGeometryHelper.isPointInPolygon as jest.Mock).mockReturnValue(true);

      const result = manager.findSnapPreviewTarget(101, 101, 'line-1');

      expect(result).toEqual({
        objectId: 'obj-1',
        centerX: obj.centerX,
        centerY: obj.centerY,
      });
    });
  });

  // ============================================
  // Snap Candidate Management
  // ============================================

  describe('setSnapCandidate', () => {
    it('should set the snap candidate on the store state', () => {
      const candidate: SnapCandidate = {
        objectId: 'obj-1',
        endpoint: 'start',
        centerX: 125,
        centerY: 125,
        lineEndpointX: 0,
        lineEndpointY: 0,
      };

      manager.setSnapCandidate(candidate);

      expect(mockState.snapCandidate).toBe(candidate);
      expect(mockCore.rerender).toHaveBeenCalled();
    });

    it('should set null to clear the snap candidate', () => {
      manager.setSnapCandidate(null);

      expect(mockState.snapCandidate).toBeNull();
      expect(mockCore.rerender).toHaveBeenCalled();
    });
  });

  describe('getSnapCandidate', () => {
    it('should return null when no snap candidate is set', () => {
      mockState.snapCandidate = null;

      const result = manager.getSnapCandidate();

      expect(result).toBeNull();
    });

    it('should return the current snap candidate', () => {
      const candidate: SnapCandidate = {
        objectId: 'obj-1',
        endpoint: 'start',
        centerX: 125,
        centerY: 125,
        lineEndpointX: 0,
        lineEndpointY: 0,
      };
      mockState.snapCandidate = candidate;

      const result = manager.getSnapCandidate();

      expect(result).toBe(candidate);
    });

    it('should return null when snapCandidate is undefined', () => {
      mockState.snapCandidate = undefined;

      const result = manager.getSnapCandidate();

      expect(result).toBeNull();
    });
  });

  describe('clearSnapCandidate', () => {
    it('should clear the snap candidate and trigger rerender', () => {
      mockState.snapCandidate = { objectId: 'obj-1' };

      manager.clearSnapCandidate();

      expect(mockState.snapCandidate).toBeNull();
      expect(mockCore.rerender).toHaveBeenCalled();
    });
  });

  describe('setSnapPreviewCandidate', () => {
    it('should set the preview candidate on the store state', () => {
      const candidate: SnapPreviewCandidate = {
        objectId: 'obj-1',
        endpoint: 'start',
        centerX: 125,
        centerY: 125,
        lineEndpointX: 0,
        lineEndpointY: 0,
      };

      manager.setSnapPreviewCandidate(candidate);

      expect(mockState.snapPreviewCandidate).toBe(candidate);
      expect(mockCore.rerender).toHaveBeenCalled();
    });
  });

  describe('getSnapPreviewCandidate', () => {
    it('should return null when no snap preview candidate is set', () => {
      mockState.snapPreviewCandidate = null;

      expect(manager.getSnapPreviewCandidate()).toBeNull();
    });
  });

  describe('clearSnapPreviewCandidate', () => {
    it('should clear the preview candidate and trigger rerender', () => {
      mockState.snapPreviewCandidate = { objectId: 'obj-1' };

      manager.clearSnapPreviewCandidate();

      expect(mockState.snapPreviewCandidate).toBeNull();
      expect(mockCore.rerender).toHaveBeenCalled();
    });
  });

  // ============================================
  // Render Data
  // ============================================

  describe('getAnchorLinesRenderData', () => {
    it('should return null when no selection group exists', () => {
      mockCore.store.selectionGroup = null;

      const result = manager.getAnchorLinesRenderData();

      expect(result).toBeNull();
    });

    it('should return null when selection has multiple objects', () => {
      mockCore.store.selectionGroup = {
        objects: [createMockObject(), createMockObject({ id: 'obj-2' })],
      };

      const result = manager.getAnchorLinesRenderData();

      expect(result).toBeNull();
    });

    it('should return null when selected object is not a line', () => {
      const obj = createMockObject({ id: 'obj-1' });
      mockCore.store.selectionGroup = { objects: [obj] };
      (KritzelClassHelper.isInstanceOf as unknown as jest.Mock).mockReturnValue(false);

      const result = manager.getAnchorLinesRenderData();

      expect(result).toBeNull();
    });

    it('should return null when line has no anchors', () => {
      const line = createMockLine({ id: 'line-1' });
      mockCore.store.selectionGroup = { objects: [line] };
      (KritzelClassHelper.isInstanceOf as unknown as jest.Mock).mockReturnValue(true);

      const result = manager.getAnchorLinesRenderData();

      expect(result).toBeNull();
    });

    it('should return render data when line has a start anchor', () => {
      const line = createMockLine({
        id: 'line-1',
        startAnchor: { objectId: 'obj-1' },
        strokeWidth: 4,
        scale: 1,
      });
      const targetObject = createMockObject({ id: 'obj-1' });
      mockCore.store.selectionGroup = { objects: [line] };
      mockCore.store.allNonSelectionObjects = [targetObject];
      (KritzelClassHelper.isInstanceOf as unknown as jest.Mock).mockImplementation(
        (_obj: any, className: string) => className === 'KritzelLine'
      );
      // Mock getObjectById to return the target
      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(targetObject)) return [targetObject];
        return [];
      });
      // Mock geometry helper to return an intersection point
      (KritzelGeometryHelper.getLinePolygonIntersection as jest.Mock).mockReturnValue({ x: 100, y: 125 });

      const result = manager.getAnchorLinesRenderData();

      expect(result).not.toBeNull();
      expect(result?.indicatorRadius).toBeDefined();
      expect(result?.dashArray).toBeDefined();
      expect(result?.lineStrokeWidth).toBeDefined();
    });
  });

  describe('getSnapIndicatorRenderData', () => {
    it('should return null when no snap candidate exists', () => {
      mockState.snapCandidate = null;

      const result = manager.getSnapIndicatorRenderData();

      expect(result).toBeNull();
    });

    it('should return render data for a snap candidate', () => {
      const candidate: SnapCandidate = {
        objectId: 'obj-1',
        endpoint: 'start',
        centerX: 125,
        centerY: 125,
        lineEndpointX: 0,
        lineEndpointY: 0,
        edgeX: 100,
        edgeY: 125,
      };
      mockState.snapCandidate = candidate;

      const result = manager.getSnapIndicatorRenderData();

      expect(result).not.toBeNull();
      expect(result?.centerX).toBe(125);
      expect(result?.centerY).toBe(125);
      expect(result?.lineEndpointX).toBe(0);
      expect(result?.lineEndpointY).toBe(0);
      expect(result?.indicatorRadius).toBe(8);
      expect(result?.indicatorStrokeWidth).toBe('2');
    });

    it('should compute arrow points when arrowOffset is present', () => {
      const candidate: SnapCandidate = {
        objectId: 'obj-1',
        endpoint: 'end',
        centerX: 100,
        centerY: 100,
        lineEndpointX: 0,
        lineEndpointY: 0,
        edgeX: 75,
        edgeY: 75,
        arrowOffset: 10,
      };
      mockState.snapCandidate = candidate;

      const result = manager.getSnapIndicatorRenderData();

      expect(result).not.toBeNull();
      expect(result?.arrowPoints).toBeDefined();
      expect(result?.solidLineEndX).toBeDefined();
      expect(result?.solidLineEndY).toBeDefined();
    });

    it('should use default line stroke when not provided', () => {
      const candidate: SnapCandidate = {
        objectId: 'obj-1',
        endpoint: 'start',
        centerX: 125,
        centerY: 125,
        lineEndpointX: 0,
        lineEndpointY: 0,
      };
      mockState.snapCandidate = candidate;

      const result = manager.getSnapIndicatorRenderData();

      expect(result?.lineStroke).toBe('#000000');
    });

    it('should compute snapLinePath for curved snap candidates', () => {
      const candidate: SnapCandidate = {
        objectId: 'obj-1',
        endpoint: 'end',
        centerX: 100,
        centerY: 100,
        lineEndpointX: 0,
        lineEndpointY: 0,
        controlX: 50,
        controlY: 0,
        t: 0.8,
      };
      mockState.snapCandidate = candidate;

      const result = manager.getSnapIndicatorRenderData();

      expect(result).not.toBeNull();
      expect(result?.snapLinePath).toBeDefined();
      expect(result?.snapLinePath).toContain('M');
      expect(result?.snapLinePath).toContain('Q');
    });
  });

  describe('getSnapPreviewRenderData', () => {
    it('should return render data for a preview candidate', () => {
      const candidate: SnapPreviewCandidate = {
        objectId: 'obj-1',
        endpoint: 'end',
        centerX: 125,
        centerY: 125,
        lineEndpointX: 0,
        lineEndpointY: 0,
      };
      mockState.snapPreviewCandidate = candidate;

      const result = manager.getSnapPreviewRenderData();

      expect(result).not.toBeNull();
      expect(result?.centerX).toBe(125);
      expect(result?.centerY).toBe(125);
    });
  });

  // ============================================
  // Cleanup Operations
  // ============================================

  describe('handleObjectDeleted', () => {
    it('should detach all lines anchored to the deleted object', () => {
      const line = createMockLine({
        id: 'line-1',
        startAnchor: { objectId: 'obj-1' },
      });
      const targetObject = createMockObject({ id: 'obj-1' });
      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line)) return [line];
        if (fn(targetObject)) return [targetObject];
        return [];
      });

      // Set up the anchor in the index
      manager.setAnchor('line-1', 'start', 'obj-1');
      jest.clearAllMocks();
      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line)) return [line];
        return [];
      });

      manager.handleObjectDeleted('obj-1');

      expect(line.startAnchor).toBeUndefined();
      expect(mockObjectsMap.update).toHaveBeenCalledWith(line);
    });

    it('should handle deletion of object with no anchored lines', () => {
      manager.handleObjectDeleted('nonexistent');

      // Should not throw
      expect(mockObjectsMap.update).not.toHaveBeenCalled();
    });

    it('should remove the object from the index', () => {
      const line = createMockLine({ id: 'line-1' });
      const targetObject = createMockObject({ id: 'obj-1' });
      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line)) return [line];
        if (fn(targetObject)) return [targetObject];
        return [];
      });

      manager.setAnchor('line-1', 'start', 'obj-1');
      manager.handleObjectDeleted('obj-1');

      // After deletion, no lines should be anchored to the object
      const result = manager.getLinesAnchoredTo('obj-1');
      expect(result).toEqual([]);
    });
  });

  describe('handleLineDeleted', () => {
    it('should remove index entries for a deleted line with start anchor', () => {
      const line = createMockLine({
        id: 'line-1',
        startAnchor: { objectId: 'obj-1' },
      });
      const targetObject = createMockObject({ id: 'obj-1' });
      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line)) return [line];
        if (fn(targetObject)) return [targetObject];
        return [];
      });

      // Set up the anchor
      manager.setAnchor('line-1', 'start', 'obj-1');

      // Delete the line
      manager.handleLineDeleted('line-1');

      const result = manager.getLinesAnchoredTo('obj-1');
      expect(result).toEqual([]);
    });

    it('should remove index entries for a deleted line with both anchors', () => {
      const line = createMockLine({
        id: 'line-1',
        startAnchor: { objectId: 'obj-1' },
        endAnchor: { objectId: 'obj-2' },
      });
      const obj1 = createMockObject({ id: 'obj-1' });
      const obj2 = createMockObject({ id: 'obj-2' });
      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line)) return [line];
        if (fn(obj1)) return [obj1];
        if (fn(obj2)) return [obj2];
        return [];
      });

      manager.setAnchor('line-1', 'start', 'obj-1');
      manager.setAnchor('line-1', 'end', 'obj-2');

      manager.handleLineDeleted('line-1');

      expect(manager.getLinesAnchoredTo('obj-1')).toEqual([]);
      expect(manager.getLinesAnchoredTo('obj-2')).toEqual([]);
    });

    it('should do nothing if line is not found', () => {
      mockObjectsMap.filter.mockReturnValue([]);

      manager.handleLineDeleted('nonexistent');

      // Should not throw
    });
  });

  // ============================================
  // Index Management
  // ============================================

  describe('rebuildIndex', () => {
    it('should rebuild the index from all lines in the store', () => {
      const line1 = new KritzelLine();
      Object.assign(line1, {
        __class__: 'KritzelLine',
        id: 'line-1',
        startAnchor: { objectId: 'obj-1' },
        endAnchor: { objectId: 'obj-2' },
      });
      const line2 = new KritzelLine();
      Object.assign(line2, {
        __class__: 'KritzelLine',
        id: 'line-2',
        startAnchor: { objectId: 'obj-1' },
      });

      // KritzelLine instances must pass the __class__ check
      mockCore.store.allObjects = [line1, line2];

      manager.rebuildIndex();

      const obj1Entries = manager.getLinesAnchoredTo('obj-1');
      const obj2Entries = manager.getLinesAnchoredTo('obj-2');

      expect(obj1Entries).toHaveLength(2);
      expect(obj2Entries).toHaveLength(1);
    });

    it('should clear existing index before rebuilding', () => {
      // Set up some anchors first
      const line = createMockLine({ id: 'line-1' });
      const targetObject = createMockObject({ id: 'obj-1' });
      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line)) return [line];
        if (fn(targetObject)) return [targetObject];
        return [];
      });
      manager.setAnchor('line-1', 'start', 'obj-1');

      // Now rebuild with empty store
      mockCore.store.allObjects = [];

      manager.rebuildIndex();

      expect(manager.getLinesAnchoredTo('obj-1')).toEqual([]);
    });

    it('should skip non-line objects', () => {
      const obj = createMockObject({ id: 'obj-1' });
      mockCore.store.allObjects = [obj];

      manager.rebuildIndex();

      expect(manager.getLinesAnchoredTo('obj-1')).toEqual([]);
    });
  });

  // ============================================
  // findAnchorTarget
  // ============================================

  describe('findAnchorTarget', () => {
    it('should return the target object when anchor exists', () => {
      const targetObject = createMockObject({ id: 'obj-1' });
      const line = createMockLine({
        id: 'line-1',
        startAnchor: { objectId: 'obj-1' },
      });
      mockCore.store.allNonSelectionObjects = [targetObject];

      const result = manager.findAnchorTarget(line, 'start');

      expect(result).toBe(targetObject);
    });

    it('should return null when no anchor exists on the endpoint', () => {
      const line = createMockLine({ id: 'line-1' });

      const result = manager.findAnchorTarget(line, 'start');

      expect(result).toBeNull();
    });

    it('should return null when anchored object is not found in store', () => {
      const line = createMockLine({
        id: 'line-1',
        startAnchor: { objectId: 'obj-deleted' },
      });
      mockCore.store.allNonSelectionObjects = [];

      const result = manager.findAnchorTarget(line, 'start');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // Visualization Helpers
  // ============================================

  describe('computeAnchorVisualization', () => {
    it('should return null when no anchor exists', () => {
      const line = createMockLine({ id: 'line-1' });

      const result = manager.computeAnchorVisualization(line, 'start');

      expect(result).toBeNull();
    });

    it('should return null when target object is not found', () => {
      const line = createMockLine({
        id: 'line-1',
        startAnchor: { objectId: 'obj-deleted' },
      });
      mockCore.store.allNonSelectionObjects = [];

      const result = manager.computeAnchorVisualization(line, 'start');

      expect(result).toBeNull();
    });

    it('should return visualization data for a straight line anchor', () => {
      const line = createMockLine({
        id: 'line-1',
        startAnchor: { objectId: 'obj-1' },
        startX: 0,
        startY: 0,
        endX: 200,
        endY: 0,
      });
      const targetObject = createMockObject({
        id: 'obj-1',
        translateX: 0,
        translateY: 0,
        width: 50,
        height: 50,
      });
      mockCore.store.allNonSelectionObjects = [targetObject];
      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(targetObject)) return [targetObject];
        return [];
      });

      // Mock the geometry helper to return an edge intersection
      (KritzelGeometryHelper.getLinePolygonIntersection as jest.Mock).mockReturnValue({ x: 50, y: 25 });

      const result = manager.computeAnchorVisualization(line, 'start');

      expect(result).not.toBeNull();
      expect(result?.centerX).toBe(targetObject.centerX);
      expect(result?.centerY).toBe(targetObject.centerY);
      expect(result?.edgeX).toBeDefined();
      expect(result?.edgeY).toBeDefined();
    });
  });

  describe('computeClippedLinePath', () => {
    it('should return original path when no anchors and no snap candidate', () => {
      const line = createMockLine({
        id: 'line-1',
        startX: 10,
        startY: 20,
        endX: 100,
        endY: 200,
      });
      mockState.snapCandidate = null;
      mockCore.store.selectionGroup = null;

      const result = manager.computeClippedLinePath(line);

      expect(result).toBe(line.d);
    });

    it('should return offset path when offsetByViewBox is true and no anchors', () => {
      const line = createMockLine({
        id: 'line-1',
        startX: 10,
        startY: 20,
        endX: 100,
        endY: 200,
        x: 5,
        y: 10,
      });
      mockState.snapCandidate = null;
      mockCore.store.selectionGroup = null;

      const result = manager.computeClippedLinePath(line, true);

      expect(result).toBe(`M ${10 - 5} ${20 - 10} L ${100 - 5} ${200 - 10}`);
    });

    it('should return offset quadratic path when offsetByViewBox is true for curved line', () => {
      const line = createMockLine({
        id: 'line-1',
        startX: 10,
        startY: 20,
        controlX: 50,
        controlY: 0,
        endX: 100,
        endY: 200,
        x: 5,
        y: 10,
      });
      mockState.snapCandidate = null;
      mockCore.store.selectionGroup = null;

      const result = manager.computeClippedLinePath(line, true);

      expect(result).toBe(`M ${10 - 5} ${20 - 10} Q ${50 - 5} ${0 - 10} ${100 - 5} ${200 - 10}`);
    });

    it('should clip at anchor edges for straight lines', () => {
      const targetObject = createMockObject({ id: 'obj-1' });
      const line = createMockLine({
        id: 'line-1',
        startX: 0,
        startY: 0,
        endX: 200,
        endY: 0,
        startAnchor: { objectId: 'obj-1' },
      });
      mockCore.store.allNonSelectionObjects = [targetObject];
      mockCore.store.selectionGroup = null;
      mockState.snapCandidate = null;
      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(targetObject)) return [targetObject];
        return [];
      });
      (KritzelGeometryHelper.getLinePolygonIntersection as jest.Mock).mockReturnValue({ x: 50, y: 0 });

      const result = manager.computeClippedLinePath(line);

      expect(result).toContain('M');
      expect(result).toContain('L');
    });
  });

  describe('computeAnchorClipInfo', () => {
    it('should delegate to computeStraightClipInfo for straight lines', () => {
      const line = createMockLine({ id: 'line-1' });
      const targetObject = createMockObject({ id: 'obj-1' });

      (KritzelGeometryHelper.getLinePolygonIntersection as jest.Mock).mockReturnValue({ x: 100, y: 100 });

      const result = manager.computeAnchorClipInfo(line, 'start', targetObject);

      expect(result).not.toBeNull();
      expect(result?.worldX).toBe(100);
      expect(result?.worldY).toBe(100);
    });

    it('should delegate to computeCurvedClipInfo for curved lines', () => {
      const line = createMockLine({
        id: 'line-1',
        controlX: 50,
        controlY: 50,
      });
      const targetObject = createMockObject({ id: 'obj-1' });

      // For curved lines, the curve exit point detection is used
      // Mock isPointInPolygon for the sampling algorithm
      let callCount = 0;
      (KritzelGeometryHelper.isPointInPolygon as jest.Mock).mockImplementation(() => {
        callCount++;
        // First few calls inside, then outside (simulating curve exiting polygon)
        return callCount <= 3;
      });

      manager.computeAnchorClipInfo(line, 'start', targetObject);

      // The important thing is that the curved path was taken
      expect(KritzelGeometryHelper.isPointInPolygon).toHaveBeenCalled();
    });

    it('should handle path objects with custom clip detection', () => {
      const line = createMockLine({
        id: 'line-1',
        controlX: 50,
        controlY: 50,
      });
      const pathObject = createMockObject({ id: 'path-1' }) as any;
      pathObject.__class__ = 'KritzelPath';
      pathObject.points = [[0, 0], [50, 50], [100, 0]];
      pathObject.strokeWidth = 4;
      pathObject.scale = 1;
      pathObject.rotation = 0;

      (KritzelClassHelper.isInstanceOf as unknown as jest.Mock).mockImplementation(
        (_obj: any, className: string) => className === 'KritzelPath'
      );

      manager.computeAnchorClipInfo(line, 'start', pathObject);

      // Path clip detection was used
      expect(KritzelClassHelper.isInstanceOf).toHaveBeenCalled();
    });

    it('should handle shape objects with custom clip polygon', () => {
      const line = createMockLine({ id: 'line-1' });
      const shapeObject = createMockObject({ id: 'shape-1' }) as any;
      shapeObject.__class__ = 'KritzelShape';
      shapeObject.getClipPolygon = jest.fn().mockReturnValue([
        { x: 0, y: 50 },
        { x: 50, y: 0 },
        { x: 100, y: 50 },
        { x: 50, y: 100 },
      ]);

      (KritzelClassHelper.isInstanceOf as unknown as jest.Mock).mockImplementation(
        (_obj: any, className: string) => className === 'KritzelShape'
      );
      (KritzelGeometryHelper.getLinePointsArrayIntersection as jest.Mock).mockReturnValue({ x: 50, y: 0 });

      const result = manager.computeAnchorClipInfo(line, 'start', shapeObject);

      expect(result).not.toBeNull();
      expect(KritzelGeometryHelper.getLinePointsArrayIntersection).toHaveBeenCalled();
    });
  });

  // ============================================
  // Index Integrity
  // ============================================

  describe('index integrity', () => {
    it('should not add duplicate entries to the index', () => {
      const line = createMockLine({ id: 'line-1' });
      const targetObject = createMockObject({ id: 'obj-1' });
      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line)) return [line];
        if (fn(targetObject)) return [targetObject];
        return [];
      });

      manager.setAnchor('line-1', 'start', 'obj-1');
      // Set the same anchor again (should first remove, then re-add)
      line.startAnchor = undefined; // Reset so setAnchor can proceed
      manager.setAnchor('line-1', 'start', 'obj-1');

      const entries = manager.getLinesAnchoredTo('obj-1');
      expect(entries).toHaveLength(1);
    });

    it('should clean up empty index sets', () => {
      const line = createMockLine({ id: 'line-1' });
      const targetObject = createMockObject({ id: 'obj-1' });
      mockObjectsMap.filter.mockImplementation((fn: (o: any) => boolean) => {
        if (fn(line)) return [line];
        if (fn(targetObject)) return [targetObject];
        return [];
      });

      manager.setAnchor('line-1', 'start', 'obj-1');
      manager.removeAnchor('line-1', 'start');

      const entries = manager.getLinesAnchoredTo('obj-1');
      expect(entries).toEqual([]);
    });
  });
});
