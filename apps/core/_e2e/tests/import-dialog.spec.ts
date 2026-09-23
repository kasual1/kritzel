import { type Page } from '@playwright/test';
import { test, expect, type EditorPage } from '../fixtures/editor.fixture';

async function generateDataUri(page: Page, width = 100, height = 100, color = '#3366cc') {
  return page.evaluate(({ w, h, c }) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('IMAGE', w / 2, h / 2);
    return canvas.toDataURL('image/png');
  }, { w: width, h: height, c: color });
}

async function addAllObjectTypesToCanvas(editorPage: EditorPage, page: Page) {
  await editorPage.prepareWaitForObjectsAdded();
  await editorPage.addShape({
    shapeType: 'rectangle',
    translateX: -150,
    translateY: -100,
    width: 100,
    height: 80,
    fillColor: { light: '#ff9999', dark: '#cc3333' },
    strokeColor: { light: '#000000', dark: '#ffffff' },
    strokeWidth: 2,
  });
  await editorPage.waitForObjectsAdded();

  await editorPage.prepareWaitForObjectsAdded();
  await editorPage.addPath({
    points: [[0, 0], [30, 30], [60, 0]],
    translateX: 0,
    translateY: -100,
    strokeWidth: 3,
  });
  await editorPage.waitForObjectsAdded();

  await editorPage.prepareWaitForObjectsAdded();
  await editorPage.addText({
    text: 'Export Preview Text',
    translateX: 100,
    translateY: -100,
    fontSize: 20,
  });
  await editorPage.waitForObjectsAdded();

  await editorPage.prepareWaitForObjectsAdded();
  await editorPage.addLine({
    startX: -150,
    startY: 50,
    endX: -50,
    endY: 100,
    strokeWidth: 2,
  });
  await editorPage.waitForObjectsAdded();

  const imageSrc = await generateDataUri(page, 80, 60, '#33cc66');
  await editorPage.prepareWaitForObjectsAdded();
  await editorPage.addImage({
    src: imageSrc,
    translateX: 0,
    translateY: 50,
  });
  await editorPage.waitForObjectsAdded();

  await editorPage.prepareWaitForObjectsAdded();
  await editorPage.addDynamicObject({
    translateX: 120,
    translateY: 50,
    width: 100,
    height: 60,
    contentText: 'Dynamic Object',
  });
  await editorPage.waitForObjectsAdded();
}

async function openExportDialog(page: Page) {
  await page.getByTestId('more-menu-button').click();
  await page.getByTestId('menu-item-export').click();

  const exportDialog = page.locator('kritzel-export kritzel-dialog[is-open]');
  await exportDialog.waitFor({ state: 'attached' });
  await page.waitForTimeout(100);

  return page.locator('kritzel-export');
}

async function downloadWorkspaceExport(page: Page): Promise<string> {
  const exportRoot = await openExportDialog(page);

  const workspaceTab = exportRoot.locator('kritzel-pill-tabs').getByRole('tab', { name: 'Export Workspace' });
  await workspaceTab.click();
  await expect(workspaceTab).toHaveAttribute('aria-selected', 'true');

  const exportButton = page.locator('kritzel-export kritzel-dialog[is-open] button.export-primary-button');
  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/\.json$/i);

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  return downloadPath!;
}

test.describe('Workspace import via more-menu', () => {
  test('imports a downloaded workspace file and restores all expected objects', async ({ editorPage, page }) => {
    await editorPage.goto();
    await editorPage.waitForReady();

    await addAllObjectTypesToCanvas(editorPage, page);
    const workspaceJsonPath = await downloadWorkspaceExport(page);

    await editorPage.goto();
    await editorPage.waitForReady();

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('more-menu-button').click();
    await page.getByTestId('menu-item-import').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(workspaceJsonPath);

    await expect.poll(async () => editorPage.getObjectsTotalCount()).toBe(6);

    const objects = await editorPage.getAllObjects<{ __class__: string }>();
    expect(objects).toHaveLength(6);
    expect(objects.map(object => object.__class__)).toEqual([
      'KritzelShape',
      'KritzelPath',
      'KritzelText',
      'KritzelLine',
      'KritzelImage',
      'KritzelDynamicObject',
    ]);

    await editorPage.clearSelection();
    await page.waitForTimeout(100);
    await expect(editorPage.engine).toHaveScreenshot('workspace-import-more-menu-restored-objects.png', { timeout: 1000 });
  });
});