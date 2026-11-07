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
      // A cursor never goes to NaN, where it would stay.
      expect(() => manager.move(cursor.id, { x: Number.NaN, y: 0 })).toThrow('finite');
      manager.setPosition(cursor.id, { x: Number.NaN, y: 0 });
      expect(Number.isFinite(manager.get(cursor.id)!.position.x)).toBe(true);
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

  describe('action support', () => {
    it('should include the action fields in snapshots', () => {
      const cursor = manager.add({ id: 'a' });
      expect(cursor).toMatchObject({
        selectedObjectIds: [],
        isPressed: false,
        pressCount: 0,
        activeAction: null,
        queueLength: 0,
        canUndo: false,
        canRedo: false,
      });
      manager.setHistoryProvider(() => ({ canUndo: true, canRedo: false }));
      expect(manager.get('a')).toMatchObject({ canUndo: true, canRedo: false });
    });

    it('should count host moves but not action flights', () => {
      manager.add({ id: 'a', position: { x: 0, y: 0 } });
      void manager.fly('a', { x: 10, y: 0 });
      expect(manager.getHostMoveGeneration('a')).toBe(0);
      void manager.move('a', { x: 20, y: 0 });
      expect(manager.getHostMoveGeneration('a')).toBe(1);
    });

    it('should stop an animation and resolve it with completed: false', async () => {
      manager.add({ id: 'a', position: { x: 0, y: 0 } });
      const promise = manager.fly('a', { x: 100, y: 0 }, { duration: 100 });
      manager.stopAnimation('a');
      await expect(promise).resolves.toEqual({ completed: false });
      expect(manager.get('a')?.isMoving).toBe(false);
    });

    it('should set the position immediately, cancelling animations and attachments', async () => {
      objects.set('o', createObject('o', 0, 0, 10, 10));
      manager.add({ id: 'a', position: { objectId: 'o' } });
      const promise = manager.fly('a', { x: 100, y: 0 }, { duration: 100 });
      manager.setPosition('a', { x: 7, y: 8 });
      await expect(promise).resolves.toEqual({ completed: false });
      expect(manager.get('a')).toMatchObject({ position: { x: 7, y: 8 }, attachedTo: null });
    });

    it('should attach to an object anchor immediately', () => {
      objects.set('o', createObject('o', 0, 0, 100, 50));
      manager.add({ id: 'a', position: { x: 0, y: 0 } });
      manager.attach('a', { objectId: 'o', anchor: 'right' });
      expect(manager.get('a')).toMatchObject({ position: { x: 100, y: 25 }, attachedTo: { objectId: 'o', anchor: 'right' } });
    });

    it('should count presses', () => {
      manager.add({ id: 'a' });
      manager.setPressed('a', true);
      manager.setPressed('a', true);
      manager.setPressed('a', false);
      manager.setPressed('a', true);
      expect(manager.get('a')).toMatchObject({ isPressed: true, pressCount: 2 });
    });

    it('should only emit changes when selection or activity actually change', () => {
      manager.add({ id: 'a' });
      const listener = jest.fn();
      manager.onChange(listener);
      manager.setSelectedObjectIds('a', ['x']);
      manager.setSelectedObjectIds('a', ['x']);
      manager.setActivity('a', 'moveObject', 2);
      manager.setActivity('a', 'moveObject', 2);
      expect(listener).toHaveBeenCalledTimes(2);
      expect(manager.get('a')).toMatchObject({ selectedObjectIds: ['x'], activeAction: 'moveObject', queueLength: 2 });
    });

    it('should call before-frame listeners before advancing animations', () => {
      manager.add({ id: 'a', position: { x: 0, y: 0 } });
      void manager.fly('a', { x: 100, y: 0 }, { duration: 100, easing: 'linear' });
      const positions: number[] = [];
      manager.onBeforeFrame(t => positions.push(t, manager.get('a')!.position.x));
      manager.tick(1050);
      expect(positions).toEqual([1050, 0]);
      expect(manager.get('a')!.position.x).toBe(50);
    });

    it('should notify removal from remove() and clear()', () => {
      manager.add({ id: 'a' });
      manager.add({ id: 'b' });
      manager.add({ id: 'c' });
      const removed: string[] = [];
      manager.onRemoved(id => removed.push(id));
      manager.remove('a');
      manager.clear();
      expect(removed).toEqual(['a', 'b', 'c']);
    });

    it('should isolate listener errors', () => {
      const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      manager.add({ id: 'a' });
      const good = jest.fn();
      manager.onFrame(() => {
        throw new Error('boom');
      });
      manager.onFrame(good);
      manager.onBeforeFrame(() => {
        throw new Error('boom');
      });
      expect(() => manager.tick(1010)).not.toThrow();
      expect(good).toHaveBeenCalled();
      expect(error).toHaveBeenCalled();
    });

    it('should keep the frame loop running when a frame throws', () => {
      let scheduled: FrameRequestCallback | null = null;
      const raf = jest.fn((cb: FrameRequestCallback) => {
        scheduled = cb;
        return 1;
      });
      (globalThis as any).requestAnimationFrame = raf;
      (globalThis as any).cancelAnimationFrame = jest.fn();
      try {
        manager.add({ id: 'a' });
        jest.spyOn(manager, 'tick').mockImplementationOnce(() => {
          throw new Error('boom');
        });
        expect(() => scheduled!(1016)).toThrow('boom');
        expect(raf).toHaveBeenCalledTimes(2);
      } finally {
        manager.clear();
        delete (globalThis as any).requestAnimationFrame;
        delete (globalThis as any).cancelAnimationFrame;
      }
    });
  });

  describe('element targets', () => {
    const elementInfo = (selector: string, rect: { x: number; y: number; width: number; height: number }) => ({ selector, tagName: 'button', classList: [], attributes: {}, rect, visibleRect: rect });

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

    it('should reject when the element cannot be seen and release it', async () => {
      const object = createElementObject('frame', 0, 0, 200, 200, {});
      object.queryElements.mockResolvedValueOnce([{ selector: '#hidden', tagName: 'button', classList: [], attributes: {}, rect: { x: 0, y: 0, width: 0, height: 0 } } as any]);
      objects.set('frame', object);
      const cursor = manager.add({ position: { x: 0, y: 0 } });

      await expect(manager.move(cursor.id, { objectId: 'frame', selector: '#hidden' })).rejects.toThrow('Element "#hidden" in object "frame" is not visible.');
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
      await flush();
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
      await flush();
      expect(object.tracked.size).toBe(0);
    });

    it('should resolve an interrupted element move with completed: false even if its lookup fails later', async () => {
      const object = createElementObject('frame', 0, 0, 200, 200, {});
      let failLookup: (error: Error) => void = () => undefined;
      object.queryElements.mockImplementationOnce(() => new Promise((_resolve, reject) => { failLookup = reject; }));
      objects.set('frame', object);
      const cursor = manager.add({ position: { x: 0, y: 0 } });

      const first = manager.move(cursor.id, { objectId: 'frame', selector: '#run' });
      const second = manager.move(cursor.id, { x: 10, y: 0 }, { duration: 0 });
      failLookup(new Error('Object "frame" was unmounted.'));
      manager.tick(1000);

      await expect(first).resolves.toEqual({ completed: false });
      await expect(second).resolves.toEqual({ completed: true });
      await flush();
      expect(object.tracked.size).toBe(0);
    });

    it('should keep the current move and attachment when an element move fails', async () => {
      const object = createElementObject('frame', 0, 0, 200, 200, { '#run': { x: 20, y: 40, width: 40, height: 20 } });
      objects.set('frame', object);
      const cursor = manager.add({ position: { objectId: 'frame', selector: '#run' } });
      object.queryElements.mockRejectedValueOnce(new Error('Object "frame" is not mounted.'));

      await expect(manager.move(cursor.id, { objectId: 'frame', selector: '#run' })).rejects.toThrow('is not mounted');

      expect(manager.get(cursor.id)!.attachedTo).toEqual({ objectId: 'frame', selector: '#run', anchor: 'center', offset: { x: 0, y: 0 } });
      expect(object.tracked.get('#run')).toBe(1);
    });

    it('should resolve element moves that are still looking up their element on cleanup', async () => {
      const object = createElementObject('frame', 0, 0, 200, 200, { '#run': { x: 0, y: 0, width: 10, height: 10 } });
      objects.set('frame', object);
      const cursor = manager.add({ position: { x: 0, y: 0 } });

      const promise = manager.move(cursor.id, { objectId: 'frame', selector: '#run' });
      manager.cleanup();

      await expect(promise).resolves.toEqual({ completed: false });
      await flush();
      expect(manager.get(cursor.id)!.isMoving).toBe(false);
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

    it('should count an element move as a host move as soon as it is called', async () => {
      const object = createElementObject('frame', 0, 0, 200, 200, {});
      objects.set('frame', object);
      manager.add({ id: 'a', position: { x: 0, y: 0 } });

      expect(() => manager.move('a', { objectId: 'frame', selector: '' })).toThrow('non-empty selector');
      expect(manager.getHostMoveGeneration('a')).toBe(0);

      const promise = manager.move('a', { objectId: 'frame', selector: '#missing' });
      expect(manager.getHostMoveGeneration('a')).toBe(1);
      await expect(promise).rejects.toThrow('not found');
      expect(manager.getHostMoveGeneration('a')).toBe(1);
    });

    it('should stop the flight of an action right away but keep a host move until the element is found', async () => {
      const object = createElementObject('frame', 0, 0, 200, 200, { '#run': { x: 20, y: 40, width: 40, height: 20 } });
      objects.set('frame', object);
      manager.add({ id: 'a', position: { x: 0, y: 0 } });

      const flight = manager.fly('a', { x: 100, y: 0 }, { duration: 100 });
      const toElement = manager.move('a', { objectId: 'frame', selector: '#run' }, { duration: 0 });
      expect(manager.get('a')!.isMoving).toBe(false);
      await expect(flight).resolves.toEqual({ completed: false });
      await flush();
      manager.tick(1000);
      await expect(toElement).resolves.toEqual({ completed: true });

      const hostMove = manager.move('a', { x: 100, y: 0 }, { duration: 100 });
      object.queryElements.mockRejectedValueOnce(new Error('Object "frame" is not mounted.'));
      await expect(manager.move('a', { objectId: 'frame', selector: '#run' })).rejects.toThrow('is not mounted');
      expect(manager.get('a')!.isMoving).toBe(true);
      manager.tick(1100);
      await expect(hostMove).resolves.toEqual({ completed: true });
    });

    it('should let an action take over while an element is looked up', async () => {
      const object = createElementObject('frame', 0, 0, 200, 200, { '#run': { x: 0, y: 0, width: 10, height: 10 } });
      objects.set('frame', object);
      manager.add({ id: 'a', position: { x: 0, y: 0 } });

      const promise = manager.move('a', { objectId: 'frame', selector: '#run' });
      manager.stopAnimation('a');

      await expect(promise).resolves.toEqual({ completed: false });
      await flush();
      expect(manager.get('a')!.isMoving).toBe(false);
      expect(object.tracked.size).toBe(0);
    });

    it('should release the element when an animation to it is stopped', async () => {
      const object = createElementObject('frame', 0, 0, 200, 200, { '#run': { x: 0, y: 0, width: 10, height: 10 } });
      objects.set('frame', object);
      manager.add({ id: 'a', position: { x: 0, y: 0 } });

      const promise = manager.move('a', { objectId: 'frame', selector: '#run' }, { duration: 100 });
      await flush();
      expect(manager.get('a')!.isMoving).toBe(true);
      manager.stopAnimation('a');

      await expect(promise).resolves.toEqual({ completed: false });
      expect(object.tracked.size).toBe(0);
    });

    it('should refuse element targets for action flights', () => {
      objects.set('frame', createElementObject('frame', 0, 0, 200, 200, {}));
      manager.add({ id: 'a' });
      expect(() => manager.fly('a', { objectId: 'frame', selector: '#run' })).toThrow('Actions cannot target elements');
    });

    it('should release the element when an action places or attaches the cursor', () => {
      const object = createElementObject('frame', 0, 0, 200, 200, { '#run': { x: 0, y: 0, width: 10, height: 10 } });
      objects.set('frame', object);
      objects.set('o', createObject('o', 0, 0, 10, 10));

      manager.add({ id: 'a', position: { objectId: 'frame', selector: '#run' } });
      manager.setPosition('a', { x: 5, y: 5 });
      expect(object.tracked.size).toBe(0);

      manager.add({ id: 'b', position: { objectId: 'frame', selector: '#run' } });
      manager.attach('b', { objectId: 'o', anchor: 'right' });
      expect(object.tracked.size).toBe(0);
      expect(manager.get('b')!.attachedTo).toEqual({ objectId: 'o', anchor: 'right', offset: { x: 0, y: 0 } });
    });
  });
});
