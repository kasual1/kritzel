import { KritzelBaseObject } from '../classes/objects/base-object.class';

/** Viewport transform needed to place titlebars inside the world-space origin layer. */
export interface KritzelTitlebarViewportState {
  scale: number;
  translateX: number;
  translateY: number;
}

/** Where a titlebar is anchored, in world coordinates, and how wide it is on screen. */
export interface KritzelTitlebarAnchor {
  /** World x of the anchor (the owner's top-left corner). */
  x: number;
  /** World y of the anchor (the owner's top-left corner). */
  y: number;
  /** Titlebar width in screen pixels. */
  width: number;
  /** Rotation of the titlebar in degrees. */
  rotationDegrees: number;
}

export const KRITZEL_TITLEBAR_DEFAULT_HEIGHT = 28;
export const KRITZEL_TITLEBAR_DEFAULT_OFFSET = 6;
export const KRITZEL_TITLEBAR_DEFAULT_HIDE_BELOW_WIDTH = 40;

/**
 * Pure geometry for object titlebars. Titlebars live in a world-space layer inside the
 * engine's origin and are counter-scaled, so their content keeps a constant screen size.
 */
export class KritzelObjectTitlebarHelper {
  /**
   * Parses a pixel length such as `'28px'` or `'28'`. Other units cannot be resolved
   * without layout, so they fall back to the default.
   */
  static parsePixels(value: string | null | undefined, fallback: number): number {
    const trimmed = value?.trim() ?? '';
    if (!/^-?\d+(\.\d+)?(px)?$/.test(trimmed)) {
      return fallback;
    }
    return parseFloat(trimmed);
  }

  /**
   * Returns how far, in world units, the viewport query must be widened so titlebars of
   * objects just outside the viewport are still rendered.
   */
  static getCullingPadding(height: number, offset: number, scale: number): number {
    if (!(scale > 0)) {
      return 0;
    }
    return Math.max(0, height + offset) / scale;
  }

  /**
   * Computes the anchor of an object's titlebar.
   * In `follow` mode the bar sits on the object's rotated top edge; in `upright` mode it sits
   * unrotated on top of the object's rotated bounding box.
   */
  static getAnchor(object: KritzelBaseObject<any>, viewport: KritzelTitlebarViewportState, rotation: 'follow' | 'upright' = 'follow'): KritzelTitlebarAnchor {
    if (rotation === 'upright') {
      const box = object.rotatedBoundingBox;
      return {
        ...KritzelObjectTitlebarHelper.snapToPixel(box.x, box.y, viewport),
        width: box.width * viewport.scale,
        rotationDegrees: 0,
      };
    }

    const topLeft = object.rotatedPolygon.topLeft;
    const rotationDegrees = object.rotationDegrees;
    // Snapping a rotated anchor would shift it off the rotated edge, so only snap axis-aligned bars.
    const position = rotationDegrees % 360 === 0 ? KritzelObjectTitlebarHelper.snapToPixel(topLeft.x, topLeft.y, viewport) : topLeft;

    return {
      x: position.x,
      y: position.y,
      width: object.boundingBox.width * viewport.scale,
      rotationDegrees,
    };
  }

  /**
   * Builds the CSS transform that places a titlebar anchor in the origin layer.
   * The inverse scale cancels the viewport zoom, so one CSS pixel equals one screen pixel.
   */
  static getTransform(anchor: KritzelTitlebarAnchor, scale: number): string {
    const inverseScale = scale > 0 ? 1 / scale : 1;
    return `translate(${anchor.x}px, ${anchor.y}px) rotate(${anchor.rotationDegrees}deg) scale(${inverseScale})`;
  }

  /** Rounds a world point so it lands on a whole screen pixel, which keeps counter-scaled text crisp. */
  static snapToPixel(x: number, y: number, viewport: KritzelTitlebarViewportState): { x: number; y: number } {
    const { scale, translateX, translateY } = viewport;
    if (!(scale > 0)) {
      return { x, y };
    }
    return {
      x: (Math.round(x * scale + translateX) - translateX) / scale,
      y: (Math.round(y * scale + translateY) - translateY) / scale,
    };
  }
}
