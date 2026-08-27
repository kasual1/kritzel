import { test, expect } from '../fixtures/editor.fixture';

const TEST_IMAGE_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

async function setupTwoEditors(page: import('@playwright/test').Page) {
  await page.goto('/#/e2e/multi-editor');

  await page.waitForFunction(
    () => customElements.get('kritzel-editor') !== undefined,
    { timeout: 15_000 }
  );

  const hasTwoEditors = await page.evaluate(
    () => document.querySelectorAll('kritzel-editor').length === 2
  );

  if (!hasTwoEditors) {
    await page.evaluate(() => {
      const firstEditor = document.querySelector('kritzel-editor') as any;
      if (!firstEditor) throw new Error('initial kritzel-editor not found');

      const host = document.createElement('div');
      host.id = 'multi-editor-host';
      host.setAttribute(
        'style',
        [
          'display: grid',
          'grid-template-columns: 1fr 1fr',
          'gap: 24px',
          'padding: 24px',
          'box-sizing: border-box',
          'height: 100vh',
          'background: linear-gradient(135deg, #f7f8fb, #fef6f7)',
        ].join('; ')
      );

      const firstContainer = document.createElement('div');
      firstContainer.id = 'editor-container-1';
      firstContainer.setAttribute(
        'style',
        [
          'position: relative',
          'overflow: hidden',
          'border: 2px solid #3f7ac8',
          'border-radius: 12px',
          'background: #ffffff',
        ].join('; ')
      );

      const secondContainer = document.createElement('div');
      secondContainer.id = 'editor-container-2';
      secondContainer.setAttribute(
        'style',
        [
          'position: relative',
          'overflow: hidden',
          'border: 2px solid #d65067',
          'border-radius: 12px',
          'background: #ffffff',
        ].join('; ')
      );

      firstEditor.parentElement?.removeChild(firstEditor);

      const secondEditor = document.createElement('kritzel-editor') as any;
      secondEditor.id = 'editor-2';

      firstEditor.id = 'editor-1';
      firstEditor.editorId = 'e2e-editor-1';
      secondEditor.editorId = 'e2e-editor-2';

      firstEditor.setAttribute('style', 'width: 100%; height: 100%; display: block;');
      secondEditor.setAttribute('style', 'width: 100%; height: 100%; display: block;');

      firstContainer.appendChild(firstEditor);
      secondContainer.appendChild(secondEditor);
      host.appendChild(firstContainer);
      host.appendChild(secondContainer);

      document.body.innerHTML = '';
      document.body.style.margin = '0';
      document.body.appendChild(host);
    });
  }

  await page.waitForFunction(
    () => {
      const editors = Array.from(document.querySelectorAll('kritzel-editor')) as any[];
      if (editors.length !== 2) return false;

      return editors.every((editor) => {
        const hasApi = typeof editor.getActiveWorkspace === 'function';
        const isReady = editor?.engineRef?.core?.store?.state?.isReady === true;
        const hasWorkspace = !!editor?.engineRef?.core?.store?.state?.activeWorkspace;
        return hasApi && isReady && hasWorkspace;
      });
    },
    { timeout: 15_000 }
  );
}

async function addRectangle(page: import('@playwright/test').Page, editorIndex: number, x: number, y: number) {
  return page.evaluate(
    ({ editorIndex, x, y }) => {
      const editors = Array.from(document.querySelectorAll('kritzel-editor')) as any[];
      const editor = editors[editorIndex];
      if (!editor) throw new Error(`kritzel-editor at index ${editorIndex} not found`);

      const k = (window as any).__kritzel__;
      if (!k?.KritzelShape) throw new Error('Kritzel classes are not available on window.__kritzel__');

      const shape = new k.KritzelShape({
        shapeType: 'rectangle',
        translateX: x,
        translateY: y,
        width: 140,
        height: 100,
        fillColor: { light: '#41a66f', dark: '#41a66f' },
      });

      return editor.addObject(shape);
    },
    { editorIndex, x, y }
  );
}

