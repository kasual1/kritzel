import { r as registerInstance, a as createEvent, h, d as Host } from './index-BDyeD8t8.js';

const kritzelZoomPanelCss = () => `:host{display:block;z-index:1}.panel{display:flex;flex-direction:row;align-items:center;gap:var(--kritzel-zoom-panel-gap, 4px);padding:var(--kritzel-zoom-panel-padding, 4px);border:var(--kritzel-zoom-panel-border, 1px solid #ebebeb);border-radius:var(--kritzel-zoom-panel-border-radius, 12px);background-color:var(--kritzel-zoom-panel-background-color, #ffffff);box-shadow:var(--kritzel-zoom-panel-box-shadow, 0 0 3px rgba(0, 0, 0, 0.08));opacity:0;pointer-events:none;transition:opacity 0.2s ease-out}.panel.visible{opacity:1;pointer-events:auto}.zoom-level{display:inline-flex;align-items:center;justify-content:center;min-width:46px;color:var(--kritzel-zoom-panel-icon-color, #000000);font-family:var(--kritzel-global-font-family, sans-serif);font-size:12px;font-weight:500;line-height:1;padding:0 4px;user-select:none}.zoom-button{display:flex;align-items:center;justify-content:center;width:var(--kritzel-zoom-panel-button-size, 32px);height:var(--kritzel-zoom-panel-button-size, 32px);padding:0;border:0;border-radius:var(--kritzel-zoom-panel-button-border-radius, 8px);background:transparent;background-color:transparent;color:var(--kritzel-zoom-panel-icon-color, #000000);--kritzel-icon-color:var(--kritzel-zoom-panel-icon-color, #000000);box-shadow:none;appearance:none;cursor:var(--kritzel-global-pointer-cursor, pointer);-webkit-tap-highlight-color:transparent}.zoom-button:hover,.zoom-button:focus-visible{background-color:var(--kritzel-zoom-panel-button-hover-background-color, hsl(0, 0%, 0%, 4.3%))}.zoom-button:active{background-color:var(--kritzel-zoom-panel-button-active-background-color, hsl(0, 0%, 0%, 8.6%))}.zoom-button:disabled{opacity:0.5;cursor:not-allowed;pointer-events:none}`;

const KritzelZoomPanel = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.zoomIn = createEvent(this, "zoomIn", 7);
        this.zoomOut = createEvent(this, "zoomOut", 7);
    }
    /** Whether the zoom panel is visible. */
    visible = true;
    /** Whether both zoom buttons are disabled. */
    disabled = false;
    /** Current zoom level in percent. */
    zoomPercent = 100;
    /** Resolved localized strings keyed by term key, supplied by the editor. */
    terms = {};
    /** Emitted when the zoom-in button is clicked. */
    zoomIn;
    /** Emitted when the zoom-out button is clicked. */
    zoomOut;
    handleZoomIn = () => {
        if (!this.disabled) {
            this.zoomIn.emit();
        }
    };
    handleZoomOut = () => {
        if (!this.disabled) {
            this.zoomOut.emit();
        }
    };
    get normalizedZoomPercent() {
        return Number.isFinite(this.zoomPercent) ? Math.max(1, Math.round(this.zoomPercent)) : 100;
    }
    render() {
        return (h(Host, { key: 'aa8e01ab1b510f98b2b53a6ff882fe278969d1b3' }, h("div", { key: 'b652d46eac7add121c64baee132d4d162f4ec657', class: { panel: true, visible: this.visible } }, h("button", { key: '8fe1d17dba12490a6033889b4448b3f330815cdc', class: "zoom-button", type: "button", "aria-label": this.terms['zoom.zoomOut'] ?? 'Zoom out', disabled: this.disabled, onClick: this.handleZoomOut }, h("kritzel-icon", { key: '919c0ca7c58a79fd792cdf504a7565df29043211', name: "minus" })), h("span", { key: '0acb683ebf5f2ea6a66065783ebf10715c588567', class: "zoom-level", "aria-live": "polite" }, this.normalizedZoomPercent, "%"), h("button", { key: 'e0209ca2d8af30c56833b28c394373f83da1fcf8', class: "zoom-button", type: "button", "aria-label": this.terms['zoom.zoomIn'] ?? 'Zoom in', disabled: this.disabled, onClick: this.handleZoomIn }, h("kritzel-icon", { key: '13907bcae5712d23165aa22bfe229f2893b4f74f', name: "plus" })))));
    }
};
KritzelZoomPanel.style = kritzelZoomPanelCss();

export { KritzelZoomPanel as kritzel_zoom_panel };
//# sourceMappingURL=kritzel-zoom-panel.entry.esm.js.map

//# sourceMappingURL=kritzel-zoom-panel.entry.js.map