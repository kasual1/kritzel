import { Component, Host, h, Prop, EventEmitter, Event } from '@stencil/core';
import { DropdownOption } from '../kritzel-dropdown/kritzel-dropdown'; // Import DropdownOption

export interface BrushStyleOption extends DropdownOption {}

@Component({
  tag: 'kritzel-brush-style',
  styleUrl: 'kritzel-brush-style.css',
  shadow: true,
})
export class KritzelBrushStyle {
  @Prop()
  type: 'pen' | 'highlighter' = 'pen';

  @Prop() brushOptions: BrushStyleOption[] = [
    { value: 'pen', label: 'Pen' },
    { value: 'highlighter', label: 'Highlighter' },
  ];

  @Event()
  typeChange: EventEmitter<'pen' | 'highlighter'>;

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
        <kritzel-dropdown options={dropdownOptions} value={this.type} onValueChanged={event => this.handleDropdownValueChange(event)}>
          <button class="brush-style-button" slot="prefix">
            <kritzel-icon name={this.type} size={16}></kritzel-icon>
          </button>
        </kritzel-dropdown>
      </Host>
    );
  }
}
