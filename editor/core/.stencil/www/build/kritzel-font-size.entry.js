import { r as registerInstance, a as createEvent, h, d as Host } from './index-BDyeD8t8.js';

const kritzelFontSizeCss = () => `:host{display:flex;align-items:flex-start;gap:8px;padding:0;box-sizing:border-box}.size-container{display:flex;justify-content:center;align-items:center;width:32px;height:32px;border-radius:4px;cursor:var(--kritzel-global-pointer-cursor, pointer);border:2px solid transparent;box-sizing:border-box;border-radius:50%}.size-container:hover{background-color:var(--kritzel-font-size-hover-background-color, #ebebeb)}.size-container.selected{border-color:var(--kritzel-selection-border-color, #007AFF);background-color:var(--kritzel-font-size-selected-background-color, #e0e0e0)}`;

const KritzelFontSize = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.sizeChange = createEvent(this, "sizeChange", 7);
    }
    sizes = [8, 10, 12, 16, 20, 24];
    selectedSize = null;
    fontFamily = 'Arial';
    sizeChange;
    handleSizeClick(size) {
        this.selectedSize = size;
        this.sizeChange.emit(size);
    }
    handleKeyDown(event, size) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.handleSizeClick(size);
        }
    }
    render() {
        const color = 'var(--kritzel-global-text-primary)';
        const sizes = this.sizes ?? [];
        return (h(Host, { key: 'c9c651548fe820f1703e8d560bde2ed0be368fab' }, sizes.map(size => (h("div", { tabIndex: 0, class: {
                'size-container': true,
                'selected': this.selectedSize === size,
            }, onClick: () => this.handleSizeClick(size), onKeyDown: event => this.handleKeyDown(event, size) }, h("kritzel-font", { fontFamily: this.fontFamily, size: size, color: color }))))));
    }
};
KritzelFontSize.style = kritzelFontSizeCss();

export { KritzelFontSize as kritzel_font_size };
//# sourceMappingURL=kritzel-font-size.entry.esm.js.map

//# sourceMappingURL=kritzel-font-size.entry.js.map