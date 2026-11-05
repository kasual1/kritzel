import type { HTMLKritzelEditorElement, KritzelIframeContent, KritzelIframeObject } from '@kritzel/react-editor';

/**
 * How generated pages come onto the canvas in the agentic canvas infographics: they are added invisible and a little
 * low, get a moment to render, then fade in while they rise into place. Several pages appear one after another.
 */
const APPEAR_DURATION = 600;
const APPEAR_RISE = 14;
const DEFAULT_STAGGER = 110;

/** How long an invisible page gets to render its content before it fades in. */
export const APPEAR_LOAD = 400;

/** Grey of the glare placeholder, see `SKELETON` in hero-scene.ts. */
const PLACEHOLDER_GREY = '#ececec';

const easeOut = (t: number) => 1 - (1 - t) ** 3;

function pause(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    }, { once: true });
  });
}

/**
 * Adds the pages invisible and a little below their place, ready for `fadeIn`. A page with a placeholder gets the
 * placeholder's grey behind its frame, so the canvas never shows through while the frame swaps to the content.
 */
export async function addHidden<T extends KritzelIframeObject>(editor: HTMLKritzelEditorElement, objects: T[]): Promise<T[]> {
  for (const object of objects) {
    object.opacity = 0;
    object.translateY += APPEAR_RISE;
    if (object.loadingContent) {
      object.backgroundColor = { light: PLACEHOLDER_GREY, dark: PLACEHOLDER_GREY };
    }
  }
  const added = await editor.addObjects(objects);
  return added?.length ? added : objects;
}

/**
 * Fades pages added with `addHidden` in while they rise into place, `stagger` ms apart, after giving them `load` ms to
 * render. Resolves once the last one is in place.
 */
export async function fadeIn(
  editor: HTMLKritzelEditorElement,
  objects: KritzelIframeObject[],
  signal: AbortSignal,
  { load = APPEAR_LOAD, stagger = DEFAULT_STAGGER }: { load?: number; stagger?: number } = {},
): Promise<void> {
  const targets = objects.map(object => object.translateY - APPEAR_RISE);
  await pause(load, signal);

  const total = APPEAR_DURATION + stagger * (objects.length - 1);
  const start = performance.now();
  for (;;) {
    const elapsed = performance.now() - start;
    await Promise.all(objects.map((object, index) => {
      const t = easeOut(Math.min(1, Math.max(0, (elapsed - index * stagger) / APPEAR_DURATION)));
      return editor.updateObject(object, { opacity: t, translateY: targets[index] + APPEAR_RISE * (1 - t) });
    }));
    if (elapsed >= total) {
      return;
    }
    await new Promise(requestAnimationFrame);
    if (signal.aborted) {
      throw signal.reason;
    }
  }
}

/** `addHidden` and `fadeIn` in one go. Resolves with the added pages once they are all in place. */
export async function appear<T extends KritzelIframeObject>(
  editor: HTMLKritzelEditorElement,
  objects: T[],
  signal: AbortSignal,
  options?: { load?: number; stagger?: number },
): Promise<T[]> {
  const added = await addHidden(editor, objects);
  await fadeIn(editor, added, signal, options);
  return added;
}

/**
 * Lets a page's content fade in over the placeholder's grey when it replaces the glare placeholder, instead of
 * snapping in.
 */
export function withReveal(content: KritzelIframeContent): KritzelIframeContent {
  return {
    ...content,
    css: `${content.css}
html { background: ${PLACEHOLDER_GREY}; }
body { animation: kritzel-reveal 450ms ease-out both; }
@keyframes kritzel-reveal { from { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { body { animation: none; } }`,
  };
}
