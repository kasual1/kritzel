import { Component, Host, Prop, h, State, Event, EventEmitter, Element, Listen } from '@stencil/core';
import { KritzelMenuItemNew } from '../../../interfaces/menu-item-new.interface';

@Component({
  tag: 'kritzel-menu-new',
  styleUrl: 'kritzel-menu-new.css',
  shadow: true,
})
export class KritzelMenuNew {
  @Element() host: HTMLElement;

  @Prop() items: KritzelMenuItemNew[];
  @Prop() parent: KritzelMenuItemNew = null;

  @Event() itemSelect: EventEmitter<KritzelMenuItemNew>;
  @Event() close: EventEmitter<void>;

  @State() selectedIndex: number | null = null;

  @Listen('click', { target: 'window' })
  handleOutsideClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (!this.host.contains(target)) {
      this.close.emit();
    }
  }

  get hasOpenChildMenu() {
    return this.items.some(item => item.isChildMenuOpen);
  }

  get openChildMenuItem() {
    return this.items.find(item => item.isChildMenuOpen);
  }

  onOverlayClick = (event: MouseEvent) => {
    event.stopPropagation();
    this.openChildMenuItem.closeChildMenu?.(this.openChildMenuItem);
  }

  render() {
    return (
      <Host>
        {this.hasOpenChildMenu && (
          <div class="has-open-child-overlay" onClick={this.onOverlayClick}></div>
        )}

        {this.items.map((item, index) => (
          <kritzel-menu-item
            key={index}
            item={item}
            parent={this.parent}
          ></kritzel-menu-item>
        ))}
      </Host>
    );
  }
}
