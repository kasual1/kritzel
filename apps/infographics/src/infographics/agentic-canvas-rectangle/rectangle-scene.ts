import { UpdrawShape, ShapeType, type HTMLUpdrawEditorElement } from '@updraw/react-editor';
import { frame, removeAgents, typePrompt, wait, type Box } from '../agentic-canvas/hero-scene';

/**
 * The agentic canvas at its simplest: the editor starts with an empty chat box, the prompt "Please add a rectangle" is
 * typed, and a rectangle is added in the middle of the view with `editor.addObjects()`, so it plays Updraw's appear
 * animation. 1.5 seconds later it is removed again. Scripted, so every recording is the same.
 */

const PROMPT = 'Please add a rectangle';

/** How long the empty editor shows before the prompt is typed. */
const OPENING_PAUSE = 1200;

/** How long the chat box's loading ring runs before the rectangle is added. */
const THINKING_TIME = 600;

/** How long the rectangle stays before it is removed. */
const CLEAR_DELAY = 1500;

const RECTANGLE_WIDTH = 240;
const RECTANGLE_HEIGHT = 160;
const RECTANGLE_BOX: Box = {
  x: -RECTANGLE_WIDTH / 2,
  y: -RECTANGLE_HEIGHT / 2,
  width: RECTANGLE_WIDTH,
  height: RECTANGLE_HEIGHT,
};

function createRectangle(): UpdrawShape {
  return new UpdrawShape({
    shapeType: ShapeType.Rectangle,
    translateX: RECTANGLE_BOX.x,
    translateY: RECTANGLE_BOX.y,
    width: RECTANGLE_BOX.width,
    height: RECTANGLE_BOX.height,
    fillColor: { light: '#e3f2fd', dark: '#1a237e' },
    strokeColor: { light: '#1565c0', dark: '#90caf9' },
    strokeWidth: 3,
  });
}

/** Plays the scene once. `setWorking` drives the chat box's loading ring from the sent prompt until the rectangle is added. */
export async function playRectangleScene(
  editor: HTMLUpdrawEditorElement,
  setWorking: (isWorking: boolean) => void,
  signal: AbortSignal,
): Promise<void> {
  await removeAgents(editor);
  // The rectangle sits in the middle of the whole view, not of the area above the chat box.
  await frame(editor, RECTANGLE_BOX, 0, signal, true);
  await wait(OPENING_PAUSE, signal);

  await typePrompt(editor, PROMPT, signal);
  setWorking(true);
  await wait(THINKING_TIME, signal);
  const [rectangle] = await editor.addObjects([createRectangle()]);
  setWorking(false);

  await wait(CLEAR_DELAY, signal);
  await editor.removeObjects([rectangle]);
}
