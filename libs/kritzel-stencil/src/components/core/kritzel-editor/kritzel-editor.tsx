import { Component, Host, Listen, Prop, Element, h, Method, Event, State, EventEmitter, Watch } from '@stencil/core';
import { KritzelIconRegistry } from '../../../classes/registries/icon-registry.class';
import { KritzelToolbarControl } from '../../../interfaces/toolbar-control.interface';
import { ShapeType } from '../../../enums/shape-type.enum';
import { KritzelAlignment } from '../../../enums/alignment.enum';
import { KritzelBaseObject } from '../../../classes/objects/base-object.class';
import { KritzelSelectionTool } from '../../../classes/tools/selection-tool.class';
import { KritzelEraserTool } from '../../../classes/tools/eraser-tool.class';
import { KritzelImageTool } from '../../../classes/tools/image-tool.class';
import { KritzelBrushTool } from '../../../classes/tools/brush-tool.class';
import { KritzelLineTool } from '../../../classes/tools/line-tool.class';
import { KritzelTextTool } from '../../../classes/tools/text-tool.class';
import { KritzelShapeTool } from '../../../classes/tools/shape-tool.class';
import { ContextMenuItem } from '../../../interfaces/context-menu-item.interface';
import { DEFAULT_BRUSH_CONFIG } from '../../../configs/default-brush-tool.config';
import { DEFAULT_LINE_TOOL_CONFIG } from '../../../configs/default-line-tool.config';
import { DEFAULT_TEXT_CONFIG } from '../../../configs/default-text-tool.config';
import { DEFAULT_SHAPE_CONFIG } from '../../../configs/default-shape-tool.config';
import { ABSOLUTE_SCALE_MAX, ABSOLUTE_SCALE_MIN } from '../../../constants/engine.constants';
import { KritzelEngineState } from '../../../interfaces/engine-state.interface';
import { KritzelSettingsConfig } from '../../../interfaces/settings.interface';
import { KritzelDebugInfo } from '../../../interfaces/debug-info.interface';
import { IKritzelMenuItem } from '../../../interfaces/menu-item.interface';
import { KritzelWorkspace } from '../../../classes/core/workspace.class';
import { KritzelKeyboardHelper } from '../../../helpers/keyboard.helper';
import { KritzelDevicesHelper } from '../../../helpers/devices.helper';
import { KritzelSyncConfig, hasRemoteSyncProvider } from '../../../interfaces/sync-config.interface';
import { KritzelAssetStorageConfig } from '../../../interfaces/asset-storage-config.interface';
import { KritzelBaseTool } from '../../../classes/tools/base-tool.class';
import { KritzelBrushToolConfig, KritzelLineToolConfig, KritzelShapeToolConfig, KritzelTextToolConfig } from '../../../interfaces/toolbar-control.interface';
import { ActiveWorkspaceChangeEvent, DEFAULT_ASSET_STORAGE_CONFIG, EditorIsReadyEvent, KritzelUndoState } from '../../..';
import { DEFAULT_SYNC_CONFIG } from '../../../configs/default-sync.config';
import { ThemeName, KritzelTheme } from '../../../interfaces/theme.interface';
import { KritzelLocale, KritzelTermKey, KritzelTermVars, LocaleCode } from '../../../interfaces/localization.interface';
import { ThemeHelper } from '../../../helpers/theme.helper';
import { lightTheme } from '../../../themes/light-theme';
import { darkTheme } from '../../../themes/dark-theme';
import { KritzelSelectionGroup } from '../../../classes/objects/selection-group.class';
import { KritzelSelectionBox } from '../../../classes/objects/selection-box.class';
import { KritzelShortcut } from '../../../interfaces/shortcut.interface';
import { KritzelViewportState } from '../../../interfaces/viewport-state.interface';
import { ObjectsAddedEvent, ObjectsRemovedEvent, ObjectsUpdatedEvent } from '../../../interfaces/object-change-event.interface';
import { IKritzelUser } from '../../../interfaces/user.interface';
import { IKritzelIsPublicChangedEvent } from '../../../interfaces/share.interface';
import { KritzelLoginConfig as KritzelLoginConfig } from '../../../interfaces/login-config.interface';
import { LoginEvent } from '../../../events/login.event';
import { KritzelNotification } from '../../../interfaces/notification.interface';
import { ObjectHelper } from '../../../helpers/object.helper';
import { KritzelFontMap } from '../../../interfaces/font.interface';
import { KritzelFontRegistry } from '../../../classes/registries/font-registry.class';
import { resolveTextToolAvailableFonts } from '../../../constants/text-tool-fonts.constants';
import { KritzelContextMenuState } from '../../../interfaces/context-menu-state.interface';
import { KritzelObjectExportFormat } from '../../../interfaces/object-export.interface';

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
  @Prop() controls: KritzelToolbarControl[] = [
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
      icon: 'shape-rectangle',
      config: DEFAULT_SHAPE_CONFIG,
      subOptions: [
        { id: 'rectangle', icon: 'shape-rectangle', label: 'Rectangle', value: ShapeType.Rectangle, toolProperty: 'shapeType' },
        { id: 'ellipse', icon: 'shape-ellipse', label: 'Ellipse', value: ShapeType.Ellipse, toolProperty: 'shapeType' },
        { id: 'triangle', icon: 'shape-triangle', label: 'Triangle', value: ShapeType.Triangle, toolProperty: 'shapeType' },
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
      icon: 'select-all',
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
      visible: (_, objects) => this.canExportObjects(objects),
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
        { label: 'menu.bringToFront', icon: 'bring-to-front', action: () => this.engineRef.bringToFront() },
        { label: 'menu.sendToBack', icon: 'send-to-back', action: () => this.engineRef.sendToBack() },
        { label: 'menu.moveUp', icon: 'arrow-up-from-dot', action: () => this.engineRef.bringForward() },
        { label: 'menu.moveDown', icon: 'arrow-down-from-dot', action: () => this.engineRef.sendBackward() },
      ],
    },
    {
      label: 'menu.align',
      icon: 'align',
      group: 'other',
      children: [
        { label: 'menu.alignLeft', icon: 'align-start-vertical', action: () => this.engineRef.alignObjects(KritzelAlignment.StartHorizontal) },
        { label: 'menu.alignCenterHorizontal', icon: 'align-center-horizontal', action: () => this.engineRef.alignObjects(KritzelAlignment.CenterHorizontal) },
        { label: 'menu.alignRight', icon: 'align-end-vertical', action: () => this.engineRef.alignObjects(KritzelAlignment.EndHorizontal) },
        { label: 'menu.alignTop', icon: 'align-start-horizontal', action: () => this.engineRef.alignObjects(KritzelAlignment.StartVertical) },
        { label: 'menu.alignCenterVertical', icon: 'align-center-vertical', action: () => this.engineRef.alignObjects(KritzelAlignment.CenterVertical) },
        { label: 'menu.alignBottom', icon: 'align-end-horizontal', action: () => this.engineRef.alignObjects(KritzelAlignment.EndVertical) },
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
  @Prop() customSvgIcons: Record<string, string> = {};
  /**
   * Registers fonts for runtime usage (for example custom object rendering).
   * Text-tool config tooltip options are controlled via controls[].config.availableFonts.
   */
  @Prop() customFonts: KritzelFontMap = {};
  @Prop({ mutable: true }) isPanningEnabled: boolean = true;
  @Prop({ mutable: true }) isZoomingEnabled: boolean = true;
  @Prop() isControlsVisible: boolean = true;
  @Prop() isUtilityPanelVisible: boolean = true;
  @Prop() isWorkspaceManagerVisible: boolean = true;
  @Prop() isMoreMenuVisible: boolean = true;
  @Prop() isZoomPanelVisible: boolean = true;
  @Prop() isObjectDistanceFadingActive: boolean = false;
  @Prop() syncConfig?: KritzelSyncConfig = DEFAULT_SYNC_CONFIG;
  @Prop() assetStorageConfig?: KritzelAssetStorageConfig = DEFAULT_ASSET_STORAGE_CONFIG;

  /** The element to use as the target for the cursor. Defaults to the editor container if not set. */
  @Prop() cursorTarget?: HTMLElement;

  /** Optional login configuration. When provided, a "Sign in" button is shown that opens a login dialog with the configured providers. */
  @Prop() loginConfig?: KritzelLoginConfig;

  /** Whether the editor is in a loading state. When true, a loading overlay is displayed. */
  @Prop() isLoading: boolean = false;

  /** Optional unique identifier for namespacing storage keys across multiple editor instances. */
  @Prop() editorId?: string;

  /** Optional workspace ID to set as active. If provided, the editor will automatically activate the workspace with this ID. */
  @Prop() activeWorkspaceId?: string;

  @Event() isReady!: EventEmitter<EditorIsReadyEvent>;
  @Event() activeWorkspaceChange!: EventEmitter<ActiveWorkspaceChangeEvent>;
  @Event() objectsChange!: EventEmitter<KritzelBaseObject[]>;
  @Event() objectsAdded!: EventEmitter<ObjectsAddedEvent>;
  @Event() objectsRemoved!: EventEmitter<ObjectsRemovedEvent>;
  @Event() objectsUpdated!: EventEmitter<ObjectsUpdatedEvent>;
  @Event() undoStateChange!: EventEmitter<KritzelUndoState>;
  @Event() themeChange!: EventEmitter<ThemeName>;
  @Event() localeChange!: EventEmitter<LocaleCode>;
  @Event() viewportChange!: EventEmitter<KritzelViewportState>;
  @Event() logout!: EventEmitter<void>;
  @Event() login!: EventEmitter<LoginEvent>;
  @Event() isPublicChange!: EventEmitter<IKritzelIsPublicChangedEvent>;
  @Event() awarenessChange!: EventEmitter<Map<number, Record<string, any>>>;

  @State() isEngineReady: boolean = false;
  @State() isControlsReady: boolean = false;
  @State() isWorkspaceManagerReady: boolean = false;
  @State() workspaces: KritzelWorkspace[] = [];
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
  @State() normalizedControls: KritzelToolbarControl[] = [];
  @State() resolvedMoreMenuItems: IKritzelMenuItem[] = [];

  private notificationDismissTimeout?: ReturnType<typeof setTimeout>;
  private notificationDismissAnimationTimeout?: ReturnType<typeof setTimeout>;
  private readonly notificationDisplayDurationMs = 5000;
  private readonly notificationDismissAnimationDurationMs = 180;
  private isNotificationHovered: boolean = false;
  private customFontsLoadVersion: number = 0;
  private customFontsReady: Promise<void> = Promise.resolve();

  @Watch('isEngineReady')
  onIsEngineReady(newValue: boolean) {
    if (newValue && this.isControlsReady) {
      this.checkIsReady();
    }
  }

  @Watch('isControlsReady')
  onIsControlsReady(newValue: boolean) {
    if (newValue && this.isEngineReady) {
      this.checkIsReady();
    }
  }

  @Watch('workspaces')
  onWorkspacesChange(newWorkspaces: KritzelWorkspace[]) {
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

  @Watch('controls')
  onControlsChange(newValue: KritzelToolbarControl[]) {
    this.normalizedControls = this.normalizeControls(newValue);
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
    if (this.workspaces.length === 0) {
      return;
    }
    // Find the workspace with the matching ID
    const workspace = this.workspaces.find(ws => ws.id === newId);
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

  /**
   * Refreshes the editor-owned localized strings (e.g. the more menu and the
   * strings forwarded to child UI components) from the engine's localization
   * manager for the active locale.
   */
  private async refreshLocalizedTerms(): Promise<void> {
    if (!this.engineRef) {
      return;
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

  // ── Tool management ─────────────────────────────────────────────────

  @Method()
  async registerTool(
    toolName: string,
    toolClass: any,
    toolConfig?: KritzelTextToolConfig | KritzelBrushToolConfig | KritzelLineToolConfig | KritzelShapeToolConfig,
  ): Promise<KritzelBaseTool | null> {
    return this.engineRef.registerTool(toolName, toolClass, toolConfig);
  }

  @Method()
  async changeActiveTool(tool: KritzelBaseTool) {
    return this.engineRef.changeActiveTool(tool);
  }

  @Method()
  async changeActiveToolByName(toolName: string): Promise<void> {
    return this.engineRef.changeActiveToolByName(toolName);
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
  async getScreenshot(format: 'png' | 'svg' = 'png', options?: { includeBackground?: boolean }): Promise<string | null> {
    return this.engineRef.getScreenshot(format, options);
  }

  @Method()
  async exportViewportAsPng(options?: { includeBackground?: boolean }): Promise<void> {
    return this.engineRef.exportViewportAsPng(options);
  }

  @Method()
  async exportViewportAsSvg(options?: { includeBackground?: boolean }): Promise<void> {
    return this.engineRef.exportViewportAsSvg(options);
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
  controlsRef!: HTMLKritzelControlsElement;
  settingsRef!: HTMLKritzelSettingsElement;
  exportRef!: HTMLKritzelExportElement;
  splitButtonRef!: HTMLKritzelSplitButtonElement;
  shareDialogRef!: HTMLKritzelShareDialogElement;
  loginDialogRef!: HTMLKritzelLoginDialogElement;
  currentUserDialogRef!: HTMLKritzelCurrentUserDialogElement;

  componentWillLoad() {
    this.normalizedControls = this.normalizeControls(this.controls);
    this.recomputeMoreMenuItems();
    this.loadSettingsFromStorage();
    this.applyTheme();
  }

  private isTextToolConfig(config?: KritzelTextToolConfig | KritzelBrushToolConfig | KritzelLineToolConfig | KritzelShapeToolConfig): config is KritzelTextToolConfig {
    return !!config && 'fontFamily' in config && 'size' in config && 'color' in config;
  }

  private normalizeControls(controls: KritzelToolbarControl[]): KritzelToolbarControl[] {
    return controls.map(control => {
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
    this.registerCustomSvgIcons();
    this.registerCustomFonts();
    this.listenForMobileKeyboard();
    this.setOsSpecificCssVariables();
  }

  disconnectedCallback() {
    this.clearNotificationDismissTimer();
    this.clearNotificationDismissAnimationTimer();
  }

  async checkIsReady() {
    await customElements.whenDefined('kritzel-editor');
    await customElements.whenDefined('kritzel-workspace-manager');
    await customElements.whenDefined('kritzel-controls');
    await customElements.whenDefined('kritzel-engine');
    await this.waitForCustomFontsReady();

    if (!this.isEngineReady || !this.isControlsReady || !this.isWorkspaceManagerReady || !this.activeWorkspace) {
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
    this.workspaces = event.detail.workspaces;
    this.currentIsPublic = await this.engineRef.getIsPublic();

    await this.refreshLocalizedTerms();

    const viewport = await this.engineRef.getViewport();
    this.currentZoomPercent = this.getZoomPercentFromScale(viewport.scale);

    this.loadShortcuts();
  }

  handleWorkspacesChange(event: CustomEvent<KritzelWorkspace[]>) {
    event.stopPropagation();
    this.workspaces = event.detail;
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

  @Method()
  async openLoginDialog(): Promise<void> {
    this.loginDialogRef?.open();
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
   * Configure tooltip fonts via controls[].config.availableFonts.
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

  private registerCustomSvgIcons() {
    for (const [name, svg] of Object.entries(this.customSvgIcons)) {
      KritzelIconRegistry.register(name, svg);
    }
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
        this.host.style.setProperty('--kritzel-editor-controls-bottom', '14px');
        this.host.style.setProperty('--kritzel-editor-controls-transition', 'cubic-bezier(0.25, 0.1, 0.25, 1.0)');
        this.host.style.setProperty('--kritzel-editor-controls-transform', 'translateY(200%)');
        this.host.style.setProperty('--kritzel-editor-controls-transition-duration', '0.25s');
        break;

      case 'Android':
        // Android specific adjustments
        this.host.style.setProperty('--kritzel-editor-top-left-buttons-top', '14px');
        this.host.style.setProperty('--kritzel-editor-top-left-buttons-left', '14px');
        this.host.style.setProperty('--kritzel-editor-controls-bottom', '24px');
        this.host.style.setProperty('--kritzel-editor-controls-transition', 'cubic-bezier(0.25, 0.1, 0.25, 1.0)');
        this.host.style.setProperty('--kritzel-editor-controls-transform', 'translateY(200%)');
        this.host.style.setProperty('--kritzel-editor-controls-transition-duration', '0.25s');
        break;

      default:
        // Default for Windows/Linux
        this.host.style.setProperty('--kritzel-editor-top-left-buttons-top', '14px');
        this.host.style.setProperty('--kritzel-editor-top-left-buttons-left', '14px');
        this.host.style.setProperty('--kritzel-editor-controls-bottom', '14px');
        break;
    }
  }

  render() {
    const isLoggedIn = this.isLoggedIn;
    const shouldShowCurrentUser = isLoggedIn;
    const shouldShowLoginButton = this.isReady && !!this.loginConfig && !isLoggedIn;

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
              visible={this.isWorkspaceManagerVisible}
              workspaces={this.workspaces}
              activeWorkspace={this.activeWorkspace}
              terms={this.resolvedTerms}
              onWorkspaceChange={event => (this.activeWorkspace = event.detail)}
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

          <kritzel-engine
            ref={el => {
              if (el) {
                this.engineRef = el;
              }
            }}
            workspace={this.activeWorkspace}
            activeWorkspaceId={this.activeWorkspaceId}
            editorId={this.editorId}
            syncConfig={this.syncConfig}
            assetStorageConfig={this.assetStorageConfig}
            user={this.user}
            scaleMax={this.scaleMax}
            lockDrawingScale={this.lockDrawingScale}
            isObjectDistanceFadingActive={this.isObjectDistanceFadingActive}
            scaleMin={this.scaleMin}
            cursorTarget={this.cursorTarget}
            isLoading={this.isLoading}
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
            onIsEngineReady={event => this.onEngineReady(event)}
            onWorkspacesChange={event => this.handleWorkspacesChange(event)}
            onActiveWorkspaceChange={event => this.handleActiveWorkspaceChange(event)}
            onObjectsChange={event => this.handleObjectsChange(event)}
            onObjectsAdded={event => this.handleObjectsAdded(event)}
            onObjectsRemoved={event => this.handleObjectsRemoved(event)}
            onObjectsUpdated={event => this.handleObjectsUpdated(event)}
            onUndoStateChange={event => this.handleUndoStateChange(event)}
            onObjectsInViewportChange={event => this.handleObjectsInViewportChange(event)}
            onViewportChange={event => this.handleViewportChange(event)}
            onAwarenessChange={event => this.handleAwarenessChange(event)}
            onNotificationsChange={event => this.handleNotificationsChange(event)}
            onContextMenuStateChange={event => this.handleContextMenuStateChange(event)}
          ></kritzel-engine>

          <kritzel-controls
            visible={this.isControlsVisible}
            class={{ 'keyboard-open': this.isVirtualKeyboardOpen }}
            ref={el => {
              if (el) {
                this.controlsRef = el;
              }
            }}
            controls={this.normalizedControls}
            isUtilityPanelVisible={this.isUtilityPanelVisible}
            undoState={this.undoState ?? undefined}
            theme={this.theme}
            terms={this.resolvedTerms}
            onIsControlsReady={() => (this.isControlsReady = true)}
          ></kritzel-controls>

          <div class="bottom-left-buttons">
            <kritzel-zoom-panel
              visible={this.isZoomPanelVisible}
              disabled={!this.isZoomingEnabled}
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
                    this.currentUserDialogRef.addEventListener('logoutRequest', this.handleCurrentUserLogout);
                  }
                }}
                user={this.user}
                terms={this.resolvedTerms}
              ></kritzel-current-user-dialog>
            )}

            {shouldShowLoginButton && <kritzel-button onButtonClick={() => this.loginDialogRef?.open()}>{this.resolvedTerms['login.dialogTitle'] ?? 'Sign in'}</kritzel-button>}

            <kritzel-more-menu items={this.resolvedMoreMenuItems} visible={this.isMoreMenuVisible} terms={this.resolvedTerms}></kritzel-more-menu>

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
