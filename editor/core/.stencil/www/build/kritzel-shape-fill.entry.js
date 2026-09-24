import { r as registerInstance, a as createEvent, h, d as Host } from './index-BDyeD8t8.js';

const kritzelShapeFillCss = () => `:host{display:flex;flex-direction:column;gap:12px;padding:0;box-sizing:border-box}.fill-row{display:flex;align-items:center;gap:4px}.fill-option{display:flex;justify-content:center;align-items:center;width:48px;height:32px;border-radius:6px;cursor:var(--kritzel-global-pointer-cursor, pointer);border:2px solid transparent;box-sizing:border-box;background:var(--kritzel-shape-fill-option-background, #ffffff);padding:4px;transition:background-color 0.15s ease, border-color 0.15s ease}.fill-option:hover{background-color:var(--kritzel-shape-fill-hover-background-color, #ebebeb)}.fill-option.selected{border-color:var(--kritzel-selection-border-color, #007AFF);background-color:var(--kritzel-shape-fill-selected-background-color, #ebebeb)}.fill-option:focus{outline:none;box-shadow:0 0 0 2px var(--kritzel-global-focus-ring-color, rgba(0, 122, 255, 0.3))}.fill-icon{width:100%;height:100%}`;

const KritzelShapeFill = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.valueChange = createEvent(this, "valueChange", 7);
    }
    /** Current fill type */
    value = 'transparent';
    valueChange;
    handleFillChange(type) {
        this.value = type;
        this.valueChange.emit(type);
    }
    renderFillIcon(type) {
        const strokeColor = 'var(--kritzel-global-text-primary)';
        if (type === 'transparent') {
            return (h("svg", { viewBox: "0 0 24 24", class: "fill-icon" }, h("rect", { x: "4", y: "4", width: "16", height: "16", rx: "2", fill: "none", stroke: strokeColor, "stroke-width": "2" })));
        }
        // Filled
        return (h("svg", { viewBox: "0 0 24 24", class: "fill-icon" }, h("rect", { x: "4", y: "4", width: "16", height: "16", rx: "2", fill: strokeColor, stroke: strokeColor, "stroke-width": "2" })));
    }
    render() {
        return (h(Host, { key: 'ec214708dd4210e0c36734cb81fba76849114f9b' }, h("div", { key: 'd64bacdb7c50b31f3c460bdf2e939b4159d4d000', class: "fill-row" }, h("button", { key: '812735be08265145a13ab116e7153fd684f8b77f', class: {
                'fill-option': true,
                'selected': this.value === 'transparent',
            }, onClick: () => this.handleFillChange('transparent'), title: "Transparent background" }, this.renderFillIcon('transparent')), h("button", { key: 'cb5caf2db8aece4bef2eebca37e7ac36383bb450', class: {
                'fill-option': true,
                'selected': this.value === 'filled',
            }, onClick: () => this.handleFillChange('filled'), title: "Filled background" }, this.renderFillIcon('filled')))));
    }
};
KritzelShapeFill.style = kritzelShapeFillCss();

export { KritzelShapeFill as kritzel_shape_fill };
//# sourceMappingURL=kritzel-shape-fill.entry.esm.js.map

//# sourceMappingURL=kritzel-shape-fill.entry.js.map