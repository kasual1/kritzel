import { test, expect } from '../../fixtures/editor.fixture';

/**
 * Helper: wait for viewport animation to complete (~150ms animation + buffer).
 * setViewport/panTo/zoomTo/backToContent all fire-and-forget animations.
 */
async function waitForViewportAnimation(page: import('@playwright/test').Page) {
  await page.waitForTimeout(300);
}

/**
 * Helper: wait for Stencil prop propagation from kritzel-editor to kritzel-engine.
 * setProps sets values on kritzel-editor, but @Watch handlers on kritzel-engine
 * only fire after Stencil re-renders the component tree.
 */
async function waitForPropsPropagation(page: import('@playwright/test').Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  );
}

async function waitForViewportWheelHandling(page: import('@playwright/test').Page) {
  await page.waitForTimeout(100);
}

async function dispatchWheelOnEngine(
  page: import('@playwright/test').Page,
  options: { deltaX?: number; deltaY?: number; ctrlKey?: boolean } = {}
) {
  await page.evaluate(({ deltaX = 0, deltaY = 0, ctrlKey = false }) => {
    const engine = document.querySelector('kritzel-engine');
    if (!engine) {
      throw new Error('kritzel-engine not found');
    }

    const rect = engine.getBoundingClientRect();
    engine.dispatchEvent(
      new WheelEvent('wheel', {
        bubbles: true,
        composed: true,
        cancelable: true,
        deltaX,
        deltaY,
        ctrlKey,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
      })
    );
  }, options);
}

