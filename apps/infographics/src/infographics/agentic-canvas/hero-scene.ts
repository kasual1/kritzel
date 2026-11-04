import { KritzelIframeObject, type HTMLKritzelEditorElement, type KritzelIframeContent } from '@kritzel/react-editor';
import { ALBUM_COVERS } from './album-covers';

/**
 * The hero of the "What is an agentic canvas?" post. A musician asks three agents for help with the release of their
 * jazz song "Full Control": one builds a recording widget, one draws four album covers, one writes a social media post.
 * Each prompt is typed into the chat box, and the camera follows the agent that starts working.
 * Everything is scripted, so every recording is the same. Coordinates are world units around the origin.
 */

interface Agent {
  id: string;
  name: string;
  color: string;
}

const COVER_AGENT: Agent = { id: 'covers', name: 'Covers', color: '#D9572B' };
const SOCIAL_AGENT: Agent = { id: 'social', name: 'Social', color: '#7C3AED' };
const STUDIO_AGENT: Agent = { id: 'studio', name: 'Studio', color: '#0891B2' };

/** In the order they are typed: the recording widget first, then the covers, then the social media post. */
const PROMPTS = {
  studio: 'Please add a small widget that allows me to record my jazz song "Full Control"',
  covers: 'Help me create a new cover album for the song',
  social: 'Please craft a featured post for social media, that talks about the release of the new song',
};

/** Pause between typed prompt characters, in milliseconds. */
const TYPING_DELAY = 22;

/** Screen pixels kept free at the bottom of the view for the chat box, so the camera never frames work behind it. */
const CHAT_BOX_SPACE = 150;

/** Length of one animated `setViewport` call, see `frame`. */
const VIEWPORT_STEP = 150;

/** The covers form a square of two rows and two columns in the middle of the canvas. */
const COVER_SIZE = 200;
const COVER_GAP = 24;
const COVER_COLUMNS = 2;
const COVERS_ORIGIN = -(COVER_COLUMNS * COVER_SIZE + (COVER_COLUMNS - 1) * COVER_GAP) / 2;

/**
 * The work goes from left to right: the widget left of the covers and the post right of them, both vertically centered
 * on the square.
 */
const STUDIO_BOX = { x: -640, y: -58, width: 360, height: 116 };
const SOCIAL_BOX = { x: 300, y: -215, width: 300, height: 430 };

const SHADOW = '0 1px 2px rgba(20, 18, 31, 0.06), 0 12px 32px -12px rgba(20, 18, 31, 0.22)';

/** A grey surface with a soft glare sweeping across it, shown while an agent writes a page. */
const SKELETON: KritzelIframeContent = {
  html: '<div class="skeleton" aria-busy="true"></div>',
  css: `html, body { height: 100%; margin: 0; }
.skeleton { height: 100%; background: linear-gradient(100deg, #ececec 30%, #f7f7f7 50%, #ececec 70%) #ececec;
  background-size: 300% 100%; animation: glare 1.4s ease-in-out infinite; }
@keyframes glare { from { background-position: 100% 0; } to { background-position: 0 0; } }`,
  script: '',
};

function coverContent(svg: string): KritzelIframeContent {
  return {
    html: `<svg viewBox="0 0 100 100" role="img" aria-label="Album cover of Full Control">${svg}</svg>`,
    css: 'html, body { height: 100%; margin: 0; overflow: hidden; } svg { display: block; width: 100%; height: 100%; }',
    script: '',
  };
}

const SOCIAL_POST: KritzelIframeContent = {
  html: `<article>
  <header>
    <div class="avatar">LM</div>
    <div><strong>Luca Moulin Beau</strong><span>@lucamoulinbeau · now</span></div>
  </header>
  <p>My new single <b>Full Control</b> is out this Friday. Late nights, a tenor sax and a lot of heart. Pre-save it now!</p>
  <svg class="cover" viewBox="0 0 100 100">${ALBUM_COVERS[0].svg}</svg>
  <footer><span>♥ 1.2k</span><span>↻ 318</span><span>💬 64</span></footer>
</article>`,
  css: `html, body { height: 100%; margin: 0; }
body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #1c1917; background: #ffffff; }
article { display: flex; flex-direction: column; gap: 12px; height: 100%; padding: 18px; box-sizing: border-box; }
header { display: flex; align-items: center; gap: 10px; }
header div:last-child { display: flex; flex-direction: column; font-size: 14px; }
header span { color: #78716c; font-size: 12px; }
.avatar { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: #1c1917;
  color: #f5ecd7; font-size: 14px; font-weight: 700; }
p { margin: 0; font-size: 14px; line-height: 1.45; }
.cover { display: block; width: 100%; height: auto; border-radius: 12px; }
footer { display: flex; gap: 18px; color: #78716c; font-size: 13px; }`,
  script: '',
};

