import { r as registerInstance, a as createEvent, h, d as Host } from './index-BDyeD8t8.js';

const kritzelBackToContentCss = () => `:host{display:block;z-index:var(--kritzel-back-to-content-z-index, 1000)}.back-to-content-button{display:flex;align-items:center;justify-content:center;height:var(--kritzel-back-to-content-height, 50px);box-sizing:border-box;gap:var(--kritzel-back-to-content-gap, 6px);padding:var(--kritzel-back-to-content-padding, 0 16px);border:var(--kritzel-back-to-content-border, 1px solid #ebebeb);border-radius:var(--kritzel-back-to-content-border-radius, 12px);background-color:var(--kritzel-back-to-content-background-color, #ffffff);color:var(--kritzel-back-to-content-color, #000000);font-size:var(--kritzel-back-to-content-font-size, 14px);font-weight:var(--kritzel-back-to-content-font-weight, 500);cursor:var(--kritzel-global-pointer-cursor, pointer);box-shadow:var(--kritzel-back-to-content-box-shadow, 0 0 3px rgba(0, 0, 0, 0.08));opacity:0;pointer-events:none;transition:opacity 0.2s ease-out, transform 0.2s ease-out, background-color 0.15s ease-out;-webkit-tap-highlight-color:transparent;user-select:none}.back-to-content-button.visible{opacity:1;pointer-events:auto}@media (hover: hover){.back-to-content-button:hover{background-color:var(--kritzel-back-to-content-hover-background-color, hsl(0, 0%, 0%, 4.3%))}}.back-to-content-button:active{background-color:var(--kritzel-back-to-content-active-background-color, hsl(0, 0%, 0%, 8.6%))}`;

const KritzelBackToContent = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.backToContent = createEvent(this, "backToContent", 7);
    }
    /**
     * Whether the button is visible
     */
    visible = false;
    /**
     * The text to display on the button
     */
    text = 'Back to content';
    /**
     * Emitted when the button is clicked
     */
    backToContent;
    handleClick = () => {
        this.backToContent.emit();
    };
    render() {
        return (h(Host, { key: 'c5c829f14100bd2d658f0dc1e32553f9adccb129' }, h("button", { key: 'a3cde6688b78466c79721d55b087c91490c6c378', class: { 'back-to-content-button': true, visible: this.visible }, onClick: this.handleClick, "aria-label": this.text }, h("kritzel-icon", { key: '0958930e863851877a67499e74bdea099ddb28ab', name: "chevronsLeft" }))));
    }
};
KritzelBackToContent.style = kritzelBackToContentCss();

export { KritzelBackToContent as kritzel_back_to_content };
//# sourceMappingURL=kritzel-back-to-content.entry.esm.js.map

//# sourceMappingURL=kritzel-back-to-content.entry.js.map