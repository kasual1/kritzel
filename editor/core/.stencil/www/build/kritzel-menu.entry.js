import { r as registerInstance, a as createEvent, e as getElement, h, d as Host } from './index-BDyeD8t8.js';

const kritzelMenuCss = () => `:host{position:relative;display:flex;flex-direction:column;font-family:var(--kritzel-menu-font-family, var(--kritzel-global-font-family, sans-serif));background-color:var(--kritzel-menu-background-color, #ffffff);width:var(--kritzel-menu-width, 200px);padding:var(--kritzel-menu-padding, 8px);border-radius:var(--kritzel-menu-border-radius, 12px);box-shadow:var(--kritzel-menu-box-shadow, 0 0 3px rgba(0, 0, 0, 0.08));border:var(--kritzel-menu-border, 1px solid #ebebeb);z-index:2;gap:var(--kritzel-menu-gap, 4px);overflow-y:auto;scrollbar-color:var(--kritzel-global-scrollbar-thumb-color, #ebebeb) transparent;scrollbar-width:thin;max-height:var(--kritzel-portal-max-height, 300px);box-sizing:border-box;-webkit-tap-highlight-color:transparent;outline:none;clip-path:inset(0 round var(--kritzel-menu-border-radius, 12px))}:host:focus-visible{outline:auto}.has-open-child-overlay{position:absolute;top:0;left:0;right:0;bottom:0;z-index:3}`;

const KritzelMenu = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.itemSelect = createEvent(this, "itemSelect", 7);
        this.itemSave = createEvent(this, "itemSave", 7);
        this.itemCancel = createEvent(this, "itemCancel", 7);
        this.itemToggleChildMenu = createEvent(this, "itemToggleChildMenu", 7);
        this.itemCloseChildMenu = createEvent(this, "itemCloseChildMenu", 7);
        this.close = createEvent(this, "close", 7);
    }
    get host() { return getElement(this); }
    items;
    parent = null;
    itemSelect;
    itemSave;
    itemCancel;
    itemToggleChildMenu;
    itemCloseChildMenu;
    close;
    selectedIndex = null;
    async setScrollTop(scrollTop) {
        this.host.scrollTop = scrollTop;
        this.host.scrollTo({ top: scrollTop, behavior: 'auto' });
    }
    async setFocus() {
        const firstItem = this.host.shadowRoot.querySelector('kritzel-menu-item');
        if (firstItem) {
            firstItem.focus();
        }
    }
    get openChildMenuItem() {
        return this.items.find(item => item.isChildMenuOpen);
    }
    get editingMenuItem() {
        return this.items.find(item => item.isEditing);
    }
    onOverlayClick = (event) => {
        event.stopPropagation();
        this.itemCloseChildMenu.emit(this.openChildMenuItem);
    };
    handleItemSelect = (event) => {
        event.stopPropagation();
        this.itemSelect.emit(event.detail);
    };
    handleSave = (event) => {
        event.stopPropagation();
        this.itemSave.emit(event.detail);
    };
    handleCancel = (event) => {
        event.stopPropagation();
        this.itemCancel.emit(event.detail);
    };
    handleToggleChildMenu = (event) => {
        event.stopPropagation();
        this.itemToggleChildMenu.emit(event.detail);
    };
    handleCloseChildMenu = (event) => {
        event.stopPropagation();
        this.itemCloseChildMenu.emit(event.detail);
    };
    render() {
        return (h(Host, { key: 'f9512c13eb4865b9953887d44f08b565eff5a247', tabIndex: 0, onClick: e => e.stopPropagation() }, this.openChildMenuItem && h("div", { key: 'c6dd6edce412716e9f2076670f5ec1eeb8f53dab', class: "has-open-child-overlay", onClick: this.onOverlayClick }), this.items.map(item => (h("kritzel-menu-item", { key: item.id, "data-testid": `menu-item-${item.id}`, item: item, parent: this.parent, style: { pointerEvents: this.editingMenuItem && !item.isEditing ? 'none' : 'auto' }, onItemSelect: this.handleItemSelect, onItemSave: this.handleSave, onItemCancel: this.handleCancel, onItemToggleChildMenu: this.handleToggleChildMenu, onItemCloseChildMenu: this.handleCloseChildMenu })))));
    }
};
KritzelMenu.style = kritzelMenuCss();

export { KritzelMenu as kritzel_menu };
//# sourceMappingURL=kritzel-menu.entry.esm.js.map

//# sourceMappingURL=kritzel-menu.entry.js.map