import { UpdrawObjectMap } from '../structures/object-map.structure';
import { UpdrawAgenticCursorManager } from './agentic-cursor.manager';
import { UpdrawAgenticActionManager } from './agentic-action.manager';
import { UpdrawAnchorManager } from './anchor.manager';
import { UpdrawShape } from '../objects/shape.class';
import { UpdrawText } from '../objects/text.class';
import { UpdrawPath } from '../objects/path.class';
import { UpdrawLine } from '../objects/line.class';
import { UpdrawGroup } from '../objects/group.class';
import { UpdrawCore } from '../core/core.class';
import { UpdrawSelectionGroup } from '../objects/selection-group.class';
import { UpdrawClipboardManager } from './clipboard.manager';
import { UpdrawObjectAppearManager } from './object-appear.manager';
import { lineMidpoint, readLineGeometry } from '../executors/line-handles';
import { drawLineExecutor } from '../executors/draw-line.executor';
import { editLineExecutor } from '../executors/edit-line.executor';
import { UpdrawIframeObject } from '../objects/iframe.class';
import type { UpdrawAgenticFill } from '../../interfaces/agentic-action.interface';

/** How the test agent's cursor looks; agents own these values in the editor. */
const AGENT_APPEARANCE = { name: 'Agent', color: '#7C3AED', status: null, visible: true };

// Real object classes on a real Yjs object map: these tests check the geometry and history of
// the create and transform actions end to end, without a rendered canvas.

