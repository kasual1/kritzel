import { test, expect } from '../fixtures/editor.fixture';
import type { EditorPage } from '../fixtures/editor.fixture';

/** A solid-color PNG data URI, generated in the browser so the test has no network dependency. */
async function generateDataUri(editorPage: EditorPage, width: number, height: number, color: string): Promise<string> {
  return editorPage.page.evaluate(({ w, h, c }) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, w, h);
    return canvas.toDataURL('image/png');
  }, { w: width, h: height, c: color });
}

/**
 * Checks the loading lifecycle of an object that was added in loading state: the engine's loading placeholder is
 * shown and the object's content is hidden; after `setLoading(false)` the placeholder is gone and the content shows.
 */
async function expectLoadingLifecycle(editorPage: EditorPage, object: Record<string, unknown>) {
  const placeholder = editorPage.loadingPlaceholder(object);
  const content = editorPage.objectContent(object);

  await expect(placeholder).toBeVisible();
  await expect(placeholder).toHaveCount(1);
  // Hidden, but still mounted so it can keep loading.
  await expect(content).toBeAttached();
  await expect(content).toBeHidden();

  await editorPage.setObjectLoading(object, false);

  await expect(placeholder).toHaveCount(0);
  await expect(content).toBeVisible();
}

test.describe('Object loading state', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
  });

  test('should show the loading placeholder over a shape until it stops loading', async ({ editorPage }) => {
    const shape = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 100,
      translateY: 100,
      width: 200,
      height: 120,
      isLoading: true,
    });

    await expectLoadingLifecycle(editorPage, shape);
  });

  test('should show the loading placeholder over a path until it stops loading', async ({ editorPage }) => {
    const path = await editorPage.addPath({
      points: [[0, 0], [60, 80], [120, 20], [200, 100]],
      translateX: 100,
      translateY: 100,
      strokeWidth: 6,
      isLoading: true,
    });

    await expectLoadingLifecycle(editorPage, path);
  });

  test('should show the loading placeholder over a text until it stops loading', async ({ editorPage }) => {
    const text = await editorPage.addText({
      text: 'Loading text',
      translateX: 100,
      translateY: 100,
      fontSize: 24,
      isLoading: true,
    });

    await expectLoadingLifecycle(editorPage, text);
  });

  test('should show the loading placeholder over a line until it stops loading', async ({ editorPage }) => {
    const line = await editorPage.addLine({
      startX: 0,
      startY: 0,
      endX: 200,
      endY: 120,
      translateX: 100,
      translateY: 100,
      strokeWidth: 6,
      isLoading: true,
    });

    await expectLoadingLifecycle(editorPage, line);
  });

  test('should show the loading placeholder over an image until it stops loading', async ({ editorPage }) => {
    const src = await generateDataUri(editorPage, 200, 150, '#cc3333');
    const image = await editorPage.addImage({
      src,
      translateX: 100,
      translateY: 100,
      isLoading: true,
    });

    await expectLoadingLifecycle(editorPage, image);
  });

  test('should show the loading placeholder over a dynamic object until it stops loading', async ({ editorPage }) => {
    const dynamicObject = await editorPage.addDynamicObject({
      translateX: 100,
      translateY: 100,
      width: 240,
      height: 160,
      contentText: 'Dynamic content',
      testId: 'loading-dynamic-content',
      isLoading: true,
    });

    await expectLoadingLifecycle(editorPage, dynamicObject);
    await expect(editorPage.engine.getByTestId('loading-dynamic-content')).toBeVisible();
  });

  test('should show the loading placeholder over an iframe object until it stops loading', async ({ editorPage }) => {
    const iframeObject = await editorPage.addIframeObject({
      html: '<main>Iframe content</main>',
      translateX: 100,
      translateY: 100,
      width: 320,
      height: 200,
      isLoading: true,
    });

    await expectLoadingLifecycle(editorPage, iframeObject);
    await expect(editorPage.objectWrapper(iframeObject).locator('iframe').contentFrame().locator('main')).toHaveText('Iframe content');
  });

  test('should show the loading placeholder over a group and hide its children until it stops loading', async ({ editorPage }) => {
    const shape = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 100,
      translateY: 100,
      width: 120,
      height: 100,
    });
    const text = await editorPage.addText({
      text: 'Grouped',
      translateX: 260,
      translateY: 120,
      fontSize: 24,
    });

    await editorPage.selectObjects([shape, text]);
    await editorPage.group();
    await editorPage.clearSelection();

    const group = (await editorPage.getAllObjects<Record<string, unknown>>()).find(object => object.__class__ === 'KritzelGroup');
    expect(group).toBeDefined();

    await editorPage.setObjectLoading(group!, true);

    const placeholder = editorPage.loadingPlaceholder(group!);
    await expect(placeholder).toBeVisible();
    // The children are objects of their own, rendered in their own wrappers.
    for (const child of [shape, text]) {
      await expect(editorPage.objectContent(child)).toBeAttached();
      await expect(editorPage.objectContent(child)).toBeHidden();
    }

    await editorPage.setObjectLoading(group!, false);

    await expect(placeholder).toHaveCount(0);
    for (const child of [shape, text]) {
      await expect(editorPage.objectContent(child)).toBeVisible();
    }
  });
});
