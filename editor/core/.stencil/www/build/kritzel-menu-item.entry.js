import { r as registerInstance, a as createEvent, e as getElement, h, d as Host } from './index-BDyeD8t8.js';
import { w as KritzelDevicesHelper } from './index-BEzQin2J.js';
import './yjs-CvNgPRai.js';

const kritzelMenuItemCss = () => `:host{position:relative;display:flex;align-items:center;justify-content:space-between;width:100%;padding:var(--kritzel-menu-item-padding, 8px);box-sizing:border-box;gap:16px;height:var(--kritzel-menu-item-height, 40px);min-height:var(--kritzel-menu-item-min-height, 40px);font-family:var(--kritzel-menu-font-family, var(--kritzel-global-font-family, sans-serif));font-size:var(--kritzel-menu-item-font-size, 14px);color:var(--kritzel-menu-item-color, #333333);border-radius:var(--kritzel-menu-item-border-radius, 12px);-webkit-tap-highlight-color:transparent}:host:focus:not(:focus-visible){outline:none}:host(:hover) .menu-item-overlay,:host(:focus-within) .menu-item-overlay{background-color:var(--kritzel-menu-item-overlay-background-color, hsl(0, 0%, 0%, 4.3%))}:host(.selected){background-color:var(--kritzel-menu-item-selected-background-color, #007aff);color:var(--kritzel-menu-item-selected-color, #ffffff)}:host(.selected) .action-button{color:var(--kritzel-menu-item-selected-color, #ffffff)}:host(.selected.editing){background-color:var(--kritzel-menu-item-selected-background-color, #007aff)}:host(.selected) .edit-input{color:var(--kritzel-menu-item-selected-color, #ffffff);caret-color:var(--kritzel-menu-item-input-caret-color-on-selected, #ffffff);border-color:var(--kritzel-menu-item-input-border-color-on-selected, #ffffff)}:host(.selected) .action-button kritzel-icon{--kritzel-icon-color:var(--kritzel-menu-item-selected-color, #ffffff)}kritzel-icon{--kritzel-icon-color:var(--kritzel-menu-item-color, #333333)}:host(.selected) kritzel-icon{--kritzel-icon-color:var(--kritzel-menu-item-selected-color, #ffffff)}:host(.selected) .edit-input::selection{background-color:var(--kritzel-menu-item-input-selection-color-on-selected, rgba(255, 255, 255, 0.3));color:var(--kritzel-menu-item-input-selection-text-color-on-selected, #ffffff)}:host(.editing){background-color:var(--kritzel-menu-item-editing-background-color, hsl(0, 0%, 0%, 4.3%))}:host(.disabled){opacity:0.5;pointer-events:none !important}:host(.child-open){background-color:var(--kritzel-menu-item-child-open-background-color, hsl(0, 0%, 0%, 4.3%))}:host(.child-open.selected){background-color:var(--kritzel-menu-item-selected-background-color, #007aff)}.menu-item-overlay{position:absolute;inset:0;background-color:transparent;z-index:0;pointer-events:none;border-radius:var(--kritzel-menu-item-border-radius, 12px)}.menu-item-content{display:flex;align-items:center;gap:8px;position:relative;z-index:1;height:100%}.menu-item-content span{display:flex;align-items:center;line-height:0}.left{justify-content:flex-start;flex:1;min-width:0}.left>div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.right{justify-content:flex-end}.edit-input{flex:1;height:var(--kritzel-menu-item-input-height, 24px);padding:0;background-color:transparent;border-radius:0;border:none;border-bottom:var(--kritzel-menu-item-input-border, 1px solid #ccc);font-size:var(--kritzel-menu-item-font-size, 14px);width:100%;min-width:0;box-sizing:border-box;outline:none;color:inherit}.edit-input{caret-color:var(--kritzel-menu-item-input-caret-color, currentColor)}.edit-input::selection{background-color:var(--kritzel-menu-item-input-selection-color, #007bff);color:var(--kritzel-menu-item-input-selection-text-color, #ffffff)}.action-button{padding:4px;border-radius:8px;border:none;cursor:var(--kritzel-global-pointer-cursor, pointer);display:flex;align-items:center;justify-content:center;background-color:transparent;background:transparent;-webkit-tap-highlight-color:transparent}.action-button:hover,.action-button:focus{background-color:var(--kritzel-menu-item-button-hover-background-color, hsl(0, 0%, 0%, 4.3%))}.action-button.disabled{pointer-events:none;opacity:0.5}`;