jest.mock('../../configs/default-sync.config', () => ({ DEFAULT_SYNC_CONFIG: { providers: [] } }));
jest.mock('../../helpers/migration.helper', () => ({ runMigrations: jest.fn() }));

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
  let map: UpdrawObjectMap<any>;
  let cursors: UpdrawAgenticCursorManager;
  let actions: UpdrawAgenticActionManager;
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
    const shape = UpdrawShape.create(core, { x, y, translateX: 0, translateY: 0, width, height, scale: 1 });
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
      objectTitlebarManager: { editingTitle: null, isEnabled: false, getRotationHandleDistance: () => 15 },
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
    core.prepareObjectForInsert = UpdrawCore.prototype.prepareObjectForInsert;
    core.insertPreparedObject = UpdrawCore.prototype.insertPreparedObject;
    core.objectAppearManager = new UpdrawObjectAppearManager();
    core.anchorManager = new UpdrawAnchorManager(core);
    core.clipboardManager = new UpdrawClipboardManager(core);
    map = new UpdrawObjectMap<any>();
    await map.initialize(core as unknown as UpdrawCore, 'ws', { providers: [] });
    cursors = new UpdrawAgenticCursorManager(core);
    core.agenticCursorManager = cursors;
    actions = new UpdrawAgenticActionManager(core);
    cursors.add({ appearance: AGENT_APPEARANCE, id: 'agent', position: { x: 0, y: 0 } });
  });

  afterEach(() => {
    actions.cleanup();
    cursors.cleanup();
    map.destroy();
    jest.restoreAllMocks();
  });

  describe('createShape', () => {
    it('drags out a shape with the world rectangle and the shape tool settings', async () => {
      tools.push({ toolType: 'shape', shapeType: 'ellipse', strokeWidth: 7, fillColor: { light: '#fff', dark: '#000' } });
      const result = await perform({ type: 'createShape', x: 100, y: 50, width: 200, height: 80, style: { strokeColor: '#ff0000' } }, {});

      expect(result.completed).toBe(true);
      const shape = map.findById(result.objectIds![0]) as UpdrawShape;
      expect(shape).toBeInstanceOf(UpdrawShape);
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
      const shape = map.findById(result.objectIds![0]) as UpdrawShape;
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
      const shape = map.findById(result.objectIds![0]) as UpdrawShape;
      expect(shape.editor!.state.doc.textContent).toBe('Hithere');
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
      const text = map.findById(result.objectIds![0]) as UpdrawText;
      expect(text).toBeInstanceOf(UpdrawText);
      expect(text.translateX).toBe(40);
      expect(text.translateY).toBe(60);
      expect(text.fontSize).toBe(24);
      expect(text.fontFamily).toBe('Georgia');
      expect(text.isEditing).toBe(false);
      expect(text.editor!.state.doc.textContent).toBe('Hello');
      expect((map as any)._temporaryItemsCount).toBe(0);
      expect(map.getAgentUndoStackLength('agent')).toBe(1);
    });

    it('appends to and replaces existing text', async () => {
      const created = await perform({ type: 'createText', x: 0, y: 0, text: 'One' });
      const id = created.objectIds![0];
      await perform({ type: 'typeText', objectId: id, text: ' two' });
      expect((map.findById(id) as UpdrawText).editor!.state.doc.textContent).toBe('One two');
      await perform({ type: 'typeText', objectId: id, text: 'Fresh', mode: 'replace' });
      expect((map.findById(id) as UpdrawText).editor!.state.doc.textContent).toBe('Fresh');
      expect(core.engine.emitObjectsUpdated).toHaveBeenLastCalledWith(
        [{ object: map.findById(id), changedProperties: ['content', 'width', 'height'] }],
        { type: 'agent', agentId: 'agent', actionType: 'typeText' },
      );
    });

    it('refuses to type into objects that are not text or shapes', async () => {
      const path = UpdrawPath.create(core, { points: [[0, 0], [10, 10]] });
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
      const group = UpdrawGroup.createFromObjects(core, [first, second]);
      map.insert(group);
      map.stopUndoCapturing();
      const widthBefore = group.boundingBox.width;

      // Without the lock, every resize frame would re-snapshot the children while locked.
      const groupAny = group as any;
      const original = groupAny.captureChildSnapshots.bind(group);
      let capturesWhileLocked = 0;
      groupAny.captureChildSnapshots = () => {
        if (UpdrawGroup.transformLocks.has(group)) capturesWhileLocked++;
        original();
      };

      const result = await perform({ type: 'resizeObject', objectId: group.id, width: widthBefore * 2 }, {});

      expect(result.completed).toBe(true);
      expect(capturesWhileLocked).toBe(0);
      expect(UpdrawGroup.transformLocks.has(group)).toBe(false);
      expect(group.boundingBox.width).toBeGreaterThan(widthBefore * 1.5);
    });

    it('refuses to resize objects inside a group', async () => {
      const child = addShape(0, 0, 50, 50);
      const group = UpdrawGroup.createFromObjects(core, [child]);
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

    it('grabs the handle where the cursor overlay draws it, above a shown titlebar', async () => {
      const shape = addShape(0, 0, 100, 100);
      core.objectTitlebarManager = { editingTitle: null, isEnabled: true, getRotationHandleDistance: () => 15 + 34 };
      core.store.state.scale = 2;

      await perform({ type: 'rotateObject', objectId: shape.id, angle: 90 }, {});

      expect(cursors.get('agent')!.attachedTo).toEqual({ objectId: shape.id, anchor: 'top', offset: { x: 0, y: -(15 + 34) / 2 } });
      const handle = cursors.getRotationHandle(shape.id)!.handle;
      expect(cursors.get('agent')!.position.x).toBeCloseTo(handle.x);
      expect(cursors.get('agent')!.position.y).toBeCloseTo(handle.y);
    });

    it('undoes a rotation through the agent history only', async () => {
      const shape = addShape(0, 0, 100, 100);
      await perform({ type: 'rotateObject', objectId: shape.id, angle: 45 });
      await perform({ type: 'undo' });
      expect((map.findById(shape.id) as UpdrawShape).rotation).toBeCloseTo(0);
    });
  });

  describe('copyObjects', () => {
    const center = (object: { rotatedBoundingBox: { x: number; y: number; width: number; height: number } }) => {
      const box = object.rotatedBoundingBox;
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    };

    it('Alt-drags copies to `to` as the agent, stacked above everything, and leaves the originals', async () => {
      const a = addShape(0, 0, 100, 50);
      const b = addShape(200, 0, 100, 50);
      const before = [a, b].map(object => ({ ...center(object) }));

      const result = await perform({ type: 'copyObjects', objectIds: [a.id, b.id], to: { x: 500, y: 400 } }, {});

      expect(result.completed).toBe(true);
      const copies = result.objectIds!.map(id => map.findById(id) as UpdrawShape);
      expect(copies).toHaveLength(2);
      expect(copies.map(copy => copy.id)).not.toContain(a.id);
      copies.forEach(copy => expect(copy.userId).toBe('agent'));
      // The union of the copies is centered on `to`, the originals stay where they were.
      const box = { x: Math.min(...copies.map(c => c.rotatedBoundingBox.x)), right: Math.max(...copies.map(c => c.rotatedBoundingBox.x + c.rotatedBoundingBox.width)) };
      expect((box.x + box.right) / 2).toBeCloseTo(500);
      expect([a, b].map(center)).toEqual(before);
      expect(Math.min(...copies.map(copy => copy.zIndex))).toBeGreaterThan(Math.max(a.zIndex, b.zIndex));
      expect(core.engine.emitObjectsAdded).toHaveBeenCalledWith(copies, { type: 'agent', agentId: 'agent', actionType: 'copyObjects' });
    });

    it('puts the copies right next to the originals by default and undoes them in one step', async () => {
      const a = addShape(0, 0, 100, 50);
      const [copyId] = (await perform({ type: 'copyObjects', objectIds: [a.id] }, {})).objectIds!;
      const copy = map.findById(copyId) as UpdrawShape;
      expect(copy.rotatedBoundingBox.x).toBeCloseTo(a.rotatedBoundingBox.x + a.rotatedBoundingBox.width + 24);
      expect(copy.rotatedBoundingBox.y).toBeCloseTo(a.rotatedBoundingBox.y);

      await perform({ type: 'undo' });
      expect(map.findById(copyId)).toBeFalsy();
      expect(map.findById(a.id)).toBe(a);
    });

    it('copies group children and keeps lines between copied objects connected', async () => {
      const first = addShape(0, 0, 50, 50);
      const second = addShape(100, 0, 50, 50);
      const group = UpdrawGroup.createFromObjects(core, [first, second]);
      map.insert(group);
      const other = addShape(0, 200, 50, 50);
      const [lineId] = (await perform({ type: 'connect', from: group.id, to: other.id })).objectIds!;

      const result = await perform({ type: 'copyObjects', objectIds: [group.id, other.id, lineId], to: { x: 600, y: 600 } });

      const [groupCopy, otherCopy, lineCopy] = result.objectIds!.map(id => map.findById(id));
      expect(groupCopy).toBeInstanceOf(UpdrawGroup);
      const childCopies = (groupCopy as UpdrawGroup).childIds.map(id => map.findById(id));
      expect(childCopies).toHaveLength(2);
      childCopies.forEach(child => {
        expect(child).toBeInstanceOf(UpdrawShape);
        expect([first.id, second.id]).not.toContain(child.id);
        expect(child.userId).toBe('agent');
      });
      expect((lineCopy as UpdrawLine).startAnchor?.objectId).toBe(groupCopy.id);
      expect((lineCopy as UpdrawLine).endAnchor?.objectId).toBe(otherCopy.id);
    });

    it('detaches a copied line from objects that stay behind', async () => {
      const a = addShape(0, 0, 50, 50);
      const b = addShape(300, 0, 50, 50);
      const [lineId] = (await perform({ type: 'connect', from: a.id, to: b.id })).objectIds!;

      const result = await perform({ type: 'copyObjects', objectIds: [a.id, lineId], to: { x: 200, y: 400 } });

      const [aCopy, lineCopy] = result.objectIds!.map(id => map.findById(id)) as [UpdrawShape, UpdrawLine];
      expect(lineCopy.startAnchor?.objectId).toBe(aCopy.id);
      expect(lineCopy.endAnchor).toBeUndefined();
      expect((map.findById(lineId) as UpdrawLine).endAnchor?.objectId).toBe(b.id);
    });

    it('replaces copied originals in its selection', async () => {
      const a = addShape(0, 0, 100, 50);
      const b = addShape(200, 0, 100, 50);
      await perform({ type: 'select', objectIds: [a.id, b.id] });
      const result = await perform({ type: 'copyObjects', objectIds: [a.id] });
      expect(actions.getSelection('agent')).toEqual([result.objectIds![0], b.id]);
    });
  });

  describe('groupObjects and ungroupObjects', () => {
    it('groups objects as the agent at the topmost one, and undoes it in one step', async () => {
      const a = addShape(0, 0, 50, 50);
      const b = addShape(100, 0, 50, 50);
      const result = await perform({ type: 'groupObjects', objectIds: [b.id, a.id] }, {});

      expect(result.completed).toBe(true);
      const group = map.findById(result.objectIds![0]) as UpdrawGroup;
      expect(group).toBeInstanceOf(UpdrawGroup);
      expect(group.childIds).toEqual([a.id, b.id]);
      expect(group.userId).toBe('agent');
      expect(group.zIndex).toBe(Math.max(a.zIndex, b.zIndex));
      expect(core.engine.emitObjectsAdded).toHaveBeenCalledWith([group], { type: 'agent', agentId: 'agent', actionType: 'groupObjects' });

      await perform({ type: 'undo' });
      expect(map.findById(group.id)).toBeFalsy();
      expect(map.findById(a.id)).toBeTruthy();
    });

    it('needs two top-level objects', async () => {
      const a = addShape(0, 0, 50, 50);
      const b = addShape(100, 0, 50, 50);
      expect(() => actions.perform('agent', { type: 'groupObjects', objectIds: [a.id, a.id] })).toThrow('at least two');
      const group = UpdrawGroup.createFromObjects(core, [b]);
      map.insert(group);
      await expect(perform({ type: 'groupObjects', objectIds: [a.id, b.id] })).resolves.toMatchObject({ reason: 'invalid-target', objectIds: [b.id] });
    });

    it('replaces grouped objects in its selection by the group', async () => {
      const a = addShape(0, 0, 50, 50);
      const b = addShape(100, 0, 50, 50);
      const c = addShape(200, 0, 50, 50);
      await perform({ type: 'select', objectIds: [a.id, b.id, c.id] });
      const [groupId] = (await perform({ type: 'groupObjects', objectIds: [a.id, b.id] })).objectIds!;
      expect(actions.getSelection('agent')).toEqual([groupId, c.id]);
    });

    it('dissolves groups as the agent, keeps the children, and undoes it in one step', async () => {
      const a = addShape(0, 0, 50, 50);
      const b = addShape(100, 0, 50, 50);
      const group = UpdrawGroup.createFromObjects(core, [a, b]);
      map.insert(group);
      map.stopUndoCapturing();
      await perform({ type: 'select', objectIds: [group.id] });

      const result = await perform({ type: 'ungroupObjects', objectIds: [group.id] }, {});

      expect(result).toMatchObject({ completed: true, objectIds: [a.id, b.id] });
      expect(map.findById(group.id)).toBeFalsy();
      expect(map.findById(a.id)).toBeTruthy();
      expect(actions.getSelection('agent')).toEqual([a.id, b.id]);
      expect(core.engine.emitObjectsRemoved).toHaveBeenCalledWith([expect.objectContaining({ id: group.id })], { type: 'agent', agentId: 'agent', actionType: 'ungroupObjects' });

      await perform({ type: 'undo' });
      expect((map.findById(group.id) as UpdrawGroup).childIds).toEqual([a.id, b.id]);
    });

    it('refuses to ungroup objects that are not groups', async () => {
      const a = addShape(0, 0, 50, 50);
      await expect(perform({ type: 'ungroupObjects', objectIds: [a.id] })).resolves.toMatchObject({ reason: 'invalid-target', objectIds: [a.id] });
    });
  });

  describe('orderObjects', () => {
    const stack = () => [...map.allObjects()].filter(o => o instanceof UpdrawShape).sort((x, y) => x.zIndex - y.zIndex).map(o => o.id);

    it('moves objects to the front, back, forward and backward as the agent', async () => {
      const a = addShape(0, 0, 50, 50);
      const b = addShape(20, 0, 50, 50);
      const c = addShape(40, 0, 50, 50);
      expect(stack()).toEqual([a.id, b.id, c.id]);

      await perform({ type: 'orderObjects', objectIds: [a.id], order: 'front' }, {});
      expect(stack()).toEqual([b.id, c.id, a.id]);
      await perform({ type: 'orderObjects', objectIds: [a.id], order: 'back' });
      expect(stack()).toEqual([a.id, b.id, c.id]);
      await perform({ type: 'orderObjects', objectIds: [a.id], order: 'forward' });
      expect(stack()).toEqual([b.id, a.id, c.id]);
      await perform({ type: 'orderObjects', objectIds: [c.id], order: 'backward' });
      expect(stack()).toEqual([b.id, c.id, a.id]);
      expect(core.engine.emitObjectsUpdated).toHaveBeenLastCalledWith(
        expect.arrayContaining([{ object: c, changedProperties: ['zIndex'] }]),
        { type: 'agent', agentId: 'agent', actionType: 'orderObjects' },
      );

      await perform({ type: 'undo' });
      expect(stack()).toEqual([b.id, a.id, c.id]);
    });

    it('completes without a change when the objects are already in place', async () => {
      const a = addShape(0, 0, 50, 50);
      const b = addShape(20, 0, 50, 50);
      const updates = core.engine.emitObjectsUpdated.mock.calls.length;
      await expect(perform({ type: 'orderObjects', objectIds: [b.id], order: 'front' })).resolves.toMatchObject({ completed: true });
      expect(stack()).toEqual([a.id, b.id]);
      expect(core.engine.emitObjectsUpdated.mock.calls.length).toBe(updates);
      expect(() => actions.perform('agent', { type: 'orderObjects', objectIds: [a.id], order: 'top' } as any)).toThrow('"order"');
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
      const path = map.findById(result.objectIds![0]) as UpdrawPath;

      expect(path).toBeInstanceOf(UpdrawPath);
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

      const line = map.findById(result.objectIds![0]) as UpdrawLine;
      expect(line).toBeInstanceOf(UpdrawLine);
      expect(line.startAnchor).toEqual({ objectId: a.id });
      expect(line.endAnchor).toEqual({ objectId: b.id });
      expect(core.anchorManager.getLinesAnchoredTo(b.id)).toEqual([{ lineId: line.id, endpoint: 'end' }]);
    });

    it('refuses self-connections and lines as ends', async () => {
      const a = addShape(0, 0, 50, 50);
      await expect(perform({ type: 'connect', from: a.id, to: a.id })).resolves.toMatchObject({ reason: 'invalid-target' });
      const line = UpdrawLine.create(core, { startX: 0, startY: 0, endX: 10, endY: 10 });
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
      for (let i = 0; i < 80 && (map.findById(lineId) as UpdrawLine).startAnchor; i++) {
        now += 16;
        cursors.tick(now);
        await flushMicrotasks();
      }
      expect((map.findById(lineId) as UpdrawLine).startAnchor).toBeUndefined();
      controller.abort();
      await expect(settle(promise)).resolves.toMatchObject({ reason: 'aborted' });

      const line = map.findById(lineId) as UpdrawLine;
      expect(line.startAnchor).toEqual({ objectId: a.id });
      expect(line.endAnchor).toEqual({ objectId: b.id });
      expect(core.anchorManager.getLinesAnchoredTo(a.id)).toEqual([{ lineId, endpoint: 'start' }]);
    });

    it('rolls the line back when an end is deleted mid-drag', async () => {
      const a = addShape(0, 0, 50, 50);
      const b = addShape(900, 0, 50, 50);
      const promise = actions.perform('agent', { type: 'connect', from: a.id, to: b.id });
      await flushMicrotasks();
      for (let i = 0; i < 80 && !map.allObjects().some((o: any) => o instanceof UpdrawLine); i++) {
        now += 16;
        cursors.tick(now);
        await flushMicrotasks();
      }
      map.remove((o: any) => o.id === b.id);
      await expect(settle(promise)).resolves.toMatchObject({ completed: false, reason: 'object-removed' });
      expect(map.allObjects().some((o: any) => o instanceof UpdrawLine)).toBe(false);
    });
  });
  describe('drawLine and editLine', () => {
    const geometryOf = (id: string) => readLineGeometry(core, map.findById(id) as UpdrawLine);
    const center = (shape: UpdrawShape) => ({ x: shape.centerX, y: shape.centerY });
    const expectPoint = (actual: { x: number; y: number }, expected: { x: number; y: number }) => {
      expect(actual.x).toBeCloseTo(expected.x, 3);
      expect(actual.y).toBeCloseTo(expected.y, 3);
    };

    it('draws a free line between two points, without anchors', async () => {
      const result = await perform({ type: 'drawLine', from: { x: 10, y: 20 }, to: { x: 210, y: 120 } });

      const line = map.findById(result.objectIds![0]) as UpdrawLine;
      expect(line).toBeInstanceOf(UpdrawLine);
      expect(line.startAnchor).toBeUndefined();
      expect(line.endAnchor).toBeUndefined();
      expectPoint(geometryOf(line.id).start, { x: 10, y: 20 });
      expectPoint(geometryOf(line.id).end, { x: 210, y: 120 });
      expect(geometryOf(line.id).control).toBeUndefined();
    });

    it('anchors only the end on an object, which then follows the object', async () => {
      const box = addShape(300, 0, 50, 50);
      const result = await perform({ type: 'drawLine', from: { x: 0, y: 0 }, to: { objectId: box.id } }, {});
      const id = result.objectIds![0];

      const line = map.findById(id) as UpdrawLine;
      expect(line.startAnchor).toBeUndefined();
      expect(line.endAnchor).toEqual({ objectId: box.id });
      expectPoint(geometryOf(id).end, center(box));

      await perform({ type: 'moveObject', objectId: box.id, to: { x: 500, y: 400 } });
      expectPoint(geometryOf(id).end, center(map.findById(box.id) as UpdrawShape));
      expectPoint(geometryOf(id).start, { x: 0, y: 0 });
    });

    it('curves a new line through a point, animated or instant', async () => {
      for (const options of [{}, { instant: true }]) {
        const result = await perform({ type: 'drawLine', from: { x: 0, y: 0 }, to: { x: 200, y: 0 }, through: { x: 100, y: 80 } }, options);
        const geometry = geometryOf(result.objectIds![0]);
        expect(geometry.control).toBeDefined();
        expectPoint(lineMidpoint(geometry), { x: 100, y: 80 });
      }
    });

    it('refuses the same object at both ends, lines as ends and unknown objects', async () => {
      const box = addShape(0, 0, 50, 50);
      const line = UpdrawLine.create(core, { startX: 0, startY: 0, endX: 10, endY: 10 });
      map.insert(line);
      await expect(perform({ type: 'drawLine', from: { objectId: box.id }, to: { objectId: box.id } })).resolves.toMatchObject({ reason: 'invalid-target' });
      await expect(perform({ type: 'drawLine', from: { x: 0, y: 0 }, to: { objectId: line.id } })).resolves.toMatchObject({ reason: 'invalid-target' });
      await expect(perform({ type: 'drawLine', from: { x: 0, y: 0 }, to: { objectId: 'nope' } })).resolves.toMatchObject({ reason: 'invalid-target' });
    });

    it('rejects ends that are neither a point nor an object, or both', () => {
      const validate = (action: any) => () => drawLineExecutor.validate({ type: 'drawLine', ...action });
      expect(validate({ from: { x: 0 }, to: { x: 1, y: 1 } })).toThrow('"from" must be { x, y } or { objectId }.');
      expect(validate({ from: { x: 0, y: 0, objectId: 'a' }, to: { x: 1, y: 1 } })).toThrow('"from" takes either x and y or objectId, not both.');
      expect(validate({ from: { x: 0, y: 0 }, to: { x: 1, y: 1 }, through: { x: 'a' } })).toThrow('"through" must be { x, y }.');
    });

    it('moves an end to a free point, detaching it, and keeps the other end attached', async () => {
      const a = addShape(0, 0, 50, 50);
      const b = addShape(300, 0, 50, 50);
      const id = (await perform({ type: 'connect', from: a.id, to: b.id })).objectIds![0];

      await perform({ type: 'editLine', lineId: id, to: { x: 400, y: 300 } }, {});

      const line = map.findById(id) as UpdrawLine;
      expect(line.startAnchor).toEqual({ objectId: a.id });
      expect(line.endAnchor).toBeUndefined();
      expect(core.anchorManager.getLinesAnchoredTo(b.id)).toEqual([]);
      expectPoint(geometryOf(id).end, { x: 400, y: 300 });
      expectPoint(geometryOf(id).start, center(a));
    });

    it('attaches the start of a free line to an object', async () => {
      const box = addShape(300, 300, 50, 50);
      const id = (await perform({ type: 'drawLine', from: { x: 0, y: 0 }, to: { x: 100, y: 0 } })).objectIds![0];

      await perform({ type: 'editLine', lineId: id, from: { objectId: box.id } });

      expect((map.findById(id) as UpdrawLine).startAnchor).toEqual({ objectId: box.id });
      expectPoint(geometryOf(id).start, center(box));
      expectPoint(geometryOf(id).end, { x: 100, y: 0 });
    });

    it('curves and straightens an existing line', async () => {
      const id = (await perform({ type: 'drawLine', from: { x: 0, y: 0 }, to: { x: 200, y: 0 } })).objectIds![0];

      await perform({ type: 'editLine', lineId: id, through: { x: 100, y: -60 } }, {});
      expectPoint(lineMidpoint(geometryOf(id)), { x: 100, y: -60 });

      await perform({ type: 'editLine', lineId: id, straight: true }, {});
      expect(geometryOf(id).control).toBeUndefined();
      expectPoint(geometryOf(id).end, { x: 200, y: 0 });
    });

    it('keeps the world geometry of a rotated line when editing it', async () => {
      const id = (await perform({ type: 'drawLine', from: { x: 0, y: 0 }, to: { x: 200, y: 0 } })).objectIds![0];
      await perform({ type: 'rotateObject', objectId: id, angle: 90 });
      const rotated = geometryOf(id);

      await perform({ type: 'editLine', lineId: id, through: lineMidpoint(rotated) });

      expectPoint(geometryOf(id).start, rotated.start);
      expectPoint(geometryOf(id).end, rotated.end);
    });

    it('refuses non-lines, both ends on one object, and missing changes', async () => {
      const a = addShape(0, 0, 50, 50);
      const b = addShape(300, 0, 50, 50);
      const id = (await perform({ type: 'connect', from: a.id, to: b.id })).objectIds![0];

      await expect(perform({ type: 'editLine', lineId: a.id, straight: true })).resolves.toMatchObject({ reason: 'invalid-target', objectIds: [a.id] });
      await expect(perform({ type: 'editLine', lineId: id, to: { objectId: a.id } })).resolves.toMatchObject({ reason: 'invalid-target', objectIds: [a.id] });
      expect(() => editLineExecutor.validate({ type: 'editLine', lineId: id })).toThrow('Give at least one of "from", "to", "through" or "straight".');
      expect(() => editLineExecutor.validate({ type: 'editLine', lineId: id, through: { x: 0, y: 0 }, straight: true })).toThrow('Give "through" or "straight", not both.');
    });

    it('restores geometry and anchors when an edit is aborted', async () => {
      const a = addShape(0, 0, 50, 50);
      const b = addShape(300, 0, 50, 50);
      const id = (await perform({ type: 'connect', from: a.id, to: b.id })).objectIds![0];
      const before = geometryOf(id);

      const controller = new AbortController();
      const promise = actions.perform('agent', { type: 'editLine', lineId: id, to: { x: 900, y: 900 } }, { signal: controller.signal });
      await flushMicrotasks();
      for (let i = 0; i < 120 && (map.findById(id) as UpdrawLine).endAnchor; i++) {
        now += 16;
        cursors.tick(now);
        await flushMicrotasks();
      }
      expect((map.findById(id) as UpdrawLine).endAnchor).toBeUndefined();
      controller.abort();
      await expect(settle(promise)).resolves.toMatchObject({ reason: 'aborted' });

      expect((map.findById(id) as UpdrawLine).endAnchor).toEqual({ objectId: b.id });
      expect(core.anchorManager.getLinesAnchoredTo(b.id)).toEqual([{ lineId: id, endpoint: 'end' }]);
      expectPoint(geometryOf(id).end, before.end);
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
      const styled = map.findById(shape.id) as UpdrawShape;
      expect(styled.fillColor).toEqual({ light: '#000000', dark: '#000000' });
      expect(styled.fontColor).toEqual({ light: '#ff0000', dark: '#ff0000' });
      expect(styled.strokeWidth).toBe(9);
      expect(core.engine.emitObjectsUpdated).toHaveBeenCalledWith(
        [{ object: styled, changedProperties: ['fillColor', 'strokeWidth', 'fontColor'] }],
        { type: 'agent', agentId: 'agent', actionType: 'setStyle' },
      );

      await perform({ type: 'undo' });
      expect((map.findById(shape.id) as UpdrawShape).strokeWidth).not.toBe(9);
    });

    it('maps strokeColor to the color property of strokes and lines and styles group children', async () => {
      const a = addShape(0, 0, 100, 50);
      const b = addShape(300, 0, 100, 50);
      const [pathId] = (await perform({ type: 'drawPath', points: [{ x: 0, y: 200 }, { x: 80, y: 220 }] })).objectIds!;
      const [lineId] = (await perform({ type: 'connect', from: a.id, to: b.id })).objectIds!;
      const group = UpdrawGroup.createFromObjects(core, [map.findById(pathId), map.findById(lineId)]);
      map.insert(group);
      map.stopUndoCapturing();

      const arrows = { end: { enabled: true, style: 'open' as const } };
      await perform({ type: 'setStyle', objectIds: [group.id], style: { strokeColor: '#00ff00', arrows } });

      expect((map.findById(pathId) as UpdrawPath).fill).toEqual({ light: '#00ff00', dark: '#00ff00' });
      expect((map.findById(lineId) as UpdrawLine).stroke).toEqual({ light: '#00ff00', dark: '#00ff00' });
      expect((map.findById(lineId) as UpdrawLine).arrows).toEqual(arrows);
    });

    it('changes only the arrow ends it is given and keeps the other one', async () => {
      const a = addShape(0, 0, 100, 50);
      const b = addShape(300, 0, 100, 50);
      const [lineId] = (await perform({ type: 'connect', from: a.id, to: b.id })).objectIds!;
      await perform({ type: 'setStyle', objectIds: [lineId], style: { arrows: { start: { enabled: true, style: 'open' } } } });

      const end = { enabled: true, style: 'triangle' as const };
      await perform({ type: 'setStyle', objectIds: [lineId], style: { arrows: { end } } });

      const line = map.findById(lineId) as UpdrawLine;
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
    it('lets the placed object appear, unlike the shapes an agent draws', async () => {
      const shape = new UpdrawShape({ translateX: 400, translateY: 300, width: 120, height: 80 });

      await perform({ type: 'addObject', object: shape }, {});
      const drawn = await perform({ type: 'createShape', x: 0, y: 0, width: 100, height: 60 });

      expect(core.objectAppearManager.has(shape.id)).toBe(true);
      expect(drawn.objectIds.length).toBeGreaterThan(0);
      drawn.objectIds.forEach((id: string) => expect(core.objectAppearManager.has(id)).toBe(false));
    });

    it('places a pre-built object as the agent, with a fresh ID, and keeps the user selection', async () => {
      core.user = { id: 'human' };
      const held = addShape(0, 0, 50, 50);
      const selection = Object.create(UpdrawSelectionGroup.prototype);
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
      const shape = new UpdrawShape({ translateX: 400, translateY: 300, width: 120, height: 80 });
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
      const group = new UpdrawGroup();
      const a = new UpdrawShape({ translateX: 0, translateY: 0, width: 50, height: 50 });
      const b = new UpdrawShape({ translateX: 100, translateY: 0, width: 50, height: 50 });
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
      const group = new UpdrawGroup();
      group.addChild(new UpdrawShape({ translateX: 100, translateY: 0, width: 50, height: 50 }));
      group.addChild(live);

      await expect(perform({ type: 'addObject', object: group })).resolves.toEqual({ completed: false, reason: 'invalid-target', objectIds: [liveId] });
      expect(live.id).toBe(liveId);
      expect(map.allObjects()).toEqual([live]);
    });

    it('changes nothing of the object until the insert, which takes the z-index of that moment', async () => {
      const group = new UpdrawGroup();
      const a = new UpdrawShape({ translateX: 0, translateY: 0, width: 50, height: 50 });
      const b = new UpdrawShape({ translateX: 100, translateY: 0, width: 50, height: 50 });
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
      const other = UpdrawShape.create(core, { x: 500, y: 500, translateX: 0, translateY: 0, width: 50, height: 50, scale: 1 });
      other.zIndex = core.store.currentZIndex;
      map.insert(other);
      map.stopUndoCapturing();
      await expect(settle(added)).resolves.toMatchObject({ completed: true });

      expect(map.findById(a.id)).toBe(a);
      expect(map.findById(b.id)).toBe(b);
      expect(Math.min(a.zIndex, b.zIndex, group.zIndex)).toBeGreaterThan(other.zIndex);
    });

    it('refuses at the insert an object that landed on the canvas while the cursor flew', async () => {
      const shape = new UpdrawShape({ translateX: 400, translateY: 300, width: 120, height: 80 });
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
      const group = new UpdrawGroup();
      const a = new UpdrawShape({ translateX: 0, translateY: 0, width: 50, height: 50 });
      group.addChild(a);
      const controller = new AbortController();
      const stopped = actions.perform('agent', { type: 'addObject', object: group }, { signal: controller.signal });
      now += 16;
      cursors.tick(now);
      await flushMicrotasks();
      controller.abort();
      await settle(stopped);

      const b = new UpdrawShape({ translateX: 100, translateY: 0, width: 50, height: 50 });
      group.addChild(b);
      await expect(perform({ type: 'addObject', object: group })).resolves.toMatchObject({ completed: true });

      expect(map.findById(a.id)).toBe(a);
      expect(map.findById(b.id)).toBe(b);
      expect(group.childIds).toEqual([a.id, b.id]);
    });

    it('refuses an empty group and keeps the cursor usable', async () => {
      const empty = new UpdrawGroup();
      await expect(settle(actions.perform('agent', { type: 'addObject', object: empty }, {}))).resolves.toEqual({
        completed: false,
        reason: 'invalid-target',
        objectIds: [empty.id],
      });

      const shape = new UpdrawShape({ translateX: 10, translateY: 10, width: 50, height: 50 });
      await expect(settle(actions.perform('agent', { type: 'addObject', object: shape }, {}))).resolves.toMatchObject({ completed: true });
      expect(Number.isFinite(cursors.get('agent')!.position.x)).toBe(true);
    });

    it('refuses an instance that the group tree holds twice', async () => {
      const shared = new UpdrawShape({ translateX: 0, translateY: 0, width: 50, height: 50 });
      const inner = new UpdrawGroup();
      inner.addChild(shared);
      const outer = new UpdrawGroup();
      outer.addChild(inner);
      outer.addChild(shared);

      await expect(perform({ type: 'addObject', object: outer })).resolves.toEqual({ completed: false, reason: 'invalid-target', objectIds: [shared.id] });
      expect(map.allObjects()).toEqual([]);
    });

    it('refuses a nested group whose children were inserted before', async () => {
      const inner = new UpdrawGroup();
      inner.addChild(new UpdrawShape({ translateX: 0, translateY: 0, width: 50, height: 50 }));
      await expect(perform({ type: 'addObject', object: inner })).resolves.toMatchObject({ completed: true });
      await perform({ type: 'undo' });

      const outer = new UpdrawGroup();
      outer.addChild(inner);
      outer.addChild(new UpdrawShape({ translateX: 100, translateY: 0, width: 50, height: 50 }));

      await expect(perform({ type: 'addObject', object: outer })).resolves.toEqual({ completed: false, reason: 'invalid-target', objectIds: [inner.id] });
      expect(map.allObjects()).toEqual([]);
    });

    it('refuses an object that is already on the canvas and anything that is not an object', async () => {
      const shape = addShape(0, 0, 50, 50);

      await expect(perform({ type: 'addObject', object: shape })).resolves.toMatchObject({ completed: false, reason: 'invalid-target' });
      expect(() => actions.perform('agent', { type: 'addObject', object: { id: 'x' } } as any)).toThrow('must be an Updraw object');
    });

    describe('with a fill', () => {
      const deferred = <T>() => {
        let resolve!: (value: T) => void;
        let reject!: (reason: unknown) => void;
        const promise = new Promise<T>((res, rej) => {
          resolve = res;
          reject = rej;
        });
        promise.catch(() => undefined);
        return { promise, resolve, reject };
      };
      const widget = (html = '') => new UpdrawIframeObject({ name: 'Counter', html, translateX: 100, translateY: 100, width: 200, height: 120 });
      const copyContent = (placeholder: any, content: any) => {
        placeholder.content = { ...content.content };
      };
      /** Lets the action run until it waits for its fill. */
      const run = async (_promise: Promise<unknown>) => {
        for (let i = 0; i < 20; i++) {
          now += 16;
          cursors.tick(now);
          await flushMicrotasks();
        }
      };

      it('places a loading placeholder, waits for the fill and fills it in as one step', async () => {
        const fill = deferred<UpdrawAgenticFill>();
        const placeholder = widget();
        let settled = false;
        const placing = actions.perform('agent', { type: 'addObject', object: placeholder, fill: fill.promise }, { instant: true });
        placing.then(() => (settled = true));
        await run(placing);

        expect(settled).toBe(false);
        expect(map.findById(placeholder.id)).toBe(placeholder);
        expect(placeholder.isLoading).toBe(true);
        expect(placeholder.userId).toBe('agent');

        fill.resolve({ content: widget('<button>+</button>'), apply: copyContent });
        const result = await settle(placing);
        expect(result).toEqual({ completed: true, objectIds: [placeholder.id] });
        expect(placeholder.isLoading).toBe(false);
        expect(placeholder.html).toBe('<button>+</button>');
        expect(map.getAgentUndoStackLength('agent')).toBe(1);

        await perform({ type: 'undo' });
        expect(map.findById(placeholder.id)).toBeUndefined();
      });

      it('rolls the placeholder back when the fill is rejected or the action is stopped', async () => {
        const rejected = deferred<UpdrawAgenticFill>();
        const first = widget();
        const placing = actions.perform('agent', { type: 'addObject', object: first, fill: rejected.promise }, { instant: true });
        await run(placing);
        expect(map.findById(first.id)).toBe(first);
        rejected.reject(new Error('cancelled'));
        await expect(settle(placing)).resolves.toMatchObject({ completed: false, reason: 'aborted' });
        expect(map.findById(first.id)).toBeUndefined();

        const controller = new AbortController();
        const second = widget();
        const stopped = actions.perform('agent', { type: 'addObject', object: second, fill: deferred<UpdrawAgenticFill>().promise }, { instant: true, signal: controller.signal });
        await run(stopped);
        expect(map.findById(second.id)).toBe(second);
        controller.abort();
        await expect(settle(stopped)).resolves.toMatchObject({ completed: false, reason: 'aborted' });
        expect(map.allObjects()).toEqual([]);
        expect(map.getAgentUndoStackLength('agent')).toBe(0);
      });

      it('lets the user move the placeholder while it waits, and fills it in where the user put it', async () => {
        const fill = deferred<UpdrawAgenticFill>();
        const placeholder = widget();
        const placing = actions.perform('agent', { type: 'addObject', object: placeholder, fill: fill.promise }, { instant: true });
        await run(placing);

        placeholder.translateX = 500;
        map.update(placeholder);
        await run(placing);
        fill.resolve({ content: widget('<p>Hi</p>'), apply: copyContent });

        await expect(settle(placing)).resolves.toMatchObject({ completed: true });
        expect(map.findById(placeholder.id)).toMatchObject({ translateX: 500, isLoading: false, html: '<p>Hi</p>' });
      });

      it('answers object-removed when the user deletes the placeholder while it waits', async () => {
        const fill = deferred<UpdrawAgenticFill>();
        const placeholder = widget();
        const placing = actions.perform('agent', { type: 'addObject', object: placeholder, fill: fill.promise }, { instant: true });
        await run(placing);

        map.remove((object: any) => object.id === placeholder.id);
        fill.resolve({ content: widget('<p>Hi</p>'), apply: copyContent });

        await expect(settle(placing)).resolves.toMatchObject({ completed: false, reason: 'object-removed', objectIds: [placeholder.id] });
        expect(map.allObjects()).toEqual([]);
      });

      it("makes the user's changes to a waiting placeholder part of the action: a stop removes it, an undo after the fill too", async () => {
        const controller = new AbortController();
        const stopped = widget();
        const stopping = actions.perform('agent', { type: 'addObject', object: stopped, fill: deferred<UpdrawAgenticFill>().promise }, { instant: true, signal: controller.signal });
        await run(stopping);
        stopped.translateX = 500;
        map.update(stopped);
        // Also inside a transaction, as moving a selection does.
        map.transaction(() => {
          stopped.translateY = 300;
          map.update(stopped);
        });
        controller.abort();
        await expect(settle(stopping)).resolves.toMatchObject({ reason: 'aborted' });
        expect(map.allObjects()).toEqual([]);

        const fill = deferred<UpdrawAgenticFill>();
        const filled = widget();
        const userSteps = map.undoManager!.undoStack.length;
        const placing = actions.perform('agent', { type: 'addObject', object: filled, fill: fill.promise }, { instant: true });
        await run(placing);
        filled.translateX = 500;
        map.update(filled);
        fill.resolve({ content: widget('<p>Hi</p>'), apply: copyContent });
        await expect(settle(placing)).resolves.toMatchObject({ completed: true });
        // The move is not a step of the user's history, so their undo can't bring the empty placeholder back.
        expect(map.undoManager!.undoStack.length).toBe(userSteps);
        expect(map.findById(filled.id)).toMatchObject({ translateX: 500, isLoading: false, html: '<p>Hi</p>' });
        await perform({ type: 'undo' });
        expect(map.allObjects()).toEqual([]);
      });

      it('routes only while the action waits', async () => {
        const fill = deferred<UpdrawAgenticFill>();
        const placeholder = widget();
        const placing = actions.perform('agent', { type: 'addObject', object: placeholder, fill: fill.promise }, { instant: true });
        await run(placing);
        fill.resolve({ content: widget('<p>Hi</p>'), apply: copyContent });
        await settle(placing);
        const userSteps = map.undoManager!.undoStack.length;
        placeholder.translateX = 700;
        map.update(placeholder);
        expect(map.undoManager!.undoStack.length).toBe(userSteps + 1);
      });

      it('refuses a fill that is not a promise, and a group as the placeholder', () => {
        expect(() => actions.perform('agent', { type: 'addObject', object: widget(), fill: {} as any })).toThrow('"fill" must be a promise.');
        const group = new UpdrawGroup();
        group.addChild(widget());
        expect(() => actions.perform('agent', { type: 'addObject', object: group, fill: deferred<UpdrawAgenticFill>().promise })).toThrow("A group can't be a placeholder.");
      });
    });
  });

  describe('updateIframe with a fill', () => {
    const addWidget = async () => {
      const iframe = new UpdrawIframeObject({ name: 'Counter', html: '<b>old</b>', translateX: 100, translateY: 100, width: 200, height: 120 });
      await perform({ type: 'addObject', object: iframe });
      return map.findById(iframe.id) as UpdrawIframeObject;
    };
    /** Starts the action and lets it run until it waits for its changes. */
    const start = async (action: any) => {
      let started!: () => void;
      const waiting = new Promise<void>(resolve => (started = resolve));
      let finish!: (changes: any) => void;
      let fail!: (reason: unknown) => void;
      const changes = new Promise<any>((resolve, reject) => {
        finish = resolve;
        fail = reject;
      });
      const performing = actions.perform('agent', { ...action, fill: () => (started(), changes) }, { instant: true });
      const result = settle(performing);
      await waiting;
      return { result, finish, fail };
    };

    it('shows the iframe as loading until the changes arrive, then applies them as one step', async () => {
      const iframe = await addWidget();
      const undoSteps = map.getAgentUndoStackLength('agent');
      const { result, finish } = await start({ type: 'updateIframe', objectId: iframe.id });
      expect(iframe.isLoading).toBe(true);
      expect(iframe.html).toBe('<b>old</b>');

      finish({ objectId: iframe.id, name: 'Timer', html: '<b>new</b>' });
      await expect(result).resolves.toEqual({ completed: true, objectIds: [iframe.id] });
      const current = map.findById(iframe.id) as UpdrawIframeObject;
      expect(current.isLoading).toBe(false);
      expect(current.html).toBe('<b>new</b>');
      expect(current.name).toBe('Timer');
      expect(map.getAgentUndoStackLength('agent')).toBe(undoSteps + 1);
    });

    it('rolls the loading back when the changes do not come', async () => {
      const iframe = await addWidget();
      const { result, fail } = await start({ type: 'updateIframe', objectId: iframe.id });
      expect(iframe.isLoading).toBe(true);
      fail(new Error('cancelled'));
      await expect(result).resolves.toMatchObject({ completed: false, reason: 'aborted' });
      const current = map.findById(iframe.id) as UpdrawIframeObject;
      expect(current.isLoading).toBe(false);
      expect(current.html).toBe('<b>old</b>');
    });
  });
});

