// Renders the album covers in covers/*.svg to public/covers/*.png, which the agentic canvas hero shows.
// Run it after changing a cover: npm run covers -w apps/infographics
// Set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH to use a Chromium that Playwright did not install itself.
import { readdir, readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

/** Width and height of each PNG in pixels: sharp at twice the largest size the hero shows a cover at. */
const SIZE = 600;

const app = fileURLToPath(new URL('../', import.meta.url));
const sourceDir = `${app}covers/`;
const outputDir = `${app}public/covers/`;

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined });
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });

for (const file of (await readdir(sourceDir)).filter(name => name.endsWith('.svg')).sort()) {
  const svg = await readFile(`${sourceDir}${file}`, 'utf8');
  await page.setContent(
    `<!doctype html><style>html, body { margin: 0; } svg { display: block; width: ${SIZE}px; height: ${SIZE}px; }</style>${svg}`,
  );
  const output = `${outputDir}${file.replace(/\.svg$/, '.png')}`;
  await page.locator('svg').screenshot({ path: output });
  console.log(`Rendered ${output}`);
}

await browser.close();
