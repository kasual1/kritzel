import { AGENTIC_CURSOR_MAX_DURATION, AGENTIC_CURSOR_MIN_DURATION, KritzelAgenticCursorManager } from './agentic-cursor.manager';

jest.mock('../core/core.class');

describe('KritzelAgenticCursorManager', () => {
  let manager: KritzelAgenticCursorManager;
  let objects: Map<string, any>;
  let state: any;
  let now: number;

  const createObject = (id: string, x: number, y: number, width: number, height: number, rotation = 0) => ({
    id,
    rotation,
    boundingBox: { x, y, width, height, z: 1 },
  });

  beforeEach(() => {
    now = 1000;
    jest.spyOn(performance, 'now').mockImplementation(() => now);
    objects = new Map();
    state = { scale: 1, translateX: 0, translateY: 0, viewportWidth: 800, viewportHeight: 600 };
    const core: any = {
      store: {
        state,
        objects: { findById: (id: string) => objects.get(id) ?? null },
      },
    };
    manager = new KritzelAgenticCursorManager(core);
  });

  afterEach(() => {
    manager.clear();
    jest.restoreAllMocks();
  });

  describe('add', () => {
    it('should place a cursor at the viewport center by default', () => {
      state.translateX = 100;
      state.scale = 2;
      const cursor = manager.add({ name: 'Planner', color: '#ff0000' });
      expect(cursor.position).toEqual({ x: 150, y: 150 });
      expect(cursor.color).toBe('#ff0000');
      expect(cursor.visible).toBe(true);
      expect(cursor.id).toMatch(/^agentic-cursor-/);
    });

    it('should derive a color from the name when none is given', () => {
      const cursor = manager.add({ name: 'Planner' });
      expect(cursor.color).toMatch(/^hsl\(/);
    });

    it('should attach immediately when the initial position is an object', () => {
      objects.set('a', createObject('a', 0, 0, 100, 50));
      const cursor = manager.add({ position: { objectId: 'a', anchor: 'bottom-right' } });
      expect(cursor.position).toEqual({ x: 100, y: 50 });
      expect(cursor.attachedTo).toEqual({ objectId: 'a', anchor: 'bottom-right', offset: { x: 0, y: 0 } });
    });

    it('should throw for duplicate ids and missing objects', () => {
      manager.add({ id: 'one' });
      expect(() => manager.add({ id: 'one' })).toThrow();
      expect(() => manager.add({ position: { objectId: 'missing' } })).toThrow();
    });
  });

  describe('resolveTarget', () => {
    it('should resolve anchors with offsets', () => {
      objects.set('a', createObject('a', 10, 20, 100, 50));
      expect(manager.resolveTarget({ objectId: 'a' })).toEqual({ x: 60, y: 45 });
      expect(manager.resolveTarget({ objectId: 'a', anchor: 'top-left', offset: { x: 5, y: -5 } })).toEqual({ x: 15, y: 15 });
      expect(manager.resolveTarget({ objectId: 'a', anchor: 'right' })).toEqual({ x: 110, y: 45 });
    });

    it('should rotate anchors around the object center', () => {
      objects.set('a', createObject('a', 0, 0, 100, 100, Math.PI / 2));
      const point = manager.resolveTarget({ objectId: 'a', anchor: 'top-left' })!;
      expect(point.x).toBeCloseTo(100);
      expect(point.y).toBeCloseTo(0);
    });
  });

  describe('move', () => {
    it('should animate to a world point and resolve when done', async () => {
      const cursor = manager.add({ position: { x: 0, y: 0 } });
      const promise = manager.move(cursor.id, { x: 100, y: 0 }, { duration: 100, easing: 'linear' });

      manager.tick(1050);
      expect(manager.get(cursor.id)!.position.x).toBeCloseTo(50);
      expect(manager.get(cursor.id)!.isMoving).toBe(true);

      manager.tick(1100);
      await expect(promise).resolves.toEqual({ completed: true });
      expect(manager.get(cursor.id)!.position).toEqual({ x: 100, y: 0 });
      expect(manager.get(cursor.id)!.isMoving).toBe(false);
    });

    it('should derive the duration from the screen distance and clamp it', async () => {
      const cursor = manager.add({ position: { x: 0, y: 0 } });
      const short = manager.move(cursor.id, { x: 1, y: 0 }, { easing: 'linear' });
      manager.tick(1000 + AGENTIC_CURSOR_MIN_DURATION - 1);
      expect(manager.get(cursor.id)!.isMoving).toBe(true);
      manager.tick(1000 + AGENTIC_CURSOR_MIN_DURATION);
      await expect(short).resolves.toEqual({ completed: true });

      const long = manager.move(cursor.id, { x: 100000, y: 0 });
      manager.tick(1000 + AGENTIC_CURSOR_MAX_DURATION);
      await expect(long).resolves.toEqual({ completed: true });
    });

    it('should resolve an interrupted move with completed: false and continue from the current position', async () => {
      const cursor = manager.add({ position: { x: 0, y: 0 } });
      const first = manager.move(cursor.id, { x: 100, y: 0 }, { duration: 100, easing: 'linear' });
      manager.tick(1050);

      now = 1050;
      const second = manager.move(cursor.id, { x: 50, y: 100 }, { duration: 100, easing: 'linear' });
      await expect(first).resolves.toEqual({ completed: false });

      manager.tick(1100);
      expect(manager.get(cursor.id)!.position.x).toBeCloseTo(50);
      expect(manager.get(cursor.id)!.position.y).toBeCloseTo(50);
      manager.tick(1150);
      await expect(second).resolves.toEqual({ completed: true });
    });

    it('should attach to an object on arrival and follow it', async () => {
      const object = createObject('a', 0, 0, 100, 100);
      objects.set('a', object);
      const cursor = manager.add({ position: { x: 0, y: 0 } });
      const promise = manager.move(cursor.id, { objectId: 'a', anchor: 'top-right' }, { duration: 100 });
      manager.tick(1100);
      await promise;

      expect(manager.get(cursor.id)!.attachedTo?.objectId).toBe('a');
      object.boundingBox = { x: 50, y: 50, width: 100, height: 100, z: 1 };
      manager.tick(1200);
      expect(manager.get(cursor.id)!.position).toEqual({ x: 150, y: 50 });
    });

    it('should not attach when attach is false', async () => {
      objects.set('a', createObject('a', 0, 0, 100, 100));
      const cursor = manager.add({ position: { x: 0, y: 0 } });
      const promise = manager.move(cursor.id, { objectId: 'a' }, { duration: 0, attach: false });
      manager.tick(1000);
      await promise;
      expect(manager.get(cursor.id)!.attachedTo).toBeNull();
      expect(manager.get(cursor.id)!.position).toEqual({ x: 50, y: 50 });
    });

    it('should reject for unknown cursors and objects', async () => {
      const cursor = manager.add();
      expect(() => manager.move('missing', { x: 0, y: 0 })).toThrow();
      expect(() => manager.move(cursor.id, { objectId: 'missing' })).toThrow();
    });
  });

  describe('detaching', () => {
    it('should detach and keep the last position when the attached object is removed', () => {
      objects.set('a', createObject('a', 0, 0, 100, 100));
      const cursor = manager.add({ position: { objectId: 'a' } });
      const listener = jest.fn();
      manager.onDetached(listener);

      objects.delete('a');
      manager.tick(1016);

      expect(listener).toHaveBeenCalledWith({ id: cursor.id, objectId: 'a', reason: 'object-removed' });
      expect(manager.get(cursor.id)!.attachedTo).toBeNull();
      expect(manager.get(cursor.id)!.position).toEqual({ x: 50, y: 50 });
    });

    it('should resolve a move with completed: false when the target object is removed mid-flight', async () => {
      objects.set('a', createObject('a', 100, 0, 100, 100));
      const cursor = manager.add({ position: { x: 0, y: 0 } });
      const listener = jest.fn();
      manager.onDetached(listener);
      const promise = manager.move(cursor.id, { objectId: 'a' }, { duration: 100 });

      objects.delete('a');
      manager.tick(1050);

      await expect(promise).resolves.toEqual({ completed: false });
      expect(listener).toHaveBeenCalledWith({ id: cursor.id, objectId: 'a', reason: 'object-removed' });
    });

    it('should emit a manual detach event', () => {
      objects.set('a', createObject('a', 0, 0, 100, 100));
      const cursor = manager.add({ position: { objectId: 'a' } });
      const listener = jest.fn();
      manager.onDetached(listener);
      manager.detach(cursor.id);
      expect(listener).toHaveBeenCalledWith({ id: cursor.id, objectId: 'a', reason: 'manual' });
      expect(manager.get(cursor.id)!.attachedTo).toBeNull();
    });
  });

  describe('update and remove', () => {
    it('should update style properties and clear the status', () => {
      const cursor = manager.add({ name: 'A', status: 'Thinking' });
      const listener = jest.fn();
      manager.onChange(listener);
      const updated = manager.update(cursor.id, { name: 'B', color: 'red', status: null, visible: false });
      expect(updated).toMatchObject({ name: 'B', color: 'red', status: undefined, visible: false });
      expect(listener).toHaveBeenCalled();
    });

    it('should resolve a pending move when the cursor is removed', async () => {
      const cursor = manager.add({ position: { x: 0, y: 0 } });
      const promise = manager.move(cursor.id, { x: 100, y: 0 }, { duration: 100 });
      expect(manager.remove(cursor.id)).toBe(true);
      await expect(promise).resolves.toEqual({ completed: false });
      expect(manager.count).toBe(0);
    });
  });

  describe('element targets', () => {
    const elementInfo = (selector: string, rect: { x: number; y: number; width: number; height: number }) => ({ selector, tagName: 'button', classList: [], attributes: {}, rect });

    // Content coordinates are scaled by 1/2 into the object space, like an iframe object with scale 2.
    const createElementObject = (id: string, x: number, y: number, width: number, height: number, rects: Record<string, { x: number; y: number; width: number; height: number }>, rotation = 0) => {
      const tracked = new Map<string, number>();
      return {
        ...createObject(id, x, y, width, height, rotation),
        rects,
        tracked,
        isElementPicking: false,
        setElementPicking: jest.fn(),
        setElementHighlights: jest.fn(),
        getElementHighlights: jest.fn(() => []),
        refreshElementTheme: jest.fn(),
        queryElements: jest.fn(async (selector: string) => (rects[selector] ? [elementInfo(selector, rects[selector])] : [])),
        trackElement: jest.fn((selector: string) => {
          tracked.set(selector, (tracked.get(selector) ?? 0) + 1);
        }),
        untrackElement: jest.fn((selector: string) => {
          const count = tracked.get(selector);
          if (count === undefined) return;
          if (count > 1) tracked.set(selector, count - 1);
          else tracked.delete(selector);
        }),
        getTrackedElementRect: jest.fn((selector: string) => (tracked.has(selector) ? rects[selector] ?? null : null)),
        contentToObjectLocal: (point: { x: number; y: number }) => ({ x: point.x / 2, y: point.y / 2 }),
      };
    };

    const flush = () => new Promise(resolve => setTimeout(resolve, 0));

    it('should resolve the anchor of a tracked element in world coordinates', () => {
      const object = createElementObject('frame', 10, 20, 100, 50, { '#run': { x: 20, y: 40, width: 40, height: 20 } });
      objects.set('frame', object);
      object.trackElement('#run');

      expect(manager.resolveTarget({ objectId: 'frame', selector: '#run' })).toEqual({ x: 30, y: 45 });
      expect(manager.resolveTarget({ objectId: 'frame', selector: '#run', anchor: 'top-left', offset: { x: 1, y: 2 } })).toEqual({ x: 21, y: 42 });
    });

    it('should fall back to the object center while the element is unknown', () => {
      objects.set('frame', createElementObject('frame', 10, 20, 100, 50, {}));
      expect(manager.resolveTarget({ objectId: 'frame', selector: '#run' })).toEqual({ x: 60, y: 45 });
    });

    it('should rotate element anchors with the object', () => {
      const object = createElementObject('frame', 0, 0, 100, 100, { '#run': { x: 10, y: 10, width: 20, height: 20 } }, Math.PI / 2);
      objects.set('frame', object);
      object.trackElement('#run');

      const point = manager.resolveTarget({ objectId: 'frame', selector: '#run' })!;
      expect(point.x).toBeCloseTo(90);
      expect(point.y).toBeCloseTo(10);
    });

    it('should move to an element, attach to it and follow it', async () => {
      const object = createElementObject('frame', 0, 0, 200, 200, { '#run': { x: 20, y: 40, width: 40, height: 20 } });
      objects.set('frame', object);
      const cursor = manager.add({ position: { x: 0, y: 0 } });

      const promise = manager.move(cursor.id, { objectId: 'frame', selector: '#run' }, { duration: 100, easing: 'linear' });
      expect(object.trackElement).toHaveBeenCalledWith('#run');
      expect(object.queryElements).toHaveBeenCalledWith('#run', 1);
      await flush();

      manager.tick(1100);
      await expect(promise).resolves.toEqual({ completed: true });
      expect(manager.get(cursor.id)!.position).toEqual({ x: 20, y: 25 });
      expect(manager.get(cursor.id)!.attachedTo).toEqual({ objectId: 'frame', selector: '#run', anchor: 'center', offset: { x: 0, y: 0 } });

      object.rects['#run'] = { x: 100, y: 100, width: 40, height: 20 };
      manager.tick(1200);
      expect(manager.get(cursor.id)!.position).toEqual({ x: 60, y: 55 });

      manager.detach(cursor.id);
      expect(object.tracked.size).toBe(0);
    });

    it('should stop tracking when the cursor arrives without attaching', async () => {
      const object = createElementObject('frame', 0, 0, 200, 200, { '#run': { x: 20, y: 40, width: 40, height: 20 } });
      objects.set('frame', object);
      const cursor = manager.add({ position: { x: 0, y: 0 } });

      const promise = manager.move(cursor.id, { objectId: 'frame', selector: '#run' }, { duration: 0, attach: false });
      await flush();
      manager.tick(1000);
      await promise;

      expect(manager.get(cursor.id)!.attachedTo).toBeNull();
      expect(manager.get(cursor.id)!.position).toEqual({ x: 20, y: 25 });
      expect(object.tracked.size).toBe(0);
    });

    it('should reject when the element does not exist and release it', async () => {
      const object = createElementObject('frame', 0, 0, 200, 200, {});
      objects.set('frame', object);
      const cursor = manager.add({ position: { x: 0, y: 0 } });

      await expect(manager.move(cursor.id, { objectId: 'frame', selector: '#missing' })).rejects.toThrow('Element "#missing" not found in object "frame".');
      expect(object.tracked.size).toBe(0);
    });

    it('should reject when the object cannot be queried and release the element', async () => {
      const object = createElementObject('frame', 0, 0, 200, 200, {});
      object.queryElements.mockRejectedValueOnce(new Error('not mounted'));
      objects.set('frame', object);
      const cursor = manager.add({ position: { x: 0, y: 0 } });

      await expect(manager.move(cursor.id, { objectId: 'frame', selector: '#run' })).rejects.toThrow('not mounted');
      expect(object.tracked.size).toBe(0);
    });

    it('should throw for objects without elements, missing objects and empty selectors', () => {
      objects.set('plain', createObject('plain', 0, 0, 10, 10));
      objects.set('frame', createElementObject('frame', 0, 0, 10, 10, {}));
      const cursor = manager.add();

      expect(() => manager.move(cursor.id, { objectId: 'plain', selector: '#run' })).toThrow('has no elements');
      expect(() => manager.move(cursor.id, { objectId: 'missing', selector: '#run' })).toThrow('not found');
      expect(() => manager.move(cursor.id, { objectId: 'frame', selector: ' ' })).toThrow('non-empty selector');
      expect(() => manager.add({ position: { objectId: 'plain', selector: '#run' } })).toThrow('has no elements');
    });

    it('should resolve a superseded element move with completed: false without releasing the newer target', async () => {
      const object = createElementObject('frame', 0, 0, 200, 200, { '#run': { x: 0, y: 0, width: 10, height: 10 }, '#stop': { x: 50, y: 50, width: 10, height: 10 } });
      objects.set('frame', object);
      const cursor = manager.add({ position: { x: 0, y: 0 } });

      const first = manager.move(cursor.id, { objectId: 'frame', selector: '#run' }, { duration: 100 });
      const second = manager.move(cursor.id, { objectId: 'frame', selector: '#stop' }, { duration: 100 });
      await expect(first).resolves.toEqual({ completed: false });
      expect(Array.from(object.tracked.keys())).toEqual(['#stop']);

      manager.tick(1100);
      await expect(second).resolves.toEqual({ completed: true });
      expect(manager.get(cursor.id)!.attachedTo?.selector).toBe('#stop');
    });

    it('should resolve with completed: false when the cursor is removed while the element is looked up', async () => {
      const object = createElementObject('frame', 0, 0, 200, 200, { '#run': { x: 0, y: 0, width: 10, height: 10 } });
      objects.set('frame', object);
      const cursor = manager.add({ position: { x: 0, y: 0 } });

      const promise = manager.move(cursor.id, { objectId: 'frame', selector: '#run' });
      manager.remove(cursor.id);

      await expect(promise).resolves.toEqual({ completed: false });
      expect(object.tracked.size).toBe(0);
    });

    it('should release an element when the cursor moves elsewhere or all cursors are cleared', async () => {
      const object = createElementObject('frame', 0, 0, 200, 200, { '#run': { x: 0, y: 0, width: 10, height: 10 } });
      objects.set('frame', object);
      const first = manager.add({ position: { objectId: 'frame', selector: '#run' } });
      manager.add({ position: { objectId: 'frame', selector: '#run' } });
      expect(object.tracked.get('#run')).toBe(2);

      const promise = manager.move(first.id, { x: 0, y: 0 }, { duration: 0 });
      manager.tick(1000);
      await promise;
      expect(object.tracked.get('#run')).toBe(1);

      manager.clear();
      expect(object.tracked.size).toBe(0);
    });

    it('should attach right away when added at an element', () => {
      const object = createElementObject('frame', 0, 0, 200, 200, { '#run': { x: 20, y: 40, width: 40, height: 20 } });
      objects.set('frame', object);

      const cursor = manager.add({ position: { objectId: 'frame', selector: '#run', anchor: 'top-left' } });

      expect(cursor.position).toEqual({ x: 10, y: 20 });
      expect(cursor.attachedTo).toEqual({ objectId: 'frame', selector: '#run', anchor: 'top-left', offset: { x: 0, y: 0 } });
      expect(object.tracked.get('#run')).toBe(1);
    });

    it('should detach when the object of the element is removed', () => {
      objects.set('frame', createElementObject('frame', 0, 0, 200, 200, { '#run': { x: 0, y: 0, width: 10, height: 10 } }));
      const cursor = manager.add({ position: { objectId: 'frame', selector: '#run' } });
      const listener = jest.fn();
      manager.onDetached(listener);

      objects.delete('frame');
      manager.tick(1016);

      expect(listener).toHaveBeenCalledWith({ id: cursor.id, objectId: 'frame', reason: 'object-removed' });
      expect(() => manager.remove(cursor.id)).not.toThrow();
    });
  });
});
