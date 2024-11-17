import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'kritzel-engine',
  styleUrl: 'kritzel-engine.css',
  shadow: true,
})
export class KritzelEngine {
  render() {
    return (
      <Host>
        Kritzel Engine is coming soon!
      </Host>
    );
  }
}
