import { r as registerInstance, h, d as Host } from './index-BDyeD8t8.js';

const kritzelLoadingOverlayCss = () => `:host{position:absolute;inset:0;z-index:var(--kritzel-editor-loading-overlay-z-index, 1);display:block;pointer-events:none}.loading-overlay{position:absolute;inset:0;z-index:0;display:flex;align-items:center;justify-content:center;gap:10px;background-color:var(--kritzel-editor-loading-overlay-background, rgba(255, 255, 255, 0.6));color:var(--kritzel-editor-loading-overlay-color, #333);font-family:var(--kritzel-global-font-family, sans-serif);font-size:1.25rem;opacity:0;pointer-events:none;visibility:hidden;transition:opacity 300ms ease,      visibility 0s linear 300ms}.loading-overlay.visible{opacity:1;pointer-events:all;visibility:visible;transition:opacity 300ms ease,      visibility 0s linear 0s}.loading-spinner{width:20px;height:20px;box-sizing:border-box;display:block;flex-shrink:0;border:2px solid var(--kritzel-editor-loading-overlay-spinner-color, #cccccc);border-top-color:var(--kritzel-editor-loading-overlay-spinner-active-color, #333333);border-radius:50%;animation:kritzel-loading-spin 0.6s linear infinite}@keyframes kritzel-loading-spin{to{transform:rotate(360deg)}}`;

const KritzelLoadingOverlay = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
    }
    /**
     * Whether the overlay is visible
     */
    visible = false;
    /**
     * The text to display next to the spinner
     */
    text = 'Loading...';
    render() {
        return (h(Host, { key: '9db6a5b128b4ba9e4e196e0bf9fff6b7853ef7c9' }, h("div", { key: 'e113ed032c0c7349b6e452d5c12d9ffb42d2dbb7', class: { 'loading-overlay': true, visible: this.visible }, "aria-hidden": this.visible ? 'false' : 'true' }, h("span", { key: '55a601348ab9269125cb2043fb6e568ce8fe6b44', class: "loading-spinner" }), this.text)));
    }
};
KritzelLoadingOverlay.style = kritzelLoadingOverlayCss();

export { KritzelLoadingOverlay as kritzel_loading_overlay };
//# sourceMappingURL=kritzel-loading-overlay.entry.esm.js.map

//# sourceMappingURL=kritzel-loading-overlay.entry.js.map