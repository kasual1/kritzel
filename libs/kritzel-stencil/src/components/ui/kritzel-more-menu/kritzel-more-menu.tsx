import { Component, Host, h, Prop, State, Element, Event, EventEmitter } from '@stencil/core';
import { IKritzelMenuItem } from '../../../interfaces/menu-item.interface';

@Component({
  tag: 'kritzel-more-menu',
  styleUrl: 'kritzel-more-menu.css',
  shadow: true,
})
export class KritzelMoreMenu {
  @Element() host!: HTMLElement;

  /**
   * The menu items to display in the dropdown
   */
  @Prop() items: IKritzelMenuItem[] = [
    {
      id: 'share',
      label: 'Share',
      icon: 'share',
    },
    {
      id: 'export',
      label: 'Export',
      icon: 'upload',
    },
    {
      id: 'import',
      label: 'Import',
      icon: 'download',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
    },
  ];

  /**
   * The icon to display on the button
   */
  @Prop() icon: string = 'ellipsis-vertical';

  /**
   * The size of the icon
   */
  @Prop() iconSize: number = 24;

  /**
   * Offset Y for the portal positioning
   */
  @Prop() offsetY: number = 4;

  /**
   * Emitted when a menu item is selected
   */
  @Event() itemSelect: EventEmitter<{ item: IKritzelMenuItem; parent: IKritzelMenuItem }>;

  @State() menuAnchor: HTMLElement = null;

  private toggleMenu = (event: MouseEvent): void => {
    event.stopPropagation();
    if (this.menuAnchor) {
      this.closeMenu();
    } else {
      this.menuAnchor = this.host;
    }
  };

  private closeMenu = (): void => {
    this.menuAnchor = null;
  };

  private handleMenuItemSelect = (event: CustomEvent<{ item: IKritzelMenuItem; parent: IKritzelMenuItem }>): void => {
    const { item, parent } = event.detail;

    if (item.action) {
      item.action(item, parent);
    }
    this.itemSelect.emit(event.detail);
    this.closeMenu();
  };

  render() {
    return (
      <Host>
        <button
          class="more-menu-button"
          onClick={this.toggleMenu}
        >
          <kritzel-icon name={this.icon} size={this.iconSize}></kritzel-icon>
        </button>

        <kritzel-portal anchor={this.menuAnchor} offsetY={this.offsetY} onClose={this.closeMenu}>
          <kritzel-menu
            items={this.items}
            onItemSelect={this.handleMenuItemSelect}
          ></kritzel-menu>
        </kritzel-portal>
      </Host>
    );
  }
}
