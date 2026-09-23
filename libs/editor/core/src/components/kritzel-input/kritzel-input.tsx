import { Component, Host, h, Prop, Event, EventEmitter, State, Watch } from '@stencil/core';

@Component({
  tag: 'kritzel-input',
  styleUrl: 'kritzel-input.css',
  shadow: true,
})
export class KritzelInput {
  /** Current text value */
  @Prop({ mutable: true }) value: string = '';

  /** Label text displayed above the input */
  @Prop() label: string = '';

  /** Placeholder text shown when input is empty */
  @Prop() placeholder: string = '';

  /** Suffix text displayed after the input (e.g., file extension) */
  @Prop() suffix: string = '';

  /** Input type */
  @Prop() type: 'text' | 'email' | 'password' | 'url' = 'text';

  /** Whether the input is disabled */
  @Prop() disabled: boolean = false;

  /** Emitted when the value changes */
  @Event() valueChange: EventEmitter<string>;

  @State() private inputValue: string = '';

  @Watch('value')
  onValueChange(newValue: string): void {
    this.inputValue = newValue ?? '';
  }

  componentWillLoad(): void {
    this.inputValue = this.value ?? '';
  }

  private handleInput = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    this.inputValue = input.value;
    this.value = input.value;
    this.valueChange.emit(input.value);
  };

  render() {
    return (
      <Host>
        <div class="input-container">
          {this.label && <label class="input-label">{this.label}</label>}
          <div class={{ 'input-wrapper': true, 'has-suffix': !!this.suffix }}>
            <input
              type={this.type}
              class="text-input"
              value={this.inputValue}
              placeholder={this.placeholder}
              disabled={this.disabled}
              onInput={this.handleInput}
            />
            {this.suffix && <span class="input-suffix">{this.suffix}</span>}
          </div>
        </div>
      </Host>
    );
  }
}
