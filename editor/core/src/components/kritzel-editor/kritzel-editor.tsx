import { Component, Host, Listen, Prop, Element, h, Method, Event, State, EventEmitter, Watch } from '@stencil/core';
import { KritzelIconRegistry } from '@kritzel/engine';
import { KritzelToolbarItem } from '@kritzel/engine';
import { KritzelToolDefinition } from '@kritzel/engine';
import { ShapeType } from '@kritzel/engine';
import { KritzelAlignment } from '@kritzel/engine';
import { KritzelBaseObject } from '@kritzel/engine';
import { KritzelSelectionTool } from '@kritzel/engine';
import { KritzelEraserTool } from '@kritzel/engine';
import { KritzelImageTool } from '@kritzel/engine';
import { KritzelBrushTool } from '@kritzel/engine';
import { KritzelLineTool } from '@kritzel/engine';
import { KritzelTextTool } from '@kritzel/engine';
import { KritzelShapeTool } from '@kritzel/engine';
import { ContextMenuItem } from '@kritzel/engine';
import { DEFAULT_BRUSH_CONFIG } from '@kritzel/engine';
import { DEFAULT_LINE_TOOL_CONFIG } from '@kritzel/engine';
import { DEFAULT_TEXT_CONFIG } from '@kritzel/engine';
import { DEFAULT_SHAPE_CONFIG } from '@kritzel/engine';
import { ABSOLUTE_SCALE_MAX, ABSOLUTE_SCALE_MIN } from '@kritzel/engine';
import { KritzelEngineState } from '@kritzel/engine';
import { KritzelSettingsConfig } from '@kritzel/engine';
import { KritzelDebugInfo } from '@kritzel/engine';
import { IKritzelMenuItem } from '@kritzel/engine';
import { KritzelWorkspace } from '@kritzel/engine';
import { KritzelKeyboardHelper } from '@kritzel/engine';
import { KritzelDevicesHelper } from '@kritzel/engine';
import { KritzelSyncConfig, hasRemoteSyncProvider } from '@kritzel/engine';
import { KritzelAssetStorageConfig } from '@kritzel/engine';
import { KritzelBaseTool } from '@kritzel/engine';
import { KritzelBrushToolConfig, KritzelLineToolConfig, KritzelShapeToolConfig, KritzelTextToolConfig } from '@kritzel/engine';
import { ActiveWorkspaceChangeEvent } from '@kritzel/engine';
import { DEFAULT_ASSET_STORAGE_CONFIG } from '@kritzel/engine';
import { EditorIsReadyEvent } from '@kritzel/engine';
import { KritzelUndoState } from '@kritzel/engine';
import { DEFAULT_SYNC_CONFIG } from '@kritzel/engine';
import { ThemeName, KritzelTheme } from '@kritzel/engine';
import { KritzelLocale, KritzelTermKey, KritzelTermVars, LocaleCode } from '@kritzel/engine';
import { ThemeHelper } from '@kritzel/engine';
import { lightTheme } from '@kritzel/engine';
import { darkTheme } from '@kritzel/engine';
import { KritzelSelectionGroup } from '@kritzel/engine';
import { KritzelSelectionBox } from '@kritzel/engine';
import { KritzelShortcut } from '@kritzel/engine';
import { KritzelViewportState } from '@kritzel/engine';
import { ObjectsAddedEvent, ObjectsRemovedEvent, ObjectsUpdatedEvent } from '@kritzel/engine';
import { IKritzelUser } from '@kritzel/engine';
import { IKritzelIsPublicChangeEvent } from '@kritzel/engine';
import { KritzelLoginConfig as KritzelLoginConfig } from '@kritzel/engine';
import { LoginEvent } from '@kritzel/engine';
import { KritzelNotification } from '@kritzel/engine';
import { ObjectHelper } from '@kritzel/engine';
import { KritzelFontMap } from '@kritzel/engine';
import { KritzelFontRegistry } from '@kritzel/engine';
import { resolveTextToolAvailableFonts } from '@kritzel/engine';
import { KritzelContextMenuState } from '@kritzel/engine';
import { KritzelObjectExportFormat } from '@kritzel/engine';
import { KritzelSvgIconMap } from '@kritzel/engine';

@Component({
  tag: 'kritzel-editor',
  styleUrl: 'kritzel-editor.css',
  shadow: false,
})
export class KritzelEditor {
  @Element() host!: HTMLElement;

