import { Component, Host, Prop, h } from '@stencil/core';

@Component({
  tag: 'kritzel-color',
  styleUrl: 'kritzel-color.css',
  shadow: true,
})
export class KritzelColor {
  @Prop()
  value: string;

  @Prop()
  size: number = 24;

  private isLightColor(hexColor: string): boolean {
    if (!hexColor) return false;

    let r = 0,
      g = 0,
      b = 0;

    let sanitizedHex = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;

    if (sanitizedHex.length === 3) {
      r = parseInt(sanitizedHex[0] + sanitizedHex[0], 16);
      g = parseInt(sanitizedHex[1] + sanitizedHex[1], 16);
      b = parseInt(sanitizedHex[2] + sanitizedHex[2], 16);
    } else if (sanitizedHex.length === 6) {
      r = parseInt(sanitizedHex.substring(0, 2), 16);
      g = parseInt(sanitizedHex.substring(2, 4), 16);
      b = parseInt(sanitizedHex.substring(4, 6), 16);
    } else {
      return false;
    }

    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      return false;
    }

    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

    return luminance > 220;
  }

  render() {
    const isColorVeryLight = this.isLightColor(this.value);
    return (
      <Host>
        <div
          class="checkerboard-bg"
          style={{
            width: `${this.size}px`,
            height: `${this.size}px`,
            borderRadius: '50%',
            display: 'inline-block',
            position: 'relative',
          }}
        >
          <div
            class={{
              'color-circle': true,
              'white': isColorVeryLight,
            }}
            style={{
              backgroundColor: this.value,
              width: `${this.size}px`,
              height: `${this.size}px`,
              borderRadius: '50%',
              position: 'absolute',
              top: '0',
              left: '0',
              display: 'inline-block',
            }}
          ></div>
        </div>
      </Host>
    );
  }
}
