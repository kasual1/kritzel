import { Component, h, Prop, State, Event, EventEmitter, Host, Element, Method } from '@stencil/core';
import { UpmadeDevicesHelper } from '@upmade/core';
import { IUpmadeMenuItem, IUpmadeMenuItemSelectEvent, IUpmadeMenuItemToggleChildMenuEvent } from '@upmade/core';

@Component({
  tag: 'upmade-split-button',
  styleUrl: 'upmade-split-button.css',
  shadow: true,
})
export class UpmadeSplitButton {
  @Element() host!: HTMLElement;

  @Prop() buttonIcon: string = 'plus';
  @Prop() dropdownIcon: string = 'chevronDown';
  @Prop() items: IUpmadeMenuItem[] = [];
  @Prop() mainButtonDisabled = false;
  @Prop() menuButtonDisabled = false;

  @Event() mainButtonClick: EventEmitter<void>;
  @Event() itemSelect: EventEmitter<IUpmadeMenuItemSelectEvent>;
  @Event() itemSave: EventEmitter<IUpmadeMenuItem>;
  @Event() itemCancel: EventEmitter<IUpmadeMenuItem>;
  @Event() itemToggleChildMenu: EventEmitter<IUpmadeMenuItemToggleChildMenuEvent>;
  @Event() itemCloseChildMenu: EventEmitter<IUpmadeMenuItem>;
  @Event() menuOpen: EventEmitter<void>;
  @Event() menuClose: EventEmitter<void>;

  @State() isMenuOpen = false;
  @State() isTouchDevice: boolean = UpmadeDevicesHelper.isTouchDevice();
  @State() anchorElement: HTMLElement;
  @State() menuScrollTop: number = 0;

  splitMenuButtonRef: HTMLButtonElement;
  menuRef: HTMLUpmadeMenuElement;

  @Method()
  async open() {
    if (this.isMenuOpen) return;
    window.dispatchEvent(new CustomEvent('upmade-dismiss-menus'));
    this.isMenuOpen = true;
    this.anchorElement = this.host;
    this.menuOpen.emit();
  }

  @Method()
  async close(): Promise<void> {
    this.closeMenu();
  }

  @Method()
  async focusMenu() {
    if (this.menuRef) {
      await this.menuRef.setFocus();
    }
  }

  private handleButtonClick = (event: MouseEvent) => {
    event.stopPropagation();
    this.mainButtonClick.emit();
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
    window.dispatchEvent(new CustomEvent('upmade-dismiss-menus'));
    this.isMenuOpen = true;
    this.anchorElement = this.host;
    this.menuOpen.emit();

    requestAnimationFrame(() => {
      this.menuRef?.setScrollTop(this.menuScrollTop);
    });
  };

  private closeMenu = () => {
    this.isMenuOpen = false;
    this.anchorElement = null;
    this.splitMenuButtonRef?.blur();
    this.menuClose.emit();
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

  private handleScroll = event => {
    this.menuScrollTop = (event.target as HTMLElement).scrollTop;
  }

  render() {
    return (
      <Host class={{ mobile: this.isTouchDevice }}>
        <button class="split-main-button" tabIndex={0} onClick={this.handleButtonClick} disabled={this.mainButtonDisabled} aria-label="Main action">
          {this.buttonIcon && <upmade-icon name={this.buttonIcon}></upmade-icon>}
        </button>

        <div class="split-divider"></div>

        <button ref={el => (this.splitMenuButtonRef = el)} class="split-menu-button" tabIndex={0} onClick={this.toggleMenu} disabled={this.menuButtonDisabled} aria-label="Open menu">
          <upmade-icon name={this.dropdownIcon}></upmade-icon>
        </button>

        <upmade-portal anchor={this.anchorElement} offsetY={4} onClose={this.closeMenu}>
          <upmade-menu
            ref={el => (this.menuRef = el)}
            items={this.items}
            onItemSelect={this.handleItemSelect}
            onItemSave={this.handleItemSave}
            onItemCancel={this.handleItemCancel}
            onItemToggleChildMenu={this.handleItemToggleChildMenu}
            onItemCloseChildMenu={this.handleItemCloseChildMenu}
            onClose={this.closeMenu}
            onScroll={this.handleScroll}
          ></upmade-menu>
        </upmade-portal>
      </Host>
    );
  }
}
