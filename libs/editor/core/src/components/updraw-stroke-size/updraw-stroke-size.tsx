import { Component, Host, h, Prop, Event, EventEmitter } from '@stencil/core';

@Component({
  tag: 'updraw-stroke-size',
  styleUrl: 'updraw-stroke-size.css',
  shadow: true,
})
export class UpdrawStrokeSize {
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
              <updraw-color value={'var(--updraw-global-text-primary)'} size={size}></updraw-color>
            </div>
          ))}
        </div>
      </Host>
    );
  }
}
