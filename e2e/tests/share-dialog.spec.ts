import { test, expect } from '../fixtures/editor.fixture';

async function openShareDialog(page: import('@playwright/test').Page) {
  await page.getByTestId('more-menu-button').click();
  await page.getByTestId('menu-item-share').click();

  const dialog = page.locator('kritzel-share-dialog kritzel-dialog[is-open]');
  await dialog.waitFor({ state: 'attached' });
  return dialog;
}

async function closeShareDialog(page: import('@playwright/test').Page) {
  const closeButton = page.locator('kritzel-share-dialog kritzel-dialog[is-open] button[aria-label="Close dialog"]');
  await closeButton.click();
  await expect(page.locator('kritzel-share-dialog kritzel-dialog[is-open]')).toHaveCount(0);
}

async function openWorkspaceMenuForItem(page: import('@playwright/test').Page, workspaceId: string) {
  const menuItem = page.locator(`[data-testid="menu-item-${workspaceId}"]:visible`).first();
  if (await menuItem.isVisible()) {
    return menuItem;
  }

  const menuButton = page.locator('kritzel-workspace-manager button[aria-label="Open menu"]');
  await menuButton.click();
  if (await menuItem.isVisible()) {
    return menuItem;
  }

  await menuButton.click();
  await expect(menuItem).toBeVisible();
  return menuItem;
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

  test('shows and hides shared icon in workspace manager when link sharing is toggled', async ({ editorPage, page }) => {
    const activeWorkspace = await editorPage.getActiveWorkspace<{ id: string }>();
    expect(activeWorkspace.id).toMatch(/\S+/);

    await openShareDialog(page);

    const toggle = page.locator('kritzel-share-dialog kritzel-slide-toggle');
    await expect(toggle).toHaveAttribute('aria-checked', 'false');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await expect.poll(async () => {
      const workspace = await editorPage.getActiveWorkspace<{ isPublic?: boolean }>();
      return workspace.isPublic === true;
    }).toBe(true);
    await expect.poll(async () => {
      const workspaces = await editorPage.getWorkspaces<Array<{ id: string; isPublic?: boolean }>>();
      return workspaces.find(workspace => workspace.id === activeWorkspace.id)?.isPublic === true;
    }).toBe(true);

    await closeShareDialog(page);

    await expect.poll(async () => {
      const workspaceItemWhenShared = await openWorkspaceMenuForItem(page, activeWorkspace.id);
      return workspaceItemWhenShared.evaluate(item => {
        return !!item.shadowRoot?.querySelector('.menu-item-content.left span[title]');
      });
    }, { timeout: 10_000 }).toBe(true);

    await openShareDialog(page);

    const toggleReopened = page.locator('kritzel-share-dialog kritzel-slide-toggle');
    await expect(toggleReopened).toHaveAttribute('aria-checked', 'true');

    await toggleReopened.click();
    await expect(toggleReopened).toHaveAttribute('aria-checked', 'false');
    await expect.poll(async () => {
      const workspace = await editorPage.getActiveWorkspace<{ isPublic?: boolean }>();
      return workspace.isPublic === false;
    }).toBe(true);
    await expect.poll(async () => {
      const workspaces = await editorPage.getWorkspaces<Array<{ id: string; isPublic?: boolean }>>();
      return workspaces.find(workspace => workspace.id === activeWorkspace.id)?.isPublic === false;
    }).toBe(true);

    await closeShareDialog(page);

    await expect.poll(async () => {
      const workspaceItemWhenPrivate = await openWorkspaceMenuForItem(page, activeWorkspace.id);
      return workspaceItemWhenPrivate.evaluate(item => {
        return !!item.shadowRoot?.querySelector('.menu-item-content.left span[title]');
      });
    }).toBe(false);
  });

});