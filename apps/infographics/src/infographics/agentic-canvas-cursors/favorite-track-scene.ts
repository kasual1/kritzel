import { KritzelIframeObject, type HTMLKritzelEditorElement } from '@kritzel/react-editor';
import {
  BUTTON_PRESS_OFFSET,
  EXIT_DURATION,
  RECORDER,
  SHADOW,
  STAR_OFFSET,
  STUDIO_AGENT,
  TAKE_GAP,
  TAKE_HEIGHT,
  TAKES_GAP,
  frame,
  takeContent,
  typePrompt,
  union,
  wait,
  type Box,
} from '../agentic-canvas/hero-scene';

/**
 * Agentic cursors on a generative UI page: the recorder widget of the agentic canvas post sits in the middle of the
 * canvas with its tracks below it. The user asks for track 2 to be a favorite, and Studio's cursor glides to the star
 * of track 2, clicks it and leaves the view. Scripted, with no model calls, so every recording is the same.
 */

const PROMPT = 'Please favoritize track 2';

/** The widget is centered on the origin together with its tracks. */
const TRACKS = [
  { name: 'Track 1', duration: '0:39' },
  { name: 'Track 2', duration: '0:42' },
];

/** The track whose star Studio clicks. */
const FAVORITE_TRACK = 1;

const WIDGET_WIDTH = 360;
const WIDGET_HEIGHT = 116;
const TOTAL_HEIGHT = WIDGET_HEIGHT + TAKES_GAP + TRACKS.length * TAKE_HEIGHT + (TRACKS.length - 1) * TAKE_GAP;

const WIDGET_BOX: Box = { x: -WIDGET_WIDTH / 2, y: -TOTAL_HEIGHT / 2, width: WIDGET_WIDTH, height: WIDGET_HEIGHT };

function trackBox(index: number): Box {
  return {
    x: WIDGET_BOX.x,
    y: WIDGET_BOX.y + WIDGET_BOX.height + TAKES_GAP + index * (TAKE_HEIGHT + TAKE_GAP),
    width: WIDGET_BOX.width,
    height: TAKE_HEIGHT,
  };
}

const TRACK_BOXES = TRACKS.map((_, index) => trackBox(index));
const SCENE_BOX = union([WIDGET_BOX, ...TRACK_BOXES]);

/** How long the canvas shows before the prompt is typed. */
const OPENING_PAUSE = 1200;
/** How long Studio takes to glide from the edge of the view to the star, and how long it hovers before the click. */
const STAR_APPROACH = 900;
const STAR_HOVER = 120;
/** How long Studio stays on the star after the click before it leaves. */
const AFTER_CLICK = 250;
/** How long the result stays after the cursor has left, before every object is removed. */
const CLEAR_DELAY = 1500;

/** The recorder widget and its tracks, as the canvas shows them when the page loads. */
export function createRecorderObjects(): KritzelIframeObject[] {
  const widget = new KritzelIframeObject({
    title: STUDIO_AGENT.name,
    content: RECORDER,
    translateX: WIDGET_BOX.x,
    translateY: WIDGET_BOX.y,
    width: WIDGET_BOX.width,
    height: WIDGET_BOX.height,
    borderRadius: 14,
    boxShadow: SHADOW,
  });
  const tracks = TRACKS.map((track, index) => {
    const box = TRACK_BOXES[index];
    return new KritzelIframeObject({
      title: track.name,
      content: takeContent(track),
      translateX: box.x,
      translateY: box.y,
      width: box.width,
      height: box.height,
      borderRadius: 12,
      boxShadow: SHADOW,
    });
  });
  return [widget, ...tracks];
}

/**
 * Plays the scene once. `trackIds` are the ids of the track objects, in order. `setWorking` drives the chat box's
 * loading ring, which runs from the sent prompt until Studio has clicked the star.
 */
export async function playAgenticCanvasCursorsScene(
  editor: HTMLKritzelEditorElement,
  trackIds: string[],
  setWorking: (isWorking: boolean) => void,
  signal: AbortSignal,
): Promise<void> {
  await editor.clearAgenticCursors();
  await frame(editor, SCENE_BOX, 0, signal);
  await wait(OPENING_PAUSE, signal);

  await typePrompt(editor, PROMPT, signal);
  setWorking(true);

  // Studio comes in from the top right corner of the view.
  const viewport = await editor.getViewport();
  const left = -viewport.translateX / viewport.scale;
  const top = -viewport.translateY / viewport.scale;
  const right = left + viewport.width / viewport.scale;
  const bottom = top + viewport.height / viewport.scale;
  await editor.addAgenticCursor({
    id: STUDIO_AGENT.id,
    name: STUDIO_AGENT.name,
    color: STUDIO_AGENT.color,
    position: { x: right + 40, y: top - 40 },
  });

  const trackId = trackIds[FAVORITE_TRACK];
  const track = trackId ? await editor.getObjectById(trackId) : null;
  // An object anchor, so the cursor lands on the star wherever the track is.
  const star = trackId
    ? { objectId: trackId, anchor: 'right' as const, offset: { x: STAR_OFFSET.x + BUTTON_PRESS_OFFSET.x, y: STAR_OFFSET.y + BUTTON_PRESS_OFFSET.y } }
    : { x: 0, y: 0 };
  await editor.moveAgenticCursor(STUDIO_AGENT.id, star, { duration: STAR_APPROACH, easing: 'ease-in-out' });
  await wait(STAR_HOVER, signal);
  if (track instanceof KritzelIframeObject) {
    // The star turns on through the track's state, so the page animates it in place.
    track.setState({ ...track.state, favorite: true });
  }
  setWorking(false);
  await wait(AFTER_CLICK, signal);

  // Studio leaves through the bottom right of the view.
  await editor.moveAgenticCursor(STUDIO_AGENT.id, { x: right + 80, y: bottom + 80 }, { duration: EXIT_DURATION, easing: 'ease-in' });
  await editor.removeAgenticCursor(STUDIO_AGENT.id);

  await wait(CLEAR_DELAY, signal);
  await editor.removeObjects(await editor.getAllObjects());
}
