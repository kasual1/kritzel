import { KritzelCore } from '../core/core.class';
import { KritzelBaseObject } from './base-object.class';

export class KritzelCustomElement extends KritzelBaseObject<HTMLElement> {
  override __class__: string = 'KritzelCustomElement';

  element: HTMLElement;

  isInteractive: boolean = true;

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
    object.workspaceId = core.store.state.activeWorkspace.id


    return object;
  }

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

  override copy(): KritzelCustomElement {
    const copiedObject: KritzelCustomElement = Object.create(Object.getPrototypeOf(this));
    Object.assign(copiedObject, this);
    copiedObject.id = this.generateId();
    copiedObject.isMounted = false;
    copiedObject.element = this.element.cloneNode(true) as HTMLElement;
    return copiedObject;
  }

}
