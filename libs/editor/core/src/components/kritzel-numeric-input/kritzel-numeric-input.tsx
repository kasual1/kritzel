import { Component, Host, h, Prop, Event, EventEmitter, State, Watch } from '@stencil/core';

@Component({
  tag: 'kritzel-numeric-input',
  styleUrl: 'kritzel-numeric-input.css',
  shadow: true,
})
export class KritzelNumericInput {
  /** Current numeric value (undefined when cleared) */
  @Prop({ mutable: true }) value?: number;

  /** Minimum allowed value */
  @Prop() min: number = Number.MIN_SAFE_INTEGER;

  /** Maximum allowed value */
  @Prop() max: number = Number.MAX_SAFE_INTEGER;

  /** Step increment for the input */
  @Prop() step: number = 1;

  /** Label text displayed above the input */
  @Prop() label: string = '';

  /** Placeholder text shown when input is empty */
  @Prop() placeholder: string = '';

  /** Emitted when the value changes (after normalization) */
  @Event() valueChange: EventEmitter<number | undefined>;

  @State() private inputValue: string = '';

  @Watch('value')
  onValueChange(newValue: number | undefined): void {
    this.inputValue = this.shouldShowEmpty(newValue) ? '' : String(newValue);
  }

  componentWillLoad(): void {
    this.inputValue = this.shouldShowEmpty(this.value) ? '' : String(this.value);
  }

  private shouldShowEmpty(value: number | undefined): boolean {
    return value === undefined || value === Infinity || value === -Infinity;
  }

  private normalizeValue(raw: number): number {
    if (isNaN(raw)) {
      return this.value ?? 0;
    }
    return Math.min(this.max, Math.max(this.min, raw));
  }

  private getDecimalPlaces(): number {
    const stepStr = String(this.step);
    const decimalIndex = stepStr.indexOf('.');
    return decimalIndex === -1 ? 0 : stepStr.length - decimalIndex - 1;
  }

  private roundToStep(value: number): number {
    const decimals = this.getDecimalPlaces();
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  private handleInput = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    this.inputValue = input.value;
  };

  private handleBlur = (): void => {
    this.commitValue();
  };

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      this.commitValue();
    }
  };

  private handleInvalid = (event: Event): void => {
    event.preventDefault();
  };

  private commitValue(): void {
    if (this.inputValue.trim() === '') {
      this.value = undefined;
      this.valueChange.emit(undefined);
      return;
    }
    const parsed = parseFloat(this.inputValue);
    const normalized = this.normalizeValue(parsed);
    this.value = normalized;
    this.inputValue = String(normalized);
    this.valueChange.emit(normalized);
  }

  private handleIncrement = (): void => {
    // Commit current input first if needed
    const currentInput = parseFloat(this.inputValue);
    const currentValue = !isNaN(currentInput) ? currentInput : (this.value ?? 0);

    const newValue = this.normalizeValue(this.roundToStep(currentValue + this.step));
    this.value = newValue;
    this.inputValue = String(newValue);
    this.valueChange.emit(newValue);
  };

  private handleDecrement = (): void => {
    // Commit current input first if needed
    const currentInput = parseFloat(this.inputValue);
    const currentValue = !isNaN(currentInput) ? currentInput : (this.value ?? 0);

    const newValue = this.normalizeValue(this.roundToStep(currentValue - this.step));
    this.value = newValue;
    this.inputValue = String(newValue);
    this.valueChange.emit(newValue);
  };

  render() {
    return (
      <Host>
        <div class="input-container">
          {this.label && <label class="input-label">{this.label}</label>}
          <div class="input-wrapper">
            <input
              type="number"
              class="numeric-input"
              title=""
              min={this.min === Number.MIN_SAFE_INTEGER ? undefined : this.min}
              max={this.max === Number.MAX_SAFE_INTEGER ? undefined : this.max}
              step={this.step}
              value={this.inputValue}
              placeholder={this.placeholder}
              onInput={this.handleInput}
              onBlur={this.handleBlur}
              onKeyDown={this.handleKeyDown}
              onInvalid={this.handleInvalid}
            />
            <div class="spinner-buttons">
              <button
                type="button"
                class="spinner-button spinner-up"
                onClick={this.handleIncrement}
                tabIndex={-1}
                aria-label="Increase value"
              >
                <svg viewBox="0 0 10 6" class="spinner-icon">
                  <path d="M1 5L5 1L9 5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                class="spinner-button spinner-down"
                onClick={this.handleDecrement}
                tabIndex={-1}
                aria-label="Decrease value"
              >
                <svg viewBox="0 0 10 6" class="spinner-icon">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
