import { Component, h, Prop, State, Event, EventEmitter, Host, Element, Method } from '@stencil/core';
import { MenuItem } from '../kritzel-menu/kritzel-menu';

@Component({
  tag: 'kritzel-split-button',
  styleUrl: 'kritzel-split-button.css',
  shadow: true,
})
export class KritzelSplitButton {
  @Prop()
  buttonText: string;

  @Prop()
  buttonIcon: string;

  @Prop()
  dropdownIcon = 'chevron-down';

  @Prop()
  options: MenuItem[] = [];

  @Prop()
  disabled = false;

  @Prop()
  activeItemIndex: number | null = null;

  @Prop()
  editingIndex: number | null = null;

  @State()
  isMenuOpen = false;

  @Event()
  buttonClick: EventEmitter<void>;

  @Event()
  optionSelect: EventEmitter<MenuItem>;

  @Event()
  menuOpened: EventEmitter<void>;

  @Event()
  menuClosed: EventEmitter<void>;

  @Element()
  host!: HTMLElement;

  splitMenuButton: HTMLButtonElement;

  @Method()
  async openMenu() {
    if (this.disabled || this.isMenuOpen) return;

    this.isMenuOpen = true;
    this.menuOpened.emit();
    document.addEventListener('click', this.handleDocumentClick, { once: true });
  }

  @Method()
  async closeMenu() {
    if (this.disabled || !this.isMenuOpen) return;

    this.isMenuOpen = false;
    this.menuClosed.emit();

    this.host.focus();
  }

  private handleDocumentClick = (event: MouseEvent) => {
    const path = (event.composedPath && event.composedPath()) || [];
    const clickedInside = path.some(node => (node as HTMLElement)?.tagName === 'KRITZEL-SPLIT-BUTTON' || (node as HTMLElement)?.tagName === 'KRITZEL-MENU');

    if (!clickedInside) {
      this.closeMenu();
    } else if (this.isMenuOpen) {
      document.addEventListener('click', this.handleDocumentClick, { once: true });
    }
  };

  private toggleMenu = () => {
    if (this.isMenuOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  };

  private handleButtonClick = () => {
    if (!this.disabled) {
      this.buttonClick.emit();
    }
  };

  render() {
    return (
      <Host tabIndex={0}>
        <button class="split-main-button" tabIndex={0} onClick={this.handleButtonClick} disabled={this.disabled}>
          {this.buttonIcon && <kritzel-icon name={this.buttonIcon}></kritzel-icon>}
          {this.buttonText && (
            <span>
              {this.buttonText} ({this.options.length})
            </span>
          )}
        </button>

        <div class="split-divider"></div>

        <button ref={el => (this.splitMenuButton = el)} class="split-menu-button" tabIndex={0} onClick={this.toggleMenu} disabled={this.disabled}>
          <kritzel-icon name={this.dropdownIcon}></kritzel-icon>
        </button>

        <kritzel-portal anchor={this.host} offsetY={4}>
          {this.isMenuOpen && (
            <kritzel-menu
              style={{ maxHeight: '300px', width: '180px' }}
              items={this.options}
              activeItemIndex={this.activeItemIndex}
              editingIndex={this.editingIndex}
              onClose={() => this.closeMenu()}
            ></kritzel-menu>
          )}
        </kritzel-portal>
      </Host>
    );
  }
}
