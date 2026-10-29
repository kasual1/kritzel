import { KritzelIframeObject, type KritzelBaseObject, type KritzelIframeContent } from '@kritzel/react-editor';

/** Gap in world units between frames placed next to each other. */
export const FRAME_GAP = 64;

/**
 * Frames are drawn smaller than their page, like an overview in a design tool: a 1440 px wide page takes 576 world units.
 * The page inside still lays out at its full width.
 */
export const FRAME_SCALE = 2.5;

/**
 * A plain grey surface with a soft shimmer, shown inside a frame while Claude writes its content.
 * It lives in the frame's `loadingContent`, so toggling `isLoading` swaps between it and the real page.
 */
export const FRAME_SKELETON: KritzelIframeContent = {
  html: '<div class="shimmer" aria-busy="true" aria-label="Generating"></div>',
  css: `
    .shimmer {
      height: 100%;
      background: linear-gradient(100deg, #ececec 30%, #f6f6f6 50%, #ececec 70%) #ececec;
      background-size: 300% 100%;
      animation: shimmer 1.8s ease-in-out infinite;
    }
    @keyframes shimmer { from { background-position: 100% 0; } to { background-position: 0 0; } }
    @media (prefers-reduced-motion: reduce) { .shimmer { animation: none; } }`,
  script: '',
};

/** Shown in a frame that has no content yet and is not being generated. */
const EMPTY_FRAME: KritzelIframeContent = {
  html: '<div class="empty">Empty frame</div>',
  css: `
    body { display: grid; place-items: center; background: #ffffff; font: 500 20px system-ui, sans-serif; color: #a1a1aa; }`,
  script: '',
};

export interface FrameConfig {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: Partial<KritzelIframeContent>;
  isLoading?: boolean;
}

/** A frame is an iframe object, like a Framer frame: a named, fixed-size viewport that renders one web page. */
export function createFrame({ name, x, y, width, height, content, isLoading = false }: FrameConfig): KritzelIframeObject {
  return new KritzelIframeObject({
    name,
    title: name,
    content: content ?? EMPTY_FRAME,
    loadingContent: FRAME_SKELETON,
    isLoading,
    sandbox: ['allow-scripts'],
    translateX: x,
    translateY: y,
    width,
    height,
    scale: FRAME_SCALE,
    borderRadius: 12,
    boxShadow: '0 1px 2px rgba(20, 18, 31, 0.06), 0 12px 32px -12px rgba(20, 18, 31, 0.18)',
  });
}

export function isFrame(object: KritzelBaseObject): object is KritzelIframeObject {
  return object.__class__ === 'KritzelIframeObject';
}

/** A standalone HTML document of a frame's page, e.g. for previewing it outside the canvas. */
export function createFrameDocument({ html, css, script }: KritzelIframeContent, title: string): string {
  const safeCss = css.replace(/<\/style/gi, '<\\/style');
  const safeScript = script.replace(/<\/script/gi, '<\\/script');
  const safeTitle = title.replace(/</g, '&lt;');
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${safeTitle}</title>
    <style>html, body { margin: 0; } ${safeCss}</style>
  </head>
  <body>
    ${html}
    <script>${safeScript}</script>
  </body>
</html>`;
}
