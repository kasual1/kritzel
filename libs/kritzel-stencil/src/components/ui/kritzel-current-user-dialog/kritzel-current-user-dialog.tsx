import { Component, Host, h, Prop, Method, State, Element } from '@stencil/core';
import { IKritzelUser } from '../../../interfaces/user.interface';

@Component({
  tag: 'kritzel-current-user-dialog',
  styleUrl: 'kritzel-current-user-dialog.css',
  shadow: true,
})
export class KritzelCurrentUserDialog {
  @Element() host!: HTMLElement;

  @Prop() user?: IKritzelUser;

  @State() isDialogOpen: boolean = false;

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
          dialogTitle="Account"
          isOpen={this.isDialogOpen}
          onDialogClose={this.closeDialog}
          size="small"
        >
          <div class="user-info">
            <kritzel-avatar user={this.user} size={80}></kritzel-avatar>

            {displayName && <div class="user-name">{displayName}</div>}
            {this.user?.email && <div class="user-email">{this.user.email}</div>}
          </div>
        </kritzel-dialog>
      </Host>
    );
  }
}
