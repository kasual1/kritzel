import { r as registerInstance, a as createEvent, h, d as Host } from './index-BDyeD8t8.js';

const kritzelPillTabsCss = () => `:host{display:block;max-width:100%}.pill-tabs-container{display:inline-flex;align-items:center;gap:4px;padding:4px;max-width:100%;border-radius:var(--kritzel-pill-tabs-border-radius, 10px);background:var(--kritzel-pill-tabs-background, #f0f0f0);box-sizing:border-box}.pill-tab{display:flex;align-items:center;justify-content:center;gap:6px;min-width:0;max-width:100%;padding:8px 16px;border:none;border-radius:var(--kritzel-pill-tabs-tab-border-radius, 8px);background:var(--kritzel-pill-tabs-tab-background, transparent);color:var(--kritzel-pill-tabs-tab-text-color, #666666);font-family:inherit;font-size:14px;font-weight:500;cursor:var(--kritzel-global-pointer-cursor, pointer);transition:background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;white-space:nowrap}.pill-tab:hover:not(.selected){background:var(--kritzel-pill-tabs-tab-background-hover, rgba(0, 0, 0, 0.05))}.pill-tab.selected{background:var(--kritzel-pill-tabs-tab-background-selected, #ffffff);color:var(--kritzel-pill-tabs-tab-text-color-selected, #000000);box-shadow:var(--kritzel-pill-tabs-tab-shadow-selected, 0 1px 3px rgba(0, 0, 0, 0.1))}.pill-tab:focus{outline:none}.pill-tab:focus-visible{box-shadow:0 0 0 2px var(--kritzel-global-focus-ring-color, rgba(0, 122, 255, 0.3))}.pill-tab-label{display:block;min-width:0;max-width:var(--kritzel-pill-tabs-tab-label-max-width, 10rem);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1}.pill-tab kritzel-icon{flex-shrink:0}`;

const KritzelPillTabs = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.valueChange = createEvent(this, "valueChange", 7);
    }
    /**
     * Array of tab definitions to render
     */
    tabs = [];
    /**
     * Currently selected tab ID
     */
    value;
    /**
     * Emitted when the selected tab changes
     */
    valueChange;
    handleTabClick(tabId) {
        if (this.value !== tabId) {
            this.value = tabId;
            this.valueChange.emit(tabId);
        }
    }
    handleKeyDown(event, index) {
        const tabButtons = this.tabs;
        let newIndex = index;
        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                newIndex = index > 0 ? index - 1 : tabButtons.length - 1;
                break;
            case 'ArrowRight':
                event.preventDefault();
                newIndex = index < tabButtons.length - 1 ? index + 1 : 0;
                break;
            case 'Home':
                event.preventDefault();
                newIndex = 0;
                break;
            case 'End':
                event.preventDefault();
                newIndex = tabButtons.length - 1;
                break;
            default:
                return;
        }
        const newTab = tabButtons[newIndex];
        this.handleTabClick(newTab.id);
        // Focus the new tab button
        const container = event.currentTarget;
        const parent = container.parentElement;
        const buttons = parent?.querySelectorAll('button');
        buttons?.[newIndex]?.focus();
    }
    render() {
        return (h(Host, { key: '16fce447fb7db0539ba115ef19771ac78f30a302' }, h("div", { key: '95487da922621b18c1ec422eb0d464131dbc28d3', class: "pill-tabs-container", role: "tablist" }, this.tabs.map((tab, index) => (h("button", { key: tab.id, class: {
                'pill-tab': true,
                'selected': this.value === tab.id,
            }, role: "tab", "aria-selected": this.value === tab.id ? 'true' : 'false', tabIndex: this.value === tab.id ? 0 : -1, onClick: () => this.handleTabClick(tab.id), onKeyDown: (e) => this.handleKeyDown(e, index) }, tab.icon && h("kritzel-icon", { name: tab.icon, size: 16 }), h("span", { class: "pill-tab-label" }, tab.label)))))));
    }
};
KritzelPillTabs.style = kritzelPillTabsCss();

export { KritzelPillTabs as kritzel_pill_tabs };
//# sourceMappingURL=kritzel-pill-tabs.entry.esm.js.map

//# sourceMappingURL=kritzel-pill-tabs.entry.js.map