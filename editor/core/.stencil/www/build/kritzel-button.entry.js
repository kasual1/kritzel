import { r as registerInstance, a as createEvent, h, d as Host } from './index-BDyeD8t8.js';

const kritzelButtonCss = () => `:host{display:inline-block;font-family:var(--kritzel-button-font-family, var(--kritzel-global-font-family, sans-serif))}button{border:none;background-color:transparent;padding:0;margin:0;font-family:inherit;font-size:inherit;-webkit-appearance:none;-moz-appearance:none;appearance:none;cursor:var(--kritzel-global-pointer-cursor, pointer);display:inline-flex;width:var(--kritzel-button-width, auto);align-items:center;justify-content:center;gap:6px;border-radius:var(--kritzel-button-border-radius, 8px);padding:var(--kritzel-button-padding, 12px 20px);font-size:var(--kritzel-button-font-size, 14px);font-weight:var(--kritzel-button-font-weight, 500);transition:background-color 0.15s ease, opacity 0.15s ease;-webkit-tap-highlight-color:transparent}button.primary{background-color:var(--kritzel-button-primary-background-color, #007AFF);color:var(--kritzel-button-primary-color, #ffffff)}button.primary:hover{background-color:var(--kritzel-button-primary-hover-background-color, #006ae6)}button.primary:active{background-color:var(--kritzel-button-primary-active-background-color, #005bbf)}button.secondary{background-color:var(--kritzel-button-secondary-background-color, #f0f0f0);color:var(--kritzel-button-secondary-color, #333333)}button.secondary:hover{background-color:var(--kritzel-button-secondary-hover-background-color, #e0e0e0)}button.secondary:active{background-color:var(--kritzel-button-secondary-active-background-color, #d0d0d0)}button.text{background-color:transparent;color:var(--kritzel-button-text-color, #007AFF)}button.text:hover{background-color:var(--kritzel-button-text-hover-background-color, rgba(0, 122, 255, 0.08))}button.text:active{background-color:var(--kritzel-button-text-active-background-color, rgba(0, 122, 255, 0.15))}button.disabled{opacity:0.4;cursor:not-allowed;pointer-events:none}`;

const KritzelButton = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.buttonClick = createEvent(this, "buttonClick", 7);
    }
    /** The visual variant of the button */
    variant = 'primary';
    /** Whether the button is disabled */
    disabled = false;
    /** The type attribute for the native button element */
    type = 'button';
    /** Emitted when the button is clicked */
    buttonClick;
    handleClick = (event) => {
        if (this.disabled)
            return;
        event.stopPropagation();
        this.buttonClick.emit();
    };
    render() {
        return (h(Host, { key: '539da53bb3f720cc3a1cf9cfed515b38e88e933b' }, h("button", { key: 'da8c3cfab366087e935bff483e2a909e915b24b2', type: this.type, class: {
                'kritzel-button': true,
                [this.variant]: true,
                'disabled': this.disabled,
            }, disabled: this.disabled, onClick: this.handleClick }, h("slot", { key: 'abb8e3b2a2b677530db9a354c4f1788b6baaaca0' }))));
    }
};
KritzelButton.style = kritzelButtonCss();

export { KritzelButton as kritzel_button };
//# sourceMappingURL=kritzel-button.entry.esm.js.map

//# sourceMappingURL=kritzel-button.entry.js.map