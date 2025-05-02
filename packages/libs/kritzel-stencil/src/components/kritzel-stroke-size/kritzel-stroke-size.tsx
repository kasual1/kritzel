import { Component, Host, h, Prop, Event, EventEmitter } from '@stencil/core';

@Component({
  tag: 'kritzel-stroke-size',
  styleUrl: 'kritzel-stroke-size.css',
  shadow: true,
})
export class KritzelStrokeSize {
  @Prop() sizes: number[] = [4, 6, 8, 12, 16, 24];

  @Prop({ mutable: true }) selectedSize: number | null = null;

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
          >
            <div
              class="size-circle"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                minWidth: '2px',
                minHeight: '2px',
              }}
            ></div>
          </div>
        ))}
      </Host>
    );
  }
}
