import { Component, Host, h, Prop, Event, EventEmitter } from '@stencil/core';

@Component({
  tag: 'upmade-stroke-size',
  styleUrl: 'upmade-stroke-size.css',
  shadow: true,
})
export class UpmadeStrokeSize {
  @Prop() sizes: number[] = [4, 6, 8, 12, 16, 24];
  @Prop({ mutable: true }) selectedSize: number | null = null;

  @Event() sizeChange: EventEmitter<number>;

  private handleSizeClick(size: number) {
    this.selectedSize = size;
    this.sizeChange.emit(size);
  }

  render() {
    const sizes = this.sizes ?? [];

    return (
      <Host>
        <div class="size-grid">
          {sizes.map(size => (
            <div
              tabIndex={0}
              class={{
                'size-container': true,
                'selected': this.selectedSize === size,
              }}
              onClick={() => this.handleSizeClick(size)}
            >
              <upmade-color value={'var(--upmade-global-text-primary)'} size={size}></upmade-color>
            </div>
          ))}
        </div>
      </Host>
    );
  }
}
