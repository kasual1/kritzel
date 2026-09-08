import { test, expect } from '../fixtures/editor.fixture';
import type { Locator } from '@playwright/test';

const CONCEPT_ROUTES = [
  '/advanced-concepts/collaboration-local',
  '/advanced-concepts/collaboration-realtime',
  '/concepts/components-editor',
  '/concepts/components-editor-ui',
  '/concepts/components-engine',
  '/concepts/context-menus-canvas-quick-actions',
  '/concepts/context-menus-clipboard-actions',
  '/concepts/context-menus-object-inspector',
  '/concepts/context-menus-smart-conditional',
  '/concepts/custom-elements',
  '/concepts/custom-elements-html',
  '/concepts/objects-add-remove',
  '/concepts/objects-grouping',
  '/concepts/objects-ordering',
  '/concepts/objects-query',
  '/concepts/objects-selection',
  '/concepts/persistence-local',
  '/advanced-concepts/customization/theming-apply',
  '/advanced-concepts/customization/theming-custom',
  '/concepts/tools-change',
  '/concepts/tools-controls',
  '/concepts/tools-disable',
  '/concepts/tools-register',
  '/concepts/viewport-center',
  '/concepts/viewport-change',
  '/concepts/viewport-coordinates',
  '/concepts/workspaces-crud',
  '/concepts/workspaces-switch',
] as const;

function getRouteName(route: string): string {
  const segments = route.split('/').filter(Boolean);
  return segments[segments.length - 1];
}

async function waitForConceptPage(editorPage: { page: import('@playwright/test').Page; waitForReady: () => Promise<void> }) {
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

test.describe('Concept Pages Visual Regression', () => {
  for (const route of CONCEPT_ROUTES) {
    const routeName = getRouteName(route);

    test(`should match screenshot for ${routeName}`, async ({ editorPage }) => {
      await editorPage.goto(route);
      await waitForConceptPage(editorPage);

      const canvas = await getPrimaryCanvas(editorPage);
      await expect(canvas).toHaveScreenshot(`concept-${routeName}.png`);
    });
  }
});
