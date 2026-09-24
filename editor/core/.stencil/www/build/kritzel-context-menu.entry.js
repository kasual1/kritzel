import { r as registerInstance, a as createEvent, e as getElement, h, d as Host } from './index-BDyeD8t8.js';

const kritzelContextMenuCss = () => `:host{display:block}.menu-container{position:relative;z-index:1;display:flex;flex-direction:column;gap:var(--kritzel-context-menu-item-spacing, 2px);background-color:var(--kritzel-context-menu-background-color, #ffffff);border-radius:var(--kritzel-context-menu-border-radius, 12px);box-shadow:var(--kritzel-context-menu-box-shadow, 0 1px 6px rgba(0, 0, 0, 0.12));border:var(--kritzel-context-menu-border, 1px solid #ebebeb);padding:var(--kritzel-context-menu-padding, 4px);min-width:var(--kritzel-context-menu-min-width, 140px)}.menu-item-wrapper{position:relative}.menu-item{display:flex;align-items:center;gap:var(--kritzel-context-menu-item-gap, 8px);font-family:var(--kritzel-context-menu-font-family, var(--kritzel-global-font-family, sans-serif));background:none;border:none;text-align:left;padding:var(--kritzel-context-menu-item-padding, 8px);border-radius:var(--kritzel-context-menu-item-border-radius, 12px);cursor:var(--kritzel-global-pointer-cursor, pointer);font-size:var(--kritzel-context-menu-item-font-size, 14px);color:var(--kritzel-context-menu-item-color, #333333);white-space:nowrap;-webkit-tap-highlight-color:transparent;width:100%;min-width:0}.menu-item:not(.disabled):hover,.menu-item.submenu-open{background-color:var(--kritzel-context-menu-item-hover-background-color, hsl(0, 0%, 0%, 4.3%))}.menu-item:not(.disabled):active{background-color:var(--kritzel-context-menu-item-active-background-color, hsl(0, 0%, 0%, 8.6%))}.menu-item.disabled{color:var(--kritzel-context-menu-item-disabled-color, #aaaaaa)}.menu-item.has-children.disabled{cursor:var(--kritzel-global-pointer-cursor, pointer);color:var(--kritzel-context-menu-item-color, #333333)}.menu-item kritzel-icon{opacity:0.8;flex-shrink:0}.menu-item.disabled kritzel-icon{opacity:0.4}.menu-item.has-children.disabled kritzel-icon{opacity:0.8}.label{flex-grow:1;min-width:0;overflow:hidden;text-overflow:ellipsis}.submenu-arrow{margin-left:auto;opacity:0.5}.menu-divider{height:1px;background-color:var(--kritzel-context-menu-divider-color, rgba(0, 0, 0, 0.1));margin:var(--kritzel-context-menu-divider-margin, 4px 8px)}.submenu-container{position:absolute;top:0;left:100%;z-index:2;margin-left:4px;display:flex;flex-direction:column;gap:var(--kritzel-context-menu-item-spacing, 2px);background-color:var(--kritzel-context-menu-background-color, #ffffff);border-radius:var(--kritzel-context-menu-border-radius, 12px);box-shadow:var(--kritzel-context-menu-box-shadow, 0 1px 6px rgba(0, 0, 0, 0.12));border:var(--kritzel-context-menu-border, 1px solid #ebebeb);padding:var(--kritzel-context-menu-padding, 4px);min-width:120px}.submenu-container.position-left{left:auto;right:100%;margin-left:0;margin-right:4px}`;

