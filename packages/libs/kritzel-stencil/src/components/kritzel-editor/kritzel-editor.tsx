import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'kritzel-editor',
  styleUrl: 'kritzel-editor.css',
  shadow: false,
})
export class KritzelEditor {
  render() {
    return (
      <Host>
        <kritzel-engine></kritzel-engine>
        <kritzel-controls></kritzel-controls>
      </Host>
    );
  }
}
