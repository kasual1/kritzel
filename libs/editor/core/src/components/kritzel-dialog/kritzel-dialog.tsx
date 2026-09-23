import { Component, Element, Event, EventEmitter, Host, Listen, Method, Prop, State, Watch, h } from '@stencil/core';
import { IKritzelDialogCloseEvent, KritzelDialogCloseReason } from '@kritzel/engine';
import { KritzelHTMLHelper } from '@kritzel/engine';

@Component({
  tag: 'kritzel-dialog',
  styleUrl: 'kritzel-dialog.css',
  shadow: true,
})
export class KritzelDialog {
  @Element() host: HTMLElement;

  /** Whether the dialog is open */
  @Prop({ reflect: true }) isOpen: boolean = false;

  /** Optional title displayed in the header */
  @Prop() dialogTitle?: string;

  /** Whether to show the close button in the header */
  @Prop() closable: boolean = true;

  /** Whether clicking the backdrop closes the dialog */
  @Prop() closeOnBackdrop: boolean = true;

  /** Whether pressing Escape closes the dialog */
  @Prop() closeOnEscape: boolean = true;

  /** Whether to auto-focus the first focusable element when opened */
  @Prop() autoFocus: boolean = true;

  /** Whether to trap focus within the dialog */
  @Prop() trapFocus: boolean = true;

  /** Size of the dialog */
  @Prop() size: 'small' | 'medium' | 'large' | 'fullscreen' = 'medium';

  /** Whether to automatically go fullscreen on mobile viewports */
  @Prop() fullscreenOnMobile: boolean = true;

  /** Constrain the dialog to its nearest editor/container ancestor instead of the viewport. */
  @Prop({ reflect: true }) contained: boolean = false;

  @State() isAnimating: boolean = false;
  @State() mobileLockedHeight: string | null = null;
  @State() containerRect: { top: number; left: number; width: number; height: number } | null = null;
  @State() containerBorderRadius: string | null = null;

  /** Emitted when the dialog opens */
  @Event() dialogOpen: EventEmitter<void>;

  /** Emitted when the dialog closes */
  @Event() dialogClose: EventEmitter<IKritzelDialogCloseEvent>;

  private previousOverflow: string = '';
  private previousActiveElement: HTMLElement | null = null;
  private visualViewportListenersAttached = false;
  private containerElement: HTMLElement | null = null;
  private containerResizeObserver: ResizeObserver | null = null;
  private containerTrackingFrame: number | null = null;

  @Watch('isOpen')
  handleIsOpenChange(newValue: boolean) {
    if (newValue) {
      this.openDialog();
    } else {
      this.closeDialog();
    }
  }

  @Listen('keydown', { target: 'window' })
  handleKeyDown(event: KeyboardEvent) {
    if (!this.isOpen) return;

    if (event.key === 'Escape' && this.closeOnEscape) {
      event.preventDefault();
      event.stopPropagation();
      this.emitClose('escape');
    }

    if (event.key === 'Tab' && this.trapFocus) {
      this.handleTabKey(event);
    }
  }

  @Listen('resize', { target: 'window' })
  handleWindowResize() {
    if (!this.isOpen) return;
    this.lockMobileViewportHeight();
  }

  @Listen('orientationchange', { target: 'window' })
  handleOrientationChange() {
    if (!this.isOpen) return;
    // Let viewport metrics settle before recalculating after orientation flips.
    requestAnimationFrame(() => this.lockMobileViewportHeight());
  }

  @Method()
  async open(): Promise<void> {
    if (!this.isOpen) {
      this.isOpen = true;
    }
  }

  @Method()
  async close(reason: KritzelDialogCloseReason = 'programmatic'): Promise<void> {
    this.emitClose(reason);
  }

  @Method()
  async focusFirstElement(): Promise<void> {
    this.focusFirst();
  }

  componentDidLoad() {
    if (this.isOpen) {
      this.openDialog();
    }
  }

  disconnectedCallback() {
    this.removeVisualViewportListeners();
    this.stopContainerTracking();
    this.restoreBodyScroll();
  }

