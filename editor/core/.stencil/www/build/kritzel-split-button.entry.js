import { r as registerInstance, a as createEvent, e as getElement, h, d as Host } from './index-BDyeD8t8.js';
import { w as KritzelDevicesHelper } from './index-BEzQin2J.js';
import './yjs-CvNgPRai.js';

const kritzelSplitButtonCss = () => `:host{position:relative;display:flex;align-items:center;font-family:sans-serif;z-index:1;padding:var(--kritzel-split-button-padding, 4px);background-color:var(--kritzel-split-button-background-color, #ffffff);border-radius:var(--kritzel-split-button-border-radius, 12px);box-shadow:var(--kritzel-split-button-box-shadow, 0 0 3px rgba(0, 0, 0, 0.08));border:var(--kritzel-split-button-border, 1px solid #ebebeb);gap:var(--kritzel-split-button-gap, 4px)}:host(.mobile){--kritzel-split-button-hover-background-color:transparent}button{border:none;background-color:transparent;padding:0;margin:0;font-family:inherit;font-size:inherit;color:var(--kritzel-split-button-color, #000000);-webkit-appearance:none;-moz-appearance:none;appearance:none;cursor:var(--kritzel-global-pointer-cursor, pointer);text-align:center;display:flex;align-items:center;justify-content:center;pointer-events:all;-webkit-tap-highlight-color:transparent}.split-main-button,.split-menu-button{height:auto;display:flex;align-items:center;padding:var(--kritzel-split-button-padding, 8px);background-color:var(--kritzel-split-button-background-color, #ffffff);border-radius:var(--kritzel-split-button-border-radius, 12px);font-size:var(--kritzel-split-button-font-size, 14px)}.split-main-button:hover,.split-menu-button:hover{background-color:var(--kritzel-split-button-hover-background-color, hsl(0, 0%, 0%, 4.3%))}.split-main-button:focus,.split-menu-button:focus{background-color:var(--kritzel-split-button-hover-background-color, hsl(0, 0%, 0%, 4.3%))}.split-main-button{gap:var(--kritzel-split-button-gap, 4px)}.split-menu-button{border-left:none;justify-content:center}.split-divider{width:var(--kritzel-split-button-divider-width, 1px);height:24px;background-color:var(--kritzel-split-button-divider-background-color, hsl(0, 0%, 0%, 4.3%))}:disabled{pointer-events:none;opacity:0.5}`;

const KritzelSplitButton = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.mainButtonClick = createEvent(this, "mainButtonClick", 7);
        this.itemSelect = createEvent(this, "itemSelect", 7);
        this.itemSave = createEvent(this, "itemSave", 7);
        this.itemCancel = createEvent(this, "itemCancel", 7);
        this.itemToggleChildMenu = createEvent(this, "itemToggleChildMenu", 7);
        this.itemCloseChildMenu = createEvent(this, "itemCloseChildMenu", 7);
        this.menuOpen = createEvent(this, "menuOpen", 7);
        this.menuClose = createEvent(this, "menuClose", 7);
    }
    get host() { return getElement(this); }
    buttonIcon = 'plus';
    dropdownIcon = 'chevronDown';
    items = [];
    mainButtonDisabled = false;
    menuButtonDisabled = false;
    mainButtonClick;
    itemSelect;
    itemSave;
    itemCancel;
    itemToggleChildMenu;
    itemCloseChildMenu;
    menuOpen;
    menuClose;
    isMenuOpen = false;
    isTouchDevice = KritzelDevicesHelper.isTouchDevice();
    anchorElement;
    menuScrollTop = 0;
    splitMenuButtonRef;
    menuRef;
    async open() {
        if (this.isMenuOpen)
            return;
        window.dispatchEvent(new CustomEvent('kritzel-dismiss-menus'));
        this.isMenuOpen = true;
        this.anchorElement = this.host;
        this.menuOpen.emit();
    }
    async close() {
        this.closeMenu();
    }
    async focusMenu() {
        if (this.menuRef) {
            await this.menuRef.setFocus();
        }
    }
    handleButtonClick = (event) => {
        event.stopPropagation();
        this.mainButtonClick.emit();
    };
    toggleMenu = (event) => {
        event.stopPropagation();
        if (this.isMenuOpen) {
            this.closeMenu();
        }
        else {
            this.openMenu(event);
        }
    };
    openMenu = (event) => {
        event.stopPropagation();
        window.dispatchEvent(new CustomEvent('kritzel-dismiss-menus'));
        this.isMenuOpen = true;
        this.anchorElement = this.host;
        this.menuOpen.emit();
        requestAnimationFrame(() => {
            this.menuRef?.setScrollTop(this.menuScrollTop);
        });
    };
    closeMenu = () => {
        this.isMenuOpen = false;
        this.anchorElement = null;
        this.splitMenuButtonRef?.blur();
        this.menuClose.emit();
    };
    handleItemSelect = event => {
        this.itemSelect.emit(event.detail);
    };
    handleItemSave = event => {
        this.itemSave.emit(event.detail);
    };
    handleItemCancel = event => {
        this.itemCancel.emit(event.detail);
    };
    handleItemToggleChildMenu = event => {
        this.itemToggleChildMenu.emit(event.detail);
    };
    handleItemCloseChildMenu = event => {
        this.itemCloseChildMenu.emit(event.detail);
    };
    handleScroll = event => {
        this.menuScrollTop = event.target.scrollTop;
    };
    render() {
        return (h(Host, { key: 'd37803c0543eedf3086e7007f6d5d8f8f9951bcf', class: { mobile: this.isTouchDevice } }, h("button", { key: 'd0f105289954f45e3c8597fcdc27480fb80e8c6e', class: "split-main-button", tabIndex: 0, onClick: this.handleButtonClick, disabled: this.mainButtonDisabled, "aria-label": "Main action" }, this.buttonIcon && h("kritzel-icon", { key: '9859809c7dd03dee5ea33a785f64ca03a653dbe6', name: this.buttonIcon })), h("div", { key: '77988d446448c8e690dd8b4fa14363dc5a6fec79', class: "split-divider" }), h("button", { key: '12d60dae86e7a13f0738da91c1454b6698f0b7ba', ref: el => (this.splitMenuButtonRef = el), class: "split-menu-button", tabIndex: 0, onClick: this.toggleMenu, disabled: this.menuButtonDisabled, "aria-label": "Open menu" }, h("kritzel-icon", { key: 'ecbac9fc5313d03e76b400f10662630c3e302ae2', name: this.dropdownIcon })), h("kritzel-portal", { key: '51d000358bbe8d4f68c7235bff9d42fcbef050fb', anchor: this.anchorElement, offsetY: 4, onClose: this.closeMenu }, h("kritzel-menu", { key: '41f6c7a793a1c1f08cb71842b7d8c29f92c9b322', ref: el => (this.menuRef = el), items: this.items, onItemSelect: this.handleItemSelect, onItemSave: this.handleItemSave, onItemCancel: this.handleItemCancel, onItemToggleChildMenu: this.handleItemToggleChildMenu, onItemCloseChildMenu: this.handleItemCloseChildMenu, onClose: this.closeMenu, onScroll: this.handleScroll }))));
    }
};
KritzelSplitButton.style = kritzelSplitButtonCss();

export { KritzelSplitButton as kritzel_split_button };
//# sourceMappingURL=kritzel-split-button.entry.esm.js.map

//# sourceMappingURL=kritzel-split-button.entry.js.map