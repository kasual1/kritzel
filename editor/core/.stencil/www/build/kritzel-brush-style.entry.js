import { r as registerInstance, a as createEvent, h, d as Host } from './index-BDyeD8t8.js';

const kritzelBrushStyleCss = () => `:host{display:flex;align-items:flex-start;gap:8px;padding:8px;box-sizing:border-box;width:100%}.brush-style-button{display:flex;justify-content:center;align-items:center;width:42px;height:32px;padding:0;border:none;outline:none;background:none;border-radius:0;color:var(--control-text-color);font-weight:bold;-webkit-tap-highlight-color:transparent}.font-style-button:not(:last-child){border-right:1px solid #333333}.font-style-button:hover{background-color:var(--control-hover-bg)}.font-style-button:active{background-color:var(--control-active-bg)}.font-style-button.selected,.font-style-button.selected:hover,.font-style-button.selected:active{background-color:var(--control-selected-bg);color:var(--control-selected-color)}`;

const KritzelBrushStyle = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.typeChange = createEvent(this, "typeChange", 7);
    }
    type = 'pen';
    brushOptions = [
        { value: 'pen', label: 'Pen' },
        { value: 'highlighter', label: 'Highlighter' },
    ];
    typeChange;
    handleDropdownValueChange(event) {
        this.typeChange.emit(event.detail);
    }
    render() {
        const dropdownOptions = this.brushOptions.map(option => ({
            value: option.value,
            label: option.label,
        }));
        return (h(Host, { key: '51a7f84685032fd8fc967b22bee7c0711e811a54' }, h("kritzel-dropdown", { key: 'e49d7062c695458d345738d88a0adfc96b575e61', options: dropdownOptions, value: this.type, onValueChanged: event => this.handleDropdownValueChange(event) }, h("button", { key: 'ebbbf1a55b89e91012ca44c5cf30acfb77332b50', class: "brush-style-button", slot: "prefix" }, h("kritzel-icon", { key: 'dae002c9ab5e3486c726202426eb076a8f33b109', name: this.type, size: 16 })))));
    }
};
KritzelBrushStyle.style = kritzelBrushStyleCss();

export { KritzelBrushStyle as kritzel_brush_style };
//# sourceMappingURL=kritzel-brush-style.entry.esm.js.map

//# sourceMappingURL=kritzel-brush-style.entry.js.map