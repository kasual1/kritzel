import { Component, Host, Prop, h, Element, State } from '@stencil/core';

@Component({
  tag: 'kritzel-tooltip',
  styleUrl: 'kritzel-tooltip.css',
  shadow: true,
})
export class KritzelTooltip {
  @Prop()
  isVisible: boolean = false;

  @Prop()
  anchorElement: HTMLElement;

  @Prop()
  offsetY: number = 20;

  @Element()
  el: HTMLElement;

  @State()
  positionX: number = 0;

  componentWillLoad() {
    this.calculateAdjustedPosition();
  }

  componentWillUpdate() {
    this.calculateAdjustedPosition();
  }

  private calculateAdjustedPosition() {
    if (this.isVisible && this.anchorElement) {
      const anchorRect = this.anchorElement.getBoundingClientRect();
      const tooltipRect = this.el.getBoundingClientRect();
      this.positionX = anchorRect.left - anchorRect.width - (tooltipRect.width / 2);
    }
  }

  render() {
    return (
      <Host
        style={{
          position: 'fixed',
          zIndex: '9999',
          transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
          display: this.isVisible ? 'inline-block' : 'none',
          left: `${this.positionX}px`,
          marginBottom: `${this.offsetY}px`,
        }}
      >
        <div class="tooltip-content" onClick={(event) => event.stopPropagation()}>
          <slot></slot>
          <div class="tooltip-arrow"></div>
        </div>
      </Host>
    );
  }
}
