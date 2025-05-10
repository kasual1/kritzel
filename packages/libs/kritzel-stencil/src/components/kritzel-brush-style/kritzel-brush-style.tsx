import { Component, Host, h, Prop, State } from '@stencil/core';
import { DropdownOption } from '../kritzel-dropdown/kritzel-dropdown'; // Import DropdownOption

export interface BrushStyleOption extends DropdownOption {}

@Component({
  tag: 'kritzel-brush-style',
  styleUrl: 'kritzel-brush-style.css',
  shadow: true,
})
export class KritzelBrushStyle {
  @Prop() brushOptions: BrushStyleOption[] = [
    { value: 'pen', label: 'Pen' },
    { value: 'highlighter', label: 'Highlighter' },
  ];

  @State() currentBrushStyle: string;

  componentWillLoad() {
    if (this.brushOptions && this.brushOptions.length > 0) {
      const isValidCurrentBrushStyle = this.brushOptions.some(opt => opt.value === this.currentBrushStyle);
      if (!this.currentBrushStyle || !isValidCurrentBrushStyle) {
        this.currentBrushStyle = this.brushOptions[0].value;
      }
    }
  }

  private handleDropdownValueChange = (event: CustomEvent<string>) => {
    this.currentBrushStyle = event.detail;
  };

  render() {
    const dropdownOptions: DropdownOption[] = this.brushOptions.map(option => ({
      value: option.value,
      label: option.label,
    }));

    return (
      <Host>
        <kritzel-dropdown options={dropdownOptions} value={this.currentBrushStyle} onValueChanged={this.handleDropdownValueChange} width="172px">
          <button class="brush-style-button" slot="prefix">
            <kritzel-icon name={this.currentBrushStyle} size={16} ></kritzel-icon>
          </button>
        </kritzel-dropdown>
      </Host>
    );
  }
}
