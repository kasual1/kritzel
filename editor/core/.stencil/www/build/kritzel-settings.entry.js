import { r as registerInstance, a as createEvent, e as getElement, h, d as Host } from './index-BDyeD8t8.js';
import { x as KRITZEL_VERSION, C as CURRENT_APP_STATE_SCHEMA_VERSION, y as CURRENT_WORKSPACE_SCHEMA_VERSION } from './index-BEzQin2J.js';
import './yjs-CvNgPRai.js';

const kritzelSettingsCss = () => `:host{display:contents}kritzel-dialog{--kritzel-dialog-body-padding:0;--kritzel-dialog-width-large:800px;--kritzel-dialog-height-large:500px}.footer-button{padding:8px 16px;border-radius:6px;cursor:pointer;font-size:14px}.cancel-button{border:1px solid #ebebeb;background:#fff;color:inherit}.cancel-button:hover{background:#f5f5f5}.settings-tab-panel{display:none}.settings-tab-panel.is-active{display:block}.settings-content{padding:0}.settings-content h3{margin:0 0 16px 0;font-size:18px;font-weight:600;color:var(--kritzel-settings-content-heading-color, #333333)}.settings-content p{margin:0;font-size:14px;color:var(--kritzel-settings-content-text-color, #666666);line-height:1.5}.settings-group{display:flex;flex-direction:column;gap:24px}.settings-item{display:flex;flex-direction:column;gap:8px}.settings-row{display:flex;align-items:center;justify-content:space-between;gap:16px}.settings-label{font-size:14px;font-weight:600;color:var(--kritzel-settings-label-color, #333333);margin:0 0 4px 0}.settings-description{font-size:12px;color:var(--kritzel-settings-description-color, #888888);margin:0;line-height:1.4}.shortcuts-list{display:flex;flex-direction:column;gap:24px}.shortcuts-category{display:flex;flex-direction:column;gap:8px}.shortcuts-category-title{font-size:14px;font-weight:600;color:var(--kritzel-settings-label-color, #333333);margin:0 0 4px 0}.shortcuts-group{display:flex;flex-direction:column;gap:4px}.shortcut-item{display:flex;justify-content:space-between;align-items:center;padding:6px 8px;border-radius:4px;background:var(--kritzel-settings-shortcut-item-bg, rgba(0, 0, 0, 0.02))}.shortcut-label{font-size:14px;color:var(--kritzel-settings-content-text-color, #666666)}.shortcut-key{font-family:monospace;font-size:12px;padding:2px 8px;border-radius:4px;background:var(--kritzel-settings-shortcut-key-bg, #f0f0f0);color:var(--kritzel-settings-shortcut-key-color, #333333);border:1px solid var(--kritzel-settings-shortcut-key-border, #ddd)}`;

