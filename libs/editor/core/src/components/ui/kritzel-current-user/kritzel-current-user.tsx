import { Component, Host, h, Prop } from '@stencil/core';
import { IKritzelUser } from '@kritzel/engine';
import { KritzelTermKey } from '@kritzel/engine';

@Component({
  tag: 'kritzel-current-user',
  styleUrl: 'kritzel-current-user.css',
  shadow: true,
})
export class KritzelCurrentUser {
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

  render() {
    return (
      <Host>
        <kritzel-avatar user={this.user} size={this.avatarSize}></kritzel-avatar>
      </Host>
    );
  }
}
