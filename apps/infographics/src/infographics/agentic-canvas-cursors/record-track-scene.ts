import { UpdrawIframeObject, type HTMLUpdrawEditorElement, type UpdrawPoint } from '@updraw/react-editor';
import {
  BUTTON_PRESS_OFFSET,
  BUTTON_REST_OFFSET,
  EXIT_DURATION,
  RECORDER,
  RECORD_BUTTON_CENTER,
  SHADOW,
  STAR_OFFSET,
  STUDIO_AGENT,
  TAKE_HEIGHT,
  TAKES_GAP,
  act,
  addAgentAt,
  frame,
  removeAgents,
  starTarget,
  takeContent,
  typePrompt,
  wait,
  type Box,
} from '../agentic-canvas/hero-scene';

/**
 * Agentic cursors on a generative UI page: the recorder widget of the agentic canvas post is already on the canvas. The
 * user asks for a new track, and Studio's cursor comes in, starts a recording with `agent.click()` on the record button,
 * stops it 2.5 seconds later with a second click, which saves one track below the widget. On its way out it clicks the
 * track's star, then leaves the view. The widget and the track stay. Scripted, with no model calls, so every recording
 * is the same.
 */

const PROMPT = 'Please record a new track';

/** The track the recording saves below the widget. */
const TRACK = { name: 'Track 1', duration: '0:03' };

const WIDGET_WIDTH = 360;
const WIDGET_HEIGHT = 116;

/** The widget is centered on the origin; the track is saved below it. */
const WIDGET_BOX: Box = { x: -WIDGET_WIDTH / 2, y: -WIDGET_HEIGHT / 2, width: WIDGET_WIDTH, height: WIDGET_HEIGHT };
const TRACK_BOX: Box = {
  x: WIDGET_BOX.x,
  y: WIDGET_BOX.y + WIDGET_BOX.height + TAKES_GAP,
  width: WIDGET_BOX.width,
  height: TAKE_HEIGHT,
};

/** How long the recorder shows before the prompt is typed. */
const OPENING_PAUSE = 1500;
/** How long Studio records before it presses stop. */
const RECORDING_TIME = 2500;
/** How long Studio stays beside the button after the track is saved, while the track appears, before it heads to the star. */
const AFTER_STOP = 700;
/** How long Studio stays on the star after the click before it leaves. */
const AFTER_STAR = 250;

const distance = (a: UpdrawPoint, b: UpdrawPoint) => Math.hypot(b.x - a.x, b.y - a.y);

/** Where Studio's cursor tip presses the track's star, see `starTarget`. */
const STAR_POINT: UpdrawPoint = {
  x: TRACK_BOX.x + TRACK_BOX.width + STAR_OFFSET.x + BUTTON_PRESS_OFFSET.x,
  y: TRACK_BOX.y + TRACK_BOX.height / 2 + STAR_OFFSET.y + BUTTON_PRESS_OFFSET.y,
};

/**
 * The recorder widget, part of the workspace's initial objects: it is on the canvas from the start, without the appear
 * animation of objects added later.
 */
export function createRecorderWidget(): UpdrawIframeObject {
  return new UpdrawIframeObject({
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
 * the sent prompt until Studio has starred the track.
 */
export async function playRecordTrackScene(
  editor: HTMLUpdrawEditorElement,
  widgetId: string,
  setWorking: (isWorking: boolean) => void,
  signal: AbortSignal,
): Promise<void> {
  await removeAgents(editor);
  // The widget sits in the middle of the whole view, not of the area above the chat box; the view does not move later.
  await frame(editor, WIDGET_BOX, 0, signal, true);
  await wait(OPENING_PAUSE, signal);

  await typePrompt(editor, PROMPT, signal);
  setWorking(true);

  const widget = await editor.getObjectById(widgetId);
  if (!(widget instanceof UpdrawIframeObject)) {
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

  // Stopping saves the track: it appears below the widget (Updraw's appear animation), added by the page, not Studio.
  const [track] = await editor.addObjects([
    new UpdrawIframeObject({
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
  await wait(AFTER_STOP, signal);

  // On its way out, Studio clicks the new track's star. It flies to the star at the speed it later leaves the view with,
  // then clicks on the spot. The star turns on through the track's state, as the track's star button would, so the page
  // animates it in place.
  const exitPoint = { x: right + 80, y: bottom + 80 };
  const exitSpeed = distance(STAR_POINT, exitPoint) / EXIT_DURATION;
  const restPoint = studio.state.position ?? STAR_POINT;
  await studio.moveTo(starTarget(track.id), { duration: distance(restPoint, STAR_POINT) / exitSpeed, easing: 'ease-in-out' });
  await act(studio.click(starTarget(track.id), { signal }));
  track.setState({ ...track.state, favorite: true });
  setWorking(false);
  await wait(AFTER_STAR, signal);

  // Studio leaves through the bottom right of the view. The widget and the track stay.
  await studio.moveTo(exitPoint, { duration: EXIT_DURATION, easing: 'ease-in' });
  await editor.removeAgent(studio);
}
