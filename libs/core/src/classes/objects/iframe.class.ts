import { KritzelMathHelper } from '../../helpers/math.helper';
import { KritzelEmbeddedObject } from '../../interfaces/embedded-object.interface';
import {
  KritzelElementAwareObject,
  KritzelObjectElementHighlight,
  KritzelObjectElementInfo,
  KritzelObjectElementInteraction,
  KritzelObjectElementInteractionOptions,
  KritzelObjectElementInteractionResult,
  KritzelObjectElementQueryOptions,
  KritzelObjectElementPickingOptions,
  KritzelObjectElementRect,
} from '../../interfaces/object-element.interface';
import { KritzelPoint } from '../../interfaces/point.interface';
import { KritzelCore } from '../core/core.class';
import { KritzelBaseObject } from './base-object.class';
import { KritzelIframeElementBridge, KritzelIframeElementBridgeOwner } from './iframe-element-bridge.class';
import { createIframeElementBridgeScript, IFRAME_ELEMENT_PICKING_CSS } from './iframe-element-bridge.script';

const IFRAME_STATE_MESSAGE = 'kritzel-iframe-state';
const IFRAME_PARENT_STATE_MESSAGE = 'kritzel-iframe-parent-state';
const IFRAME_POINTER_MESSAGE = 'kritzel-iframe-pointer';
const IFRAME_CONTEXT_MENU_MESSAGE = 'kritzel-iframe-contextmenu';

const SUPPORTED_SANDBOX_TOKENS = new Set([
  'allow-downloads',
  'allow-forms',
  'allow-modals',
  'allow-orientation-lock',
  'allow-pointer-lock',
  'allow-popups',
  'allow-popups-to-escape-sandbox',
  'allow-presentation',
  'allow-same-origin',
  'allow-scripts',
  'allow-top-navigation-by-user-activation',
]);

export interface KritzelIframeContent {
  html: string;
  css: string;
  script: string;
}

export interface KritzelIframeObjectConfig extends Partial<KritzelIframeContent> {
  /** User-facing name, shown as the title of the object's titlebar. */
  name?: string;
  content?: Partial<KritzelIframeContent>;
  /** Whether the engine's loading placeholder is drawn over the object, see `KritzelBaseObject.setLoading()`. */
  isLoading?: boolean;
  state?: Record<string, unknown>;
  title?: string;
  sandbox?: string[];
  /**
   * A content security policy for the iframe's document, e.g. `"default-src 'none'; script-src 'unsafe-inline'"`
   * to keep its code off the network. None by default.
   */
  contentSecurityPolicy?: string;
  translateX?: number;
  translateY?: number;
  rotation?: number;
  scale?: number;
  width?: number;
  height?: number;
  borderRadius?: number | string;
  boxShadow?: string;
}

export interface KritzelIframeObjectLifecycleContext {
  object: KritzelIframeObject;
  iframe: HTMLIFrameElement | null;
  state: Record<string, unknown>;
}

interface KritzelIframePointerMessage {
  type: typeof IFRAME_POINTER_MESSAGE;
  eventType: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel';
  pointerId: number;
  pointerType: string;
  clientX: number;
  clientY: number;
  screenX: number;
  screenY: number;
  button: number;
  buttons: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

interface KritzelIframePointerBridgeStart {
  pointerId: number;
  clientX: number;
  clientY: number;
  screenX: number;
  screenY: number;
}

interface KritzelIframeContextMenuMessage {
  type: typeof IFRAME_CONTEXT_MENU_MESSAGE;
  clientX: number;
  clientY: number;
  button: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

const iframePointerBridgeStarts = new WeakMap<HTMLIFrameElement, KritzelIframePointerBridgeStart>();

/**
 * Element bridges are transient: kept outside the instances so they are never serialized, cloned or copied,
 * and handed to the instance that replaces an object after a synced update (see `adoptTransientStateFrom`).
 */
const iframeElementBridges = new WeakMap<KritzelIframeObject, KritzelIframeElementBridge>();

/**
 * Iframes that have loaded their first document. Kept per element, so the state is never serialized and stays with
 * the iframe when a synced update hands it to the object that replaces this one (see `adoptTransientStateFrom`).
 */
const loadedIframes = new WeakSet<HTMLIFrameElement>();

export class KritzelIframeObject extends KritzelBaseObject<HTMLIFrameElement> implements KritzelEmbeddedObject, KritzelElementAwareObject {
  override __class__: string = 'KritzelIframeObject';

