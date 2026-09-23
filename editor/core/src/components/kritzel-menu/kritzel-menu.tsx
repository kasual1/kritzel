import { Component, Host, Prop, h, State, Event, EventEmitter, Element, Method } from '@stencil/core';
import { IKritzelMenuItem, IKritzelMenuItemSelectEvent, IKritzelMenuItemToggleChildMenuEvent } from '@kritzel/engine';

@Component({
  tag: 'kritzel-menu',
  styleUrl: 'kritzel-menu.css',
  shadow: true,
})
export class KritzelMenu {
  @Element() host: HTMLElement;

  @Prop() items: IKritzelMenuItem[];
  @Prop() parent: IKritzelMenuItem = null;

  @Event() itemSelect: EventEmitter<IKritzelMenuItemSelectEvent>;
  @Event() itemSave: EventEmitter<IKritzelMenuItem>;
  @Event() itemCancel: EventEmitter<IKritzelMenuItem>;
  @Event() itemToggleChildMenu: EventEmitter<IKritzelMenuItemToggleChildMenuEvent>;
  @Event() itemCloseChildMenu: EventEmitter<IKritzelMenuItem>;
  @Event() close: EventEmitter<void>;

  @State() selectedIndex: number | null = null;

  @Method()
  async setScrollTop(scrollTop: number) {
    this.host.scrollTop = scrollTop;
    this.host.scrollTo({ top: scrollTop, behavior: 'auto' });
  }

  @Method()
  async setFocus() {
    const firstItem = this.host.shadowRoot.querySelector('kritzel-menu-item');
    if (firstItem) {
      firstItem.focus();
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
  };

  private handleSave = (event: CustomEvent<IKritzelMenuItem>) => {
    event.stopPropagation();
    this.itemSave.emit(event.detail);
  };

  private handleCancel = (event: CustomEvent<IKritzelMenuItem>) => {
    event.stopPropagation();
    this.itemCancel.emit(event.detail);
  };

  private handleToggleChildMenu = (event: CustomEvent<{ item: IKritzelMenuItem; childMenuAnchor: HTMLElement }>) => {
    event.stopPropagation();
    this.itemToggleChildMenu.emit(event.detail);
  };

  private handleCloseChildMenu = (event: CustomEvent<IKritzelMenuItem>) => {
    event.stopPropagation();
    this.itemCloseChildMenu.emit(event.detail);
  };

  render() {
    return (
      <Host tabIndex={0} onClick={e => e.stopPropagation()}>
        {this.openChildMenuItem && <div class="has-open-child-overlay" onClick={this.onOverlayClick}></div>}
        {this.items.map(item => (
          <kritzel-menu-item
            key={item.id}
            data-testid={`menu-item-${item.id}`}
            item={item}
            parent={this.parent}
            style={{ pointerEvents: this.editingMenuItem && !item.isEditing ? 'none' : 'auto' }}
            onItemSelect={this.handleItemSelect}
            onItemSave={this.handleSave}
            onItemCancel={this.handleCancel}
            onItemToggleChildMenu={this.handleToggleChildMenu}
            onItemCloseChildMenu={this.handleCloseChildMenu}
          ></kritzel-menu-item>
        ))}
      </Host>
    );
  }
}
