import { test, expect } from '../fixtures/editor.fixture';

test.describe('Brush tool', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
    await editorPage.waitForEngine();
    await editorPage.activateTool('brush');
  });

  test('should draw a path by clicking and dragging on the canvas', async ({ editorPage }) => {
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.drawStroke([
      { x: 100, y: 100 },
      { x: 150, y: 120 },
      { x: 200, y: 80 },
      { x: 250, y: 130 },
      { x: 300, y: 100 },
    ]);

    await editorPage.waitForObjectsAdded();

    const count = await editorPage.getObjectsTotalCount();
    expect(count).toBe(1);
  });

  test('should create a KritzelPath object after drawing', async ({ editorPage }) => {
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.drawStroke([
      { x: 100, y: 100 },
      { x: 200, y: 150 },
      { x: 300, y: 100 },
    ]);

    await editorPage.waitForObjectsAdded();

    const objects = await editorPage.getAllObjects<any>();
    expect(objects).toHaveLength(1);
    expect(objects[0].id).toBeDefined();
    // KritzelPath objects have a points array and strokeWidth
    expect(objects[0].points).toBeDefined();
    expect(objects[0].points.length).toBeGreaterThanOrEqual(2);
    expect(objects[0].strokeWidth).toBeDefined();
  });

  test('should draw with the configured stroke width', async ({ editorPage }) => {
    // The default brush config has size: 16
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.drawStroke([
      { x: 100, y: 200 },
      { x: 200, y: 200 },
      { x: 300, y: 200 },
    ]);

    await editorPage.waitForObjectsAdded();

    const objects = await editorPage.getAllObjects<any>();
    expect(objects).toHaveLength(1);
    expect(objects[0].strokeWidth).toBe(16);
  });

  test('should draw with the configured color', async ({ editorPage }) => {
    // Default brush color is the first palette entry: { light: '#000000', dark: '#ffffff' }
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.drawStroke([
      { x: 100, y: 200 },
      { x: 200, y: 200 },
      { x: 300, y: 200 },
    ]);

    await editorPage.waitForObjectsAdded();

    const objects = await editorPage.getAllObjects<any>();
    expect(objects).toHaveLength(1);
    expect(objects[0].fill.light).toBe('#000000');
  });

  test('drawn path should have SVG element in DOM', async ({ editorPage }) => {
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.drawStroke([
      { x: 100, y: 100 },
      { x: 150, y: 150 },
      { x: 200, y: 100 },
      { x: 250, y: 150 },
    ]);

    await editorPage.waitForObjectsAdded();

    expect(await editorPage.getObjectElementCount()).toBe(1);
    expect(await editorPage.getSvgElementCount()).toBe(1);
  });

  test('visual: single brush stroke', async ({ editorPage }) => {
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.drawStroke([
      { x: 80, y: 150 },
      { x: 130, y: 110 },
      { x: 180, y: 170 },
      { x: 230, y: 100 },
      { x: 280, y: 160 },
      { x: 330, y: 120 },
    ]);

    await editorPage.waitForObjectsAdded();

    await expect(editorPage.engine).toHaveScreenshot();
  });

  test('visual: multiple brush strokes', async ({ editorPage }) => {
    // First stroke
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.drawStroke([
      { x: 80, y: 100 },
      { x: 150, y: 80 },
      { x: 220, y: 120 },
      { x: 300, y: 90 },
    ]);

    await editorPage.waitForObjectsAdded();

    // Second stroke
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.drawStroke([
      { x: 80, y: 200 },
      { x: 150, y: 220 },
      { x: 220, y: 180 },
      { x: 300, y: 210 },
    ]);

    await editorPage.waitForObjectsAdded();

    const count = await editorPage.getObjectsTotalCount();
    expect(count).toBe(2);

    await expect(editorPage.engine).toHaveScreenshot();
  });
});
