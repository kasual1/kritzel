import { Component, Event, EventEmitter, Host, Prop, h } from '@stencil/core';
import { IUpdrawMenuItem, IUpdrawMenuItemSelectEvent, UpdrawTitlebarMenuItem } from '@updraw/core';

/**
 * The menu opened from a titlebar `menu` element: a compact `updraw-menu` styled like the
 * context menu through the `--updraw-titlebar-menu-*` theme variables.
 */
@Component({
  tag: 'updraw-titlebar-menu',
  styleUrl: 'updraw-titlebar-menu.css',
  shadow: true,
})
export class UpdrawTitlebarMenu {
  /** Menu items of the open titlebar menu, as resolved by the engine. */
  @Prop() items: UpdrawTitlebarMenuItem[] = [];

  /** Emitted with the id of the selected menu item. */
  @Event() menuItemSelect: EventEmitter<string>;

  private get menuItems(): IUpdrawMenuItem[] {
    return (this.items ?? []).map(item => ({
      id: item.id,
      label: item.label,
      icon: item.icon,
      isDisabled: item.isDisabled === true,
    }));
  }

  private handleItemSelect = (event: CustomEvent<IUpdrawMenuItemSelectEvent>) => {
    event.stopPropagation();
    this.menuItemSelect.emit(event.detail.item.id);
  };

  render() {
    return (
      <Host>
        <updraw-menu data-testid="object-titlebar-menu" items={this.menuItems} onItemSelect={this.handleItemSelect}></updraw-menu>
      </Host>
    );
  }
}
