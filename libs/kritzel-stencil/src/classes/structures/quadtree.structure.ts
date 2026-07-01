import { KritzelBoundingBox } from '../../interfaces/bounding-box.interface';
import { KritzelBaseObject } from '../objects/base-object.class';

/**
 * A quadtree data structure for efficient spatial indexing of objects.
 * Quadtrees recursively subdivide 2D space into four quadrants to enable
 * fast spatial queries like finding all objects within a given region.
 *
 * @template T - The type of objects stored in the quadtree, must extend KritzelBaseObject
 */
export class KritzelQuadtree<T extends KritzelBaseObject<any>> {
  private bounds: KritzelBoundingBox;
  private capacity: number;
  private objects: T[] = [];
  private children: KritzelQuadtree<T>[] | null = null;
  private _size: number = 0;

  /**
   * Total number of objects in the quadtree (O(1) access).
   * @returns The count of all objects stored in this quadtree and its children
   */
  get size(): number {
    return this._size;
  }

  /**
   * Creates a new quadtree with the specified bounds and capacity.
   *
   * @param bounds - The bounding box defining the spatial region covered by this quadtree
   * @param capacity - Maximum number of objects a node can hold before subdividing (default: 16)
   */
  constructor(bounds: KritzelBoundingBox, capacity: number = 16) {
    this.bounds = bounds;
    this.capacity = capacity;
  }

  /**
   * Resets the quadtree to its initial empty state.
   * Clears all stored objects and removes all child nodes.
   */
  reset(): void {
    this.objects = [];
    this.children = null;
    this._size = 0;
  }

  /**
   * Inserts an object into the quadtree.
   * If the current node exceeds capacity, it will subdivide and delegate
   * the insertion to the appropriate child quadrant.
   *
   * @param object - The object to insert, must have a rotatedBoundingBox property
   * @returns `true` if the object was successfully inserted, `false` if it doesn't intersect the quadtree bounds
   */
  insert(object: T): boolean {
    if (!this.intersects(object.rotatedBoundingBox, this.bounds)) {
      return false;
    }

    if (this.objects.length < this.capacity && this.children === null) {
      this.objects.push(object);
      this._size++;
      return true;
    }

    if (this.children === null) {
      this.subdivide();
    }

    for (const child of this.children!) {
      if (child.insert(object)) {
        this._size++;
        return true;
      }
    }

    return false;
  }

