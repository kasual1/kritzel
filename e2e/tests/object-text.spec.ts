import { test, expect } from '../fixtures/editor.fixture';

test.describe('Text objects', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
  });

  test('should add text with specified content', async ({ editorPage }) => {
    const result = await editorPage.addText({
      text: 'Hello World',
      translateX: 100,
      translateY: 100,
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  test('should position text at translateX/Y', async ({ editorPage }) => {
    const result = await editorPage.addText({
      text: 'Positioned',
      translateX: 250,
      translateY: 175,
    });

    const obj = await editorPage.getObjectById<any>(result.id);
    expect(obj.translateX).toBe(250);
    expect(obj.translateY).toBe(175);
  });

  test('should set font size', async ({ editorPage }) => {
    const result = await editorPage.addText({
      text: 'Big Text',
      translateX: 100,
      translateY: 100,
      fontSize: 48,
    });

    const obj = await editorPage.getObjectById<any>(result.id);
    expect(obj.fontSize).toBe(48);
  });

  test('should set font family', async ({ editorPage }) => {
    const result = await editorPage.addText({
      text: 'Arial Text',
      translateX: 100,
      translateY: 100,
      fontFamily: 'Arial',
    });

    const obj = await editorPage.getObjectById<any>(result.id);
    expect(obj.fontFamily).toBe('Arial');
  });

  test('should set font color as ThemeAwareColor', async ({ editorPage }) => {
    const result = await editorPage.addText({
      text: 'Colored',
      translateX: 100,
      translateY: 100,
      fontColor: { light: '#ff0000', dark: '#00ff00' },
    });

    const obj = await editorPage.getObjectById<any>(result.id);
    expect(obj.fontColor.light).toBe('#ff0000');
    expect(obj.fontColor.dark).toBe('#00ff00');
  });

  test('should render text as HTML (not SVG) element', async ({ editorPage }) => {
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.addText({
      text: 'HTML Check',
      translateX: 100,
      translateY: 100,
    });

    await editorPage.waitForObjectsAdded();

    // Text objects render as HTML divs, not SVG
    expect(await editorPage.getObjectElementCount()).toBe(1);
    expect(await editorPage.getSvgElementCount()).toBe(0);
  });

  test('visual: text with default styling', async ({ editorPage }) => {
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.addText({
      text: 'Default Text',
      translateX: 200,
      translateY: 150,
      fontSize: 24,
      fontFamily: 'Arial',
    });

    await editorPage.waitForObjectsAdded();

    await expect(editorPage.engine).toHaveScreenshot();
  });

  test('visual: text with custom font and color', async ({ editorPage }) => {
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.addText({
      text: 'Styled Text',
      translateX: 200,
      translateY: 150,
      fontSize: 36,
      fontFamily: 'Arial',
      fontColor: { light: '#cc3300', dark: '#ff6644' },
    });

    await editorPage.waitForObjectsAdded();

    await expect(editorPage.engine).toHaveScreenshot();
  });
});
