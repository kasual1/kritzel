import { test, expect } from '../fixtures/editor.fixture';
import type { Locator } from '@playwright/test';

const FUNDAMENTAL_ROUTES = [
  '/advanced/collaboration-local',
  '/advanced/collaboration-realtime',
  '/fundamentals/components-editor',
  '/fundamentals/components-editor-ui',
  '/fundamentals/components-engine',
  '/advanced/context-menus-canvas-quick-actions',
  '/advanced/context-menus-clipboard-actions',
  '/advanced/context-menus-object-inspector',
  '/advanced/context-menus-smart-conditional',
  '/fundamentals/custom-elements',
  '/fundamentals/custom-elements-html',
  '/fundamentals/objects-add-remove',
  '/fundamentals/objects-grouping',
  '/fundamentals/objects-ordering',
  '/fundamentals/objects-query',
  '/fundamentals/objects-selection',
  '/fundamentals/persistence-local',
  '/advanced/customization/theming-apply',
  '/advanced/customization/theming-custom',
  '/fundamentals/tools-change',
  '/fundamentals/tools-controls',
  '/fundamentals/tools-disable',
  '/fundamentals/tools-register',
  '/fundamentals/viewport-center',
  '/fundamentals/viewport-change',
  '/fundamentals/viewport-coordinates',
  '/fundamentals/workspaces-crud',
  '/fundamentals/workspaces-switch',
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
    const routeName = route.split('/').pop()!;

    test(`should match screenshot for ${routeName}`, async ({ editorPage }) => {
      await editorPage.goto(route);
      await waitForFundamentalPage(editorPage);

      const canvas = await getPrimaryCanvas(editorPage);
      await expect(canvas).toHaveScreenshot(`concept-${routeName}.png`);
    });
  }
});
