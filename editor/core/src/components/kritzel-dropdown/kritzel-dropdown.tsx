import { Component, Host, h, Prop, State, Event, EventEmitter, Watch, Element, Listen } from '@stencil/core';

export interface DropdownOption {
  value: string;
  label: string;
  style?: Record<string, string>; // For individual option styling, e.g., font family
}

@Component({
  tag: 'kritzel-dropdown',
  styleUrl: 'kritzel-dropdown.css',
  shadow: true,
})
export class KritzelDropdown {
  @Element() el: HTMLElement;

  @Prop() options: DropdownOption[] = [];
  @Watch('options')
  optionsChanged() {
    this.updateInternalValue(this.internalValue, true);
  }

  @Prop() value: string;
  @Watch('value')
  externalValueChanged(newValue: string) {
    if (newValue !== this.internalValue) {
      this.updateInternalValue(newValue, false);
    }
  }

  @Prop() width?: string;
  @Prop() selectStyles?: Record<string, string> = {};
  /** Force the dropdown to open in a specific direction instead of auto-detecting */
  @Prop() forceOpenDirection?: 'down' | 'up';

  @State() internalValue: string;
  @State() hasSuffixContent = false;
  @State() hasPrefixContent = false;
  @State() isOpen = false;
  @State() focusedIndex = -1;
  @State() openDirection: 'down' | 'up' = 'down';

  @Event() valueChanged: EventEmitter<string>;

  private suffixSlotElement?: HTMLSlotElement;
  private prefixSlotElement?: HTMLSlotElement;
  private triggerElement?: HTMLButtonElement;
  private menuElement?: HTMLUListElement;
  private wrapperElement?: HTMLDivElement;

  componentWillLoad() {
    this.updateInternalValue(this.value, false);
    this.evaluateSuffixContent();
    this.evaluatePrefixContent();
  }

  disconnectedCallback() {
    // Close menu when component is removed from DOM to prevent orphaned open dropdowns
    if (this.isOpen) {
      this.isOpen = false;
    }
  }

  @Listen('click', { target: 'document' })
  handleDocumentClick(event: MouseEvent) {
    if (this.isOpen && !this.el.contains(event.target as Node)) {
      this.closeMenu();
    }
  }

  @Listen('keydown', { target: 'document' })
  handleDocumentKeydown(event: KeyboardEvent) {
    if (this.isOpen && event.key === 'Escape') {
      event.stopPropagation();
      event.preventDefault();
      this.closeMenu();
      this.triggerElement?.focus();
    }
  }

  private updateInternalValue(proposedValue: string, emitChange: boolean) {
    let finalValue = proposedValue;
    
    // Only fall back to an option if the proposed value is completely missing.
    // We intentionally don't sanitize invalid values here, to allow for values 
    // that might be added to options asynchronously later (preventing race conditions).
    if (!finalValue && this.options && this.options.length > 0) {
      finalValue = this.options[0].value;
    } else if (!finalValue) {
      finalValue = undefined;
    }

    if (this.internalValue !== finalValue) {
      this.internalValue = finalValue;
      if (emitChange || (proposedValue !== finalValue && proposedValue !== undefined)) {
        this.valueChanged.emit(this.internalValue);
      }
    }
  }

