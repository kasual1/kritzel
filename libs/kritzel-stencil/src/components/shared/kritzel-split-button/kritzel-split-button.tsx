import { Component, h, Prop, State, Event, EventEmitter, Listen, Host, Element } from '@stencil/core';
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

  private handleButtonClick = () => {
    if (!this.disabled) {
      this.buttonClick.emit();
    }
  };

  private toggleMenu = () => {
    if (!this.disabled) {
      this.isMenuOpen = !this.isMenuOpen;
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

        {this.isMenuOpen && <kritzel-menu items={this.options} editingIndex={this.editingIndex}></kritzel-menu>}
      </Host>
    );
  }
}