/**
 * Bar heights of the recorded take, from 0 to 1: a few overlapping phrases with some grain, so it reads like a real
 * recording rather than a regular pattern. Deterministic, so every recording of the scene is the same.
 */
const WAVE_LEVELS = Array.from({ length: 64 }, (_, i) => {
  const t = i / 63;
  const phrases = 0.55 + 0.45 * Math.sin(t * Math.PI * 3.2 + 0.4) * Math.sin(t * Math.PI * 1.3 + 0.9);
  const grain = 0.5 + 0.5 * Math.sin(i * 2.71 + Math.sin(i * 1.37) * 3);
  const fade = Math.min(1, t * 6, (1 - t) * 8);
  return Math.max(0.08, Math.min(1, (0.25 + 0.75 * phrases * (0.55 + 0.45 * grain)) * fade));
});

const RECORDER: KritzelIframeContent = {
  html: `<main>
  <header>
    <div>
      <strong>Full Control</strong>
      <span>New recording</span>
    </div>
    <span class="time"><i></i>00:12</span>
  </header>
  <div class="take">
    <button type="button" aria-label="Stop recording"><span></span></button>
    <div class="wave">${WAVE_LEVELS.map((level, i) => `<b style="height:${Math.round(level * 100)}%;animation-duration:${(0.7 + (i % 5) * 0.13).toFixed(2)}s;animation-delay:-${((i * 0.37) % 1).toFixed(2)}s"></b>`).join('')}</div>
  </div>
</main>`,
  css: `html, body { height: 100%; margin: 0; }
body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #18181b; background: #f4f4f5; }
main { display: flex; flex-direction: column; justify-content: center; gap: 12px; height: 100%; padding: 14px 18px;
  box-sizing: border-box; }
header { display: flex; align-items: center; justify-content: space-between; }
header div { display: flex; align-items: baseline; gap: 8px; }
strong { font-size: 15px; font-weight: 600; }
header span { color: #71717a; font-size: 12px; }
.time { display: flex; align-items: center; gap: 6px; color: #18181b !important; font-variant-numeric: tabular-nums; }
.time i { width: 6px; height: 6px; border-radius: 50%; background: #ef4444; animation: blink 1.2s ease-in-out infinite; }
.take { display: flex; align-items: center; gap: 14px; }
button { display: grid; place-items: center; flex-shrink: 0; width: 38px; height: 38px; border: 0; border-radius: 50%;
  background: #ffffff; box-shadow: 0 1px 3px rgba(24, 24, 27, 0.12); }
button span { width: 12px; height: 12px; border-radius: 3px; background: #ef4444; }
.wave { display: flex; align-items: center; justify-content: space-between; flex: 1; height: 36px; }
.wave b { width: 2px; border-radius: 1px; background: #a1a1aa; transform-origin: center;
  animation: level ease-in-out infinite alternate; }
@keyframes level { from { transform: scaleY(0.75); } to { transform: scaleY(1); } }
@keyframes blink { 50% { opacity: 0.3; } }`,
  script: '',
};

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    }, { once: true });
  });
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function union(boxes: Box[]): Box {
  const left = Math.min(...boxes.map(box => box.x));
  const top = Math.min(...boxes.map(box => box.y));
  const right = Math.max(...boxes.map(box => box.x + box.width));
  const bottom = Math.max(...boxes.map(box => box.y + box.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * Moves the camera smoothly so the box fills the view above the chat box, with some room around it, never zooming
 * in past `maxScale`.
 */
async function frame(editor: HTMLKritzelEditorElement, box: Box, duration: number, signal: AbortSignal, maxScale = 1) {
  const view = await editor.getViewport();
  const visibleHeight = view.height - CHAT_BOX_SPACE;
  const scale = Math.min(view.width / (box.width * 1.2), visibleHeight / (box.height * 1.2), maxScale);
  // The box is centered in the area above the chat box, so the view's center sits a bit below the box's center.
  const target = { x: box.x + box.width / 2, y: box.y + box.height / 2 + CHAT_BOX_SPACE / 2 / scale, scale };
  const from = { x: (view.width / 2 - view.translateX) / view.scale, y: (view.height / 2 - view.translateY) / view.scale, scale: view.scale };

  // setViewport animates for 150 ms and cancels the previous animation, so the path is walked in steps of that length.
  const steps = Math.max(1, Math.round(duration / VIEWPORT_STEP));
  for (let step = 1; step <= steps; step++) {
    const k = easeInOut(step / steps);
    await editor.setViewport(from.x + (target.x - from.x) * k, from.y + (target.y - from.y) * k, from.scale + (target.scale - from.scale) * k);
    await wait(VIEWPORT_STEP, signal);
  }
}

/** Types a prompt into the chat box as a person would, then sends it. */
async function typePrompt(editor: HTMLKritzelEditorElement, prompt: string, signal: AbortSignal) {
  const chatBox = editor.querySelector('kritzel-chat-box');
  const textarea = chatBox?.shadowRoot?.querySelector('textarea');
  if (!chatBox || !textarea) {
    return;
  }
  textarea.focus();
  for (let length = 1; length <= prompt.length; length++) {
    chatBox.value = prompt.slice(0, length);
    await wait(TYPING_DELAY, signal);
  }
  await wait(450, signal);
  chatBox.value = '';
  textarea.blur();
}

/** Adds a page that shows the glare placeholder first and its content once the agent is "done writing" it. */
async function generatePage(
  editor: HTMLKritzelEditorElement,
  agent: Agent,
  box: Box,
  content: KritzelIframeContent,
  writingTime: number,
  signal: AbortSignal,
  borderRadius = 14,
) {
  await editor.moveAgenticCursor(agent.id, { x: box.x + 16, y: box.y + 16 }, { duration: 650 });
  const page = new KritzelIframeObject({
    title: agent.name,
    content,
    loadingContent: SKELETON,
    isLoading: true,
    translateX: box.x,
    translateY: box.y,
    width: box.width,
    height: box.height,
    borderRadius,
    boxShadow: SHADOW,
  });
  const added = await editor.addObject(page);
  await editor.moveAgenticCursor(agent.id, { x: box.x + box.width - 24, y: box.y + box.height - 24 }, { duration: writingTime });
  added?.setLoading(false);
  await wait(250, signal);
}

function coverBox(index: number): Box {
  const column = index % COVER_COLUMNS;
  const row = Math.floor(index / COVER_COLUMNS);
  return {
    x: COVERS_ORIGIN + column * (COVER_SIZE + COVER_GAP),
    y: COVERS_ORIGIN + row * (COVER_SIZE + COVER_GAP),
    width: COVER_SIZE,
    height: COVER_SIZE,
  };
}

async function createCovers(editor: HTMLKritzelEditorElement, signal: AbortSignal) {
  await editor.addAgenticCursor({ id: COVER_AGENT.id, name: COVER_AGENT.name, color: COVER_AGENT.color, position: { x: -520, y: 420 } });
  for (const [index, cover] of ALBUM_COVERS.entries()) {
    await generatePage(editor, COVER_AGENT, coverBox(index), coverContent(cover.svg), 900, signal, 12);
  }
  const last = coverBox(ALBUM_COVERS.length - 1);
  await editor.moveAgenticCursor(COVER_AGENT.id, { x: last.x + last.width + 40, y: last.y + last.height / 2 }, { duration: 600 });
}

/** Moves the camera to an agent's work area, then lets the agent fly in from the left edge of the view and build it. */
async function runFollowedAgent(
  editor: HTMLKritzelEditorElement,
  agent: Agent,
  box: Box,
  content: KritzelIframeContent,
  signal: AbortSignal,
) {
  await frame(editor, box, 1100, signal);
  const view = await editor.getViewport();
  const left = -view.translateX / view.scale;
  await editor.addAgenticCursor({ id: agent.id, name: agent.name, color: agent.color, position: { x: left - 40, y: box.y + box.height / 2 } });
  await generatePage(editor, agent, box, content, 1500, signal);
  // Parks below the result's right edge, inside the final view.
  await editor.moveAgenticCursor(agent.id, { x: box.x + box.width - 50, y: box.y + box.height + 20 }, { duration: 500 });
}

/**
 * Plays the scene once. `setWorking` drives the chat box's loading ring, which stays on while any agent works.
 */
export async function playHeroScene(
  editor: HTMLKritzelEditorElement,
  setWorking: (isWorking: boolean) => void,
  signal: AbortSignal,
): Promise<void> {
  await editor.clearAgenticCursors();
  await frame(editor, STUDIO_BOX, 0, signal);
  await wait(700, signal);

  await typePrompt(editor, PROMPTS.studio, signal);
  setWorking(true);
  await runFollowedAgent(editor, STUDIO_AGENT, STUDIO_BOX, RECORDER, signal);

  await wait(500, signal);
  await typePrompt(editor, PROMPTS.covers, signal);
  await frame(editor, union(ALBUM_COVERS.map((_, index) => coverBox(index))), 1100, signal);
  const covers = createCovers(editor, signal);

  // The next prompt is written while the covers are still being drawn.
  await wait(2600, signal);
  await typePrompt(editor, PROMPTS.social, signal);
  await runFollowedAgent(editor, SOCIAL_AGENT, SOCIAL_BOX, SOCIAL_POST, signal);

  await covers;
  await wait(600, signal);
  setWorking(false);
  const covered = [...ALBUM_COVERS.map((_, index) => coverBox(index)), SOCIAL_BOX, STUDIO_BOX];
  await frame(editor, union(covered), 1600, signal);
}