  private toggleMenu = () => {
    if (this.isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  };

  private openMenu = () => {
    this.calculateMenuDirection();
    this.isOpen = true;
    const currentIndex = this.options.findIndex(opt => opt.value === this.internalValue);
    this.focusedIndex = currentIndex >= 0 ? currentIndex : 0;
    // Focus the menu after it opens
    requestAnimationFrame(() => {
      this.menuElement?.focus();
    });
  };

  private calculateMenuDirection = () => {
    if (this.forceOpenDirection) {
      this.openDirection = this.forceOpenDirection;
      return;
    }

    if (!this.wrapperElement) {
      this.openDirection = 'down';
      return;
    }

    const wrapperRect = this.wrapperElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - wrapperRect.bottom;
    const spaceAbove = wrapperRect.top;

    // Estimate menu height (max 240px or fewer based on options)
    const estimatedOptionHeight = 36; // padding + content
    const menuPadding = 8; // 4px top + 4px bottom
    const estimatedMenuHeight = Math.min(
      240,
      this.options.length * estimatedOptionHeight + menuPadding
    );

    // Prefer opening downward, but switch to upward if not enough space below
    // and there's more space above
    if (spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow) {
      this.openDirection = 'up';
    } else {
      this.openDirection = 'down';
    }
  };

  private closeMenu = () => {
    this.isOpen = false;
    this.focusedIndex = -1;
    // Note: openDirection is intentionally NOT reset here to allow the close animation
    // to play in the same direction the menu was opened
  };

  private selectOption = (option: DropdownOption) => {
    if (this.internalValue !== option.value) {
      this.internalValue = option.value;
      this.valueChanged.emit(this.internalValue);
    }
    this.closeMenu();
    this.triggerElement?.focus();
  };

  private handleTriggerKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        this.openMenu();
        break;
    }
  };

  private handleMenuKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusedIndex = Math.min(this.focusedIndex + 1, this.options.length - 1);
        this.scrollFocusedOptionIntoView();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusedIndex = Math.max(this.focusedIndex - 1, 0);
        this.scrollFocusedOptionIntoView();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.focusedIndex >= 0 && this.focusedIndex < this.options.length) {
          this.selectOption(this.options[this.focusedIndex]);
        }
        break;
      case 'Home':
        event.preventDefault();
        this.focusedIndex = 0;
        this.scrollFocusedOptionIntoView();
        break;
      case 'End':
        event.preventDefault();
        this.focusedIndex = this.options.length - 1;
        this.scrollFocusedOptionIntoView();
        break;
      case 'Tab':
        this.closeMenu();
        break;
    }
  };

  private scrollFocusedOptionIntoView = () => {
    if (!this.menuElement || this.focusedIndex < 0) {
      return;
    }
    // Use requestAnimationFrame to ensure the DOM has updated with the new focused class
    requestAnimationFrame(() => {
      const focusedOption = this.menuElement?.querySelector('.dropdown-option.is-focused') as HTMLElement;
      if (focusedOption) {
        focusedOption.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  };

  private handleOptionMouseEnter = (index: number) => {
    this.focusedIndex = index;
  };

  private evaluateSuffixContent = () => {
    if (this.suffixSlotElement) {
      const newHasContent = this.suffixSlotElement.assignedNodes({ flatten: true }).length > 0;
      if (this.hasSuffixContent !== newHasContent) {
        this.hasSuffixContent = newHasContent;
      }
    } else if (this.hasSuffixContent !== false) {
      this.hasSuffixContent = false;
    }
  };

  private evaluatePrefixContent = () => {
    if (this.prefixSlotElement) {
      const newHasContent = this.prefixSlotElement.assignedNodes({ flatten: true }).length > 0;
      if (this.hasPrefixContent !== newHasContent) {
        this.hasPrefixContent = newHasContent;
      }
    } else if (this.hasPrefixContent !== false) {
      this.hasPrefixContent = false;
    }
  };

  private getSelectedLabel(): string {
    const selectedOption = this.options.find(opt => opt.value === this.internalValue);
    return selectedOption?.label ?? '';
  }

  private getSelectedStyle(): Record<string, string> | undefined {
    const selectedOption = this.options.find(opt => opt.value === this.internalValue);
    return selectedOption?.style;
  }

  render() {
    const triggerClasses = {
      'dropdown-trigger': true,
      'has-suffix-border': this.hasSuffixContent,
      'has-prefix-border': this.hasPrefixContent,
      'is-open': this.isOpen,
      'open-up': this.openDirection === 'up',
    };

    const menuClasses = {
      'dropdown-menu': true,
      'is-open': this.isOpen,
      'open-up': this.openDirection === 'up',
      'open-down': this.openDirection === 'down',
    };

    return (
      <Host>
        <div class="dropdown-wrapper" ref={el => (this.wrapperElement = el)}>
          <slot name="prefix" ref={el => (this.prefixSlotElement = el as HTMLSlotElement)} onSlotchange={this.evaluatePrefixContent}></slot>
          <div class="dropdown-container" style={{ width: this.width }}>
            <button
              type="button"
              class={triggerClasses}
              style={{ ...this.selectStyles, ...this.getSelectedStyle() }}
              onClick={this.toggleMenu}
              onKeyDown={this.handleTriggerKeyDown}
              aria-haspopup="listbox"
              aria-expanded={this.isOpen ? 'true' : 'false'}
              ref={el => (this.triggerElement = el)}
            >
              <span class="dropdown-trigger-label">{this.getSelectedLabel()}</span>
              <span class="dropdown-trigger-arrow" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </button>
          </div>
          <slot name="suffix" ref={el => (this.suffixSlotElement = el as HTMLSlotElement)} onSlotchange={this.evaluateSuffixContent}></slot>
          <ul
            class={menuClasses}
            role="listbox"
            tabindex="-1"
            onKeyDown={this.handleMenuKeyDown}
            ref={el => (this.menuElement = el)}
          >
            {this.options.map((option, index) => {
              const isSelected = option.value === this.internalValue;
              const isFocused = index === this.focusedIndex;
              const optionClasses = {
                'dropdown-option': true,
                'is-selected': isSelected,
                'is-focused': isFocused,
              };
              return (
                <li
                  class={optionClasses}
                  role="option"
                  aria-selected={isSelected ? 'true' : 'false'}
                  style={option.style}
                  onClick={() => this.selectOption(option)}
                  onMouseEnter={() => this.handleOptionMouseEnter(index)}
                >
                  {option.label}
                  {isSelected && (
                    <span class="dropdown-option-check" aria-hidden="true">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </Host>
    );
  }
}
