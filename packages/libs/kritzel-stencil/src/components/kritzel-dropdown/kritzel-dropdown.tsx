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
  @Prop() options: DropdownOption[] = [];
  @Prop() value: string;
  @Prop() width?: string;
  @Prop() selectStyles?: any = {}; // Styles for the select element itself

  @State() internalValue: string;

  @Event() valueChanged: EventEmitter<string>;

  componentWillLoad() {
    this.updateInternalValue(this.value, false);
  }

  @Watch('value')
  externalValueChanged(newValue: string) {
    if (newValue !== this.internalValue) {
      this.updateInternalValue(newValue, false);
    }
  }
  
  @Watch('options')
  optionsChanged() {
    // Re-validate internalValue if options change
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
      finalValue = undefined; // No options, no value
    }

    if (this.internalValue !== finalValue) {
      this.internalValue = finalValue;
      if (emitChange || (proposedValue !== finalValue && proposedValue !== undefined)) { // Emit if defaulted or explicitly told to
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

  render() {
    const hostStyles = {};
    if (this.width) {
      // Apply width to host if you want the component itself to have the width
      // hostStyles['width'] = this.width; 
      // Or apply to select element directly as done below
    }

    return (
      <Host style={hostStyles}>
        <select
          class="custom-select"
          style={{ ...this.selectStyles, width: this.width }}
          onInput={this.handleSelectChange}
        >
          {this.options.map(option => (
            <option
              value={option.value}
              style={option.style}
              selected={option.value === this.internalValue} // Explicitly set selected
            >
              {option.label}
            </option>
          ))}
        </select>
      </Host>
    );
  }
}
