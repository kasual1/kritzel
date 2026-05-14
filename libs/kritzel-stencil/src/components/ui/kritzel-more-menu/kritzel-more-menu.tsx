import { Component, Host, h, Prop, State, Element, Event, EventEmitter } from '@stencil/core';
import { KritzelDevicesHelper } from '../../../helpers/devices.helper';
import { IKritzelMenuItem } from '../../../interfaces/menu-item.interface';

@Component({
  tag: 'kritzel-more-menu',
  styleUrl: 'kritzel-more-menu.css',
  shadow: true,
})
export class KritzelMoreMenu {
  @Element() host!: HTMLElement;

  /**
   * Whether the menu button is visible
   */
  @Prop() visible: boolean = false;

  /**
   * The menu items to display in the dropdown.
   * Items with `isVisible` set to `false` will be filtered out.
   * Items with an `action` will have that action invoked on selection.
   */
  @Prop() items: IKritzelMenuItem[] = [];

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
  @State() isTouchDevice: boolean = KritzelDevicesHelper.isTouchDevice();

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

  private get visibleItems(): IKritzelMenuItem[] {
    return this.items.filter(item => item.isVisible !== false);
  }

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
      <Host class={{ mobile: this.isTouchDevice }} style={{ display: this.visible ? '' : 'none' }}>
        <div class={{ 'more-menu-wrapper': true, visible: this.visible }}>
          <button
            class="more-menu-button"
            data-testid="more-menu-button"
            onClick={this.toggleMenu}
            aria-label="More options"
          >
            <kritzel-icon name={this.icon} size={this.iconSize}></kritzel-icon>
          </button>

          <kritzel-portal anchor={this.menuAnchor} offsetY={this.offsetY} onClose={this.closeMenu}>
            <kritzel-menu
              items={this.visibleItems}
              onItemSelect={this.handleMenuItemSelect}
            ></kritzel-menu>
          </kritzel-portal>
        </div>
      </Host>
    );
  }
}
