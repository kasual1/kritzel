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

  @Prop()
  editingIndex: number | null = null;

  @State()
  isMenuOpen = true;

  @Event()
  buttonClick: EventEmitter<void>;

  @Event()
  optionSelect: EventEmitter<MenuItem>;

  @Element()
  private element: HTMLElement;

  @Listen('click', { target: 'document' })
  handleDocumentClick(event: MouseEvent) {
    if (this.isMenuOpen && !this.element.contains(event.target as Node)) {
      this.isMenuOpen = false;
    }
  }

  @Method()
  async openMenu() {
    if (!this.disabled) {
      this.isMenuOpen = true;
    }
  }

  @Method()
  async closeMenu() {
    if (!this.disabled) {
      this.isMenuOpen = false;
    }
  }

  @Method()
  async toggleMenu() {
    if (!this.disabled) {
      this.isMenuOpen = !this.isMenuOpen;
    }
  }

  @Method()
  async setEditingIndex(index: number | null) {
    this.editingIndex = index;
  }

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

        <button class="split-menu-button" onClick={() => this.toggleMenu()} disabled={this.disabled}>
          <kritzel-icon name={this.dropdownIcon}></kritzel-icon>
        </button>

        {this.isMenuOpen && <kritzel-menu items={this.options} activeItemIndex={this.activeItemIndex} editingIndex={this.editingIndex}></kritzel-menu>}
      </Host>
    );
  }
}
