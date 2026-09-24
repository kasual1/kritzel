import { r as registerInstance, h, d as Host } from './index-BDyeD8t8.js';

const kritzelCurrentUserCss = () => `:host{display:inline-flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent}kritzel-avatar{cursor:var(--kritzel-global-pointer-cursor, pointer);border-radius:50%}`;

const KritzelCurrentUser = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
    }
    /**
     * The current user to display
     */
    user;
    /**
     * Avatar size in pixels
     */
    avatarSize = 40;
    /** Resolved localized strings keyed by term key, supplied by the editor. */
    terms = {};
    render() {
        return (h(Host, { key: '27a6be0c90f290588190f9810608041eb713ac75' }, h("kritzel-avatar", { key: 'f06de8b0e904cbcf3fb72ed2cc50da559ca2c9c4', user: this.user, size: this.avatarSize })));
    }
};
KritzelCurrentUser.style = kritzelCurrentUserCss();

export { KritzelCurrentUser as kritzel_current_user };
//# sourceMappingURL=kritzel-current-user.entry.esm.js.map

//# sourceMappingURL=kritzel-current-user.entry.js.map