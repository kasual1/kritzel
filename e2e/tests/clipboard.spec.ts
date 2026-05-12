import { test, expect } from '../fixtures/editor.fixture';

test.describe('Clipboard', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
  });

  test.describe('copy and paste', () => {
    test('should copy a selected object', async ({ editorPage }) => {
      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
        fillColor: { light: '#ff0000', dark: '#ff0000' },
      });

      await editorPage.selectObjects([shape]);
      await editorPage.copy();

      const copied = await editorPage.getCopiedObjects<any>();
      expect(copied).toHaveLength(1);
      expect(copied[0].id).not.toBe(shape.id);
      expect(copied[0].shapeType).toBe('rectangle');
    });

    test('getCopiedObjects should return copied objects after copy', async ({ editorPage }) => {
      const shape1 = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 0,
        translateY: 0,
        width: 100,
        height: 100,
      });
      const shape2 = await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 200,
        translateY: 0,
        width: 100,
        height: 100,
      });

      await editorPage.selectObjects([shape1, shape2]);
      await editorPage.copy();

      const copied = await editorPage.getCopiedObjects<any>();
      expect(copied).toHaveLength(2);
      const copiedIds = copied.map((o: any) => o.id);
      // Copied objects get new IDs, so none should match the originals
      expect(copiedIds).not.toContain(shape1.id);
      expect(copiedIds).not.toContain(shape2.id);
    });

    test('should paste copied object at specified coordinates', async ({ editorPage }) => {
      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
      });

      await editorPage.selectObjects([shape]);
      await editorPage.copy();
      await editorPage.paste(400, 400);
      await editorPage.clearSelection();

      const allObjects = await editorPage.getAllObjects<any>();
      expect(allObjects).toHaveLength(2);
    });

    test('pasted object should have a new id (not the same as original)', async ({ editorPage }) => {
      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
      });

      await editorPage.selectObjects([shape]);
      await editorPage.copy();
      await editorPage.paste(400, 400);
      await editorPage.clearSelection();

      const allObjects = await editorPage.getAllObjects<any>();
      expect(allObjects).toHaveLength(2);

      const ids = allObjects.map((o: any) => o.id);
      expect(ids[0]).not.toBe(ids[1]);
    });

    test('pasted object should appear at the paste coordinates', async ({ editorPage }) => {
      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
      });

      await editorPage.selectObjects([shape]);
      await editorPage.copy();
      await editorPage.paste(500, 500);

      const allObjects = await editorPage.getAllObjects<any>();
      const pasted = allObjects.find((o: any) => o.id !== shape.id);
      expect(pasted).toBeDefined();
      expect(pasted.translateX).toBeCloseTo(500, -1);
      expect(pasted.translateY).toBeCloseTo(500, -1);
    });
  });

  test.describe('cut and paste', () => {
    test('should copy a selected object to the clipboard and remove it from the canvas', async ({ editorPage }) => {
      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
        fillColor: { light: '#ff0000', dark: '#ff0000' },
      });

      await editorPage.selectObjects([shape]);
      await editorPage.cut();

      const copied = await editorPage.getCopiedObjects<any>();
      expect(copied).toHaveLength(1);
      expect(copied[0].id).not.toBe(shape.id);
      expect(copied[0].shapeType).toBe('rectangle');

      const allObjects = await editorPage.getAllObjects();
      expect(allObjects).toHaveLength(0);
    });

    test('should cut multiple selected objects', async ({ editorPage }) => {
      const shape1 = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 0,
        translateY: 0,
        width: 100,
        height: 100,
      });
      const shape2 = await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 200,
        translateY: 0,
        width: 100,
        height: 100,
      });
      await editorPage.addText({
        text: 'Keep me',
        translateX: 400,
        translateY: 0,
      });

      await editorPage.selectObjects([shape1, shape2]);
      await editorPage.cut();

      const copied = await editorPage.getCopiedObjects<any>();
      expect(copied).toHaveLength(2);
      const copiedIds = copied.map((o: any) => o.id);
      expect(copiedIds).not.toContain(shape1.id);
      expect(copiedIds).not.toContain(shape2.id);

      const allObjects = await editorPage.getAllObjects();
      expect(allObjects).toHaveLength(1);
    });

    test('should do nothing when there is no selection', async ({ editorPage }) => {
      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
      });

      await editorPage.clearSelection();
      await editorPage.cut();

      const copied = await editorPage.getCopiedObjects<any>();
      expect(copied ?? []).toHaveLength(0);

      const allObjects = await editorPage.getAllObjects();
      expect(allObjects).toHaveLength(1);
    });

    test('should paste a previously cut object at specified coordinates', async ({ editorPage }) => {
      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
      });

      await editorPage.selectObjects([shape]);
      await editorPage.cut();

      expect(await editorPage.getAllObjects()).toHaveLength(0);

      await editorPage.paste(400, 400);
      await editorPage.clearSelection();

      const allObjects = await editorPage.getAllObjects<any>();
      expect(allObjects).toHaveLength(1);

      const pasted = allObjects[0];
      expect(pasted.id).not.toBe(shape.id);
      expect(pasted.translateX).toBeCloseTo(400, -1);
      expect(pasted.translateY).toBeCloseTo(400, -1);
    });

    test('object count should decrease after cut', async ({ editorPage }) => {
      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 0,
        translateY: 0,
        width: 100,
        height: 100,
      });
      await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 200,
        translateY: 0,
        width: 100,
        height: 100,
      });

      expect(await editorPage.getObjectsTotalCount()).toBe(2);

      await editorPage.selectObjects([shape]);
      await editorPage.cut();

      expect(await editorPage.getObjectsTotalCount()).toBe(1);
    });
  });

  test.describe('delete', () => {
    test('should delete the selected object', async ({ editorPage }) => {
      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
      });

      await editorPage.selectObjects([shape]);
      await editorPage.deleteSelected();

      const allObjects = await editorPage.getAllObjects();
      expect(allObjects).toHaveLength(0);
    });

    test('should delete multiple selected objects', async ({ editorPage }) => {
      const shape1 = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 0,
        translateY: 0,
        width: 100,
        height: 100,
      });
      const shape2 = await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 200,
        translateY: 0,
        width: 100,
        height: 100,
      });
      await editorPage.addText({
        text: 'Keep me',
        translateX: 400,
        translateY: 0,
      });

      await editorPage.selectObjects([shape1, shape2]);
      await editorPage.deleteSelected();

      const allObjects = await editorPage.getAllObjects();
      expect(allObjects).toHaveLength(1);
    });

    test('object count should decrease after delete', async ({ editorPage }) => {
      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 0,
        translateY: 0,
        width: 100,
        height: 100,
      });
      await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 200,
        translateY: 0,
        width: 100,
        height: 100,
      });

      expect(await editorPage.getObjectsTotalCount()).toBe(2);

      await editorPage.selectObjects([shape]);
      await editorPage.deleteSelected();

      expect(await editorPage.getObjectsTotalCount()).toBe(1);
    });

    test('deleted objects should not appear in DOM', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();

      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
      });

      await editorPage.waitForObjectsAdded();
      expect(await editorPage.getObjectElementCount()).toBe(1);

      await editorPage.selectObjects([shape]);
      await editorPage.deleteSelected();

      await editorPage.page.waitForTimeout(100);
      expect(await editorPage.getObjectElementCount()).toBe(0);
    });
  });

  test.describe('copy-paste with groups', () => {
    test('should copy and paste a grouped object', async ({ editorPage }) => {
      const shape1 = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 100,
        height: 100,
      });
      const shape2 = await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 250,
        translateY: 100,
        width: 100,
        height: 100,
      });

      await editorPage.selectObjects([shape1, shape2]);
      await editorPage.group();
      await editorPage.copy();

      const countBeforePaste = await editorPage.getObjectsTotalCount();

      await editorPage.paste(500, 500);

      const countAfterPaste = await editorPage.getObjectsTotalCount();
      expect(countAfterPaste).toBeGreaterThan(countBeforePaste);
    });
  });

  test.describe('visual regression', () => {
    test('canvas after pasting a copied shape', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();

      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 150,
        width: 200,
        height: 150,
        fillColor: { light: '#4a90d9', dark: '#4a90d9' },
      });

      await editorPage.waitForObjectsAdded();

      await editorPage.selectObjects([shape]);
      await editorPage.copy();
      await editorPage.clearSelection();
      await editorPage.paste(400, 150);

      // Wait for pasted object to render
      await editorPage.page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          )
      );

      await expect(editorPage.engine).toHaveScreenshot();
    });

    test('canvas after deleting one of two shapes', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();

      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 150,
        width: 200,
        height: 150,
        fillColor: { light: '#4a90d9', dark: '#4a90d9' },
      });

      await editorPage.waitForObjectsAdded();
      await editorPage.prepareWaitForObjectsAdded();

      const shape2 = await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 400,
        translateY: 150,
        width: 200,
        height: 150,
        fillColor: { light: '#d94a4a', dark: '#d94a4a' },
      });

      await editorPage.waitForObjectsAdded();

      await editorPage.selectObjects([shape2]);
      await editorPage.deleteSelected();

      // Wait for DOM removal
      await editorPage.page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          )
      );

      await expect(editorPage.engine).toHaveScreenshot();
    });

    test('canvas after copy-pasting multiple objects', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();

      const shape1 = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: -300,
        translateY: -300,
        width: 120,
        height: 100,
        fillColor: { light: '#4a90d9', dark: '#4a90d9' },
      });

      await editorPage.waitForObjectsAdded();
      await editorPage.prepareWaitForObjectsAdded();

      const shape2 = await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: -120,
        translateY: -300,
        width: 120,
        height: 100,
        fillColor: { light: '#d94a4a', dark: '#d94a4a' },
      });

      await editorPage.waitForObjectsAdded();

      await editorPage.selectObjects([shape1, shape2]);
      await editorPage.copy();
      await editorPage.clearSelection();
      await editorPage.paste(0, 0);

      // Wait for pasted objects to render
      await editorPage.page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          )
      );

      await expect(editorPage.engine).toHaveScreenshot();
    });

    test('canvas after copy-pasting multiple objects at the edge of the viewport', async ({ editorPage }) => {
      // This tests that objects copied near the edge of the viewport are pasted correctly and scrolled into view
      await editorPage.prepareWaitForObjectsAdded();

      const shape1 = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 120,
        height: 100,
        fillColor: { light: '#4a90d9', dark: '#4a90d9' },
      });

      await editorPage.waitForObjectsAdded();
      await editorPage.prepareWaitForObjectsAdded();

      const shape2 = await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 280,
        translateY: 100,
        width: 120,
        height: 100,
        fillColor: { light: '#d94a4a', dark: '#d94a4a' },
      });

      await editorPage.waitForObjectsAdded();

      await editorPage.selectObjects([shape1, shape2]);
      await editorPage.copy();
      await editorPage.clearSelection();
      await editorPage.paste(400, 300);

      // Wait for pasted objects to render
      await editorPage.page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          )
      );

      await expect(editorPage.engine).toHaveScreenshot();
    });
  });
});
