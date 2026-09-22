import { KritzelCore } from '../core/core.class';
import { KritzelBaseObject } from './base-object.class';
import { KritzelMathHelper } from '../../helpers/math.helper';
import { KritzelDynamicObjectRendererRegistry } from '../registries/dynamic-object-renderer.registry';
import { KritzelHTMLHelper } from '../../helpers/html.helper';
import { KritzelEmbeddedObject } from '../../interfaces/embedded-object.interface';

/**
 * Configuration options for creating a KritzelDynamicObject instance.
 */
export interface KritzelDynamicObjectConfig {
  element?: HTMLElement;
  rendererKey?: string;
  rendererData?: unknown;
  translateX?: number;
  translateY?: number;
  rotation?: number;
  scale?: number;
  height?: number;
  width?: number;
}

/**
 * Represents a custom HTML element that can be placed and manipulated on the Kritzel canvas.
 * Extends KritzelBaseObject to inherit common object functionality like positioning,
 * scaling, and lifecycle management.
 */
export class KritzelDynamicObject extends KritzelBaseObject<HTMLElement> implements KritzelEmbeddedObject {
  override __class__: string = 'KritzelDynamicObject';

  /** The HTML element to be rendered on the canvas. */
  element!: HTMLElement;

  /**
   * Optional identifier for a registered renderer (e.g., 'angular-component', 'react-default').
   * When set, mount() resolves the renderer from a global registry and delegates lifecycle.
   * If null, falls back to DOM element mounting.
   */
  rendererKey: string | null = null;

  /**
   * Custom data payload for the renderer (e.g., Angular component inputs, React props, Vue data).
   * Only meaningful when rendererKey is set. Captured on unmount and restored on rehydrate.
   */
  rendererData?: unknown;

  /**
   * Creates a new KritzelDynamicObject instance.
   * @param config - Optional configuration object for the dynamic object.
   * @param config.element - The HTML element to wrap.
   * @param config.translateX - Initial X position offset. Defaults to 0.
   * @param config.translateY - Initial Y position offset. Defaults to 0.
   * @param config.scale - Initial scale factor. Defaults to 1.
   * @param config.height - Initial height in pixels. Defaults to 0.
   * @param config.width - Initial width in pixels. Defaults to 0.
   */
  constructor(config?: KritzelDynamicObjectConfig) {
    super();

    if (config) {
      this.translateX = config.translateX || 0;
      this.translateY = config.translateY || 0;
      this.rotation = KritzelMathHelper.degreesToRadians(config.rotation ?? 0);
      this.scale = config.scale || 1;
      this.element = config.element ?? this.createPlaceholder();
      this.height = config.height || 0;
      this.width = config.width || 0;
      this.rendererKey = config.rendererKey ?? null;
      this.rendererData = config.rendererData;
    }
  }

  /**
   * Factory method to create a new KritzelDynamicObject with proper core binding.
   * Generates a unique ID and assigns the element to the active workspace.
   * @param core - The KritzelCore instance for state management and ID generation.
   * @param config - Optional configuration object for the dynamic object.
   * @param config.element - The HTML element to wrap.
   * @param config.translateX - Initial X position offset.
   * @param config.translateY - Initial Y position offset.
   * @param config.scale - Initial scale factor.
   * @param config.height - Initial height in pixels.
   * @param config.width - Initial width in pixels.
   * @returns A new KritzelBaseObject instance bound to the core.
   */
  static override create(core: KritzelCore, config?: KritzelDynamicObjectConfig): KritzelBaseObject<Element> {
    const object = new KritzelDynamicObject(config);

    object._core = core;
    object.id = object.generateId();
    object.workspaceId = core.store.state.activeWorkspace!.id;
    object.userId = core.user?.id;
    object.zIndex = core.store.currentZIndex;

    return object;
  }

