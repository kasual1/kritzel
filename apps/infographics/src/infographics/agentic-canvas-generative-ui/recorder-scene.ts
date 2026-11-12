import { KritzelAgent, type HTMLKritzelEditorElement } from '@kritzel/react-editor';
import { RECORDER, STUDIO_AGENT, frame, generatePage, removeAgents, typePrompt, wait, type Box } from '../agentic-canvas/hero-scene';

/**
 * Generative UI on the agentic canvas, in its shortest form: one prompt in the chat box adds the recorder widget of the
 * agentic canvas post in the middle of the canvas. The Studio agent places the widget with `agent.addObject()`, so the
 * widget is its change, but its cursor stays hidden: the page shows no agentic cursors. Everything is scripted, so
 * every recording is the same.
 */

const PROMPT = 'Please generate a recorder widget';

/** How long the empty canvas shows before the prompt is typed. */
const OPENING_PAUSE = 1200;

/** How long the widget shows the engine's loading placeholder before its content appears. */
const WRITING_TIME = 1400;

/** How long the finished widget stays before every object is removed. */
const CLEAR_DELAY = 1500;

/** The same size as the recorder widget in the agentic cursors infographic. */
const WIDGET_WIDTH = 360;
const WIDGET_HEIGHT = 116;
const WIDGET_BOX: Box = { x: -WIDGET_WIDTH / 2, y: -WIDGET_HEIGHT / 2, width: WIDGET_WIDTH, height: WIDGET_HEIGHT };

/** Plays the scene once. `setWorking` drives the chat box's loading ring while the widget is generated. */
export async function playRecorderScene(
  editor: HTMLKritzelEditorElement,
  setWorking: (isWorking: boolean) => void,
  signal: AbortSignal,
): Promise<void> {
  await removeAgents(editor);
  await frame(editor, WIDGET_BOX, 0, signal);
  await wait(OPENING_PAUSE, signal);

  await typePrompt(editor, PROMPT, signal);
  setWorking(true);
  // The widget appears (Kritzel's appear animation), and its content shows once the loading placeholder is gone. The
  // cursor is hidden, so the action runs without the cursor's animation.
  const studio = await editor.addAgent(new KritzelAgent({ ...STUDIO_AGENT, visible: false }));
  await generatePage(
    studio,
    { box: WIDGET_BOX, content: RECORDER, writingTime: WRITING_TIME, title: STUDIO_AGENT.name, borderRadius: 14 },
    signal,
    { instant: true },
  );
  setWorking(false);

  await wait(CLEAR_DELAY, signal);
  await editor.removeAgent(studio);
  await editor.removeObjects(await editor.getAllObjects());
}
