import { test, expect, type EditorPage } from '../../fixtures/editor.fixture';

async function addObjectsToWorkspace(editorPage: EditorPage) {
  await editorPage.prepareWaitForObjectsAdded();
  await editorPage.addShape({
    shapeType: 'rectangle',
    translateX: -220,
    translateY: -120,
    width: 140,
    height: 90,
    fillColor: { light: '#ff7f50', dark: '#ff7f50' },
    strokeColor: { light: '#000000', dark: '#ffffff' },
    strokeWidth: 2,
  });
  await editorPage.waitForObjectsAdded();

  await editorPage.prepareWaitForObjectsAdded();
  await editorPage.addPath({
    points: [
      [0, 0],
      [70, 40],
      [150, 10],
      [230, 80],
      [310, 20],
    ],
    translateX: -40,
    translateY: -30,
    strokeWidth: 6,
    fill: { light: '#2e86de', dark: '#2e86de' },
  });
  await editorPage.waitForObjectsAdded();

  await editorPage.prepareWaitForObjectsAdded();
  await editorPage.addText({
    text: 'Zoom Panel Visual Test',
    translateX: 70,
    translateY: 120,
    fontSize: 28,
  });
  await editorPage.waitForObjectsAdded();

  await editorPage.clearSelection();
}

test.describe('Zoom panel', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
    await addObjectsToWorkspace(editorPage);
  });

  test('zooms in one step and updates viewport', async ({ editorPage }) => {
    const initialViewport = await editorPage.getViewport();
    const initialZoomPercent = await editorPage.getZoomPercent();

    await editorPage.clickZoomIn();

    const zoomedViewport = await editorPage.getViewport();
    const zoomedPercent = await editorPage.getZoomPercent();

    expect(zoomedViewport.scale).toBeGreaterThan(initialViewport.scale);
    expect(zoomedPercent).toBeGreaterThan(initialZoomPercent);
    await expect(editorPage.engine).toHaveScreenshot('zoom-panel-objects-zoom-in-1x.png', { timeout: 1000 });
  });

  test('zooms in multiple steps and renders larger content', async ({ editorPage }) => {
    const initialZoomPercent = await editorPage.getZoomPercent();

    await editorPage.clickZoomIn();
    const zoomAfterFirstStep = await editorPage.getZoomPercent();
    await editorPage.clickZoomIn();
    const zoomAfterSecondStep = await editorPage.getZoomPercent();
    await editorPage.clickZoomIn();
    const zoomAfterThirdStep = await editorPage.getZoomPercent();

    expect(zoomAfterFirstStep).toBeGreaterThan(initialZoomPercent);
    expect(zoomAfterSecondStep).toBeGreaterThan(zoomAfterFirstStep);
    expect(zoomAfterThirdStep).toBeGreaterThan(zoomAfterSecondStep);
    await expect(editorPage.engine).toHaveScreenshot('zoom-panel-objects-zoom-in-3x.png', { timeout: 1000 });
  });

  test('zooms out after zooming in and reflects the intermediate level', async ({ editorPage }) => {
    const initialZoomPercent = await editorPage.getZoomPercent();

    await editorPage.clickZoomIn();
    const zoomAfterFirstStep = await editorPage.getZoomPercent();
    await editorPage.clickZoomIn();
    const zoomAfterSecondStep = await editorPage.getZoomPercent();
    await editorPage.clickZoomOut();
    const zoomAfterZoomOut = await editorPage.getZoomPercent();

    expect(zoomAfterFirstStep).toBeGreaterThan(initialZoomPercent);
    expect(zoomAfterSecondStep).toBeGreaterThan(zoomAfterFirstStep);
    expect(zoomAfterZoomOut).toBeLessThan(zoomAfterSecondStep);
    expect(zoomAfterZoomOut).toBeGreaterThan(initialZoomPercent);
    await expect(editorPage.engine).toHaveScreenshot('zoom-panel-objects-zoom-in-then-out.png', { timeout: 1000 });
  });
});