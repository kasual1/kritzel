import { r as registerInstance, h, d as Host } from './index-BDyeD8t8.js';

const kritzelFontCss = () => `:host{display:block}.font-preview{color:var(--kritzel-font-size-text-color, #333333);line-height:1;text-align:center;font-weight:bold}`;

const KritzelFont = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
    }
    fontFamily = 'Arial, sans-serif';
    size = 24;
    color = '#000000';
    render() {
        return (h(Host, { key: 'b594153b199a9ed859b0b74dccaa8f242f6e388d' }, h("div", { key: 'f1888af3f0342a38c3d5a887ef66adef63b35a87', class: "font-preview", style: {
                fontFamily: this.fontFamily,
                fontSize: `${this.size}px`,
                color: this.color
            } }, "A")));
    }
};
KritzelFont.style = kritzelFontCss();

export { KritzelFont as kritzel_font };
//# sourceMappingURL=kritzel-font.entry.esm.js.map

//# sourceMappingURL=kritzel-font.entry.js.map