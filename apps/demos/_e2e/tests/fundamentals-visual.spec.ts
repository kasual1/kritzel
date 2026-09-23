import { test, expect } from '../fixtures/editor.fixture';

async function waitForFundamentalPage(editorPage: { page: import('@playwright/test').Page; waitForReady: () => Promise<void> }) {
  const { page } = editorPage;

  await page.waitForFunction(
    () => !!document.querySelector('kritzel-editor') || !!document.querySelector('kritzel-engine'),
    undefined,
    { timeout: 15_000 },
  );

  if ((await page.locator('kritzel-editor').count()) > 0) {
    await editorPage.waitForReady();
    return;
  }

  await page.locator('kritzel-engine').first().waitFor({ state: 'visible', timeout: 15_000 });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
}

// Shared body for each route's screenshot test, invoked individually below so every page has its own, independently runnable test.
async function expectFundamentalScreenshot(
  editorPage: Parameters<typeof waitForFundamentalPage>[0],
  route: string,
  routeName: string,
  target: 'page' | 'editor' = 'page',
) {
  await editorPage.goto(route);
  await waitForFundamentalPage(editorPage);

  const screenshotTarget = target === 'editor' ? editorPage.page.locator('kritzel-editor').first() : editorPage.page;

  await expect(screenshotTarget).toHaveScreenshot(`${routeName}.png`);
}

