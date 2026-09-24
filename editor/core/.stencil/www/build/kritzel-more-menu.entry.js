import { r as registerInstance, a as createEvent, e as getElement, h, d as Host } from './index-BDyeD8t8.js';
import { w as KritzelDevicesHelper } from './index-BEzQin2J.js';
import './yjs-CvNgPRai.js';

const kritzelMoreMenuCss = () => `:host{display:inline-flex;z-index:1}.more-menu-wrapper{display:inline-flex;padding:var(--kritzel-more-menu-padding, 4px);background-color:var(--kritzel-more-menu-background-color, #ffffff);border-radius:var(--kritzel-more-menu-border-radius, 12px);box-shadow:var(--kritzel-more-menu-box-shadow, 0 0 3px rgba(0, 0, 0, 0.08));border:var(--kritzel-more-menu-border, 1px solid #ebebeb);opacity:0;pointer-events:none;transition:opacity 0.2s ease-out}.more-menu-wrapper.visible{opacity:1;pointer-events:auto}:host(.mobile){--kritzel-more-menu-button-hover-background-color:transparent;--kritzel-more-menu-button-active-background-color:transparent}.more-menu-button{display:flex;align-items:center;justify-content:center;width:var(--kritzel-more-menu-button-width, 40px);height:var(--kritzel-more-menu-button-height, 40px);padding:0;border:none;border-radius:var(--kritzel-more-menu-inner-border-radius, 12px);background-color:transparent;cursor:var(--kritzel-global-pointer-cursor, pointer);box-shadow:none;transition:background-color 150ms ease;-webkit-tap-highlight-color:transparent;-webkit-appearance:none;-moz-appearance:none;appearance:none;color:var(--kritzel-more-menu-button-color, currentColor)}.more-menu-button:hover{background-color:var(--kritzel-more-menu-button-hover-background-color, hsl(0, 0%, 0%, 4.3%))}.more-menu-button:focus-visible{background-color:var(--kritzel-more-menu-button-hover-background-color, hsl(0, 0%, 0%, 4.3%))}.more-menu-button:active{background-color:var(--kritzel-more-menu-button-active-background-color, hsl(0, 0%, 0%, 4.3%))}`;

const KritzelMoreMenu = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.itemSelect = createEvent(this, "itemSelect", 7);
    }
    get host() { return getElement(this); }
    /**
     * Whether the menu button is visible
     */
    visible = false;
    /**
     * The menu items to display in the dropdown.
     * Items with `isVisible` set to `false` will be filtered out.
     * Items with an `action` will have that action invoked on selection.
     */
    items = [];
    /**
     * The icon to display on the button
     */
    icon = 'ellipsisVertical';
    /**
     * The size of the icon
     */
    iconSize = 24;
    /**
     * Offset Y for the portal positioning
     */
    offsetY = 4;
    /** Resolved localized strings keyed by term key, supplied by the editor. */
    terms = {};
    /**
     * Emitted when a menu item is selected
     */
    itemSelect;
    menuAnchor = null;
    isTouchDevice = KritzelDevicesHelper.isTouchDevice();
    visibleItems = [];
    visibilityResolveVersion = 0;
    onItemsChange() {
        void this.resolveVisibleItems();
    }
    async open() {
        if (!this.visible || this.menuAnchor) {
            return;
        }
        window.dispatchEvent(new CustomEvent('kritzel-dismiss-menus'));
        this.menuAnchor = this.host;
        this.visibleItems = this.filterVisibleItemsSync(this.items ?? []);
        await this.resolveVisibleItems();
    }
    async close() {
        this.closeMenu();
    }
    componentWillLoad() {
        void this.resolveVisibleItems();
    }
    toggleMenu = (event) => {
        event.stopPropagation();
        if (this.menuAnchor) {
            this.closeMenu();
        }
        else {
            void this.open();
        }
    };
    closeMenu = () => {
        this.menuAnchor = null;
    };
    async evaluateVisibility(visibility) {
        if (typeof visibility === 'function') {
            try {
                return (await visibility()) !== false;
            }
            catch {
                return false;
            }
        }
        return visibility !== false;
    }
    evaluateVisibilitySync(visibility) {
        if (typeof visibility === 'function') {
            try {
                const result = visibility();
                return result instanceof Promise ? null : result !== false;
            }
            catch {
                return false;
            }
        }
        return visibility !== false;
    }
    filterVisibleItemsSync(items) {
        return items.reduce((visibleItems, item) => {
            const isVisible = this.evaluateVisibilitySync(item.isVisible);
            if (isVisible === null || !isVisible) {
                return visibleItems;
            }
            if (!item.children?.length) {
                visibleItems.push(item);
                return visibleItems;
            }
            visibleItems.push({
                ...item,
                children: this.filterVisibleItemsSync(item.children),
            });
            return visibleItems;
        }, []);
    }
    async filterVisibleItems(items) {
        const resolved = await Promise.all(items.map(async (item) => {
            const isVisible = await this.evaluateVisibility(item.isVisible);
            if (!isVisible) {
                return null;
            }
            if (!item.children?.length) {
                return item;
            }
            return {
                ...item,
                children: await this.filterVisibleItems(item.children),
            };
        }));
        return resolved.filter((item) => !!item);
    }
    async resolveVisibleItems() {
        const version = ++this.visibilityResolveVersion;
        const items = this.items ?? [];
        const resolvedItems = await this.filterVisibleItems(items);
        if (version !== this.visibilityResolveVersion) {
            return;
        }
        this.visibleItems = resolvedItems;
    }
    resolveMenuLabels(items) {
        return items.map(item => ({
            ...item,
            label: this.terms[item.label] ?? item.label,
            children: item.children ? this.resolveMenuLabels(item.children) : undefined,
        }));
    }
    handleMenuItemSelect = (event) => {
        const { item, parent } = event.detail;
        if (item.action) {
            item.action(item, parent);
        }
        this.itemSelect.emit(event.detail);
        this.closeMenu();
    };
    render() {
        return (h(Host, { key: 'd567327e13cfe39c5036f1679007b2d9cc39b4dc', class: { mobile: this.isTouchDevice }, style: { display: this.visible ? '' : 'none' } }, h("div", { key: '626530dba925858180e98bdbf026ff274f17e923', class: { 'more-menu-wrapper': true, visible: this.visible } }, h("button", { key: 'c4acc3e629e92eb55a4034dd8fb395670cd43ff1', class: "more-menu-button", "data-testid": "more-menu-button", onClick: this.toggleMenu, "aria-label": this.terms['moreMenu.ariaLabel'] ?? 'More options' }, h("kritzel-icon", { key: '9cce9c8f7514b48ae227f7f1a475a8c7e978287e', name: this.icon, size: this.iconSize })), h("kritzel-portal", { key: 'adb6a8a3ec6698c6b440b21be4ade6456e77d727', anchor: this.menuAnchor, offsetY: this.offsetY, onClose: this.closeMenu }, h("kritzel-menu", { key: '1cf729986445a7fcec6087e0b90ed209b1590777', items: this.resolveMenuLabels(this.visibleItems), onItemSelect: this.handleMenuItemSelect })))));
    }
    static get watchers() { return {
        "items": [{
                "onItemsChange": 0
            }]
    }; }
};
KritzelMoreMenu.style = kritzelMoreMenuCss();

export { KritzelMoreMenu as kritzel_more_menu };
//# sourceMappingURL=kritzel-more-menu.entry.esm.js.map

//# sourceMappingURL=kritzel-more-menu.entry.js.map