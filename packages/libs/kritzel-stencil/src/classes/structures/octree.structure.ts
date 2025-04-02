import { KritzelBoundingBox } from '../../interfaces/bounding-box.interface';
import { KritzelBaseObject } from '../objects/base-object.class';

export class KritzelOctree<T extends KritzelBaseObject<any>> {
  private bounds: KritzelBoundingBox;
  private capacity: number;
  private objects: { object: T; bounds: KritzelBoundingBox }[] = [];
  private children: KritzelOctree<T>[] | null = null;

  constructor(bounds: KritzelBoundingBox, capacity: number = 8) {
    this.bounds = bounds;
    this.capacity = capacity;
  }

  insert(object: T, bounds: KritzelBoundingBox): boolean {
    if (!this.intersects(bounds, this.bounds)) {
      return false;
    }

    if (this.objects.length < this.capacity && this.children === null) {
      this.objects.push({ object, bounds });
      return true;
    }

    if (this.children === null) {
      this.subdivide();
    }

    for (const child of this.children!) {
      if (child.insert(object, bounds)) {
        return true;
      }
    }

    return false;
  }

  remove(object: T): boolean {
    const index = this.objects.findIndex(o => o.object.id === object.id);
    if (index !== -1) {
      this.objects.splice(index, 1);
      return true;
    }
  
    if (this.children !== null) {
      for (const child of this.children) {
        if (child.remove(object)) {
          return true;
        }
      }
    }
  
    return false;
  }

  filter(predicate: (object: T) => boolean): T[] {
    const results: T[] = [];
    for (const { object } of this.objects) {
      if (predicate(object)) {
        results.push(object);
      }
    }
    if (this.children !== null) {
      for (const child of this.children) {
        results.push(...child.filter(predicate));
      }
    }
    return results;
  }
  

  query(range: KritzelBoundingBox): T[] {
    const results: T[] = [];

    if (!this.intersects(range, this.bounds)) {
      return results;
    }

    for (const { object, bounds } of this.objects) {
      if (this.intersects(bounds, range)) {
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

  private subdivide(): void {
    const { x, y, z, width, height, depth } = this.bounds;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const halfDepth = depth / 2;

    this.children = [
      new KritzelOctree<T>({ x, y, z, width: halfWidth, height: halfHeight, depth: halfDepth }, this.capacity),
      new KritzelOctree<T>({ x: x + halfWidth, y, z, width: halfWidth, height: halfHeight, depth: halfDepth }, this.capacity),
      new KritzelOctree<T>({ x, y: y + halfHeight, z, width: halfWidth, height: halfHeight, depth: halfDepth }, this.capacity),
      new KritzelOctree<T>({ x: x + halfWidth, y: y + halfHeight, z, width: halfWidth, height: halfHeight, depth: halfDepth }, this.capacity),
      new KritzelOctree<T>({ x, y, z: z + halfDepth, width: halfWidth, height: halfHeight, depth: halfDepth }, this.capacity),
      new KritzelOctree<T>({ x: x + halfWidth, y, z: z + halfDepth, width: halfWidth, height: halfHeight, depth: halfDepth }, this.capacity),
      new KritzelOctree<T>({ x, y: y + halfHeight, z: z + halfDepth, width: halfWidth, height: halfHeight, depth: halfDepth }, this.capacity),
      new KritzelOctree<T>({ x: x + halfWidth, y: y + halfHeight, z: z + halfDepth, width: halfWidth, height: halfHeight, depth: halfDepth }, this.capacity),
    ];
  }

  intersects(a: KritzelBoundingBox, b: KritzelBoundingBox): boolean {
    return !(
      a.x >= b.x + b.width || // a is completely to the right of b
      a.x + a.width <= b.x || // a is completely to the left of b
      a.y >= b.y + b.height || // a is completely below b
      a.y + a.height <= b.y    // a is completely above b
  );
  }
}
