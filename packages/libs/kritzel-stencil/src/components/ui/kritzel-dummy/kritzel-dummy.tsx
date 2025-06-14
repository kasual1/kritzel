import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'kritzel-dummy',
  styleUrl: 'kritzel-dummy.css',
  shadow: true,
})
export class KritzelDummy {
  render() {
    return (
      <Host>
        Dummy Component Works!
      </Host>
    );
  }
}
