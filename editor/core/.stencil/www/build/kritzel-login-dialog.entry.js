import { r as registerInstance, a as createEvent, e as getElement, h, d as Host } from './index-BDyeD8t8.js';

const kritzelLoginDialogCss = () => `:host{display:contents}kritzel-dialog{--kritzel-dialog-width-small:380px}.login-content{display:flex;flex-direction:column;gap:20px}.login-subtitle{font-size:13px;color:var(--kritzel-login-dialog-subtitle-color, #666666);margin:0;line-height:1.5;text-align:center}.login-providers{display:flex;flex-direction:column;gap:10px}.provider-button{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:12px 16px;border:1px solid var(--kritzel-login-dialog-button-border-color, #e0e0e0);border-radius:8px;background:var(--kritzel-login-dialog-button-background, #ffffff);color:var(--kritzel-login-dialog-button-text-color, #333333);font-size:14px;font-weight:500;font-family:inherit;cursor:var(--kritzel-global-pointer-cursor, pointer);transition:background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;-webkit-tap-highlight-color:transparent}.provider-button:hover:not(:disabled){background:var(--kritzel-login-dialog-button-hover-background, #f5f5f5);border-color:var(--kritzel-login-dialog-button-hover-border-color, #cccccc)}.provider-button:active:not(:disabled){background:var(--kritzel-login-dialog-button-active-background, #ebebeb)}.provider-button:focus-visible{outline:revert;outline-offset:revert}.provider-button.is-disabled{opacity:0.5;cursor:default;pointer-events:none}.provider-button.is-loading{cursor:default}.provider-label{flex-shrink:0}.provider-button.is-loading .provider-label{opacity:0.7}@keyframes kritzel-login-spin{to{transform:rotate(360deg)}}.spinner{width:20px;height:20px;box-sizing:border-box;display:block;flex-shrink:0;border:2px solid var(--kritzel-login-dialog-spinner-color, #cccccc);border-top-color:var(--kritzel-login-dialog-spinner-active-color, #333333);border-radius:50%;animation:kritzel-login-spin 0.6s linear infinite}`;

const KritzelLoginDialog = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.providerLogin = createEvent(this, "providerLogin", 7);
        this.dialogClosed = createEvent(this, "dialogClosed", 7);
    }
    get host() { return getElement(this); }
    /** Array of authentication provider buttons to render */
    providers = [];
    /** Dialog title */
    dialogTitle = 'Sign in';
    /** Optional subtitle text displayed below the title */
    subtitle;
    isDialogOpen = false;
    loadingProvider = null;
    /** Emitted when a provider button is clicked */
    providerLogin;
    /** Emitted when the dialog is closed */
    dialogClosed;
    /** Opens the login dialog */
    async open() {
        this.loadingProvider = null;
        this.isDialogOpen = true;
    }
    /** Closes the login dialog */
    async close() {
        this.isDialogOpen = false;
        this.loadingProvider = null;
    }
    /** Sets or clears the loading state on a provider button */
    async setLoading(provider) {
        this.loadingProvider = provider;
    }
    handleProviderClick = (provider) => {
        if (this.loadingProvider)
            return;
        this.loadingProvider = provider.name;
        this.providerLogin.emit({ provider: provider.name });
    };
    closeDialog = () => {
        this.isDialogOpen = false;
        this.loadingProvider = null;
        this.dialogClosed.emit();
    };
    render() {
        return (h(Host, { key: '09738ca8deef6d44233b7f29bed5c63d1ec151e6' }, h("kritzel-dialog", { key: '3acdc31c0954837f3590d1087dc7a5597a177012', dialogTitle: this.dialogTitle, isOpen: this.isDialogOpen, onDialogClose: this.closeDialog, size: "small", contained: true }, h("div", { key: 'ec57c43e11a1800799b0bf5ac33fdd68cd03e746', class: "login-content" }, this.subtitle && (h("p", { key: 'ac1d59da1f857d7eb64d70a9a3f650bdb74c864c', class: "login-subtitle" }, this.subtitle)), h("div", { key: '0cf4e38f32f25a1f40b5e28b28784b5d53302cc3', class: "login-providers" }, this.providers.map(provider => (h("button", { key: provider.name, class: {
                'provider-button': true,
                'is-loading': this.loadingProvider === provider.name,
                'is-disabled': this.loadingProvider !== null && this.loadingProvider !== provider.name,
            }, disabled: this.loadingProvider !== null && this.loadingProvider !== provider.name, onClick: () => this.handleProviderClick(provider) }, this.loadingProvider === provider.name ? (h("span", { class: "spinner" })) : (provider.icon && h("kritzel-icon", { name: provider.icon, size: 20 })), h("span", { class: "provider-label" }, provider.label)))))))));
    }
};
KritzelLoginDialog.style = kritzelLoginDialogCss();

export { KritzelLoginDialog as kritzel_login_dialog };
//# sourceMappingURL=kritzel-login-dialog.entry.esm.js.map

//# sourceMappingURL=kritzel-login-dialog.entry.js.map