  private openDialog() {
    this.isAnimating = true;
    this.previousActiveElement = document.activeElement as HTMLElement;
    if (this.contained) {
      this.startContainerTracking();
    } else {
      this.lockBodyScroll();
      this.addVisualViewportListeners();
    }
    this.lockMobileViewportHeight();
    this.dialogOpen.emit();

    if (this.autoFocus) {
      requestAnimationFrame(() => {
        this.focusFirst();
      });
    }

    requestAnimationFrame(() => {
      this.isAnimating = false;
    });
  }

  private closeDialog() {
    this.restoreBodyScroll();
    this.removeVisualViewportListeners();
    this.stopContainerTracking();
    this.mobileLockedHeight = null;
    this.returnFocusToPreviousElement();
  }

  private findContainerElement(): HTMLElement | null {
    // Walk up the composed DOM (crossing shadow roots) and return the first
    // ancestor that opts into containing dialogs. We accept either an explicit
    // [data-kritzel-dialog-container] marker or the kritzel-editor host so any
    // consumer can opt in without modifying the editor itself.
    let node: Node | null = this.host;
    while (node) {
      if (node instanceof HTMLElement) {
        if (node.hasAttribute('data-kritzel-dialog-container') || node.tagName === 'KRITZEL-EDITOR') {
          return node;
        }
      }
      const parent: Node | null = node.parentNode;
      if (parent) {
        node = parent;
      } else if (node instanceof ShadowRoot) {
        node = node.host;
      } else {
        node = null;
      }
    }
    return null;
  }

  private startContainerTracking() {
    this.containerElement = this.findContainerElement();
    if (!this.containerElement) {
      // No container found â€” fall back to viewport behavior.
      this.containerRect = null;
      return;
    }

    this.updateContainerRect();

    if (typeof ResizeObserver !== 'undefined') {
      this.containerResizeObserver = new ResizeObserver(() => this.updateContainerRect());
      this.containerResizeObserver.observe(this.containerElement);
    }

    window.addEventListener('resize', this.handleContainerTrackingEvent, { passive: true });
    window.addEventListener('scroll', this.handleContainerTrackingEvent, { capture: true, passive: true });
  }

  private stopContainerTracking() {
    if (this.containerResizeObserver) {
      this.containerResizeObserver.disconnect();
      this.containerResizeObserver = null;
    }
    window.removeEventListener('resize', this.handleContainerTrackingEvent);
    window.removeEventListener('scroll', this.handleContainerTrackingEvent, { capture: true } as any);
    if (this.containerTrackingFrame !== null) {
      cancelAnimationFrame(this.containerTrackingFrame);
      this.containerTrackingFrame = null;
    }
    this.containerElement = null;
    this.containerRect = null;
    this.containerBorderRadius = null;
  }

  private handleContainerTrackingEvent = () => {
    if (this.containerTrackingFrame !== null) return;
    this.containerTrackingFrame = requestAnimationFrame(() => {
      this.containerTrackingFrame = null;
      this.updateContainerRect();
    });
  };

  private updateContainerRect() {
    if (!this.containerElement) return;
    const rect = this.containerElement.getBoundingClientRect();
    const next = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
    const prev = this.containerRect;
    if (!prev || prev.top !== next.top || prev.left !== next.left || prev.width !== next.width || prev.height !== next.height) {
      this.containerRect = next;
    }

    // Look for the nearest visually-rounded ancestor (the container itself or
    // any ancestor up to the document) so the backdrop matches wrappers that
    // round their corners around the editor.
    const radius = this.findVisualBorderRadius(this.containerElement);
    if (this.containerBorderRadius !== radius) {
      this.containerBorderRadius = radius;
    }
  }

  private findVisualBorderRadius(start: HTMLElement): string | null {
    let node: HTMLElement | null = start;
    while (node && node !== document.body && node !== document.documentElement) {
      const computed = window.getComputedStyle(node);
      const tl = computed.borderTopLeftRadius;
      const tr = computed.borderTopRightRadius;
      const br = computed.borderBottomRightRadius;
      const bl = computed.borderBottomLeftRadius;
      const isZero = (v: string) => !v || v === '0px' || v === '0%';
      if (!(isZero(tl) && isZero(tr) && isZero(br) && isZero(bl))) {
        return `${tl} ${tr} ${br} ${bl}`;
      }
      node = node.parentElement;
    }
    return null;
  }

