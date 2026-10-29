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
});
