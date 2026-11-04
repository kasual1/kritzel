import {
  KritzelIframeObject,
  KritzelLine,
  KritzelShape,
  KritzelText,
  ShapeType,
  type HTMLKritzelEditorElement,
  type KritzelBaseObject,
} from '@kritzel/react-editor';

/**
 * The hero of the "What is an agentic canvas?" post: four agents build a small product launch board at the same time.
 * Everything is scripted, so every recording is the same. Coordinates are world units around the origin.
 */

interface Agent {
  id: string;
  name: string;
  color: string;
  /** Where the cursor flies in from, outside the first view. */
  start: { x: number; y: number };
}

const RESEARCH: Agent = { id: 'research', name: 'Research', color: '#E11D48', start: { x: -760, y: -460 } };
const FLOW: Agent = { id: 'flow', name: 'Flow', color: '#7C3AED', start: { x: 760, y: -460 } };
const COPY: Agent = { id: 'copy', name: 'Copy', color: '#0891B2', start: { x: -760, y: 420 } };
const DESIGN: Agent = { id: 'design', name: 'Design', color: '#EA580C', start: { x: 760, y: 420 } };
const AGENTS = [RESEARCH, FLOW, COPY, DESIGN];

const PROMPT = 'Plan our product launch';

/** Pause between typed prompt characters, in milliseconds. */
const TYPING_DELAY = 45;

/** How long a cursor takes to reach the spot where it places the next object. */
const MOVE = { duration: 700, easing: 'ease-in-out' as const };

const INK = { light: '#1c1917', dark: '#f5f5f4' };

function paragraph(text: string) {
  return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] };
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    }, { once: true });
  });
}

function stickyNote(text: string, x: number, y: number, rotation: number): KritzelShape {
  const note = new KritzelShape({
    translateX: x,
    translateY: y,
    width: 150,
    height: 110,
    rotation,
    shapeType: ShapeType.Rectangle,
    fillColor: { light: '#FDE68A', dark: '#A16207' },
    strokeColor: { light: '#FDE68A', dark: '#A16207' },
    strokeWidth: 0,
    fontSize: 17,
    fontColor: INK,
  });
  note.setContent(paragraph(text));
  return note;
}

function flowStep(text: string, x: number, y: number): KritzelShape {
  const step = new KritzelShape({
    translateX: x,
    translateY: y,
    width: 130,
    height: 60,
    shapeType: ShapeType.Rectangle,
    fillColor: { light: '#EDE9FE', dark: '#4C1D95' },
    strokeColor: { light: '#7C3AED', dark: '#C4B5FD' },
    strokeWidth: 3,
    fontSize: 16,
    fontColor: INK,
  });
  step.setContent(paragraph(text));
  return step;
}

function arrow(from: KritzelShape, to: KritzelShape): KritzelLine {
  return new KritzelLine({
    startX: from.translateX + from.width,
    startY: from.translateY + from.height / 2,
    endX: to.translateX,
    endY: to.translateY + to.height / 2,
    startAnchor: { objectId: from.id },
    endAnchor: { objectId: to.id },
    stroke: { light: '#7C3AED', dark: '#C4B5FD' },
    strokeWidth: 3,
    arrows: { end: { enabled: true } },
  });
}

const LANDING_CARD = {
  html: `<main>
  <div class="logo"></div>
  <h1>Draw together.</h1>
  <p>One canvas for your whole team.</p>
  <button type="button">Get started</button>
</main>`,
  css: `html, body { height: 100%; margin: 0; }
body { display: grid; place-items: center; font-family: system-ui, sans-serif; background: #FFF7ED; color: #1c1917; }
main { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }
.logo { width: 36px; height: 36px; border-radius: 10px; background: #EA580C; }
h1 { margin: 4px 0 0; font-size: 26px; }
p { margin: 0; color: #78716c; font-size: 14px; }
button { margin-top: 6px; padding: 9px 18px; border: 0; border-radius: 999px; background: #1c1917; color: #fff; font: 600 14px system-ui, sans-serif; }`,
  script: '',
};

/** Places an object a moment after its agent's cursor has arrived, so it looks as if the cursor put it there. */
async function place(editor: HTMLKritzelEditorElement, agent: Agent, object: KritzelBaseObject, signal: AbortSignal) {
  await editor.moveAgenticCursor(agent.id, { x: object.translateX + 12, y: object.translateY + 12 }, MOVE);
  await wait(180, signal);
  await editor.addObject(object);
  await wait(320, signal);
}

