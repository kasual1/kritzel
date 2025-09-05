import { Component, h, Prop, State, Event, EventEmitter, Listen, Host } from '@stencil/core';

export interface SplitButtonOption<T = any> {
  value: T;
  label: string;
  suffix?: () => JSX.Element;
}

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
  options: SplitButtonOption[] = [];

  @Prop()
  disabled = false;

  @State()
  isMenuOpen = true;

  @Event()
  buttonClick: EventEmitter<void>;

  @Event()
  optionSelect: EventEmitter<SplitButtonOption>;

  private buttonRef: HTMLElement;

  @Listen('click', { target: 'document' })
  handleDocumentClick(event: MouseEvent) {
    if (this.isMenuOpen && !this.buttonRef.contains(event.target as Node)) {
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

  private handleOptionClick = (option: SplitButtonOption) => {
    this.optionSelect.emit(option);
    this.isMenuOpen = false;
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
          <div class="split-menu">
            {this.options.map(option => (
              <div class="split-menu-item" onClick={() => this.handleOptionClick(option)}>
                <span>{option.label}</span>
                {option.suffix && option?.suffix()}
              </div>
            ))}
          </div>
        )}
      </Host>
    );
  }
}
