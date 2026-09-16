import { Component, Host, h, Prop } from '@stencil/core';
import { IKritzelUser } from '@kritzel/engine';

@Component({
  tag: 'kritzel-active-users',
  styleUrl: 'kritzel-active-users.css',
  shadow: true,
})
export class KritzelActiveUsers {
  /**
   * Array of active users to display
   */
  @Prop() users: IKritzelUser[] = [];

  /**
   * Avatar size in pixels
   */
  @Prop() avatarSize: number = 40;

  /**
   * Maximum number of avatars to show before overflow text
   */
  @Prop() maxVisible: number = 3;

  /**
   * Overlap offset in pixels (negative margin between avatars)
   */
  @Prop() overlap: number = 20;

  private getDisplayName(user: IKritzelUser): string {
    return (
      user.displayName ??
      ([user.firstName, user.lastName].filter(Boolean).join(' ') ||
      user.email ||
      'User')
    );
  }

  render() {
    if (!this.users || this.users.length === 0) {
      return <Host style={{ display: 'none' }}></Host>;
    }

    const visibleUsers = this.users.slice(0, this.maxVisible);
    const overflowCount = this.users.length - this.maxVisible;

    return (
      <Host style={{ '--avatar-overlap': `-${this.overlap}px` }}>
        <div class="avatars">
          {visibleUsers.map((user, index) => (
            <div
              class="avatar-wrapper"
              style={{ marginLeft: index > 0 ? `var(--avatar-overlap)` : '0px', zIndex: `${visibleUsers.length - index}` }}
            >
              <kritzel-avatar user={user} size={this.avatarSize}></kritzel-avatar>
              <span class="avatar-tooltip">{this.getDisplayName(user)}</span>
            </div>
          ))}
        </div>
        {overflowCount > 0 && (
          <span class="overflow-count">
            +{overflowCount}
            <span class="avatar-tooltip">
              {this.users.slice(this.maxVisible).map(user => (
                <div>{this.getDisplayName(user)}</div>
              ))}
            </span>
          </span>
        )}
      </Host>
    );
  }
}
