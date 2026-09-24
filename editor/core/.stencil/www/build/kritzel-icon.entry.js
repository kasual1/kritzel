import { r as registerInstance, f as forceUpdate, h, d as Host } from './index-BDyeD8t8.js';
import { K as KritzelIconRegistry } from './icon-registry.class-CJ-htASr.js';

const kritzelIconCss = () => `:host{display:inline-flex;justify-content:center;align-items:center;color:var(--kritzel-icon-color, inherited)}span{display:flex;align-items:center;width:100%;height:100%;}span>svg{width:100%;height:100%}`;

const KritzelIcon = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
    }
    name;
    label;
    size = 24;
    unsubscribe;
    connectedCallback() {
        this.unsubscribe?.();
        this.unsubscribe = KritzelIconRegistry.subscribe(name => {
            if (name === this.name) {
                forceUpdate(this);
            }
        });
        forceUpdate(this);
    }
    disconnectedCallback() {
        this.unsubscribe?.();
        this.unsubscribe = undefined;
    }
    render() {
        const svgContent = KritzelIconRegistry.get(this.name);
        if (!svgContent) {
            console.error(`[kritzel-icon] Icon "${this.name}" not found in registry.`);
            return h("span", { class: "error-icon", "aria-label": `Error: Icon ${this.name} not found` }, "?");
        }
        const styles = {
            width: `${this.size}px`,
            height: `${this.size}px`,
        };
        return (h(Host, { style: styles }, h("span", { "aria-hidden": !this.label, role: this.label ? 'img' : undefined, "aria-label": this.label, innerHTML: svgContent })));
    }
};
KritzelIcon.style = kritzelIconCss();

export { KritzelIcon as kritzel_icon };
//# sourceMappingURL=kritzel-icon.entry.esm.js.map

//# sourceMappingURL=kritzel-icon.entry.js.map