  content: KritzelIframeContent = { html: '', css: '', script: '' };
  state: Record<string, unknown> = {};
  title: string = 'Embedded content';
  sandbox: string[] = ['allow-scripts'];
  /** The content security policy of the iframe's document, if any. */
  contentSecurityPolicy?: string;
  /** Corner radius: pixels, or any CSS `border-radius`, overriding the theme's. `undefined` uses the theme's. */
  borderRadius?: number | string;
  /** CSS `box-shadow` of this object, overriding the theme's. `undefined` uses the theme's, `'none'` removes it. */
  boxShadow?: string;

  get html(): string { return this.content.html; }
  set html(value: string) { this.content = { ...this.content, html: value }; }

  get css(): string { return this.content.css; }
  set css(value: string) { this.content = { ...this.content, css: value }; }

  get script(): string { return this.content.script; }
  set script(value: string) { this.content = { ...this.content, script: value }; }

  private messageListener: ((event: MessageEvent<unknown>) => void) | null = null;

  constructor(config?: KritzelIframeObjectConfig) {
    super();
    this.name = config?.name;
    this.content = {
      html: config?.content?.html ?? config?.html ?? '',
      css: config?.content?.css ?? config?.css ?? '',
      script: config?.content?.script ?? config?.script ?? '',
    };
    this.isLoading = config?.isLoading ?? false;
    this.state = structuredClone(config?.state ?? {});
    this.title = config?.title ?? 'Embedded content';
    this.sandbox = this.normalizeSandbox(config?.sandbox);
    this.contentSecurityPolicy = config?.contentSecurityPolicy || undefined;
    this.borderRadius = config?.borderRadius;
    this.boxShadow = config?.boxShadow;
    this.translateX = config?.translateX ?? 0;
    this.translateY = config?.translateY ?? 0;
    this.rotation = KritzelMathHelper.degreesToRadians(config?.rotation ?? 0);
    this.scale = config?.scale ?? 1;
    this.width = config?.width ?? 0;
    this.height = config?.height ?? 0;
  }

  static override create(core: KritzelCore, config?: KritzelIframeObjectConfig): KritzelIframeObject {
    const object = new KritzelIframeObject(config);
    object._core = core;
    object.id = object.generateId();
    object.workspaceId = core.store.state.activeWorkspace!.id;
    object.userId = core.user?.id;
    object.scale = config?.scale ?? core.store.state.scale;
    object.zIndex = core.store.currentZIndex;
    return object;
  }

  get sandboxAttribute(): string {
    return this.sandbox.join(' ');
  }

  /**
   * Whether the mounted iframe has loaded its first document. Until then the engine keeps the object invisible, so
   * it fades in with its content instead of showing an empty frame first.
   */
  get isDocumentLoaded(): boolean {
    return this.isMounted && loadedIframes.has(this.elementRef);
  }

  override mount(iframe: HTMLIFrameElement): void {
    if (this.isMounted && this.elementRef === iframe) {
      return;
    }

    if (this.isMounted) {
      this.unmount();
    }

    this.elementRef = iframe;
    this.isMounted = true;
    iframe.title = this.title;
    iframe.setAttribute('sandbox', this.sandboxAttribute);
    iframe.style.pointerEvents = this.isInteractive ? 'auto' : 'none';

    this.messageListener = event => this.handleMessage(event);
    window.addEventListener('message', this.messageListener);
    if (!loadedIframes.has(iframe)) {
      // Listens only from here on, so the blank document a new iframe starts with doesn't count.
      iframe.addEventListener('load', () => {
        loadedIframes.add(iframe);
        this._core?.rerender();
      }, { once: true });
    }
    iframe.srcdoc = this.createSourceDocument();
    this.onMount(this.createLifecycleContext());
  }