const DEFAULT_SCALE_MIN = 0.0001;
const DEFAULT_SCALE_MAX = 1000;
const DEFAULT_LOCK_DRAWING_SCALE = true;
const DEFAULT_VIEWPORT_BOUNDARY_LEFT = -Infinity;
const DEFAULT_VIEWPORT_BOUNDARY_RIGHT = Infinity;
const DEFAULT_VIEWPORT_BOUNDARY_TOP = -Infinity;
const DEFAULT_VIEWPORT_BOUNDARY_BOTTOM = Infinity;
const DEFAULT_DEBUG_INFO = {
    showViewportInfo: false,
    showObjectInfo: false,
    showSyncProviderInfo: true,
    showMigrationInfo: true,
    showAssetResolverInfo: false,
};
const SETTINGS_CATEGORY_IDS = ['general', 'viewport', 'shortcuts', 'developer', 'about'];
const KritzelSettings = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.settingsChange = createEvent(this, "settingsChange", 7);
    }
    get host() { return getElement(this); }
    /** Keyboard shortcuts to display in the settings dialog */
    availableThemes = ['light', 'dark'];
    /** Available locales as `{ code, label }` options for the language selector. */
    availableLocales = [];
    shortcuts = [];
    /** Resolved localized strings keyed by term key, supplied by the editor. */
    terms = {};
    /** Current settings values. Used to initialize and sync the component's internal state. */
    settings;
    onSettingsPropChange(newSettings) {
        if (newSettings) {
            this.applySettings(newSettings);
        }
    }
    isDialogOpen = false;
    selectedCategoryId = SETTINGS_CATEGORY_IDS[0];
    scaleMin = DEFAULT_SCALE_MIN;
    scaleMax = DEFAULT_SCALE_MAX;
    lockDrawingScale = DEFAULT_LOCK_DRAWING_SCALE;
    theme = 'light';
    locale = 'en';
    viewportBoundaryLeft = DEFAULT_VIEWPORT_BOUNDARY_LEFT;
    viewportBoundaryRight = DEFAULT_VIEWPORT_BOUNDARY_RIGHT;
    viewportBoundaryTop = DEFAULT_VIEWPORT_BOUNDARY_TOP;
    viewportBoundaryBottom = DEFAULT_VIEWPORT_BOUNDARY_BOTTOM;
    debugInfo = { ...DEFAULT_DEBUG_INFO };
    /** Emitted when settings change */
    settingsChange;
    componentWillLoad() {
        if (this.settings) {
            this.applySettings(this.settings);
        }
    }
    applySettings(settings) {
        if (typeof settings.scaleMin === 'number') {
            this.scaleMin = settings.scaleMin;
        }
        if (typeof settings.scaleMax === 'number') {
            this.scaleMax = settings.scaleMax;
        }
        if (typeof settings.lockDrawingScale === 'boolean') {
            this.lockDrawingScale = settings.lockDrawingScale;
        }
        if (typeof settings.theme === 'string') {
            this.theme = settings.theme;
        }
        if (typeof settings.locale === 'string') {
            this.locale = settings.locale;
        }
        if (typeof settings.viewportBoundaryLeft === 'number') {
            this.viewportBoundaryLeft = settings.viewportBoundaryLeft;
        }
        if (typeof settings.viewportBoundaryRight === 'number') {
            this.viewportBoundaryRight = settings.viewportBoundaryRight;
        }
        if (typeof settings.viewportBoundaryTop === 'number') {
            this.viewportBoundaryTop = settings.viewportBoundaryTop;
        }
        if (typeof settings.viewportBoundaryBottom === 'number') {
            this.viewportBoundaryBottom = settings.viewportBoundaryBottom;
        }
        if (settings.debugInfo) {
            this.debugInfo = { ...DEFAULT_DEBUG_INFO, ...settings.debugInfo };
        }
    }
    emitSettings() {
        const settings = {
            scaleMin: this.scaleMin,
            scaleMax: this.scaleMax,
            lockDrawingScale: this.lockDrawingScale,
            theme: this.theme,
            locale: this.locale,
            viewportBoundaryLeft: this.viewportBoundaryLeft,
            viewportBoundaryRight: this.viewportBoundaryRight,
            viewportBoundaryTop: this.viewportBoundaryTop,
            viewportBoundaryBottom: this.viewportBoundaryBottom,
            debugInfo: this.debugInfo,
        };
        this.settingsChange.emit(settings);
    }
    handleScaleMinChange = (event) => {
        this.scaleMin = event.detail;
        this.emitSettings();
    };
    handleScaleMaxChange = (event) => {
        this.scaleMax = event.detail;
        this.emitSettings();
    };
    handleLockDrawingScaleChange = (event) => {
        this.lockDrawingScale = event.detail;
        this.emitSettings();
    };
    handleThemeChange = (event) => {
        this.theme = event.detail;
        this.emitSettings();
    };
    handleLocaleChange = (event) => {
        this.locale = event.detail;
        this.emitSettings();
    };
    handleViewportBoundaryLeftChange = (event) => {
        this.viewportBoundaryLeft = event.detail ?? DEFAULT_VIEWPORT_BOUNDARY_LEFT;
        this.emitSettings();
    };
    handleViewportBoundaryRightChange = (event) => {
        this.viewportBoundaryRight = event.detail ?? DEFAULT_VIEWPORT_BOUNDARY_RIGHT;
        this.emitSettings();
    };
    handleViewportBoundaryTopChange = (event) => {
        this.viewportBoundaryTop = event.detail ?? DEFAULT_VIEWPORT_BOUNDARY_TOP;
        this.emitSettings();
    };
    handleViewportBoundaryBottomChange = (event) => {
        this.viewportBoundaryBottom = event.detail ?? DEFAULT_VIEWPORT_BOUNDARY_BOTTOM;
        this.emitSettings();
    };
    handleDebugInfoChange = (key) => (event) => {
        this.debugInfo = { ...this.debugInfo, [key]: event.detail };
        this.emitSettings();
    };
    async open() {
        this.isDialogOpen = true;
    }
    async close() {
        this.closeDialog();
    }
    closeDialog = () => {
        this.isDialogOpen = false;
    };
    handleCategorySelect = (event) => {
        this.selectedCategoryId = event.detail.item.id;
    };
    formatKeyCombo(shortcut) {
        const parts = [];
        if (shortcut.ctrl)
            parts.push('Ctrl');
        if (shortcut.shift)
            parts.push('Shift');
        parts.push(this.formatKey(shortcut.key));
        return parts.join('+');
    }
    formatKey(key) {
        const keyMap = {
            'Escape': 'Esc',
            'Delete': 'Del',
            ' ': 'Space',
        };
        return keyMap[key] ?? key.toUpperCase();
    }
    groupShortcutsByCategory() {
        const grouped = new Map();
        for (const shortcut of this.shortcuts) {
            const existing = grouped.get(shortcut.category) || [];
            existing.push(shortcut);
            grouped.set(shortcut.category, existing);
        }
        return grouped;
    }
    /**
     * Resolves a localized string from the supplied {@link terms} map, falling
     * back to the provided English default when the key is missing.
     */
    t(key, fallback) {
        return this.terms[key] ?? fallback;
    }
    get categories() {
        const icons = {
            general: 'settings',
            viewport: 'viewport',
            shortcuts: 'command',
            developer: 'braces',
            about: 'info',
        };
        const labels = {
            general: { key: 'settings.categories.general', fallback: 'General' },
            viewport: { key: 'settings.categories.viewport', fallback: 'Viewport' },
            shortcuts: { key: 'settings.categories.shortcuts', fallback: 'Keyboard Shortcuts' },
            developer: { key: 'settings.categories.developer', fallback: 'Developer Options' },
            about: { key: 'settings.categories.about', fallback: 'About' },
        };
        return SETTINGS_CATEGORY_IDS.map(id => ({
            id,
            label: this.t(labels[id].key, labels[id].fallback),
            icon: icons[id],
        }));
    }
    renderCategoryContent() {
        return (h("div", { class: "settings-categories-wrapper" }, h("div", { class: { 'settings-tab-panel': true, 'is-active': this.selectedCategoryId === 'general' } }, h("div", { class: "settings-content" }, h("h3", null, this.t('settings.general.title', 'General Settings')), h("div", { class: "settings-group" }, h("div", { class: "settings-item" }, h("label", { class: "settings-label" }, this.t('settings.general.theme.label', 'Theme')), h("p", { class: "settings-description" }, this.t('settings.general.theme.description', 'Select a registered color theme for the editor interface.')), h("kritzel-dropdown", { options: this.availableThemes.map(t => ({ value: t, label: t })), value: this.theme, onValueChanged: this.handleThemeChange })), this.availableLocales.length > 0 && (h("div", { class: "settings-item" }, h("label", { class: "settings-label" }, this.t('settings.general.language.label', 'Language')), h("p", { class: "settings-description" }, this.t('settings.general.language.description', 'Select the display language for the editor interface.')), h("kritzel-dropdown", { options: this.availableLocales.map(l => ({ value: l.code, label: l.label })), value: this.locale, onValueChanged: this.handleLocaleChange }))), h("div", { class: "settings-item" }, h("label", { class: "settings-label" }, this.t('settings.general.lockDrawingScale.label', 'Lock Drawing Scale')), h("p", { class: "settings-description" }, this.t('settings.general.lockDrawingScale.description', 'When enabled, drawn objects maintain a fixed visual size regardless of the current zoom level.')), h("kritzel-slide-toggle", { checked: this.lockDrawingScale, label: this.t('settings.general.lockDrawingScale.label', 'Lock Drawing Scale'), onCheckedChange: this.handleLockDrawingScaleChange }))))), h("div", { class: { 'settings-tab-panel': true, 'is-active': this.selectedCategoryId === 'viewport' } }, h("div", { class: "settings-content" }, h("h3", null, this.t('settings.viewport.title', 'Viewport Settings')), h("div", { class: "settings-group" }, h("div", { class: "settings-item" }, h("label", { class: "settings-label" }, this.t('settings.viewport.minZoom.label', 'Minimum Zoom Level')), h("p", { class: "settings-description" }, this.t('settings.viewport.minZoom.description', 'Sets the minimum zoom level. Lower values allow zooming out further to see more of the canvas.')), h("kritzel-numeric-input", { value: this.scaleMin, min: 0.0001, max: 1, step: 0.0001, onValueChange: this.handleScaleMinChange })), h("div", { class: "settings-item" }, h("label", { class: "settings-label" }, this.t('settings.viewport.maxZoom.label', 'Maximum Zoom Level')), h("p", { class: "settings-description" }, this.t('settings.viewport.maxZoom.description', 'Sets the maximum zoom level. Higher values allow zooming in closer for detailed work.')), h("kritzel-numeric-input", { value: this.scaleMax, min: 1, max: 1000, step: 1, onValueChange: this.handleScaleMaxChange })), h("div", { class: "settings-item" }, h("label", { class: "settings-label" }, this.t('settings.viewport.boundaryLeft.label', 'Viewport Boundary Left')), h("p", { class: "settings-description" }, this.t('settings.viewport.boundaryLeft.description', 'Left boundary in world coordinates. Set to limit how far left the viewport can pan.')), h("kritzel-numeric-input", { value: this.viewportBoundaryLeft, step: 100, placeholder: this.t('settings.viewport.boundaryPlaceholder', 'Infinite'), onValueChange: this.handleViewportBoundaryLeftChange })), h("div", { class: "settings-item" }, h("label", { class: "settings-label" }, this.t('settings.viewport.boundaryRight.label', 'Viewport Boundary Right')), h("p", { class: "settings-description" }, this.t('settings.viewport.boundaryRight.description', 'Right boundary in world coordinates. Set to limit how far right the viewport can pan.')), h("kritzel-numeric-input", { value: this.viewportBoundaryRight, step: 100, placeholder: this.t('settings.viewport.boundaryPlaceholder', 'Infinite'), onValueChange: this.handleViewportBoundaryRightChange })), h("div", { class: "settings-item" }, h("label", { class: "settings-label" }, this.t('settings.viewport.boundaryTop.label', 'Viewport Boundary Top')), h("p", { class: "settings-description" }, this.t('settings.viewport.boundaryTop.description', 'Top boundary in world coordinates. Set to limit how far up the viewport can pan.')), h("kritzel-numeric-input", { value: this.viewportBoundaryTop, step: 100, placeholder: this.t('settings.viewport.boundaryPlaceholder', 'Infinite'), onValueChange: this.handleViewportBoundaryTopChange })), h("div", { class: "settings-item" }, h("label", { class: "settings-label" }, this.t('settings.viewport.boundaryBottom.label', 'Viewport Boundary Bottom')), h("p", { class: "settings-description" }, this.t('settings.viewport.boundaryBottom.description', 'Bottom boundary in world coordinates. Set to limit how far down the viewport can pan.')), h("kritzel-numeric-input", { value: this.viewportBoundaryBottom, step: 100, placeholder: this.t('settings.viewport.boundaryPlaceholder', 'Infinite'), onValueChange: this.handleViewportBoundaryBottomChange }))))), h("div", { class: { 'settings-tab-panel': true, 'is-active': this.selectedCategoryId === 'shortcuts' } }, h("div", { class: "settings-content" }, h("h3", null, this.t('settings.shortcuts.title', 'Keyboard Shortcuts')), h("div", { class: "shortcuts-list" }, Array.from(this.groupShortcutsByCategory()).map(([category, shortcuts]) => (h("div", { class: "shortcuts-category", key: category }, h("h4", { class: "shortcuts-category-title" }, category), h("div", { class: "shortcuts-group" }, shortcuts.map(shortcut => (h("div", { class: "shortcut-item", key: shortcut.key + shortcut.label }, h("span", { class: "shortcut-label" }, shortcut.label), h("kbd", { class: "shortcut-key" }, this.formatKeyCombo(shortcut)))))))))))), h("div", { class: { 'settings-tab-panel': true, 'is-active': this.selectedCategoryId === 'developer' } }, h("div", { class: "settings-content" }, h("h3", null, this.t('settings.developer.title', 'Developer Options')), h("div", { class: "settings-group" }, h("div", { class: "settings-item" }, h("label", { class: "settings-label" }, this.t('settings.developer.showViewportInfo.label', 'Show Viewport Info')), h("p", { class: "settings-description" }, this.t('settings.developer.showViewportInfo.description', 'Display viewport debug information such as position, zoom level, and boundaries.')), h("kritzel-slide-toggle", { checked: this.debugInfo.showViewportInfo, label: this.t('settings.developer.showViewportInfo.label', 'Show Viewport Info'), onCheckedChange: this.handleDebugInfoChange('showViewportInfo') })), h("div", { class: "settings-item" }, h("label", { class: "settings-label" }, this.t('settings.developer.showObjectInfo.label', 'Show Object Info')), h("p", { class: "settings-description" }, this.t('settings.developer.showObjectInfo.description', 'Display debug information about objects on the canvas.')), h("kritzel-slide-toggle", { checked: this.debugInfo.showObjectInfo, label: this.t('settings.developer.showObjectInfo.label', 'Show Object Info'), onCheckedChange: this.handleDebugInfoChange('showObjectInfo') })), h("div", { class: "settings-item" }, h("label", { class: "settings-label" }, this.t('settings.developer.showSyncProviderInfo.label', 'Show Sync Provider Info')), h("p", { class: "settings-description" }, this.t('settings.developer.showSyncProviderInfo.description', 'Display debug information about the sync provider connection status.')), h("kritzel-slide-toggle", { checked: this.debugInfo.showSyncProviderInfo, label: this.t('settings.developer.showSyncProviderInfo.label', 'Show Sync Provider Info'), onCheckedChange: this.handleDebugInfoChange('showSyncProviderInfo') })), h("div", { class: "settings-item" }, h("label", { class: "settings-label" }, this.t('settings.developer.showMigrationInfo.label', 'Show Migration Info')), h("p", { class: "settings-description" }, this.t('settings.developer.showMigrationInfo.description', 'Display debug information about data migrations.')), h("kritzel-slide-toggle", { checked: this.debugInfo.showMigrationInfo, label: this.t('settings.developer.showMigrationInfo.label', 'Show Migration Info'), onCheckedChange: this.handleDebugInfoChange('showMigrationInfo') }))))), h("div", { class: { 'settings-tab-panel': true, 'is-active': this.selectedCategoryId === 'about' } }, h("div", { class: "settings-content" }, h("h3", null, this.t('settings.about.title', 'About')), h("p", null, this.t('settings.about.description', 'Kritzel - A drawing application')), h("p", { class: "version-info" }, "Version ", KRITZEL_VERSION), h("p", { class: "version-info" }, "App-State Schema v", CURRENT_APP_STATE_SCHEMA_VERSION), h("p", { class: "version-info" }, "Workspace Schema v", CURRENT_WORKSPACE_SCHEMA_VERSION)))));
    }
    render() {
        return (h(Host, { key: '0461408163ca90999eef2885be2496264cae94ac' }, h("kritzel-dialog", { key: 'bbeb801a3024887d9e4aff94128f50d15a0a6820', isOpen: this.isDialogOpen, dialogTitle: this.t('settings.dialogTitle', 'Settings'), size: "large", contained: true, onDialogClose: this.closeDialog }, h("kritzel-master-detail", { key: 'ee2013cb3e7588b0b25c0f6175e79290de21cf09', items: this.categories, selectedItemId: this.selectedCategoryId, onItemSelect: this.handleCategorySelect }, this.renderCategoryContent()))));
    }
    static get watchers() { return {
        "settings": [{
                "onSettingsPropChange": 0
            }]
    }; }
};
KritzelSettings.style = kritzelSettingsCss();

export { KritzelSettings as kritzel_settings };
//# sourceMappingURL=kritzel-settings.entry.esm.js.map

//# sourceMappingURL=kritzel-settings.entry.js.map