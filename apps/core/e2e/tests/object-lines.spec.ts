import { test, expect } from '../../fixtures/editor.fixture';

test.describe('Line objects', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
  });

  test('should add a straight line between two points', async ({ editorPage }) => {
    const result = await editorPage.addLine({
      startX: 50,
      startY: 50,
      endX: 300,
      endY: 200,
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();

    const obj = await editorPage.getObjectById<any>(result.id);
    expect(obj.startX).toBe(50);
    expect(obj.startY).toBe(50);
    expect(obj.endX).toBe(300);
    expect(obj.endY).toBe(200);
  });

  test('should add a curved line with control point', async ({ editorPage }) => {
    const result = await editorPage.addLine({
      startX: 50,
      startY: 150,
      endX: 350,
      endY: 150,
      controlX: 200,
      controlY: 20,
    });

    const obj = await editorPage.getObjectById<any>(result.id);
    expect(obj.controlX).toBe(200);
    expect(obj.controlY).toBe(20);
  });

  test('should add a line with start arrow', async ({ editorPage }) => {
    const result = await editorPage.addLine({
      startX: 50,
      startY: 100,
      endX: 300,
      endY: 100,
      arrows: {
        start: { enabled: true },
      },
    });

    const obj = await editorPage.getObjectById<any>(result.id);
    expect(obj.arrows.start.enabled).toBe(true);
  });

  test('should add a line with end arrow', async ({ editorPage }) => {
    const result = await editorPage.addLine({
      startX: 50,
      startY: 100,
      endX: 300,
      endY: 100,
      arrows: {
        end: { enabled: true },
      },
    });

    const obj = await editorPage.getObjectById<any>(result.id);
    expect(obj.arrows.end.enabled).toBe(true);
  });

  test('should add a line with both arrows', async ({ editorPage }) => {
    const result = await editorPage.addLine({
      startX: 50,
      startY: 100,
      endX: 300,
      endY: 100,
      arrows: {
        start: { enabled: true },
        end: { enabled: true },
      },
    });

    const obj = await editorPage.getObjectById<any>(result.id);
    expect(obj.arrows.start.enabled).toBe(true);
    expect(obj.arrows.end.enabled).toBe(true);
  });

  test('should add a line with custom stroke color and width', async ({ editorPage }) => {
    const result = await editorPage.addLine({
      startX: 50,
      startY: 100,
      endX: 350,
      endY: 100,
      stroke: { light: '#ff0000', dark: '#ff0000' },
      strokeWidth: 5,
    });

    const obj = await editorPage.getObjectById<any>(result.id);
    expect(obj.stroke.light).toBe('#ff0000');
    expect(obj.strokeWidth).toBe(5);
  });

  test('should add a line with start anchor to a shape', async ({ editorPage }) => {
    const shape = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 50,
      translateY: 50,
      width: 100,
      height: 80,
    });

    const line = await editorPage.addLine({
      startX: 100,
      startY: 90,
      endX: 350,
      endY: 200,
      startAnchor: { objectId: shape.id },
    });

    const obj = await editorPage.getObjectById<any>(line.id);
    expect(obj.startAnchor).toBeDefined();
    expect(obj.startAnchor.objectId).toBe(shape.id);
  });

  test('should add a line with end anchor to a shape', async ({ editorPage }) => {
    const shape = await editorPage.addShape({
      shapeType: 'ellipse',
      translateX: 300,
      translateY: 100,
      width: 120,
      height: 100,
    });

    const line = await editorPage.addLine({
      startX: 50,
      startY: 50,
      endX: 360,
      endY: 150,
      endAnchor: { objectId: shape.id },
    });

    const obj = await editorPage.getObjectById<any>(line.id);
    expect(obj.endAnchor).toBeDefined();
    expect(obj.endAnchor.objectId).toBe(shape.id);
  });

  test('should add a line anchored between two shapes', async ({ editorPage }) => {
    const shapeA = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 50,
      translateY: 100,
      width: 100,
      height: 80,
    });

    const shapeB = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 350,
      translateY: 100,
      width: 100,
      height: 80,
    });

    const line = await editorPage.addLine({
      startX: 100,
      startY: 140,
      endX: 400,
      endY: 140,
      startAnchor: { objectId: shapeA.id },
      endAnchor: { objectId: shapeB.id },
    });

    const obj = await editorPage.getObjectById<any>(line.id);
    expect(obj.startAnchor.objectId).toBe(shapeA.id);
    expect(obj.endAnchor.objectId).toBe(shapeB.id);
  });

  test('visual: straight line', async ({ editorPage }) => {
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.addLine({
      startX: 50,
      startY: 50,
      endX: 400,
      endY: 250,
      strokeWidth: 3,
      stroke: { light: '#333333', dark: '#cccccc' },
    });

    await editorPage.waitForObjectsAdded();

    await expect(editorPage.engine).toHaveScreenshot();
  });

  test('visual: curved line with arrows', async ({ editorPage }) => {
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.addLine({
      startX: 50,
      startY: 200,
      endX: 400,
      endY: 200,
      controlX: 225,
      controlY: 30,
      strokeWidth: 3,
      stroke: { light: '#0066cc', dark: '#3399ff' },
      arrows: {
        start: { enabled: true },
        end: { enabled: true },
      },
    });

    await editorPage.waitForObjectsAdded();

    await expect(editorPage.engine).toHaveScreenshot();
  });

  test('visual: anchored line between shapes', async ({ editorPage }) => {
    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 50,
      translateY: 100,
      width: 120,
      height: 80,
      fillColor: { light: '#ddeeff', dark: '#334455' },
    });

    await editorPage.waitForObjectsAdded();
    await editorPage.prepareWaitForObjectsAdded();

    const shapeB = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 350,
      translateY: 100,
      width: 120,
      height: 80,
      fillColor: { light: '#ddeeff', dark: '#334455' },
    });

    await editorPage.waitForObjectsAdded();

    // Get shapeA by finding it (first rectangle added)
    const allObjects = await editorPage.getAllObjects<any>();
    const shapeA = allObjects.find((o: any) => o.id !== shapeB.id);

    await editorPage.prepareWaitForObjectsAdded();

    await editorPage.addLine({
      startX: 110,
      startY: 140,
      endX: 410,
      endY: 140,
      strokeWidth: 2,
      stroke: { light: '#333333', dark: '#cccccc' },
      startAnchor: { objectId: shapeA.id },
      endAnchor: { objectId: shapeB.id },
      arrows: {
        end: { enabled: true },
      },
    });

    await editorPage.waitForObjectsAdded();

    await expect(editorPage.engine).toHaveScreenshot();
  });

  test('visual: rotated line stores rotation property', async ({ editorPage }) => {
    const rotationDegrees = -45;
    const expectedRadians = rotationDegrees * (Math.PI / 180);

    await editorPage.prepareWaitForObjectsAdded();

    const line = await editorPage.addLine({
      startX: 120,
      startY: 120,
      endX: 420,
      endY: 220,
      strokeWidth: 4,
      stroke: { light: '#f08c00', dark: '#f08c00' },
      arrows: {
        end: { enabled: true },
      },
      rotation: rotationDegrees,
    });

    await editorPage.waitForObjectsAdded();

    const lineObject = await editorPage.getObjectById<any>(line.id);
    expect(lineObject?.rotation).toBeCloseTo(expectedRadians, 4);

    await expect(editorPage.engine).toHaveScreenshot();
  });
});
