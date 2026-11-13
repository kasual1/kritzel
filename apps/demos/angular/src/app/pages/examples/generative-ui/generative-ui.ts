import {
  KritzelChatSession,
  MODEL_IFRAME_CONTENT_SECURITY_POLICY,
  type KritzelBaseObject,
  type KritzelChatBoxChip,
  type KritzelChatTransport,
  type KritzelIframeContent,
  type KritzelIframeObject,
  type KritzelObjectConfig,
  type KritzelObjectTitlebarConfig,
  type KritzelTheme,
} from '@kritzel/angular-editor';

/** How the demo answers prompts: with a model and the user's own API key, or with canned UIs. */
export type RequestMode = 'live' | 'mock';

const SYSTEM_PROMPT = `You build user interfaces on an infinite canvas, next to the user. Every UI is a widget that you place \
with create_iframe, where people use it right away.

- Before you place a new widget, call observe_canvas. Put the widget to the right of the existing ones, 48 units apart \
and aligned with their top edge, so that nothing overlaps. Make it about 800 × 600 unless the content needs another size.
- After you create or resize widgets, call fit_viewport, so that the user sees them.
- Make it work: buttons, inputs, tabs, toggles and drag and drop do something, with state in plain JavaScript and \
realistic sample data instead of placeholder text.
- Fill the widget exactly. The page itself never scrolls: size the layout to the widget, and let an inner region scroll \
when the content does not fit.
- The widget has no network access: no external fonts, images, scripts or requests, no localStorage or cookies, no \
alert, confirm or prompt, no forms that submit and no navigation. Use system fonts and draw icons with inline SVG.
- Design it like a polished modern product: a clear visual hierarchy, generous spacing, one accent color and good \
contrast.
- When a prompt refers to an existing widget, change it with update_iframe instead of creating a new one. Call \
read_iframe first when you don't know its current code, and prefer edits for small changes.
- Answer in one short sentence.`;

/**
 * A chat session that builds UIs. `canvasTools: { iframes: true }` gives the model create_iframe, read_iframe and
 * update_iframe next to the other canvas tools.
 */
export function createGenerativeUiSession(transport: KritzelChatTransport): KritzelChatSession {
  return new KritzelChatSession({ transport, system: SYSTEM_PROMPT, canvasTools: { iframes: true } });
}

/** UIs get rounded corners and a soft shadow, like frames in a design tool. */
export function withUiFrames(theme: KritzelTheme): KritzelTheme {
  return {
    ...theme,
    iframe: {
      ...theme.iframe,
      borderRadius: '12px',
      boxShadow: '0 1px 2px rgba(20, 18, 31, 0.06), 0 12px 32px -12px rgba(20, 18, 31, 0.18)',
    },
  };
}

/** UIs get a titlebar and keep their orientation. */
export const objectConfig: KritzelObjectConfig = {
  hasTitlebar: object => isUi(object),
  isRotatable: false,
};

export const objectTitlebar: KritzelObjectTitlebarConfig = {
  left: [
    { id: 'title', type: 'title', isEditable: true },
    {
      id: 'size',
      type: 'text',
      tone: 'muted',
      minBarWidth: 180,
      text: ({ contentSize }) => `${Math.round(contentSize.width)} × ${Math.round(contentSize.height)}`,
    },
  ],
  right: [{ id: 'play', type: 'button', icon: 'play', tooltip: 'Open fullscreen' }],
};

export function isUi(object: KritzelBaseObject): object is KritzelIframeObject {
  return object.__class__ === 'KritzelIframeObject';
}

export function getUiTitle(ui: KritzelIframeObject): string {
  return ui.name ?? ui.title;
}

/** A chip for each selected UI. The session tells the model which UIs a prompt sent with them is about. */
export function getUiChips(objects: KritzelBaseObject[]): KritzelChatBoxChip[] {
  return objects.filter(isUi).map(ui => ({ id: ui.id, objectId: ui.id, label: getUiTitle(ui), icon: 'cursor' }));
}

/** A message for an error that ended a prompt, e.g. a provider that rejected the key. */
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'The request failed.';
}

/**
 * A standalone HTML document of a UI, to show it fullscreen. It keeps the content security policy that the canvas
 * gives model-written code, so the UI can't reach the network there either.
 */
export function createUiDocument({ html, css, script }: KritzelIframeContent, title: string): string {
  const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Security-Policy" content="${MODEL_IFRAME_CONTENT_SECURITY_POLICY}">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${safeTitle}</title>
    <style>html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; } ${css.replace(/<\/style/gi, '<\\/style')}</style>
  </head>
  <body>
    ${html}
    <script>${script.replace(/<\/script/gi, '<\\/script')}</script>
  </body>
</html>`;
}
