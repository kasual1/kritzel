import { KritzelClipboardManager } from './clipboard.manager';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelClassHelper } from '../../helpers/class.helper';
import { KritzelReviver } from '../core/reviver.class';

jest.mock('../objects/selection-group.class', () => ({
  KritzelSelectionGroup: {
    create: jest.fn(),
  },
}));

jest.mock('../../helpers/class.helper', () => ({
  KritzelClassHelper: {
    isInstanceOf: jest.fn().mockReturnValue(false),
  },
}));

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
      const group = {
        id: 'group',
        zIndex: 1,
        children: [child],
        serialize: jest.fn().mockReturnValue({ id: 'group', __class__: 'KritzelGroup' }),
      } as any;
      const setData = jest.fn();

      mockCore.store.selectionGroup = { objects: [group] };
      (KritzelClassHelper.isInstanceOf as unknown as jest.Mock).mockImplementation((obj: any, name: string) => name === 'KritzelGroup' && obj.id === 'group');

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

    const makeRevived = (overrides: Record<string, any> = {}): any => ({
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
    });

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
  });
});
