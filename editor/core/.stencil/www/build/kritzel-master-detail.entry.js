import { r as registerInstance, a as createEvent, e as getElement, h, d as Host } from './index-BDyeD8t8.js';

const kritzelMasterDetailCss = () => `:host{display:block;width:100%;height:100%}.master-detail-container{display:flex;width:100%;height:100%;min-height:var(--kritzel-master-detail-min-height, 300px);gap:var(--kritzel-master-detail-gap, 0);background-color:var(--kritzel-master-detail-background-color, transparent)}.master-menu{display:flex;flex-direction:column;width:var(--kritzel-master-detail-menu-width, 200px);min-width:var(--kritzel-master-detail-menu-min-width, 160px);padding:var(--kritzel-master-detail-menu-padding, 8px);background-color:var(--kritzel-master-detail-menu-background-color, #ffffff);border-right:var(--kritzel-master-detail-menu-border-right, 1px solid #ebebeb);gap:var(--kritzel-master-detail-menu-gap, 4px);overflow-y:auto}.menu-item{display:flex;align-items:center;gap:var(--kritzel-master-detail-menu-item-gap, 10px);padding:var(--kritzel-master-detail-menu-item-padding, 10px 12px);border:none;border-radius:var(--kritzel-master-detail-menu-item-border-radius, 6px);background-color:var(--kritzel-master-detail-menu-item-background-color, transparent);color:var(--kritzel-master-detail-menu-item-color, #333333);font-family:inherit;font-size:var(--kritzel-master-detail-menu-item-font-size, 14px);font-weight:var(--kritzel-master-detail-menu-item-font-weight, 400);text-align:left;cursor:var(--kritzel-global-pointer-cursor, pointer);transition:background-color 150ms ease, color 150ms ease;-webkit-tap-highlight-color:transparent}.menu-item:hover:not(.is-disabled){background-color:var(--kritzel-master-detail-menu-item-hover-background-color, #ebebeb)}.menu-item:active:not(.is-disabled){background-color:var(--kritzel-master-detail-menu-item-active-background-color, #e0e0e0)}.menu-item.is-selected{background-color:var(--kritzel-master-detail-menu-item-selected-background-color, #0066cc);color:var(--kritzel-master-detail-menu-item-selected-color, #ffffff);font-weight:var(--kritzel-master-detail-menu-item-selected-font-weight, 500)}.menu-item.is-selected:hover{background-color:var(--kritzel-master-detail-menu-item-selected-hover-background-color, #0052a3)}.menu-item.is-disabled{color:var(--kritzel-master-detail-menu-item-disabled-color, #999999);cursor:not-allowed;opacity:0.6}.menu-item:focus-visible{outline:var(--kritzel-master-detail-menu-item-focus-outline, revert);outline-offset:var(--kritzel-master-detail-menu-item-focus-outline-offset, revert)}.menu-item-icon{flex-shrink:0;display:flex;align-items:center;justify-content:center}.menu-item-label{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.detail-panel{flex:1;min-height:0;padding:var(--kritzel-master-detail-detail-padding, 16px);background-color:var(--kritzel-master-detail-detail-background-color, #ffffff);overflow-y:auto;-webkit-overflow-scrolling:touch;scrollbar-color:var(--kritzel-global-scrollbar-thumb-color, #ebebeb) transparent;scrollbar-width:thin}.detail-panel:focus{outline:none}.detail-panel:focus-visible{outline:var(--kritzel-master-detail-detail-focus-outline, revert);outline-offset:var(--kritzel-master-detail-detail-focus-outline-offset, revert)}.mobile-back-button{display:none;align-items:center;gap:8px;background:none;border:none;padding:0 0 16px 0;cursor:pointer;-webkit-tap-highlight-color:transparent;color:var(--kritzel-master-detail-back-button-color, #333333);font-weight:500;font-size:14px;font-family:inherit}.mobile-back-icon{display:flex;align-items:center;flex-shrink:0}.menu-item-chevron{display:none;flex-shrink:0;margin-left:auto;color:var(--kritzel-master-detail-menu-item-chevron-color, #999999)}.menu-item-chevron svg{width:16px;height:16px;stroke:currentColor}@media (max-width: 768px){.master-menu{width:100%;border-right:none}.detail-panel{display:none;width:100%}.master-detail-container.is-mobile-detail-visible .master-menu{display:none}.master-detail-container.is-mobile-detail-visible .detail-panel{display:block}.mobile-back-button{display:flex}.menu-item.is-selected{background-color:transparent;color:var(--kritzel-master-detail-menu-item-color, #333333);font-weight:var(--kritzel-master-detail-menu-item-font-weight, 400)}.menu-item.is-selected:hover{background-color:var(--kritzel-master-detail-menu-item-hover-background-color, #ebebeb)}.menu-item-chevron{display:flex;align-items:center}}`;

