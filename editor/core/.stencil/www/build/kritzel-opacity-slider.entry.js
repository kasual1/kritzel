import { r as registerInstance, a as createEvent, h, d as Host } from './index-BDyeD8t8.js';

const kritzelOpacitySliderCss = () => `:host{display:flex;flex-direction:column;padding:0;box-sizing:border-box}.opacity-container{display:flex;align-items:center;width:232px}.slider-wrapper{flex:1;display:flex;align-items:center}.opacity-slider{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:3px;background:linear-gradient(      to right,      var(--kritzel-opacity-slider-active-color, #007AFF) 0%,      var(--kritzel-opacity-slider-active-color, #007AFF) var(--slider-progress, 100%),      var(--kritzel-opacity-slider-track-color, #e0e0e0) var(--slider-progress, 100%),      var(--kritzel-opacity-slider-track-color, #e0e0e0) 100%    );outline:none;cursor:var(--kritzel-global-pointer-cursor, pointer)}.opacity-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:16px;height:16px;border-radius:50%;background:var(--kritzel-opacity-slider-thumb-color, #ffffff);border:2px solid var(--kritzel-opacity-slider-thumb-border-color, #007AFF);cursor:var(--kritzel-global-pointer-cursor, pointer);box-shadow:0 1px 3px rgba(0, 0, 0, 0.2);transition:transform 0.1s ease}.opacity-slider::-webkit-slider-thumb:hover{transform:scale(1.1)}.opacity-slider::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:var(--kritzel-opacity-slider-thumb-color, #ffffff);border:2px solid var(--kritzel-opacity-slider-thumb-border-color, #007AFF);cursor:var(--kritzel-global-pointer-cursor, pointer);box-shadow:0 1px 3px rgba(0, 0, 0, 0.2);transition:transform 0.1s ease}.opacity-slider::-moz-range-thumb:hover{transform:scale(1.1)}.opacity-slider::-moz-range-track{height:6px;border-radius:3px;background:transparent}.opacity-slider:focus{outline:none}.opacity-slider:focus::-webkit-slider-thumb{box-shadow:0 0 0 2px var(--kritzel-global-focus-ring-color, rgba(0, 122, 255, 0.3))}.opacity-slider:focus::-moz-range-thumb{box-shadow:0 0 0 2px var(--kritzel-global-focus-ring-color, rgba(0, 122, 255, 0.3))}`;

const KritzelOpacitySlider = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.valueChange = createEvent(this, "valueChange", 7);
    }
    /** Current opacity value (0 to 1) */
    value = 1;
    /** Minimum opacity value */
    min = 0;
    /** Maximum opacity value */
    max = 1;
    /** Step increment */
    step = 0.01;
    /** Color to display in the preview (optional) */
    previewColor = '#000000';
    valueChange;
    handleInput(event) {
        const input = event.target;
        const newValue = parseFloat(input.value);
        this.value = newValue;
        this.valueChange.emit(newValue);
    }
    getPercentage() {
        return Math.round(this.value * 100);
    }
    render() {
        const percentage = this.getPercentage();
        return (h(Host, { key: '6de0826f246bd01ec2230aac0820439059ad73c9' }, h("div", { key: 'f1f00e8e6162a8731ddeb5a857475d189ba803b1', class: "opacity-container" }, h("div", { key: '964d210f3509480756fc20795a00bda5fcfa0fb7', class: "slider-wrapper" }, h("input", { key: '40123306802ac13259e1ccd98f04739ecafbb3b4', type: "range", class: "opacity-slider", min: this.min, max: this.max, step: this.step, value: this.value, onInput: (e) => this.handleInput(e), style: {
                '--slider-progress': `${percentage}%`,
                '--kritzel-opacity-slider-thumb-border-color': this.previewColor,
            } })))));
    }
};
KritzelOpacitySlider.style = kritzelOpacitySliderCss();

export { KritzelOpacitySlider as kritzel_opacity_slider };
//# sourceMappingURL=kritzel-opacity-slider.entry.esm.js.map

//# sourceMappingURL=kritzel-opacity-slider.entry.js.map