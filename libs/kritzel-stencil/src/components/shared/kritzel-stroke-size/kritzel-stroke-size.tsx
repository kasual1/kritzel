import { Component, Host, h, Prop, Event, EventEmitter } from '@stencil/core';
import { ThemeMode } from '../../../constants/color-palette.constants';

@Component({
  tag: 'kritzel-stroke-size',
  styleUrl: 'kritzel-stroke-size.css',
  shadow: true,
})
export class KritzelStrokeSize {
  @Prop() sizes: number[] = [4, 6, 8, 12, 16, 24];
  @Prop({ mutable: true }) selectedSize: number | null = null;
  @Prop() theme: ThemeMode;

  @Event() sizeChange: EventEmitter<number>;

  private handleSizeClick(size: number) {
    this.selectedSize = size;
    this.sizeChange.emit(size);
  }

  render() {
    return (
      <Host>
        <div class="size-grid">
          {this.sizes.map(size => (
            <div
              tabIndex={0}
              class={{
                'size-container': true,
                'selected': this.selectedSize === size,
              }}
              onClick={() => this.handleSizeClick(size)}
            >
              <kritzel-color value={this.theme === 'dark' ? '#ffffff' : '#000000'} size={size}></kritzel-color>
            </div>
          ))}
        </div>
      </Host>
    );
  }
}
