import { Component, Host, Prop, h, State, Event, EventEmitter, Element, Method } from '@stencil/core';
import { IUpdrawMenuItem, IUpdrawMenuItemSelectEvent, IUpdrawMenuItemToggleChildMenuEvent } from '@updraw/core';

@Component({
  tag: 'updraw-menu',
  styleUrl: 'updraw-menu.css',
  shadow: true,
})
export class UpdrawMenu {
  @Element() host: HTMLElement;

  @Prop() items: IUpdrawMenuItem[];
  @Prop() parent: IUpdrawMenuItem = null;

  @Event() itemSelect: EventEmitter<IUpdrawMenuItemSelectEvent>;
  @Event() itemSave: EventEmitter<IUpdrawMenuItem>;
  @Event() itemCancel: EventEmitter<IUpdrawMenuItem>;
  @Event() itemToggleChildMenu: EventEmitter<IUpdrawMenuItemToggleChildMenuEvent>;
  @Event() itemCloseChildMenu: EventEmitter<IUpdrawMenuItem>;
  @Event() close: EventEmitter<void>;

  @State() selectedIndex: number | null = null;

  @Method()
  async setScrollTop(scrollTop: number) {
    this.host.scrollTop = scrollTop;
    this.host.scrollTo({ top: scrollTop, behavior: 'auto' });
  }

  @Method()
  async setFocus() {
    const firstItem = this.host.shadowRoot.querySelector('updraw-menu-item');
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

  private handleItemSelect = (event: CustomEvent<{ item: IUpdrawMenuItem; parent: IUpdrawMenuItem }>) => {
    event.stopPropagation();
    this.itemSelect.emit(event.detail);
  };

  private handleSave = (event: CustomEvent<IUpdrawMenuItem>) => {
    event.stopPropagation();
    this.itemSave.emit(event.detail);
  };

  private handleCancel = (event: CustomEvent<IUpdrawMenuItem>) => {
    event.stopPropagation();
    this.itemCancel.emit(event.detail);
  };

  private handleToggleChildMenu = (event: CustomEvent<{ item: IUpdrawMenuItem; childMenuAnchor: HTMLElement }>) => {
    event.stopPropagation();
    this.itemToggleChildMenu.emit(event.detail);
  };

  private handleCloseChildMenu = (event: CustomEvent<IUpdrawMenuItem>) => {
    event.stopPropagation();
    this.itemCloseChildMenu.emit(event.detail);
  };

  render() {
    return (
      <Host tabIndex={0} onClick={e => e.stopPropagation()}>
        {this.openChildMenuItem && <div class="has-open-child-overlay" onClick={this.onOverlayClick}></div>}
        {this.items.map(item => (
          <updraw-menu-item
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
          ></updraw-menu-item>
        ))}
      </Host>
    );
  }
}
