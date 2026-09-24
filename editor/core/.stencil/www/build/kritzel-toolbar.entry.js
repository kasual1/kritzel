import { r as registerInstance, a as createEvent, e as getElement, h, d as Host } from './index-BDyeD8t8.js';
import { w as KritzelDevicesHelper, z as KritzelToolConfigHelper, B as KritzelColorHelper } from './index-BEzQin2J.js';
import './yjs-CvNgPRai.js';

const kritzelToolbarCss = () => `:host{display:flex;flex-direction:column;user-select:none;max-width:100%;z-index:1}:host(.mobile){--kritzel-toolbar-control-hover-background-color:transparent;--kritzel-toolbar-control-active-background-color:transparent}.kritzel-toolbar{display:flex;flex-direction:row;align-items:center;justify-content:flex-start;gap:var(--kritzel-toolbar-gap, 8px);height:100%;padding:var(--kritzel-toolbar-padding, 8px);background-color:var(--kritzel-toolbar-background-color, #ffffff);border-radius:var(--kritzel-toolbar-border-radius, 16px);box-shadow:var(--kritzel-toolbar-box-shadow, 0 0 3px rgba(0, 0, 0, 0.08));border:var(--kritzel-toolbar-border, 1px solid #ebebeb);z-index:1;position:relative;max-width:100%;overflow:hidden}.kritzel-tools-scroll{display:flex;flex-direction:row;align-items:center;gap:var(--kritzel-toolbar-gap, 8px);overflow-x:auto;overflow-y:hidden;flex:1 1 auto;min-width:0;padding:4px;margin:-4px;scrollbar-width:none;-ms-overflow-style:none}.kritzel-tools-scroll::-webkit-scrollbar{display:none}.scroll-indicator-left,.scroll-indicator-right{position:absolute;top:0;bottom:0;width:32px;pointer-events:none;opacity:0;transition:opacity 0.2s ease-out;z-index:1}.scroll-indicator-left{left:0;background:linear-gradient(to right, var(--kritzel-toolbar-background-color, #ffffff), transparent);border-radius:var(--kritzel-toolbar-border-radius, 16px) 0 0 var(--kritzel-toolbar-border-radius, 16px)}.scroll-indicator-right{right:0;background:linear-gradient(to left, var(--kritzel-toolbar-background-color, #ffffff), transparent);border-radius:0 var(--kritzel-toolbar-border-radius, 16px) var(--kritzel-toolbar-border-radius, 16px) 0}.scroll-indicator-left.visible,.scroll-indicator-right.visible{opacity:1}.kritzel-control{display:flex;justify-content:center;align-items:center;color:var(--kritzel-toolbar-control-color, #000000);border-radius:var(--kritzel-toolbar-control-border-radius, 12px);padding:var(--kritzel-toolbar-control-padding, 8px);border:none;background:none;cursor:var(--kritzel-global-pointer-cursor, pointer);-webkit-tap-highlight-color:transparent;font-weight:bold}.kritzel-control:focus,.kritzel-control:hover{background-color:var(--kritzel-toolbar-control-hover-background-color, hsl(0, 0%, 0%, 4.3%))}.kritzel-control:active{background-color:var(--kritzel-toolbar-control-active-background-color, hsl(0, 0%, 0%, 8.6%))}.kritzel-control.selected,.kritzel-control.selected:hover,.kritzel-control.selected:active{background-color:var(--kritzel-toolbar-control-selected-background-color, #007AFF) !important;color:var(--kritzel-toolbar-control-selected-color, #ffffff) !important}.kritzel-control.selected:focus{background-color:var(--kritzel-toolbar-control-selected-background-color, #007bffe3) !important}.kritzel-control:disabled,.kritzel-control.disabled{opacity:0.4;cursor:not-allowed;pointer-events:none}.kritzel-control-separator{width:1px;height:24px;background-color:var(--kritzel-toolbar-separator-color, #ebebeb);margin:0 4px}.kritzel-control-split{position:relative;display:flex;align-items:center;border-radius:var(--kritzel-toolbar-control-border-radius, 12px);color:var(--kritzel-toolbar-control-color, #000000)}.kritzel-control-split .kritzel-control-main{display:flex;justify-content:center;align-items:center;padding:var(--kritzel-toolbar-control-padding, 8px);border:none;background:none;cursor:var(--kritzel-global-pointer-cursor, pointer);-webkit-tap-highlight-color:transparent;border-radius:var(--kritzel-toolbar-control-border-radius, 12px);color:inherit}.kritzel-control-split.selected .kritzel-control-main{border-radius:var(--kritzel-toolbar-control-border-radius, 12px) 0 0 var(--kritzel-toolbar-control-border-radius, 12px)}.kritzel-control-split .kritzel-control-dropdown{display:flex;justify-content:center;align-items:center;align-self:stretch;border:none;background:none;cursor:var(--kritzel-global-pointer-cursor, pointer);-webkit-tap-highlight-color:transparent;border-radius:0 var(--kritzel-toolbar-control-border-radius, 12px) var(--kritzel-toolbar-control-border-radius, 12px) 0;color:inherit;width:0;padding:0;opacity:0;overflow:hidden;pointer-events:none;transition:width 0.15s ease-out, padding 0.15s ease-out, opacity 0.15s ease-out}.kritzel-control-split .kritzel-control-dropdown.visible{width:auto;padding:0 6px;opacity:1;pointer-events:auto}.kritzel-control-split .kritzel-control-main:focus,.kritzel-control-split .kritzel-control-main:hover,.kritzel-control-split .kritzel-control-dropdown:focus,.kritzel-control-split .kritzel-control-dropdown:hover{background-color:var(--kritzel-toolbar-control-hover-background-color, hsl(0, 0%, 0%, 4.3%))}.kritzel-control-split .kritzel-control-main:active,.kritzel-control-split .kritzel-control-dropdown:active{background-color:var(--kritzel-toolbar-control-active-background-color, hsl(0, 0%, 0%, 8.6%))}.kritzel-control-split.selected{background-color:var(--kritzel-toolbar-control-selected-background-color, #007AFF) !important;color:var(--kritzel-toolbar-control-selected-color, #ffffff) !important}.kritzel-control-split.selected .kritzel-control-main:hover,.kritzel-control-split.selected .kritzel-control-dropdown:hover{background-color:rgba(255, 255, 255, 0.15)}.kritzel-control-split .kritzel-control-main:disabled,.kritzel-control-split .kritzel-control-main.disabled,.kritzel-control-split .kritzel-control-dropdown:disabled,.kritzel-control-split .kritzel-control-dropdown.disabled{opacity:0.4;cursor:not-allowed;pointer-events:none}.kritzel-submenu-content{display:flex;flex-direction:column;gap:var(--kritzel-submenu-gap, 4px);min-width:140px}.kritzel-submenu-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border:none;background:none;cursor:var(--kritzel-global-pointer-cursor, pointer);border-radius:8px;color:var(--kritzel-toolbar-control-color, #000000);font-size:14px;text-align:left;white-space:nowrap;-webkit-tap-highlight-color:transparent}.kritzel-submenu-item:hover{background-color:var(--kritzel-toolbar-control-hover-background-color, hsl(0, 0%, 0%, 4.3%))}.kritzel-submenu-item.active{background-color:var(--kritzel-toolbar-control-selected-background-color, #007AFF);color:var(--kritzel-toolbar-control-selected-color, #ffffff)}.kritzel-submenu-item.active:hover{background-color:var(--kritzel-toolbar-control-selected-background-color, #007AFF)}.kritzel-config-container{position:relative;display:flex;justify-content:center;align-items:center;height:40px;box-sizing:border-box;-webkit-tap-highlight-color:transparent;flex-shrink:0;width:0;opacity:0;overflow:hidden;pointer-events:none;margin-left:calc(-1 * var(--kritzel-toolbar-gap, 8px));transition:width 0.2s ease-out, opacity 0.2s ease-out, margin-left 0.2s ease-out}.kritzel-config-container.visible{width:40px;opacity:1;pointer-events:auto;margin-left:0;overflow:visible}.config-gradient-left{position:absolute;top:0;bottom:0;left:-32px;width:32px;background:linear-gradient(to right, transparent, var(--kritzel-toolbar-background-color, #ffffff));pointer-events:none;z-index:1;opacity:0;transition:opacity 0.2s ease-out}.config-gradient-left.visible{opacity:1}.kritzel-config{display:flex;justify-content:center;align-items:center;cursor:var(--kritzel-global-pointer-cursor, pointer);border-radius:50%}.color-container{display:flex;justify-content:center;align-items:center;width:32px;height:32px;border-radius:50%;cursor:var(--kritzel-global-pointer-cursor, pointer);border:2px solid transparent;box-sizing:border-box;background-color:var(--kritzel-color-palette-hover-background-color, #ebebeb)}.font-container{display:flex;justify-content:center;align-items:center;width:32px;height:32px;border-radius:50%;cursor:var(--kritzel-global-pointer-cursor, pointer);border:2px solid transparent;box-sizing:border-box;background-color:var(--kritzel-color-palette-hover-background-color, #ebebeb)}.no-config{height:24px;width:24px;border-radius:50%;border:1px dashed gray}kritzel-tooltip{z-index:10001}`;

