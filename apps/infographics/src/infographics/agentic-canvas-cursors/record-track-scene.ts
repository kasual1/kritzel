import { KritzelIframeObject, type HTMLKritzelEditorElement } from '@kritzel/react-editor';
import {
  BUTTON_PRESS_OFFSET,
  BUTTON_REST_OFFSET,
  EXIT_DURATION,
  RECORDER,
  RECORD_BUTTON_CENTER,
  SHADOW,
  STUDIO_AGENT,
  TAKE_HEIGHT,
  TAKES_GAP,
  act,
  addAgentAt,
  frame,
  removeAgents,
  takeContent,
  typePrompt,
  union,
  wait,
  type Box,
} from '../agentic-canvas/hero-scene';

/**
 * Agentic cursors on a generative UI page: the recorder widget of the agentic canvas post is already on the canvas. The
 * user asks for a new track, and Studio's cursor comes in, starts a recording with `agent.click()` on the record button,
 * stops it five seconds later with a second click, which saves one track below the widget, and leaves the view. The
 * widget and the track stay. Scripted, with no model calls, so every recording is the same.
 */

const PROMPT = 'Please record a new track';

/** The track the recording saves below the widget. */
const TRACK = { name: 'Track 1', duration: '0:05' };

const WIDGET_WIDTH = 360;
const WIDGET_HEIGHT = 116;
const TOTAL_HEIGHT = WIDGET_HEIGHT + TAKES_GAP + TAKE_HEIGHT;

/** The widget is centered on the origin together with the room for its track, so the view does not move later. */
const WIDGET_BOX: Box = { x: -WIDGET_WIDTH / 2, y: -TOTAL_HEIGHT / 2, width: WIDGET_WIDTH, height: WIDGET_HEIGHT };
const TRACK_BOX: Box = {
  x: WIDGET_BOX.x,
  y: WIDGET_BOX.y + WIDGET_BOX.height + TAKES_GAP,
  width: WIDGET_BOX.width,
  height: TAKE_HEIGHT,
};
const SCENE_BOX = union([WIDGET_BOX, TRACK_BOX]);

/** How long the recorder shows before the prompt is typed. */
const OPENING_PAUSE = 1500;
/** How long Studio records before it presses stop. */
const RECORDING_TIME = 5000;
/** How long Studio stays beside the button after the track is saved, before it leaves. */
const AFTER_STOP = 400;

/**
 * The recorder widget, part of the workspace's initial objects: it is on the canvas from the start, without the appear
 * animation of objects added later.
 */
export function createRecorderWidget(): KritzelIframeObject {
  return new KritzelIframeObject({
    title: STUDIO_AGENT.name,
    content: RECORDER,
    translateX: WIDGET_BOX.x,
    translateY: WIDGET_BOX.y,
    width: WIDGET_BOX.width,
    height: WIDGET_BOX.height,
    borderRadius: 14,
    boxShadow: SHADOW,
  });
}

/**
 * Plays the scene once, starting from the widget alone. `setWorking` drives the chat box's loading ring, which runs from
 * the sent prompt until the track is saved.
 */
export async function playRecordTrackScene(
  editor: HTMLKritzelEditorElement,
  widgetId: string,
  setWorking: (isWorking: boolean) => void,
  signal: AbortSignal,
): Promise<void> {
  await removeAgents(editor);
  await frame(editor, SCENE_BOX, 0, signal);
  await wait(OPENING_PAUSE, signal);

  await typePrompt(editor, PROMPT, signal);
  setWorking(true);

  const widget = await editor.getObjectById(widgetId);
  if (!(widget instanceof KritzelIframeObject)) {
    setWorking(false);
    return;
  }

  // Studio comes in from the top right corner of the view.
  const viewport = await editor.getViewport();
  const left = -viewport.translateX / viewport.scale;
  const top = -viewport.translateY / viewport.scale;
  const right = left + viewport.width / viewport.scale;
  const bottom = top + viewport.height / viewport.scale;
  const studio = await addAgentAt(editor, STUDIO_AGENT, { x: right + 40, y: top - 40 });

  // An object anchor on the record button. Studio rests just beside it while recording, so it never hides it.
  const button = (offset: { x: number; y: number }) => ({
    objectId: widget.id,
    anchor: 'top-left' as const,
    offset: { x: RECORD_BUTTON_CENTER.x + offset.x, y: RECORD_BUTTON_CENTER.y + offset.y },
  });
  // The click is Studio's; the widget answers it through its state, as its record button would.
  const press = async (recording: boolean) => {
    await act(studio.click(button(BUTTON_PRESS_OFFSET), { signal }));
    widget.setState({ recording, take: 1 });
    await studio.moveTo(button(BUTTON_REST_OFFSET), { duration: 380, easing: 'ease-in-out' });
  };

  await press(true);
  await wait(RECORDING_TIME, signal);
  await press(false);

  // Stopping saves the track: it appears below the widget (Kritzel's appear animation), added by the page, not Studio.
  await editor.addObjects([
    new KritzelIframeObject({
      title: TRACK.name,
      content: takeContent(TRACK),
      state: { isNew: true },
      translateX: TRACK_BOX.x,
      translateY: TRACK_BOX.y,
      width: TRACK_BOX.width,
      height: TRACK_BOX.height,
      borderRadius: 12,
      boxShadow: SHADOW,
    }),
  ]);
  setWorking(false);
  await wait(AFTER_STOP, signal);

  // Studio leaves through the bottom right of the view. The widget and the track stay.
  await studio.moveTo({ x: right + 80, y: bottom + 80 }, { duration: EXIT_DURATION, easing: 'ease-in' });
  await editor.removeAgent(studio);
}
