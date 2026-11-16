import { Component, Host, h, Prop } from '@stencil/core';
import { IUpmadeUser } from '@upmade/core';
import { UpmadeTermKey } from '@upmade/core';

@Component({
  tag: 'upmade-current-user',
  styleUrl: 'upmade-current-user.css',
  shadow: true,
})
export class UpmadeCurrentUser {
  /**
   * The current user to display
   */
  @Prop() user?: IUpmadeUser;

  /**
   * Avatar size in pixels
   */
  @Prop() avatarSize: number = 40;

  /** Resolved localized strings keyed by term key, supplied by the editor. */
  @Prop() terms: Partial<Record<UpmadeTermKey, string>> = {};

  render() {
    return (
      <Host>
        <upmade-avatar user={this.user} size={this.avatarSize}></upmade-avatar>
      </Host>
    );
  }
}
