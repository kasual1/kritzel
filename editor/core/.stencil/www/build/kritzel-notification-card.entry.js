import { r as registerInstance, a as createEvent, h, d as Host } from './index-BDyeD8t8.js';

const kritzelNotificationCardCss = () => `:host{display:block}.card{box-sizing:border-box;width:100%;max-width:var(--kritzel-notification-card-max-width, 360px);margin-inline:auto;font-family:var(--kritzel-global-font-family, sans-serif);padding:var(--kritzel-notification-card-padding, 12px 14px);border:var(--kritzel-notification-card-border, 1px solid #e5e7eb);border-radius:var(--kritzel-notification-card-border-radius, 12px);background-color:var(--kritzel-notification-card-background-color, #ffffff);color:var(--kritzel-notification-card-color, #111827);box-shadow:var(--kritzel-notification-card-box-shadow, 0 8px 20px rgba(15, 23, 42, 0.08))}.card-header{display:flex;align-items:center;justify-content:space-between;gap:var(--kritzel-notification-card-header-gap, 8px);margin-bottom:var(--kritzel-notification-card-header-margin-bottom, 8px)}.header-right{display:inline-flex;align-items:center;gap:var(--kritzel-notification-card-header-right-gap, 6px)}.type-pill{display:inline-flex;align-items:center;justify-content:center;min-height:var(--kritzel-notification-card-pill-height, 22px);padding:var(--kritzel-notification-card-pill-padding, 0 8px);border-radius:var(--kritzel-notification-card-pill-border-radius, 999px);background-color:var(--kritzel-notification-card-pill-background-color, #eff6ff);color:var(--kritzel-notification-card-pill-color, #1d4ed8);font-size:var(--kritzel-notification-card-pill-font-size, 12px);font-weight:var(--kritzel-notification-card-pill-font-weight, 600);line-height:1}.card.type-info .type-pill{background-color:var(--kritzel-notification-card-info-pill-background-color, #eff6ff);color:var(--kritzel-notification-card-info-pill-color, #1d4ed8)}.card.type-warning .type-pill{background-color:var(--kritzel-notification-card-warning-pill-background-color, #fff7ed);color:var(--kritzel-notification-card-warning-pill-color, #b45309)}.card.type-error .type-pill{background-color:var(--kritzel-notification-card-error-pill-background-color, #fef2f2);color:var(--kritzel-notification-card-error-pill-color, #b91c1c)}.timestamp{color:var(--kritzel-notification-card-timestamp-color, #6b7280);font-size:var(--kritzel-notification-card-timestamp-font-size, 12px);white-space:nowrap}.dismiss-button{display:inline-flex;align-items:center;justify-content:center;width:var(--kritzel-notification-card-dismiss-button-size, 24px);height:var(--kritzel-notification-card-dismiss-button-size, 24px);padding:0;border:none;border-radius:var(--kritzel-notification-card-dismiss-button-border-radius, 6px);background:var(--kritzel-notification-card-dismiss-button-background-color, transparent);color:var(--kritzel-notification-card-dismiss-button-color, #4b5563);cursor:var(--kritzel-global-pointer-cursor, pointer);-webkit-tap-highlight-color:transparent}.dismiss-button:hover{background:var(--kritzel-notification-card-dismiss-button-hover-background-color, #f3f4f6)}.dismiss-button:active{background:var(--kritzel-notification-card-dismiss-button-active-background-color, #e5e7eb)}.dismiss-button:focus-visible{outline:revert}.message{margin:0;color:var(--kritzel-notification-card-message-color, inherit);font-size:var(--kritzel-notification-card-message-font-size, 14px);line-height:var(--kritzel-notification-card-message-line-height, 1.45);word-break:break-word}`;

const KritzelNotificationCard = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.dismiss = createEvent(this, "dismiss", 7);
        this.hoverChange = createEvent(this, "hoverChange", 7);
    }
    /** Notification data rendered by this card. */
    notification;
    /** Whether a formatted timestamp should be displayed when available. */
    showTimestamp = true;
    /** Locale used for formatting the timestamp. */
    locale;
    /** Emitted when the notification should be dismissed manually. */
    dismiss;
    /** Emitted when pointer hover state changes. */
    hoverChange;
    handleDismissClick = (event) => {
        event.stopPropagation();
        this.dismiss.emit();
    };
    handleMouseEnter = () => {
        this.hoverChange.emit(true);
    };
    handleMouseLeave = () => {
        this.hoverChange.emit(false);
    };
    get type() {
        return this.notification?.type ?? 'info';
    }
    get role() {
        return this.type === 'error' ? 'alert' : 'status';
    }
    getTypeLabel(type) {
        switch (type) {
            case 'warning':
                return 'Warning';
            case 'error':
                return 'Error';
            default:
                return 'Info';
        }
    }
    formatTimestamp(timestamp) {
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
            return h(Host, null);
        }
        const type = this.type;
        const timestamp = this.formatTimestamp(notification.timestamp);
        return (h(Host, null, h("article", { class: { card: true, [`type-${type}`]: true }, role: this.role, "aria-live": "polite", onMouseEnter: this.handleMouseEnter, onMouseLeave: this.handleMouseLeave }, h("header", { class: "card-header" }, h("span", { class: "type-pill" }, this.getTypeLabel(type)), h("div", { class: "header-right" }, timestamp && (h("time", { class: "timestamp", dateTime: notification.timestamp?.toISOString() }, timestamp)), h("button", { class: "dismiss-button", type: "button", "aria-label": "Dismiss notification", onClick: this.handleDismissClick }, h("kritzel-icon", { name: "x", size: 16 })))), h("p", { class: "message" }, notification.message))));
    }
};
KritzelNotificationCard.style = kritzelNotificationCardCss();

export { KritzelNotificationCard as kritzel_notification_card };
//# sourceMappingURL=kritzel-notification-card.entry.esm.js.map

//# sourceMappingURL=kritzel-notification-card.entry.js.map