async function runResearch(editor: HTMLKritzelEditorElement, signal: AbortSignal) {
  await wait(200, signal);
  await place(editor, RESEARCH, stickyNote('Faster setup', -560, -330, -3), signal);
  await place(editor, RESEARCH, stickyNote('Dark mode', -390, -310, 2), signal);
  await place(editor, RESEARCH, stickyNote('More templates', -480, -180, -1), signal);
  await editor.moveAgenticCursor(RESEARCH.id, { x: -300, y: -120 }, MOVE);
}

async function runFlow(editor: HTMLKritzelEditorElement, signal: AbortSignal) {
  await wait(500, signal);
  const signUp = flowStep('Sign up', 130, -310);
  const template = flowStep('Pick a template', 310, -310);
  const share = flowStep('Share', 490, -310);
  await place(editor, FLOW, signUp, signal);
  await place(editor, FLOW, template, signal);
  await editor.addObject(arrow(signUp, template));
  await place(editor, FLOW, share, signal);
  await editor.addObject(arrow(template, share));
  await editor.moveAgenticCursor(FLOW.id, { x: 600, y: -220 }, MOVE);
}

async function runCopy(editor: HTMLKritzelEditorElement, signal: AbortSignal) {
  await wait(900, signal);
  await place(editor, COPY, new KritzelText({ text: 'Draw together.', translateX: -560, translateY: 20, fontSize: 44, fontColor: INK }), signal);
  await place(
    editor,
    COPY,
    new KritzelText({ text: 'One canvas for your whole team.', translateX: -560, translateY: 96, fontSize: 20, fontColor: { light: '#57534e', dark: '#d6d3d1' } }),
    signal,
  );
  await editor.moveAgenticCursor(COPY.id, { x: -150, y: 40 }, MOVE);
}

async function runDesign(editor: HTMLKritzelEditorElement, signal: AbortSignal) {
  await wait(1300, signal);
  const card = new KritzelIframeObject({
    title: 'Landing page',
    content: LANDING_CARD,
    translateX: 180,
    translateY: -150,
    width: 340,
    height: 220,
    borderRadius: 14,
    boxShadow: '0 1px 2px rgba(20, 18, 31, 0.06), 0 12px 32px -12px rgba(20, 18, 31, 0.22)',
  });
  await place(editor, DESIGN, card, signal);
  await editor.moveAgenticCursor(DESIGN.id, { objectId: card.id, anchor: 'bottom-right', offset: { x: -30, y: -30 } }, MOVE);
}

/** Types the prompt into the chat box as if a person wrote it. */
async function typePrompt(editor: HTMLKritzelEditorElement, signal: AbortSignal) {
  const chatBox = editor.querySelector('kritzel-chat-box');
  if (!chatBox) {
    return;
  }
  for (let length = 1; length <= PROMPT.length; length++) {
    chatBox.value = PROMPT.slice(0, length);
    await wait(TYPING_DELAY, signal);
  }
  await wait(400, signal);
  chatBox.value = '';
}

/**
 * Plays the scene once: the prompt is typed, the four agents build their parts of the board in parallel, and the
 * camera pulls back to show the result. `setWorking` drives the chat box's loading ring.
 */
export async function playHeroScene(
  editor: HTMLKritzelEditorElement,
  setWorking: (isWorking: boolean) => void,
  signal: AbortSignal,
): Promise<void> {
  await editor.clearAgenticCursors();
  // Opens on the area the board will cover, slightly zoomed in, so the final pull back stays small.
  await editor.setViewport(20, -90, 1.05);
  await wait(600, signal);

  await typePrompt(editor, signal);
  setWorking(true);

  for (const agent of AGENTS) {
    await editor.addAgenticCursor({ id: agent.id, name: agent.name, color: agent.color, position: agent.start });
  }
  await Promise.all([
    runResearch(editor, signal),
    runFlow(editor, signal),
    runCopy(editor, signal),
    runDesign(editor, signal),
  ]);

  setWorking(false);
  await wait(300, signal);
  await editor.centerAllObjects(true);
}
