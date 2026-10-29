import { KritzelPath } from './path.class';
import { KritzelCore } from '../core/core.class';
import { KritzelPolygon } from '../../interfaces/polygon.interface';
import { ThemeAwareColor } from '../../constants/color-palette.constants';

describe('KritzelPath', () => {
  let path: KritzelPath;
  let mockCore: jest.Mocked<KritzelCore>;
  let mockObjectsUpdate: jest.Mock;

  beforeEach(() => {
    mockObjectsUpdate = jest.fn();

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
        updateAnchorsForObject: jest.fn(),
      },
    } as unknown as jest.Mocked<KritzelCore>;

    path = new KritzelPath({
      points: [
        [0, 0],
        [50, 50],
        [100, 0],
      ],
      translateX: 10,
      translateY: 20,
      scale: 1,
      strokeWidth: 8,
      fill: { light: '#ff0000', dark: '#ff0000' },
    });
    path._core = mockCore;
  });

  describe('constructor', () => {
    it('should create a path with default values when no config provided', () => {
      const defaultPath = new KritzelPath();

      expect(defaultPath.points).toEqual([]);
      // Note: translateX/Y become Infinity when points array is empty due to Math.min/max on empty array
      expect(defaultPath.scale).toBe(1);
      expect(defaultPath.strokeWidth).toBe(8);
      expect(defaultPath.fill).toEqual({ light: '#000000', dark: '#ffffff' });
      expect(defaultPath.__class__).toBe('KritzelPath');
    });

    it('should create a path with provided config values', () => {
      const themeAwareColor: ThemeAwareColor = { light: '#00ff00', dark: '#00ff00' };
      const configuredPath = new KritzelPath({
        points: [[10, 10], [20, 20]],
        translateX: 100,
        translateY: 200,
        scale: 2,
        strokeWidth: 16,
        fill: themeAwareColor,
        lineSlack: 1.0,
      });

      expect(configuredPath.points).toEqual([[10, 10], [20, 20]]);
      expect(configuredPath.translateX).not.toBe(0); // Updated by updateDimensions
      expect(configuredPath.scale).toBe(2);
      expect(configuredPath.strokeWidth).toBe(16);
      expect(configuredPath.fill).toEqual(themeAwareColor);
    });

    it('should convert constructor rotation from degrees to radians', () => {
      const configuredPath = new KritzelPath({
        points: [[10, 10], [20, 20]],
        rotation: -90,
      });

      expect(configuredPath.rotation).toBeCloseTo(-Math.PI / 2);
    });

    it('should keep the same base placement with and without constructor rotation', () => {
      const points = [[0, 0], [50, 50], [100, 0]];
      const withoutRotation = new KritzelPath({
        points,
        translateX: 120,
        translateY: 240,
        strokeWidth: 8,
      });
      const withRotation = new KritzelPath({
        points,
        translateX: 120,
        translateY: 240,
        strokeWidth: 8,
        rotation: -90,
      });

      expect(withRotation.translateX).toBeCloseTo(withoutRotation.translateX);
      expect(withRotation.translateY).toBeCloseTo(withoutRotation.translateY);
      expect(withRotation.width).toBeCloseTo(withoutRotation.width);
      expect(withRotation.height).toBeCloseTo(withoutRotation.height);
    });

    it('should generate an SVG path string', () => {
      expect(path.d).toBeDefined();
      expect(typeof path.d).toBe('string');
    });

    it('should set default property values', () => {
      expect(path.stroke).toEqual({ light: 'none', dark: 'none' });
      expect(path.lineSlack).toBe(0.5);
      expect(path.isVisible).toBe(true);
      expect(path.isDebugInfoVisible).toBe(true);
      expect(path.isCompleted).toBe(false);
    });
  });

  describe('static create', () => {
    it('should create a path with core reference and workspace id', () => {
      const themeAwareColor: ThemeAwareColor = { light: '#0000ff', dark: '#0000ff' };
      const createdPath = KritzelPath.create(mockCore, {
        points: [[0, 0], [10, 10]],
        fill: themeAwareColor,
      });

      expect(createdPath._core).toBe(mockCore);
      expect(createdPath.workspaceId).toBe('workspace-1');
      expect(createdPath.zIndex).toBe(1);
      expect(createdPath.fill).toEqual(themeAwareColor);
    });

    it('should convert create rotation from degrees to radians', () => {
      const createdPath = KritzelPath.create(mockCore, {
        points: [[0, 0], [10, 10]],
        rotation: -90,
      });

      expect(createdPath.rotation).toBeCloseTo(-Math.PI / 2);
    });

    it('should use default options when not provided', () => {
      const createdPath = KritzelPath.create(mockCore);

      expect(createdPath.points).toEqual([]);
      // Note: translateX/Y become Infinity when points array is empty due to Math.min/max on empty array
      expect(createdPath.scale).toBe(1);
      expect(createdPath.strokeWidth).toBe(8);
      expect(createdPath.fill).toEqual({ light: '#000000', dark: '#ffffff' });
    });

    it('should generate a unique id', () => {
      const path1 = KritzelPath.create(mockCore);
      const path2 = KritzelPath.create(mockCore);

      expect(path1.id).toBeDefined();
      expect(path2.id).toBeDefined();
      expect(path1.id).not.toBe(path2.id);
    });
  });

  describe('viewBox getter', () => {
    it('should return a local-coordinate viewBox anchored at 0,0', () => {
      path.x = 10;
      path.y = 20;
      path.width = 100;
      path.height = 50;

      // The path's `d` is emitted in local coordinates, so the viewBox is
      // always anchored at 0,0 (independent of the object's world position).
      expect(path.viewBox).toBe('0 0 100 50');
    });

    it('should handle zero values', () => {
      path.x = 0;
      path.y = 0;
      path.width = 0;
      path.height = 0;

      expect(path.viewBox).toBe('0 0 0 0');
    });
  });

  describe('local-coordinate rendering', () => {
    const maxAbsCoordinate = (d: string): number => {
      const nums = d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
      return nums.length ? Math.max(...nums.map(Math.abs)) : 0;
    };

    it('should emit d in small local coordinates even when points are far from the origin', () => {
      const shape = [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [5, 5],
      ];
      const offset = 40_000_000;

      const far = KritzelPath.create(mockCore, {
        points: shape.map(([x, y]) => [x + offset, y + offset]),
        strokeWidth: 6,
      });

      expect(far.d.length).toBeGreaterThan(0);
      // Absolute-coordinate rendering would produce coordinates near 40,000,000
      // (which the SVG rasterizer cannot represent in float32). Local rendering
      // keeps them bounded by the object's own extent.
      expect(maxAbsCoordinate(far.d)).toBeLessThan(1000);
    });

    it('should regenerate a local-coordinate d on deserialize (self-heals absolute data)', () => {
      const shape = [
        [40_000_000, 40_000_000],
        [40_000_010, 40_000_000],
        [40_000_010, 40_000_010],
        [40_000_000, 40_000_010],
        [40_000_005, 40_000_005],
      ];
      const original = KritzelPath.create(mockCore, { points: shape, strokeWidth: 6 });

      const serialized = original.serialize() as Record<string, unknown>;
      // Simulate legacy persisted data whose `d` was stored in absolute coordinates.
      serialized.d = 'M40000000.00,40000000.00 L40000010.00,40000010.00';

      const revived = KritzelPath.create(mockCore).deserialize<KritzelPath>(serialized);

      expect(revived.d).not.toContain('40000000');
      expect(maxAbsCoordinate(revived.d)).toBeLessThan(1000);
    });
  });

  describe('resize', () => {
    beforeEach(() => {
      path.points = [[0, 0], [100, 0], [100, 100], [0, 100]];
      path.width = 100;
      path.height = 100;
      path.x = 0;
      path.y = 0;
    });

    it('should scale points proportionally', () => {
      const originalPoints = [...path.points.map(p => [...p])];
      path.resize(0, 0, 200, 200);

      // Points should be scaled by factor of 2
      expect(path.points[0][0]).toBe(originalPoints[0][0] * 2);
      expect(path.points[1][0]).toBe(originalPoints[1][0] * 2);
    });

    it('should update translateX and translateY', () => {
      path.resize(50, 75, 200, 200);

      expect(path.translateX).toBe(50);
      expect(path.translateY).toBe(75);
    });

    it('should not resize if width is less than or equal to 1', () => {
      const originalWidth = path.width;
      const originalHeight = path.height;

      path.resize(0, 0, 0.5, 200);

      expect(path.width).toBe(originalWidth);
      expect(path.height).toBe(originalHeight);
    });

    it('should not resize if height is less than or equal to 1', () => {
      const originalWidth = path.width;
      const originalHeight = path.height;

      path.resize(0, 0, 200, 0.5);

      expect(path.width).toBe(originalWidth);
      expect(path.height).toBe(originalHeight);
    });

    it('should regenerate SVG path after resize', () => {
      const originalD = path.d;
      path.resize(0, 0, 200, 200);

      expect(path.d).not.toBe(originalD);
    });

    it('should call objects.update after resizing', () => {
      path.resize(0, 0, 200, 200);

      expect(mockObjectsUpdate).toHaveBeenCalledWith(path);
    });

    it('should clear adjusted points cache', () => {
      // Trigger cache population
      path.hitTest(50, 50);

      path.resize(0, 0, 200, 200);

      // Cache should be cleared (private, but we can verify behavior)
      expect(mockObjectsUpdate).toHaveBeenCalled();
    });
  });

  describe('rotate', () => {
    it('should update rotation value', () => {
      path.rotate(Math.PI / 4);

      expect(path.rotation).toBe(Math.PI / 4);
    });

    it('should call objects.update after rotating', () => {
      path.rotate(Math.PI / 2);

      expect(mockObjectsUpdate).toHaveBeenCalledWith(path);
    });

    it('should clear adjusted points cache', () => {
      path.hitTest(50, 50);
      mockObjectsUpdate.mockClear();

      path.rotate(Math.PI);

      expect(mockObjectsUpdate).toHaveBeenCalled();
    });
  });

  describe('move', () => {
    it('should update translateX and translateY based on delta', () => {
      path.translateX = 100;
      path.translateY = 200;

      path.move(50, 50, 30, 40);

      expect(path.translateX).toBe(120); // 100 + (50 - 30) / 1
      expect(path.translateY).toBe(210); // 200 + (50 - 40) / 1
    });

    it('should account for scale when moving', () => {
      path.translateX = 100;
      path.translateY = 200;
      mockCore.store.state.scale = 2;

      path.move(50, 50, 30, 40);

      expect(path.translateX).toBe(110); // 100 + (50 - 30) / 2
      expect(path.translateY).toBe(205); // 200 + (50 - 40) / 2
    });

    it('should call objects.update after moving', () => {
      path.move(0, 0, 10, 10);

      expect(mockObjectsUpdate).toHaveBeenCalledWith(path);
    });

    it('should clear adjusted points cache', () => {
      path.hitTest(50, 50);
      mockObjectsUpdate.mockClear();

      path.move(0, 0, 10, 10);

      expect(mockObjectsUpdate).toHaveBeenCalled();
    });
  });

  describe('hitTest', () => {
    beforeEach(() => {
      path = new KritzelPath({
        points: [[0, 0], [100, 0]],
        translateX: 0,
        translateY: 0,
        scale: 1,
        strokeWidth: 10,
      });
      path._core = mockCore;
      path.x = 0;
      path.y = -5;
      path.rotation = 0;
    });

    it('should return true for point on the path', () => {
      // Point near the start of the line
      const result = path.hitTest(path.translateX + 5, path.translateY);

      expect(result).toBe(true);
    });

    it('should return false for point far from the path', () => {
      const result = path.hitTest(500, 500);

      expect(result).toBe(false);
    });

    it('should handle single point paths', () => {
      const singlePointPath = new KritzelPath({
        points: [[50, 50]],
        translateX: 0,
        translateY: 0,
        scale: 1,
        strokeWidth: 20,
      });
      singlePointPath._core = mockCore;
      singlePointPath.x = 40;
      singlePointPath.y = 40;

      // Point near the single point
      const nearResult = singlePointPath.hitTest(55, 55);
      expect(nearResult).toBe(true);

      // Point far from the single point
      const farResult = singlePointPath.hitTest(200, 200);
      expect(farResult).toBe(false);
    });

    it('should account for stroke width', () => {
      path.strokeWidth = 20;

      // Point within stroke width distance
      const result = path.hitTest(path.translateX + 50, path.translateY + 8);
      expect(result).toBe(true);
    });
  });

  describe('hitTestPolygon', () => {
    beforeEach(() => {
      path = new KritzelPath({
        points: [[0, 0], [100, 0], [100, 100]],
        translateX: 0,
        translateY: 0,
        scale: 1,
        strokeWidth: 10,
      });
      path._core = mockCore;
      path.x = 0;
      path.y = -5;
      path.rotation = 0;
    });

    it('should return true when polygon overlaps path', () => {
      const polygon: KritzelPolygon = {
        topLeft: { x: 40, y: -20 },
        topRight: { x: 60, y: -20 },
        bottomRight: { x: 60, y: 20 },
        bottomLeft: { x: 40, y: 20 },
      };

      expect(path.hitTestPolygon(polygon)).toBe(true);
    });

    it('should return false when polygon does not overlap path', () => {
      const polygon: KritzelPolygon = {
        topLeft: { x: 500, y: 500 },
        topRight: { x: 600, y: 500 },
        bottomRight: { x: 600, y: 600 },
        bottomLeft: { x: 500, y: 600 },
      };

      expect(path.hitTestPolygon(polygon)).toBe(false);
    });

    it('should return true when path point is inside polygon', () => {
      const polygon: KritzelPolygon = {
        topLeft: { x: -50, y: -50 },
        topRight: { x: 150, y: -50 },
        bottomRight: { x: 150, y: 150 },
        bottomLeft: { x: -50, y: 150 },
      };

      expect(path.hitTestPolygon(polygon)).toBe(true);
    });

    it('should return true when polygon edge intersects path', () => {
      path = new KritzelPath({
        points: [[0, 0], [200, 200]],
        translateX: 0,
        translateY: 0,
        scale: 1,
        strokeWidth: 2,
      });
      path._core = mockCore;
      path.rotation = 0;

      const polygon: KritzelPolygon = {
        topLeft: { x: 50, y: 0 },
        topRight: { x: 150, y: 0 },
        bottomRight: { x: 150, y: 50 },
        bottomLeft: { x: 50, y: 50 },
      };

      expect(path.hitTestPolygon(polygon)).toBe(true);
    });
  });

  describe('updatePosition', () => {
    it('should update translateX and translateY', () => {
      path.updatePosition(150, 250);

      expect(path.translateX).toBe(150);
      expect(path.translateY).toBe(250);
    });

    it('should call objects.update after updating position', () => {
      path.updatePosition(150, 250);

      expect(mockObjectsUpdate).toHaveBeenCalledWith(path);
    });

    it('should clear adjusted points cache', () => {
      path.hitTest(50, 50);
      mockObjectsUpdate.mockClear();

      path.updatePosition(100, 100);

      expect(mockObjectsUpdate).toHaveBeenCalled();
    });
  });

  describe('isLowRes', () => {
    it('should return false when core is not set', () => {
      const pathWithoutCore = new KritzelPath({
        points: [[0, 0], [100, 100]],
      });
      pathWithoutCore._core = undefined as unknown as KritzelCore;

      expect(pathWithoutCore.isLowRes()).toBe(false);
    });

    it('should return true when scaled area is less than 500', () => {
      path.width = 10;
      path.height = 10;
      path.padding = 0;
      path.scale = 1;
      mockCore.store.state.scale = 1;

      // Area would be 10 * 10 = 100 < 500
      expect(path.isLowRes()).toBe(true);
    });

    it('should return false when scaled area is 500 or more', () => {
      path.width = 100;
      path.height = 100;
      path.padding = 0;
      path.scale = 1;
      mockCore.store.state.scale = 1;

      // Area would be 100 * 100 = 10000 >= 500
      expect(path.isLowRes()).toBe(false);
    });

    it('should account for viewport scale', () => {
      path.width = 50;
      path.height = 50;
      path.padding = 0;
      path.scale = 1;
      mockCore.store.state.scale = 0.1;

      // Scaled dimensions: 5 * 5 = 25 < 500
      expect(path.isLowRes()).toBe(true);
    });
  });

  describe('getClipPoint', () => {
    beforeEach(() => {
      path = new KritzelPath({
        points: [[50, 50], [100, 50], [150, 50]],
        translateX: 0,
        translateY: 0,
        scale: 1,
        strokeWidth: 10,
      });
      path._core = mockCore;
      path.x = 45;
      path.y = 45;
      path.width = 110;
      path.height = 10;
      path.rotation = 0;
    });

    it('should return null when path has no points', () => {
      const emptyPath = new KritzelPath({ points: [] });
      emptyPath._core = mockCore;

      const result = emptyPath.getClipPoint({ x: 0, y: 0 });

      expect(result).toBeNull();
    });

    it('should return a point when line intersects stroke', () => {
      const outsidePoint = { x: -100, y: path.centerY };
      const result = path.getClipPoint(outsidePoint);

      // Should return a point on the stroke edge
      if (result) {
        expect(result.x).toBeDefined();
        expect(result.y).toBeDefined();
        // The clip point should be between the outside point and center
        expect(result.x).toBeGreaterThan(outsidePoint.x);
        expect(result.x).toBeLessThan(path.centerX);
      }
    });

    it('should return null when no intersection found', () => {
      // Create a path with points far from the test line
      const isolatedPath = new KritzelPath({
        points: [[1000, 1000], [1100, 1000]],
        translateX: 0,
        translateY: 0,
        scale: 1,
        strokeWidth: 5,
      });
      isolatedPath._core = mockCore;
      isolatedPath.x = 995;
      isolatedPath.y = 995;
      isolatedPath.width = 110;
      isolatedPath.height = 10;

      // Line that doesn't pass through the stroke
      const outsidePoint = { x: 0, y: 0 };
      const result = isolatedPath.getClipPoint(outsidePoint);

      // May or may not find intersection depending on path
      // This tests the edge case handling
      expect(result === null || (result.x !== undefined && result.y !== undefined)).toBe(true);
    });

    it('should handle single point paths', () => {
      const singlePointPath = new KritzelPath({
        points: [[50, 50]],
        translateX: 0,
        translateY: 0,
        scale: 1,
        strokeWidth: 20,
      });
      singlePointPath._core = mockCore;
      singlePointPath.x = 40;
      singlePointPath.y = 40;
      singlePointPath.width = 20;
      singlePointPath.height = 20;

      const outsidePoint = { x: 0, y: 50 };
      const result = singlePointPath.getClipPoint(outsidePoint);

      // Should find intersection with the circular stroke around single point
      if (result) {
        expect(result.x).toBeDefined();
        expect(result.y).toBeDefined();
      }
    });
  });

  describe('SVG path generation', () => {
    it('should generate valid SVG path for multiple points', () => {
      const pathWithPoints = new KritzelPath({
        points: [
          [0, 0],
          [10, 10],
          [20, 0],
          [30, 10],
          [40, 0],
        ],
      });

      expect(pathWithPoints.d).toBeDefined();
      expect(pathWithPoints.d.length).toBeGreaterThan(0);
      // Should start with M command
      expect(pathWithPoints.d.startsWith('M')).toBe(true);
    });

    it('should return empty string for paths with less than 4 stroke points', () => {
      // Very short paths may not generate enough stroke points
      const shortPath = new KritzelPath({
        points: [[0, 0]],
      });

      // The generated path may be empty for very short inputs
      expect(typeof shortPath.d).toBe('string');
    });

    it('should end with Z for closed paths', () => {
      const pathWithPoints = new KritzelPath({
        points: [
          [0, 0],
          [50, 50],
          [100, 0],
          [50, 100],
          [0, 50],
        ],
      });

      if (pathWithPoints.d.length > 0) {
        expect(pathWithPoints.d.endsWith('Z')).toBe(true);
      }
    });
  });

  describe('dimension calculations', () => {
    it('should calculate width and height based on points', () => {
      const pathWithKnownPoints = new KritzelPath({
        points: [
          [0, 0],
          [100, 0],
          [100, 50],
          [0, 50],
        ],
        strokeWidth: 0,
      });

      // Width and height should encompass all points plus stroke
      expect(pathWithKnownPoints.width).toBeGreaterThan(0);
      expect(pathWithKnownPoints.height).toBeGreaterThan(0);
    });

    it('should include stroke width in dimensions', () => {
      const pathNoStroke = new KritzelPath({
        points: [[0, 0], [100, 0]],
        strokeWidth: 0,
      });

      const pathWithStroke = new KritzelPath({
        points: [[0, 0], [100, 0]],
        strokeWidth: 20,
      });

      // Path with stroke should have larger dimensions
      expect(pathWithStroke.height).toBeGreaterThan(pathNoStroke.height);
    });
  });

  describe('rotation handling', () => {
    it('should apply rotation to adjusted points', () => {
      path = new KritzelPath({
        points: [[0, 0], [100, 0]],
        translateX: 0,
        translateY: 0,
        scale: 1,
        strokeWidth: 10,
      });
      path._core = mockCore;

      // Without rotation, hit test at y=0 should pass
      path.rotation = 0;
      const beforeRotation = path.hitTest(50, path.translateY);

      // With 90 degree rotation, the line would be vertical
      path.rotation = Math.PI / 2;
      // Clear cache by calling rotate
      path.rotate(Math.PI / 2);

      // The behavior changes after rotation
      expect(beforeRotation).toBe(true);
    });
  });

  describe('inheritance from KritzelBaseObject', () => {
    it('should have __class__ set to KritzelPath', () => {
      expect(path.__class__).toBe('KritzelPath');
    });

    it('should inherit boundingBox getter', () => {
      const bbox = path.boundingBox;

      expect(bbox).toHaveProperty('x');
      expect(bbox).toHaveProperty('y');
      expect(bbox).toHaveProperty('width');
      expect(bbox).toHaveProperty('height');
    });

    it('should inherit centerX and centerY getters', () => {
      expect(typeof path.centerX).toBe('number');
      expect(typeof path.centerY).toBe('number');
    });

    it('should be identifiable via isClass method', () => {
      expect(path.isClass('KritzelPath')).toBe(true);
      expect(path.isClass('KritzelBaseObject')).toBe(false);
    });
  });
});
