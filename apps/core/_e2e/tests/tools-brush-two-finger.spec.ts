import { test, expect, type EditorPage, type ViewportState, type WorldPoint } from '../fixtures/editor.fixture';

/**
 * On touch screens the first finger of a two-finger gesture starts a brush stroke; when the second finger
 * lands, the gesture becomes a zoom/pan and that stroke is dropped. It must not stay in the undo history:
 * that made undo bring it back as a dot between the two fingers.
 */
test.describe('Brush tool with two-finger gestures', () => {
  test.use({ hasTouch: true });

  const GESTURES: Array<{
    name: string;
    perform: (editorPage: EditorPage, center: WorldPoint) => Promise<void>;
    expectViewportChanged: (before: ViewportState, after: ViewportState) => void;
  }> = [
    {
      name: 'pinch to zoom in',
      perform: (editorPage, center) => editorPage.pinch(center, 80, 320),
      expectViewportChanged: (before, after) => expect(after.scale).toBeGreaterThan(before.scale),
    },
    {
      name: 'pinch to zoom out',
      perform: (editorPage, center) => editorPage.pinch(center, 320, 80),
      expectViewportChanged: (before, after) => expect(after.scale).toBeLessThan(before.scale),
    },
    {
      name: 'pan with two fingers',
      perform: (editorPage, center) => editorPage.twoFingerPan(center, { x: 120, y: 80 }),
      expectViewportChanged: (before, after) => expect(after.translateX).not.toBe(before.translateX),
    },
  ];

  let center: WorldPoint;

  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
    await editorPage.waitForEngine();
    await editorPage.activateTool('brush');

    const box = await editorPage.getEngineBoundingBox();
    center = { x: box.width / 2, y: box.height / 2 };
  });

  for (const gesture of GESTURES) {
    test(`${gesture.name} leaves no path and nothing to undo`, async ({ editorPage }) => {
      expect(await editorPage.canUndo()).toBe(false);
      const viewportBefore = await editorPage.getViewport();

      await gesture.perform(editorPage, center);

      gesture.expectViewportChanged(viewportBefore, await editorPage.getViewport());
      expect(await editorPage.getObjectsTotalCount()).toBe(0);
      expect(await editorPage.canUndo()).toBe(false);

      await editorPage.undo();

      expect(await editorPage.getObjectsTotalCount()).toBe(0);
    });

    test(`undo after ${gesture.name} reverts the previous stroke instead of revealing a dot`, async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();
      await editorPage.drawStrokeTouch(
        Array.from({ length: 8 }, (_, i) => ({ x: center.x - 140 + i * 40, y: center.y - 120 + (i % 2) * 30 })),
      );
      await editorPage.waitForObjectsAdded();
      const [stroke] = await editorPage.getAllObjects<{ id: string; points: number[][] }>();
      expect(stroke.points.length).toBeGreaterThan(1);
      const viewportBefore = await editorPage.getViewport();

      await gesture.perform(editorPage, center);

      gesture.expectViewportChanged(viewportBefore, await editorPage.getViewport());
      expect(await editorPage.getObjectsTotalCount()).toBe(1);

      await editorPage.undo();

      expect(await editorPage.getObjectsTotalCount()).toBe(0);

      await editorPage.redo();

      const objects = await editorPage.getAllObjects<{ id: string; points: number[][] }>();
      expect(objects.map(object => object.id)).toEqual([stroke.id]);
      expect(objects[0].points).toEqual(stroke.points);
    });
  }
});
