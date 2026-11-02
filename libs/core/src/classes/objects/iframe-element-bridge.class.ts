import {
  KritzelObjectElementHighlight,
  KritzelObjectElementInfo,
  KritzelObjectElementModifiers,
  KritzelObjectElementPickingOptions,
  KritzelObjectElementRect,
} from '../../interfaces/object-element.interface';
import { IFRAME_ELEMENT_MESSAGES } from './iframe-element-bridge.script';

/** The object side of the bridge: what the bridge needs from its `KritzelIframeObject`. */
export interface KritzelIframeElementBridgeOwner {
  readonly id: string;
  readonly isInteractive: boolean;
  readonly isMounted: boolean;
  /** The mounted iframe, or `null`. */
  getIframe(): HTMLIFrameElement | null;
  /** Size of the content (the iframe's viewport) in CSS pixels, used to keep reported positions inside the object. */
  getContentSize(): { width: number; height: number };
  emitHover(element: KritzelObjectElementInfo | null, isPicking: boolean): void;
  emitClick(element: KritzelObjectElementInfo, modifiers: KritzelObjectElementModifiers): void;
  emitPick(element: KritzelObjectElementInfo, modifiers: KritzelObjectElementModifiers): void;
}

interface PendingQuery {
  selector: string;
  limit: number;
  resolve: (elements: KritzelObjectElementInfo[]) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export const IFRAME_ELEMENT_QUERY_TIMEOUT = 3000;
export const IFRAME_ELEMENT_DEFAULT_QUERY_LIMIT = 100;
export const IFRAME_ELEMENT_MAX_QUERY_LIMIT = 500;

const MAX_SELECTOR_LENGTH = 2000;
const MAX_STRING_LENGTH = 500;
const MAX_LIST_LENGTH = 50;
const MAX_HIGHLIGHTS = 50;
const MAX_TRACKED = 50;

const THEME_VARIABLES = {
  color: ['--kritzel-element-highlight-color', '#007AFF'],
  backgroundColor: ['--kritzel-element-highlight-background-color', 'rgba(0, 122, 255, 0.12)'],
  labelTextColor: ['--kritzel-element-highlight-label-text-color', '#ffffff'],
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function readString(value: unknown, maxLength: number = MAX_STRING_LENGTH): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value.slice(0, maxLength) : undefined;
}

function readRect(value: unknown): KritzelObjectElementRect | null {
  if (!isRecord(value)) {
    return null;
  }
  const { x, y, width, height } = value;
  const isFiniteNumber = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
  if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(width) || !isFiniteNumber(height) || width < 0 || height < 0) {
    return null;
  }
  return { x, y, width, height };
}

/** Validates an element description sent by a page, which is untrusted content. */
export function readElementInfo(value: unknown): KritzelObjectElementInfo | null {
  if (!isRecord(value)) {
    return null;
  }
  const selector = readString(value.selector, MAX_SELECTOR_LENGTH);
  const tagName = readString(value.tagName, 100);
  const rect = readRect(value.rect);
  if (!selector || !tagName || !rect) {
    return null;
  }

  const classList = Array.isArray(value.classList)
    ? value.classList.filter((name): name is string => typeof name === 'string' && name.length > 0).slice(0, MAX_LIST_LENGTH).map(name => name.slice(0, MAX_STRING_LENGTH))
    : [];
  const attributes: Record<string, string> = {};
  if (isRecord(value.attributes)) {
    Object.entries(value.attributes)
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[0].length > 0 && entry[0].length <= 100)
      .slice(0, MAX_LIST_LENGTH)
      .forEach(([name, attributeValue]) => {
        attributes[name] = attributeValue.slice(0, MAX_STRING_LENGTH);
      });
  }

  const info: KritzelObjectElementInfo = { selector, tagName: tagName.toLowerCase(), classList, attributes, rect };
  const visibleRect = readRect(value.visibleRect);
  if (visibleRect) info.visibleRect = visibleRect;
  const kritzelId = readString(value.kritzelId);
  const id = readString(value.id);
  const text = readString(value.text);
  if (kritzelId) info.kritzelId = kritzelId;
  if (id) info.id = id;
  if (text) info.text = text;
  return info;
}

