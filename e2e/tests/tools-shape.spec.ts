import { test, expect } from '../fixtures/editor.fixture';

test.describe('Shape tool', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
    await editorPage.waitForEngine();
  });

  test.describe('Rectangle sub-option', () => {
    test('should draw a rectangle by click-dragging on the canvas', async ({ editorPage }) => {
      await editorPage.clickShapeSubOption('rectangle');
      await editorPage.prepareWaitForObjectsAdded();

      await editorPage.dragFromTo({ x: 100, y: 100 }, { x: 300, y: 250 });

      await editorPage.waitForObjectsAdded();

      await editorPage.clearSelection();

      const count = await editorPage.getObjectsTotalCount();
      expect(count).toBe(1);

      const objects = await editorPage.getAllObjects<any>();
      expect(objects[0].id).toBeDefined();
      expect(objects[0].shapeType).toBe('rectangle');
    });

    test('rectangle should have approximately the dragged dimensions', async ({ editorPage }) => {
      await editorPage.clickShapeSubOption('rectangle');
      await editorPage.prepareWaitForObjectsAdded();

      await editorPage.dragFromTo({ x: 100, y: 100 }, { x: 300, y: 250 });

      await editorPage.waitForObjectsAdded();

      await editorPage.clearSelection();

      const objects = await editorPage.getAllObjects<any>();
      expect(objects).toHaveLength(1);

      const shape = objects[0];
      const tolerance = 20;
      // Width should be roughly 200 (300 - 100)
      expect(shape.width).toBeGreaterThan(200 - tolerance);
      expect(shape.width).toBeLessThan(200 + tolerance);
      // Height should be roughly 150 (250 - 100)
      expect(shape.height).toBeGreaterThan(150 - tolerance);
      expect(shape.height).toBeLessThan(150 + tolerance);
    });

    test('visual: mouse-drawn rectangle', async ({ editorPage }) => {
      await editorPage.clickShapeSubOption('rectangle');
      await editorPage.prepareWaitForObjectsAdded();

      await editorPage.dragFromTo({ x: 80, y: 80 }, { x: 320, y: 260 });

      await editorPage.waitForObjectsAdded();

      await editorPage.clearSelection();

      await expect(editorPage.engine).toHaveScreenshot();
    });
  });

  test.describe('Ellipse sub-option', () => {
    test('should draw an ellipse by click-dragging', async ({ editorPage }) => {
      await editorPage.clickShapeSubOption('ellipse');
      await editorPage.prepareWaitForObjectsAdded();

      await editorPage.dragFromTo({ x: 100, y: 100 }, { x: 300, y: 250 });

      await editorPage.waitForObjectsAdded();

      await editorPage.clearSelection();

      const count = await editorPage.getObjectsTotalCount();
      expect(count).toBe(1);

      const objects = await editorPage.getAllObjects<any>();
      expect(objects[0].id).toBeDefined();
      expect(objects[0].shapeType).toBe('ellipse');
    });

    test('visual: mouse-drawn ellipse', async ({ editorPage }) => {
      await editorPage.clickShapeSubOption('ellipse');
      await editorPage.prepareWaitForObjectsAdded();

      await editorPage.dragFromTo({ x: 80, y: 80 }, { x: 320, y: 260 });

      await editorPage.waitForObjectsAdded();

      await editorPage.clearSelection();

      await expect(editorPage.engine).toHaveScreenshot();
    });
  });

  test.describe('Triangle sub-option', () => {
    test('should draw a triangle by click-dragging', async ({ editorPage }) => {
      await editorPage.clickShapeSubOption('triangle');
      await editorPage.prepareWaitForObjectsAdded();

      await editorPage.dragFromTo({ x: 100, y: 100 }, { x: 300, y: 250 });

      await editorPage.waitForObjectsAdded();

      await editorPage.clearSelection();

      const count = await editorPage.getObjectsTotalCount();
      expect(count).toBe(1);

      const objects = await editorPage.getAllObjects<any>();
      expect(objects[0].id).toBeDefined();
      expect(objects[0].shapeType).toBe('triangle');
    });

    test('visual: mouse-drawn triangle', async ({ editorPage }) => {
      await editorPage.clickShapeSubOption('triangle');
      await editorPage.prepareWaitForObjectsAdded();

      await editorPage.dragFromTo({ x: 80, y: 80 }, { x: 320, y: 260 });

      await editorPage.waitForObjectsAdded();

      await editorPage.clearSelection();

      await expect(editorPage.engine).toHaveScreenshot();
    });
  });
});
