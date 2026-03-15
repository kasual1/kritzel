import { test, expect } from '../fixtures/editor.fixture';

test.describe('Editor loads', () => {
  test('should render the kritzel-editor element', async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();

    await expect(editorPage.editor).toBeAttached();
  });

  test('should render the kritzel-engine', async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();

    await expect(editorPage.engine).toBeVisible();
  });

  test('should allow setting props', async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();

    await editorPage.setProps({ isControlsVisible: false });
    const visible = await editorPage.getProp<boolean>('isControlsVisible');

    expect(visible).toBe(false);
  });

  test('should programmatically add a shape', async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();

    // Set up event listener before adding, to avoid race condition
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 100,
      translateY: 100,
      width: 200,
      height: 150,
      fillColor: { light: '#00ff00', dark: '#00ff00' },
    });

    // Verify object count
    const count = await editorPage.getObjectsTotalCount();
    expect(count).toBe(1);

    // Verify DOM elements are rendered
    expect(await editorPage.getObjectElementCount()).toBe(1);
    expect(await editorPage.getSvgElementCount()).toBe(1);

    // Wait for engine to finish rendering, then visual regression check
    await editorPage.waitForObjectsAdded();
    await expect(editorPage.engine).toHaveScreenshot({});
  });

  test('should programmatically add a path', async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();

    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.addPath({
      points: [
        [0, 0],
        [50, 50],
        [100, 25],
        [150, 75],
        [200, 0],
      ],
      translateX: 0,
      translateY: 0,
      strokeWidth: 4,
      fill: { light: '#ff0000', dark: '#ff0000' },
    });

    // Verify object count
    const count = await editorPage.getObjectsTotalCount();
    expect(count).toBe(1);

    // Verify DOM elements are rendered
    expect(await editorPage.getObjectElementCount()).toBe(1);
    expect(await editorPage.getSvgElementCount()).toBe(1);

    // Wait for engine to finish rendering, then visual regression check
    await editorPage.waitForObjectsAdded();
    await expect(editorPage.engine).toHaveScreenshot({timeout: 1000});
  });

  test('should programmatically add text', async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();

    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.addText({
      text: 'Hello World',
      translateX: 240,
      translateY: 175,
      fontSize: 36,
    });

    // Verify object count
    const count = await editorPage.getObjectsTotalCount();
    expect(count).toBe(1);

    // Verify DOM elements are rendered
    expect(await editorPage.getObjectElementCount()).toBe(1);
    expect(await editorPage.getSvgElementCount()).toBe(0);

    // Wait for engine to finish rendering, then visual regression check
    await editorPage.waitForObjectsAdded();
    await expect(editorPage.engine).toHaveScreenshot({timeout: 1000});
  });
});
