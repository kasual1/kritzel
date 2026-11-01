import {
  KritzelIframeObject,
  type HTMLKritzelEditorElement,
  type KritzelBaseObject,
  type KritzelIframeContent,
  type KritzelObjectConfig,
  type KritzelObjectTitlebarConfig,
} from '@kritzel/vue-editor'
import type { CompletionRequest } from './llm-providers'

/** The page size of a new UI in CSS pixels. A resized UI lays its page out again at the new size. */
const UI_WIDTH = 800
const UI_HEIGHT = 600

/** UIs are drawn a bit smaller than their page, like frames in a design tool: 800 px take 640 canvas units. */
const UI_SCALE = 1.25

/** Gap in canvas units between UIs placed next to each other. */
const UI_GAP = 48

/** Room left around the UIs when the viewport moves to show them, enough to clear the titlebars and the chat box. */
const REVEAL_PADDING = 1.4

const SYSTEM_PROMPT = `You build user interfaces on an infinite canvas. Every UI is one self-contained HTML document that \
renders inside a fixed-size frame on the canvas, where people use it right away.

Reply with the complete HTML document only, from <!doctype html> to </html>, without Markdown fences or explanations. \
Give it a <title> of two to four words: it becomes the frame's title.

- Fill the frame exactly. The page itself never scrolls: size the layout to the viewport (html and body are already \
100% tall) and let an inner region scroll when the content does not fit.
- Make it work: buttons, inputs, tabs, toggles and drag and drop do something, with state in plain JavaScript and \
realistic sample data instead of placeholder text.
- Keep it self-contained: CSS in one <style> in the <head>, JavaScript in <script> tags, no attributes on <html> or \
<body>. Google Fonts are the only external resource. Draw icons and illustrations with inline SVG.
- The frame is sandboxed: no network requests, no localStorage or cookies, no alert, confirm or prompt, no forms that \
submit and no navigation.
- Design it like a polished modern product: a clear visual hierarchy, generous spacing, one accent color and good \
contrast.

When you are asked to change an existing UI, you get its current document. Return the complete new document and keep \
everything the request does not change.`

/** A plain grey surface with a soft glare that sweeps across it, shown in a UI while the model writes it. */
const UI_SKELETON: KritzelIframeContent = {
  html: '<div class="skeleton" aria-busy="true" aria-label="Generating"></div>',
  css: `
    .skeleton {
      height: 100%;
      background: linear-gradient(100deg, #ececec 30%, #f6f6f6 50%, #ececec 70%) #ececec;
      background-size: 300% 100%;
      animation: glare 1.8s ease-in-out infinite;
    }
    @keyframes glare { from { background-position: 100% 0; } to { background-position: 0 0; } }
    @media (prefers-reduced-motion: reduce) { .skeleton { animation: none; } }`,
  script: '',
}

/** The editor methods the generator uses. */
export type GenerativeUiEditor = Pick<
  HTMLKritzelEditorElement,
  | 'addObject'
  | 'removeObject'
  | 'updateObject'
  | 'getObjectById'
  | 'getAllObjects'
  | 'getSelectedObjects'
  | 'clearSelection'
  | 'getViewport'
  | 'setViewport'
>

/** UIs get a titlebar and keep their orientation, like frames in a design tool. */
export const objectConfig: KritzelObjectConfig = {
  hasTitlebar: object => isUi(object),
  isRotatable: false,
}

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
}

export function isUi(object: KritzelBaseObject): object is KritzelIframeObject {
  return object.__class__ === 'KritzelIframeObject'
}

export function getUiTitle(ui: KritzelIframeObject): string {
  return ui.name ?? ui.title
}

/** A standalone HTML document of a UI, to show it fullscreen or to hand it back to the model for a change. */
export function createUiDocument({ html, css, script }: KritzelIframeContent, title: string): string {
  const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${safeTitle}</title>
    <style>html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; } ${css.replace(/<\/style/gi, '<\\/style')}</style>
  </head>
  <body>
    ${html}
    <script>${script.replace(/<\/script/gi, '<\\/script')}</script>
  </body>
