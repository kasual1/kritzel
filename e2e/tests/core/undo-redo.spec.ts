import { test, expect } from '../../fixtures/editor.fixture';

test.describe('Undo / Redo', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
  });

  test('should undo adding an object', async ({ editorPage }) => {
    await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 100,
      translateY: 100,
      width: 200,
      height: 150,
    });

    expect(await editorPage.getObjectsTotalCount()).toBe(1);

    await editorPage.undo();

    expect(await editorPage.getObjectsTotalCount()).toBe(0);
  });

  test('should redo a previously undone add', async ({ editorPage }) => {
    await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 100,
      translateY: 100,
      width: 200,
      height: 150,
    });

    await editorPage.undo();
    expect(await editorPage.getObjectsTotalCount()).toBe(0);

    await editorPage.redo();
    expect(await editorPage.getObjectsTotalCount()).toBe(1);
  });

  test('should undo object removal', async ({ editorPage }) => {
    const shape = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 100,
      translateY: 100,
      width: 200,
      height: 150,
    });

    // Ensure the add is captured as a separate undo step before select+delete
    await editorPage.waitForUndoCapture();

    await editorPage.selectObjects([shape]);
    await editorPage.deleteSelected();
    expect(await editorPage.getObjectsTotalCount()).toBe(0);

    await editorPage.undo();
    await editorPage.clearSelection();
    expect(await editorPage.getObjectsTotalCount()).toBe(1);
  });

  test('should undo object update (position change)', async ({ editorPage }) => {
    const shape = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 100,
      translateY: 100,
      width: 200,
      height: 150,
    });

    const originalX = shape.translateX;
    const originalY = shape.translateY;

    // Ensure the add is captured as a separate undo step before the update
    await editorPage.waitForUndoCapture();

    await editorPage.updateObject(shape, { translateX: 400, translateY: 400 });

    const moved = await editorPage.getObjectById<any>(shape.id);
    expect(moved.translateX).toBe(400);
    expect(moved.translateY).toBe(400);

    await editorPage.undo();

    const restored = await editorPage.getObjectById<any>(shape.id);
    expect(restored.translateX).toBe(originalX);
    expect(restored.translateY).toBe(originalY);
  });

  test('should undo multiple actions in sequence', async ({ editorPage }) => {
    await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 100,
      translateY: 100,
      width: 100,
      height: 100,
    });

    await editorPage.waitForUndoCapture();

    await editorPage.addShape({
      shapeType: 'ellipse',
      translateX: 300,
      translateY: 100,
      width: 100,
      height: 100,
    });

    expect(await editorPage.getObjectsTotalCount()).toBe(2);

    // Undo adding shape2
    await editorPage.undo();
    expect(await editorPage.getObjectsTotalCount()).toBe(1);

    // Undo adding shape1
    await editorPage.undo();
    expect(await editorPage.getObjectsTotalCount()).toBe(0);
  });

  test('should redo multiple actions in sequence', async ({ editorPage }) => {
    await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 100,
      translateY: 100,
      width: 100,
      height: 100,
    });

    await editorPage.waitForUndoCapture();

    await editorPage.addShape({
      shapeType: 'ellipse',
      translateX: 300,
      translateY: 100,
      width: 100,
      height: 100,
    });

    await editorPage.undo();
    await editorPage.undo();
    expect(await editorPage.getObjectsTotalCount()).toBe(0);

    // Redo adding shape1
    await editorPage.redo();
    expect(await editorPage.getObjectsTotalCount()).toBe(1);

    // Redo adding shape2
    await editorPage.redo();
    expect(await editorPage.getObjectsTotalCount()).toBe(2);
  });

  test('redo stack should clear after a new action following undo', async ({ editorPage }) => {
    await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 100,
      translateY: 100,
      width: 100,
      height: 100,
    });

    await editorPage.waitForUndoCapture();

    await editorPage.addShape({
      shapeType: 'ellipse',
      translateX: 300,
      translateY: 100,
      width: 100,
      height: 100,
    });

    // Undo the second add
    await editorPage.undo();
    expect(await editorPage.getObjectsTotalCount()).toBe(1);

    // Perform a new action — this should clear the redo stack
    await editorPage.addShape({
      shapeType: 'triangle',
      translateX: 500,
      translateY: 100,
      width: 100,
      height: 100,
    });
    expect(await editorPage.getObjectsTotalCount()).toBe(2);

    // Redo should have no effect since the redo stack was cleared
    await editorPage.redo();
    expect(await editorPage.getObjectsTotalCount()).toBe(2);
  });

  test('should handle undo on empty history gracefully', async ({ editorPage }) => {
    // No actions performed — undo should not throw or crash
    await editorPage.undo();

    expect(await editorPage.getObjectsTotalCount()).toBe(0);
  });

  test('should handle redo on empty redo stack gracefully', async ({ editorPage }) => {
    // No undo performed — redo should not throw or crash
    await editorPage.redo();

    expect(await editorPage.getObjectsTotalCount()).toBe(0);
  });
});
