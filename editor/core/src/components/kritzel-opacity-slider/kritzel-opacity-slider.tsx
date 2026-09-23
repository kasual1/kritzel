import { Component, Host, h, Prop, Event, EventEmitter } from '@stencil/core';

@Component({
  tag: 'kritzel-opacity-slider',
  styleUrl: 'kritzel-opacity-slider.css',
  shadow: true,
})
export class KritzelOpacitySlider {
  /** Current opacity value (0 to 1) */
  @Prop({ mutable: true }) value: number = 1;

  /** Minimum opacity value */
  @Prop() min: number = 0;

  /** Maximum opacity value */
  @Prop() max: number = 1;

  /** Step increment */
  @Prop() step: number = 0.01;

  /** Color to display in the preview (optional) */
  @Prop() previewColor: string = '#000000';

  @Event() valueChange: EventEmitter<number>;

  private handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const newValue = parseFloat(input.value);
    this.value = newValue;
    this.valueChange.emit(newValue);
  }

  private getPercentage(): number {
    return Math.round(this.value * 100);
  }

  render() {
    const percentage = this.getPercentage();

    return (
      <Host>
        <div class="opacity-container">
          <div class="slider-wrapper">
            <input
              type="range"
              class="opacity-slider"
              min={this.min}
              max={this.max}
              step={this.step}
              value={this.value}
              onInput={(e) => this.handleInput(e)}
              style={{
                '--slider-progress': `${percentage}%`,
                '--kritzel-opacity-slider-thumb-border-color': this.previewColor,
              } as any}
            />
          </div>
        </div>
      </Host>
    );
  }
}