async function getEditorWorldToPage(
  page: import('@playwright/test').Page,
  editorIndex: number,
  x: number,
  y: number
) {
  return page.evaluate(
    async ({ editorIndex, x, y }) => {
      const editors = Array.from(document.querySelectorAll('kritzel-editor')) as any[];
      const editor = editors[editorIndex];
      if (!editor) throw new Error(`kritzel-editor at index ${editorIndex} not found`);

      const engine = editor.engineRef as HTMLElement | undefined;
      if (!engine) throw new Error(`kritzel-engine for editor index ${editorIndex} not found`);

      const screen = await editor.worldToScreen(x, y);
      const rect = engine.getBoundingClientRect();

      return {
        pageX: rect.x + screen.x,
        pageY: rect.y + screen.y,
      };
    },
    { editorIndex, x, y }
  );
}

async function setActiveTool(
  page: import('@playwright/test').Page,
  editorIndex: number,
  toolName: 'brush' | 'shape' | 'line' | 'eraser'
) {
  await page.evaluate(
    async ({ editorIndex, toolName }) => {
      const editors = Array.from(document.querySelectorAll('kritzel-editor')) as any[];
      const editor = editors[editorIndex];
      if (!editor) throw new Error(`kritzel-editor at index ${editorIndex} not found`);
      await editor.changeActiveTool(toolName);
    },
    { editorIndex, toolName }
  );
}

async function drawStrokeInEditor(
  page: import('@playwright/test').Page,
  editorIndex: number,
  worldPoints: Array<{ x: number; y: number }>
) {
  if (worldPoints.length < 2) {
    throw new Error('drawStrokeInEditor requires at least two points');
  }

  const start = await getEditorWorldToPage(page, editorIndex, worldPoints[0].x, worldPoints[0].y);
  await page.mouse.move(start.pageX, start.pageY);
  await page.mouse.down();

  for (let i = 1; i < worldPoints.length; i++) {
    const point = await getEditorWorldToPage(page, editorIndex, worldPoints[i].x, worldPoints[i].y);
    await page.mouse.move(point.pageX, point.pageY, { steps: 5 });
  }

  await page.mouse.up();
}

async function dragInEditor(
  page: import('@playwright/test').Page,
  editorIndex: number,
  from: { x: number; y: number },
  to: { x: number; y: number }
) {
  const start = await getEditorWorldToPage(page, editorIndex, from.x, from.y);
  const end = await getEditorWorldToPage(page, editorIndex, to.x, to.y);

  await page.mouse.move(start.pageX, start.pageY);
  await page.mouse.down();
  await page.mouse.move(end.pageX, end.pageY, { steps: 10 });
  await page.mouse.up();
}

async function addImage(page: import('@playwright/test').Page, editorIndex: number) {
  return page.evaluate(
    async ({ editorIndex, src }) => {
      const editors = Array.from(document.querySelectorAll('kritzel-editor')) as any[];
      const editor = editors[editorIndex];
      if (!editor) throw new Error(`kritzel-editor at index ${editorIndex} not found`);

      const k = (window as any).__kritzel__;
      if (!k?.KritzelImage?.fromUrl) {
        throw new Error('KritzelImage class is not available on window.__kritzel__');
      }

      const image = await k.KritzelImage.fromUrl(src, {
        translateX: 100,
        translateY: 100,
        width: 48,
        height: 48,
      });

      return editor.addObject(image);
    },
    { editorIndex, src: TEST_IMAGE_DATA_URL }
  );
}

async function removeObjectById(page: import('@playwright/test').Page, editorIndex: number, objectId: string) {
  await page.evaluate(
    async ({ editorIndex, objectId }) => {
      const editors = Array.from(document.querySelectorAll('kritzel-editor')) as any[];
      const editor = editors[editorIndex];
      if (!editor) throw new Error(`kritzel-editor at index ${editorIndex} not found`);

      const object = await editor.getObjectById(objectId);
      if (!object) throw new Error(`object ${objectId} not found in editor index ${editorIndex}`);

      await editor.removeObject(object);
    },
    { editorIndex, objectId }
  );
}

