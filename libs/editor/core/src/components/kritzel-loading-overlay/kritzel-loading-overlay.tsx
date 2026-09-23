import { Component, Host, h, Prop } from '@stencil/core';

@Component({
  tag: 'kritzel-loading-overlay',
  styleUrl: 'kritzel-loading-overlay.css',
  shadow: true,
})
export class KritzelLoadingOverlay {
  /**
   * Whether the overlay is visible
   */
  @Prop() visible: boolean = false;

  /**
   * The text to display next to the spinner
   */
  @Prop() text: string = 'Loading...';

  render() {
    return (
      <Host>
        <div class={{ 'loading-overlay': true, visible: this.visible }} aria-hidden={this.visible ? 'false' : 'true'}>
          <span class="loading-spinner"></span>
          {this.text}
        </div>
      </Host>
    );
  }
}
