import { Component, Host, h, Prop, Event, EventEmitter } from '@stencil/core';

export interface FontOption {
  value: string;
  label: string;
}

@Component({
  tag: 'kritzel-font-family',
  styleUrl: 'kritzel-font-family.css',
  shadow: true,
})
export class KritzelFontFamily {
  @Prop() 
  fontOptions: FontOption[] = [
    { value: 'arial', label: 'Arial' },
    { value: 'verdana', label: 'Verdana' },
    { value: 'helvetica', label: 'Helvetica' },
    { value: 'tahoma', label: 'Tahoma' },
    { value: 'trebuchet ms', label: 'Trebuchet MS' },
    { value: 'times new roman', label: 'Times New Roman' },
    { value: 'georgia', label: 'Georgia' },
    { value: 'garamond', label: 'Garamond' },
    { value: 'courier new', label: 'Courier New' },
    { value: 'brush script mt', label: 'Brush Script MT' },
  ];

  @Prop() 
  selectedFontFamily: string;

  @Event()
  fontFamilyChange: EventEmitter<string>;

  componentWillLoad() {
    if (this.fontOptions && this.fontOptions.length > 0) {
      const isValidCurrentFont = this.fontOptions.some(opt => opt.value === this.selectedFontFamily);
      if (!this.selectedFontFamily || !isValidCurrentFont) {
        this.selectedFontFamily = this.fontOptions[0].value;
      }
    }
  }

  private handleDropdownValueChange = (event: CustomEvent<string>) => {
    this.fontFamilyChange.emit(event.detail);
  };

  render() {
    const dropdownOptions = this.fontOptions.map(option => ({
      value: option.value,
      label: option.label,
      style: { fontFamily: option.value },
    }));

    return (
      <Host>
        <kritzel-dropdown
          options={dropdownOptions}
          value={this.selectedFontFamily}
          onValueChanged={this.handleDropdownValueChange}
          selectStyles={{ fontFamily: this.selectedFontFamily }}
        >
          <button class="font-style-button" slot="suffix">B</button>
          <button class="font-style-button italic-text" slot="suffix">I</button>
        </kritzel-dropdown>
      </Host>
    );
  }
}