async function getCounts(page: import('@playwright/test').Page, editorIndex: number) {
  return page.evaluate(async (index) => {
    const editors = Array.from(document.querySelectorAll('kritzel-editor')) as any[];
    const editor = editors[index];
    if (!editor) throw new Error(`kritzel-editor at index ${index} not found`);

    return {
      objects: (await editor.findObjects(() => true)).length,
      selected: (await editor.getSelectedObjects()).length,
    };
  }, editorIndex);
}

test.describe('Multiple Editors', () => {
  test.beforeEach(async ({ page }) => {
    await setupTwoEditors(page);
  });

  test('should keep object collections isolated per editor instance', async ({ page }) => {
    await addRectangle(page, 0, 120, 120);

    await page.waitForFunction(async () => {
      const editors = Array.from(document.querySelectorAll('kritzel-editor')) as any[];
      return (await editors[0]?.getObjectsTotalCount?.()) === 1;
    });

    const firstAfterAdd = await getCounts(page, 0);
    const secondAfterAdd = await getCounts(page, 1);

    expect(firstAfterAdd.objects).toBe(1);
    expect(secondAfterAdd.objects).toBe(0);

    await addRectangle(page, 1, 280, 200);

    await page.waitForFunction(async () => {
      const editors = Array.from(document.querySelectorAll('kritzel-editor')) as any[];
      return (await editors[0]?.getObjectsTotalCount?.()) === 1 && (await editors[1]?.getObjectsTotalCount?.()) === 1;
    });

    const firstFinal = await getCounts(page, 0);
    const secondFinal = await getCounts(page, 1);

    expect(firstFinal.objects).toBe(1);
    expect(secondFinal.objects).toBe(1);
  });

  test('should keep selection state isolated between editor instances', async ({ page }) => {
    const firstObject = await addRectangle(page, 0, 160, 160);
    const secondObject = await addRectangle(page, 1, 240, 220);

    await page.evaluate(async (id) => {
      const editor = document.querySelectorAll('kritzel-editor')[0] as any;
      const obj = await editor.getObjectById(id);
      await editor.selectObjects([obj]);
    }, firstObject.id);

    const firstAfterSelect = await getCounts(page, 0);
    const secondAfterFirstSelect = await getCounts(page, 1);

    expect(firstAfterSelect.selected).toBe(1);
    expect(secondAfterFirstSelect.selected).toBe(0);

    await page.evaluate(async (id) => {
      const editor = document.querySelectorAll('kritzel-editor')[1] as any;
      const obj = await editor.getObjectById(id);
      await editor.selectObjects([obj]);
    }, secondObject.id);

    const firstFinal = await getCounts(page, 0);
    const secondFinal = await getCounts(page, 1);

    expect(firstFinal.selected).toBe(1);
    expect(secondFinal.selected).toBe(1);
  });

  test('undo in one editor should not affect the other editor', async ({ page }) => {
    await addRectangle(page, 0, 100, 120);
    await addRectangle(page, 1, 300, 260);

    await page.waitForFunction(async () => {
      const editors = Array.from(document.querySelectorAll('kritzel-editor')) as any[];
      return (await editors[0]?.getObjectsTotalCount?.()) === 1 && (await editors[1]?.getObjectsTotalCount?.()) === 1;
    });

    await page.evaluate(async () => {
      const editor = document.querySelectorAll('kritzel-editor')[0] as any;
      await editor.undo();
    });

    await page.waitForFunction(async () => {
      const editors = Array.from(document.querySelectorAll('kritzel-editor')) as any[];
      return (await editors[0]?.getObjectsTotalCount?.()) === 0;
    });

    const firstFinal = await getCounts(page, 0);
    const secondFinal = await getCounts(page, 1);

    expect(firstFinal.objects).toBe(0);
    expect(secondFinal.objects).toBe(1);
  });

  test('drawing a brush path in one editor should not affect the other editor', async ({ page }) => {
    await setActiveTool(page, 0, 'brush');

    await drawStrokeInEditor(page, 0, [
      { x: 80, y: 100 },
      { x: 140, y: 120 },
      { x: 220, y: 90 },
      { x: 300, y: 130 },
    ]);

    await page.waitForFunction(async () => {
      const editors = Array.from(document.querySelectorAll('kritzel-editor')) as any[];
      return (await editors[0]?.getObjectsTotalCount?.()) === 1;
    });

    const firstObjects = await page.evaluate(() => {
      const editor = document.querySelectorAll('kritzel-editor')[0] as any;
      return editor.getAllObjects();
    });

    const countsA = await getCounts(page, 0);
    const countsB = await getCounts(page, 1);

    expect(countsA.objects).toBe(1);
    expect(countsB.objects).toBe(0);
    expect(firstObjects[0].points).toBeDefined();
    expect(firstObjects[0].points.length).toBeGreaterThanOrEqual(2);
  });

  test('drawing a shape in one editor should not affect the other editor', async ({ page }) => {
    await setActiveTool(page, 1, 'shape');

    await dragInEditor(page, 1, { x: 110, y: 110 }, { x: 330, y: 250 });

    await page.waitForFunction(async () => {
      const editors = Array.from(document.querySelectorAll('kritzel-editor')) as any[];
      return (await editors[1]?.findObjects?.(() => true)).length === 1;
    });

    const secondObjects = await page.evaluate(() => {
      const editor = document.querySelectorAll('kritzel-editor')[1] as any;
      return editor.getAllObjects();
    });

    const countsA = await getCounts(page, 0);
    const countsB = await getCounts(page, 1);

    expect(countsA.objects).toBe(0);
    expect(countsB.objects).toBe(1);
    expect(secondObjects[0].shapeType).toBeDefined();
  });

  test('drawing a line in one editor should not affect the other editor', async ({ page }) => {
    await setActiveTool(page, 0, 'line');

    await dragInEditor(page, 0, { x: 120, y: 180 }, { x: 360, y: 260 });

    await page.waitForFunction(async () => {
      const editors = Array.from(document.querySelectorAll('kritzel-editor')) as any[];
      return (await editors[0]?.findObjects?.(() => true)).length === 1;
    });

    const firstObjects = await page.evaluate(() => {
      const editor = document.querySelectorAll('kritzel-editor')[0] as any;
      return editor.getAllObjects();
    });

    const countsA = await getCounts(page, 0);
    const countsB = await getCounts(page, 1);

    expect(countsA.objects).toBe(1);
    expect(countsB.objects).toBe(0);
    expect(firstObjects[0].startX).toBeDefined();
    expect(firstObjects[0].endX).toBeDefined();
  });

  test('adding and removing images in one editor should not affect the other editor', async ({ page }) => {
    const imageA = await addImage(page, 0);
    const imageB = await addImage(page, 1);

    await page.waitForFunction(async () => {
      const editors = Array.from(document.querySelectorAll('kritzel-editor')) as any[];
      return (await editors[0]?.getObjectsTotalCount?.()) === 1 && (await editors[1]?.getObjectsTotalCount?.()) === 1;
    });

    await removeObjectById(page, 0, imageA.id);

    await page.waitForFunction(async () => {
      const editors = Array.from(document.querySelectorAll('kritzel-editor')) as any[];
      return (await editors[0]?.getObjectsTotalCount?.()) === 0 && (await editors[1]?.getObjectsTotalCount?.()) === 1;
    });

    const firstObjects = await page.evaluate(() => {
      const editor = document.querySelectorAll('kritzel-editor')[0] as any;
      return editor.getAllObjects();
    });
    const secondObjects = await page.evaluate(() => {
      const editor = document.querySelectorAll('kritzel-editor')[1] as any;
      return editor.getAllObjects();
    });

    expect(firstObjects).toHaveLength(0);
    expect(secondObjects).toHaveLength(1);
    expect(secondObjects[0].id).toBe(imageB.id);
  });

  test('erasing in one editor should not erase objects in the other editor', async ({ page }) => {
    await addRectangle(page, 0, 140, 140);
    await addRectangle(page, 1, 180, 180);

    await page.waitForFunction(async () => {
      const editors = Array.from(document.querySelectorAll('kritzel-editor')) as any[];
      return (await editors[0]?.getObjectsTotalCount?.()) === 1 && (await editors[1]?.getObjectsTotalCount?.()) === 1;
    });

    await setActiveTool(page, 0, 'eraser');
    await drawStrokeInEditor(page, 0, [
      { x: 150, y: 190 },
      { x: 220, y: 190 },
      { x: 280, y: 190 },
    ]);

    await page.waitForFunction(async () => {
      const editors = Array.from(document.querySelectorAll('kritzel-editor')) as any[];
      return (await editors[0]?.getObjectsTotalCount?.()) === 0;
    });

    const countsA = await getCounts(page, 0);
    const countsB = await getCounts(page, 1);

    expect(countsA.objects).toBe(0);
    expect(countsB.objects).toBe(1);
  });

  test('restricting toolbar items on one editor should not affect the other editor', async ({ page }) => {
    await page.evaluate(() => {
      const editors = Array.from(document.querySelectorAll('kritzel-editor')) as any[];
      editors[0].toolbarItems = editors[0].toolbarItems.filter((item: any) => item.name === 'selection' || item.name === 'brush');
    });

    await page.waitForFunction(() => {
      const editors = Array.from(document.querySelectorAll('kritzel-editor')) as any[];
      return editors[0]?.toolbarItems?.length === 2;
    });

    const controlNames = await page.evaluate(() => {
      const editors = Array.from(document.querySelectorAll('kritzel-editor')) as any[];
      return {
        editor0: (editors[0]?.toolbarItems ?? []).map((item: any) => item.name) as string[],
        editor1: (editors[1]?.toolbarItems ?? []).map((item: any) => item.name) as string[],
      };
    });

    expect(controlNames.editor0).toEqual(['selection', 'brush']);
    expect(controlNames.editor1).toContain('line');
    expect(controlNames.editor1).toContain('shape');
    expect(controlNames.editor1).toContain('eraser');
    expect(controlNames.editor1.length).toBeGreaterThan(2);
  });

  test('hiding the utility panel on one editor should not affect the other editor', async ({ page }) => {
    await page.evaluate(() => {
      const editors = Array.from(document.querySelectorAll('kritzel-editor')) as any[];
      editors[1].isUtilityPanelVisible = false;
    });

    await page.waitForFunction(() => {
      const editors = Array.from(document.querySelectorAll('kritzel-editor')) as any[];
      const toolbarElement = editors[1]?.querySelector('kritzel-toolbar') as any;
      return toolbarElement?.isUtilityPanelVisible === false;
    });

    const panelState = await page.evaluate(() => {
      const editors = Array.from(document.querySelectorAll('kritzel-editor')) as any[];
      const toolbar0 = editors[0]?.querySelector('kritzel-toolbar') as any;
      const toolbar1 = editors[1]?.querySelector('kritzel-toolbar') as any;
      return {
        editor0UtilityPanelVisible: toolbar0?.isUtilityPanelVisible as boolean,
        editor1UtilityPanelVisible: toolbar1?.isUtilityPanelVisible as boolean,
      };
    });

    expect(panelState.editor0UtilityPanelVisible).toBe(true);
    expect(panelState.editor1UtilityPanelVisible).toBe(false);
  });
});
