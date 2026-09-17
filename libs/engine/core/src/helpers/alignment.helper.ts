import { KritzelBaseObject } from '../classes/objects/base-object.class';
import { KritzelAlignment } from '../enums/alignment.enum';

/**
 * Helper class for aligning objects within a selection group.
 */
export class AlignmentHelper {
  /**
   * Calculates the selection bounds from all objects' rotated bounding boxes.
   */
  private static calculateSelectionBounds(objects: KritzelBaseObject[]): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } {
    const bounds = objects.map(obj => obj.rotatedBoundingBox);

    return {
      minX: Math.min(...bounds.map(b => b.x)),
      minY: Math.min(...bounds.map(b => b.y)),
      maxX: Math.max(...bounds.map(b => b.x + b.width)),
      maxY: Math.max(...bounds.map(b => b.y + b.height)),
    };
  }

  /**
   * Calculates the new translate positions for each object based on the alignment type.
   * @param objects The objects to align
   * @param alignment The alignment type
   * @returns A map of object IDs to their new translateX and translateY values
   */
  static calculateAlignedPositions(
    objects: KritzelBaseObject[],
    alignment: KritzelAlignment
  ): Map<string, { translateX: number; translateY: number }> {
    const result = new Map<string, { translateX: number; translateY: number }>();

    if (objects.length < 2) {
      return result;
    }

    const selectionBounds = this.calculateSelectionBounds(objects);

    for (const obj of objects) {
      const objBounds = obj.rotatedBoundingBox;
      let newTranslateX = obj.translateX;
      let newTranslateY = obj.translateY;

      // Calculate the offset between the object's translateX/Y and its rotated bounding box position
      const offsetX = objBounds.x - obj.translateX;
      const offsetY = objBounds.y - obj.translateY;

      switch (alignment) {
        case KritzelAlignment.StartHorizontal:
          // Align left edges to selection's left edge
          newTranslateX = selectionBounds.minX - offsetX;
          break;

        case KritzelAlignment.CenterHorizontal:
          // Align centers horizontally
          const selectionCenterX = (selectionBounds.minX + selectionBounds.maxX) / 2;
          const objCenterX = objBounds.x + objBounds.width / 2;
          newTranslateX = obj.translateX + (selectionCenterX - objCenterX);
          break;

        case KritzelAlignment.EndHorizontal:
          // Align right edges to selection's right edge
          const objRightEdge = objBounds.x + objBounds.width;
          newTranslateX = obj.translateX + (selectionBounds.maxX - objRightEdge);
          break;

        case KritzelAlignment.StartVertical:
          // Align top edges to selection's top edge
          newTranslateY = selectionBounds.minY - offsetY;
          break;

        case KritzelAlignment.CenterVertical:
          // Align centers vertically
          const selectionCenterY = (selectionBounds.minY + selectionBounds.maxY) / 2;
          const objCenterY = objBounds.y + objBounds.height / 2;
          newTranslateY = obj.translateY + (selectionCenterY - objCenterY);
          break;

        case KritzelAlignment.EndVertical:
          // Align bottom edges to selection's bottom edge
          const objBottomEdge = objBounds.y + objBounds.height;
          newTranslateY = obj.translateY + (selectionBounds.maxY - objBottomEdge);
          break;
      }

      result.set(obj.id, { translateX: newTranslateX, translateY: newTranslateY });
    }

    return result;
  }
}
