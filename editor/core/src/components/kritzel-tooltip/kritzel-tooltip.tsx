import { Component, Host, Prop, h, Element, State, Listen, Method, Event, EventEmitter, Watch } from '@stencil/core';
import { KritzelHTMLHelper } from '@kritzel/engine';

@Component({
  tag: 'kritzel-tooltip',
  styleUrl: 'kritzel-tooltip.css',
  shadow: true,
})
export class KritzelTooltip {
  @Element() host: HTMLElement;

  @Prop({ mutable: true }) isVisible: boolean = false;
  @Prop() anchorElement: HTMLElement;
  @Prop() triggerElement: HTMLElement;
  @Prop() offsetY: number = 24;

  @Event() tooltipClosed: EventEmitter<void>;
  @Event() tooltipOpened: EventEmitter<void>;

  @State() positionX: number = 0;
  @State() positionY: number = 0;

  @Listen('click', { target: 'document' })
  handleOutsideClick(event: MouseEvent) {
    if (!this.isVisible) return;

    const path = event.composedPath();
    const isInsideTooltip = path.some(el => el === this.host);
    const isOnTrigger = this.triggerElement && path.some(el => el === this.triggerElement);

    if (!isInsideTooltip && !isOnTrigger) {
      this.close();
    }
  }

  @Listen('pointerdown', { target: 'document', capture: true, passive: false })
  handleOutsidePointerDown(event: PointerEvent) {
    if (!this.isVisible) return;

    const path = event.composedPath();
    const isInsideTooltip = path.some(el => el === this.host);
    const isOnTrigger = this.triggerElement && path.some(el => el === this.triggerElement);

    if (!isInsideTooltip && !isOnTrigger) {
      event.stopPropagation();
      event.preventDefault();
      this.close();
    }
  }

  @Listen('kritzelTooltipCloseAll', { target: 'document' })
  handleCloseAll(event: CustomEvent) {
    if (event.detail !== this.host) {
      this.close();
    }
  }

  @Listen('resize', { target: 'window' })
  handleWindowResize() {
    this.calculateAdjustedPosition();
  }

  @Watch('triggerElement')
  handleTriggerElementChange(newTrigger: HTMLElement, oldTrigger: HTMLElement) {
    if (oldTrigger) {
      oldTrigger.removeEventListener('click', this.handleTriggerClick);
    }
    if (newTrigger) {
      newTrigger.addEventListener('click', this.handleTriggerClick);
    }
  }

  @Watch('isVisible')
  handleVisibilityChange(newValue: boolean) {
    if (newValue) {
      this.calculateAdjustedPosition();
      requestAnimationFrame(() => {
        this.focusContent();
      });
    }
  }

  @Method()
  async open() {
    if (this.isVisible) return;
    document.dispatchEvent(new CustomEvent('kritzelTooltipCloseAll', { detail: this.host }));
    this.isVisible = true;
    this.tooltipOpened.emit();
  }

  @Method()
  async close() {
    if (!this.isVisible) return;
    this.isVisible = false;
    this.tooltipClosed.emit();
  }

  @Method()
  async toggle() {
    if (this.isVisible) {
      this.close();
    } else {
      this.open();
    }
  }

  @Method()
  async focusContent() {
    const focusableElements = KritzelHTMLHelper.getFocusableElements(this.host);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }

  connectedCallback() {
    if (this.triggerElement) {
      this.triggerElement.addEventListener('click', this.handleTriggerClick);
    }
  }

  componentDidLoad() {
    if (this.triggerElement) {
      this.triggerElement.addEventListener('click', this.handleTriggerClick);
    }
  }

  componentWillLoad() {
    this.calculateAdjustedPosition();
  }

  componentWillUpdate() {
    this.calculateAdjustedPosition();
  }

  disconnectedCallback() {
    if (this.triggerElement) {
      this.triggerElement.removeEventListener('click', this.handleTriggerClick);
    }
  }

  private handleTriggerClick = (event: MouseEvent) => {
    event.stopPropagation();
    this.toggle();
  };

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