function readModifiers(value: Record<string, unknown>): KritzelObjectElementModifiers {
  return {
    shiftKey: value.shiftKey === true,
    ctrlKey: value.ctrlKey === true,
    altKey: value.altKey === true,
    metaKey: value.metaKey === true,
  };
}

/**
 * Whether a selector is a non-empty CSS selector the browser can parse. Selectors are checked here, where errors
 * can be reported to the caller, because the page silently ignores selectors it can't parse.
 */
export function isValidElementSelector(selector: unknown): selector is string {
  if (typeof selector !== 'string' || selector.trim().length === 0 || selector.length > MAX_SELECTOR_LENGTH) {
    return false;
  }
  if (typeof document === 'undefined' || typeof document.createDocumentFragment !== 'function') {
    return true;
  }
  try {
    document.createDocumentFragment().querySelector(selector);
    return true;
  } catch (error) {
    return (error as { name?: unknown } | null)?.name !== 'SyntaxError';
  }
}

/**
 * Host side of the element bridge of a `KritzelIframeObject`: keeps the transient element state (picking,
 * highlights, tracked elements, pending queries), sends it to the page whenever the page (re)loads or the state
 * changes, and validates what the page reports. The page runs untrusted content, so every message is checked
 * and hovers, clicks and picks are only accepted in the states in which a user could have caused them.
 */
export class KritzelIframeElementBridge {
  private _owner: KritzelIframeElementBridgeOwner;
  private _isReady = false;
  private _picking: { enabled: boolean; selector?: string; color?: string } = { enabled: false };
  private _highlights: KritzelObjectElementHighlight[] = [];
  private readonly _tracked = new Map<string, number>();
  private readonly _rects = new Map<string, KritzelObjectElementRect>();
  private readonly _queries = new Map<number, PendingQuery>();
  private _hovered: KritzelObjectElementInfo | null = null;
  private _requestCounter = 0;

  constructor(owner: KritzelIframeElementBridgeOwner) {
    this._owner = owner;
  }

  /** Hands the bridge to the object instance that replaced its owner, e.g. after a synced update. */
  attach(owner: KritzelIframeElementBridgeOwner): void {
    this._owner = owner;
  }

  get isPicking(): boolean {
    return this._picking.enabled;
  }

  get isReady(): boolean {
    return this._isReady;
  }

  get hoveredElement(): KritzelObjectElementInfo | null {
    return this._hovered;
  }

  get pickingOptions(): KritzelObjectElementPickingOptions {
    return { selector: this._picking.selector, color: this._picking.color };
  }

  setPicking(enabled: boolean, options: KritzelObjectElementPickingOptions = {}): void {
    if (options.selector !== undefined && options.selector !== '' && !isValidElementSelector(options.selector)) {
      throw new Error(`Invalid picking selector "${options.selector}".`);
    }
    this._picking = enabled
      ? { enabled: true, selector: options.selector || undefined, color: options.color || undefined }
      : { enabled: false };
    // The page answers with the hovered element resolved for the new mode.
    this.sync();
  }

  setHighlights(highlights: KritzelObjectElementHighlight[]): void {
    if (!Array.isArray(highlights)) {
      throw new Error('Highlights must be an array.');
    }
    if (highlights.length > MAX_HIGHLIGHTS) {
      throw new Error(`At most ${MAX_HIGHLIGHTS} highlights are supported.`);
    }
    this._highlights = highlights.map(highlight => {
      if (!highlight || !isValidElementSelector(highlight.selector)) {
        throw new Error(`Invalid highlight selector "${highlight?.selector}".`);
      }
      const next: KritzelObjectElementHighlight = { selector: highlight.selector };
      if (typeof highlight.color === 'string' && highlight.color) next.color = highlight.color;
      if (typeof highlight.label === 'string' && highlight.label) next.label = highlight.label;
      return next;
    });
    this.sync();
  }

  getHighlights(): KritzelObjectElementHighlight[] {
    return this._highlights.map(highlight => ({ ...highlight }));
  }

  track(selector: string): void {
    if (!isValidElementSelector(selector)) {
      throw new Error(`Invalid element selector "${selector}".`);
    }
    const count = this._tracked.get(selector) ?? 0;
    if (count === 0 && this._tracked.size >= MAX_TRACKED) {
      throw new Error(`At most ${MAX_TRACKED} elements can be tracked per object.`);
    }
    this._tracked.set(selector, count + 1);
    if (count === 0) {
      this.sync();
    }
  }

