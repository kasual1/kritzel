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
          copiedObjects: null,
          copiedObjectIdMapping: null,
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
    };

    manager = new KritzelClipboardManager(mockCore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('copy', () => {
    it('copies selected objects sorted by zIndex and stores id mapping', () => {
      const copiedA = { id: 'copy-a' };
      const copiedB = { id: 'copy-b' };
      const objA = { id: 'a', zIndex: 5, copy: jest.fn().mockReturnValue(copiedA) } as any;
      const objB = { id: 'b', zIndex: 1, copy: jest.fn().mockReturnValue(copiedB) } as any;

      mockCore.store.selectionGroup = { objects: [objA, objB] };

      manager.copy();

      expect(objB.copy).toHaveBeenCalledTimes(1);
      expect(objA.copy).toHaveBeenCalledTimes(1);
      expect(mockCore.store.state.copiedObjects).toEqual([copiedB, copiedA]);
      expect(mockCore.store.state.copiedObjectIdMapping).toBeInstanceOf(Map);
      expect(mockCore.store.state.copiedObjectIdMapping.get('copy-b')).toBe('b');
      expect(mockCore.store.state.copiedObjectIdMapping.get('copy-a')).toBe('a');
    });

    it('writes a browser clipboard payload when the DOM event is available', () => {
      const copiedObject = {
        id: 'copy-a',
        serialize: jest.fn().mockReturnValue({ id: 'copy-a', __class__: 'KritzelShape' }),
      } as any;
      const obj = { id: 'a', zIndex: 1, copy: jest.fn().mockReturnValue(copiedObject) } as any;
      const setData = jest.fn();

      mockCore.store.selectionGroup = { objects: [obj] };

      manager.copy({ clipboardData: { setData } } as any);

      expect(setData).toHaveBeenCalledTimes(1);
      expect(setData).toHaveBeenCalledWith('text/plain', expect.stringContaining('kritzel-clipboard/v1:'));
    });

    it('is a no-op when there is no selection', () => {
      mockCore.store.selectionGroup = null;

      manager.copy();

      expect(mockCore.store.state.copiedObjects).toBeNull();
      expect(mockCore.store.state.copiedObjectIdMapping).toBeNull();
    });
  });

  describe('cut', () => {
    it('is a no-op when there is no selection', () => {
      mockCore.store.selectionGroup = null;

      manager.cut();

      expect(mockCore.delete).not.toHaveBeenCalled();
      expect(mockCore.store.state.copiedObjects).toBeNull();
    });

    it('copies then deletes selected objects', () => {
      const copied = { id: 'copy-1' };
      const obj = { id: 'obj-1', zIndex: 2, copy: jest.fn().mockReturnValue(copied) } as any;
      mockCore.store.selectionGroup = { objects: [obj] };

      manager.cut();

      expect(obj.copy).toHaveBeenCalledTimes(1);
      expect(mockCore.delete).toHaveBeenCalledTimes(1);
      expect(mockCore.store.state.copiedObjects).toEqual([copied]);
    });
  });

  describe('paste', () => {
    it('is a no-op when clipboard is empty', async () => {
      mockCore.store.state.copiedObjects = null;

      await manager.paste();

      expect(mockCore.removeSelectionGroup).not.toHaveBeenCalled();
      expect(mockCore.addObject).not.toHaveBeenCalled();
      expect(mockCore.engine.emitObjectsChange).not.toHaveBeenCalled();
    });

    it('is a no-op when there is no active workspace', async () => {
      mockCore.store.state.copiedObjects = [{ id: 'copy', translateX: 0, translateY: 0 }];
      mockCore.store.state.activeWorkspace = null;

      await manager.paste();

      expect(mockCore.removeSelectionGroup).not.toHaveBeenCalled();
      expect(mockCore.addObject).not.toHaveBeenCalled();
      expect(mockCore.engine.emitObjectsChange).not.toHaveBeenCalled();
    });

    it('pastes copied objects and finalizes selection flow', async () => {
      const copiedObject = {
        id: 'copy-1',
        zIndex: 1,
        workspaceId: 'workspace-1',
        translateX: 100,
        translateY: 200,
        rotation: 0,
        updatePosition: jest.fn(),
        copy: jest.fn().mockReturnValue({ id: 'copy-next' }),
      } as any;

      mockCore.store.state.copiedObjects = [copiedObject];
      mockCore.store.state.copiedObjectIdMapping = new Map([['copy-1', 'original-1']]);

      const createdSelectionGroup = {
        addOrRemove: jest.fn(),
        updatePosition: jest.fn(),
        centerInViewport: jest.fn(),
        isSelected: false,
        rotation: 0,
      } as any;

      (KritzelSelectionGroup.create as jest.Mock).mockReturnValue(createdSelectionGroup);
      (KritzelClassHelper.isInstanceOf as unknown as jest.Mock).mockReturnValue(false);

      await manager.paste();

      expect(mockCore.removeSelectionGroup).toHaveBeenCalledTimes(1);
      expect(mockCore.removeSelectionBox).toHaveBeenCalledTimes(1);
      expect(mockCore.store.objects.transaction).toHaveBeenCalledTimes(1);
      expect(copiedObject.updatePosition).toHaveBeenCalledWith(125, 225);
      expect(mockCore.addObject).toHaveBeenCalledWith(copiedObject);
      expect(createdSelectionGroup.addOrRemove).toHaveBeenCalledWith(copiedObject);
      expect(mockCore.engine.emitObjectsAdded).toHaveBeenCalledWith([copiedObject]);
      expect(mockCore.anchorManager.rebuildIndex).toHaveBeenCalledTimes(1);
      expect(mockCore.addSelectionGroup).toHaveBeenCalledWith(createdSelectionGroup);
      expect(mockCore.engine.viewport.bringIntoViewIfNeeded).toHaveBeenCalledWith(createdSelectionGroup);
      expect(mockCore.store.setState).toHaveBeenCalledWith('activeTool', { name: 'selection' });
      expect(mockCore.engine.emitObjectsChange).toHaveBeenCalledTimes(1);
      expect(mockCore.rerender).toHaveBeenCalledTimes(1);
      expect(mockCore.store.state.isSelecting).toBe(false);
    });

    it('prefers a browser clipboard payload over the local clipboard state', async () => {
      const browserObject = {
        id: 'browser-copy-1',
        zIndex: 1,
        workspaceId: 'workspace-1',
        translateX: 50,
        translateY: 60,
        rotation: 0,
        updatePosition: jest.fn(),
        copy: jest.fn().mockReturnValue({ id: 'browser-copy-next' }),
      } as any;

      mockCore.store.state.copiedObjects = [{ id: 'local-copy-1', translateX: 10, translateY: 20 }] as any;
      mockCore.store.state.copiedObjectIdMapping = new Map([['local-copy-1', 'local-original-1']]);

      const createdSelectionGroup = {
        addOrRemove: jest.fn(),
        updatePosition: jest.fn(),
        centerInViewport: jest.fn(),
        isSelected: false,
        rotation: 0,
      } as any;

      (KritzelSelectionGroup.create as jest.Mock).mockReturnValue(createdSelectionGroup);
      (KritzelClassHelper.isInstanceOf as unknown as jest.Mock).mockReturnValue(false);
      jest.spyOn(KritzelReviver.prototype, 'revive').mockReturnValue(browserObject);

      const event = {
        clipboardData: {
          getData: jest.fn().mockReturnValue('kritzel-clipboard/v1:{"version":1,"copiedObjectIdMapping":[["browser-copy-1","browser-original-1"]],"objects":[{"id":"browser-copy-1"}]}'),
        },
      } as any;

      await manager.paste(undefined, undefined, event);

      expect(browserObject.updatePosition).toHaveBeenCalledWith(75, 85);
      expect(mockCore.addObject).toHaveBeenCalledWith(browserObject);
      expect(createdSelectionGroup.addOrRemove).toHaveBeenCalledWith(browserObject);
    });

    it('refreshes the browser clipboard after paste so the next paste uses the new selection', async () => {
      const refreshedCopiedObject = {
        id: 'browser-copy-next',
        serialize: jest.fn().mockReturnValue({ id: 'browser-copy-next', __class__: 'KritzelShape' }),
      } as any;

      const firstBrowserObject = {
        id: 'browser-copy-1',
        zIndex: 1,
        workspaceId: 'workspace-1',
        translateX: 50,
        translateY: 60,
        rotation: 0,
        updatePosition: jest.fn(),
        copy: jest.fn().mockReturnValue(refreshedCopiedObject),
      } as any;

      const secondBrowserObject = {
        id: 'browser-copy-next',
        zIndex: 1,
        workspaceId: 'workspace-1',
        translateX: 75,
        translateY: 85,
        rotation: 0,
        updatePosition: jest.fn(),
        copy: jest.fn().mockReturnValue({
          id: 'browser-copy-next-next',
          serialize: jest.fn().mockReturnValue({ id: 'browser-copy-next-next', __class__: 'KritzelShape' }),
        }),
      } as any;

      const createdSelectionGroup = {
        addOrRemove: jest.fn(),
        updatePosition: jest.fn(),
        centerInViewport: jest.fn(),
        isSelected: false,
        rotation: 0,
      } as any;

      const clipboard = {
        readText: jest
          .fn()
          .mockResolvedValueOnce('kritzel-clipboard/v1:{"version":1,"copiedObjectIdMapping":[["browser-copy-1","browser-original-1"]],"objects":[{"id":"browser-copy-1"}]}')
          .mockResolvedValueOnce('kritzel-clipboard/v1:{"version":1,"copiedObjectIdMapping":[["browser-copy-next","browser-copy-1"]],"objects":[{"id":"browser-copy-next"}]}'),
        writeText: jest.fn(),
      };

      Object.defineProperty(navigator, 'clipboard', {
        value: clipboard,
        configurable: true,
      });

      jest.spyOn(globalThis as any, 'requestAnimationFrame').mockImplementation((callback: any) => {
        callback(0);
        return 0;
      });

      (KritzelSelectionGroup.create as jest.Mock).mockReturnValue(createdSelectionGroup);
      (KritzelClassHelper.isInstanceOf as unknown as jest.Mock).mockReturnValue(false);
      jest.spyOn(KritzelReviver.prototype, 'revive').mockImplementation((obj: any) => {
        if (obj.id === 'browser-copy-next') {
          return secondBrowserObject;
        }

        return firstBrowserObject;
      });

      mockCore.store.state.copiedObjects = [{ id: 'local-copy-1', translateX: 10, translateY: 20 }] as any;
      mockCore.store.state.copiedObjectIdMapping = new Map([['local-copy-1', 'local-original-1']]);

      await manager.paste();
      await manager.paste();

      expect(firstBrowserObject.updatePosition).toHaveBeenCalledWith(75, 85);
      expect(secondBrowserObject.updatePosition).toHaveBeenCalledWith(100, 110);
      expect(mockCore.addObject).toHaveBeenCalledWith(firstBrowserObject);
      expect(mockCore.addObject).toHaveBeenCalledWith(secondBrowserObject);
    });
  });

  describe('clipboard state helpers', () => {
    it('getCopiedObjects returns an empty array when state is empty', () => {
      mockCore.store.state.copiedObjects = null;

      expect(manager.getCopiedObjects()).toEqual([]);
    });

    it('clear resets clipboard state', () => {
      mockCore.store.state.copiedObjects = [{ id: 'copy-1' }];
      mockCore.store.state.copiedObjectIdMapping = new Map([['copy-1', 'obj-1']]);

      manager.clear();

      expect(mockCore.store.state.copiedObjects).toBeNull();
      expect(mockCore.store.state.copiedObjectIdMapping).toBeNull();
    });

    it('destroy clears clipboard state', () => {
      mockCore.store.state.copiedObjects = [{ id: 'copy-1' }];
      mockCore.store.state.copiedObjectIdMapping = new Map([['copy-1', 'obj-1']]);

      manager.destroy();

      expect(mockCore.store.state.copiedObjects).toBeNull();
      expect(mockCore.store.state.copiedObjectIdMapping).toBeNull();
    });
  });
});
