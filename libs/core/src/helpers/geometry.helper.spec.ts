import { UpdrawGeometryHelper } from './geometry.helper';
import { UpdrawPolygon } from '../interfaces/polygon.interface';
import { UpdrawPoint } from '../interfaces/point.interface';

describe('UpdrawGeometryHelper', () => {
  // Test cases for intersectLines
  describe('intersectLines', () => {
    it('should return true for intersecting lines', () => {
      const p1a = { x: 0, y: 0 };
      const p1b = { x: 10, y: 10 };
      const p2a = { x: 0, y: 10 };
      const p2b = { x: 10, y: 0 };
      expect(UpdrawGeometryHelper.intersectLines(p1a, p1b, p2a, p2b)).toBe(true);
    });

    it('should return false for non-intersecting lines', () => {
      const p1a = { x: 0, y: 0 };
      const p1b = { x: 1, y: 1 };
      const p2a = { x: 2, y: 2 };
      const p2b = { x: 3, y: 3 };
      expect(UpdrawGeometryHelper.intersectLines(p1a, p1b, p2a, p2b)).toBe(false);
    });

    it('should return false for parallel lines', () => {
      const p1a = { x: 0, y: 0 };
      const p1b = { x: 10, y: 0 };
      const p2a = { x: 0, y: 5 };
      const p2b = { x: 10, y: 5 };
      expect(UpdrawGeometryHelper.intersectLines(p1a, p1b, p2a, p2b)).toBe(false);
    });
  });

  // Test cases for isPointInPolygon
  describe('isPointInPolygon', () => {
    const square: UpdrawPoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];

    it('should return true for a point inside the polygon', () => {
      const point = { x: 5, y: 5 };
      expect(UpdrawGeometryHelper.isPointInPolygon(point, square)).toBe(true);
    });

    it('should return false for a point outside the polygon', () => {
      const point = { x: 15, y: 15 };
      expect(UpdrawGeometryHelper.isPointInPolygon(point, square)).toBe(false);
    });

    it('should return false for a point on an edge (considered outside)', () => {
      const point = { x: 5, y: 10 };
      expect(UpdrawGeometryHelper.isPointInPolygon(point, square)).toBe(false);
    });
  });

  // Test cases for doPolygonsIntersect
  describe('doPolygonsIntersect', () => {
    const poly1: UpdrawPolygon = {
      bottomLeft: { x: 0, y: 0 },
      bottomRight: { x: 10, y: 0 },
      topLeft: { x: 0, y: 10 },
      topRight: { x: 10, y: 10 },
    };

    it('should return true for overlapping polygons', () => {
      const poly2: UpdrawPolygon = {
        bottomLeft: { x: 5, y: 5 },
        bottomRight: { x: 15, y: 5 },
        topLeft: { x: 5, y: 15 },
        topRight: { x: 15, y: 15 },
      };
      expect(UpdrawGeometryHelper.doPolygonsIntersect(poly1, poly2)).toBe(true);
    });

    it('should return false for non-overlapping polygons', () => {
      const poly2: UpdrawPolygon = {
        bottomLeft: { x: 20, y: 20 },
        bottomRight: { x: 30, y: 20 },
        topLeft: { x: 20, y: 30 },
        topRight: { x: 30, y: 30 },
      };
      expect(UpdrawGeometryHelper.doPolygonsIntersect(poly1, poly2)).toBe(false);
    });

    it('should return true when one polygon is completely inside another', () => {
      const poly2: UpdrawPolygon = {
        bottomLeft: { x: 2, y: 2 },
        bottomRight: { x: 8, y: 2 },
        topLeft: { x: 2, y: 8 },
        topRight: { x: 8, y: 8 },
      };
      expect(UpdrawGeometryHelper.doPolygonsIntersect(poly1, poly2)).toBe(true);
    });

    it('should return true for polygons that touch at an edge', () => {
        const poly2: UpdrawPolygon = {
            bottomLeft: { x: 10, y: 0 },
            bottomRight: { x: 20, y: 0 },
            topLeft: { x: 10, y: 10 },
            topRight: { x: 20, y: 10 },
        };
        expect(UpdrawGeometryHelper.doPolygonsIntersect(poly1, poly2)).toBe(true);
    });
  });

  describe('getLineIntersectionPoint', () => {
    it('should return intersection point for crossing lines', () => {
      const p1a = { x: 0, y: 0 };
      const p1b = { x: 10, y: 10 };
      const p2a = { x: 0, y: 10 };
      const p2b = { x: 10, y: 0 };
      const result = UpdrawGeometryHelper.getLineIntersectionPoint(p1a, p1b, p2a, p2b);
      expect(result).not.toBeNull();
      expect(result?.x).toBeCloseTo(5);
      expect(result?.y).toBeCloseTo(5);
    });

    it('should return null for non-intersecting lines', () => {
      const p1a = { x: 0, y: 0 };
      const p1b = { x: 1, y: 1 };
      const p2a = { x: 2, y: 2 };
      const p2b = { x: 3, y: 3 };
      expect(UpdrawGeometryHelper.getLineIntersectionPoint(p1a, p1b, p2a, p2b)).toBeNull();
    });

    it('should return null for parallel lines', () => {
      const p1a = { x: 0, y: 0 };
      const p1b = { x: 10, y: 0 };
      const p2a = { x: 0, y: 5 };
      const p2b = { x: 10, y: 5 };
      expect(UpdrawGeometryHelper.getLineIntersectionPoint(p1a, p1b, p2a, p2b)).toBeNull();
    });
  });

  describe('getLinePolygonIntersection', () => {
    const square: UpdrawPolygon = {
      topLeft: { x: 0, y: 0 },
      topRight: { x: 10, y: 0 },
      bottomRight: { x: 10, y: 10 },
      bottomLeft: { x: 0, y: 10 },
    };

    it('should return intersection point when line crosses polygon', () => {
      const lineStart = { x: -5, y: 5 };
      const lineEnd = { x: 5, y: 5 };
      const result = UpdrawGeometryHelper.getLinePolygonIntersection(lineStart, lineEnd, square);
      expect(result).not.toBeNull();
      expect(result?.x).toBeCloseTo(0);
      expect(result?.y).toBeCloseTo(5);
    });

    it('should return closest intersection when line crosses multiple edges', () => {
      const lineStart = { x: -5, y: 5 };
      const lineEnd = { x: 15, y: 5 };
      const result = UpdrawGeometryHelper.getLinePolygonIntersection(lineStart, lineEnd, square);
      expect(result).not.toBeNull();
      // Should return the intersection closest to lineStart (left edge at x=0)
      expect(result?.x).toBeCloseTo(0);
      expect(result?.y).toBeCloseTo(5);
    });

    it('should return null when line does not intersect polygon', () => {
      const lineStart = { x: -5, y: -5 };
      const lineEnd = { x: -2, y: -2 };
      const result = UpdrawGeometryHelper.getLinePolygonIntersection(lineStart, lineEnd, square);
      expect(result).toBeNull();
    });

    it('should find intersection from inside polygon to center', () => {
      // Line from outside going to center
      const lineStart = { x: -5, y: 5 };
      const lineEnd = { x: 5, y: 5 }; // center of square
      const result = UpdrawGeometryHelper.getLinePolygonIntersection(lineStart, lineEnd, square);
      expect(result).not.toBeNull();
      expect(result?.x).toBeCloseTo(0);
      expect(result?.y).toBeCloseTo(5);
    });
  });
});
