import { test, expect } from '../../fixtures/editor.fixture';

const FIXED_TIMESTAMP_ISO = '2025-01-01T12:00:00.000Z';

test.describe('Notifications', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
  });

  test('should show info notification when triggered programmatically', async ({ editorPage }) => {
    await editorPage.triggerNotification({
      type: 'info',
      message: 'Programmatic info notification',
      timestampIso: FIXED_TIMESTAMP_ISO,
    });

    const notificationCard = editorPage.page.locator('kritzel-notification-card');
    await expect(notificationCard).toBeVisible();
    await expect(notificationCard.locator('.type-pill')).toHaveText('Info');

    await editorPage.page.waitForTimeout(350);
    await expect(editorPage.editor).toHaveScreenshot('notification-info.png');
  });

  test('should show warning notification when triggered programmatically', async ({ editorPage }) => {
    await editorPage.triggerNotification({
      type: 'warning',
      message: 'Programmatic warning notification',
      timestampIso: FIXED_TIMESTAMP_ISO,
    });

    const notificationCard = editorPage.page.locator('kritzel-notification-card');
    await expect(notificationCard).toBeVisible();
    await expect(notificationCard.locator('.type-pill')).toHaveText('Warning');

    await editorPage.page.waitForTimeout(350);
    await expect(editorPage.editor).toHaveScreenshot('notification-warning.png');
  });

  test('should show error notification when triggered programmatically', async ({ editorPage }) => {
    await editorPage.triggerNotification({
      type: 'error',
      message: 'Programmatic error notification',
      timestampIso: FIXED_TIMESTAMP_ISO,
    });

    const notificationCard = editorPage.page.locator('kritzel-notification-card');
    await expect(notificationCard).toBeVisible();
    await expect(notificationCard.locator('.type-pill')).toHaveText('Error');

    await editorPage.page.waitForTimeout(350);
    await expect(editorPage.editor).toHaveScreenshot('notification-error.png');
  });

  test('should close notification when dismiss button is clicked', async ({ editorPage }) => {
    await editorPage.triggerNotification({
      type: 'info',
      message: 'Dismiss me',
      timestampIso: FIXED_TIMESTAMP_ISO,
    });

    const notificationCard = editorPage.page.locator('kritzel-notification-card');
    await expect(notificationCard).toBeVisible();

    await notificationCard.locator('.dismiss-button').click();
    await expect(notificationCard).toBeHidden({ timeout: 5000 });
  });

  test('should render notification correctly in a narrow wrapped container', async ({ editorPage, page }) => {
    const WRAPPER_WIDTH = 320;
    const WRAPPER_HEIGHT = 600;

    await editorPage.goto(`/e2e/wrapped-editor?width=${WRAPPER_WIDTH}&height=${WRAPPER_HEIGHT}`);
    await editorPage.waitForReady();

    await editorPage.triggerNotification({
      type: 'warning',
      message: 'Wrapped narrow container notification',
      timestampIso: FIXED_TIMESTAMP_ISO,
    });

    const notificationCard = editorPage.page.locator('kritzel-notification-card');
    await expect(notificationCard).toBeVisible();

    await editorPage.page.waitForTimeout(350);
    await expect(page).toHaveScreenshot('notification-wrapped-narrow.png', { fullPage: true });
  });

  test('should render notification correctly in a large wrapped container', async ({ editorPage, page }) => {
    const WRAPPER_WIDTH = 1000;
    const WRAPPER_HEIGHT = 600;

    await editorPage.goto(`/e2e/wrapped-editor?width=${WRAPPER_WIDTH}&height=${WRAPPER_HEIGHT}`);
    await editorPage.waitForReady();

    await editorPage.triggerNotification({
      type: 'error',
      message: 'Wrapped large container notification',
      timestampIso: FIXED_TIMESTAMP_ISO,
    });

    const notificationCard = editorPage.page.locator('kritzel-notification-card');
    await expect(notificationCard).toBeVisible();

    await editorPage.page.waitForTimeout(350);
    await expect(page).toHaveScreenshot('notification-wrapped-large.png', { fullPage: true });
  });
});
