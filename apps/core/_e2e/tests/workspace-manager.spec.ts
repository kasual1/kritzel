import { test, expect } from '../fixtures/editor.fixture';

type WorkspaceDto = {
  id: string;
  name: string;
};

type WorkspaceQueryEditor = {
  getWorkspaces<T = unknown>(): Promise<T[]>;
};

async function openWorkspaceMenu(page: import('@playwright/test').Page, workspaceId: string) {
  const menuItem = page.locator(`[data-testid="menu-item-${workspaceId}"]`).first();

  if (await menuItem.isVisible()) {
    return;
  }

  const menuButton = page.locator('kritzel-workspace-manager button[aria-label="Open menu"]');
  await menuButton.click();
  if (await menuItem.isVisible()) {
    return;
  }

  await menuButton.click();
  await expect(menuItem).toBeVisible();
}

async function createWorkspaceViaManager(page: import('@playwright/test').Page, workspaceName: string) {
  await page.locator('kritzel-workspace-manager button[aria-label="Main action"]').click();

  const editInput = page.locator('kritzel-menu:visible kritzel-menu-item.editing input.edit-input');
  await expect(editInput).toBeVisible();
  await editInput.fill(workspaceName);

  const saveButton = page.locator('kritzel-menu:visible kritzel-menu-item.editing .menu-item-content.right .action-button').nth(1);
  await saveButton.click();
}

async function openWorkspaceItemChildMenu(page: import('@playwright/test').Page, workspaceId: string) {
  await openWorkspaceMenu(page, workspaceId);
  const row = page.locator(`[data-testid="menu-item-${workspaceId}"]`).first();
  await expect(row).toBeVisible();

  const childMenuToggle = row.locator('#child-menu-toggle');
  await childMenuToggle.click();
}

async function renameWorkspaceViaManager(page: import('@playwright/test').Page, workspaceId: string, newName: string) {
  await openWorkspaceItemChildMenu(page, workspaceId);
  const renameItem = page.locator(`[data-testid="menu-item-${workspaceId}-rename"]`).first();
  await expect(renameItem).toBeVisible();
  await renameItem.click();

  const editInput = page.locator('kritzel-menu:visible kritzel-menu-item.editing input.edit-input');
  await expect(editInput).toBeVisible();
  await editInput.fill(newName);

  const saveButton = page.locator('kritzel-menu:visible kritzel-menu-item.editing .menu-item-content.right .action-button').nth(1);
  await saveButton.click();
}

async function switchWorkspaceViaManager(page: import('@playwright/test').Page, workspaceId: string) {
  await openWorkspaceMenu(page, workspaceId);
  await page.locator(`[data-testid="menu-item-${workspaceId}"]`).first().click();
}

async function deleteWorkspaceViaManager(page: import('@playwright/test').Page, workspaceId: string) {
  await openWorkspaceItemChildMenu(page, workspaceId);
  const deleteItem = page.locator(`[data-testid="menu-item-${workspaceId}-delete"]`).first();
  await expect(deleteItem).toBeVisible();
  await deleteItem.click();
}

async function findWorkspaceByName(editorPage: WorkspaceQueryEditor, name: string): Promise<WorkspaceDto> {
  await expect.poll(async () => {
    const workspaces = await editorPage.getWorkspaces<WorkspaceDto[]>();
    return workspaces.find(workspace => workspace.name === name)?.id ?? '';
  }).toMatch(/\S+/);

  const workspaces = await editorPage.getWorkspaces<WorkspaceDto[]>();
  const workspace = workspaces.find(item => item.name === name);
  expect(workspace).toBeDefined();
  return workspace as WorkspaceDto;
}

