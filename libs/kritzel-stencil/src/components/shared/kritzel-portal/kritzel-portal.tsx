import { Component, Host, Listen, Prop, Watch, h, Event, EventEmitter, Element } from '@stencil/core';
import { ObjectHelper } from '../../../helpers/object.helper';

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
      this.calculatePosition();
      if (this.autoFocus) {
        this.focusFirstElement();
      }
    } else {
      this.closePortal();
    }
  }

  @Prop() offsetX: number;
  @Prop() offsetY: number;
  @Prop() autoFocus: boolean = true;

  @Event() close: EventEmitter<void>;

  @Listen('click', { target: 'window' })
  handleOutsideClick(event: MouseEvent) {
    event.stopPropagation();

    const isLastPortal = this.lastAddedPortal === this.portal;
    if (!isLastPortal) return;

    const target = event.target as HTMLElement;
    if (!this.host.contains(target)) {
      this.close.emit();
      this.closePortal();
    }
  }

  @Listen('keydown', { target: 'window' })
  handleKeyDown(event: KeyboardEvent) {
    event.stopPropagation();

    const isLastPortal = this.lastAddedPortal === this.portal;
    if (!isLastPortal) return;

    if (event.key === 'Escape') {
      this.anchor.focus();
      this.close.emit();
      this.closePortal();
    }

    if (event.key === 'Tab') {
      this.trapFocus(event);
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
    this.calculatePosition();
  }

  private portal: HTMLElement;
  private id: string = `portal-${ObjectHelper.generateUUID()}`;
  private defaultOffset = 0;
  private minLeft = 0;

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

  private trapFocus(event: KeyboardEvent) {
    const focusableElements = this.getFocusableElements(this.host);
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

  private getFocusableElements(root: HTMLElement): HTMLElement[] {
    if (!root) return [];

    const focusableElements: HTMLElement[] = [];
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), details, [tabindex]:not([tabindex="-1"])';

    const isVisible = (el: HTMLElement) => {
      return el.offsetParent !== null;
    };

    const find = (element: Element) => {
      // Check if the element itself is focusable
      if (element instanceof HTMLElement && element.matches(focusableSelector) && !element.hasAttribute('disabled') && isVisible(element)) {
        focusableElements.push(element);
      }

      // Traverse shadow DOM
      if (element.shadowRoot) {
        Array.from(element.shadowRoot.children).forEach(find);
      }

      // Traverse slotted content
      if (element.tagName === 'SLOT') {
        (element as HTMLSlotElement).assignedElements({ flatten: true }).forEach(find);
      }

      // Traverse light DOM children if there is no shadow root
      if (!element.shadowRoot) {
        Array.from(element.children).forEach(find);
      }
    };

    find(root);

    return focusableElements;
  }

  private get firstFocusableElement(): HTMLElement | null {
    const slotEl = this.host.shadowRoot?.querySelector('slot') as HTMLSlotElement | null;
    const firstAssigned = slotEl?.assignedElements({ flatten: true })[0] as HTMLElement | undefined;
    if (!firstAssigned) return null;

    const focusable = this.getFocusableElements(firstAssigned);
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
    let left = refRect.left + offset;

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

    let top = refRect.bottom + offset;

    if (top + portalRect.height > window.innerHeight) {
      top = refRect.top - portalRect.height - offset;
    }

    return Math.round(top + window.scrollY);
  }

  private openPortal() {
    this.portal = document.createElement('div');
    this.portal.setAttribute('id', this.id);
    this.portal.style.zIndex = '1';
    this.portal.style.position = 'absolute';
    this.portal.style.top = '0px';
    this.portal.style.left = '0px';
    this.portal.appendChild(this.host);
    document.body.append(this.portal);
  }

  private closePortal() {
    const portal = document.getElementById(this.id);
    if (!portal) return;
    document.body.removeChild(portal);
    this.host.remove();
  }

  private calculatePosition() {
    if (!this.anchor || !this.portal) return;
    const top = this.calculateTop();
    const left = this.calculateLeft();
    this.portal.style.top = `${top}px`;
    this.portal.style.left = `${left}px`;
  }

  render() {
    return (
      <Host style={{ display: this.anchor ? 'block' : 'none' }}>
        <slot />
      </Host>
    );
  }
}
