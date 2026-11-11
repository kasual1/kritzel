import { KritzelBaseObject } from '../objects/base-object.class';
import { KRITZEL_OBJECT_APPEAR_MAX_STAGGER_INDEX, KritzelObjectAppearManager } from './object-appear.manager';

const objectWithId = (id: string): KritzelBaseObject<any> => {
  const object = new KritzelBaseObject();
  object.id = id;
  return object;
};

const timing = { duration: 600, stagger: 100 };
const ready = () => true;

describe('KritzelObjectAppearManager', () => {
  let manager: KritzelObjectAppearManager;

  beforeEach(() => {
    manager = new KritzelObjectAppearManager();
  });

  it('resolves marked objects with their stagger index while their animation runs', () => {
    const [a, b] = [objectWithId('a'), objectWithId('b')];
    manager.mark([a], 0);
    manager.mark([b], 1);

    expect(manager.resolve([a, b], ready, timing, 1000)).toEqual(new Map([['a', 0], ['b', 1]]));
    // Rerenders keep the animation while it runs (b also waits for its stagger).
    expect(manager.resolve([a, b], ready, timing, 1650)).toEqual(new Map([['b', 1]]));
    expect(manager.resolve([a, b], ready, timing, 1700)).toEqual(new Map());
    expect(manager.has('a')).toBe(false);
    expect(manager.has('b')).toBe(false);
  });

  it('marks group descendants with the index of their top-level object', () => {
    const [group, child] = [objectWithId('group'), objectWithId('child')];
    manager.mark([child, group], 2);

    expect(manager.resolve([group, child], ready, timing, 0)).toEqual(new Map([['child', 2], ['group', 2]]));
  });

  it('caps the stagger index', () => {
    const object = objectWithId('a');
    manager.mark([object], 100);

    expect(manager.resolve([object], ready, timing, 0).get('a')).toBe(KRITZEL_OBJECT_APPEAR_MAX_STAGGER_INDEX);
  });

  it('starts the animation once the object is ready to show', () => {
    const object = objectWithId('a');
    let isReady = false;
    manager.mark([object]);

    expect(manager.resolve([object], () => isReady, timing, 0)).toEqual(new Map());
    expect(manager.has('a')).toBe(true);

    isReady = true;
    expect(manager.resolve([object], () => isReady, timing, 5000)).toEqual(new Map([['a', 0]]));
    expect(manager.resolve([object], () => isReady, timing, 5599)).toEqual(new Map([['a', 0]]));
    expect(manager.resolve([object], () => isReady, timing, 5600)).toEqual(new Map());
  });

  it('forgets objects that are not rendered, so they never appear later', () => {
    const [a, b] = [objectWithId('a'), objectWithId('b')];
    manager.mark([a, b]);

    expect(manager.resolve([a], ready, timing, 0)).toEqual(new Map([['a', 0]]));
    expect(manager.has('b')).toBe(false);
    expect(manager.resolve([a, b], ready, timing, 10)).toEqual(new Map([['a', 0]]));
  });

  it('plays nothing and forgets everything when the theme turns the animation off', () => {
    const object = objectWithId('a');
    manager.mark([object]);

    expect(manager.resolve([object], ready, { duration: 0, stagger: 100 }, 0)).toEqual(new Map());
    expect(manager.has('a')).toBe(false);
  });

  it('ignores objects without an ID and forgets everything on clear', () => {
    const object = objectWithId('a');
    manager.mark([new KritzelBaseObject(), object]);
    manager.clear();

    expect(manager.resolve([object], ready, timing, 0)).toEqual(new Map());
  });
});
