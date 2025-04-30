import { Component, Host, h, Prop, Event, EventEmitter } from '@stencil/core';

@Component({
  tag: 'kritzel-stroke-size',
  styleUrl: 'kritzel-stroke-size.css',
  shadow: true,
})
export class KritzelStrokeSize {
  /**
   * Array of stroke sizes (numeric values in pixels).
   */
  @Prop() sizes: number[] = [2, 4, 6, 8, 12, 16, 24];

  /**
   * The currently selected stroke size.
   */
  @Prop({ mutable: true }) selectedSize: number | null = null;

  /**
   * Emitted when a stroke size is selected.
   */
  @Event() sizeChange: EventEmitter<number>;

  private handleSizeClick(size: number) {
    this.selectedSize = size;
    this.sizeChange.emit(size);
  }

  render() {
    return (
      <Host>
        {this.sizes.map(size => (
          <div
            class={{
              'size-container': true,
              'selected': this.selectedSize === size,
            }}
            onClick={() => this.handleSizeClick(size)}
            title={`${size}px`} // Optional: show size value on hover
          >
            <div
              class="size-circle"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                // Ensure smaller circles are still clickable and visually centered
                minWidth: '8px',
                minHeight: '8px',
              }}
            ></div>
          </div>
        ))}
      </Host>
    );
  }
}
