import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'kritzel-font-size',
  styleUrl: 'kritzel-font-size.css',
  shadow: true,
})
export class KritzelFontSize {
  render() {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }
}
