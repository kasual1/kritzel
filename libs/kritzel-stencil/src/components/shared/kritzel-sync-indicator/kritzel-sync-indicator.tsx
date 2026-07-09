import { Component, Host, h, Prop } from '@stencil/core';

@Component({
  tag: 'kritzel-sync-indicator',
  styleUrl: 'kritzel-sync-indicator.css',
  shadow: true,
})
export class KritzelSyncIndicator {
  /** Whether the indicator is visible. */
  @Prop() visible: boolean = false;

  /** The text displayed next to the spinner. */
  @Prop() text: string = 'Syncing...';

  render() {
    return (
      <Host>
        <div class={{ indicator: true, visible: this.visible }} role="status" aria-live="polite" aria-label="Synchronizing workspace">
          <span class="spinner" aria-hidden="true"></span>
          <span>{this.text}</span>
        </div>
      </Host>
    );
  }
}
