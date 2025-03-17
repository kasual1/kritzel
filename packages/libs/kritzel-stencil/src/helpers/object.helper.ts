export class ObjectHelper {
  static toPlainObject(obj: any, visited = new WeakSet(), depth = 0, maxDepth = 100): any {

    if (obj && typeof obj === 'object' && 'options' in obj) {
      delete obj.options;
    }

    if (obj && typeof obj === 'object' && '_elementRef' in obj) {
        delete obj._elementRef;
      }

    if (obj === null || typeof obj !== 'object') {
      return obj; // Return primitive values as-is
    }

    if (visited.has(obj)) {
      // Handle circular references by returning a placeholder or skipping
      return '[Circular]';
    }

    if (depth > maxDepth) {
      // Handle excessive depth by returning a placeholder
      return '[Max Depth Reached]';
    }

    visited.add(obj); // Mark the object as visited

    if (Array.isArray(obj)) {
      // Recursively process each element in the array
      return obj.map(item => this.toPlainObject(item, visited, depth + 1, maxDepth));
    }

    // Process objects
    const plainObject: Record<string, any> = {};
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      plainObject[key] = this.toPlainObject(value, visited, depth + 1, maxDepth); // Recursively process nested objects
    });

    visited.delete(obj); // Clean up visited set for this object
    return plainObject;
  }

  static cloneDeep(obj: any): any {
    return this.toPlainObject(obj);
  }
}
