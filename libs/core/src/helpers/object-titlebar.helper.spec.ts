import { KritzelObjectTitlebarHelper } from './object-titlebar.helper';
import { KritzelBaseObject } from '../classes/objects/base-object.class';

describe('KritzelObjectTitlebarHelper', () => {
  const createObject = (props: Partial<KritzelBaseObject<any>> = {}): KritzelBaseObject<any> => {
    const object = Object.create(KritzelBaseObject.prototype) as KritzelBaseObject<any>;
    return Object.assign(object, {
      translateX: 100,
      translateY: 50,
      width: 200,
      height: 80,
      padding: 0,
      scale: 1,
      rotation: 0,
      ...props,
    });
  };

  describe('parsePixels', () => {
    it('parses pixel values and unitless numbers', () => {
      expect(KritzelObjectTitlebarHelper.parsePixels('28px', 0)).toBe(28);
      expect(KritzelObjectTitlebarHelper.parsePixels(' 6.5px ', 0)).toBe(6.5);
      expect(KritzelObjectTitlebarHelper.parsePixels('12', 0)).toBe(12);
    });

    it('falls back for other units, expressions and empty values', () => {
      expect(KritzelObjectTitlebarHelper.parsePixels('2rem', 28)).toBe(28);
      expect(KritzelObjectTitlebarHelper.parsePixels('calc(10px + 2px)', 28)).toBe(28);
      expect(KritzelObjectTitlebarHelper.parsePixels('', 6)).toBe(6);
      expect(KritzelObjectTitlebarHelper.parsePixels(undefined, 6)).toBe(6);
    });
  });

  describe('getCullingPadding', () => {
    it('converts the titlebar band to world units', () => {
      expect(KritzelObjectTitlebarHelper.getCullingPadding(28, 6, 1)).toBe(34);
      expect(KritzelObjectTitlebarHelper.getCullingPadding(28, 6, 2)).toBe(17);
      expect(KritzelObjectTitlebarHelper.getCullingPadding(28, 6, 0.5)).toBe(68);
    });

    it('returns 0 for an invalid scale', () => {
      expect(KritzelObjectTitlebarHelper.getCullingPadding(28, 6, 0)).toBe(0);
    });
  });

  describe('getAnchor', () => {
    it.each([0.25, 1, 4])('anchors an unrotated object on its top-left corner at scale %s', scale => {
      const anchor = KritzelObjectTitlebarHelper.getAnchor(createObject(), { scale, translateX: 0, translateY: 0 });

      // Snapping to whole screen pixels moves the anchor by at most half a screen pixel.
      expect(Math.abs(anchor.x - 100)).toBeLessThanOrEqual(0.5 / scale);
      expect(Math.abs(anchor.y - 50)).toBeLessThanOrEqual(0.5 / scale);
      expect(anchor.width).toBeCloseTo(200 * scale);
      expect(anchor.rotationDegrees).toBe(0);
    });

    it('uses the world width of objects created at another scale', () => {
      // Created at zoom 2, so its 200 local pixels span 100 world units; viewed at zoom 0.5.
      const anchor = KritzelObjectTitlebarHelper.getAnchor(createObject({ scale: 2 }), { scale: 0.5, translateX: 0, translateY: 0 });

      expect(anchor.width).toBeCloseTo(50);
    });

    it('follows the rotated top edge by default', () => {
      const object = createObject({ rotation: Math.PI / 2 });
      const anchor = KritzelObjectTitlebarHelper.getAnchor(object, { scale: 1, translateX: 0, translateY: 0 });

      expect(anchor.x).toBeCloseTo(object.rotatedPolygon.topLeft.x);
      expect(anchor.y).toBeCloseTo(object.rotatedPolygon.topLeft.y);
      expect(anchor.rotationDegrees).toBeCloseTo(90);
      expect(anchor.width).toBeCloseTo(200);
    });

    it('stays upright above the rotated bounding box in upright mode', () => {
      const object = createObject({ rotation: Math.PI / 2 });
      const box = object.rotatedBoundingBox;
      const anchor = KritzelObjectTitlebarHelper.getAnchor(object, { scale: 1, translateX: 0, translateY: 0 }, 'upright');

      expect(anchor.x).toBeCloseTo(box.x);
      expect(anchor.y).toBeCloseTo(box.y);
      expect(anchor.width).toBeCloseTo(box.width);
      expect(anchor.rotationDegrees).toBe(0);
    });

    it('snaps axis-aligned anchors to whole screen pixels', () => {
      const object = createObject({ translateX: 10.3, translateY: 20.7 });
      const anchor = KritzelObjectTitlebarHelper.getAnchor(object, { scale: 2, translateX: 0.25, translateY: 0 });

      const screenX = anchor.x * 2 + 0.25;
      const screenY = anchor.y * 2;
      expect(screenX).toBeCloseTo(Math.round(screenX));
      expect(screenY).toBeCloseTo(Math.round(screenY));
    });
  });

  describe('getTransform', () => {
    it('places the anchor, rotates it in degrees and cancels the viewport zoom', () => {
      const transform = KritzelObjectTitlebarHelper.getTransform({ x: 10, y: 20, width: 100, rotationDegrees: 45 }, 4);

      expect(transform).toBe('translate(10px, 20px) rotate(45deg) scale(0.25)');
    });
  });
});