const KritzelMasterDetail = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.itemSelect = createEvent(this, "itemSelect", 7);
    }
    get host() { return getElement(this); }
    /** Array of menu items to display in the master (left) panel */
    items = [];
    /** ID of the currently selected item */
    selectedItemId;
    /** Emitted when an item is selected */
    itemSelect;
    focusedIndex = -1;
    showMobileDetail = false;
    tabRefs = [];
    watchSelectedItemId(newValue, oldValue) {
        if (newValue !== oldValue) {
            this.showMobileDetail = true;
        }
    }
    componentWillRender() {
        this.tabRefs = [];
    }
    handleItemClick = (item) => {
        if (item.disabled)
            return;
        this.itemSelect.emit({ item });
        this.showMobileDetail = true;
    };
    handleBackClick = () => {
        this.showMobileDetail = false;
    };
    handleKeyDown = (event, item, index) => {
        const enabledIndices = this.items
            .map((it, idx) => (!it.disabled ? idx : -1))
            .filter(idx => idx !== -1);
        const currentEnabledIndex = enabledIndices.indexOf(index);
        switch (event.key) {
            case 'ArrowDown': {
                event.preventDefault();
                const nextIndex = enabledIndices[(currentEnabledIndex + 1) % enabledIndices.length];
                this.focusTab(nextIndex);
                break;
            }
            case 'ArrowUp': {
                event.preventDefault();
                const prevIndex = enabledIndices[(currentEnabledIndex - 1 + enabledIndices.length) % enabledIndices.length];
                this.focusTab(prevIndex);
                break;
            }
            case 'Home': {
                event.preventDefault();
                this.focusTab(enabledIndices[0]);
                break;
            }
            case 'End': {
                event.preventDefault();
                this.focusTab(enabledIndices[enabledIndices.length - 1]);
                break;
            }
            case 'Enter':
            case ' ': {
                event.preventDefault();
                this.handleItemClick(item);
                break;
            }
        }
    };
    focusTab(index) {
        this.focusedIndex = index;
        const tab = this.tabRefs[index];
        if (tab) {
            tab.focus();
        }
    }
    handleFocus = (index) => {
        this.focusedIndex = index;
    };
    handleBlur = () => {
        this.focusedIndex = -1;
    };
    setTabRef = (el, index) => {
        if (el) {
            this.tabRefs[index] = el;
        }
    };
    getTabIndex(item, _index) {
        if (item.disabled)
            return -1;
        return 0;
    }
    render() {
        const selectedItem = this.items.find(item => item.id === this.selectedItemId);
        const panelId = 'master-detail-panel';
        const selectedTabId = selectedItem ? `tab-${selectedItem.id}` : undefined;
        return (h(Host, { key: '085975de320a6f9ee92662581e814d99b5a6575f' }, h("div", { key: '93283db69264ce9f569b76ca205dbaef786d3ccb', class: {
                'master-detail-container': true,
                'is-mobile-detail-visible': this.showMobileDetail,
            } }, h("nav", { key: 'b1c708c0e9bf0a61a7a9e08a449d8c34d0389b3c', class: "master-menu", role: "tablist", "aria-orientation": "vertical", "aria-label": "Settings categories" }, this.items.map((item, index) => (h("button", { key: item.id, id: `tab-${item.id}`, ref: el => this.setTabRef(el, index), class: {
                'menu-item': true,
                'is-selected': item.id === this.selectedItemId,
                'is-disabled': !!item.disabled,
                'is-focused': index === this.focusedIndex,
            }, role: "tab", "aria-selected": item.id === this.selectedItemId ? 'true' : 'false', "aria-controls": panelId, "aria-disabled": item.disabled ? 'true' : undefined, tabIndex: this.getTabIndex(item, index), disabled: item.disabled, onClick: () => this.handleItemClick(item), onKeyDown: e => this.handleKeyDown(e, item, index), onFocus: () => this.handleFocus(index), onBlur: this.handleBlur }, item.icon && (h("kritzel-icon", { name: item.icon, size: 20, class: "menu-item-icon" })), h("span", { class: "menu-item-label" }, item.label), h("span", { class: "menu-item-chevron", "aria-hidden": "true" }, h("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.5", "stroke-linecap": "round", "stroke-linejoin": "round" }, h("path", { d: "m9 18 6-6-6-6" }))))))), h("div", { key: 'dc58a0d35c1e94e99d83aaf4e7f62e4b9a9f3bdf', id: panelId, class: "detail-panel", role: "tabpanel", "aria-labelledby": selectedTabId }, h("button", { key: '4325d13434cbe528d3a97fdec4979eaa7967a6ae', class: "mobile-back-button", onClick: this.handleBackClick, "aria-label": "Back to menu" }, h("kritzel-icon", { key: '5094bb6792118d045aa206295ccecae4f4acf688', name: "chevronLeft", size: 20, class: "mobile-back-icon" }), "Back"), h("slot", { key: '0f533d7d2564e3f92ffdeec2392e60df32025926' })))));
    }
    static get watchers() { return {
        "selectedItemId": [{
                "watchSelectedItemId": 0
            }]
    }; }
};
KritzelMasterDetail.style = kritzelMasterDetailCss();

export { KritzelMasterDetail as kritzel_master_detail };
//# sourceMappingURL=kritzel-master-detail.entry.esm.js.map

//# sourceMappingURL=kritzel-master-detail.entry.js.map