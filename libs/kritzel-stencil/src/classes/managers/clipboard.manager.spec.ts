import { KritzelClipboardManager } from './clipboard.manager';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelClassHelper } from '../../helpers/class.helper';

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
    it('is a no-op when clipboard is empty', () => {
      mockCore.store.state.copiedObjects = null;

      manager.paste();

      expect(mockCore.removeSelectionGroup).not.toHaveBeenCalled();
      expect(mockCore.addObject).not.toHaveBeenCalled();
      expect(mockCore.engine.emitObjectsChange).not.toHaveBeenCalled();
    });

    it('is a no-op when there is no active workspace', () => {
      mockCore.store.state.copiedObjects = [{ id: 'copy', translateX: 0, translateY: 0 }];
      mockCore.store.state.activeWorkspace = null;

      manager.paste();

      expect(mockCore.removeSelectionGroup).not.toHaveBeenCalled();
      expect(mockCore.addObject).not.toHaveBeenCalled();
      expect(mockCore.engine.emitObjectsChange).not.toHaveBeenCalled();
    });

    it('pastes copied objects and finalizes selection flow', () => {
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

      manager.paste();

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
