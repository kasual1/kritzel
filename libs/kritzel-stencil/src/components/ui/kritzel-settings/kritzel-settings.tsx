import { Component, Host, h, State } from '@stencil/core';

@Component({
  tag: 'kritzel-settings',
  styleUrl: 'kritzel-settings.css',
  shadow: true,
})
export class KritzelSettings {
  @State() isDialogOpen: boolean = false;

  private openDialog = (): void => {
    this.isDialogOpen = true;
  };

  private closeDialog = (): void => {
    this.isDialogOpen = false;
  };

  render() {
    return (
      <Host>
        <button class="settings-button" onClick={this.openDialog}>
          <kritzel-icon name="settings" size={24}></kritzel-icon>
        </button>

        <kritzel-dialog
          isOpen={this.isDialogOpen}
          dialogTitle="Settings"
          size="medium"
          onDialogClose={this.closeDialog}
        >
          <p style={{ margin: '0 0 16px 0' }}>This is a demo dialog to showcase the new kritzel-dialog component.</p>
          <p style={{ margin: '0' }}>You can add any content here using slots. The dialog supports:</p>
          <ul style={{ margin: '16px 0', paddingLeft: '20px' }}>
            <li>Focus trapping</li>
            <li>Escape key to close</li>
            <li>Backdrop click to close</li>
            <li>Custom header, body, and footer slots</li>
          </ul>
          <div slot="footer">
            <button class="footer-button cancel-button" onClick={this.closeDialog}>
              Cancel
            </button>
            <button class="footer-button confirm-button" onClick={this.closeDialog}>
              Confirm
            </button>
          </div>
        </kritzel-dialog>
      </Host>
    );
  }
}