  private emitClose(reason: KritzelDialogCloseReason) {
    this.dialogClose.emit({ reason });
  }

  private lockBodyScroll() {
    this.previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  private lockMobileViewportHeight() {
    // Skip mobile viewport height locking when contained â€” the dialog is sized
    // by its wrapper, not the viewport.
    if (this.contained) {
      this.mobileLockedHeight = null;
      return;
    }

    // Only lock height on mobile when fullscreenOnMobile is enabled.
    // Use the smaller dimension so landscape phones (wide but short) are also detected.
    const viewportWidth = this.getViewportWidth();
    const viewportHeight = this.getViewportHeight();

    if (!this.fullscreenOnMobile || Math.min(viewportWidth, viewportHeight) > 576) {
      this.mobileLockedHeight = null;
      return;
    }

    this.mobileLockedHeight = `${viewportHeight}px`;
  }

  private getViewportWidth() {
    return Math.round(window.visualViewport?.width ?? window.innerWidth);
  }

  private getViewportHeight() {
    return Math.round(window.visualViewport?.height ?? window.innerHeight);
  }

  private addVisualViewportListeners() {
    const viewport = window.visualViewport;
    if (!viewport || this.visualViewportListenersAttached) return;

    viewport.addEventListener('resize', this.handleVisualViewportChange);
    viewport.addEventListener('scroll', this.handleVisualViewportChange);
    this.visualViewportListenersAttached = true;
  }

  private removeVisualViewportListeners() {
    const viewport = window.visualViewport;
    if (!viewport || !this.visualViewportListenersAttached) return;

    viewport.removeEventListener('resize', this.handleVisualViewportChange);
    viewport.removeEventListener('scroll', this.handleVisualViewportChange);
    this.visualViewportListenersAttached = false;
  }

  private handleVisualViewportChange = () => {
    if (!this.isOpen) return;
    this.lockMobileViewportHeight();
  }

  private restoreBodyScroll() {
    document.body.style.overflow = this.previousOverflow;
  }

  private returnFocusToPreviousElement() {
    if (this.previousActiveElement?.focus) {
      this.previousActiveElement.focus();
    }
  }

  private focusFirst() {
    const dialogContent = this.host.shadowRoot?.querySelector('.dialog-content') as HTMLElement;
    if (!dialogContent) return;

    const focusableElements = KritzelHTMLHelper.getFocusableElements(dialogContent);
    const slotElements = this.getSlottedFocusableElements();
    const allFocusable = [...focusableElements, ...slotElements];

    if (allFocusable.length > 0) {
      allFocusable[0].focus();
    } else {
      dialogContent.focus();
    }
  }

  private getSlottedFocusableElements(): HTMLElement[] {
    const slots = this.host.shadowRoot?.querySelectorAll('slot') ?? [];
    const focusable: HTMLElement[] = [];

    slots.forEach(slot => {
      const assigned = slot.assignedElements({ flatten: true }) as HTMLElement[];
      assigned.forEach(el => {
        // Use KritzelHTMLHelper to find focusable elements including those in nested shadow DOMs
        const elements = KritzelHTMLHelper.getFocusableElements(el);
        focusable.push(...elements);
      });
    });

    return focusable;
  }

  private handleTabKey(event: KeyboardEvent) {
    const focusableElements = this.getSlottedFocusableElements();
    const closeButton = this.host.shadowRoot?.querySelector('.close-button') as HTMLElement;

    if (closeButton && this.closable) {
      focusableElements.unshift(closeButton);
    }

    if (focusableElements.length === 0) return;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    const activeElement = this.getDeepActiveElement();

    if (event.shiftKey) {
      if (activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  private getDeepActiveElement(): Element {
    let activeEl = document.activeElement;
    while (activeEl?.shadowRoot?.activeElement) {
      activeEl = activeEl.shadowRoot.activeElement;
    }
    return activeEl;
  }

  private handleBackdropClick = (event: MouseEvent) => {
    event.stopPropagation();
    if (this.closeOnBackdrop) {
      this.emitClose('backdrop');
    }
  };

  private handleCloseButtonClick = (event: MouseEvent) => {
    event.stopPropagation();
    this.emitClose('close-button');
  };

  private handleContentClick = (event: MouseEvent) => {
    event.stopPropagation();
  };

  private renderCloseButton() {
    if (!this.closable) return null;

    return (
      <button class="close-button" type="button" aria-label="Close dialog" onClick={this.handleCloseButtonClick}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    );
  }

  private renderHeader() {
    const hasHeaderSlot = this.host.querySelector('[slot="header"]') !== null;
    const hasTitle = !!this.dialogTitle;

    if (!hasHeaderSlot && !hasTitle && !this.closable) return null;

    return (
      <div class="dialog-header">
        {hasHeaderSlot ? (
          <slot name="header" />
        ) : hasTitle ? (
          <h2 class="dialog-title">{this.dialogTitle}</h2>
        ) : null}
        {this.renderCloseButton()}
      </div>
    );
  }

  private renderFooter() {
    const hasFooterSlot = this.host.querySelector('[slot="footer"]') !== null;
    if (!hasFooterSlot) return null;

    return (
      <div class="dialog-footer">
        <slot name="footer" />
      </div>
    );
  }

  private getBackdropStyle(): { [key: string]: string } | undefined {
    if (!this.contained || !this.containerRect) return undefined;
    const { top, left, width, height } = this.containerRect;
    const style: { [key: string]: string } = {
      top: `${top}px`,
      left: `${left}px`,
      right: 'auto',
      bottom: 'auto',
      width: `${width}px`,
      height: `${height}px`,
    };
    if (this.containerBorderRadius) {
      style.borderRadius = this.containerBorderRadius;
      // Ensure rounded corners actually clip the inner dialog content.
      style.overflow = 'hidden';
    }
    return style;
  }

  private getDialogContentStyle(): { [key: string]: string } | undefined {
    const style: { [key: string]: string } = {};

    // In contained mode, cap the dialog dimensions to the container so the
    // declared widths/heights of size variants cannot overflow the wrapper.
    if (this.contained && this.containerRect) {
      const { width, height } = this.containerRect;
      if (this.isContainerMobile()) {
        // Mobile-sized container: behave like fullscreen-on-mobile but scoped
        // to the container instead of the viewport (works in any orientation).
        style.width = `${width}px`;
        style.height = `${height}px`;
        style.maxWidth = `${width}px`;
        style.maxHeight = `${height}px`;
        style.borderRadius = '0';
      } else {
        // Leave a small margin so the dialog visibly sits within the container.
        const maxWidth = Math.max(0, width - 32);
        const maxHeight = Math.max(0, height - 32);
        style.maxWidth = `${maxWidth}px`;
        style.maxHeight = `${maxHeight}px`;
      }
    }

    if (this.mobileLockedHeight) {
      style.height = this.mobileLockedHeight;
      style.maxHeight = this.mobileLockedHeight;
    }

    return Object.keys(style).length > 0 ? style : undefined;
  }

  private isContainerMobile(): boolean {
    if (!this.fullscreenOnMobile || !this.containerRect) return false;
    // Match the existing viewport media-query threshold: container is "mobile"
    // when its smaller dimension is <= 576px. This handles both portrait and
    // landscape wrappers symmetrically.
    return Math.min(this.containerRect.width, this.containerRect.height) <= 576;
  }

  render() {
    if (!this.isOpen) return null;

    const containerFullscreen = this.contained && this.isContainerMobile();

    return (
      <Host>
        <div
          class={{ backdrop: true, 'is-animating': this.isAnimating, 'contained-fullscreen': containerFullscreen }}
          style={this.getBackdropStyle()}
          onClick={this.handleBackdropClick}
        >
          <div
            class={{
              'dialog-content': true,
              'is-animating': this.isAnimating,
              [`size-${this.size}`]: true,
              'fullscreen-on-mobile': this.fullscreenOnMobile,
              'contained-fullscreen': containerFullscreen,
            }}
            style={this.getDialogContentStyle()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={this.dialogTitle ? 'dialog-title' : undefined}
            tabIndex={-1}
            onClick={this.handleContentClick}
          >
            {this.renderHeader()}
            <div class="dialog-body">
              <slot />
            </div>
            {this.renderFooter()}
          </div>
        </div>
      </Host>
    );
  }
}
