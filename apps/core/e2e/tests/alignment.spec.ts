import { test, expect } from '../../fixtures/editor.fixture';

test.describe('Alignment', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
  });

  test('should align objects to StartHorizontal (left edges)', async ({ editorPage }) => {
    const shape1 = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 50,
      translateY: 50,
      width: 100,
      height: 100,
    });
    const shape2 = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 200,
      translateY: 200,
      width: 150,
      height: 100,
    });
    const shape3 = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 350,
      translateY: 100,
      width: 80,
      height: 100,
    });

    await editorPage.selectObjects([shape1, shape2, shape3]);
    await editorPage.alignObjects('start-horizontal');

    const updated1 = await editorPage.getObjectById<any>(shape1.id);
    const updated2 = await editorPage.getObjectById<any>(shape2.id);
    const updated3 = await editorPage.getObjectById<any>(shape3.id);

    // All left edges (translateX) should align to the leftmost object's translateX
    const minX = Math.min(shape1.translateX, shape2.translateX, shape3.translateX);
    expect(updated1.translateX).toBeCloseTo(minX, 0);
    expect(updated2.translateX).toBeCloseTo(minX, 0);
    expect(updated3.translateX).toBeCloseTo(minX, 0);
  });

  test('should align objects to CenterHorizontal', async ({ editorPage }) => {
    const shape1 = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 50,
      translateY: 50,
      width: 100,
      height: 100,
    });
    const shape2 = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 200,
      translateY: 200,
      width: 150,
      height: 100,
    });
    const shape3 = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 350,
      translateY: 100,
      width: 80,
      height: 100,
    });

    await editorPage.selectObjects([shape1, shape2, shape3]);
    await editorPage.alignObjects('center-horizontal');

    const updated1 = await editorPage.getObjectById<any>(shape1.id);
    const updated2 = await editorPage.getObjectById<any>(shape2.id);
    const updated3 = await editorPage.getObjectById<any>(shape3.id);

    // All horizontal centers should be the same
    const center1 = updated1.translateX + updated1.width / 2;
    const center2 = updated2.translateX + updated2.width / 2;
    const center3 = updated3.translateX + updated3.width / 2;
    expect(center1).toBeCloseTo(center2, 0);
    expect(center2).toBeCloseTo(center3, 0);
  });

  test('should align objects to EndHorizontal (right edges)', async ({ editorPage }) => {
    const shape1 = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 50,
      translateY: 50,
      width: 100,
      height: 100,
    });
    const shape2 = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 200,
      translateY: 200,
      width: 150,
      height: 100,
    });
    const shape3 = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 350,
      translateY: 100,
      width: 80,
      height: 100,
    });

    await editorPage.selectObjects([shape1, shape2, shape3]);
    await editorPage.alignObjects('end-horizontal');

    const updated1 = await editorPage.getObjectById<any>(shape1.id);
    const updated2 = await editorPage.getObjectById<any>(shape2.id);
    const updated3 = await editorPage.getObjectById<any>(shape3.id);

    // All right edges (translateX + width) should align to the rightmost edge
    const right1 = updated1.translateX + updated1.width;
    const right2 = updated2.translateX + updated2.width;
    const right3 = updated3.translateX + updated3.width;
    expect(right1).toBeCloseTo(right2, 0);
    expect(right2).toBeCloseTo(right3, 0);
  });

  test('should align objects to StartVertical (top edges)', async ({ editorPage }) => {
    const shape1 = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 50,
      translateY: 50,
      width: 100,
      height: 100,
    });
    const shape2 = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 200,
      translateY: 200,
      width: 100,
      height: 150,
    });
    const shape3 = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 350,
      translateY: 300,
      width: 100,
      height: 80,
    });

    await editorPage.selectObjects([shape1, shape2, shape3]);
    await editorPage.alignObjects('start-vertical');

    const updated1 = await editorPage.getObjectById<any>(shape1.id);
    const updated2 = await editorPage.getObjectById<any>(shape2.id);
    const updated3 = await editorPage.getObjectById<any>(shape3.id);

    // All top edges (translateY) should align to the topmost object's translateY
    const minY = Math.min(shape1.translateY, shape2.translateY, shape3.translateY);
    expect(updated1.translateY).toBeCloseTo(minY, 0);
    expect(updated2.translateY).toBeCloseTo(minY, 0);
    expect(updated3.translateY).toBeCloseTo(minY, 0);
  });

  test('should align objects to CenterVertical', async ({ editorPage }) => {
    const shape1 = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 50,
      translateY: 50,
      width: 100,
      height: 100,
    });
    const shape2 = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 200,
      translateY: 200,
      width: 100,
      height: 150,
    });
    const shape3 = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 350,
      translateY: 300,
      width: 100,
      height: 80,
    });

    await editorPage.selectObjects([shape1, shape2, shape3]);
    await editorPage.alignObjects('center-vertical');

    const updated1 = await editorPage.getObjectById<any>(shape1.id);
    const updated2 = await editorPage.getObjectById<any>(shape2.id);
    const updated3 = await editorPage.getObjectById<any>(shape3.id);

    // All vertical centers should be the same
    const center1 = updated1.translateY + updated1.height / 2;
    const center2 = updated2.translateY + updated2.height / 2;
    const center3 = updated3.translateY + updated3.height / 2;
    expect(center1).toBeCloseTo(center2, 0);
    expect(center2).toBeCloseTo(center3, 0);
  });

  test('should align objects to EndVertical (bottom edges)', async ({ editorPage }) => {
    const shape1 = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 50,
      translateY: 50,
      width: 100,
      height: 100,
    });
    const shape2 = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 200,
      translateY: 200,
      width: 100,
      height: 150,
    });
    const shape3 = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 350,
      translateY: 300,
      width: 100,
      height: 80,
    });

    await editorPage.selectObjects([shape1, shape2, shape3]);
    await editorPage.alignObjects('end-vertical');

    const updated1 = await editorPage.getObjectById<any>(shape1.id);
    const updated2 = await editorPage.getObjectById<any>(shape2.id);
    const updated3 = await editorPage.getObjectById<any>(shape3.id);

    // All bottom edges (translateY + height) should align to the bottommost edge
    const bottom1 = updated1.translateY + updated1.height;
    const bottom2 = updated2.translateY + updated2.height;
    const bottom3 = updated3.translateY + updated3.height;
    expect(bottom1).toBeCloseTo(bottom2, 0);
    expect(bottom2).toBeCloseTo(bottom3, 0);
  });

  test.describe('visual regression', () => {
    test('visual: objects aligned horizontally center', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();

      const shape1 = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 50,
        width: 100,
        height: 100,
        fillColor: { light: '#4a90d9', dark: '#4a90d9' },
      });

      await editorPage.waitForObjectsAdded();
      await editorPage.prepareWaitForObjectsAdded();

      const shape2 = await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 250,
        translateY: 200,
        width: 150,
        height: 120,
        fillColor: { light: '#d94a4a', dark: '#d94a4a' },
      });

      await editorPage.waitForObjectsAdded();
      await editorPage.prepareWaitForObjectsAdded();

      const shape3 = await editorPage.addShape({
        shapeType: 'triangle',
        translateX: 450,
        translateY: 100,
        width: 80,
        height: 80,
        fillColor: { light: '#4ad94a', dark: '#4ad94a' },
      });

      await editorPage.waitForObjectsAdded();

      await editorPage.selectObjects([shape1, shape2, shape3]);
      await editorPage.alignObjects('center-horizontal');
      await editorPage.clearSelection();

      await editorPage.page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          )
      );

      await expect(editorPage.engine).toHaveScreenshot();
    });

    test('visual: objects aligned vertically center', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();

      const shape1 = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 50,
        translateY: 100,
        width: 100,
        height: 100,
        fillColor: { light: '#4a90d9', dark: '#4a90d9' },
      });

      await editorPage.waitForObjectsAdded();
      await editorPage.prepareWaitForObjectsAdded();

      const shape2 = await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 200,
        translateY: 250,
        width: 150,
        height: 120,
        fillColor: { light: '#d94a4a', dark: '#d94a4a' },
      });

      await editorPage.waitForObjectsAdded();
      await editorPage.prepareWaitForObjectsAdded();

      const shape3 = await editorPage.addShape({
        shapeType: 'triangle',
        translateX: 400,
        translateY: 50,
        width: 80,
        height: 80,
        fillColor: { light: '#4ad94a', dark: '#4ad94a' },
      });

      await editorPage.waitForObjectsAdded();

      await editorPage.selectObjects([shape1, shape2, shape3]);
      await editorPage.alignObjects('center-vertical');
      await editorPage.clearSelection();

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
