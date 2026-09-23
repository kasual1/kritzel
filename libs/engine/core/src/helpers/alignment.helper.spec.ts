import { AlignmentHelper } from './alignment.helper';
import { KritzelAlignment } from '../enums/alignment.enum';
import { KritzelBaseObject } from '../classes/objects/base-object.class';
import { KritzelBoundingBox } from '../interfaces/bounding-box.interface';

describe('AlignmentHelper', () => {
  const createMockObject = (
    id: string,
    translateX: number,
    translateY: number,
    rotatedBoundingBox: KritzelBoundingBox
  ): Partial<KritzelBaseObject> => ({
    id,
    translateX,
    translateY,
    get rotatedBoundingBox() {
      return rotatedBoundingBox;
    },
  });

  describe('calculateAlignedPositions', () => {
    it('should return empty map when less than 2 objects', () => {
      const objects = [
        createMockObject('obj1', 0, 0, { x: 0, y: 0, z: 1, width: 100, height: 50 }),
      ] as KritzelBaseObject[];

      const result = AlignmentHelper.calculateAlignedPositions(objects, KritzelAlignment.StartHorizontal);

      expect(result.size).toBe(0);
    });

    it('should return empty map when no objects provided', () => {
      const result = AlignmentHelper.calculateAlignedPositions([], KritzelAlignment.CenterHorizontal);

      expect(result.size).toBe(0);
    });

    describe('StartHorizontal (align left)', () => {
      it('should align all objects to the left edge of the selection', () => {
        const objects = [
          createMockObject('obj1', 20, 10, { x: 20, y: 10, z: 1, width: 100, height: 50 }),
          createMockObject('obj2', 100, 50, { x: 100, y: 50, z: 1, width: 80, height: 60 }),
          createMockObject('obj3', 60, 30, { x: 60, y: 30, z: 1, width: 120, height: 40 }),
        ] as KritzelBaseObject[];

        const result = AlignmentHelper.calculateAlignedPositions(objects, KritzelAlignment.StartHorizontal);

        // Selection left edge is at x=20 (min of all x values)
        expect(result.get('obj1')?.translateX).toBe(20); // Already at left
        expect(result.get('obj2')?.translateX).toBe(20); // Moved left from 100
        expect(result.get('obj3')?.translateX).toBe(20); // Moved left from 60
      });
    });

    describe('EndHorizontal (align right)', () => {
      it('should align all objects to the right edge of the selection', () => {
        const objects = [
          createMockObject('obj1', 10, 20, { x: 10, y: 20, z: 1, width: 100, height: 50 }),
          createMockObject('obj2', 100, 50, { x: 100, y: 50, z: 1, width: 80, height: 60 }),
        ] as KritzelBaseObject[];

        const result = AlignmentHelper.calculateAlignedPositions(objects, KritzelAlignment.EndHorizontal);

        // Selection right edge is at x=180 (100 + 80)
        // obj1 right should be at 180, so translateX = 180 - 100 = 80
        expect(result.get('obj1')?.translateX).toBe(80);
        // obj2 is already at right edge (100 + 80 = 180)
        expect(result.get('obj2')?.translateX).toBe(100);
      });
    });

    describe('CenterHorizontal (align center horizontally)', () => {
      it('should align all objects to the horizontal center of the selection', () => {
        const objects = [
          createMockObject('obj1', 0, 10, { x: 0, y: 10, z: 1, width: 40, height: 50 }),
          createMockObject('obj2', 60, 50, { x: 60, y: 50, z: 1, width: 40, height: 60 }),
        ] as KritzelBaseObject[];

        const result = AlignmentHelper.calculateAlignedPositions(objects, KritzelAlignment.CenterHorizontal);

        // Selection: minX=0, maxX=100 (60+40), centerX=50
        // obj1 center at x=20 (0 + 40/2), should move to 50, so translateX = 30
        expect(result.get('obj1')?.translateX).toBe(30);
        // obj2 center at x=80 (60 + 40/2), should move to 50, so translateX = 30
        expect(result.get('obj2')?.translateX).toBe(30);
      });
    });

    describe('StartVertical (align top)', () => {
      it('should align all objects to the top edge of the selection', () => {
        const objects = [
          createMockObject('obj1', 10, 20, { x: 10, y: 20, z: 1, width: 100, height: 50 }),
          createMockObject('obj2', 50, 100, { x: 50, y: 100, z: 1, width: 80, height: 60 }),
          createMockObject('obj3', 30, 60, { x: 30, y: 60, z: 1, width: 120, height: 40 }),
        ] as KritzelBaseObject[];

        const result = AlignmentHelper.calculateAlignedPositions(objects, KritzelAlignment.StartVertical);

        // Selection top edge is at y=20 (min of all y values)
        expect(result.get('obj1')?.translateY).toBe(20); // Already at top
        expect(result.get('obj2')?.translateY).toBe(20); // Moved up from 100
        expect(result.get('obj3')?.translateY).toBe(20); // Moved up from 60
      });
    });

    describe('EndVertical (align bottom)', () => {
      it('should align all objects to the bottom edge of the selection', () => {
        const objects = [
          createMockObject('obj1', 10, 20, { x: 10, y: 20, z: 1, width: 100, height: 50 }),
          createMockObject('obj2', 50, 100, { x: 50, y: 100, z: 1, width: 80, height: 60 }),
        ] as KritzelBaseObject[];

        const result = AlignmentHelper.calculateAlignedPositions(objects, KritzelAlignment.EndVertical);

        // Selection bottom edge is at y=160 (100 + 60)
        // obj1 bottom should be at 160, so translateY = 160 - 50 = 110
        expect(result.get('obj1')?.translateY).toBe(110);
        // obj2 is already at bottom (100 + 60 = 160)
        expect(result.get('obj2')?.translateY).toBe(100);
      });
    });

    describe('CenterVertical (align center vertically)', () => {
      it('should align all objects to the vertical center of the selection', () => {
        const objects = [
          createMockObject('obj1', 10, 0, { x: 10, y: 0, z: 1, width: 100, height: 40 }),
          createMockObject('obj2', 50, 60, { x: 50, y: 60, z: 1, width: 80, height: 40 }),
        ] as KritzelBaseObject[];

        const result = AlignmentHelper.calculateAlignedPositions(objects, KritzelAlignment.CenterVertical);

        // Selection: minY=0, maxY=100 (60+40), centerY=50
        // obj1 center at y=20 (0 + 40/2), should move to 50, so translateY = 30
        expect(result.get('obj1')?.translateY).toBe(30);
        // obj2 center at y=80 (60 + 40/2), should move to 50, so translateY = 30
        expect(result.get('obj2')?.translateY).toBe(30);
      });
    });

    describe('with rotated objects (offset between translateX/Y and bounding box)', () => {
      it('should correctly handle objects where rotatedBoundingBox differs from translateX/Y', () => {
        // Simulate a rotated object where the bounding box position differs from translateX/Y
        const objects = [
          createMockObject('obj1', 10, 10, { x: 5, y: 5, z: 1, width: 30, height: 30 }),
          createMockObject('obj2', 100, 100, { x: 95, y: 95, z: 1, width: 30, height: 30 }),
        ] as KritzelBaseObject[];

        const result = AlignmentHelper.calculateAlignedPositions(objects, KritzelAlignment.StartHorizontal);

        // Selection left edge is at x=5
        // obj1: offset = 5 - 10 = -5, newTranslateX = 5 - (-5) = 10 (unchanged)
        expect(result.get('obj1')?.translateX).toBe(10);
        // obj2: offset = 95 - 100 = -5, newTranslateX = 5 - (-5) = 10
        expect(result.get('obj2')?.translateX).toBe(10);
      });
    });

    it('should not modify the opposite axis when aligning horizontally', () => {
      const objects = [
        createMockObject('obj1', 10, 20, { x: 10, y: 20, z: 1, width: 100, height: 50 }),
        createMockObject('obj2', 50, 100, { x: 50, y: 100, z: 1, width: 80, height: 60 }),
      ] as KritzelBaseObject[];

      const result = AlignmentHelper.calculateAlignedPositions(objects, KritzelAlignment.StartHorizontal);

      // Y values should remain unchanged
      expect(result.get('obj1')?.translateY).toBe(20);
      expect(result.get('obj2')?.translateY).toBe(100);
    });

    it('should not modify the opposite axis when aligning vertically', () => {
      const objects = [
        createMockObject('obj1', 10, 20, { x: 10, y: 20, z: 1, width: 100, height: 50 }),
        createMockObject('obj2', 50, 100, { x: 50, y: 100, z: 1, width: 80, height: 60 }),
      ] as KritzelBaseObject[];

      const result = AlignmentHelper.calculateAlignedPositions(objects, KritzelAlignment.StartVertical);

      // X values should remain unchanged
      expect(result.get('obj1')?.translateX).toBe(10);
      expect(result.get('obj2')?.translateX).toBe(50);
    });
  });
});
