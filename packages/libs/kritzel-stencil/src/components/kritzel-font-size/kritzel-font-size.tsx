import { Component, Host, h, Prop, Event, EventEmitter, Watch } from '@stencil/core';

@Component({
  tag: 'kritzel-font-size',
  styleUrl: 'kritzel-font-size.css',
  shadow: true,
})
export class KritzelFontSize {
  @Prop()
  sizes: number[] = [8, 10, 12, 16, 20, 24];

  @Prop({ mutable: true })
  selectedSize: number | null = null;

  @Prop()
  fontFamily: string = 'Arial';

  @Event()
  sizeChange: EventEmitter<number>;

  @Watch('fontFamily')
  fontFamilyChanged(newFontFamily: string) {
    console.log('Font family changed to:', newFontFamily);
  }

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
            title={`${size}px`}
          >
            <div
              class="size-display"
              style={{
                fontFamily: this.fontFamily,
                fontSize: `${size}px`,
              }}
            >
              A
            </div>
          </div>
        ))}
      </Host>
    );
  }
}
