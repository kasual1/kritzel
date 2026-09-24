import { r as registerInstance, a as createEvent, h, d as Host } from './index-BDyeD8t8.js';
import { B as KritzelColorHelper } from './index-BEzQin2J.js';
import './yjs-CvNgPRai.js';

const kritzelColorPaletteCss = () => `:host{display:flex;align-items:flex-start;gap:8px;padding:0;width:100%;box-sizing:border-box}.color-grid{width:100%;display:grid;grid-template-columns:repeat(6, 32px);gap:8px;justify-items:center;overflow:hidden;height:40px;transition:height 0.1s ease-in-out}.color-grid.expanded{height:500px}.color-container{display:flex;justify-content:center;align-items:center;width:32px;height:32px;border-radius:50%;cursor:var(--kritzel-global-pointer-cursor, pointer);border:2px solid transparent;box-sizing:border-box}.color-container:hover{background-color:var(--kritzel-color-palette-hover-background-color, #ebebeb)}.color-container.selected{border-color:var(--kritzel-selection-border-color, #007AFF);background-color:var(--kritzel-color-palette-selected-background-color)}`;

const KritzelColorPalette = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.colorChange = createEvent(this, "colorChange", 7);
    }
    colors = [];
    selectedColor = null;
    isExpanded = false;
    isOpaque = false;
    opacity = 1;
    theme;
    colorChange;
    handleColorClick(color) {
        this.selectedColor = color;
        this.colorChange.emit(color);
    }
    handleKeyDown(event, color) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.handleColorClick(color);
        }
    }
    calculateHeight() {
        const colorsPerRow = 6;
        const rowHeight = 32;
        const gap = 8;
        const rowCount = Math.ceil(this.colors.length / colorsPerRow);
        return `${rowCount * rowHeight + (rowCount - 1) * gap}px`;
    }
    areColorsEqual(color1, color2) {
        if (!color1)
            return false;
        return color1.light === color2.light && color1.dark === color2.dark;
    }
    render() {
        const displayedColors = this.isExpanded ? this.colors : this.colors.slice(0, 6);
        const expandedHeight = this.isExpanded ? this.calculateHeight() : '32px';
        return (h(Host, { key: '4d04acd9a67ac1c302bd0ded5fdfe431d0cacf26' }, h("div", { key: 'bb873b67d0e4f05353af87e1518df9525d20a28b', class: {
                'color-grid': true,
                'expanded': this.isExpanded,
            }, style: {
                height: expandedHeight,
            } }, displayedColors.map(color => {
            return (h("div", { tabIndex: 0, class: {
                    'color-container': true,
                    'selected': this.areColorsEqual(this.selectedColor, color),
                }, onClick: () => this.handleColorClick(color), onKeyDown: event => this.handleKeyDown(event, color) }, h("kritzel-color", { value: KritzelColorHelper.applyOpacity(color, this.opacity, this.theme), theme: this.theme })));
        }))));
    }
};
KritzelColorPalette.style = kritzelColorPaletteCss();

export { KritzelColorPalette as kritzel_color_palette };
//# sourceMappingURL=kritzel-color-palette.entry.esm.js.map

//# sourceMappingURL=kritzel-color-palette.entry.js.map