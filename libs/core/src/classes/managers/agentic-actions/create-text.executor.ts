import type { KritzelAgenticCreateTextAction } from '../../../interfaces/agentic-action.interface';
import { KritzelText } from '../../objects/text.class';
import { AGENTIC_ACTION_MOUNT_WAIT_FRAMES, type KritzelAgenticActionExecutor } from './agentic-action.types';
import { resolveTextStyle } from './agentic-style.helper';
import { typeInto } from './type-text.executor';

/** `createText`: clicks to place a text object and types into it. */
export const createTextExecutor: KritzelAgenticActionExecutor<KritzelAgenticCreateTextAction> = {
  mutates: true,

  validate(action) {
    for (const field of ['x', 'y'] as const) {
      if (typeof action[field] !== 'number' || !Number.isFinite(action[field])) {
        throw new TypeError(`"${field}" must be a number.`);
      }
    }
    if (typeof action.text !== 'string' || action.text.length === 0) {
      throw new TypeError('"text" must be a non-empty string.');
    }
  },

  prepare() {
    return { targetIds: [], referenceIds: [] };
  },

  async execute(run, action) {
    const core = run.core;
    const map = run.map!;
    const state = core.store.state;
    const style = resolveTextStyle(core, action.style);
    const scale = state.lockDrawingScale ? 1 : state.scale || 1;

    await run.fly({ x: action.x, y: action.y });
    await run.click();

    const text = run.mutate(() => {
      const created = KritzelText.create(core, style.fontSize, style.fontFamily, scale);
      created.fontColor = style.fontColor;
      created.opacity = style.opacity;
      created.translateX = action.x;
      created.translateY = action.y;
      created.zIndex = core.store.currentZIndex;
      // Not "newly created" for the user's text tool: a later user save must not emit objectsAdded again.
      created.isNewlyCreated = false;
      run.own(created);
      core.addObject(created);
      return created;
    });
    run.track(text);

    await typeInto(run, text.id, action.text);

    // Texts are measured from the DOM. Wait for an on-screen text to be mounted (also for
    // instant actions) so its size is right; off-screen texts are measured when they mount.
    if (text.isInViewport()) {
      core.rerender();
      for (let frame = 0; frame < AGENTIC_ACTION_MOUNT_WAIT_FRAMES && !(map.findById(text.id) as KritzelText | undefined)?.isMounted; frame++) {
        await run.nextRenderedFrame();
      }
      run.mutate(() => {
        const current = map.findById(text.id) as KritzelText | undefined;
        if (current) {
          current.adjustSizeOnInput();
          map.update(current);
        }
      });
    }

    run.finalAttachment = { objectId: text.id, anchor: 'right' };
    return [text.id];
  },
};
