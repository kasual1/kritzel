import { KritzelBaseObject } from '../classes/objects/base-object.class';
import { cloneDeep } from 'lodash-es';

export class ObjectHelper {
  static safeStringify(obj, indent = 2) {
    const seen = new WeakSet();

    return JSON.stringify(
      obj,
      (_key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return undefined;
          }
          seen.add(value);
        }
        return value;
      },
      indent,
    );
  }

  static generateUUID(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  static clone(objOrObjs: KritzelBaseObject<any> | KritzelBaseObject<any>[]): any {
    const cloneObject = (obj: KritzelBaseObject<any>) => {
      const { _store, _elementRef, totalWidth, totalHeight, ...rest } = obj;
      return cloneDeep(rest);
    };

    if (Array.isArray(objOrObjs)) {
      return objOrObjs.map(cloneObject);
    }

    return cloneObject(objOrObjs);
  }

  static isEmpty(obj: any): boolean {
    if (obj === null || obj === undefined) {
      return true;
    }
    return Object?.keys(obj).length === 0 && obj?.constructor === Object;
  }

}
