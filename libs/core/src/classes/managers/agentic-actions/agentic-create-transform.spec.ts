import { KritzelObjectMap } from '../../structures/object-map.structure';
import { KritzelAgenticCursorManager } from '../agentic-cursor.manager';
import { KritzelAgenticActionManager } from '../agentic-action.manager';
import { KritzelAnchorManager } from '../anchor.manager';
import { KritzelShape } from '../../objects/shape.class';
import { KritzelText } from '../../objects/text.class';
import { KritzelPath } from '../../objects/path.class';
import { KritzelLine } from '../../objects/line.class';
import { KritzelGroup } from '../../objects/group.class';
import { KritzelRichTextHelper } from '../../../helpers/rich-text.helper';
import { KritzelCore } from '../../core/core.class';
import { KritzelSelectionGroup } from '../../objects/selection-group.class';

// Real object classes on a real Yjs object map: these tests check the geometry and history of
// the create and transform actions end to end, without a rendered canvas.

jest.mock('../../../configs/default-sync.config', () => ({ DEFAULT_SYNC_CONFIG: { providers: [] } }));
jest.mock('../../../helpers/migration.helper', () => ({ runMigrations: jest.fn() }));

/**
 * Same-realm deep clone. Jest's structuredClone returns objects from another realm, which Yjs
 * rejects ("Unexpected content type") because it checks `value.constructor === Object`.
 */
const sameRealmClone = (value: any): any => {
  if (Array.isArray(value)) return value.map(sameRealmClone);
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      if (value[key] !== undefined) result[key] = sameRealmClone(value[key]);
    }
    return result;
  }
  return value;
};

let originalStructuredClone: typeof structuredClone;
beforeAll(() => {
  originalStructuredClone = globalThis.structuredClone;
  (globalThis as any).structuredClone = sameRealmClone;
});
afterAll(() => {
  (globalThis as any).structuredClone = originalStructuredClone;
});

const flushMicrotasks = async () => {
  for (let i = 0; i < 30; i++) {
    await Promise.resolve();
  }
};

