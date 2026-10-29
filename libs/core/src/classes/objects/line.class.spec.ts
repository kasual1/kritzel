import { KritzelLine } from './line.class';
import { KritzelCore } from '../core/core.class';
import { KritzelPolygon } from '../../interfaces/polygon.interface';
import { ArrowHeadStyle } from '../../interfaces/arrow-head.interface';

// Mock geometry helper
jest.mock('../../helpers/geometry.helper', () => ({
  KritzelGeometryHelper: {
    isPointInPolygon: jest.fn((point, polygon) => {
      // Simple implementation for testing
      const minX = Math.min(...polygon.map((p: { x: number }) => p.x));
      const maxX = Math.max(...polygon.map((p: { x: number }) => p.x));
      const minY = Math.min(...polygon.map((p: { y: number }) => p.y));
      const maxY = Math.max(...polygon.map((p: { y: number }) => p.y));
      return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
    }),
    intersectLines: jest.fn(() => false),
  },
}));

describe('KritzelLine', () => {
  let line: KritzelLine;
  let mockCore: jest.Mocked<KritzelCore>;
  let mockObjectsUpdate: jest.Mock;

  const createMockCore = (): jest.Mocked<KritzelCore> => {
    const objectsUpdate = jest.fn();
    mockObjectsUpdate = objectsUpdate;

    return {
      store: {
        state: {
          scale: 1,
          translateX: 0,
          translateY: 0,
          viewportWidth: 1000,
          viewportHeight: 800,
          objects: {
            update: objectsUpdate,
          },
          activeWorkspace: {
            id: 'workspace-1',
          },
        },
        get objects() { return this.state.objects; },
        currentZIndex: 1,
        setState: jest.fn(),
      },
      anchorManager: {
        updateAnchorsForObject: jest.fn(),
      },
      rerender: jest.fn(),
      engine: {
        emitObjectsChange: jest.fn(),
        emitObjectsAdded: jest.fn(),
        emitObjectsRemoved: jest.fn(),
        emitObjectsUpdated: jest.fn(),
      },
    } as unknown as jest.Mocked<KritzelCore>;
  };

  beforeEach(() => {
    mockCore = createMockCore();
    line = KritzelLine.create(mockCore, {
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 100,
      strokeWidth: 4,
      stroke: { light: '#000000', dark: '#ffffff' },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a line with default values when no config provided', () => {
      const defaultLine = new KritzelLine();

      expect(defaultLine.startX).toBe(0);
      expect(defaultLine.startY).toBe(0);
      expect(defaultLine.endX).toBe(0);
      expect(defaultLine.endY).toBe(0);
      expect(defaultLine.strokeWidth).toBe(4);
      expect(defaultLine.stroke).toEqual({ light: '#000000', dark: '#ffffff' });
      expect(defaultLine.scale).toBe(1);
      // Note: translateX/Y are adjusted by updateDimensions() which accounts for bounding box
      expect(defaultLine.translateX).toBeDefined();
      expect(defaultLine.translateY).toBeDefined();
      expect(defaultLine.__class__).toBe('KritzelLine');
    });

    it('should create a line with provided config values', () => {
      const configuredLine = new KritzelLine({
        startX: 10,
        startY: 20,
        endX: 110,
        endY: 120,
        strokeWidth: 8,
        stroke: { light: '#ff0000', dark: '#ff0000' },
        scale: 2,
        translateX: 50,
        translateY: 60,
      });

      expect(configuredLine.startX).toBe(10);
      expect(configuredLine.startY).toBe(20);
      expect(configuredLine.endX).toBe(110);
      expect(configuredLine.endY).toBe(120);
      expect(configuredLine.strokeWidth).toBe(8);
      expect(configuredLine.stroke).toEqual({ light: '#ff0000', dark: '#ff0000' });
      expect(configuredLine.scale).toBe(2);
    });

    it('should convert constructor rotation from degrees to radians', () => {
      const configuredLine = new KritzelLine({
        startX: 10,
        startY: 20,
        endX: 110,
        endY: 120,
        rotation: -90,
      });

      expect(configuredLine.rotation).toBeCloseTo(-Math.PI / 2);
    });

    it('should create a curved line with control point', () => {
      const curvedLine = new KritzelLine({
        startX: 0,
        startY: 0,
        endX: 100,
        endY: 0,
        controlX: 50,
        controlY: -50,
        strokeWidth: 4,
        stroke: { light: '#000000', dark: '#ffffff' },
      });

      expect(curvedLine.controlX).toBe(50);
      expect(curvedLine.controlY).toBe(-50);
    });

    it('should set visibility flags', () => {
      expect(line.isVisible).toBe(true);
      expect(line.isDebugInfoVisible).toBe(true);
      expect(line.isCompleted).toBe(false);
    });

    it('should create a line with arrow configuration', () => {
      const lineWithArrows = new KritzelLine({
        startX: 0,
        startY: 0,
        endX: 100,
        endY: 100,
        strokeWidth: 4,
        stroke: { light: '#000000', dark: '#ffffff' },
        arrows: {
          start: { enabled: true, style: 'triangle' },
          end: { enabled: true, style: 'diamond' },
        },
      });

      expect(lineWithArrows.arrows?.start?.enabled).toBe(true);
      expect(lineWithArrows.arrows?.start?.style).toBe('triangle');
      expect(lineWithArrows.arrows?.end?.enabled).toBe(true);
      expect(lineWithArrows.arrows?.end?.style).toBe('diamond');
    });
  });

  describe('static create', () => {
    it('should create a line with core reference and workspace id', () => {
      const createdLine = KritzelLine.create(mockCore, {
        startX: 0,
        startY: 0,
        endX: 100,
        endY: 100,
      });

      expect(createdLine._core).toBe(mockCore);
      expect(createdLine.workspaceId).toBe('workspace-1');
      expect(createdLine.zIndex).toBe(1);
    });

    it('should generate a unique id', () => {
      const line1 = KritzelLine.create(mockCore, { startX: 0, startY: 0, endX: 100, endY: 100 });
      const line2 = KritzelLine.create(mockCore, { startX: 0, startY: 0, endX: 100, endY: 100 });

      expect(line1.id).toBeDefined();
      expect(line2.id).toBeDefined();
      expect(line1.id).not.toBe(line2.id);
    });

    it('should use default values when not provided', () => {
      const createdLine = KritzelLine.create(mockCore);

      expect(createdLine.startX).toBe(0);
      expect(createdLine.startY).toBe(0);
      expect(createdLine.endX).toBe(0);
      expect(createdLine.endY).toBe(0);
      expect(createdLine.strokeWidth).toBe(4);
      expect(createdLine.stroke).toEqual({ light: '#000000', dark: '#ffffff' });
    });

    it('should convert create rotation from degrees to radians', () => {
      const createdLine = KritzelLine.create(mockCore, {
        startX: 0,
        startY: 0,
        endX: 100,
        endY: 100,
        rotation: -90,
      });

      expect(createdLine.rotation).toBeCloseTo(-Math.PI / 2);
    });
  });

  describe('d property (SVG path)', () => {
    it('should return straight line path when no control point', () => {
      expect(line.d).toBe('M 0 0 L 100 100');
    });

    it('should return quadratic bezier path when control point is set', () => {
      const curvedLine = KritzelLine.create(mockCore, {
        startX: 0,
        startY: 0,
        endX: 100,
        endY: 0,
        controlX: 50,
        controlY: -50,
      });

      expect(curvedLine.d).toBe('M 0 0 Q 50 -50 100 0');
    });
  });

  describe('calculateBoundingBox', () => {
    it('should calculate correct bounding box for straight line', () => {
      const bbox = line.calculateBoundingBox();

      // Line from (0,0) to (100,100) with strokeWidth 4
      // halfStroke = 2
      expect(bbox.minX).toBe(-2);
      expect(bbox.minY).toBe(-2);
      expect(bbox.maxX).toBe(102);
      expect(bbox.maxY).toBe(102);
    });

    it('should calculate correct bounding box for horizontal line', () => {
      const horizontalLine = KritzelLine.create(mockCore, {
        startX: 0,
        startY: 50,
        endX: 100,
        endY: 50,
        strokeWidth: 4,
      });

      const bbox = horizontalLine.calculateBoundingBox();

      expect(bbox.minX).toBe(-2);
      expect(bbox.minY).toBe(48);
      expect(bbox.maxX).toBe(102);
      expect(bbox.maxY).toBe(52);
    });

    it('should calculate correct bounding box for curved line with extrema', () => {
      // Curve that bulges beyond its endpoints
      const curvedLine = KritzelLine.create(mockCore, {
        startX: 0,
        startY: 0,
        endX: 100,
        endY: 0,
        controlX: 50,
        controlY: -100,
        strokeWidth: 4,
      });

      const bbox = curvedLine.calculateBoundingBox();

      // The curve should extend above y=0 due to control point
      expect(bbox.minY).toBeLessThan(0);
    });

    it('should include stroke width in bounding box', () => {
      const thickLine = KritzelLine.create(mockCore, {
        startX: 0,
        startY: 0,
        endX: 100,
        endY: 0,
        strokeWidth: 20,
      });

      const bbox = thickLine.calculateBoundingBox();

      expect(bbox.minY).toBe(-10); // halfStroke = 10
      expect(bbox.maxY).toBe(10);
    });
  });

  describe('static calculateBoundingBox', () => {
    it('should calculate bounding box for straight line', () => {
      const bbox = KritzelLine.calculateBoundingBox(0, 0, 100, 100, undefined, undefined, 4);

      expect(bbox.minX).toBe(-2);
      expect(bbox.minY).toBe(-2);
      expect(bbox.maxX).toBe(102);
      expect(bbox.maxY).toBe(102);
    });

    it('should handle reversed coordinates', () => {
      const bbox = KritzelLine.calculateBoundingBox(100, 100, 0, 0, undefined, undefined, 4);

      expect(bbox.minX).toBe(-2);
      expect(bbox.minY).toBe(-2);
      expect(bbox.maxX).toBe(102);
      expect(bbox.maxY).toBe(102);
    });
  });

  describe('resize', () => {
    it('should not resize when width or height is too small', () => {
      const originalStartX = line.startX;
      const originalStartY = line.startY;

      line.resize(0, 0, 0, 100);

      expect(line.startX).toBe(originalStartX);
      expect(line.startY).toBe(originalStartY);
    });

    it('should scale line endpoints proportionally', () => {
      line.resize(0, 0, line.width * 2, line.height * 2);

      expect(mockObjectsUpdate).toHaveBeenCalled();
    });

    it('should update anchor connections after resize', () => {
      const anchorUpdateSpy = mockCore.anchorManager.updateAnchorsForObject;

      line.resize(0, 0, line.width * 2, line.height * 2);

      expect(anchorUpdateSpy).toHaveBeenCalled();
    });

    it('should handle resize with anchors', () => {
      line.startAnchor = { objectId: 'anchor-obj-1' };
      line.endAnchor = { objectId: 'anchor-obj-2' };

      line.resize(0, 0, line.width * 2, line.height * 2);

      expect(mockCore.anchorManager.updateAnchorsForObject).toHaveBeenCalledWith('anchor-obj-1');
      expect(mockCore.anchorManager.updateAnchorsForObject).toHaveBeenCalledWith('anchor-obj-2');
    });
  });

  describe('rotate', () => {
    it('should set rotation value', () => {
      line.rotate(Math.PI / 4);

      expect(line.rotation).toBe(Math.PI / 4);
      expect(mockObjectsUpdate).toHaveBeenCalled();
    });

    it('should clear adjusted points cache', () => {
      // Access hitTest to populate cache
      line.hitTest(50, 50);

      line.rotate(Math.PI / 2);

      // Internal cache should be cleared
      expect(mockObjectsUpdate).toHaveBeenCalled();
    });
  });

  describe('move', () => {
    it('should update translate values based on delta', () => {
      const originalTranslateX = line.translateX;
      const originalTranslateY = line.translateY;

      line.move(100, 100, 50, 50);

      expect(line.translateX).toBe(originalTranslateX + 50);
      expect(line.translateY).toBe(originalTranslateY + 50);
      expect(mockObjectsUpdate).toHaveBeenCalled();
    });

    it('should update anchors when line has start anchor', () => {
      line.startAnchor = { objectId: 'anchor-obj-1' };

      line.move(100, 100, 50, 50);

      expect(mockCore.anchorManager.updateAnchorsForObject).toHaveBeenCalledWith('anchor-obj-1');
    });

    it('should update anchors when line has end anchor', () => {
      line.endAnchor = { objectId: 'anchor-obj-2' };

      line.move(100, 100, 50, 50);

      expect(mockCore.anchorManager.updateAnchorsForObject).toHaveBeenCalledWith('anchor-obj-2');
    });

    it('should account for scale when calculating delta', () => {
      mockCore.store.state.scale = 2;
      const originalTranslateX = line.translateX;

      line.move(100, 100, 50, 50);

      // Delta should be halved due to scale = 2
      expect(line.translateX).toBe(originalTranslateX + 25);
    });
  });

  describe('hitTest', () => {
    it('should return true for point on the line', () => {
      expect(line.hitTest(50, 50)).toBe(true);
    });

    it('should return true for point near the line within stroke threshold', () => {
      // Point slightly off the diagonal line
      expect(line.hitTest(50, 52)).toBe(true);
    });

    it('should return false for point far from the line', () => {
      expect(line.hitTest(200, 0)).toBe(false);
    });

    it('should use minimum hit threshold for thin lines', () => {
      const thinLine = KritzelLine.create(mockCore, {
        startX: 0,
        startY: 0,
        endX: 100,
        endY: 0,
        strokeWidth: 1,
      });

      // Even with thin stroke, should have minimum hit area
      expect(thinLine.hitTest(50, 8)).toBe(true);
    });

    it('should handle curved lines', () => {
      const curvedLine = KritzelLine.create(mockCore, {
        startX: 0,
        startY: 0,
        endX: 100,
        endY: 0,
        controlX: 50,
        controlY: -50,
        strokeWidth: 4,
      });

      // Point on the curve apex should hit
      expect(curvedLine.hitTest(50, -25)).toBe(true);
    });
  });

  describe('hitTestPolygon', () => {
    it('should return true when polygon contains line endpoint', () => {
      const polygon: KritzelPolygon = {
        topLeft: { x: 0, y: 0 },
        topRight: { x: 50, y: 0 },
        bottomRight: { x: 50, y: 50 },
        bottomLeft: { x: 0, y: 50 },
      };

      expect(line.hitTestPolygon(polygon)).toBe(true);
    });

    it('should return false when polygon is far from line', () => {
      const polygon: KritzelPolygon = {
        topLeft: { x: 500, y: 500 },
        topRight: { x: 600, y: 500 },
        bottomRight: { x: 600, y: 600 },
        bottomLeft: { x: 500, y: 600 },
      };

      expect(line.hitTestPolygon(polygon)).toBe(false);
    });
  });

  describe('updatePosition', () => {
    it('should update translate values', () => {
      line.updatePosition(50, 60);

      expect(line.translateX).toBe(50);
      expect(line.translateY).toBe(60);
      expect(mockObjectsUpdate).toHaveBeenCalled();
    });

    it('should clear adjusted points cache', () => {
      line.updatePosition(50, 60);

      expect(mockObjectsUpdate).toHaveBeenCalled();
    });
  });

  describe('updateEndpoint', () => {
    it('should update start endpoint', () => {
      line.updateEndpoint('start', 10, 20);

      expect(line.startX).toBe(10);
      expect(line.startY).toBe(20);
      expect(mockObjectsUpdate).toHaveBeenCalled();
    });

    it('should update end endpoint', () => {
      line.updateEndpoint('end', 150, 160);

      expect(line.endX).toBe(150);
      expect(line.endY).toBe(160);
      expect(mockObjectsUpdate).toHaveBeenCalled();
    });

    it('should recalculate bounding box after updating endpoint', () => {
      const originalWidth = line.width;
      const originalHeight = line.height;

      line.updateEndpoint('end', 200, 200);

      expect(line.width).not.toBe(originalWidth);
      expect(line.height).not.toBe(originalHeight);
    });
  });

  describe('updateControlPoint', () => {
    it('should set control point for straight line', () => {
      line.updateControlPoint(50, -50);

      expect(line.controlX).toBe(50);
      expect(line.controlY).toBe(-50);
      expect(mockObjectsUpdate).toHaveBeenCalled();
    });

    it('should update control point on curved line', () => {
      const curvedLine = KritzelLine.create(mockCore, {
        startX: 0,
        startY: 0,
        endX: 100,
        endY: 0,
        controlX: 50,
        controlY: -50,
      });

      curvedLine.updateControlPoint(50, -100);

      expect(curvedLine.controlY).toBe(-100);
    });

    it('should clear control point when undefined', () => {
      const curvedLine = KritzelLine.create(mockCore, {
        startX: 0,
        startY: 0,
        endX: 100,
        endY: 0,
        controlX: 50,
        controlY: -50,
      });

      curvedLine.updateControlPoint(undefined, undefined);

      expect(curvedLine.controlX).toBeUndefined();
      expect(curvedLine.controlY).toBeUndefined();
    });

    it('should recalculate bounding box', () => {
      const originalMinY = line.y;

      line.updateControlPoint(50, -100);

      // Bounding box should now include the control point region
      expect(line.y).toBeLessThan(originalMinY);
    });
  });

  describe('rotatedPolygon', () => {
    it('should return polygon with transformed corners', () => {
      const polygon = line.rotatedPolygon;

      expect(polygon.topLeft).toBeDefined();
      expect(polygon.topRight).toBeDefined();
      expect(polygon.bottomLeft).toBeDefined();
      expect(polygon.bottomRight).toBeDefined();
    });

    it('should apply rotation to polygon corners', () => {
      line.rotation = Math.PI / 2;

      const polygon = line.rotatedPolygon;

      // After 90 degree rotation, the polygon should be transformed
      expect(polygon.topLeft).toBeDefined();
    });
  });

  describe('arrow properties', () => {
    describe('startMarkerId', () => {
      it('should return unique marker id based on line id', () => {
        expect(line.startMarkerId).toBe(`arrow-start-${line.id}`);
      });
    });

    describe('endMarkerId', () => {
      it('should return unique marker id based on line id', () => {
        expect(line.endMarkerId).toBe(`arrow-end-${line.id}`);
      });
    });

    describe('getArrowSize', () => {
      it('should return default size based on strokeWidth', () => {
        expect(line.getArrowSize('start')).toBe(line.strokeWidth * 3);
        expect(line.getArrowSize('end')).toBe(line.strokeWidth * 3);
      });

      it('should return custom size when configured', () => {
        const lineWithArrows = KritzelLine.create(mockCore, {
          startX: 0,
          startY: 0,
          endX: 100,
          endY: 100,
          strokeWidth: 4,
          arrows: {
            start: { enabled: true, size: 20 },
            end: { enabled: true, size: 30 },
          },
        });

        expect(lineWithArrows.getArrowSize('start')).toBe(20);
        expect(lineWithArrows.getArrowSize('end')).toBe(30);
      });
    });

    describe('getArrowFill', () => {
      it('should return stroke color by default', () => {
        expect(line.getArrowFill('start')).toBe('#000000');
        expect(line.getArrowFill('end')).toBe('#000000');
      });

      it('should return custom fill when configured', () => {
        const lineWithArrows = KritzelLine.create(mockCore, {
          startX: 0,
          startY: 0,
          endX: 100,
          endY: 100,
          stroke: { light: '#000000', dark: '#ffffff' },
          arrows: {
            start: { enabled: true, fill: { light: '#ff0000', dark: '#ff0000' } },
            end: { enabled: true, fill: { light: '#00ff00', dark: '#00ff00' } },
          },
        });

        expect(lineWithArrows.getArrowFill('start')).toBe('#ff0000');
        expect(lineWithArrows.getArrowFill('end')).toBe('#00ff00');
      });
    });

    describe('getArrowPath', () => {
      it('should return triangle path by default', () => {
        expect(line.getArrowPath()).toBe('M 0 0 L 10 5 L 0 10 z');
      });

      it('should return correct path for each style', () => {
        const styles: ArrowHeadStyle[] = ['triangle', 'open', 'diamond', 'circle'];
        const expectedPaths: Record<ArrowHeadStyle, string> = {
          triangle: 'M 0 0 L 10 5 L 0 10 z',
          open: 'M 0 0 L 10 5 L 0 10',
          diamond: 'M 0 5 L 5 0 L 10 5 L 5 10 z',
          circle: 'M 5,0 A 5,5 0 1,1 5,10 A 5,5 0 1,1 5,0',
        };

        for (const style of styles) {
          expect(line.getArrowPath(style)).toBe(expectedPaths[style]);
        }
      });
    });

    describe('hasStartArrow', () => {
      it('should return false when no arrows configured', () => {
        expect(line.hasStartArrow).toBe(false);
      });

      it('should return true when start arrow is enabled', () => {
        const lineWithArrow = KritzelLine.create(mockCore, {
          startX: 0,
          startY: 0,
          endX: 100,
          endY: 100,
          arrows: {
            start: { enabled: true },
          },
        });

        expect(lineWithArrow.hasStartArrow).toBe(true);
      });

      it('should return false when start arrow is disabled', () => {
        const lineWithArrow = KritzelLine.create(mockCore, {
          startX: 0,
          startY: 0,
          endX: 100,
          endY: 100,
          arrows: {
            start: { enabled: false },
          },
        });

        expect(lineWithArrow.hasStartArrow).toBe(false);
      });
    });

    describe('hasEndArrow', () => {
      it('should return false when no arrows configured', () => {
        expect(line.hasEndArrow).toBe(false);
      });

      it('should return true when end arrow is enabled', () => {
        const lineWithArrow = KritzelLine.create(mockCore, {
          startX: 0,
          startY: 0,
          endX: 100,
          endY: 100,
          arrows: {
            end: { enabled: true },
          },
        });

        expect(lineWithArrow.hasEndArrow).toBe(true);
      });
    });
  });

  describe('viewBox property', () => {
    it('should return correct viewBox string', () => {
      expect(line.viewBox).toBe(`${line.x} ${line.y} ${line.width} ${line.height}`);
    });
  });

  describe('edge cases', () => {
    it('should handle zero-length line', () => {
      const zeroLine = KritzelLine.create(mockCore, {
        startX: 50,
        startY: 50,
        endX: 50,
        endY: 50,
        strokeWidth: 4,
      });

      expect(zeroLine.width).toBe(4); // Just stroke width
      expect(zeroLine.height).toBe(4);
    });

    it('should handle negative coordinates', () => {
      const negativeLine = KritzelLine.create(mockCore, {
        startX: -100,
        startY: -100,
        endX: 100,
        endY: 100,
        strokeWidth: 4,
      });

      expect(negativeLine.startX).toBe(-100);
      expect(negativeLine.startY).toBe(-100);
      expect(negativeLine.calculateBoundingBox().minX).toBe(-102);
    });

    it('should handle very large coordinates', () => {
      const largeLine = KritzelLine.create(mockCore, {
        startX: 0,
        startY: 0,
        endX: 10000,
        endY: 10000,
        strokeWidth: 4,
      });

      const bbox = largeLine.calculateBoundingBox();

      expect(bbox.maxX).toBe(10002);
      expect(bbox.maxY).toBe(10002);
    });

    it('should handle fractional coordinates', () => {
      const fractionalLine = KritzelLine.create(mockCore, {
        startX: 0.5,
        startY: 0.5,
        endX: 100.5,
        endY: 100.5,
        strokeWidth: 4,
      });

      expect(fractionalLine.startX).toBe(0.5);
      expect(fractionalLine.endX).toBe(100.5);
    });
  });

  describe('serialization cache behavior', () => {
    it('should omit transient caches from serialized output', () => {
      const linePrivate = line as unknown as {
        _adjustedPoints: number[][] | null;
        _clipInfo: { start?: { x: number; y: number; t?: number }; end?: { x: number; y: number; t?: number } } | null;
      };
      linePrivate._adjustedPoints = [[1, 2], [3, 4]];
      linePrivate._clipInfo = { start: { x: 10, y: 20, t: 0.1 } };

      const serialized = line.serialize() as Record<string, unknown>;

      expect(serialized._adjustedPoints).toBeUndefined();
      expect(serialized._clipInfo).toBeUndefined();
    });

    it('should reset caches to null after deserialize', () => {
      const serialized = line.serialize();
      const revived = KritzelLine.create(mockCore).deserialize<KritzelLine>(serialized);
      const revivedPrivate = revived as unknown as {
        _adjustedPoints: number[][] | null;
        _clipInfo: { start?: { x: number; y: number; t?: number }; end?: { x: number; y: number; t?: number } } | null;
      };

      expect(revivedPrivate._adjustedPoints).toBeNull();
      expect(revivedPrivate._clipInfo).toBeNull();
    });
  });
});