  /**
   * Mounts the dynamic object to a container element in the DOM.
   * If a renderer is registered for this.rendererKey, delegates to the renderer.
   * Otherwise, uses the standard DOM element mounting fallback.
   * Skips mounting if already mounted to the same container with content attached.
   * @param element - The container HTML element to mount this dynamic object into.
   */
  override mount(element: HTMLElement): void {
    if (element === null) {
      return;
    }

    this.applyInteractiveState();

    if (this.isMounted && this.elementRef === element) {
      // Renderer-based mounts should not be re-invoked on every engine rerender.
      if (this.rendererKey) {
        return;
      }

      // For direct DOM fallback, remount only if content was detached.
      if (this.element.parentElement === element) {
        return;
      }
    }

    this.elementRef = element;
    this.isMounted = true;

    // Try renderer-based approach if a key is set
    if (this.rendererKey) {
      const renderer = KritzelDynamicObjectRendererRegistry.get(this.rendererKey);
      if (renderer) {
        element.innerHTML = ''; // Clear container
        renderer.onMount({
          object: this,
          container: element,
          data: this.rendererData,
        });
        this.applyInteractiveState();
        return;
      }
    }

    // Fallback to standard DOM mounting
    this.elementRef.innerHTML = '';
    this.elementRef.appendChild(this.element);
    this.applyInteractiveState();
  }

  /**
   * Updates interactivity state for embedded HTML content.
   * When disabling interactivity, any focused descendant is blurred so
   * keyboard input is released immediately.
   */
  setIsInteractive(isInteractive: boolean): void {
    const hasChanged = this.isInteractive !== isInteractive;
    this.isInteractive = isInteractive;
    this.applyInteractiveState();

    if (hasChanged && !isInteractive) {
      this.blurFocusedDescendant();
    }
  }

  private applyInteractiveState(): void {
    const pointerEvents = this.isInteractive ? 'auto' : 'none';
    const contentCursor = this.isInteractive ? 'auto' : '';

    if (this.element) {
      this.element.style.pointerEvents = pointerEvents;
      this.element.style.cursor = contentCursor;
    }

    if (this.elementRef instanceof HTMLElement) {
      // Keep the mount container clickable so unselected dynamic objects can still be selected.
      this.elementRef.style.pointerEvents = 'auto';
      this.elementRef.style.cursor = '';

      Array.from(this.elementRef.children).forEach(child => {
        if (child instanceof HTMLElement) {
          child.style.pointerEvents = pointerEvents;
          child.style.cursor = contentCursor;
        }
      });
    }
  }

  private blurFocusedDescendant(): void {
    if (!this.element && !(this.elementRef instanceof HTMLElement)) {
      return;
    }

    const activeElement = this.getDeepActiveElement();
    const isInsideElement = !!this.element && this.isNodeInsideHost(activeElement, this.element);
    const isInsideMountedContainer = this.elementRef instanceof HTMLElement && this.isNodeInsideHost(activeElement, this.elementRef);
    if (activeElement && (isInsideElement || isInsideMountedContainer)) {
      activeElement.blur();
    }
  }

  /**
   * Returns true when a text-input-like element inside this dynamic object
   * currently owns focus.
   */
  hasFocusedInputElement(): boolean {
    if (!this.isInteractive) {
      return false;
    }

    const focusHosts = this.getEmbeddedContentRoots();

    // Primary path: locate the focused input-like element by walking from each host through
    // `:focus` (piercing open shadow roots). This works in real browsers even when the engine
    // and editor are nested web components, because it never relies on the document-level
    // active element resolving to a descendant of the host.
    if (focusHosts.some(host => this.hasFocusedInputDescendant(host))) {
      return true;
    }

    // Fallback path: resolve the deep active element and confirm it is input-like and inside a
    // host. Covers contenteditable content inside nested shadow roots (which `querySelector`
    // cannot reach) and test environments that mock the active element without real focus.
    const activeElement = this.getDeepActiveElement();
    if (activeElement && this.isInputLikeElement(activeElement) && focusHosts.some(host => this.isNodeInsideHost(activeElement, host))) {
      return true;
    }

    return false;
  }

  getEmbeddedContentRoots(): HTMLElement[] {
    const hosts: HTMLElement[] = [];

    if (this.element) {
      hosts.push(this.element);
    }

    if (this.elementRef instanceof HTMLElement) {
      hosts.push(this.elementRef);
      const firstChild = this.elementRef.firstElementChild;
      if (firstChild instanceof HTMLElement) {
        hosts.push(firstChild);
      }
    }

    return hosts;
  }

