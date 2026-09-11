import { test, expect } from '../../fixtures/editor.fixture';

test.describe('Line tool', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
    await editorPage.waitForEngine();
    await editorPage.activateTool('line');
  });

  test('should draw a line by clicking start and end points', async ({ editorPage }) => {
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.dragFromTo({ x: 100, y: 100 }, { x: 300, y: 200 });

    await editorPage.waitForObjectsAdded();

    await editorPage.clearSelection();

    const count = await editorPage.getObjectsTotalCount();

    expect(count).toBe(1);
  });

  test('drawn line should create a KritzelLine object', async ({ editorPage }) => {
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.dragFromTo({ x: 100, y: 100 }, { x: 300, y: 200 });

    await editorPage.waitForObjectsAdded();

    await editorPage.clearSelection();

    const objects = await editorPage.getAllObjects<any>();


    expect(objects).toHaveLength(1);
    expect(objects[0].id).toBeDefined();
    // KritzelLine objects have startX, startY, endX, endY
    expect(objects[0].startX).toBeDefined();
    expect(objects[0].startY).toBeDefined();
    expect(objects[0].endX).toBeDefined();
    expect(objects[0].endY).toBeDefined();
  });

  test('line should have correct start and end coordinates', async ({ editorPage }) => {
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.dragFromTo({ x: 100, y: 100 }, { x: 300, y: 200 });

    await editorPage.waitForObjectsAdded();

    await editorPage.clearSelection();

    const objects = await editorPage.getAllObjects<any>();

    expect(objects).toHaveLength(1);

    const line = objects[0];
    // The line's start and end should approximate the drag coordinates.
    // Use a tolerance since the tool may snap or adjust slightly.
    const tolerance = 20;
    expect(line.endX - line.startX).toBeGreaterThan(0);
    expect(line.endY - line.startY).toBeGreaterThan(0);

    // The overall span (endX - startX relative to translateX) should be roughly 200 (300 - 100)
    const spanX = Math.abs(line.endX - line.startX);
    const spanY = Math.abs(line.endY - line.startY);
    expect(spanX).toBeGreaterThan(200 - tolerance);
    expect(spanX).toBeLessThan(200 + tolerance);
    expect(spanY).toBeGreaterThan(100 - tolerance);
    expect(spanY).toBeLessThan(100 + tolerance);
  });

  test('should curve the line by dragging the center handle', async ({ editorPage }) => {
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.dragFromTo({ x: 100, y: 200 }, { x: 300, y: 200 });

    await editorPage.waitForObjectsAdded();

    // Drag the center handle downward to curve the line
    await editorPage.dragLineHandle('center', 0, 80);

    await editorPage.clearSelection();

    // Verify the line now has a control point (quadratic Bezier curve)
    const updatedObjects = await editorPage.getAllObjects<any>();
    expect(updatedObjects).toHaveLength(1);
    const line = updatedObjects[0];
    expect(line.controlX).toBeDefined();
    expect(line.controlY).toBeDefined();

    await expect(editorPage.engine).toHaveScreenshot();
  });

  test('should move the end of the line by dragging the end handle', async ({ editorPage }) => {
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.dragFromTo({ x: 100, y: 200 }, { x: 300, y: 200 });

    await editorPage.waitForObjectsAdded();

    // Capture original end coordinates
    const before = (await editorPage.getAllObjects<any>())[0];
    const originalEndX = before.endX;
    const originalEndY = before.endY;

    // Drag the end handle to the right and down
    await editorPage.dragLineHandle('end', 50, 60);

    await editorPage.clearSelection();

    // Verify the end point moved
    const after = (await editorPage.getAllObjects<any>())[0];
    expect(after.endX).not.toBeCloseTo(originalEndX, 0);
    expect(after.endY).not.toBeCloseTo(originalEndY, 0);

    await expect(editorPage.engine).toHaveScreenshot();
  });

  test('should move the start of the line by dragging the start handle', async ({ editorPage }) => {
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.dragFromTo({ x: 100, y: 200 }, { x: 300, y: 200 });

    await editorPage.waitForObjectsAdded();

    // Capture original start coordinates
    const before = (await editorPage.getAllObjects<any>())[0];
    const originalStartX = before.startX;
    const originalStartY = before.startY;

    // Drag the start handle to the left and up
    await editorPage.dragLineHandle('start', -50, -60);

    await editorPage.clearSelection();

    // Verify the start point moved
    const after = (await editorPage.getAllObjects<any>())[0];
    expect(after.startX).not.toBeCloseTo(originalStartX, 0);
    expect(after.startY).not.toBeCloseTo(originalStartY, 0);

    await expect(editorPage.engine).toHaveScreenshot();
  });

  test('should move the end of a curved line by dragging the end handle', async ({ editorPage }) => {
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.dragFromTo({ x: 100, y: 200 }, { x: 300, y: 200 });

    await editorPage.waitForObjectsAdded();

    // Curve the line first
    await editorPage.dragLineHandle('center', 0, 80);

    // Capture coordinates after curving
    const before = (await editorPage.getAllObjects<any>())[0];
    const originalEndX = before.endX;
    const originalEndY = before.endY;

    // Now drag the end handle
    await editorPage.dragLineHandle('end', 60, -40);

    await editorPage.clearSelection();

    // Verify the end point moved while the curve is preserved
    const after = (await editorPage.getAllObjects<any>())[0];
    expect(after.endX).not.toBeCloseTo(originalEndX, 0);
    expect(after.endY).not.toBeCloseTo(originalEndY, 0);
    expect(after.controlX).toBeDefined();
    expect(after.controlY).toBeDefined();

    await expect(editorPage.engine).toHaveScreenshot();
  });

  test('should move the start of a curved line by dragging the start handle', async ({ editorPage }) => {
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.dragFromTo({ x: 100, y: 200 }, { x: 300, y: 200 });

    await editorPage.waitForObjectsAdded();

    // Curve the line first
    await editorPage.dragLineHandle('center', 0, 80);

    // Capture coordinates after curving
    const before = (await editorPage.getAllObjects<any>())[0];
    const originalStartX = before.startX;
    const originalStartY = before.startY;

    // Now drag the start handle
    await editorPage.dragLineHandle('start', -60, 40);

    await editorPage.clearSelection();

    // Verify the start point moved while the curve is preserved
    const after = (await editorPage.getAllObjects<any>())[0];
    expect(after.startX).not.toBeCloseTo(originalStartX, 0);
    expect(after.startY).not.toBeCloseTo(originalStartY, 0);
    expect(after.controlX).toBeDefined();
    expect(after.controlY).toBeDefined();

    await expect(editorPage.engine).toHaveScreenshot();
  });

  test('visual: line drawn with mouse', async ({ editorPage }) => {
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.dragFromTo({ x: 80, y: 120 }, { x: 320, y: 220 });

    await editorPage.waitForObjectsAdded();

    await expect(editorPage.engine).toHaveScreenshot();
  });
});
