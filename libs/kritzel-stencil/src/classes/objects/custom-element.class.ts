import { KritzelBaseObject } from './base-object.class';

export class KritzelCustomElement extends KritzelBaseObject<HTMLElement> {
  override __class__: string = 'KritzelCustomElement';

  element: HTMLElement;

  isInteractive: boolean = true;

  constructor(config?: { element: HTMLElement; translateX?: number; translateY?: number; scale?: number }) {
    super();

    if (config) {
      this.translateX = config.translateX || 0;
      this.translateY = config.translateY || 0;
      this.scale = config.scale || 1;
      this.element = config.element;

      this.updateDimensions();
    }
  }

  mount(element: HTMLElement): void {
    super.mount(element);
    this.elementRef.appendChild(this.element);

    this.updateDimensions();
  }

  private updateDimensions(): void {
    if (this.element) {
      const rect = this.element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(this.element);
      
      this.width = rect.width || parseFloat(computedStyle.width) || this.element.offsetWidth;
      this.height = rect.height || parseFloat(computedStyle.height) || this.element.offsetHeight;
    }
  }
}
