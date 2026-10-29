import { KritzelSelectionBox } from './selection-box.class';
import { KritzelCore } from '../core/core.class';

describe('KritzelSelectionBox', () => {
  let selectionBox: KritzelSelectionBox;
  let mockCore: jest.Mocked<KritzelCore>;

  beforeEach(() => {
    mockCore = {
      store: {
        state: {
          scale: 1,
          activeWorkspace: {
            id: 'workspace-1',
          },
        },
      },
    } as unknown as jest.Mocked<KritzelCore>;

    selectionBox = new KritzelSelectionBox();
    selectionBox._core = mockCore;
  });

  describe('constructor', () => {
    it('should generate a unique id on instantiation', () => {
      const box1 = new KritzelSelectionBox();
      const box2 = new KritzelSelectionBox();
      expect(box1.id).toBeDefined();
      expect(box2.id).toBeDefined();
      expect(box1.id).not.toBe(box2.id);
    });

    it('should set __class__ to KritzelSelectionBox', () => {
      const box = new KritzelSelectionBox();
      expect(box.__class__).toBe('KritzelSelectionBox');
    });
  });

  describe('static create', () => {
    it('should create a new selection box with core reference', () => {
      const box = KritzelSelectionBox.create(mockCore);
      expect(box._core).toBe(mockCore);
    });

    it('should set workspaceId from active workspace', () => {
      const box = KritzelSelectionBox.create(mockCore);
      expect(box.workspaceId).toBe('workspace-1');
    });

    it('should generate a unique id', () => {
      const box = KritzelSelectionBox.create(mockCore);
      expect(box.id).toBeDefined();
      expect(typeof box.id).toBe('string');
      expect(box.id.length).toBeGreaterThan(0);
    });

    it('should set scale from core store state', () => {
      const box = KritzelSelectionBox.create(mockCore);
      expect(box.scale).toBe(1);
    });

    it('should set scale correctly when core has different scale', () => {
      mockCore.store.state.scale = 2;
      const box = KritzelSelectionBox.create(mockCore);
      expect(box.scale).toBe(2);
    });

    it('should set zIndex to 99999', () => {
      const box = KritzelSelectionBox.create(mockCore);
      expect(box.zIndex).toBe(99999);
    });

    it('should set backgroundColor with theme-aware color', () => {
      const box = KritzelSelectionBox.create(mockCore);
      expect(box.backgroundColor).toEqual({ light: 'var(--kritzel-selection-box-background-color)', dark: 'var(--kritzel-selection-box-background-color)' });
    });

    it('should set borderColor with theme-aware color', () => {
      const box = KritzelSelectionBox.create(mockCore);
      expect(box.borderColor).toEqual({ light: 'var(--kritzel-selection-box-border-color)', dark: 'var(--kritzel-selection-box-border-color)' });
    });

    it('should set borderWidth to 2', () => {
      const box = KritzelSelectionBox.create(mockCore);
      expect(box.borderWidth).toBe(2);
    });

    it('should initialize height to 0', () => {
      const box = KritzelSelectionBox.create(mockCore);
      expect(box.height).toBe(0);
    });

    it('should initialize width to 0', () => {
      const box = KritzelSelectionBox.create(mockCore);
      expect(box.width).toBe(0);
    });

    it('should create multiple unique selection boxes', () => {
      const box1 = KritzelSelectionBox.create(mockCore);
      const box2 = KritzelSelectionBox.create(mockCore);
      expect(box1.id).not.toBe(box2.id);
    });
  });

  describe('inheritance from KritzelBaseObject', () => {
    it('should inherit default property values from KritzelBaseObject', () => {
      const box = new KritzelSelectionBox();
      expect(box.opacity).toBe(1);
      expect(box.padding).toBe(0);
      expect(box.rotation).toBe(0);
      expect(box.isVisible).toBe(true);
      expect(box.isSelected).toBe(false);
      expect(box.isHovered).toBe(false);
      expect(box.isMounted).toBe(false);
      expect(box.isEditable).toBe(false);
      expect(box.isInteractive).toBe(false);
      expect(box.markedForRemoval).toBe(false);
      expect(box.resizing).toBe(false);
    });

    it('should have totalWidth getter that includes padding', () => {
      selectionBox.width = 100;
      selectionBox.padding = 10;
      expect(selectionBox.totalWidth).toBe(120);
    });

    it('should have totalHeight getter that includes padding', () => {
      selectionBox.height = 50;
      selectionBox.padding = 5;
      expect(selectionBox.totalHeight).toBe(60);
    });

    it('should be able to mount an element', () => {
      const mockElement = document.createElement('div');
      selectionBox.mount(mockElement);
      expect(selectionBox.isMounted).toBe(true);
      expect(selectionBox.elementRef).toBe(mockElement);
    });

    it('should not remount if already mounted', () => {
      const mockElement1 = document.createElement('div');
      const mockElement2 = document.createElement('div');
      selectionBox.mount(mockElement1);
      selectionBox.mount(mockElement2);
      expect(selectionBox.elementRef).toBe(mockElement1);
    });

    it('should calculate boundingBox correctly', () => {
      selectionBox.translateX = 10;
      selectionBox.translateY = 20;
      selectionBox.width = 100;
      selectionBox.height = 50;
      selectionBox.scale = 1;
      selectionBox.padding = 0;

      const boundingBox = selectionBox.boundingBox;
      expect(boundingBox.x).toBe(10);
      expect(boundingBox.y).toBe(20);
      expect(boundingBox.width).toBe(100);
      expect(boundingBox.height).toBe(50);
    });

    it('should calculate centerX correctly', () => {
      selectionBox.translateX = 10;
      selectionBox.width = 100;
      selectionBox.scale = 1;
      selectionBox.padding = 0;

      expect(selectionBox.centerX).toBe(60);
    });

    it('should calculate centerY correctly', () => {
      selectionBox.translateY = 20;
      selectionBox.height = 50;
      selectionBox.scale = 1;
      selectionBox.padding = 0;

      expect(selectionBox.centerY).toBe(45);
    });
  });
});