  /**
   * Updates an existing object in the quadtree by matching its ID.
   * Searches through the tree to find the object and replaces it with the new reference.
   * Note: This does not reposition the object if its bounding box has changed.
   *
   * @param object - The updated object with the same ID as the one to replace
   * @returns `true` if the object was found and updated, `false` otherwise
   */
  update(object: T): boolean {
    const index = this.objects.findIndex(o => o.id === object.id);

    if (index !== -1) {
      this.objects[index] = object;
      return true;
    }
    if (this.children !== null) {
      for (const child of this.children) {
        if (child.update(object)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Reindexes an existing object by removing it from its current node and
   * reinserting it based on its latest bounding box.
   *
   * @param object - The updated object to reindex
   * @returns `true` if the object was found and reinserted, `false` otherwise
   */
  reindex(object: T): boolean {
    const removed = this.remove(o => o.id === object.id);
    if (removed === 0) {
      return false;
    }

    return this.insert(object);
  }

  /**
   * Removes objects from the quadtree that match the given predicate.
   * Recursively searches through all nodes and removes matching objects.
   *
   * @param predicate - A function that returns `true` for objects that should be removed
   * @returns The total number of objects removed from the quadtree
   */
  remove(predicate: (object: T) => boolean): number {
    let removed = 0;
    const index = this.objects.findIndex(o => predicate(o));
    if (index !== -1) {
      this.objects.splice(index, 1);
      removed++;
    }

    if (this.children !== null) {
      for (const child of this.children) {
        removed += child.remove(predicate);
      }
    }

    this._size -= removed;
    return removed;
  }

  /**
   * Finds all objects whose bounding boxes intersect with the given range.
   * This is the primary spatial query method for efficient object retrieval.
   *
   * @param range - The bounding box to query against
   * @returns An array of all objects that intersect with the given range
   */
  query(range: KritzelBoundingBox): T[] {
    const results: T[] = [];
    this._queryInto(range, results);
    return results;
  }

  /**
   * Internal method that collects query results into a pre-allocated array.
   * Avoids creating intermediate arrays from spread operators.
   *
   * @param range - The bounding box to query against
   * @param results - The array to collect matching objects into
   */
  private _queryInto(range: KritzelBoundingBox, results: T[]): void {
    if (!this.intersects(range, this.bounds)) {
      return;
    }

    for (const object of this.objects) {
      if (this.intersects(object.rotatedBoundingBox, range)) {
        results.push(object);
      }
    }

    if (this.children !== null) {
      for (const child of this.children) {
        child._queryInto(range, results);
      }
    }
  }

  /**
   * Filters all objects in the quadtree using a custom predicate function.
   * Unlike `query`, this method checks all objects regardless of spatial location.
   *
   * @param predicate - A function that returns `true` for objects to include in results
   * @returns An array of all objects that satisfy the predicate
   */
  filter(predicate: (object: T) => boolean): T[] {
    const results: T[] = [];
    this._filterInto(predicate, results);
    return results;
  }

  /**
   * Internal method that collects filter results into a pre-allocated array.
   * Avoids creating intermediate arrays from spread operators.
   *
   * @param predicate - A function that returns `true` for objects to include
   * @param results - The array to collect matching objects into
   */
  private _filterInto(predicate: (object: T) => boolean, results: T[]): void {
    for (const obj of this.objects) {
      if (predicate(obj)) {
        results.push(obj);
      }
    }
    if (this.children !== null) {
      for (const child of this.children) {
        child._filterInto(predicate, results);
      }
    }
  }

  /**
   * Retrieves all objects stored in the quadtree.
   * Traverses the entire tree structure to collect every object.
   *
   * @returns An array containing all objects in the quadtree
   */
  allObjects(): T[] {
    const results: T[] = [];
    this._collectAllInto(results);
    return results;
  }

  /**
   * Internal method that collects all objects into a pre-allocated array.
   * Avoids creating intermediate arrays from spread operators.
   *
   * @param results - The array to collect all objects into
   */
  private _collectAllInto(results: T[]): void {
    for (const obj of this.objects) {
      results.push(obj);
    }
    if (this.children !== null) {
      for (const child of this.children) {
        child._collectAllInto(results);
      }
    }
  }

  /**
   * Subdivides this quadtree node into four child quadrants.
   * Called automatically when the node's capacity is exceeded.
   * Creates children for: Northwest (NW), Northeast (NE), Southwest (SW), Southeast (SE).
   */
  private subdivide(): void {
    const { x, y, z, width, height } = this.bounds;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Create 4 quadrants: NW, NE, SW, SE
    this.children = [
      new KritzelQuadtree<T>({ x, y, z, width: halfWidth, height: halfHeight }, this.capacity), // Northwest
      new KritzelQuadtree<T>({ x: x + halfWidth, y, z, width: halfWidth, height: halfHeight }, this.capacity), // Northeast
      new KritzelQuadtree<T>({ x, y: y + halfHeight, z, width: halfWidth, height: halfHeight }, this.capacity), // Southwest
      new KritzelQuadtree<T>({ x: x + halfWidth, y: y + halfHeight, z, width: halfWidth, height: halfHeight }, this.capacity), // Southeast
    ];
  }

  /**
   * Checks whether two bounding boxes intersect (overlap) each other.
   * Uses axis-aligned bounding box (AABB) collision detection.
   *
   * @param a - The first bounding box
   * @param b - The second bounding box
   * @returns `true` if the bounding boxes overlap, `false` otherwise
   */
  private intersects(a: KritzelBoundingBox, b: KritzelBoundingBox): boolean {
    return !(
      a.x >= b.x + b.width || // a is completely to the right of b
      a.x + a.width <= b.x || // a is completely to the left of b
      a.y >= b.y + b.height || // a is completely below b
      a.y + a.height <= b.y // a is completely above b
    );
  }
}
