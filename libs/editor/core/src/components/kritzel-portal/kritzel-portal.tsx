import { Component, Host, Listen, Prop, Watch, h, Event, EventEmitter, Element } from '@stencil/core';
import { ObjectHelper } from '@kritzel/engine';
import { KritzelHTMLHelper } from '@kritzel/engine';
import { KritzelKeyboardHelper } from '@kritzel/engine';

@Component({
  tag: 'kritzel-portal',
  shadow: true,
})
export class KritzelPortal {
  @Element() host: HTMLElement;

  @Prop() anchor: HTMLElement;
  @Watch('anchor')
  anchorChanged(newValue: HTMLElement) {
    if (newValue) {
      this.openPortal();
      // Use requestAnimationFrame to wait for the browser to paint the portal content
      // so that getBoundingClientRect returns accurate dimensions
      requestAnimationFrame(() => {
        this.calculatePosition();
        if (this.autoFocus) {
          this.focusFirstElement();
        }
      });
    } else {
      this.closePortal();
    }
  }

  @Prop() offsetX: number;
  @Prop() offsetY: number;
  @Prop() autoFocus: boolean = true;

  @Event() close: EventEmitter<void>;

  @Listen('kritzel-dismiss-menus', { target: 'window' })
  handleDismissMenus() {
    if (this.portal) {
      this.close.emit();
      this.closePortal();
    }
  }

  @Listen('click', { target: 'window' })
  handleOutsideClick(event: MouseEvent) {
    const isLastPortal = this.lastAddedPortal === this.portal;
    if (!isLastPortal) return;

    const target = event.target as HTMLElement;
    if (!this.host.contains(target)) {
      this.close.emit();
      this.closePortal();
    }
  }

  @Listen('pointerdown', { target: 'document', capture: true, passive: false })
  handleOutsidePointerDown(event: PointerEvent) {
    if (!this.portal) return;
    const isLastPortal = this.lastAddedPortal === this.portal;
    if (!isLastPortal) return;

    const path = event.composedPath();
    const isInsidePortal = path.some(el => el === this.host);
    const isOnAnchor = this.anchor && path.some(el => el === this.anchor);

    if (!isInsidePortal && !isOnAnchor) {
      event.stopPropagation();
      event.preventDefault();
      this.close.emit();
      this.closePortal();
    }
  }

  @Listen('keydown', { target: 'window' })
  handleKeyDown(event: KeyboardEvent) {
    const isLastPortal = this.lastAddedPortal === this.portal;
    if (!isLastPortal) return;

    if (event.key === 'Escape') {
      event.stopPropagation();
      this.anchor.focus();
      this.close.emit();
      this.closePortal();
      return;
    }

    if (event.key === 'Tab') {
      this.trapFocus(event);
      return;
    }

    if (event.key === 'Enter') {
      const activeElement = this.getDeepActiveElement() as HTMLElement;
      if (activeElement?.click) {
        event.preventDefault();
        activeElement.click();
      }
    }
  }

  @Listen('resize', { target: 'window', capture: true })
  handleResize() {
    this.updatePosition();
  }

  @Listen('scroll', { target: 'window', capture: true })
  handleWindowScroll(event: Event) {
    if (!this.portal) return;

    // Scrolling inside the portal content (e.g. a height-constrained menu scrolling a
    // focused input into view) must not close the portal.
    if (event.composedPath().includes(this.host)) {
      this.updatePosition();
      return;
    }

    // While a text field inside the portal is focused, the virtual keyboard shrinks the
    // viewport and the browser scrolls the page to reveal the field. In landscape this
    // pushes the anchor out of view; closing here would blur the field and dismiss the
    // keyboard immediately.
    if (this.isEditingInside()) {
      this.updatePosition();
      return;
    }

    const isInViewport = KritzelHTMLHelper.isElementInViewport(this.anchor);

    if (!isInViewport) {
      this.anchor?.blur();
      this.closePortal();
      return;
    }

    this.calculatePosition();
  }

  private portal: HTMLElement;
  private id: string = `portal-${ObjectHelper.generateUUID()}`;
  private defaultOffset = 0;
  private minLeft = 0;
  private themeObserver: MutationObserver;
  private visualViewportFrame: number | null = null;
  private readonly keyboardPadding = 8;

  private focusFirstElement() {
    requestAnimationFrame(() => {
      this.firstFocusableElement?.focus?.();
    });
  }

  private getDeepActiveElement(): Element {
    let activeEl = document.activeElement;
    while (activeEl?.shadowRoot?.activeElement) {
      activeEl = activeEl.shadowRoot.activeElement;
    }
    return activeEl;
  }

  private isEditingInside(): boolean {
    const activeElement = this.getDeepActiveElement() as HTMLElement | null;
    if (!activeElement) return false;

    const isEditable = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable;
    if (!isEditable) return false;

    return this.isInsideHost(activeElement);
  }