describe('agentic create and transform actions', () => {
  let now: number;
  let map: KritzelObjectMap<any>;
  let cursors: KritzelAgenticCursorManager;
  let actions: KritzelAgenticActionManager;
  let core: any;
  let tools: any[];

  const settle = async <T>(promise: Promise<T>, maxFrames = 600): Promise<T> => {
    let done = false;
    promise.then(
      () => (done = true),
      () => (done = true),
    );
    await flushMicrotasks();
    for (let i = 0; i < maxFrames && !done; i++) {
      now += 16;
      cursors.tick(now);
      await flushMicrotasks();
    }
    return promise;
  };

  const perform = (action: any, options: any = { instant: true }) => settle(actions.perform('agent', action, options));

  const addShape = (x: number, y: number, width: number, height: number) => {
    const shape = KritzelShape.create(core, { x, y, translateX: 0, translateY: 0, width, height, scale: 1 });
    map.insert(shape);
    map.stopUndoCapturing();
    return shape;
  };

  beforeEach(async () => {
    now = 1000;
    jest.spyOn(performance, 'now').mockImplementation(() => now);
    tools = [];
    const state = {
      scale: 1,
      translateX: 0,
      translateY: 0,
      viewportWidth: 2000,
      viewportHeight: 2000,
      lockDrawingScale: true,
      activeWorkspace: { id: 'ws' },
      debugInfo: {},
      isDragging: false,
      isResizing: false,
      isRotating: false,
      isSelecting: false,
      isDrawing: false,
      isErasing: false,
      isLineHandleDragging: false,
      isResizeHandleSelected: false,
      isRotationHandleSelected: false,
      isLineHandleSelected: false,
    };
    core = {
      user: undefined,
      editorId: undefined,
      rerender: jest.fn(),
      store: {
        state,
        get objects() {
          return map;
        },
        get currentZIndex() {
          return map ? map.allObjects().length : 0;
        },
        get allObjects() {
          return map ? map.allObjects() : [];
        },
        selectionGroup: null,
        invalidateSelectionCache: jest.fn(),
      },
      objectConfigManager: { isResizable: jest.fn(() => true), isRotatable: jest.fn(() => true) },
      objectTitlebarManager: { editingTitle: null, isEnabled: false },
      toolRegistry: { getToolByIndex: (index: number) => tools[index] ?? null },
      engine: {
        emitObjectsChange: jest.fn(),
        emitObjectsAdded: jest.fn(),
        emitObjectsRemoved: jest.fn(),
        emitObjectsUpdated: jest.fn(),
        emitObjectsInViewportChange: jest.fn(),
      },
      addObject: (object: any) => map.insert(object),
      removeObject: (object: any) => map.remove((o: any) => o.id === object.id),
    };
    // The real insert preparation, as engine.addObject() and the addObject action use it.
    core._store = core.store;
    core.prepareObjectForInsert = KritzelCore.prototype.prepareObjectForInsert;
    core.insertPreparedObject = KritzelCore.prototype.insertPreparedObject;
    core.anchorManager = new KritzelAnchorManager(core);
    map = new KritzelObjectMap<any>();
    await map.initialize(core as unknown as KritzelCore, 'ws', { providers: [] });
    cursors = new KritzelAgenticCursorManager(core);
    core.agenticCursorManager = cursors;
    actions = new KritzelAgenticActionManager(core);
    cursors.add({ id: 'agent', position: { x: 0, y: 0 } });
  });

  afterEach(() => {
    actions.cleanup();
    cursors.clear();
    map.destroy();
    jest.restoreAllMocks();
  });

  describe('createShape', () => {
    it('drags out a shape with the world rectangle and the shape tool settings', async () => {
      tools.push({ toolType: 'shape', shapeType: 'ellipse', strokeWidth: 7, fillColor: { light: '#fff', dark: '#000' } });
      const result = await perform({ type: 'createShape', x: 100, y: 50, width: 200, height: 80, style: { strokeColor: '#ff0000' } }, {});

      expect(result.completed).toBe(true);
      const shape = map.findById(result.objectIds![0]) as KritzelShape;
      expect(shape).toBeInstanceOf(KritzelShape);
      expect(shape.boundingBox.x).toBeCloseTo(100 - shape.padding);
      expect(shape.boundingBox.y).toBeCloseTo(50 - shape.padding);
      expect(shape.width).toBeCloseTo(200);
      expect(shape.height).toBeCloseTo(80);
      expect(shape.shapeType).toBe('ellipse');
      expect(shape.strokeWidth).toBe(7);
      expect(shape.strokeColor).toEqual({ light: '#ff0000', dark: '#ff0000' });
      expect(core.engine.emitObjectsAdded).toHaveBeenCalledWith([shape], { type: 'agent', agentId: 'agent', actionType: 'createShape' });
    });

    it('matches what the shape tool creates for the same rectangle at another zoom', async () => {
      core.store.state.lockDrawingScale = false;
      core.store.state.scale = 2;
      const result = await perform({ type: 'createShape', x: 10, y: 20, width: 30, height: 40 });
      const shape = map.findById(result.objectIds![0]) as KritzelShape;
      // The shape tool stores screen-like units (world * scale) with scale = viewport scale.
      expect(shape.scale).toBe(2);
      expect(shape.translateX).toBeCloseTo(10);
      expect(shape.translateY).toBeCloseTo(20);
      expect(shape.width / shape.scale).toBeCloseTo(30);
      expect(shape.height / shape.scale).toBeCloseTo(40);
    });

    it('types text into the new shape and undoes everything as one agent step', async () => {
      const userStack = map.undoManager!.undoStack.length;
      const result = await perform({ type: 'createShape', x: 0, y: 0, width: 100, height: 60, text: 'Hi\nthere' });
      const shape = map.findById(result.objectIds![0]) as KritzelShape;
      expect(KritzelRichTextHelper.getText(shape.editor!)).toBe('Hithere');
      expect(map.getAgentUndoStackLength('agent')).toBe(1);
      expect(map.undoManager!.undoStack.length).toBe(userStack);

      await perform({ type: 'undo' });
      expect(map.findById(shape.id)).toBeUndefined();
    });

    it('rolls a half-drawn shape back when aborted', async () => {
      const controller = new AbortController();
      const promise = actions.perform('agent', { type: 'createShape', x: 0, y: 0, width: 400, height: 400 }, { signal: controller.signal });
      await flushMicrotasks();
      for (let i = 0; i < 40 && map.allObjects().length === 0; i++) {
        now += 16;
        cursors.tick(now);
        await flushMicrotasks();
      }
      expect(map.allObjects().length).toBe(1);
      controller.abort();
      await expect(settle(promise)).resolves.toEqual({ completed: false, reason: 'aborted' });
      expect(map.allObjects().length).toBe(0);
    });
  });

  describe('createText and typeText', () => {
    it('creates a text at the point with the text tool defaults and types it', async () => {
      tools.push({ toolType: 'text', defaultFontSize: 24, defaultFontFamily: 'Georgia', fontSize: 99 });
      const result = await perform({ type: 'createText', x: 40, y: 60, text: 'Hello' }, {});
      const text = map.findById(result.objectIds![0]) as KritzelText;
      expect(text).toBeInstanceOf(KritzelText);
      expect(text.translateX).toBe(40);
      expect(text.translateY).toBe(60);
      expect(text.fontSize).toBe(24);
      expect(text.fontFamily).toBe('Georgia');
      expect(text.isEditing).toBe(false);
      expect(KritzelRichTextHelper.getText(text.editor!)).toBe('Hello');
      expect((map as any)._temporaryItemsCount).toBe(0);
      expect(map.getAgentUndoStackLength('agent')).toBe(1);
    });

    it('appends to and replaces existing text', async () => {
      const created = await perform({ type: 'createText', x: 0, y: 0, text: 'One' });
      const id = created.objectIds![0];
      await perform({ type: 'typeText', objectId: id, text: ' two' });
      expect(KritzelRichTextHelper.getText((map.findById(id) as KritzelText).editor!)).toBe('One two');
      await perform({ type: 'typeText', objectId: id, text: 'Fresh', mode: 'replace' });
      expect(KritzelRichTextHelper.getText((map.findById(id) as KritzelText).editor!)).toBe('Fresh');
      expect(core.engine.emitObjectsUpdated).toHaveBeenLastCalledWith(
        [{ object: map.findById(id), changedProperties: ['content', 'width', 'height'] }],
        { type: 'agent', agentId: 'agent', actionType: 'typeText' },
      );
    });

    it('refuses to type into objects that are not text or shapes', async () => {
      const path = KritzelPath.create(core, { points: [[0, 0], [10, 10]] });
      map.insert(path);
      await expect(perform({ type: 'typeText', objectId: path.id, text: 'x' })).resolves.toMatchObject({ completed: false, reason: 'invalid-target' });
    });
  });

  describe('resizeObject', () => {
    it('resizes to the world size and keeps the opposite corner in place', async () => {
      const shape = addShape(100, 100, 200, 100);
      const before = shape.rotatedPolygon.topLeft;
      const result = await perform({ type: 'resizeObject', objectId: shape.id, width: 300, height: 50 }, {});

      expect(result).toEqual({ completed: true, objectIds: [shape.id] });
      expect(shape.boundingBox.width).toBeCloseTo(300 + shape.padding * 2, 0);
      expect(shape.rotatedPolygon.topLeft.x).toBeCloseTo(before.x, 0);
      expect(shape.rotatedPolygon.topLeft.y).toBeCloseTo(before.y, 0);
      expect(cursors.get('agent')!.attachedTo).toMatchObject({ objectId: shape.id, anchor: 'bottom-right' });
    });

    it('keeps the aspect ratio when only one dimension is given', async () => {
      const shape = addShape(0, 0, 200, 100);
      const initial = { w: shape.width, h: shape.height };
      await perform({ type: 'resizeObject', objectId: shape.id, width: shape.boundingBox.width * 2, handle: 'top-left' });
      expect(shape.width / shape.height).toBeCloseTo(initial.w / initial.h, 1);
    });

    it('refuses objects the configuration does not allow to resize', async () => {
      const shape = addShape(0, 0, 50, 50);
      core.objectConfigManager.isResizable.mockReturnValue(false);
      await expect(perform({ type: 'resizeObject', objectId: shape.id, width: 100 })).resolves.toMatchObject({ completed: false, reason: 'not-allowed' });
      expect(shape.width).toBe(50);
    });

    it('resizes groups with stable child snapshots and unlocks them afterwards', async () => {
      const first = addShape(0, 0, 50, 50);
      const second = addShape(100, 0, 50, 50);
      const group = KritzelGroup.createFromObjects(core, [first, second]);
      map.insert(group);
      map.stopUndoCapturing();
      const widthBefore = group.boundingBox.width;

      // Without the lock, every resize frame would re-snapshot the children while locked.
      const groupAny = group as any;
      const original = groupAny.captureChildSnapshots.bind(group);
      let capturesWhileLocked = 0;
      groupAny.captureChildSnapshots = () => {
        if (KritzelGroup.transformLocks.has(group)) capturesWhileLocked++;
        original();
      };

      const result = await perform({ type: 'resizeObject', objectId: group.id, width: widthBefore * 2 }, {});

      expect(result.completed).toBe(true);
      expect(capturesWhileLocked).toBe(0);
      expect(KritzelGroup.transformLocks.has(group)).toBe(false);
      expect(group.boundingBox.width).toBeGreaterThan(widthBefore * 1.5);
    });

    it('refuses to resize objects inside a group', async () => {
      const child = addShape(0, 0, 50, 50);
      const group = KritzelGroup.createFromObjects(core, [child]);
      map.insert(group);
      await expect(perform({ type: 'resizeObject', objectId: child.id, width: 100 })).resolves.toMatchObject({ reason: 'invalid-target' });
    });
  });

  describe('rotateObject', () => {
    it('rotates to an absolute angle the short way and orbits the cursor with the handle', async () => {
      const shape = addShape(0, 0, 100, 100);
      const result = await perform({ type: 'rotateObject', objectId: shape.id, angle: 90 }, {});
      expect(result.completed).toBe(true);
      expect(shape.rotation).toBeCloseTo(Math.PI / 2);
      expect(cursors.get('agent')!.attachedTo).toMatchObject({ objectId: shape.id, anchor: 'top' });

      await perform({ type: 'rotateObject', objectId: shape.id, angle: -30, relative: true });
      expect(shape.rotation).toBeCloseTo(Math.PI / 3);
    });

    it('undoes a rotation through the agent history only', async () => {
      const shape = addShape(0, 0, 100, 100);
      await perform({ type: 'rotateObject', objectId: shape.id, angle: 45 });
      await perform({ type: 'undo' });
      expect((map.findById(shape.id) as KritzelShape).rotation).toBeCloseTo(0);
    });
  });

  describe('creator', () => {
    it('names the agent, not the local user, as the creator of every object it makes', async () => {
      core.user = { id: 'human' };
      const a = addShape(0, 0, 100, 50);
      const b = addShape(400, 0, 100, 50);

      const shape = await perform({ type: 'createShape', x: 0, y: 200, width: 80, height: 40 });
      const text = await perform({ type: 'createText', x: 0, y: 300, text: 'Hi' });
      const path = await perform({ type: 'drawPath', points: [{ x: 0, y: 400 }, { x: 50, y: 420 }, { x: 100, y: 400 }] }, {});
      const line = await perform({ type: 'connect', from: a.id, to: b.id }, {});

      for (const result of [shape, text, path, line]) {
        expect(result.completed).toBe(true);
        expect(map.findById(result.objectIds![0]).userId).toBe('agent');
      }
      expect(a.userId).not.toBe('agent');
    });
  });

  describe('drawPath', () => {
    it('draws a completed path through the world points with the brush settings', async () => {
      tools.push({ toolType: 'brush', size: 9, color: { light: '#123', dark: '#321' } });
      const points = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }];
      const result = await perform({ type: 'drawPath', points }, {});
      const path = map.findById(result.objectIds![0]) as KritzelPath;

      expect(path).toBeInstanceOf(KritzelPath);
      expect(path.isCompleted).toBe(true);
      expect(path.strokeWidth).toBe(9);
      expect(path.fill).toEqual({ light: '#123', dark: '#321' });
      const world = path.points.map(p => [(p[0] - path.x) / path.scale + path.translateX, (p[1] - path.y) / path.scale + path.translateY]);
      expect(world[0][0]).toBeCloseTo(0);
      expect(world[world.length - 1][0]).toBeCloseTo(100);
      expect(world[world.length - 1][1]).toBeCloseTo(100);
      expect(core.engine.emitObjectsAdded).toHaveBeenCalledWith([path], expect.objectContaining({ actionType: 'drawPath' }));
      expect(map.getAgentUndoStackLength('agent')).toBe(1);
    });

    it('rejects fewer than two points', () => {
      expect(() => actions.perform('agent', { type: 'drawPath', points: [{ x: 0, y: 0 }] })).toThrow(TypeError);
    });
  });

  describe('connect', () => {
    it('draws a line between two objects and anchors both ends', async () => {
      const a = addShape(0, 0, 50, 50);
      const b = addShape(300, 0, 50, 50);
      const result = await perform({ type: 'connect', from: a.id, to: b.id }, {});

      const line = map.findById(result.objectIds![0]) as KritzelLine;
      expect(line).toBeInstanceOf(KritzelLine);
      expect(line.startAnchor).toEqual({ objectId: a.id });
      expect(line.endAnchor).toEqual({ objectId: b.id });
      expect(core.anchorManager.getLinesAnchoredTo(b.id)).toEqual([{ lineId: line.id, endpoint: 'end' }]);
    });

    it('refuses self-connections and lines as ends', async () => {
      const a = addShape(0, 0, 50, 50);
      await expect(perform({ type: 'connect', from: a.id, to: a.id })).resolves.toMatchObject({ reason: 'invalid-target' });
      const line = KritzelLine.create(core, { startX: 0, startY: 0, endX: 10, endY: 10 });
      map.insert(line);
      await expect(perform({ type: 'connect', from: a.id, to: line.id })).resolves.toMatchObject({ reason: 'invalid-target' });
    });

    it('restores the anchors of a dragged line when the move is aborted', async () => {
      const a = addShape(0, 0, 50, 50);
      const b = addShape(300, 0, 50, 50);
      const connected = await perform({ type: 'connect', from: a.id, to: b.id });
      const lineId = connected.objectIds![0];

      const controller = new AbortController();
      const promise = actions.perform('agent', { type: 'moveObject', objectId: lineId, to: { x: 500, y: 500 } }, { signal: controller.signal });
      await flushMicrotasks();
      for (let i = 0; i < 80 && (map.findById(lineId) as KritzelLine).startAnchor; i++) {
        now += 16;
        cursors.tick(now);
        await flushMicrotasks();
      }
      expect((map.findById(lineId) as KritzelLine).startAnchor).toBeUndefined();
      controller.abort();
      await expect(settle(promise)).resolves.toMatchObject({ reason: 'aborted' });

      const line = map.findById(lineId) as KritzelLine;
      expect(line.startAnchor).toEqual({ objectId: a.id });
      expect(line.endAnchor).toEqual({ objectId: b.id });
      expect(core.anchorManager.getLinesAnchoredTo(a.id)).toEqual([{ lineId, endpoint: 'start' }]);
    });

    it('rolls the line back when an end is deleted mid-drag', async () => {
      const a = addShape(0, 0, 50, 50);
      const b = addShape(900, 0, 50, 50);
      const promise = actions.perform('agent', { type: 'connect', from: a.id, to: b.id });
      await flushMicrotasks();
      for (let i = 0; i < 80 && !map.allObjects().some((o: any) => o instanceof KritzelLine); i++) {
        now += 16;
        cursors.tick(now);
        await flushMicrotasks();
      }
      map.remove((o: any) => o.id === b.id);
      await expect(settle(promise)).resolves.toMatchObject({ completed: false, reason: 'object-removed' });
      expect(map.allObjects().some((o: any) => o instanceof KritzelLine)).toBe(false);
    });
  });
  describe('style validation', () => {
    it('rejects unknown style fields, naming the allowed ones', () => {
      expect(() => actions.perform('agent', { type: 'drawPath', points: [{ x: 0, y: 0 }, { x: 1, y: 1 }], style: { color: 'red' } } as any)).toThrow(
        'Unknown property "style.color". Use strokeColor, strokeWidth, opacity.',
      );
    });

    it('rejects values of the wrong type or range', () => {
      const shape = { type: 'createShape', x: 0, y: 0, width: 10, height: 10 };
      expect(() => actions.perform('agent', { ...shape, style: { opacity: 2 } } as any)).toThrow('"style.opacity" must be a number from 0 to 1.');
      expect(() => actions.perform('agent', { ...shape, style: { strokeWidth: -1 } } as any)).toThrow('greater than 0');
      expect(() => actions.perform('agent', { ...shape, style: { fillColor: 5 } } as any)).toThrow('CSS color');
      expect(() =>
        actions.perform('agent', { type: 'connect', from: 'a', to: 'b', style: { arrows: { end: { enabled: true, fill: 'red' } } } } as any),
      ).toThrow('"style.arrows.end.fill" must be { light, dark }.');
    });
  });

  describe('setStyle', () => {
    it('restyles a shape; an explicit font color wins over the one derived from the fill', async () => {
      const shape = addShape(0, 0, 100, 50);

      const result = await perform({ type: 'setStyle', objectIds: [shape.id], style: { fillColor: '#000000', fontColor: '#ff0000', strokeWidth: 9 } });

      expect(result).toEqual({ completed: true, objectIds: [shape.id] });
      const styled = map.findById(shape.id) as KritzelShape;
      expect(styled.fillColor).toEqual({ light: '#000000', dark: '#000000' });
      expect(styled.fontColor).toEqual({ light: '#ff0000', dark: '#ff0000' });
      expect(styled.strokeWidth).toBe(9);
      expect(core.engine.emitObjectsUpdated).toHaveBeenCalledWith(
        [{ object: styled, changedProperties: ['fillColor', 'strokeWidth', 'fontColor'] }],
        { type: 'agent', agentId: 'agent', actionType: 'setStyle' },
      );

      await perform({ type: 'undo' });
      expect((map.findById(shape.id) as KritzelShape).strokeWidth).not.toBe(9);
    });

    it('maps strokeColor to the color property of strokes and lines and styles group children', async () => {
      const a = addShape(0, 0, 100, 50);
      const b = addShape(300, 0, 100, 50);
      const [pathId] = (await perform({ type: 'drawPath', points: [{ x: 0, y: 200 }, { x: 80, y: 220 }] })).objectIds!;
      const [lineId] = (await perform({ type: 'connect', from: a.id, to: b.id })).objectIds!;
      const group = KritzelGroup.createFromObjects(core, [map.findById(pathId), map.findById(lineId)]);
      map.insert(group);
      map.stopUndoCapturing();

      const arrows = { end: { enabled: true, style: 'open' as const } };
      await perform({ type: 'setStyle', objectIds: [group.id], style: { strokeColor: '#00ff00', arrows } });

      expect((map.findById(pathId) as KritzelPath).fill).toEqual({ light: '#00ff00', dark: '#00ff00' });
      expect((map.findById(lineId) as KritzelLine).stroke).toEqual({ light: '#00ff00', dark: '#00ff00' });
      expect((map.findById(lineId) as KritzelLine).arrows).toEqual(arrows);
    });

    it('changes only the arrow ends it is given and keeps the other one', async () => {
      const a = addShape(0, 0, 100, 50);
      const b = addShape(300, 0, 100, 50);
      const [lineId] = (await perform({ type: 'connect', from: a.id, to: b.id })).objectIds!;
      await perform({ type: 'setStyle', objectIds: [lineId], style: { arrows: { start: { enabled: true, style: 'open' } } } });

      const end = { enabled: true, style: 'triangle' as const };
      await perform({ type: 'setStyle', objectIds: [lineId], style: { arrows: { end } } });

      const line = map.findById(lineId) as KritzelLine;
      expect(line.arrows!.start).toEqual({ enabled: true, style: 'open' });
      expect(line.arrows!.end).toEqual(end);
      expect(line.arrows!.end).not.toBe(end);
    });

    it('refuses when no field applies to any target', async () => {
      const shape = addShape(0, 0, 100, 50);

      await expect(perform({ type: 'setStyle', objectIds: [shape.id], style: { arrows: { end: { enabled: true } } } })).resolves.toEqual({
        completed: false,
        reason: 'invalid-target',
        objectIds: [shape.id],
      });
    });

    it('needs at least one style field', () => {
      expect(() => actions.perform('agent', { type: 'setStyle', objectIds: ['a'], style: {} })).toThrow('at least one of');
    });
  });

  describe('addObject', () => {
    it('places a pre-built object as the agent, with a fresh ID, and keeps the user selection', async () => {
      core.user = { id: 'human' };
      const held = addShape(0, 0, 50, 50);
      const selection = Object.create(KritzelSelectionGroup.prototype);
      const fields: Record<string, unknown> = {
        id: 'sg-user',
        objectIds: [held.id],
        clientId: map.docClientId,
        rotatedBoundingBox: { x: 0, y: 0, z: 1, width: 1, height: 1 },
        serialize: () => ({ __class__: 'MockSelection', id: 'sg-user' }),
        invalidateObjectsCache: jest.fn(),
        refreshObjectDimensions: jest.fn(),
        captureUnchangedSnapshots: jest.fn(),
      };
      for (const [key, value] of Object.entries(fields)) {
        Object.defineProperty(selection, key, { value, writable: true, configurable: true, enumerable: true });
      }
      map.insert(selection);
      map.stopUndoCapturing();
      const shape = new KritzelShape({ translateX: 400, translateY: 300, width: 120, height: 80 });
      const originalId = shape.id;

      const result = await perform({ type: 'addObject', object: shape }, {});

      expect(result.completed).toBe(true);
      expect(result.objectIds).toEqual([shape.id]);
      expect(shape.id).not.toBe(originalId);
      expect(map.findById(shape.id)).toBe(shape);
      expect(shape.userId).toBe('agent');
      expect(map.findById('sg-user')).toBe(selection);
      expect(core.engine.emitObjectsAdded).toHaveBeenCalledWith([shape], { type: 'agent', agentId: 'agent', actionType: 'addObject' });

      await perform({ type: 'undo' });
      expect(map.findById(shape.id)).toBeUndefined();
    });

    it('adds a group with its children as one step', async () => {
      const group = new KritzelGroup();
      const a = new KritzelShape({ translateX: 0, translateY: 0, width: 50, height: 50 });
      const b = new KritzelShape({ translateX: 100, translateY: 0, width: 50, height: 50 });
      group.addChild(a);
      group.addChild(b);

      const result = await perform({ type: 'addObject', object: group });

      expect(result.completed).toBe(true);
      expect(map.findById(a.id)).toBe(a);
      expect(map.findById(b.id)).toBe(b);
      expect([a, b, group].map(object => object.userId)).toEqual(['agent', 'agent', 'agent']);

      await perform({ type: 'undo' });
      expect([a, b, group].map(object => map.findById(object.id))).toEqual([undefined, undefined, undefined]);
    });

    it('refuses a group whose child is already on the canvas and leaves that object alone', async () => {
      const live = addShape(0, 0, 50, 50);
      const liveId = live.id;
      const group = new KritzelGroup();
      group.addChild(new KritzelShape({ translateX: 100, translateY: 0, width: 50, height: 50 }));
      group.addChild(live);

      await expect(perform({ type: 'addObject', object: group })).resolves.toEqual({ completed: false, reason: 'invalid-target', objectIds: [liveId] });
      expect(live.id).toBe(liveId);
      expect(map.allObjects()).toEqual([live]);
    });

    it('changes nothing of the object until the insert, which takes the z-index of that moment', async () => {
      const group = new KritzelGroup();
      const a = new KritzelShape({ translateX: 0, translateY: 0, width: 50, height: 50 });
      const b = new KritzelShape({ translateX: 100, translateY: 0, width: 50, height: 50 });
      group.addChild(a);
      group.addChild(b);
      const ids = [group.id, a.id, b.id];

      // Stopped while the cursor flies: the group is untouched and can be added later.
      const controller = new AbortController();
      const stopped = actions.perform('agent', { type: 'addObject', object: group }, { signal: controller.signal });
      now += 16;
      cursors.tick(now);
      await flushMicrotasks();
      controller.abort();
      await expect(settle(stopped)).resolves.toMatchObject({ completed: false, reason: 'aborted' });
      expect([group.id, a.id, b.id]).toEqual(ids);
      expect(group._pendingChildren).toEqual([a, b]);

      // Something lands on the canvas while the cursor flies: the group stacks above it.
      const added = actions.perform('agent', { type: 'addObject', object: group }, {});
      now += 16;
      cursors.tick(now);
      await flushMicrotasks();
      const other = KritzelShape.create(core, { x: 500, y: 500, translateX: 0, translateY: 0, width: 50, height: 50, scale: 1 });
      other.zIndex = core.store.currentZIndex;
      map.insert(other);
      map.stopUndoCapturing();
      await expect(settle(added)).resolves.toMatchObject({ completed: true });

      expect(map.findById(a.id)).toBe(a);
      expect(map.findById(b.id)).toBe(b);
      expect(Math.min(a.zIndex, b.zIndex, group.zIndex)).toBeGreaterThan(other.zIndex);
    });

    it('refuses at the insert an object that landed on the canvas while the cursor flew', async () => {
      const shape = new KritzelShape({ translateX: 400, translateY: 300, width: 120, height: 80 });
      const added = actions.perform('agent', { type: 'addObject', object: shape }, {});
      now += 16;
      cursors.tick(now);
      await flushMicrotasks();
      // The app inserts the same instance meanwhile, the way editor.addObject() does.
      core.insertPreparedObject(shape, core.prepareObjectForInsert(shape));
      const appId = shape.id;

      await expect(settle(added)).resolves.toEqual({ completed: false, reason: 'invalid-target', objectIds: [appId] });
      expect(shape.id).toBe(appId);
      expect(map.allObjects().filter(object => object === shape)).toHaveLength(1);
    });

    it('keeps collecting children added to a group after a stopped addObject', async () => {
      const group = new KritzelGroup();
      const a = new KritzelShape({ translateX: 0, translateY: 0, width: 50, height: 50 });
      group.addChild(a);
      const controller = new AbortController();
      const stopped = actions.perform('agent', { type: 'addObject', object: group }, { signal: controller.signal });
      now += 16;
      cursors.tick(now);
      await flushMicrotasks();
      controller.abort();
      await settle(stopped);

      const b = new KritzelShape({ translateX: 100, translateY: 0, width: 50, height: 50 });
      group.addChild(b);
      await expect(perform({ type: 'addObject', object: group })).resolves.toMatchObject({ completed: true });

      expect(map.findById(a.id)).toBe(a);
      expect(map.findById(b.id)).toBe(b);
      expect(group.childIds).toEqual([a.id, b.id]);
    });

    it('refuses an empty group and keeps the cursor usable', async () => {
      const empty = new KritzelGroup();
      await expect(settle(actions.perform('agent', { type: 'addObject', object: empty }, {}))).resolves.toEqual({
        completed: false,
        reason: 'invalid-target',
        objectIds: [empty.id],
      });

      const shape = new KritzelShape({ translateX: 10, translateY: 10, width: 50, height: 50 });
      await expect(settle(actions.perform('agent', { type: 'addObject', object: shape }, {}))).resolves.toMatchObject({ completed: true });
      expect(Number.isFinite(cursors.get('agent')!.position.x)).toBe(true);
    });

    it('refuses an instance that the group tree holds twice', async () => {
      const shared = new KritzelShape({ translateX: 0, translateY: 0, width: 50, height: 50 });
      const inner = new KritzelGroup();
      inner.addChild(shared);
      const outer = new KritzelGroup();
      outer.addChild(inner);
      outer.addChild(shared);

      await expect(perform({ type: 'addObject', object: outer })).resolves.toEqual({ completed: false, reason: 'invalid-target', objectIds: [shared.id] });
      expect(map.allObjects()).toEqual([]);
    });

    it('refuses a nested group whose children were inserted before', async () => {
      const inner = new KritzelGroup();
      inner.addChild(new KritzelShape({ translateX: 0, translateY: 0, width: 50, height: 50 }));
      await expect(perform({ type: 'addObject', object: inner })).resolves.toMatchObject({ completed: true });
      await perform({ type: 'undo' });

      const outer = new KritzelGroup();
      outer.addChild(inner);
      outer.addChild(new KritzelShape({ translateX: 100, translateY: 0, width: 50, height: 50 }));

      await expect(perform({ type: 'addObject', object: outer })).resolves.toEqual({ completed: false, reason: 'invalid-target', objectIds: [inner.id] });
      expect(map.allObjects()).toEqual([]);
    });

    it('refuses an object that is already on the canvas and anything that is not an object', async () => {
      const shape = addShape(0, 0, 50, 50);

      await expect(perform({ type: 'addObject', object: shape })).resolves.toMatchObject({ completed: false, reason: 'invalid-target' });
      expect(() => actions.perform('agent', { type: 'addObject', object: { id: 'x' } } as any)).toThrow('must be a Kritzel object');
    });
  });
});
