import { Component, Host, h, Prop, State } from '@stencil/core';

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
  @Prop() fontOptions: FontOption[] = [
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

  @State() currentFontFamily: string;

  componentWillLoad() {
    if (this.fontOptions && this.fontOptions.length > 0) {
      const isValidCurrentFont = this.fontOptions.some(opt => opt.value === this.currentFontFamily);
      if (!this.currentFontFamily || !isValidCurrentFont) {
        this.currentFontFamily = this.fontOptions[0].value;
      }
    }
  }

  private handleDropdownValueChange = (event: CustomEvent<string>) => {
    this.currentFontFamily = event.detail;
  };

  render() {
    const dropdownOptions = this.fontOptions.map(option => ({
      value: option.value,
      label: option.label,
      style: { fontFamily: option.value },
    }));

    return (
      <Host>
        <div class="control-group">
          <kritzel-dropdown
            options={dropdownOptions}
            value={this.currentFontFamily}
            onValueChanged={this.handleDropdownValueChange}
            selectStyles={{ fontFamily: this.currentFontFamily }}
            width="172px"
          >
          </kritzel-dropdown>
          <button class="font-style-button">B</button>
          <button class="font-style-button italic-text">I</button>
        </div>
      </Host>
    );
  }
}