const VIEWPORT_PADDING = 8;
const SUBMENU_DELAY = 150;
const ESTIMATED_SUBMENU_WIDTH = 160; // Estimated width for pre-calculation
const KritzelContextMenu = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.actionSelected = createEvent(this, "actionSelected", 7);
        this.close = createEvent(this, "close", 7);
    }
    get host() { return getElement(this); }
    items;
    onItemsChanged() {
        this.updateMenuItems();
    }
    objects;
    actionSelected;
    close;
    processedItems = [];
    /** Current open submenu path (e.g. '0.2.1'). Empty if none. */
    openSubmenuPath = '';
    submenuPositions = {};
    submenuTimer = null;
    submenuRefs = new Map();
    menuItemWrapperRefs = new Map();
    handleOutsideClick(event) {
        const path = event.composedPath();
        if (!path.includes(this.host)) {
            this.close.emit();
        }
    }
    componentWillLoad() {
        this.updateMenuItems();
    }
    componentDidLoad() {
        this.adjustPositionToViewport();
    }
    componentDidUpdate() {
        this.adjustPositionToViewport();
        this.adjustSubmenuPositions();
        this.pruneStaleRefs();
    }
    disconnectedCallback() {
        if (this.submenuTimer) {
            clearTimeout(this.submenuTimer);
        }
    }
    adjustPositionToViewport() {
        const rect = this.host.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const currentLeft = parseFloat(this.host.style.left) || 0;
        const currentTop = parseFloat(this.host.style.top) || 0;
        let newLeft = currentLeft;
        let newTop = currentTop;
        // Check if menu extends beyond right edge
        if (rect.right > viewportWidth - VIEWPORT_PADDING) {
            newLeft = viewportWidth - rect.width - VIEWPORT_PADDING;
        }
        // Check if menu extends beyond bottom edge
        if (rect.bottom > viewportHeight - VIEWPORT_PADDING) {
            newTop = viewportHeight - rect.height - VIEWPORT_PADDING;
        }
        // Ensure menu doesn't go beyond left edge
        if (newLeft < VIEWPORT_PADDING) {
            newLeft = VIEWPORT_PADDING;
        }
        // Ensure menu doesn't go beyond top edge
        if (newTop < VIEWPORT_PADDING) {
            newTop = VIEWPORT_PADDING;
        }
        // Only update if position changed to avoid infinite loops
        if (newLeft !== currentLeft || newTop !== currentTop) {
            this.host.style.left = `${newLeft}px`;
            this.host.style.top = `${newTop}px`;
        }
    }
    adjustSubmenuPositions() {
        if (!this.openSubmenuPath)
            return;
        const viewportHeight = window.innerHeight;
        // Adjust every open submenu in the chain (every prefix of openSubmenuPath).
        for (const path of this.getOpenSubmenuPaths()) {
            const submenuEl = this.submenuRefs.get(path);
            const wrapperEl = this.menuItemWrapperRefs.get(path);
            if (!submenuEl || !wrapperEl)
                continue;
            const wrapperRect = wrapperEl.getBoundingClientRect();
            const submenuHeight = submenuEl.offsetHeight; // Constant regardless of current top shift
            const naturalBottom = wrapperRect.top + submenuHeight;
            if (naturalBottom > viewportHeight - VIEWPORT_PADDING) {
                let overflow = naturalBottom - (viewportHeight - VIEWPORT_PADDING);
                // Don't shift up so far that the top goes above the viewport
                if (wrapperRect.top - overflow < VIEWPORT_PADDING) {
                    overflow = wrapperRect.top - VIEWPORT_PADDING;
                }
                submenuEl.style.top = `${-overflow}px`;
            }
            else {
                submenuEl.style.top = '0px';
            }
        }
    }
    getOpenSubmenuPaths() {
        if (!this.openSubmenuPath)
            return [];
        const parts = this.openSubmenuPath.split('.');
        const paths = [];
        for (let i = 1; i <= parts.length; i++) {
            paths.push(parts.slice(0, i).join('.'));
        }
        return paths;
    }
    isSubmenuOpen(path) {
        return this.openSubmenuPath === path || this.openSubmenuPath.startsWith(path + '.');
    }
    getParentPath(path) {
        const idx = path.lastIndexOf('.');
        return idx === -1 ? '' : path.substring(0, idx);
    }
    getMenuDepth(path) {
        if (!path)
            return 0;
        return path.split('.').length;
    }
    pruneStaleRefs() {
        const openPaths = new Set(this.getOpenSubmenuPaths());
        for (const key of Array.from(this.submenuRefs.keys())) {
            if (!openPaths.has(key)) {
                this.submenuRefs.delete(key);
            }
        }
        // Keep root-level wrapper refs (single-segment paths) always rendered; prune deeper
        // wrappers whose parent submenu is no longer open.
        for (const key of Array.from(this.menuItemWrapperRefs.keys())) {
            const parent = this.getParentPath(key);
            if (parent !== '' && !openPaths.has(parent)) {
                this.menuItemWrapperRefs.delete(key);
            }
        }
    }
    handleItemClick(item, isDisabled, hasChildren) {
        if (isDisabled)
            return;
        if (hasChildren) {
            // Hover handles open/close; click on a parent is a no-op.
            return;
        }
        if (item.action) {
            this.actionSelected.emit(item);
        }
    }
    handleItemMouseEnter(path, hasChildren) {
        if (this.submenuTimer) {
            clearTimeout(this.submenuTimer);
            this.submenuTimer = null;
        }
        const parentPath = this.getParentPath(path);
        if (hasChildren) {
            this.submenuTimer = setTimeout(() => {
                // Pre-calculate horizontal position before opening to avoid flicker.
                const wrapperEl = this.menuItemWrapperRefs.get(path);
                let position = 'right';
                if (wrapperEl) {
                    const rect = wrapperEl.getBoundingClientRect();
                    const viewportWidth = window.innerWidth;
                    const wouldOverflowRight = rect.right + ESTIMATED_SUBMENU_WIDTH > viewportWidth - VIEWPORT_PADDING;
                    position = wouldOverflowRight ? 'left' : 'right';
                }
                this.submenuPositions = { ...this.submenuPositions, [path]: position };
                this.openSubmenuPath = path;
            }, SUBMENU_DELAY);
        }
        else {
            // Hovering a sibling without children: collapse to the parent chain so any
            // sibling-rooted submenu closes, but the ancestor chain stays open.
            this.submenuTimer = setTimeout(() => {
                this.openSubmenuPath = parentPath;
            }, SUBMENU_DELAY);
        }
    }
    handleSubmenuMouseEnter() {
        if (this.submenuTimer) {
            clearTimeout(this.submenuTimer);
            this.submenuTimer = null;
        }
    }
    handleSubmenuMouseLeave(path) {
        // Close this submenu (and any deeper levels) but keep the ancestor chain open.
        const parentPath = this.getParentPath(path);
        this.submenuTimer = setTimeout(() => {
            this.openSubmenuPath = parentPath;
        }, SUBMENU_DELAY);
    }
    async updateMenuItems() {
        this.processedItems = await this.processItems(this.items);
    }
    async processItems(items) {
        const processed = [];
        for (const item of items) {
            const isVisible = await this.evaluateProperty(item.isVisible, true);
            if (isVisible) {
                const isDisabled = await this.evaluateProperty(item.isDisabled, false);
                let processedChildren;
                if (item.children && item.children.length > 0) {
                    processedChildren = await this.processItems(item.children);
                }
                processed.push({ item, isDisabled, processedChildren });
            }
        }
        return processed;
    }
    async evaluateProperty(value, defaultValue) {
        if (typeof value === 'boolean') {
            return value;
        }
        if (typeof value === 'function') {
            return await Promise.resolve(value(null, this.objects));
        }
        return defaultValue;
    }
    renderItems(items, parentPath) {
        return items.map(({ item, isDisabled, processedChildren }, index) => {
            const path = parentPath === '' ? String(index) : `${parentPath}.${index}`;
            const prevItem = index > 0 ? items[index - 1].item : null;
            const showDivider = prevItem && prevItem.group !== item.group;
            const hasChildren = !!processedChildren && processedChildren.length > 0;
            const submenuOpen = hasChildren && this.isSubmenuOpen(path);
            return [
                showDivider && h("div", { class: "menu-divider", key: `divider-${path}` }),
                h("div", { class: "menu-item-wrapper", key: `wrapper-${path}`, ref: el => el && this.menuItemWrapperRefs.set(path, el), onMouseEnter: () => this.handleItemMouseEnter(path, hasChildren) }, h("button", { key: `${item.label}-${path}`, class: { 'menu-item': true, 'disabled': isDisabled, 'has-children': hasChildren, 'submenu-open': submenuOpen }, onClick: () => this.handleItemClick(item, isDisabled, hasChildren), disabled: isDisabled && !hasChildren }, item.icon && h("kritzel-icon", { name: item.icon, size: 16 }), h("span", { class: "label" }, item.label), hasChildren && h("kritzel-icon", { name: "chevronRight", size: 12, class: "submenu-arrow" })), hasChildren && submenuOpen && this.renderSubmenu(processedChildren, path)),
            ];
        });
    }
    renderSubmenu(processedChildren, path) {
        const position = this.submenuPositions[path] === 'left' ? 'left' : 'right';
        const zIndex = this.getMenuDepth(path) + 1;
        return (h("div", { class: { 'submenu-container': true, 'position-left': position === 'left' }, key: `submenu-${path}`, style: { zIndex: String(zIndex) }, ref: el => el && this.submenuRefs.set(path, el), onMouseEnter: () => this.handleSubmenuMouseEnter(), onMouseLeave: () => this.handleSubmenuMouseLeave(path) }, this.renderItems(processedChildren, path)));
    }
    render() {
        if (!this.processedItems || this.processedItems.length === 0) {
            return null;
        }
        return (h(Host, null, h("div", { class: "menu-container" }, this.renderItems(this.processedItems, ''))));
    }
    static get watchers() { return {
        "items": [{
                "onItemsChanged": 0
            }]
    }; }
};
KritzelContextMenu.style = kritzelContextMenuCss();

export { KritzelContextMenu as kritzel_context_menu };
//# sourceMappingURL=kritzel-context-menu.entry.esm.js.map

//# sourceMappingURL=kritzel-context-menu.entry.js.map