import { Component, h, Prop, State, Event, EventEmitter, Host, Element } from '@stencil/core';
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
  disabled = false;

  @Event()
  buttonClick: EventEmitter<void>;

  @Event()
  optionSelect: EventEmitter<KritzelMenuItem>;

  @Event()
  menuOpened: EventEmitter<void>;

  @Event()
  menuClosed: EventEmitter<void>;

  @Element()
  host!: HTMLElement;

  @State()
  isMenuOpen = false;

  @State()
  isTouchDevice: boolean = KritzelDevicesHelper.isTouchDevice();

  @State()
  anchorElement: HTMLElement;

  splitMenuButton: HTMLButtonElement;

  componentWillLoad() {
    this.isMenuOpen = true;
    this.anchorElement = this.host;
  }

  private openMenu = (event: MouseEvent) => {
    event.stopPropagation();
    this.isMenuOpen = true;
    this.anchorElement = this.host;
  }

  private closeMenu = () => {
    this.isMenuOpen = false;
    this.anchorElement = null;
  }

  private toggleMenu = (event: MouseEvent) => {
    event.stopPropagation();
    if (this.isMenuOpen) {
      this.closeMenu();
    } else {
      this.openMenu(event);
    }
  };

  render() {
    return (
      <Host tabIndex={0} class={{ mobile: this.isTouchDevice }}>
        <button class="split-main-button" tabIndex={0} onClick={this.openMenu} disabled={this.disabled}>
          {this.buttonIcon && <kritzel-icon name={this.buttonIcon}></kritzel-icon>}
        </button>

        <div class="split-divider"></div>

        <button ref={el => (this.splitMenuButton = el)} class="split-menu-button" tabIndex={0} onClick={this.toggleMenu} disabled={this.disabled}>
          <kritzel-icon name={this.dropdownIcon}></kritzel-icon>
        </button>

        <kritzel-portal anchor={this.anchorElement} offsetY={4}>
          <kritzel-menu-new items={this.items} onClose={this.closeMenu}></kritzel-menu-new>
        </kritzel-portal>
      </Host>
    );
  }
}