const KritzelMenuItem = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.itemSelect = createEvent(this, "itemSelect", 7);
        this.itemSave = createEvent(this, "itemSave", 7);
        this.itemCancel = createEvent(this, "itemCancel", 7);
        this.itemToggleChildMenu = createEvent(this, "itemToggleChildMenu", 7);
        this.itemCloseChildMenu = createEvent(this, "itemCloseChildMenu", 7);
    }
    get host() { return getElement(this); }
    item;
    onItemChange(newValue, oldValue) {
        if (newValue !== oldValue) {
            this.isDirty = false;
        }
    }
    parent = null;
    itemSelect;
    itemSave;
    itemCancel;
    itemToggleChildMenu;
    itemCloseChildMenu;
    isDirty = false;
    inputRef;
    focusInput() {
        if (this.item.isEditing && !this.isDirty) {
            requestAnimationFrame(() => {
                if (this.inputRef) {
                    this.inputRef.focus();
                    if (KritzelDevicesHelper.isIOS()) {
                        const length = this.inputRef.value.length;
                        this.inputRef.setSelectionRange(length, length);
                    }
                    else {
                        this.inputRef.select();
                    }
                }
            });
        }
    }
    componentDidLoad() {
        this.setDeviceSpecificStyles();
        this.focusInput();
    }
    componentDidUpdate() {
        this.focusInput();
    }
    setDeviceSpecificStyles = () => {
        const isTouchDevice = KritzelDevicesHelper.isTouchDevice();
        if (isTouchDevice) {
            this.host.style.setProperty('--kritzel-menu-item-overlay-background-color', 'transparent');
            this.host.style.setProperty('--kritzel-menu-item-button-hover-background-color', 'transparent');
        }
    };
    handleItemSelect = (event) => {
        event.stopPropagation();
        this.itemSelect.emit({ item: this.item, parent: this.parent });
    };
    handleInputChange = (event) => {
        event.stopPropagation();
        const target = event.target;
        this.item.label = target.value;
        this.isDirty = true;
    };
    handleSave = (event) => {
        event.stopPropagation();
        this.host.focus();
        this.itemSave.emit(this.item);
    };
    handleCancel = (event) => {
        event.stopPropagation();
        this.host.focus();
        this.itemCancel.emit(this.item);
    };
    handleMenuToggle = (event) => {
        event.stopPropagation();
        this.itemToggleChildMenu.emit({ item: this.item, childMenuAnchor: event.target });
    };
    handleMenuClose = () => {
        this.itemCloseChildMenu.emit(this.item);
    };
    renderViewMode() {
        const childMenuTag = ['kritzel', 'menu'].join('-');
        return [
            h("div", { class: "menu-item-content left" }, this.item.icon && (h("span", { title: this.item.iconTooltip }, h("kritzel-icon", { name: this.item.icon, size: 16, style: this.item.color ? { '--kritzel-icon-color': this.item.color } : undefined }))), h("div", { style: this.item.color ? { color: this.item.color } : undefined }, this.item.label)),
            h("div", { class: "menu-item-content right" }, this.item.children &&
                this.item.children.length > 0 && [
                h("button", { id: "child-menu-toggle", class: "action-button", onClick: this.handleMenuToggle, disabled: this.item.isDisabled }, h("kritzel-icon", { name: "ellipsisVertical", size: 16 })),
                h("kritzel-portal", { anchor: this.item.childMenuAnchor, offsetY: 4, onClose: this.handleMenuClose }, h(childMenuTag, {
                    items: this.item.children,
                    parent: this.item,
                    onItemSelect: event => this.itemSelect.emit(event.detail),
                    onItemSave: event => this.itemSave.emit(event.detail),
                    onItemCancel: event => this.itemCancel.emit(event.detail),
                    onClose: this.handleMenuClose,
                })),
            ]),
        ];
    }
    renderEditMode() {
        return [
            h("div", { class: "menu-item-content left" }, h("input", { ref: el => (this.inputRef = el), type: "text", class: "edit-input", value: this.item.label, onInput: this.handleInputChange })),
            h("div", { class: "menu-item-content right" }, h("div", { tabIndex: 0, class: "action-button", onClick: this.handleCancel }, h("kritzel-icon", { name: "x", size: 16 })), h("div", { tabIndex: !this.isDirty && !this.item.isNewItem ? -1 : 0, class: { 'action-button': true, 'disabled': !this.isDirty && !this.item.isNewItem }, onClick: this.handleSave }, h("kritzel-icon", { name: "check", size: 16 }))),
        ];
    }
    render() {
        return (h(Host, { key: '886a43997e4b05a02ff66fae7bf8e3dc33a50ca8', tabIndex: this.item.isDisabled ? -1 : 0, class: {
                'selected': this.item.isSelected,
                'editing': this.item.isEditing,
                'disabled': this.item.isDisabled,
                'child-open': this.item.isChildMenuOpen,
            }, onClick: this.handleItemSelect }, h("div", { key: '1f30e3c16315e2214340467b34a426de84bd0c9e', class: "menu-item-overlay" }), this.item.isEditing ? this.renderEditMode() : this.renderViewMode()));
    }
    static get watchers() { return {
        "item": [{
                "onItemChange": 0
            }]
    }; }
};
KritzelMenuItem.style = kritzelMenuItemCss();

export { KritzelMenuItem as kritzel_menu_item };
//# sourceMappingURL=kritzel-menu-item.entry.esm.js.map

//# sourceMappingURL=kritzel-menu-item.entry.js.map