test.describe('Viewport', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
  });

  test.describe('getViewport / setViewport', () => {
    test('should return initial viewport state', async ({ editorPage }) => {
      const viewport = await editorPage.getViewport();

      expect(viewport).toHaveProperty('translateX');
      expect(viewport).toHaveProperty('translateY');
      expect(viewport).toHaveProperty('scale');
      expect(viewport).toHaveProperty('width');
      expect(viewport).toHaveProperty('height');
      expect(viewport.scale).toBeGreaterThan(0);
      expect(viewport.width).toBeGreaterThan(0);
      expect(viewport.height).toBeGreaterThan(0);
    });

    test('should set viewport to specific x, y, scale', async ({ editorPage }) => {
      // setViewport(x, y, scale) centers world point (x,y) in the viewport.
      // translateX/Y are screen-space transforms: screenX = worldX * scale + translateX
      // So after centering (500, 300) at scale 1: translateX = viewportWidth/2 - 500
      await editorPage.setViewport(500, 300, 1);
      await waitForViewportAnimation(editorPage.page);

      const viewport = await editorPage.getViewport();
      expect(viewport.scale).toBeCloseTo(1, 1);

      // Verify via worldToScreen that world (500,300) is now at viewport center
      const screenPos = await editorPage.worldToScreen(500, 300);
      expect(screenPos.x).toBeCloseTo(viewport.width / 2, 0);
      expect(screenPos.y).toBeCloseTo(viewport.height / 2, 0);
    });

    test('viewport state should reflect the new position after setViewport', async ({ editorPage }) => {
      const before = await editorPage.getViewport();

      await editorPage.setViewport(1000, 2000, 1);
      await waitForViewportAnimation(editorPage.page);

      const after = await editorPage.getViewport();
      // translateX/Y should have changed from initial values
      expect(after.translateX).not.toBeCloseTo(before.translateX, 0);
      expect(after.translateY).not.toBeCloseTo(before.translateY, 0);
      expect(after.scale).toBeCloseTo(1, 1);

      // Verify world point (1000, 2000) is centered
      const screenPos = await editorPage.worldToScreen(1000, 2000);
      expect(screenPos.x).toBeCloseTo(after.width / 2, 0);
      expect(screenPos.y).toBeCloseTo(after.height / 2, 0);
    });
  });

  test.describe('panTo', () => {
    test('should pan to specified world coordinates', async ({ editorPage }) => {
      await editorPage.panTo(2000, 3000);
      await waitForViewportAnimation(editorPage.page);

      // panTo centers the given world point in the viewport
      const viewport = await editorPage.getViewport();
      const screenPos = await editorPage.worldToScreen(2000, 3000);
      expect(screenPos.x).toBeCloseTo(viewport.width / 2, 0);
      expect(screenPos.y).toBeCloseTo(viewport.height / 2, 0);
    });

    test('viewport x/y should update after panTo and scale should remain unchanged', async ({ editorPage }) => {
      const before = await editorPage.getViewport();

      await editorPage.panTo(5000, 5000);
      await waitForViewportAnimation(editorPage.page);

      const after = await editorPage.getViewport();
      // Viewport should have moved significantly
      expect(after.translateX).not.toBeCloseTo(before.translateX, 0);
      expect(after.translateY).not.toBeCloseTo(before.translateY, 0);
      // Scale should remain unchanged
      expect(after.scale).toBeCloseTo(before.scale, 1);
    });

    test('should prevent wheel panning when isPanningEnabled is false and allow it again when re-enabled', async ({
      editorPage,
      page,
    }) => {
      await editorPage.setViewport(0, 0, 1);
      await waitForViewportWheelHandling(page);

      await editorPage.setProps({ isPanningEnabled: false });
      await waitForPropsPropagation(page);

      const beforeDisabledWheel = await editorPage.getViewport();
      await dispatchWheelOnEngine(page, { deltaY: 120 });
      await waitForViewportWheelHandling(page);

      const afterDisabledWheel = await editorPage.getViewport();
      expect(afterDisabledWheel.translateX).toBeCloseTo(beforeDisabledWheel.translateX, 5);
      expect(afterDisabledWheel.translateY).toBeCloseTo(beforeDisabledWheel.translateY, 5);
      expect(afterDisabledWheel.scale).toBeCloseTo(beforeDisabledWheel.scale, 5);

      await editorPage.setProps({ isPanningEnabled: true });
      await waitForPropsPropagation(page);

      const beforeEnabledWheel = await editorPage.getViewport();
      await dispatchWheelOnEngine(page, { deltaY: 120 });
      await waitForViewportWheelHandling(page);

      const afterEnabledWheel = await editorPage.getViewport();
      expect(afterEnabledWheel.translateY).not.toBeCloseTo(beforeEnabledWheel.translateY, 1);
      expect(afterEnabledWheel.scale).toBeCloseTo(beforeEnabledWheel.scale, 5);
    });
  });

  test.describe('zoomTo', () => {
    test('should zoom to a specified scale', async ({ editorPage }) => {
      await editorPage.zoomTo(2);
      await waitForViewportAnimation(editorPage.page);

      const viewport = await editorPage.getViewport();
      expect(viewport.scale).toBeCloseTo(2, 1);
    });

    test('should zoom to a specified scale at a world point', async ({ editorPage }) => {
      await editorPage.zoomTo(1.5, 200, 300);
      await waitForViewportAnimation(editorPage.page);

      const viewport = await editorPage.getViewport();
      expect(viewport.scale).toBeCloseTo(1.5, 1);
    });

    test('should respect scaleMax boundary', async ({ editorPage }) => {
      await editorPage.setProps({ scaleMax: 3 });
      await waitForPropsPropagation(editorPage.page);

      await editorPage.zoomTo(5);
      await waitForViewportAnimation(editorPage.page);

      const viewport = await editorPage.getViewport();
      expect(viewport.scale).toBeLessThanOrEqual(3.01);
    });

    test('should respect scaleMin boundary', async ({ editorPage }) => {
      await editorPage.setProps({ scaleMin: 0.5 });
      await waitForPropsPropagation(editorPage.page);

      await editorPage.zoomTo(0.1);
      await waitForViewportAnimation(editorPage.page);

      const viewport = await editorPage.getViewport();
      expect(viewport.scale).toBeGreaterThanOrEqual(0.49);
    });

    test('should prevent ctrl+wheel zooming when isZoomingEnabled is false and allow it again when re-enabled', async ({
      editorPage,
      page,
    }) => {
      await editorPage.setViewport(0, 0, 1);
      await waitForViewportWheelHandling(page);

      await editorPage.setProps({ isZoomingEnabled: false });
      await waitForPropsPropagation(page);

      const beforeDisabledWheel = await editorPage.getViewport();
      await dispatchWheelOnEngine(page, { deltaY: -120, ctrlKey: true });
      await waitForViewportWheelHandling(page);

      const afterDisabledWheel = await editorPage.getViewport();
      expect(afterDisabledWheel.scale).toBeCloseTo(beforeDisabledWheel.scale, 5);
      expect(afterDisabledWheel.translateX).toBeCloseTo(beforeDisabledWheel.translateX, 5);
      expect(afterDisabledWheel.translateY).toBeCloseTo(beforeDisabledWheel.translateY, 5);

      await editorPage.setProps({ isZoomingEnabled: true });
      await waitForPropsPropagation(page);

      const beforeEnabledWheel = await editorPage.getViewport();
      await dispatchWheelOnEngine(page, { deltaY: -120, ctrlKey: true });
      await waitForViewportWheelHandling(page);

      const afterEnabledWheel = await editorPage.getViewport();
      expect(afterEnabledWheel.scale).toBeGreaterThan(beforeEnabledWheel.scale);
    });
  });

  test.describe('centerObjectInViewport', () => {
    test('should move an object to the center of the viewport', async ({ editorPage }) => {
      // centerObjectInViewport moves the OBJECT to the viewport center, not the viewport to the object
      await editorPage.prepareWaitForObjectsAdded();

      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 5000,
        translateY: 5000,
        width: 200,
        height: 150,
        fillColor: { light: '#4a90d9', dark: '#4a90d9' },
      });

      await editorPage.waitForObjectsAdded();

      await editorPage.centerObjectInViewport(shape);

      // The object should have been moved so its center aligns with the viewport center
      const updated = await editorPage.getObjectById<any>(shape.id);
      const viewport = await editorPage.getViewport();

      // Compute where the viewport center is in world coords
      const viewportCenterWorld = await editorPage.screenToWorld(viewport.width / 2, viewport.height / 2);

      // The object's center should now be near the viewport center in world coords
      const objectCenterX = updated.translateX + updated.width / 2;
      const objectCenterY = updated.translateY + updated.height / 2;
      expect(objectCenterX).toBeCloseTo(viewportCenterWorld.x, -1);
      expect(objectCenterY).toBeCloseTo(viewportCenterWorld.y, -1);
    });

    test('visual: centered object', async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();

      const shape = await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 3000,
        translateY: 3000,
        width: 200,
        height: 150,
        fillColor: { light: '#4a90d9', dark: '#4a90d9' },
      });

      await editorPage.waitForObjectsAdded();

      await editorPage.centerObjectInViewport(shape);

      await editorPage.page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          )
      );

      await expect(editorPage.engine).toHaveScreenshot();
    });
  });

  test.describe('backToContent', () => {
    test('should return true and pan/zoom to fit all content', async ({ editorPage }) => {
      await editorPage.addShape({
        shapeType: 'rectangle',
        translateX: 100,
        translateY: 100,
        width: 200,
        height: 150,
      });
      await editorPage.addShape({
        shapeType: 'ellipse',
        translateX: 2000,
        translateY: 2000,
        width: 300,
        height: 200,
      });

      // Pan far away so content is out of view
      await editorPage.setViewport(50000, 50000, 1);
      await waitForViewportAnimation(editorPage.page);

      const result = await editorPage.backToContent();
      await waitForViewportAnimation(editorPage.page);

      expect(result).toBe(true);

      // Verify that content is now visible by checking worldToScreen for a known object position
      const screenPos = await editorPage.worldToScreen(100, 100);
      const box = await editorPage.getEngineBoundingBox();
      // The content should now be on-screen
      expect(screenPos.x).toBeGreaterThan(-box.width);
      expect(screenPos.x).toBeLessThan(box.width * 2);
      expect(screenPos.y).toBeGreaterThan(-box.height);
      expect(screenPos.y).toBeLessThan(box.height * 2);
    });

    test('should return false when there is no content', async ({ editorPage }) => {
      const result = await editorPage.backToContent();

      expect(result).toBe(false);
    });
  });

  test.describe('coordinate transforms', () => {
    test('screenToWorld should convert screen coords to world coords', async ({ editorPage }) => {
      const worldPoint = await editorPage.screenToWorld(100, 200);

      expect(worldPoint).toHaveProperty('x');
      expect(worldPoint).toHaveProperty('y');
      expect(typeof worldPoint.x).toBe('number');
      expect(typeof worldPoint.y).toBe('number');
    });

    test('worldToScreen should convert world coords to screen coords', async ({ editorPage }) => {
      const screenPoint = await editorPage.worldToScreen(100, 200);

      expect(screenPoint).toHaveProperty('x');
      expect(screenPoint).toHaveProperty('y');
      expect(typeof screenPoint.x).toBe('number');
      expect(typeof screenPoint.y).toBe('number');
    });

    test('roundtrip: screenToWorld → worldToScreen returns original coords', async ({ editorPage }) => {
      const originalScreen = { x: 150, y: 250 };

      const world = await editorPage.screenToWorld(originalScreen.x, originalScreen.y);
      const backToScreen = await editorPage.worldToScreen(world.x, world.y);

      expect(backToScreen.x).toBeCloseTo(originalScreen.x, 0);
      expect(backToScreen.y).toBeCloseTo(originalScreen.y, 0);
    });

    test('transforms should account for current viewport pan and zoom', async ({ editorPage }) => {
      // Get a baseline conversion at default viewport
      const world1 = await editorPage.screenToWorld(100, 100);

      // Pan the viewport and change zoom
      await editorPage.setViewport(500, 500, 2);
      await waitForViewportAnimation(editorPage.page);

      // Same screen coords should now map to different world coords
      const world2 = await editorPage.screenToWorld(100, 100);

      expect(world2.x).not.toBeCloseTo(world1.x, 0);
      expect(world2.y).not.toBeCloseTo(world1.y, 0);
    });
  });

  test.describe('viewport boundaries', () => {
    test('should respect viewportBoundaryLeft', async ({ editorPage }) => {
      await editorPage.setProps({ viewportBoundaryLeft: 0 });
      await waitForPropsPropagation(editorPage.page);

      // Try to center a point far to the left
      await editorPage.setViewport(-5000, 0, 1);
      await waitForViewportAnimation(editorPage.page);

      // World x=0 should still be visible (on-screen or to the right of screen left edge)
      const screenPos = await editorPage.worldToScreen(0, 0);
      expect(screenPos.x).toBeGreaterThanOrEqual(-1);
    });

    test('should respect viewportBoundaryRight', async ({ editorPage }) => {
      await editorPage.setProps({ viewportBoundaryRight: 2000 });
      await waitForPropsPropagation(editorPage.page);

      // Try to center a point far to the right
      await editorPage.setViewport(50000, 0, 1);
      await waitForViewportAnimation(editorPage.page);

      const viewport = await editorPage.getViewport();
      // World x=2000 should still be visible (on-screen or to the left of screen right edge)
      const screenPos = await editorPage.worldToScreen(2000, 0);
      expect(screenPos.x).toBeLessThanOrEqual(viewport.width + 1);
    });

    test('should respect viewportBoundaryTop', async ({ editorPage }) => {
      await editorPage.setProps({ viewportBoundaryTop: 0 });
      await waitForPropsPropagation(editorPage.page);

      // Try to center a point far above
      await editorPage.setViewport(0, -5000, 1);
      await waitForViewportAnimation(editorPage.page);

      // World y=0 should still be visible
      const screenPos = await editorPage.worldToScreen(0, 0);
      expect(screenPos.y).toBeGreaterThanOrEqual(-1);
    });

    test('should respect viewportBoundaryBottom', async ({ editorPage }) => {
      await editorPage.setProps({ viewportBoundaryBottom: 2000 });
      await waitForPropsPropagation(editorPage.page);

      // Try to center a point far below
      await editorPage.setViewport(0, 50000, 1);
      await waitForViewportAnimation(editorPage.page);

      const viewport = await editorPage.getViewport();
      // World y=2000 should still be visible
      const screenPos = await editorPage.worldToScreen(0, 2000);
      expect(screenPos.y).toBeLessThanOrEqual(viewport.height + 1);
    });
  });
});
