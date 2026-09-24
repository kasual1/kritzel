import { r as registerInstance, a as createEvent, h, d as Host } from './index-BDyeD8t8.js';
import { z as KritzelToolConfigHelper, r as resolveTextToolAvailableFonts, u as KritzelFontRegistry, B as KritzelColorHelper } from './index-BEzQin2J.js';
import './yjs-CvNgPRai.js';

const kritzelToolConfigCss = () => `.expand-toggle{background:none;border:none;cursor:var(--kritzel-global-pointer-cursor, pointer);padding:0;margin:0;display:flex;align-items:center;justify-content:center;width:32px;height:32px;color:var(--kritzel-icon-color, currentColor);transition:transform 0.2s ease}.expand-toggle:hover{opacity:0.7}.expand-toggle:focus{outline:none}.expand-toggle:focus-visible{outline:2px solid var(--kritzel-focus-color, #007acc);outline-offset:2px}.expand-toggle:active{transform:scale(0.95)}.divider{height:1px;background-color:var(--kritzel-divider-color, #e0e0e0);margin:4px 0;width:100%}`;

const KritzelToolConfig = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.toolChange = createEvent(this, "toolChange", 7);
        this.displayValuesChange = createEvent(this, "displayValuesChange", 7);
    }
    tool;
    handleToolChange(newTool, oldTool) {
        const newConfig = KritzelToolConfigHelper.getToolConfig(newTool);
        // Maintain settings when switching between shape tools
        if (oldTool && newTool && newConfig?.type === 'shape') {
            const oldConfig = KritzelToolConfigHelper.getToolConfig(oldTool);
            if (oldConfig?.type === 'shape') {
                // Copy properties that should persist
                const propsToCopy = [
                    newConfig.colorProperty, // strokeColor
                    newConfig.sizeProperty, // strokeWidth
                    newConfig.opacityProperty, // opacity
                    'fillColor' // shape specific
                ];
                propsToCopy.forEach(prop => {
                    if (prop && oldTool[prop] !== undefined) {
                        newTool[prop] = oldTool[prop];
                    }
                });
            }
        }
        this.config = newConfig;
        if (this.config) {
            this.updatePalette();
            this.updateSizes();
            this.currentOpacity = newTool[this.config.opacityProperty] ?? 1;
            // Emit the values since they might have been updated from the old tool
            this.emitDisplayValues();
        }
    }
    isExpanded = false;
    theme;
    engine;
    /** Resolved localized strings keyed by term key, supplied by the editor. */
    terms = {};
    handleSelectionChangeBound = this.handleSelectionChange.bind(this);
    onThemeChange() {
        this.emitDisplayValues();
    }
    handleEngineChange(newEngine, oldEngine) {
        if (oldEngine) {
            oldEngine.removeEventListener('objectsSelectionChange', this.handleSelectionChangeBound);
        }
        if (newEngine) {
            newEngine.addEventListener('objectsSelectionChange', this.handleSelectionChangeBound);
        }
    }
    toolChange;
    displayValuesChange;
    config;
    palette = [];
    sizes = [];
    currentOpacity = 1;
    updateTrigger = 0;
    getFontOptionsFromTool() {
        const configuredFonts = resolveTextToolAvailableFonts(this.tool.availableFonts).map(font => {
            const registeredFont = typeof font === 'string'
                ? {
                    family: font,
                    label: font,
                    cssFontFamily: font,
                }
                : {
                    family: font.family,
                    label: font.label ?? font.family,
                    cssFontFamily: font.cssFontFamily ?? font.family,
                };
            return {
                value: registeredFont.family,
                label: registeredFont.label,
                cssFontFamily: registeredFont.cssFontFamily,
            };
        });
        const mergedFonts = [...configuredFonts];
        const seenFonts = new Set(mergedFonts.map(font => font.value.trim().toLocaleLowerCase()));
        for (const font of KritzelFontRegistry.list()) {
            const normalizedValue = font.family.trim().toLocaleLowerCase();
            if (seenFonts.has(normalizedValue)) {
                continue;
            }
            seenFonts.add(normalizedValue);
            mergedFonts.push({
                value: font.family,
                label: font.label,
                cssFontFamily: font.cssFontFamily,
            });
        }
        return mergedFonts;
    }
    handleSelectionChange() {
        if (this.tool?.toolType === 'selection') {
            this.config = KritzelToolConfigHelper.getToolConfig(this.tool);
            if (this.config) {
                this.updatePalette();
                this.updateSizes();
                this.currentOpacity = this.tool[this.config.opacityProperty] ?? 1;
                this.emitDisplayValues();
            }
        }
    }
    disconnectedCallback() {
        if (this.engine) {
            this.engine.removeEventListener('objectsSelectionChange', this.handleSelectionChangeBound);
        }
    }
    componentWillLoad() {
        this.config = KritzelToolConfigHelper.getToolConfig(this.tool);
        if (this.config) {
            this.updatePalette();
            this.updateSizes();
            this.currentOpacity = this.tool[this.config.opacityProperty] ?? 1;
            this.emitDisplayValues();
        }
        if (this.engine) {
            this.engine.addEventListener('objectsSelectionChange', this.handleSelectionChangeBound);
        }
    }
    emitDisplayValues() {
        if (!this.config)
            return;
        const color = this.tool[this.config.colorProperty];
        const opacity = this.currentOpacity;
        const size = this.tool[this.config.sizeProperty];
        const displayValues = {
            color: KritzelColorHelper.applyOpacity(color, opacity, this.theme),
            size,
        };
        if (this.tool.toolType === 'text') {
            displayValues.fontFamily = this.tool.fontFamily;
        }
        this.displayValuesChange.emit(displayValues);
    }
    updatePalette() {
        if (!this.config)
            return;
        if (this.config.paletteSource === 'none') {
            this.palette = [];
        }
        else {
            this.palette = this.tool.palette || [];
        }
    }
    updateSizes() {
        if (!this.config)
            return;
        if (this.config.sizesSource === 'none') {
            this.sizes = [];
        }
        else {
            this.sizes = this.tool.sizes || [];
        }
    }
    handleToggleExpand = () => {
        this.isExpanded = !this.isExpanded;
    };
    handleColorChange = (event) => {
        this.tool[this.config.colorProperty] = event.detail;
        // Special handling for shape fill: when color (stroke) changes, update fill color if it's currently filled
        if (this.config.type === 'shape' || this.config.type === 'selection') {
            const tool = this.tool;
            const isTransparent = typeof tool.fillColor === 'string' ? tool.fillColor === 'transparent' :
                (tool.fillColor.light === 'transparent' && tool.fillColor.dark === 'transparent');
            if (!isTransparent) {
                tool.fillColor = event.detail;
            }
        }
        this.emitDisplayValues();
        this.toolChange.emit(this.tool);
        this.updateTrigger++;
    };
    handleSizeChange = (event) => {
        this.tool[this.config.sizeProperty] = event.detail;
        this.emitDisplayValues();
        this.toolChange.emit(this.tool);
        this.updateTrigger++;
    };
    handleOpacityChange = (event) => {
        this.tool[this.config.opacityProperty] = event.detail;
        this.currentOpacity = event.detail;
        this.emitDisplayValues();
        this.toolChange.emit(this.tool);
    };
    handlePropertyChange = (propertyName, value) => {
        // Special handling for shape fill
        if ((this.config.type === 'shape' || this.config.type === 'selection') && propertyName === 'fillColor') {
            const newFillColor = value === 'filled' ? this.tool[this.config.colorProperty] : { light: 'transparent', dark: 'transparent' };
            this.tool.fillColor = newFillColor;
            // When switching to fill mode, also update stroke color to match
            if (value === 'filled') {
                this.tool[this.config.colorProperty] = newFillColor;
            }
        }
        else {
            this.tool[propertyName] = value;
            // Emit display values for font family changes
            if (propertyName === 'fontFamily') {
                this.emitDisplayValues();
            }
        }
        this.toolChange.emit(this.tool);
        this.updateTrigger++;
    };
    getShapeFillValue() {
        const fillColor = this.tool.fillColor;
        const isTransparent = typeof fillColor === 'string' ? fillColor === 'transparent' :
            (fillColor.light === 'transparent' && fillColor.dark === 'transparent');
        return isTransparent ? 'transparent' : 'filled';
    }
    renderControl(control) {
        const value = this.tool[control.propertyName];
        switch (control.type) {
            case 'stroke-size':
                return (h("kritzel-stroke-size", { key: control.type, sizes: this.sizes, selectedSize: value, onSizeChange: this.handleSizeChange }));
            case 'font-size':
                return (h("kritzel-font-size", { key: control.type, sizes: this.sizes, selectedSize: value, fontFamily: this.tool.fontFamily, onSizeChange: this.handleSizeChange }));
            case 'line-endings':
                return (h("kritzel-line-endings", { key: control.type, value: value, onValueChange: (event) => this.handlePropertyChange(control.propertyName, event.detail) }));
            case 'shape-fill':
                return (h("kritzel-shape-fill", { key: control.type, value: this.getShapeFillValue(), onValueChange: (event) => this.handlePropertyChange(control.propertyName, event.detail) }));
            case 'font-family':
                return (h("kritzel-font-family", { key: control.type, fontOptions: this.getFontOptionsFromTool(), selectedFontFamily: value, onFontFamilyChange: (event) => this.handlePropertyChange(control.propertyName, event.detail) }));
            default:
                return null;
        }
    }
    render() {
        if (!this.config)
            return null;
        const shouldShowExpandButton = this.palette.length > 6 || this.config.type === 'text';
        const shouldShowColorPalette = this.palette.length > 0;
        // Separate size control from other controls
        const sizeControl = this.config.controls.find(c => c.type === 'stroke-size' || c.type === 'font-size');
        const otherControls = this.config.controls.filter(c => c.type !== 'stroke-size' && c.type !== 'font-size');
        return (h(Host, null, h("div", { style: {
                display: 'flex',
                flexDirection: 'row',
                gap: '8px',
                width: '100%',
            } }, h("div", { style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                flex: '1',
            } }, shouldShowColorPalette && (h("kritzel-color-palette", { colors: this.palette, selectedColor: this.tool[this.config.colorProperty], isExpanded: this.isExpanded, isOpaque: true, opacity: this.currentOpacity, theme: this.theme, onColorChange: this.handleColorChange })), sizeControl && this.renderControl(sizeControl), h("kritzel-opacity-slider", { value: this.tool[this.config.opacityProperty], previewColor: this.tool[this.config.colorProperty], onValueChange: this.handleOpacityChange }), otherControls.map((control) => [
            h("div", { class: "divider" }),
            this.renderControl(control),
        ])), shouldShowExpandButton && (h("div", { style: {
                display: 'flex',
                alignItems: 'flex-start',
            } }, h("button", { class: "expand-toggle", onClick: this.handleToggleExpand, title: this.isExpanded ? (this.terms['toolConfig.collapse'] ?? 'Collapse') : (this.terms['toolConfig.expand'] ?? 'Expand') }, h("kritzel-icon", { name: this.isExpanded ? 'chevronUp' : 'chevronDown' })))))));
    }
    static get watchers() { return {
        "tool": [{
                "handleToolChange": 0
            }],
        "theme": [{
                "onThemeChange": 0
            }],
        "engine": [{
                "handleEngineChange": 0
            }]
    }; }
};
KritzelToolConfig.style = kritzelToolConfigCss();

export { KritzelToolConfig as kritzel_tool_config };
//# sourceMappingURL=kritzel-tool-config.entry.esm.js.map

//# sourceMappingURL=kritzel-tool-config.entry.js.map