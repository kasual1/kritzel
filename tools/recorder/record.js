require('dotenv').config();
const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('@playwright/test');
const { installRecorderCursor } = require('./cursor');

const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;
const DEFAULT_OUT_DIR = path.join(__dirname, 'recordings');
const PROFILE_DIR = path.join(__dirname, '.profile');

function getArgValue(name) {
	const prefix = `--${name}=`;
	const found = process.argv.find((arg) => arg.startsWith(prefix));
	return found ? found.slice(prefix.length) : undefined;
}

function hasFlag(name) {
	return process.argv.includes(`--${name}`);
}

function toDimension(value, fallback, label) {
	if (!value) {
		return fallback;
	}

	const parsed = Number.parseInt(value, 10);
	if (Number.isNaN(parsed) || parsed <= 0 || String(parsed) !== value) {
		throw new Error(`Invalid ${label} "${value}". Use a positive integer.`);
	}

	return parsed;
}

function toUrl(value) {
	if (!value) {
		throw new Error('Missing --url. Example: npm run record -- --url=https://app.kritzel.io');
	}

	try {
		return new URL(value).toString();
	} catch {
		throw new Error(`Invalid url "${value}".`);
	}
}

function defaultName() {
	return new Date().toISOString().replace(/[:.]/g, '-');
}

(async function record() {
	let context;
	let tempDir;

	try {
		const url = toUrl(getArgValue('url'));
		const width = toDimension(getArgValue('width'), DEFAULT_WIDTH, 'width');
		const height = toDimension(getArgValue('height'), DEFAULT_HEIGHT, 'height');
		const name = getArgValue('name') || defaultName();
		const outDir = path.resolve(getArgValue('out') || DEFAULT_OUT_DIR);
		const withCursor = !hasFlag('no-cursor');
		const fresh = hasFlag('fresh');
		const headless = hasFlag('headless');

		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kritzel-recorder-'));
		const profileDir = fresh ? path.join(tempDir, 'profile') : PROFILE_DIR;
		const videoDir = path.join(tempDir, 'video');

		context = await chromium.launchPersistentContext(profileDir, {
			headless,
			// We handle stop signals ourselves so the video can be finalized before exit.
			handleSIGINT: false,
			handleSIGTERM: false,
			handleSIGHUP: false,
			viewport: { width, height },
			deviceScaleFactor: 1,
			// Without an explicit size Playwright scales the video down to fit 800x800.
			recordVideo: { dir: videoDir, size: { width, height } },
		});

		if (withCursor) {
			await context.addInitScript(installRecorderCursor);
		}

		const page = context.pages()[0] || (await context.newPage());
		const video = page.video();

		const stopped = new Promise((resolve) => {
			page.once('close', resolve);
			context.once('close', resolve);
			// Keep listening (not once) so a repeated Ctrl+C doesn't kill us mid-save.
			process.on('SIGINT', resolve);
			process.on('SIGTERM', resolve);
		});

		await page.goto(url, { waitUntil: 'load' });

		console.log(`Recording ${url} at ${width}x${height}${withCursor ? ' with cursor' : ''}.`);
		console.log('Close the browser window or press Ctrl+C to stop.');

		await stopped;
		await context.close().catch(() => {});

		fs.mkdirSync(outDir, { recursive: true });
		const target = path.join(outDir, `${name}.webm`);
		// The browser may already be gone (window closed by the user), so copy the
		// finished file instead of using video.saveAs(), which needs a live connection.
		fs.copyFileSync(await video.path(), target);

		console.log(`Saved ${target} (${width}x${height})`);
	} catch (error) {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
		if (context) {
			await context.close().catch(() => {});
		}
	} finally {
		if (tempDir) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	}
})();
