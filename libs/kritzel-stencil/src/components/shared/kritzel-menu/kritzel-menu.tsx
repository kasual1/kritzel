import { Component, Host, Prop, h, State, Event, EventEmitter, Element, Listen } from '@stencil/core';
import { IKritzelMenuItem } from '../../../interfaces/menu-item-new.interface';

@Component({
  tag: 'kritzel-menu',
  styleUrl: 'kritzel-menu.css',
  shadow: true,
})
export class KritzelMenu {
  @Element() host: HTMLElement;

  @Prop() items: IKritzelMenuItem[];
  @Prop() parent: IKritzelMenuItem = null;

  @Event() itemSelect: EventEmitter<{ item: IKritzelMenuItem; parent: IKritzelMenuItem }>;
  @Event() itemSave: EventEmitter<IKritzelMenuItem>;
  @Event() itemCancel: EventEmitter<IKritzelMenuItem>;
  @Event() itemToggleChildMenu: EventEmitter<{ item: IKritzelMenuItem; childMenuAnchor: HTMLElement }>;
  @Event() itemCloseChildMenu: EventEmitter<IKritzelMenuItem>;


  @Event() close: EventEmitter<void>;

  @State() selectedIndex: number | null = null;

  @Listen('click', { target: 'window' })
  handleOutsideClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (!this.host.contains(target)) {

      if(this.editingMenuItem) {
        this.itemCancel.emit(this.editingMenuItem);
      }
      
      this.close.emit();
    }
  }

  get openChildMenuItem() {
    return this.items.find(item => item.isChildMenuOpen);
  }

  get editingMenuItem() {
    return this.items.find(item => item.isEditing);
  }

  private onOverlayClick = (event: MouseEvent) => {
    event.stopPropagation();
    this.itemCloseChildMenu.emit(this.openChildMenuItem);
  };

  private handleItemSelect = (event: CustomEvent<{ item: IKritzelMenuItem; parent: IKritzelMenuItem }>) => {
    event.stopPropagation();
    this.itemSelect.emit(event.detail);
  }

  private handleSave = (event: CustomEvent<IKritzelMenuItem>) => {
    event.stopPropagation();
    this.itemSave.emit(event.detail);
  }

  render() {
    return (
      <Host>
        {this.openChildMenuItem && <div class="has-open-child-overlay" onClick={this.onOverlayClick}></div>}

        {this.items.map((item) => (
          <kritzel-menu-item
            key={item.id}
            item={item}
            parent={this.parent}
            style={{ pointerEvents: this.editingMenuItem && !item.isEditing ? 'none' : 'auto' }}
            onItemSelect={(event) => this.handleItemSelect(event)}
            onItemSave={this.handleSave}
            onItemCancel={(event) => this.itemCancel.emit(event.detail)}
            onItemToggleChildMenu={(event) => this.itemToggleChildMenu.emit(event.detail)}
          ></kritzel-menu-item>
        ))}
      </Host>
    );
  }
}
