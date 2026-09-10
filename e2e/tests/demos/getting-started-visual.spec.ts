import { test, expect } from '../../fixtures/editor.fixture';
import type { Locator } from '@playwright/test';

const ROUTE = '/getting-started/quick-start';

async function waitForPageReady(editorPage: { page: import('@playwright/test').Page; waitForReady: () => Promise<void> }) {
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

async function waitForImagesToSettle(page: import('@playwright/test').Page) {
  await page.waitForFunction(
    () => {
      const roots: (Document | ShadowRoot)[] = [document];
      const engine = document.querySelector('kritzel-engine');
      if (engine?.shadowRoot) {
        roots.push(engine.shadowRoot);
      }

      const images: HTMLImageElement[] = [];
      for (const root of roots) {
        images.push(...Array.from(root.querySelectorAll('img')));
      }

      if (images.length === 0) {
        return true;
      }

      return images.every((img) => img.complete && img.naturalWidth > 0);
    },
    undefined,
    { timeout: 20_000 },
  );
}

async function waitForVisualSettle(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
          });
        });
      }),
  );

  await waitForImagesToSettle(page);
  await page.waitForTimeout(400);
}

async function getPrimaryCanvas(editorPage: { page: import('@playwright/test').Page }): Promise<Locator> {
  if ((await editorPage.page.locator('kritzel-editor').count()) > 0) {
    return editorPage.page.locator('kritzel-editor').first();
  }

  return editorPage.page.locator('kritzel-engine').first();
}

test.describe('Getting Started Visual Regression', () => {
  test('should match screenshot for getting started page', async ({ editorPage }) => {
    await editorPage.goto(ROUTE);
    await waitForPageReady(editorPage);
    await waitForVisualSettle(editorPage.page);

    const canvas = await getPrimaryCanvas(editorPage);
    await expect(canvas).toHaveScreenshot('getting-started.png');
  });
});
