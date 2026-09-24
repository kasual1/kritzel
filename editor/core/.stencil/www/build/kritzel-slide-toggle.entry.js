import { r as registerInstance, a as createEvent, h, d as Host } from './index-BDyeD8t8.js';

const kritzelSlideToggleCss = () => `:host{display:inline-flex;align-items:center;cursor:var(--kritzel-global-pointer-cursor, pointer);outline:none;z-index:1;-webkit-tap-highlight-color:transparent}:host(:focus-visible) .toggle-track{box-shadow:0 0 0 2px var(--kritzel-global-focus-ring-color, rgba(0, 122, 255, 0.3))}:host(.disabled){opacity:0.5;pointer-events:none;cursor:default}.toggle-track{position:relative;width:var(--kritzel-slide-toggle-width, 40px);height:var(--kritzel-slide-toggle-height, 22px);background-color:var(--kritzel-slide-toggle-track-color, #ccc);border-radius:var(--kritzel-slide-toggle-border-radius, 11px);transition:background-color var(--kritzel-slide-toggle-transition-duration, 0.2s) ease}:host(.checked) .toggle-track{background-color:var(--kritzel-slide-toggle-track-checked-color, #007AFF)}.toggle-thumb{position:absolute;top:50%;left:2px;transform:translateY(-50%);width:var(--kritzel-slide-toggle-thumb-size, 18px);height:var(--kritzel-slide-toggle-thumb-size, 18px);background-color:var(--kritzel-slide-toggle-thumb-color, #fff);border-radius:50%;box-shadow:0 1px 3px rgba(0, 0, 0, 0.2);transition:left var(--kritzel-slide-toggle-transition-duration, 0.2s) ease}:host(.checked) .toggle-thumb{left:calc(var(--kritzel-slide-toggle-width, 40px) - var(--kritzel-slide-toggle-thumb-size, 18px) - 2px)}`;

const KritzelSlideToggle = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.checkedChange = createEvent(this, "checkedChange", 7);
    }
    /** Whether the toggle is checked/on */
    checked = false;
    /** Whether the toggle is disabled */
    disabled = false;
    /** Label text for accessibility (screen readers) */
    label;
    /** Emitted when the toggle state changes */
    checkedChange;
    handleToggle = () => {
        if (this.disabled)
            return;
        this.checked = !this.checked;
        this.checkedChange.emit(this.checked);
    };
    handleKeyDown = (event) => {
        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            this.handleToggle();
        }
    };
    render() {
        return (h(Host, { key: 'cedab6d6c0ae42325b68c6f17696f7527aa629be', class: { checked: this.checked, disabled: this.disabled }, tabIndex: this.disabled ? -1 : 0, role: "switch", "aria-checked": this.checked ? 'true' : 'false', "aria-disabled": this.disabled ? 'true' : 'false', "aria-label": this.label, onClick: this.handleToggle, onKeyDown: this.handleKeyDown }, h("div", { key: '8702a1d196a1a5f9fda7f8d1634fba9a580e3f66', class: "toggle-track" }, h("div", { key: '33e2986727467bcedb31c267a7d6c173e6fc0add', class: "toggle-thumb" }))));
    }
};
KritzelSlideToggle.style = kritzelSlideToggleCss();

export { KritzelSlideToggle as kritzel_slide_toggle };
//# sourceMappingURL=kritzel-slide-toggle.entry.esm.js.map

//# sourceMappingURL=kritzel-slide-toggle.entry.js.map