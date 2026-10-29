import { KritzelIframeObject, type KritzelBaseObject, type KritzelIframeContent } from '@kritzel/react-editor';

/** Gap in world units between frames placed next to each other. */
export const FRAME_GAP = 160;

/**
 * A shimmering wireframe of a generic web page, shown inside a frame while Claude writes its content.
 * It lives in the frame's `loadingContent`, so toggling `isLoading` swaps between it and the real page.
 */
export const FRAME_SKELETON: KritzelIframeContent = {
  html: `
    <div class="skeleton" aria-busy="true" aria-label="Generating">
      <div class="row nav">
        <div class="bone logo"></div>
        <div class="spacer"></div>
        <div class="bone link"></div><div class="bone link"></div><div class="bone link"></div>
        <div class="bone button"></div>
      </div>
      <div class="hero">
        <div class="bone eyebrow"></div>
        <div class="bone title"></div>
        <div class="bone title short"></div>
        <div class="bone text"></div>
        <div class="bone text shorter"></div>
        <div class="row actions"><div class="bone button large"></div><div class="bone button large ghost"></div></div>
      </div>
      <div class="cards">
        <div class="card"><div class="bone icon"></div><div class="bone line"></div><div class="bone line short"></div></div>
        <div class="card"><div class="bone icon"></div><div class="bone line"></div><div class="bone line short"></div></div>
        <div class="card"><div class="bone icon"></div><div class="bone line"></div><div class="bone line short"></div></div>
      </div>
    </div>`,
  css: `
    :root { --bone: #eceef2; --shine: #f8f9fb; --surface: #ffffff; }
    body { background: var(--surface); font-family: system-ui, sans-serif; }
    .skeleton { box-sizing: border-box; height: 100%; padding: 32px 6%; display: flex; flex-direction: column; gap: 9%; overflow: hidden; }
    .row { display: flex; align-items: center; gap: 16px; }
    .spacer { flex: 1; }
    .bone {
      border-radius: 8px;
      background: linear-gradient(100deg, var(--bone) 40%, var(--shine) 50%, var(--bone) 60%) var(--bone);
      background-size: 300% 100%;
      animation: shimmer 1.6s ease-in-out infinite;
    }
    .logo { width: 112px; height: 28px; }
    .link { width: 64px; height: 12px; }
    .button { width: 104px; height: 36px; border-radius: 999px; }
    .button.large { width: 152px; height: 48px; }
    .button.ghost { opacity: 0.6; }
    .hero { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .eyebrow { width: 140px; height: 14px; border-radius: 999px; }
    .title { width: 64%; height: 44px; }
    .title.short { width: 44%; }
    .text { width: 52%; height: 14px; margin-top: 8px; }
    .text.shorter { width: 38%; margin-top: 0; }
    .actions { margin-top: 16px; }
    .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .card { display: flex; flex-direction: column; gap: 14px; padding: 24px; border-radius: 16px; border: 1px solid var(--bone); }
    .icon { width: 40px; height: 40px; border-radius: 12px; }
    .line { width: 80%; height: 14px; }
    .line.short { width: 56%; }
    @keyframes shimmer { from { background-position: 100% 0; } to { background-position: 0 0; } }
    @media (prefers-reduced-motion: reduce) { .bone { animation: none; } }`,
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
    scale: 1,
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
