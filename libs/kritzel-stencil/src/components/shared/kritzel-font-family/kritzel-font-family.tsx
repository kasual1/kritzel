import { Component, Host, h, Prop, Event, EventEmitter, State, Watch } from '@stencil/core';
import { KritzelFontRegistry } from '../../../classes/registries/font-registry.class';

const DEFAULT_FONT_OPTIONS: FontOption[] = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Tahoma', label: 'Tahoma' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Garamond', label: 'Garamond' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Brush Script MT', label: 'Brush Script MT' },
];

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
  @Prop() fontOptions?: FontOption[];

  @Prop({ mutable: true }) selectedFontFamily: string;

  @State() registryVersion: number = 0;

  @Event() fontFamilyChange: EventEmitter<string>;

  @Watch('fontOptions')
  handleFontOptionsChange() {
    this.ensureValidSelectedFont(this.resolveFontOptions());
  }

  private readonly handleFontRegistryChange = () => {
    this.registryVersion += 1;
    this.ensureValidSelectedFont(this.resolveFontOptions());
  };

  connectedCallback() {
    const eventTarget = globalThis as unknown as {
      addEventListener?: (type: string, listener: EventListenerOrEventListenerObject) => void;
    };

    if (typeof eventTarget.addEventListener === 'function') {
      eventTarget.addEventListener(KritzelFontRegistry.changeEventName, this.handleFontRegistryChange);
    }
  }

  disconnectedCallback() {
    const eventTarget = globalThis as unknown as {
      removeEventListener?: (type: string, listener: EventListenerOrEventListenerObject) => void;
    };

    if (typeof eventTarget.removeEventListener === 'function') {
      eventTarget.removeEventListener(KritzelFontRegistry.changeEventName, this.handleFontRegistryChange);
    }
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
    if (this.fontOptions && this.fontOptions.length > 0) {
      return this.fontOptions;
    }

    const registered = KritzelFontRegistry.list().map(font => ({
      value: font.family,
      label: font.label,
      cssFontFamily: font.cssFontFamily,
    }));

    const merged = [...DEFAULT_FONT_OPTIONS];
    const knownValues = new Set(DEFAULT_FONT_OPTIONS.map(option => option.value.trim().toLocaleLowerCase()));

    for (const option of registered) {
      const normalizedValue = option.value.trim().toLocaleLowerCase();
      if (knownValues.has(normalizedValue)) {
        continue;
      }

      knownValues.add(normalizedValue);
      merged.push(option);
    }

    return merged;
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
