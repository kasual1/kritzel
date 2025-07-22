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

  override mount(element: HTMLElement): void {
    if (this.isMounted) {
      return;
    }

    console.log('mount');

    this.elementRef = element;
    this.isMounted = true;
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
  }

}