test.describe('Workspace manager', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
  });

  test('creates a workspace and sets it active', async ({ editorPage, page }) => {
    const createdWorkspaceName = `E2E Workspace Created ${Date.now()}`;
    await createWorkspaceViaManager(page, createdWorkspaceName);

    const createdWorkspace = await findWorkspaceByName(editorPage, createdWorkspaceName);
    const activeWorkspace = await editorPage.getActiveWorkspace<WorkspaceDto>();
    expect(activeWorkspace.id).toBe(createdWorkspace.id);
  });

  test('updates workspace name', async ({ editorPage, page }) => {
    const initialName = `E2E Workspace Rename Source ${Date.now()}`;
    await createWorkspaceViaManager(page, initialName);
    const createdWorkspace = await findWorkspaceByName(editorPage, initialName);

    const renamedWorkspaceName = `E2E Workspace Renamed ${Date.now()}`;
    await renameWorkspaceViaManager(page, createdWorkspace.id, renamedWorkspaceName);

    await expect.poll(async () => {
      const workspaces = await editorPage.getWorkspaces<WorkspaceDto[]>();
      return workspaces.find(workspace => workspace.id === createdWorkspace.id)?.name ?? '';
    }).toBe(renamedWorkspaceName);
  });

  test('switches between workspaces', async ({ editorPage, page }) => {
    const initialActive = await editorPage.getActiveWorkspace<WorkspaceDto>();
    const createdWorkspaceName = `E2E Workspace Switch Target ${Date.now()}`;
    await createWorkspaceViaManager(page, createdWorkspaceName);
    const createdWorkspace = await findWorkspaceByName(editorPage, createdWorkspaceName);

    await switchWorkspaceViaManager(page, initialActive.id);
    await expect.poll(async () => (await editorPage.getActiveWorkspace<WorkspaceDto>()).id).toBe(initialActive.id);

    await switchWorkspaceViaManager(page, createdWorkspace.id);
    await expect.poll(async () => (await editorPage.getActiveWorkspace<WorkspaceDto>()).id).toBe(createdWorkspace.id);
  });

  test('deletes a workspace and keeps a valid active workspace', async ({ editorPage, page }) => {
    const initialActive = await editorPage.getActiveWorkspace<WorkspaceDto>();
    const createdWorkspaceName = `E2E Workspace Delete Target ${Date.now()}`;
    await createWorkspaceViaManager(page, createdWorkspaceName);
    const createdWorkspace = await findWorkspaceByName(editorPage, createdWorkspaceName);

    await switchWorkspaceViaManager(page, initialActive.id);
    await expect.poll(async () => (await editorPage.getActiveWorkspace<WorkspaceDto>()).id).toBe(initialActive.id);

    await deleteWorkspaceViaManager(page, createdWorkspace.id);

    await expect.poll(async () => {
      const workspaces = await editorPage.getWorkspaces<WorkspaceDto[]>();
      return workspaces.some(workspace => workspace.id === createdWorkspace.id);
    }).toBe(false);

    await expect.poll(async () => (await editorPage.getActiveWorkspace<WorkspaceDto>()).id).toBe(initialActive.id);
  });

  test('shows a scrollbar with 10 created workspaces and can scroll to lower entries', async ({ editorPage, page }) => {
    const createdWorkspaceNames: string[] = [];
    for (let index = 0; index < 10; index++) {
      const name = `E2E Workspace Scroll ${Date.now()}-${index}`;
      createdWorkspaceNames.push(name);
      await createWorkspaceViaManager(page, name);
    }

    const newestWorkspace = await findWorkspaceByName(editorPage, createdWorkspaceNames[createdWorkspaceNames.length - 1]);
    await openWorkspaceMenu(page, newestWorkspace.id);

    const newestWorkspaceItem = page.locator(`[data-testid="menu-item-${newestWorkspace.id}"]`).first();
    await expect(newestWorkspaceItem).toBeVisible();

    const workspaceMenu = page
      .locator('kritzel-menu')
      .filter({ has: page.locator(`[data-testid="menu-item-${newestWorkspace.id}"]`) });

    const scrollMetrics = await workspaceMenu.evaluateAll(menus => {
      const visibleMenu = (menus as HTMLElement[]).find(menu => {
        const styles = window.getComputedStyle(menu);
        const rect = menu.getBoundingClientRect();
        return styles.display !== 'none' && styles.visibility !== 'hidden' && rect.height > 0;
      });

      if (!visibleMenu) {
        return null;
      }

      return {
        scrollHeight: visibleMenu.scrollHeight,
        clientHeight: visibleMenu.clientHeight,
      };
    });

    expect(scrollMetrics).not.toBeNull();
    expect(scrollMetrics!.scrollHeight).toBeGreaterThan(scrollMetrics!.clientHeight);

    const reachability = await workspaceMenu.evaluateAll(menus => {
      const visibleMenu = (menus as HTMLElement[]).find(menu => {
        const styles = window.getComputedStyle(menu);
        const rect = menu.getBoundingClientRect();
        return styles.display !== 'none' && styles.visibility !== 'hidden' && rect.height > 0;
      });

      if (!visibleMenu) {
        return null;
      }

      const menuItems = Array.from(visibleMenu.shadowRoot?.querySelectorAll('kritzel-menu-item') ?? []) as HTMLElement[];
      if (menuItems.length < 2) {
        return null;
      }

      const bottomItem = menuItems[menuItems.length - 1];
      const bottomItemBottom = bottomItem.offsetTop + bottomItem.offsetHeight;
      const initialViewportBottom = visibleMenu.scrollTop + visibleMenu.clientHeight;
      const isInitiallyBelowViewport = bottomItemBottom > initialViewportBottom;

      visibleMenu.scrollTop = visibleMenu.scrollHeight;

      const scrolledViewportBottom = visibleMenu.scrollTop + visibleMenu.clientHeight;
      const isReachableAfterScroll = bottomItem.offsetTop < scrolledViewportBottom;

      return {
        menuItemCount: menuItems.length,
        scrolled: visibleMenu.scrollTop > 0,
        isInitiallyBelowViewport,
        isReachableAfterScroll,
      };
    });

    expect(reachability).not.toBeNull();
    expect(reachability!.menuItemCount).toBeGreaterThanOrEqual(11);
    expect(reachability!.scrolled).toBe(true);
    expect(reachability!.isInitiallyBelowViewport).toBe(true);
    expect(reachability!.isReachableAfterScroll).toBe(true);
  });
});