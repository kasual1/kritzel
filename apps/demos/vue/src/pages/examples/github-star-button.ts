import { KritzelDynamicObject } from '@kritzel/vue-editor'

export const GITHUB_STAR_RENDERER_KEY = 'vue-examples-github-star-button'
export const GITHUB_REPO_URL = 'https://github.com/kasual1/kritzel'

export const STAR_COUNTS = [100, 1000, 5000] as const
export const DEFAULT_STAR_COUNT = 1000

const STAR_WIDTH = 96
const STAR_HEIGHT = 30
// Every button is separated from its neighbors by the same gap, horizontally and vertically.
const STAR_GAP = 10
const CELL_WIDTH = STAR_WIDTH + STAR_GAP
const CELL_HEIGHT = STAR_HEIGHT + STAR_GAP
const BOARD_ASPECT = 16 / 9
// Screen pixels the pointer may travel between down and up and still count as a click.
const CLICK_TOLERANCE = 4

const STAR_PATH =
  'M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z'

export type GithubStarButtonData = {
  label: string
}

export type GithubStarButtonInstance = {
  destroy(): void
  getData(): GithubStarButtonData
}

export function normalizeGithubStarButtonData(data: unknown): GithubStarButtonData {
  const label = data && typeof data === 'object' ? (data as Partial<GithubStarButtonData>).label : undefined
  return { label: typeof label === 'string' && label.length > 0 ? label : 'Star' }
}

const SVG_NS = 'http://www.w3.org/2000/svg'

// The cursor is only resolved on :hover: the engine's pointer cursor is a large data URL,
// and resolving it for thousands of mounted buttons makes zooming out noticeably slower.
const STYLES = `
  .github-star-button { display: flex; align-items: center; justify-content: center; gap: 5px; width: 100%; height: 100%; box-sizing: border-box; border: 1px solid #d0d7de; border-radius: 6px; background: #f6f8fa; color: #24292f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; line-height: 1; white-space: nowrap; user-select: none; }
  .github-star-button svg { width: 1.1em; height: 1.1em; flex-shrink: 0; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  [data-github-star]:hover { cursor: var(--kritzel-global-pointer-cursor, pointer); }
  [data-github-star]:hover > .github-star-button { border-color: #afb8c1; background: #eaeef2; }
  [data-github-star]:hover > .github-star-button svg { fill: #ffd21f; stroke: #f5b400; }
`

let sharedStyleSheet: CSSStyleSheet | null = null

// One shared stylesheet is adopted by the root the buttons render into (the engine's shadow root).
// Hover styles target the container because the engine sets `pointer-events: none` on the
// content of unselected dynamic objects and resets the container's inline cursor on re-render.
function adoptStyles(container: HTMLElement): void {
  const root = container.getRootNode()
  if (!(root instanceof ShadowRoot || root instanceof Document)) return
  if (!sharedStyleSheet) {
    sharedStyleSheet = new CSSStyleSheet()
    sharedStyleSheet.replaceSync(STYLES)
  }
  if (!root.adoptedStyleSheets.includes(sharedStyleSheet)) {
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sharedStyleSheet]
  }
}

/**
 * Mounts a GitHub-style 'Star' button into a dynamic object container.
 * The button is a plain element rather than a <button>, so the engine treats a press on it
 * as a canvas interaction and a drag selects or moves the object. A pointerdown and
 * pointerup that barely moved count as a click and open the repository.
 */
export function mountGithubStarButton(container: HTMLElement, data: GithubStarButtonData): GithubStarButtonInstance {
  adoptStyles(container)

  const button = document.createElement('div')
  button.className = 'github-star-button'
  button.setAttribute('role', 'link')
  button.setAttribute('aria-label', `${data.label} kasual1/kritzel on GitHub`)
  const icon = document.createElementNS(SVG_NS, 'svg')
  icon.setAttribute('viewBox', '0 0 24 24')
  icon.setAttribute('aria-hidden', 'true')
  const path = document.createElementNS(SVG_NS, 'path')
  path.setAttribute('d', STAR_PATH)
  icon.appendChild(path)
  button.append(icon, data.label)

  let pressed: { pointerId: number; x: number; y: number } | null = null

  const releasePress = () => {
    pressed = null
    window.removeEventListener('pointerup', onPointerUp, true)
    window.removeEventListener('pointercancel', releasePress, true)
  }
  // The engine captures the pointer on pointerdown, so pointerup is observed on window.
  const onPointerUp = (event: PointerEvent) => {
    if (!pressed || event.pointerId !== pressed.pointerId) return
    const isClick = Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) <= CLICK_TOLERANCE
    releasePress()
    if (isClick) window.open(GITHUB_REPO_URL, '_blank', 'noopener,noreferrer')
  }
  const onPointerDown = (event: PointerEvent) => {
    // Secondary buttons and modifier clicks (additive selection) never open the link.
    if (event.button !== 0 || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return
    if (pressed) {
      // A second pointer (e.g. pinch zoom) cancels the click.
      releasePress()
      return
    }
    pressed = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
    window.addEventListener('pointerup', onPointerUp, true)
    window.addEventListener('pointercancel', releasePress, true)
  }

  container.setAttribute('data-github-star', '')
  container.addEventListener('pointerdown', onPointerDown)
  container.appendChild(button)

  return {
    destroy: () => {
      releasePress()
      container.removeEventListener('pointerdown', onPointerDown)
      container.removeAttribute('data-github-star')
    },
    getData: () => ({ ...data }),
  }
}

export function createGithubStarObject(x: number, y: number): KritzelDynamicObject {
  const placeholder = document.createElement('div')
  placeholder.textContent = 'Star'
  const object = new KritzelDynamicObject({
    element: placeholder,
    rendererKey: GITHUB_STAR_RENDERER_KEY,
    rendererData: { label: 'Star' } satisfies GithubStarButtonData,
    translateX: x,
    translateY: y,
    width: STAR_WIDTH,
    height: STAR_HEIGHT,
  })
  object.isRotatable = false
  return object
}

/**
 * Lays `count` buttons out on a regular grid centered on the world origin (the center of the
 * initial viewport), so the first screen looks equally full for every count and larger counts
 * only grow the board outward. The board keeps a 16:9 shape; a partial last row is centered.
 */
export function createGithubStarObjects(count: number): KritzelDynamicObject[] {
  const columns = Math.max(1, Math.round(Math.sqrt((count * BOARD_ASPECT * CELL_HEIGHT) / CELL_WIDTH)))
  const rows = Math.ceil(count / columns)
  const top = -(rows * CELL_HEIGHT - STAR_GAP) / 2

  return Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / columns)
    const columnsInRow = Math.min(columns, count - row * columns)
    const left = -(columnsInRow * CELL_WIDTH - STAR_GAP) / 2
    return createGithubStarObject(left + (index % columns) * CELL_WIDTH, top + row * CELL_HEIGHT)
  })
}
