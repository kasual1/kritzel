import { Component, Host, Prop, h, State, Event, EventEmitter } from '@stencil/core';
import { KritzelMenuItemNew } from '../../../interfaces/menu-item-new.interface';

@Component({
  tag: 'kritzel-menu-new',
  styleUrl: 'kritzel-menu-new.css',
  shadow: true,
})
export class KritzelMenuNew {
  @Prop() items: KritzelMenuItemNew[];

  @Event() itemSelect: EventEmitter<KritzelMenuItemNew>;

  @State() selectedIndex: number | null = null;

  render() {
    return (
      <Host>
        {this.items.map((item, index) => (
          <kritzel-menu-item
            item={item}
            isSelected={this.selectedIndex === index}
            isDisabled={item.isDisabled}
            onSave={e => this.items[index] = e.detail}
            onCancel={() => (this.selectedIndex = null)}
            onItemSelect={e => this.itemSelect.emit(e.detail)}
          ></kritzel-menu-item>
        ))}
      </Host>
    );
  }
}