  unmount(): void {
    if (!this.isMounted) {
      return;
    }

    const nextState = this.onUnmount(this.createLifecycleContext());
    if (nextState !== undefined) {
      this.state = structuredClone(nextState);
    }

    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = null;
    }

    this.isMounted = false;
    this._elementRef = null as unknown as HTMLIFrameElement;
    iframeElementBridges.get(this)?.onUnmounted();
  }

  setContent(content: Partial<KritzelIframeContent>): void {
    this.content = {
      html: content.html ?? this.content.html,
      css: content.css ?? this.content.css,
      script: content.script ?? this.content.script,
    };

    this.refreshDocument();
    this.persistUpdate();
  }

  setState(state: Record<string, unknown>): void {
    this.state = structuredClone(state);
    this.elementRef?.contentWindow?.postMessage({ type: IFRAME_PARENT_STATE_MESSAGE, state: this.state }, '*');
    this.persistUpdate();
  }

  setIsInteractive(isInteractive: boolean): void {
    const changed = this.isInteractive !== isInteractive;
    this.isInteractive = isInteractive;

    if (this.isMounted && this.elementRef) {
      this.elementRef.style.pointerEvents = isInteractive ? 'auto' : 'none';
      if (!isInteractive) {
        this.elementRef.blur();
      }
    }

    if (changed) {
      iframeElementBridges.get(this)?.onInteractivityChange();
    }
  }

  /** Whether the object is picking elements, see `setElementPicking()`. */
  get isElementPicking(): boolean {
    return iframeElementBridges.get(this)?.isPicking ?? false;
  }

  /**
   * Turns element picking on or off. While picking, the element under the pointer is highlighted and a click
   * picks it (the engine emits `objectElementPick`) instead of reaching the page. Picking needs the object to
   * be interactive, which it is while selected; until then the setting waits.
   */
  setElementPicking(enabled: boolean, options?: KritzelObjectElementPickingOptions): void {
    this.elementBridge.setPicking(enabled, options);
  }

  /** Replaces the element highlights drawn inside the page. Pass an empty array to remove them. */
  setElementHighlights(highlights: KritzelObjectElementHighlight[]): void {
    this.elementBridge.setHighlights(highlights);
  }

  getElementHighlights(): KritzelObjectElementHighlight[] {
    return iframeElementBridges.get(this)?.getHighlights() ?? [];
  }

  /**
   * Describes the elements of the page that match a CSS selector, in document order.
   * Rejects if the selector is invalid, the object isn't mounted or the page doesn't respond.
   */
  queryElements(selector: string, limitOrOptions?: number | KritzelObjectElementQueryOptions): Promise<KritzelObjectElementInfo[]> {
    if (!this.sandbox.includes('allow-scripts')) {
      return Promise.reject(new Error(`Object "${this.id}" runs its content without scripts, so its elements can't be reached.`));
    }
    return this.elementBridge.query(selector, limitOrOptions);
  }

  /**
   * Performs an interaction on the first element of the page that matches a CSS selector, as a user would, e.g.
   * clicks a button or fills a field. Works whether or not the object is selected. Resolves with
   * `completed: false` and a reason when it can't be performed; rejects only for an invalid selector or interaction.
   */
  interactWithElement(
    selector: string,
    interaction: KritzelObjectElementInteraction,
    options?: KritzelObjectElementInteractionOptions,
  ): Promise<KritzelObjectElementInteractionResult> {
    if (!this.sandbox.includes('allow-scripts')) {
      return Promise.resolve({
        completed: false,
        reason: 'unavailable',
        message: `Object "${this.id}" runs its content without scripts, so its elements can't be reached.`,
      });
    }
    return this.elementBridge.interact(selector, interaction, options);
  }

