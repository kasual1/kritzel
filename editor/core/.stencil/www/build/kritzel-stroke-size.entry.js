import { r as registerInstance, a as createEvent, h, d as Host } from './index-BDyeD8t8.js';

const kritzelStrokeSizeCss = () => `:host{display:flex;align-items:flex-start;gap:0;padding:0;width:100%;box-sizing:border-box}.size-grid{width:100%;display:grid;grid-template-columns:repeat(auto-fill, 32px);gap:8px;justify-items:center}.size-container{display:flex;justify-content:center;align-items:center;width:32px;height:32px;border-radius:50%;cursor:var(--kritzel-global-pointer-cursor, pointer);border:2px solid transparent;box-sizing:border-box}.size-container:hover{background-color:var(--kritzel-stroke-size-hover-background-color, #ebebeb)}.size-container.selected{border-color:var(--kritzel-selection-border-color, #007AFF);background-color:var(--kritzel-stroke-size-selected-background-color, #ebebeb)}`;

const KritzelStrokeSize = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.sizeChange = createEvent(this, "sizeChange", 7);
    }
    sizes = [4, 6, 8, 12, 16, 24];
    selectedSize = null;
    sizeChange;
    handleSizeClick(size) {
        this.selectedSize = size;
        this.sizeChange.emit(size);
    }
    render() {
        const sizes = this.sizes ?? [];
        return (h(Host, { key: '826fcdeaedaa3d33be0d6b446941bf92a36b13c3' }, h("div", { key: 'd4fb007d3ad0d31ce4424079ab02a2f4f36b1f61', class: "size-grid" }, sizes.map(size => (h("div", { tabIndex: 0, class: {
                'size-container': true,
                'selected': this.selectedSize === size,
            }, onClick: () => this.handleSizeClick(size) }, h("kritzel-color", { value: 'var(--kritzel-global-text-primary)', size: size })))))));
    }
};
KritzelStrokeSize.style = kritzelStrokeSizeCss();

export { KritzelStrokeSize as kritzel_stroke_size };
//# sourceMappingURL=kritzel-stroke-size.entry.esm.js.map

//# sourceMappingURL=kritzel-stroke-size.entry.js.map