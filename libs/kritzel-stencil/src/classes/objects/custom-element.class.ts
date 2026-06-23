import { KritzelCore } from '../core/core.class';
import { KritzelBaseObject } from './base-object.class';
import { KritzelMathHelper } from '../../helpers/math.helper';
import { KritzelCustomElementRendererRegistry } from '../registries/custom-element-renderer.registry';

export interface KritzelCustomElementConfig {
  element?: HTMLElement;
  rendererKey?: string;
  rendererData?: unknown;
  allowEmbeddedInteraction?: boolean;
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
export class KritzelCustomElement extends KritzelBaseObject<HTMLElement> {
  override __class__: string = 'KritzelCustomElement';

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

  /** Whether the element responds to user interactions. Defaults to true. */
  isInteractive: boolean = true;

  /**
   * When false (default), the custom element participates normally in canvas selection/movement.
   * When true, embedded pointer events may be consumed by the element's internal handlers
   * (e.g., buttons, inputs), potentially bypassing canvas selection.
   * Even when true, the element remains selectable via handles or background clicks.
   */
  allowEmbeddedInteraction: boolean = false;

  /**
   * Creates a new KritzelCustomElement instance.
   * @param config - Optional configuration object for the custom element.
   * @param config.element - The HTML element to wrap.
   * @param config.translateX - Initial X position offset. Defaults to 0.
   * @param config.translateY - Initial Y position offset. Defaults to 0.
   * @param config.scale - Initial scale factor. Defaults to 1.
   * @param config.height - Initial height in pixels. Defaults to 0.
   * @param config.width - Initial width in pixels. Defaults to 0.
   * @param config.allowEmbeddedInteraction - Whether the embedded DOM should receive pointer interaction.
   */
  constructor(config?: KritzelCustomElementConfig) {
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
      this.allowEmbeddedInteraction = config.allowEmbeddedInteraction ?? false;
    }
  }

  /**
   * Factory method to create a new KritzelCustomElement with proper core binding.
   * Generates a unique ID and assigns the element to the active workspace.
   * @param core - The KritzelCore instance for state management and ID generation.
   * @param config - Optional configuration object for the custom element.
   * @param config.element - The HTML element to wrap.
   * @param config.translateX - Initial X position offset.
   * @param config.translateY - Initial Y position offset.
   * @param config.scale - Initial scale factor.
   * @param config.height - Initial height in pixels.
   * @param config.width - Initial width in pixels.
   * @param config.allowEmbeddedInteraction - Whether the embedded DOM should receive pointer interaction.
   * @returns A new KritzelBaseObject instance bound to the core.
   */
  static override create(core: KritzelCore, config?: KritzelCustomElementConfig): KritzelBaseObject<Element> {
    const object = new KritzelCustomElement(config);

    object._core = core;
    object.id = object.generateId();
    object.workspaceId = core.store.state.activeWorkspace!.id;
    object.userId = core.user?.id;
    object.zIndex = core.store.currentZIndex;

    return object;
  }

  /**
   * Mounts the custom element to a container element in the DOM.
   * If a renderer is registered for this.rendererKey, delegates to the renderer.
   * Otherwise, uses the standard DOM element mounting fallback.
   * Skips mounting if already mounted to the same container with content attached.
   * @param element - The container HTML element to mount this custom element into.
   */
  override mount(element: HTMLElement): void {
    if (element === null) {
      return;
    }

    // If already mounted to the same element and content is still attached, skip
    if (this.isMounted && this.elementRef === element && this.element.parentElement === element) {
      return;
    }

    this.elementRef = element;
    this.isMounted = true;

    // Try renderer-based approach if a key is set
    if (this.rendererKey) {
      const renderer = KritzelCustomElementRendererRegistry.get(this.rendererKey);
      if (renderer) {
        element.innerHTML = ''; // Clear container
        renderer.onMount({
          object: this,
          container: element,
          data: this.rendererData,
        });
        return;
      }
    }

    // Fallback to standard DOM mounting
    this.elementRef.innerHTML = '';
    this.elementRef.appendChild(this.element);
  }

  /**
   * Unmounts the custom element and performs cleanup.
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
      const renderer = KritzelCustomElementRendererRegistry.get(this.rendererKey);
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
   * Creates a placeholder element when HTML deserialization fails.
   * Used as fallback to ensure element is always defined.
   * @returns A div element with placeholder styling
   */
  private createPlaceholder(): HTMLElement {
    const el = document.createElement('div');
    el.textContent = '[Custom Element]';
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
   * Resizes and repositions the custom element on the canvas.
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
   * Creates a deep copy of this custom element.
   * The copy receives a new unique ID, is marked as unmounted,
   * and contains a cloned copy of the underlying HTML element.
   * @returns A new KritzelCustomElement instance with copied properties and a cloned DOM element.
   */
  override copy(): KritzelCustomElement {
    const copiedObject: KritzelCustomElement = Object.create(Object.getPrototypeOf(this));
    Object.assign(copiedObject, this);
    copiedObject.id = this.generateId();
    copiedObject.isMounted = false;
    copiedObject.element = this.element.cloneNode(true) as HTMLElement;
    return copiedObject;
  }

  /**
   * Serializes the custom element to a plain JavaScript object for persistence.
   * Stores HTML as a string (safe for JSON/Yjs) and captures dimension metadata.
   * @returns A serializable object with htmlString and dimension snapshots
   */
  override serialize() {
    const { _core, _elementRef, element, totalWidth, totalHeight, ...props } = this as any;
    const cloned = structuredClone(props);
    // Include rendererKey and rendererData for lifecycle-driven rendering
    cloned.rendererKey = this.rendererKey;
    cloned.rendererData = this.rendererData;
    // Store HTML as string for fallback/compatibility when renderer is unavailable
    cloned.htmlString = element ? element.outerHTML : '';
    // Capture dimension snapshot at serialization time
    cloned.serializedWidth = this.width;
    cloned.serializedHeight = this.height;
    return cloned;
  }

  /**
   * Deserializes the custom element from a plain object.
   * Reconstructs the element from stored HTML string with fallback to placeholder.
   * @template T - The expected return type
   * @param object - The serialized object data to restore from
   * @returns This instance cast to type T
   */
  override deserialize<T>(object: any): T {
    super.deserialize(object);
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
