import { Component, Host, Prop, h } from '@stencil/core';

@Component({
  tag: 'upmade-font',
  styleUrl: 'upmade-font.css',
  shadow: true,
})
export class UpmadeFont {
  @Prop() fontFamily: string = 'Arial, sans-serif';
  @Prop() size: number = 24;
  @Prop() color: string = '#000000';

  render() {
    return (
      <Host>
        <div
          class="font-preview"
          style={{
            fontFamily: this.fontFamily,
            fontSize: `${this.size}px`,
            color: this.color
          }}
        >
          A
        </div>
      </Host>
    );
  }
}
