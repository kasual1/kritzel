import { Component, h, Prop, Host, State, Watch } from '@stencil/core';
import { IKritzelUser } from '@kritzel/core';

@Component({
  tag: 'kritzel-avatar',
  styleUrl: 'kritzel-avatar.css',
  shadow: true,
})
export class KritzelAvatar {
  /** Full user object. If provided, individual props are ignored. */
  @Prop() user?: IKritzelUser;

  /** Direct prop: user's display name (used for initials fallback) */
  @Prop() name?: string;

  /** Avatar diameter in pixels */
  @Prop() size: number = 32;

  /** Background color for initials fallback */
  @Prop() color?: string;

  /** Tracks whether the image failed to load */
  @State() imageError: boolean = false;

  private retryCount: number = 0;
  private maxRetries: number = 3;
  private retryTimer: ReturnType<typeof setTimeout>;

  @Watch('user')
  userChanged() {
    this.resetImageState();
  }

  @Watch('profileImageUrl')
  profileImageUrlChanged() {
    this.resetImageState();
  }

  private resetImageState() {
    this.imageError = false;
    this.retryCount = 0;
    clearTimeout(this.retryTimer);
  }

  disconnectedCallback() {
    clearTimeout(this.retryTimer);
  }

  private getImageUrl(): string | undefined {
    return this.user?.profileImageUrl;
  }

  private getDisplayName(): string | undefined {
    if (this.user) {
      return (
        this.user.displayName ??
        ([this.user.firstName, this.user.lastName].filter(Boolean).join(' ') ||
        this.user.email)
      );
    }
    return this.name;
  }

  private getInitials(): string | undefined {
    const displayName = this.getDisplayName();
    if (!displayName) return undefined;

    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0]?.toUpperCase();
  }

  private getBackgroundColor(): string {
    return this.user?.color ?? this.color ?? this.generateColorFromName();
  }

  private generateColorFromName(): string {
    const name = this.getDisplayName() || '';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 45%, 55%)`;
  }

  private handleImageError = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      const delay = 1000 * Math.pow(2, this.retryCount - 1);
      this.retryTimer = setTimeout(() => {
        this.imageError = false;
      }, delay);
    }
    this.imageError = true;
  };

  render() {
    const imageUrl = this.getImageUrl();
    const initials = this.getInitials();
    const showImage = imageUrl && !this.imageError;
    const showInitials = !showImage && initials;
    const showDefaultIcon = !showImage && !showInitials;

    const containerStyles = {
      width: `${this.size}px`,
      height: `${this.size}px`,
      fontSize: `${Math.round(this.size * 0.4)}px`,
    };

    return (
      <Host
        style={containerStyles}
        class={{
          'is-agent': this.user?.kind === 'agent',
          'has-image': !!showImage,
          'has-initials': !!showInitials,
          'has-default': !!showDefaultIcon,
        }}
        role="img"
        aria-label={this.getDisplayName() || 'User avatar'}
      >
        {showImage && (
          <img
            src={imageUrl}
            alt=""
            class="avatar-image"
            ref={(el) => {
              if (el) {
                el.referrerPolicy = 'no-referrer';
                el.crossOrigin = 'anonymous';
              }
            }}
            onError={this.handleImageError}
          />
        )}
        {showInitials && (
          <span
            class="avatar-initials"
            style={{ backgroundColor: this.getBackgroundColor() }}
          >
            {initials}
          </span>
        )}
        {showDefaultIcon && (
          <span class="avatar-default">
            <svg viewBox="0 0 24 24" fill="currentColor">
              {this.user?.kind === 'agent' ? (
                <path d="M12 2a1.5 1.5 0 0 1 1.5 1.5c0 .55-.3 1.03-.75 1.29V6h3.75A3.5 3.5 0 0 1 20 9.5V16a3.5 3.5 0 0 1-3.5 3.5h-9A3.5 3.5 0 0 1 4 16V9.5A3.5 3.5 0 0 1 7.5 6h3.75V4.79A1.5 1.5 0 0 1 12 2zm-3 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
              ) : (
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              )}
            </svg>
          </span>
        )}
      </Host>
    );
  }
}
