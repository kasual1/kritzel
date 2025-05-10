import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'kritzel-font-family',
  styleUrl: 'kritzel-font-family.css',
  shadow: true,
})
export class KritzelFontFamily {
  render() {
    return (
      <Host>
        <select class="font-family-dropdown">
          <option value="arial">Arial</option>
          <option value="verdana">Verdana</option>
          <option value="helvetica">Helvetica</option>
          <option value="tahoma">Tahoma</option>
          <option value="trebuchet ms">Trebuchet MS</option>
          <option value="times new roman">Times New Roman</option>
          <option value="georgia">Georgia</option>
          <option value="garamond">Garamond</option>
          <option value="courier new">Courier New</option>
          <option value="brush script mt">Brush Script MT</option>
        </select>
        <button class="font-style-button">B</button>
        <button class="font-style-button italic-text">I</button>
      </Host>
    );
  }
}
