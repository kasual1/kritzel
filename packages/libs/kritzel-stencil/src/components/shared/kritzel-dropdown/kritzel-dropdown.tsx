import { Component, Host, h, Prop, State, Event, EventEmitter, Watch } from '@stencil/core';

export interface DropdownOption {
  value: string;
  label: string;
  style?: any; // For individual option styling, e.g., font family
}

@Component({
  tag: 'kritzel-dropdown',
  styleUrl: 'kritzel-dropdown.css',
  shadow: true,
})
export class KritzelDropdown {
  @Prop() 
  options: DropdownOption[] = [];
  
  @Prop() 
  value: string;
  
  @Prop() 
  width?: string;
  
  @Prop() 
  selectStyles?: any = {}; 

  @State() 
  internalValue: string;

  @State() 
  hasSuffixContent: boolean = false;

  @State()
  hasPrefixContent: boolean = false;

  @Event() 
  valueChanged: EventEmitter<string>;

  private suffixSlotElement?: HTMLSlotElement;
  private prefixSlotElement?: HTMLSlotElement;

  componentWillLoad() {
    this.updateInternalValue(this.value, false);
    this.evaluateSuffixContent();
    this.evaluatePrefixContent();
  }

  @Watch('value')
  externalValueChanged(newValue: string) {
    if (newValue !== this.internalValue) {
      this.updateInternalValue(newValue, false);
    }
  }
  
  @Watch('options')
  optionsChanged() {
    this.updateInternalValue(this.internalValue, true);
  }

  private updateInternalValue(proposedValue: string, emitChange: boolean) {
    let finalValue = proposedValue;
    if (this.options && this.options.length > 0) {
      const isValidValue = this.options.some(opt => opt.value === finalValue);
      if (!finalValue || !isValidValue) {
        finalValue = this.options[0].value;
      }
    } else {
      finalValue = undefined;
    }

    if (this.internalValue !== finalValue) {
      this.internalValue = finalValue;
      if (emitChange || (proposedValue !== finalValue && proposedValue !== undefined)) {
        this.valueChanged.emit(this.internalValue);
      }
    }
  }

  private handleSelectChange = (event: Event) => {
    const newValue = (event.target as HTMLSelectElement).value;
    if (this.internalValue !== newValue) {
      this.internalValue = newValue;
      this.valueChanged.emit(this.internalValue);
    }
  };

  private evaluateSuffixContent = () => {
    if (this.suffixSlotElement) {
      const newHasContent = this.suffixSlotElement.assignedNodes({ flatten: true }).length > 0;
      if (this.hasSuffixContent !== newHasContent) {
        this.hasSuffixContent = newHasContent;
      }
    } else {
      if (this.hasSuffixContent !== false) {
        this.hasSuffixContent = false;
      }
    }
  }

  private evaluatePrefixContent = () => {
    if (this.prefixSlotElement) {
      const newHasContent = this.prefixSlotElement.assignedNodes({ flatten: true }).length > 0;
      if (this.hasPrefixContent !== newHasContent) {
        this.hasPrefixContent = newHasContent;
      }
    } else {
      if (this.hasPrefixContent !== false) {
        this.hasPrefixContent = false;
      }
    }
  }

  render() {
    const selectClasses = {
      'custom-select': true,
      'has-suffix-border': this.hasSuffixContent,
      'has-prefix-border': this.hasPrefixContent,
    };

    return (
      <Host>
        <div class="dropdown-wrapper">
          <slot
            name="prefix"
            ref={el => this.prefixSlotElement = el as HTMLSlotElement}
            onSlotchange={this.evaluatePrefixContent}
          ></slot>
          <select
            class={selectClasses}
            style={{ ...this.selectStyles, width: this.width }}
            onInput={this.handleSelectChange}
          >
            {this.options.map(option => (
              <option
                value={option.value}
                style={option.style}
                selected={option.value === this.internalValue}
              >
                {option.label}
              </option>
            ))}
          </select>
          <slot 
            name="suffix"
            ref={el => this.suffixSlotElement = el as HTMLSlotElement}
            onSlotchange={this.evaluateSuffixContent}
          ></slot>
        </div>
      </Host>
    );
  }
}