  private isInsideHost(node: Node | null): boolean {
    let current: Node | null = node;
    while (current) {
      if (current === this.host) return true;
      current = current.parentNode ?? (current as ShadowRoot).host ?? null;
    }
    return false;
  }

  private trapFocus(event: KeyboardEvent) {
    const focusableElements = KritzelHTMLHelper.getFocusableElements(this.host);
    if (focusableElements.length === 0) return;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    const activeElement = this.getDeepActiveElement();

    if (event.shiftKey) {
      /* shift + tab */
      if (activeElement === firstFocusable) {
        lastFocusable.focus();
        event.preventDefault();
      }
    } else {
      /* tab */
      if (activeElement === lastFocusable) {
        firstFocusable.focus();
        event.preventDefault();
      }
    }
  }

  private get firstFocusableElement(): HTMLElement | null {
    const slotEl = this.host.shadowRoot?.querySelector('slot') as HTMLSlotElement | null;
    const firstAssigned = slotEl?.assignedElements({ flatten: true })[0] as HTMLElement | undefined;
    if (!firstAssigned) return null;

    const focusable = KritzelHTMLHelper.getFocusableElements(firstAssigned);
    return focusable[0] ?? firstAssigned;
  }

  private get lastAddedPortal(): HTMLElement | null {
    const portals = Array.from(document.querySelectorAll<HTMLElement>('[id^="portal-"]'));
    return portals.length ? portals[portals.length - 1] : null;
  }

  private calculateLeft() {
    if (!this.anchor || !this.portal) return 0;
    const refRect = this.anchor.getBoundingClientRect();
    const portalRect = this.portal.getBoundingClientRect();

    const offset = this.offsetX ?? this.defaultOffset;
    
    // Determine alignment based on anchor position
    // If anchor center is past the viewport midpoint, align to end (right edge of anchor)
    const anchorCenter = refRect.left + refRect.width / 2;
    const viewportMidpoint = window.innerWidth / 2;
    const shouldAlignEnd = anchorCenter > viewportMidpoint;

    let left: number;
    if (shouldAlignEnd) {
      // Align portal's right edge to anchor's right edge
      left = refRect.right - portalRect.width - offset;
    } else {
      // Align portal's left edge to anchor's left edge
      left = refRect.left + offset;
    }

    // Clamp to viewport bounds
    const maxLeft = window.innerWidth - portalRect.width - this.minLeft;
    if (left < this.minLeft) left = this.minLeft;
    if (left > maxLeft) left = maxLeft;

    return Math.round(left + window.scrollX);
  }

  private calculateTop() {
    if (!this.anchor || !this.portal) return 0;
    const refRect = this.anchor.getBoundingClientRect();
    const portalRect = this.portal.getBoundingClientRect();
    const offset = this.offsetY ?? this.defaultOffset;
    const padding = 8; // Minimum padding from viewport edges

    let top = refRect.bottom + offset;
    const spaceBelow = window.innerHeight - refRect.bottom - offset - padding;
    const spaceAbove = refRect.top - offset - padding;

    // Reset max-height CSS custom property  
    this.host.style.removeProperty('--kritzel-portal-max-height');

    if (portalRect.height <= spaceBelow) {
      // Fits below the anchor
      top = refRect.bottom + offset;
    } else if (portalRect.height <= spaceAbove) {
      // Fits above the anchor
      top = refRect.top - portalRect.height - offset;
    } else {
      // Doesn't fit above or below - constrain the height
      if (spaceBelow >= spaceAbove) {
        // More space below, keep it below with constrained height
        top = refRect.bottom + offset;
        this.host.style.setProperty('--kritzel-portal-max-height', `${spaceBelow}px`);
      } else {
        // More space above, position above with constrained height
        top = padding;
        this.host.style.setProperty('--kritzel-portal-max-height', `${spaceAbove}px`);
      }
    }

    return Math.round(top + window.scrollY);
  }

  private getThemeProvider(): HTMLElement | null {
    if (!this.anchor) return null;

    let current: HTMLElement | null = this.anchor;
    while (current) {
      const provider = current.closest('kritzel-editor');
      if (provider instanceof HTMLElement) {
        return provider;
      }

      const portalProvider = current.closest('[id^="portal-"]');
      if (portalProvider instanceof HTMLElement) {
        return portalProvider;
      }

      const root = current.getRootNode();
      if (root instanceof ShadowRoot) {
        current = root.host as HTMLElement;
      } else {
        return null;
      }
    }
    return null;
  }

