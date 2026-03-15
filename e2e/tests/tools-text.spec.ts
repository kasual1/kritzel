import { test, expect } from '../fixtures/editor.fixture';

test.describe('Text tool', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
    await editorPage.waitForEngine();
    await editorPage.activateTool('text');
  });

  /**
   * Click on the canvas to start creating a text object.
   *
   * The text tool creates the object in handlePointerDown and immediately
   * enters edit mode (ProseMirror).  We split the click into down → wait → up
   * so the Stencil render cycle can mount the editor before pointerup fires.
   */
  async function clickToStartText(editorPage: any, x: number, y: number) {
    const { pageX, pageY } = await editorPage.worldToPage(x, y);
    await editorPage.page.mouse.move(pageX, pageY);
    await editorPage.page.mouse.down();
    await editorPage.page.waitForTimeout(100);
    await editorPage.page.mouse.up();
  }

  /**
   * Complete the full text-creation lifecycle:
   * 1. Click canvas to start editing
   * 2. Type the given text
   * 3. Click outside the text object to commit (triggers resetActiveText → save)
   *
   * Without typing content the text object would be deleted as empty.
   * Without clicking outside the object stays in edit mode and is not "saved".
   */
  async function createTextObject(editorPage: any, x: number, y: number, text: string) {
    await clickToStartText(editorPage, x, y);

    // Wait for ProseMirror to be mounted and focused
    await editorPage.page.waitForTimeout(100);

    await editorPage.page.keyboard.type(text);

    // Click far away from the text to commit it.
    // This triggers resetActiveText() → save() and switches to selection tool.
    await clickToStartText(editorPage, x + 400, y + 400);

    // Wait for the save/rerender cycle to complete
    await editorPage.page.evaluate(() =>
      new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );
  }

  test('should create a text object by clicking on the canvas', async ({ editorPage }) => {
    await editorPage.prepareWaitForObjectsAdded();

    await createTextObject(editorPage, 200, 150, 'Hello');

    const count = await editorPage.getObjectsTotalCount();
    expect(count).toBe(1);

    const objects = await editorPage.getAllObjects<any>();
    expect(objects[0].id).toBeDefined();
  });

  test('created text should be positioned near the click location', async ({ editorPage }) => {
    await editorPage.prepareWaitForObjectsAdded();

    await createTextObject(editorPage, 200, 150, 'Position test');

      const objects = await editorPage.getAllObjects<any>();
    expect(objects).toHaveLength(1);

    const textObj = objects[0];
    const tolerance = 20;
    expect(textObj.translateX).toBeGreaterThan(200 - tolerance);
    expect(textObj.translateX).toBeLessThan(200 + tolerance);
    expect(textObj.translateY).toBeGreaterThan(150 - tolerance);
    expect(textObj.translateY).toBeLessThan(150 + tolerance);
  });

  test('text object should be editable after creation', async ({ editorPage }) => {
    // Click to start editing — do NOT click outside, so the text stays in edit mode
    await editorPage.prepareWaitForObjectsAdded();

    await clickToStartText(editorPage, 200, 150);

    // Wait for ProseMirror mount
    await editorPage.page.waitForTimeout(100);

    // The text tool sets isEditing=true on the created text object.
    // Verify via the engine's core.store.activeText getter.
    const hasActiveText = await editorPage.page.evaluate(() => {
      const engine = document.querySelector('kritzel-engine') as any;
      return engine?.core?.store?.activeText !== null;
    });

    expect(hasActiveText).toBe(true);
  });

  test('visual: text created with text tool', async ({ editorPage }) => {
    await editorPage.prepareWaitForObjectsAdded();

    await createTextObject(editorPage, 200, 150, 'Hello World');

    // Wait for final render after save
    await editorPage.page.evaluate(() =>
      new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );

    await expect(editorPage.engine).toHaveScreenshot();
  });
});
