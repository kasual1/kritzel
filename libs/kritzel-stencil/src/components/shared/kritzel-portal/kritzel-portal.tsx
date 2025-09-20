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
    const target = event.target as HTMLElement;
    if (!this.host.contains(target)) {
      this.close.emit();
      this.closePortal();
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
      const slotEl = this.host.shadowRoot?.querySelector('slot') as HTMLSlotElement | null;
      const first = slotEl?.assignedElements({ flatten: true })[0] as HTMLElement | undefined;
      first?.focus?.();
    });
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
