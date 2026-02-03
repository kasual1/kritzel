import { Component, Element, Event, EventEmitter, Host, Listen, Method, Prop, State, Watch, h } from '@stencil/core';
import { IKritzelDialogCloseEvent, KritzelDialogCloseReason } from '../../../interfaces/dialog.interface';
import { KritzelHTMLHelper } from '../../../helpers/html.helper';

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

  @State() isAnimating: boolean = false;

  /** Emitted when the dialog opens */
  @Event() dialogOpen: EventEmitter<void>;

  /** Emitted when the dialog closes */
  @Event() dialogClose: EventEmitter<IKritzelDialogCloseEvent>;

  private previousOverflow: string = '';
  private previousActiveElement: HTMLElement | null = null;

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
    this.restoreBodyScroll();
  }

  private openDialog() {
    this.isAnimating = true;
    this.previousActiveElement = document.activeElement as HTMLElement;
    this.lockBodyScroll();
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
    this.returnFocusToPreviousElement();
  }

  private emitClose(reason: KritzelDialogCloseReason) {
    this.dialogClose.emit({ reason });
  }

  private lockBodyScroll() {
    this.previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
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

  private isFocusable(el: HTMLElement): boolean {
    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), details, [tabindex]:not([tabindex="-1"])';
    return el.matches(focusableSelector);
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

  render() {
    if (!this.isOpen) return null;

    return (
      <Host>
        <div class={{ backdrop: true, 'is-animating': this.isAnimating }} onClick={this.handleBackdropClick}>
          <div
            class={{
              'dialog-content': true,
              'is-animating': this.isAnimating,
              [`size-${this.size}`]: true,
              'fullscreen-on-mobile': this.fullscreenOnMobile,
            }}
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
