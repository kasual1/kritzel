import { test, expect } from '../fixtures/editor.fixture';

test.describe('Eraser tool', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
    await editorPage.waitForEngine();
  });

  test('should erase a path object by dragging over it', async ({ editorPage }) => {
    // Add a path programmatically at a known position
    await editorPage.prepareWaitForObjectsAdded();
    await editorPage.addPath({
      points: [[0, 0], [50, 0], [100, 0], [150, 0], [200, 0]],
      translateX: 100,
      translateY: 200,
      strokeWidth: 16,
    });
    await editorPage.waitForObjectsAdded();

    expect(await editorPage.getObjectsTotalCount()).toBe(1);

    // Switch to eraser and drag over the path
    await editorPage.activateTool('eraser');
    await editorPage.drawStroke([
      { x: 80, y: 200 },
      { x: 150, y: 200 },
      { x: 220, y: 200 },
    ]);

    // Wait for the removal to be processed
    await editorPage.page.evaluate(() =>
      new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );

    expect(await editorPage.getObjectsTotalCount()).toBe(0);
  });

  test('should erase a shape object by dragging over it', async ({ editorPage }) => {
    // Add a shape programmatically
    await editorPage.prepareWaitForObjectsAdded();
    await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 100,
      translateY: 100,
      width: 200,
      height: 150,
    });
    await editorPage.waitForObjectsAdded();

    expect(await editorPage.getObjectsTotalCount()).toBe(1);

    // Switch to eraser and drag through the center of the shape
    await editorPage.activateTool('eraser');
    await editorPage.drawStroke([
      { x: 150, y: 175 },
      { x: 200, y: 175 },
      { x: 250, y: 175 },
    ]);

    await editorPage.page.evaluate(() =>
      new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );

    expect(await editorPage.getObjectsTotalCount()).toBe(0);
  });

  test('should not erase objects that are not touched by the eraser', async ({ editorPage }) => {
    // Add two shapes at different positions
    await editorPage.prepareWaitForObjectsAdded();
    await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 50,
      translateY: 50,
      width: 100,
      height: 100,
    });
    await editorPage.waitForObjectsAdded();

    await editorPage.prepareWaitForObjectsAdded();
    await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 300,
      translateY: 300,
      width: 100,
      height: 100,
    });
    await editorPage.waitForObjectsAdded();

    expect(await editorPage.getObjectsTotalCount()).toBe(2);

    // Drag the eraser only over the first shape
    await editorPage.activateTool('eraser');
    await editorPage.drawStroke([
      { x: 80, y: 100 },
      { x: 100, y: 100 },
      { x: 120, y: 100 },
    ]);

    await editorPage.page.evaluate(() =>
      new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );

    // Only the first shape should be erased; the second should remain
    expect(await editorPage.getObjectsTotalCount()).toBe(1);
  });

  test('erasing should be undoable', async ({ editorPage }) => {
    // Add a shape
    await editorPage.prepareWaitForObjectsAdded();
    await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 100,
      translateY: 100,
      width: 200,
      height: 150,
    });
    await editorPage.waitForObjectsAdded();

    expect(await editorPage.getObjectsTotalCount()).toBe(1);

    // Wait so the add and erase are separate undo steps
    await editorPage.waitForUndoCapture();

    // Erase the shape
    await editorPage.activateTool('eraser');
    await editorPage.drawStroke([
      { x: 150, y: 175 },
      { x: 200, y: 175 },
      { x: 250, y: 175 },
    ]);

    await editorPage.page.evaluate(() =>
      new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );

    expect(await editorPage.getObjectsTotalCount()).toBe(0);

    // Wait so the erase is captured as its own undo step
    await editorPage.waitForUndoCapture();

    // Undo should restore the erased shape
    await editorPage.undo();

    await editorPage.page.evaluate(() =>
      new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );

    expect(await editorPage.getObjectsTotalCount()).toBe(1);
  });
});
