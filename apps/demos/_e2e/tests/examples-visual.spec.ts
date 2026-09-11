import { test, expect } from '../fixtures/editor.fixture';

async function waitForExamplePage(editorPage: { page: import('@playwright/test').Page; waitForReady: () => Promise<void> }) {
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

  // Allow async component work and animation frames to flush before snapshot.
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

// Shared body for each example's screenshot test, invoked individually below so every page has its own, independently runnable test.
// Captures the whole viewport (not just the kritzel-editor/engine element) because these example pages
// pair the canvas with a sidebar/info panel, and the full layout is what should be regression-tested.
async function expectExampleScreenshot(
  editorPage: Parameters<typeof waitForExamplePage>[0],
  route: string,
  routeName: string,
) {
  await editorPage.goto(route);
  await waitForExamplePage(editorPage);
  await waitForVisualSettle(editorPage.page);

  await expect(editorPage.page).toHaveScreenshot(`example-${routeName}.png`);
}

test.describe('Example Pages Visual Regression', () => {
  test('should match screenshot for object-explorer', async ({ editorPage }) => {
    await expectExampleScreenshot(editorPage, '/examples/object-explorer', 'object-explorer');
  });

  test('should match screenshot for blueprint-defect-mapper', async ({ editorPage }) => {
    await expectExampleScreenshot(editorPage, '/examples/blueprint-defect-mapper', 'blueprint-defect-mapper');
  });

  test('should match screenshot for slideshow-presentation', async ({ editorPage }) => {
    await expectExampleScreenshot(editorPage, '/examples/slideshow-presentation', 'slideshow-presentation');
  });

  test('should match screenshot for image-annotation-studio', async ({ editorPage }) => {
    await expectExampleScreenshot(editorPage, '/examples/image-annotation-studio', 'image-annotation-studio');
  });
});
