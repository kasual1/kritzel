import { r as registerInstance, a as createEvent, e as getElement, h, d as Host } from './index-BDyeD8t8.js';
import { A as ABSOLUTE_SCALE_MAX, a as ABSOLUTE_SCALE_MIN, K as KritzelSelectionTool, D as DEFAULT_BRUSH_CONFIG, b as KritzelBrushTool, c as KritzelEraserTool, d as DEFAULT_LINE_TOOL_CONFIG, e as KritzelLineTool, S as ShapeType, f as DEFAULT_SHAPE_CONFIG, g as KritzelShapeTool, h as DEFAULT_TEXT_CONFIG, i as KritzelTextTool, j as KritzelImageTool, k as KritzelAlignment, l as hasRemoteSyncProvider, m as DEFAULT_SYNC_CONFIG, n as DEFAULT_ASSET_STORAGE_CONFIG, O as ObjectHelper, r as resolveTextToolAvailableFonts, T as ThemeHelper, o as darkTheme, p as lightTheme, q as KritzelSelectionGroup, s as KritzelSelectionBox, t as KritzelIconRegistry, u as KritzelFontRegistry, v as KritzelKeyboardHelper, w as KritzelDevicesHelper } from './index-BEzQin2J.js';
import './yjs-CvNgPRai.js';

const kritzelEditorCss = () => `kritzel-editor{display:flex;margin:0;position:relative;container-type:inline-size;overflow:hidden;width:100%;height:100%;align-items:center;justify-content:center;touch-action:manipulation;user-select:none;-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;text-align:start;line-height:normal}.editor-content{position:absolute;inset:0}.editor-content>kritzel-engine{position:absolute;inset:0;z-index:0}kritzel-toolbar{position:absolute;z-index:2;left:0;right:0;margin-inline:auto;width:max-content;max-width:calc(100% - 16px);bottom:var(--kritzel-editor-toolbar-bottom, 14px);transition:transform var(--kritzel-editor-toolbar-transition-duration, 0.1s) var(--kritzel-editor-toolbar-transition, ease-in-out)}kritzel-toolbar.keyboard-open{transform:var(--kritzel-editor-toolbar-transform, translateY(300%))}.top-left-buttons{position:absolute;z-index:2;top:var(--kritzel-editor-top-left-buttons-top, 14px);left:var(--kritzel-editor-top-left-buttons-left, 14px);display:flex;align-items:flex-start;gap:8px}.top-center-notification-layer{position:absolute;top:var(--kritzel-editor-top-center-notification-top, 14px);left:0;right:0;z-index:var(--kritzel-editor-top-center-notification-z-index, 10001);display:flex;justify-content:center;pointer-events:none}.top-center-notification-container{width:min(90vw, 420px);pointer-events:auto;animation:kritzel-notification-slide-in var(--kritzel-editor-notification-animation-duration, 220ms)      var(--kritzel-editor-notification-animation-easing, cubic-bezier(0.22, 1, 0.36, 1))}.top-center-notification-container.is-dismissing{animation:kritzel-notification-fade-out var(--kritzel-editor-notification-dismiss-animation-duration, 180ms)      var(--kritzel-editor-notification-dismiss-animation-easing, ease-in) forwards}@keyframes kritzel-notification-slide-in{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}@keyframes kritzel-notification-fade-out{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-6px)}}@media (prefers-reduced-motion: reduce){.top-center-notification-container{animation:none}}.top-right-buttons{position:absolute;z-index:2;top:var(--kritzel-editor-top-right-buttons-top, 14px);right:var(--kritzel-editor-top-right-buttons-right, 14px);display:flex;align-items:center;gap:8px}.bottom-left-buttons{position:absolute;z-index:2;left:var(--kritzel-editor-top-left-buttons-left, 14px);bottom:var(--kritzel-editor-toolbar-bottom, 14px);display:flex;align-items:flex-end}@container (max-width: 767px){.bottom-left-buttons{display:none}}.top-right-button{display:flex;align-items:center;justify-content:center;width:50px;height:50px;padding:0;border:var(--kritzel-split-button-border, 1px solid #ebebeb);border-radius:var(--kritzel-split-button-border-radius, 12px);background-color:var(--kritzel-split-button-background-color, #ffffff);cursor:var(--kritzel-global-pointer-cursor, pointer);box-shadow:var(--kritzel-split-button-box-shadow, 0 0 3px rgba(0, 0, 0, 0.08));transition:background-color 150ms ease;-webkit-tap-highlight-color:transparent}.top-right-button:hover{background-color:#f5f5f5}.top-right-button:active{background-color:#ebebeb}`;

