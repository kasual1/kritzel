import { KritzelBaseObject } from './base-object.class';
import { KritzelStore } from '../store.class';

jest.mock('../store.class');
const MockKritzelStore = KritzelStore as jest.MockedClass<typeof KritzelStore>;

jest.mock('../../helpers/object.helper', () => ({
  ObjectHelper: {
    generateUUID: jest.fn(() => 'test-uuid'),
    clone: jest.fn((objOrObjs) => {
      if (Array.isArray(objOrObjs)) {
        return objOrObjs.map(obj => ({ ...obj, _store: undefined, _elementRef: undefined }));
      }
      return { ...objOrObjs, _store: undefined, _elementRef: undefined };
    }),
    isEmpty: jest.fn((obj) => {
      return Object.keys(obj).length === 0 && obj.constructor === Object;
    })
  }
}));

describe('KritzelBaseObject', () => {
  let store: KritzelStore;
  let object: KritzelBaseObject<HTMLElement>;

  beforeEach(() => {
    const mockEngine = {} as any;
    store = new MockKritzelStore(mockEngine);

    store.setState('translateX', 0);
    store.setState('translateY', 0);
    store.setState('scale', 1);
    store.setState('viewportWidth', 800);
    store.setState('viewportHeight', 600);

    object = new KritzelBaseObject();
    object.x = 10;
    object.y = 20;
    object.width = 100;
    object.height = 50;
    object.translateX = 10;
    object.translateY = 20;
    object.scale = 1;
  });

  it('should be created with default values', () => {
    expect(object).toBeInstanceOf(KritzelBaseObject);
    expect(object.id).toBeDefined();
    expect(object.visible).toBe(true);
    expect(object.borderWidth).toBe(0);
    expect(object.opacity).toBe(1);
    expect(object.padding).toBe(0);
    expect(object.selected).toBe(false);
    expect(object.resizing).toBe(false);
    expect(object.rotation).toBe(0);
    expect(object.markedForRemoval).toBe(false);
    expect(object.isMounted).toBe(false);
    expect(object.zIndex).toBe(0);
  });

  it('should calculate totalWidth and totalHeight correctly', () => {
    object.padding = 5;
    expect(object.totalWidth).toBe(110); // 100 + 5 * 2
    expect(object.totalHeight).toBe(60); // 50 + 5 * 2
  });

  it('should set and get elementRef', () => {
    const el = document.createElement('div');
    object.elementRef = el;
    expect(object.elementRef).toBe(el);
  });

  it('should calculate boundingBox correctly', () => {
    object.scale = 2;
    const bb = object.boundingBox;
    expect(bb.x).toBe(10);
    expect(bb.y).toBe(20);
    expect(bb.z).toBe(2);
    expect(bb.width).toBe(100 / 2);
    expect(bb.height).toBe(50 / 2);
  });

  it('should calculate rotatedPolygon and rotatedBoundingBox correctly', () => {
    object.rotation = Math.PI / 2; // 90 degrees
    const polygon = object.rotatedPolygon;
    
    expect(polygon.topLeft.x).toBeCloseTo(85);
    expect(polygon.topLeft.y).toBeCloseTo(-5);
    expect(polygon.topRight.x).toBeCloseTo(85);
    expect(polygon.topRight.y).toBeCloseTo(95);
    expect(polygon.bottomRight.x).toBeCloseTo(35);
    expect(polygon.bottomRight.y).toBeCloseTo(95);
    expect(polygon.bottomLeft.x).toBeCloseTo(35);
    expect(polygon.bottomLeft.y).toBeCloseTo(-5);

    const rbb = object.rotatedBoundingBox;
    expect(rbb.x).toBeCloseTo(35);
    expect(rbb.y).toBeCloseTo(-5);
    expect(rbb.width).toBeCloseTo(50);
    expect(rbb.height).toBeCloseTo(100);
  });

  it('should calculate transformationMatrix correctly', () => {
    object.scale = 2;
    object.translateX = 50;
    object.translateY = 60;
    const scale = 1 / object.scale;
    expect(object.transformationMatrix).toBe(`matrix(${scale}, 0, 0, ${scale}, 50, 60)`);
  });

  it('should convert rotation to degrees', () => {
    object.rotation = Math.PI;
    expect(object.rotationDegrees).toBe(180);
  });

  it('should calculate center coordinates', () => {
    expect(object.centerX).toBe(10 + 100 / 2);
    expect(object.centerY).toBe(20 + 50 / 2);
  });

  it('should mount an element', () => {
    const el = document.createElement('div');
    object.mount(el);
    expect(object.isMounted).toBe(true);
    expect(object.elementRef).toBe(el);
    // should not mount again
    const el2 = document.createElement('div');
    object.mount(el2);
    expect(object.elementRef).toBe(el);
  });

  it('should check if it is in viewport', () => {
    object.translateX = 100;
    object.translateY = 100;
    object.width = 100;
    object.height = 100;
    expect(object.isInViewport()).toBe(true);

    object.translateX = -50;
    expect(object.isInViewport()).toBe(true);

    object.translateX = 1000;
    expect(object.isInViewport()).toBe(false);
  });

  it('should center in viewport', () => {
    store.state.viewportWidth = 800;
    store.state.viewportHeight = 600;
    store.state.translateX = 100;
    store.state.translateY = 50;
    store.state.scale = 1;
    object.width = 200;
    object.height = 100;

    object.centerInViewport();

    expect(object.translateX).toBe(200);
    expect(object.translateY).toBe(200);
  });

  it('should move the object', () => {
    const startX = 100;
    const startY = 100;
    const endX = 150;
    const endY = 120;
    store.state.scale = 2;
    const initialTranslateX = object.translateX;
    const initialTranslateY = object.translateY;

    object.move(startX, startY, endX, endY);

    const deltaX = (startX - endX) / store.state.scale;
    const deltaY = (startY - endY) / store.state.scale;

    expect(object.translateX).toBe(initialTranslateX + deltaX);
    expect(object.translateY).toBe(initialTranslateY + deltaY);
  });

  it('should resize the object', () => {
    object.resize(200, 200, 300, 150);
    expect(object.translateX).toBe(200);
    expect(object.translateY).toBe(200);
    expect(object.width).toBe(300);
    expect(object.height).toBe(150);
  });

  it('should not resize if width or height is <= 1', () => {
    const initialWidth = object.width;
    const initialHeight = object.height;
    object.resize(200, 200, 1, 150);
    expect(object.width).toBe(initialWidth);
    object.resize(200, 200, 150, 0);
    expect(object.height).toBe(initialHeight);
  });

  it('should rotate the object', () => {
    object.rotate(Math.PI / 4);
    expect(object.rotation).toBe(Math.PI / 4);
  });

  it('should copy the object', () => {
    const el = document.createElement('div');
    object.mount(el);
    const copy = object.copy();
    expect(copy).not.toBe(object);
    expect(copy.id).not.toBe(object.id);
    expect(copy.width).toBe(object.width);
    expect(copy.isMounted).toBe(false);
    expect(copy._store).toBe(object._store);
  });

  it('should revive the object', () => {
    const plainObject = {
      id: 'new-id',
      width: 500,
      visible: false,
    };
    object.revive(plainObject);
    expect(object.id).toBe('new-id');
    expect(object.width).toBe(500);
    expect(object.visible).toBe(false);
  });
});
