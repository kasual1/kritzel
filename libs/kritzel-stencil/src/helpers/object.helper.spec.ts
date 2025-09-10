import { KritzelBaseObject } from '../classes/objects/base-object.class';
import { ObjectHelper } from './object.helper';

// Mock KritzelBaseObject for testing purposes
class MockObject extends KritzelBaseObject<any> {
  public __class__ = 'MockObject';
  public id: string;
  public someProp: string;
  public nested: { a: number };
  public element?: HTMLElement;

  // Properties that should be excluded from the clone
  public _store: any = { data: 'store_data' };
  public _elementRef: any = { ref: 'element_ref' };

  constructor(id: string, someProp: string) {
    super();
    this.id = id;
    this.someProp = someProp;
    this.nested = { a: 1 };
  }
}

describe('ObjectHelper', () => {
  describe('generateUUID', () => {
    it('should return a string', () => {
      expect(typeof ObjectHelper.generateUUID()).toBe('string');
    });

    it('should return a string of length 9', () => {
      expect(ObjectHelper.generateUUID().length).toBe(9);
    });

    it('should return different values on subsequent calls', () => {
      const uuid1 = ObjectHelper.generateUUID();
      const uuid2 = ObjectHelper.generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('clone', () => {
    let originalObject: MockObject;

    beforeEach(() => {
      originalObject = new MockObject('test-id', 'test-prop');
    });

    it('should clone a single object and its properties', () => {
      const clonedObject = ObjectHelper.clone(originalObject);

      expect(clonedObject).not.toBe(originalObject);
      expect(clonedObject.id).toBe(originalObject.id);
      expect(clonedObject.someProp).toBe(originalObject.someProp);
      expect(clonedObject.nested).toEqual(originalObject.nested);

      // Check deep clone
      clonedObject.nested.a = 2;
      expect(originalObject.nested.a).toBe(1);
    });

    it('should exclude specific properties from the clone', () => {
      const clonedObject = ObjectHelper.clone(originalObject);

      expect(clonedObject._store).toBeUndefined();
      expect(clonedObject._elementRef).toBeUndefined();
      expect(clonedObject.totalWidth).toBeUndefined();
      expect(clonedObject.totalHeight).toBeUndefined();
    });

    it('should clone the element property if it is an HTMLElement', () => {
      originalObject.element = document.createElement('div');
      originalObject.element.id = 'original-element';

      const clonedObject = ObjectHelper.clone(originalObject);

      expect(typeof clonedObject.element === 'object' && clonedObject.element !== null && 'nodeType' in clonedObject.element && (clonedObject.element as any).nodeType === 1).toBe(
        true,
      );
      expect(clonedObject.element).not.toBe(originalObject.element);
      expect(clonedObject.element.id).toBe('original-element');
    });

    it('should clone an array of objects', () => {
      const obj1 = new MockObject('id1', 'prop1');
      const obj2 = new MockObject('id2', 'prop2');
      const originalArray = [obj1, obj2];

      const clonedArray = ObjectHelper.clone(originalArray);

      expect(Array.isArray(clonedArray)).toBe(true);
      expect(clonedArray.length).toBe(2);
      expect(clonedArray[0]).not.toBe(obj1);
      expect(clonedArray[0].id).toBe('id1');
      expect(clonedArray[1].id).toBe('id2');
      expect(clonedArray[0]._store).toBeUndefined();
    });
  });

  describe('isEmpty', () => {
    it('should return true for null', () => {
      expect(ObjectHelper.isEmpty(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(ObjectHelper.isEmpty(undefined)).toBe(true);
    });

    it('should return true for an empty object literal', () => {
      expect(ObjectHelper.isEmpty({})).toBe(true);
    });

    it('should return false for a non-empty object literal', () => {
      expect(ObjectHelper.isEmpty({ a: 1 })).toBe(false);
    });

    it('should return false for an empty array', () => {
      expect(ObjectHelper.isEmpty([])).toBe(false);
    });

    it('should return false for a non-empty array', () => {
      expect(ObjectHelper.isEmpty([1, 2])).toBe(false);
    });

    it('should return false for a string', () => {
      expect(ObjectHelper.isEmpty('hello')).toBe(false);
    });

    it('should return false for an empty string', () => {
      expect(ObjectHelper.isEmpty('')).toBe(false);
    });

    it('should return false for a number', () => {
      expect(ObjectHelper.isEmpty(123)).toBe(false);
    });

    it('should return false for zero', () => {
      expect(ObjectHelper.isEmpty(0)).toBe(false);
    });

    it('should return false for a class instance with no own properties', () => {
      class MyClass {}
      const instance = new MyClass();
      expect(ObjectHelper.isEmpty(instance)).toBe(false);
    });
  });
});
