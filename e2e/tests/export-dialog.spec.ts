import { type Page } from '@playwright/test';
import { test, expect } from '../fixtures/editor.fixture';
import { readFile } from 'node:fs/promises';

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

async function addAllObjectTypesToCanvas(editorPage: any, page: Page) {
  // Shape
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

  // Path
  await editorPage.prepareWaitForObjectsAdded();
  await editorPage.addPath({
    points: [[0, 0], [30, 30], [60, 0]],
    translateX: 0,
    translateY: -100,
    strokeWidth: 3,
  });
  await editorPage.waitForObjectsAdded();

  // Text
  await editorPage.prepareWaitForObjectsAdded();
  await editorPage.addText({
    text: 'Export Preview Text',
    translateX: 100,
    translateY: -100,
    fontSize: 20,
  });
  await editorPage.waitForObjectsAdded();

  // Line
  await editorPage.prepareWaitForObjectsAdded();
  await editorPage.addLine({
    startX: -150,
    startY: 50,
    endX: -50,
    endY: 100,
    strokeWidth: 2,
  });
  await editorPage.waitForObjectsAdded();

  // Image
  const imageSrc = await generateDataUri(page, 80, 60, '#33cc66');
  await editorPage.prepareWaitForObjectsAdded();
  await editorPage.addImage({
    src: imageSrc,
    translateX: 0,
    translateY: 50,
  });
  await editorPage.waitForObjectsAdded();

  // Custom Element
  await editorPage.prepareWaitForObjectsAdded();
  await editorPage.addCustomElement({
    translateX: 120,
    translateY: 50,
    width: 100,
    height: 60,
    contentText: 'Custom Element',
  });
  await editorPage.waitForObjectsAdded();
}

async function openExportDialog(page: Page) {
  await page.getByTestId('more-menu-button').click();
  await page.getByTestId('menu-item-export').click();

  const exportDialog = page.locator('kritzel-export kritzel-dialog[is-open]');
  await exportDialog.waitFor({ state: 'attached' });
  await page.waitForTimeout(100);

  const exportRoot = page.locator('kritzel-export');
  await expect(exportDialog).toBeAttached();
  return exportRoot;
}

function normalizeExportedViewportSvg(svg: string): string {
  return svg
    .replace(/\r\n/g, '\n')
    .replace(/<\?xml[^>]*>\s*/g, '')
    .replace(/<kritzel-loading-overlay[\s\S]*?<\/kritzel-loading-overlay>/g, '')
    .replace(/<kritzel-sync-indicator[\s\S]*?<\/kritzel-sync-indicator>/g, '')
    .replace(/\sclass="hydrated"/g, '')
    .replace(/\sid="[^"]*"/g, '')
    .replace(/\sstyle="[^"]*"/g, '')
    .replace(/\s(?:aria-hidden|contenteditable|spellcheck|dir)="[^"]*"/g, '')
    .replace(/\s(?:inputmode|enterkeyhint|autocapitalize|autocorrect)="[^"]*"/g, '')
    .replace(/>\s+</g, '><')
    .trim();
}

test.describe('Export dialog', () => {
  test('opens export dialog with viewport tab active and preview rendered', async ({ editorPage, page }) => {
    await editorPage.goto();
    await editorPage.waitForReady();

    await addAllObjectTypesToCanvas(editorPage, page);

    const exportRoot = await openExportDialog(page);

    const activeTab = exportRoot.locator('kritzel-pill-tabs').getByRole('tab', { selected: true });
    await expect(activeTab).toHaveText('Export Viewport');

    const previewImg = exportRoot.locator('.preview-container img');
    await expect(previewImg).toBeVisible();

    const formatDropdown = exportRoot.locator('kritzel-dropdown');
    await expect(formatDropdown).toBeVisible();

    await expect(page).toHaveScreenshot('export-dialog-preview-all-objects.png', { timeout: 1000 });

    await page.locator('kritzel-export kritzel-dialog[is-open] button[aria-label="Close dialog"]').click();
  });

  test('downloads a PNG that matches the baseline screenshot', async ({ editorPage, page }) => {
    await editorPage.goto();
    await editorPage.waitForReady();

    await addAllObjectTypesToCanvas(editorPage, page);
    await openExportDialog(page);

    const exportButton = page.locator('kritzel-export kritzel-dialog[is-open] button.export-primary-button');
    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const downloadedPng = await readFile(downloadPath!);
    expect(downloadedPng).toMatchSnapshot('export-dialog-viewport-download.png');
  });

  test('downloads an SVG with content matching the baseline', async ({ editorPage, page }) => {
    await editorPage.goto();
    await editorPage.waitForReady();

    await addAllObjectTypesToCanvas(editorPage, page);
    const exportRoot = await openExportDialog(page);

    const formatDropdown = exportRoot.locator('kritzel-dropdown');
    await formatDropdown.locator('button').click();
    await formatDropdown.locator('li', { hasText: 'SVG' }).click();

    const exportButton = page.locator('kritzel-export kritzel-dialog[is-open] button.export-primary-button');
    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.svg$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const downloadedSvg = await readFile(downloadPath!, 'utf8');
    const normalizedSvg = normalizeExportedViewportSvg(downloadedSvg);
    expect(normalizedSvg).toMatchSnapshot('export-dialog-viewport-download.svg');
  });
});
