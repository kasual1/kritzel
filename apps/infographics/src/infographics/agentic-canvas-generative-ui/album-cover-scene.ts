import { KritzelIframeObject, type HTMLKritzelEditorElement } from '@kritzel/react-editor';
import { ALBUM_COVERS } from '../agentic-canvas/album-covers';
import { SHADOW, SKELETON, coverContent, frame, typePrompt, wait, type Box } from '../agentic-canvas/hero-scene';

/**
 * Generative UI on the agentic canvas, in its shortest form: one prompt in the chat box adds a new album cover in the
 * middle of the canvas. No agentic cursors. Everything is scripted, so every recording is the same.
 */

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
  await editor.clearAgenticCursors();
  await frame(editor, COVER_BOX, 0, signal);
  await wait(OPENING_PAUSE, signal);

  await typePrompt(editor, PROMPT, signal);
  setWorking(true);
  const cover = await editor.addObject(
    new KritzelIframeObject({
      title: 'Album cover',
      content: coverContent(ALBUM_COVERS[0].image),
      loadingContent: SKELETON,
      isLoading: true,
      translateX: COVER_BOX.x,
      translateY: COVER_BOX.y,
      width: COVER_BOX.width,
      height: COVER_BOX.height,
      borderRadius: 12,
      boxShadow: SHADOW,
    }),
  );
  await wait(WRITING_TIME, signal);
  cover?.setLoading(false);
  setWorking(false);

  await wait(CLEAR_DELAY, signal);
  await editor.removeObjects(await editor.getAllObjects());
}
