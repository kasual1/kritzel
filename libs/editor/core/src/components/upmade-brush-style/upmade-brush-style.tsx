import { Component, Host, h, Prop, EventEmitter, Event } from '@stencil/core';
import { DropdownOption } from '../upmade-dropdown/upmade-dropdown'; // Import DropdownOption

export interface BrushStyleOption extends DropdownOption {}

@Component({
  tag: 'upmade-brush-style',
  styleUrl: 'upmade-brush-style.css',
  shadow: true,
})
export class UpmadeBrushStyle {
  @Prop() type: 'pen' | 'highlighter' = 'pen';
  @Prop() brushOptions: BrushStyleOption[] = [
    { value: 'pen', label: 'Pen' },
    { value: 'highlighter', label: 'Highlighter' },
  ];

  @Event() typeChange: EventEmitter<'pen' | 'highlighter'>;

  handleDropdownValueChange(event: CustomEvent<string>) {
    this.typeChange.emit(event.detail as 'pen' | 'highlighter');
  }

  render() {
    const dropdownOptions: DropdownOption[] = this.brushOptions.map(option => ({
      value: option.value,
      label: option.label,
    }));

    return (
      <Host>
        <upmade-dropdown options={dropdownOptions} value={this.type} onValueChanged={event => this.handleDropdownValueChange(event)}>
          <button class="brush-style-button" slot="prefix">
            <upmade-icon name={this.type} size={16}></upmade-icon>
          </button>
        </upmade-dropdown>
      </Host>
    );
  }
}
