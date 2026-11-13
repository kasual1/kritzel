import { Component, Host, h, Prop } from '@stencil/core';
import { IUpdrawUser } from '@updraw/core';
import { UpdrawTermKey } from '@updraw/core';

@Component({
  tag: 'updraw-current-user',
  styleUrl: 'updraw-current-user.css',
  shadow: true,
})
export class UpdrawCurrentUser {
  /**
   * The current user to display
   */
  @Prop() user?: IUpdrawUser;

  /**
   * Avatar size in pixels
   */
  @Prop() avatarSize: number = 40;

  /** Resolved localized strings keyed by term key, supplied by the editor. */
  @Prop() terms: Partial<Record<UpdrawTermKey, string>> = {};

  render() {
    return (
      <Host>
        <updraw-avatar user={this.user} size={this.avatarSize}></updraw-avatar>
      </Host>
    );
  }
}
