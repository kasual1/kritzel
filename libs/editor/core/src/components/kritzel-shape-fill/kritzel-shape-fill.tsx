import { Component, Host, h, Prop, Event, EventEmitter } from '@stencil/core';

export type ShapeFillType = 'transparent' | 'filled';

@Component({
  tag: 'kritzel-shape-fill',
  styleUrl: 'kritzel-shape-fill.css',
  shadow: true,
})
export class KritzelShapeFill {
  /** Current fill type */
  @Prop({ mutable: true }) value: ShapeFillType = 'transparent';

  @Event() valueChange: EventEmitter<ShapeFillType>;

  private handleFillChange(type: ShapeFillType) {
    this.value = type;
    this.valueChange.emit(type);
  }

  private renderFillIcon(type: ShapeFillType) {
    const strokeColor = 'var(--kritzel-global-text-primary)';

    if (type === 'transparent') {
      return (
        <svg viewBox="0 0 24 24" class="fill-icon">
          <rect
            x="4"
            y="4"
            width="16"
            height="16"
            rx="2"
            fill="none"
            stroke={strokeColor}
            stroke-width="2"
          />
        </svg>
      );
    }

    // Filled
    return (
      <svg viewBox="0 0 24 24" class="fill-icon">
        <rect
          x="4"
          y="4"
          width="16"
          height="16"
          rx="2"
          fill={strokeColor}
          stroke={strokeColor}
          stroke-width="2"
        />
      </svg>
    );
  }

  render() {
    return (
      <Host>
        <div class="fill-row">
          <button
            class={{
              'fill-option': true,
              'selected': this.value === 'transparent',
            }}
            onClick={() => this.handleFillChange('transparent')}
            title="Transparent background"
          >
            {this.renderFillIcon('transparent')}
          </button>
          <button
            class={{
              'fill-option': true,
              'selected': this.value === 'filled',
            }}
            onClick={() => this.handleFillChange('filled')}
            title="Filled background"
          >
            {this.renderFillIcon('filled')}
          </button>
        </div>
      </Host>
    );
  }
}
