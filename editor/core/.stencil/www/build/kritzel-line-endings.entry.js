import { r as registerInstance, a as createEvent, h, d as Host } from './index-BDyeD8t8.js';

const kritzelLineEndingsCss = () => `:host{display:flex;flex-direction:column;gap:12px;padding:0;box-sizing:border-box}.endings-section{display:flex;flex-direction:column;gap:6px}.section-label{font-size:12px;font-weight:500;color:var(--kritzel-line-endings-label-color, #666666);padding-left:4px}.endings-row{display:flex;align-items:center;gap:4px}.ending-option{display:flex;justify-content:center;align-items:center;width:48px;height:32px;border-radius:6px;cursor:var(--kritzel-global-pointer-cursor, pointer);border:2px solid transparent;box-sizing:border-box;background:var(--kritzel-line-endings-option-background, #ffffff);padding:4px;transition:background-color 0.15s ease, border-color 0.15s ease}.ending-option:hover{background-color:var(--kritzel-line-endings-hover-background-color, #ebebeb)}.ending-option.selected{border-color:var(--kritzel-selection-border-color, #007AFF);background-color:var(--kritzel-line-endings-selected-background-color, #ebebeb)}.ending-option:focus{outline:none;box-shadow:0 0 0 2px var(--kritzel-global-focus-ring-color, rgba(0, 122, 255, 0.3))}.ending-icon{width:100%;height:100%}`;

const KritzelLineEndings = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.valueChange = createEvent(this, "valueChange", 7);
    }
    /** Available ending styles */
    styles = ['none', 'triangle'];
    /** Current line arrow configuration */
    value;
    valueChange;
    getStartEnding() {
        if (!this.value?.start?.enabled)
            return 'none';
        return this.value.start.style ?? 'triangle';
    }
    getEndEnding() {
        if (!this.value?.end?.enabled)
            return 'none';
        return this.value.end.style ?? 'triangle';
    }
    handleStartChange(type) {
        const newValue = {
            ...this.value,
            start: type === 'none'
                ? { enabled: false }
                : { enabled: true, style: type },
        };
        this.value = newValue;
        this.valueChange.emit(newValue);
    }
    handleEndChange(type) {
        const newValue = {
            ...this.value,
            end: type === 'none'
                ? { enabled: false }
                : { enabled: true, style: type },
        };
        this.value = newValue;
        this.valueChange.emit(newValue);
    }
    getEndingPath(type) {
        switch (type) {
            case 'triangle':
                return 'M 0 0 L 10 5 L 0 10 Z';
            case 'open':
                return 'M 0 0 L 10 5 L 0 10';
            case 'diamond':
                return 'M 0 5 L 5 0 L 10 5 L 5 10 Z';
            case 'circle':
                return 'M 10 5 A 5 5 0 1 1 0 5 A 5 5 0 1 1 10 5 Z';
            default:
                return '';
        }
    }
    renderEndingIcon(type, isStart) {
        const color = 'var(--kritzel-global-text-primary)';
        if (type === 'none') {
            return (h("svg", { viewBox: "0 0 24 12", class: "ending-icon" }, h("line", { x1: isStart ? 4 : 2, y1: "6", x2: isStart ? 22 : 20, y2: "6", stroke: color, "stroke-width": "2", "stroke-linecap": "round" })));
        }
        const path = this.getEndingPath(type);
        const isOpenStyle = type === 'open';
        return (h("svg", { viewBox: "0 0 24 12", class: "ending-icon" }, isStart ? (
        // Start arrow points left
        h("g", null, h("line", { x1: "12", y1: "6", x2: "22", y2: "6", stroke: color, "stroke-width": "2", "stroke-linecap": "round" }), h("g", { transform: "translate(2, 1) scale(1, 1)" }, h("path", { d: path, fill: isOpenStyle ? 'none' : color, stroke: color, "stroke-width": isOpenStyle ? 2 : 0, "stroke-linecap": "round", "stroke-linejoin": "round", transform: "scale(-1, 1) translate(-10, 0)" })))) : (
        // End arrow points right
        h("g", null, h("line", { x1: "2", y1: "6", x2: "12", y2: "6", stroke: color, "stroke-width": "2", "stroke-linecap": "round" }), h("g", { transform: "translate(12, 1)" }, h("path", { d: path, fill: isOpenStyle ? 'none' : color, stroke: color, "stroke-width": isOpenStyle ? 2 : 0, "stroke-linecap": "round", "stroke-linejoin": "round" }))))));
    }
    render() {
        const startEnding = this.getStartEnding();
        const endEnding = this.getEndEnding();
        return (h(Host, { key: '580845b2a1bea69bb5c7854ccd1dbb09056f959c' }, h("div", { key: '7cf27d1e567f5c5320b6a78e06acf59b59a05a9c', class: "endings-section" }, h("div", { key: '0b3ef9a2fe9d4eecc7641bd197191143a7fd1fee', class: "endings-row" }, this.styles.map(type => (h("button", { class: {
                'ending-option': true,
                'selected': startEnding === type,
            }, onClick: () => this.handleStartChange(type), title: type === 'none' ? 'No start arrow' : `${type} start arrow` }, this.renderEndingIcon(type, true)))))), h("div", { key: '536f00524bddb99c06407df4616f1a63a82d4fb9', class: "endings-section" }, h("div", { key: 'd1ac8f88a9bee0432def20e0182aeeacd739de83', class: "endings-row" }, this.styles.map(type => (h("button", { class: {
                'ending-option': true,
                'selected': endEnding === type,
            }, onClick: () => this.handleEndChange(type), title: type === 'none' ? 'No end arrow' : `${type} end arrow` }, this.renderEndingIcon(type, false))))))));
    }
};
KritzelLineEndings.style = kritzelLineEndingsCss();

export { KritzelLineEndings as kritzel_line_endings };
//# sourceMappingURL=kritzel-line-endings.entry.esm.js.map

//# sourceMappingURL=kritzel-line-endings.entry.js.map