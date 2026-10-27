import { Component, Event, EventEmitter, Host, Prop, h } from '@stencil/core';
import { IKritzelMenuItem, IKritzelMenuItemSelectEvent, KritzelTitlebarMenuItem } from '@kritzel/engine';

/**
 * The menu opened from a titlebar `menu` element: a compact `kritzel-menu` styled like the
 * context menu through the `--kritzel-titlebar-menu-*` theme variables.
 */
@Component({
  tag: 'kritzel-titlebar-menu',
  styleUrl: 'kritzel-titlebar-menu.css',
  shadow: true,
})
export class KritzelTitlebarMenu {
  /** Menu items of the open titlebar menu, as resolved by the engine. */
  @Prop() items: KritzelTitlebarMenuItem[] = [];

  /** Emitted with the id of the selected menu item. */
  @Event() menuItemSelect: EventEmitter<string>;

  private get menuItems(): IKritzelMenuItem[] {
    return (this.items ?? []).map(item => ({
      id: item.id,
      label: item.label,
      icon: item.icon,
      isDisabled: item.isDisabled === true,
    }));
  }

  private handleItemSelect = (event: CustomEvent<IKritzelMenuItemSelectEvent>) => {
    event.stopPropagation();
    this.menuItemSelect.emit(event.detail.item.id);
  };

  render() {
    return (
      <Host>
        <kritzel-menu data-testid="object-titlebar-menu" items={this.menuItems} onItemSelect={this.handleItemSelect}></kritzel-menu>
      </Host>
    );
  }
}
