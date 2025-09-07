import { Component, h, Prop, State, Event, EventEmitter, Listen, Host, Element, Method } from '@stencil/core';
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

  @Prop({ mutable: true })
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

  menuRef!: HTMLKritzelMenuElement;

  @Listen('click', { target: 'document' })
  handleDocumentClick(event: MouseEvent) {
    const path = (event.composedPath && event.composedPath()) || [];
    const containsKritzelSplitButton = path.some(node => (node as HTMLElement)?.tagName === 'KRITZEL-SPLIT-BUTTON');
    const containsKritzelMenu = path.some(node => (node as HTMLElement)?.tagName === 'KRITZEL-MENU');

    if (!containsKritzelMenu && !containsKritzelSplitButton) {
      this.isMenuOpen = false;
      this.menuClosed.emit();
    }
  }

  @Method()
  async openMenu() {
    if (!this.disabled) {
      this.isMenuOpen = true;
      this.menuOpened.emit();
    }
  }

  @Method()
  async closeMenu() {
    if (!this.disabled) {
      this.isMenuOpen = false;
      this.menuClosed.emit();
    }
  }

  @Method()
  async setEditingIndex(index: number | null) {
    this.editingIndex = index;
  }

  private toggleMenu = () => {
    if (!this.disabled) {
      this.isMenuOpen = !this.isMenuOpen;
      if (this.isMenuOpen) {
        this.menuOpened.emit();
      } else {
        this.menuClosed.emit();
      }
    }
  };

  private handleButtonClick = () => {
    if (!this.disabled) {
      this.buttonClick.emit();
    }
  };

  render() {
    return (
      <Host>
        <button class="split-main-button" onClick={this.handleButtonClick} disabled={this.disabled}>
          {this.buttonIcon && <kritzel-icon name={this.buttonIcon}></kritzel-icon>}
          {this.buttonText && (
            <span>
              {this.buttonText} ({this.options.length})
            </span>
          )}
        </button>

        <button class="split-menu-button" onClick={this.toggleMenu} disabled={this.disabled}>
          <kritzel-icon name={this.dropdownIcon}></kritzel-icon>
        </button>

        {this.isMenuOpen && (
          <kritzel-menu ref={el => (this.menuRef = el)} items={this.options} activeItemIndex={this.activeItemIndex} editingIndex={this.editingIndex}></kritzel-menu>
        )}
      </Host>
    );
  }
}
