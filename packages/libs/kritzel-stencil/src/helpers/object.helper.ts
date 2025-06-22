import { KritzelBaseObject } from '../classes/objects/base-object.class';
import { cloneDeep } from 'clone-deep';

export class ObjectHelper {

  static generateUUID(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  static clone(objOrObjs: KritzelBaseObject<any> | KritzelBaseObject<any>[]): any {
    const cloneObject = (obj: KritzelBaseObject<any>) => {
      const { _store, _elementRef, totalWidth, totalHeight, ...remainingProps } = obj;
      return cloneDeep(remainingProps);
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
