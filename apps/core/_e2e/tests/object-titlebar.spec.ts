import { test, expect, type EditorPage } from '../fixtures/editor.fixture';
import type { Locator, Page } from '@playwright/test';

/** Configures a Framer-like titlebar for groups and named objects and records button actions and events on window. */
async function configureTitlebar(page: Page) {
  await page.evaluate(() => {
    const w = window as any;
    w.__titlebarActions = [];
    w.__titlebarEvents = [];
    const editor = document.querySelector('kritzel-editor') as any;
    editor.addEventListener('objectTitlebarAction', (event: CustomEvent) => w.__titlebarEvents.push(event.detail.elementId));
    editor.objectConfig = { hasTitlebar: (object: any) => object.__class__ === 'KritzelGroup' || !!object.name };
    editor.objectTitlebar = {
      left: [
        {
          type: 'button',
          id: 'play',
          icon: 'play',
          variant: 'filled',
          tooltip: 'Preview',
          action: (context: any) => w.__titlebarActions.push(context.object.id),
        },
        { type: 'title', id: 'title' },
        { type: 'text', id: 'size', tone: 'muted', text: (context: any) => String(Math.round(context.contentSize.width)) },
      ],
      right: [{ type: 'button', id: 'add', icon: 'plus', tooltip: 'Add' }],
    };
  });
  await nextFrame(page);
}

async function nextFrame(page: Page) {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

function titlebarFor(page: Page, id: string): Locator {
  return page.locator(`kritzel-engine .object-titlebar[data-titlebar-owner-id="${id}"]`);
}

/** Page position inside the titlebar's drag surface, right of the left items and away from the buttons. */
async function surfacePoint(titlebar: Locator) {
  const box = await titlebar.boundingBox();
  if (!box) throw new Error('titlebar is not visible');
  return { x: box.x + box.width * 0.6, y: box.y + box.height / 2 };
}

async function dragBy(page: Page, from: { x: number; y: number }, dx: number, dy: number) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + dx, from.y + dy, { steps: 12 });
  await page.mouse.up();
}