  trackElement(selector: string): void {
    this.elementBridge.track(selector);
  }

  untrackElement(selector: string): void {
    iframeElementBridges.get(this)?.untrack(selector);
  }

  getTrackedElementRect(selector: string): KritzelObjectElementRect | null {
    return iframeElementBridges.get(this)?.getRect(selector) ?? null;
  }

  contentToObjectLocal(point: KritzelPoint): KritzelPoint {
    const scale = this.scale || 1;
    const inset = this.borderWidth || 0;
    return { x: (inset + point.x) / scale, y: (inset + point.y) / scale };
  }

  refreshElementTheme(): void {
    iframeElementBridges.get(this)?.refreshTheme();
  }

  adoptElementStateFrom(previous: unknown): void {
    const elementBridge = previous instanceof KritzelIframeObject && previous !== this ? iframeElementBridges.get(previous) : undefined;
    if (!elementBridge) {
      return;
    }
    iframeElementBridges.delete(previous as KritzelIframeObject);
    iframeElementBridges.set(this, elementBridge);
    elementBridge.attach(this.createElementBridgeOwner());
  }

  hasFocusedInputElement(): boolean {
    return this.isInteractive && this.isMounted && document.activeElement === this.elementRef;
  }

  getEmbeddedContentRoots(): HTMLElement[] {
    return this.isMounted && this.elementRef instanceof HTMLElement && this.elementRef.tagName === 'IFRAME' ? [this.elementRef] : [];
  }

  protected onMount(_context: KritzelIframeObjectLifecycleContext): void {}

  protected onSerialize(context: KritzelIframeObjectLifecycleContext): Record<string, unknown> {
    return context.state;
  }

  protected onUnmount(context: KritzelIframeObjectLifecycleContext): Record<string, unknown> | undefined {
    return context.state;
  }

  override serialize() {
    const nextState = this.onSerialize(this.createLifecycleContext());
    this.state = structuredClone(nextState);
    const messageListener = this.messageListener;
    this.messageListener = null;

    try {
      const serialized = super.serialize() as Record<string, unknown>;
      delete serialized.messageListener;
      return serialized;
    } finally {
      this.messageListener = messageListener;
    }
  }

  override deserialize<T>(object: Record<string, unknown>): T {
    super.deserialize<KritzelIframeObject>(object);
    const nextContent = object.content && typeof object.content === 'object' ? object.content as Partial<KritzelIframeContent> : {};
    this.content = {
      html: typeof nextContent.html === 'string' ? nextContent.html : typeof object.html === 'string' ? object.html : '',
      css: typeof nextContent.css === 'string' ? nextContent.css : typeof object.css === 'string' ? object.css : '',
      script: typeof nextContent.script === 'string' ? nextContent.script : typeof object.script === 'string' ? object.script : '',
    };
    // Documents saved before the loading placeholder moved into the engine may still carry `loadingContent`.
    delete (this as { loadingContent?: unknown }).loadingContent;
    this.state = object.state && typeof object.state === 'object' ? structuredClone(object.state as Record<string, unknown>) : {};
    this.title = typeof object.title === 'string' ? object.title : 'Embedded content';
    this.sandbox = this.normalizeSandbox(Array.isArray(object.sandbox) ? object.sandbox.filter((token): token is string => typeof token === 'string') : undefined);
    this.contentSecurityPolicy = typeof object.contentSecurityPolicy === 'string' && object.contentSecurityPolicy ? object.contentSecurityPolicy : undefined;
    this.borderRadius = (typeof object.borderRadius === 'number' || typeof object.borderRadius === 'string') ? object.borderRadius : undefined;
    this.boxShadow = typeof object.boxShadow === 'string' ? object.boxShadow : undefined;
    this.messageListener = null;
    return this as unknown as T;
  }

