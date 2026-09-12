import { test, expect } from '../fixtures/editor.fixture';

async function waitForCustomizationPage(editorPage: { page: import('@playwright/test').Page; waitForReady: () => Promise<void> }) {
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
async function expectCustomizationScreenshot(
  editorPage: Parameters<typeof waitForCustomizationPage>[0],
  route: string,
  routeName: string,
) {
  await editorPage.goto(route);
  await waitForCustomizationPage(editorPage);

  await expect(editorPage.page).toHaveScreenshot(`${routeName}.png`);
}

test.describe('Customization Pages Visual Regression', () => {
  test('should match screenshot for customization-theming-apply', async ({ editorPage }) => {
    await expectCustomizationScreenshot(editorPage, '/customization/theming/apply', 'customization-theming-apply');
  });

  test('should match screenshot for customization-theming-custom', async ({ editorPage }) => {
    await expectCustomizationScreenshot(editorPage, '/customization/theming/custom', 'customization-theming-custom');
  });

  test.skip('should match screenshot for customization-fonts-register', async ({ editorPage }) => {
    await expectCustomizationScreenshot(editorPage, '/customization/fonts/register', 'customization-fonts-register');
  });

  test('should match screenshot for customization-icons-register', async ({ editorPage }) => {
    await expectCustomizationScreenshot(editorPage, '/customization/icons/register', 'customization-icons-register');
  });

  test('should match screenshot for customization-localization-switch', async ({ editorPage }) => {
    await expectCustomizationScreenshot(editorPage, '/customization/localization/switch', 'customization-localization-switch');
  });

  test('should match screenshot for customization-localization-custom', async ({ editorPage }) => {
    await expectCustomizationScreenshot(editorPage, '/customization/localization/custom', 'customization-localization-custom');
  });
});