  /**
   * Returns true when the given host (or, via the flat tree, one of its shadow descendants)
   * currently contains a focused input-like element.
   */
  private hasFocusedInputDescendant(host: HTMLElement): boolean {
    if (this.isInputLikeElement(host) && this.matchesFocus(host)) {
      return true;
    }

    // `:focus-within` crosses shadow boundaries for the host, so it is a cheap guard that tells
    // us whether focus lives anywhere inside this host before doing the deeper traversal.
    if (typeof host.matches === 'function') {
      try {
        if (!host.matches(':focus-within')) {
          return false;
        }
      } catch {
        // Selector unsupported in this environment; fall through to the traversal below.
      }
    }

    return this.findFocusedInputLikeElement(host) !== null;
  }

  /**
   * Walks the `:focus` chain from a tree scope, descending into open shadow roots, and returns
   * the focused element when it is input-like.
   */
  private findFocusedInputLikeElement(root: HTMLElement | ShadowRoot): HTMLElement | null {
    let focused: Element | null = null;
    try {
      focused = root.querySelector(':focus');
    } catch {
      focused = null;
    }

    if (!(focused instanceof HTMLElement)) {
      return null;
    }

    if (this.isInputLikeElement(focused)) {
      return focused;
    }

    if (focused.shadowRoot) {
      return this.findFocusedInputLikeElement(focused.shadowRoot);
    }

    return null;
  }

  private matchesFocus(element: HTMLElement): boolean {
    if (typeof element.matches !== 'function') {
      return false;
    }

    try {
      return element.matches(':focus');
    } catch {
      return false;
    }
  }

  private isInputLikeElement(element: HTMLElement): boolean {
    const tag = element.tagName;
    return (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      element.isContentEditable
    );
  }

  private isNodeInsideHost(node: Node | null, host: HTMLElement): boolean {
    if (!node) {
      return false;
    }

    let current: Node | null = node;
    while (current) {
      if (current === host) {
        return true;
      }

      if (current.parentNode) {
        current = current.parentNode;
        continue;
      }

      const root = current.getRootNode();
      if (root instanceof ShadowRoot) {
        current = root.host;
        continue;
      }

      break;
    }

    return false;
  }

  private getDeepActiveElement(root: Document | ShadowRoot = document): HTMLElement | null {
    const activeElement = root.activeElement;
    if (!(activeElement instanceof HTMLElement)) {
      return null;
    }

    if (activeElement.shadowRoot) {
      const nested = this.getDeepActiveElement(activeElement.shadowRoot);
      return nested ?? activeElement;
    }

    return activeElement;
  }

  /**
   * Unmounts the dynamic object and performs cleanup.
   * If a renderer is registered, delegates to renderer.onUnmount and captures returned state.
   * Otherwise, simply removes from DOM.
   * Called when object is deleted, viewport culled, or editor is unloading.
   */
  unmount(): void {
    if (!this.isMounted || !this.elementRef) {
      return;
    }

    // Try renderer-based unmount if renderer is registered
    if (this.rendererKey) {
      const renderer = KritzelDynamicObjectRendererRegistry.get(this.rendererKey);
      if (renderer) {
        // Capture any updated data returned by renderer
        const updatedData = renderer.onUnmount({
          object: this,
          container: this.elementRef,
          data: this.rendererData,
        });
        if (updatedData !== undefined) {
          this.rendererData = updatedData;
        }
      }
    }

    this.isMounted = false;
    this.elementRef = null as any;
  }

  /**
   * Returns whether the rendered content contains a scrollable element.
   * Traverses light DOM, open shadow roots, and slotted content so nested
   * framework components are detected as well.
   */
  isElementScrollable(): boolean {
    return !!KritzelHTMLHelper.findScrollableElement(this.element);
  }

  /**
   * Creates a placeholder element when HTML deserialization fails.
   * Used as fallback to ensure element is always defined.
   * @returns A div element with placeholder styling
   */
  private createPlaceholder(): HTMLElement {
    const el = document.createElement('div');
    el.textContent = '[Dynamic Object]';
    el.style.border = '1px dashed #ccc';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.backgroundColor = '#f9f9f9';
    el.style.color = '#999';
    el.style.fontSize = '12px';
    return el;
  }

