import { test, expect } from '../../fixtures/editor.fixture';

async function waitForWheelHandling(page: import('@playwright/test').Page) {
  await page.waitForTimeout(120);
}

async function wheelOverDynamicObjectContent(
  page: import('@playwright/test').Page,
  testId: string,
  options: { deltaX?: number; deltaY?: number } = {}
) {
  const center = await page.evaluate(({ id }) => {
    const engine = document.querySelector('kritzel-engine');
    if (!engine?.shadowRoot) {
      throw new Error('kritzel-engine shadow root not found');
    }

    const target = engine.shadowRoot.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;
    if (!target) {
      throw new Error(`Dynamic object content with data-testid="${id}" not found`);
    }

    const rect = target.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }, { id: testId });

  await page.mouse.move(center.x, center.y);
  await page.mouse.wheel(options.deltaX ?? 0, options.deltaY ?? 0);
}

test.describe('Dynamic objects', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
  });

  test('should add a dynamic object and return an object with an id', async ({ editorPage }) => {
    const result = await editorPage.addDynamicObject({
      translateX: 120,
      translateY: 90,
      width: 260,
      height: 180,
      contentText: 'Custom object',
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('string');

    const count = await editorPage.getObjectsTotalCount();
    expect(count).toBe(1);
  });

  test('should persist dynamic object dimensions and position', async ({ editorPage }) => {
    const created = await editorPage.addDynamicObject({
      translateX: 210,
      translateY: 170,
      width: 320,
      height: 210,
      contentText: 'Sized dynamic object',
    });

    const object = await editorPage.getObjectById<any>(created.id);
    expect(object).not.toBeNull();
    expect(object.__class__).toBe('KritzelDynamicObject');
    expect(object.translateX).toBe(210);
    expect(object.translateY).toBe(170);
    expect(object.width).toBe(320);
    expect(object.height).toBe(210);
  });

  test('should render dynamic object content in the engine DOM', async ({ editorPage }) => {
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.addDynamicObject({
      translateX: 100,
      translateY: 100,
      width: 280,
      height: 180,
      testId: 'custom-content-render',
      contentText: 'Rendered custom content',
    });

    await editorPage.waitForObjectsAdded();

    expect(await editorPage.getObjectElementCount()).toBe(1);

    const text = await editorPage.page.evaluate(() => {
      const engine = document.querySelector('kritzel-engine');
      if (!engine?.shadowRoot) return null;
      const content = engine.shadowRoot.querySelector('[data-testid="custom-content-render"]');
      return content?.textContent?.trim() ?? null;
    });

    expect(text).toContain('Rendered custom content');
  });

  test('should update width and height of a dynamic object', async ({ editorPage }) => {
    const created = await editorPage.addDynamicObject({
      translateX: 60,
      translateY: 60,
      width: 200,
      height: 140,
      contentText: 'Resizable dynamic object',
    });

    await editorPage.updateObject(created, { width: 360, height: 260 });

    const updated = await editorPage.getObjectById<any>(created.id);
    expect(updated.width).toBe(360);
    expect(updated.height).toBe(260);
  });

  test('should remove a dynamic object and decrement total count', async ({ editorPage }) => {
    const created = await editorPage.addDynamicObject({
      translateX: 90,
      translateY: 100,
      width: 220,
      height: 160,
      contentText: 'To remove',
    });

    expect(await editorPage.getObjectsTotalCount()).toBe(1);

    await editorPage.removeObject(created);

    expect(await editorPage.getObjectsTotalCount()).toBe(0);
    expect(await editorPage.getObjectElementCount()).toBe(0);
  });

  test('should pass wheel handling to viewport when selected dynamic object is not scrollable', async ({ editorPage }) => {
    const created = await editorPage.addDynamicObject({
      translateX: 130,
      translateY: 120,
      width: 320,
      height: 180,
      testId: 'non-scrollable-custom-content',
      contentText: 'No scrollbar here',
    });

    await editorPage.selectObjects([created]);

    const before = await editorPage.getViewport();

    await wheelOverDynamicObjectContent(editorPage.page, 'non-scrollable-custom-content', { deltaY: 140 });
    await waitForWheelHandling(editorPage.page);

    const after = await editorPage.getViewport();

    expect(after.translateY).not.toBeCloseTo(before.translateY, 3);
  });

});
