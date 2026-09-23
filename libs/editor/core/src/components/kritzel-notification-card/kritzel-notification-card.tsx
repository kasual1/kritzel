import { Component, Host, h, Prop, Event, EventEmitter } from '@stencil/core';
import { KritzelNotification } from '@kritzel/engine';

@Component({
  tag: 'kritzel-notification-card',
  styleUrl: 'kritzel-notification-card.css',
  shadow: true,
})
export class KritzelNotificationCard {
  /** Notification data rendered by this card. */
  @Prop() notification?: KritzelNotification;

  /** Whether a formatted timestamp should be displayed when available. */
  @Prop() showTimestamp: boolean = true;

  /** Locale used for formatting the timestamp. */
  @Prop() locale?: string;

  /** Emitted when the notification should be dismissed manually. */
  @Event() dismiss!: EventEmitter<void>;

  /** Emitted when pointer hover state changes. */
  @Event() hoverChange!: EventEmitter<boolean>;

  private handleDismissClick = (event: MouseEvent): void => {
    event.stopPropagation();
    this.dismiss.emit();
  };

  private handleMouseEnter = (): void => {
    this.hoverChange.emit(true);
  };

  private handleMouseLeave = (): void => {
    this.hoverChange.emit(false);
  };

  private get type(): KritzelNotification['type'] {
    return this.notification?.type ?? 'info';
  }

  private get role(): 'status' | 'alert' {
    return this.type === 'error' ? 'alert' : 'status';
  }

  private getTypeLabel(type: KritzelNotification['type']): string {
    switch (type) {
      case 'warning':
        return 'Warning';
      case 'error':
        return 'Error';
      default:
        return 'Info';
    }
  }

  private formatTimestamp(timestamp?: Date): string | null {
    if (!timestamp || !this.showTimestamp) {
      return null;
    }

    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return new Intl.DateTimeFormat(this.locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  render() {
    const notification = this.notification;
    if (!notification) {
      return <Host></Host>;
    }

    const type = this.type;
    const timestamp = this.formatTimestamp(notification.timestamp);

    return (
      <Host>
        <article class={{ card: true, [`type-${type}`]: true }} role={this.role} aria-live="polite" onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}>
          <header class="card-header">
            <span class="type-pill">{this.getTypeLabel(type)}</span>
            <div class="header-right">
              {timestamp && (
                <time class="timestamp" dateTime={notification.timestamp?.toISOString()}>
                  {timestamp}
                </time>
              )}
              <button class="dismiss-button" type="button" aria-label="Dismiss notification" onClick={this.handleDismissClick}>
                <kritzel-icon name="x" size={16}></kritzel-icon>
              </button>
            </div>
          </header>

          <p class="message">{notification.message}</p>
        </article>
      </Host>
    );
  }
}