  /**
   * Resizes and repositions the dynamic object on the canvas.
   * Updates both the internal state and the DOM element's inline styles.
   * Syncs changes to Yjs for collaborative editing and cross-tab propagation.
   * @param x - The new X position (translateX) in canvas coordinates.
   * @param y - The new Y position (translateY) in canvas coordinates.
   * @param width - The new width in pixels. Must be greater than 1.
   * @param height - The new height in pixels. Must be greater than 1.
   */
  override resize(x: number, y: number, width: number, height: number): void {
    if (width <= 1 || height <= 1) {
      return;
    }

    this.width = width;
    this.height = height;
    this.translateX = x;
    this.translateY = y;

    if (this.element) {
      this.element.style.width = `${width}px`;
      this.element.style.height = `${height}px`;
    }

    // Update to sync changes to y.js and propagate to other tabs
    this._core.store.objects.update(this);
  }

  /**
   * Creates a deep copy of this dynamic object.
   * The copy receives a new unique ID, is marked as unmounted,
   * and contains a cloned copy of the underlying HTML element.
   * @returns A new KritzelDynamicObject instance with copied properties and a cloned DOM element.
   */
  override copy(): KritzelDynamicObject {
    const copiedObject: KritzelDynamicObject = Object.create(Object.getPrototypeOf(this));
    Object.assign(copiedObject, this);
    copiedObject.id = this.generateId();
    copiedObject.isMounted = false;
    copiedObject.isSelected = false;
    copiedObject.isHovered = false;
    copiedObject.isInteractive = false;
    copiedObject.resizing = false;
    copiedObject.markedForRemoval = false;
    copiedObject.isVisible = true;
    copiedObject.element = this.element.cloneNode(true) as HTMLElement;
    return copiedObject;
  }

  /**
   * Serializes the dynamic object to a plain JavaScript object for persistence.
   * Stores HTML as a string (safe for JSON/Yjs) and captures dimension metadata.
   * @returns A serializable object with htmlString and dimension snapshots
   */
  override serialize() {
    const {
      _core,
      _elementRef,
      element,
      totalWidth,
      totalHeight,
      isSelected,
      isHovered,
      isMounted,
      isInteractive,
      resizing,
      markedForRemoval,
      isVisible,
      rendererData,
      ...props
    } = this as any;
    const cloned = structuredClone(props);
    // Include rendererKey and rendererData for lifecycle-driven rendering
    cloned.rendererKey = this.rendererKey;
    cloned.rendererData = this.serializeRendererData();
    // Store HTML as string for fallback/compatibility when renderer is unavailable
    cloned.htmlString = element ? element.outerHTML : '';
    // Capture dimension snapshot at serialization time
    cloned.serializedWidth = this.width;
    cloned.serializedHeight = this.height;
    return cloned;
  }

  private serializeRendererData(): unknown {
    if (this.rendererKey) {
      const renderer = KritzelDynamicObjectRendererRegistry.get(this.rendererKey);

      if (renderer?.onSerialize) {
        return structuredClone(renderer.onSerialize({
          object: this,
          container: this.isMounted && this.elementRef instanceof HTMLElement ? this.elementRef : null,
          data: this.rendererData,
        }));
      }
    }

    return structuredClone(this.rendererData);
  }

  /**
   * Deserializes the dynamic object from a plain object.
   * Reconstructs the element from stored HTML string with fallback to placeholder.
   * @template T - The expected return type
   * @param object - The serialized object data to restore from
   * @returns This instance cast to type T
   */
  override deserialize<T>(object: any): T {
    super.deserialize(object);

    // Legacy compatibility: this deprecated field should not persist on revived objects.
    delete (this as any).allowEmbeddedInteraction;

    // Restore renderer metadata
    this.rendererKey = object.rendererKey ?? null;
    this.rendererData = object.rendererData;
    // Reconstruct element from stored HTML, or create placeholder
    if (object.htmlString) {
      try {
        const temp = document.createElement('div');
        temp.innerHTML = object.htmlString;
        this.element = (temp.firstElementChild as HTMLElement) || this.createPlaceholder();
      } catch {
        this.element = this.createPlaceholder();
      }
    } else {
      this.element = this.createPlaceholder();
    }
    return this as unknown as T;
  }
}