</html>`
}

/**
 * Splits the HTML document the model wrote into the parts of an iframe object: the styles of the <head> become its css,
 * and the stylesheets, scripts and body its html. Scripts keep their place, so they still run in document order.
 */
function parseUiDocument(text: string, fallbackTitle: string): { title: string; content: KritzelIframeContent } {
  const start = text.search(/<!doctype html|<html[\s>]/i)
  const end = text.toLowerCase().lastIndexOf('</html>')
  const source = start >= 0 ? text.slice(start, end > start ? end + '</html>'.length : undefined) : text
  if (!/<[a-z][\s\S]*>/i.test(source)) {
    throw new Error('The model answered without a UI. Try describing the interface you want.')
  }

  const document = new DOMParser().parseFromString(source, 'text/html')
  const css = Array.from(document.head.querySelectorAll('style'), style => style.textContent ?? '').join('\n')
  const resources = Array.from(
    document.head.querySelectorAll('link[rel="stylesheet"], script'),
    element => element.outerHTML,
  )
  return {
    title: document.title.trim() || fallbackTitle,
    content: { html: [...resources, document.body.innerHTML].join('\n'), css, script: '' },
  }
}

function summarize(prompt: string): string {
  const text = prompt.trim().replace(/\s+/g, ' ')
  return text.length > 40 ? `${text.slice(0, 39)}…` : text
}

/** Generates UIs on the canvas: every prompt adds a new UI, or changes the selected one. */
export class GenerativeUi {
  constructor(private readonly editor: GenerativeUiEditor) {}

  async generate(prompt: string, complete: (request: CompletionRequest) => Promise<string>, signal: AbortSignal): Promise<void> {
    const selected = (await this.editor.getSelectedObjects()).filter(isUi)
    const existing = selected.length === 1 ? selected[0] : undefined
    const ui = existing ?? (await this.addUi(summarize(prompt)))
    const request = existing
      ? `Change this UI: ${prompt}\n\nThe frame is ${Math.round(existing.width)} × ${Math.round(existing.height)} CSS pixels.\n\n` +
        `<current_ui>\n${createUiDocument(existing.content, getUiTitle(existing))}\n</current_ui>`
      : `Build this UI: ${prompt}\n\nThe frame is ${UI_WIDTH} × ${UI_HEIGHT} CSS pixels.`

    await this.setLoading(ui.id, true)
    try {
      const answer = await complete({ system: SYSTEM_PROMPT, prompt: request, signal })
      const { title, content } = parseUiDocument(answer, getUiTitle(ui))
      // Look the UI up again: the instance in the store can be replaced in the meantime, e.g. by undo.
      const current = await this.getUi(ui.id)
      if (!current) {
        return
      }
      current.setContent(content)
      current.setLoading(false)
      if (!existing) {
        await this.editor.updateObject(current, { name: title, title })
      }
    } catch (error) {
      const current = await this.getUi(ui.id)
      if (current && existing) {
        current.setLoading(false)
      } else if (current) {
        await this.editor.removeObject(current)
        const remaining = (await this.editor.getAllObjects()).filter(isUi)
        if (remaining.length) {
          await this.reveal(remaining)
        }
      }
      throw error
    }
  }

  private async getUi(id: string): Promise<KritzelIframeObject | undefined> {
    const object = await this.editor.getObjectById(id)
    return object && isUi(object) ? object : undefined
  }

  private async setLoading(id: string, isLoading: boolean): Promise<void> {
    const ui = await this.getUi(id)
    if (ui && ui.isLoading !== isLoading) {
      ui.setLoading(isLoading)
    }
  }

  /** Adds an empty UI to the right of the others and moves the viewport to show it. */
  private async addUi(name: string): Promise<KritzelIframeObject> {
    const uis = (await this.editor.getAllObjects()).filter(isUi)
    const x = uis.length
      ? Math.max(...uis.map(ui => ui.translateX + ui.width / (ui.scale || 1))) + UI_GAP
      : -UI_WIDTH / UI_SCALE / 2
    const y = uis.length ? Math.min(...uis.map(ui => ui.translateY)) : -UI_HEIGHT / UI_SCALE / 2

    const ui = await this.editor.addObject(
      new KritzelIframeObject({
        name,
        title: name,
        loadingContent: UI_SKELETON,
        isLoading: true,
        sandbox: ['allow-scripts'],
        translateX: x,
        translateY: y,
        width: UI_WIDTH,
        height: UI_HEIGHT,
        scale: UI_SCALE,
        borderRadius: 12,
        boxShadow: '0 1px 2px rgba(20, 18, 31, 0.06), 0 12px 32px -12px rgba(20, 18, 31, 0.18)',
      }),
    )
    if (!ui) {
      throw new Error('The UI could not be added to the canvas.')
    }

    await this.editor.clearSelection()
    await this.reveal([...uis, ui])
    return ui
  }

  /** Centers the UIs in the viewport, zooming out when they do not fit but never zooming in past 100 %. */
  private async reveal(uis: KritzelIframeObject[]): Promise<void> {
    const boxes = uis.map(ui => ui.boundingBox)
    const minX = Math.min(...boxes.map(box => box.x))
    const minY = Math.min(...boxes.map(box => box.y))
    const maxX = Math.max(...boxes.map(box => box.x + box.width))
    const maxY = Math.max(...boxes.map(box => box.y + box.height))
    const viewport = await this.editor.getViewport()
    const scale = Math.min(
      viewport.width / ((maxX - minX) * REVEAL_PADDING),
      viewport.height / ((maxY - minY) * REVEAL_PADDING),
      1,
    )
    await this.editor.setViewport((minX + maxX) / 2, (minY + maxY) / 2, scale)
  }
}