test.describe('Fundamentals Pages Visual Regression', () => {
  test('should match screenshot for fundamentals-controls-context-menus-canvas-quick-actions', async ({ editorPage }) => {
    await expectFundamentalScreenshot(
      editorPage,
      '/fundamentals/controls/context-menus-canvas-quick-actions',
      'fundamentals-controls-context-menus-canvas-quick-actions',
    );
  });

  test('should match screenshot for fundamentals-controls-context-menus-clipboard-actions', async ({ editorPage }) => {
    await expectFundamentalScreenshot(
      editorPage,
      '/fundamentals/controls/context-menus-clipboard-actions',
      'fundamentals-controls-context-menus-clipboard-actions',
    );
  });

  test('should match screenshot for fundamentals-controls-context-menus-object-inspector', async ({ editorPage }) => {
    await expectFundamentalScreenshot(
      editorPage,
      '/fundamentals/controls/context-menus-object-inspector',
      'fundamentals-controls-context-menus-object-inspector',
    );
  });

  test('should match screenshot for fundamentals-controls-context-menus-smart-conditional', async ({ editorPage }) => {
    await expectFundamentalScreenshot(
      editorPage,
      '/fundamentals/controls/context-menus-smart-conditional',
      'fundamentals-controls-context-menus-smart-conditional',
    );
  });

  test('should match screenshot for fundamentals-controls-workspace-manager-open', async ({ editorPage }) => {
    await expectFundamentalScreenshot(
      editorPage,
      '/fundamentals/controls/workspace-manager-open',
      'fundamentals-controls-workspace-manager-open',
    );
  });

  test('should match screenshot for fundamentals-controls-more-menu-open', async ({ editorPage }) => {
    await expectFundamentalScreenshot(
      editorPage,
      '/fundamentals/controls/more-menu-open',
      'fundamentals-controls-more-menu-open',
    );
  });

  test('should match screenshot for fundamentals-controls-toolbar-utility-panel', async ({ editorPage }) => {
    await expectFundamentalScreenshot(
      editorPage,
      '/fundamentals/controls/toolbar-utility-panel',
      'fundamentals-controls-toolbar-utility-panel',
    );
  });

  test('should match screenshot for fundamentals-controls-zoom-panel-toggle', async ({ editorPage }) => {
    await expectFundamentalScreenshot(
      editorPage,
      '/fundamentals/controls/zoom-panel-toggle',
      'fundamentals-controls-zoom-panel-toggle',
    );
  });

  test('should match screenshot for fundamentals-controls-notifications-trigger', async ({ editorPage }) => {
    await expectFundamentalScreenshot(
      editorPage,
      '/fundamentals/controls/notifications-trigger',
      'fundamentals-controls-notifications-trigger',
    );
  });

  test('should match screenshot for fundamentals-objects-add', async ({ editorPage }) => {
    await expectFundamentalScreenshot(editorPage, '/fundamentals/objects/add', 'fundamentals-objects-add');
  });

  test('should match screenshot for fundamentals-objects-remove', async ({ editorPage }) => {
    await expectFundamentalScreenshot(editorPage, '/fundamentals/objects/remove', 'fundamentals-objects-remove');
  });

  test('should match screenshot for fundamentals-objects-grouping', async ({ editorPage }) => {
    await expectFundamentalScreenshot(editorPage, '/fundamentals/objects/grouping', 'fundamentals-objects-grouping');
  });

  test('should match screenshot for fundamentals-objects-ordering', async ({ editorPage }) => {
    await expectFundamentalScreenshot(editorPage, '/fundamentals/objects/ordering', 'fundamentals-objects-ordering');
  });

  test('should match screenshot for fundamentals-objects-filter', async ({ editorPage }) => {
    await expectFundamentalScreenshot(editorPage, '/fundamentals/objects/filter', 'fundamentals-objects-filter');
  });

  test('should match screenshot for fundamentals-objects-selection', async ({ editorPage }) => {
    await expectFundamentalScreenshot(editorPage, '/fundamentals/objects/selection', 'fundamentals-objects-selection');
  });

  test('should match screenshot for fundamentals-objects-update', async ({ editorPage }) => {
    await expectFundamentalScreenshot(editorPage, '/fundamentals/objects/update', 'fundamentals-objects-update');
  });

  test('should match screenshot for fundamentals-persistence-local', async ({ editorPage }) => {
    await expectFundamentalScreenshot(editorPage, '/fundamentals/persistence/local', 'fundamentals-persistence-local');
  });

  test('should match screenshot for fundamentals-tools-change', async ({ editorPage }) => {
    await expectFundamentalScreenshot(editorPage, '/fundamentals/tools/change', 'fundamentals-tools-change');
  });

  test('should match screenshot for fundamentals-tools-config', async ({ editorPage }) => {
    await expectFundamentalScreenshot(editorPage, '/fundamentals/tools/config', 'fundamentals-tools-config');
  });

  test('should match screenshot for fundamentals-tools-disable', async ({ editorPage }) => {
    await expectFundamentalScreenshot(editorPage, '/fundamentals/tools/disable', 'fundamentals-tools-disable');
  });

  test('should match screenshot for fundamentals-tools-register', async ({ editorPage }) => {
    await expectFundamentalScreenshot(editorPage, '/fundamentals/tools/register', 'fundamentals-tools-register');
  });

  test('should match screenshot for fundamentals-tools-toolbar', async ({ editorPage }) => {
    await expectFundamentalScreenshot(editorPage, '/fundamentals/tools/toolbar', 'fundamentals-tools-toolbar');
  });

  test('should match screenshot for fundamentals-viewport-pan', async ({ editorPage }) => {
    await expectFundamentalScreenshot(editorPage, '/fundamentals/viewport/pan', 'fundamentals-viewport-pan');
  });

  test('should match screenshot for fundamentals-viewport-zoom', async ({ editorPage }) => {
    await expectFundamentalScreenshot(editorPage, '/fundamentals/viewport/zoom', 'fundamentals-viewport-zoom');
  });

  test('should match screenshot for fundamentals-viewport-limits', async ({ editorPage }) => {
    await expectFundamentalScreenshot(editorPage, '/fundamentals/viewport/limits', 'fundamentals-viewport-limits');
  });

  test('should match screenshot for fundamentals-viewport-boundaries', async ({ editorPage }) => {
    await expectFundamentalScreenshot(editorPage, '/fundamentals/viewport/boundaries', 'fundamentals-viewport-boundaries');
  });

  test('should match screenshot for fundamentals-viewport-events', async ({ editorPage }) => {
    await expectFundamentalScreenshot(editorPage, '/fundamentals/viewport/events', 'fundamentals-viewport-events');
  });

  test('should match screenshot for fundamentals-viewport-center', async ({ editorPage }) => {
    await expectFundamentalScreenshot(editorPage, '/fundamentals/viewport/center', 'fundamentals-viewport-center');
  });

  test('should match screenshot for fundamentals-workspaces-create', async ({ editorPage }) => {
    await expectFundamentalScreenshot(editorPage, '/fundamentals/workspaces/create', 'fundamentals-workspaces-create');
  });

  test('should match screenshot for fundamentals-workspaces-read', async ({ editorPage }) => {
    await expectFundamentalScreenshot(editorPage, '/fundamentals/workspaces/read', 'fundamentals-workspaces-read', 'editor');
  });

  test('should match screenshot for fundamentals-workspaces-update', async ({ editorPage }) => {
    await expectFundamentalScreenshot(editorPage, '/fundamentals/workspaces/update', 'fundamentals-workspaces-update', 'editor');
  });

  test('should match screenshot for fundamentals-workspaces-delete', async ({ editorPage }) => {
    await expectFundamentalScreenshot(editorPage, '/fundamentals/workspaces/delete', 'fundamentals-workspaces-delete');
  });

  test('should match screenshot for fundamentals-workspaces-switch', async ({ editorPage }) => {
    await expectFundamentalScreenshot(editorPage, '/fundamentals/workspaces/switch', 'fundamentals-workspaces-switch', 'editor');
  });
});
