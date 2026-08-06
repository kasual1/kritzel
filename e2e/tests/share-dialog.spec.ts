import { test, expect } from '../fixtures/editor.fixture';

async function openShareDialog(page: import('@playwright/test').Page) {
  await page.getByTestId('more-menu-button').click();
  await page.getByTestId('menu-item-share').click();

  const dialog = page.locator('kritzel-share-dialog kritzel-dialog[is-open]');
  await dialog.waitFor({ state: 'attached' });
  return dialog;
}

test.describe('Share dialog', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
  });

  test('toggles link sharing on and off correctly', async ({ page }) => {
    await openShareDialog(page);

    const toggle = page.locator('kritzel-share-dialog kritzel-slide-toggle');
    await expect(toggle).toHaveAttribute('aria-checked', 'false');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('kritzel-share-dialog input.share-url-input')).toBeVisible();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await expect(page.locator('kritzel-share-dialog input.share-url-input')).toHaveCount(0);
  });

  test('creates the expected share link', async ({ editorPage, page }) => {
    const workspace = await editorPage.getActiveWorkspace<{ id: string }>();
    expect(workspace.id).toMatch(/\S+/);

    await openShareDialog(page);

    const toggle = page.locator('kritzel-share-dialog kritzel-slide-toggle');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');

    const shareUrlInput = page.locator('kritzel-share-dialog input.share-url-input');
    await expect(shareUrlInput).toBeVisible();

    const expectedShareUrl = new URL(workspace.id, new URL(page.url()).origin);
    expectedShareUrl.searchParams.set('share', 'true');

    await expect(shareUrlInput).toHaveValue(expectedShareUrl.toString());
  });

});