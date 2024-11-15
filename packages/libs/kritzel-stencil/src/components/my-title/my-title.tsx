import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'my-title',
  styleUrl: 'my-title.css',
  shadow: true,
})
export class MyTitle {
  render() {
    return (
      <Host>
        This is just a title component for testing purposes (updated).
      </Host>
    );
  }
}