  untrack(selector: string): void {
    const count = this._tracked.get(selector);
    if (count === undefined) {
      return;
    }
    if (count > 1) {
      this._tracked.set(selector, count - 1);
      return;
    }
    this._tracked.delete(selector);
    this._rects.delete(selector);
    this.sync();
  }

  getRect(selector: string): KritzelObjectElementRect | null {
    const rect = this._rects.get(selector);
    return rect ? { ...rect } : null;
  }

  query(selector: string, limit: number = IFRAME_ELEMENT_DEFAULT_QUERY_LIMIT): Promise<KritzelObjectElementInfo[]> {
    if (!isValidElementSelector(selector)) {
      return Promise.reject(new Error(`Invalid element selector "${selector}".`));
    }
    if (!this._owner.isMounted || !this._owner.getIframe()) {
      return Promise.reject(new Error(`Object "${this._owner.id}" is not mounted. Its content can only be queried while it is in or near the viewport.`));
    }
    const normalizedLimit = Math.max(1, Math.min(IFRAME_ELEMENT_MAX_QUERY_LIMIT, Math.floor(Number(limit)) || IFRAME_ELEMENT_DEFAULT_QUERY_LIMIT));

    return new Promise<KritzelObjectElementInfo[]>((resolve, reject) => {
      const requestId = ++this._requestCounter;
      const timer = setTimeout(() => {
        this._queries.delete(requestId);
        reject(new Error(`The content of object "${this._owner.id}" did not respond.`));
      }, IFRAME_ELEMENT_QUERY_TIMEOUT);
      this._queries.set(requestId, { selector, limit: normalizedLimit, resolve, reject, timer });
      if (this._isReady) {
        this.postQuery(requestId);
      }
    });
  }

  /** Re-sends the state, e.g. with colors of a new theme. */
  refreshTheme(): void {
    this.sync();
  }

  /** Called when the iframe gets a new document. Until it reports `ready`, nothing can be sent to it. */
  onDocumentReset(): void {
    this._isReady = false;
    this.clearHover();
  }

  /** Called when the iframe is unmounted. State is kept and sent again when the object mounts. */
  onUnmounted(): void {
    this._isReady = false;
    this.clearHover();
    const error = new Error(`Object "${this._owner.id}" was unmounted.`);
    this._queries.forEach(query => {
      clearTimeout(query.timer);
      query.reject(error);
    });
    this._queries.clear();
  }

  onInteractivityChange(): void {
    if (!this._owner.isInteractive) {
      this.clearHover();
    }
    this.sync();
  }

  /**
   * Handles a message from the page. Returns `true` if it belonged to the element bridge.
   * The caller must have checked that the message comes from this object's iframe.
   */
  handleMessage(message: Record<string, unknown>): boolean {
    switch (message.type) {
      case IFRAME_ELEMENT_MESSAGES.ready:
        this._isReady = true;
        this.sync();
        // Queries sent to a previous document are lost with it, so all pending ones are sent again.
        this._queries.forEach((_query, requestId) => this.postQuery(requestId));
        return true;
      case IFRAME_ELEMENT_MESSAGES.hover:
        this.handleHover(message);
        return true;
      case IFRAME_ELEMENT_MESSAGES.click:
        this.handleClick(message);
        return true;
      case IFRAME_ELEMENT_MESSAGES.pick:
        this.handlePick(message);
        return true;
      case IFRAME_ELEMENT_MESSAGES.rects:
        this.handleRects(message);
        return true;
      case IFRAME_ELEMENT_MESSAGES.queryResult:
        this.handleQueryResult(message);
        return true;
      default:
        return false;
    }
  }

  private handleHover(message: Record<string, unknown>): void {
    if (!this._owner.isInteractive) {
      return;
    }
    const element = message.element === null ? null : readElementInfo(message.element);
    if (element === null && message.element !== null) {
      return;
    }
    if (element === null && this._hovered === null) {
      return;
    }
    this._hovered = element;
    this._owner.emitHover(element, this._picking.enabled);
  }

  private handleClick(message: Record<string, unknown>): void {
    const element = readElementInfo(message.element);
    if (!element || !this._owner.isInteractive || this._picking.enabled) {
      return;
    }
    this._owner.emitClick(element, readModifiers(message));
  }

