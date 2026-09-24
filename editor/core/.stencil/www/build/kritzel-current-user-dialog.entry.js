import { r as registerInstance, a as createEvent, e as getElement, h, d as Host } from './index-BDyeD8t8.js';

const kritzelCurrentUserDialogCss = () => `:host{display:contents}kritzel-dialog{--kritzel-dialog-width-small:380px}.user-info{display:flex;flex-direction:column;align-items:center;gap:8px;padding:8px 0}.user-name{font-size:18px;font-weight:600;color:var(--kritzel-current-user-dialog-name-color, #333333);text-align:center;margin-top:8px}.user-email{font-size:14px;color:var(--kritzel-current-user-dialog-email-color, #666666);text-align:center}.logout-button{margin-top:16px;width:100%;--kritzel-button-width:100%;--kritzel-button-primary-background-color:var(--kritzel-current-user-dialog-logout-button-background-color, #007AFF);--kritzel-button-primary-hover-background-color:var(--kritzel-current-user-dialog-logout-button-hover-background-color, #006ae6);--kritzel-button-primary-active-background-color:var(--kritzel-current-user-dialog-logout-button-active-background-color, #005bbf);--kritzel-button-primary-color:var(--kritzel-current-user-dialog-logout-button-color, #ffffff)}`;

const KritzelCurrentUserDialog = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.logoutRequest = createEvent(this, "logoutRequest", 7);
    }
    get host() { return getElement(this); }
    user;
    /** Resolved localized strings keyed by term key, supplied by the editor. */
    terms = {};
    isDialogOpen = false;
    /** Emitted when the user clicks the logout action. */
    logoutRequest;
    async open() {
        this.isDialogOpen = true;
    }
    async close() {
        this.isDialogOpen = false;
    }
    closeDialog = () => {
        this.isDialogOpen = false;
    };
    handleLogout = () => {
        this.logoutRequest.emit();
        this.closeDialog();
    };
    getDisplayName() {
        if (!this.user)
            return undefined;
        return (this.user.displayName ??
            ([this.user.firstName, this.user.lastName].filter(Boolean).join(' ') ||
                undefined));
    }
    render() {
        const displayName = this.getDisplayName();
        return (h(Host, { key: '68c0653cbd5d5dfccd5689223c08d82f36e2bc8e' }, h("kritzel-dialog", { key: '0e7b35e3bb4239ef7a992e5716c05117d14ac1df', dialogTitle: this.terms['currentUser.dialogTitle'] ?? 'Account', isOpen: this.isDialogOpen, onDialogClose: this.closeDialog, size: "small", contained: true }, h("div", { key: '236c41eaf4c570b91a0cfe0e5a35d8b00140b6ee', class: "user-info" }, h("kritzel-avatar", { key: 'edbaa83513e2c8838c29e32149fae44aefdbb122', user: this.user, size: 80 }), displayName && h("div", { key: '275560cca9980dd8664e6c4e9718cb7085c1031b', class: "user-name" }, displayName), this.user?.email && h("div", { key: '3f9483938a271d620ee3109fa3ce1e37001683ce', class: "user-email" }, this.user.email), h("kritzel-button", { key: 'd92f0613f9ee7f2d44a30f444d30e59294022809', class: "logout-button", variant: "primary", onButtonClick: this.handleLogout }, this.terms['menu.logout'] ?? 'Logout')))));
    }
};
KritzelCurrentUserDialog.style = kritzelCurrentUserDialogCss();

export { KritzelCurrentUserDialog as kritzel_current_user_dialog };
//# sourceMappingURL=kritzel-current-user-dialog.entry.esm.js.map

//# sourceMappingURL=kritzel-current-user-dialog.entry.js.map