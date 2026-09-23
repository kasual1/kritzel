import { test, expect } from '../fixtures/editor.fixture';

test.describe('Selection tool', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
    await editorPage.waitForEngine();
    await editorPage.activateTool('selection');
  });

  /** Wait for two animation frames so the engine finishes rendering. */
  async function waitForRender(page: any) {
    await page.evaluate(() =>
      new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );
  }

  test.describe('click to select', () => {
    test('should select an object by clicking on it', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();
      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
      });
      await editorPage.waitForObjectsAdded();

      // Click the center of the shape
      await editorPage.clickAtWorld(200, 175);
      await waitForRender(editorPage.page);

      const selected = await editorPage.getSelectedObjects<any>();
      expect(selected).toHaveLength(1);
      expect(selected[0].id).toBe(shape.id);
    });

    test('should deselect when clicking empty canvas', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();
      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
      });
      await editorPage.waitForObjectsAdded();

      // Select the shape first
      await editorPage.selectObjects([shape]);
      expect(await editorPage.getSelectedObjects()).toHaveLength(1);

      // Click on empty canvas far from the shape
      await editorPage.clickAtWorld(0, 0);
      await waitForRender(editorPage.page);

      const selected = await editorPage.getSelectedObjects();
      expect(selected).toHaveLength(0);
    });

    test('should select a different object when clicking it', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();
      const shape1 = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 50,
        translateY: 100,
        width: 150,
        height: 100,
      });
      await editorPage.waitForObjectsAdded();

      await editorPage.prepareWaitForObjectsAdded();
      const shape2 = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 350,
        translateY: 100,
        width: 150,
        height: 100,
      });
      await editorPage.waitForObjectsAdded();

      // Click on shape1
      await editorPage.clickAtWorld(125, 150);
      await waitForRender(editorPage.page);

      let selected = await editorPage.getSelectedObjects<any>();
      expect(selected).toHaveLength(1);
      expect(selected[0].id).toBe(shape1.id);

      // Click on shape2
      await editorPage.clickAtWorld(425, 150);
      await waitForRender(editorPage.page);

      selected = await editorPage.getSelectedObjects<any>();
      expect(selected).toHaveLength(1);
      expect(selected[0].id).toBe(shape2.id);
    });
  });

  test.describe('drag to select', () => {
    test('should select objects within a drag-selection rectangle', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();
      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 200,
        translateY: 200,
        width: 100,
        height: 100,
      });
      await editorPage.waitForObjectsAdded();

      await editorPage.prepareWaitForObjectsAdded();
      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 350,
        translateY: 200,
        width: 100,
        height: 100,
      });
      await editorPage.waitForObjectsAdded();

      // Drag a selection rectangle that covers both shapes
      // Start from (150, 150) to avoid the workspace-manager overlay in the top-left corner
      await editorPage.dragFromTo({ x: 150, y: 150 }, { x: 500, y: 350 });
      await waitForRender(editorPage.page);

      const selected = await editorPage.getSelectedObjects();
      expect(selected).toHaveLength(2);
    });

    test('should not select objects outside the drag rectangle', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();
      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 200,
        translateY: 200,
        width: 100,
        height: 100,
      });
      await editorPage.waitForObjectsAdded();

      await editorPage.prepareWaitForObjectsAdded();
      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 500,
        translateY: 500,
        width: 100,
        height: 100,
      });
      await editorPage.waitForObjectsAdded();

      // Drag a selection rectangle that covers only the first shape
      // Start from (150, 150) to avoid the workspace-manager overlay in the top-left corner
      await editorPage.dragFromTo({ x: 150, y: 150 }, { x: 350, y: 350 });
      await waitForRender(editorPage.page);

      const selected = await editorPage.getSelectedObjects();
      expect(selected).toHaveLength(1);
    });
  });

  test.describe('move objects', () => {
    test('should move a selected object by dragging it', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();
      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
      });
      await editorPage.waitForObjectsAdded();

      // Select the object by clicking on it
      await editorPage.clickAtWorld(200, 175);
      await waitForRender(editorPage.page);

      // Drag the object from its center to a new position
      await editorPage.dragFromTo({ x: 200, y: 175 }, { x: 350, y: 275 });
      await waitForRender(editorPage.page);
      
      await editorPage.clearSelection();

      const objects = await editorPage.getAllObjects<any>();
      expect(objects).toHaveLength(1);

      // Object should have moved roughly by the drag delta (150, 100)
      const tolerance = 20;
      expect(objects[0].translateX).toBeGreaterThan(250 - tolerance);
      expect(objects[0].translateX).toBeLessThan(250 + tolerance);
      expect(objects[0].translateY).toBeGreaterThan(200 - tolerance);
      expect(objects[0].translateY).toBeLessThan(200 + tolerance);
    });

    test('moved object should have updated translateX/Y', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();
      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
      });
      await editorPage.waitForObjectsAdded();

      // Select and move
      await editorPage.clickAtWorld(200, 175);
      await waitForRender(editorPage.page);

      const before = (await editorPage.getAllObjects<any>())[0];

      await editorPage.dragFromTo({ x: 200, y: 175 }, { x: 300, y: 275 });
      await waitForRender(editorPage.page);

      const after = (await editorPage.getAllObjects<any>())[0];

      // translateX and translateY should have increased
      expect(after.translateX).toBeGreaterThan(before.translateX);
      expect(after.translateY).toBeGreaterThan(before.translateY);
    });

    test('visual: object after drag-move', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();
      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
        fillColor: { light: '#4a90d9', dark: '#4a90d9' },
      });
      await editorPage.waitForObjectsAdded();

      await editorPage.clickAtWorld(200, 175);
      await waitForRender(editorPage.page);

      await editorPage.dragFromTo({ x: 200, y: 175 }, { x: 350, y: 250 });
      await waitForRender(editorPage.page);

      // Deselect to get clean screenshot
      await editorPage.clearSelection();
      await waitForRender(editorPage.page);

      await expect(editorPage.engine).toHaveScreenshot();
    });
  });

  test.describe('resize objects', () => {
    test('should resize a selected object by dragging a corner handle', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();
      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
      });
      await editorPage.waitForObjectsAdded();

      const before = (await editorPage.getAllObjects<any>())[0];

      // Select the object programmatically so handles appear
      await editorPage.selectObjects([before]);
      await waitForRender(editorPage.page);

      // The bottom-right corner handle is at approximately (translateX + width, translateY + height)
      // Drag it outward to enlarge the shape
      await editorPage.dragFromTo(
        { x: before.translateX + before.width, y: before.translateY + before.height },
        { x: before.translateX + before.width + 80, y: before.translateY + before.height + 60 }
      );
      await waitForRender(editorPage.page);

      await editorPage.clearSelection();

      const after = (await editorPage.getAllObjects<any>())[0];

      // Width and height should have increased
      expect(after.width).toBeGreaterThan(before.width);
      expect(after.height).toBeGreaterThan(before.height);
    });

    test('resized object should have updated width/height', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();
      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
      });
      await editorPage.waitForObjectsAdded();

      const before = (await editorPage.getAllObjects<any>())[0];

      await editorPage.selectObjects([before]);
      await waitForRender(editorPage.page);

      // Drag the bottom-right corner to make the shape smaller
      await editorPage.dragFromTo(
        { x: before.translateX + before.width, y: before.translateY + before.height },
        { x: before.translateX + before.width - 60, y: before.translateY + before.height - 40 }
      );
      await waitForRender(editorPage.page);

      await editorPage.clearSelection();

      const after = (await editorPage.getAllObjects<any>())[0];

      expect(after.width).toBeLessThan(before.width);
      expect(after.height).toBeLessThan(before.height);
    });

    test('visual: object after resize', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();
      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
        fillColor: { light: '#4a90d9', dark: '#4a90d9' },
      });
      await editorPage.waitForObjectsAdded();

      const before = (await editorPage.getAllObjects<any>())[0];

      await editorPage.selectObjects([before]);
      await waitForRender(editorPage.page);

      await editorPage.dragFromTo(
        { x: before.translateX + before.width, y: before.translateY + before.height },
        { x: before.translateX + before.width + 100, y: before.translateY + before.height + 80 }
      );
      await waitForRender(editorPage.page);

      await editorPage.clearSelection();
      await waitForRender(editorPage.page);

      await expect(editorPage.engine).toHaveScreenshot();
    });
  });

  test.describe('rotate objects', () => {
    test('should rotate a selected object by dragging the rotation handle', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();
      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
      });
      await editorPage.waitForObjectsAdded();

      const before = (await editorPage.getAllObjects<any>())[0];
      expect(before.rotation).toBe(0);

      await editorPage.selectObjects([before]);
      await waitForRender(editorPage.page);

      // The rotation handle is at the top-center of the object, 15px above.
      // Drag it to the right to rotate clockwise.
      const rotHandleX = before.translateX + before.width / 2;
      const rotHandleY = before.translateY - 15;

      await editorPage.dragFromTo(
        { x: rotHandleX, y: rotHandleY },
        { x: rotHandleX + 100, y: rotHandleY + 50 }
      );
      await waitForRender(editorPage.page);

      await editorPage.clearSelection();

      const after = (await editorPage.getAllObjects<any>())[0];

      expect(after.rotation).not.toBe(0);
    });

    test('rotated object should have updated rotation property', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();
      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
      });
      await editorPage.waitForObjectsAdded();

      const before = (await editorPage.getAllObjects<any>())[0];

      await editorPage.selectObjects([before]);
      await waitForRender(editorPage.page);

      const rotHandleX = before.translateX + before.width / 2;
      const rotHandleY = before.translateY - 15;

      // Drag further for a more pronounced rotation
      await editorPage.dragFromTo(
        { x: rotHandleX, y: rotHandleY },
        { x: rotHandleX + 150, y: rotHandleY + 100 }
      );
      await waitForRender(editorPage.page);

      await editorPage.clearSelection();

      const after = (await editorPage.getAllObjects<any>())[0];

      // Rotation should be a non-zero number (in radians)
      expect(typeof after.rotation).toBe('number');
      expect(Math.abs(after.rotation)).toBeGreaterThan(0.05);
    });

    test('visual: object after rotation', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();
      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 150,
        translateY: 120,
        width: 200,
        height: 150,
        fillColor: { light: '#4a90d9', dark: '#4a90d9' },
      });
      await editorPage.waitForObjectsAdded();

      const before = (await editorPage.getAllObjects<any>())[0];

      await editorPage.selectObjects([before]);
      await waitForRender(editorPage.page);

      const rotHandleX = before.translateX + before.width / 2;
      const rotHandleY = before.translateY - 15;

      await editorPage.dragFromTo(
        { x: rotHandleX, y: rotHandleY },
        { x: rotHandleX + 120, y: rotHandleY + 80 }
      );
      await waitForRender(editorPage.page);

      await editorPage.clearSelection();
      await waitForRender(editorPage.page);

      await expect(editorPage.engine).toHaveScreenshot();
    });
  });

  test.describe('multi-select operations', () => {
    test('should move multiple selected objects together', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();
      const shape1 = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 100,
        height: 100,
      });
      await editorPage.waitForObjectsAdded();

      await editorPage.prepareWaitForObjectsAdded();
      const shape2 = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 300,
        translateY: 100,
        width: 100,
        height: 100,
      });
      await editorPage.waitForObjectsAdded();

      // Select both objects programmatically
      await editorPage.selectObjects([shape1, shape2]);
      await waitForRender(editorPage.page);

      const before1 = await editorPage.getObjectById<any>(shape1.id);
      const before2 = await editorPage.getObjectById<any>(shape2.id);

      // Drag from the center of the selection group to move both
      const centerX = (before1.translateX + before2.translateX + before2.width) / 2;
      const centerY = before1.translateY + before1.height / 2;

      await editorPage.dragFromTo(
        { x: centerX, y: centerY },
        { x: centerX + 80, y: centerY + 60 }
      );
      await waitForRender(editorPage.page);

      await editorPage.clearSelection();

      const after1 = await editorPage.getObjectById<any>(shape1.id);
      const after2 = await editorPage.getObjectById<any>(shape2.id);

      const tolerance = 20;
      // Both objects should have moved by roughly the same delta
      expect(after1.translateX - before1.translateX).toBeGreaterThan(80 - tolerance);
      expect(after1.translateX - before1.translateX).toBeLessThan(80 + tolerance);
      expect(after2.translateX - before2.translateX).toBeGreaterThan(80 - tolerance);
      expect(after2.translateX - before2.translateX).toBeLessThan(80 + tolerance);
    });

    test('should resize a multi-selection group', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();
      const shape1 = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 100,
        height: 100,
      });
      await editorPage.waitForObjectsAdded();

      await editorPage.prepareWaitForObjectsAdded();
      const shape2 = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 300,
        translateY: 100,
        width: 100,
        height: 100,
      });
      await editorPage.waitForObjectsAdded();

      // Select both
      await editorPage.selectObjects([shape1, shape2]);
      await waitForRender(editorPage.page);

      // The selection group spans from (100,100) to (400,200).
      // Drag the bottom-right corner outward.
      await editorPage.dragFromTo(
        { x: 400, y: 200 },
        { x: 480, y: 260 }
      );
      await waitForRender(editorPage.page);

      await editorPage.clearSelection();

      const after1 = await editorPage.getObjectById<any>(shape1.id);
      const after2 = await editorPage.getObjectById<any>(shape2.id);

      // At least one object's dimensions should have changed from the group resize
      const totalSpanAfter =
        Math.max(after1.translateX + after1.width, after2.translateX + after2.width) -
        Math.min(after1.translateX, after2.translateX);

      // Original span was 300 (400 - 100), it should be larger now
      expect(totalSpanAfter).toBeGreaterThan(300);
    });
  });
});