  @Prop({ mutable: true }) scaleMax: number = ABSOLUTE_SCALE_MAX;
  @Prop({ mutable: true }) scaleMin: number = ABSOLUTE_SCALE_MIN;
  @Prop({ mutable: true }) lockDrawingScale: boolean = true;
  @Prop({ mutable: true }) viewportBoundaryLeft: number = -Infinity;
  @Prop({ mutable: true }) viewportBoundaryRight: number = Infinity;
  @Prop({ mutable: true }) viewportBoundaryTop: number = -Infinity;
  @Prop({ mutable: true }) viewportBoundaryBottom: number = Infinity;
  @Prop({ mutable: true }) debugInfo: KritzelDebugInfo = {
    showViewportInfo: false,
    showObjectInfo: false,
    showSyncProviderInfo: true,
    showMigrationInfo: true,
    showAssetResolverInfo: false,
  };
  @Prop() user?: IKritzelUser;
  @Prop() activeUsers?: IKritzelUser[];
  @Prop() toolbarItems: KritzelToolbarItem[] = [
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

  @Prop() globalContextMenuItems: ContextMenuItem[] = [
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

  @Prop() objectContextMenuItems: ContextMenuItem[] = [
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

  @Prop() moreMenuItems?: IKritzelMenuItem[] = [
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

  @Prop() themes?: KritzelTheme[];
  @Prop({ mutable: true }) theme: ThemeName = 'light';
  /** License key that, when valid, removes the "Powered by Kritzel" watermark. */
  @Prop() licenseKey?: string;
  /** The current locale (language) code applied to the editor, e.g. 'en', 'de', 'fr'. */
  @Prop({ mutable: true }) locale: LocaleCode = 'en';
  /** An array of available locale definitions (with optional partial term overrides). */
  @Prop() locales?: KritzelLocale[];
  /** The locale used to resolve terms missing from the active locale. */
  @Prop() fallbackLocale: LocaleCode = 'en';
  @Prop() customSvgIcons: KritzelSvgIconMap = {};
  /**
   * Registers fonts for runtime usage (for example custom object rendering).
  * Text-tool config tooltip options are controlled via toolbarItems[].config.availableFonts.
   */
  @Prop() customFonts: KritzelFontMap = {};
  @Prop({ mutable: true }) isPanningEnabled: boolean = true;
  @Prop({ mutable: true }) isZoomingEnabled: boolean = true;
  @Prop() isToolbarVisible: boolean = true;
  @Prop() isUtilityPanelVisible: boolean = true;
  @Prop() isWorkspaceManagerVisible: boolean = true;
  @Prop() isMoreMenuVisible: boolean = true;
  @Prop() isZoomPanelVisible: boolean = true;
  @Prop() syncConfig?: KritzelSyncConfig = DEFAULT_SYNC_CONFIG;
  @Prop() assetStorageConfig?: KritzelAssetStorageConfig = DEFAULT_ASSET_STORAGE_CONFIG;

  /** The element to use as the target for the cursor. Defaults to the editor container if not set. */
  @Prop() cursorTarget?: HTMLElement;

  /** Optional login configuration. When provided, a "Sign in" button is shown that opens a login dialog with the configured providers. */
  @Prop() loginConfig?: KritzelLoginConfig;

  /** Optional unique identifier for namespacing storage keys across multiple editor instances. */
  @Prop() editorId?: string;

  /** Optional workspace ID to set as active. If provided, the editor will automatically activate the workspace with this ID. */
  @Prop() activeWorkspaceId?: string;

  /** Authoritative workspace catalog for this editor instance. When provided, provider-only workspaces are hidden but not deleted. */
  @Prop() workspaces?: KritzelWorkspace[];

  @Event() isReady!: EventEmitter<EditorIsReadyEvent>;
  @Event() activeWorkspaceChange!: EventEmitter<ActiveWorkspaceChangeEvent>;
  @Event() objectsChange!: EventEmitter<KritzelBaseObject[]>;
  @Event() objectsAdded!: EventEmitter<ObjectsAddedEvent>;
  @Event() objectsRemoved!: EventEmitter<ObjectsRemovedEvent>;
  @Event() objectsUpdated!: EventEmitter<ObjectsUpdatedEvent>;
  @Event() objectsSelectionChange!: EventEmitter<KritzelBaseObject[]>;
  @Event() undoStateChange!: EventEmitter<KritzelUndoState>;
  @Event() themeChange!: EventEmitter<ThemeName>;
  @Event() localeChange!: EventEmitter<LocaleCode>;
  @Event() viewportChange!: EventEmitter<KritzelViewportState>;
  @Event() logout!: EventEmitter<void>;
  @Event() login!: EventEmitter<LoginEvent>;
  @Event() isPublicChange!: EventEmitter<IKritzelIsPublicChangeEvent>;
  @Event() awarenessChange!: EventEmitter<Map<number, Record<string, any>>>;
  @State() isEngineReady: boolean = false;
  @State() isToolbarReady: boolean = false;
  @State() isWorkspaceManagerReady: boolean = false;
  @State() availableWorkspaces: KritzelWorkspace[] = [];
  @State() activeWorkspace?: KritzelWorkspace;
  @State() isVirtualKeyboardOpen: boolean = false;
  @State() undoState: KritzelUndoState | null = null;
  @State() isBackToContentButtonVisible: boolean = false;
  /** Localized strings for editor-owned UI (e.g. the more menu), resolved from the active locale. */
  @State() resolvedTerms: Partial<Record<KritzelTermKey, string>> = {};
  /** Available locales as `{ code, label }` options for the settings language selector. */
  @State() availableLocaleOptions: { code: LocaleCode; label: string }[] = [];
  @State() currentZoomPercent: number = 100;
  @State() shortcuts: Omit<KritzelShortcut, 'action' | 'condition'>[] = [];
  @State() currentIsPublic: boolean = false;
  @State() isEditorVisible: boolean = false;
  @State() activeNotification?: KritzelNotification;
  @State() isNotificationDismissing: boolean = false;
  @State() contextMenuState?: KritzelContextMenuState;
  @State() resolvedMoreMenuItems: IKritzelMenuItem[] = [];
  @State() isLoadingOverlayVisible: boolean = false;
  private loadingOverlayShowTimeout?: ReturnType<typeof setTimeout>;
  private loadingOverlayHideTimeout?: ReturnType<typeof setTimeout>;
  private loadingOverlayShownTimestamp?: number;
  private readonly loadingOverlayDelayMs = 300;
  private readonly loadingOverlayMinDisplayDurationMs = 400;
  private notificationDismissTimeout?: ReturnType<typeof setTimeout>;
  private notificationDismissAnimationTimeout?: ReturnType<typeof setTimeout>;
  private readonly notificationDisplayDurationMs = 5000;
  private readonly notificationDismissAnimationDurationMs = 180;
  private isNotificationHovered: boolean = false;
  private customFontsLoadVersion: number = 0;
  private customFontsReady: Promise<void> = Promise.resolve();

  @Watch('isEngineReady')
  onIsEngineReady(newValue: boolean) {
    if (newValue && this.isToolbarReady) {
      this.checkIsReady();
    }
  }

  @Watch('isToolbarReady')
  onIsToolbarReady(newValue: boolean) {
    if (newValue && this.isEngineReady) {
      this.checkIsReady();
    }
  }

  @Watch('availableWorkspaces')
  onAvailableWorkspacesChange(newWorkspaces: KritzelWorkspace[]) {
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

  @Watch('activeWorkspace')
  onActiveWorkspaceChange() {
    this.updateCurrentIsPublic();
  }

  @Watch('customFonts')
  onCustomFontsChange(newValue: KritzelFontMap) {
    void this.registerCustomFonts(newValue);
  }

  @Watch('customSvgIcons')
  onCustomSvgIconsChange(newValue: KritzelSvgIconMap | undefined) {
    this.registerCustomSvgIcons(newValue);
  }

  @Watch('moreMenuItems')
  onMoreMenuItemsChange() {
    this.recomputeMoreMenuItems();
  }

  @Watch('syncConfig')
  onSyncConfigChange() {
    this.recomputeMoreMenuItems();
  }

  @Watch('loginConfig')
  onLoginConfigChange() {
    this.recomputeMoreMenuItems();
  }

  @Watch('user')
  onUserChange() {
    this.recomputeMoreMenuItems();
  }

  @Watch('activeWorkspaceId')
  onActiveWorkspaceIdChange(newId?: string) {
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
    } else {
      console.warn(`[KritzelEditor] No workspace found with ID: ${newId}`);
    }
  }

  @Watch('theme')
  onCurrentThemeChange() {
    this.applyTheme();
    setTimeout(() => this.setOsSpecificCssVariables(), 0);
    if (this.engineRef) {
      this.engineRef.saveSettings(this.currentSettingsConfig);
    }
  }

  @Watch('themes')
  onThemesChange() {
    this.applyTheme();
  }

  @Watch('locale')
  onLocaleChange(newValue: LocaleCode) {
    if (this.engineRef) {
      this.engineRef.setLocale(newValue);
      this.engineRef.saveSettings(this.currentSettingsConfig);
      void this.refreshLocalizedTerms();
    }
  }

  @Watch('locales')
  onLocalesChange(newValue?: KritzelLocale[]) {
    if (this.engineRef) {
      void this.engineRef.configureLocales(newValue).then(() => this.refreshLocalizedTerms());
    }
  }

  /**
   * Refreshes the editor-owned localized strings (e.g. the more menu and the
   * strings forwarded to child UI components) from the engine's localization
   * manager for the active locale.
   */
  private async refreshLocalizedTerms(): Promise<void> {
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

  @Listen('dblclick', { passive: false })
  onTouchStart(event: MouseEvent) {
    if (event.cancelable) {
      event.preventDefault();
    }
  }

  @Method()
  async getObjectById<T extends KritzelBaseObject>(id: string): Promise<T | null> {
    return this.engineRef.getObjectById(id);
  }

  @Method()
  async addObject<T extends KritzelBaseObject>(object: T): Promise<T | null> {
    return this.engineRef.addObject(object);
  }

  @Method()
  async addObjects<T extends KritzelBaseObject>(objects: T[]): Promise<T[]> {
    return this.engineRef.addObjects(objects);
  }

  @Method()
  async updateObject<T extends KritzelBaseObject>(object: T, updatedProperties: Partial<T>): Promise<T | null> {
    return this.engineRef.updateObject(object, updatedProperties);
  }

  @Method()
  async removeObject<T extends KritzelBaseObject>(object: T): Promise<T | null> {
    return this.engineRef.removeObject(object);
  }

  @Method()
  async removeObjects<T extends KritzelBaseObject>(objects: T[]): Promise<T[]> {
    return this.engineRef.removeObjects(objects);
  }

  @Method()
  async getSelectedObjects(): Promise<KritzelBaseObject[]> {
    return this.engineRef.getSelectedObjects();
  }

  @Method()
  async selectObjects(objects: KritzelBaseObject[]) {
    return this.engineRef.selectObjects(objects);
  }

  @Method()
  async selectAllObjectsInViewport() {
    return this.engineRef.selectAllObjectsInViewport();
  }

  @Method()
  async clearSelection() {
    this.engineRef.clearSelection();
  }

  @Method()
  async centerObjectInViewport(object: KritzelBaseObject) {
    return this.engineRef.centerObjectInViewport(object);
  }

  @Method()
  async panToObject(object: KritzelBaseObject): Promise<void> {
    return this.engineRef.panToObject(object);
  }

  @Method()
  async backToContent(): Promise<boolean> {
    return this.engineRef.backToContent();
  }

  @Method()
  async centerAllObjects(animate = true): Promise<boolean> {
    return this.engineRef.centerAllObjects(animate);
  }

  @Method()
  async centerObjects(objects: KritzelBaseObject[], animate = true): Promise<boolean> {
    return this.engineRef.centerObjects(objects, animate);
  }

  @Method()
  async setViewport(x: number, y: number, scale: number): Promise<void> {
    return this.engineRef.setViewport(x, y, scale);
  }

  @Method()
  async panTo(x: number, y: number): Promise<void> {
    return this.engineRef.panTo(x, y);
  }

  @Method()
  async zoomTo(scale: number, worldX?: number, worldY?: number): Promise<void> {
    return this.engineRef.zoomTo(scale, worldX, worldY);
  }

  @Method()
  async zoomIn(factor: number = 1.6, duration: number = 200): Promise<void> {
    return this.engineRef.zoomIn(factor, duration);
  }

  @Method()
  async zoomOut(factor: number = 1.6, duration: number = 200): Promise<void> {
    return this.engineRef.zoomOut(factor, duration);
  }

  @Method()
  async getViewport(): Promise<KritzelViewportState> {
    return this.engineRef.getViewport();
  }

  @Method()
  async screenToWorld(x: number, y: number): Promise<{ x: number; y: number }> {
    return this.engineRef.screenToWorld(x, y);
  }

  @Method()
  async worldToScreen(x: number, y: number): Promise<{ x: number; y: number }> {
    return this.engineRef.worldToScreen(x, y);
  }

  @Method()
  async setActiveWorkspace(id: string): Promise<void> {
    return this.engineRef.setActiveWorkspace(id);
  }

  @Method()
  async createWorkspace(workspace: KritzelWorkspace): Promise<KritzelWorkspace | null> {
    return this.engineRef.createWorkspace(workspace);
  }

  @Method()
  async updateWorkspace(workspace: KritzelWorkspace): Promise<void> {
    return this.engineRef.updateWorkspace(workspace);
  }

  @Method()
  async deleteWorkspace(workspace: KritzelWorkspace): Promise<void> {
    return this.engineRef.deleteWorkspace(workspace);
  }

  @Method()
  async getWorkspaces(): Promise<KritzelWorkspace[]> {
    return this.engineRef.getWorkspaces();
  }

  @Method()
  async getActiveWorkspace(): Promise<KritzelWorkspace> {
    return this.engineRef.getActiveWorkspace();
  }

  @Method()
  async loadSharedWorkspace(token: string): Promise<void> {
    return this.engineRef.loadSharedWorkspace(token);
  }

  @Method()
  async reinitSync(): Promise<void> {
    return this.engineRef.reinitSync();
  }

  @Method()
  async registerTool(
    toolName: string,
    toolClass: any,
    toolConfig?: KritzelTextToolConfig | KritzelBrushToolConfig | KritzelLineToolConfig | KritzelShapeToolConfig,
  ): Promise<KritzelBaseTool | null> {
    return this.engineRef.registerTool(toolName, toolClass, toolConfig);
  }

  @Method()
  async setActiveTool(toolName: string): Promise<void> {
    return this.engineRef.setActiveTool(toolName);
  }

  @Method()
  async disable() {
    return this.engineRef.disable();
  }

  @Method()
  async enable() {
    return this.engineRef.enable();
  }

  @Method()
  async copy() {
    return this.engineRef.copy();
  }

  @Method()
  async cut() {
    return this.engineRef.cut();
  }

  @Method()
  async paste(x: number, y: number) {
    return this.engineRef.paste(x, y);
  }

  @Method()
  async delete() {
    return this.engineRef.delete();
  }

  @Method()
  async bringForward(object?: KritzelBaseObject<any>) {
    return this.engineRef.bringForward(object);
  }

  @Method()
  async sendBackward(object?: KritzelBaseObject<any>) {
    return this.engineRef.sendBackward(object);
  }

  @Method()
  async bringToFront(object?: KritzelBaseObject<any>) {
    return this.engineRef.bringToFront(object);
  }

  @Method()
  async sendToBack(object?: KritzelBaseObject<any>) {
    return this.engineRef.sendToBack(object);
  }

  @Method()
  async alignObjects(alignment: KritzelAlignment) {
    return this.engineRef.alignObjects(alignment);
  }

  @Method()
  async group() {
    return this.engineRef.group();
  }

  @Method()
  async ungroup() {
    return this.engineRef.ungroup();
  }

  @Method()
  async undo() {
    return this.engineRef.undo();
  }

  @Method()
  async redo() {
    return this.engineRef.redo();
  }

  @Method()
  async getScreenshot(format: 'png' | 'svg' = 'png'): Promise<string | null> {
    return this.engineRef.getScreenshot(format);
  }

  @Method()
  async exportViewportAsPng(): Promise<void> {
    return this.engineRef.exportViewportAsPng();
  }

  @Method()
  async exportViewportAsSvg(): Promise<void> {
    return this.engineRef.exportViewportAsSvg();
  }

  @Method()
  async getSelectedObjectSupportedExportFormats(): Promise<KritzelObjectExportFormat[]> {
    return this.engineRef.getSelectedObjectSupportedExportFormats();
  }

  @Method()
  async canExportSelectedObjectAs(format: KritzelObjectExportFormat): Promise<boolean> {
    return this.engineRef.canExportSelectedObjectAs(format);
  }

  @Method()
  async exportSelectedObject(format: KritzelObjectExportFormat): Promise<void> {
    return this.engineRef.exportSelectedObject(format);
  }

  @Method()
  async exportAsJson(): Promise<string> {
    return this.engineRef.exportAsJson();
  }

  @Method()
  async importFromJson(json: string): Promise<void> {
    return this.engineRef.importFromJson(json);
  }

  @Method()
  async downloadAsJson(filename?: string): Promise<void> {
    return this.engineRef.downloadAsJson(filename);
  }

  @Method()
  async importFromFile(): Promise<void> {
    return this.engineRef.importFromFile();
  }

  @Method()
  async loadObjectsFromJson(json: string): Promise<number> {
    return this.engineRef.loadObjectsFromJson(json);
  }

  @Method()
  async getObjectsTotalCount(): Promise<number> {
    return this.engineRef.getObjectsTotalCount();
  }

  @Method()
  async getAllObjects<T extends KritzelBaseObject>(): Promise<T[]> {
    return this.engineRef.getAllObjects();
  }

  @Method()
  async findObjects<T extends KritzelBaseObject>(predicate: (obj: KritzelBaseObject<Element>) => boolean): Promise<T[]> {
    return this.engineRef.findObjects(predicate);
  }

  @Method()
  async getObjectsInViewport(): Promise<KritzelBaseObject[]> {
    return this.engineRef.getObjectsInViewport();
  }

  @Method()
  async hideContextMenu() {
    return this.engineRef.hideContextMenu();
  }

  @Method()
  async openContextMenu(options: { x: number; y: number; objectId?: string }) {
    return this.engineRef.openContextMenu(options);
  }

  @Method()
  async openWorkspaceManagerMenu(): Promise<void> {
    if (!this.isWorkspaceManagerVisible) {
      return;
    }

    await this.workspaceManagerRef?.open();
  }

  @Method()
  async closeWorkspaceManagerMenu(): Promise<void> {
    await this.workspaceManagerRef?.close();
  }

  @Method()
  async openMoreMenu(): Promise<void> {
    if (!this.isMoreMenuVisible) {
      return;
    }

    await this.moreMenuRef?.open();
  }

  @Method()
  async closeMoreMenu(): Promise<void> {
    await this.moreMenuRef?.close();
  }

  @Method()
  async openUserDialog(): Promise<void> {
    await this.currentUserDialogRef?.open();
  }

  @Method()
  async closeUserDialog(): Promise<void> {
    await this.currentUserDialogRef?.close();
  }

  @Method()
  async openExportDialog(): Promise<void> {
    const preview = await this.engineRef.getScreenshot('png');
    await this.exportRef?.open(preview ?? undefined);
  }

  @Method()
  async closeExportDialog(): Promise<void> {
    await this.exportRef?.close();
  }

  @Method()
  async openImportDialog(): Promise<void> {
    await this.engineRef.importFromFile();
  }

  @Method()
  async closeImportDialog(): Promise<void> {
    await this.engineRef.cancelImportFromFile();
  }

  @Method()
  async openSettingsDialog(): Promise<void> {
    await this.settingsRef?.open();
  }

  @Method()
  async closeSettingsDialog(): Promise<void> {
    await this.settingsRef?.close();
  }

  @Method()
  async openShareDialog(): Promise<void> {
    await this.shareDialogRef?.open();
  }

  @Method()
  async closeShareDialog(): Promise<void> {
    await this.shareDialogRef?.close();
  }

  @Method()
  async triggerSelectionChange() {
    return this.engineRef.triggerSelectionChange();
  }

  @Method()
  async beginSceneBootstrap(): Promise<void> {
    return this.engineRef.beginSceneBootstrap();
  }

  @Method()
  async endSceneBootstrap(): Promise<void> {
    return this.engineRef.endSceneBootstrap();
  }

  @Method()
  async getDisplayableShortcuts(): Promise<Omit<KritzelShortcut, 'action' | 'condition'>[]> {
    return this.engineRef.getDisplayableShortcuts();
  }

  @Method()
  async openLoginDialog(): Promise<void> {
    this.loginDialogRef?.open();
  }

  @Method()
  async closeLoginDialog(): Promise<void> {
    this.loginDialogRef?.close();
  }

  @Method()
  async setLoginLoading(provider: string | null): Promise<void> {
    this.loginDialogRef?.setLoading(provider);
  }

  /**
   * Sets the active locale (language) and re-renders the UI.
   * @param code - The locale code to activate, e.g. 'de'.
   */
  @Method()
  async setLocale(code: LocaleCode): Promise<void> {
    this.locale = code;
    await this.engineRef?.setLocale(code);
  }

  /**
   * Gets the currently active locale code.
   */
  @Method()
  async getLocale(): Promise<LocaleCode> {
    return this.engineRef ? this.engineRef.getLocale() : this.locale;
  }

  /**
   * Gets the list of available locale codes (built-in and registered).
   */
  @Method()
  async getAvailableLocales(): Promise<LocaleCode[]> {
    return this.engineRef ? this.engineRef.getAvailableLocales() : [];
  }

  /**
   * Registers additional locale definitions (with optional partial term overrides).
   * @param locales - The locale definitions to register.
   */
  @Method()
  async registerLocales(locales: KritzelLocale[]): Promise<void> {
    await this.engineRef?.registerLocales(locales);
  }

  /**
   * Registers custom fonts for the editor runtime.
   * @param fonts - Mapping from font keys to family names or font definitions.
   * @remarks This no longer controls the text-tool config tooltip font options.
  * Configure tooltip fonts via toolbarItems[].config.availableFonts.
   */
  @Method()
  async registerFonts(fonts: KritzelFontMap): Promise<void> {
    await this.registerCustomFonts(fonts);
  }

  /**
   * Resolves a term key to its translated string for the active locale.
   * @param key - The term key to resolve.
   * @param vars - Optional values for `{placeholder}` interpolation.
   */
  @Method()
  async t(key: KritzelTermKey, vars?: KritzelTermVars): Promise<string> {
    return this.engineRef ? this.engineRef.t(key, vars) : key;
  }

  /**
   * Triggers a UI notification programmatically.
   * @param notification - Notification payload. `id` and `timestamp` are optional.
   */
  @Method()
  async triggerNotification(notification: Omit<KritzelNotification, 'id'> & Partial<Pick<KritzelNotification, 'id' | 'timestamp'>>): Promise<void> {
    const normalizedNotification: KritzelNotification = {
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

  engineRef!: HTMLKritzelEngineElement;
  toolbarRef!: HTMLKritzelToolbarElement;
  settingsRef!: HTMLKritzelSettingsElement;
  exportRef!: HTMLKritzelExportElement;
  splitButtonRef!: HTMLKritzelSplitButtonElement;
  workspaceManagerRef!: HTMLKritzelWorkspaceManagerElement;
  moreMenuRef!: HTMLKritzelMoreMenuElement;
  shareDialogRef!: HTMLKritzelShareDialogElement;
  loginDialogRef!: HTMLKritzelLoginDialogElement;
  currentUserDialogRef!: HTMLKritzelCurrentUserDialogElement;

  componentWillLoad() {
    this.registerCustomSvgIcons(this.customSvgIcons);
    this.recomputeMoreMenuItems();
    this.loadSettingsFromStorage();
    this.applyTheme();
  }

  componentWillRender() {
    this.registerCustomSvgIcons(this.customSvgIcons);
  }

  private isTextToolConfig(config?: KritzelTextToolConfig | KritzelBrushToolConfig | KritzelLineToolConfig | KritzelShapeToolConfig): config is KritzelTextToolConfig {
    return !!config && 'fontFamily' in config && 'size' in config && 'color' in config;
  }

  private lastToolbarItemsRef: KritzelToolbarItem[] | null = null;
  private lastNormalizedToolbarItems: KritzelToolbarItem[] = [];
  private lastToolsSource: KritzelToolbarItem[] | null = null;
  private lastTools: KritzelToolDefinition[] = [];

  private getNormalizedToolbarItems(): KritzelToolbarItem[] {
    if (this.toolbarItems !== this.lastToolbarItemsRef) {
      this.lastToolbarItemsRef = this.toolbarItems;
      this.lastNormalizedToolbarItems = this.normalizeToolbar(this.toolbarItems);
    }
    return this.lastNormalizedToolbarItems;
  }

  private getTools(): KritzelToolDefinition[] {
    const normalizedToolbarItems = this.getNormalizedToolbarItems();
    if (normalizedToolbarItems !== this.lastToolsSource) {
      this.lastToolsSource = normalizedToolbarItems;
      this.lastTools = normalizedToolbarItems
        .filter(item => item.type === 'tool' && !!item.tool)
        .map(item => ({ name: item.name, tool: item.tool!, config: item.config }));
    }
    return this.lastTools;
  }

  private normalizeToolbar(toolbarItems: KritzelToolbarItem[]): KritzelToolbarItem[] {
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

  private recomputeMoreMenuItems(): void {
    if (this.moreMenuItems) {
      this.resolvedMoreMenuItems = this.moreMenuItems;
      return;
    }
  }

  private applyTheme(): void {
    const themeObj = this.resolveThemeObject();
    ThemeHelper.applyThemeToElement(this.host, themeObj);
  }

  private resolveThemeObject(): KritzelTheme {
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

  async onEngineReady(event: CustomEvent<KritzelEngineState>) {
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

  handleWorkspacesChange(event: CustomEvent<KritzelWorkspace[]>) {
    event.stopPropagation();
    this.availableWorkspaces = event.detail;
  }

  async handleWorkspaceManagerChange(event: CustomEvent<KritzelWorkspace | null>) {
    event.stopPropagation();

    const workspace = event.detail;
    this.activeWorkspace = workspace ?? undefined;

    if (!workspace) {
      return;
    }

    await this.engineRef.setActiveWorkspace(workspace.id);
  }

  handleActiveWorkspaceChange(event: CustomEvent<KritzelWorkspace>) {
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

  handleObjectsChange(event: CustomEvent<KritzelBaseObject[]>) {
    event.stopPropagation();
    this.objectsChange.emit(event.detail);
  }

  handleObjectsAdded(event: CustomEvent<ObjectsAddedEvent>) {
    event.stopPropagation();
    this.objectsAdded.emit(event.detail);
  }

  handleObjectsRemoved(event: CustomEvent<ObjectsRemovedEvent>) {
    event.stopPropagation();
    this.objectsRemoved.emit(event.detail);
  }

  handleObjectsUpdated(event: CustomEvent<ObjectsUpdatedEvent>) {
    event.stopPropagation();
    this.objectsUpdated.emit(event.detail);
  }

  handleObjectsSelectionChange(event: CustomEvent<KritzelBaseObject[]>) {
    console.log(event.detail);
    event.stopPropagation();
    this.objectsSelectionChange.emit(event.detail);
  }

  handleUndoStateChange(event: CustomEvent<KritzelUndoState>) {
    event.stopPropagation();
    this.undoStateChange.emit(event.detail);
    this.undoState = event.detail;
  }

  async handleObjectsInViewportChange(event: CustomEvent<KritzelBaseObject<Element>[]>) {
    event.stopPropagation();
    const hasVisibleObjects = this.getContentObjects(event.detail).length > 0;
    const hasAnyObjectsAtAll = this.getContentObjects(await this.engineRef.getAllObjects()).length > 0;
    this.isBackToContentButtonVisible = !hasVisibleObjects && hasAnyObjectsAtAll;
  }

  handleViewportChange(event: CustomEvent<KritzelViewportState>) {
    event.stopPropagation();
    this.currentZoomPercent = this.getZoomPercentFromScale(event.detail.scale);
    this.viewportChange.emit(event.detail);
  }

  private getZoomPercentFromScale(scale: number): number {
    if (!Number.isFinite(scale) || scale <= 0) {
      return 100;
    }
    return Math.round(scale * 100);
  }

  handleAwarenessChange(event: CustomEvent<Map<number, Record<string, any>>>) {
    event.stopPropagation();
    this.awarenessChange.emit(event.detail);
  }

  handleNotificationsChange(event: CustomEvent<KritzelNotification>) {
    event.stopPropagation();
    this.clearNotificationDismissAnimationTimer();
    this.isNotificationDismissing = false;
    this.isNotificationHovered = false;
    this.activeNotification = event.detail;
    this.scheduleNotificationDismiss();
  }

  handleContextMenuStateChange(event: CustomEvent<KritzelContextMenuState>) {
    event.stopPropagation();
    this.contextMenuState = event.detail.isVisible ? event.detail : undefined;
  }

  handleIsLoadingChange(event: CustomEvent<boolean>) {
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

  private clearLoadingOverlayShowTimer(): void {
    if (this.loadingOverlayShowTimeout) {
      clearTimeout(this.loadingOverlayShowTimeout);
      this.loadingOverlayShowTimeout = undefined;
    }
  }

  private clearLoadingOverlayHideTimer(): void {
    if (this.loadingOverlayHideTimeout) {
      clearTimeout(this.loadingOverlayHideTimeout);
      this.loadingOverlayHideTimeout = undefined;
    }
  }

  private handleContextMenuActionSelected(event: CustomEvent<ContextMenuItem>): void {
    const contextMenuState = this.contextMenuState;
    if (!contextMenuState || !event.detail.action) {
      void this.hideContextMenu();
      return;
    }

    event.detail.action(
      {
        x: contextMenuState.worldPosition.x,
        y: contextMenuState.worldPosition.y,
      },
      contextMenuState.objects,
    );

    void this.hideContextMenu();
  }

  handleNotificationHoverChange(event: CustomEvent<boolean>) {
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

  private scheduleNotificationDismiss(): void {
    this.clearNotificationDismissTimer();
    this.notificationDismissTimeout = setTimeout(() => {
      this.dismissNotification();
    }, this.notificationDisplayDurationMs);
  }

  private clearNotificationDismissTimer(): void {
    if (this.notificationDismissTimeout) {
      clearTimeout(this.notificationDismissTimeout);
      this.notificationDismissTimeout = undefined;
    }
  }

  private clearNotificationDismissAnimationTimer(): void {
    if (this.notificationDismissAnimationTimeout) {
      clearTimeout(this.notificationDismissAnimationTimeout);
      this.notificationDismissAnimationTimeout = undefined;
    }
  }

  private dismissNotification = (): void => {
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

  handleSettingsChange(event: CustomEvent<KritzelSettingsConfig>) {
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

  private handleToggleIsPublic = async (event: CustomEvent<boolean>): Promise<void> => {
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
  private updateCurrentIsPublic(): void {
    const isPublic = this.activeWorkspace?.isPublic ?? false;
    const workspaceId = this.activeWorkspace?.id;
    this.currentIsPublic = isPublic;

    if (!workspaceId) {
      return;
    }

    this.isPublicChange.emit({ isPublic, workspaceId });
  }

  private handleProviderLogin = (event: CustomEvent<LoginEvent>): void => {
    this.login.emit(event.detail);
  };

  private handleCurrentUserLogout = (): void => {
    this.logout.emit();
  };

  private get isLoggedIn(): boolean {
    return !!this.user && !this.user.isGuest;
  }

  private canExportObjectsAs(objects: KritzelBaseObject[], format: KritzelObjectExportFormat): boolean {
    if (!objects || objects.length !== 1) {
      return false;
    }

    const [selected] = objects;
    if (!ObjectHelper.isKritzelExportable(selected)) {
      return false;
    }

    return selected.getSupportedExportFormats().includes(format);
  }

  private canExportObjects(objects: KritzelBaseObject[]): boolean {
    return this.canExportObjectsAs(objects, 'png') || this.canExportObjectsAs(objects, 'svg');
  }

  private getPreferredExportFormat(objects: KritzelBaseObject[]): KritzelObjectExportFormat | null {
    if (this.canExportObjectsAs(objects, 'png')) {
      return 'png';
    }

    if (this.canExportObjectsAs(objects, 'svg')) {
      return 'svg';
    }

    return null;
  }

  private getSettingsStorageKey(): string {
    return this.editorId ? `kritzel-settings-${this.editorId}` : 'kritzel-settings';
  }

  private loadSettingsFromStorage(): void {
    const stored = localStorage.getItem(this.getSettingsStorageKey());
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<KritzelSettingsConfig>;
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
      } catch {
        // Invalid JSON, use prop defaults
      }
    }
  }

  private async loadShortcuts(): Promise<void> {
    this.shortcuts = await this.engineRef.getDisplayableShortcuts();
  }

  private get currentSettingsConfig(): KritzelSettingsConfig {
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

  private getContentObjects(objects: KritzelBaseObject<Element>[]): KritzelBaseObject<Element>[] {
    return objects.filter(obj => !(obj instanceof KritzelSelectionGroup) && !(obj instanceof KritzelSelectionBox));
  }

  private lastCustomSvgIcons?: KritzelSvgIconMap;

  private registerCustomSvgIcons(icons: KritzelSvgIconMap | undefined) {
    if (icons === this.lastCustomSvgIcons) {
      return;
    }
    this.lastCustomSvgIcons = icons;
    KritzelIconRegistry.registerIcons(icons ?? {});
  }

  private async registerCustomFonts(fonts: KritzelFontMap = this.customFonts): Promise<void> {
    KritzelFontRegistry.registerFonts(fonts);

    const currentVersion = ++this.customFontsLoadVersion;
    const loadPromise = KritzelFontRegistry.waitForFonts(fonts);
    this.customFontsReady = loadPromise;

    await loadPromise;

    if (currentVersion !== this.customFontsLoadVersion) {
      await this.waitForCustomFontsReady();
    }
  }

  private async waitForCustomFontsReady(): Promise<void> {
    while (true) {
      const version = this.customFontsLoadVersion;
      await this.customFontsReady;

      if (version === this.customFontsLoadVersion) {
        return;
      }
    }
  }

  private listenForMobileKeyboard() {
    KritzelKeyboardHelper.onKeyboardVisibleChanged(isOpen => {
      this.isVirtualKeyboardOpen = isOpen;
    });
  }

  private setOsSpecificCssVariables() {
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

    return (
      <Host>
        <div
          class="editor-content"
          style={{
            opacity: this.isEditorVisible ? '1' : '0',
            visibility: this.isEditorVisible ? 'visible' : 'hidden',
            transition: 'opacity 0.2s ease-in-out, visibility 0.2s ease-in-out',
          }}
        >
          <div class="top-left-buttons">
            <kritzel-workspace-manager
              ref={el => {
                if (el) {
                  this.workspaceManagerRef = el;
                }
              }}
              visible={this.isWorkspaceManagerVisible}
              workspaces={this.availableWorkspaces}
              activeWorkspace={this.activeWorkspace}
              terms={this.resolvedTerms}
              onWorkspaceChange={event => this.handleWorkspaceManagerChange(event)}
              onIsWorkspaceManagerReady={() => (this.isWorkspaceManagerReady = true)}
            ></kritzel-workspace-manager>

            <kritzel-back-to-content
              visible={this.isBackToContentButtonVisible}
              text={this.resolvedTerms['backToContent.label'] ?? 'Back to content'}
              onBackToContent={() => this.backToContent()}
            ></kritzel-back-to-content>
          </div>

          {this.activeNotification && (
            <div class="top-center-notification-layer" role="presentation">
              <div class={{ 'top-center-notification-container': true, 'is-dismissing': this.isNotificationDismissing }} role="presentation">
                <kritzel-notification-card
                  notification={this.activeNotification}
                  locale={this.locale}
                  onDismiss={this.dismissNotification}
                  onHoverChange={event => this.handleNotificationHoverChange(event)}
                ></kritzel-notification-card>
              </div>
            </div>
          )}

          {this.contextMenuState && this.contextMenuState.items.length > 0 && (
            <kritzel-context-menu
              class="context-menu"
              items={this.contextMenuState.items}
              objects={this.contextMenuState.objects}
              style={{
                position: 'absolute',
                left: `${this.contextMenuState.position.x}px`,
                top: `${this.contextMenuState.position.y}px`,
                zIndex: '10002',
              }}
              onActionSelected={event => this.handleContextMenuActionSelected(event)}
              onClose={() => this.hideContextMenu()}
            ></kritzel-context-menu>
          )}

          <kritzel-loading-overlay visible={this.isLoadingOverlayVisible} text={this.resolvedTerms['editor.loading'] ?? 'Loading...'}></kritzel-loading-overlay>

          <kritzel-engine
            ref={el => {
              if (el) {
                this.engineRef = el;
              }
            }}
            workspaces={this.workspaces}
            activeWorkspaceId={this.activeWorkspaceId}
            editorId={this.editorId}
            syncConfig={this.syncConfig}
            assetStorageConfig={this.assetStorageConfig}
            user={this.user}
            scaleMax={this.scaleMax}
            lockDrawingScale={this.lockDrawingScale}
            scaleMin={this.scaleMin}
            cursorTarget={this.cursorTarget}
            viewportBoundaryLeft={this.viewportBoundaryLeft}
            viewportBoundaryRight={this.viewportBoundaryRight}
            viewportBoundaryTop={this.viewportBoundaryTop}
            viewportBoundaryBottom={this.viewportBoundaryBottom}
            isPanningEnabled={this.isPanningEnabled}
            isZoomingEnabled={this.isZoomingEnabled}
            theme={this.theme}
            themes={this.themes}
            licenseKey={this.licenseKey}
            locale={this.locale}
            locales={this.locales}
            fallbackLocale={this.fallbackLocale}
            debugInfo={this.debugInfo}
            globalContextMenuItems={this.globalContextMenuItems}
            objectContextMenuItems={this.objectContextMenuItems}
            tools={tools}
            onIsEngineReady={event => this.onEngineReady(event)}
            onWorkspacesChange={event => this.handleWorkspacesChange(event)}
            onActiveWorkspaceChange={event => this.handleActiveWorkspaceChange(event)}
            onObjectsChange={event => this.handleObjectsChange(event)}
            onObjectsAdded={event => this.handleObjectsAdded(event)}
            onObjectsRemoved={event => this.handleObjectsRemoved(event)}
            onObjectsUpdated={event => this.handleObjectsUpdated(event)}
            onObjectsSelectionChange={event => this.handleObjectsSelectionChange(event)}
            onUndoStateChange={event => this.handleUndoStateChange(event)}
            onObjectsInViewportChange={event => this.handleObjectsInViewportChange(event)}
            onViewportChange={event => this.handleViewportChange(event)}
            onAwarenessChange={event => this.handleAwarenessChange(event)}
            onNotificationsChange={event => this.handleNotificationsChange(event)}
            onContextMenuStateChange={event => this.handleContextMenuStateChange(event)}
            onIsLoadingChange={event => this.handleIsLoadingChange(event)}
          ></kritzel-engine>

          <kritzel-toolbar
            visible={this.isToolbarVisible}
            class={{ 'keyboard-open': this.isVirtualKeyboardOpen }}
            ref={el => {
              if (el) {
                this.toolbarRef = el;
              }
            }}
            toolbarItems={normalizedToolbarItems}
            isUtilityPanelVisible={this.isUtilityPanelVisible}
            undoState={this.undoState ?? undefined}
            theme={this.theme}
            terms={this.resolvedTerms}
            onIsToolbarReady={() => (this.isToolbarReady = true)}
          ></kritzel-toolbar>

          <div class="bottom-left-buttons">
            <kritzel-zoom-panel
              visible={this.isZoomPanelVisible}
              zoomPercent={this.currentZoomPercent}
              terms={this.resolvedTerms}
              onZoomIn={() => this.zoomIn()}
              onZoomOut={() => this.zoomOut()}
            ></kritzel-zoom-panel>
          </div>

          <div class="top-right-buttons">
            <kritzel-settings
              ref={el => {
                if (el) {
                  this.settingsRef = el;
                }
              }}
              shortcuts={this.shortcuts}
              availableThemes={this.themes && this.themes.length > 0 ? this.themes.map(t => t.name) : ['light', 'dark']}
              availableLocales={this.availableLocaleOptions}
              settings={this.currentSettingsConfig}
              terms={this.resolvedTerms}
              onSettingsChange={event => this.handleSettingsChange(event)}
            ></kritzel-settings>

            <kritzel-export
              ref={el => {
                if (el) {
                  this.exportRef = el;
                }
              }}
              workspaceName={this.activeWorkspace?.name || 'workspace'}
              terms={this.resolvedTerms}
              onExportPng={() => this.engineRef.exportViewportAsPng()}
              onExportSvg={() => this.engineRef.exportViewportAsSvg()}
              onExportJson={event => this.engineRef.downloadAsJson(event.detail)}
            ></kritzel-export>

            <kritzel-active-users users={this.activeUsers}></kritzel-active-users>

            {shouldShowCurrentUser && <kritzel-current-user user={this.user} terms={this.resolvedTerms} onClick={() => this.currentUserDialogRef?.open()}></kritzel-current-user>}

            {shouldShowCurrentUser && (
              <kritzel-current-user-dialog
                ref={el => {
                  if (el) {
                    this.currentUserDialogRef = el;
                  }
                }}
                user={this.user}
                terms={this.resolvedTerms}
                onLogoutRequest={this.handleCurrentUserLogout}
              ></kritzel-current-user-dialog>
            )}

            {shouldShowLoginButton && <kritzel-button onButtonClick={() => this.loginDialogRef?.open()}>{this.resolvedTerms['login.dialogTitle'] ?? 'Sign in'}</kritzel-button>}

            <kritzel-more-menu
              ref={el => {
                if (el) {
                  this.moreMenuRef = el;
                }
              }}
              items={this.resolvedMoreMenuItems}
              visible={this.isMoreMenuVisible}
              terms={this.resolvedTerms}
            ></kritzel-more-menu>

            <kritzel-share-dialog
              ref={el => {
                if (el) {
                  this.shareDialogRef = el;
                }
              }}
              isPublic={this.currentIsPublic}
              workspaceId={this.activeWorkspace?.id}
              terms={this.resolvedTerms}
              onToggleIsPublic={this.handleToggleIsPublic}
            ></kritzel-share-dialog>

            {this.loginConfig && (
              <kritzel-login-dialog
                ref={el => {
                  if (el) {
                    this.loginDialogRef = el;
                  }
                }}
                providers={this.loginConfig.providers}
                dialogTitle={this.loginConfig.title ?? this.resolvedTerms['login.dialogTitle'] ?? 'Sign in'}
                subtitle={this.loginConfig.subtitle}
                onProviderLogin={this.handleProviderLogin}
              ></kritzel-login-dialog>
            )}
          </div>
        </div>
      </Host>
    );
  }
}
