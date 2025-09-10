import { KritzelClassHelper } from './class.helper';

describe('KritzelClassHelper', () => {
  it('should return true if object is instance of class', () => {
    const obj = { __class__: 'MyClass' };
    expect(KritzelClassHelper.isInstanceOf(obj, 'MyClass')).toBe(true);
  });

  it('should return false if object is not instance of class', () => {
    const obj = { __class__: 'OtherClass' };
    expect(KritzelClassHelper.isInstanceOf(obj, 'MyClass')).toBe(false);
  });

  it('should return false if object has no __class__ property', () => {
    const obj = {};
    expect(KritzelClassHelper.isInstanceOf(obj, 'MyClass')).toBe(false);
  });

  it('should return false for null object', () => {
    expect(KritzelClassHelper.isInstanceOf(null, 'MyClass')).toBe(false);
  });

  it('should return false for undefined object', () => {
    expect(KritzelClassHelper.isInstanceOf(undefined, 'MyClass')).toBe(false);
  });

  it('should work as a type guard', () => {
    class MyClass {
      __class__ = 'MyClass';
      myMethod() {
        return 'hello';
      }
    }

    const obj: any = new MyClass();

    if (KritzelClassHelper.isInstanceOf<MyClass>(obj, 'MyClass')) {
      expect(obj.myMethod()).toBe('hello');
    } else {
      fail('Type guard failed');
    }
  });
});
