import { test, expect, type EditorPage } from '../fixtures/editor.fixture';

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

  test.describe('groups', () => {
    // Adds three overlapping shapes, stacked bottom to top (zIndex 1, 2, 3).
    const addThreeShapes = async (editorPage: EditorPage) => {
      const shapes = [];
      for (const [index, shapeType] of (['rectangle', 'ellipse', 'triangle'] as const).entries()) {
        shapes.push(
          await editorPage.addShape({
            shapeType,
            translateX: 100 + index * 50,
            translateY: 100 + index * 50,
            width: 150,
            height: 150,
          }),
        );
      }
      return shapes;
    };

    const getZIndices = async (editorPage: EditorPage) => {
      const allObjects = await editorPage.getAllObjects<any>();
      const zIndexOf = (id: string) => allObjects.find((o: any) => o.id === id).zIndex;
      const group = allObjects.find((o: any) => o.__class__ === 'KritzelGroup');
      return { zIndexOf, group };
    };

    test('should move a group forward past the next object as one layer', async ({ editorPage }) => {
      const [shape1, shape2, shape3] = await addThreeShapes(editorPage);

      await editorPage.selectObjects([shape1, shape2]);
      await editorPage.group();
      await editorPage.bringForward();
      await editorPage.clearSelection();

      const { zIndexOf, group } = await getZIndices(editorPage);
      expect(zIndexOf(shape3.id)).toBeLessThan(zIndexOf(shape1.id));
      expect(zIndexOf(shape1.id)).toBeLessThan(zIndexOf(shape2.id));
      expect(group.zIndex).toBe(zIndexOf(shape2.id));
    });

    test('should move an object past a whole group in a single step', async ({ editorPage }) => {
      const [shape1, shape2, shape3] = await addThreeShapes(editorPage);

      await editorPage.selectObjects([shape2, shape3]);
      await editorPage.group();
      await editorPage.selectObjects([shape1]);
      await editorPage.bringForward();
      await editorPage.clearSelection();

      const { zIndexOf } = await getZIndices(editorPage);
      expect(zIndexOf(shape2.id)).toBeLessThan(zIndexOf(shape3.id));
      expect(zIndexOf(shape3.id)).toBeLessThan(zIndexOf(shape1.id));
    });

    test('should send a group to the back and bring it to the front with all of its children', async ({ editorPage }) => {
      const [shape1, shape2, shape3] = await addThreeShapes(editorPage);

      await editorPage.selectObjects([shape2, shape3]);
      await editorPage.group();
      await editorPage.sendToBack();

      let { zIndexOf } = await getZIndices(editorPage);
      expect(zIndexOf(shape2.id)).toBeLessThan(zIndexOf(shape3.id));
      expect(zIndexOf(shape3.id)).toBeLessThan(zIndexOf(shape1.id));

      await editorPage.bringToFront();
      await editorPage.clearSelection();

      ({ zIndexOf } = await getZIndices(editorPage));
      expect(zIndexOf(shape1.id)).toBeLessThan(zIndexOf(shape2.id));
      expect(zIndexOf(shape2.id)).toBeLessThan(zIndexOf(shape3.id));
    });

    test('should keep the stacking order with unique zIndex values after ungrouping', async ({ editorPage }) => {
      const [shape1, shape2, shape3] = await addThreeShapes(editorPage);

      // Grouping the outer shapes stacks them together at the top; the middle shape ends up below the group.
      await editorPage.selectObjects([shape1, shape3]);
      await editorPage.group();
      await editorPage.ungroup();
      await editorPage.clearSelection();

      const { zIndexOf, group } = await getZIndices(editorPage);
      expect(group).toBeUndefined();
      expect(zIndexOf(shape2.id)).toBeLessThan(zIndexOf(shape1.id));
      expect(zIndexOf(shape1.id)).toBeLessThan(zIndexOf(shape3.id));
    });
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
