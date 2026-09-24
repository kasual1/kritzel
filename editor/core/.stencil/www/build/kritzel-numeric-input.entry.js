import { r as registerInstance, a as createEvent, h, d as Host } from './index-BDyeD8t8.js';

const kritzelNumericInputCss = () => `:host{display:block}.input-container{display:flex;flex-direction:column;gap:6px}.input-label{font-size:14px;font-weight:500;color:var(--kritzel-numeric-input-label-color, #333333)}.input-wrapper{display:flex;position:relative}.numeric-input{flex:1;padding:8px 36px 8px 12px;border:1px solid var(--kritzel-numeric-input-border-color, #ebebeb);border-radius:var(--kritzel-numeric-input-border-radius, 6px);font-size:14px;color:var(--kritzel-numeric-input-text-color, #333333);background-color:var(--kritzel-numeric-input-input-background, #ffffff);outline:none;transition:border-color 150ms ease;box-sizing:border-box}.numeric-input::-webkit-outer-spin-button,.numeric-input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}.numeric-input[type='number']{-moz-appearance:textfield}.numeric-input::selection{background-color:var(--kritzel-numeric-input-selection-background, #007AFF);color:var(--kritzel-numeric-input-selection-color, #ffffff)}.numeric-input:hover{border-color:var(--kritzel-numeric-input-hover-border-color, #cccccc)}.numeric-input:focus{border-color:var(--kritzel-numeric-input-focus-border-color, #0066ff);border-width:2px;padding:7px 35px 7px 11px}.spinner-buttons{position:absolute;right:1px;top:1px;bottom:1px;display:flex;flex-direction:column;border-left:1px solid var(--kritzel-numeric-input-border-color, #ebebeb);border-radius:0 var(--kritzel-numeric-input-spinner-border-radius, 5px) var(--kritzel-numeric-input-spinner-border-radius, 5px) 0;overflow:hidden}.spinner-button{flex:1;display:flex;align-items:center;justify-content:center;width:24px;padding:0;border:none;background-color:var(--kritzel-numeric-input-spinner-background, #f5f5f5);color:var(--kritzel-numeric-input-spinner-color, #666666);cursor:pointer;transition:background-color 150ms ease}.spinner-button:hover{background-color:var(--kritzel-numeric-input-spinner-hover-background, #ebebeb)}.spinner-button:active{background-color:var(--kritzel-numeric-input-spinner-active-background, #dddddd)}.spinner-up{border-bottom:1px solid var(--kritzel-numeric-input-border-color, #ebebeb)}.spinner-icon{width:10px;height:6px}`;

