import { test, expect } from '../../fixtures/editor.fixture';

/**
 * Wait for the context menu to become visible in the engine's shadow DOM and for
 * the component's async item-processing to finish, then let the browser paint.
 */
async function waitForContextMenu(page: import('@playwright/test').Page, timeout = 4_000) {
  const menuContainer = page.locator('kritzel-editor kritzel-context-menu >>> .menu-container').first();
  await menuContainer.waitFor({ state: 'visible', timeout });
  // Allow the component's processItems (async) + adjustPositionToViewport to run
  await page.evaluate(
    () =>
      new Promise<void>(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

/**
 * Trigger a context menu by right-clicking at page coordinates. Prefer an
 * element-targeted click on the engine to reduce coordinate drift in CI.
 */
async function rightClickAt(page: import('@playwright/test').Page, x: number, y: number) {
  const engine = page.locator('kritzel-engine').first();
  const box = await engine.boundingBox();

  if (box && box.width > 2 && box.height > 2) {
    const relativeX = Math.min(Math.max(x - box.x, 1), box.width - 1);
    const relativeY = Math.min(Math.max(y - box.y, 1), box.height - 1);

    await engine.click({
      button: 'right',
      position: { x: relativeX, y: relativeY },
      force: true,
    });
    return;
  }

  await page.mouse.click(x, y, { button: 'right' });
}

/**
 * Open the context menu with one automatic retry. In CI, the first contextmenu
 * event can occasionally be ignored (e.g. transient skipContextMenu state).
 */
async function openContextMenuAt(page: import('@playwright/test').Page, x: number, y: number) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    await rightClickAt(page, x, y);

    try {
      await waitForContextMenu(page);
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(50);
    }
  }

  throw lastError ?? new Error('Failed to open context menu');
}

/**
 * Get the bounding rect of the context menu element rendered inside the engine
 * shadow DOM. Returns null when no menu is visible.
 */
async function getContextMenuRect(
  page: import('@playwright/test').Page,
): Promise<{ x: number; y: number; width: number; height: number } | null> {
  const menuContainer = page.locator('kritzel-editor kritzel-context-menu >>> .menu-container').first();
  const box = await menuContainer.boundingBox();
  if (!box) {
    return null;
  }

  return { x: box.x, y: box.y, width: box.width, height: box.height };
}

async function clickFirstEnabledContextMenuItem(page: import('@playwright/test').Page): Promise<void> {
  const enabledItem = page
    .locator('kritzel-editor kritzel-context-menu')
    .getByRole('button')
    .first();
  await enabledItem.click();
}

async function waitForContextMenuToClose(page: import('@playwright/test').Page, timeout = 4_000): Promise<void> {
  const menuHost = page.locator('kritzel-editor kritzel-context-menu');
  await expect(menuHost).toHaveCount(0, { timeout });
}

async function waitForTextObjectLayoutToStabilize(
  page: import('@playwright/test').Page,
  objectId: string,
): Promise<void> {
  await page.evaluate(async id => {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const editor = document.querySelector('kritzel-editor') as any;
    if (!editor) {
      throw new Error('kritzel-editor not found');
    }

    const readDimensions = async () => {
      const obj = await editor.getObjectById(id);
      if (!obj) {
        return null;
      }

      return {
        width: Number(obj.width ?? 0),
        height: Number(obj.height ?? 0),
      };
    };

    let stableSamples = 0;
    let last = await readDimensions();

    for (let i = 0; i < 20; i++) {
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const current = await readDimensions();
      if (!current || !last) {
        continue;
      }

      const widthStable = Math.abs(current.width - last.width) < 0.5;
      const heightStable = Math.abs(current.height - last.height) < 0.5;

      if (widthStable && heightStable) {
        stableSamples += 1;
      } else {
        stableSamples = 0;
      }

      last = current;

      if (stableSamples >= 2) {
        return;
      }
    }
  }, objectId);
}

test.describe('Context Menu', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
  });

  // ---------------------------------------------------------------------------
  // Global context menu (no selection)
  // ---------------------------------------------------------------------------

  test.describe('global context menu', () => {
    test('should show global context menu on right-click on empty canvas', async ({ editorPage }) => {
      const box = await editorPage.getEngineBoundingBox();
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;

      await openContextMenuAt(editorPage.page, centerX, centerY);

      const rect = await getContextMenuRect(editorPage.page);
      expect(rect).not.toBeNull();
      expect(rect!.width).toBeGreaterThan(0);
      expect(rect!.height).toBeGreaterThan(0);

      await expect(editorPage.page.locator('kritzel-editor')).toHaveScreenshot();
    });

    test('global context menu at center should be positioned near the click point', async ({
      editorPage,
    }) => {
      const box = await editorPage.getEngineBoundingBox();
      const clickX = box.x + box.width / 2;
      const clickY = box.y + box.height / 2;

      await openContextMenuAt(editorPage.page, clickX, clickY);

      const rect = await getContextMenuRect(editorPage.page);
      expect(rect).not.toBeNull();

      // Menu top-left should be within 20px of the click point
      expect(Math.abs(rect!.x - clickX)).toBeLessThan(20);
      expect(Math.abs(rect!.y - clickY)).toBeLessThan(20);
    });

    test('global context menu should stay within viewport when opened near the bottom edge', async ({
      editorPage,
    }) => {
      const box = await editorPage.getEngineBoundingBox();
      // Click very close to the bottom of the engine / viewport
      const clickX = box.x + box.width / 2;
      const clickY = box.y + box.height - 10;

      await openContextMenuAt(editorPage.page, clickX, clickY);

      const rect = await getContextMenuRect(editorPage.page);
      expect(rect).not.toBeNull();

      // The menu must not overflow the bottom of the viewport
      expect(rect!.y + rect!.height).toBeLessThanOrEqual(editorPage.page.viewportSize()!.height + 1);

      await expect(editorPage.page.locator('kritzel-editor')).toHaveScreenshot();
    });

    test('global context menu should stay within viewport when opened near the right edge', async ({
      editorPage,
    }) => {
      const box = await editorPage.getEngineBoundingBox();
      const clickX = box.x + box.width - 10;
      const clickY = box.y + box.height / 2;

      await openContextMenuAt(editorPage.page, clickX, clickY);

      const rect = await getContextMenuRect(editorPage.page);
      expect(rect).not.toBeNull();

      const viewportWidth = editorPage.page.viewportSize()!.width;
      expect(rect!.x + rect!.width).toBeLessThanOrEqual(viewportWidth + 1);

      await expect(editorPage.page.locator('kritzel-editor')).toHaveScreenshot();
    });

    test('global context menu should stay within viewport when opened at the bottom-right corner', async ({
      editorPage,
    }) => {
      const box = await editorPage.getEngineBoundingBox();
      const clickX = box.x + box.width - 10;
      const clickY = box.y + box.height - 10;

      await openContextMenuAt(editorPage.page, clickX, clickY);

      const rect = await getContextMenuRect(editorPage.page);
      expect(rect).not.toBeNull();

      const { width: vpWidth, height: vpHeight } = editorPage.page.viewportSize()!;
      expect(rect!.x + rect!.width).toBeLessThanOrEqual(vpWidth + 1);
      expect(rect!.y + rect!.height).toBeLessThanOrEqual(vpHeight + 1);

      await expect(editorPage.page.locator('kritzel-editor')).toHaveScreenshot();
    });

    test('global context menu should stay within viewport when opened near the top-left corner', async ({
      editorPage,
    }) => {
      const box = await editorPage.getEngineBoundingBox();
      const clickX = box.x + 5;
      const clickY = box.y + 5;

      await openContextMenuAt(editorPage.page, clickX, clickY);

      const rect = await getContextMenuRect(editorPage.page);
      expect(rect).not.toBeNull();

      expect(rect!.x).toBeGreaterThanOrEqual(0);
      expect(rect!.y).toBeGreaterThanOrEqual(0);

      await expect(editorPage.page.locator('kritzel-editor')).toHaveScreenshot();
    });
  });

  // ---------------------------------------------------------------------------
  // Object context menu (with selection)
  // ---------------------------------------------------------------------------

  test.describe('object context menu', () => {
    test('should show object context menu on right-click on a selected shape', async ({
      editorPage,
    }) => {
      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 0,
        translateY: 0,
        width: 200,
        height: 150,
        fillColor: { light: '#4a90d9', dark: '#4a90d9' },
      });

      await editorPage.selectObjects([shape]);

      const { pageX, pageY } = await editorPage.worldToPage(100, 75);
      await openContextMenuAt(editorPage.page, pageX, pageY);

      const rect = await getContextMenuRect(editorPage.page);
      expect(rect).not.toBeNull();
      expect(rect!.width).toBeGreaterThan(0);
      expect(rect!.height).toBeGreaterThan(0);

      await expect(editorPage.page.locator('kritzel-editor')).toHaveScreenshot();
    });

    test('object context menu should stay within viewport when object is near the right edge', async ({
      editorPage,
    }) => {
      const viewport = await editorPage.getViewport();

      // Place the shape so its center maps close to the right of the visible area
      const worldX = viewport.width / 2 - 150;

      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: worldX,
        translateY: 0,
        width: 200,
        height: 150,
        fillColor: { light: '#5db85d', dark: '#5db85d' },
      });

      await editorPage.selectObjects([shape]);

      const { pageX, pageY } = await editorPage.worldToPage(worldX + 100, 75);
      await openContextMenuAt(editorPage.page, pageX, pageY);

      const rect = await getContextMenuRect(editorPage.page);
      expect(rect).not.toBeNull();

      const { width: vpWidth } = editorPage.page.viewportSize()!;
      expect(rect!.x + rect!.width).toBeLessThanOrEqual(vpWidth + 1);

      await expect(editorPage.page.locator('kritzel-engine')).toHaveScreenshot();
    });

    test('object context menu should stay within viewport when object is near the bottom-right corner', async ({
      editorPage,
    }) => {
      const viewport = await editorPage.getViewport();

      const worldX = viewport.width / 2 - 150;
      const worldY = viewport.height / 2 - 100;

      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: worldX,
        translateY: worldY,
        width: 200,
        height: 150,
        fillColor: { light: '#9b59b6', dark: '#9b59b6' },
      });

      await editorPage.selectObjects([shape]);

      const { pageX, pageY } = await editorPage.worldToPage(worldX + 100, worldY + 75);
      await openContextMenuAt(editorPage.page, pageX, pageY);

      const rect = await getContextMenuRect(editorPage.page);
      expect(rect).not.toBeNull();

      const { width: vpWidth, height: vpHeight } = editorPage.page.viewportSize()!;
      expect(rect!.x + rect!.width).toBeLessThanOrEqual(vpWidth + 1);
      expect(rect!.y + rect!.height).toBeLessThanOrEqual(vpHeight + 1);

      await expect(editorPage.page.locator('kritzel-engine')).toHaveScreenshot();
    });

    test('does not show export actions in object context menu', async ({ editorPage }) => {

      await editorPage.prepareWaitForObjectsAdded();
      const text = await editorPage.addText({
        text: 'No export actions',
        translateX: -120,
        translateY: -80,
        fontSize: 28,
      });
      await editorPage.waitForObjectsAdded();
      await waitForTextObjectLayoutToStabilize(editorPage.page, String(text.id));

      const { pageX, pageY } = await editorPage.worldToPage(-80, -60);
      await openContextMenuAt(editorPage.page, pageX, pageY);

      const menuHost = editorPage.page.locator('kritzel-editor kritzel-context-menu');
      await expect(menuHost.getByRole('button', { name: /^Export$/i })).toHaveCount(0);
      await expect(menuHost.getByRole('button', { name: /^Export as PNG$/i })).toHaveCount(0);
      await expect(menuHost.getByRole('button', { name: /^Export as SVG$/i })).toHaveCount(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Context menu dismissal
  // ---------------------------------------------------------------------------

  test.describe('dismissal', () => {
    test('context menu should close when clicking outside', async ({ editorPage }) => {
      const box = await editorPage.getEngineBoundingBox();
      const clickX = box.x + box.width / 2;
      const clickY = box.y + box.height / 2;

      await openContextMenuAt(editorPage.page, clickX, clickY);

      // Left-click anywhere else to dismiss
      await editorPage.page.mouse.click(clickX + 200, clickY + 200);
      await editorPage.page.evaluate(
        () =>
          new Promise<void>(resolve =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      await waitForContextMenuToClose(editorPage.page);
    });

    test('context menu should close after an action is selected', async ({ editorPage }) => {
      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 0,
        translateY: 0,
        width: 200,
        height: 150,
        fillColor: { light: '#4a90d9', dark: '#4a90d9' },
      });

      await editorPage.selectObjects([shape]);
      await editorPage.copy();

      const box = await editorPage.getEngineBoundingBox();
      await openContextMenuAt(editorPage.page, box.x + box.width / 2, box.y + box.height / 2);

      // Click the "Paste" item (visible because we just copied a shape)
      await clickFirstEnabledContextMenuItem(editorPage.page);

      await editorPage.page.evaluate(
        () =>
          new Promise<void>(resolve =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      await waitForContextMenuToClose(editorPage.page);
    });
  });

  // ---------------------------------------------------------------------------
  // Zoomed-out scenario (scale < 1) — paste position accuracy
  // ---------------------------------------------------------------------------

  test.describe('zoomed-out paste position', () => {
    test('global context menu near bottom edge at 50% zoom should appear near the cursor', async ({
      editorPage,
    }) => {
      await editorPage.zoomTo(0.5);
      // Wait for zoom animation to settle
      await editorPage.page.waitForTimeout(300);

      const box = await editorPage.getEngineBoundingBox();
      const clickX = box.x + box.width / 2;
      // Near the bottom of the viewport where the controls panel lives
      const clickY = box.y + box.height - 80;

      await openContextMenuAt(editorPage.page, clickX, clickY);

      const rect = await getContextMenuRect(editorPage.page);
      expect(rect).not.toBeNull();

      // Menu top should be near the click point (within 30px — it may shift slightly
      // upward when close to the bottom, but should not jump far away)
      expect(Math.abs(rect!.y - clickY)).toBeLessThan(rect!.height + 30);

      // Must stay within viewport
      const { width: vpWidth, height: vpHeight } = editorPage.page.viewportSize()!;
      expect(rect!.x + rect!.width).toBeLessThanOrEqual(vpWidth + 1);
      expect(rect!.y + rect!.height).toBeLessThanOrEqual(vpHeight + 1);

      await expect(editorPage.page.locator('kritzel-editor')).toHaveScreenshot();
    });

    test('object context menu near bottom edge at 25% zoom should appear near the cursor', async ({
      editorPage,
    }) => {
      await editorPage.zoomTo(0.25);
      await editorPage.page.waitForTimeout(300);

      const viewport = await editorPage.getViewport();

      // A shape visible at very low zoom, placed toward the bottom of the world
      const worldY = viewport.height / 2 - 200;
      const shape = await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: -150,
        translateY: worldY,
        width: 300,
        height: 200,
        fillColor: { light: '#e74c3c', dark: '#e74c3c' },
      });

      await editorPage.selectObjects([shape]);

      const { pageX, pageY } = await editorPage.worldToPage(0, worldY + 100);
      await openContextMenuAt(editorPage.page, pageX, pageY);

      const rect = await getContextMenuRect(editorPage.page);
      expect(rect).not.toBeNull();

      // Must stay within viewport
      const { width: vpWidth, height: vpHeight } = editorPage.page.viewportSize()!;
      expect(rect!.x + rect!.width).toBeLessThanOrEqual(vpWidth + 1);
      expect(rect!.y + rect!.height).toBeLessThanOrEqual(vpHeight + 1);

      await expect(editorPage.page.locator('kritzel-editor')).toHaveScreenshot();
    });
  });
});
