import { Component, Host, h, Prop, Method, State, Element, Event, EventEmitter } from '@stencil/core';
import { IKritzelUser } from '@kritzel/engine';
import { KritzelTermKey } from '@kritzel/engine';

@Component({
  tag: 'kritzel-current-user-dialog',
  styleUrl: 'kritzel-current-user-dialog.css',
  shadow: true,
})
export class KritzelCurrentUserDialog {
  @Element() host!: HTMLElement;

  @Prop() user?: IKritzelUser;

  /** Resolved localized strings keyed by term key, supplied by the editor. */
  @Prop() terms: Partial<Record<KritzelTermKey, string>> = {};

  @State() isDialogOpen: boolean = false;

  /** Emitted when the user clicks the logout action. */
  @Event() logoutRequest!: EventEmitter<void>;

  @Method()
  async open(): Promise<void> {
    this.isDialogOpen = true;
  }

  @Method()
  async close(): Promise<void> {
    this.isDialogOpen = false;
  }

  private closeDialog = (): void => {
    this.isDialogOpen = false;
  };

  private handleLogout = (): void => {
    this.logoutRequest.emit();
    this.closeDialog();
  };

  private getDisplayName(): string | undefined {
    if (!this.user) return undefined;
    return (
      this.user.displayName ??
      ([this.user.firstName, this.user.lastName].filter(Boolean).join(' ') ||
      undefined)
    );
  }

  render() {
    const displayName = this.getDisplayName();

    return (
      <Host>
        <kritzel-dialog
          dialogTitle={this.terms['currentUser.dialogTitle'] ?? 'Account'}
          isOpen={this.isDialogOpen}
          onDialogClose={this.closeDialog}
          size="small"
          contained={true}
        >
          <div class="user-info">
            <kritzel-avatar user={this.user} size={80}></kritzel-avatar>

            {displayName && <div class="user-name">{displayName}</div>}
            {this.user?.email && <div class="user-email">{this.user.email}</div>}

            <kritzel-button class="logout-button" variant="primary" onButtonClick={this.handleLogout}>
              {this.terms['menu.logout'] ?? 'Logout'}
            </kritzel-button>
          </div>
        </kritzel-dialog>
      </Host>
    );
  }
}
