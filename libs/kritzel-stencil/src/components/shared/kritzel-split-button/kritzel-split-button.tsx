import { Component, h, Prop, State, Event, EventEmitter, Host, Element, Method } from '@stencil/core';
import { KritzelDevicesHelper } from '../../../helpers/devices.helper';
import { KritzelMenuItemNew } from '../../../interfaces/menu-item-new.interface';

@Component({
  tag: 'kritzel-split-button',
  styleUrl: 'kritzel-split-button.css',
  shadow: true,
})
export class KritzelSplitButton {
  @Prop() buttonIcon: string = 'plus';
  @Prop() dropdownIcon: string = 'chevron-down';
  @Prop() items: KritzelMenuItemNew[] = [];
  @Prop() mainButtonDisabled = false;
  @Prop() menuButtonDisabled = false;

  @Event() buttonClick: EventEmitter<void>;
  @Event() itemSelect: EventEmitter<{ item: KritzelMenuItemNew; parent: KritzelMenuItemNew }>;
  @Event() itemSave: EventEmitter<KritzelMenuItemNew>;
  @Event() itemCancel: EventEmitter<KritzelMenuItemNew>;
  @Event() itemToggleChildMenu: EventEmitter<{ item: KritzelMenuItemNew; childMenuAnchor: HTMLElement }>;
  @Event() itemCloseChildMenu: EventEmitter<KritzelMenuItemNew>;
  @Event() close: EventEmitter<void>;

  @Element() host!: HTMLElement;

  @State() isMenuOpen = false;
  @State() isTouchDevice: boolean = KritzelDevicesHelper.isTouchDevice();
  @State() anchorElement: HTMLElement;
  @State() splitMenuButton: HTMLButtonElement;

  @Method()
  async open() {
    if (this.isMenuOpen) return;
    this.openMenu(new MouseEvent('click'));
  }

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

  private toggleMenu = (event: MouseEvent) => {
    event.stopPropagation();
    if (this.isMenuOpen) {
      this.closeMenu();
    } else {
      this.openMenu(event);
    }
  };

  private handleButtonClick = (event: MouseEvent) => {
    event.stopPropagation();
    this.buttonClick.emit();
  };

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
          <kritzel-menu
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
