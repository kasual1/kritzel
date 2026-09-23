import { Component, Host, h, Prop, EventEmitter, Event } from '@stencil/core';
import { KritzelColorHelper } from '@kritzel/engine';
import { ThemeAwareColor } from '@kritzel/engine';
import { ThemeName } from '@kritzel/engine';

@Component({
  tag: 'kritzel-color-palette',
  styleUrl: 'kritzel-color-palette.css',
  shadow: true,
})
export class KritzelColorPalette {
  @Prop() colors: ThemeAwareColor[] = [];
  @Prop({ mutable: true }) selectedColor: ThemeAwareColor | null = null;
  @Prop() isExpanded: boolean = false;
  @Prop() isOpaque: boolean = false;
  @Prop() opacity: number = 1;
  @Prop() theme: ThemeName;

  @Event() colorChange: EventEmitter<ThemeAwareColor>;

  private handleColorClick(color: ThemeAwareColor) {
    this.selectedColor = color;
    this.colorChange.emit(color);
  }

  private handleKeyDown(event: KeyboardEvent, color: ThemeAwareColor) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleColorClick(color);
    }
  }

  private calculateHeight(): string {
    const colorsPerRow = 6;
    const rowHeight = 32;
    const gap = 8;
    const rowCount = Math.ceil(this.colors.length / colorsPerRow);
    return `${rowCount * rowHeight + (rowCount - 1) * gap}px`;
  }

  private areColorsEqual(color1: ThemeAwareColor | null, color2: ThemeAwareColor): boolean {
    if (!color1) return false;
    return color1.light === color2.light && color1.dark === color2.dark;
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
            height: expandedHeight,
          }}
        >
          {displayedColors.map(color => {
            return (
              <div
                tabIndex={0}
                class={{
                  'color-container': true,
                  'selected': this.areColorsEqual(this.selectedColor, color),
                }}
                onClick={() => this.handleColorClick(color)}
                onKeyDown={event => this.handleKeyDown(event, color)}
              >
                <kritzel-color value={KritzelColorHelper.applyOpacity(color, this.opacity, this.theme)} theme={this.theme}></kritzel-color>
              </div>
            );
          })}
        </div>
      </Host>
    );
  }
}
