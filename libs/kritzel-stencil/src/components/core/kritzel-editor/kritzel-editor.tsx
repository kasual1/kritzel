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
import { KritzelSyncConfig } from '../../../interfaces/sync-config.interface';
import { KritzelBaseTool } from '../../../classes/tools/base-tool.class';
import { KritzelBrushToolConfig, KritzelLineToolConfig, KritzelShapeToolConfig, KritzelTextToolConfig } from '../../../interfaces/toolbar-control.interface';
import { ActiveWorkspaceChangeEvent, EditorIsReadyEvent, KritzelUndoState } from '../../..';
import { DEFAULT_SYNC_CONFIG } from '../../../configs/default-sync.config';
import { ThemeName } from '../../../interfaces/theme.interface';
import { KritzelSelectionGroup } from '../../../classes/objects/selection-group.class';
import { KritzelSelectionBox } from '../../../classes/objects/selection-box.class';
import { KritzelShortcut } from '../../../interfaces/shortcut.interface';
import { KritzelViewportState } from '../../../interfaces/viewport-state.interface';
import { ObjectsAddedEvent, ObjectsRemovedEvent, ObjectsUpdatedEvent } from '../../../interfaces/object-change-event.interface';
import { IKritzelUser } from '../../../interfaces/user.interface';
import { IKritzelIsPublicChangedEvent } from '../../../interfaces/share.interface';
import { KritzelLoginConfig as KritzelLoginConfig } from '../../../interfaces/login-config.interface';
import { LoginEvent } from '../../../events/login.event';
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
  @Prop({ mutable: true }) wheelEnabled: boolean = true;
  @Prop({ mutable: true }) debugInfo: KritzelDebugInfo = {
    showViewportInfo: false,
    showObjectInfo: false,
    showSyncProviderInfo: true,
    showMigrationInfo: true,
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
      label: 'Paste',
      icon: 'paste',
      disabled: async () => (await this.engineRef.getCopiedObjects()).length === 0,
      action: menu => this.engineRef.paste(menu.x, menu.y),
    },
    {
      label: 'Select All',
      icon: 'select-all',
      disabled: async () => (await this.engineRef.getObjectsInViewport()).length === 0,
      action: () => this.selectAllObjectsInViewport(),
    },
  ];

  @Prop() objectContextMenuItems: ContextMenuItem[] = [
    { label: 'Copy', icon: 'copy', group: 'clipboard', action: () => this.engineRef.copy() },
    {
      label: 'Paste',
      icon: 'paste',
      group: 'clipboard',
      disabled: async () => (await this.engineRef.getCopiedObjects()).length === 0,
      action: (menu, _) => this.engineRef.paste(menu.x, menu.y),
    },
    {
      label: 'Order',
      icon: 'ordering',
      group: 'other',
      children: [
        { label: 'Bring to Front', icon: 'bring-to-front', action: () => this.engineRef.bringToFront() },
        { label: 'Send to Back', icon: 'send-to-back', action: () => this.engineRef.sendToBack() },
        { label: 'Move Up', icon: 'arrow-up-from-dot', action: () => this.engineRef.bringForward() },
        { label: 'Move Down', icon: 'arrow-down-from-dot', action: () => this.engineRef.sendBackward() },
      ],
    },
    {
      label: 'Align',
      icon: 'align',
      group: 'other',
      disabled: async () => (await this.engineRef.getSelectedObjects()).length < 2,
      children: [
        { label: 'Align Left', icon: 'align-start-vertical', action: () => this.engineRef.alignObjects(KritzelAlignment.StartHorizontal) },
        { label: 'Align Center Horizontally', icon: 'align-center-horizontal', action: () => this.engineRef.alignObjects(KritzelAlignment.CenterHorizontal) },
        { label: 'Align Right', icon: 'align-end-vertical', action: () => this.engineRef.alignObjects(KritzelAlignment.EndHorizontal) },
        { label: 'Align Top', icon: 'align-start-horizontal', action: () => this.engineRef.alignObjects(KritzelAlignment.StartVertical) },
        { label: 'Align Center Vertically', icon: 'align-center-vertical', action: () => this.engineRef.alignObjects(KritzelAlignment.CenterVertical) },
        { label: 'Align Bottom', icon: 'align-end-horizontal', action: () => this.engineRef.alignObjects(KritzelAlignment.EndVertical) },
      ],
    },
    {
      label: 'Group',
      icon: 'group',
      group: 'other',
      children: [
        {
          label: 'Group',
          icon: 'group',
          disabled: async () => (await this.engineRef.getSelectedObjects()).length < 2,
          action: () => this.engineRef.group(),
        },
        {
          label: 'Ungroup',
          icon: 'ungroup',
          disabled: async () => {
            const selectedObjects = await this.engineRef.getSelectedObjects();
            return !selectedObjects.some(obj => obj.__class__ === 'KritzelGroup');
          },
          action: () => this.engineRef.ungroup(),
        },
      ],
    },
    {
      label: 'Export',
      icon: 'download',
      group: 'export',
      children: [
        { label: 'Export as SVG', icon: 'download', action: () => this.engineRef.exportSelectedObjectsAsSvg() },
        { label: 'Export as PNG', icon: 'download', action: () => this.engineRef.exportSelectedObjectsAsPng() },
      ],
    },
    { label: 'Delete', icon: 'delete', group: 'edit', action: () => this.engineRef.delete() },
  ];

  @Prop() customSvgIcons: Record<string, string> = {};
  @Prop() isControlsVisible: boolean = true;
  @Prop() isUtilityPanelVisible: boolean = true;
  @Prop() isWorkspaceManagerVisible: boolean = true;
  @Prop() syncConfig?: KritzelSyncConfig = DEFAULT_SYNC_CONFIG;

  /** The element to use as the target for the cursor. Defaults to the editor container if not set. */
  @Prop() cursorTarget?: HTMLElement;

  /** Optional login configuration. When provided, a "Sign in" button is shown that opens a login dialog with the configured providers. */
  @Prop() loginConfig?: KritzelLoginConfig = {
    providers: [
      {
        label: 'Sign in with Google',
        icon: 'google',
        name: 'Google',
      },
    ],
  };

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
  @State() currentTheme: ThemeName = 'light';
  @State() shortcuts: Omit<KritzelShortcut, 'action' | 'condition'>[] = [];
  @State() currentIsPublic: boolean = false;

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

  @Watch('currentTheme')
  onCurrentThemeChange() {
    setTimeout(() => this.setOsSpecificCssVariables(), 0);
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
  async updateObject<T extends KritzelBaseObject>(object: T, updatedProperties: Partial<T>): Promise<T | null> {
    return this.engineRef.updateObject(object, updatedProperties);
  }

  @Method()
  async removeObject<T extends KritzelBaseObject>(object: T): Promise<T | null> {
    return this.engineRef.removeObject(object);
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
  async backToContent(): Promise<boolean> {
    return this.engineRef.backToContent();
  }

  @Method()
  async centerAllObjects(animate = true): Promise<boolean> {
    return this.engineRef.centerAllObjects(animate);
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
  async getCopiedObjects(): Promise<KritzelBaseObject[]> {
    return this.engineRef.getCopiedObjects();
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
  async triggerSelectionChange() {
    return this.engineRef.triggerSelectionChange();
  }

  @Method()
  async getDisplayableShortcuts(): Promise<Omit<KritzelShortcut, 'action' | 'condition'>[]> {
    return this.engineRef.getDisplayableShortcuts();
  }

  engineRef!: HTMLKritzelEngineElement;
  controlsRef!: HTMLKritzelControlsElement;
  settingsRef!: HTMLKritzelSettingsElement;
  exportRef!: HTMLKritzelExportElement;
  splitButtonRef!: HTMLKritzelSplitButtonElement;
  shareDialogRef!: HTMLKritzelShareDialogElement;
  loginDialogRef!: HTMLKritzelLoginDialogElement;

  componentWillLoad() {
    this.loadSettingsFromStorage();
  }

  componentDidLoad() {
    this.registerCustomSvgIcons();
    this.listenForMobileKeyboard();
    this.setOsSpecificCssVariables();
  }

  async checkIsReady() {
    await customElements.whenDefined('kritzel-editor');
    await customElements.whenDefined('kritzel-workspace-manager');
    await customElements.whenDefined('kritzel-controls');
    await customElements.whenDefined('kritzel-engine');

    if (!this.isEngineReady || !this.isControlsReady || !this.isWorkspaceManagerReady || !this.activeWorkspace) {
      return;
    }

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
      loginConfig: this.loginConfig,
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
    this.loadShortcuts();
  }

  handleWorkspacesChange(event: CustomEvent<KritzelWorkspace[]>) {
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
    this.objectsChange.emit(event.detail);
  }

  handleObjectsAdded(event: CustomEvent<ObjectsAddedEvent>) {
    this.objectsAdded.emit(event.detail);
  }

  handleObjectsRemoved(event: CustomEvent<ObjectsRemovedEvent>) {
    this.objectsRemoved.emit(event.detail);
  }

  handleObjectsUpdated(event: CustomEvent<ObjectsUpdatedEvent>) {
    this.objectsUpdated.emit(event.detail);
  }

  handleUndoStateChange(event: CustomEvent<KritzelUndoState>) {
    this.undoStateChange.emit(event.detail);
    this.undoState = event.detail;
  }

  async handleObjectsInViewportChange(event: CustomEvent<KritzelBaseObject<Element>[]>) {
    const hasVisibleObjects = this.getContentObjects(event.detail).length > 0;
    const hasAnyObjectsAtAll = this.getContentObjects(await this.engineRef.getAllObjects()).length > 0;
    this.isBackToContentButtonVisible = !hasVisibleObjects && hasAnyObjectsAtAll;
  }

  handleViewportChange(event: CustomEvent<KritzelViewportState>) {
    this.viewportChange.emit(event.detail);
  }

  handleAwarenessChange(event: CustomEvent<Map<number, Record<string, any>>>) {
    this.awarenessChange.emit(event.detail);
  }

  handleSettingsChange(event: CustomEvent<KritzelSettingsConfig>) {
    this.scaleMin = event.detail.scaleMin;
    this.scaleMax = event.detail.scaleMax;
    this.lockDrawingScale = event.detail.lockDrawingScale;
    this.currentTheme = event.detail.theme;
    this.viewportBoundaryLeft = event.detail.viewportBoundaryLeft ?? -Infinity;
    this.viewportBoundaryRight = event.detail.viewportBoundaryRight ?? Infinity;
    this.viewportBoundaryTop = event.detail.viewportBoundaryTop ?? -Infinity;
    this.viewportBoundaryBottom = event.detail.viewportBoundaryBottom ?? Infinity;
    this.debugInfo = event.detail.debugInfo;
    this.themeChange.emit(event.detail.theme);
  }

  private get moreMenuItems(): IKritzelMenuItem[] {
    return [
      {
        id: 'share',
        label: 'Share',
        icon: 'share',
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
        label: 'Export',
        icon: 'upload',
        action: async () => {
          const preview = await this.engineRef.getScreenshot('png');
          this.exportRef.open(preview ?? undefined);
        },
      },
      {
        id: 'import',
        label: 'Import',
        icon: 'download',
        action: () => this.engineRef.importFromFile(),
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: 'settings',
        action: () => this.settingsRef.open(),
      },
      {
        id: 'logout',
        label: 'Logout',
        icon: 'log-out',
        color: '#ff3b30',
        isVisible: this.isLoggedIn,
        action: () => this.logout.emit(),
      },
    ];
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

  private get isLoggedIn(): boolean {
    return !!this.user && !this.user.isGuest;
  }

  @Method()
  async openLoginDialog(): Promise<void> {
    this.loginDialogRef?.open();
  }

  @Method()
  async setLoginLoading(provider: string | null): Promise<void> {
    this.loginDialogRef?.setLoading(provider);
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
        if (parsed.theme === 'light' || parsed.theme === 'dark') {
          this.currentTheme = parsed.theme;
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

  private getContentObjects(objects: KritzelBaseObject<Element>[]): KritzelBaseObject<Element>[] {
    return objects.filter(obj => !(obj instanceof KritzelSelectionGroup) && !(obj instanceof KritzelSelectionBox));
  }

  private registerCustomSvgIcons() {
    for (const [name, svg] of Object.entries(this.customSvgIcons)) {
      KritzelIconRegistry.register(name, svg);
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
    const shouldShowLoginButton = !!this.loginConfig && !isLoggedIn;

    return (
      <Host>
        <div class="top-left-buttons">
          <kritzel-workspace-manager
            visible={this.isWorkspaceManagerVisible}
            workspaces={this.workspaces}
            activeWorkspace={this.activeWorkspace}
            onWorkspaceChange={event => (this.activeWorkspace = event.detail)}
            onIsWorkspaceManagerReady={() => (this.isWorkspaceManagerReady = true)}
          ></kritzel-workspace-manager>

          <kritzel-back-to-content visible={this.isBackToContentButtonVisible} onBackToContent={() => this.backToContent()}></kritzel-back-to-content>
        </div>

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
          user={this.user}
          scaleMax={this.scaleMax}
          lockDrawingScale={this.lockDrawingScale}
          scaleMin={this.scaleMin}
          cursorTarget={this.cursorTarget}
          isLoading={this.isLoading}
          viewportBoundaryLeft={this.viewportBoundaryLeft}
          viewportBoundaryRight={this.viewportBoundaryRight}
          viewportBoundaryTop={this.viewportBoundaryTop}
          viewportBoundaryBottom={this.viewportBoundaryBottom}
          wheelEnabled={this.wheelEnabled}
          theme={this.currentTheme}
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
        ></kritzel-engine>

        <kritzel-controls
          class={{ 'keyboard-open': this.isVirtualKeyboardOpen }}
          style={{ display: this.isControlsVisible ? 'flex' : 'none' }}
          ref={el => {
            if (el) {
              this.controlsRef = el;
            }
          }}
          controls={this.controls}
          isUtilityPanelVisible={this.isUtilityPanelVisible}
          undoState={this.undoState ?? undefined}
          theme={this.currentTheme}
          onIsControlsReady={() => (this.isControlsReady = true)}
        ></kritzel-controls>

        <div class="top-right-buttons">
          <kritzel-settings
            ref={el => {
              if (el) {
                this.settingsRef = el;
              }
            }}
            shortcuts={this.shortcuts}
            editorId={this.editorId}
            onSettingsChange={event => this.handleSettingsChange(event)}
          ></kritzel-settings>

          <kritzel-export
            ref={el => {
              if (el) {
                this.exportRef = el;
              }
            }}
            workspaceName={this.activeWorkspace?.name || 'workspace'}
            onExportPng={() => this.engineRef.exportViewportAsPng()}
            onExportSvg={() => this.engineRef.exportViewportAsSvg()}
            onExportJson={event => this.engineRef.downloadAsJson(event.detail)}
          ></kritzel-export>

          <kritzel-active-users users={this.activeUsers}></kritzel-active-users>

          {shouldShowCurrentUser && <kritzel-current-user user={this.user}></kritzel-current-user>}

          {shouldShowLoginButton && <kritzel-button onButtonClick={() => this.loginDialogRef?.open()}>Sign in</kritzel-button>}

          <kritzel-more-menu items={this.moreMenuItems}></kritzel-more-menu>

          <kritzel-share-dialog
            ref={el => {
              if (el) {
                this.shareDialogRef = el;
              }
            }}
            isPublic={this.currentIsPublic}
            workspaceId={this.activeWorkspace?.id}
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
              dialogTitle={this.loginConfig.title}
              subtitle={this.loginConfig.subtitle}
              onProviderLogin={this.handleProviderLogin}
            ></kritzel-login-dialog>
          )}
        </div>
      </Host>
    );
  }
}
