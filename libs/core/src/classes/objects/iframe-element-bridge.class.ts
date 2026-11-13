import {
  UpdrawObjectElementHighlight,
  UpdrawObjectElementInfo,
  UpdrawObjectElementInteraction,
  UpdrawObjectElementInteractionFailureReason,
  UpdrawObjectElementInteractionOptions,
  UpdrawObjectElementInteractionResult,
  UpdrawObjectElementModifiers,
  UpdrawObjectElementPickingOptions,
  UpdrawObjectElementQueryOptions,
  UpdrawObjectElementRect,
  UpdrawObjectElementState,
} from '../../interfaces/object-element.interface';
import { IFRAME_ELEMENT_MESSAGES } from './iframe-element-bridge.script';
import { UpdrawMathHelper } from '../../helpers/math.helper';

/** The object side of the bridge: what the bridge needs from its `UpdrawIframeObject`. */
export interface UpdrawIframeElementBridgeOwner {
  readonly id: string;
  readonly isInteractive: boolean;
  readonly isMounted: boolean;
  /** The mounted iframe, or `null`. */
  getIframe(): HTMLIFrameElement | null;
  /** Size of the content (the iframe's viewport) in CSS pixels, used to keep reported positions inside the object. */
  getContentSize(): { width: number; height: number };
  emitHover(element: UpdrawObjectElementInfo | null, isPicking: boolean): void;
  emitClick(element: UpdrawObjectElementInfo, modifiers: UpdrawObjectElementModifiers): void;
  emitPick(element: UpdrawObjectElementInfo, modifiers: UpdrawObjectElementModifiers): void;
}

interface PendingQuery {
  selector: string;
  limit: number;
  interactiveOnly: boolean;
  includeValues: boolean;
  resolve: (elements: UpdrawObjectElementInfo[]) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout> | null;
  /** Whether the timer waits for an answer (started when the query was first sent) rather than for the page to load. */
  isAwaitingAnswer: boolean;
  /** Time after which the query fails whatever the page does, so a page that keeps reloading can't hold it forever. */
  deadline: number;
}

interface PendingInteraction {
  selector: string;
  interaction: UpdrawObjectElementInteraction;
  trial: boolean;
  resolve: (result: UpdrawObjectElementInteractionResult) => void;
  timer: ReturnType<typeof setTimeout> | null;
  /** Whether it was sent. A sent interaction is never sent again: the page may have performed it. */
  isSent: boolean;
}

interface SyncVersion {
  picking: boolean;
  /** When a newer state was sent, or `null` while this is the newest state. */
  supersededAt: number | null;
}

/** How long the page has to answer a query once it was sent. */
export const IFRAME_ELEMENT_QUERY_TIMEOUT = 3000;
/** How long a query waits for the page to load, e.g. right after the content was replaced. */
export const IFRAME_ELEMENT_LOAD_TIMEOUT = 15000;
export const IFRAME_ELEMENT_DEFAULT_QUERY_LIMIT = 100;
export const IFRAME_ELEMENT_MAX_QUERY_LIMIT = 500;
/** How long the page has to answer an interaction once it was sent. The content's handlers run before it answers. */
export const IFRAME_ELEMENT_INTERACTION_TIMEOUT = 5000;
/** Longest value of a `'fill'` interaction. */
export const IFRAME_ELEMENT_MAX_FILL_LENGTH = 100_000;
const MAX_KEY_LENGTH = 100;
/** Largest scroll distance of a `'scroll'` interaction, in CSS pixels. */
const MAX_SCROLL_DELTA = 100_000;
const INTERACTION_FAILURE_REASONS = new Set<unknown>(['not-found', 'not-visible', 'disabled', 'covered', 'not-editable', 'not-checkable', 'not-scrollable', 'invalid-value']);

const MAX_SELECTOR_LENGTH = 2000;
const MAX_STRING_LENGTH = 500;
const MAX_LIST_LENGTH = 50;
const MAX_HIGHLIGHTS = 50;
const MAX_TRACKED = 50;
/** How long the page may still report clicks and picks for a state after a newer one was sent. */
const VERSION_GRACE_PERIOD = 1000;
const BRIDGE_MESSAGE_TYPES = new Set<unknown>(Object.values(IFRAME_ELEMENT_MESSAGES));

