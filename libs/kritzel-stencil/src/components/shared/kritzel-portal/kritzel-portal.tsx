import { Component, Host, Listen, Prop, Watch, h, Event, EventEmitter, Element } from '@stencil/core';
import { ObjectHelper } from '../../../helpers/object.helper';

const DEFAULT_OFFSET = 0;
const MIN_LEFT_POSITION = 0;
const Z_INDEX = '1';

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
    const target = event.target as HTMLElement;
    if (!this.host.contains(target)) {
      this.closePortal();
    }
  }

  @Listen('resize', { target: 'window', capture: true })
  handleResize() {
    this.calculatePosition();
  }

  private portal: HTMLElement;

  private focusFirstElement() {
    requestAnimationFrame(() => {
      const slotEl = this.host.shadowRoot?.querySelector('slot') as HTMLSlotElement | null;
      const first = slotEl?.assignedElements({ flatten: true })[0] as HTMLElement | undefined;
      first?.focus?.();
    });
  }

  private calculateLeft() {
    if (!this.anchor || !this.portal) return 0;
    const refRect = this.anchor.getBoundingClientRect();
    const portalRect = this.portal.getBoundingClientRect();

    const offset = this.offsetX ?? DEFAULT_OFFSET;
    let left = refRect.left + offset;

    const maxLeft = window.innerWidth - portalRect.width - MIN_LEFT_POSITION;
    if (left < MIN_LEFT_POSITION) left = MIN_LEFT_POSITION;
    if (left > maxLeft) left = maxLeft;

    return Math.round(left + window.scrollX);
  }

  private calculateTop() {
    if (!this.anchor || !this.portal) return 0;
    const refRect = this.anchor.getBoundingClientRect();
    const portalRect = this.portal.getBoundingClientRect();
    const offset = this.offsetY ?? DEFAULT_OFFSET;

    let top = refRect.bottom + offset;

    if (top + portalRect.height > window.innerHeight) {
      top = refRect.top - portalRect.height - offset;
    }

    return Math.round(top + window.scrollY);
  }

  private openPortal() {
    this.portal = document.createElement('div');
    this.portal.setAttribute('id', `portal-${ObjectHelper.generateUUID()}`);
    this.portal.style.zIndex = Z_INDEX;
    this.portal.style.position = 'absolute';
    this.portal.style.top = '0px';
    this.portal.style.left = '0px';
    this.portal.appendChild(this.host);
    document.body.append(this.portal);
  }

  private closePortal() {
    this.host.remove();
    document.body.removeChild(this.portal);
    this.close.emit();
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