const KritzelEditor = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.isReady = createEvent(this, "isReady", 7);
        this.activeWorkspaceChange = createEvent(this, "activeWorkspaceChange", 7);
        this.objectsChange = createEvent(this, "objectsChange", 7);
        this.objectsAdded = createEvent(this, "objectsAdded", 7);
        this.objectsRemoved = createEvent(this, "objectsRemoved", 7);
        this.objectsUpdated = createEvent(this, "objectsUpdated", 7);
        this.objectsSelectionChange = createEvent(this, "objectsSelectionChange", 7);
        this.undoStateChange = createEvent(this, "undoStateChange", 7);
        this.themeChange = createEvent(this, "themeChange", 7);
        this.localeChange = createEvent(this, "localeChange", 7);
        this.viewportChange = createEvent(this, "viewportChange", 7);
        this.logout = createEvent(this, "logout", 7);
        this.login = createEvent(this, "login", 7);
        this.isPublicChange = createEvent(this, "isPublicChange", 7);
        this.awarenessChange = createEvent(this, "awarenessChange", 7);
    }
    get host() { return getElement(this); }
    scaleMax = ABSOLUTE_SCALE_MAX;
    scaleMin = ABSOLUTE_SCALE_MIN;
    lockDrawingScale = true;
    viewportBoundaryLeft = -Infinity;
    viewportBoundaryRight = Infinity;
    viewportBoundaryTop = -Infinity;
    viewportBoundaryBottom = Infinity;
    debugInfo = {
        showViewportInfo: false,
        showObjectInfo: false,
        showSyncProviderInfo: true,
        showMigrationInfo: true,
        showAssetResolverInfo: false,
    };
    user;
    activeUsers;
    toolbarItems = [
        {
            name: 'selection',
            type: 'tool',
            isDefault: true,
            tool: KritzelSelectionTool,
            icon: 'cursor',
        },
        {
            name: 'brush',
            type: 'tool',
            tool: KritzelBrushTool,
            icon: 'pen',
            config: DEFAULT_BRUSH_CONFIG,
        },
        {
            name: 'eraser',
            type: 'tool',
            tool: KritzelEraserTool,
            icon: 'eraser',
        },
        {
            name: 'line',
            type: 'tool',
            tool: KritzelLineTool,
            icon: 'arrow',
            config: DEFAULT_LINE_TOOL_CONFIG,
        },
        {
            name: 'shape',
            type: 'tool',
            tool: KritzelShapeTool,
            icon: 'shapeRectangle',
            config: DEFAULT_SHAPE_CONFIG,
            subOptions: [
                { id: 'rectangle', icon: 'shapeRectangle', label: 'Rectangle', value: ShapeType.Rectangle, toolProperty: 'shapeType' },
                { id: 'ellipse', icon: 'shapeEllipse', label: 'Ellipse', value: ShapeType.Ellipse, toolProperty: 'shapeType' },
                { id: 'triangle', icon: 'shapeTriangle', label: 'Triangle', value: ShapeType.Triangle, toolProperty: 'shapeType' },
            ],
        },
        {
            name: 'text',
            type: 'tool',
            tool: KritzelTextTool,
            icon: 'type',
            config: DEFAULT_TEXT_CONFIG,
        },
        {
            name: 'image',
            type: 'tool',
            tool: KritzelImageTool,
            icon: 'image',
        },
        {
            name: 'config',
            type: 'config',
        },
    ];
    globalContextMenuItems = [
        {
            label: 'menu.paste',
            icon: 'paste',
            action: menu => this.engineRef.paste(menu.x, menu.y),
        },
        {
            label: 'menu.selectAll',
            icon: 'selectAll',
            action: () => this.selectAllObjectsInViewport(),
        },
    ];
    objectContextMenuItems = [
        { label: 'menu.copy', icon: 'copy', group: 'clipboard', action: () => this.engineRef.copy() },
        { label: 'menu.cut', icon: 'cut', group: 'clipboard', action: () => this.engineRef.cut() },
        {
            label: 'menu.paste',
            icon: 'paste',
            group: 'clipboard',
            action: (menu, _) => this.engineRef.paste(menu.x, menu.y),
        },
        {
            label: 'menu.export',
            icon: 'upload',
            group: 'clipboard',
            isVisible: (_, objects) => this.canExportObjects(objects),
            action: (_, objects) => {
                const format = this.getPreferredExportFormat(objects);
                if (!format) {
                    return;
                }
                void this.engineRef.exportSelectedObject(format);
            },
        },
        {
            label: 'menu.order',
            icon: 'ordering',
            group: 'other',
            children: [
                { label: 'menu.bringToFront', icon: 'bringToFront', action: () => this.engineRef.bringToFront() },
                { label: 'menu.sendToBack', icon: 'sendToBack', action: () => this.engineRef.sendToBack() },
                { label: 'menu.moveUp', icon: 'arrowUpFromDot', action: () => this.engineRef.bringForward() },
                { label: 'menu.moveDown', icon: 'arrowDownFromDot', action: () => this.engineRef.sendBackward() },
            ],
        },
        {
            label: 'menu.align',
            icon: 'align',
            group: 'other',
            children: [
                { label: 'menu.alignLeft', icon: 'alignStartVertical', action: () => this.engineRef.alignObjects(KritzelAlignment.StartHorizontal) },
                { label: 'menu.alignCenterHorizontal', icon: 'alignCenterHorizontal', action: () => this.engineRef.alignObjects(KritzelAlignment.CenterHorizontal) },
                { label: 'menu.alignRight', icon: 'alignEndVertical', action: () => this.engineRef.alignObjects(KritzelAlignment.EndHorizontal) },
                { label: 'menu.alignTop', icon: 'alignStartHorizontal', action: () => this.engineRef.alignObjects(KritzelAlignment.StartVertical) },
                { label: 'menu.alignCenterVertical', icon: 'alignCenterVertical', action: () => this.engineRef.alignObjects(KritzelAlignment.CenterVertical) },
                { label: 'menu.alignBottom', icon: 'alignEndHorizontal', action: () => this.engineRef.alignObjects(KritzelAlignment.EndVertical) },
            ],
        },
        {
            label: 'menu.group',
            icon: 'group',
            group: 'other',
            children: [
                {
                    label: 'menu.group',
                    icon: 'group',
                    action: () => this.engineRef.group(),
                },
                {
                    label: 'menu.ungroup',
                    icon: 'ungroup',
                    action: () => this.engineRef.ungroup(),
                },
            ],
        },
        { label: 'menu.delete', icon: 'delete', group: 'edit', action: () => this.engineRef.delete() },
    ];
    moreMenuItems = [
        {
            id: 'share',
            label: 'menu.share',
            icon: 'share',
            isVisible: async () => hasRemoteSyncProvider(this.syncConfig),
            action: () => {
                if (!this.isLoggedIn && this.loginConfig) {
                    this.openLoginDialog();
                    return;
                }
                this.shareDialogRef.open();
            },
        },
        {
            id: 'export',
            label: 'menu.export',
            icon: 'upload',
            action: async () => {
                const preview = await this.engineRef.getScreenshot('png');
                this.exportRef.open(preview ?? undefined);
            },
        },
        {
            id: 'import',
            label: 'menu.import',
            icon: 'download',
            action: () => this.engineRef.importFromFile(),
        },
        {
            id: 'settings',
            label: 'menu.settings',
            icon: 'settings',
            action: () => this.settingsRef.open(),
        },
    ];
    themes;
    theme = 'light';
    /** License key that, when valid, removes the "Powered by Kritzel" watermark. */
    licenseKey;
    /** The current locale (language) code applied to the editor, e.g. 'en', 'de', 'fr'. */
    locale = 'en';
    /** An array of available locale definitions (with optional partial term overrides). */
    locales;
    /** The locale used to resolve terms missing from the active locale. */
    fallbackLocale = 'en';
    customSvgIcons = {};
    /**
     * Registers fonts for runtime usage (for example custom object rendering).
    * Text-tool config tooltip options are controlled via toolbarItems[].config.availableFonts.
     */
    customFonts = {};
    isPanningEnabled = true;
    isZoomingEnabled = true;
    isToolbarVisible = true;
    isUtilityPanelVisible = true;
    isWorkspaceManagerVisible = true;
    isMoreMenuVisible = true;
    isZoomPanelVisible = true;
    syncConfig = DEFAULT_SYNC_CONFIG;
    assetStorageConfig = DEFAULT_ASSET_STORAGE_CONFIG;
    /** The element to use as the target for the cursor. Defaults to the editor container if not set. */
    cursorTarget;
    /** Optional login configuration. When provided, a "Sign in" button is shown that opens a login dialog with the configured providers. */
    loginConfig;
    /** Optional unique identifier for namespacing storage keys across multiple editor instances. */
    editorId;
    /** Optional workspace ID to set as active. If provided, the editor will automatically activate the workspace with this ID. */
    activeWorkspaceId;
    /** Authoritative workspace catalog for this editor instance. When provided, provider-only workspaces are hidden but not deleted. */
    workspaces;
    isReady;
    activeWorkspaceChange;
    objectsChange;
    objectsAdded;
    objectsRemoved;
    objectsUpdated;
    objectsSelectionChange;
    undoStateChange;
    themeChange;
    localeChange;
    viewportChange;
    logout;
    login;
    isPublicChange;
    awarenessChange;
    isEngineReady = false;
    isToolbarReady = false;
    isWorkspaceManagerReady = false;
    availableWorkspaces = [];
    activeWorkspace;
    isVirtualKeyboardOpen = false;
    undoState = null;
    isBackToContentButtonVisible = false;
    /** Localized strings for editor-owned UI (e.g. the more menu), resolved from the active locale. */
    resolvedTerms = {};
    /** Available locales as `{ code, label }` options for the settings language selector. */
    availableLocaleOptions = [];
    currentZoomPercent = 100;
    shortcuts = [];
    currentIsPublic = false;
    isEditorVisible = false;
    activeNotification;
    isNotificationDismissing = false;
    contextMenuState;
    resolvedMoreMenuItems = [];
    isLoadingOverlayVisible = false;
    loadingOverlayShowTimeout;
    loadingOverlayHideTimeout;
    loadingOverlayShownTimestamp;
    loadingOverlayDelayMs = 300;
    loadingOverlayMinDisplayDurationMs = 400;
    notificationDismissTimeout;
    notificationDismissAnimationTimeout;
    notificationDisplayDurationMs = 5000;
    notificationDismissAnimationDurationMs = 180;
    isNotificationHovered = false;
    customFontsLoadVersion = 0;
    customFontsReady = Promise.resolve();
    onIsEngineReady(newValue) {
        if (newValue && this.isToolbarReady) {
            this.checkIsReady();
        }
    }
    onIsToolbarReady(newValue) {
        if (newValue && this.isEngineReady) {
            this.checkIsReady();
        }
    }
    onAvailableWorkspacesChange(newWorkspaces) {
        const activeWorkspace = this.activeWorkspace;
        if (activeWorkspace) {
            const updatedActiveWorkspace = newWorkspaces.find(ws => ws.id === activeWorkspace.id);
            if (updatedActiveWorkspace && updatedActiveWorkspace !== activeWorkspace) {
                this.activeWorkspace = updatedActiveWorkspace;
            }
        }
        // If activeWorkspaceId is set, try to keep it in sync with the updated workspaces list
        if (this.activeWorkspaceId) {
            const workspaceWithId = newWorkspaces.find(ws => ws.id === this.activeWorkspaceId);
            if (workspaceWithId && workspaceWithId !== this.activeWorkspace) {
                this.activeWorkspace = workspaceWithId;
            }
        }
    }
    onActiveWorkspaceChange() {
        this.updateCurrentIsPublic();
    }
    onCustomFontsChange(newValue) {
        void this.registerCustomFonts(newValue);
    }
    onCustomSvgIconsChange(newValue) {
        this.registerCustomSvgIcons(newValue);
    }
    onMoreMenuItemsChange() {
        this.recomputeMoreMenuItems();
    }
    onSyncConfigChange() {
        this.recomputeMoreMenuItems();
    }
    onLoginConfigChange() {
        this.recomputeMoreMenuItems();
    }
    onUserChange() {
        this.recomputeMoreMenuItems();
    }
    onActiveWorkspaceIdChange(newId) {
        // If no ID is provided, do nothing (allows other logic to control activeWorkspace)
        if (!newId) {
            return;
        }
        // If workspaces are not loaded yet, the watch will fire again once they are
        if (this.availableWorkspaces.length === 0) {
            return;
        }
        // Find the workspace with the matching ID
        const workspace = this.availableWorkspaces.find(ws => ws.id === newId);
        if (workspace) {
            // Only update if it's different from the current activeWorkspace
            if (workspace !== this.activeWorkspace) {
                this.activeWorkspace = workspace;
            }
        }
        else {
            console.warn(`[KritzelEditor] No workspace found with ID: ${newId}`);
        }
    }
    onCurrentThemeChange() {
        this.applyTheme();
        setTimeout(() => this.setOsSpecificCssVariables(), 0);
        if (this.engineRef) {
            this.engineRef.saveSettings(this.currentSettingsConfig);
        }
    }
    onThemesChange() {
        this.applyTheme();
    }
    onLocaleChange(newValue) {
        if (this.engineRef) {
            this.engineRef.setLocale(newValue);
            this.engineRef.saveSettings(this.currentSettingsConfig);
            void this.refreshLocalizedTerms();
        }
    }
    onLocalesChange(newValue) {
        if (this.engineRef) {
            void this.engineRef.configureLocales(newValue).then(() => this.refreshLocalizedTerms());
        }
    }
    /**
     * Refreshes the editor-owned localized strings (e.g. the more menu and the
     * strings forwarded to child UI components) from the engine's localization
     * manager for the active locale.
     */
    async refreshLocalizedTerms() {
        if (!this.engineRef) {
            return;
        }
        const resolvedLocale = await this.engineRef.getLocale();
        if (resolvedLocale !== this.locale) {
            // Auto-selected because the previous locale isn't in the (possibly replaced) available set.
            this.locale = resolvedLocale;
            this.localeChange.emit(resolvedLocale);
        }
        this.resolvedTerms = await this.engineRef.getResolvedTerms();
        this.availableLocaleOptions = await this.engineRef.getAvailableLocaleOptions();
        this.recomputeMoreMenuItems();
    }
    onTouchStart(event) {
        if (event.cancelable) {
            event.preventDefault();
        }
    }
    async getObjectById(id) {
        return this.engineRef.getObjectById(id);
    }
    async addObject(object) {
        return this.engineRef.addObject(object);
    }
    async addObjects(objects) {
        return this.engineRef.addObjects(objects);
    }
    async updateObject(object, updatedProperties) {
        return this.engineRef.updateObject(object, updatedProperties);
    }
    async removeObject(object) {
        return this.engineRef.removeObject(object);
    }
    async removeObjects(objects) {
        return this.engineRef.removeObjects(objects);
    }
    async getSelectedObjects() {
        return this.engineRef.getSelectedObjects();
    }
    async selectObjects(objects) {
        return this.engineRef.selectObjects(objects);
    }
    async selectAllObjectsInViewport() {
        return this.engineRef.selectAllObjectsInViewport();
    }
    async clearSelection() {
        this.engineRef.clearSelection();
    }
    async centerObjectInViewport(object) {
        return this.engineRef.centerObjectInViewport(object);
    }
    async panToObject(object) {
        return this.engineRef.panToObject(object);
    }
    async backToContent() {
        return this.engineRef.backToContent();
    }
    async centerAllObjects(animate = true) {
        return this.engineRef.centerAllObjects(animate);
    }
    async centerObjects(objects, animate = true) {
        return this.engineRef.centerObjects(objects, animate);
    }
    async setViewport(x, y, scale) {
        return this.engineRef.setViewport(x, y, scale);
    }
    async panTo(x, y) {
        return this.engineRef.panTo(x, y);
    }
    async zoomTo(scale, worldX, worldY) {
        return this.engineRef.zoomTo(scale, worldX, worldY);
    }
    async zoomIn(factor = 1.6, duration = 200) {
        return this.engineRef.zoomIn(factor, duration);
    }
    async zoomOut(factor = 1.6, duration = 200) {
        return this.engineRef.zoomOut(factor, duration);
    }
    async getViewport() {
        return this.engineRef.getViewport();
    }
    async screenToWorld(x, y) {
        return this.engineRef.screenToWorld(x, y);
    }
    async worldToScreen(x, y) {
        return this.engineRef.worldToScreen(x, y);
    }
    async setActiveWorkspace(id) {
        return this.engineRef.setActiveWorkspace(id);
    }
    async createWorkspace(workspace) {
        return this.engineRef.createWorkspace(workspace);
    }
    async updateWorkspace(workspace) {
        return this.engineRef.updateWorkspace(workspace);
    }
    async deleteWorkspace(workspace) {
        return this.engineRef.deleteWorkspace(workspace);
    }
    async getWorkspaces() {
        return this.engineRef.getWorkspaces();
    }
    async getActiveWorkspace() {
        return this.engineRef.getActiveWorkspace();
    }
    async loadSharedWorkspace(token) {
        return this.engineRef.loadSharedWorkspace(token);
    }
    async reinitSync() {
        return this.engineRef.reinitSync();
    }
    async registerTool(toolName, toolClass, toolConfig) {
        return this.engineRef.registerTool(toolName, toolClass, toolConfig);
    }
    async setActiveTool(toolName) {
        return this.engineRef.setActiveTool(toolName);
    }
    async disable() {
        return this.engineRef.disable();
    }
    async enable() {
        return this.engineRef.enable();
    }
    async copy() {
        return this.engineRef.copy();
    }
    async cut() {
        return this.engineRef.cut();
    }
    async paste(x, y) {
        return this.engineRef.paste(x, y);
    }
    async delete() {
        return this.engineRef.delete();
    }
    async bringForward(object) {
        return this.engineRef.bringForward(object);
    }
    async sendBackward(object) {
        return this.engineRef.sendBackward(object);
    }
    async bringToFront(object) {
        return this.engineRef.bringToFront(object);
    }
    async sendToBack(object) {
        return this.engineRef.sendToBack(object);
    }
    async alignObjects(alignment) {
        return this.engineRef.alignObjects(alignment);
    }
    async group() {
        return this.engineRef.group();
    }
    async ungroup() {
        return this.engineRef.ungroup();
    }
    async undo() {
        return this.engineRef.undo();
    }
    async redo() {
        return this.engineRef.redo();
    }
    async getScreenshot(format = 'png') {
        return this.engineRef.getScreenshot(format);
    }
    async exportViewportAsPng() {
        return this.engineRef.exportViewportAsPng();
    }
    async exportViewportAsSvg() {
        return this.engineRef.exportViewportAsSvg();
    }
    async getSelectedObjectSupportedExportFormats() {
        return this.engineRef.getSelectedObjectSupportedExportFormats();
    }
    async canExportSelectedObjectAs(format) {
        return this.engineRef.canExportSelectedObjectAs(format);
    }
    async exportSelectedObject(format) {
        return this.engineRef.exportSelectedObject(format);
    }
    async exportAsJson() {
        return this.engineRef.exportAsJson();
    }
    async importFromJson(json) {
        return this.engineRef.importFromJson(json);
    }
    async downloadAsJson(filename) {
        return this.engineRef.downloadAsJson(filename);
    }
    async importFromFile() {
        return this.engineRef.importFromFile();
    }
    async loadObjectsFromJson(json) {
        return this.engineRef.loadObjectsFromJson(json);
    }
    async getObjectsTotalCount() {
        return this.engineRef.getObjectsTotalCount();
    }
    async getAllObjects() {
        return this.engineRef.getAllObjects();
    }
    async findObjects(predicate) {
        return this.engineRef.findObjects(predicate);
    }
    async getObjectsInViewport() {
        return this.engineRef.getObjectsInViewport();
    }
    async hideContextMenu() {
        return this.engineRef.hideContextMenu();
    }
    async openContextMenu(options) {
        return this.engineRef.openContextMenu(options);
    }
    async openWorkspaceManagerMenu() {
        if (!this.isWorkspaceManagerVisible) {
            return;
        }
        await this.workspaceManagerRef?.open();
    }
    async closeWorkspaceManagerMenu() {
        await this.workspaceManagerRef?.close();
    }
    async openMoreMenu() {
        if (!this.isMoreMenuVisible) {
            return;
        }
        await this.moreMenuRef?.open();
    }
    async closeMoreMenu() {
        await this.moreMenuRef?.close();
    }
    async openUserDialog() {
        await this.currentUserDialogRef?.open();
    }
    async closeUserDialog() {
        await this.currentUserDialogRef?.close();
    }
    async openExportDialog() {
        const preview = await this.engineRef.getScreenshot('png');
        await this.exportRef?.open(preview ?? undefined);
    }
    async closeExportDialog() {
        await this.exportRef?.close();
    }
    async openImportDialog() {
        await this.engineRef.importFromFile();
    }
    async closeImportDialog() {
        await this.engineRef.cancelImportFromFile();
    }
    async openSettingsDialog() {
        await this.settingsRef?.open();
    }
    async closeSettingsDialog() {
        await this.settingsRef?.close();
    }
    async openShareDialog() {
        await this.shareDialogRef?.open();
    }
    async closeShareDialog() {
        await this.shareDialogRef?.close();
    }
    async triggerSelectionChange() {
        return this.engineRef.triggerSelectionChange();
    }
    async beginSceneBootstrap() {
        return this.engineRef.beginSceneBootstrap();
    }
    async endSceneBootstrap() {
        return this.engineRef.endSceneBootstrap();
    }
    async getDisplayableShortcuts() {
        return this.engineRef.getDisplayableShortcuts();
    }
    async openLoginDialog() {
        this.loginDialogRef?.open();
    }
    async closeLoginDialog() {
        this.loginDialogRef?.close();
    }
    async setLoginLoading(provider) {
        this.loginDialogRef?.setLoading(provider);
    }
    /**
     * Sets the active locale (language) and re-renders the UI.
     * @param code - The locale code to activate, e.g. 'de'.
     */
    async setLocale(code) {
        this.locale = code;
        await this.engineRef?.setLocale(code);
    }
    /**
     * Gets the currently active locale code.
     */
    async getLocale() {
        return this.engineRef ? this.engineRef.getLocale() : this.locale;
    }
    /**
     * Gets the list of available locale codes (built-in and registered).
     */
    async getAvailableLocales() {
        return this.engineRef ? this.engineRef.getAvailableLocales() : [];
    }
    /**
     * Registers additional locale definitions (with optional partial term overrides).
     * @param locales - The locale definitions to register.
     */
    async registerLocales(locales) {
        await this.engineRef?.registerLocales(locales);
    }
    /**
     * Registers custom fonts for the editor runtime.
     * @param fonts - Mapping from font keys to family names or font definitions.
     * @remarks This no longer controls the text-tool config tooltip font options.
    * Configure tooltip fonts via toolbarItems[].config.availableFonts.
     */
    async registerFonts(fonts) {
        await this.registerCustomFonts(fonts);
    }
    /**
     * Resolves a term key to its translated string for the active locale.
     * @param key - The term key to resolve.
     * @param vars - Optional values for `{placeholder}` interpolation.
     */
    async t(key, vars) {
        return this.engineRef ? this.engineRef.t(key, vars) : key;
    }
    /**
     * Triggers a UI notification programmatically.
     * @param notification - Notification payload. `id` and `timestamp` are optional.
     */
    async triggerNotification(notification) {
        const normalizedNotification = {
            ...notification,
            id: notification.id ?? ObjectHelper.generateUUID(),
            timestamp: notification.timestamp ?? new Date(),
        };
        this.clearNotificationDismissAnimationTimer();
        this.isNotificationDismissing = false;
        this.isNotificationHovered = false;
        this.activeNotification = normalizedNotification;
        this.scheduleNotificationDismiss();
    }
    engineRef;
    toolbarRef;
    settingsRef;
    exportRef;
    splitButtonRef;
    workspaceManagerRef;
    moreMenuRef;
    shareDialogRef;
    loginDialogRef;
    currentUserDialogRef;
    componentWillLoad() {
        this.registerCustomSvgIcons(this.customSvgIcons);
        this.recomputeMoreMenuItems();
        this.loadSettingsFromStorage();
        this.applyTheme();
    }
    componentWillRender() {
        this.registerCustomSvgIcons(this.customSvgIcons);
    }
    isTextToolConfig(config) {
        return !!config && 'fontFamily' in config && 'size' in config && 'color' in config;
    }
    lastToolbarItemsRef = null;
    lastNormalizedToolbarItems = [];
    lastToolsSource = null;
    lastTools = [];
    getNormalizedToolbarItems() {
        if (this.toolbarItems !== this.lastToolbarItemsRef) {
            this.lastToolbarItemsRef = this.toolbarItems;
            this.lastNormalizedToolbarItems = this.normalizeToolbar(this.toolbarItems);
        }
        return this.lastNormalizedToolbarItems;
    }
    getTools() {
        const normalizedToolbarItems = this.getNormalizedToolbarItems();
        if (normalizedToolbarItems !== this.lastToolsSource) {
            this.lastToolsSource = normalizedToolbarItems;
            this.lastTools = normalizedToolbarItems
                .filter(item => item.type === 'tool' && !!item.tool)
                .map(item => ({ name: item.name, tool: item.tool, config: item.config }));
        }
        return this.lastTools;
    }
    normalizeToolbar(toolbarItems) {
        return toolbarItems.map(control => {
            if (!this.isTextToolConfig(control.config)) {
                return control;
            }
            return {
                ...control,
                config: {
                    ...control.config,
                    availableFonts: resolveTextToolAvailableFonts(control.config.availableFonts),
                },
            };
        });
    }
    recomputeMoreMenuItems() {
        if (this.moreMenuItems) {
            this.resolvedMoreMenuItems = this.moreMenuItems;
            return;
        }
    }
    applyTheme() {
        const themeObj = this.resolveThemeObject();
        ThemeHelper.applyThemeToElement(this.host, themeObj);
    }
    resolveThemeObject() {
        return this.themes?.find(t => t.name === this.theme) ?? (this.theme === 'dark' ? darkTheme : lightTheme);
    }
    componentDidLoad() {
        this.registerCustomFonts();
        this.listenForMobileKeyboard();
        this.setOsSpecificCssVariables();
    }
    disconnectedCallback() {
        this.clearLoadingOverlayShowTimer();
        this.clearLoadingOverlayHideTimer();
        this.clearNotificationDismissTimer();
        this.clearNotificationDismissAnimationTimer();
    }
    async checkIsReady() {
        await customElements.whenDefined('kritzel-editor');
        await customElements.whenDefined('kritzel-workspace-manager');
        await customElements.whenDefined('kritzel-toolbar');
        await customElements.whenDefined('kritzel-engine');
        await this.waitForCustomFontsReady();
        if (!this.isEngineReady || !this.isToolbarReady || !this.isWorkspaceManagerReady || !this.activeWorkspace) {
            return;
        }
        this.isEditorVisible = true;
        const { id, name, isPublic, createdAt, updatedAt } = this.activeWorkspace;
        this.isReady.emit({
            host: this.host,
            activeWorkspace: {
                id,
                name,
                isPublic,
                createdAt,
                updatedAt,
            },
            syncConfig: this.syncConfig,
            assetStorageConfig: this.assetStorageConfig,
            loginConfig: this.loginConfig,
            theme: this.theme,
        });
    }
    async onEngineReady(event) {
        this.isEngineReady = true;
        if (!event.detail.activeWorkspace) {
            return;
        }
        this.activeWorkspace = event.detail.activeWorkspace;
        this.availableWorkspaces = event.detail.workspaces;
        this.currentIsPublic = await this.engineRef.getIsPublic();
        await this.refreshLocalizedTerms();
        const viewport = await this.engineRef.getViewport();
        this.currentZoomPercent = this.getZoomPercentFromScale(viewport.scale);
        this.loadShortcuts();
    }
    handleWorkspacesChange(event) {
        event.stopPropagation();
        this.availableWorkspaces = event.detail;
    }
    async handleWorkspaceManagerChange(event) {
        event.stopPropagation();
        const workspace = event.detail;
        this.activeWorkspace = workspace ?? undefined;
        if (!workspace) {
            return;
        }
        await this.engineRef.setActiveWorkspace(workspace.id);
    }
    handleActiveWorkspaceChange(event) {
        event.stopPropagation();
        this.activeWorkspace = event.detail;
        if (!this.isEngineReady) {
            return;
        }
        const { id, name, isPublic, createdAt, updatedAt } = this.activeWorkspace;
        this.activeWorkspaceChange.emit({
            id,
            name,
            isPublic,
            createdAt,
            updatedAt,
        });
    }
    handleObjectsChange(event) {
        event.stopPropagation();
        this.objectsChange.emit(event.detail);
    }
    handleObjectsAdded(event) {
        event.stopPropagation();
        this.objectsAdded.emit(event.detail);
    }
    handleObjectsRemoved(event) {
        event.stopPropagation();
        this.objectsRemoved.emit(event.detail);
    }
    handleObjectsUpdated(event) {
        event.stopPropagation();
        this.objectsUpdated.emit(event.detail);
    }
    handleObjectsSelectionChange(event) {
        console.log(event.detail);
        event.stopPropagation();
        this.objectsSelectionChange.emit(event.detail);
    }
    handleUndoStateChange(event) {
        event.stopPropagation();
        this.undoStateChange.emit(event.detail);
        this.undoState = event.detail;
    }
    async handleObjectsInViewportChange(event) {
        event.stopPropagation();
        const hasVisibleObjects = this.getContentObjects(event.detail).length > 0;
        const hasAnyObjectsAtAll = this.getContentObjects(await this.engineRef.getAllObjects()).length > 0;
        this.isBackToContentButtonVisible = !hasVisibleObjects && hasAnyObjectsAtAll;
    }
    handleViewportChange(event) {
        event.stopPropagation();
        this.currentZoomPercent = this.getZoomPercentFromScale(event.detail.scale);
        this.viewportChange.emit(event.detail);
    }
    getZoomPercentFromScale(scale) {
        if (!Number.isFinite(scale) || scale <= 0) {
            return 100;
        }
        return Math.round(scale * 100);
    }
    handleAwarenessChange(event) {
        event.stopPropagation();
        this.awarenessChange.emit(event.detail);
    }
    handleNotificationsChange(event) {
        event.stopPropagation();
        this.clearNotificationDismissAnimationTimer();
        this.isNotificationDismissing = false;
        this.isNotificationHovered = false;
        this.activeNotification = event.detail;
        this.scheduleNotificationDismiss();
    }
    handleContextMenuStateChange(event) {
        event.stopPropagation();
        this.contextMenuState = event.detail.isVisible ? event.detail : undefined;
    }
    handleIsLoadingChange(event) {
        console.log('isLoadingChange event:', event.detail);
        event.stopPropagation();
        this.clearLoadingOverlayShowTimer();
        this.clearLoadingOverlayHideTimer();
        if (event.detail) {
            this.loadingOverlayShowTimeout = setTimeout(() => {
                this.isLoadingOverlayVisible = true;
                this.loadingOverlayShownTimestamp = Date.now();
                this.loadingOverlayShowTimeout = undefined;
            }, this.loadingOverlayDelayMs);
            return;
        }
        if (this.isLoadingOverlayVisible && this.loadingOverlayShownTimestamp !== undefined) {
            const elapsed = Date.now() - this.loadingOverlayShownTimestamp;
            const remaining = this.loadingOverlayMinDisplayDurationMs - elapsed;
            if (remaining > 0) {
                this.loadingOverlayHideTimeout = setTimeout(() => {
                    this.isLoadingOverlayVisible = false;
                    this.loadingOverlayShownTimestamp = undefined;
                    this.loadingOverlayHideTimeout = undefined;
                }, remaining);
                return;
            }
        }
        this.isLoadingOverlayVisible = false;
        this.loadingOverlayShownTimestamp = undefined;
    }
    clearLoadingOverlayShowTimer() {
        if (this.loadingOverlayShowTimeout) {
            clearTimeout(this.loadingOverlayShowTimeout);
            this.loadingOverlayShowTimeout = undefined;
        }
    }
    clearLoadingOverlayHideTimer() {
        if (this.loadingOverlayHideTimeout) {
            clearTimeout(this.loadingOverlayHideTimeout);
            this.loadingOverlayHideTimeout = undefined;
        }
    }
    handleContextMenuActionSelected(event) {
        const contextMenuState = this.contextMenuState;
        if (!contextMenuState || !event.detail.action) {
            void this.hideContextMenu();
            return;
        }
        event.detail.action({
            x: contextMenuState.worldPosition.x,
            y: contextMenuState.worldPosition.y,
        }, contextMenuState.objects);
        void this.hideContextMenu();
    }
    handleNotificationHoverChange(event) {
        event.stopPropagation();
        this.isNotificationHovered = event.detail;
        if (this.isNotificationHovered) {
            this.clearNotificationDismissTimer();
            return;
        }
        if (this.activeNotification && !this.isNotificationDismissing) {
            this.scheduleNotificationDismiss();
        }
    }
    scheduleNotificationDismiss() {
        this.clearNotificationDismissTimer();
        this.notificationDismissTimeout = setTimeout(() => {
            this.dismissNotification();
        }, this.notificationDisplayDurationMs);
    }
    clearNotificationDismissTimer() {
        if (this.notificationDismissTimeout) {
            clearTimeout(this.notificationDismissTimeout);
            this.notificationDismissTimeout = undefined;
        }
    }
    clearNotificationDismissAnimationTimer() {
        if (this.notificationDismissAnimationTimeout) {
            clearTimeout(this.notificationDismissAnimationTimeout);
            this.notificationDismissAnimationTimeout = undefined;
        }
    }
    dismissNotification = () => {
        this.clearNotificationDismissTimer();
        this.isNotificationHovered = false;
        if (!this.activeNotification || this.isNotificationDismissing) {
            return;
        }
        this.isNotificationDismissing = true;
        this.clearNotificationDismissAnimationTimer();
        this.notificationDismissAnimationTimeout = setTimeout(() => {
            this.activeNotification = undefined;
            this.isNotificationDismissing = false;
            this.notificationDismissAnimationTimeout = undefined;
        }, this.notificationDismissAnimationDurationMs);
    };
    handleSettingsChange(event) {
        this.scaleMin = event.detail.scaleMin;
        this.scaleMax = event.detail.scaleMax;
        this.lockDrawingScale = event.detail.lockDrawingScale;
        this.theme = event.detail.theme;
        if (typeof event.detail.locale === 'string' && event.detail.locale !== this.locale) {
            this.locale = event.detail.locale;
            this.localeChange.emit(event.detail.locale);
        }
        this.viewportBoundaryLeft = event.detail.viewportBoundaryLeft ?? -Infinity;
        this.viewportBoundaryRight = event.detail.viewportBoundaryRight ?? Infinity;
        this.viewportBoundaryTop = event.detail.viewportBoundaryTop ?? -Infinity;
        this.viewportBoundaryBottom = event.detail.viewportBoundaryBottom ?? Infinity;
        this.debugInfo = event.detail.debugInfo;
        if (this.engineRef) {
            this.engineRef.saveSettings(event.detail);
        }
        this.themeChange.emit(event.detail.theme);
    }
    handleToggleIsPublic = async (event) => {
        const isPublic = event.detail;
        const activeWorkspace = await this.engineRef.getActiveWorkspace();
        activeWorkspace.isPublic = isPublic;
        await this.engineRef.updateWorkspace(activeWorkspace);
        this.activeWorkspace = activeWorkspace.clone();
        this.isPublicChange.emit({ isPublic, workspaceId: activeWorkspace.id });
    };
    /**
     * Updates the currentIsPublic state from the active workspace and emits the isPublicChange event.
     */
    updateCurrentIsPublic() {
        const isPublic = this.activeWorkspace?.isPublic ?? false;
        const workspaceId = this.activeWorkspace?.id;
        this.currentIsPublic = isPublic;
        if (!workspaceId) {
            return;
        }
        this.isPublicChange.emit({ isPublic, workspaceId });
    }
    handleProviderLogin = (event) => {
        this.login.emit(event.detail);
    };
    handleCurrentUserLogout = () => {
        this.logout.emit();
    };
    get isLoggedIn() {
        return !!this.user && !this.user.isGuest;
    }
    canExportObjectsAs(objects, format) {
        if (!objects || objects.length !== 1) {
            return false;
        }
        const [selected] = objects;
        if (!ObjectHelper.isKritzelExportable(selected)) {
            return false;
        }
        return selected.getSupportedExportFormats().includes(format);
    }
    canExportObjects(objects) {
        return this.canExportObjectsAs(objects, 'png') || this.canExportObjectsAs(objects, 'svg');
    }
    getPreferredExportFormat(objects) {
        if (this.canExportObjectsAs(objects, 'png')) {
            return 'png';
        }
        if (this.canExportObjectsAs(objects, 'svg')) {
            return 'svg';
        }
        return null;
    }
    getSettingsStorageKey() {
        return this.editorId ? `kritzel-settings-${this.editorId}` : 'kritzel-settings';
    }
    loadSettingsFromStorage() {
        const stored = localStorage.getItem(this.getSettingsStorageKey());
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (typeof parsed.scaleMin === 'number') {
                    this.scaleMin = parsed.scaleMin;
                }
                if (typeof parsed.scaleMax === 'number') {
                    this.scaleMax = parsed.scaleMax;
                }
                if (typeof parsed.lockDrawingScale === 'boolean') {
                    this.lockDrawingScale = parsed.lockDrawingScale;
                }
                if (typeof parsed.theme === 'string') {
                    this.theme = parsed.theme;
                }
                if (typeof parsed.locale === 'string') {
                    this.locale = parsed.locale;
                }
                if (typeof parsed.viewportBoundaryLeft === 'number') {
                    this.viewportBoundaryLeft = parsed.viewportBoundaryLeft;
                }
                if (typeof parsed.viewportBoundaryRight === 'number') {
                    this.viewportBoundaryRight = parsed.viewportBoundaryRight;
                }
                if (typeof parsed.viewportBoundaryTop === 'number') {
                    this.viewportBoundaryTop = parsed.viewportBoundaryTop;
                }
                if (typeof parsed.viewportBoundaryBottom === 'number') {
                    this.viewportBoundaryBottom = parsed.viewportBoundaryBottom;
                }
                if (parsed.debugInfo) {
                    this.debugInfo = { ...this.debugInfo, ...parsed.debugInfo };
                }
            }
            catch {
                // Invalid JSON, use prop defaults
            }
        }
    }
    async loadShortcuts() {
        this.shortcuts = await this.engineRef.getDisplayableShortcuts();
    }
    get currentSettingsConfig() {
        return {
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
    }
    getContentObjects(objects) {
        return objects.filter(obj => !(obj instanceof KritzelSelectionGroup) && !(obj instanceof KritzelSelectionBox));
    }
    lastCustomSvgIcons;
    registerCustomSvgIcons(icons) {
        if (icons === this.lastCustomSvgIcons) {
            return;
        }
        this.lastCustomSvgIcons = icons;
        KritzelIconRegistry.registerIcons(icons ?? {});
    }
    async registerCustomFonts(fonts = this.customFonts) {
        KritzelFontRegistry.registerFonts(fonts);
        const currentVersion = ++this.customFontsLoadVersion;
        const loadPromise = KritzelFontRegistry.waitForFonts(fonts);
        this.customFontsReady = loadPromise;
        await loadPromise;
        if (currentVersion !== this.customFontsLoadVersion) {
            await this.waitForCustomFontsReady();
        }
    }
    async waitForCustomFontsReady() {
        while (true) {
            const version = this.customFontsLoadVersion;
            await this.customFontsReady;
            if (version === this.customFontsLoadVersion) {
                return;
            }
        }
    }
    listenForMobileKeyboard() {
        KritzelKeyboardHelper.onKeyboardVisibleChanged(isOpen => {
            this.isVirtualKeyboardOpen = isOpen;
        });
    }
    setOsSpecificCssVariables() {
        const os = KritzelDevicesHelper.detectOS();
        switch (os) {
            case 'iOS':
                // iOS specific adjustments
                this.host.style.setProperty('--kritzel-editor-top-left-buttons-top', '14px');
                this.host.style.setProperty('--kritzel-editor-top-left-buttons-left', '14px');
                this.host.style.setProperty('--kritzel-editor-toolbar-bottom', '14px');
                this.host.style.setProperty('--kritzel-editor-toolbar-transition', 'cubic-bezier(0.25, 0.1, 0.25, 1.0)');
                this.host.style.setProperty('--kritzel-editor-toolbar-transform', 'translateY(200%)');
                this.host.style.setProperty('--kritzel-editor-toolbar-transition-duration', '0.25s');
                break;
            case 'Android':
                // Android specific adjustments
                this.host.style.setProperty('--kritzel-editor-top-left-buttons-top', '14px');
                this.host.style.setProperty('--kritzel-editor-top-left-buttons-left', '14px');
                this.host.style.setProperty('--kritzel-editor-toolbar-bottom', '24px');
                this.host.style.setProperty('--kritzel-editor-toolbar-transition', 'cubic-bezier(0.25, 0.1, 0.25, 1.0)');
                this.host.style.setProperty('--kritzel-editor-toolbar-transform', 'translateY(200%)');
                this.host.style.setProperty('--kritzel-editor-toolbar-transition-duration', '0.25s');
                break;
            default:
                // Default for Windows/Linux
                this.host.style.setProperty('--kritzel-editor-top-left-buttons-top', '14px');
                this.host.style.setProperty('--kritzel-editor-top-left-buttons-left', '14px');
                this.host.style.setProperty('--kritzel-editor-toolbar-bottom', '14px');
                break;
        }
    }
    render() {
        const isLoggedIn = this.isLoggedIn;
        const shouldShowCurrentUser = isLoggedIn;
        const shouldShowLoginButton = this.isReady && !!this.loginConfig && !isLoggedIn;
        const normalizedToolbarItems = this.getNormalizedToolbarItems();
        const tools = this.getTools();
        return (h(Host, { key: '7aa81be297ffb9d496f1138202b896608f42ab30' }, h("div", { key: 'aaa2d341cbd19be77121ac1aed520bae5e534b3d', class: "editor-content", style: {
                opacity: this.isEditorVisible ? '1' : '0',
                visibility: this.isEditorVisible ? 'visible' : 'hidden',
                transition: 'opacity 0.2s ease-in-out, visibility 0.2s ease-in-out',
            } }, h("div", { key: 'a9d24d0dec030fe09a6c240a30328d68e75a4e8a', class: "top-left-buttons" }, h("kritzel-workspace-manager", { key: '7ad88945e31b58246714557e8e9819cd7702441a', ref: el => {
                if (el) {
                    this.workspaceManagerRef = el;
                }
            }, visible: this.isWorkspaceManagerVisible, workspaces: this.availableWorkspaces, activeWorkspace: this.activeWorkspace, terms: this.resolvedTerms, onWorkspaceChange: event => this.handleWorkspaceManagerChange(event), onIsWorkspaceManagerReady: () => (this.isWorkspaceManagerReady = true) }), h("kritzel-back-to-content", { key: '53fd70cd49fcf351bc2e965d3b1549c87979b2e4', visible: this.isBackToContentButtonVisible, text: this.resolvedTerms['backToContent.label'] ?? 'Back to content', onBackToContent: () => this.backToContent() })), this.activeNotification && (h("div", { key: '9c6e1e9f01a6b3aabd3df8d8501eefbc5a143773', class: "top-center-notification-layer", role: "presentation" }, h("div", { key: 'f49a526285ea02ce76bc8d6594c61d7c88df0b72', class: { 'top-center-notification-container': true, 'is-dismissing': this.isNotificationDismissing }, role: "presentation" }, h("kritzel-notification-card", { key: '7be2f93b4817ebc427ee180dc2309a98f2c4243e', notification: this.activeNotification, locale: this.locale, onDismiss: this.dismissNotification, onHoverChange: event => this.handleNotificationHoverChange(event) })))), this.contextMenuState && this.contextMenuState.items.length > 0 && (h("kritzel-context-menu", { key: 'dce0c4089edb3acb702322348c58c47dd7df4acd', class: "context-menu", items: this.contextMenuState.items, objects: this.contextMenuState.objects, style: {
                position: 'absolute',
                left: `${this.contextMenuState.position.x}px`,
                top: `${this.contextMenuState.position.y}px`,
                zIndex: '10002',
            }, onActionSelected: event => this.handleContextMenuActionSelected(event), onClose: () => this.hideContextMenu() })), h("kritzel-loading-overlay", { key: 'c8f56b359d33b03a5d52b058c8ec39c77b24e5e7', visible: this.isLoadingOverlayVisible, text: this.resolvedTerms['editor.loading'] ?? 'Loading...' }), h("kritzel-engine", { key: '594bbbe30bd8bbbe72d43cc8114b5c5e3171421f', ref: el => {
                if (el) {
                    this.engineRef = el;
                }
            }, workspaces: this.workspaces, activeWorkspaceId: this.activeWorkspaceId, editorId: this.editorId, syncConfig: this.syncConfig, assetStorageConfig: this.assetStorageConfig, user: this.user, scaleMax: this.scaleMax, lockDrawingScale: this.lockDrawingScale, scaleMin: this.scaleMin, cursorTarget: this.cursorTarget, viewportBoundaryLeft: this.viewportBoundaryLeft, viewportBoundaryRight: this.viewportBoundaryRight, viewportBoundaryTop: this.viewportBoundaryTop, viewportBoundaryBottom: this.viewportBoundaryBottom, isPanningEnabled: this.isPanningEnabled, isZoomingEnabled: this.isZoomingEnabled, theme: this.theme, themes: this.themes, licenseKey: this.licenseKey, locale: this.locale, locales: this.locales, fallbackLocale: this.fallbackLocale, debugInfo: this.debugInfo, globalContextMenuItems: this.globalContextMenuItems, objectContextMenuItems: this.objectContextMenuItems, tools: tools, onIsEngineReady: event => this.onEngineReady(event), onWorkspacesChange: event => this.handleWorkspacesChange(event), onActiveWorkspaceChange: event => this.handleActiveWorkspaceChange(event), onObjectsChange: event => this.handleObjectsChange(event), onObjectsAdded: event => this.handleObjectsAdded(event), onObjectsRemoved: event => this.handleObjectsRemoved(event), onObjectsUpdated: event => this.handleObjectsUpdated(event), onObjectsSelectionChange: event => this.handleObjectsSelectionChange(event), onUndoStateChange: event => this.handleUndoStateChange(event), onObjectsInViewportChange: event => this.handleObjectsInViewportChange(event), onViewportChange: event => this.handleViewportChange(event), onAwarenessChange: event => this.handleAwarenessChange(event), onNotificationsChange: event => this.handleNotificationsChange(event), onContextMenuStateChange: event => this.handleContextMenuStateChange(event), onIsLoadingChange: event => this.handleIsLoadingChange(event) }), h("kritzel-toolbar", { key: 'cef8c9ab96f04eb3b7297912e4a596f6174a6c69', visible: this.isToolbarVisible, class: { 'keyboard-open': this.isVirtualKeyboardOpen }, ref: el => {
                if (el) {
                    this.toolbarRef = el;
                }
            }, toolbarItems: normalizedToolbarItems, isUtilityPanelVisible: this.isUtilityPanelVisible, undoState: this.undoState ?? undefined, theme: this.theme, terms: this.resolvedTerms, onIsToolbarReady: () => (this.isToolbarReady = true) }), h("div", { key: 'a0afa3fbac941ad2ef7d5c0ffceb072eb2337ba7', class: "bottom-left-buttons" }, h("kritzel-zoom-panel", { key: '1a423d633a384197650945f356dccc4e00c0e20f', visible: this.isZoomPanelVisible, zoomPercent: this.currentZoomPercent, terms: this.resolvedTerms, onZoomIn: () => this.zoomIn(), onZoomOut: () => this.zoomOut() })), h("div", { key: '7eb75c78a04dad69e3b5cfc3facef68de5661ddb', class: "top-right-buttons" }, h("kritzel-settings", { key: '8f9cc72ba19345845fcc753b4da68764e5915c4e', ref: el => {
                if (el) {
                    this.settingsRef = el;
                }
            }, shortcuts: this.shortcuts, availableThemes: this.themes && this.themes.length > 0 ? this.themes.map(t => t.name) : ['light', 'dark'], availableLocales: this.availableLocaleOptions, settings: this.currentSettingsConfig, terms: this.resolvedTerms, onSettingsChange: event => this.handleSettingsChange(event) }), h("kritzel-export", { key: '1d929f41a36b8c1fab4f17bcd7c8decbedd310f2', ref: el => {
                if (el) {
                    this.exportRef = el;
                }
            }, workspaceName: this.activeWorkspace?.name || 'workspace', terms: this.resolvedTerms, onExportPng: () => this.engineRef.exportViewportAsPng(), onExportSvg: () => this.engineRef.exportViewportAsSvg(), onExportJson: event => this.engineRef.downloadAsJson(event.detail) }), h("kritzel-active-users", { key: 'cfbd4775a14ec9beb104738249dce2e0623db02a', users: this.activeUsers }), shouldShowCurrentUser && h("kritzel-current-user", { key: '203c4caa731a7d9b3446b6541b5a85add8110925', user: this.user, terms: this.resolvedTerms, onClick: () => this.currentUserDialogRef?.open() }), shouldShowCurrentUser && (h("kritzel-current-user-dialog", { key: 'dc352f72a1c4d218aaf191118cbc8be8ebb38c8d', ref: el => {
                if (el) {
                    this.currentUserDialogRef = el;
                }
            }, user: this.user, terms: this.resolvedTerms, onLogoutRequest: this.handleCurrentUserLogout })), shouldShowLoginButton && h("kritzel-button", { key: '80c273df6b83708ec76ffd6c6135170992b8058b', onButtonClick: () => this.loginDialogRef?.open() }, this.resolvedTerms['login.dialogTitle'] ?? 'Sign in'), h("kritzel-more-menu", { key: '3d99e2f1ca12c9103553a780adbb6db03b29f182', ref: el => {
                if (el) {
                    this.moreMenuRef = el;
                }
            }, items: this.resolvedMoreMenuItems, visible: this.isMoreMenuVisible, terms: this.resolvedTerms }), h("kritzel-share-dialog", { key: '311188cf1ab366666aed0c347a00734a87becf37', ref: el => {
                if (el) {
                    this.shareDialogRef = el;
                }
            }, isPublic: this.currentIsPublic, workspaceId: this.activeWorkspace?.id, terms: this.resolvedTerms, onToggleIsPublic: this.handleToggleIsPublic }), this.loginConfig && (h("kritzel-login-dialog", { key: '2223ddeb2e94696cdfd7917dbffe180afb43ef60', ref: el => {
                if (el) {
                    this.loginDialogRef = el;
                }
            }, providers: this.loginConfig.providers, dialogTitle: this.loginConfig.title ?? this.resolvedTerms['login.dialogTitle'] ?? 'Sign in', subtitle: this.loginConfig.subtitle, onProviderLogin: this.handleProviderLogin }))))));
    }
    static get watchers() { return {
        "isEngineReady": [{
                "onIsEngineReady": 0
            }],
        "isToolbarReady": [{
                "onIsToolbarReady": 0
            }],
        "availableWorkspaces": [{
                "onAvailableWorkspacesChange": 0
            }],
        "activeWorkspace": [{
                "onActiveWorkspaceChange": 0
            }],
        "customFonts": [{
                "onCustomFontsChange": 0
            }],
        "customSvgIcons": [{
                "onCustomSvgIconsChange": 0
            }],
        "moreMenuItems": [{
                "onMoreMenuItemsChange": 0
            }],
        "syncConfig": [{
                "onSyncConfigChange": 0
            }],
        "loginConfig": [{
                "onLoginConfigChange": 0
            }],
        "user": [{
                "onUserChange": 0
            }],
        "activeWorkspaceId": [{
                "onActiveWorkspaceIdChange": 0
            }],
        "theme": [{
                "onCurrentThemeChange": 0
            }],
        "themes": [{
                "onThemesChange": 0
            }],
        "locale": [{
                "onLocaleChange": 0
            }],
        "locales": [{
                "onLocalesChange": 0
            }]
    }; }
};
KritzelEditor.style = kritzelEditorCss();

export { KritzelEditor as kritzel_editor };
//# sourceMappingURL=kritzel-editor.entry.esm.js.map

//# sourceMappingURL=kritzel-editor.entry.js.map