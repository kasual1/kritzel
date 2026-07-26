import { KritzelContextMenuHandler } from './context-menu.handler';
import { KritzelCore } from '../core/core.class';
import { KritzelSelectionTool } from '../tools/selection-tool.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelSelectionBox } from '../objects/selection-box.class';

jest.mock('../objects/selection-group.class');

describe('KritzelContextMenuHandler', () => {
  let contextMenuHandler: KritzelContextMenuHandler;
  let mockCore: jest.Mocked<KritzelCore>;
  let mockSelectionTool: jest.Mocked<KritzelSelectionTool>;
  let mockSelectionGroup: {
    addOrRemove: jest.Mock;
    isSelected: boolean;
    rotation: number;
    objects: unknown[];
  } | null;
  let globalContextMenuItems: unknown[];
  let objectContextMenuItems: unknown[];
  let mockState: {
    activeTool: unknown;
    skipContextMenu: boolean;
    isSelecting: boolean;
    contextMenuItems: unknown[];
    contextMenuX: number;
    contextMenuY: number;
    contextMenuWorldX: number;
    contextMenuWorldY: number;
    translateX: number;
    translateY: number;
    scale: number;
    isContextMenuVisible: boolean;
    isEnabled: boolean;
    viewportWidth: number;
    viewportHeight: number;
    objects: { remove: jest.Mock };
  };

  const createPointerEvent = (
    options: {
      clientX?: number;
      clientY?: number;
    } = {},
  ): PointerEvent => {
    return {
      clientX: options.clientX ?? 100,
      clientY: options.clientY ?? 100,
      type: 'contextmenu',
    } as PointerEvent;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    globalContextMenuItems = [{ label: 'Paste' }, { label: 'Select All' }];
    objectContextMenuItems = [{ label: 'Copy' }, { label: 'Delete' }];

    mockSelectionGroup = null;

    mockSelectionTool = {
      toolType: 'selection',
      moveHandler: {
        cancelPendingDrag: jest.fn(),
      },
    } as unknown as jest.Mocked<KritzelSelectionTool>;

    // Make mockSelectionTool an instance of KritzelSelectionTool
    Object.setPrototypeOf(mockSelectionTool, KritzelSelectionTool.prototype);

    mockState = {
      activeTool: mockSelectionTool,
      skipContextMenu: false,
      isSelecting: false,
      contextMenuItems: [],
      contextMenuX: 0,
      contextMenuY: 0,
      contextMenuWorldX: 0,
      contextMenuWorldY: 0,
      translateX: 0,
      translateY: 0,
      scale: 1,
      isContextMenuVisible: false,
      isEnabled: true,
      viewportWidth: 1024,
      viewportHeight: 768,
      objects: { remove: jest.fn() },
    };

    mockCore = {
      store: {
        get state() {
          return mockState;
        },
        get objects() {
          return mockState.objects;
        },
        get selectionGroup() {
          return mockSelectionGroup;
        },
        get selectionBox() {
          return null;
        },
        setSelectionBox: jest.fn(),
        offsetX: 0,
        offsetY: 0,
      },
      getObjectFromPointerEvent: jest.fn().mockReturnValue(null),
      removeSelectionGroup: jest.fn(),
      addSelectionGroup: jest.fn(),
      rerender: jest.fn(),
      localizationManager: {
        translate: jest.fn((key: string) => key),
      },
    } as unknown as jest.Mocked<KritzelCore>;

    (KritzelSelectionGroup.create as jest.Mock).mockImplementation(() => {
      const group = {
        addOrRemove: jest.fn(),
        isSelected: false,
        rotation: 0,
        objects: [],
      };
      return group;
    });

    contextMenuHandler = new KritzelContextMenuHandler(mockCore, globalContextMenuItems, objectContextMenuItems);
  });

  describe('constructor', () => {
    it('should store global context menu items', () => {
      expect(contextMenuHandler.globalContextMenuItems).toBe(globalContextMenuItems);
    });

    it('should store object context menu items', () => {
      expect(contextMenuHandler.objectContextMenuItems).toBe(objectContextMenuItems);
    });
  });

  describe('handleContextMenu', () => {
    describe('tool validation', () => {
      it('should return early if active tool is not selection tool', () => {
        mockState.activeTool = { name: 'other-tool' };

        const event = createPointerEvent();

        contextMenuHandler.handleContextMenu(event);

        expect(mockCore.rerender).not.toHaveBeenCalled();
        expect(mockState.isContextMenuVisible).toBe(false);
      });

      it('should proceed when active tool is selection tool', () => {
        const event = createPointerEvent();

        contextMenuHandler.handleContextMenu(event);

        expect(mockState.isContextMenuVisible).toBe(true);
      });
    });

    describe('skip context menu flag', () => {
      it('should return early and reset flag when skipContextMenu is true', () => {
        mockState.skipContextMenu = true;

        const event = createPointerEvent();

        contextMenuHandler.handleContextMenu(event);

        expect(mockState.skipContextMenu).toBe(false);
        expect(mockState.isContextMenuVisible).toBe(false);
        expect(mockCore.rerender).not.toHaveBeenCalled();
      });

      it('should proceed when skipContextMenu is false', () => {
        mockState.skipContextMenu = false;

        const event = createPointerEvent();

        contextMenuHandler.handleContextMenu(event);

        expect(mockState.isContextMenuVisible).toBe(true);
      });
    });

    describe('pending drag cancellation', () => {
      it('should cancel pending drag on move handler', () => {
        const event = createPointerEvent();

        contextMenuHandler.handleContextMenu(event);

        expect(mockSelectionTool.moveHandler.cancelPendingDrag).toHaveBeenCalled();
      });

      it('should handle missing move handler gracefully', () => {
        mockSelectionTool.moveHandler = undefined as any;

        const event = createPointerEvent();

        expect(() => contextMenuHandler.handleContextMenu(event)).not.toThrow();
      });
    });

    describe('selection box cleanup', () => {
      it('should remove selection box if present', () => {
        const mockSelectionBox = { id: 'selection-box' };
        Object.setPrototypeOf(mockSelectionBox, KritzelSelectionBox.prototype);

        Object.defineProperty(mockCore.store, 'selectionBox', {
          get: () => mockSelectionBox,
          configurable: true,
        });

        const event = createPointerEvent();

        contextMenuHandler.handleContextMenu(event);

        expect(mockState.objects.remove).toHaveBeenCalled();
        expect(mockCore.store.setSelectionBox).toHaveBeenCalledWith(null);
        expect(mockState.isSelecting).toBe(false);
      });

      it('should not remove selection box if not present', () => {
        Object.defineProperty(mockCore.store, 'selectionBox', {
          get: () => null,
          configurable: true,
        });

        const event = createPointerEvent();

        contextMenuHandler.handleContextMenu(event);

        expect(mockState.objects.remove).not.toHaveBeenCalled();
        expect(mockCore.store.setSelectionBox).not.toHaveBeenCalled();
      });
    });

    describe('object selection', () => {
      it('should create selection group when clicking on object', () => {
        const mockObject = { id: 'obj-1', rotation: 0.5 };

        (mockCore.getObjectFromPointerEvent as jest.Mock).mockReturnValue(mockObject);

        const event = createPointerEvent();

        contextMenuHandler.handleContextMenu(event);

        expect(KritzelSelectionGroup.create).toHaveBeenCalledWith(mockCore);
        expect(mockCore.addSelectionGroup).toHaveBeenCalled();
      });

      it('should add object to selection group and set rotation', () => {
        const mockObject = { id: 'obj-1', rotation: 0.75 };
        const createdGroup = {
          addOrRemove: jest.fn(),
          isSelected: false,
          rotation: 0,
          objects: [],
        };

        (KritzelSelectionGroup.create as jest.Mock).mockReturnValue(createdGroup);
        (mockCore.getObjectFromPointerEvent as jest.Mock).mockReturnValue(mockObject);

        const event = createPointerEvent();

        contextMenuHandler.handleContextMenu(event);

        expect(createdGroup.addOrRemove).toHaveBeenCalledWith(mockObject);
        expect(createdGroup.isSelected).toBe(true);
        expect(createdGroup.rotation).toBe(0.75);
      });

      it('should remove existing selection group before adding new one', () => {
        const mockObject = { id: 'obj-1', rotation: 0 };
        mockSelectionGroup = {
          addOrRemove: jest.fn(),
          isSelected: true,
          rotation: 0,
          objects: [{ id: 'old-obj' }],
        };

        (mockCore.getObjectFromPointerEvent as jest.Mock).mockReturnValue(mockObject);

        const event = createPointerEvent();

        contextMenuHandler.handleContextMenu(event);

        expect(mockCore.removeSelectionGroup).toHaveBeenCalled();
        expect(mockCore.addSelectionGroup).toHaveBeenCalled();
      });

      it('should not create selection group when clicking on SelectionGroup', () => {
        const mockSelectionGroupObj = { id: 'sel-group' };
        Object.setPrototypeOf(mockSelectionGroupObj, KritzelSelectionGroup.prototype);

        (mockCore.getObjectFromPointerEvent as jest.Mock).mockReturnValue(mockSelectionGroupObj);

        const event = createPointerEvent();

        contextMenuHandler.handleContextMenu(event);

        expect(KritzelSelectionGroup.create).not.toHaveBeenCalled();
      });

      it('should not create selection group when clicking on SelectionBox', () => {
        const mockSelectionBoxObj = { id: 'sel-box' };
        Object.setPrototypeOf(mockSelectionBoxObj, KritzelSelectionBox.prototype);

        (mockCore.getObjectFromPointerEvent as jest.Mock).mockReturnValue(mockSelectionBoxObj);

        const event = createPointerEvent();

        contextMenuHandler.handleContextMenu(event);

        expect(KritzelSelectionGroup.create).not.toHaveBeenCalled();
      });

      it('should not create selection group when no object clicked', () => {
        (mockCore.getObjectFromPointerEvent as jest.Mock).mockReturnValue(null);

        const event = createPointerEvent();

        contextMenuHandler.handleContextMenu(event);

        expect(KritzelSelectionGroup.create).not.toHaveBeenCalled();
      });

      it('should set isSelecting to false when selecting object', () => {
        mockState.isSelecting = true;
        const mockObject = { id: 'obj-1', rotation: 0 };

        (mockCore.getObjectFromPointerEvent as jest.Mock).mockReturnValue(mockObject);

        const event = createPointerEvent();

        contextMenuHandler.handleContextMenu(event);

        expect(mockState.isSelecting).toBe(false);
      });

      it('should rerender after selecting object', () => {
        const mockObject = { id: 'obj-1', rotation: 0 };

        (mockCore.getObjectFromPointerEvent as jest.Mock).mockReturnValue(mockObject);

        const event = createPointerEvent();

        contextMenuHandler.handleContextMenu(event);

        // Should be called twice: once after selection, once at end
        expect(mockCore.rerender).toHaveBeenCalled();
      });
    });

    describe('context menu items assignment', () => {
      it('should use object context menu items when selection group exists', () => {
        mockSelectionGroup = {
          addOrRemove: jest.fn(),
          isSelected: true,
          rotation: 0,
          objects: [{ id: 'obj-1' }],
        };

        const event = createPointerEvent();

        contextMenuHandler.handleContextMenu(event);

        expect(mockState.contextMenuItems).toEqual([
          { label: 'Copy', children: undefined },
          { label: 'Delete', children: undefined },
        ]);
      });

      it('should use global context menu items when no selection group', () => {
        mockSelectionGroup = null;

        const event = createPointerEvent();

        contextMenuHandler.handleContextMenu(event);

        expect(mockState.contextMenuItems).toEqual([
          { label: 'Paste', children: undefined },
          { label: 'Select All', children: undefined },
        ]);
      });
    });

    describe('position calculation', () => {
      it('should set position based on event coordinates minus offset', () => {
        const event = createPointerEvent({ clientX: 200, clientY: 150 });

        contextMenuHandler.handleContextMenu(event);

        expect(mockState.contextMenuX).toBe(200);
        expect(mockState.contextMenuY).toBe(150);
      });

      it('should apply offset when calculating screen position (position: absolute is relative to editor container)', () => {
        (mockCore.store as any).offsetX = 10;
        (mockCore.store as any).offsetY = 20;

        const event = createPointerEvent({ clientX: 200, clientY: 150 });

        contextMenuHandler.handleContextMenu(event);

        expect(mockState.contextMenuX).toBe(190);
        expect(mockState.contextMenuY).toBe(130);
      });

      it('should adjust position when menu would overflow right edge', () => {
        // Menu width estimate is 150, margin is 10
        // If x + 150 > 1024 - 10, adjust
        const event = createPointerEvent({ clientX: 900, clientY: 100 });

        contextMenuHandler.handleContextMenu(event);

        // Should be clamped to 1024 - 150 - 10 = 864
        expect(mockState.contextMenuX).toBe(864);
      });

      it('should NOT pre-clamp y when near bottom edge (actual height is unknown at handler time)', () => {
        // Vertical clamping is delegated to the component's adjustPositionToViewport(),
        // which uses the actual rendered height instead of a fixed estimate.
        const event = createPointerEvent({ clientX: 100, clientY: 600 });

        contextMenuHandler.handleContextMenu(event);

        // y should be the raw click position, not pre-clamped
        expect(mockState.contextMenuY).toBe(600);
      });

      it('should clamp position to minimum margin on left', () => {
        const event = createPointerEvent({ clientX: 5, clientY: 100 });

        contextMenuHandler.handleContextMenu(event);

        expect(mockState.contextMenuX).toBe(10); // margin
      });

      it('should clamp position to minimum margin on top', () => {
        const event = createPointerEvent({ clientX: 100, clientY: 5 });

        contextMenuHandler.handleContextMenu(event);

        expect(mockState.contextMenuY).toBe(10); // margin
      });

      it('should handle negative offset positions', () => {
        (mockCore.store as any).offsetX = -50;
        (mockCore.store as any).offsetY = -30;

        const event = createPointerEvent({ clientX: 200, clientY: 150 });

        contextMenuHandler.handleContextMenu(event);

        expect(mockState.contextMenuX).toBe(250);
        expect(mockState.contextMenuY).toBe(180);
      });
    });

    describe('world coordinate calculation', () => {
      it('should store world coordinates at the click position', () => {
        mockState.translateX = 0;
        mockState.translateY = 0;
        mockState.scale = 1;
        const event = createPointerEvent({ clientX: 300, clientY: 200 });

        contextMenuHandler.handleContextMenu(event);

        expect(mockState.contextMenuWorldX).toBe(300);
        expect(mockState.contextMenuWorldY).toBe(200);
      });

      it('should account for translate when computing world coordinates', () => {
        mockState.translateX = 100;
        mockState.translateY = 50;
        mockState.scale = 1;
        const event = createPointerEvent({ clientX: 300, clientY: 200 });

        contextMenuHandler.handleContextMenu(event);

        expect(mockState.contextMenuWorldX).toBe(200);
        expect(mockState.contextMenuWorldY).toBe(150);
      });

      it('should account for scale when computing world coordinates', () => {
        mockState.translateX = 0;
        mockState.translateY = 0;
        mockState.scale = 0.5;
        const event = createPointerEvent({ clientX: 300, clientY: 200 });

        contextMenuHandler.handleContextMenu(event);

        expect(mockState.contextMenuWorldX).toBe(600);
        expect(mockState.contextMenuWorldY).toBe(400);
      });

      it('should use original click position for world coords even when menu is clamped at right edge', () => {
        mockState.translateX = 0;
        mockState.translateY = 0;
        mockState.scale = 0.25;
        // Click near the right edge so contextMenuX gets clamped
        const event = createPointerEvent({ clientX: 900, clientY: 100 });

        contextMenuHandler.handleContextMenu(event);

        // contextMenuX is clamped to 864, but world coordinate should use the actual click position (900)
        expect(mockState.contextMenuX).toBe(864);
        expect(mockState.contextMenuWorldX).toBe(900 / 0.25); // 3600
        expect(mockState.contextMenuWorldY).toBe(100 / 0.25); // 400
      });

      it('should account for engine offset when computing world coordinates', () => {
        (mockCore.store as any).offsetX = 50;
        (mockCore.store as any).offsetY = 20;
        mockState.translateX = 0;
        mockState.translateY = 0;
        mockState.scale = 1;
        const event = createPointerEvent({ clientX: 300, clientY: 200 });

        contextMenuHandler.handleContextMenu(event);

        expect(mockState.contextMenuWorldX).toBe(250); // (300 - 50 - 0) / 1
        expect(mockState.contextMenuWorldY).toBe(180); // (200 - 20 - 0) / 1
      });
    });
    it('should set context menu visible', () => {
      const event = createPointerEvent();

      contextMenuHandler.handleContextMenu(event);

      expect(mockState.isContextMenuVisible).toBe(true);
    });

    it('should disable core', () => {
      const event = createPointerEvent();

      contextMenuHandler.handleContextMenu(event);

      expect(mockState.isEnabled).toBe(false);
    });

    it('should trigger rerender at end', () => {
      const event = createPointerEvent();

      contextMenuHandler.handleContextMenu(event);

      expect(mockCore.rerender).toHaveBeenCalled();
    });
  });
});
