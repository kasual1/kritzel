import { Component, Host, Prop, h, Element, State, Listen, Method, Event, EventEmitter } from '@stencil/core';
import { KritzelHTMLHelper } from '../../../helpers/html.helper';

const MOBILE_BREAKPOINT = 768;

@Component({
  tag: 'kritzel-tooltip',
  styleUrl: 'kritzel-tooltip.css',
  shadow: true,
})
export class KritzelTooltip {
  @Element() host: HTMLElement;

  @Prop() isVisible: boolean = false;
  @Prop() anchorElement: HTMLElement;
  @Prop() arrowSize: number = 8;
  @Prop() offsetY: number = 24;

  @Event() tooltipClosed: EventEmitter<void>;

  @State() positionX: number = 0;
  @State() arrowOffset: string = '0px';
  @State() isMobileView: boolean = window.innerWidth < MOBILE_BREAKPOINT;

  @Listen('click', { target: 'document' })
  handleOutsideClick(event: MouseEvent) {
    if( !this.isVisible ) return;
    const target = event.target as HTMLElement;
    if (!this.host.contains(target)) {
      this.tooltipClosed.emit();
    }
  }

  @Listen('resize', { target: 'window' })
  handleWindowResize() {
    this.isMobileView = window.innerWidth < MOBILE_BREAKPOINT;
    this.calculateAdjustedPosition();
  }

  @Method()
  async focusContent() {
    const focusableElements = KritzelHTMLHelper.getFocusableElements(this.host);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }

  componentDidLoad() {
    this.focusSlottedContent();
  }

  componentWillLoad() {
    this.isMobileView = window.innerWidth < MOBILE_BREAKPOINT;
    this.calculateAdjustedPosition();
  }

  componentWillUpdate() {
    this.calculateAdjustedPosition();
  }

  private focusSlottedContent() {
    const slot = this.host.shadowRoot?.querySelector('slot');
    const assignedElements = slot?.assignedElements() || [];
    if (assignedElements.length > 0) {
      const firstElement = assignedElements[0] as HTMLElement;
      firstElement.focus();
    }
  }

  private calculateAdjustedPosition() {
    if (this.isVisible && this.anchorElement) {
      const anchorRect = this.anchorElement.getBoundingClientRect();
      const tooltipContent = this.host.shadowRoot?.querySelector('.tooltip-content') as HTMLElement;

      if (!this.isMobileView) {
        this.positionX = anchorRect.left + anchorRect.width / 2;
        this.arrowOffset = `calc(${50}% - ${this.arrowSize}px)`; 
      } else {
        const tooltipRect = tooltipContent.getBoundingClientRect();
        this.positionX = anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2;
        this.arrowOffset = `${anchorRect.left + anchorRect.width / 2 - tooltipRect.left - this.arrowSize}px`;
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
          visibility: this.isVisible ? 'visible' : 'hidden',
          left: !this.isMobileView ? `${this.positionX}px` : '50%',
          marginBottom: `${this.offsetY + this.arrowSize}px`,
        }}
      >
        <div class="tooltip-content" onClick={event => event.stopPropagation()}>
          <slot></slot>
          <div
            class="tooltip-arrow-wrapper"
            style={{
              position: 'fixed',
              left: this.arrowOffset,
              bottom: `-${this.arrowSize * 2}px`,
            }}
          >
            <div
              class="tooltip-arrow"
              style={{
              borderLeft: `${this.arrowSize}px solid transparent`,
              borderRight: `${this.arrowSize}px solid transparent`,
              borderTop: `${this.arrowSize}px solid var(--kritzel-controls-tooltip-background-color, #ffffff)`,
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
              }}
            ></div>
            <div
              class="tooltip-arrow-rect"
              style={{
              position: 'relative',
              width: `${this.arrowSize * 2}px`,
              height: `${this.arrowSize}px`,
              backgroundColor: 'var(--kritzel-controls-tooltip-background-color, #ffffff)',
              bottom: `${this.arrowSize * 2}px`,
              }}
            ></div>
          </div>
        </div>
      </Host>
    );
  }
}
