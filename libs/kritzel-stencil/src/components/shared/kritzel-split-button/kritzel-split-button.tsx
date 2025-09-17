import { Component, h, Prop, State, Event, EventEmitter, Host, Element, Method } from '@stencil/core';
import { KritzelMenuItem } from '../../../interfaces/menu-item.interface';
import { KritzelDevicesHelper } from '../../../helpers/devices.helper';
import { KritzelMenuItemNew } from '../../../interfaces/menu-item-new.interface';

@Component({
  tag: 'kritzel-split-button',
  styleUrl: 'kritzel-split-button.css',
  shadow: true,
})
export class KritzelSplitButton {
  @Prop()
  buttonIcon: string = 'plus';

  @Prop()
  dropdownIcon: string = 'chevron-down';

  @Prop()
  items: KritzelMenuItemNew[] = [];

  @Prop()
  mainButtonDisabled = false;

  @Prop()
  menuButtonDisabled = false;

  @Event()
  buttonClick: EventEmitter<void>;

  @Event()
  optionSelect: EventEmitter<KritzelMenuItem>;

  @Event()
  close: EventEmitter<void>;

  @Element()
  host!: HTMLElement;

  @State()
  isMenuOpen = false;

  @State()
  isTouchDevice: boolean = KritzelDevicesHelper.isTouchDevice();

  @State()
  anchorElement: HTMLElement;

  splitMenuButton: HTMLButtonElement;


  @Method()
  async open() {
    if (this.isMenuOpen) return;
    this.openMenu(new MouseEvent('click'));
  }

  private openMenu = (event: MouseEvent) => {
    event.stopPropagation();
    this.isMenuOpen = true;
    this.anchorElement = this.host;
  };

  private closeMenu = () => {
    this.isMenuOpen = false;
    this.anchorElement = null;
    this.closeAllChildMenus(this.items);
    this.close.emit();
  };

  private toggleMenu = (event: MouseEvent) => {
    event.stopPropagation();
    if (this.isMenuOpen) {
      this.closeMenu();
    } else {
      this.openMenu(event);
    }
  };

  private closeAllChildMenus = (items: KritzelMenuItemNew[]): void => {
    if (!items || items.length === 0) {
      return;
    }

    for (const item of items) {
      if (item.isChildMenuOpen && typeof item.closeChildMenu === 'function') {
        item.closeChildMenu(item);
      }

      if (item.children && item.children.length > 0) {
        this.closeAllChildMenus(item.children);
      }
    }
  };

  private handleButtonClick = (event: MouseEvent) => {
    event.stopPropagation();
    this.buttonClick.emit();
  }


  render() {
    return (
      <Host tabIndex={0} class={{ mobile: this.isTouchDevice }}>
        <button class="split-main-button" tabIndex={0} onClick={this.handleButtonClick} disabled={this.mainButtonDisabled}>
          {this.buttonIcon && <kritzel-icon name={this.buttonIcon}></kritzel-icon>}
        </button>

        <div class="split-divider"></div>

        <button ref={el => (this.splitMenuButton = el)} class="split-menu-button" tabIndex={0} onClick={this.toggleMenu} disabled={this.menuButtonDisabled}>
          <kritzel-icon name={this.dropdownIcon}></kritzel-icon>
        </button>

        <kritzel-portal anchor={this.anchorElement} offsetY={4}>
          <kritzel-menu-new items={this.items} onClose={this.closeMenu}></kritzel-menu-new>
        </kritzel-portal>
      </Host>
    );
  }
}