  private openPortal() {
    this.portal = document.createElement('div');
    this.portal.setAttribute('id', this.id);
    this.portal.style.zIndex = '1';
    this.portal.style.position = 'absolute';
    this.portal.style.top = '0px';
    this.portal.style.left = '0px';
    this.portal.style.visibility = 'hidden';

    const themeProvider = this.getThemeProvider();
    if (themeProvider) {
      const applyTheme = () => {
        if (!this.portal) return;
        for (let i = 0; i < themeProvider.style.length; i++) {
          const prop = themeProvider.style[i];
          if (prop.startsWith('--kritzel-')) {
            this.portal.style.setProperty(prop, themeProvider.style.getPropertyValue(prop));
          }
        }
      };

      applyTheme();

      this.themeObserver = new MutationObserver(() => applyTheme());
      this.themeObserver.observe(themeProvider, {
        attributes: true,
        attributeFilter: ['style'],
      });
    }

    this.portal.appendChild(this.host);
    document.body.append(this.portal);

    // On iOS the window does not resize when the virtual keyboard opens; only the visual
    // viewport does, so listen to it directly.
    window.visualViewport?.addEventListener('resize', this.handleVisualViewportChange);
    window.visualViewport?.addEventListener('scroll', this.handleVisualViewportChange);
  }

  private closePortal() {
    this.themeObserver?.disconnect();
    this.themeObserver = null;
    window.visualViewport?.removeEventListener('resize', this.handleVisualViewportChange);
    window.visualViewport?.removeEventListener('scroll', this.handleVisualViewportChange);
    if (this.visualViewportFrame !== null) {
      cancelAnimationFrame(this.visualViewportFrame);
      this.visualViewportFrame = null;
    }
    const portal = document.getElementById(this.id);
    if (!portal) return;
    document.body.removeChild(portal);
    this.host.remove();
  }

  private handleVisualViewportChange = () => {
    if (this.visualViewportFrame !== null) return;
    this.visualViewportFrame = requestAnimationFrame(() => {
      this.visualViewportFrame = null;
      this.updatePosition();
    });
  };

  /**
   * Repositions the portal after a viewport change. While the virtual keyboard is open the
   * portal keeps its size, since the keyboard shrinks the viewport drastically (especially in
   * landscape) and would otherwise collapse its max-height. Instead, only a focused text field
   * inside the portal is kept visible above the keyboard. Layout is recalculated once the
   * keyboard closes.
   */
  private updatePosition() {
    if (!this.anchor || !this.portal) return;

    const isPositioned = this.portal.style.visibility === 'visible';
    if (isPositioned && KritzelKeyboardHelper.isKeyboardOpen()) {
      this.keepFocusedFieldVisible();
      return;
    }

    this.calculatePosition();
  }

  /**
   * Makes sure the focused text field inside the portal lies within the visual viewport,
   * i.e. is not covered by the virtual keyboard. First scrolls the portal content (e.g. a long
   * menu), then shifts the whole portal if that is not enough.
   */
  private keepFocusedFieldVisible() {
    const viewport = window.visualViewport;
    if (!viewport || !this.portal || !this.isEditingInside()) return;

    const field = this.getDeepActiveElement() as HTMLElement;
    const visibleTop = viewport.offsetTop + this.keyboardPadding;
    const visibleBottom = viewport.offsetTop + viewport.height - this.keyboardPadding;

    let rect = field.getBoundingClientRect();
    if (rect.top >= visibleTop && rect.bottom <= visibleBottom) return;

    if (rect.bottom > visibleBottom) {
      const scrollContainer = KritzelHTMLHelper.getScrollableParent(field);
      if (scrollContainer instanceof HTMLElement && this.isInsideHost(scrollContainer)) {
        // Scroll no further than bringing the field to the top of the scroll container.
        const maxScroll = Math.max(0, rect.top - scrollContainer.getBoundingClientRect().top - this.keyboardPadding);
        scrollContainer.scrollTop += Math.min(rect.bottom - visibleBottom, maxScroll);
        rect = field.getBoundingClientRect();
      }
    }

    let shift = 0;
    if (rect.bottom > visibleBottom) {
      shift = visibleBottom - rect.bottom;
    }
    if (rect.top + shift < visibleTop) {
      shift = visibleTop - rect.top;
    }

    if (shift !== 0) {
      const currentTop = parseFloat(this.portal.style.top) || 0;
      this.portal.style.top = `${Math.round(currentTop + shift)}px`;
    }
  }

  private calculatePosition() {
    if (!this.anchor || !this.portal) return;

    const top = this.calculateTop();
    const left = this.calculateLeft();
    this.portal.style.top = `${top}px`;
    this.portal.style.left = `${left}px`;
    this.portal.style.visibility = 'visible';
  }

  render() {
    return (
      <Host style={{ display: this.anchor ? 'block' : 'none' }}>
        <slot />
      </Host>
    );
  }
}
