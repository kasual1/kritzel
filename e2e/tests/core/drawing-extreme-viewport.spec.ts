import { test, expect } from '../../fixtures/editor.fixture';

/**
 * Regression coverage for drawing / adding objects at extreme viewport
 * translate + scale combinations.
 *
 * Background: the browser's SVG rasterizer (Skia) uses float32. When an SVG's
 * internal path/viewBox coordinates exceed ~2^24 (~16.7M), precision collapses
 * and the path silently fails to paint. Because `lockDrawingScale` stores
 * geometry in world units (screen / scale), coordinates explode at extreme
 * zoom-out once the viewport is panned away from the origin. The fix renders
 * paths in local (object-relative) coordinates so the SVG-internal coordinates
 * stay small regardless of world position. These tests guard that behaviour
 * end-to-end in a real browser.
 */

/** World-coordinate magnitude beyond which float32 SVG rasterization degrades. */
const FLOAT32_SAFE_LIMIT = 16_777_216; // 2^24

/**
 * Extreme viewport states. Each is chosen so that a stroke drawn near the
 * top-left of the canvas lands at a world coordinate whose magnitude comfortably
 * exceeds FLOAT32_SAFE_LIMIT (verified per-test), reproducing the original bug.
 */
const EXTREME_VIEWPORTS = [
  { name: 'min scale (0.0001), reported far position', translateX: 1350, translateY: 3937, scale: 0.0001 },
  { name: 'min scale (0.0001), extreme negative position', translateX: -8000, translateY: -12000, scale: 0.0001 },
  { name: 'low scale (0.0002), far position', translateX: 10000, translateY: 15000, scale: 0.0002 },
  { name: 'low scale (0.001), very far position', translateX: 40000, translateY: 55000, scale: 0.001 },
];

/** Largest absolute numeric coordinate present in an SVG path `d` string. */
function maxAbsCoordinate(d: string): number {
  const nums = d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  return nums.length ? Math.max(...nums.map(Math.abs)) : 0;
}

test.describe('Drawing at extreme viewport translate/scale', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
    await editorPage.waitForEngine();
  });

  for (const vp of EXTREME_VIEWPORTS) {
    test(`brush draws a rendered path in local coordinates at ${vp.name}`, async ({ editorPage }) => {
      await editorPage.activateTool('brush');
      await editorPage.setViewportRaw(vp.translateX, vp.translateY, vp.scale);

      await editorPage.prepareWaitForObjectsAdded();
      await editorPage.drawStrokeScreen([
        { x: 180, y: 180 },
        { x: 240, y: 220 },
        { x: 300, y: 180 },
        { x: 360, y: 230 },
      ]);
      await editorPage.waitForObjectsAdded();

      // 1. The object is created and tracked in the objects map.
      expect(await editorPage.getObjectsTotalCount()).toBe(1);

      // 2. The object is actually rendered in the DOM (in viewport, not culled).
      expect(await editorPage.getSvgElementCount()).toBe(1);

      const objects = await editorPage.getAllObjects<any>();
      expect(objects).toHaveLength(1);
      const path = objects[0];
      expect(path.d).toBeTruthy();

      // 3. Sanity: the object genuinely lives far from the origin, past the
      //    float32-safe range — otherwise this test would not exercise the bug.
      const worldMagnitude = Math.max(Math.abs(path.translateX), Math.abs(path.translateY));
      expect(worldMagnitude).toBeGreaterThan(FLOAT32_SAFE_LIMIT);

      // 4. Core regression guard: the rendered `d` uses LOCAL coordinates,
      //    bounded by the object's own extent rather than its world position.
      //    Before the fix these coordinates were absolute (~world position) and
      //    exceeded the float32 range, so the path never painted.
      const localExtent = Math.max(path.width, path.height) + path.strokeWidth + 100;
      expect(maxAbsCoordinate(path.d)).toBeLessThanOrEqual(localExtent);
      expect(maxAbsCoordinate(path.d)).toBeLessThan(FLOAT32_SAFE_LIMIT);
    });
  }

  test('addPath with far-from-origin points renders in local coordinates', async ({ editorPage }) => {
    const offset = 40_000_000; // well beyond the float32-safe range (2^24)

    const result = await editorPage.addPath({
      points: [
        [offset, offset],
        [offset + 40, offset + 20],
        [offset + 80, offset - 10],
        [offset + 120, offset + 30],
        [offset + 160, offset + 10],
      ],
      translateX: 0,
      translateY: 0,
      strokeWidth: 6,
    });

    expect(result).toBeDefined();
    expect(await editorPage.getObjectsTotalCount()).toBe(1);

    const obj = await editorPage.getObjectById<any>(result.id);
    expect(obj.d).toBeTruthy();

    // The path's world position is far out (~40M) ...
    expect(Math.max(Math.abs(obj.translateX), Math.abs(obj.translateY))).toBeGreaterThan(FLOAT32_SAFE_LIMIT);
    // ... but its rendered `d` stays in small local coordinates.
    expect(maxAbsCoordinate(obj.d)).toBeLessThan(1000);
  });

  test('drawn path survives a round-trip to the origin and back (still renders)', async ({ editorPage }) => {
    await editorPage.activateTool('brush');
    await editorPage.setViewportRaw(1350, 3937, 0.0001);

    await editorPage.prepareWaitForObjectsAdded();
    await editorPage.drawStrokeScreen([
      { x: 180, y: 180 },
      { x: 260, y: 220 },
      { x: 340, y: 180 },
    ]);
    await editorPage.waitForObjectsAdded();

    const [path] = await editorPage.getAllObjects<any>();
    expect(path).toBeTruthy();

    // Bring the drawn object into view; it must remain rendered.
    await editorPage.centerObjectInViewport(path);

    expect(await editorPage.getObjectsTotalCount()).toBe(1);
    expect(await editorPage.getSvgElementCount()).toBe(1);
  });
});
