import { test, expect } from '../fixtures/editor.fixture';

test.describe('Object CRUD', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
  });

  test.describe('addObject', () => {
    test('should add a shape and return the object with an id', async ({ editorPage }) => {
      const result = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
        fillColor: { light: '#00ff00', dark: '#00ff00' },
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
    });

    test('should add multiple objects and maintain correct count', async ({ editorPage }) => {
      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 0,
        translateY: 0,
        width: 100,
        height: 100,
      });
      await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 200,
        translateY: 0,
        width: 100,
        height: 100,
      });
      await editorPage.addText({
        text: 'Hello',
        translateX: 400,
        translateY: 0,
      });

      const count = await editorPage.getObjectsTotalCount();
      expect(count).toBe(3);
    });

    test('should render DOM elements for each added object', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();

      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 0,
        translateY: 0,
        width: 100,
        height: 100,
      });

      await editorPage.waitForObjectsAdded();
      expect(await editorPage.getObjectElementCount()).toBe(1);

      await editorPage.prepareWaitForObjectsAdded();

      await editorPage.addPath({
        points: [
          [0, 0],
          [50, 50],
          [100, 0],
        ],
        translateX: 200,
        translateY: 0,
        strokeWidth: 3,
      });

      await editorPage.waitForObjectsAdded();
      expect(await editorPage.getObjectElementCount()).toBe(2);
    });
  });

  test.describe('getObjectById', () => {
    test('should return the object when it exists', async ({ editorPage }) => {
      const added = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 50,
        translateY: 50,
        width: 100,
        height: 80,
        fillColor: { light: '#0000ff', dark: '#0000ff' },
      });

      const found = await editorPage.getObjectById<any>(added.id);
      expect(found).not.toBeNull();
      expect(found.id).toBe(added.id);
    });

    test('should return null for a nonexistent id', async ({ editorPage }) => {
      const found = await editorPage.getObjectById('nonexistent-id-12345');
      expect(found).toBeNull();
    });
  });

  test.describe('updateObject', () => {
    test('should update an object position via updateObject', async ({ editorPage }) => {
      const added = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 10,
        translateY: 20,
        width: 100,
        height: 100,
      });

      await editorPage.updateObject(added, { translateX: 300, translateY: 400 });

      const updated = await editorPage.getObjectById<any>(added.id);
      expect(updated.translateX).toBe(300);
      expect(updated.translateY).toBe(400);
    });

    test('should update an object fill color and re-render', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();

      const added = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
        fillColor: { light: '#ff0000', dark: '#ff0000' },
      });

      await editorPage.waitForObjectsAdded();

      await editorPage.updateObject(added, {
        fillColor: { light: '#0000ff', dark: '#0000ff' },
      });

      const updated = await editorPage.getObjectById<any>(added.id);
      expect(updated.fillColor.light).toBe('#0000ff');
    });

    test('should update width and height of a shape', async ({ editorPage }) => {
      const added = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 0,
        translateY: 0,
        width: 100,
        height: 80,
      });

      await editorPage.updateObject(added, { width: 300, height: 250 });

      const updated = await editorPage.getObjectById<any>(added.id);
      expect(updated.width).toBe(300);
      expect(updated.height).toBe(250);
    });
  });

  test.describe('removeObject', () => {
    test('should remove an object and decrement the count', async ({ editorPage }) => {
      const added = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 0,
        translateY: 0,
        width: 100,
        height: 100,
      });

      expect(await editorPage.getObjectsTotalCount()).toBe(1);

      await editorPage.removeObject(added);

      expect(await editorPage.getObjectsTotalCount()).toBe(0);
    });

    test('should remove the DOM element for the removed object', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();

      const added = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 0,
        translateY: 0,
        width: 100,
        height: 100,
      });

      await editorPage.waitForObjectsAdded();
      expect(await editorPage.getObjectElementCount()).toBe(1);

      await editorPage.removeObject(added);

      // Wait for DOM to update
      await editorPage.page.waitForTimeout(100);
      expect(await editorPage.getObjectElementCount()).toBe(0);
    });

    test('should return the removed object', async ({ editorPage }) => {
      const added = await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 50,
        translateY: 50,
        width: 120,
        height: 120,
      });

      const removed = await editorPage.removeObject(added);

      expect(removed).toBeDefined();
    });
  });

  test.describe('getAllObjects', () => {
    test('should return empty array when canvas is empty', async ({ editorPage }) => {
      const objects = await editorPage.getAllObjects();
      expect(objects).toEqual([]);
    });

    test('should return all objects after adding several', async ({ editorPage }) => {
      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 0,
        translateY: 0,
        width: 100,
        height: 100,
      });
      await editorPage.addText({
        text: 'Test',
        translateX: 200,
        translateY: 0,
      });
      await editorPage.addPath({
        points: [
          [0, 0],
          [100, 100],
        ],
        translateX: 400,
        translateY: 0,
        strokeWidth: 2,
      });

      const objects = await editorPage.getAllObjects<any>();
      expect(objects).toHaveLength(3);
    });
  });

  test.describe('findObjects', () => {
    test('should find objects matching a predicate', async ({ editorPage }) => {
      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 0,
        translateY: 0,
        width: 100,
        height: 100,
      });
      await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 200,
        translateY: 0,
        width: 100,
        height: 100,
      });
      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 400,
        translateY: 0,
        width: 100,
        height: 100,
      });

      const rectangles = await editorPage.findObjects<any>(
        "return obj.shapeType === 'rectangle'"
      );
      expect(rectangles).toHaveLength(2);
    });

    test('should return empty array when no objects match', async ({ editorPage }) => {
      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 0,
        translateY: 0,
        width: 100,
        height: 100,
      });

      const matches = await editorPage.findObjects<any>(
        "return obj.shapeType === 'triangle'"
      );
      expect(matches).toHaveLength(0);
    });
  });

  test.describe('getObjectsTotalCount', () => {
    test('should return 0 on empty canvas', async ({ editorPage }) => {
      const count = await editorPage.getObjectsTotalCount();
      expect(count).toBe(0);
    });

    test('should return correct count after additions and removals', async ({ editorPage }) => {
      const shape1 = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 0,
        translateY: 0,
        width: 100,
        height: 100,
      });
      await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 200,
        translateY: 0,
        width: 100,
        height: 100,
      });
      await editorPage.addText({
        text: 'Count test',
        translateX: 400,
        translateY: 0,
      });

      expect(await editorPage.getObjectsTotalCount()).toBe(3);

      await editorPage.removeObject(shape1);

      expect(await editorPage.getObjectsTotalCount()).toBe(2);
    });
  });

  test.describe('getObjectsInViewport', () => {
    test('should return only objects visible in the current viewport', async ({ editorPage }) => {
      // Add an object at the origin (visible by default)
      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 100,
        height: 100,
      });

      const inViewport = await editorPage.getObjectsInViewport<any>();
      expect(inViewport.length).toBeGreaterThanOrEqual(1);
    });

    test('should exclude objects panned out of view', async ({ editorPage }) => {
      // Add an object at a known position
      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 100,
        height: 100,
      });

      // Pan far away so the object is no longer in view
      await editorPage.setViewport(10000, 10000, 1);

      // Wait for the engine to process the viewport change
      await editorPage.page.evaluate(() =>
        new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
      );

      const inViewport = await editorPage.getObjectsInViewport<any>();
      expect(inViewport).toHaveLength(0);
    });
  });
});
