import { test, expect } from '../../fixtures/editor.fixture';

/**
 * Generate a small solid-color PNG as a Buffer for use with fileChooser.setFiles().
 * Uses a minimal valid PNG with IHDR, IDAT, and IEND chunks.
 */
function generateTestPngBuffer(width = 50, height = 50): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: RGB
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = createPngChunk('IHDR', ihdrData);

  // IDAT chunk — raw image data with zlib wrapper
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    const offset = y * rowSize;
    rawData[offset] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const px = offset + 1 + x * 3;
      rawData[px] = 204;     // R — coral color
      rawData[px + 1] = 102; // G
      rawData[px + 2] = 51;  // B
    }
  }

  const deflated = zlibDeflateStore(rawData);
  const idat = createPngChunk('IDAT', deflated);
  const iend = createPngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

/** Create a PNG chunk: length (4) + type (4) + data + crc32 (4) */
function createPngChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput) >>> 0, 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

/** Simple CRC-32 implementation for PNG chunks */
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
  }
  return c ^ 0xffffffff;
}

/** Wrap raw data in a zlib stream using stored (uncompressed) blocks */
function zlibDeflateStore(data: Buffer): Buffer {
  const MAX_BLOCK = 65535;
  const blocks: Buffer[] = [];

  blocks.push(Buffer.from([0x78, 0x01]));

  let offset = 0;
  while (offset < data.length) {
    const remaining = data.length - offset;
    const blockSize = Math.min(remaining, MAX_BLOCK);
    const isLast = offset + blockSize >= data.length;

    const header = Buffer.alloc(5);
    header[0] = isLast ? 0x01 : 0x00;
    header.writeUInt16LE(blockSize, 1);
    header.writeUInt16LE(blockSize ^ 0xffff, 3);
    blocks.push(header);
    blocks.push(data.subarray(offset, offset + blockSize));
    offset += blockSize;
  }

  let a = 1, b = 0;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % 65521;
    b = (b + a) % 65521;
  }
  const adler = Buffer.alloc(4);
  adler.writeUInt32BE((b << 16) | a, 0);
  blocks.push(adler);

  return Buffer.concat(blocks);
}

/** Small reusable PNG buffer for all tests */
const TEST_PNG = generateTestPngBuffer(50, 50);

/** Activate image tool, intercept file chooser, and provide test PNG file */
async function selectImageFile(editorPage: any) {
  await editorPage.prepareWaitForObjectsAdded();

  const fileChooserPromise = editorPage.page.waitForEvent('filechooser');
  await editorPage.activateTool('image');
  const fileChooser = await fileChooserPromise;

  await fileChooser.setFiles({
    name: 'test-image.png',
    mimeType: 'image/png',
    buffer: TEST_PNG,
  });

  await editorPage.waitForObjectsAdded();
}

/** Activate image tool, intercept file chooser, and provide multiple test PNG files */
async function selectMultipleImageFiles(editorPage: any, count: number) {
  await editorPage.prepareWaitForObjectsAdded();

  const fileChooserPromise = editorPage.page.waitForEvent('filechooser');
  await editorPage.activateTool('image');
  const fileChooser = await fileChooserPromise;

  await fileChooser.setFiles(
    Array.from({ length: count }, (_, i) => ({
      name: `test-image-${i + 1}.png`,
      mimeType: 'image/png',
      buffer: TEST_PNG,
    }))
  );

  await editorPage.waitForObjectsAdded();
}

test.describe('Image tool', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
    await editorPage.waitForEngine();
  });

  test('should activate image tool and open file chooser', async ({ editorPage }) => {
    const fileChooserPromise = editorPage.page.waitForEvent('filechooser');
    await editorPage.activateTool('image');
    const fileChooser = await fileChooserPromise;

    expect(fileChooser).toBeDefined();
    expect(fileChooser.isMultiple()).toBe(true);
  });

  test('should add an image by selecting a file via the file chooser', async ({ editorPage }) => {
    await selectImageFile(editorPage);

    // Clear selection to exclude the KritzelSelectionGroup from getAllObjects
    await editorPage.clearSelection();

    const count = await editorPage.getObjectsTotalCount();
    expect(count).toBe(1);

    const objects = await editorPage.getAllObjects<any>();
    expect(objects).toHaveLength(1);
    expect(objects[0].__class__).toBe('KritzelImage');
    expect(objects[0].assetId).toBeTruthy();
    expect(typeof objects[0].assetId).toBe('string');
    expect(objects[0].mimeType).toMatch(/^image\//);
  });

  test('should add multiple images by selecting multiple files via the file chooser', async ({ editorPage }) => {
    await selectMultipleImageFiles(editorPage, 3);

    // Clear selection to exclude the KritzelSelectionGroup from getAllObjects
    await editorPage.clearSelection();

    const count = await editorPage.getObjectsTotalCount();
    expect(count).toBe(3);

    const objects = await editorPage.getAllObjects<any>();
    expect(objects).toHaveLength(3);
    for (const obj of objects) {
      expect(obj.__class__).toBe('KritzelImage');
      expect(obj.assetId).toBeTruthy();
      expect(typeof obj.assetId).toBe('string');
      expect(obj.mimeType).toMatch(/^image\//);
    }
  });

  test('should center the image in the viewport', async ({ editorPage }) => {
    await selectImageFile(editorPage);
    await editorPage.clearSelection();

    const objects = await editorPage.getAllObjects<any>();
    const image = objects[0];

    // Convert the screen-space viewport center to world coordinates
    const bbox = await editorPage.getEngineBoundingBox();
    const viewportCenter = await editorPage.screenToWorld(bbox.width / 2, bbox.height / 2);

    const imageCenterX = image.translateX + image.width / 2;
    const imageCenterY = image.translateY + image.height / 2;

    // Allow tolerance — compression may resize, and centering is approximate
    expect(imageCenterX).toBeCloseTo(viewportCenter.x, -1);
    expect(imageCenterY).toBeCloseTo(viewportCenter.y, -1);
  });

  test('should switch to selection tool after image placement', async ({ editorPage }) => {
    await selectImageFile(editorPage);

    const isSelection = await editorPage.isToolActive('selection');
    expect(isSelection).toBe(true);
  });

  test('should switch to selection tool when file chooser is cancelled', async ({ editorPage }) => {
    const fileChooserPromise = editorPage.page.waitForEvent('filechooser');
    await editorPage.activateTool('image');
    const fileChooser = await fileChooserPromise;

    // Cancel by setting no files
    await fileChooser.setFiles([]);

    // Wait for the cancel handler to process
    await editorPage.page.waitForTimeout(200);

    const isSelection = await editorPage.isToolActive('selection');
    expect(isSelection).toBe(true);

    const count = await editorPage.getObjectsTotalCount();
    expect(count).toBe(0);
  });

  test('visual: image added via image tool', async ({ editorPage }) => {
    await selectImageFile(editorPage);
    await editorPage.clearSelection();

    await expect(editorPage.engine).toHaveScreenshot({ maxDiffPixelRatio: 0.05 });
  });
});
