import { KritzelIframeObject, type HTMLKritzelEditorElement } from '@kritzel/react-editor';
import {
  EXIT_DURATION,
  RECORDER,
  SHADOW,
  STUDIO_AGENT,
  TAKE_GAP,
  TAKE_HEIGHT,
  TAKES_GAP,
  act,
  addAgentAt,
  frame,
  removeAgents,
  starTarget,
  takeContent,
  typePrompt,
  union,
  wait,
  type Box,
} from '../agentic-canvas/hero-scene';

/**
 * Agentic cursors on a generative UI page: the canvas starts empty, then the recorder widget of the agentic canvas post
 * appears in the middle of it with its tracks below it. The user asks for track 2 to be a favorite, and Studio clicks
 * the star of track 2 with `agent.click()` and leaves the view. Scripted, with no model calls, so every recording is
 * the same.
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

/** How long the empty editor shows before the recorder appears. */
const EMPTY_PAUSE = 1500;
/** How long the recorder and its tracks take to appear: the theme's default duration plus the stagger of two tracks. */
const APPEAR_TIME = 600 + 2 * 110;
/** How long the recorder shows before the prompt is typed. */
const OPENING_PAUSE = 1200;
/** How long Studio stays on the star after the click before it leaves. */
const AFTER_CLICK = 250;
/** How long the result stays after the cursor has left, before every object is removed. */
const CLEAR_DELAY = 1500;

/** The recorder widget and its tracks, added to the canvas once the empty editor has shown for a moment. */
function createRecorderObjects(): KritzelIframeObject[] {
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
 * Plays the scene once, starting from an empty canvas. `setWorking` drives the chat box's loading ring, which runs
 * from the sent prompt until Studio has clicked the star.
 */
export async function playAgenticCanvasCursorsScene(
  editor: HTMLKritzelEditorElement,
  setWorking: (isWorking: boolean) => void,
  signal: AbortSignal,
): Promise<void> {
  await removeAgents(editor);
  await frame(editor, SCENE_BOX, 0, signal);
  // Only the editor with its chat box shows at first; then the recorder and its tracks appear.
  await wait(EMPTY_PAUSE, signal);
  // Added in one call, the widget and its tracks fade in and rise into place one after another (Kritzel's appear
  // animation), each once its page has loaded.
  const added = await editor.addObjects(createRecorderObjects());
  const trackIds = added.slice(1).map(object => object.id);
  await wait(APPEAR_TIME + OPENING_PAUSE, signal);

  await typePrompt(editor, PROMPT, signal);
  setWorking(true);

  // Studio comes in from the top right corner of the view.
  const viewport = await editor.getViewport();
  const left = -viewport.translateX / viewport.scale;
  const top = -viewport.translateY / viewport.scale;
  const right = left + viewport.width / viewport.scale;
  const bottom = top + viewport.height / viewport.scale;
  const studio = await addAgentAt(editor, STUDIO_AGENT, { x: right + 40, y: top - 40 });

  const track = await editor.getObjectById(trackIds[FAVORITE_TRACK]);
  if (track instanceof KritzelIframeObject) {
    await act(studio.click(starTarget(track.id), { signal }));
    // The star turns on through the track's state, as the track's star button would, so the page animates it in place.
    track.setState({ ...track.state, favorite: true });
  }
  setWorking(false);
  await wait(AFTER_CLICK, signal);

  // Studio leaves through the bottom right of the view.
  await studio.moveTo({ x: right + 80, y: bottom + 80 }, { duration: EXIT_DURATION, easing: 'ease-in' });
  await editor.removeAgent(studio);

  await wait(CLEAR_DELAY, signal);
  await editor.removeObjects(await editor.getAllObjects());
}
