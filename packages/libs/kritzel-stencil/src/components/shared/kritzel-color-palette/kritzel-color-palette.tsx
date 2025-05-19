import { Component, Host, h, Prop, EventEmitter, Event } from '@stencil/core';

@Component({
  tag: 'kritzel-color-palette',
  styleUrl: 'kritzel-color-palette.css',
  shadow: true,
})
export class KritzelColorPalette {
  @Prop()
  colors: string[] = [];

  @Prop({ mutable: true })
  selectedColor: string | null = null;

  @Prop()
  isExpanded: boolean = false;

  @Prop()
  isOpaque: boolean = false;

  @Event()
  colorChange: EventEmitter<string>;

  private handleColorClick(color: string) {
    this.selectedColor = color;
    this.colorChange.emit(color);
  }

  private calculateHeight(): string {
    const colorsPerRow = 6;
    const rowHeight = 32;
    const gap = 8;
    const rowCount = Math.ceil(this.colors.length / colorsPerRow);
    return `${rowCount * rowHeight + (rowCount - 1) * gap}px`;
  }

  render() {
    const displayedColors = this.isExpanded ? this.colors : this.colors.slice(0, 6);
    const expandedHeight = this.isExpanded ? this.calculateHeight() : '32px';

    return (
      <Host>
        <div
          class={{
            'color-grid': true,
            'expanded': this.isExpanded,
          }}
          style={{
            height: expandedHeight
          }}
        >
          {displayedColors.map(color => (
            <div
              class={{
                'color-container': true,
                'selected': this.selectedColor === color,
              }}
              onClick={() => this.handleColorClick(color)}
            >
              <kritzel-color value={color}></kritzel-color>
            </div>
          ))}
        </div>
      </Host>
    );
  }
}
