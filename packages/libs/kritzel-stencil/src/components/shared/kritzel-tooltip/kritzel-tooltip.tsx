import { Component, Host, Prop, h, Element, State, Listen } from '@stencil/core';

const MOBILE_BREAKPOINT = 768;

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

  @State()
  private isMobileView: boolean = window.innerWidth < MOBILE_BREAKPOINT;

  @Listen('resize', { target: 'window' })
  handleWindowResize() {
    this.isMobileView = window.innerWidth < MOBILE_BREAKPOINT;
    this.calculateAdjustedPosition();
  }

  componentWillLoad() {
    this.isMobileView = window.innerWidth < MOBILE_BREAKPOINT;
    this.calculateAdjustedPosition();
  }

  componentWillUpdate() {
    this.calculateAdjustedPosition();
  }

  private calculateAdjustedPosition() {
    if (this.isVisible && this.anchorElement) {
      const anchorRect = this.anchorElement.getBoundingClientRect();

      if (!this.isMobileView) {
        this.positionX = anchorRect.left + anchorRect.width / 2;
      } else {
        this.positionX = anchorRect.left - 8;
      }
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
          left: !this.isMobileView ? `${this.positionX}px` : '50%',
          marginBottom: `${this.offsetY}px`,
        }}
      >
        <div class="tooltip-content" onClick={event => event.stopPropagation()}>
          <slot></slot>
          <div
            class="tooltip-arrow"
            style={{
              left: !this.isMobileView ? '50%' : `${this.positionX}px`,
            }}
          ></div>
          <div
            class="tooltip-arrow-rect"
            style={{
              left: !this.isMobileView ? '50%' : `${this.positionX}px`,
            }}
          ></div>
        </div>
      </Host>
    );
  }
}
