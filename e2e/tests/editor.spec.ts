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

  // test('controls fit inside the editor when it spans the full viewport', async ({ editorPage, page }) => {
  //   await editorPage.goto();
  //   await editorPage.waitForReady();

  //   await editorPage.controls.waitFor({ state: 'visible' });

  //   const viewport = page.viewportSize();
  //   const editorBox = await editorPage.editor.boundingBox();
  //   const controlsBox = await editorPage.controls.boundingBox();

  //   expect(viewport).not.toBeNull();
  //   expect(editorBox).not.toBeNull();
  //   expect(controlsBox).not.toBeNull();

  //   // Editor spans the viewport.
  //   expect(editorBox!.width).toBeCloseTo(viewport!.width, 0);

  //   // Controls fit horizontally inside the editor.
  //   expect(controlsBox!.width).toBeLessThanOrEqual(editorBox!.width);
  //   expect(controlsBox!.x).toBeGreaterThanOrEqual(editorBox!.x);
  //   expect(controlsBox!.x + controlsBox!.width).toBeLessThanOrEqual(editorBox!.x + editorBox!.width + 1);

  //   await expect(editorPage.controls).toHaveScreenshot('controls-fullscreen.png');
  // });

  // test('controls fit inside the editor when wrapped in a narrow container', async ({ editorPage, page }) => {
  //   await editorPage.goto();
  //   await editorPage.waitForReady();

  //   // Constrain the editor to a narrow box, simulating embedding it inside a
  //   // wrapper component that does not span the full page.
  //   const WRAPPER_WIDTH = 420;
  //   const WRAPPER_HEIGHT = 600;

  //   await page.evaluate(({ w, h }) => {
  //     const editor = document.querySelector('kritzel-editor') as HTMLElement | null;
  //     if (!editor) throw new Error('kritzel-editor not found');
  //     // Use !important to override the demos' "fill the page" styles.
  //     editor.setAttribute(
  //       'style',
  //       `width: ${w}px !important; height: ${h}px !important; flex: 0 0 auto !important;`
  //     );
  //   }, { w: WRAPPER_WIDTH, h: WRAPPER_HEIGHT });

  //   // Allow the browser to perform layout after resizing.
  //   await page.waitForFunction(
  //     (expectedWidth) => {
  //       const editor = document.querySelector('kritzel-editor') as HTMLElement | null;
  //       return !!editor && Math.round(editor.getBoundingClientRect().width) === expectedWidth;
  //     },
  //     WRAPPER_WIDTH
  //   );

  //   await editorPage.controls.waitFor({ state: 'visible' });

  //   const editorBox = await editorPage.editor.boundingBox();
  //   const controlsBox = await editorPage.controls.boundingBox();

  //   expect(editorBox).not.toBeNull();
  //   expect(controlsBox).not.toBeNull();

  //   // Editor really is the narrow size we asked for.
  //   expect(Math.round(editorBox!.width)).toBe(WRAPPER_WIDTH);

  //   // Controls must not be wider than the editor and must stay within its bounds.
  //   expect(controlsBox!.width).toBeLessThanOrEqual(editorBox!.width);
  //   expect(controlsBox!.x).toBeGreaterThanOrEqual(editorBox!.x - 1);
  //   expect(controlsBox!.x + controlsBox!.width).toBeLessThanOrEqual(editorBox!.x + editorBox!.width + 1);

  //   await expect(editorPage.editor).toHaveScreenshot('controls-wrapped.png');
  // });
});
