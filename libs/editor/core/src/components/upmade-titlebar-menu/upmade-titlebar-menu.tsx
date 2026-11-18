import { Component, Event, EventEmitter, Host, Prop, h } from '@stencil/core';
import { IUpmadeMenuItem, IUpmadeMenuItemSelectEvent, UpmadeTitlebarMenuItem } from '@upmade/core';

/**
 * The menu opened from a titlebar `menu` element: a compact `upmade-menu` styled like the
 * context menu through the `--upmade-titlebar-menu-*` theme variables.
 */
@Component({
  tag: 'upmade-titlebar-menu',
  styleUrl: 'upmade-titlebar-menu.css',
  shadow: true,
})
export class UpmadeTitlebarMenu {
  /** Menu items of the open titlebar menu, as resolved by the engine. */
  @Prop() items: UpmadeTitlebarMenuItem[] = [];

  /** Emitted with the id of the selected menu item. */
  @Event() menuItemSelect: EventEmitter<string>;

  private get menuItems(): IUpmadeMenuItem[] {
    return (this.items ?? []).map(item => ({
      id: item.id,
      label: item.label,
      icon: item.icon,
      isDisabled: item.isDisabled === true,
    }));
  }

  private handleItemSelect = (event: CustomEvent<IUpmadeMenuItemSelectEvent>) => {
    event.stopPropagation();
    this.menuItemSelect.emit(event.detail.item.id);
  };

  render() {
    return (
      <Host>
        <upmade-menu data-testid="object-titlebar-menu" items={this.menuItems} onItemSelect={this.handleItemSelect}></upmade-menu>
      </Host>
    );
  }
}
