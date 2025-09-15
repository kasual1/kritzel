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

  @Event() itemSelect: EventEmitter<KritzelMenuItemNew>;
  @Event() close: EventEmitter<void>;

  @State() selectedIndex: number | null = null;
  @State() isChildMenuOpen: boolean = false;

  @Listen('click', { target: 'window', capture: true })
  handleOutsideClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if ((!this.host.contains(target) && !this.isChildMenuOpen)) {
      this.close.emit();
    }
  }

  render() {
    return (
      <Host>
        {this.items.map((item, index) => (
          <kritzel-menu-item
            item={item}
            isSelected={this.selectedIndex === index}
            isDisabled={item.isDisabled}
            parent={this.host}
            onSave={e => (this.items[index] = e.detail)}
            onCancel={() => (this.selectedIndex = null)}
            onItemSelect={() => {
              if (item.isSelectable !== false) {
                this.selectedIndex = index;
              }
            }}
            onChildOpen={e => (this.isChildMenuOpen = e.detail)}
          ></kritzel-menu-item>
        ))}
      </Host>
    );
  }
}
