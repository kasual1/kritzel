import { Component, Host, h, Prop, Event, EventEmitter, Watch } from '@stencil/core';

export interface FontOption {
  value: string;
  label: string;
  cssFontFamily?: string;
}

@Component({
  tag: 'kritzel-font-family',
  styleUrl: 'kritzel-font-family.css',
  shadow: true,
})
export class KritzelFontFamily {
  @Prop() fontOptions: FontOption[] = [];

  @Prop({ mutable: true }) selectedFontFamily: string;

  @Event() fontFamilyChange: EventEmitter<string>;

  @Watch('fontOptions')
  handleFontOptionsChange() {
    this.ensureValidSelectedFont(this.resolveFontOptions());
  }

  componentWillLoad() {
    this.ensureValidSelectedFont(this.resolveFontOptions());
  }

  private handleDropdownValueChange = (event: CustomEvent<string>) => {
    this.fontFamilyChange.emit(event.detail);
  };

  private ensureValidSelectedFont(options: FontOption[]): void {
    if (options.length === 0) {
      return;
    }

    const normalizedSelected = this.selectedFontFamily?.trim().toLocaleLowerCase();
    const isValidCurrentFont = options.some(opt => opt.value.trim().toLocaleLowerCase() === normalizedSelected);

    if (!normalizedSelected || !isValidCurrentFont) {
      this.selectedFontFamily = options[0].value;
    }
  }

  private resolveFontOptions(): FontOption[] {
    return this.fontOptions;
  }

  render() {
    const fontOptions = this.resolveFontOptions();
    const selectedOption = fontOptions.find(option => option.value === this.selectedFontFamily);
    const selectedFontFamily = selectedOption?.cssFontFamily ?? this.selectedFontFamily;

    const dropdownOptions = fontOptions.map(option => ({
      value: option.value,
      label: option.label,
      style: { fontFamily: option.cssFontFamily ?? option.value },
    }));

    return (
      <Host>
        <kritzel-dropdown
          options={dropdownOptions}
          value={this.selectedFontFamily}
          onValueChanged={this.handleDropdownValueChange}
          selectStyles={{ fontFamily: selectedFontFamily }}
        >
        </kritzel-dropdown>
      </Host>
    );
  }
}
