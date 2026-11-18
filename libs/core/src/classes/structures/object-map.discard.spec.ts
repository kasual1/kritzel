import { UpmadeObjectMap } from './object-map.structure';
import type { UpmadeCore } from '../core/core.class';

// Real Yjs on purpose: these tests pin how a discarded in-progress object interacts with the undo history.

/** Minimal persistable object; the reviver turns serialized data back into one. */
class FakeObject {
  id: string;
  x = 0;
  constructor(id: string, x = 0) {
    this.id = id;
    this.x = x;
  }
  get rotatedBoundingBox() {
    return { x: this.x, y: 0, z: 1, width: 10, height: 10 };
  }
  serialize() {
    return { __class__: 'FakeObject', id: this.id, x: this.x };
  }
}

jest.mock('../core/reviver.class', () => ({
  UpmadeReviver: jest.fn().mockImplementation(() => ({
    revive: (data: { id: string; x: number }) => new FakeObject(data.id, data.x),
  })),
}));
jest.mock('../objects/selection-box.class');
jest.mock('../objects/selection-group.class');
jest.mock('../../configs/default-sync.config', () => ({ DEFAULT_SYNC_CONFIG: { providers: [] } }));
jest.mock('../../helpers/migration.helper', () => ({ runMigrations: jest.fn() }));

const createCore = () => ({
  rerender: jest.fn(),
  editorId: undefined,
  user: undefined,
  anchorManager: { rebuildIndex: jest.fn() },
  engine: {
    emitObjectsChange: jest.fn(),
    emitObjectsAdded: jest.fn(),
    emitObjectsRemoved: jest.fn(),
    emitObjectsUpdated: jest.fn(),
  },
  store: {
    state: { debugInfo: {}, isDragging: false, isResizing: false, isRotating: false },
    invalidateSelectionCache: jest.fn(),
  },
});

/** Starts an in-progress object the way the drawing tools do: insert, mark it active, then grow it. */
const startDrawing = (map: UpmadeObjectMap<any>, id: string, moves: number) => {
  const object = new FakeObject(id, 0);
  map.insert(object as any);
  map.setActiveDrawingObject(id);
  for (let i = 1; i <= moves; i++) {
    const next = new FakeObject(id, i);
    map.update(next as any);
  }
};

describe('UpmadeObjectMap.discard (real Yjs)', () => {
  let map: UpmadeObjectMap<any>;
  let core: ReturnType<typeof createCore>;

  beforeEach(async () => {
    core = createCore();
    map = new UpmadeObjectMap<any>();
    await map.initialize(core as unknown as UpmadeCore, 'ws', { providers: [] });
    // An earlier, finished action the user can undo.
    map.insert(new FakeObject('earlier', 0) as any);
    map.stopUndoCapturing();
  });

  afterEach(() => {
    map.destroy();
  });

  it('removes the object', () => {
    startDrawing(map, 'stroke', 3);

    map.discard('stroke');

    expect(map.findById('stroke')).toBeUndefined();
    expect(map.allObjects().map(o => o.id)).toEqual(['earlier']);
  });

  it('cannot be brought back by undo', () => {
    startDrawing(map, 'stroke', 3);

    map.discard('stroke');
    map.undo();

    expect(map.findById('stroke')).toBeUndefined();
  });

  it('leaves the undo history as it was before the object was started', () => {
    const before = map.undoManager!.undoStack.length;
    startDrawing(map, 'stroke', 3);

    map.discard('stroke');

    expect(map.undoManager!.undoStack.length).toBe(before);
    expect(map.canUndo()).toBe(true);
  });

  it('lets the next undo revert the previous action', () => {
    startDrawing(map, 'stroke', 3);

    map.discard('stroke');
    map.undo();

    expect(map.findById('earlier')).toBeUndefined();
    expect(map.canUndo()).toBe(false);
  });

  it('works when the object was discarded before it grew', () => {
    const before = map.undoManager!.undoStack.length;
    startDrawing(map, 'stroke', 0);

    map.discard('stroke');
    map.undo();

    expect(map.undoManager!.undoStack.length).toBe(before - 1);
    expect(map.findById('stroke')).toBeUndefined();
    expect(map.findById('earlier')).toBeUndefined();
  });

  it('cannot be brought back by redo', () => {
    startDrawing(map, 'stroke', 2);

    map.discard('stroke');
    map.undo();
    map.redo();

    expect(map.findById('earlier')).toBeDefined();
    expect(map.findById('stroke')).toBeUndefined();
  });

  it('clears the active drawing object when it is the discarded one', () => {
    startDrawing(map, 'stroke', 1);

    map.discard('stroke');

    expect(map.localActiveDrawingObjectId).toBeNull();
  });

  it('keeps other changes of the same undo step undoable', () => {
    startDrawing(map, 'stroke', 1);
    // Another object changes while the stroke's step is still open.
    map.update(new FakeObject('earlier', 42) as any);

    map.discard('stroke');
    expect(map.findById('earlier').x).toBe(42);

    map.undo();

    expect(map.findById('earlier').x).toBe(0);
    expect(map.findById('stroke')).toBeUndefined();
  });

  it('starts a new undo step for the next change', () => {
    startDrawing(map, 'stroke', 1);
    map.discard('stroke');

    map.insert(new FakeObject('next', 0) as any);
    map.undo();

    expect(map.findById('next')).toBeUndefined();
    expect(map.findById('earlier')).toBeDefined();
  });

  it('does nothing for an unknown object', () => {
    const before = map.undoManager!.undoStack.length;

    map.discard('missing');

    expect(map.undoManager!.undoStack.length).toBe(before);
    expect(map.findById('earlier')).toBeDefined();
  });

  it('documents the bug it fixes: remove() leaves a step that undo reverts', () => {
    startDrawing(map, 'stroke', 3);

    map.remove(o => o.id === 'stroke');
    map.undo();

    // The removal was its own step, so undo restores the half-drawn object.
    expect(map.findById('stroke')).toBeDefined();
  });
});
