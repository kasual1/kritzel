import { test, expect } from '../fixtures/editor.fixture';

test.describe('Path objects', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
  });

  test('should add a path with point array', async ({ editorPage }) => {
    const result = await editorPage.addPath({
      points: [
        [0, 0],
        [50, 50],
        [100, 25],
        [150, 75],
        [200, 0],
      ],
      translateX: 100,
      translateY: 100,
      strokeWidth: 3,
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();

    const count = await editorPage.getObjectsTotalCount();
    expect(count).toBe(1);
  });

  test('should set stroke width', async ({ editorPage }) => {
    const result = await editorPage.addPath({
      points: [
        [0, 0],
        [100, 100],
      ],
      translateX: 0,
      translateY: 0,
      strokeWidth: 8,
    });

    const obj = await editorPage.getObjectById<any>(result.id);
    expect(obj.strokeWidth).toBe(8);
  });

  test('should set fill color', async ({ editorPage }) => {
    const result = await editorPage.addPath({
      points: [
        [0, 0],
        [50, 50],
        [100, 0],
      ],
      translateX: 0,
      translateY: 0,
      strokeWidth: 3,
      fill: { light: '#ff0000', dark: '#cc0000' },
    });

    const obj = await editorPage.getObjectById<any>(result.id);
    expect(obj.fill.light).toBe('#ff0000');
    expect(obj.fill.dark).toBe('#cc0000');
  });

  test('should set lineSlack for smoothing', async ({ editorPage }) => {
    const result = await editorPage.addPath({
      points: [
        [0, 0],
        [50, 50],
        [100, 0],
      ],
      translateX: 0,
      translateY: 0,
      strokeWidth: 3,
      lineSlack: 0.5,
    });

    const obj = await editorPage.getObjectById<any>(result.id);
    expect(obj.lineSlack).toBe(0.5);
  });

  test('should position path at translateX/Y', async ({ editorPage }) => {
    const result = await editorPage.addPath({
      points: [
        [0, 0],
        [100, 100],
      ],
      translateX: 200,
      translateY: 300,
      strokeWidth: 3,
    });

    // Path translate values may be slightly offset due to stroke outline bounding box calculation
    const obj = await editorPage.getObjectById<any>(result.id);
    expect(obj.translateX).toBeGreaterThanOrEqual(197);
    expect(obj.translateX).toBeLessThanOrEqual(203);
    expect(obj.translateY).toBeGreaterThanOrEqual(297);
    expect(obj.translateY).toBeLessThanOrEqual(303);
  });

  test('should render path SVG element', async ({ editorPage }) => {
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.addPath({
      points: [
        [0, 0],
        [50, 50],
        [100, 0],
      ],
      translateX: 100,
      translateY: 100,
      strokeWidth: 3,
    });

    await editorPage.waitForObjectsAdded();

    expect(await editorPage.getObjectElementCount()).toBe(1);
    expect(await editorPage.getSvgElementCount()).toBe(1);
  });

  test('visual: path with multiple points', async ({ editorPage }) => {
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.addPath({
      points: [
        [0, 0],
        [40, 60],
        [80, 20],
        [120, 80],
        [160, 10],
        [200, 50],
        [240, 0],
      ],
      translateX: 100,
      translateY: 100,
      strokeWidth: 3,
      fill: { light: '#333333', dark: '#cccccc' },
    });

    await editorPage.waitForObjectsAdded();

    await expect(editorPage.engine).toHaveScreenshot();
  });

  test('visual: path with thick stroke', async ({ editorPage }) => {
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.addPath({
      points: [
        [0, 0],
        [60, 80],
        [120, 20],
        [180, 60],
        [240, 0],
      ],
      translateX: 100,
      translateY: 120,
      strokeWidth: 12,
      fill: { light: '#0066cc', dark: '#3399ff' },
    });

    await editorPage.waitForObjectsAdded();

    await expect(editorPage.engine).toHaveScreenshot();
  });

  test('visual: rotated path stores rotation property', async ({ editorPage }) => {
    const rotationDegrees = -30;
    const expectedRadians = rotationDegrees * (Math.PI / 180);

    await editorPage.prepareWaitForObjectsAdded();

    const path = await editorPage.addPath({
      points: [
        [0, 0],
        [45, 70],
        [90, 20],
        [135, 65],
        [180, 0],
      ],
      translateX: 180,
      translateY: 180,
      strokeWidth: 6,
      fill: { light: '#343a40', dark: '#343a40' },
      rotation: rotationDegrees,
    });

    await editorPage.waitForObjectsAdded();

    const pathObject = await editorPage.getObjectById<any>(path.id);
    expect(pathObject?.rotation).toBeCloseTo(expectedRadians, 4);

    await expect(editorPage.engine).toHaveScreenshot();
  });
});