  override copy(): KritzelIframeObject {
    const copiedObject = super.copy() as KritzelIframeObject;
    copiedObject.content = { ...this.content };
    copiedObject.state = structuredClone(this.state);
    copiedObject.sandbox = [...this.sandbox];
    copiedObject.contentSecurityPolicy = this.contentSecurityPolicy;
    copiedObject.borderRadius = this.borderRadius;
    copiedObject.boxShadow = this.boxShadow;
    copiedObject.messageListener = null;
    copiedObject._elementRef = null as unknown as HTMLIFrameElement;
    return copiedObject;
  }

  override clone(): KritzelIframeObject {
    const clonedObject = super.clone() as KritzelIframeObject;
    clonedObject.content = { ...this.content };
    clonedObject.state = structuredClone(this.state);
    clonedObject.sandbox = [...this.sandbox];
    clonedObject.contentSecurityPolicy = this.contentSecurityPolicy;
    clonedObject.borderRadius = this.borderRadius;
    clonedObject.boxShadow = this.boxShadow;
    clonedObject.messageListener = null;
    clonedObject.isMounted = false;
    clonedObject._elementRef = null as unknown as HTMLIFrameElement;
    return clonedObject;
  }

  override adoptTransientStateFrom(previous: KritzelBaseObject<any>): void {
    if (!(previous instanceof KritzelIframeObject)) {
      return;
    }

    this.isInteractive = previous.isInteractive;
    this.isSelected = previous.isSelected;
    this.isHovered = previous.isHovered;

    this.adoptElementStateFrom(previous);

    if (!previous.isMounted || !(previous.elementRef instanceof HTMLElement) || previous.elementRef.tagName !== 'IFRAME') {
      return;
    }

    if (previous.messageListener) {
      window.removeEventListener('message', previous.messageListener);
    }

    this._elementRef = previous.elementRef as HTMLIFrameElement;
    this.isMounted = true;
    this.messageListener = event => this.handleMessage(event);
    window.addEventListener('message', this.messageListener);
    this.elementRef.style.pointerEvents = this.isInteractive ? 'auto' : 'none';

    previous.messageListener = null;
    previous.isMounted = false;
    previous._elementRef = null as unknown as HTMLIFrameElement;
  }

  private get elementBridge(): KritzelIframeElementBridge {
    let bridge = iframeElementBridges.get(this);
    if (!bridge) {
      bridge = new KritzelIframeElementBridge(this.createElementBridgeOwner());
      iframeElementBridges.set(this, bridge);
    }
    return bridge;
  }

  private createElementBridgeOwner(): KritzelIframeElementBridgeOwner {
    const object = this;
    return {
      get id() { return object.id; },
      get isInteractive() { return object.isInteractive; },
      get isMounted() { return object.isMounted; },
      getIframe: () => object.isMounted && object.elementRef ? object.elementRef : null,
      getContentSize: () => ({ width: object.totalWidth, height: object.totalHeight }),
      emitHover: (element, isPicking) => object._core?.engine?.emitObjectElementHover?.({ objectId: object.id, element, isPicking }),
      emitClick: (element, modifiers) => object._core?.engine?.emitObjectElementClick?.({ objectId: object.id, element, ...modifiers }),
      emitPick: (element, modifiers) => object._core?.engine?.emitObjectElementPick?.({ objectId: object.id, element, ...modifiers }),
    };
  }

  private createLifecycleContext(): KritzelIframeObjectLifecycleContext {
    return {
      object: this,
      iframe: this.isMounted ? this.elementRef : null,
      state: structuredClone(this.state),
    };
  }

  private normalizeSandbox(tokens: string[] | undefined): string[] {
    const requestedTokens = tokens ?? ['allow-scripts'];
    const normalized = requestedTokens.filter(token => SUPPORTED_SANDBOX_TOKENS.has(token));
    return [...new Set(normalized.length > 0 ? normalized : ['allow-scripts'])];
  }