const THEME_VARIABLES = {
  color: ['--updraw-element-highlight-color', '#007AFF'],
  backgroundColor: ['--updraw-element-highlight-background-color', 'rgba(0, 122, 255, 0.12)'],
  labelTextColor: ['--updraw-element-highlight-label-text-color', '#ffffff'],
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function readString(value: unknown, maxLength: number = MAX_STRING_LENGTH): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value.slice(0, maxLength) : undefined;
}

function readRect(value: unknown): UpdrawObjectElementRect | null {
  if (!isRecord(value)) {
    return null;
  }
  const { x, y, width, height } = value;
  if (!UpdrawMathHelper.isFiniteNumber(x) || !UpdrawMathHelper.isFiniteNumber(y) || !UpdrawMathHelper.isFiniteNumber(width) || !UpdrawMathHelper.isFiniteNumber(height) || width < 0 || height < 0) {
    return null;
  }
  return { x, y, width, height };
}

/** Validates an element description sent by a page, which is untrusted content. */
export function readElementInfo(value: unknown): UpdrawObjectElementInfo | null {
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

  const info: UpdrawObjectElementInfo = { selector, tagName: tagName.toLowerCase(), classList, attributes, rect };
  const visibleRect = readRect(value.visibleRect);
  if (visibleRect) info.visibleRect = visibleRect;
  const updrawId = readString(value.updrawId);
  const id = readString(value.id);
  const text = readString(value.text);
  if (updrawId) info.updrawId = updrawId;
  if (id) info.id = id;
  if (text) info.text = text;
  const state = readState(value.state);
  if (state) info.state = state;
  // An empty value is a value: an empty text field.
  if (typeof value.value === 'string') info.value = value.value.slice(0, MAX_STRING_LENGTH);
  return info;
}

/** Validates the state of an element: only known fields, with the right types. */
function readState(value: unknown): UpdrawObjectElementState | null {
  if (!isRecord(value)) {
    return null;
  }
  const state: UpdrawObjectElementState = {};
  for (const key of ['disabled', 'selected', 'open', 'focused', 'editable', 'playing'] as const) {
    if (typeof value[key] === 'boolean') state[key] = value[key];
  }
  if (typeof value.checked === 'boolean' || value.checked === 'mixed') state.checked = value.checked;
  return Object.keys(state).length > 0 ? state : null;
}

/**
 * Validates an interaction and returns a copy with only its known fields, so nothing else reaches the page.
 * Throws for invalid ones.
 */
export function readElementInteraction(value: unknown): UpdrawObjectElementInteraction {
  if (!isRecord(value)) {
    throw new Error('An interaction must be an object with a "type".');
  }
  switch (value.type) {
    case 'click':
      if (value.count !== undefined && value.count !== 1 && value.count !== 2) {
        throw new Error('"count" must be 1 or 2.');
      }
      return value.count === 2 ? { type: 'click', count: 2 } : { type: 'click' };
    case 'hover':
      return { type: 'hover' };
    case 'fill':
      if (typeof value.value !== 'string') {
        throw new Error('"value" must be a string.');
      }
      if (value.value.length > IFRAME_ELEMENT_MAX_FILL_LENGTH) {
        throw new Error(`"value" is longer than ${IFRAME_ELEMENT_MAX_FILL_LENGTH} characters.`);
      }
      return { type: 'fill', value: value.value };
    case 'check':
      if (value.checked !== undefined && typeof value.checked !== 'boolean') {
        throw new Error('"checked" must be a boolean.');
      }
      return { type: 'check', checked: value.checked !== false };
    case 'press':
      if (typeof value.key !== 'string' || value.key.length === 0 || value.key.length > MAX_KEY_LENGTH) {
        throw new Error(`"key" must be a key name such as "Enter" or "Control+a", at most ${MAX_KEY_LENGTH} characters.`);
      }
      return { type: 'press', key: value.key };
    case 'scroll': {
      const delta = (field: 'deltaX' | 'deltaY'): number => {
        const amount = value[field];
        if (amount === undefined) return 0;
        if (!UpdrawMathHelper.isFiniteNumber(amount) || Math.abs(amount) > MAX_SCROLL_DELTA) {
          throw new Error(`"${field}" must be a number between -${MAX_SCROLL_DELTA} and ${MAX_SCROLL_DELTA}.`);
        }
        return amount;
      };
      const deltaX = delta('deltaX');
      const deltaY = delta('deltaY');
      if (deltaX === 0 && deltaY === 0) {
        throw new Error('Give "deltaX", "deltaY" or both.');
      }
      return { type: 'scroll', deltaX, deltaY };
    }
    default:
      throw new Error(`Unknown interaction type "${String(value.type)}". Use click, hover, fill, check, press or scroll.`);
  }
}

