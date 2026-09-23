import { test, expect } from '../fixtures/editor.fixture';

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

// Shared body for each route's screenshot test, invoked individually below so every page has its own, independently runnable test.
async function expectAdvancedScreenshot(
  editorPage: Parameters<typeof waitForAdvancedPage>[0],
  route: string,
  routeName: string,
) {
  await editorPage.goto(route);
  await waitForAdvancedPage(editorPage);

  await expect(editorPage.page).toHaveScreenshot(`${routeName}.png`);
}

test.describe('Advanced Pages Visual Regression', () => {
  test('should match screenshot for advanced-collaboration-local', async ({ editorPage }) => {
    await expectAdvancedScreenshot(editorPage, '/advanced/collaboration/local', 'advanced-collaboration-local');
  });

  test.skip('should match screenshot for advanced-collaboration-realtime', async ({ editorPage }) => {
    await expectAdvancedScreenshot(editorPage, '/advanced/collaboration/realtime', 'advanced-collaboration-realtime');
  });

  test('should match screenshot for advanced-dynamic-objects-html', async ({ editorPage }) => {
    await expectAdvancedScreenshot(editorPage, '/advanced/dynamic-objects/html', 'advanced-dynamic-objects-html');
  });

  test('should match screenshot for advanced-dynamic-objects-component', async ({ editorPage }) => {
    await expectAdvancedScreenshot(editorPage, '/advanced/dynamic-objects/component', 'advanced-dynamic-objects-component');
  });

});
