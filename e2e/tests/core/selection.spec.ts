import { test, expect } from '../../fixtures/editor.fixture';

test.describe('Selection', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
  });

  test.describe('selectObjects', () => {
    test('should select a single object by passing it to selectObjects', async ({ editorPage }) => {
      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
      });

      await editorPage.selectObjects([shape]);

      const selected = await editorPage.getSelectedObjects<any>();
      expect(selected).toHaveLength(1);
      expect(selected[0].id).toBe(shape.id);
    });

    test('should select multiple objects', async ({ editorPage }) => {
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

      const selected = await editorPage.getSelectedObjects<any>();
      expect(selected).toHaveLength(2);
      const selectedIds = selected.map((o: any) => o.id).sort();
      const expectedIds = [shape1.id, shape2.id].sort();
      expect(selectedIds).toEqual(expectedIds);
    });

    test('getSelectedObjects should return the selected objects', async ({ editorPage }) => {
      const shape = await editorPage.addShape({
        shapeType: 'triangle',
        translateX: 50,
        translateY: 50,
        width: 120,
        height: 120,
      });
      const text = await editorPage.addText({
        text: 'Hello',
        translateX: 300,
        translateY: 50,
      });

      // Select only the shape
      await editorPage.selectObjects([shape]);
      let selected = await editorPage.getSelectedObjects<any>();
      expect(selected).toHaveLength(1);
      expect(selected[0].id).toBe(shape.id);

      // Select both
      await editorPage.selectObjects([shape, text]);
      selected = await editorPage.getSelectedObjects<any>();
      expect(selected).toHaveLength(2);
    });
  });

  test.describe('selectAllObjectsInViewport', () => {
    test('should select all objects currently in viewport', async ({ editorPage }) => {
      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 100,
        height: 100,
      });
      await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 300,
        translateY: 100,
        width: 100,
        height: 100,
      });
      await editorPage.addText({
        text: 'Select me',
        translateX: 500,
        translateY: 100,
      });

      await editorPage.selectAllObjectsInViewport();

      const selected = await editorPage.getSelectedObjects<any>();
      expect(selected).toHaveLength(3);
    });

    test('should not select objects outside viewport', async ({ editorPage }) => {
      // Add one object in view and one far away
      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 100,
        height: 100,
      });
      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 50000,
        translateY: 50000,
        width: 100,
        height: 100,
      });

      await editorPage.selectAllObjectsInViewport();

      const selected = await editorPage.getSelectedObjects<any>();
      // Only the object within the default viewport should be selected
      expect(selected.length).toBeGreaterThanOrEqual(1);
      expect(selected.length).toBeLessThan(2);
    });
  });

  test.describe('clearSelection', () => {
    test('should deselect all objects', async ({ editorPage }) => {
      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
      });

      await editorPage.selectObjects([shape]);
      expect(await editorPage.getSelectedObjects()).toHaveLength(1);

      await editorPage.clearSelection();

      const selected = await editorPage.getSelectedObjects();
      expect(selected).toHaveLength(0);
    });

    test('getSelectedObjects should return empty after clear', async ({ editorPage }) => {
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
      expect(await editorPage.getSelectedObjects()).toHaveLength(2);

      await editorPage.clearSelection();

      const selected = await editorPage.getSelectedObjects();
      expect(selected).toEqual([]);
    });
  });

  test.describe('triggerSelectionChange', () => {
    test('should emit the selection change event', async ({ editorPage }) => {
      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
      });

      await editorPage.selectObjects([shape]);

      // Set up listener for the selectionChange event on the engine
      await editorPage.page.evaluate(() => {
        const engine = document.querySelector('kritzel-engine');
        if (!engine) throw new Error('kritzel-engine not found');
        (window as any).__selectionChangeReceived = false;
        engine.addEventListener(
          'objectsSelectionChange',
          () => {
            (window as any).__selectionChangeReceived = true;
          },
          { once: true }
        );
      });

      await editorPage.triggerSelectionChange();

      const received = await editorPage.page.evaluate(
        () => (window as any).__selectionChangeReceived
      );
      expect(received).toBe(true);
    });
  });

  test.describe('visual regression', () => {
    test('single object selected with handles', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();

      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 200,
        translateY: 150,
        width: 200,
        height: 150,
        fillColor: { light: '#4a90d9', dark: '#4a90d9' },
      });

      await editorPage.waitForObjectsAdded();
      await editorPage.selectObjects([shape]);

      // Wait for selection handles to render
      await editorPage.page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          )
      );

      await expect(editorPage.engine).toHaveScreenshot();
    });

    test('multiple objects selected', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();

      const shape1 = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 150,
        height: 100,
        fillColor: { light: '#4a90d9', dark: '#4a90d9' },
      });

      await editorPage.waitForObjectsAdded();
      await editorPage.prepareWaitForObjectsAdded();

      const shape2 = await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 350,
        translateY: 100,
        width: 150,
        height: 100,
        fillColor: { light: '#d94a4a', dark: '#d94a4a' },
      });

      await editorPage.waitForObjectsAdded();

      await editorPage.selectObjects([shape1, shape2]);

      // Wait for selection handles to render
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
