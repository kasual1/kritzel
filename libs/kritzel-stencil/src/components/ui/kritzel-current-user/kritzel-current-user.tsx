import { Component, Host, h, Prop, Element } from '@stencil/core';
import { IKritzelUser } from '../../../interfaces/user.interface';
import { KritzelTermKey } from '../../../interfaces/localization.interface';

@Component({
  tag: 'kritzel-current-user',
  styleUrl: 'kritzel-current-user.css',
  shadow: true,
})
export class KritzelCurrentUser {
  @Element() host!: HTMLElement;

  /**
   * The current user to display
   */
  @Prop() user?: IKritzelUser;

  /**
   * Avatar size in pixels
   */
  @Prop() avatarSize: number = 40;

  /** Resolved localized strings keyed by term key, supplied by the editor. */
  @Prop() terms: Partial<Record<KritzelTermKey, string>> = {};

  private dialogRef: HTMLKritzelCurrentUserDialogElement;

  private handleAvatarClick = (event: MouseEvent): void => {
    event.stopPropagation();
    this.dialogRef?.open();
  };

  render() {
    return (
      <Host>
        <kritzel-avatar user={this.user} size={this.avatarSize} onClick={this.handleAvatarClick}></kritzel-avatar>
        <kritzel-current-user-dialog ref={el => (this.dialogRef = el)} user={this.user} terms={this.terms}></kritzel-current-user-dialog>
      </Host>
    );
  }
}
