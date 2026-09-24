import { r as registerInstance, a as createEvent, h, d as Host } from './index-BDyeD8t8.js';

const kritzelInputCss = () => `:host{display:block}.input-container{display:flex;flex-direction:column;gap:6px}.input-label{font-size:14px;font-weight:500;color:var(--kritzel-text-input-label-color, #333333)}.input-wrapper{display:flex;align-items:center;border:1px solid var(--kritzel-text-input-border-color, #ebebeb);border-radius:var(--kritzel-text-input-border-radius, 6px);overflow:hidden;background:var(--kritzel-text-input-background, #ffffff);transition:border-color 150ms ease}.input-wrapper:hover:not(:focus-within){border-color:var(--kritzel-text-input-hover-border-color, #cccccc)}.input-wrapper:focus-within{border-color:var(--kritzel-text-input-focus-border-color, #007AFF);border-width:2px}.text-input{flex:1;padding:10px 12px;border:none;outline:none;font-size:14px;font-family:inherit;background:transparent;color:var(--kritzel-text-input-text-color, #333333);box-sizing:border-box}.text-input::placeholder{color:var(--kritzel-text-input-placeholder-color, #999999)}.text-input::selection{background-color:var(--kritzel-text-input-selection-background, #007AFF);color:var(--kritzel-text-input-selection-color, #ffffff)}.text-input:disabled{cursor:not-allowed;opacity:0.6}.input-suffix{padding:10px 12px;background:var(--kritzel-text-input-suffix-background, #f5f5f5);color:var(--kritzel-text-input-suffix-color, #666666);font-size:14px;border-left:1px solid var(--kritzel-text-input-border-color, #ebebeb);flex-shrink:0}`;

const KritzelInput = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.valueChange = createEvent(this, "valueChange", 7);
    }
    /** Current text value */
    value = '';
    /** Label text displayed above the input */
    label = '';
    /** Placeholder text shown when input is empty */
    placeholder = '';
    /** Suffix text displayed after the input (e.g., file extension) */
    suffix = '';
    /** Input type */
    type = 'text';
    /** Whether the input is disabled */
    disabled = false;
    /** Emitted when the value changes */
    valueChange;
    inputValue = '';
    onValueChange(newValue) {
        this.inputValue = newValue ?? '';
    }
    componentWillLoad() {
        this.inputValue = this.value ?? '';
    }
    handleInput = (event) => {
        const input = event.target;
        this.inputValue = input.value;
        this.value = input.value;
        this.valueChange.emit(input.value);
    };
    render() {
        return (h(Host, { key: '27ea9df44ddfe332bfda4f8b70308ffbfbf3e63c' }, h("div", { key: '8970766380273b32d0c8ffc32310e95d34b5ed35', class: "input-container" }, this.label && h("label", { key: '7b05115cd7eac552d8b420a10c0039b48b100f55', class: "input-label" }, this.label), h("div", { key: '5c764a97dada35dd74cce61a43dd39edcca07c5d', class: { 'input-wrapper': true, 'has-suffix': !!this.suffix } }, h("input", { key: '4613cba3f6ba722c641c9f2d355fe4b9c9f795f2', type: this.type, class: "text-input", value: this.inputValue, placeholder: this.placeholder, disabled: this.disabled, onInput: this.handleInput }), this.suffix && h("span", { key: '3b4942c5cd0298d97b0c3e8e86c82297f1134718', class: "input-suffix" }, this.suffix)))));
    }
    static get watchers() { return {
        "value": [{
                "onValueChange": 0
            }]
    }; }
};
KritzelInput.style = kritzelInputCss();

export { KritzelInput as kritzel_input };
//# sourceMappingURL=kritzel-input.entry.esm.js.map

//# sourceMappingURL=kritzel-input.entry.js.map