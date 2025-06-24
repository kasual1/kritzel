import { KritzelOctree } from './octree.structure';
import { KritzelBoundingBox } from '../../interfaces/bounding-box.interface';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelStore } from '../store.class';

jest.mock('../store.class');
const MockKritzelStore = KritzelStore as jest.MockedClass<typeof KritzelStore>;

let uuidCounter = 0;
jest.mock('../../helpers/object.helper', () => ({
  ObjectHelper: {
    generateUUID: jest.fn(() => `test-uuid-${uuidCounter++}`),
  },
}));

const createObject = (
    store: KritzelStore,
    x: number,
    y: number,
    width = 1,
    height = 1
): any => ({
    x,
    y,
    width,
    height,
    scale: 1,
    rotation: 0,
    translateX: x,
    translateY: y,
    padding: 0,
    id: `test-uuid-${uuidCounter}`,
    get rotatedBoundingBox() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    },
    store,
});

describe('KritzelOctree', () => {
  let bounds: KritzelBoundingBox;
  let octree: KritzelOctree<KritzelBaseObject<any>>;
  let store: KritzelStore;

  beforeEach(() => {
    uuidCounter = 0;
    const mockEngine = {} as any;
    store = new MockKritzelStore(mockEngine);
    store.setState('scale', 1);
    bounds = { x: 0, y: 0, z: 0, width: 100, height: 100, depth: 100 };
    octree = new KritzelOctree<KritzelBaseObject<any>>(bounds, 2);
  });

  it('should insert an object', () => {
    const obj = createObject(store, 10, 10);
    expect(octree.insert(obj)).toBe(true);
    expect(octree.allObjects()).toContain(obj);
  });

  it('should not insert object outside of bounds', () => {
    const obj = createObject(store, 200, 200);
    expect(octree.insert(obj)).toBe(false);
    expect(octree.allObjects().length).toBe(0);
  });

  it('should subdivide when capacity is reached but not move existing objects', () => {
    const obj1 = createObject(store, 10, 10);
    const obj2 = createObject(store, 20, 20);
    const obj3 = createObject(store, 30, 30);

    octree.insert(obj1);
    octree.insert(obj2);

    expect(octree['children']).toBeNull();
    octree.insert(obj3);

    expect(octree['children']).not.toBeNull();
    expect(octree.allObjects().length).toBe(3);
    expect(octree['objects'].length).toBe(2);

    const childObjects = octree['children']!.reduce((acc, child) => acc + child.allObjects().length, 0);
    expect(childObjects).toBe(1);
  });

  it('should query for objects in a range', () => {
    const obj1 = createObject(store, 10, 10);
    const obj2 = createObject(store, 80, 80);
    octree.insert(obj1);
    octree.insert(obj2);
    const range = { x: 0, y: 0, z: 0, width: 50, height: 50, depth: 50 };
    const results = octree.query(range);
    expect(results).toContain(obj1);
    expect(results).not.toContain(obj2);
  });

  it('should update an object by replacing it', () => {
    const obj = createObject(store, 10, 10);
    octree.insert(obj);

    const replacement = new KritzelBaseObject();
    replacement.id = obj.id;
    replacement.x = 20;
    replacement.y = 20;
    replacement.zIndex = 20;
    replacement.scale = 1;

    expect(octree.update(replacement)).toBe(true);
    const all = octree.allObjects();
    const found = all.find(o => o.id === obj.id);
    expect(found).toBe(replacement);
  });

  it('should remove an object', () => {
    const obj1 = createObject(store, 10, 10);
    const obj2 = createObject(store, 20, 20);
    octree.insert(obj1);
    octree.insert(obj2);
    octree.remove(o => o.id === obj1.id);
    const all = octree.allObjects();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(obj2.id);
  });

  it('should filter objects', () => {
    const obj1 = createObject(store, 10, 10);
    obj1.visible = true;
    const obj2 = createObject(store, 20, 20);
    obj2.visible = false;
    octree.insert(obj1);
    octree.insert(obj2);
    const results = octree.filter(o => o.visible);
    expect(results.length).toBe(1);
    expect(results[0].id).toBe(obj1.id);
  });

  it('should return all objects', () => {
    const obj1 = createObject(store, 10, 10);
    const obj2 = createObject(store, 20, 20);
    octree.insert(obj1);
    octree.insert(obj2);
    expect(octree.allObjects().length).toBe(2);
  });

});
