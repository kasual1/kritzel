import { Component, Host, h, Prop, State, Element, Event, EventEmitter } from '@stencil/core';
import { IKritzelMenuItem } from '../../../interfaces/menu-item.interface';
import { IKritzelUser } from '../../../interfaces/user.interface';

@Component({
  tag: 'kritzel-current-user',
  styleUrl: 'kritzel-current-user.css',
  shadow: true,
})
export class KritzelCurrentUser {
  @Element() host!: HTMLElement;

  /**
   * The current user to display
   */
  @Prop() user?: IKritzelUser;

  /**
   * Avatar size in pixels
   */
  @Prop() avatarSize: number = 40;

  /**
   * Offset Y for the portal positioning
   */
  @Prop() offsetY: number = 4;

  /**
   * Emitted when a menu item is selected
   */
  @Event() itemSelect: EventEmitter<{ item: IKritzelMenuItem; parent: IKritzelMenuItem }>;

  @State() menuAnchor: HTMLElement = null;

  private menuItems: IKritzelMenuItem[] = [
    {
      id: 'logout',
      label: 'Logout',
      icon: 'log-out',
    },
  ];

  private toggleMenu = (event: MouseEvent): void => {
    event.stopPropagation();
    if (this.menuAnchor) {
      this.closeMenu();
    } else {
      window.dispatchEvent(new CustomEvent('kritzel-dismiss-menus'));
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
        <kritzel-avatar user={this.user}  size={this.avatarSize} onClick={this.toggleMenu}></kritzel-avatar>

        <kritzel-portal anchor={this.menuAnchor} offsetY={this.offsetY} onClose={this.closeMenu}>
          <kritzel-menu items={this.menuItems} onItemSelect={this.handleMenuItemSelect}></kritzel-menu>
        </kritzel-portal>
      </Host>
    );
  }
}
