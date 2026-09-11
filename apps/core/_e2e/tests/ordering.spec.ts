import { test, expect } from '../fixtures/editor.fixture';

test.describe('Ordering', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
  });

  test('should bring an object forward one level', async ({ editorPage }) => {
    const shape1 = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 100,
      translateY: 100,
      width: 150,
      height: 150,
    });
    const shape2 = await editorPage.addShape({
      shapeType: 'ellipse',
      translateX: 150,
      translateY: 150,
      width: 150,
      height: 150,
    });
    const shape3 = await editorPage.addShape({
      shapeType: 'triangle',
      translateX: 200,
      translateY: 200,
      width: 150,
      height: 150,
    });

    // zIndex starts at: shape1=1, shape2=2, shape3=3
    // bringForward increments zIndex by 1, so shape1 becomes 2 (same as shape2)
    await editorPage.selectObjects([shape1]);
    await editorPage.bringForward();

    const updated1 = await editorPage.getObjectById<any>(shape1.id);
    const updated2 = await editorPage.getObjectById<any>(shape2.id);
    const updated3 = await editorPage.getObjectById<any>(shape3.id);

    expect(updated1.zIndex).toBe(2);
    expect(updated1.zIndex).toBeGreaterThanOrEqual(updated2.zIndex);
    expect(updated1.zIndex).toBeLessThan(updated3.zIndex);
  });

  test('should send an object backward one level', async ({ editorPage }) => {
    const shape1 = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 100,
      translateY: 100,
      width: 150,
      height: 150,
    });
    const shape2 = await editorPage.addShape({
      shapeType: 'ellipse',
      translateX: 150,
      translateY: 150,
      width: 150,
      height: 150,
    });
    const shape3 = await editorPage.addShape({
      shapeType: 'triangle',
      translateX: 200,
      translateY: 200,
      width: 150,
      height: 150,
    });

    // zIndex starts at: shape1=1, shape2=2, shape3=3
    // sendBackward decrements zIndex by 1, so shape3 becomes 2 (same as shape2)
    await editorPage.selectObjects([shape3]);
    await editorPage.sendBackward();

    const updated1 = await editorPage.getObjectById<any>(shape1.id);
    const updated2 = await editorPage.getObjectById<any>(shape2.id);
    const updated3 = await editorPage.getObjectById<any>(shape3.id);

    expect(updated3.zIndex).toBe(2);
    expect(updated3.zIndex).toBeGreaterThan(updated1.zIndex);
    expect(updated3.zIndex).toBeLessThanOrEqual(updated2.zIndex);
  });

  test('should bring an object to the front', async ({ editorPage }) => {
    const shape1 = await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 100,
      translateY: 100,
      width: 150,
      height: 150,
    });
    
    await editorPage.addShape({
      shapeType: 'ellipse',
      translateX: 150,
      translateY: 150,
      width: 150,
      height: 150,
    });

    await editorPage.addShape({
      shapeType: 'triangle',
      translateX: 200,
      translateY: 200,
      width: 150,
      height: 150,
    });

    // Bring shape1 (lowest zIndex) all the way to the front
    await editorPage.selectObjects([shape1]);
    await editorPage.bringToFront();
    await editorPage.clearSelection();

    const allObjects = await editorPage.getAllObjects<any>();
    const updated1 = allObjects.find((o: any) => o.id === shape1.id);
    const others = allObjects.filter((o: any) => o.id !== shape1.id);

    // shape1 should have a higher zIndex than all other objects
    for (const obj of others) {
      expect(updated1.zIndex).toBeGreaterThan((obj as any).zIndex);
    }
  });

  test('should send an object to the back', async ({ editorPage }) => {
    await editorPage.addShape({
      shapeType: 'rectangle',
      translateX: 100,
      translateY: 100,
      width: 150,
      height: 150,
    });

    await editorPage.addShape({
      shapeType: 'ellipse',
      translateX: 150,
      translateY: 150,
      width: 150,
      height: 150,
    });
    
    const shape3 = await editorPage.addShape({
      shapeType: 'triangle',
      translateX: 200,
      translateY: 200,
      width: 150,
      height: 150,
    });

    // Send shape3 (highest zIndex) all the way to the back
    await editorPage.selectObjects([shape3]);
    await editorPage.sendToBack();
    await editorPage.clearSelection();

    const allObjects = await editorPage.getAllObjects<any>();
    const updated3 = allObjects.find((o: any) => o.id === shape3.id);
    const others = allObjects.filter((o: any) => o.id !== shape3.id);

    // shape3 should have a lower zIndex than all other objects
    for (const obj of others) {
      expect(updated3.zIndex).toBeLessThan((obj as any).zIndex);
    }
  });

  test.describe('visual regression', () => {
    test('three overlapping shapes with specific z-order', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();

      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 200,
        fillColor: { light: '#4a90d9', dark: '#4a90d9' },
      });

      await editorPage.waitForObjectsAdded();
      await editorPage.prepareWaitForObjectsAdded();

      const middle = await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 200,
        translateY: 150,
        width: 200,
        height: 200,
        fillColor: { light: '#d94a4a', dark: '#d94a4a' },
      });

      await editorPage.waitForObjectsAdded();
      await editorPage.prepareWaitForObjectsAdded();

      await editorPage.addShape({
        shapeType: 'triangle',
        translateX: 300,
        translateY: 100,
        width: 200,
        height: 200,
        fillColor: { light: '#4ad94a', dark: '#4ad94a' },
      });

      await editorPage.waitForObjectsAdded();

      // Send the middle ellipse to the back so the visual order is:
      // back: ellipse (red), middle: rectangle (blue), front: triangle (green)
      await editorPage.selectObjects([middle]);
      await editorPage.sendToBack();
      await editorPage.clearSelection();

      // Wait for re-render
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
