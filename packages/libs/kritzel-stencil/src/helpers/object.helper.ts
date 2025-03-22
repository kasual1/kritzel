import { cloneDeep } from 'lodash-es';

export class ObjectHelper {

  static safeStringify(obj, indent = 2) {
    const seen = new WeakSet();
  
    return JSON.stringify(obj, (_key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return undefined;
        }
        seen.add(value);
      }
      return value;
    }, indent);
  }

  static removeProperties(obj: any, properties: string[]): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeProperties(item, properties));
    }

    if (obj && typeof obj === 'object') {
      const clone = this.cloneDeep(obj);
      Object.keys(clone).forEach(key => {
        if (properties.includes(key)) {
          delete clone[key];
        } else {
          clone[key] = this.removeProperties(clone[key], properties);
        }
      });
      return clone;
    }

    return obj;
  }

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
    const clone = cloneDeep(obj);
    return clone;
  }

  static generateUUID(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
