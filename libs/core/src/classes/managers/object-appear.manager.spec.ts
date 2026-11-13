import { UpdrawBaseObject } from '../objects/base-object.class';
import { UPDRAW_OBJECT_APPEAR_MAX_STAGGER_INDEX, UpdrawObjectAppearManager } from './object-appear.manager';

const objectWithId = (id: string): UpdrawBaseObject<any> => {
  const object = new UpdrawBaseObject();
  object.id = id;
  return object;
};

const timing = { duration: 600, stagger: 100 };
const ready = () => true;

describe('UpdrawObjectAppearManager', () => {
  let manager: UpdrawObjectAppearManager;

  const appearing = (...args: Parameters<UpdrawObjectAppearManager['resolve']>) => manager.resolve(...args).appearing;

  beforeEach(() => {
    manager = new UpdrawObjectAppearManager();
  });

  it('resolves marked objects with their stagger index while their animation runs', () => {
    const [a, b] = [objectWithId('a'), objectWithId('b')];
    manager.mark([a], 0);
    manager.mark([b], 1);

    expect(appearing([a, b], ready, timing, 1000)).toEqual(new Map([['a', 0], ['b', 1]]));
    // Rerenders keep the animation while it runs (b also waits for its stagger).
    expect(appearing([a, b], ready, timing, 1650)).toEqual(new Map([['b', 1]]));
    expect(appearing([a, b], ready, timing, 1700)).toEqual(new Map());
    expect(manager.has('a')).toBe(false);
    expect(manager.has('b')).toBe(false);
  });

  it('marks group descendants with the index of their top-level object', () => {
    const [group, child] = [objectWithId('group'), objectWithId('child')];
    manager.mark([child, group], 2);

    expect(appearing([group, child], ready, timing, 0)).toEqual(new Map([['child', 2], ['group', 2]]));
  });

  it('caps the stagger index', () => {
    const object = objectWithId('a');
    manager.mark([object], 100);

    expect(appearing([object], ready, timing, 0).get('a')).toBe(UPDRAW_OBJECT_APPEAR_MAX_STAGGER_INDEX);
  });

  it('starts the animation once the object is ready to show', () => {
    const object = objectWithId('a');
    let isReady = false;
    manager.mark([object]);

    expect(appearing([object], () => isReady, timing, 0)).toEqual(new Map());
    expect(manager.has('a')).toBe(true);

    isReady = true;
    expect(appearing([object], () => isReady, timing, 5000)).toEqual(new Map([['a', 0]]));
    expect(appearing([object], () => isReady, timing, 5599)).toEqual(new Map([['a', 0]]));
    expect(appearing([object], () => isReady, timing, 5600)).toEqual(new Map());
  });

  it('reports the objects that started in a render and those that wait to be ready', () => {
    const [a, b] = [objectWithId('a'), objectWithId('b')];
    manager.mark([a, b]);
    const isReady = (object: UpdrawBaseObject<any>) => object.id === 'a';

    const first = manager.resolve([a, b], isReady, timing, 0);
    expect(first.started).toEqual(new Set(['a']));
    expect(first.pending).toEqual(new Set(['b']));

    const second = manager.resolve([a, b], isReady, timing, 100);
    expect(second.started).toEqual(new Set());
    expect(second.appearing).toEqual(new Map([['a', 0]]));
    expect(second.pending).toEqual(new Set(['b']));
  });

  it('forgets objects that are not rendered, so they never appear later', () => {
    const [a, b] = [objectWithId('a'), objectWithId('b')];
    manager.mark([a, b]);

    expect(appearing([a], ready, timing, 0)).toEqual(new Map([['a', 0]]));
    expect(manager.has('b')).toBe(false);
    expect(appearing([a, b], ready, timing, 10)).toEqual(new Map([['a', 0]]));
  });

  it('plays nothing and forgets everything when the theme turns the animation off', () => {
    const object = objectWithId('a');
    manager.mark([object]);

    expect(appearing([object], ready, { duration: 0, stagger: 100 }, 0)).toEqual(new Map());
    expect(manager.has('a')).toBe(false);
  });

  it('ignores objects without an ID and forgets everything on clear', () => {
    const object = objectWithId('a');
    manager.mark([new UpdrawBaseObject(), object]);
    manager.clear();

    expect(appearing([object], ready, timing, 0)).toEqual(new Map());
  });
});
