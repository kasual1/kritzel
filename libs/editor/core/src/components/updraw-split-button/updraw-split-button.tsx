import { Component, h, Prop, State, Event, EventEmitter, Host, Element, Method } from '@stencil/core';
import { UpdrawDevicesHelper } from '@updraw/core';
import { IUpdrawMenuItem, IUpdrawMenuItemSelectEvent, IUpdrawMenuItemToggleChildMenuEvent } from '@updraw/core';

@Component({
  tag: 'updraw-split-button',
  styleUrl: 'updraw-split-button.css',
  shadow: true,
})
export class UpdrawSplitButton {
  @Element() host!: HTMLElement;

  @Prop() buttonIcon: string = 'plus';
  @Prop() dropdownIcon: string = 'chevronDown';
  @Prop() items: IUpdrawMenuItem[] = [];
  @Prop() mainButtonDisabled = false;
  @Prop() menuButtonDisabled = false;

  @Event() mainButtonClick: EventEmitter<void>;
  @Event() itemSelect: EventEmitter<IUpdrawMenuItemSelectEvent>;
  @Event() itemSave: EventEmitter<IUpdrawMenuItem>;
  @Event() itemCancel: EventEmitter<IUpdrawMenuItem>;
  @Event() itemToggleChildMenu: EventEmitter<IUpdrawMenuItemToggleChildMenuEvent>;
  @Event() itemCloseChildMenu: EventEmitter<IUpdrawMenuItem>;
  @Event() menuOpen: EventEmitter<void>;
  @Event() menuClose: EventEmitter<void>;

  @State() isMenuOpen = false;
  @State() isTouchDevice: boolean = UpdrawDevicesHelper.isTouchDevice();
  @State() anchorElement: HTMLElement;
  @State() menuScrollTop: number = 0;

  splitMenuButtonRef: HTMLButtonElement;
  menuRef: HTMLUpdrawMenuElement;

  @Method()
  async open() {
    if (this.isMenuOpen) return;
    window.dispatchEvent(new CustomEvent('updraw-dismiss-menus'));
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
    window.dispatchEvent(new CustomEvent('updraw-dismiss-menus'));
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
          {this.buttonIcon && <updraw-icon name={this.buttonIcon}></updraw-icon>}
        </button>

        <div class="split-divider"></div>

        <button ref={el => (this.splitMenuButtonRef = el)} class="split-menu-button" tabIndex={0} onClick={this.toggleMenu} disabled={this.menuButtonDisabled} aria-label="Open menu">
          <updraw-icon name={this.dropdownIcon}></updraw-icon>
        </button>

        <updraw-portal anchor={this.anchorElement} offsetY={4} onClose={this.closeMenu}>
          <updraw-menu
            ref={el => (this.menuRef = el)}
            items={this.items}
            onItemSelect={this.handleItemSelect}
            onItemSave={this.handleItemSave}
            onItemCancel={this.handleItemCancel}
            onItemToggleChildMenu={this.handleItemToggleChildMenu}
            onItemCloseChildMenu={this.handleItemCloseChildMenu}
            onClose={this.closeMenu}
            onScroll={this.handleScroll}
          ></updraw-menu>
        </updraw-portal>
      </Host>
    );
  }
}