const KritzelNumericInput = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.valueChange = createEvent(this, "valueChange", 7);
    }
    /** Current numeric value (undefined when cleared) */
    value;
    /** Minimum allowed value */
    min = Number.MIN_SAFE_INTEGER;
    /** Maximum allowed value */
    max = Number.MAX_SAFE_INTEGER;
    /** Step increment for the input */
    step = 1;
    /** Label text displayed above the input */
    label = '';
    /** Placeholder text shown when input is empty */
    placeholder = '';
    /** Emitted when the value changes (after normalization) */
    valueChange;
    inputValue = '';
    onValueChange(newValue) {
        this.inputValue = this.shouldShowEmpty(newValue) ? '' : String(newValue);
    }
    componentWillLoad() {
        this.inputValue = this.shouldShowEmpty(this.value) ? '' : String(this.value);
    }
    shouldShowEmpty(value) {
        return value === undefined || value === Infinity || value === -Infinity;
    }
    normalizeValue(raw) {
        if (isNaN(raw)) {
            return this.value ?? 0;
        }
        return Math.min(this.max, Math.max(this.min, raw));
    }
    getDecimalPlaces() {
        const stepStr = String(this.step);
        const decimalIndex = stepStr.indexOf('.');
        return decimalIndex === -1 ? 0 : stepStr.length - decimalIndex - 1;
    }
    roundToStep(value) {
        const decimals = this.getDecimalPlaces();
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }
    handleInput = (event) => {
        const input = event.target;
        this.inputValue = input.value;
    };
    handleBlur = () => {
        this.commitValue();
    };
    handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            this.commitValue();
        }
    };
    handleInvalid = (event) => {
        event.preventDefault();
    };
    commitValue() {
        if (this.inputValue.trim() === '') {
            this.value = undefined;
            this.valueChange.emit(undefined);
            return;
        }
        const parsed = parseFloat(this.inputValue);
        const normalized = this.normalizeValue(parsed);
        this.value = normalized;
        this.inputValue = String(normalized);
        this.valueChange.emit(normalized);
    }
    handleIncrement = () => {
        // Commit current input first if needed
        const currentInput = parseFloat(this.inputValue);
        const currentValue = !isNaN(currentInput) ? currentInput : (this.value ?? 0);
        const newValue = this.normalizeValue(this.roundToStep(currentValue + this.step));
        this.value = newValue;
        this.inputValue = String(newValue);
        this.valueChange.emit(newValue);
    };
    handleDecrement = () => {
        // Commit current input first if needed
        const currentInput = parseFloat(this.inputValue);
        const currentValue = !isNaN(currentInput) ? currentInput : (this.value ?? 0);
        const newValue = this.normalizeValue(this.roundToStep(currentValue - this.step));
        this.value = newValue;
        this.inputValue = String(newValue);
        this.valueChange.emit(newValue);
    };
    render() {
        return (h(Host, { key: '273ca34d6be0e76cfd742495cd75172c5112533a' }, h("div", { key: '2ef4be625b4f97c1a65f4e114a161ae092248479', class: "input-container" }, this.label && h("label", { key: '4f3866b2c33327100f6b49e7b12c10ab91601bf3', class: "input-label" }, this.label), h("div", { key: 'cc1608e9638d3ea5434096720731073e8e436e53', class: "input-wrapper" }, h("input", { key: 'f872d2fb83f1ecfc2bbb9edeae97b8a0deccca66', type: "number", class: "numeric-input", title: "", min: this.min === Number.MIN_SAFE_INTEGER ? undefined : this.min, max: this.max === Number.MAX_SAFE_INTEGER ? undefined : this.max, step: this.step, value: this.inputValue, placeholder: this.placeholder, onInput: this.handleInput, onBlur: this.handleBlur, onKeyDown: this.handleKeyDown, onInvalid: this.handleInvalid }), h("div", { key: '0893a104eb1b68138de0d77cfe6e644e7fff75d2', class: "spinner-buttons" }, h("button", { key: 'c39596aac8affea11a880835c63975e8cdae6599', type: "button", class: "spinner-button spinner-up", onClick: this.handleIncrement, tabIndex: -1, "aria-label": "Increase value" }, h("svg", { key: '6cfad1fab40cd65ba54ee5d80d9b08af5676878c', viewBox: "0 0 10 6", class: "spinner-icon" }, h("path", { key: '50ca542fa773658823a9bc09ec3226bba02cfac7', d: "M1 5L5 1L9 5", stroke: "currentColor", "stroke-width": "1.5", fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" }))), h("button", { key: '5c62a5a71555474e94e73b9123023f6cf0f70c81', type: "button", class: "spinner-button spinner-down", onClick: this.handleDecrement, tabIndex: -1, "aria-label": "Decrease value" }, h("svg", { key: '72b12df906ebf5e2d07ec387faeb11567dbca76b', viewBox: "0 0 10 6", class: "spinner-icon" }, h("path", { key: 'a85205a5f31392e1db4bc893fad336f5b9775530', d: "M1 1L5 5L9 1", stroke: "currentColor", "stroke-width": "1.5", fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" }))))))));
    }
    static get watchers() { return {
        "value": [{
                "onValueChange": 0
            }]
    }; }
};
KritzelNumericInput.style = kritzelNumericInputCss();

export { KritzelNumericInput as kritzel_numeric_input };
//# sourceMappingURL=kritzel-numeric-input.entry.esm.js.map

//# sourceMappingURL=kritzel-numeric-input.entry.js.map