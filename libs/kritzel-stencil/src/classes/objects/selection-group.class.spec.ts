import { KritzelSelectionGroup } from './selection-group.class';
import { KritzelBaseObject } from './base-object.class';
import { KritzelCore } from '../core/core.class';

describe('KritzelSelectionGroup', () => {
  let selectionGroup: KritzelSelectionGroup;
  let mockCore: jest.Mocked<KritzelCore>;
  let mockObjectsUpdate: jest.Mock;
  let mockObjectsTransaction: jest.Mock;
  let mockAnchorManagerUpdate: jest.Mock;
  let mockObjectsStore: KritzelBaseObject<HTMLElement>[];

  beforeEach(() => {
    mockObjectsUpdate = jest.fn();
    mockObjectsTransaction = jest.fn((callback: () => void) => callback());
    mockAnchorManagerUpdate = jest.fn();
    mockObjectsStore = [];

    // Create a custom array-like object that has both array behavior and custom methods
    const createMockObjectsArray = () => {
      const arr: KritzelBaseObject<HTMLElement>[] & {
        update: jest.Mock;
        transaction: jest.Mock;
        filter: (predicate: (obj: KritzelBaseObject<HTMLElement>) => boolean) => KritzelBaseObject<HTMLElement>[];
      } = Object.assign([], {
        update: mockObjectsUpdate,
        transaction: mockObjectsTransaction,
        filter: (predicate: (obj: KritzelBaseObject<HTMLElement>) => boolean) => {
          return mockObjectsStore.filter(predicate);
        },
      });
      // Copy current items from mockObjectsStore
      mockObjectsStore.forEach(item => arr.push(item));
      return arr;
    };

    mockCore = {
      store: {
        state: {
          scale: 1,
          translateX: 0,
          translateY: 0,
          viewportWidth: 1000,
          viewportHeight: 800,
          get objects() {
            return createMockObjectsArray();
          },
          activeWorkspace: {
            id: 'workspace-1',
          },
        },
        currentZIndex: 1,
      },
      anchorManager: {
        updateAnchorsForObject: mockAnchorManagerUpdate,
      },
    } as unknown as jest.Mocked<KritzelCore>;

    selectionGroup = new KritzelSelectionGroup();
    selectionGroup._core = mockCore;
    selectionGroup.scale = 1;
    selectionGroup.padding = 0;
  });

  function createMockObject(overrides: Partial<KritzelBaseObject<HTMLElement>> = {}): KritzelBaseObject<HTMLElement> {
    const obj = new KritzelBaseObject<HTMLElement>();
    obj._core = mockCore;
    obj.id = `object-${Math.random().toString(36).substr(2, 9)}`;
    obj.translateX = 0;
    obj.translateY = 0;
    obj.width = 100;
    obj.height = 50;
    obj.scale = 1;
    obj.padding = 0;
    obj.rotation = 0;
    obj.zIndex = 1;
    obj.isSelected = false;

    Object.assign(obj, overrides);
    mockObjectsStore.push(obj);
    return obj;
  }

  describe('constructor', () => {
    it('should generate a unique id on instantiation', () => {
      const group1 = new KritzelSelectionGroup();
      const group2 = new KritzelSelectionGroup();
      expect(group1.id).toBeDefined();
      expect(group2.id).toBeDefined();
      expect(group1.id).not.toBe(group2.id);
    });

    it('should set __class__ to KritzelSelectionGroup', () => {
      const group = new KritzelSelectionGroup();
      expect(group.__class__).toBe('KritzelSelectionGroup');
    });

    it('should initialize objectIds as empty array', () => {
      const group = new KritzelSelectionGroup();
      expect(group.objectIds).toEqual([]);
    });

    it('should initialize unchangedObjectSnapshots as empty Map', () => {
      const group = new KritzelSelectionGroup();
      expect(group.unchangedObjectSnapshots).toBeInstanceOf(Map);
      expect(group.unchangedObjectSnapshots.size).toBe(0);
    });
  });

  describe('static create', () => {
    it('should create a new selection group with core reference', () => {
      const group = KritzelSelectionGroup.create(mockCore);
      expect(group._core).toBe(mockCore);
    });

    it('should set workspaceId from active workspace', () => {
      const group = KritzelSelectionGroup.create(mockCore);
      expect(group.workspaceId).toBe('workspace-1');
    });

    it('should generate a unique id', () => {
      const group = KritzelSelectionGroup.create(mockCore);
      expect(group.id).toBeDefined();
      expect(typeof group.id).toBe('string');
      expect(group.id.length).toBeGreaterThan(0);
    });

    it('should set scale from core store state', () => {
      const group = KritzelSelectionGroup.create(mockCore);
      expect(group.scale).toBe(1);
    });

    it('should set scale correctly when core has different scale', () => {
      mockCore.store.state.scale = 2;
      const group = KritzelSelectionGroup.create(mockCore);
      expect(group.scale).toBe(2);
    });

    it('should set zIndex to 99999', () => {
      const group = KritzelSelectionGroup.create(mockCore);
      expect(group.zIndex).toBe(99999);
    });

    it('should create multiple unique selection groups', () => {
      const group1 = KritzelSelectionGroup.create(mockCore);
      const group2 = KritzelSelectionGroup.create(mockCore);
      expect(group1.id).not.toBe(group2.id);
    });
  });

  describe('objects getter', () => {
    it('should return empty array when objectIds is empty', () => {
      expect(selectionGroup.objects).toEqual([]);
    });

    it('should return objects matching objectIds from store', () => {
      const obj1 = createMockObject({ id: 'obj-1' });
      const obj2 = createMockObject({ id: 'obj-2' });

      selectionGroup.objectIds = ['obj-1', 'obj-2'];

      const objects = selectionGroup.objects;
      expect(objects).toHaveLength(2);
      expect(objects).toContain(obj1);
      expect(objects).toContain(obj2);
    });

    it('should filter out non-existent object ids', () => {
      const obj1 = createMockObject({ id: 'obj-1' });

      selectionGroup.objectIds = ['obj-1', 'non-existent'];

      const objects = selectionGroup.objects;
      expect(objects).toHaveLength(1);
      expect(objects).toContain(obj1);
    });
  });

  describe('length getter', () => {
    it('should return 0 when no objects are added', () => {
      expect(selectionGroup.length).toBe(0);
    });

    it('should return correct count of objectIds', () => {
      selectionGroup.objectIds = ['obj-1', 'obj-2', 'obj-3'];
      expect(selectionGroup.length).toBe(3);
    });
  });

  describe('addOrRemove', () => {
    it('should add object id when not present', () => {
      const obj = createMockObject({ id: 'obj-1' });

      selectionGroup.addOrRemove(obj);

      expect(selectionGroup.objectIds).toContain('obj-1');
      expect(selectionGroup.length).toBe(1);
    });

    it('should remove object id when already present', () => {
      const obj = createMockObject({ id: 'obj-1' });
      selectionGroup.objectIds = ['obj-1'];

      selectionGroup.addOrRemove(obj);

      expect(selectionGroup.objectIds).not.toContain('obj-1');
      expect(selectionGroup.length).toBe(0);
    });

    it('should toggle object presence on multiple calls', () => {
      const obj = createMockObject({ id: 'obj-1' });

      selectionGroup.addOrRemove(obj);
      expect(selectionGroup.length).toBe(1);

      selectionGroup.addOrRemove(obj);
      expect(selectionGroup.length).toBe(0);

      selectionGroup.addOrRemove(obj);
      expect(selectionGroup.length).toBe(1);
    });

    it('should capture snapshots after adding object', () => {
      const obj = createMockObject({
        id: 'obj-1',
        translateX: 10,
        translateY: 20,
        width: 100,
        height: 50,
      });

      selectionGroup.addOrRemove(obj);

      expect(selectionGroup.unchangedObjectSnapshots.has('obj-1')).toBe(true);
      const snapshot = selectionGroup.unchangedObjectSnapshots.get('obj-1');
      expect(snapshot?.translateX).toBe(10);
      expect(snapshot?.translateY).toBe(20);
    });
  });

  describe('deselectAllChildren', () => {
    it('should set isSelected to false for all child objects', () => {
      const obj1 = createMockObject({ id: 'obj-1', isSelected: true });
      const obj2 = createMockObject({ id: 'obj-2', isSelected: true });
      selectionGroup.objectIds = ['obj-1', 'obj-2'];

      selectionGroup.deselectAllChildren();

      expect(obj1.isSelected).toBe(false);
      expect(obj2.isSelected).toBe(false);
    });
  });

  describe('updateWorkspaceId', () => {
    it('should update workspaceId on selection group', () => {
      selectionGroup.workspaceId = 'old-workspace';

      selectionGroup.updateWorkspaceId('new-workspace');

      expect(selectionGroup.workspaceId).toBe('new-workspace');
    });

    it('should update workspaceId on all child objects', () => {
      const obj1 = createMockObject({ id: 'obj-1', workspaceId: 'old-workspace' });
      const obj2 = createMockObject({ id: 'obj-2', workspaceId: 'old-workspace' });
      selectionGroup.objectIds = ['obj-1', 'obj-2'];

      selectionGroup.updateWorkspaceId('new-workspace');

      expect(obj1.workspaceId).toBe('new-workspace');
      expect(obj2.workspaceId).toBe('new-workspace');
    });
  });

  describe('updateZIndices', () => {
    it('should update zIndex incrementally for all child objects', () => {
      const obj1 = createMockObject({ id: 'obj-1', zIndex: 0 });
      const obj2 = createMockObject({ id: 'obj-2', zIndex: 0 });
      const obj3 = createMockObject({ id: 'obj-3', zIndex: 0 });
      selectionGroup.objectIds = ['obj-1', 'obj-2', 'obj-3'];

      selectionGroup.updateZIndices(10);

      expect(obj1.zIndex).toBe(10);
      expect(obj2.zIndex).toBe(11);
      expect(obj3.zIndex).toBe(12);
    });
  });

  describe('updatePosition', () => {
    it('should update position of selection group', () => {
      selectionGroup.translateX = 0;
      selectionGroup.translateY = 0;

      const obj = createMockObject({ id: 'obj-1', translateX: 0, translateY: 0 });
      obj.updatePosition = jest.fn();
      selectionGroup.objectIds = ['obj-1'];
      selectionGroup.unchangedObjectSnapshots.set('obj-1', {
        id: 'obj-1',
        translateX: 0,
        translateY: 0,
        rotation: 0,
        width: 100,
        height: 50,
        totalWidth: 100,
        totalHeight: 50,
        scale: 1,
      });

      selectionGroup.updatePosition(50, 100);

      expect(selectionGroup.translateX).toBe(50);
      expect(selectionGroup.translateY).toBe(100);
    });

    it('should update child object positions with delta', () => {
      selectionGroup.translateX = 0;
      selectionGroup.translateY = 0;

      const obj = createMockObject({ id: 'obj-1', translateX: 10, translateY: 20 });
      obj.updatePosition = jest.fn();
      selectionGroup.objectIds = ['obj-1'];
      selectionGroup.unchangedObjectSnapshots.set('obj-1', {
        id: 'obj-1',
        translateX: 10,
        translateY: 20,
        rotation: 0,
        width: 100,
        height: 50,
        totalWidth: 100,
        totalHeight: 50,
        scale: 1,
      });

      selectionGroup.updatePosition(50, 100);

      expect(obj.updatePosition).toHaveBeenCalledWith(60, 120);
    });

    it('should call objects.update', () => {
      selectionGroup.translateX = 0;
      selectionGroup.translateY = 0;

      selectionGroup.updatePosition(50, 100);

      expect(mockObjectsUpdate).toHaveBeenCalledWith(selectionGroup);
    });
  });

  describe('move', () => {
    it('should update translateX and translateY based on delta', () => {
      selectionGroup.translateX = 100;
      selectionGroup.translateY = 100;
      mockCore.store.state.scale = 1;

      selectionGroup.move(0, 0, -50, -50);

      expect(selectionGroup.translateX).toBe(150);
      expect(selectionGroup.translateY).toBe(150);
    });

    it('should move child objects', () => {
      selectionGroup.translateX = 0;
      selectionGroup.translateY = 0;

      const obj = createMockObject({ id: 'obj-1' });
      obj.move = jest.fn();
      selectionGroup.objectIds = ['obj-1'];
      selectionGroup.unchangedObjectSnapshots.set('obj-1', {
        id: 'obj-1',
        translateX: 0,
        translateY: 0,
        rotation: 0,
        width: 100,
        height: 50,
        totalWidth: 100,
        totalHeight: 50,
        scale: 1,
      });

      selectionGroup.move(0, 0, 10, 10);

      expect(obj.move).toHaveBeenCalledWith(0, 0, 10, 10);
    });

    it('should update anchor manager for each child', () => {
      const obj = createMockObject({ id: 'obj-1' });
      obj.move = jest.fn();
      selectionGroup.objectIds = ['obj-1'];
      selectionGroup.unchangedObjectSnapshots.set('obj-1', {
        id: 'obj-1',
        translateX: 0,
        translateY: 0,
        rotation: 0,
        width: 100,
        height: 50,
        totalWidth: 100,
        totalHeight: 50,
        scale: 1,
      });

      selectionGroup.move(0, 0, 10, 10);

      expect(mockAnchorManagerUpdate).toHaveBeenCalledWith('obj-1');
    });

    it('should use transaction for updates', () => {
      const obj = createMockObject({ id: 'obj-1' });
      obj.move = jest.fn();
      selectionGroup.objectIds = ['obj-1'];

      selectionGroup.move(0, 0, 10, 10);

      expect(mockObjectsTransaction).toHaveBeenCalled();
    });
  });

  describe('rotate', () => {
    it('should update rotation value', () => {
      selectionGroup.rotation = 0;
      selectionGroup.snapshotRotation = 0;
      selectionGroup.translateX = 0;
      selectionGroup.translateY = 0;
      selectionGroup.width = 100;
      selectionGroup.height = 100;

      selectionGroup.rotate(Math.PI / 2);

      expect(selectionGroup.rotation).toBe(Math.PI / 2);
    });

    it('should use transaction for updates', () => {
      selectionGroup.rotation = 0;
      selectionGroup.snapshotRotation = 0;
      selectionGroup.translateX = 0;
      selectionGroup.translateY = 0;
      selectionGroup.width = 100;
      selectionGroup.height = 100;

      selectionGroup.rotate(Math.PI / 4);

      expect(mockObjectsTransaction).toHaveBeenCalled();
    });

    it('should call objects.update with selection group', () => {
      selectionGroup.rotation = 0;
      selectionGroup.snapshotRotation = 0;
      selectionGroup.translateX = 0;
      selectionGroup.translateY = 0;
      selectionGroup.width = 100;
      selectionGroup.height = 100;

      selectionGroup.rotate(Math.PI / 4);

      expect(mockObjectsUpdate).toHaveBeenCalledWith(selectionGroup);
    });

    it('should rotate child objects around group center', () => {
      selectionGroup.translateX = 0;
      selectionGroup.translateY = 0;
      selectionGroup.width = 100;
      selectionGroup.height = 100;
      selectionGroup.scale = 1;
      selectionGroup.padding = 0;
      selectionGroup.rotation = 0;
      selectionGroup.snapshotRotation = 0;

      const obj = createMockObject({
        id: 'obj-1',
        translateX: 0,
        translateY: 0,
        width: 50,
        height: 50,
      });
      obj.rotate = jest.fn();
      selectionGroup.objectIds = ['obj-1'];
      selectionGroup.unchangedObjectSnapshots.set('obj-1', {
        id: 'obj-1',
        translateX: 0,
        translateY: 0,
        rotation: 0,
        width: 50,
        height: 50,
        totalWidth: 50,
        totalHeight: 50,
        scale: 1,
      });

      selectionGroup.rotate(Math.PI / 2);

      expect(obj.rotate).toHaveBeenCalled();
    });
  });

  describe('resize', () => {
    it('should resize child objects proportionally', () => {
      selectionGroup.translateX = 0;
      selectionGroup.translateY = 0;
      selectionGroup.width = 100;
      selectionGroup.height = 100;
      selectionGroup.scale = 1;
      selectionGroup.padding = 0;
      selectionGroup.rotation = 0;

      const obj = createMockObject({
        id: 'obj-1',
        translateX: 25,
        translateY: 25,
        width: 50,
        height: 50,
      });
      obj.resize = jest.fn();
      selectionGroup.objectIds = ['obj-1'];
      selectionGroup.captureUnchangedSnapshots();

      selectionGroup.resize(0, 0, 200, 200);

      expect(obj.resize).toHaveBeenCalled();
    });

    it('should use transaction for updates', () => {
      selectionGroup.translateX = 0;
      selectionGroup.translateY = 0;
      selectionGroup.width = 100;
      selectionGroup.height = 100;
      selectionGroup.scale = 1;
      selectionGroup.padding = 0;
      selectionGroup.rotation = 0;
      selectionGroup.captureUnchangedSnapshots();

      selectionGroup.resize(0, 0, 200, 200);

      expect(mockObjectsTransaction).toHaveBeenCalled();
    });

    it('should update anchor manager for resized children', () => {
      selectionGroup.translateX = 0;
      selectionGroup.translateY = 0;
      selectionGroup.width = 100;
      selectionGroup.height = 100;
      selectionGroup.scale = 1;
      selectionGroup.padding = 0;
      selectionGroup.rotation = 0;

      const obj = createMockObject({ id: 'obj-1' });
      obj.resize = jest.fn();
      selectionGroup.objectIds = ['obj-1'];
      selectionGroup.captureUnchangedSnapshots();

      selectionGroup.resize(0, 0, 200, 200);

      expect(mockAnchorManagerUpdate).toHaveBeenCalledWith('obj-1');
    });
  });

  describe('copy', () => {
    it('should create a new selection group', () => {
      const copied = selectionGroup.copy();

      expect(copied).toBeInstanceOf(KritzelSelectionGroup);
      expect(copied.id).not.toBe(selectionGroup.id);
    });

    it('should copy all child objects', () => {
      const obj1 = createMockObject({ id: 'obj-1', zIndex: 1 });
      const obj2 = createMockObject({ id: 'obj-2', zIndex: 2 });

      const copiedObj1 = createMockObject({ id: 'copied-obj-1' });
      const copiedObj2 = createMockObject({ id: 'copied-obj-2' });

      obj1.copy = jest.fn(() => copiedObj1);
      obj2.copy = jest.fn(() => copiedObj2);

      selectionGroup.objectIds = ['obj-1', 'obj-2'];

      const copied = selectionGroup.copy() as KritzelSelectionGroup;

      expect(obj1.copy).toHaveBeenCalled();
      expect(obj2.copy).toHaveBeenCalled();
      expect(copied.objectIds).toContain('copied-obj-1');
      expect(copied.objectIds).toContain('copied-obj-2');
    });

    it('should inherit rotation from single object', () => {
      const obj = createMockObject({ id: 'obj-1', rotation: Math.PI / 4 });
      const copiedObj = createMockObject({ id: 'copied-obj-1' });
      obj.copy = jest.fn(() => copiedObj);

      selectionGroup.objectIds = ['obj-1'];

      const copied = selectionGroup.copy() as KritzelSelectionGroup;

      expect(copied.rotation).toBe(Math.PI / 4);
    });
  });

  describe('serialize', () => {
    it('should serialize selection group without _core and _elementRef', () => {
      selectionGroup.id = 'test-id';
      selectionGroup.translateX = 10;
      selectionGroup.translateY = 20;

      const serialized = selectionGroup.serialize();

      expect(serialized._core).toBeUndefined();
      expect(serialized._elementRef).toBeUndefined();
      expect(serialized.id).toBe('test-id');
      expect(serialized.translateX).toBe(10);
      expect(serialized.translateY).toBe(20);
    });

    it('should convert unchangedObjectSnapshots Map to plain object', () => {
      selectionGroup.unchangedObjectSnapshots.set('obj-1', {
        id: 'obj-1',
        translateX: 10,
        translateY: 20,
        rotation: 0,
        width: 100,
        height: 50,
        totalWidth: 100,
        totalHeight: 50,
        scale: 1,
      });

      const serialized = selectionGroup.serialize();

      expect(serialized.unchangedObjectSnapshots).toEqual({
        'obj-1': {
          id: 'obj-1',
          translateX: 10,
          translateY: 20,
          rotation: 0,
          width: 100,
          height: 50,
          totalWidth: 100,
          totalHeight: 50,
          scale: 1,
        },
      });
    });
  });

  describe('deserialize', () => {
    it('should restore unchangedObjectSnapshots as Map', () => {
      const serialized = {
        id: 'test-id',
        unchangedObjectSnapshots: {
          'obj-1': {
            id: 'obj-1',
            translateX: 10,
            translateY: 20,
            rotation: 0,
            width: 100,
            height: 50,
            totalWidth: 100,
            totalHeight: 50,
            scale: 1,
          },
        },
      };

      selectionGroup.deserialize(serialized);

      expect(selectionGroup.unchangedObjectSnapshots).toBeInstanceOf(Map);
      expect(selectionGroup.unchangedObjectSnapshots.has('obj-1')).toBe(true);
      expect(selectionGroup.unchangedObjectSnapshots.get('obj-1')?.translateX).toBe(10);
    });
  });

  describe('refreshObjectDimensions', () => {
    it('should calculate dimensions for single object', () => {
      createMockObject({
        id: 'obj-1',
        translateX: 10,
        translateY: 20,
        width: 100,
        height: 50,
      });
      selectionGroup.objectIds = ['obj-1'];
      selectionGroup.scale = 1;
      selectionGroup.padding = 0;

      selectionGroup.refreshObjectDimensions();

      expect(selectionGroup.minX).toBe(10);
      expect(selectionGroup.minY).toBe(20);
    });

    it('should call objects.update after refresh', () => {
      createMockObject({ id: 'obj-1' });
      selectionGroup.objectIds = ['obj-1'];

      selectionGroup.refreshObjectDimensions();

      expect(mockObjectsUpdate).toHaveBeenCalledWith(selectionGroup);
    });
  });

  describe('hitTest', () => {
    it('should return true when point is inside bounding box', () => {
      selectionGroup.translateX = 0;
      selectionGroup.translateY = 0;
      selectionGroup.width = 100;
      selectionGroup.height = 100;
      selectionGroup.scale = 1;
      selectionGroup.padding = 0;
      selectionGroup.rotation = 0;

      const obj = createMockObject({ id: 'obj-1' });
      obj.hitTest = jest.fn(() => false);
      selectionGroup.objectIds = ['obj-1'];

      const result = selectionGroup.hitTest(50, 50);

      expect(result).toBe(true);
    });

    it('should return false when point is outside bounding box and no child hit', () => {
      selectionGroup.translateX = 0;
      selectionGroup.translateY = 0;
      selectionGroup.width = 100;
      selectionGroup.height = 100;
      selectionGroup.scale = 1;
      selectionGroup.padding = 0;
      selectionGroup.rotation = 0;

      const obj = createMockObject({ id: 'obj-1' });
      obj.hitTest = jest.fn(() => false);
      selectionGroup.objectIds = ['obj-1'];

      const result = selectionGroup.hitTest(200, 200);

      expect(result).toBe(false);
    });

    it('should return true when any child object is hit', () => {
      selectionGroup.translateX = 0;
      selectionGroup.translateY = 0;
      selectionGroup.width = 100;
      selectionGroup.height = 100;
      selectionGroup.scale = 1;
      selectionGroup.padding = 0;
      selectionGroup.rotation = 0;

      const obj = createMockObject({ id: 'obj-1' });
      obj.hitTest = jest.fn(() => true);
      selectionGroup.objectIds = ['obj-1'];

      const result = selectionGroup.hitTest(200, 200);

      expect(result).toBe(true);
    });

    it('should delegate to single line object for hit testing', () => {
      selectionGroup.translateX = 0;
      selectionGroup.translateY = 0;
      selectionGroup.width = 100;
      selectionGroup.height = 100;
      selectionGroup.scale = 1;
      selectionGroup.padding = 0;

      const lineObj = createMockObject({ id: 'line-1', __class__: 'KritzelLine' } as any);
      lineObj.hitTest = jest.fn(() => true);
      selectionGroup.objectIds = ['line-1'];

      selectionGroup.hitTest(50, 50);

      expect(lineObj.hitTest).toHaveBeenCalledWith(50, 50);
    });
  });

  describe('update', () => {
    it('should call objects.update with selection group', () => {
      selectionGroup.update();

      expect(mockObjectsUpdate).toHaveBeenCalledWith(selectionGroup);
    });
  });

  describe('beginTransform', () => {
    it('should refresh dimensions and capture snapshots', () => {
      createMockObject({
        id: 'obj-1',
        translateX: 10,
        translateY: 20,
      });
      selectionGroup.objectIds = ['obj-1'];

      selectionGroup.beginTransform();

      expect(selectionGroup.unchangedObjectSnapshots.has('obj-1')).toBe(true);
    });
  });

  describe('inheritance from KritzelBaseObject', () => {
    it('should inherit default property values from KritzelBaseObject', () => {
      const group = new KritzelSelectionGroup();
      expect(group.opacity).toBe(1);
      expect(group.padding).toBe(0);
      expect(group.rotation).toBe(0);
      expect(group.isVisible).toBe(true);
      expect(group.isSelected).toBe(false);
      expect(group.isHovered).toBe(false);
      expect(group.isMounted).toBe(false);
      expect(group.markedForRemoval).toBe(false);
    });

    it('should have totalWidth getter that includes padding', () => {
      selectionGroup.width = 100;
      selectionGroup.padding = 10;
      expect(selectionGroup.totalWidth).toBe(120);
    });

    it('should have totalHeight getter that includes padding', () => {
      selectionGroup.height = 50;
      selectionGroup.padding = 5;
      expect(selectionGroup.totalHeight).toBe(60);
    });
  });
});
