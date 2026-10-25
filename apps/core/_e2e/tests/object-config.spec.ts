import { test, expect } from '../fixtures/editor.fixture';
import type { Locator, Page } from '@playwright/test';

async function nextFrame(page: Page) {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

/** The four corner resize handles of the current selection (overlays have their own class). */
function resizeHandles(page: Page): Locator {
  return page.locator('kritzel-engine .selection-group-handles .resize-handle');
}

/** The rotation handle of the current selection. */
function rotationHandle(page: Page): Locator {
  return page.locator('kritzel-engine .selection-group-handles .rotation-handle');
}

test.describe('Object config', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
    await editorPage.setViewportRaw(0, 0, 1);
  });

  test('a selected shape shows resize handles and the rotation handle by default', async ({ editorPage, page }) => {
    const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 200, height: 150 });

    await editorPage.selectObjects([shape]);
    await nextFrame(page);

    await expect(resizeHandles(page)).toHaveCount(4);
    await expect(rotationHandle(page)).toHaveCount(1);
  });

  test('isRotatable: false hides the rotation handle but keeps the resize handles', async ({ editorPage, page }) => {
    await page.evaluate(() => {
      (document.querySelector('kritzel-editor') as any).objectConfig = { isRotatable: false };
    });
    await nextFrame(page);
    const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 200, height: 150 });

    await editorPage.selectObjects([shape]);
    await nextFrame(page);

    await expect(resizeHandles(page)).toHaveCount(4);
    await expect(rotationHandle(page)).toHaveCount(0);
  });

  test('an isResizable function decides per object', async ({ editorPage, page }) => {
    await page.evaluate(() => {
      (document.querySelector('kritzel-editor') as any).objectConfig = { isResizable: (object: any) => object.__class__ !== 'KritzelText' };
    });
    await nextFrame(page);
    const text = await editorPage.addText({ text: 'Fixed size', translateX: 200, translateY: 200, fontSize: 24 });
    const shape = await editorPage.addShape({ translateX: 500, translateY: 200, width: 200, height: 150 });

    await editorPage.selectObjects([text]);
    await nextFrame(page);
    await expect(resizeHandles(page)).toHaveCount(0);
    await expect(rotationHandle(page)).toHaveCount(1);

    await editorPage.clearSelection();
    await editorPage.selectObjects([shape]);
    await nextFrame(page);
    await expect(resizeHandles(page)).toHaveCount(4);
    await expect(rotationHandle(page)).toHaveCount(1);
  });

  test('a multi-selection hides a handle when one selected object forbids it', async ({ editorPage, page }) => {
    await page.evaluate(() => {
      (document.querySelector('kritzel-editor') as any).objectConfig = { isRotatable: (object: any) => object.name !== 'Locked' };
    });
    await nextFrame(page);
    const allowed = await editorPage.addShape({ translateX: 200, translateY: 200, width: 150, height: 150, name: 'Free' });
    const forbidden = await editorPage.addShape({ translateX: 400, translateY: 200, width: 150, height: 150, name: 'Locked' });

    await editorPage.selectObjects([allowed]);
    await nextFrame(page);
    await expect(rotationHandle(page)).toHaveCount(1);

    await editorPage.clearSelection();
    await editorPage.selectObjects([allowed, forbidden]);
    await nextFrame(page);
    await expect(rotationHandle(page)).toHaveCount(0);
    await expect(resizeHandles(page)).toHaveCount(4);
  });

  test('a group cannot be rotated when a child has isRotatable set to false', async ({ editorPage, page }) => {
    const first = await editorPage.addShape({ translateX: 200, translateY: 200, width: 150, height: 150 });
    const second = await editorPage.addShape({ translateX: 400, translateY: 200, width: 150, height: 150 });
    await editorPage.updateObject(first, { isRotatable: false });

    await editorPage.selectObjects([first, second]);
    await editorPage.group();
    await editorPage.clearSelection();

    const child = await editorPage.getObjectById<{ isRotatable: boolean }>(first.id as string);
    expect(child!.isRotatable).toBe(false);
    const allObjects = await editorPage.getAllObjects<{ id: string; __class__: string }>();
    const group = allObjects.find(object => object.__class__ === 'KritzelGroup');
    expect(group).toBeDefined();

    await editorPage.selectObjects([group!]);
    await nextFrame(page);

    const selected = await editorPage.getSelectedObjects<{ id: string }>();
    expect(selected.map(object => object.id)).toEqual([group!.id]);
    await expect(rotationHandle(page)).toHaveCount(0);
    await expect(resizeHandles(page)).toHaveCount(4);
  });

  test('changing objectConfig at runtime updates the handles of the current selection', async ({ editorPage, page }) => {
    const shape = await editorPage.addShape({ translateX: 200, translateY: 200, width: 200, height: 150 });
    await editorPage.selectObjects([shape]);
    await nextFrame(page);
    await expect(resizeHandles(page)).toHaveCount(4);
    await expect(rotationHandle(page)).toHaveCount(1);

    await page.evaluate(() => {
      (document.querySelector('kritzel-editor') as any).objectConfig = { isRotatable: false, isResizable: false };
    });
    await nextFrame(page);
    await expect(resizeHandles(page)).toHaveCount(0);
    await expect(rotationHandle(page)).toHaveCount(0);

    await page.evaluate(() => {
      (document.querySelector('kritzel-editor') as any).objectConfig = {};
    });
    await nextFrame(page);
    await expect(resizeHandles(page)).toHaveCount(4);
    await expect(rotationHandle(page)).toHaveCount(1);
  });
});
