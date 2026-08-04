import { type Page } from '@playwright/test';
import { test, expect } from '../fixtures/editor.fixture';

async function openSettingsDialog(page: Page) {
  await page.getByTestId('more-menu-button').click();
  await page.getByTestId('menu-item-settings').click();

  const settingsDialog = page.locator('kritzel-settings kritzel-dialog[is-open]');
  await settingsDialog.waitFor({ state: 'attached' });
  await page.waitForTimeout(100);

  const settingsRoot = page.locator('kritzel-settings');
  await expect(settingsDialog).toBeAttached();
  await expect(settingsRoot.getByRole('heading', { name: 'General Settings' })).toBeVisible();

  return settingsRoot;
}

test.describe('Settings dialog', () => {
  test('applies the selected general theme setting', async ({ editorPage, page }) => {
    await editorPage.goto();
    await editorPage.waitForReady();

    const settingsRoot = await openSettingsDialog(page);

    const themeDropdown = settingsRoot.locator('kritzel-dropdown').first();
    await themeDropdown.locator('button').click();
    await themeDropdown.locator('li', { hasText: 'dark' }).click();

    const appliedTheme = await editorPage.getProp<string>('theme');
    expect(appliedTheme).toBe('angular-theme-dark');

    await expect(editorPage.engine).toHaveScreenshot('Settings-dialog-dark-theme.png', { timeout: 1000 });
  });

  test('applies the lock drawing scale toggle from the general settings tab', async ({ editorPage, page }) => {
    await editorPage.goto();
    await editorPage.waitForReady();

    await editorPage.activateTool('brush');

    await editorPage.prepareWaitForObjectsAdded();
    await editorPage.drawStroke([
      { x: -40, y: -20 },
      { x: 40, y: 20 },
      { x: 100, y: -10 },
      { x: 160, y: 40 },
    ]);
    await editorPage.waitForObjectsAdded();

    await editorPage.clickZoomOut();

    await editorPage.prepareWaitForObjectsAdded();
    await editorPage.drawStroke([
      { x: -40, y: 40 },
      { x: 40, y: 80 },
      { x: 100, y: 50 },
      { x: 160, y: 90 },
    ]);
    await editorPage.waitForObjectsAdded();

    const settingsRoot = await openSettingsDialog(page);

    const lockToggle = settingsRoot.locator('kritzel-slide-toggle[aria-label="Lock Drawing Scale"]');
    await lockToggle.click();

    const appliedLockDrawingScale = await editorPage.getProp<boolean>('lockDrawingScale');
    expect(appliedLockDrawingScale).toBe(false);

    await page.locator('kritzel-settings kritzel-dialog[is-open] button[aria-label="Close dialog"]').click();

    await editorPage.prepareWaitForObjectsAdded();
    await editorPage.drawStroke([
      { x: -40, y: 120 },
      { x: 40, y: 160 },
      { x: 100, y: 130 },
      { x: 160, y: 180 },
    ]);
    await editorPage.waitForObjectsAdded();

    await editorPage.clickZoomOut();

    await editorPage.prepareWaitForObjectsAdded();
    await editorPage.drawStroke([
      { x: -40, y: 180 },
      { x: 40, y: 220 },
      { x: 100, y: 190 },
      { x: 160, y: 240 },
    ]);
    await editorPage.waitForObjectsAdded();

    await expect(editorPage.engine).toHaveScreenshot('Settings-dialog-lock-drawing-scale.png', { timeout: 1000 });
  });

  test('switches the general settings view to German and updates the visible labels', async ({ editorPage, page }) => {
    await editorPage.goto();
    await editorPage.waitForReady();

    const settingsRoot = await openSettingsDialog(page);

    const languageDropdown = settingsRoot.locator('kritzel-dropdown').nth(1);
    await languageDropdown.locator('button').click();
    await languageDropdown.locator('li', { hasText: 'Deutsch' }).click();

    await expect(settingsRoot.getByRole('heading', { name: 'Allgemeine Einstellungen' })).toBeVisible();
    await expect(settingsRoot.locator('label.settings-label').filter({ hasText: 'Design' })).toBeVisible();
    await expect(settingsRoot.locator('label.settings-label').filter({ hasText: 'Sprache' })).toBeVisible();
    await expect(settingsRoot.locator('label.settings-label').filter({ hasText: 'Zeichenskalierung sperren' })).toBeVisible();
  });
});
