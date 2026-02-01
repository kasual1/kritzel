import { KritzelBoundingBox } from '../../interfaces/bounding-box.interface';
import { KritzelBaseObject } from '../objects/base-object.class';

export class KritzelQuadtree<T extends KritzelBaseObject<any>> {
  private bounds: KritzelBoundingBox;
  private capacity: number;
  private objects: T[] = [];
  private children: KritzelQuadtree<T>[] | null = null;
  private _size: number = 0;

  /** Total number of objects in the quadtree (O(1) access) */
  get size(): number {
    return this._size;
  }

  constructor(bounds: KritzelBoundingBox, capacity: number = 16) {
    this.bounds = bounds;
    this.capacity = capacity;
  }

  reset(): void {
    this.objects = [];
    this.children = null;
    this._size = 0;
  }

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

  query(range: KritzelBoundingBox): T[] {
    const results: T[] = [];

    if (!this.intersects(range, this.bounds)) {
      return results;
    }

    for (const object of this.objects) {
      if (this.intersects(object.rotatedBoundingBox, range)) {
        results.push(object);
      }
    }

    if (this.children !== null) {
      for (const child of this.children) {
        results.push(...child.query(range));
      }
    }

    return results;
  }

  filter(predicate: (object: T) => boolean): T[] {
    const results: T[] = this.objects.filter(o => predicate(o));
    if (this.children !== null) {
      for (const child of this.children) {
        results.push(...child.filter(predicate));
      }
    }
    return results;
  }

  allObjects(): T[] {
    const results: T[] = [...this.objects];
    if (this.children !== null) {
      for (const child of this.children) {
        results.push(...child.allObjects());
      }
    }
    return results;
  }

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

  private intersects(a: KritzelBoundingBox, b: KritzelBoundingBox): boolean {
    return !(
      a.x >= b.x + b.width || // a is completely to the right of b
      a.x + a.width <= b.x || // a is completely to the left of b
      a.y >= b.y + b.height || // a is completely below b
      a.y + a.height <= b.y // a is completely above b
    );
  }
}
