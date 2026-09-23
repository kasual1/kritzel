import { KritzelBaseObject } from './base-object.class';
import { KritzelCore } from '../core/core.class';
import { KritzelPolygon } from '../../interfaces/polygon.interface';

describe('KritzelBaseObject', () => {
  let baseObject: KritzelBaseObject;
  let mockCore: jest.Mocked<KritzelCore>;
  let mockObjectsUpdate: jest.Mock;
  let mockAnchorManagerUpdate: jest.Mock;

  beforeEach(() => {
    mockObjectsUpdate = jest.fn();
    mockAnchorManagerUpdate = jest.fn();

    mockCore = {
      store: {
        state: {
          scale: 1,
          translateX: 0,
          translateY: 0,
          viewportWidth: 1000,
          viewportHeight: 800,
          objects: {
            update: mockObjectsUpdate,
          },
          activeWorkspace: {
            id: 'workspace-1',
          },
        },
        get objects() { return this.state.objects; },
        currentZIndex: 1,
      },
      anchorManager: {
        updateAnchorsForObject: mockAnchorManagerUpdate,
      },
      user: {
        id: 'user-123',
      },
    } as unknown as jest.Mocked<KritzelCore>;

    baseObject = new KritzelBaseObject();
    baseObject._core = mockCore;
    baseObject.width = 100;
    baseObject.height = 50;
    baseObject.translateX = 10;
    baseObject.translateY = 20;
    baseObject.scale = 1;
    baseObject.padding = 0;
  });

  describe('constructor', () => {
    it('should generate a unique id on instantiation', () => {
      const obj1 = new KritzelBaseObject();
      const obj2 = new KritzelBaseObject();
      expect(obj1.id).toBeDefined();
      expect(obj2.id).toBeDefined();
      expect(obj1.id).not.toBe(obj2.id);
    });

    it('should set default property values', () => {
      const obj = new KritzelBaseObject();
      expect(obj.__class__).toBe('KritzelBaseObject');
      expect(obj.borderWidth).toBe(0);
      expect(obj.opacity).toBe(1);
      expect(obj.padding).toBe(0);
      expect(obj.rotation).toBe(0);
      expect(obj.zIndex).toBe(0);
      expect(obj.isVisible).toBe(true);
      expect(obj.isSelected).toBe(false);
      expect(obj.isHovered).toBe(false);
      expect(obj.isMounted).toBe(false);
      expect(obj.isEditable).toBe(false);
      expect(obj.isInteractive).toBe(false);
      expect(obj.isResizable).toBe(true);
      expect(obj.isRotatable).toBe(true);
      expect(obj.markedForRemoval).toBe(false);
      expect(obj.resizing).toBe(false);
    });
  });

  describe('static create', () => {
    it('should create a new object with core reference and workspace id', () => {
      const obj = KritzelBaseObject.create(mockCore);
      expect(obj._core).toBe(mockCore);
      expect(obj.zIndex).toBe(1);
      expect(obj.workspaceId).toBe('workspace-1');
    });

    it('should set userId from core.user', () => {
      const obj = KritzelBaseObject.create(mockCore);
      expect(obj.userId).toBe('user-123');
    });

    it('should set userId to undefined when core.user is undefined', () => {
      const coreWithoutUser = { ...mockCore, user: undefined } as unknown as jest.Mocked<KritzelCore>;
      const obj = KritzelBaseObject.create(coreWithoutUser);
      expect(obj.userId).toBeUndefined();
    });
  });

  describe('totalWidth getter', () => {
    it('should return width plus padding on both sides', () => {
      baseObject.width = 100;
      baseObject.padding = 10;
      expect(baseObject.totalWidth).toBe(120);
    });

    it('should return width when padding is zero', () => {
      baseObject.width = 100;
      baseObject.padding = 0;
      expect(baseObject.totalWidth).toBe(100);
    });
  });

  describe('totalHeight getter', () => {
    it('should return height plus padding on both sides', () => {
      baseObject.height = 50;
      baseObject.padding = 5;
      expect(baseObject.totalHeight).toBe(60);
    });

    it('should return height when padding is zero', () => {
      baseObject.height = 50;
      baseObject.padding = 0;
      expect(baseObject.totalHeight).toBe(50);
    });
  });

  describe('elementRef getter/setter', () => {
    it('should set and get element reference', () => {
      const mockElement = document.createElement('div');
      baseObject.elementRef = mockElement;
      expect(baseObject.elementRef).toBe(mockElement);
    });
  });

  describe('boundingBox getter', () => {
    it('should return correct bounding box', () => {
      baseObject.translateX = 10;
      baseObject.translateY = 20;
      baseObject.width = 100;
      baseObject.height = 50;
      baseObject.padding = 0;
      baseObject.scale = 1;

      const bbox = baseObject.boundingBox;
      expect(bbox.x).toBe(10);
      expect(bbox.y).toBe(20);
      expect(bbox.z).toBe(1);
      expect(bbox.width).toBe(100);
      expect(bbox.height).toBe(50);
    });

    it('should account for scale in bounding box dimensions', () => {
      baseObject.translateX = 0;
      baseObject.translateY = 0;
      baseObject.width = 100;
      baseObject.height = 50;
      baseObject.padding = 0;
      baseObject.scale = 2;

      const bbox = baseObject.boundingBox;
      expect(bbox.width).toBe(50);
      expect(bbox.height).toBe(25);
    });

    it('should include padding in bounding box dimensions', () => {
      baseObject.translateX = 0;
      baseObject.translateY = 0;
      baseObject.width = 100;
      baseObject.height = 50;
      baseObject.padding = 10;
      baseObject.scale = 1;

      const bbox = baseObject.boundingBox;
      expect(bbox.width).toBe(120);
      expect(bbox.height).toBe(70);
    });
  });

  describe('rotatedPolygon getter', () => {
    it('should return correct corners when rotation is 0', () => {
      baseObject.translateX = 0;
      baseObject.translateY = 0;
      baseObject.width = 100;
      baseObject.height = 50;
      baseObject.padding = 0;
      baseObject.scale = 1;
      baseObject.rotation = 0;

      const polygon = baseObject.rotatedPolygon;
      expect(polygon.topLeft.x).toBeCloseTo(0);
      expect(polygon.topLeft.y).toBeCloseTo(0);
      expect(polygon.topRight.x).toBeCloseTo(100);
      expect(polygon.topRight.y).toBeCloseTo(0);
      expect(polygon.bottomRight.x).toBeCloseTo(100);
      expect(polygon.bottomRight.y).toBeCloseTo(50);
      expect(polygon.bottomLeft.x).toBeCloseTo(0);
      expect(polygon.bottomLeft.y).toBeCloseTo(50);
    });

    it('should rotate corners by 90 degrees', () => {
      baseObject.translateX = 0;
      baseObject.translateY = 0;
      baseObject.width = 100;
      baseObject.height = 100;
      baseObject.padding = 0;
      baseObject.scale = 1;
      baseObject.rotation = Math.PI / 2; // 90 degrees

      const polygon = baseObject.rotatedPolygon;
      // After 90 degree rotation around center (50, 50):
      // topLeft (0,0) -> (100, 0)
      // topRight (100, 0) -> (100, 100)
      // bottomRight (100, 100) -> (0, 100)
      // bottomLeft (0, 100) -> (0, 0)
      expect(polygon.topLeft.x).toBeCloseTo(100);
      expect(polygon.topLeft.y).toBeCloseTo(0);
      expect(polygon.bottomLeft.x).toBeCloseTo(0);
      expect(polygon.bottomLeft.y).toBeCloseTo(0);
    });
  });

  describe('rotatedBoundingBox getter', () => {
    it('should return correct bounding box when rotation is 0', () => {
      baseObject.translateX = 10;
      baseObject.translateY = 20;
      baseObject.width = 100;
      baseObject.height = 50;
      baseObject.padding = 0;
      baseObject.scale = 1;
      baseObject.rotation = 0;

      const bbox = baseObject.rotatedBoundingBox;
      expect(bbox.x).toBeCloseTo(10);
      expect(bbox.y).toBeCloseTo(20);
      expect(bbox.width).toBeCloseTo(100);
      expect(bbox.height).toBeCloseTo(50);
    });
  });

  describe('minXRotated, minYRotated, maxXRotated, maxYRotated getters', () => {
    it('should return correct min/max values for non-rotated object', () => {
      baseObject.translateX = 10;
      baseObject.translateY = 20;
      baseObject.width = 100;
      baseObject.height = 50;
      baseObject.padding = 0;
      baseObject.scale = 1;
      baseObject.rotation = 0;

      expect(baseObject.minXRotated).toBeCloseTo(10);
      expect(baseObject.minYRotated).toBeCloseTo(20);
      expect(baseObject.maxXRotated).toBeCloseTo(110);
      expect(baseObject.maxYRotated).toBeCloseTo(70);
    });
  });

  describe('transformationMatrix getter', () => {
    it('should return correct matrix string', () => {
      baseObject.scale = 2;
      baseObject.translateX = 100;
      baseObject.translateY = 200;

      const matrix = baseObject.transformationMatrix;
      expect(matrix).toBe('matrix(0.5, 0, 0, 0.5, 100, 200)');
    });

    it('should handle scale of 1', () => {
      baseObject.scale = 1;
      baseObject.translateX = 50;
      baseObject.translateY = 75;

      const matrix = baseObject.transformationMatrix;
      expect(matrix).toBe('matrix(1, 0, 0, 1, 50, 75)');
    });
  });

  describe('rotationDegrees getter', () => {
    it('should convert radians to degrees correctly', () => {
      baseObject.rotation = Math.PI;
      expect(baseObject.rotationDegrees).toBeCloseTo(180);
    });

    it('should return 0 when rotation is 0', () => {
      baseObject.rotation = 0;
      expect(baseObject.rotationDegrees).toBe(0);
    });

    it('should return 90 for PI/2 radians', () => {
      baseObject.rotation = Math.PI / 2;
      expect(baseObject.rotationDegrees).toBeCloseTo(90);
    });
  });

  describe('centerX and centerY getters', () => {
    it('should return correct center coordinates', () => {
      baseObject.translateX = 0;
      baseObject.translateY = 0;
      baseObject.width = 100;
      baseObject.height = 50;
      baseObject.padding = 0;
      baseObject.scale = 1;

      expect(baseObject.centerX).toBe(50);
      expect(baseObject.centerY).toBe(25);
    });

    it('should account for scale in center calculation', () => {
      baseObject.translateX = 0;
      baseObject.translateY = 0;
      baseObject.width = 100;
      baseObject.height = 50;
      baseObject.padding = 0;
      baseObject.scale = 2;

      expect(baseObject.centerX).toBe(25);
      expect(baseObject.centerY).toBe(12.5);
    });

    it('should account for translate in center calculation', () => {
      baseObject.translateX = 100;
      baseObject.translateY = 200;
      baseObject.width = 100;
      baseObject.height = 50;
      baseObject.padding = 0;
      baseObject.scale = 1;

      expect(baseObject.centerX).toBe(150);
      expect(baseObject.centerY).toBe(225);
    });
  });

  describe('mount', () => {
    it('should set elementRef and isMounted to true', () => {
      const mockElement = document.createElement('div');
      baseObject.mount(mockElement);

      expect(baseObject.elementRef).toBe(mockElement);
      expect(baseObject.isMounted).toBe(true);
    });

    it('should not remount if already mounted', () => {
      const firstElement = document.createElement('div');
      const secondElement = document.createElement('span');

      baseObject.mount(firstElement);
      baseObject.mount(secondElement);

      expect(baseObject.elementRef).toBe(firstElement);
    });
  });

  describe('generateId', () => {
    it('should return a string', () => {
      const id = baseObject.generateId();
      expect(typeof id).toBe('string');
    });

    it('should generate unique ids on each call', () => {
      const id1 = baseObject.generateId();
      const id2 = baseObject.generateId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('isInViewport', () => {
    it('should return true when object is in viewport', () => {
      baseObject.translateX = 100;
      baseObject.translateY = 100;
      baseObject.width = 100;
      baseObject.height = 100;

      expect(baseObject.isInViewport()).toBe(true);
    });

    it('should return false when object is completely outside viewport to the right', () => {
      baseObject.translateX = 2000;
      baseObject.translateY = 100;
      baseObject.width = 100;
      baseObject.height = 100;

      expect(baseObject.isInViewport()).toBe(false);
    });

    it('should return false when object is completely outside viewport below', () => {
      baseObject.translateX = 100;
      baseObject.translateY = 2000;
      baseObject.width = 100;
      baseObject.height = 100;

      expect(baseObject.isInViewport()).toBe(false);
    });

    it('should return false when object is too small to be visible', () => {
      baseObject.translateX = 100;
      baseObject.translateY = 100;
      baseObject.width = 0.1;
      baseObject.height = 0.1;
      mockCore.store.state.scale = 1;

      expect(baseObject.isInViewport()).toBe(false);
    });

    it('should return true when object partially overlaps viewport', () => {
      baseObject.translateX = -50;
      baseObject.translateY = -25;
      baseObject.width = 100;
      baseObject.height = 100;

      expect(baseObject.isInViewport()).toBe(true);
    });
  });

  describe('update', () => {
    it('should call objects.update with the object', () => {
      baseObject.update();
      expect(mockObjectsUpdate).toHaveBeenCalledWith(baseObject);
    });
  });

  describe('move', () => {
    it('should update translateX and translateY based on delta', () => {
      baseObject.translateX = 100;
      baseObject.translateY = 200;

      baseObject.move(50, 50, 30, 40);

      expect(baseObject.translateX).toBe(120); // 100 + (50 - 30) / 1
      expect(baseObject.translateY).toBe(210); // 200 + (50 - 40) / 1
    });

    it('should account for scale when moving', () => {
      baseObject.translateX = 100;
      baseObject.translateY = 200;
      mockCore.store.state.scale = 2;

      baseObject.move(50, 50, 30, 40);

      expect(baseObject.translateX).toBe(110); // 100 + (50 - 30) / 2
      expect(baseObject.translateY).toBe(205); // 200 + (50 - 40) / 2
    });

    it('should call objects.update after moving', () => {
      baseObject.move(0, 0, 10, 10);
      expect(mockObjectsUpdate).toHaveBeenCalledWith(baseObject);
    });
  });

  describe('resize', () => {
    it('should update dimensions and position', () => {
      baseObject.resize(50, 60, 200, 150);

      expect(baseObject.translateX).toBe(50);
      expect(baseObject.translateY).toBe(60);
      expect(baseObject.width).toBe(200);
      expect(baseObject.height).toBe(150);
    });

    it('should not resize if width is less than or equal to 1', () => {
      baseObject.width = 100;
      baseObject.height = 50;
      baseObject.resize(50, 60, 0.5, 150);

      expect(baseObject.width).toBe(100);
      expect(baseObject.height).toBe(50);
    });

    it('should not resize if height is less than or equal to 1', () => {
      baseObject.width = 100;
      baseObject.height = 50;
      baseObject.resize(50, 60, 200, 0.5);

      expect(baseObject.width).toBe(100);
      expect(baseObject.height).toBe(50);
    });

    it('should call objects.update after resizing', () => {
      baseObject.resize(50, 60, 200, 150);
      expect(mockObjectsUpdate).toHaveBeenCalledWith(baseObject);
    });

    it('should update anchors after resizing', () => {
      baseObject.resize(50, 60, 200, 150);
      expect(mockAnchorManagerUpdate).toHaveBeenCalledWith(baseObject.id);
    });
  });

  describe('rotate', () => {
    it('should update rotation value', () => {
      baseObject.rotate(Math.PI / 4);
      expect(baseObject.rotation).toBe(Math.PI / 4);
    });

    it('should call objects.update after rotating', () => {
      baseObject.rotate(Math.PI / 2);
      expect(mockObjectsUpdate).toHaveBeenCalledWith(baseObject);
    });
  });

  describe('clone', () => {
    it('should create a copy with the same id', () => {
      baseObject.width = 200;
      baseObject.height = 100;

      const cloned = baseObject.clone();

      expect(cloned.id).toBe(baseObject.id);
      expect(cloned.width).toBe(200);
      expect(cloned.height).toBe(100);
    });

    it('should create an independent object', () => {
      const cloned = baseObject.clone();
      cloned.width = 500;

      expect(baseObject.width).not.toBe(500);
    });
  });

  describe('copy', () => {
    it('should create a copy with a new id', () => {
      const copied = baseObject.copy();

      expect(copied.id).not.toBe(baseObject.id);
    });

    it('should set isMounted to false on copied object', () => {
      baseObject.isMounted = true;
      const copied = baseObject.copy();

      expect(copied.isMounted).toBe(false);
    });

    it('should reset transient interaction state on copied object', () => {
      baseObject.isSelected = true;
      baseObject.isHovered = true;
      baseObject.isInteractive = true;
      baseObject.resizing = true;
      baseObject.markedForRemoval = true;
      baseObject.isVisible = false;

      const copied = baseObject.copy();

      expect(copied.isSelected).toBe(false);
      expect(copied.isHovered).toBe(false);
      expect(copied.isInteractive).toBe(false);
      expect(copied.resizing).toBe(false);
      expect(copied.markedForRemoval).toBe(false);
      expect(copied.isVisible).toBe(true);
    });

    it('should preserve other properties', () => {
      baseObject.width = 300;
      baseObject.height = 150;
      baseObject.translateX = 50;
      baseObject.translateY = 75;
      baseObject.userId = 'user-789';

      const copied = baseObject.copy();

      expect(copied.width).toBe(300);
      expect(copied.height).toBe(150);
      expect(copied.translateX).toBe(50);
      expect(copied.translateY).toBe(75);
      expect(copied.userId).toBe('user-789');
    });
  });

  describe('serialize', () => {
    it('should exclude _core and _elementRef from serialization', () => {
      const serialized = baseObject.serialize();

      expect(serialized._core).toBeUndefined();
      expect(serialized._elementRef).toBeUndefined();
    });

    it('should include standard properties', () => {
      baseObject.width = 100;
      baseObject.height = 50;
      baseObject.translateX = 10;
      baseObject.translateY = 20;
      baseObject.userId = 'user-123';

      const serialized = baseObject.serialize();

      expect(serialized.width).toBe(100);
      expect(serialized.height).toBe(50);
      expect(serialized.translateX).toBe(10);
      expect(serialized.translateY).toBe(20);
      expect(serialized.id).toBe(baseObject.id);
      expect(serialized.userId).toBe('user-123');
    });

    it('should exclude totalWidth and totalHeight getters', () => {
      const serialized = baseObject.serialize();

      expect(serialized.totalWidth).toBeUndefined();
      expect(serialized.totalHeight).toBeUndefined();
    });

    it('should not serialize transient selection and interaction state', () => {
      baseObject.isSelected = true;
      baseObject.isHovered = true;
      baseObject.isMounted = true;
      baseObject.isInteractive = true;
      baseObject.resizing = true;
      baseObject.markedForRemoval = true;
      baseObject.isVisible = false;

      const serialized = baseObject.serialize();

      expect(serialized.isSelected).toBeUndefined();
      expect(serialized.isHovered).toBeUndefined();
      expect(serialized.isMounted).toBeUndefined();
      expect(serialized.isInteractive).toBeUndefined();
      expect(serialized.resizing).toBeUndefined();
      expect(serialized.markedForRemoval).toBeUndefined();
      expect(serialized.isVisible).toBeUndefined();
    });
  });

  describe('deserialize', () => {
    it('should assign all properties from object', () => {
      const data = {
        id: 'test-id',
        width: 250,
        height: 125,
        translateX: 30,
        translateY: 40,
        rotation: 0.5,
        userId: 'user-456',
      };

      baseObject.deserialize(data);

      expect(baseObject.id).toBe('test-id');
      expect(baseObject.width).toBe(250);
      expect(baseObject.height).toBe(125);
      expect(baseObject.translateX).toBe(30);
      expect(baseObject.translateY).toBe(40);
      expect(baseObject.rotation).toBe(0.5);
      expect(baseObject.userId).toBe('user-456');
    });

    it('should return the object itself', () => {
      const result = baseObject.deserialize({ width: 100 });
      expect(result).toBe(baseObject);
    });

    it('should reset transient interaction state after deserialization', () => {
      baseObject.deserialize({
        isSelected: true,
        isHovered: true,
        isMounted: true,
        isInteractive: true,
        resizing: true,
        markedForRemoval: true,
        isVisible: false,
      });

      expect(baseObject.isSelected).toBe(false);
      expect(baseObject.isHovered).toBe(false);
      expect(baseObject.isMounted).toBe(false);
      expect(baseObject.isInteractive).toBe(false);
      expect(baseObject.resizing).toBe(false);
      expect(baseObject.markedForRemoval).toBe(false);
      expect(baseObject.isVisible).toBe(true);
    });
  });

  describe('isClass', () => {
    it('should return true when class name matches', () => {
      expect(baseObject.isClass('KritzelBaseObject')).toBe(true);
    });

    it('should return false when class name does not match', () => {
      expect(baseObject.isClass('SomeOtherClass')).toBe(false);
    });
  });

  describe('edit', () => {
    it('should exist and be callable without errors', () => {
      expect(() => baseObject.edit()).not.toThrow();
    });

    it('should accept an optional PointerEvent', () => {
      const mockEvent = { type: 'pointerdown' } as PointerEvent;
      expect(() => baseObject.edit(mockEvent)).not.toThrow();
    });
  });

  describe('hitTest', () => {
    it('should return true by default', () => {
      expect(baseObject.hitTest(0, 0)).toBe(true);
      expect(baseObject.hitTest(100, 100)).toBe(true);
    });
  });

  describe('hitTestPolygon', () => {
    it('should return true for overlapping polygons', () => {
      baseObject.translateX = 0;
      baseObject.translateY = 0;
      baseObject.width = 100;
      baseObject.height = 100;
      baseObject.padding = 0;
      baseObject.scale = 1;
      baseObject.rotation = 0;

      const testPolygon: KritzelPolygon = {
        topLeft: { x: 50, y: 50 },
        topRight: { x: 150, y: 50 },
        bottomRight: { x: 150, y: 150 },
        bottomLeft: { x: 50, y: 150 },
      };

      expect(baseObject.hitTestPolygon(testPolygon)).toBe(true);
    });

    it('should return false for non-overlapping polygons', () => {
      baseObject.translateX = 0;
      baseObject.translateY = 0;
      baseObject.width = 100;
      baseObject.height = 100;
      baseObject.padding = 0;
      baseObject.scale = 1;
      baseObject.rotation = 0;

      const testPolygon: KritzelPolygon = {
        topLeft: { x: 200, y: 200 },
        topRight: { x: 300, y: 200 },
        bottomRight: { x: 300, y: 300 },
        bottomLeft: { x: 200, y: 300 },
      };

      expect(baseObject.hitTestPolygon(testPolygon)).toBe(false);
    });
  });

  describe('updatePosition', () => {
    it('should update translateX and translateY', () => {
      baseObject.updatePosition(150, 250);

      expect(baseObject.translateX).toBe(150);
      expect(baseObject.translateY).toBe(250);
    });

    it('should call objects.update after updating position', () => {
      baseObject.updatePosition(150, 250);
      expect(mockObjectsUpdate).toHaveBeenCalledWith(baseObject);
    });
  });
});