test.describe('Object titlebar', () => {
  test.beforeEach(async ({ editorPage, page }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
    await editorPage.setViewportRaw(0, 0, 1);
    await configureTitlebar(page);
  });

  test('renders a titlebar only above objects accepted by objectConfig.hasTitlebar', async ({ editorPage, page }) => {
    const named = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
    await editorPage.addShape({ translateX: 600, translateY: 200, width: 200, height: 150 });
    await nextFrame(page);

    await expect(page.locator('kritzel-engine .object-titlebar')).toHaveCount(1);
    const titlebar = titlebarFor(page, named.id);
    await expect(titlebar.locator('.object-titlebar-title')).toHaveText('Desktop');
    await expect(titlebar.locator('[data-element-id="size"]')).toHaveText('300');
    await expect(titlebar).toHaveAttribute('data-state', 'inactive');
  });

  test('renders no titlebars when objectConfig.hasTitlebar is missing', async ({ editorPage, page }) => {
    await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
    const titlebars = page.locator('kritzel-engine .object-titlebar');
    await expect(titlebars).toHaveCount(1);

    const messages: string[] = [];
    page.on('console', message => messages.push(message.text()));
    await page.evaluate(() => {
      const editor = document.querySelector('kritzel-editor') as any;
      editor.objectConfig = {};
    });
    await nextFrame(page);

    await expect(titlebars).toHaveCount(0);
    await expect.poll(() => messages.some(text => text.includes('objectConfig.hasTitlebar'))).toBe(true);
  });

  test('sits above its object at a constant screen size across zoom levels', async ({ editorPage, page }) => {
    const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
    const titlebar = titlebarFor(page, shape.id);

    for (const scale of [0.5, 1, 2]) {
      await editorPage.setViewportRaw(0, 0, scale);
      await nextFrame(page);

      const box = await titlebar.boundingBox();
      const topLeft = await editorPage.worldToPage(200, 200);
      const topRight = await editorPage.worldToPage(500, 200);
      expect(box).not.toBeNull();
      expect(Math.abs(box!.height - 28)).toBeLessThanOrEqual(1);
      expect(Math.abs(box!.y + box!.height - (topLeft.pageY - 6))).toBeLessThanOrEqual(1.5);
      expect(Math.abs(box!.x - topLeft.pageX)).toBeLessThanOrEqual(1.5);
      expect(Math.abs(box!.width - (topRight.pageX - topLeft.pageX))).toBeLessThanOrEqual(1.5);
    }
  });

  test('hides titlebars of objects that are too small on screen', async ({ editorPage, page }) => {
    const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });

    await editorPage.setViewportRaw(0, 0, 0.1);
    await nextFrame(page);

    await expect(titlebarFor(page, shape.id)).toHaveCount(0);
  });

  test('becomes active when its object is selected', async ({ editorPage, page }) => {
    const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
    const titlebar = titlebarFor(page, shape.id);
    const point = await surfacePoint(titlebar);

    await page.mouse.click(point.x, point.y);

    await expect(titlebar).toHaveAttribute('data-state', 'active');
    const selected = await editorPage.getSelectedObjects<{ id: string }>();
    expect(selected.map(object => object.id)).toEqual([shape.id]);

    await editorPage.clickAtWorld(900, 650);
    await expect(titlebar).toHaveAttribute('data-state', 'inactive');
  });

  test('dragging the titlebar moves its object like dragging the object, and undo restores it', async ({ editorPage, page }) => {
    const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
    await editorPage.waitForUndoCapture();
    const titlebar = titlebarFor(page, shape.id);

    await dragBy(page, await surfacePoint(titlebar), 120, 80);

    const moved = await editorPage.getObjectById<{ translateX: number; translateY: number }>(shape.id);
    expect(moved!.translateX).toBeCloseTo(320, 0);
    expect(moved!.translateY).toBeCloseTo(280, 0);
    await expect(titlebar).toHaveAttribute('data-state', 'active');

    await editorPage.waitForUndoCapture();
    await editorPage.undo();
    await nextFrame(page);

    const restored = await editorPage.getObjectById<{ translateX: number; translateY: number }>(shape.id);
    expect(restored!.translateX).toBeCloseTo(200, 0);
    expect(restored!.translateY).toBeCloseTo(200, 0);
  });

  test('buttons run their action and emit an event without selecting or moving the object', async ({ editorPage, page }) => {
    const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
    const titlebar = titlebarFor(page, shape.id);

    await titlebar.locator('[data-element-id="play"]').click();

    expect(await page.evaluate(() => (window as any).__titlebarActions)).toEqual([shape.id]);
    expect(await page.evaluate(() => (window as any).__titlebarEvents)).toEqual(['play']);
    expect(await editorPage.getSelectedObjects()).toHaveLength(0);
    const after = await editorPage.getObjectById<{ translateX: number; translateY: number }>(shape.id);
    expect(after!.translateX).toBeCloseTo(200, 0);
    expect(after!.translateY).toBeCloseTo(200, 0);
  });

  test('clicking the titlebar of a text object does not start editing it', async ({ editorPage, page }) => {
    const text = await editorPage.addText({ text: 'A titlebar for this note', translateX: 200, translateY: 200, fontSize: 24, name: 'Note' });
    await nextFrame(page);
    const titlebar = titlebarFor(page, text.id);

    const point = await surfacePoint(titlebar);
    await page.mouse.click(point.x, point.y);
    await page.waitForTimeout(400);
    await page.mouse.click(point.x, point.y);

    await expect(titlebar).toHaveAttribute('data-state', 'active');
    const isEditing = await page.evaluate(() => !!(document.querySelector('kritzel-engine') as any).core.store.activeText);
    expect(isEditing).toBe(false);
  });

  test('a group shows one titlebar that moves the whole group', async ({ editorPage, page }) => {
    const first = await editorPage.addShape({ translateX: 200, translateY: 200, width: 150, height: 150, name: 'Mobile' });
    const second = await editorPage.addShape({ translateX: 400, translateY: 200, width: 150, height: 150, name: 'Tablet' });
    await nextFrame(page);
    const titlebars = page.locator('kritzel-engine .object-titlebar');
    await expect(titlebars).toHaveCount(2);

    await editorPage.selectObjects([first, second]);
    await editorPage.group();
    await editorPage.clearSelection();
    await nextFrame(page);

    await expect(titlebars).toHaveCount(1);
    await expect(titlebars.first()).toHaveAttribute('data-object-type', 'KritzelGroup');

    await dragBy(page, await surfacePoint(titlebars.first()), 100, 50);

    const firstAfter = await editorPage.getObjectById<{ translateX: number; translateY: number }>(first.id);
    const secondAfter = await editorPage.getObjectById<{ translateX: number; translateY: number }>(second.id);
    expect(firstAfter!.translateX).toBeCloseTo(300, 0);
    expect(secondAfter!.translateX).toBeCloseTo(500, 0);
    expect(firstAfter!.translateY).toBeCloseTo(250, 0);
  });

  test('objectConfig.hasTitlebar can select objects by class', async ({ editorPage, page }) => {
    const first = await editorPage.addShape({ translateX: 200, translateY: 200, width: 150, height: 150, name: 'Mobile' });
    const second = await editorPage.addShape({ translateX: 400, translateY: 200, width: 150, height: 150, name: 'Tablet' });
    await nextFrame(page);
    const titlebars = page.locator('kritzel-engine .object-titlebar');
    await expect(titlebars).toHaveCount(2);

    await page.evaluate(() => {
      const editor = document.querySelector('kritzel-editor') as any;
      editor.objectConfig = { hasTitlebar: (object: any) => object.__class__ === 'KritzelGroup' };
    });
    await nextFrame(page);
    await expect(titlebars).toHaveCount(0);

    await editorPage.selectObjects([first, second]);
    await editorPage.group();
    await editorPage.clearSelection();
    await nextFrame(page);

    const allObjects = await editorPage.getAllObjects<{ id: string; __class__: string }>();
    const group = allObjects.find(object => object.__class__ === 'KritzelGroup');
    expect(group).toBeDefined();
    await expect(titlebars).toHaveCount(1);
    await expect(titlebarFor(page, group!.id)).toHaveCount(1);
  });

  test('buttons use the custom pointer cursor and disabled buttons the custom default cursor', async ({ editorPage, page }) => {
    const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
    const button = titlebarFor(page, shape.id).locator('[data-element-id="play"]');
    const pointerCursor = await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--kritzel-global-pointer-cursor').trim());
    expect(pointerCursor).toMatch(/^url\(/);

    await expect(button).toHaveCSS('cursor', /^url\(/);
    expect(await button.evaluate(element => getComputedStyle(element).cursor)).not.toBe('pointer');

    await page.evaluate(() => {
      const editor = document.querySelector('kritzel-editor') as any;
      editor.objectTitlebar = {
        ...editor.objectTitlebar,
        left: editor.objectTitlebar.left.map((item: any) => (item.id === 'play' ? { ...item, isDisabled: true } : item)),
      };
    });
    await nextFrame(page);

    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await expect(button).toHaveCSS('cursor', /^url\(/);
  });

  test.describe('menus', () => {
    /** Adds a menu to the right section, recording selected menu items and action events on window. */
    async function addMenu(page: Page) {
      await page.evaluate(() => {
        const w = window as any;
        w.__menuActions = [];
        w.__menuEvents = [];
        const editor = document.querySelector('kritzel-editor') as any;
        editor.addEventListener('objectTitlebarAction', (event: CustomEvent) => w.__menuEvents.push(event.detail));
        editor.objectTitlebar = {
          ...editor.objectTitlebar,
          right: [
            {
              id: 'more',
              type: 'menu',
              icon: 'ellipsisVertical',
              tooltip: 'More',
              items: [
                { id: 'duplicate', label: 'Duplicate', icon: 'copy', action: (context: any, menuItem: any) => w.__menuActions.push([context.object.id, menuItem.id]) },
                { id: 'hidden', label: 'Hidden', isVisible: false },
                { id: 'locked', label: 'Locked', isDisabled: true },
              ],
            },
          ],
        };
      });
      await nextFrame(page);
    }

    const menu = (page: Page) => page.locator('kritzel-menu[data-testid="object-titlebar-menu"]');
    const menuItem = (page: Page, id: string) => menu(page).locator(`[data-testid="menu-item-${id}"]`);

    test('opens below its button, lists visible menu items and runs the selected one', async ({ editorPage, page }) => {
      const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
      await addMenu(page);
      const button = titlebarFor(page, shape.id).locator('[data-element-id="more"]');

      await expect(button).toHaveAttribute('aria-haspopup', 'menu');
      await expect(button).toHaveAttribute('aria-expanded', 'false');
      await button.click();

      await expect(menu(page)).toBeVisible();
      await expect(button).toHaveAttribute('aria-expanded', 'true');
      await expect(menu(page).locator('kritzel-menu-item')).toHaveCount(2);
      await expect(menuItem(page, 'duplicate')).toContainText('Duplicate');
      await expect(menuItem(page, 'hidden')).toHaveCount(0);
      const [buttonBox, menuBox] = await Promise.all([button.boundingBox(), menu(page).boundingBox()]);
      expect(menuBox!.y).toBeGreaterThanOrEqual(buttonBox!.y + buttonBox!.height);

      await menuItem(page, 'duplicate').click();

      await expect(menu(page)).toBeHidden();
      await expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(await page.evaluate(() => (window as any).__menuActions)).toEqual([[shape.id, 'duplicate']]);
      expect(await page.evaluate(() => (window as any).__menuEvents)).toEqual([
        expect.objectContaining({ elementId: 'more', menuItemId: 'duplicate', section: 'right', objectId: shape.id }),
      ]);
      expect(await editorPage.getSelectedObjects()).toHaveLength(0);
    });

    test('is compact like the context menu and styled by titlebarMenu theme variables', async ({ editorPage, page }) => {
      const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
      await addMenu(page);
      const button = titlebarFor(page, shape.id).locator('[data-element-id="more"]');

      await button.click();
      await expect(menu(page)).toBeVisible();
      await expect(menu(page)).toHaveCSS('padding-top', '4px');
      await expect(menu(page)).toHaveCSS('row-gap', '2px');
      await expect(menu(page)).toHaveCSS('min-width', '140px');
      await expect(menuItem(page, 'duplicate')).toHaveCSS('height', '32px');
      await expect(menuItem(page, 'duplicate')).toHaveCSS('color', 'rgb(51, 51, 51)');
      await button.click();

      // Theme tokens are applied as variables on the editor, from where the portal copies them.
      await page.evaluate(() => {
        const editor = document.querySelector('kritzel-editor') as HTMLElement;
        editor.style.setProperty('--kritzel-titlebar-menu-padding', '10px');
        editor.style.setProperty('--kritzel-titlebar-menu-item-height', '40px');
      });
      await button.click();

      await expect(menu(page)).toHaveCSS('padding-top', '10px');
      await expect(menuItem(page, 'duplicate')).toHaveCSS('height', '40px');
    });

    test('disabled menu items cannot be selected', async ({ editorPage, page }) => {
      const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
      await addMenu(page);
      await titlebarFor(page, shape.id).locator('[data-element-id="more"]').click();

      await menuItem(page, 'locked').click({ force: true });

      await expect(menu(page)).toBeVisible();
      expect(await page.evaluate(() => (window as any).__menuEvents)).toEqual([]);
    });

    test('clicking the button again, pressing Escape or clicking elsewhere closes the menu', async ({ editorPage, page }) => {
      const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
      await addMenu(page);
      const button = titlebarFor(page, shape.id).locator('[data-element-id="more"]');

      await button.click();
      await expect(menu(page)).toBeVisible();
      await button.click();
      await expect(menu(page)).toBeHidden();

      await button.click();
      await expect(menu(page)).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(menu(page)).toBeHidden();

      await button.click();
      await expect(menu(page)).toBeVisible();
      const empty = await editorPage.worldToPage(800, 600);
      await page.mouse.click(empty.pageX, empty.pageY);
      await expect(menu(page)).toBeHidden();
      await expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    test('the context menu still opens after the menu was closed by clicking elsewhere', async ({ editorPage, page }) => {
      const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
      await addMenu(page);
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => message.type() === 'error' && errors.push(message.text()));

      await titlebarFor(page, shape.id).locator('[data-element-id="more"]').click();
      await expect(menu(page)).toBeVisible();
      const empty = await editorPage.worldToPage(800, 600);
      await page.mouse.click(empty.pageX, empty.pageY);
      await expect(menu(page)).toBeHidden();

      // The closed portal removes itself from the editor, which must not break the editor's later renders.
      await page.mouse.click(empty.pageX, empty.pageY, { button: 'right' });

      await page.locator('kritzel-editor kritzel-context-menu >>> .menu-container').first().waitFor({ state: 'visible' });
      expect(errors).toEqual([]);
    });

    test('closes when the camera moves', async ({ editorPage, page }) => {
      const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
      await addMenu(page);
      await titlebarFor(page, shape.id).locator('[data-element-id="more"]').click();
      await expect(menu(page)).toBeVisible();

      await editorPage.setViewportRaw(40, 0, 1);
      await nextFrame(page);

      await expect(menu(page)).toBeHidden();
    });

    test('opening the menu of another titlebar replaces the open menu', async ({ editorPage, page }) => {
      const first = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
      const second = await editorPage.addShape({ translateX: 200, translateY: 500, width: 300, height: 150, name: 'Tablet' });
      await addMenu(page);

      await titlebarFor(page, first.id).locator('[data-element-id="more"]').click();
      await expect(menu(page)).toBeVisible();
      const secondButton = titlebarFor(page, second.id).locator('[data-element-id="more"]');
      await secondButton.click();

      await expect(menu(page)).toBeVisible();
      await expect(titlebarFor(page, first.id).locator('[data-element-id="more"]')).toHaveAttribute('aria-expanded', 'false');
      await expect(secondButton).toHaveAttribute('aria-expanded', 'true');
      await expect(page.locator('body > [id^="portal-"]')).toHaveCount(1);
    });
  });

  test.describe('renaming', () => {
    /** Makes the title editable and returns the title element of the given object's titlebar. */
    async function enableRenaming(page: Page, id: string) {
      await page.evaluate(() => {
        const editor = document.querySelector('kritzel-editor') as any;
        editor.objectTitlebar = {
          ...editor.objectTitlebar,
          left: editor.objectTitlebar.left.map((item: any) => (item.type === 'title' ? { ...item, isEditable: true } : item)),
        };
      });
      await nextFrame(page);
      return titlebarFor(page, id).locator('.object-titlebar-title');
    }

    function renameInput(page: Page, id: string): Locator {
      return titlebarFor(page, id).locator('input.object-titlebar-title-input');
    }

    /** Clicks the title of the selected object again and waits until the rename input has focus. */
    async function startRenaming(page: Page, title: Locator, id: string) {
      await title.click();
      await expect(renameInput(page, id)).toBeFocused();
    }

    test('clicking the title of the selected object again renames it', async ({ editorPage, page }) => {
      const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
      const title = await enableRenaming(page, shape.id);

      await title.click();
      await expect(renameInput(page, shape.id)).toHaveCount(0);
      // The title is not a text field until it is edited, so it keeps the custom default cursor.
      await expect(title).toHaveCSS('cursor', /^url\(/);
      await title.click();

      const input = renameInput(page, shape.id);
      await expect(input).toBeFocused();
      await expect(input).toHaveValue('Desktop');
      await expect(input).toHaveCSS('outline-style', 'none');
      await expect(input).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.9)');
      // While renaming, the input is the only item and spans the whole titlebar.
      const titlebar = titlebarFor(page, shape.id);
      await expect(titlebar.locator(':scope > *')).toHaveCount(1);
      await expect(titlebar.locator('button')).toHaveCount(0);
      const [barBox, inputBox] = await Promise.all([titlebar.boundingBox(), input.boundingBox()]);
      expect(inputBox!.width).toBeGreaterThan(barBox!.width - 20);
      await page.keyboard.type('Hero section');
      await page.keyboard.press('Enter');

      await expect(input).toHaveCount(0);
      await expect(title).toHaveText('Hero section');
      expect((await editorPage.getObjectById<{ name?: string }>(shape.id))?.name).toBe('Hero section');
      const selected = await editorPage.getSelectedObjects<{ id: string }>();
      expect(selected.map(object => object.id)).toEqual([shape.id]);
    });

    test('Escape cancels and clicking elsewhere commits', async ({ editorPage, page }) => {
      const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
      const title = await enableRenaming(page, shape.id);

      await title.click();
      await startRenaming(page, title, shape.id);
      await page.keyboard.type('Discarded');
      await page.keyboard.press('Escape');
      await expect(renameInput(page, shape.id)).toHaveCount(0);
      await expect(title).toHaveText('Desktop');

      await startRenaming(page, title, shape.id);
      await page.keyboard.type('Kept');
      await editorPage.clickAtWorld(900, 650);
      await expect(renameInput(page, shape.id)).toHaveCount(0);
      expect((await editorPage.getObjectById<{ name?: string }>(shape.id))?.name).toBe('Kept');
    });

    test('an empty name falls back to the default title', async ({ editorPage, page }) => {
      const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
      // The default test config only gives named objects a titlebar.
      await page.evaluate(() => {
        (document.querySelector('kritzel-editor') as any).objectConfig = { hasTitlebar: true };
      });
      const title = await enableRenaming(page, shape.id);

      await title.click();
      await startRenaming(page, title, shape.id);
      await page.keyboard.press('Backspace');
      await page.keyboard.press('Enter');

      await expect(title).toHaveText('Shape');
      expect((await editorPage.getObjectById<{ name?: string }>(shape.id))?.name).toBeUndefined();
    });

    test('typing in the input does not trigger canvas shortcuts, and undo restores the name', async ({ editorPage, page }) => {
      const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
      await editorPage.waitForUndoCapture();
      const title = await enableRenaming(page, shape.id);

      await title.click();
      await startRenaming(page, title, shape.id);
      await page.keyboard.press('Delete');
      await page.keyboard.type('Renamed');
      await page.keyboard.press('Enter');

      expect(await editorPage.getObjectById(shape.id)).not.toBeNull();
      await expect(title).toHaveText('Renamed');

      await editorPage.waitForUndoCapture();
      await editorPage.undo();
      await expect(title).toHaveText('Desktop');
    });

    test('titles are not editable unless the title item opts in', async ({ editorPage, page }) => {
      const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
      const title = titlebarFor(page, shape.id).locator('.object-titlebar-title');

      await title.click();
      await title.click();

      await expect(renameInput(page, shape.id)).toHaveCount(0);
    });
  });

  test.describe('configurations', () => {
    /** Ids of the rendered elements of a titlebar section, in order. */
    function sectionIds(titlebar: Locator, section: 'left' | 'center' | 'right') {
      return titlebar.locator(`.object-titlebar-${section} > [data-element-id]`).evaluateAll(elements => elements.map(element => element.getAttribute('data-element-id')));
    }

    function events(page: Page) {
      return page.evaluate(() => (window as any).__configEvents.map(({ elementId, menuItemId, section, objectId }: any) => ({ elementId, menuItemId, section, objectId })));
    }

    test('title with dimensions follows resizing and undo', async ({ editorPage, page }) => {
      await page.evaluate(() => {
        const editor = document.querySelector('kritzel-editor') as any;
        editor.objectTitlebar = {
          left: [{ type: 'title', id: 'title' }],
          right: [
            {
              type: 'text',
              id: 'dimensions',
              tone: 'muted',
              text: (context: any) => `${Math.round(context.contentSize.width)} × ${Math.round(context.contentSize.height)}`,
            },
          ],
        };
      });
      const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
      await editorPage.waitForUndoCapture();
      await nextFrame(page);
      const titlebar = titlebarFor(page, shape.id);
      const dimensions = titlebar.locator('[data-element-id="dimensions"]');

      expect(await sectionIds(titlebar, 'left')).toEqual(['title']);
      expect(await sectionIds(titlebar, 'right')).toEqual(['dimensions']);
      await expect(titlebar.locator('.object-titlebar-title')).toHaveText('Desktop');
      await expect(dimensions).toHaveText('300 × 150');
      await expect(dimensions).toHaveClass(/tone-muted/);

      await editorPage.selectObjects([shape]);
      await nextFrame(page);
      await editorPage.dragFromTo({ x: 500, y: 350 }, { x: 580, y: 410 });
      await nextFrame(page);

      const resized = await editorPage.getObjectById<{ width: number; height: number }>(shape.id);
      expect(resized!.width).toBeGreaterThan(300);
      await expect(dimensions).toHaveText(`${Math.round(resized!.width)} × ${Math.round(resized!.height)}`);
      const [barBox, topLeft, topRight] = await Promise.all([
        titlebar.boundingBox(),
        editorPage.worldToPage(200, 200),
        editorPage.worldToPage(200 + resized!.width, 200),
      ]);
      expect(Math.abs(barBox!.width - (topRight.pageX - topLeft.pageX))).toBeLessThanOrEqual(1.5);

      await editorPage.waitForUndoCapture();
      await editorPage.undo();
      await expect(dimensions).toHaveText('300 × 150');

      await editorPage.updateObject(shape, { width: 420, height: 240 });
      await expect(dimensions).toHaveText('420 × 240');
    });

    test('elements render in their sections and buttons report their section', async ({ editorPage, page }) => {
      await page.evaluate(() => {
        const w = window as any;
        w.__configEvents = [];
        const editor = document.querySelector('kritzel-editor') as any;
        editor.addEventListener('objectTitlebarAction', (event: CustomEvent) => w.__configEvents.push(event.detail));
        editor.objectTitlebar = {
          left: [
            { type: 'icon', id: 'kind', icon: 'viewport' },
            { type: 'title', id: 'title' },
            { type: 'separator', id: 'divider' },
            { type: 'text', id: 'dimensions', text: (context: any) => `${Math.round(context.contentSize.width)} × ${Math.round(context.contentSize.height)}` },
          ],
          center: [{ type: 'button', id: 'preview', label: 'Preview', variant: 'outlined' }],
          right: [
            { type: 'button', id: 'add', icon: 'plus', tooltip: 'Add' },
            { type: 'button', id: 'settings', icon: 'settings', tooltip: 'Settings', showWhen: 'active' },
            { type: 'button', id: 'pin', icon: 'copy', tooltip: 'Pin', isPressed: (context: any) => context.object.name === 'Pinned' },
          ],
        };
      });
      const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 400, height: 150, name: 'Desktop' });
      await nextFrame(page);
      const titlebar = titlebarFor(page, shape.id);

      expect(await sectionIds(titlebar, 'left')).toEqual(['kind', 'title', 'divider', 'dimensions']);
      expect(await sectionIds(titlebar, 'center')).toEqual(['preview']);
      expect(await sectionIds(titlebar, 'right')).toEqual(['add', 'pin']);
      await expect(titlebar.locator('[data-element-id="dimensions"]')).toHaveText('400 × 150');
      await expect(titlebar.locator('[data-element-id="preview"]')).toHaveText('Preview');
      await expect(titlebar.locator('[data-element-id="add"]')).toHaveAttribute('aria-label', 'Add');
      await expect(titlebar.locator('[data-element-id="pin"]')).toHaveAttribute('aria-pressed', 'false');

      // While selected, the rotation handle's connector line crosses the bar center, so click the center button first.
      await titlebar.locator('[data-element-id="preview"]').click();

      // Elements shown only while active appear once the object is selected.
      const point = await surfacePoint(titlebar);
      await page.mouse.click(point.x, point.y);
      await expect(titlebar).toHaveAttribute('data-state', 'active');
      expect(await sectionIds(titlebar, 'right')).toEqual(['add', 'settings', 'pin']);

      await titlebar.locator('[data-element-id="settings"]').click();
      expect(await events(page)).toEqual([
        { elementId: 'preview', menuItemId: undefined, section: 'center', objectId: shape.id },
        { elementId: 'settings', menuItemId: undefined, section: 'right', objectId: shape.id },
      ]);

      await editorPage.updateObject(shape, { name: 'Pinned' });
      await expect(titlebar.locator('[data-element-id="pin"]')).toHaveAttribute('aria-pressed', 'true');
      await expect(titlebar.locator('[data-element-id="pin"]')).toHaveClass(/is-pressed/);

      await editorPage.clickAtWorld(900, 650);
      await expect(titlebar).toHaveAttribute('data-state', 'inactive');
      expect(await sectionIds(titlebar, 'right')).toEqual(['add', 'pin']);
    });

    test('elements with minBarWidth hide on narrow titlebars', async ({ editorPage, page }) => {
      await page.evaluate(() => {
        const editor = document.querySelector('kritzel-editor') as any;
        editor.objectTitlebar = {
          left: [{ type: 'title', id: 'title' }],
          right: [{ type: 'text', id: 'dimensions', minBarWidth: 200, text: (context: any) => String(Math.round(context.contentSize.width)) }],
        };
      });
      const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
      await nextFrame(page);
      const titlebar = titlebarFor(page, shape.id);
      await expect(titlebar.locator('[data-element-id="dimensions"]')).toHaveText('300');

      await editorPage.setViewportRaw(0, 0, 0.5);
      await nextFrame(page);

      await expect(titlebar.locator('.object-titlebar-title')).toHaveText('Desktop');
      await expect(titlebar.locator('[data-element-id="dimensions"]')).toHaveCount(0);
    });

    test.describe('buttons with a menu', () => {
      /** Title, dimensions, a button and a menu whose menu items depend on the object. */
      async function configure(page: Page) {
        await page.evaluate(() => {
          const w = window as any;
          w.__configEvents = [];
          w.__addClicks = [];
          const editor = document.querySelector('kritzel-editor') as any;
          editor.addEventListener('objectTitlebarAction', (event: CustomEvent) => w.__configEvents.push(event.detail));
          editor.objectTitlebar = {
            left: [
              { type: 'title', id: 'title', isEditable: true },
              { type: 'text', id: 'dimensions', tone: 'muted', text: (context: any) => `${Math.round(context.contentSize.width)} × ${Math.round(context.contentSize.height)}` },
            ],
            right: [
              { type: 'button', id: 'add', icon: 'plus', tooltip: 'Add', action: (context: any) => w.__addClicks.push(context.title) },
              {
                type: 'menu',
                id: 'more',
                icon: 'ellipsisVertical',
                tooltip: 'More',
                items: (context: any) => [
                  { id: 'size', label: `Size ${Math.round(context.contentSize.width)} × ${Math.round(context.contentSize.height)}`, isDisabled: true },
                  { id: 'widen', label: 'Widen', action: (menuContext: any) => editor.updateObject(menuContext.object, { width: menuContext.object.width + 100 }) },
                  { id: 'delete', label: 'Delete', icon: 'delete', action: (menuContext: any) => editor.removeObject(menuContext.object) },
                ],
              },
            ],
          };
        });
        await nextFrame(page);
      }

      const menu = (page: Page) => page.locator('kritzel-menu[data-testid="object-titlebar-menu"]');
      const menuItem = (page: Page, id: string) => menu(page).locator(`[data-testid="menu-item-${id}"]`);

      test('the button runs its action without opening the menu, and the menu lists items for its object', async ({ editorPage, page }) => {
        const desktop = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
        const mobile = await editorPage.addShape({ translateX: 200, translateY: 500, width: 120, height: 200, name: 'Mobile' });
        await configure(page);

        await titlebarFor(page, desktop.id).locator('[data-element-id="add"]').click();
        await expect(menu(page)).toBeHidden();
        expect(await page.evaluate(() => (window as any).__addClicks)).toEqual(['Desktop']);

        await titlebarFor(page, desktop.id).locator('[data-element-id="more"]').click();
        await expect(menuItem(page, 'size')).toContainText('Size 300 × 150');
        await page.keyboard.press('Escape');
        await expect(menu(page)).toBeHidden();

        await titlebarFor(page, mobile.id).locator('[data-element-id="more"]').click();
        await expect(menuItem(page, 'size')).toContainText('Size 120 × 200');

        expect(await events(page)).toEqual([{ elementId: 'add', menuItemId: undefined, section: 'right', objectId: desktop.id }]);
      });

      test('menu items can change the object, which updates the dimensions', async ({ editorPage, page }) => {
        const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
        await configure(page);
        const titlebar = titlebarFor(page, shape.id);

        await titlebar.locator('[data-element-id="more"]').click();
        await menuItem(page, 'widen').click();

        await expect(menu(page)).toBeHidden();
        await expect(titlebar.locator('[data-element-id="dimensions"]')).toHaveText('400 × 150');
        expect((await editorPage.getObjectById<{ width: number }>(shape.id))!.width).toBeCloseTo(400, 0);
        expect(await events(page)).toEqual([{ elementId: 'more', menuItemId: 'widen', section: 'right', objectId: shape.id }]);

        await titlebar.locator('[data-element-id="more"]').click();
        await expect(menuItem(page, 'size')).toContainText('Size 400 × 150');
      });

      test('a menu item can remove the object together with its titlebar', async ({ editorPage, page }) => {
        const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
        await configure(page);

        await titlebarFor(page, shape.id).locator('[data-element-id="more"]').click();
        await menuItem(page, 'delete').click();

        await expect(titlebarFor(page, shape.id)).toHaveCount(0);
        expect(await editorPage.getObjectById(shape.id)).toBeNull();
        await expect(page.locator('body > [id^="portal-"]')).toHaveCount(0);
      });

      test('clicking the title renames the object while buttons and menu are hidden', async ({ editorPage, page }) => {
        const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
        await configure(page);
        const titlebar = titlebarFor(page, shape.id);
        const title = titlebar.locator('.object-titlebar-title');

        // The first click selects the object, the second one starts renaming.
        await title.click();
        await expect(titlebar).toHaveAttribute('data-state', 'active');
        await title.click();

        const input = titlebar.locator('input.object-titlebar-title-input');
        await expect(input).toBeFocused();
        await expect(input).toHaveValue('Desktop');
        await expect(titlebar.locator('[data-element-id="dimensions"]')).toHaveCount(0);
        await expect(titlebar.locator('button')).toHaveCount(0);

        await page.keyboard.type('Landing page');
        await page.keyboard.press('Enter');

        await expect(input).toHaveCount(0);
        await expect(title).toHaveText('Landing page');
        await expect(titlebar.locator('[data-element-id="dimensions"]')).toHaveText('300 × 150');
        await expect(titlebar.locator('button')).toHaveCount(2);

        // Buttons and menus see the new title in their context.
        await titlebar.locator('[data-element-id="add"]').click();
        expect(await page.evaluate(() => (window as any).__addClicks)).toEqual(['Landing page']);
        await titlebar.locator('[data-element-id="more"]').click();
        await expect(menu(page)).toBeVisible();
        expect((await editorPage.getObjectById<{ name?: string }>(shape.id))?.name).toBe('Landing page');
      });

      test('clicking the title while the menu is open only closes the menu', async ({ editorPage, page }) => {
        const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
        await configure(page);
        const titlebar = titlebarFor(page, shape.id);
        const title = titlebar.locator('.object-titlebar-title');
        const input = titlebar.locator('input.object-titlebar-title-input');

        await title.click();
        await titlebar.locator('[data-element-id="more"]').click();
        await expect(menu(page)).toBeVisible();

        await title.click();
        await expect(menu(page)).toBeHidden();
        await expect(input).toHaveCount(0);

        await title.click();
        await expect(input).toBeFocused();
      });
    });

    test('isEditable can enable renaming per object', async ({ editorPage, page }) => {
      await page.evaluate(() => {
        const editor = document.querySelector('kritzel-editor') as any;
        editor.objectTitlebar = {
          left: [{ type: 'title', id: 'title', isEditable: (context: any) => context.object.name !== 'Locked' }],
        };
      });
      const editable = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
      const locked = await editorPage.addShape({ translateX: 200, translateY: 500, width: 300, height: 150, name: 'Locked' });
      await nextFrame(page);

      const lockedTitle = titlebarFor(page, locked.id).locator('.object-titlebar-title');
      await lockedTitle.click();
      await lockedTitle.click();
      await expect(titlebarFor(page, locked.id).locator('input')).toHaveCount(0);

      const editableTitle = titlebarFor(page, editable.id).locator('.object-titlebar-title');
      await editableTitle.click();
      await editableTitle.click();
      await expect(titlebarFor(page, editable.id).locator('input')).toBeFocused();
    });

    test('a group titlebar with dimensions can be renamed', async ({ editorPage, page }) => {
      await page.evaluate(() => {
        const editor = document.querySelector('kritzel-editor') as any;
        editor.objectConfig = { hasTitlebar: (object: any) => object.__class__ === 'KritzelGroup' };
        editor.objectTitlebar = {
          left: [
            { type: 'title', id: 'title', isEditable: true },
            { type: 'text', id: 'count', tone: 'muted', text: (context: any) => `${context.children.length} items` },
          ],
        };
      });
      const first = await editorPage.addShape({ translateX: 200, translateY: 200, width: 150, height: 150 });
      const second = await editorPage.addShape({ translateX: 400, translateY: 200, width: 150, height: 150 });
      await editorPage.selectObjects([first, second]);
      await editorPage.group();
      await editorPage.clearSelection();
      await nextFrame(page);

      const titlebar = page.locator('kritzel-engine .object-titlebar[data-object-type="KritzelGroup"]');
      await expect(titlebar.locator('[data-element-id="count"]')).toHaveText('2 items');
      const title = titlebar.locator('.object-titlebar-title');
      await expect(title).toHaveText('Group');

      await title.click();
      await title.click();
      await expect(titlebar.locator('input')).toBeFocused();
      await page.keyboard.type('Screens');
      await page.keyboard.press('Enter');

      await expect(title).toHaveText('Screens');
      const group = (await editorPage.getAllObjects<{ __class__: string; name?: string }>()).find(object => object.__class__ === 'KritzelGroup');
      expect(group?.name).toBe('Screens');
    });

    test('visibility "active" shows the titlebar only for selected objects', async ({ editorPage, page }) => {
      await page.evaluate(() => {
        const editor = document.querySelector('kritzel-editor') as any;
        editor.objectTitlebar = { ...editor.objectTitlebar, visibility: 'active' };
      });
      const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
      await nextFrame(page);
      await expect(titlebarFor(page, shape.id)).toHaveCount(0);

      await editorPage.selectObjects([shape]);
      await nextFrame(page);
      await expect(titlebarFor(page, shape.id)).toHaveAttribute('data-state', 'active');

      await editorPage.clearSelection();
      await nextFrame(page);
      await expect(titlebarFor(page, shape.id)).toHaveCount(0);
    });

    test('draggable: false selects the object without moving it', async ({ editorPage, page }) => {
      await page.evaluate(() => {
        const editor = document.querySelector('kritzel-editor') as any;
        editor.objectTitlebar = { ...editor.objectTitlebar, draggable: false };
      });
      const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
      await nextFrame(page);
      const titlebar = titlebarFor(page, shape.id);

      await dragBy(page, await surfacePoint(titlebar), 120, 80);

      await expect(titlebar).toHaveAttribute('data-state', 'active');
      const after = await editorPage.getObjectById<{ translateX: number; translateY: number }>(shape.id);
      expect(after!.translateX).toBeCloseTo(200, 0);
      expect(after!.translateY).toBeCloseTo(200, 0);
    });
  });

  test('right-clicking the titlebar opens the object context menu', async ({ editorPage, page }) => {
    const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
    const point = await surfacePoint(titlebarFor(page, shape.id));

    await page.mouse.click(point.x, point.y, { button: 'right' });

    await page.locator('kritzel-editor kritzel-context-menu >>> .menu-container').first().waitFor({ state: 'visible' });
    const selected = await editorPage.getSelectedObjects<{ id: string }>();
    expect(selected.map(object => object.id)).toEqual([shape.id]);
  });

  test('theme variables can make the titlebar transparent and move it onto the object edge', async ({ editorPage, page }) => {
    const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
    await page.evaluate(() => {
      const editor = document.querySelector('kritzel-editor') as HTMLElement;
      editor.style.setProperty('--kritzel-titlebar-background-color', 'transparent');
      editor.style.setProperty('--kritzel-titlebar-offset', '0px');
    });
    await nextFrame(page);
    const titlebar = titlebarFor(page, shape.id);

    // The background color transitions, so wait for it to settle.
    await expect(titlebar).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    const box = await titlebar.boundingBox();
    const topLeft = await editorPage.worldToPage(200, 200);
    expect(Math.abs(box!.y + box!.height - topLeft.pageY)).toBeLessThanOrEqual(1.5);
  });

  test.describe('visual regression', () => {
    /** Moves the pointer off the titlebars so no hover styles end up in the screenshot, then waits for a render. */
    async function settle(editorPage: EditorPage, page: Page) {
      const empty = await editorPage.worldToPage(1000, 600);
      await page.mouse.move(empty.pageX, empty.pageY);
      await nextFrame(page);
    }

    test('visual: inactive and active titlebars', async ({ editorPage, page }) => {
      await editorPage.addShape({ translateX: 100, translateY: 150, width: 300, height: 150, name: 'Desktop' });
      const active = await editorPage.addShape({ translateX: 500, translateY: 150, width: 300, height: 150, name: 'Tablet' });
      await editorPage.selectObjects([active]);
      await settle(editorPage, page);

      await expect(editorPage.engine).toHaveScreenshot({ animations: 'disabled' });
    });

    test('visual: titlebar with every element type', async ({ editorPage, page }) => {
      await page.evaluate(() => {
        const editor = document.querySelector('kritzel-editor') as any;
        editor.objectTitlebar = {
          left: [
            { type: 'icon', id: 'kind', icon: 'viewport' },
            { type: 'title', id: 'title' },
            { type: 'separator', id: 'divider' },
            { type: 'text', id: 'dimensions', tone: 'muted', text: (context: any) => `${Math.round(context.contentSize.width)} × ${Math.round(context.contentSize.height)}` },
            { type: 'text', id: 'status', tone: 'strong', text: 'Draft' },
          ],
          center: [{ type: 'button', id: 'preview', label: 'Preview', variant: 'outlined' }],
          right: [
            { type: 'button', id: 'play', icon: 'play', variant: 'filled', tooltip: 'Play' },
            { type: 'button', id: 'pin', icon: 'copy', tooltip: 'Pin', isPressed: true },
            { type: 'button', id: 'locked', icon: 'settings', tooltip: 'Locked', isDisabled: true },
            { type: 'menu', id: 'more', icon: 'ellipsisVertical', tooltip: 'More', items: [{ id: 'duplicate', label: 'Duplicate' }] },
          ],
        };
      });
      await editorPage.addShape({ translateX: 100, translateY: 150, width: 700, height: 200, name: 'Landing page' });
      await settle(editorPage, page);

      await expect(editorPage.engine).toHaveScreenshot({ animations: 'disabled' });
    });

    test('visual: open titlebar menu', async ({ editorPage, page }) => {
      const shape = await editorPage.addShape({ translateX: 100, translateY: 150, width: 400, height: 200, name: 'Desktop' });
      await page.evaluate(() => {
        const editor = document.querySelector('kritzel-editor') as any;
        editor.objectTitlebar = {
          ...editor.objectTitlebar,
          right: [
            {
              type: 'menu',
              id: 'more',
              icon: 'ellipsisVertical',
              tooltip: 'More',
              items: [
                { id: 'duplicate', label: 'Duplicate', icon: 'copy' },
                { id: 'settings', label: 'Settings', icon: 'settings' },
                { id: 'delete', label: 'Delete', icon: 'delete', isDisabled: true },
              ],
            },
          ],
        };
      });
      await nextFrame(page);
      await titlebarFor(page, shape.id).locator('[data-element-id="more"]').click();
      await expect(page.locator('kritzel-menu[data-testid="object-titlebar-menu"]')).toBeVisible();
      await settle(editorPage, page);

      // The menu lives in a portal on the body, so capture the whole page.
      await expect(page).toHaveScreenshot({ animations: 'disabled' });
    });

    test('visual: title rename input', async ({ editorPage, page }) => {
      const shape = await editorPage.addShape({ translateX: 100, translateY: 150, width: 400, height: 200, name: 'Desktop' });
      await page.evaluate(() => {
        const editor = document.querySelector('kritzel-editor') as any;
        editor.objectTitlebar = {
          ...editor.objectTitlebar,
          left: editor.objectTitlebar.left.map((item: any) => (item.type === 'title' ? { ...item, isEditable: true } : item)),
        };
      });
      await nextFrame(page);
      const title = titlebarFor(page, shape.id).locator('.object-titlebar-title');
      await title.click();
      await title.click();
      const input = titlebarFor(page, shape.id).locator('input.object-titlebar-title-input');
      await expect(input).toBeFocused();
      // Collapse the initial select-all so the screenshot shows the plain input.
      await page.keyboard.press('End');
      await settle(editorPage, page);

      await expect(editorPage.engine).toHaveScreenshot({ animations: 'disabled' });
    });

    test('visual: titlebars of rotated objects follow or stay upright', async ({ editorPage, page }) => {
      await editorPage.addShape({ translateX: 150, translateY: 200, width: 300, height: 150, rotation: 20, name: 'Follows' });
      await settle(editorPage, page);
      await expect(editorPage.engine).toHaveScreenshot('rotation-follow.png', { animations: 'disabled' });

      await page.evaluate(() => {
        const editor = document.querySelector('kritzel-editor') as any;
        editor.objectTitlebar = { ...editor.objectTitlebar, rotation: 'upright' };
      });
      await settle(editorPage, page);
      await expect(editorPage.engine).toHaveScreenshot('rotation-upright.png', { animations: 'disabled' });
    });

    test('visual: titlebars in the dark theme', async ({ editorPage, page }) => {
      await page.evaluate(() => {
        (document.querySelector('kritzel-editor') as any).theme = 'dark';
      });
      await editorPage.addShape({ translateX: 100, translateY: 150, width: 300, height: 150, name: 'Desktop' });
      const active = await editorPage.addShape({ translateX: 500, translateY: 150, width: 300, height: 150, name: 'Tablet' });
      await editorPage.selectObjects([active]);
      await settle(editorPage, page);

      await expect(editorPage.engine).toHaveScreenshot({ animations: 'disabled' });
    });
  });

  test('exposes parts for styling from page CSS', async ({ editorPage, page }) => {
    const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 300, height: 150, name: 'Desktop' });
    await page.addStyleTag({ content: 'kritzel-engine::part(titlebar-active) { outline: 3px solid rgb(255, 0, 0); }' });
    const titlebar = titlebarFor(page, shape.id);

    const point = await surfacePoint(titlebar);
    await page.mouse.click(point.x, point.y);

    await expect(titlebar).toHaveAttribute('data-state', 'active');
    const outline = await titlebar.evaluate(element => getComputedStyle(element).outlineColor);
    expect(outline).toBe('rgb(255, 0, 0)');
  });
});
