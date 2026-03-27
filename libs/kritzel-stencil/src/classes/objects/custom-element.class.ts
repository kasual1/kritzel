import { KritzelCore } from '../core/core.class';
import { KritzelBaseObject } from './base-object.class';

/**
 * Represents a custom HTML element that can be placed and manipulated on the Kritzel canvas.
 * Extends KritzelBaseObject to inherit common object functionality like positioning,
 * scaling, and lifecycle management.
 */
export class KritzelCustomElement extends KritzelBaseObject<HTMLElement> {
  override __class__: string = 'KritzelCustomElement';

  /** The HTML element to be rendered on the canvas. */
  element: HTMLElement;

  /** Whether the element responds to user interactions. Defaults to true. */
  isInteractive: boolean = true;

  /**
   * Creates a new KritzelCustomElement instance.
   * @param config - Optional configuration object for the custom element.
   * @param config.element - The HTML element to wrap.
   * @param config.translateX - Initial X position offset. Defaults to 0.
   * @param config.translateY - Initial Y position offset. Defaults to 0.
   * @param config.scale - Initial scale factor. Defaults to 1.
   * @param config.height - Initial height in pixels. Defaults to 0.
   * @param config.width - Initial width in pixels. Defaults to 0.
   */
  constructor(config?: { element: HTMLElement; translateX?: number; translateY?: number; scale?: number, height?: number; width?: number }) {
    super();

    if (config) {
      this.translateX = config.translateX || 0;
      this.translateY = config.translateY || 0;
      this.scale = config.scale || 1;
      this.element = config.element;
      this.height = config.height || 0;
      this.width = config.width || 0;
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
   * @returns A new KritzelBaseObject instance bound to the core.
   */
  static override create(core: KritzelCore, config?: {
    element: HTMLElement;
    translateX?: number;
    translateY?: number;
    scale?: number;
    height?: number;
    width?: number;
  }): KritzelBaseObject<Element> {
    const object = new KritzelCustomElement(config);

    object._core = core;
    object.id = object.generateId();
    object.workspaceId = core.store.state.activeWorkspace.id;
    object.userId = core.user?.id;


    return object;
  }

  /**
   * Mounts the custom element to a container element in the DOM.
   * Clears any existing content in the container and appends this element.
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
    
    // Clear existing content and append the element
    this.elementRef.innerHTML = '';
    this.elementRef.appendChild(this.element);
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
    this._core.store.state.objects.update(this);
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

}
