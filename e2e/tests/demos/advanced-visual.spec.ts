import { test, expect } from '../../fixtures/editor.fixture';
import type { Locator } from '@playwright/test';

async function waitForAdvancedPage(editorPage: { page: import('@playwright/test').Page; waitForReady: () => Promise<void> }) {
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

// Shared body for each route's screenshot test, invoked individually below so every page has its own, independently runnable test.
async function expectAdvancedScreenshot(
  editorPage: Parameters<typeof waitForAdvancedPage>[0] & Parameters<typeof getPrimaryCanvas>[0],
  route: string,
  routeName: string,
) {
  await editorPage.goto(route);
  await waitForAdvancedPage(editorPage);

  const canvas = await getPrimaryCanvas(editorPage);
  await expect(canvas).toHaveScreenshot(`${routeName}.png`);
}

test.describe('Advanced & Customization Pages Visual Regression', () => {
  test('should match screenshot for advanced-collaboration-local', async ({ editorPage }) => {
    await expectAdvancedScreenshot(editorPage, '/advanced/collaboration/local', 'advanced-collaboration-local');
  });

  test('should match screenshot for advanced-collaboration-realtime', async ({ editorPage }) => {
    await expectAdvancedScreenshot(editorPage, '/advanced/collaboration/realtime', 'advanced-collaboration-realtime');
  });

  test('should match screenshot for advanced-dynamic-objects-element', async ({ editorPage }) => {
    await expectAdvancedScreenshot(editorPage, '/advanced/dynamic-objects/element', 'advanced-dynamic-objects-element');
  });

  test('should match screenshot for advanced-dynamic-objects-element-html', async ({ editorPage }) => {
    await expectAdvancedScreenshot(editorPage, '/advanced/dynamic-objects/element-html', 'advanced-dynamic-objects-element-html');
  });

  test('should match screenshot for customization-theming-apply', async ({ editorPage }) => {
    await expectAdvancedScreenshot(editorPage, '/customization/theming/apply', 'customization-theming-apply');
  });

  test('should match screenshot for customization-theming-custom', async ({ editorPage }) => {
    await expectAdvancedScreenshot(editorPage, '/customization/theming/custom', 'customization-theming-custom');
  });
});
