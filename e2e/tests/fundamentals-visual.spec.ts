import { test, expect } from '../fixtures/editor.fixture';
import type { Locator } from '@playwright/test';

const FUNDAMENTAL_ROUTES = [
  '/advanced/collaboration/local',
  '/advanced/collaboration/realtime',
  '/advanced/dynamic-objects/element',
  '/advanced/dynamic-objects/element-html',
  '/customization/theming/apply',
  '/customization/theming/custom',
  '/fundamentals/components/editor',
  '/fundamentals/components/editor-ui',
  '/fundamentals/components/engine',
  '/fundamentals/components/context-menus-canvas-quick-actions',
  '/fundamentals/components/context-menus-clipboard-actions',
  '/fundamentals/components/context-menus-object-inspector',
  '/fundamentals/components/context-menus-smart-conditional',
  '/fundamentals/objects/add-remove',
  '/fundamentals/objects/grouping',
  '/fundamentals/objects/ordering',
  '/fundamentals/objects/filter',
  '/fundamentals/objects/selection',
  '/fundamentals/persistence/local',
  '/fundamentals/tools/change',
  '/fundamentals/tools/disable',
  '/fundamentals/tools/register',
  '/fundamentals/tools/toolbar',
  '/fundamentals/viewport/center',
  '/fundamentals/viewport/change',
  '/fundamentals/viewport/coordinates',
  '/fundamentals/workspaces/create',
  '/fundamentals/workspaces/read',
  '/fundamentals/workspaces/update',
  '/fundamentals/workspaces/delete',
  '/fundamentals/workspaces/switch',
] as const;

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

async function getPrimaryCanvas(editorPage: { page: import('@playwright/test').Page }): Promise<Locator> {
  if ((await editorPage.page.locator('kritzel-editor').count()) > 0) {
    return editorPage.page.locator('kritzel-editor').first();
  }

  return editorPage.page.locator('kritzel-engine').first();
}

test.describe('Fundamentals & Advanced Pages Visual Regression', () => {
  for (const route of FUNDAMENTAL_ROUTES) {
    const routeName = route.slice(1).replace(/\//g, '-');

    test(`should match screenshot for ${routeName}`, async ({ editorPage }) => {
      await editorPage.goto(route);
      await waitForFundamentalPage(editorPage);

      const canvas = await getPrimaryCanvas(editorPage);
      await expect(canvas).toHaveScreenshot(`${routeName}.png`);
    });
  }
});