const KritzelToolbar = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.isToolbarReady = createEvent(this, "isToolbarReady", 7);
    }
    get host() { return getElement(this); }
    visible = true;
    toolbarItems = [];
    activeControl = null;
    isUtilityPanelVisible = true;
    undoState = null;
    theme = 'light';
    /** Resolved localized strings keyed by term key, supplied by the editor. */
    terms = {};
    isToolbarReady;
    firstConfig = null;
    isTouchDevice = KritzelDevicesHelper.isTouchDevice();
    selectedSubOptions = new Map();
    canScrollLeft = false;
    canScrollRight = false;
    needsScrolling = false;
    displayValues = null;
    internalToolbar = [];
    resolvedDisabled = new Map();
    handleActiveToolChangeBound = this.handleActiveToolChange.bind(this);
    handleSelectionChangeBound = this.handleSelectionChange.bind(this);
    handleKeyDown(event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            this.closeTooltip();
            this.kritzelEngine?.enable();
        }
    }
    async handleActiveToolChange(event) {
        this.activeControl = this.internalToolbar.find(control => control.tool === event.detail) || null;
        if (this.activeControl?.tool) {
            this.updateDisplayValues(this.activeControl.tool);
        }
        this.closeTooltip();
    }
    handleSelectionChange() {
        const tool = this.activeControl?.tool;
        if (tool && typeof tool !== 'function' && tool.toolType === 'selection') {
            this.updateDisplayValues(tool);
        }
    }
    async onToolbarItemsChange() {
        if (this.kritzelEngine) {
            await this.initializeTools();
        }
    }
    onThemeChange() {
        if (this.activeControl?.tool) {
            this.updateDisplayValues(this.activeControl.tool);
        }
    }
    async closeTooltip() {
        document.dispatchEvent(new CustomEvent('kritzelTooltipCloseAll'));
    }
    kritzelEngine = null;
    toolsScrollRef = null;
    configTriggerRef = null;
    get activeToolAsTextTool() {
        return this.activeControl?.tool;
    }
    get activeToolAsBrushTool() {
        return this.activeControl?.tool;
    }
    get activeToolAsLineTool() {
        return this.activeControl?.tool;
    }
    get activeToolAsShapeTool() {
        return this.activeControl?.tool;
    }
    handleDisplayValuesChange = (event) => {
        const newVal = event.detail;
        if (this.displayValues && this.displayValues.color === newVal.color && this.displayValues.size === newVal.size && this.displayValues.fontFamily === newVal.fontFamily) {
            return;
        }
        this.displayValues = newVal;
    };
    updateDisplayValues(tool) {
        const config = KritzelToolConfigHelper.getToolConfig(tool);
        if (!config) {
            this.displayValues = null;
            return;
        }
        const color = tool[config.colorProperty];
        const opacity = tool[config.opacityProperty] ?? 1;
        const size = tool[config.sizeProperty];
        const displayValues = {
            color: KritzelColorHelper.applyOpacity(color, opacity, this.theme),
            size,
        };
        if (tool.toolType === 'text') {
            displayValues.fontFamily = tool.fontFamily;
        }
        // Check for equality implementation to prevent unnecessary re-renders
        if (this.displayValues &&
            this.displayValues.color === displayValues.color &&
            this.displayValues.size === displayValues.size &&
            this.displayValues.fontFamily === displayValues.fontFamily) {
            return;
        }
        this.displayValues = displayValues;
    }
    async componentWillLoad() {
        await this.initializeEngine();
        await this.initializeTools();
        this.isToolbarReady.emit();
    }
    componentDidLoad() {
        this.updateScrollIndicators();
    }
    componentDidRender() {
        this.updateScrollIndicators();
    }
    disconnectedCallback() {
        if (this.kritzelEngine) {
            this.kritzelEngine.removeEventListener('activeToolChange', this.handleActiveToolChangeBound);
            this.kritzelEngine.removeEventListener('objectsSelectionChange', this.handleSelectionChangeBound);
        }
    }
    updateScrollIndicators() {
        if (!this.toolsScrollRef)
            return;
        const { scrollLeft, scrollWidth, clientWidth } = this.toolsScrollRef;
        const threshold = 2; // Small threshold to account for rounding
        const canScrollLeft = scrollLeft > threshold;
        const canScrollRight = scrollLeft + clientWidth < scrollWidth - threshold;
        const needsScrolling = scrollWidth > clientWidth;
        if (this.canScrollLeft !== canScrollLeft)
            this.canScrollLeft = canScrollLeft;
        if (this.canScrollRight !== canScrollRight)
            this.canScrollRight = canScrollRight;
        if (this.needsScrolling !== needsScrolling)
            this.needsScrolling = needsScrolling;
    }
    handleToolsScroll = () => {
        this.updateScrollIndicators();
    };
    async initializeEngine() {
        await customElements.whenDefined('kritzel-engine');
        this.kritzelEngine = this.host.parentElement.querySelector('kritzel-engine');
        if (!this.kritzelEngine) {
            throw new Error('kritzel-engine not found in parent element.');
        }
        this.kritzelEngine.addEventListener('activeToolChange', this.handleActiveToolChangeBound);
        this.kritzelEngine.addEventListener('objectsSelectionChange', this.handleSelectionChangeBound);
    }
    async initializeTools() {
        let hasDefault = false;
        const newToolbar = this.toolbarItems.map(c => ({ ...c }));
        await this.resolveDisabledStates(newToolbar);
        for (const c of newToolbar) {
            if (c.type === 'tool' && c.tool) {
                const registered = await this.kritzelEngine.getTool(c.name);
                if (registered) {
                    c.tool = registered;
                }
            }
            if (c.type === 'tool' && c.isDefault && !this.isControlDisabled(c) && c.tool) {
                await this.kritzelEngine.setActiveTool(c.name);
                this.activeControl = c;
                this.updateDisplayValues(c.tool);
                hasDefault = true;
            }
            if (c.type === 'config') {
                if (this.firstConfig === null) {
                    this.firstConfig = c;
                }
                else {
                    console.warn('Only one config control is allowed. The first one will be used.');
                }
            }
        }
        this.internalToolbar = newToolbar;
        // If no tool is marked as default, activate the first tool control
        if (!hasDefault) {
            const firstTool = this.internalToolbar.find(c => c.type === 'tool' && c.tool && !this.isControlDisabled(c));
            if (firstTool) {
                await this.kritzelEngine.setActiveTool(firstTool.name);
                this.activeControl = firstTool;
                this.updateDisplayValues(firstTool.tool);
            }
        }
    }
    /**
     * Resolves each tool's `isDisabled` (boolean or sync/async function) into `resolvedDisabled`.
     */
    async resolveDisabledStates(items) {
        const entries = await Promise.all(items
            .filter(item => item.type === 'tool')
            .map(async (item) => [item.name, await this.evaluateDisabled(item.isDisabled)]));
        this.resolvedDisabled = new Map(entries);
    }
    async evaluateDisabled(value) {
        if (typeof value === 'function') {
            try {
                return !!(await value());
            }
            catch {
                return false;
            }
        }
        return !!value;
    }
    isControlDisabled(control) {
        return this.resolvedDisabled.get(control.name) ?? false;
    }
    async handleControlClick(control) {
        if (this.isControlDisabled(control)) {
            return;
        }
        this.activeControl = control;
        if (this.activeControl.type === 'tool') {
            this.updateDisplayValues(this.activeControl.tool);
            await this.kritzelEngine.setActiveTool(this.activeControl.name);
        }
    }
    async handleToolChange(event) {
        this.activeControl = { ...this.activeControl, tool: event.detail };
        await this.kritzelEngine.setActiveTool(this.activeControl.name);
    }
    /**
     * Get the currently selected sub-option for a control.
     * Returns the first sub-option as default if none is selected.
     */
    getSelectedSubOption(control) {
        if (!control.subOptions?.length)
            return undefined;
        return this.selectedSubOptions.get(control.name) || control.subOptions[0];
    }
    /**
     * Select a sub-option and update the tool property
     */
    async selectSubOption(control, option) {
        if (this.isControlDisabled(control)) {
            return;
        }
        // Update the selected sub-options map (create new Map for reactivity)
        const newMap = new Map(this.selectedSubOptions);
        newMap.set(control.name, option);
        this.selectedSubOptions = newMap;
        // Update the tool property if the tool is instantiated
        if (control.tool && typeof control.tool !== 'function') {
            control.tool[option.toolProperty] = option.value;
        }
        // Close the submenu
        this.closeTooltip();
        // Activate this control
        await this.handleControlClick(control);
    }
    render() {
        const activeToolConfig = this.activeControl?.tool
            ? KritzelToolConfigHelper.getToolConfig(this.activeControl.tool)
            : null;
        const hasConfigUI = activeToolConfig !== null;
        // Separate tool controls from config control
        const toolControls = this.internalToolbar.filter(c => c.type === 'tool' || c.type === 'separator');
        const configControl = this.internalToolbar.find(c => c.type === 'config' && c.name === this.firstConfig?.name);
        return (h(Host, { key: 'e8ad27d0535cf8bb99cfb5076c88525b214a36d8', style: { display: this.visible ? '' : 'none' }, class: {
                mobile: this.isTouchDevice,
            } }, this.isUtilityPanelVisible && (h("kritzel-utility-panel", { key: 'e1fee3d9d98f56c167c64eb3813a019f6a7b3375', style: {
                position: 'absolute',
                bottom: '56px',
                left: '12px',
            }, undoState: this.undoState, terms: this.terms, onUndo: () => this.kritzelEngine?.undo(), onRedo: () => this.kritzelEngine?.redo(), onDelete: () => this.kritzelEngine?.delete() })), h("div", { key: '58cac12993045ba15b011879379b7626e85029e3', class: "kritzel-toolbar" }, h("div", { key: '604d7c1ab8cc3ad93475844f38cb59113db573fb', class: { 'scroll-indicator-left': true, 'visible': this.canScrollLeft } }), h("div", { key: '1952c86f923001f19af3969ca97337b495420761', class: "kritzel-tools-scroll", ref: el => (this.toolsScrollRef = el), onScroll: this.handleToolsScroll }, toolControls.map(control => {
            // Check if this control has sub-options (split-button)
            if (control.subOptions?.length) {
                const selectedSubOption = this.getSelectedSubOption(control);
                const isActive = this.activeControl?.name === control.name;
                const isDisabled = this.isControlDisabled(control);
                return (h("div", { class: {
                        'kritzel-control-split': true,
                        'selected': isActive,
                    }, key: control.name, "data-testid": `tool-${control.name}`, ref: el => {
                        if (el)
                            control._anchorRef = el;
                    } }, h("button", { class: {
                        'kritzel-control-main': true,
                        'disabled': isDisabled,
                    }, disabled: isDisabled, onClick: () => this.handleControlClick(control), "aria-label": selectedSubOption?.label, "aria-disabled": isDisabled, "data-testid": `tool-${control.name}-main` }, h("kritzel-icon", { name: selectedSubOption?.icon || control.icon })), h("button", { class: {
                        'kritzel-control-dropdown': true,
                        'visible': isActive,
                        'disabled': isDisabled,
                    }, disabled: isDisabled, ref: el => {
                        if (el)
                            control._triggerRef = el;
                    }, "aria-label": `Select ${control.name} options`, "aria-disabled": isDisabled, "data-testid": `tool-${control.name}-dropdown`, tabIndex: isActive ? 0 : -1 }, h("kritzel-icon", { name: "chevronDown", size: 12 })), h("kritzel-tooltip", { anchorElement: control._anchorRef, triggerElement: control._triggerRef }, h("div", { class: "kritzel-submenu-content" }, control.subOptions.map(option => (h("button", { class: {
                        'kritzel-submenu-item': true,
                        'active': option.id === selectedSubOption?.id,
                    }, key: option.id, "data-testid": `suboption-${option.id}`, onClick: () => this.selectSubOption(control, option) }, h("kritzel-icon", { name: option.icon, size: 20 }), h("span", null, option.label))))))));
            }
            if (control.type === 'separator') {
                return h("div", { class: "kritzel-control-separator", key: control.name });
            }
            // Regular tool control (no sub-options)
            return (h("button", { class: {
                    'kritzel-control': true,
                    'selected': this.activeControl?.name === control?.name,
                    'disabled': this.isControlDisabled(control),
                }, disabled: this.isControlDisabled(control), key: control.name, "data-testid": `tool-${control.name}`, onClick: _event => this.handleControlClick?.(control), "aria-label": control.name.charAt(0).toUpperCase() + control.name.slice(1), "aria-disabled": this.isControlDisabled(control) }, h("kritzel-icon", { name: control.icon })));
        })), h("div", { key: '55a63afa0e9b4f22405a494795be537f21371d33', class: { 'scroll-indicator-right': true, 'visible': this.canScrollRight && !(configControl && this.activeControl && hasConfigUI) } }), configControl && this.activeControl && (h("div", { class: {
                'kritzel-config-container': true,
                'visible': hasConfigUI,
            }, key: configControl.name }, h("div", { key: '702a65a5f1b9391d0e04f2b09554bc4f1c4bc135', class: { 'config-gradient-left': true, 'visible': this.needsScrolling } }), h("kritzel-tooltip", { key: 'df86b48089ba17d5faf656ed5b282d40fef5a88d', anchorElement: this.host.shadowRoot?.querySelector('.kritzel-config-container'), triggerElement: this.configTriggerRef }, h("kritzel-tool-config", { key: '8014c8cde7d899f89db0f83b81dd4eefbfa66b2d', tool: this.activeControl.tool, theme: this.theme, engine: this.kritzelEngine, terms: this.terms, onToolChange: event => this.handleToolChange?.(event), onDisplayValuesChange: this.handleDisplayValuesChange, style: { width: '100%', height: '100%' } })), h("div", { key: '54a52676b337a8c84a4a0b93fafd7eb0e1c48740', tabIndex: hasConfigUI ? 0 : -1, class: "kritzel-config", "data-testid": "tool-config", ref: el => {
                if (el)
                    this.configTriggerRef = el;
            }, onKeyDown: event => {
                if (event.key === 'Enter') {
                    event.target.click();
                }
            }, style: {
                cursor: 'pointer',
            } }, this.displayValues && (h("div", { key: '788498d600628a1e10160c762151d0af25fd3d29', class: "color-container" }, h("kritzel-color", { key: '4ab1f681bed0023e90579fc9c4d2f72cdd7ad630', value: this.displayValues.color, theme: this.theme, size: 18, style: {
                borderRadius: '50%',
                border: 'none',
            } })))))))));
    }
    static get assetsDirs() { return ["../assets"]; }
    static get watchers() { return {
        "toolbarItems": [{
                "onToolbarItemsChange": 0
            }],
        "theme": [{
                "onThemeChange": 0
            }]
    }; }
};
KritzelToolbar.style = kritzelToolbarCss();

export { KritzelToolbar as kritzel_toolbar };
//# sourceMappingURL=kritzel-toolbar.entry.esm.js.map

//# sourceMappingURL=kritzel-toolbar.entry.js.map