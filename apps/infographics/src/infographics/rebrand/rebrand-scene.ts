import type { HTMLUpmadeEditorElement } from '@upmade/react-editor';
import { frame, union, wait, type Box } from '../agentic-canvas/hero-scene';
import { createRebrandObjects } from './rebrand-objects';

/**
 * Kritzel is now Upmade, built up step by step: the Kritzel logo appears in the middle of the view, then the camera
 * glides right as the arrow is added, and again as the Upmade logo is added, so what is on the canvas always stays
 * centered. Each object is added with `editor.addObjects()`, so it plays Upmade's appear animation. 1.5 seconds
 * after the Upmade logo is added, all three are removed again.
 */

/** How long the empty canvas shows before the Kritzel logo is added. */
const OPENING_PAUSE = 600;

/** Pause after each object is added, before the camera moves on to the next one. */
const STEP_PAUSE = 700;

/** How long the camera takes to glide to the next object. */
const GLIDE_DURATION = 600;

/** How long the finished scene stays before every object is removed again. */
const CLEAR_DELAY = 1500;

/**
 * A box the size of `size`, centered on `content`. Framing it keeps the zoom the same in every step (the zoom that
 * fits the whole scene) while the camera follows what is on the canvas.
 */
function centeredOn(content: Box, size: Box): Box {
  return {
    x: content.x + content.width / 2 - size.width / 2,
    y: content.y + content.height / 2 - size.height / 2,
    width: size.width,
    height: size.height,
  };
}

/** Plays the scene once. */
export async function playRebrandScene(editor: HTMLUpmadeEditorElement, signal: AbortSignal): Promise<void> {
  const { kritzel, arrow, upmade } = createRebrandObjects();
  const scene = union([kritzel.box, arrow.box, upmade.box]);

  await frame(editor, centeredOn(kritzel.box, scene), 0, signal, true);
  await wait(OPENING_PAUSE, signal);
  const [kritzelOnCanvas] = await editor.addObjects([kritzel.object]);
  await wait(STEP_PAUSE, signal);

  // The camera starts moving as the arrow appears.
  const arrowAdded = editor.addObjects([arrow.object]);
  await frame(editor, centeredOn(union([kritzel.box, arrow.box]), scene), GLIDE_DURATION, signal, true);
  const [arrowOnCanvas] = await arrowAdded;
  await wait(STEP_PAUSE, signal);

  const upmadeAdded = editor.addObjects([upmade.object]);
  await frame(editor, scene, GLIDE_DURATION, signal, true);
  const [upmadeOnCanvas] = await upmadeAdded;

  await wait(CLEAR_DELAY, signal);
  await editor.removeObjects([kritzelOnCanvas, arrowOnCanvas, upmadeOnCanvas]);
}
