import { Component, h, Prop, Host, State, Watch } from '@stencil/core';
import { IKritzelUser } from '@kritzel/engine';

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
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </span>
        )}
      </Host>
    );
  }
}