  private createSourceDocument(): string {
    const content = this.content;
    const state = JSON.stringify(this.state).replace(/</g, '\\u003c');
    const css = content.css.replace(/<\/style/gi, '<\\/style');
    const script = content.script.replace(/<\/script/gi, '<\\/script');
    const computedStyle = this.isMounted ? getComputedStyle(this.elementRef) : null;
    const defaultCursor = computedStyle?.getPropertyValue('--kritzel-global-default-cursor').trim() || 'auto';
    // First in the head, so it covers everything after it.
    const csp = this.contentSecurityPolicy
      ? `<meta http-equiv="Content-Security-Policy" content="${this.contentSecurityPolicy.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')}">`
      : '';
    const pointerCursor = computedStyle?.getPropertyValue('--kritzel-global-pointer-cursor').trim() || defaultCursor;

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    ${csp}
    <style>
      :root {
        --kritzel-iframe-default-cursor: ${defaultCursor};
        --kritzel-iframe-pointer-cursor: ${pointerCursor};
      }
      html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; cursor: var(--kritzel-iframe-default-cursor); }
      button, button *, a, a *, input, textarea, select { cursor: var(--kritzel-iframe-pointer-cursor) !important; }
      ${IFRAME_ELEMENT_PICKING_CSS}
      ${css}
    </style>
    <script>${createIframeElementBridgeScript(this.elementBridge.beginDocument())}<\/script>
  </head>
  <body>
    ${content.html}
    <script>
      const kritzel = globalThis.kritzel = {
        state: ${state},
        setState(nextState) {
          this.state = nextState;
          parent.postMessage({ type: '${IFRAME_STATE_MESSAGE}', state: nextState }, '*');
        },
      };
      globalThis.addEventListener('message', event => {
        if (event.data?.type === '${IFRAME_PARENT_STATE_MESSAGE}' && event.data.state && typeof event.data.state === 'object') {
          kritzel.state = event.data.state;
          globalThis.dispatchEvent(new CustomEvent('kritzelstatechange', { detail: kritzel.state }));
        }
      });
      let bridgedPointerId = null;
      const interactiveSelector = 'button, input, textarea, select, a[href], [contenteditable="true"], [contenteditable=""]';
      const bridgePointerEvent = event => parent.postMessage({
        type: '${IFRAME_POINTER_MESSAGE}',
        eventType: event.type,
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        clientX: event.clientX,
        clientY: event.clientY,
        screenX: event.screenX,
        screenY: event.screenY,
        button: event.button,
        buttons: event.buttons,
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
      }, '*');
      document.addEventListener('pointerdown', event => {
        if (event.target instanceof Element && event.target.closest(interactiveSelector)) return;
        bridgedPointerId = event.pointerId;
        event.preventDefault();
        bridgePointerEvent(event);
      });
      document.addEventListener('pointermove', event => {
        if (event.pointerId !== bridgedPointerId) return;
        event.preventDefault();
        bridgePointerEvent(event);
      });
      const finishPointerBridge = event => {
        if (event.pointerId !== bridgedPointerId) return;
        event.preventDefault();
        bridgePointerEvent(event);
        bridgedPointerId = null;
      };
      document.addEventListener('pointerup', finishPointerBridge);
      document.addEventListener('pointercancel', finishPointerBridge);
      document.addEventListener('contextmenu', event => {
        event.preventDefault();
        parent.postMessage({
          type: '${IFRAME_CONTEXT_MENU_MESSAGE}',
          clientX: event.clientX,
          clientY: event.clientY,
          button: event.button,
          shiftKey: event.shiftKey,
          ctrlKey: event.ctrlKey,
          altKey: event.altKey,
          metaKey: event.metaKey,
        }, '*');
      });
      ${script}
    <\/script>
  </body>
</html>`;
  }

  private handleMessage(event: MessageEvent<unknown>): void {
    if (event.source !== this.elementRef?.contentWindow || !event.data || typeof event.data !== 'object') {
      return;
    }

    const message = event.data as { type?: unknown; state?: unknown };
    if (this.elementBridge.handleMessage(event.data as Record<string, unknown>)) {
      return;
    }

    if (message.type === IFRAME_POINTER_MESSAGE) {
      this.dispatchPointerMessage(event.data as KritzelIframePointerMessage);
      return;
    }

    if (message.type === IFRAME_CONTEXT_MENU_MESSAGE) {
      this.dispatchContextMenuMessage(event.data as KritzelIframeContextMenuMessage);
      return;
    }

    if (message.type !== IFRAME_STATE_MESSAGE || !message.state || typeof message.state !== 'object') {
      return;
    }

    this.state = structuredClone(message.state as Record<string, unknown>);
    this.persistUpdate();
  }

  private dispatchPointerMessage(message: KritzelIframePointerMessage): void {
    if (!this.isMounted || !this.elementRef || !['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].includes(message.eventType)) {
      return;
    }

    const iframeRect = this.elementRef.getBoundingClientRect();
    if (message.eventType === 'pointerdown') {
      const scaleX = this.elementRef.offsetWidth > 0 ? iframeRect.width / this.elementRef.offsetWidth : 1;
      const scaleY = this.elementRef.offsetHeight > 0 ? iframeRect.height / this.elementRef.offsetHeight : 1;
      iframePointerBridgeStarts.set(this.elementRef, {
        pointerId: message.pointerId,
        clientX: iframeRect.left + message.clientX * scaleX,
        clientY: iframeRect.top + message.clientY * scaleY,
        screenX: message.screenX,
        screenY: message.screenY,
      });
    }

    const bridgeStart = iframePointerBridgeStarts.get(this.elementRef);
    const hasBridgeStart = bridgeStart?.pointerId === message.pointerId;
    const clientX = hasBridgeStart ? bridgeStart.clientX + message.screenX - bridgeStart.screenX : iframeRect.left + message.clientX;
    const clientY = hasBridgeStart ? bridgeStart.clientY + message.screenY - bridgeStart.screenY : iframeRect.top + message.clientY;

    this.elementRef.dispatchEvent(new PointerEvent(message.eventType, {
      bubbles: true,
      composed: true,
      cancelable: true,
      pointerId: message.pointerId,
      pointerType: message.pointerType,
      clientX,
      clientY,
      screenX: message.screenX,
      screenY: message.screenY,
      button: message.button,
      buttons: message.buttons,
      shiftKey: message.shiftKey,
      ctrlKey: message.ctrlKey,
      altKey: message.altKey,
      metaKey: message.metaKey,
    }));

    if (message.eventType === 'pointerup' || message.eventType === 'pointercancel') {
      iframePointerBridgeStarts.delete(this.elementRef);
    }
  }

  private dispatchContextMenuMessage(message: KritzelIframeContextMenuMessage): void {
    if (!this.isMounted || !this.elementRef) {
      return;
    }

    const iframeRect = this.elementRef.getBoundingClientRect();

    // Dispatched as a MouseEvent (not PointerEvent) to mirror how browsers
    // natively raise 'contextmenu' for both mouse right-click and touch long-press.
    this.elementRef.dispatchEvent(new MouseEvent('contextmenu', {
      bubbles: true,
      composed: true,
      cancelable: true,
      clientX: iframeRect.left + message.clientX,
      clientY: iframeRect.top + message.clientY,
      button: message.button,
      shiftKey: message.shiftKey,
      ctrlKey: message.ctrlKey,
      altKey: message.altKey,
      metaKey: message.metaKey,
    }));
  }

  private refreshDocument(): void {
    if (this.isMounted && this.elementRef) {
      this.elementRef.srcdoc = this.createSourceDocument();
    }
  }

  private persistUpdate(): void {
    if (this._core?.store?.objects) {
      this.update();
    }
  }
}
