import { KritzelGroup } from './group.class';
import { KritzelBaseObject } from './base-object.class';
import { KritzelCore } from '../core/core.class';

describe('KritzelGroup', () => {
  let groupObject: KritzelGroup;
  let mockCore: jest.Mocked<KritzelCore>;
  let mockObjectsUpdate: jest.Mock;
  let mockObjectsTransaction: jest.Mock;
  let mockAnchorManagerUpdate: jest.Mock;
  let mockObjectsStore: KritzelBaseObject<HTMLElement>[];

  const createMockCore = (): jest.Mocked<KritzelCore> => {
    mockObjectsUpdate = jest.fn();
    mockObjectsTransaction = jest.fn((callback: () => void) => callback());
    mockAnchorManagerUpdate = jest.fn();
    mockObjectsStore = [];

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
      mockObjectsStore.forEach(item => arr.push(item));
      return arr;
    };

    return {
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
        get objects() { return this.state.objects; },
        currentZIndex: 5,
      },
      anchorManager: {
        updateAnchorsForObject: mockAnchorManagerUpdate,
      },
    } as unknown as jest.Mocked<KritzelCore>;
  };

  function createMockChildObject(overrides: Partial<KritzelBaseObject<HTMLElement>> = {}): KritzelBaseObject<HTMLElement> {
    const obj = new KritzelBaseObject<HTMLElement>();
    obj._core = mockCore;
    obj.id = `child-${Math.random().toString(36).substr(2, 9)}`;
    obj.translateX = 0;
    obj.translateY = 0;
    obj.width = 100;
    obj.height = 50;
    obj.scale = 1;
    obj.padding = 0;
    obj.rotation = 0;
    obj.zIndex = 1;
    obj.isSelected = false;
    obj.workspaceId = 'workspace-1';

    Object.assign(obj, overrides);
    mockObjectsStore.push(obj);
    return obj;
  }

  beforeEach(() => {
    mockCore = createMockCore();
    groupObject = KritzelGroup.create(mockCore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a group with default values', () => {
      const group = new KritzelGroup();

      expect(group.__class__).toBe('KritzelGroup');
      expect(group.childIds).toEqual([]);
    });

    it('should generate a unique id on instantiation', () => {
      const group1 = new KritzelGroup();
      const group2 = new KritzelGroup();
      expect(group1.id).toBeDefined();
      expect(group2.id).toBeDefined();
      expect(group1.id).not.toBe(group2.id);
    });
  });

  describe('static create', () => {
    it('should create a group with core reference', () => {
      const group = KritzelGroup.create(mockCore);
      expect(group._core).toBe(mockCore);
    });

    it('should set workspaceId from active workspace', () => {
      const group = KritzelGroup.create(mockCore);
      expect(group.workspaceId).toBe('workspace-1');
    });

    it('should generate a unique id', () => {
      const group = KritzelGroup.create(mockCore);
      expect(group.id).toBeDefined();
      expect(typeof group.id).toBe('string');
      expect(group.id.length).toBeGreaterThan(0);
    });

    it('should set scale from core store state', () => {
      const group = KritzelGroup.create(mockCore);
      expect(group.scale).toBe(1);
    });

    it('should set zIndex from currentZIndex', () => {
      const group = KritzelGroup.create(mockCore);
      expect(group.zIndex).toBe(5);
    });

    it('should create multiple unique groups', () => {
      const group1 = KritzelGroup.create(mockCore);
      const group2 = KritzelGroup.create(mockCore);
      expect(group1.id).not.toBe(group2.id);
    });

    it('should convert create rotation from degrees to radians', () => {
      const group = KritzelGroup.create(mockCore, { rotation: -90 });

      expect(group.rotation).toBeCloseTo(-Math.PI / 2);
    });
  });

  describe('static createFromObjects', () => {
    it('should create a group containing the provided objects', () => {
      const child1 = createMockChildObject({ id: 'child-1' });
      const child2 = createMockChildObject({ id: 'child-2' });

      const group = KritzelGroup.createFromObjects(mockCore, [child1, child2]);

      expect(group.childIds).toContain('child-1');
      expect(group.childIds).toContain('child-2');
      expect(group.length).toBe(2);
    });

    it('should calculate bounding box from children', () => {
      const child1 = createMockChildObject({
        id: 'child-1',
        translateX: 0,
        translateY: 0,
        width: 100,
        height: 50,
      });

      const group = KritzelGroup.createFromObjects(mockCore, [child1]);

      expect(group.translateX).toBeDefined();
      expect(group.translateY).toBeDefined();
      expect(group.width).toBeGreaterThan(0);
      expect(group.height).toBeGreaterThan(0);
    });
  });

  describe('static findParentGroup', () => {
    it('should find parent group containing the object', () => {
      createMockChildObject({ id: 'child-1' });
      groupObject.childIds.push('child-1');
      groupObject.__class__ = 'KritzelGroup';
      mockObjectsStore.push(groupObject);

      const parent = KritzelGroup.findParentGroup(mockCore, 'child-1');

      expect(parent).toBe(groupObject);
    });

    it('should return null when object has no parent group', () => {
      createMockChildObject({ id: 'orphan-child' });

      const parent = KritzelGroup.findParentGroup(mockCore, 'orphan-child');

      expect(parent).toBeNull();
    });

    it('should return null for non-existent object', () => {
      const parent = KritzelGroup.findParentGroup(mockCore, 'non-existent');

      expect(parent).toBeNull();
    });
  });

  describe('children getter', () => {
    it('should return empty array when no children', () => {
      expect(groupObject.children).toEqual([]);
    });

    it('should return child objects from store', () => {
      const child1 = createMockChildObject({ id: 'child-1' });
      const child2 = createMockChildObject({ id: 'child-2' });
      groupObject.childIds = ['child-1', 'child-2'];

      const children = groupObject.children;

      expect(children).toHaveLength(2);
      expect(children).toContain(child1);
      expect(children).toContain(child2);
    });

    it('should filter out non-existent child ids', () => {
      const child1 = createMockChildObject({ id: 'child-1' });
      groupObject.childIds = ['child-1', 'non-existent'];

      const children = groupObject.children;

      expect(children).toHaveLength(1);
      expect(children).toContain(child1);
    });
  });

  describe('length getter', () => {
    it('should return 0 when no children', () => {
      expect(groupObject.length).toBe(0);
    });

    it('should return correct count of childIds', () => {
      groupObject.childIds = ['child-1', 'child-2', 'child-3'];
      expect(groupObject.length).toBe(3);
    });
  });

  describe('addChild', () => {
    it('should add child id to childIds', () => {
      const child = createMockChildObject({ id: 'new-child' });

      groupObject.addChild(child);

      expect(groupObject.childIds).toContain('new-child');
    });

    it('should not add duplicate child', () => {
      const child = createMockChildObject({ id: 'child-1' });
      groupObject.childIds = ['child-1'];

      groupObject.addChild(child);

      expect(groupObject.childIds.filter(id => id === 'child-1')).toHaveLength(1);
    });

    it('should refresh bounding box after adding child', () => {
      const child = createMockChildObject({
        id: 'child-1',
        translateX: 50,
        translateY: 50,
        width: 100,
        height: 100,
      });

      groupObject.addChild(child);

      expect(groupObject.width).toBeGreaterThan(0);
      expect(groupObject.height).toBeGreaterThan(0);
    });
  });

  describe('removeChild', () => {
    it('should remove child id from childIds', () => {
      createMockChildObject({ id: 'child-1' });
      groupObject.childIds = ['child-1', 'child-2'];

      groupObject.removeChild('child-1');

      expect(groupObject.childIds).not.toContain('child-1');
      expect(groupObject.childIds).toContain('child-2');
    });

    it('should do nothing when removing non-existent child', () => {
      groupObject.childIds = ['child-1'];

      groupObject.removeChild('non-existent');

      expect(groupObject.childIds).toEqual(['child-1']);
    });
  });

  describe('ungroup', () => {
    it('should return all children', () => {
      const child1 = createMockChildObject({ id: 'child-1' });
      const child2 = createMockChildObject({ id: 'child-2' });
      groupObject.childIds = ['child-1', 'child-2'];

      const ungrouped = groupObject.ungroup();

      expect(ungrouped).toHaveLength(2);
      expect(ungrouped).toContain(child1);
      expect(ungrouped).toContain(child2);
    });

    it('should return empty array when no children', () => {
      const ungrouped = groupObject.ungroup();

      expect(ungrouped).toEqual([]);
    });
  });

  describe('finalize', () => {
    it('should refresh bounding box and capture snapshots', () => {
      createMockChildObject({
        id: 'child-1',
        translateX: 10,
        translateY: 20,
        width: 100,
        height: 50,
      });
      groupObject.childIds = ['child-1'];

      groupObject.finalize();

      expect(groupObject.width).toBeGreaterThanOrEqual(0);
      expect(groupObject.height).toBeGreaterThanOrEqual(0);
    });
  });

  describe('refreshBoundingBox', () => {
    it('should set dimensions to 0 when no children', () => {
      groupObject.refreshBoundingBox();

      expect(groupObject.width).toBe(0);
      expect(groupObject.height).toBe(0);
      expect(groupObject.translateX).toBe(0);
      expect(groupObject.translateY).toBe(0);
    });

    it('should inherit bounding box from single child', () => {
      const child = createMockChildObject({
        id: 'child-1',
        translateX: 10,
        translateY: 20,
        width: 100,
        height: 50,
        scale: 1,
        padding: 0,
      });
      groupObject.childIds = ['child-1'];
      groupObject.scale = 1;

      groupObject.refreshBoundingBox();

      expect(groupObject.translateX).toBe(child.boundingBox.x);
      expect(groupObject.translateY).toBe(child.boundingBox.y);
    });

    it('should calculate encompassing bounding box for multiple children', () => {
      createMockChildObject({
        id: 'child-1',
        translateX: 0,
        translateY: 0,
        width: 50,
        height: 50,
      });
      createMockChildObject({
        id: 'child-2',
        translateX: 100,
        translateY: 100,
        width: 50,
        height: 50,
      });
      groupObject.childIds = ['child-1', 'child-2'];
      groupObject.scale = 1;
      groupObject.padding = 0;
      groupObject.rotation = 0;

      groupObject.refreshBoundingBox();

      expect(groupObject.width).toBeGreaterThan(0);
      expect(groupObject.height).toBeGreaterThan(0);
    });
  });

  describe('move', () => {
    it('should update translateX and translateY', () => {
      groupObject.translateX = 100;
      groupObject.translateY = 100;
      mockCore.store.state.scale = 1;

      groupObject.move(0, 0, -50, -50);

      expect(groupObject.translateX).toBe(150);
      expect(groupObject.translateY).toBe(150);
    });

    it('should move all children', () => {
      const child = createMockChildObject({ id: 'child-1' });
      child.move = jest.fn();
      groupObject.childIds = ['child-1'];

      groupObject.move(0, 0, 10, 10);

      expect(child.move).toHaveBeenCalledWith(0, 0, 10, 10);
    });

    it('should update anchor manager for each child', () => {
      const child = createMockChildObject({ id: 'child-1' });
      child.move = jest.fn();
      groupObject.childIds = ['child-1'];

      groupObject.move(0, 0, 10, 10);

      expect(mockAnchorManagerUpdate).toHaveBeenCalledWith('child-1');
    });

    it('should use transaction for updates', () => {
      const child = createMockChildObject({ id: 'child-1' });
      child.move = jest.fn();
      groupObject.childIds = ['child-1'];

      groupObject.move(0, 0, 10, 10);

      expect(mockObjectsTransaction).toHaveBeenCalled();
    });
  });

  describe('resize', () => {
    beforeEach(() => {
      groupObject.translateX = 0;
      groupObject.translateY = 0;
      groupObject.width = 100;
      groupObject.height = 100;
      groupObject.scale = 1;
      groupObject.padding = 0;
      groupObject.rotation = 0;
    });

    it('should resize children proportionally', () => {
      const child = createMockChildObject({
        id: 'child-1',
        translateX: 25,
        translateY: 25,
        width: 50,
        height: 50,
      });
      child.resize = jest.fn();
      groupObject.childIds = ['child-1'];

      groupObject.resize(0, 0, 200, 200);

      expect(child.resize).toHaveBeenCalled();
    });

    it('should use transaction for updates', () => {
      groupObject.resize(0, 0, 200, 200);

      expect(mockObjectsTransaction).toHaveBeenCalled();
    });

    it('should update anchor manager for resized children', () => {
      const child = createMockChildObject({ id: 'child-1' });
      child.resize = jest.fn();
      groupObject.childIds = ['child-1'];

      groupObject.resize(0, 0, 200, 200);

      expect(mockAnchorManagerUpdate).toHaveBeenCalledWith('child-1');
    });

    it('should call objects.update after resize', () => {
      const child = createMockChildObject({ id: 'child-1' });
      child.resize = jest.fn();
      groupObject.childIds = ['child-1'];

      groupObject.resize(0, 0, 200, 200);

      expect(mockObjectsUpdate).toHaveBeenCalledWith(groupObject);
    });
  });

  describe('rotate', () => {
    beforeEach(() => {
      groupObject.translateX = 0;
      groupObject.translateY = 0;
      groupObject.width = 100;
      groupObject.height = 100;
      groupObject.scale = 1;
      groupObject.padding = 0;
      groupObject.rotation = 0;
    });

    it('should update rotation value', () => {
      groupObject.rotate(Math.PI / 2);

      expect(groupObject.rotation).toBe(Math.PI / 2);
    });

    it('should use transaction for updates', () => {
      groupObject.rotate(Math.PI / 4);

      expect(mockObjectsTransaction).toHaveBeenCalled();
    });

    it('should call objects.update', () => {
      groupObject.rotate(Math.PI / 4);

      expect(mockObjectsUpdate).toHaveBeenCalledWith(groupObject);
    });

    it('should rotate children around group center', () => {
      const child = createMockChildObject({
        id: 'child-1',
        translateX: 0,
        translateY: 0,
        width: 50,
        height: 50,
      });
      child.rotate = jest.fn();
      groupObject.childIds = ['child-1'];

      // Capture snapshots first
      groupObject.finalize();

      groupObject.rotate(Math.PI / 2);

      expect(child.rotate).toHaveBeenCalled();
    });
  });

  describe('hitTest', () => {
    it('should return true when point hits any child', () => {
      const child = createMockChildObject({ id: 'child-1' });
      child.hitTest = jest.fn(() => true);
      groupObject.childIds = ['child-1'];

      const result = groupObject.hitTest(50, 50);

      expect(result).toBe(true);
      expect(child.hitTest).toHaveBeenCalledWith(50, 50);
    });

    it('should return false when point misses all children', () => {
      const child = createMockChildObject({ id: 'child-1' });
      child.hitTest = jest.fn(() => false);
      groupObject.childIds = ['child-1'];

      const result = groupObject.hitTest(500, 500);

      expect(result).toBe(false);
    });

    it('should return false when no children', () => {
      const result = groupObject.hitTest(50, 50);

      expect(result).toBe(false);
    });
  });

  describe('hitTestPolygon', () => {
    it('should return true when polygon hits any child', () => {
      const child = createMockChildObject({ id: 'child-1' });
      child.hitTestPolygon = jest.fn(() => true);
      groupObject.childIds = ['child-1'];

      const polygon = {
        topLeft: { x: 0, y: 0 },
        topRight: { x: 100, y: 0 },
        bottomRight: { x: 100, y: 100 },
        bottomLeft: { x: 0, y: 100 },
      };

      const result = groupObject.hitTestPolygon(polygon);

      expect(result).toBe(true);
    });

    it('should return false when polygon misses all children', () => {
      const child = createMockChildObject({ id: 'child-1' });
      child.hitTestPolygon = jest.fn(() => false);
      groupObject.childIds = ['child-1'];

      const polygon = {
        topLeft: { x: 500, y: 500 },
        topRight: { x: 600, y: 500 },
        bottomRight: { x: 600, y: 600 },
        bottomLeft: { x: 500, y: 600 },
      };

      const result = groupObject.hitTestPolygon(polygon);

      expect(result).toBe(false);
    });
  });

  describe('copy', () => {
    it('should copy the name', () => {
      groupObject.name = 'Hero';

      const copied = groupObject.copy();

      expect(copied.name).toBe('Hero');
    });

    it('should create a new group', () => {
      const copied = groupObject.copy();

      expect(copied).toBeInstanceOf(KritzelGroup);
      expect(copied.id).not.toBe(groupObject.id);
    });

    it('should copy all children', () => {
      const child1 = createMockChildObject({ id: 'child-1', zIndex: 1 });
      const child2 = createMockChildObject({ id: 'child-2', zIndex: 2 });

      const copiedChild1 = createMockChildObject({ id: 'copied-child-1' });
      const copiedChild2 = createMockChildObject({ id: 'copied-child-2' });

      child1.copy = jest.fn(() => copiedChild1);
      child2.copy = jest.fn(() => copiedChild2);

      groupObject.childIds = ['child-1', 'child-2'];

      const copied = groupObject.copy();

      expect(child1.copy).toHaveBeenCalled();
      expect(child2.copy).toHaveBeenCalled();
      expect(copied.childIds).toContain('copied-child-1');
      expect(copied.childIds).toContain('copied-child-2');
    });

    it('should copy group properties', () => {
      groupObject.rotation = Math.PI / 4;
      groupObject.translateX = 50;
      groupObject.translateY = 100;
      groupObject.width = 200;
      groupObject.height = 150;

      const copied = groupObject.copy();

      expect(copied.rotation).toBe(Math.PI / 4);
      expect(copied.translateX).toBe(50);
      expect(copied.translateY).toBe(100);
      expect(copied.width).toBe(200);
      expect(copied.height).toBe(150);
    });

    it('should store pending children for paste', () => {
      const child = createMockChildObject({ id: 'child-1' });
      const copiedChild = createMockChildObject({ id: 'copied-child-1' });
      child.copy = jest.fn(() => copiedChild);
      groupObject.childIds = ['child-1'];

      const copied = groupObject.copy();

      expect((copied as any)._pendingChildren).toBeDefined();
      expect((copied as any)._pendingChildren).toContain(copiedChild);
    });
  });

  describe('serialize', () => {
    it('should serialize group without _core and _elementRef', () => {
      groupObject.id = 'test-id';
      groupObject.translateX = 10;
      groupObject.translateY = 20;
      groupObject.childIds = ['child-1'];

      const serialized = groupObject.serialize();

      expect(serialized._core).toBeUndefined();
      expect(serialized._elementRef).toBeUndefined();
      expect(serialized.id).toBe('test-id');
      expect(serialized.translateX).toBe(10);
      expect(serialized.childIds).toContain('child-1');
    });

    it('should convert unchangedChildSnapshots Map to plain object', () => {
      // Access private property via any
      (groupObject as any).unchangedChildSnapshots = new Map([
        ['child-1', {
          id: 'child-1',
          translateX: 10,
          translateY: 20,
          rotation: 0,
          width: 100,
          height: 50,
          totalWidth: 100,
          totalHeight: 50,
          scale: 1,
        }],
      ]);

      const serialized = groupObject.serialize();

      expect(serialized.unchangedChildSnapshots).toEqual({
        'child-1': {
          id: 'child-1',
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
    it('should restore unchangedChildSnapshots as Map', () => {
      const serialized = {
        id: 'test-id',
        unchangedChildSnapshots: {
          'child-1': {
            id: 'child-1',
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

      groupObject.deserialize(serialized);

      const snapshots = (groupObject as any).unchangedChildSnapshots;
      expect(snapshots).toBeInstanceOf(Map);
      expect(snapshots.has('child-1')).toBe(true);
      expect(snapshots.get('child-1')?.translateX).toBe(10);
    });
  });

  describe('update', () => {
    it('should call objects.update with group', () => {
      groupObject.update();

      expect(mockObjectsUpdate).toHaveBeenCalledWith(groupObject);
    });
  });

  describe('updateWorkspaceId', () => {
    it('should update workspaceId on group', () => {
      groupObject.workspaceId = 'old-workspace';

      groupObject.updateWorkspaceId('new-workspace');

      expect(groupObject.workspaceId).toBe('new-workspace');
    });

    it('should update workspaceId on all children', () => {
      const child1 = createMockChildObject({ id: 'child-1', workspaceId: 'old-workspace' });
      const child2 = createMockChildObject({ id: 'child-2', workspaceId: 'old-workspace' });
      groupObject.childIds = ['child-1', 'child-2'];

      groupObject.updateWorkspaceId('new-workspace');

      expect(child1.workspaceId).toBe('new-workspace');
      expect(child2.workspaceId).toBe('new-workspace');
    });

    it('should recursively update nested groups', () => {
      const nestedGroup = KritzelGroup.create(mockCore);
      nestedGroup.workspaceId = 'old-workspace';
      mockObjectsStore.push(nestedGroup);

      const child = createMockChildObject({ id: 'nested-child', workspaceId: 'old-workspace' });
      nestedGroup.childIds = ['nested-child'];

      groupObject.childIds = [nestedGroup.id];

      groupObject.updateWorkspaceId('new-workspace');

      expect(nestedGroup.workspaceId).toBe('new-workspace');
      expect(child.workspaceId).toBe('new-workspace');
    });
  });

  describe('inheritance from KritzelBaseObject', () => {
    it('should inherit default property values from KritzelBaseObject', () => {
      const group = new KritzelGroup();
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
      groupObject.width = 100;
      groupObject.padding = 10;
      expect(groupObject.totalWidth).toBe(120);
    });

    it('should have totalHeight getter that includes padding', () => {
      groupObject.height = 50;
      groupObject.padding = 5;
      expect(groupObject.totalHeight).toBe(60);
    });

    it('should calculate boundingBox correctly', () => {
      groupObject.translateX = 10;
      groupObject.translateY = 20;
      groupObject.width = 100;
      groupObject.height = 50;
      groupObject.scale = 1;
      groupObject.padding = 0;

      const boundingBox = groupObject.boundingBox;
      expect(boundingBox.x).toBe(10);
      expect(boundingBox.y).toBe(20);
      expect(boundingBox.width).toBe(100);
      expect(boundingBox.height).toBe(50);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Nested-group regressions — see conversation history for the bugs these
  // tests guard against:
  //  - Multi-level selection containing both ancestor + descendant groups
  //  - finalize() must recurse so nested snapshots are aligned
  //  - copy() must cascade into nested groups via _pendingChildren
  //  - resize() must be snapshot-stable across a drag, even when descendants
  //    distort the requested size (e.g. text clamping width/height)
  //  - rotate() must use stable snapshots through the nesting chain
  // ───────────────────────────────────────────────────────────────────────────
  describe('nested groups', () => {
    /**
     * Builds a KritzelGroup wrapping the provided children, registers it in
     * the mock store, and finalizes it so snapshots match the children.
     */
    const buildGroup = (children: KritzelBaseObject<HTMLElement>[]): KritzelGroup => {
      const group = KritzelGroup.create(mockCore);
      group.__class__ = 'KritzelGroup';
      group.padding = 0;
      group.scale = 1;
      group.rotation = 0;
      children.forEach(c => group.childIds.push(c.id));
      mockObjectsStore.push(group as unknown as KritzelBaseObject<HTMLElement>);
      return group;
    };

    describe('static collectDescendantIds', () => {
      it('should collect direct children of a group', () => {
        const c1 = createMockChildObject({ id: 'c-1' });
        const c2 = createMockChildObject({ id: 'c-2' });
        const group = buildGroup([c1, c2]);

        const ids = KritzelGroup.collectDescendantIds(group);

        expect(ids.has('c-1')).toBe(true);
        expect(ids.has('c-2')).toBe(true);
        expect(ids.size).toBe(2);
      });

      it('should recursively collect grandchildren through nested groups', () => {
        const grandchild = createMockChildObject({ id: 'gc-1' });
        const inner = buildGroup([grandchild]);
        const outerSibling = createMockChildObject({ id: 's-1' });
        const outer = buildGroup([inner as unknown as KritzelBaseObject<HTMLElement>, outerSibling]);

        const ids = KritzelGroup.collectDescendantIds(outer);

        expect(ids.has(inner.id)).toBe(true);
        expect(ids.has('gc-1')).toBe(true);
        expect(ids.has('s-1')).toBe(true);
        expect(ids.size).toBe(3);
      });

      it('should return empty set for a group with no children', () => {
        const group = buildGroup([]);

        const ids = KritzelGroup.collectDescendantIds(group);

        expect(ids.size).toBe(0);
      });

      it('should populate the provided output set in place', () => {
        const c1 = createMockChildObject({ id: 'c-1' });
        const group = buildGroup([c1]);
        const out = new Set<string>(['preexisting']);

        const result = KritzelGroup.collectDescendantIds(group, out);

        expect(result).toBe(out);
        expect(out.has('preexisting')).toBe(true);
        expect(out.has('c-1')).toBe(true);
      });
    });

    describe('finalize() recursion', () => {
      it('should align snapshots on nested groups before the parent', () => {
        // Build inner group whose snapshotRotation is intentionally stale
        const grandchild = createMockChildObject({
          id: 'gc-1',
          translateX: 0,
          translateY: 0,
          width: 50,
          height: 50,
        });
        const inner = buildGroup([grandchild]);
        inner.refreshBoundingBox();
        inner.rotation = Math.PI / 3;
        // Force stale snapshot on the inner group so we can detect re-capture
        (inner as any).snapshotRotation = 0;

        const outer = buildGroup([inner as unknown as KritzelBaseObject<HTMLElement>]);

        outer.finalize();

        // After recursive finalize, the inner group's snapshot should reflect
        // its current rotation — proving the recursion happened.
        expect((inner as any).snapshotRotation).toBe(Math.PI / 3);
      });
    });

    describe('copy() with nested groups', () => {
      it('should populate _pendingChildren on every level of the hierarchy', () => {
        const grandchild = createMockChildObject({ id: 'gc-1' });
        const copiedGrandchild = createMockChildObject({ id: 'copied-gc-1' });
        grandchild.copy = jest.fn(() => copiedGrandchild);

        const inner = buildGroup([grandchild]);
        // KritzelGroup.copy() relies on the actual class behavior — keep it real
        const outer = buildGroup([inner as unknown as KritzelBaseObject<HTMLElement>]);

        const copiedOuter = outer.copy();
        const copiedInner = (copiedOuter as any)._pendingChildren[0] as KritzelGroup;

        expect(copiedOuter._pendingChildren).toHaveLength(1);
        expect(copiedInner).toBeInstanceOf(KritzelGroup);
        // Critical: the inner group's grandchildren must also be pending,
        // otherwise paste would strand them and they'd never be inserted.
        expect((copiedInner as any)._pendingChildren).toContain(copiedGrandchild);
      });
    });

    describe('resize() snapshot stability (interactive drag)', () => {
      /**
       * Create a real child whose `resize()` mutates state (so cascading
       * through a nested group reflects the resize chain), and a nested
       * group structure: outer → inner → child.
       */
      const setupNestedResizeFixture = () => {
        const child = createMockChildObject({
          id: 'leaf-1',
          translateX: 0,
          translateY: 0,
          width: 100,
          height: 100,
        });
        child.resize = jest.fn((cx: number, cy: number, cw: number, ch: number) => {
          child.translateX = cx;
          child.translateY = cy;
          child.width = cw;
          child.height = ch;
        });

        const inner = buildGroup([child]);
        inner.refreshBoundingBox();

        const outer = buildGroup([inner as unknown as KritzelBaseObject<HTMLElement>]);
        outer.finalize();

        return { outer, inner, child };
      };

      it('should not recapture child snapshots during an interactive resize', () => {
        const { outer } = setupNestedResizeFixture();
        const initialSnapshotWidth = (outer as any).snapshotTotalWidth;

        (mockCore.store.state as any).isResizing = true;
        outer.resize(0, 0, 50, 50);

        // Snapshot must remain stable mid-gesture so cascade factors stay correct
        expect((outer as any).snapshotTotalWidth).toBe(initialSnapshotWidth);
      });

      it('should recapture child snapshots when resize completes', () => {
        const { outer } = setupNestedResizeFixture();
        const initialSnapshotWidth = (outer as any).snapshotTotalWidth;

        (mockCore.store.state as any).isResizing = false;
        outer.resize(0, 0, 50, 50);

        expect((outer as any).snapshotTotalWidth).not.toBe(initialSnapshotWidth);
      });

      it('should restore the original child size when an interactive resize returns to the original dimensions', () => {
        // This is the regression test for the "text keeps shrinking" bug.
        // During a drag we should be able to shrink and grow without drift.
        const { outer, child } = setupNestedResizeFixture();
        const originalWidth = child.width;
        const originalHeight = child.height;

        (mockCore.store.state as any).isResizing = true;

        // Simulate drag: shrink, shrink more, grow back to original
        outer.resize(0, 0, 60, 60);
        outer.resize(0, 0, 30, 30);
        outer.resize(0, 0, 100, 100);

        // Without snapshot-based cascade the final restore would not produce the
        // original size because each call would have used a mutated denominator.
        expect(child.width).toBeCloseTo(originalWidth, 5);
        expect(child.height).toBeCloseTo(originalHeight, 5);
      });

      it('should compute cascade factor from snapshots (not mutated current values)', () => {
        const { outer, child } = setupNestedResizeFixture();
        (mockCore.store.state as any).isResizing = true;

        // First call: half size — cascade factor 0.5
        outer.resize(0, 0, 50, 50);
        expect(child.width).toBeCloseTo(50, 5);
        expect(child.height).toBeCloseTo(50, 5);

        // Second call from the same snapshot: 0.75 — should produce 75, not
        // (50 * 1.5 = 75 by coincidence) but explicitly via the snapshot. To
        // distinguish, request 0.5x again — snapshot-based gives 50, mutated
        // would give 25 (half of half).
        outer.resize(0, 0, 50, 50);
        expect(child.width).toBeCloseTo(50, 5);
        expect(child.height).toBeCloseTo(50, 5);
      });
    });

    describe('rotate() with nested groups', () => {
      it('should rotate using snapshot offsets so nested children stay anchored', () => {
        const grandchild = createMockChildObject({
          id: 'gc-1',
          translateX: 0,
          translateY: 0,
          width: 50,
          height: 50,
        });
        grandchild.rotate = jest.fn();

        const inner = buildGroup([grandchild]);
        inner.refreshBoundingBox();

        const outer = buildGroup([inner as unknown as KritzelBaseObject<HTMLElement>]);
        outer.finalize();

        // Spy on the inner group's rotate to verify it's called with a value
        // derived from a fresh (post-finalize) snapshotRotation.
        const innerRotateSpy = jest.spyOn(inner, 'rotate');

        outer.rotate(Math.PI / 4);

        expect(innerRotateSpy).toHaveBeenCalled();
        // Single child of outer → outer passes its own value verbatim
        expect(innerRotateSpy.mock.calls[0][0]).toBeCloseTo(Math.PI / 4, 5);
      });
    });
  });
});
