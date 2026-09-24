import { r as registerInstance, h, d as Host } from './index-BDyeD8t8.js';

const kritzelActiveUsersCss = () => `:host{display:inline-flex;align-items:center}.avatars{display:flex;align-items:center}.avatar-wrapper{position:relative;transition:margin-left 200ms ease}.avatar-wrapper kritzel-avatar{border-radius:50%;box-shadow:0 0 0 2px var(--kritzel-active-users-avatar-border-color, #ffffff)}.avatars:hover .avatar-wrapper{margin-left:-6px !important}.avatar-tooltip{position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:12px;padding:4px 8px;background-color:var(--kritzel-active-users-tooltip-background, #333333);color:var(--kritzel-active-users-tooltip-color, #ffffff);font-family:var(--kritzel-active-users-font-family, var(--kritzel-global-font-family, sans-serif));font-size:12px;font-weight:500;border-radius:4px;white-space:nowrap;width:max-content;pointer-events:none;opacity:0;transition:opacity 150ms ease}.avatar-wrapper:hover .avatar-tooltip,.overflow-count:hover .avatar-tooltip{opacity:1}.overflow-count{position:relative;margin-left:8px;font-family:var(--kritzel-active-users-font-family, var(--kritzel-global-font-family, sans-serif));font-size:var(--kritzel-active-users-overflow-font-size, 14px);font-weight:500;color:var(--kritzel-active-users-overflow-color, #666666);white-space:nowrap;cursor:default}.overflow-count .avatar-tooltip{white-space:nowrap;text-align:left;margin-top:20px}`;

const KritzelActiveUsers = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
    }
    /**
     * Array of active users to display
     */
    users = [];
    /**
     * Avatar size in pixels
     */
    avatarSize = 40;
    /**
     * Maximum number of avatars to show before overflow text
     */
    maxVisible = 3;
    /**
     * Overlap offset in pixels (negative margin between avatars)
     */
    overlap = 20;
    getDisplayName(user) {
        return (user.displayName ??
            ([user.firstName, user.lastName].filter(Boolean).join(' ') ||
                user.email ||
                'User'));
    }
    render() {
        if (!this.users || this.users.length === 0) {
            return h(Host, { style: { display: 'none' } });
        }
        const visibleUsers = this.users.slice(0, this.maxVisible);
        const overflowCount = this.users.length - this.maxVisible;
        return (h(Host, { style: { '--avatar-overlap': `-${this.overlap}px` } }, h("div", { class: "avatars" }, visibleUsers.map((user, index) => (h("div", { class: "avatar-wrapper", style: { marginLeft: index > 0 ? `var(--avatar-overlap)` : '0px', zIndex: `${visibleUsers.length - index}` } }, h("kritzel-avatar", { user: user, size: this.avatarSize }), h("span", { class: "avatar-tooltip" }, this.getDisplayName(user)))))), overflowCount > 0 && (h("span", { class: "overflow-count" }, "+", overflowCount, h("span", { class: "avatar-tooltip" }, this.users.slice(this.maxVisible).map(user => (h("div", null, this.getDisplayName(user)))))))));
    }
};
KritzelActiveUsers.style = kritzelActiveUsersCss();

export { KritzelActiveUsers as kritzel_active_users };
//# sourceMappingURL=kritzel-active-users.entry.esm.js.map

//# sourceMappingURL=kritzel-active-users.entry.js.map