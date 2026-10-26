import { test, expect } from '../fixtures/editor.fixture';
import type { Locator, Page } from '@playwright/test';

/** Configures a Framer-like titlebar for groups and named objects and records button actions and events on window. */
async function configureTitlebar(page: Page) {
  await page.evaluate(() => {
    const w = window as any;
    w.__titlebarActions = [];
    w.__titlebarEvents = [];
    const editor = document.querySelector('kritzel-editor') as any;
    editor.addEventListener('objectTitlebarAction', (event: CustomEvent) => w.__titlebarEvents.push(event.detail.itemId));
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
    await expect(titlebar.locator('[data-item-id="size"]')).toHaveText('300');
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

    await titlebar.locator('[data-item-id="play"]').click();

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
    const button = titlebarFor(page, shape.id).locator('[data-item-id="play"]');
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
