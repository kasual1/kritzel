import { KritzelQuadtree } from './quadtree.structure';
import { KritzelBoundingBox } from '../../interfaces/bounding-box.interface';

interface MockObject {
  id: string;
  rotatedBoundingBox: KritzelBoundingBox;
}

const createObject = (id: string, x: number, y: number, width: number, height: number): MockObject => ({
  id,
  rotatedBoundingBox: { x, y, z: 0, width, height },
});

const WORLD_BOUNDS: KritzelBoundingBox = { x: 0, y: 0, z: 0, width: 100, height: 100 };

describe('KritzelQuadtree', () => {
  let tree: KritzelQuadtree<any>;

  beforeEach(() => {
    tree = new KritzelQuadtree(WORLD_BOUNDS);
  });

  describe('constructor', () => {
    it('should initialize with size 0', () => {
      expect(tree.size).toBe(0);
    });

    it('should accept a custom capacity', () => {
      const smallTree = new KritzelQuadtree(WORLD_BOUNDS, 2);
      expect(smallTree.size).toBe(0);
    });
  });

  describe('insert', () => {
    it('should insert an object within bounds', () => {
      const obj = createObject('a', 10, 10, 20, 20);

      const result = tree.insert(obj);

      expect(result).toBe(true);
      expect(tree.size).toBe(1);
    });

    it('should reject an object outside bounds', () => {
      const obj = createObject('a', 200, 200, 10, 10);

      const result = tree.insert(obj);

      expect(result).toBe(false);
      expect(tree.size).toBe(0);
    });

    it('should insert multiple objects', () => {
      tree.insert(createObject('a', 10, 10, 5, 5));
      tree.insert(createObject('b', 60, 60, 5, 5));
      tree.insert(createObject('c', 10, 60, 5, 5));

      expect(tree.size).toBe(3);
    });

    it('should subdivide when capacity is exceeded', () => {
      const smallTree = new KritzelQuadtree<any>(WORLD_BOUNDS, 2);

      smallTree.insert(createObject('a', 10, 10, 5, 5));
      smallTree.insert(createObject('b', 60, 10, 5, 5));
      // Third insert triggers subdivision
      smallTree.insert(createObject('c', 10, 60, 5, 5));

      expect(smallTree.size).toBe(3);
    });

    it('should reject object that does not intersect any child after subdivision', () => {
      const smallTree = new KritzelQuadtree<any>(WORLD_BOUNDS, 1);

      smallTree.insert(createObject('a', 10, 10, 5, 5));
      // Forces subdivision, then tries to insert in children - object outside bounds
      const result = smallTree.insert(createObject('b', 200, 200, 5, 5));

      expect(result).toBe(false);
    });
  });

  describe('query', () => {
    it('should return empty array for empty tree', () => {
      const results = tree.query({ x: 0, y: 0, z: 0, width: 50, height: 50 });

      expect(results).toEqual([]);
    });

    it('should return objects that intersect the query range', () => {
      const obj = createObject('a', 10, 10, 20, 20);
      tree.insert(obj);

      const results = tree.query({ x: 0, y: 0, z: 0, width: 50, height: 50 });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('a');
    });

    it('should not return objects outside the query range', () => {
      tree.insert(createObject('a', 80, 80, 10, 10));

      const results = tree.query({ x: 0, y: 0, z: 0, width: 50, height: 50 });

      expect(results).toEqual([]);
    });

    it('should return only matching objects from mixed set', () => {
      tree.insert(createObject('a', 10, 10, 5, 5));
      tree.insert(createObject('b', 80, 80, 5, 5));
      tree.insert(createObject('c', 20, 20, 5, 5));

      const results = tree.query({ x: 0, y: 0, z: 0, width: 50, height: 50 });

      const ids = results.map((r: any) => r.id).sort();
      expect(ids).toEqual(['a', 'c']);
    });

    it('should return objects from children after subdivision', () => {
      const smallTree = new KritzelQuadtree<any>(WORLD_BOUNDS, 2);

      smallTree.insert(createObject('a', 10, 10, 5, 5));
      smallTree.insert(createObject('b', 60, 10, 5, 5));
      smallTree.insert(createObject('c', 10, 60, 5, 5));

      const results = smallTree.query({ x: 0, y: 0, z: 0, width: 50, height: 50 });

      expect(results.some((r: any) => r.id === 'a')).toBe(true);
    });

    it('should not return results when query range is outside tree bounds', () => {
      tree.insert(createObject('a', 10, 10, 5, 5));

      const results = tree.query({ x: 200, y: 200, z: 0, width: 50, height: 50 });

      expect(results).toEqual([]);
    });
  });

  describe('remove', () => {
    it('should remove an object by predicate', () => {
      tree.insert(createObject('a', 10, 10, 5, 5));
      tree.insert(createObject('b', 20, 20, 5, 5));

      const removed = tree.remove(o => o.id === 'a');

      expect(removed).toBe(1);
      expect(tree.size).toBe(1);
    });

    it('should return 0 when predicate matches nothing', () => {
      tree.insert(createObject('a', 10, 10, 5, 5));

      const removed = tree.remove(o => o.id === 'nonexistent');

      expect(removed).toBe(0);
      expect(tree.size).toBe(1);
    });

    it('should remove objects from child nodes after subdivision', () => {
      const smallTree = new KritzelQuadtree<any>(WORLD_BOUNDS, 2);

      smallTree.insert(createObject('a', 10, 10, 5, 5));
      smallTree.insert(createObject('b', 60, 10, 5, 5));
      smallTree.insert(createObject('c', 10, 60, 5, 5));

      const removed = smallTree.remove(o => o.id === 'c');

      expect(removed).toBe(1);
      expect(smallTree.size).toBe(2);
    });

    it('should update size correctly after removing from empty tree', () => {
      const removed = tree.remove(o => o.id === 'a');

      expect(removed).toBe(0);
      expect(tree.size).toBe(0);
    });
  });

  describe('update', () => {
    it('should update an existing object in the root node', () => {
      const obj = createObject('a', 10, 10, 5, 5);
      tree.insert(obj);

      const updated = createObject('a', 30, 30, 10, 10);
      const result = tree.update(updated);

      expect(result).toBe(true);
      const all = tree.allObjects();
      expect(all[0].rotatedBoundingBox.x).toBe(30);
    });

    it('should return false when object is not found', () => {
      tree.insert(createObject('a', 10, 10, 5, 5));

      const result = tree.update(createObject('nonexistent', 10, 10, 5, 5));

      expect(result).toBe(false);
    });

    it('should update an object in child nodes after subdivision', () => {
      const smallTree = new KritzelQuadtree<any>(WORLD_BOUNDS, 2);

      smallTree.insert(createObject('a', 10, 10, 5, 5));
      smallTree.insert(createObject('b', 60, 10, 5, 5));
      smallTree.insert(createObject('c', 10, 60, 5, 5));

      const updated = createObject('c', 10, 60, 20, 20);
      const result = smallTree.update(updated);

      expect(result).toBe(true);
    });
  });

  describe('reindex', () => {
    it('should reindex an object into a different query region after a large move', () => {
      const smallTree = new KritzelQuadtree<any>(WORLD_BOUNDS, 2);
      smallTree.insert(createObject('a', 10, 10, 5, 5));
      smallTree.insert(createObject('b', 60, 10, 5, 5));
      smallTree.insert(createObject('c', 10, 60, 5, 5));

      const result = smallTree.reindex(createObject('a', 80, 80, 5, 5));

      expect(result).toBe(true);
      const oldRegion = smallTree.query({ x: 0, y: 0, z: 0, width: 50, height: 50 }).map((o: any) => o.id);
      const newRegion = smallTree.query({ x: 70, y: 70, z: 0, width: 30, height: 30 }).map((o: any) => o.id);
      expect(oldRegion).not.toContain('a');
      expect(newRegion).toContain('a');
    });

    it('should keep tree size stable after reindex', () => {
      tree.insert(createObject('a', 10, 10, 5, 5));
      tree.insert(createObject('b', 20, 20, 5, 5));
      tree.insert(createObject('c', 30, 30, 5, 5));

      const result = tree.reindex(createObject('a', 40, 40, 5, 5));

      expect(result).toBe(true);
      expect(tree.size).toBe(3);
    });

    it('should return false when object does not exist', () => {
      tree.insert(createObject('a', 10, 10, 5, 5));

      const result = tree.reindex(createObject('missing', 40, 40, 5, 5));

      expect(result).toBe(false);
      expect(tree.size).toBe(1);
    });
  });

  describe('filter', () => {
    it('should return objects matching the predicate', () => {
      tree.insert(createObject('a', 10, 10, 5, 5));
      tree.insert(createObject('b', 20, 20, 5, 5));
      tree.insert(createObject('c', 30, 30, 5, 5));

      const results = tree.filter(o => o.id === 'a' || o.id === 'c');

      const ids = results.map((r: any) => r.id).sort();
      expect(ids).toEqual(['a', 'c']);
    });

    it('should return empty array when nothing matches', () => {
      tree.insert(createObject('a', 10, 10, 5, 5));

      const results = tree.filter(o => o.id === 'nonexistent');

      expect(results).toEqual([]);
    });

    it('should filter across child nodes after subdivision', () => {
      const smallTree = new KritzelQuadtree<any>(WORLD_BOUNDS, 2);

      smallTree.insert(createObject('a', 10, 10, 5, 5));
      smallTree.insert(createObject('b', 60, 10, 5, 5));
      smallTree.insert(createObject('c', 10, 60, 5, 5));

      const results = smallTree.filter(o => o.id !== 'b');

      const ids = results.map((r: any) => r.id).sort();
      expect(ids).toEqual(['a', 'c']);
    });
  });

  describe('allObjects', () => {
    it('should return empty array for empty tree', () => {
      expect(tree.allObjects()).toEqual([]);
    });

    it('should return all inserted objects', () => {
      tree.insert(createObject('a', 10, 10, 5, 5));
      tree.insert(createObject('b', 60, 60, 5, 5));

      const all = tree.allObjects();

      expect(all).toHaveLength(2);
      const ids = all.map((o: any) => o.id).sort();
      expect(ids).toEqual(['a', 'b']);
    });

    it('should collect objects from child nodes after subdivision', () => {
      const smallTree = new KritzelQuadtree<any>(WORLD_BOUNDS, 2);

      smallTree.insert(createObject('a', 10, 10, 5, 5));
      smallTree.insert(createObject('b', 60, 10, 5, 5));
      smallTree.insert(createObject('c', 10, 60, 5, 5));
      smallTree.insert(createObject('d', 60, 60, 5, 5));

      const all = smallTree.allObjects();

      expect(all).toHaveLength(4);
    });
  });

  describe('reset', () => {
    it('should clear all objects and reset size', () => {
      tree.insert(createObject('a', 10, 10, 5, 5));
      tree.insert(createObject('b', 60, 60, 5, 5));

      tree.reset();

      expect(tree.size).toBe(0);
      expect(tree.allObjects()).toEqual([]);
    });

    it('should allow inserting after reset', () => {
      tree.insert(createObject('a', 10, 10, 5, 5));
      tree.reset();

      tree.insert(createObject('b', 20, 20, 5, 5));

      expect(tree.size).toBe(1);
      expect(tree.allObjects()[0].id).toBe('b');
    });
  });

  describe('edge cases', () => {
    it('should handle objects at the boundary edge', () => {
      // Object touching the right/bottom edge exactly - should NOT intersect
      const edgeObj = createObject('edge', 100, 100, 10, 10);

      const result = tree.insert(edgeObj);

      expect(result).toBe(false);
    });

    it('should handle objects overlapping the boundary', () => {
      const obj = createObject('overlap', 90, 90, 20, 20);

      const result = tree.insert(obj);

      expect(result).toBe(true);
    });

    it('should handle zero-size objects at origin', () => {
      const obj = createObject('zero', 0, 0, 0, 0);

      // Zero-width/height won't intersect due to strict inequality checks
      const result = tree.insert(obj);

      expect(result).toBe(false);
    });

    it('should maintain correct size through mixed operations', () => {
      tree.insert(createObject('a', 10, 10, 5, 5));
      tree.insert(createObject('b', 20, 20, 5, 5));
      tree.insert(createObject('c', 30, 30, 5, 5));

      expect(tree.size).toBe(3);

      tree.remove(o => o.id === 'b');

      expect(tree.size).toBe(2);

      tree.insert(createObject('d', 40, 40, 5, 5));

      expect(tree.size).toBe(3);
    });
  });
});
