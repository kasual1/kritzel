import { Component, Host, Prop, h, Element, State, Listen, Method, Event, EventEmitter } from '@stencil/core';
import { KritzelHTMLHelper } from '../../../helpers/html.helper';

@Component({
  tag: 'kritzel-tooltip',
  styleUrl: 'kritzel-tooltip.css',
  shadow: true,
})
export class KritzelTooltip {
  @Element() host: HTMLElement;

  @Prop() isVisible: boolean = false;
  @Prop() anchorElement: HTMLElement;
  @Prop() offsetY: number = 24;

  @Event() tooltipClosed: EventEmitter<void>;

  @State() positionX: number = 0;
  @State() positionY: number = 0;

  @Listen('click', { target: 'document' })
  handleOutsideClick(event: MouseEvent) {
    if (!this.isVisible) return;
    
    // Check if click is inside the tooltip host or any of its shadow DOM content
    const path = event.composedPath();
    const isInsideTooltip = path.some(el => el === this.host);
    
    if (!isInsideTooltip) {
      this.tooltipClosed.emit();
    }
  }

  @Listen('resize', { target: 'window' })
  handleWindowResize() {
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
      const tooltipRect = tooltipContent?.getBoundingClientRect();
      const tooltipWidth = tooltipRect?.width || 0;
      
      const viewportPadding = 12; // Minimum distance from viewport edges
      const anchorCenterX = anchorRect.left + anchorRect.width / 2;
      
      // Step 1: Try to center the tooltip above the anchor
      let idealLeft = anchorCenterX - tooltipWidth / 2;
      
      // Step 2: Clamp to viewport bounds
      const minLeft = viewportPadding;
      const maxLeft = window.innerWidth - tooltipWidth - viewportPadding;
      
      // Apply clamping - adjust if tooltip would overflow
      this.positionX = Math.max(minLeft, Math.min(idealLeft, maxLeft));
      
      // Step 3: Calculate bottom position (distance from viewport bottom to top of anchor + offset)
      this.positionY = window.innerHeight - anchorRect.top + this.offsetY;
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
          left: `${this.positionX}px`,
          bottom: `${this.positionY}px`,
        }}
      >
        <div
          class="tooltip-content"
          onClick={event => event.stopPropagation()}
          onPointerDown={event => event.stopPropagation()}
          onMouseDown={event => event.stopPropagation()}
        >
          <slot></slot>
        </div>
      </Host>
    );
  }
}
