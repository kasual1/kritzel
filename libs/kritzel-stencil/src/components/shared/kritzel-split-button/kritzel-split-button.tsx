import { Component, h, Prop, State, Event, EventEmitter, Listen } from '@stencil/core';

export interface SplitButtonOption<T = any> {
  value: T;
  label: string;
  icon?: string;
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
    debugger;
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
      <div class="split-button-container" ref={el => (this.buttonRef = el)}>
        <button class="main-button" onClick={this.handleButtonClick} disabled={this.disabled}>
          {this.buttonIcon && <kritzel-icon name={this.buttonIcon}></kritzel-icon>}
          {this.buttonText && <span>{this.buttonText} ({this.options.length})</span>}
        </button>
        <button class="dropdown-button" onClick={this.toggleMenu} disabled={this.disabled}>
          <kritzel-icon name={this.dropdownIcon}></kritzel-icon>
        </button>
        {this.isMenuOpen && (
          <div class="dropdown-menu">
            {this.options.map(option => (
              <div class="dropdown-item" onClick={() => this.handleOptionClick(option)}>
                {option.icon && <kritzel-icon name={option.icon}></kritzel-icon>}
                <span>{option.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}