  private handlePick(message: Record<string, unknown>): void {
    const element = readElementInfo(message.element);
    if (!element || !this._owner.isInteractive || !this._picking.enabled) {
      return;
    }
    this._owner.emitPick(element, readModifiers(message));
  }

  private handleRects(message: Record<string, unknown>): void {
    if (!isRecord(message.rects)) {
      return;
    }
    for (const [selector, value] of Object.entries(message.rects)) {
      if (!this._tracked.has(selector)) {
        continue;
      }
      // A missing element keeps its last known position, so a cursor pointing at it stays put until it is back.
      const rect = this.clampToContent(readRect(value));
      if (rect) {
        this._rects.set(selector, rect);
      }
    }
  }

  private handleQueryResult(message: Record<string, unknown>): void {
    const requestId = message.requestId;
    const query = typeof requestId === 'number' ? this._queries.get(requestId) : undefined;
    if (!query) {
      return;
    }
    this._queries.delete(requestId as number);
    clearTimeout(query.timer);

    if (typeof message.error === 'string' || !Array.isArray(message.elements)) {
      query.reject(new Error(`Invalid element selector "${query.selector}".`));
      return;
    }
    const elements = message.elements
      .slice(0, query.limit)
      .map(element => readElementInfo(element))
      .filter((element): element is KritzelObjectElementInfo => element !== null);
    const visibleRect = this.clampToContent(elements[0]?.visibleRect ?? null);
    if (visibleRect && this._tracked.has(query.selector)) {
      this._rects.set(query.selector, visibleRect);
    }
    query.resolve(elements);
  }

  /** The page reports positions, so a page could claim any position: they are kept inside the content. */
  private clampToContent(rect: KritzelObjectElementRect | null): KritzelObjectElementRect | null {
    if (!rect) {
      return null;
    }
    const { width, height } = this._owner.getContentSize();
    if (!(width > 0) || !(height > 0)) {
      return { ...rect };
    }
    const left = Math.min(Math.max(rect.x, 0), width);
    const top = Math.min(Math.max(rect.y, 0), height);
    const right = Math.min(Math.max(rect.x + rect.width, 0), width);
    const bottom = Math.min(Math.max(rect.y + rect.height, 0), height);
    if (right <= left && bottom <= top && (rect.width > 0 || rect.height > 0)) {
      return null;
    }
    return { x: left, y: top, width: right - left, height: bottom - top };
  }

  private clearHover(): void {
    if (this._hovered) {
      this._hovered = null;
      this._owner.emitHover(null, this._picking.enabled);
    }
  }

  private postQuery(requestId: number): void {
    const query = this._queries.get(requestId);
    if (query) {
      this.post({ type: IFRAME_ELEMENT_MESSAGES.query, requestId, selector: query.selector, limit: query.limit });
    }
  }

  private sync(): void {
    if (!this._isReady) {
      return;
    }
    this.post({
      type: IFRAME_ELEMENT_MESSAGES.sync,
      interactive: this._owner.isInteractive,
      picking: this._picking.enabled,
      pickSelector: this._picking.selector ?? null,
      pickColor: this._picking.color ?? null,
      highlights: this._highlights.map(highlight => ({ ...highlight })),
      track: Array.from(this._tracked.keys()),
      theme: this.readTheme(),
    });
  }

  private readTheme(): Record<keyof typeof THEME_VARIABLES, string> {
    const iframe = this._owner.getIframe();
    let style: CSSStyleDeclaration | null = null;
    try {
      style = iframe && typeof getComputedStyle === 'function' ? getComputedStyle(iframe) : null;
    } catch {
      style = null;
    }
    const read = ([variable, fallback]: readonly [string, string]) => style?.getPropertyValue(variable)?.trim() || fallback;
    return {
      color: read(THEME_VARIABLES.color),
      backgroundColor: read(THEME_VARIABLES.backgroundColor),
      labelTextColor: read(THEME_VARIABLES.labelTextColor),
    };
  }

  private post(message: Record<string, unknown>): void {
    const target = this._owner.isMounted ? this._owner.getIframe()?.contentWindow : null;
    try {
      target?.postMessage(message, '*');
    } catch {
      // The iframe is navigating or gone; the next `ready` sends the state again.
    }
  }
}
