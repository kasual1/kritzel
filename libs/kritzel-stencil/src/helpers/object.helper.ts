import { KritzelBaseObject } from '../classes/objects/base-object.class';

export class ObjectHelper {
  static generateUUID(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  static clone(objOrObjs: KritzelBaseObject<any> | KritzelBaseObject<any>[]): any {
    const cloneObject = (obj: KritzelBaseObject<any>) => {
      const { _core, _elementRef, totalWidth, totalHeight, element, ...remainingProps } = obj as any;

      const clonedProps = structuredClone(remainingProps);

      if (element && typeof element === 'object' && 'nodeType' in element && element.nodeType === 1) {
        clonedProps.element = element.cloneNode(true) as HTMLElement;
      }

      return clonedProps;
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
