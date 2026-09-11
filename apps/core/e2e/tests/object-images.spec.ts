import { test, expect } from '../../fixtures/editor.fixture';
import type { EditorPage } from '../../fixtures/editor.fixture';

/**
 * Generate a solid-color PNG data URI of a given size inside the browser.
 * This avoids any network dependency and produces a real, visible image.
 */
async function generateDataUri(editorPage: EditorPage, width: number, height: number, color: string): Promise<string> {
  return editorPage.page.evaluate(({ w, h, c }) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    // Background
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, w, h);
    // Diagonal cross so it's clearly an image, not a shape
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, h);
    ctx.moveTo(w, 0);
    ctx.lineTo(0, h);
    ctx.stroke();
    // Label text
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(h / 5)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('IMAGE', w / 2, h / 2);
    return canvas.toDataURL('image/png');
  }, { w: width, h: height, c: color });
}

test.describe('Image objects', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
  });

  test('should add an image from a data URL', async ({ editorPage }) => {
    const src = await generateDataUri(editorPage, 200, 150, '#cc3333');

    const result = await editorPage.addImage({
      src,
      translateX: 100,
      translateY: 100,
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();

    const count = await editorPage.getObjectsTotalCount();
    expect(count).toBe(1);
  });

  test('should position image at translateX/Y', async ({ editorPage }) => {
    const src = await generateDataUri(editorPage, 200, 150, '#3366cc');

    const result = await editorPage.addImage({
      src,
      translateX: 250,
      translateY: 175,
    });

    const obj = await editorPage.getObjectById<any>(result.id);
    expect(obj.translateX).toBe(250);
    expect(obj.translateY).toBe(175);
  });

  test('should set explicit width and height', async ({ editorPage }) => {
    // fromUrl calculates dimensions from the loaded image,
    // so we create an image matching the desired size
    const src = await generateDataUri(editorPage, 300, 200, '#33cc66');

    const result = await editorPage.addImage({
      src,
      translateX: 100,
      translateY: 100,
    });

    const obj = await editorPage.getObjectById<any>(result.id);
    expect(obj.width).toBe(300);
    expect(obj.height).toBe(200);
  });

  test('should set maxWidth/maxHeight constraints', async ({ editorPage }) => {
    // Create a 400x400 image that exceeds the max constraints
    const src = await generateDataUri(editorPage, 400, 400, '#cc66cc');

    const result = await editorPage.addImage({
      src,
      translateX: 100,
      translateY: 100,
      maxWidth: 150,
      maxHeight: 100,
    });

    const obj = await editorPage.getObjectById<any>(result.id);
    expect(obj.maxWidth).toBe(150);
    expect(obj.maxHeight).toBe(100);
    // Image should be scaled down to fit within constraints
    expect(obj.width).toBeLessThanOrEqual(150);
    expect(obj.height).toBeLessThanOrEqual(100);
  });

  test('should render the image element in the DOM', async ({ editorPage }) => {
    const src = await generateDataUri(editorPage, 200, 150, '#6633cc');

    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.addImage({
      src,
      translateX: 100,
      translateY: 100,
    });

    await editorPage.waitForObjectsAdded();

    expect(await editorPage.getObjectElementCount()).toBe(1);
  });

  test('visual: image object', async ({ editorPage }) => {
    const src = await generateDataUri(editorPage, 200, 150, '#cc6633');

    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.addImage({
      src,
      translateX: 150,
      translateY: 100,
    });

    await editorPage.waitForObjectsAdded();

    // Higher threshold because canvas-generated text anti-aliasing varies between runs
    await expect(editorPage.engine).toHaveScreenshot({ maxDiffPixelRatio: 0.05 });
  });

  test('visual: rotated image stores rotation property', async ({ editorPage }) => {
    const rotationDegrees = 60;
    const expectedRadians = rotationDegrees * (Math.PI / 180);
    const src = await generateDataUri(editorPage, 120, 90, '#ae3ec9');

    await editorPage.prepareWaitForObjectsAdded();

    const image = await editorPage.addImage({
      src,
      translateX: 260,
      translateY: 130,
      rotation: rotationDegrees,
    });

    await editorPage.waitForObjectsAdded();

    const imageObject = await editorPage.getObjectById<any>(image.id);
    expect(imageObject?.rotation).toBeCloseTo(expectedRadians, 4);

    await expect(editorPage.engine).toHaveScreenshot({ maxDiffPixelRatio: 0.05 });
  });
});
