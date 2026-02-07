import { Component, Host, h, Prop, Event, EventEmitter, State, Watch } from '@stencil/core';

@Component({
  tag: 'kritzel-numeric-input',
  styleUrl: 'kritzel-numeric-input.css',
  shadow: true,
})
export class KritzelNumericInput {
  /** Current numeric value */
  @Prop({ mutable: true }) value: number = 0;

  /** Minimum allowed value */
  @Prop() min: number = Number.MIN_SAFE_INTEGER;

  /** Maximum allowed value */
  @Prop() max: number = Number.MAX_SAFE_INTEGER;

  /** Step increment for the input */
  @Prop() step: number = 1;

  /** Label text displayed above the input */
  @Prop() label: string = '';

  /** Emitted when the value changes (after normalization) */
  @Event() valueChange: EventEmitter<number>;

  @State() private inputValue: string = '';

  @Watch('value')
  onValueChange(newValue: number): void {
    this.inputValue = String(newValue);
  }

  componentWillLoad(): void {
    this.inputValue = String(this.value);
  }

  private normalizeValue(raw: number): number {
    if (isNaN(raw)) {
      return this.value;
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

  private commitValue(): void {
    const parsed = parseFloat(this.inputValue);
    const normalized = this.normalizeValue(parsed);
    this.value = normalized;
    this.inputValue = String(normalized);
    this.valueChange.emit(normalized);
  }

  private handleIncrement = (): void => {
    const newValue = this.normalizeValue(this.roundToStep(this.value + this.step));
    this.value = newValue;
    this.inputValue = String(newValue);
    this.valueChange.emit(newValue);
  };

  private handleDecrement = (): void => {
    const newValue = this.normalizeValue(this.roundToStep(this.value - this.step));
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
              min={this.min}
              max={this.max}
              step={this.step}
              value={this.inputValue}
              onInput={this.handleInput}
              onBlur={this.handleBlur}
              onKeyDown={this.handleKeyDown}
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