function unavailable(message: string): UpdrawObjectElementInteractionResult {
  return { completed: false, reason: 'unavailable', message };
}

function readModifiers(value: Record<string, unknown>): UpdrawObjectElementModifiers {
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
 * Host side of the element bridge of an `UpdrawIframeObject`: keeps the transient element state (picking,
 * highlights, tracked elements, pending queries), sends it to the page whenever the page (re)loads or the state
 * changes, and validates what the page reports. The page runs untrusted content, so every message is checked
 * and hovers, clicks and picks are only accepted in the states in which a user could have caused them. A page can
 * still report them without a real user gesture in those states, so their contents stay untrusted.
 */
export class UpdrawIframeElementBridge {
  private _owner: UpdrawIframeElementBridgeOwner;
  private _isReady = false;
  private _picking: { enabled: boolean; selector?: string; color?: string } = { enabled: false };
  private _highlights: UpdrawObjectElementHighlight[] = [];
  private readonly _tracked = new Map<string, number>();
  private readonly _rects = new Map<string, UpdrawObjectElementRect>();
  private readonly _queries = new Map<number, PendingQuery>();
  private readonly _interactions = new Map<number, PendingInteraction>();
  private _hovered: UpdrawObjectElementInfo | null = null;
  private _requestCounter = 0;
  /** Token of the current document. The page sends it with every message, so messages of replaced documents are ignored. */
  private _document = 0;
  /**
   * Every sync has a version, and the page sends the version it applied with hovers, clicks and picks. The host
   * judges them by the state the page had: a click right after picking was turned on is still a click.
   */
  private _syncVersion = 0;
  private readonly _versions = new Map<number, SyncVersion>([[0, { picking: false, supersededAt: null }]]);

  constructor(owner: UpdrawIframeElementBridgeOwner) {
    this._owner = owner;
  }

  /** Hands the bridge to the object instance that replaced its owner, e.g. after a synced update. */
  attach(owner: UpdrawIframeElementBridgeOwner): void {
    this._owner = owner;
  }

  get isPicking(): boolean {
    return this._picking.enabled;
  }

  get isReady(): boolean {
    return this._isReady;
  }

  /** Token of the current document, see `beginDocument()`. */
  get documentToken(): number {
    return this._document;
  }

  /** Version of the last state sent to the page. */
  get syncVersion(): number {
    return this._syncVersion;
  }

  get hoveredElement(): UpdrawObjectElementInfo | null {
    return this._hovered;
  }

  get pickingOptions(): UpdrawObjectElementPickingOptions {
    return { selector: this._picking.selector, color: this._picking.color };
  }

  setPicking(enabled: boolean, options: UpdrawObjectElementPickingOptions = {}): void {
    if (options.selector !== undefined && options.selector !== '' && !isValidElementSelector(options.selector)) {
      throw new Error(`Invalid picking selector "${options.selector}".`);
    }
    this._picking = enabled
      ? { enabled: true, selector: options.selector || undefined, color: options.color || undefined }
      : { enabled: false };
    // The page answers with the hovered element resolved for the new mode.
    this.sync();
  }

  setHighlights(highlights: UpdrawObjectElementHighlight[]): void {
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
      const next: UpdrawObjectElementHighlight = { selector: highlight.selector };
      if (typeof highlight.color === 'string' && highlight.color) next.color = highlight.color;
      if (typeof highlight.label === 'string' && highlight.label) next.label = highlight.label;
      return next;
    });
    this.sync();
  }

  getHighlights(): UpdrawObjectElementHighlight[] {
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

  getRect(selector: string): UpdrawObjectElementRect | null {
    const rect = this._rects.get(selector);
    return rect ? { ...rect } : null;
  }

  query(selector: string, limitOrOptions: number | UpdrawObjectElementQueryOptions = IFRAME_ELEMENT_DEFAULT_QUERY_LIMIT): Promise<UpdrawObjectElementInfo[]> {
    if (!isValidElementSelector(selector)) {
      return Promise.reject(new Error(`Invalid element selector "${selector}".`));
    }
    if (!this._owner.isMounted || !this._owner.getIframe()) {
      return Promise.reject(new Error(`Object "${this._owner.id}" is not mounted. Its content can only be queried while it is in or near the viewport.`));
    }
    const options: UpdrawObjectElementQueryOptions = isRecord(limitOrOptions) ? limitOrOptions : { limit: limitOrOptions as number };
    const normalizedLimit = Math.max(1, Math.min(IFRAME_ELEMENT_MAX_QUERY_LIMIT, Math.floor(Number(options.limit)) || IFRAME_ELEMENT_DEFAULT_QUERY_LIMIT));
    const interactiveOnly = options.interactiveOnly === true;
    const includeValues = options.includeValues === true;

    return new Promise<UpdrawObjectElementInfo[]>((resolve, reject) => {
      const requestId = ++this._requestCounter;
      const deadline = Date.now() + IFRAME_ELEMENT_LOAD_TIMEOUT;
      this._queries.set(requestId, { selector, limit: normalizedLimit, interactiveOnly, includeValues, resolve, reject, timer: null, isAwaitingAnswer: false, deadline });
      if (this._isReady) {
        this.postQuery(requestId);
      } else {
        this.startQueryTimer(requestId, IFRAME_ELEMENT_LOAD_TIMEOUT, `The content of object "${this._owner.id}" did not finish loading.`);
      }
    });
  }

  /**
   * Asks the page to perform an interaction on the first element that matches a selector. Rejects for an invalid
   * selector or interaction; every other failure resolves with `completed: false`. An interaction waits for the
   * page to load, but is never sent twice: if the page reloads after it was sent, it fails, because the page may
   * have performed it.
   */
  interact(
    selector: string,
    interaction: UpdrawObjectElementInteraction,
    options: UpdrawObjectElementInteractionOptions = {},
  ): Promise<UpdrawObjectElementInteractionResult> {
    if (!isValidElementSelector(selector)) {
      return Promise.reject(new Error(`Invalid element selector "${selector}".`));
    }
    let checked: UpdrawObjectElementInteraction;
    try {
      checked = readElementInteraction(interaction);
    } catch (error) {
      return Promise.reject(error);
    }
    if (!this._owner.isMounted || !this._owner.getIframe()) {
      return Promise.resolve(unavailable(`Object "${this._owner.id}" is not mounted. Its content can only be reached while it is in or near the viewport.`));
    }

    return new Promise<UpdrawObjectElementInteractionResult>(resolve => {
      const requestId = ++this._requestCounter;
      this._interactions.set(requestId, { selector, interaction: checked, trial: options.trial === true, resolve, timer: null, isSent: false });
      if (this._isReady) {
        this.postInteraction(requestId);
      } else {
        this.startInteractionTimer(requestId, IFRAME_ELEMENT_LOAD_TIMEOUT, `The content of object "${this._owner.id}" did not finish loading.`);
      }
    });
  }

  /** Re-sends the state, e.g. with colors of a new theme. */
  refreshTheme(): void {
    this.sync();
  }

  /**
   * Called for every new document of the iframe. Until it reports `ready`, nothing can be sent to it.
   * @returns The token the document's bridge script has to send with its messages.
   */
  beginDocument(): number {
    this._document++;
    this._isReady = false;
    this.clearHover();
    this.failSentInteractions(`The content of object "${this._owner.id}" was replaced while it handled the interaction.`);
    return this._document;
  }

  /** Called when the iframe is unmounted. State is kept and sent again when the object mounts. */
  onUnmounted(): void {
    this._isReady = false;
    this.clearHover();
    const error = new Error(`Object "${this._owner.id}" was unmounted.`);
    this._queries.forEach(query => {
      if (query.timer) clearTimeout(query.timer);
      query.reject(error);
    });
    this._queries.clear();
    this._interactions.forEach(pending => {
      if (pending.timer) clearTimeout(pending.timer);
      pending.resolve(unavailable(error.message));
    });
    this._interactions.clear();
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
    if (!BRIDGE_MESSAGE_TYPES.has(message.type)) {
      return false;
    }
    if (message.doc !== this._document) {
      // A message of a document that was replaced while it was on its way.
      return true;
    }
    switch (message.type) {
      case IFRAME_ELEMENT_MESSAGES.ready:
        if (this._isReady) {
          // The document reloaded without a new srcdoc, e.g. because the iframe moved in the DOM. It ignored queries
          // while it loaded, so they get a new answer timeout, still bounded by their deadline.
          this.clearHover();
          this._queries.forEach(query => {
            query.isAwaitingAnswer = false;
          });
        }
        this._isReady = true;
        // A new document starts in the initial state until it applied the sync below.
        this._versions.set(0, { picking: false, supersededAt: null });
        this.sync();
        // Queries sent to a previous document are lost with it, so all pending ones are sent again.
        this._queries.forEach((_query, requestId) => this.postQuery(requestId));
        // Interactions are not: the previous document may have performed them before it went away.
        this.failSentInteractions(`The content of object "${this._owner.id}" reloaded while it handled the interaction.`);
        this._interactions.forEach((_pending, requestId) => this.postInteraction(requestId));
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
      case IFRAME_ELEMENT_MESSAGES.interactResult:
        this.handleInteractionResult(message);
        return true;
      default:
        return true;
    }
  }

  private handleHover(message: Record<string, unknown>): void {
    if (!this._owner.isInteractive) {
      return;
    }
    const element = message.element === null ? null : this.readContentElement(message.element);
    if (element === null && message.element !== null) {
      return;
    }
    if (element === null && this._hovered === null) {
      return;
    }
    this._hovered = element;
    this._owner.emitHover(element, this.pickingAt(message.version) ?? this._picking.enabled);
  }

  private handleClick(message: Record<string, unknown>): void {
    const element = this.readContentElement(message.element);
    if (!element || !this._owner.isInteractive || this.pickingAt(message.version) !== false) {
      return;
    }
    this._owner.emitClick(element, readModifiers(message));
  }

  private handlePick(message: Record<string, unknown>): void {
    const element = this.readContentElement(message.element);
    if (!element || !this._owner.isInteractive || this.pickingAt(message.version) !== true) {
      return;
    }
    this._owner.emitPick(element, readModifiers(message));
  }

  /**
   * Whether the page was picking in the state of a sync version. `undefined` for versions the host never sent and
   * for states that were replaced more than a moment ago: the page applies a new state within one round trip, so
   * only a click on its way while the state changed may cite the previous one.
   */
  private pickingAt(version: unknown): boolean | undefined {
    const entry = typeof version === 'number' ? this._versions.get(version) : undefined;
    if (!entry || (entry.supersededAt !== null && Date.now() - entry.supersededAt > VERSION_GRACE_PERIOD)) {
      return undefined;
    }
    return entry.picking;
  }

  /** An element description from the page, with its visible part kept inside the content like tracked positions. */
  private readContentElement(value: unknown): UpdrawObjectElementInfo | null {
    const element = readElementInfo(value);
    if (element?.visibleRect) {
      const visibleRect = this.clampToContent(element.visibleRect);
      if (visibleRect) {
        element.visibleRect = visibleRect;
      } else {
        delete element.visibleRect;
      }
    }
    return element;
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
    if (query.timer) clearTimeout(query.timer);

    if (typeof message.error === 'string' || !Array.isArray(message.elements)) {
      query.reject(new Error(`Invalid element selector "${query.selector}".`));
      return;
    }
    const elements = message.elements
      .slice(0, query.limit)
      .map(element => this.readContentElement(element))
      .filter((element): element is UpdrawObjectElementInfo => element !== null);
    const visibleRect = elements[0]?.visibleRect;
    if (visibleRect && this._tracked.has(query.selector)) {
      this._rects.set(query.selector, { ...visibleRect });
    }
    query.resolve(elements);
  }

  private handleInteractionResult(message: Record<string, unknown>): void {
    const requestId = message.requestId;
    const pending = typeof requestId === 'number' ? this._interactions.get(requestId) : undefined;
    if (!pending || !pending.isSent) {
      return;
    }
    this._interactions.delete(requestId as number);
    if (pending.timer) clearTimeout(pending.timer);

    const element = message.element === undefined ? null : this.readContentElement(message.element);
    const result: UpdrawObjectElementInteractionResult = { completed: message.failure === undefined };
    if (!result.completed) {
      result.reason = INTERACTION_FAILURE_REASONS.has(message.failure) ? (message.failure as UpdrawObjectElementInteractionFailureReason) : 'unavailable';
      const text = readString(message.message);
      if (text) result.message = text;
      const coveredBy = message.coveredBy === undefined ? null : this.readContentElement(message.coveredBy);
      if (coveredBy && result.reason === 'covered') result.coveredBy = coveredBy;
    }
    if (element) result.element = element;
    pending.resolve(result);
  }

  /** The page reports positions, so a page could claim any position: they are kept inside the content. */
  private clampToContent(rect: UpdrawObjectElementRect | null): UpdrawObjectElementRect | null {
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
    if (!query) {
      return;
    }
    this.post({
      type: IFRAME_ELEMENT_MESSAGES.query,
      requestId,
      selector: query.selector,
      limit: query.limit,
      interactiveOnly: query.interactiveOnly,
      includeValues: query.includeValues,
    });
    // The answer timeout starts once and is never extended by later re-sends, e.g. after the page reloaded.
    if (!query.isAwaitingAnswer) {
      query.isAwaitingAnswer = true;
      this.startQueryTimer(requestId, IFRAME_ELEMENT_QUERY_TIMEOUT, `The content of object "${this._owner.id}" did not respond.`);
    }
  }

  private postInteraction(requestId: number): void {
    const pending = this._interactions.get(requestId);
    if (!pending || pending.isSent) {
      return;
    }
    pending.isSent = true;
    this.post({ type: IFRAME_ELEMENT_MESSAGES.interact, requestId, selector: pending.selector, interaction: pending.interaction, trial: pending.trial });
    this.startInteractionTimer(requestId, IFRAME_ELEMENT_INTERACTION_TIMEOUT, `The content of object "${this._owner.id}" did not respond.`);
  }

  private startInteractionTimer(requestId: number, timeout: number, message: string): void {
    const pending = this._interactions.get(requestId);
    if (!pending) {
      return;
    }
    if (pending.timer) {
      clearTimeout(pending.timer);
    }
    pending.timer = setTimeout(() => {
      this._interactions.delete(requestId);
      pending.resolve(unavailable(message));
    }, timeout);
  }

  /** Fails the interactions that were sent to a document that is gone. */
  private failSentInteractions(message: string): void {
    this._interactions.forEach((pending, requestId) => {
      if (!pending.isSent) {
        return;
      }
      if (pending.timer) clearTimeout(pending.timer);
      this._interactions.delete(requestId);
      pending.resolve(unavailable(message));
    });
  }

  private startQueryTimer(requestId: number, timeout: number, message: string): void {
    const query = this._queries.get(requestId);
    if (!query) {
      return;
    }
    if (query.timer) {
      clearTimeout(query.timer);
    }
    query.timer = setTimeout(() => {
      this._queries.delete(requestId);
      query.reject(new Error(message));
    }, Math.max(0, Math.min(timeout, query.deadline - Date.now())));
  }

  private sync(): void {
    if (!this._isReady) {
      return;
    }
    const version = ++this._syncVersion;
    const now = Date.now();
    this._versions.forEach((entry, key) => {
      if (entry.supersededAt === null) {
        entry.supersededAt = now;
      } else if (now - entry.supersededAt > VERSION_GRACE_PERIOD) {
        this._versions.delete(key);
      }
    });
    this._versions.set(version, { picking: this._picking.enabled, supersededAt: null });
    this.post({
      type: IFRAME_ELEMENT_MESSAGES.sync,
      version,
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
