import { KritzelAgent, type HTMLKritzelEditorElement } from '@kritzel/react-editor';
import { coverImage } from '../agentic-canvas/album-covers';
import { COVER_AGENT, coverContent, frame, generatePage, removeAgents, typePrompt, wait, type Box } from '../agentic-canvas/hero-scene';

/**
 * Generative UI on the agentic canvas, in its shortest form: one prompt in the chat box adds a new album cover in the
 * middle of the canvas. The Covers agent places the cover with `agent.addObject()`, so the cover is its change, but its
 * cursor stays hidden: the page shows no agentic cursors. Everything is scripted, so every recording is the same.
 */

/**
 * A cover of its own, not one of the four from the agentic canvas page: a night skyline under the moon, crossed by a
 * sound wave. Its source is covers/midnight-skyline.svg.
 */
const NEW_COVER = coverImage('midnight-skyline.png');

const PROMPT = 'Please generate a new album cover';

/** How long the empty canvas shows before the prompt is typed. */
const OPENING_PAUSE = 1200;

/** How long the cover shows the glare placeholder before its image appears. */
const WRITING_TIME = 1400;

/** How long the finished cover stays before every object is removed. */
const CLEAR_DELAY = 1500;

const COVER_SIZE = 320;
const COVER_BOX: Box = { x: -COVER_SIZE / 2, y: -COVER_SIZE / 2, width: COVER_SIZE, height: COVER_SIZE };

/** Plays the scene once. `setWorking` drives the chat box's loading ring while the cover is generated. */
export async function playAlbumCoverScene(
  editor: HTMLKritzelEditorElement,
  setWorking: (isWorking: boolean) => void,
  signal: AbortSignal,
): Promise<void> {
  await removeAgents(editor);
  await frame(editor, COVER_BOX, 0, signal);
  await wait(OPENING_PAUSE, signal);

  await typePrompt(editor, PROMPT, signal);
  setWorking(true);
  // The cover fades in while it rises into place, and the image fades in over the placeholder once it is done. The
  // cursor is hidden, so the action runs without animation.
  const covers = await editor.addAgent(new KritzelAgent({ ...COVER_AGENT, visible: false }));
  await generatePage(
    editor,
    covers,
    { box: COVER_BOX, content: coverContent(NEW_COVER), writingTime: WRITING_TIME, title: 'Album cover', borderRadius: 12 },
    signal,
    { instant: true },
  );
  setWorking(false);

  await wait(CLEAR_DELAY, signal);
  await editor.removeAgent(covers);
  await editor.removeObjects(await editor.getAllObjects());
}
