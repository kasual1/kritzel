import { Component, Host, Prop, h, State, Event, EventEmitter, Element, Method } from '@stencil/core';
import { IUpmadeMenuItem, IUpmadeMenuItemSelectEvent, IUpmadeMenuItemToggleChildMenuEvent } from '@upmade/core';

@Component({
  tag: 'upmade-menu',
  styleUrl: 'upmade-menu.css',
  shadow: true,
})
export class UpmadeMenu {
  @Element() host: HTMLElement;

  @Prop() items: IUpmadeMenuItem[];
  @Prop() parent: IUpmadeMenuItem = null;

  @Event() itemSelect: EventEmitter<IUpmadeMenuItemSelectEvent>;
  @Event() itemSave: EventEmitter<IUpmadeMenuItem>;
  @Event() itemCancel: EventEmitter<IUpmadeMenuItem>;
  @Event() itemToggleChildMenu: EventEmitter<IUpmadeMenuItemToggleChildMenuEvent>;
  @Event() itemCloseChildMenu: EventEmitter<IUpmadeMenuItem>;
  @Event() close: EventEmitter<void>;

  @State() selectedIndex: number | null = null;

  @Method()
  async setScrollTop(scrollTop: number) {
    this.host.scrollTop = scrollTop;
    this.host.scrollTo({ top: scrollTop, behavior: 'auto' });
  }

  @Method()
  async setFocus() {
    const firstItem = this.host.shadowRoot.querySelector('upmade-menu-item');
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

  private handleItemSelect = (event: CustomEvent<{ item: IUpmadeMenuItem; parent: IUpmadeMenuItem }>) => {
    event.stopPropagation();
    this.itemSelect.emit(event.detail);
  };

  private handleSave = (event: CustomEvent<IUpmadeMenuItem>) => {
    event.stopPropagation();
    this.itemSave.emit(event.detail);
  };

  private handleCancel = (event: CustomEvent<IUpmadeMenuItem>) => {
    event.stopPropagation();
    this.itemCancel.emit(event.detail);
  };

  private handleToggleChildMenu = (event: CustomEvent<{ item: IUpmadeMenuItem; childMenuAnchor: HTMLElement }>) => {
    event.stopPropagation();
    this.itemToggleChildMenu.emit(event.detail);
  };

  private handleCloseChildMenu = (event: CustomEvent<IUpmadeMenuItem>) => {
    event.stopPropagation();
    this.itemCloseChildMenu.emit(event.detail);
  };

  render() {
    return (
      <Host tabIndex={0} onClick={e => e.stopPropagation()}>
        {this.openChildMenuItem && <div class="has-open-child-overlay" onClick={this.onOverlayClick}></div>}
        {this.items.map(item => (
          <upmade-menu-item
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
          ></upmade-menu-item>
        ))}
      </Host>
    );
  }
}
