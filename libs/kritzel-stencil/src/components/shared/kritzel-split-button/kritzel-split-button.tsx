import { Component, h, Prop, State, Event, EventEmitter, Host, Element, Method } from '@stencil/core';
import { KritzelDevicesHelper } from '../../../helpers/devices.helper';
import { IKritzelMenuItem, IKritzelMenuItemSelectEvent, IKritzelMenuItemToggleChildMenuEvent } from '../../../interfaces/menu-item.interface';

@Component({
  tag: 'kritzel-split-button',
  styleUrl: 'kritzel-split-button.css',
  shadow: true,
})
export class KritzelSplitButton {
  @Element() host!: HTMLElement;

  @Prop() buttonIcon: string = 'plus';
  @Prop() dropdownIcon: string = 'chevron-down';
  @Prop() items: IKritzelMenuItem[] = [];
  @Prop() mainButtonDisabled = false;
  @Prop() menuButtonDisabled = false;

  @Event() buttonClick: EventEmitter<void>;
  @Event() itemSelect: EventEmitter<IKritzelMenuItemSelectEvent>;
  @Event() itemSave: EventEmitter<IKritzelMenuItem>;
  @Event() itemCancel: EventEmitter<IKritzelMenuItem>;
  @Event() itemToggleChildMenu: EventEmitter<IKritzelMenuItemToggleChildMenuEvent>;
  @Event() itemCloseChildMenu: EventEmitter<IKritzelMenuItem>;
  @Event() close: EventEmitter<void>;

  @State() isMenuOpen = false;
  @State() isTouchDevice: boolean = KritzelDevicesHelper.isTouchDevice();
  @State() anchorElement: HTMLElement;

  splitMenuButtonRef: HTMLButtonElement;
  menuRef: HTMLKritzelMenuElement;

  @Method()
  async open() {
    if (this.isMenuOpen) return;
    this.openMenu(new MouseEvent('click'));
  }

  private handleButtonClick = (event: MouseEvent) => {
    event.stopPropagation();
    this.buttonClick.emit();
  };

  private toggleMenu = (event: MouseEvent) => {
    event.stopPropagation();
    if (this.isMenuOpen) {
      this.closeMenu();
    } else {
      this.openMenu(event);
    }
  };

  private openMenu = (event: MouseEvent) => {
    event.stopPropagation();
    this.isMenuOpen = true;
    this.anchorElement = this.host;
  };

  private closeMenu = () => {
    this.isMenuOpen = false;
    this.anchorElement = null;
    this.close.emit();
  };

  private handleItemSelect = event => {
    this.itemSelect.emit(event.detail);
  };

  private handleItemSave = event => {
    this.itemSave.emit(event.detail);
  };

  private handleItemCancel = event => {
    this.itemCancel.emit(event.detail);
  };

  private handleItemToggleChildMenu = event => {
    this.itemToggleChildMenu.emit(event.detail);
  };

  private handleItemCloseChildMenu = event => {
    this.itemCloseChildMenu.emit(event.detail);
  };

  render() {
    return (
      <Host class={{ mobile: this.isTouchDevice }}>
        <button class="split-main-button" tabIndex={0} onClick={this.handleButtonClick} disabled={this.mainButtonDisabled}>
          {this.buttonIcon && <kritzel-icon name={this.buttonIcon}></kritzel-icon>}
        </button>

        <div class="split-divider"></div>

        <button ref={el => (this.splitMenuButtonRef = el)} class="split-menu-button" tabIndex={0} onClick={this.toggleMenu} disabled={this.menuButtonDisabled}>
          <kritzel-icon name={this.dropdownIcon}></kritzel-icon>
        </button>

        <kritzel-portal anchor={this.anchorElement} offsetY={4} onClose={this.closeMenu}>
          <kritzel-menu
            ref={el => (this.menuRef = el)}
            items={this.items}
            onItemSelect={this.handleItemSelect}
            onItemSave={this.handleItemSave}
            onItemCancel={this.handleItemCancel}
            onItemToggleChildMenu={this.handleItemToggleChildMenu}
            onItemCloseChildMenu={this.handleItemCloseChildMenu}
            onClose={this.closeMenu}
          ></kritzel-menu>
        </kritzel-portal>
      </Host>
    );
  }
}
