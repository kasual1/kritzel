import { type Page } from '@playwright/test';
import { test, expect } from '../../fixtures/editor.fixture';

async function openViewportSettings(page: Page) {
  await page.getByTestId('more-menu-button').click();
  await page.getByTestId('menu-item-settings').click();

  const settingsDialog = page.locator('kritzel-settings kritzel-dialog[is-open]');
  await settingsDialog.waitFor({ state: 'attached' });
  await page.waitForTimeout(100);

  const settingsRoot = page.locator('kritzel-settings');
  await settingsRoot.locator('kritzel-master-detail').getByRole('tab', { name: /viewport/i }).click();
  return settingsRoot;
}

test.describe('Viewport settings', () => {
  test('prevents zooming when minimum and maximum zoom are set to the same value', async ({ editorPage, page }) => {
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

    const settingsRoot = await openViewportSettings(page);

    const minZoomInput = settingsRoot.locator('kritzel-numeric-input').first();
    const maxZoomInput = settingsRoot.locator('kritzel-numeric-input').nth(1);

    const minZoomField = minZoomInput.locator('input');
    const maxZoomField = maxZoomInput.locator('input');

    await minZoomField.fill('1');
    await minZoomField.press('Enter');
    await maxZoomField.fill('1');
    await maxZoomField.press('Enter');

    await page.locator('kritzel-settings kritzel-dialog[is-open] button[aria-label="Close dialog"]').click();

    const initialZoomPercent = await editorPage.getZoomPercent();
    await editorPage.zoomPanel.getByRole('button', { name: 'Zoom out' }).click();
    await page.waitForTimeout(300);
    const zoomPercentAfterAttempt = await editorPage.getZoomPercent();

    expect(zoomPercentAfterAttempt).toBe(initialZoomPercent);
    await expect(editorPage.engine).toHaveScreenshot('Viewport-settings-min-max-zoom-equal.png', { timeout: 1000 });
  });

  test('accepts numeric values in the viewport boundary inputs', async ({ editorPage, page }) => {
    await editorPage.goto();
    await editorPage.waitForReady();

    const settingsRoot = await openViewportSettings(page);

    const boundaryTests = [
      { index: 2, prop: 'viewportBoundaryLeft' as const, value: '250' },
      { index: 3, prop: 'viewportBoundaryRight' as const, value: '750' },
      { index: 4, prop: 'viewportBoundaryTop' as const, value: '-300' },
      { index: 5, prop: 'viewportBoundaryBottom' as const, value: '900' },
    ];

    for (const { index, prop, value } of boundaryTests) {
      const input = settingsRoot.locator('kritzel-numeric-input').nth(index).locator('input');
      await input.fill(value);
      await input.press('Enter');
      await expect.poll(async () => await editorPage.getProp<number>(prop)).toBe(Number(value));
    }
  });

  test('increases and decreases boundary values via the stepper arrows by 100', async ({ editorPage, page }) => {
    await editorPage.goto();
    await editorPage.waitForReady();

    const settingsRoot = await openViewportSettings(page);

    const boundaryInput = settingsRoot.locator('kritzel-numeric-input').nth(2).locator('input');
    await boundaryInput.fill('200');
    await boundaryInput.press('Enter');
    await expect.poll(async () => await editorPage.getProp<number>('viewportBoundaryLeft')).toBe(200);

    const stepperUp = settingsRoot.locator('kritzel-numeric-input').nth(2).locator('button.spinner-up');
    await stepperUp.click();
    await expect.poll(async () => await editorPage.getProp<number>('viewportBoundaryLeft')).toBe(300);

    const stepperDown = settingsRoot.locator('kritzel-numeric-input').nth(2).locator('button.spinner-down');
    await stepperDown.click();
    await expect.poll(async () => await editorPage.getProp<number>('viewportBoundaryLeft')).toBe(200);
  });
});
