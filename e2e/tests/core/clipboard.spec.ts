import { test, expect, EditorPage } from '../../fixtures/editor.fixture';

const CLIPBOARD_PAYLOAD_PREFIX = 'kritzel-clipboard/v1:';

/** Parse the serialized Kritzel clipboard payload into its object list. */
function parseClipboardObjects(serialized: string): any[] {
  if (!serialized || !serialized.startsWith(CLIPBOARD_PAYLOAD_PREFIX)) {
    return [];
  }
  return JSON.parse(serialized.slice(CLIPBOARD_PAYLOAD_PREFIX.length)).objects ?? [];
}

test.describe('Clipboard', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
    await editorPage.clearSystemClipboard();
  });

  test.describe('copy and paste', () => {
    test('should copy a selected object', async ({ editorPage }) => {
      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
        fillColor: { light: '#ff0000', dark: '#ff0000' },
      });

      await editorPage.selectObjects([shape]);

      const copied = parseClipboardObjects(await editorPage.copyToSystemClipboard());
      expect(copied).toHaveLength(1);
      expect(copied[0].shapeType).toBe('rectangle');
    });

    test('copy should serialize the selection to the system clipboard', async ({ editorPage }) => {
      const shape1 = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 0,
        translateY: 0,
        width: 100,
        height: 100,
      });
      const shape2 = await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 200,
        translateY: 0,
        width: 100,
        height: 100,
      });

      await editorPage.selectObjects([shape1, shape2]);

      const copied = parseClipboardObjects(await editorPage.copyToSystemClipboard());
      expect(copied).toHaveLength(2);
      const copiedTypes = copied.map((o: any) => o.shapeType);
      expect(copiedTypes).toContain('rectangle');
      expect(copiedTypes).toContain('ellipse');
    });

    test('should paste copied object at specified coordinates', async ({ editorPage }) => {
      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
      });

      await editorPage.selectObjects([shape]);
      await editorPage.copy();
      await editorPage.paste(400, 400);
      await editorPage.clearSelection();

      const allObjects = await editorPage.getAllObjects<any>();
      expect(allObjects).toHaveLength(2);
    });

    test('pasted object should have a new id (not the same as original)', async ({ editorPage }) => {
      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
      });

      await editorPage.selectObjects([shape]);
      await editorPage.copy();
      await editorPage.paste(400, 400);
      await editorPage.clearSelection();

      const allObjects = await editorPage.getAllObjects<any>();
      expect(allObjects).toHaveLength(2);

      const ids = allObjects.map((o: any) => o.id);
      expect(ids[0]).not.toBe(ids[1]);
    });

    test('pasted object should appear at the paste coordinates', async ({ editorPage }) => {
      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
      });

      await editorPage.selectObjects([shape]);
      await editorPage.copy();
      await editorPage.paste(500, 500);

      const allObjects = await editorPage.getAllObjects<any>();
      const pasted = allObjects.find((o: any) => o.id !== shape.id);
      expect(pasted).toBeDefined();
      expect(pasted.translateX).toBeCloseTo(500, -1);
      expect(pasted.translateY).toBeCloseTo(500, -1);
    });
  });

  test.describe('cut and paste', () => {
    test('should copy a selected object to the clipboard and remove it from the canvas', async ({ editorPage }) => {
      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
        fillColor: { light: '#ff0000', dark: '#ff0000' },
      });

      await editorPage.selectObjects([shape]);
      await editorPage.cut();

      const allObjects = await editorPage.getAllObjects();
      expect(allObjects).toHaveLength(0);

      // The cut object can be pasted back from the clipboard with a new id.
      await editorPage.paste(400, 400);
      const pasted = await editorPage.getAllObjects<any>();
      expect(pasted).toHaveLength(2);
      expect(pasted[0].id).not.toBe(shape.id);
      expect(pasted[0].shapeType).toBe('rectangle');
      expect(pasted[1].__class__).toBe('KritzelSelectionGroup');
    });

    test('should cut multiple selected objects', async ({ editorPage }) => {
      const shape1 = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 0,
        translateY: 0,
        width: 100,
        height: 100,
      });
      const shape2 = await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 200,
        translateY: 0,
        width: 100,
        height: 100,
      });
      await editorPage.addText({
        text: 'Keep me',
        translateX: 400,
        translateY: 0,
      });

      await editorPage.selectObjects([shape1, shape2]);
      await editorPage.cut();

      // Two objects were cut, the text object remains.
      const remaining = await editorPage.getAllObjects();
      expect(remaining).toHaveLength(1);

      // The two cut objects can be pasted back from the clipboard.
      await editorPage.paste(400, 200);
      await editorPage.clearSelection();
      expect(await editorPage.getAllObjects()).toHaveLength(3);
    });

    test('should do nothing when there is no selection', async ({ editorPage }) => {
      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
      });

      await editorPage.clearSelection();
      await editorPage.cut();

      // Nothing was written to the system clipboard.
      expect(await editorPage.copyToSystemClipboard()).toBe('');

      const allObjects = await editorPage.getAllObjects();
      expect(allObjects).toHaveLength(1);
    });

    test('should paste a previously cut object at specified coordinates', async ({ editorPage }) => {
      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
      });

      await editorPage.selectObjects([shape]);
      await editorPage.cut();

      expect(await editorPage.getAllObjects()).toHaveLength(0);

      await editorPage.paste(400, 400);
      await editorPage.clearSelection();

      const allObjects = await editorPage.getAllObjects<any>();
      expect(allObjects).toHaveLength(1);

      const pasted = allObjects[0];
      expect(pasted.id).not.toBe(shape.id);
      expect(pasted.translateX).toBeCloseTo(400, -1);
      expect(pasted.translateY).toBeCloseTo(400, -1);
    });

    test('object count should decrease after cut', async ({ editorPage }) => {
      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 0,
        translateY: 0,
        width: 100,
        height: 100,
      });
      await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 200,
        translateY: 0,
        width: 100,
        height: 100,
      });

      expect(await editorPage.getObjectsTotalCount()).toBe(2);

      await editorPage.selectObjects([shape]);
      await editorPage.cut();

      expect(await editorPage.getObjectsTotalCount()).toBe(1);
    });
  });

  test.describe('delete', () => {
    test('should delete the selected object', async ({ editorPage }) => {
      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
      });

      await editorPage.selectObjects([shape]);
      await editorPage.deleteSelected();

      const allObjects = await editorPage.getAllObjects();
      expect(allObjects).toHaveLength(0);
    });

    test('should delete multiple selected objects', async ({ editorPage }) => {
      const shape1 = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 0,
        translateY: 0,
        width: 100,
        height: 100,
      });
      const shape2 = await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 200,
        translateY: 0,
        width: 100,
        height: 100,
      });
      await editorPage.addText({
        text: 'Keep me',
        translateX: 400,
        translateY: 0,
      });

      await editorPage.selectObjects([shape1, shape2]);
      await editorPage.deleteSelected();

      const allObjects = await editorPage.getAllObjects();
      expect(allObjects).toHaveLength(1);
    });

    test('object count should decrease after delete', async ({ editorPage }) => {
      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 0,
        translateY: 0,
        width: 100,
        height: 100,
      });
      await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 200,
        translateY: 0,
        width: 100,
        height: 100,
      });

      expect(await editorPage.getObjectsTotalCount()).toBe(2);

      await editorPage.selectObjects([shape]);
      await editorPage.deleteSelected();

      expect(await editorPage.getObjectsTotalCount()).toBe(1);
    });

    test('deleted objects should not appear in DOM', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();

      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
      });

      await editorPage.waitForObjectsAdded();
      expect(await editorPage.getObjectElementCount()).toBe(1);

      await editorPage.selectObjects([shape]);
      await editorPage.deleteSelected();

      await editorPage.page.waitForTimeout(100);
      expect(await editorPage.getObjectElementCount()).toBe(0);
    });
  });

  test.describe('copy-paste with groups', () => {
    test('should copy and paste a grouped object', async ({ editorPage }) => {
      const shape1 = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 100,
        height: 100,
      });
      const shape2 = await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 250,
        translateY: 100,
        width: 100,
        height: 100,
      });

      await editorPage.selectObjects([shape1, shape2]);
      await editorPage.group();
      await editorPage.copy();

      const countBeforePaste = await editorPage.getObjectsTotalCount();

      await editorPage.paste(500, 500);

      const countAfterPaste = await editorPage.getObjectsTotalCount();
      expect(countAfterPaste).toBeGreaterThan(countBeforePaste);
    });
  });

  test.describe('paste from system clipboard', () => {
    test('should paste an image file from the system clipboard', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();

      await editorPage.pasteImageFileFromSystemClipboard({
        width: 200,
        height: 150,
        color: '#4a90d9',
      });

      await editorPage.waitForObjectsAdded();
      await editorPage.clearSelection();

      const allObjects = await editorPage.getAllObjects<any>();
      expect(allObjects).toHaveLength(1);
      expect(allObjects[0].__class__).toBe('KritzelImage');

      await expect(editorPage.engine).toHaveScreenshot();
    });

    test('should paste text from the system clipboard', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();

      await editorPage.pasteTextFromSystemClipboard('Hello from the\nsystem clipboard');

      await editorPage.waitForObjectsAdded();
      await editorPage.clearSelection();

      const allObjects = await editorPage.getAllObjects<any>();
      expect(allObjects).toHaveLength(1);
      expect(allObjects[0].__class__).toBe('KritzelText');

      await expect(editorPage.engine).toHaveScreenshot();
    });

    test('should paste kritzel objects from one tab into a second editor in another tab', async ({ editorPage, context }) => {
      // Tab 1: create and select objects, then copy them to the system clipboard.
      const shape1 = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 160,
        height: 120,
        fillColor: { light: '#4a90d9', dark: '#4a90d9' },
      });
      const shape2 = await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 300,
        translateY: 100,
        width: 160,
        height: 120,
        fillColor: { light: '#d94a4a', dark: '#d94a4a' },
      });

      await editorPage.selectObjects([shape1, shape2]);
      const payload = await editorPage.copyToSystemClipboard();
      expect(payload.length).toBeGreaterThan(0);

      // Tab 2: open a second tab running its own editor instance.
      const secondTab = await context.newPage();
      const secondEditor = new EditorPage(secondTab);
      await secondEditor.goto();
      await secondEditor.waitForReady();

      expect(await secondEditor.getObjectsTotalCount()).toBe(0);

      await secondEditor.prepareWaitForObjectsAdded();
      await secondEditor.pasteKritzelPayloadFromSystemClipboard(payload);
      await secondEditor.waitForObjectsAdded();
      await secondEditor.clearSelection();

      expect(await secondEditor.getObjectsTotalCount()).toBe(2);

      const pastedIds = (await secondEditor.getAllObjects<any>()).map(o => o.id);
      expect(pastedIds).not.toContain(shape1.id);
      expect(pastedIds).not.toContain(shape2.id);

      await expect(secondEditor.engine).toHaveScreenshot();

      await secondTab.close();
    });
  });

  test.describe('clipboard permissions', () => {
    test('should show notification card when clipboard read permission is blocked', async ({ editorPage }) => {
      await editorPage.blockClipboardReadPermission();
      await editorPage.paste(400, 400);

      const notificationCard = editorPage.page.locator('kritzel-notification-card');
      await expect(notificationCard).toBeVisible();
      await expect(notificationCard.locator('.type-pill')).toHaveText('Error');
      await expect(notificationCard.locator('.message')).toContainText(
        'Clipboard read permission is required to paste content.'
      );
    });
  });

  test.describe('visual regression', () => {
    test('canvas after pasting a copied shape', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();

      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 150,
        width: 200,
        height: 150,
        fillColor: { light: '#4a90d9', dark: '#4a90d9' },
      });

      await editorPage.waitForObjectsAdded();

      await editorPage.selectObjects([shape]);
      await editorPage.copy();
      await editorPage.clearSelection();
      await editorPage.paste(400, 150);

      // Wait for pasted object to render
      await editorPage.page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          )
      );

      await expect(editorPage.engine).toHaveScreenshot();
    });

    test('canvas after deleting one of two shapes', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();

      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 150,
        width: 200,
        height: 150,
        fillColor: { light: '#4a90d9', dark: '#4a90d9' },
      });

      await editorPage.waitForObjectsAdded();
      await editorPage.prepareWaitForObjectsAdded();

      const shape2 = await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 400,
        translateY: 150,
        width: 200,
        height: 150,
        fillColor: { light: '#d94a4a', dark: '#d94a4a' },
      });

      await editorPage.waitForObjectsAdded();

      await editorPage.selectObjects([shape2]);
      await editorPage.deleteSelected();

      // Wait for DOM removal
      await editorPage.page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          )
      );

      await expect(editorPage.engine).toHaveScreenshot();
    });

    test('canvas after copy-pasting multiple objects', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();

      const shape1 = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: -300,
        translateY: -300,
        width: 120,
        height: 100,
        fillColor: { light: '#4a90d9', dark: '#4a90d9' },
      });

      await editorPage.waitForObjectsAdded();
      await editorPage.prepareWaitForObjectsAdded();

      const shape2 = await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: -120,
        translateY: -300,
        width: 120,
        height: 100,
        fillColor: { light: '#d94a4a', dark: '#d94a4a' },
      });

      await editorPage.waitForObjectsAdded();

      await editorPage.selectObjects([shape1, shape2]);
      await editorPage.copy();
      await editorPage.clearSelection();
      await editorPage.paste(0, 0);

      // Wait for pasted objects to render
      await editorPage.page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          )
      );

      await expect(editorPage.engine).toHaveScreenshot();
    });

    test('canvas after copy-pasting multiple objects at the edge of the viewport', async ({ editorPage }) => {
      // This tests that objects copied near the edge of the viewport are pasted correctly and scrolled into view
      await editorPage.prepareWaitForObjectsAdded();

      const shape1 = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 120,
        height: 100,
        fillColor: { light: '#4a90d9', dark: '#4a90d9' },
      });

      await editorPage.waitForObjectsAdded();
      await editorPage.prepareWaitForObjectsAdded();

      const shape2 = await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 280,
        translateY: 100,
        width: 120,
        height: 100,
        fillColor: { light: '#d94a4a', dark: '#d94a4a' },
      });

      await editorPage.waitForObjectsAdded();

      await editorPage.selectObjects([shape1, shape2]);
      await editorPage.copy();
      await editorPage.clearSelection();
      await editorPage.paste(400, 300);

      // Wait for pasted objects to render
      await editorPage.page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          )
      );

      await expect(editorPage.engine).toHaveScreenshot();
    });
  });
});
