import { KritzelClipboardManager } from './clipboard.manager';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelGroup } from '../objects/group.class';
import { KritzelLine } from '../objects/line.class';
import { KritzelReviver } from '../core/reviver.class';
import { KritzelImage } from '../objects/image.class';
import imageCompression from 'browser-image-compression';

jest.mock('browser-image-compression', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../objects/selection-group.class', () => ({
  KritzelSelectionGroup: {
    create: jest.fn(),
  },
}));

/** Builds a fake object whose prototype is the given class, so `instanceof` checks match. */
const withPrototype = (cls: { prototype: object }, fields: Record<string, any>): any => Object.assign(Object.create(cls.prototype), fields);

/** Prototypes for fake revived objects, keyed by their `__class__`. */
const PROTOTYPES_BY_CLASS: Record<string, { prototype: object }> = {
  KritzelGroup,
  KritzelLine,
};

describe('KritzelClipboardManager', () => {
  let manager: KritzelClipboardManager;
  let mockCore: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCore = {
      store: {
        selectionGroup: null,
        currentZIndex: 10,
        objects: {
          transaction: jest.fn((cb: () => void) => cb()),
          update: jest.fn(),
        },
        state: {
          activeWorkspace: { id: 'workspace-1' },
          scale: 1,
          isSelecting: true,
        },
        setState: jest.fn(),
      },
      delete: jest.fn(),
      removeSelectionGroup: jest.fn(),
      removeSelectionBox: jest.fn(),
      addObject: jest.fn(),
      addSelectionGroup: jest.fn(),
      rerender: jest.fn(),
      engine: {
        emitObjectsAdded: jest.fn(),
        emitObjectsChange: jest.fn(),
        viewport: {
          bringIntoViewIfNeeded: jest.fn(),
        },
      },
      anchorManager: {
        rebuildIndex: jest.fn(),
      },
      toolRegistry: {
        getTool: jest.fn().mockReturnValue({ name: 'selection' }),
      },
      permissionManager: {
        checkPermission: jest.fn().mockResolvedValue('granted'),
        requestPermission: jest.fn().mockResolvedValue('granted'),
      },
    };

    manager = new KritzelClipboardManager(mockCore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('copy', () => {
    const PAYLOAD_PREFIX = 'kritzel-clipboard/v1:';

    it('writes a kritzel clipboard payload to the DOM clipboard event, sorted by zIndex', () => {
      const objA = { id: 'a', zIndex: 5, serialize: jest.fn().mockReturnValue({ id: 'a', __class__: 'KritzelShape' }) } as any;
      const objB = { id: 'b', zIndex: 1, serialize: jest.fn().mockReturnValue({ id: 'b', __class__: 'KritzelShape' }) } as any;
      const setData = jest.fn();

      mockCore.store.selectionGroup = { objects: [objA, objB] };

      manager.copy({ clipboardData: { setData } } as any);

      expect(setData).toHaveBeenCalledTimes(1);
      const [, serialized] = setData.mock.calls[0];
      expect(serialized).toContain(PAYLOAD_PREFIX);

      const payload = JSON.parse(serialized.slice(PAYLOAD_PREFIX.length));
      // Sorted by zIndex ascending: b before a
      expect(payload.objects.map((o: any) => o.id)).toEqual(['b', 'a']);
      expect(payload.sourceWorkspaceId).toBe('workspace-1');
    });

    it('embeds group children under __children__', () => {
      const child = { id: 'child', zIndex: 0, serialize: jest.fn().mockReturnValue({ id: 'child', __class__: 'KritzelShape' }) } as any;
      // Without a core, a group's children are its pending children.
      const group = withPrototype(KritzelGroup, {
        id: 'group',
        zIndex: 1,
        _pendingChildren: [child],
        serialize: jest.fn().mockReturnValue({ id: 'group', __class__: 'KritzelGroup' }),
      });
      const setData = jest.fn();

      mockCore.store.selectionGroup = { objects: [group] };

      manager.copy({ clipboardData: { setData } } as any);

      const [, serialized] = setData.mock.calls[0];
      const payload = JSON.parse(serialized.slice(PAYLOAD_PREFIX.length));
      expect(payload.objects[0].__children__).toHaveLength(1);
      expect(payload.objects[0].__children__[0].id).toBe('child');
    });

    it('is a no-op when there is no selection', () => {
      const setData = jest.fn();
      mockCore.store.selectionGroup = null;

      manager.copy({ clipboardData: { setData } } as any);

      expect(setData).not.toHaveBeenCalled();
    });

    it('mirrors the copied payload into the in-memory session buffer', () => {
      const obj = { id: 'a', zIndex: 1, serialize: jest.fn().mockReturnValue({ id: 'a', __class__: 'KritzelShape' }) } as any;
      mockCore.store.selectionGroup = { objects: [obj] };

      manager.copy({ clipboardData: { setData: jest.fn() } } as any);

      expect(manager.sessionClipboardPayload).not.toBeNull();
      expect(manager.sessionClipboardPayload?.objects.map(o => o.id)).toEqual(['a']);
    });
  });

  describe('cut', () => {
    it('is a no-op when there is no selection', () => {
      mockCore.store.selectionGroup = null;

      manager.cut();

      expect(mockCore.delete).not.toHaveBeenCalled();
    });

    it('copies then deletes selected objects', () => {
      const setData = jest.fn();
      const obj = { id: 'obj-1', zIndex: 2, serialize: jest.fn().mockReturnValue({ id: 'obj-1', __class__: 'KritzelShape' }) } as any;
      mockCore.store.selectionGroup = { objects: [obj] };

      manager.cut({ clipboardData: { setData } } as any);

      expect(setData).toHaveBeenCalledTimes(1);
      expect(mockCore.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('paste', () => {
    const PAYLOAD_PREFIX = 'kritzel-clipboard/v1:';

    /** Fake revived object; gets the prototype of the class named by `__class__` (if any) so `instanceof` checks match. */
    const makeRevived = (overrides: Record<string, any> = {}): any => {
      const cls = PROTOTYPES_BY_CLASS[overrides.__class__];
      const fields = {
        id: 'revived-1',
        zIndex: 1,
        workspaceId: 'workspace-1',
        translateX: 100,
        translateY: 200,
        rotation: 0,
        isMounted: true,
        generateId: jest.fn().mockReturnValue('fresh-1'),
        updatePosition: jest.fn(),
        ...overrides,
      };
      return cls ? withPrototype(cls, fields) : fields;
    };

    const makeSelectionGroup = (): any => ({
      addOrRemove: jest.fn(),
      updatePosition: jest.fn(),
      centerInViewport: jest.fn(),
      refreshObjectDimensions: jest.fn(),
      isSelected: false,
      rotation: 0,
    });

    beforeEach(() => {
      jest.spyOn(globalThis as any, 'requestAnimationFrame').mockImplementation((cb: any) => {
        cb(0);
        return 0;
      });
      Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    });

    const setClipboardText = (text: string): void => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          read: jest.fn().mockResolvedValue([]),
          readText: jest.fn().mockResolvedValue(text),
        },
        configurable: true,
      });
    };

    it('is a no-op when there is no pasteable content', async () => {
      await manager.paste();

      expect(mockCore.removeSelectionGroup).not.toHaveBeenCalled();
      expect(mockCore.addObject).not.toHaveBeenCalled();
      expect(mockCore.engine.emitObjectsChange).not.toHaveBeenCalled();
    });

    it('is a no-op when there is no active workspace', async () => {
      mockCore.store.state.activeWorkspace = null;
      jest.spyOn(KritzelReviver.prototype, 'revive').mockReturnValue(makeRevived());

      await manager.paste(undefined, undefined);

      expect(mockCore.removeSelectionGroup).not.toHaveBeenCalled();
      expect(mockCore.addObject).not.toHaveBeenCalled();
      expect(mockCore.engine.emitObjectsChange).not.toHaveBeenCalled();
    });

    it('revives, regenerates ids and inserts objects from a DOM clipboard payload', async () => {
      const revived = makeRevived();
      jest.spyOn(KritzelReviver.prototype, 'revive').mockReturnValue(revived);

      const selectionGroup = makeSelectionGroup();
      (KritzelSelectionGroup.create as jest.Mock).mockReturnValue(selectionGroup);

      setClipboardText(`${PAYLOAD_PREFIX}${JSON.stringify({ version: 1, objects: [{ id: 'x', __class__: 'KritzelShape' }] })}`);

      await manager.paste(undefined, undefined);

      // Fresh id assigned, original detached
      expect(revived.generateId).toHaveBeenCalledTimes(1);
      expect(revived.id).toBe('fresh-1');
      expect(revived.isMounted).toBe(false);
      // Same-workspace paste offsets by 25 / scale
      expect(revived.updatePosition).toHaveBeenCalledWith(125, 225);
      expect(mockCore.addObject).toHaveBeenCalledWith(revived);
      expect(selectionGroup.addOrRemove).toHaveBeenCalledWith(revived);
      expect(mockCore.engine.emitObjectsAdded).toHaveBeenCalledWith([revived]);
      expect(mockCore.anchorManager.rebuildIndex).toHaveBeenCalledTimes(1);
      expect(mockCore.addSelectionGroup).toHaveBeenCalledWith(selectionGroup);
      expect(mockCore.store.setState).toHaveBeenCalledWith('activeTool', { name: 'selection' });
      expect(mockCore.engine.emitObjectsChange).toHaveBeenCalledTimes(2);
      expect(mockCore.rerender).toHaveBeenCalledTimes(2);
      expect(mockCore.store.state.isSelecting).toBe(false);
    });

    it('drops anchors to external objects when pasting a line-only clipboard payload', async () => {
      const revivedLine = makeRevived({
        __class__: 'KritzelLine',
        id: 'line-1',
        startAnchor: { objectId: 'external-shape' },
        endAnchor: { objectId: 'external-shape-2' },
        generateId: jest.fn().mockReturnValue('fresh-line-1'),
      });

      jest.spyOn(KritzelReviver.prototype, 'revive').mockReturnValue(revivedLine);
      (KritzelSelectionGroup.create as jest.Mock).mockReturnValue(makeSelectionGroup());

      setClipboardText(`${PAYLOAD_PREFIX}${JSON.stringify({ version: 1, objects: [{ id: 'line-1', __class__: 'KritzelLine' }] })}`);

      await manager.paste(undefined, undefined);

      expect(revivedLine.startAnchor).toBeUndefined();
      expect(revivedLine.endAnchor).toBeUndefined();
    });

    it('remaps anchors between copied lines when pasting a line-only clipboard payload', async () => {
      const firstLine = makeRevived({
        __class__: 'KritzelLine',
        id: 'line-1',
        endAnchor: { objectId: 'line-2' },
        generateId: jest.fn().mockReturnValue('fresh-line-1'),
      });
      const secondLine = makeRevived({
        __class__: 'KritzelLine',
        id: 'line-2',
        generateId: jest.fn().mockReturnValue('fresh-line-2'),
      });

      jest.spyOn(KritzelReviver.prototype, 'revive').mockReturnValueOnce(firstLine).mockReturnValueOnce(secondLine);
      (KritzelSelectionGroup.create as jest.Mock).mockReturnValue(makeSelectionGroup());

      setClipboardText(
        `${PAYLOAD_PREFIX}${JSON.stringify({ version: 1, objects: [{ id: 'line-1', __class__: 'KritzelLine' }, { id: 'line-2', __class__: 'KritzelLine' }] })}`,
      );

      await manager.paste(undefined, undefined);

      expect(firstLine.endAnchor).toEqual({ objectId: 'fresh-line-2' });
    });

    it('reads the async Clipboard API when no DOM event is provided', async () => {
      const revived = makeRevived();
      jest.spyOn(KritzelReviver.prototype, 'revive').mockReturnValue(revived);
      (KritzelSelectionGroup.create as jest.Mock).mockReturnValue(makeSelectionGroup());

      Object.defineProperty(navigator, 'clipboard', {
        value: {
          read: jest.fn().mockResolvedValue([]),
          readText: jest.fn().mockResolvedValue(`${PAYLOAD_PREFIX}${JSON.stringify({ version: 1, objects: [{ id: 'x', __class__: 'KritzelShape' }] })}`),
        },
        configurable: true,
      });

      await manager.paste();

      expect(mockCore.permissionManager.checkPermission).toHaveBeenCalledWith('clipboard-read');
      expect(mockCore.permissionManager.requestPermission).not.toHaveBeenCalled();
      expect(navigator.clipboard.readText).toHaveBeenCalledTimes(1);
      expect(mockCore.addObject).toHaveBeenCalledWith(revived);
    });

    it('requests clipboard-read permission when the current state is not yet granted', async () => {
      const revived = makeRevived();
      jest.spyOn(KritzelReviver.prototype, 'revive').mockReturnValue(revived);
      (KritzelSelectionGroup.create as jest.Mock).mockReturnValue(makeSelectionGroup());

      mockCore.permissionManager.checkPermission.mockResolvedValueOnce('prompt');
      mockCore.permissionManager.requestPermission.mockResolvedValueOnce('granted');

      Object.defineProperty(navigator, 'clipboard', {
        value: {
          read: jest.fn().mockResolvedValue([]),
          readText: jest.fn().mockResolvedValue(`${PAYLOAD_PREFIX}${JSON.stringify({ version: 1, objects: [{ id: 'x', __class__: 'KritzelShape' }] })}`),
        },
        configurable: true,
      });

      await manager.paste();

      expect(mockCore.permissionManager.checkPermission).toHaveBeenCalledWith('clipboard-read');
      expect(mockCore.permissionManager.requestPermission).toHaveBeenCalledWith('clipboard-read');
      expect(mockCore.addObject).toHaveBeenCalledWith(revived);
    });

    it('pastes image files from a native clipboard event', async () => {
      const imageFile = new File(['image'], 'pasted.png', { type: 'image/png' });
      const compressedFile = new File(['compressed'], 'pasted-compressed.png', { type: 'image/png' });
      const imageObject = makeRevived();

      (imageCompression as unknown as jest.Mock).mockResolvedValue(compressedFile);
      jest.spyOn(KritzelImage, 'fromBlob').mockResolvedValue(imageObject);
      (KritzelSelectionGroup.create as jest.Mock).mockReturnValue(makeSelectionGroup());

      await manager.paste(undefined, undefined, {
        clipboardData: {
          files: [imageFile],
          types: [],
          getData: jest.fn(),
        },
      } as any);

      expect(imageCompression).toHaveBeenCalledWith(imageFile, { maxWidthOrHeight: 1200 });
      expect(KritzelImage.fromBlob).toHaveBeenCalledWith(mockCore, compressedFile, { translateX: 0, translateY: 0 });
      expect(mockCore.permissionManager.checkPermission).not.toHaveBeenCalled();
      expect(mockCore.addObject).toHaveBeenCalledWith(imageObject);
    });

    it('pastes GIF files without compression', async () => {
      const gifFile = new File(['gif-data'], 'animated.gif', { type: 'image/gif' });
      const imageObject = makeRevived();

      jest.spyOn(KritzelImage, 'fromBlob').mockResolvedValue(imageObject);
      (KritzelSelectionGroup.create as jest.Mock).mockReturnValue(makeSelectionGroup());

      await manager.paste(undefined, undefined, {
        clipboardData: {
          files: [gifFile],
          types: [],
          getData: jest.fn(),
        },
      } as any);

      expect(imageCompression).not.toHaveBeenCalled();
      expect(KritzelImage.fromBlob).toHaveBeenCalledWith(mockCore, gifFile, { translateX: 0, translateY: 0 });
      expect(mockCore.addObject).toHaveBeenCalledWith(imageObject);
    });

    it('keeps an explicit paste position', async () => {
      const revived = makeRevived();
      jest.spyOn(KritzelReviver.prototype, 'revive').mockReturnValue(revived);
      const selectionGroup = makeSelectionGroup();
      (KritzelSelectionGroup.create as jest.Mock).mockReturnValue(selectionGroup);

      setClipboardText(`${PAYLOAD_PREFIX}${JSON.stringify({ version: 1, objects: [{ id: 'x', __class__: 'KritzelShape' }] })}`);

      await manager.paste(300, 400);

      expect(revived.updatePosition).toHaveBeenCalledWith(300, 400);
      expect(selectionGroup.centerInViewport).not.toHaveBeenCalled();
    });

    it('cascades successive same-content pastes', async () => {
      (KritzelSelectionGroup.create as jest.Mock).mockImplementation(() => makeSelectionGroup());

      const first = makeRevived();
      const second = makeRevived();
      jest.spyOn(KritzelReviver.prototype, 'revive').mockReturnValueOnce(first).mockReturnValueOnce(second);

      setClipboardText(`${PAYLOAD_PREFIX}${JSON.stringify({ version: 1, objects: [{ id: 'x', __class__: 'KritzelShape' }] })}`);

      await manager.paste(undefined, undefined);
      await manager.paste(undefined, undefined);

      expect(first.updatePosition).toHaveBeenCalledWith(125, 225);
      expect(second.updatePosition).toHaveBeenCalledWith(150, 250);
    });

    describe('zIndex allocation', () => {
      /** A copied object with its copied zIndex; entries with children are groups. */
      type PasteEntry = { id: string; zIndex: number; children?: PasteEntry[] };

      /** zIndex of every object at the moment it was inserted, keyed by id. */
      let inserted: Record<string, number>;

      beforeEach(() => {
        inserted = {};
        mockCore.addObject.mockImplementation((object: any) => (inserted[object.id] = object.zIndex));
          (KritzelSelectionGroup.create as jest.Mock).mockReturnValue(makeSelectionGroup());
      });

      /** Puts the entries on the clipboard and lets the reviver return a matching object (keeping its id) per entry. */
      const setClipboardObjects = (entries: PasteEntry[]): void => {
        const revivedById: Record<string, any> = {};
        const serialize = (entry: PasteEntry): Record<string, any> => {
          const __class__ = entry.children ? 'KritzelGroup' : 'KritzelShape';
          revivedById[entry.id] = makeRevived({
            __class__,
            id: entry.id,
            zIndex: entry.zIndex,
            generateId: jest.fn().mockReturnValue(entry.id),
            ...(entry.children ? { childIds: [], _pendingChildren: [], finalize: jest.fn() } : {}),
          });
          return { id: entry.id, __class__, ...(entry.children ? { __children__: entry.children.map(serialize) } : {}) };
        };
        const objects = entries.map(serialize);

        jest.spyOn(KritzelReviver.prototype, 'revive').mockImplementation((data: any) => revivedById[data.id]);
        setClipboardText(`${PAYLOAD_PREFIX}${JSON.stringify({ version: 1, objects })}`);
      };

      it('stacks a group as one contiguous band ordered by the copied zIndex of its children', async () => {
        setClipboardObjects([
          {
            id: 'g',
            zIndex: 5,
            children: [
              { id: 'c1', zIndex: 5 },
              { id: 'c2', zIndex: 3 },
            ],
          },
          { id: 'x', zIndex: 9 },
        ]);

        await manager.paste();

        // The group takes its top child's value; the next top-level object lands above the group.
        expect(inserted).toEqual({ c2: 10, c1: 11, g: 11, x: 12 });
      });

      it('ranks a legacy group by where its members are, not by its own zIndex', async () => {
        setClipboardObjects([
          { id: 'x', zIndex: 3 },
          {
            id: 'g',
            zIndex: 4,
            children: [
              { id: 'a', zIndex: 1 },
              { id: 'b', zIndex: 2 },
            ],
          },
        ]);

        await manager.paste();

        expect(inserted).toEqual({ a: 10, b: 11, g: 11, x: 12 });
      });

      it('gives plain objects consecutive values from currentZIndex in their stacking order', async () => {
        setClipboardObjects([
          { id: 'a', zIndex: 2 },
          { id: 'b', zIndex: 5 },
          { id: 'c', zIndex: 9 },
        ]);

        await manager.paste();

        expect(inserted).toEqual({ a: 10, b: 11, c: 12 });
      });

      it('keeps the paste order for objects that share a zIndex', async () => {
        const first = new File(['first'], 'first.gif', { type: 'image/gif' });
        const second = new File(['second'], 'second.gif', { type: 'image/gif' });
        // Freshly created images all start at the same zIndex.
        const images = new Map([
          [first, makeRevived({ id: 'img-1', zIndex: 10 })],
          [second, makeRevived({ id: 'img-2', zIndex: 10 })],
        ]);
        jest.spyOn(KritzelImage, 'fromBlob').mockImplementation(async (_core: any, file: any) => images.get(file));

        await manager.paste(undefined, undefined, {
          clipboardData: {
            files: [first, second],
            types: [],
            getData: jest.fn(),
          },
        } as any);

        expect(inserted).toEqual({ 'img-1': 10, 'img-2': 11 });
      });

      it('gives a nested group a contiguous band inside its parent band', async () => {
        setClipboardObjects([
          {
            id: 'g',
            zIndex: 4,
            children: [
              { id: 'd', zIndex: 4 },
              {
                id: 'inner',
                zIndex: 3,
                children: [
                  { id: 'c', zIndex: 3 },
                  { id: 'b', zIndex: 2 },
                ],
              },
              { id: 'a', zIndex: 1 },
            ],
          },
          { id: 'x', zIndex: 5 },
        ]);

        await manager.paste();

        expect(inserted).toEqual({ a: 10, b: 11, c: 12, inner: 12, d: 13, g: 13, x: 14 });
      });
    });
  });
});
