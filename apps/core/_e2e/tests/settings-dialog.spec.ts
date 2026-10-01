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
    expect(appliedTheme).toBe('dark');

    await page.waitForTimeout(100);
    const detailPanel = settingsRoot.locator('kritzel-master-detail .detail-panel');
    await detailPanel.evaluate(element => element.scrollTo(0, 0));
    await expect.poll(() => detailPanel.evaluate(element => element.scrollTop)).toBe(0);
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

  test('renders viewport info in the top-right corner when Show Viewport Info is enabled', async ({ editorPage, page }) => {
    await editorPage.goto();
    await editorPage.waitForReady();

    const settingsRoot = await openSettingsDialog(page);
    await settingsRoot.locator('kritzel-master-detail').getByRole('tab', { name: /developer/i }).click();

    const viewportInfoToggle = settingsRoot.locator('kritzel-slide-toggle[aria-label="Show Viewport Info"]');
    await viewportInfoToggle.click();

    const debugPanel = editorPage.engine.locator('.debug-panel');
    await expect(debugPanel).toBeVisible();
    await expect(debugPanel).toContainText('ActiveWorkspaceId:');

    const panelBox = await debugPanel.boundingBox();
    const engineBox = await editorPage.engine.boundingBox();
    expect(panelBox).not.toBeNull();
    expect(engineBox).not.toBeNull();
    expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(engineBox!.x + engineBox!.width + 1);
    expect(panelBox!.x).toBeGreaterThanOrEqual(engineBox!.x + engineBox!.width - panelBox!.width - 20);
    expect(panelBox!.y).toBeLessThanOrEqual(40);
  });

  test('shows object info next to each object after enabling Show Object Info', async ({ editorPage, page }) => {
    await editorPage.goto();
    await editorPage.waitForReady();

    await editorPage.prepareWaitForObjectsAdded();
    await editorPage.addShape({
      translateX: 30,
      translateY: 30,
      width: 80,
      height: 60,
      fillColor: { light: '#ff0000', dark: '#ff6666' },
      strokeColor: { light: '#000000', dark: '#ffffff' },
      strokeWidth: 2,
    });
    await editorPage.waitForObjectsAdded();

    await editorPage.prepareWaitForObjectsAdded();
    await editorPage.addPath({
      points: [[0, 0], [40, 40], [80, 0]],
      translateX: 120,
      translateY: 70,
      strokeWidth: 2,
    });
    await editorPage.waitForObjectsAdded();

    const settingsRoot = await openSettingsDialog(page);
    await settingsRoot.locator('kritzel-master-detail').getByRole('tab', { name: /developer/i }).click();

    const objectInfoToggle = settingsRoot.locator('kritzel-slide-toggle[aria-label="Show Object Info"]');
    await objectInfoToggle.click();

    const objectWrappers = editorPage.engine.locator('.object');
    await expect(objectWrappers).toHaveCount(2);

    for (let index = 0; index < 2; index += 1) {
      await expect(objectWrappers.nth(index)).toContainText('Id:');
    }

    await page.locator('kritzel-settings kritzel-dialog[is-open] button[aria-label="Close dialog"]').click();
    await expect(editorPage.engine).toHaveScreenshot('Settings-dialog-show-object-info.png', { timeout: 1000 });
  });

  test('keeps the About settings tab intact with stable aria content', async ({ editorPage, page }) => {
    await editorPage.goto();
    await editorPage.waitForReady();

    const settingsRoot = await openSettingsDialog(page);
    await settingsRoot.locator('kritzel-master-detail').getByRole('tab', { name: /about/i }).click();

    const aboutPanel = settingsRoot.locator('.settings-tab-panel.is-active');
    await expect(aboutPanel).toContainText('About');
    await expect(aboutPanel).toContainText('Kritzel - A drawing application');

    const snapshot = await aboutPanel.locator('p').allTextContents();
    const snapshotText = snapshot.join('\n');
    expect(snapshotText).toContain('Kritzel - A drawing application');
    expect(snapshotText).toContain('Version');
    expect(snapshotText).toContain('App-State Schema v');
    expect(snapshotText).toContain('Workspace Schema v');
  });

  test('keeps the Keyboard Shortcuts settings tab intact', async ({ editorPage, page }) => {
    await editorPage.goto();
    await editorPage.waitForReady();

    const settingsRoot = await openSettingsDialog(page);
    await settingsRoot.locator('kritzel-master-detail').getByRole('tab', { name: /keyboard shortcuts/i }).click();

    const shortcutsPanel = settingsRoot.locator('.settings-tab-panel.is-active');
    await expect(shortcutsPanel).toContainText('Keyboard Shortcuts');

    const shortcutLabels = await shortcutsPanel.locator('.shortcut-label').allTextContents();
    const shortcutKeys = await shortcutsPanel.locator('.shortcut-key').allTextContents();

    expect(shortcutLabels.length).toBeGreaterThan(0);
    expect(shortcutKeys.length).toBeGreaterThan(0);
    expect(shortcutLabels.some(label => label.trim().length > 0)).toBe(true);
    expect(shortcutKeys.some(key => key.trim().length > 0)).toBe(true);
  });
});
