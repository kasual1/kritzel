import { test, expect } from '../fixtures/editor.fixture';

test.describe('Editor', () => {
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

  test('controls fit inside the editor when it spans the full viewport', async ({ editorPage, page }) => {
    await editorPage.goto();
    await editorPage.waitForReady();

    await editorPage.controls.waitFor({ state: 'visible' });
    await editorPage.activateTool('brush');

    const viewport = page.viewportSize();
    const editorBox = await editorPage.editor.boundingBox();
    const controlsBox = await editorPage.controls.boundingBox();

    expect(viewport).not.toBeNull();
    expect(editorBox).not.toBeNull();
    expect(controlsBox).not.toBeNull();

    // Editor spans the viewport.
    expect(editorBox!.width).toBeCloseTo(viewport!.width, 0);

    // Controls fit horizontally inside the editor.
    expect(controlsBox!.width).toBeLessThanOrEqual(editorBox!.width);
    expect(controlsBox!.x).toBeGreaterThanOrEqual(editorBox!.x);
    expect(controlsBox!.x + controlsBox!.width).toBeLessThanOrEqual(editorBox!.x + editorBox!.width + 1);

    await expect(page).toHaveScreenshot('Editor-controls-fullscreen.png', { fullPage: true });
  });

  test('controls fit inside the editor when wrapped in a narrow container', async ({ editorPage, page }) => {
    const WRAPPER_WIDTH = 320;
    const WRAPPER_HEIGHT = 600;

    await editorPage.goto(`/e2e/wrapped-editor?width=${WRAPPER_WIDTH}&height=${WRAPPER_HEIGHT}`);
    await editorPage.waitForReady();

    await editorPage.controls.waitFor({ state: 'visible' });
    await editorPage.activateTool('brush');

    const editorBox = await editorPage.editor.boundingBox();
    const controlsBox = await editorPage.controls.boundingBox();

    expect(editorBox).not.toBeNull();
    expect(controlsBox).not.toBeNull();

    // Editor fills the wrapper content box (wrapper width minus 2 * 4px border).
    expect(Math.round(editorBox!.width)).toBe(WRAPPER_WIDTH - 8);

    // Controls must not be wider than the editor and must stay within its bounds.
    expect(controlsBox!.width).toBeLessThanOrEqual(editorBox!.width);
    expect(controlsBox!.x).toBeGreaterThanOrEqual(editorBox!.x - 1);
    expect(controlsBox!.x + controlsBox!.width).toBeLessThanOrEqual(editorBox!.x + editorBox!.width + 1);

    await expect(page).toHaveScreenshot('Editor-controls-wrapped.png', { fullPage: true });
  });

  test('settings dialog opens within the full-viewport editor', async ({ editorPage, page }) => {
    await editorPage.goto();
    await editorPage.waitForReady();

    // Open the more-menu (⋮ button) inside the editor's shadow DOM.
    await page.getByTestId('more-menu-button').click();

    // Click the Settings item in the dropdown.
    await page.getByTestId('menu-item-settings').click();

    // Wait for the settings dialog to be visible inside the editor.
    const settingsDialog = page.locator('kritzel-settings kritzel-dialog[is-open]');
    await settingsDialog.waitFor({ state: 'attached' });

    // The backdrop must be positioned within the editor bounds.
    const editorBox = await editorPage.editor.boundingBox();
    expect(editorBox).not.toBeNull();

    await expect(page).toHaveScreenshot('Editor-settings-dialog-fullscreen.png', { fullPage: true });
  });

  test('settings dialog stays within a wrapped editor container', async ({ editorPage, page }) => {
    const WRAPPER_WIDTH = 600;
    const WRAPPER_HEIGHT = 500;

    await editorPage.goto(`/e2e/wrapped-editor?width=${WRAPPER_WIDTH}&height=${WRAPPER_HEIGHT}`);
    await editorPage.waitForReady();

    // Open the more-menu (⋮ button) inside the editor's shadow DOM.
    await page.getByTestId('more-menu-button').click();

    // Click the Settings item in the dropdown.
    await page.getByTestId('menu-item-settings').click();

    // Wait for the settings dialog to be attached.
    const settingsDialog = page.locator('kritzel-settings kritzel-dialog[is-open]');
    await settingsDialog.waitFor({ state: 'attached' });

    // Allow the contained-dialog's ResizeObserver to compute the container rect.
    await page.waitForTimeout(100);

    // The dialog backdrop must stay within the editor / wrapper bounds.
    const editorBox = await editorPage.editor.boundingBox();
    expect(editorBox).not.toBeNull();

    await expect(page).toHaveScreenshot('Editor-settings-dialog-wrapped.png', { fullPage: true });
  });

  test('settings dialog stays within a large wrapped editor container', async ({ editorPage, page }) => {
    const WRAPPER_WIDTH = 1000;
    const WRAPPER_HEIGHT = 600;

    await editorPage.goto(`/e2e/wrapped-editor?width=${WRAPPER_WIDTH}&height=${WRAPPER_HEIGHT}`);
    await editorPage.waitForReady();

    // Open the more-menu (⋮ button) inside the editor's shadow DOM.
    await page.getByTestId('more-menu-button').click();

    // Click the Settings item in the dropdown.
    await page.getByTestId('menu-item-settings').click();

    // Wait for the settings dialog to be attached.
    const settingsDialog = page.locator('kritzel-settings kritzel-dialog[is-open]');
    await settingsDialog.waitFor({ state: 'attached' });

    // Allow the contained-dialog's ResizeObserver to compute the container rect.
    await page.waitForTimeout(100);

    // The dialog backdrop must stay within the editor / wrapper bounds.
    const editorBox = await editorPage.editor.boundingBox();
    expect(editorBox).not.toBeNull();

    await expect(page).toHaveScreenshot('Editor-settings-dialog-wrapped-large.png', { fullPage: true });
  });
});
