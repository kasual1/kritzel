import { test, expect } from '../../fixtures/editor.fixture';

test.describe('Shape objects', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
  });

  test.describe('Rectangle', () => {
    test('should add a rectangle with specified dimensions', async ({ editorPage }) => {
      const result = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();

      const obj = await editorPage.getObjectById<any>(result.id);
      expect(obj.shapeType).toBe('rectangle');
      expect(obj.width).toBe(200);
      expect(obj.height).toBe(150);
      expect(obj.translateX).toBe(100);
      expect(obj.translateY).toBe(100);
    });

    test('should render rectangle SVG with correct fill color', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();

      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
        fillColor: { light: '#ff0000', dark: '#ff0000' },
      });

      await editorPage.waitForObjectsAdded();

      expect(await editorPage.getSvgElementCount()).toBe(1);

      // Verify the SVG fill attribute matches the configured color
      const fill = await editorPage.page.evaluate(() => {
        const engine = document.querySelector('kritzel-engine');
        if (!engine?.shadowRoot) return null;
        const svg = engine.shadowRoot.querySelector('.object svg');
        if (!svg) return null;
        const fillEl = svg.querySelector('[fill]');
        return fillEl?.getAttribute('fill');
      });

      expect(fill).toBe('#ff0000');
    });

    test('should support stroke color and stroke width', async ({ editorPage }) => {
      const result = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
        strokeColor: { light: '#0000ff', dark: '#0000ff' },
        strokeWidth: 4,
      });

      const obj = await editorPage.getObjectById<any>(result.id);
      expect(obj.strokeColor.light).toBe('#0000ff');
      expect(obj.strokeWidth).toBe(4);
    });

    test('visual: rectangle at various sizes', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();

      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 50,
        translateY: 50,
        width: 80,
        height: 60,
        fillColor: { light: '#ff6666', dark: '#ff6666' },
      });

      await editorPage.waitForObjectsAdded();
      await editorPage.prepareWaitForObjectsAdded();

      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 200,
        translateY: 50,
        width: 200,
        height: 150,
        fillColor: { light: '#6666ff', dark: '#6666ff' },
      });

      await editorPage.waitForObjectsAdded();

      await expect(editorPage.engine).toHaveScreenshot();
    });
  });

  test.describe('Ellipse', () => {
    test('should add an ellipse with specified dimensions', async ({ editorPage }) => {
      const result = await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 100,
        translateY: 100,
        width: 180,
        height: 120,
      });

      const obj = await editorPage.getObjectById<any>(result.id);
      expect(obj.shapeType).toBe('ellipse');
      expect(obj.width).toBe(180);
      expect(obj.height).toBe(120);
    });

    test('should render ellipse SVG element', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();

      await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 100,
        translateY: 100,
        width: 160,
        height: 120,
        fillColor: { light: '#00cc00', dark: '#00cc00' },
      });

      await editorPage.waitForObjectsAdded();

      expect(await editorPage.getObjectElementCount()).toBe(1);
      expect(await editorPage.getSvgElementCount()).toBe(1);
    });

    test('visual: ellipse rendering', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();

      await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 150,
        translateY: 100,
        width: 200,
        height: 130,
        fillColor: { light: '#cc66ff', dark: '#cc66ff' },
      });

      await editorPage.waitForObjectsAdded();

      await expect(editorPage.engine).toHaveScreenshot();
    });
  });

  test.describe('Triangle', () => {
    test('should add a triangle with specified dimensions', async ({ editorPage }) => {
      const result = await editorPage.addShape({
        shapeType: 'triangle',
        translateX: 100,
        translateY: 100,
        width: 160,
        height: 140,
      });

      const obj = await editorPage.getObjectById<any>(result.id);
      expect(obj.shapeType).toBe('triangle');
      expect(obj.width).toBe(160);
      expect(obj.height).toBe(140);
    });

    test('should render triangle SVG element', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();

      await editorPage.addShape({
        shapeType: 'triangle',
        translateX: 100,
        translateY: 100,
        width: 160,
        height: 140,
        fillColor: { light: '#ffaa00', dark: '#ffaa00' },
      });

      await editorPage.waitForObjectsAdded();

      expect(await editorPage.getObjectElementCount()).toBe(1);
      expect(await editorPage.getSvgElementCount()).toBe(1);
    });

    test('visual: triangle rendering', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();

      await editorPage.addShape({
        shapeType: 'triangle',
        translateX: 150,
        translateY: 100,
        width: 180,
        height: 160,
        fillColor: { light: '#ff9933', dark: '#ff9933' },
      });

      await editorPage.waitForObjectsAdded();

      await expect(editorPage.engine).toHaveScreenshot();
    });
  });

  test.describe('Shape with text', () => {
    test('should add a shape with font properties', async ({ editorPage }) => {
      const result = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 250,
        height: 150,
        fillColor: { light: '#eeeeee', dark: '#333333' },
        fontSize: 24,
        fontFamily: 'Arial',
        fontColor: { light: '#000000', dark: '#ffffff' },
      });

      const obj = await editorPage.getObjectById<any>(result.id);
      expect(obj.fontSize).toBe(24);
      expect(obj.fontFamily).toBe('Arial');
      expect(obj.fontColor.light).toBe('#000000');
    });

    test('should update font size on an existing shape', async ({ editorPage }) => {
      const result = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
        fontSize: 16,
      });

      await editorPage.updateObject(result, { fontSize: 32 });

      const updated = await editorPage.getObjectById<any>(result.id);
      expect(updated.fontSize).toBe(32);
    });
  });

  test('visual: all three shape types side by side', async ({ editorPage }) => {
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 50,
      translateY: 100,
      width: 150,
      height: 120,
      fillColor: { light: '#ff6666', dark: '#ff6666' },
    });

    await editorPage.waitForObjectsAdded();
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.addShape({
      shapeType: 'ellipse',
      translateX: 250,
      translateY: 100,
      width: 150,
      height: 120,
      fillColor: { light: '#66ff66', dark: '#66ff66' },
    });

    await editorPage.waitForObjectsAdded();
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.addShape({
      shapeType: 'triangle',
      translateX: 450,
      translateY: 100,
      width: 150,
      height: 120,
      fillColor: { light: '#6666ff', dark: '#6666ff' },
    });

    await editorPage.waitForObjectsAdded();

    await expect(editorPage.engine).toHaveScreenshot();
  });

  test('visual: rotated rectangle, ellipse, and triangle', async ({ editorPage }) => {
    const toRadians = (degrees: number) => degrees * (Math.PI / 180);

    const rectangleRotationDegrees = 22.5;
    const ellipseRotationDegrees = -26;
    const triangleRotationDegrees = 36;

    await editorPage.prepareWaitForObjectsAdded();
    const rectangle = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 80,
      translateY: 80,
      width: 130,
      height: 95,
      rotation: rectangleRotationDegrees,
      fillColor: { light: '#ff6b6b', dark: '#ff6b6b' },
    });

    await editorPage.waitForObjectsAdded();
    await editorPage.prepareWaitForObjectsAdded();

    const ellipse = await editorPage.addShape({
      shapeType: 'ellipse',
      translateX: 280,
      translateY: 90,
      width: 130,
      height: 95,
      rotation: ellipseRotationDegrees,
      fillColor: { light: '#51cf66', dark: '#51cf66' },
    });

    await editorPage.waitForObjectsAdded();
    await editorPage.prepareWaitForObjectsAdded();

    const triangle = await editorPage.addShape({
      shapeType: 'triangle',
      translateX: 500,
      translateY: 95,
      width: 130,
      height: 100,
      rotation: triangleRotationDegrees,
      fillColor: { light: '#4dabf7', dark: '#4dabf7' },
    });

    await editorPage.waitForObjectsAdded();

    const rectangleObject = await editorPage.getObjectById<any>(rectangle.id);
    const ellipseObject = await editorPage.getObjectById<any>(ellipse.id);
    const triangleObject = await editorPage.getObjectById<any>(triangle.id);

    expect(rectangleObject?.rotation).toBeCloseTo(toRadians(rectangleRotationDegrees), 4);
    expect(ellipseObject?.rotation).toBeCloseTo(toRadians(ellipseRotationDegrees), 4);
    expect(triangleObject?.rotation).toBeCloseTo(toRadians(triangleRotationDegrees), 4);

    await expect(editorPage.engine).toHaveScreenshot();
  });

  test('visual: filled shapes with opacity overlapping near origin', async ({ editorPage }) => {
    await editorPage.prepareWaitForObjectsAdded();

    const rect = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 0,
      translateY: 0,
      width: 160,
      height: 120,
      fillColor: { light: '#ff3030', dark: '#ff3030' },
      strokeColor: { light: '#ff3030', dark: '#ff3030' },
      strokeWidth: 4,
    });

    await editorPage.waitForObjectsAdded();
    await editorPage.updateObject(rect, { opacity: 0.5 });
    await editorPage.prepareWaitForObjectsAdded();

    const ellipse = await editorPage.addShape({
      shapeType: 'ellipse',
      translateX: 60,
      translateY: 30,
      width: 160,
      height: 120,
      fillColor: { light: '#30c030', dark: '#30c030' },
      strokeColor: { light: '#30c030', dark: '#30c030' },
      strokeWidth: 4,
    });

    await editorPage.waitForObjectsAdded();
    await editorPage.updateObject(ellipse, { opacity: 0.5 });
    await editorPage.prepareWaitForObjectsAdded();

    const triangle = await editorPage.addShape({
      shapeType: 'triangle',
      translateX: 120,
      translateY: 60,
      width: 160,
      height: 120,
      fillColor: { light: '#3060ff', dark: '#3060ff' },
      strokeColor: { light: '#3060ff', dark: '#3060ff' },
      strokeWidth: 4,
    });

    await editorPage.waitForObjectsAdded();
    await editorPage.updateObject(triangle, { opacity: 0.5 });

    await expect(editorPage.engine).toHaveScreenshot();
  });
});
