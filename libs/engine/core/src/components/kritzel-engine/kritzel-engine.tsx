import { Component, Host, h, Listen, Element, Prop, Method, State, Event, EventEmitter, Watch } from '@stencil/core';
import { KritzelViewport } from '../../classes/core/viewport.class';
import { KritzelPath } from '../../classes/objects/path.class';
import { KritzelLine } from '../../classes/objects/line.class';
import { KritzelSelectionTool } from '../../classes/tools/selection-tool.class';
import { KritzelTextTool } from '../../classes/tools/text-tool.class';
import { KritzelShapeTool } from '../../classes/tools/shape-tool.class';
import { KritzelBrushTool } from '../../classes/tools/brush-tool.class';
import { KritzelLineTool } from '../../classes/tools/line-tool.class';
import { KritzelImageTool } from '../../classes/tools/image-tool.class';
import { KritzelImage } from '../../classes/objects/image.class';
import { KritzelText } from '../../classes/objects/text.class';
import { KritzelShape } from '../../classes/objects/shape.class';
import { KritzelSelectionGroup } from '../../classes/objects/selection-group.class';
import { KritzelGroup } from '../../classes/objects/group.class';
import { KritzelSelectionBox } from '../../classes/objects/selection-box.class';
import { KritzelKeyHandler } from '../../classes/handlers/key.handler';
import { KritzelBaseTool } from '../../classes/tools/base-tool.class';
import { KritzelToolType } from '../../interfaces/tool-type.interface';
import { ContextMenuItem } from '../../interfaces/context-menu-item.interface';
import { KritzelEraserTool } from '../../classes/tools/eraser-tool.class';
import { KritzelBrushToolConfig, KritzelLineToolConfig, KritzelShapeToolConfig, KritzelTextToolConfig } from '../../interfaces/toolbar-item.interface';
import { KritzelKeyboardHelper } from '../../helpers/keyboard.helper';
import { KritzelContextMenuHandler } from '../../classes/handlers/context-menu.handler';
import { KritzelBaseObject } from '../../classes/objects/base-object.class';
import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelClassHelper } from '../../helpers/class.helper';
import { ABSOLUTE_SCALE_MAX, ABSOLUTE_SCALE_MIN } from '../../constants/engine.constants';
import { KritzelDynamicObject } from '../../classes/objects/dynamic-object.class';
import { KritzelWorkspace, WORKSPACE_EXPORT_VERSION } from '../../classes/core/workspace.class';
import { KritzelReviver } from '../../classes/core/reviver.class';
import { KritzelEngineState } from '../../interfaces/engine-state.interface';
import { KritzelDebugInfo } from '../../interfaces/debug-info.interface';
import { KritzelSettingsConfig } from '../../interfaces/settings.interface';
import { KritzelCore } from '../../classes/core/core.class';
import { KritzelDevicesHelper } from '../../helpers/devices.helper';
import { KritzelSyncConfig } from '../../interfaces/sync-config.interface';
import { KritzelAssetStorageConfig } from '../../interfaces/asset-storage-config.interface';
import { throttle } from 'lodash';
import { KritzelColorHelper } from '../../helpers/color.helper';
import { toPng, toSvg } from 'html-to-image';
import { KritzelUndoState } from '../../interfaces/undo-state.interface';
import { KritzelTheme, ThemeName } from '../../interfaces/theme.interface';
import { KritzelLocale, KritzelTermKey, KritzelTermVars, LocaleCode } from '../../interfaces/localization.interface';
import { KritzelShortcut } from '../../interfaces/shortcut.interface';
import { KritzelAlignment } from '../../enums/alignment.enum';
import { KritzelViewportState } from '../../interfaces/viewport-state.interface';
import { ObjectHelper } from '../../helpers/object.helper';
import { KritzelWheelHelper } from '../../helpers/wheel.helper';
import { ObjectsAddedEvent, ObjectsRemovedEvent, ObjectsUpdatedEvent, ObjectsInViewportChangeEvent } from '../../interfaces/object-change-event.interface';
import { IKritzelUser } from '../../interfaces/user.interface';
import { KritzelNotification } from '../../interfaces/notification.interface';
import { resolveTextToolAvailableFonts } from '../../constants/text-tool-fonts.constants';
import { KritzelContextMenuState } from '../../interfaces/context-menu-state.interface';
import { KritzelExportable, KritzelObjectExportContext, KritzelObjectExportFormat } from '../../interfaces/object-export.interface';
import { KritzelSvgExportHelper } from '../../helpers/svg-export.helper';
import { KritzelToolDefinition } from '../../interfaces/tool.interface';

type WorkspaceExportMode = 'lightweight' | 'portable';

interface WorkspaceJsonExportPayload extends Record<string, unknown> {
  __class__?: string;
  version?: string;
  objects?: unknown[];
  exportMode?: WorkspaceExportMode;
  assets?: Record<string, string>;
}

@Component({
  tag: 'kritzel-engine',
  styleUrl: 'kritzel-engine.css',
  shadow: true,
})
export class KritzelEngine {
  @Element() host!: HTMLElement;

  private activeImportFileInput?: HTMLInputElement;
  private cancelActiveImport?: () => void;

  /** Authoritative workspace catalog for this engine instance. When provided, provider-only workspaces are hidden but not deleted. */
  @Prop() workspaces?: KritzelWorkspace[];
  @Watch('workspaces')
  async onWorkspacesPropChange() {
    if (!this._isYjsInitialized) {
      return;
    }

    await this.reconcileProvidedWorkspaces();
    await this.ensureActiveWorkspaceIsVisible();
    this.workspacesChange.emit(this.getVisibleWorkspaces());
  }

  /** Optional unique identifier for namespacing storage keys across multiple editor instances. */
  @Prop() editorId?: string;

  /** Optional workspace ID to load. If provided, the engine will look up and load this workspace by ID. */
  @Prop() activeWorkspaceId?: string;
  @Watch('activeWorkspaceId')
  async onActiveWorkspaceIdChange(newWorkspaceId?: string) {
    if (!newWorkspaceId || !this._isYjsInitialized) {
      return;
    }

    await this.switchToWorkspaceById(newWorkspaceId);
  }

  /** Configuration for real-time synchronization providers (e.g., IndexedDB, WebSocket). */
  @Prop() syncConfig?: KritzelSyncConfig;
  @Watch('syncConfig')
  async onSyncConfigChange(newValue: KritzelSyncConfig | undefined) {
    this._syncConfigRevision++;

    // Keep core config in sync immediately so late prop updates are not lost.
    this.core.setSyncConfig(newValue);

    // If syncConfig arrives after componentDidLoad, initialize Yjs now.
    // Guard on _isViewportReady to avoid restoring viewport state before
    // viewportWidth/viewportHeight are set (they default to 0 until the
    // KritzelViewport constructor runs inside componentDidLoad's timeout).
    if (newValue && !this._isYjsInitialized && this._isViewportReady) {
      await this.initializeSyncAndWorkspace();
    }
  }

  /**
   * Configuration for binary asset storage (e.g., images).
   *
   * The Yjs document only persists asset ids; the actual bytes are stored
   * by the providers listed here. Defaults to IndexedDB-only storage. To
   * support cross-device image sync alongside a networked sync provider
   * (Hocuspocus, WebSocket), configure at least one remote asset provider
   * such as `HttpAssetProvider` or `PresignedAssetProvider`.
   */
  @Prop() assetStorageConfig?: KritzelAssetStorageConfig;
  @Watch('assetStorageConfig')
  async onAssetStorageConfigChange(newValue: KritzelAssetStorageConfig | undefined) {
    this._assetStorageConfigRevision++;

    // Keep core config in sync immediately so late prop updates are not lost.
    this.core.setAssetStorageConfig(newValue);

    // If assetStorageConfig arrives after componentDidLoad, initialize the
    // asset storage layer now. Mirrors the syncConfig watcher: the resolver
    // is only initialized once, when a non-undefined config first becomes
    // available. Subsequent changes after initialization require
    // `reinitSync()`, identical to syncConfig semantics.
    if (newValue && !this._isAssetStorageInitialized && this._isViewportReady) {
      await this.initializeAssetStorage();
    }
  }

  /** The current user for awareness broadcasting (name, id, cursor position). */
  @Prop() user?: IKritzelUser;
  @Watch('user')
  onUserChange(newValue: IKritzelUser | undefined) {
    this.core.setUser(newValue);
  }

  /** Tool definitions to register with this engine instance. */
  @Prop() tools: KritzelToolDefinition[] = [];
  @Watch('tools')
  onToolsChange() {
    this._toolsRevision++;
    void this.registerConfiguredTools();
  }

  /** Context menu items shown when right-clicking the canvas background. */
  @Prop() globalContextMenuItems?: ContextMenuItem[];
  @Watch('globalContextMenuItems')
  onGlobalContextMenuItemsChange(newValue: ContextMenuItem[] | undefined) {
    if (this.contextMenuHandler) {
      this.contextMenuHandler.globalContextMenuItems = newValue ?? [];
    }
  }

  /** Context menu items shown when right-clicking a selected object. */
  @Prop() objectContextMenuItems?: ContextMenuItem[];
  @Watch('objectContextMenuItems')
  onObjectContextMenuItemsChange(newValue: ContextMenuItem[] | undefined) {
    if (this.contextMenuHandler) {
      this.contextMenuHandler.objectContextMenuItems = newValue ?? [];
    }
  }
  /** Maximum zoom scale allowed. Clamped to the absolute maximum defined by the engine. */
  @Prop({ mutable: true }) scaleMax: number = ABSOLUTE_SCALE_MAX;
  @Watch('scaleMax')
  validateScaleMax(newValue: number) {
    if (newValue > ABSOLUTE_SCALE_MAX) {
      console.warn(`scaleMax cannot be greater than ${ABSOLUTE_SCALE_MAX}.`);
      this.scaleMax = ABSOLUTE_SCALE_MAX;
      this.core.store.state.scaleMax = this.scaleMax;
    } else {
      this.core.store.state.scaleMax = newValue;
    }
  }
  /** Minimum zoom scale allowed. Clamped to the absolute minimum defined by the engine. */
  @Prop({ mutable: true }) scaleMin: number = ABSOLUTE_SCALE_MIN;
  @Watch('scaleMin')
  validateScaleMin(newValue: number) {
    if (newValue < ABSOLUTE_SCALE_MIN) {
      console.warn(`scaleMin cannot be less than ${ABSOLUTE_SCALE_MIN}.`);
      this.scaleMin = ABSOLUTE_SCALE_MIN;
      this.core.store.state.scaleMin = this.scaleMin;
    } else {
      this.core.store.state.scaleMin = newValue;
    }
  }
  /** The HTML element to apply cursor styles to. Defaults to `document.body` if not set. */
  @Prop() cursorTarget?: HTMLElement;
  @Watch('cursorTarget')
  onCursorTargetChange(newValue: HTMLElement | undefined) {
    this.core.cursorManager.setTargetElement(newValue || document.body);
  }

  /** When true, objects are drawn at a fixed visual size regardless of zoom level */
  @Prop() lockDrawingScale: boolean = true;
  @Watch('lockDrawingScale')
  onLockDrawingScaleChange(newValue: boolean) {
    this.core.store.state.lockDrawingScale = newValue;
  }

  /** The current theme to apply to the editor */
  @Prop() theme: ThemeName = 'light';
  @Watch('theme')
  onThemeChange(newValue: ThemeName) {
    this.core.themeManager.setTheme(newValue);
  }

  /** License key that, when valid, removes the "Powered by Kritzel" watermark. */
  @Prop() licenseKey?: string;
  @Watch('licenseKey')
  onLicenseKeyChange(newValue?: string) {
    this.core.licenseManager.validate(newValue);
  }

  /** An array of available themes for the editor. */
  @Prop() themes?: KritzelTheme[];
  @Watch('themes')
  onThemesChange(newValue?: KritzelTheme[]) {
    if (newValue && newValue.length > 0) {
      this.core.themeManager.registerThemes(newValue);
      this.core.themeManager.applyTheme(this.core.themeManager.currentTheme);
    }
  }

  /** The current locale (language) code to apply to the editor, e.g. 'en', 'de', 'fr'. */
  @Prop() locale: LocaleCode = 'en';
  @Watch('locale')
  onLocaleChange(newValue: LocaleCode) {
    this.core.localizationManager.setLocale(newValue);
  }

  /** An array of available locale definitions (with optional partial term overrides). Replaces the built-in locale set (en/de/fr) when provided, even if empty. */
  @Prop() locales?: KritzelLocale[];
  @Watch('locales')
  onLocalesChange(newValue?: KritzelLocale[]) {
    this.core.localizationManager.configureLocales(newValue);
    this.core.localizationManager.setLocale(this.core.localizationManager.resolveActiveLocale(this.locale));
  }

  /** The locale used to resolve terms missing from the active locale. */
  @Prop() fallbackLocale: LocaleCode = 'en';
  @Watch('fallbackLocale')
  onFallbackLocaleChange(newValue: LocaleCode) {
    this.core.localizationManager.setFallbackLocale(newValue);
    this.core.rerender();
  }

  /** Left boundary of the viewport in world coordinates. Objects beyond this X position cannot be panned to. */
  @Prop() viewportBoundaryLeft: number = -Infinity;
  @Watch('viewportBoundaryLeft')
  onViewportBoundaryLeftChange(newValue: number) {
    this.core.store.state.viewportBoundaryLeft = newValue ?? -Infinity;
  }

  /** Right boundary of the viewport in world coordinates. Objects beyond this X position cannot be panned to. */
  @Prop() viewportBoundaryRight: number = Infinity;
  @Watch('viewportBoundaryRight')
  onViewportBoundaryRightChange(newValue: number) {
    this.core.store.state.viewportBoundaryRight = newValue ?? Infinity;
  }

  /** Top boundary of the viewport in world coordinates. Objects beyond this Y position cannot be panned to. */
  @Prop() viewportBoundaryTop: number = -Infinity;
  @Watch('viewportBoundaryTop')
  onViewportBoundaryTopChange(newValue: number) {
    this.core.store.state.viewportBoundaryTop = newValue ?? -Infinity;
  }

  /** Bottom boundary of the viewport in world coordinates. Objects beyond this Y position cannot be panned to. */
  @Prop() viewportBoundaryBottom: number = Infinity;
  @Watch('viewportBoundaryBottom')
  onViewportBoundaryBottomChange(newValue: number) {
    this.core.store.state.viewportBoundaryBottom = newValue ?? Infinity;
  }

  /** Debug info display options controlling which debug overlays are visible */
  @Prop() debugInfo?: KritzelDebugInfo;
  @Watch('debugInfo')
  onDebugInfoChange(newValue: KritzelDebugInfo) {
    if (newValue) {
      this.core.store.state.debugInfo = newValue;
      this.core.assetResolver.setShowInfo(newValue.showAssetResolverInfo);
    }
  }

  /** When false, non-modified wheel events do not pan the viewport. */
  @Prop() isPanningEnabled: boolean = true;

  /** When false, Ctrl+wheel events do not zoom the viewport. */
  @Prop() isZoomingEnabled: boolean = true;

  /** Emitted when the engine has fully initialized and is ready for interaction. */
  @Event() isEngineReady!: EventEmitter<KritzelEngineState>;

  /** Emitted when the active drawing tool changes. */
  @Event() activeToolChange!: EventEmitter<KritzelBaseTool>;

  /** Emitted when workspaces are created, updated, or deleted. */
  @Event() workspacesChange!: EventEmitter<KritzelWorkspace[]>;

  /** Emitted when the active workspace changes (e.g., after import). */
  @Event() activeWorkspaceChange!: EventEmitter<KritzelWorkspace>;

  /** Emitted on long-press (touch/pen). Useful for showing custom context menus on mobile. */
  @Event() longpress!: EventEmitter<PointerEvent>;

  /** Emitted when objects on the canvas are added, removed, or modified. */
  @Event() objectsChange!: EventEmitter<KritzelBaseObject[]>;

  /** Emitted when one or more objects are added to the canvas. */
  @Event() objectsAdded!: EventEmitter<ObjectsAddedEvent>;

  /** Emitted when one or more objects are removed from the canvas. */
  @Event() objectsRemoved!: EventEmitter<ObjectsRemovedEvent>;

  /** Emitted when one or more objects are updated on the canvas. */
  @Event() objectsUpdated!: EventEmitter<ObjectsUpdatedEvent>;

  /** Emitted when the set of selected objects changes. */
  @Event() objectsSelectionChange!: EventEmitter<KritzelBaseObject[]>;

  /** Emitted when the undo/redo state changes, providing current undo availability. */
  @Event() undoStateChange!: EventEmitter<KritzelUndoState>;

  /** Emitted when the set of objects visible in the current viewport changes (e.g., after pan or zoom). */
  @Event() objectsInViewportChange!: EventEmitter<ObjectsInViewportChangeEvent>;

  /** Emitted when the viewport position, scale, or dimensions change (e.g., after pan, zoom, or resize). */
  @Event() viewportChange!: EventEmitter<KritzelViewportState>;

  /** Emitted when the awareness state changes (remote user cursors, presence). */
  @Event() awarenessChange!: EventEmitter<Map<number, Record<string, any>>>;

  /** Emitted when notifications change. */
  @Event() notificationsChange!: EventEmitter<KritzelNotification>;

  /** Emitted when context-menu visibility, items, or position changes. */
  @Event() contextMenuStateChange!: EventEmitter<KritzelContextMenuState>;

  /** Emitted while the selected workspace's objects are being initialized and synchronized. */
  @Event() isLoadingChange!: EventEmitter<boolean>;

  @State() forceUpdate: number = 0;

  /** Manually triggers the `objectsSelectionChange` event. */
  @Method()
  async triggerSelectionChange() {
    const selectedObjects = this.core.store.selectedObjects as KritzelBaseObject[];
    this._lastHadSelectionGroup = this.core.store.selectionGroup !== null;
    this.objectsSelectionChange.emit(selectedObjects);
  }

  /** Starts a scene bootstrap phase by hiding the scene immediately. */
  @Method()
  async beginSceneBootstrap(): Promise<void> {
    if (this._sceneBootstrapTransitionTimer !== null) {
      clearTimeout(this._sceneBootstrapTransitionTimer);
      this._sceneBootstrapTransitionTimer = null;
    }

    this._sceneBootstrapTransitionEnabled = false;
    this._sceneBootstrapOpacity = 0;
    this.core.rerender();
  }

  /** Ends a scene bootstrap phase by fading the scene back in. */
  @Method()
  async endSceneBootstrap(): Promise<void> {
    if (this._sceneBootstrapTransitionTimer !== null) {
      clearTimeout(this._sceneBootstrapTransitionTimer);
      this._sceneBootstrapTransitionTimer = null;
    }

    this._sceneBootstrapTransitionEnabled = true;
    this._sceneBootstrapOpacity = 1;
    this.core.rerender();

    this._sceneBootstrapTransitionTimer = setTimeout(() => {
      this._sceneBootstrapTransitionEnabled = false;
      this._sceneBootstrapTransitionTimer = null;
      this.core.rerender();
    }, 220);
  }

  @Listen('wheel', { passive: true })
  handleWheel(ev: WheelEvent) {
    if (this.core.store.isDisabled) {
      return;
    }

    if (this.core.store.state.isContextMenuVisible) {
      this.hideContextMenu();
    }

    const hoveredObject = this.core.getObjectFromPointerEvent(ev as unknown as PointerEvent);

    if (
      hoveredObject &&
      ObjectHelper.isClass<KritzelDynamicObject>(hoveredObject, 'KritzelDynamicObject') &&
      KritzelWheelHelper.shouldKeepWheelInDynamicObject(ev, hoveredObject)
    ) {
      return;
    }

    if (ev.ctrlKey) {
      if (this.isZoomingEnabled) {
        this.viewport.handleWheel(ev);
      }
    } else {
      if (this.isPanningEnabled) {
        this.viewport.handleWheel(ev);
      }
    }

    this.core.store.state?.activeTool?.handleWheel(ev);
  }

  @Listen('pointerdown', { passive: false })
  handlePointerDown(ev: PointerEvent) {
    if (this.core.store.isDisabled) {
      return;
    }

    // Interactive dynamic-object content should receive native pointer events
    // whenever the object is marked interactive.
    if (this.isEmbeddedDynamicObjectInteraction(ev)) {
      return;
    }

    if (KritzelDevicesHelper.isTouchDevice()) {
      KritzelEventHelper.onLongPress(ev, (event: PointerEvent) => this.longpress.emit(event));
    }

    this.host.setPointerCapture(ev.pointerId);
    this.core.store.state.pointers.set(ev.pointerId, ev);

    this.viewport.handlePointerDown(ev);
    this.core.store.state?.activeTool?.handlePointerDown(ev);
  }

  private throttledPointerMoveMulti = throttle((ev: PointerEvent) => {
    this.viewport.handlePointerMove(ev);
    this.core.store.state?.activeTool?.handlePointerMove(ev);
  }, 16);

  @Listen('pointermove', { passive: false })
  handlePointerMove(ev: PointerEvent) {
    if (this.core.store.isDisabled) {
      return;
    }

    // Ignore drag/move sequences when their pointerdown was intentionally bypassed.
    if (ev.buttons > 0 && !this.core.store.state.pointers.has(ev.pointerId)) {
      return;
    }

    if (this.core.store.state.pointers.has(ev.pointerId)) {
      this.core.store.state.pointers.set(ev.pointerId, ev);
    }

    if (this.core.store.state.pointers.size > 1) {
      this.throttledPointerMoveMulti(ev);
    }

    // Update cursor for handle hover states using elementsFromPoint
    this.core.cursorManager.updateHoverState(ev);

    this.viewport.handlePointerMove(ev);
    this.core.store.state?.activeTool?.handlePointerMove(ev);
  }

  @Listen('pointerup', { passive: false })
  handlePointerUp(ev: PointerEvent) {
    if (this.core.store.isDisabled) {
      return;
    }

    const wasTracked = this.core.store.state.pointers.has(ev.pointerId);

    this.core.store.state.pointers.delete(ev.pointerId);
    if (this.host.hasPointerCapture(ev.pointerId)) {
      this.host.releasePointerCapture(ev.pointerId);
    }

    // Reset cursor to default when all pointers are released
    if (this.core.store.state.pointers.size === 0) {
      this.core.cursorManager.resetToDefault();
    }

    // If the corresponding pointerdown was never processed (e.g. consumed by a capture-phase
    // listener like a tooltip close handler), skip tool logic to avoid spurious interactions
    // such as a selected text object entering edit mode when clicking to dismiss a popup.
    if (!wasTracked) {
      return;
    }

    this.viewport.handlePointerUp(ev);
    this.core.store.state?.activeTool?.handlePointerUp(ev);
  }

  @Listen('pointercancel', { passive: false })
  handlePointerCancel(ev: PointerEvent) {
    if (this.core.store.isDisabled) {
      return;
    }

    if (this.host.hasPointerCapture(ev.pointerId)) {
      this.host.releasePointerCapture(ev.pointerId);
    }
    this.core.store.state.pointers.delete(ev.pointerId);

    // Reset cursor to default when all pointers are released
    if (this.core.store.state.pointers.size === 0) {
      this.core.cursorManager.resetToDefault();
    }

    this.viewport.handlePointerUp(ev);
    this.core.store.state?.activeTool?.handlePointerUp(ev);
  }

  private isEmbeddedDynamicObjectInteraction(event: PointerEvent): boolean {
    const path = event.composedPath() as EventTarget[];
    const objectElement = path.find((entry): entry is HTMLElement => {
      return entry instanceof HTMLElement && entry.classList.contains('object');
    });

    if (!objectElement?.id) {
      return false;
    }

    const object = this.core.store.objects.findById(objectElement.id);
    if (!object || !KritzelClassHelper.isInstanceOf<KritzelDynamicObject>(object, 'KritzelDynamicObject')) {
      return false;
    }

    const isSelected = !!this.core.store.selectionGroup?.objects?.some(selectedObject => selectedObject.id === object.id);
    if (!isSelected) {
      return false;
    }

    if (object.isInteractive !== true) {
      return false;
    }

    const potentialRoots: HTMLElement[] = [];
    if (object.element instanceof HTMLElement) {
      potentialRoots.push(object.element);
    }
    if (object.elementRef instanceof HTMLElement) {
      potentialRoots.push(object.elementRef);
    }

    if (potentialRoots.length === 0) {
      return false;
    }

    // Only bypass canvas tool handling when the pointer event came from an
    // actually interactive descendant inside the dynamic object subtree.
    return potentialRoots.some(root => this.isNativeInteractiveEmbeddedTarget(path, root));
  }

  private isNativeInteractiveEmbeddedTarget(path: EventTarget[], dynamicObjectRoot: HTMLElement): boolean {
    const interactiveSelector = 'input, button, textarea, select, a[href], [contenteditable="true"], [contenteditable=""]';
    const rootIndex = path.findIndex(entry => entry === dynamicObjectRoot);

    if (rootIndex === -1) {
      return false;
    }

    for (const entry of path.slice(0, rootIndex)) {
      if (!(entry instanceof HTMLElement)) {
        continue;
      }

      const interactiveEntry = entry as HTMLElement;

      if (interactiveEntry.matches(interactiveSelector)) {
        return true;
      }
    }

    return false;
  }

  @Listen('pointerleave')
  handlePointerLeave() {
    this.core.store.objects?.clearCursorPosition();
  }

  @Listen('longpress', { passive: true })
  handleLongPress(ev: CustomEvent<PointerEvent>) {
    this.contextMenuHandler.handleContextMenu(ev.detail);
    this.emitContextMenuStateChange();
  }

  @Listen('contextmenu', { capture: false, passive: false })
  handleContextMenu(ev: PointerEvent) {
    if (ev.cancelable) {
      ev.preventDefault();
    }

    if (this.core.store.isDisabled) {
      return;
    }

    if (ev.pointerType === 'touch' || ev.pointerType === 'pen') {
      return;
    }

    this.contextMenuHandler.handleContextMenu(ev);
    this.emitContextMenuStateChange();
  }

  @Listen('resize', { target: 'window' })
  handleResize() {
    this.viewport.handleResize();
  }

  @Listen('keydown', { target: 'window' })
  handleKeyDown(ev: KeyboardEvent) {
    if (this.core.store.isDisabled || !this.shouldHandleGlobalShortcutEvent(ev)) {
      return;
    }

    this.keyHandler.handleKeyDown(ev);
  }

  @Listen('keyup', { target: 'window' })
  handleKeyUp(ev: KeyboardEvent) {
    if (this.core.store.isDisabled || !this.shouldHandleGlobalShortcutEvent(ev)) {
      return;
    }

    this.keyHandler.handleKeyUp(ev);
  }

  @Listen('copy', { target: 'window', passive: false })
  handleCopy(ev: ClipboardEvent) {
    if (this.core.store.isDisabled || !this.shouldHandleGlobalShortcutEvent(ev)) {
      return;
    }

    if (!this.core.store.selectionGroup || this.core.store.activeText || this.core.store.activeShape) {
      return;
    }

    if (ev.cancelable) {
      ev.preventDefault();
    }

    this.core.clipboardManager.copy(ev);
    this.core.rerender();
  }

  @Listen('cut', { target: 'window', passive: false })
  handleCut(ev: ClipboardEvent) {
    if (this.core.store.isDisabled || !this.shouldHandleGlobalShortcutEvent(ev)) {
      return;
    }

    if (!this.core.store.selectionGroup || this.core.store.activeText || this.core.store.activeShape) {
      return;
    }

    if (ev.cancelable) {
      ev.preventDefault();
    }

    this.core.clipboardManager.cut(ev);
  }

  @Listen('paste', { target: 'window', passive: false })
  handlePaste(ev: ClipboardEvent) {
    if (this.core.store.isDisabled || !this.shouldHandleGlobalShortcutEvent(ev)) {
      return;
    }

    if (this.core.store.activeText || this.core.store.activeShape) {
      return;
    }

    if (ev.cancelable) {
      ev.preventDefault();
    }

    void this.core.clipboardManager.paste(undefined, undefined, ev);
  }

  /**
   * Determines if the engine should handle a keyboard/clipboard shortcut event.
   * Returns true only if:
   * - The event originates from within the engine component, OR
   * - The event target is not an interactive element that needs keyboard input
   *
   * This prevents conflicts with inputs, textareas, dialogs, or other
   * interactive elements that need their own keyboard handling.
   */
  private shouldHandleGlobalShortcutEvent(ev: KeyboardEvent | ClipboardEvent): boolean {
    const path = ev.composedPath();

    // Check if event path includes our host - works reliably with Shadow DOM
    if (path.includes(this.host)) {
      return true;
    }

    // Check if event path includes a dialog (works across Shadow DOM boundaries)
    const isInsideDialog = path.some((el: EventTarget) => {
      if (!(el instanceof HTMLElement)) return false;
      return el.tagName === 'DIALOG' || el.tagName === 'KRITZEL-DIALOG' || el.getAttribute?.('role') === 'dialog' || el.getAttribute?.('role') === 'alertdialog';
    });

    if (isInsideDialog) {
      return false;
    }

    const target = path[0] as HTMLElement;

    // Don't handle if target is an interactive element that needs keyboard input
    if (target instanceof HTMLElement && target.matches?.('input, textarea, select, [contenteditable="true"], [contenteditable=""]')) {
      return false;
    }

    // Handle global shortcuts when no interactive element has focus
    return true;
  }

  @Listen('dblclick', { target: 'document', passive: false })
  preventDoubleTapZoomOnTouchDevices(ev: MouseEvent) {
    if (ev.cancelable) {
      ev.preventDefault();
    }
  }

  /**
   * Registers a new drawing tool with the engine.
   * @param toolName - Unique identifier for the tool (e.g., 'brush', 'eraser').
   * @param toolClass - Constructor class extending `KritzelBaseTool`.
   * @param toolConfig - Optional initial configuration to apply to the tool instance.
   * @returns The registered tool instance, or `null` if registration failed.
   */
  @Method()
  async registerTool(
    toolName: string,
    toolClass: any,
    toolConfig?: KritzelTextToolConfig | KritzelBrushToolConfig | KritzelLineToolConfig | KritzelShapeToolConfig,
  ): Promise<KritzelBaseTool | null> {
    if (typeof toolClass !== 'function') {
      console.error(`Failed to register tool "${toolName}": Tool class must be a constructor function`);
      return null;
    }

    // If a tool with this name is already registered, return the existing instance
    // This avoids dual-package issues when tool classes are passed from external bundles
    if (this.core.toolRegistry.hasTool(toolName)) {
      const existingTool = this.core.toolRegistry.getTool(toolName)!;
      if (toolConfig) {
        this.applyToolConfig(existingTool, toolConfig);
      }
      return existingTool;
    }

    const registeredTool = this.core.toolRegistry.registerTool(toolName, this.resolveToolClass(toolClass));

    if (toolConfig) {
      this.applyToolConfig(registeredTool, toolConfig);
    }

    return Promise.resolve(registeredTool);
  }

  private async activateTool(tool: KritzelBaseTool): Promise<void> {
    if (this.core.store.state.activeTool === tool) {
      return;
    }

    this.core.store.state.activeTool?.onDeactivate();
    this.core.store.setState('activeTool', tool);
    this.core.deselectAllObjects();
    tool?.onActivate();
  }

  /**
   * Switches the active drawing tool by its registered name.
   * @param toolName - The name the tool was registered with (e.g., 'brush', 'eraser').
   */
  @Method()
  async setActiveTool(toolName: string): Promise<void> {
    const tool = this.core.toolRegistry.getTool(toolName);
    if (!tool) {
      console.warn(`[KritzelEngine] No tool registered with name: ${toolName}`);
      return;
    }
    await this.activateTool(tool);
  }

  /** Disables all user interaction with the engine (pointer, keyboard, etc.). */
  @Method()
  async disable() {
    this.core.store.state.isEnabled = false;
    this.core.rerender();
  }

  /** Re-enables user interaction after a call to `disable()`. */
  @Method()
  async enable() {
    this.core.store.state.isEnabled = true;
    this.core.rerender();
  }

  /** Deletes the currently selected objects from the canvas. */
  @Method()
  async delete() {
    this.core.delete();
  }

  /** Copies the currently selected objects to the internal clipboard. */
  @Method()
  async copy() {
    this.core.clipboardManager.copy();
  }

  /** Cuts the currently selected objects to the internal clipboard (deletes them from the canvas). */
  @Method()
  async cut() {
    this.core.clipboardManager.cut();
  }

  /**
   * Pastes previously copied objects at the specified world coordinates.
   * @param x - X position in world coordinates.
   * @param y - Y position in world coordinates.
   */
  @Method()
  async paste(x: number, y: number) {
    const hasPermission = await this.core.permissionManager.requestPermission('clipboard-read');

    if (hasPermission !== 'granted') {
      this.notificationsChange.emit({
        type: 'error',
        message: 'Clipboard read permission is required to paste content. Please grant permission and try again.',
        id: ObjectHelper.generateUUID(),
      } as KritzelNotification);

      return;
    }

    this.core.clipboardManager.paste(x, y);
  }

  /**
   * Moves an object one layer forward in the z-order.
   * @param object - The object to move. If omitted, applies to the current selection.
   */
  @Method()
  async bringForward(object?: KritzelBaseObject<any>) {
    this.core.bringForward(object);
  }

  /**
   * Moves an object one layer backward in the z-order.
   * @param object - The object to move. If omitted, applies to the current selection.
   */
  @Method()
  async sendBackward(object?: KritzelBaseObject<any>) {
    this.core.sendBackward(object);
  }

  /**
   * Moves an object to the very front of the z-order.
   * @param object - The object to move. If omitted, applies to the current selection.
   */
  @Method()
  async bringToFront(object?: KritzelBaseObject<any>) {
    this.core.bringToFront(object);
  }

  /**
   * Moves an object to the very back of the z-order.
   * @param object - The object to move. If omitted, applies to the current selection.
   */
  @Method()
  async sendToBack(object?: KritzelBaseObject<any>) {
    this.core.sendToBack(object);
  }

  /**
   * Aligns the currently selected objects according to the specified alignment.
   * @param alignment - The alignment direction (e.g., `CenterHorizontal`, `StartVertical`).
   */
  @Method()
  async alignObjects(alignment: KritzelAlignment) {
    this.core.alignObjects(alignment);
  }

  /** Groups the currently selected objects into a single selection group. */
  @Method()
  async group() {
    this.core.group();
  }

  /** Ungroups the currently selected group back into individual objects. */
  @Method()
  async ungroup() {
    this.core.ungroup();
  }

  /** Undoes the last action. */
  @Method()
  async undo() {
    this.core.undo();
  }

  /** Redoes the last undone action. */
  @Method()
  async redo() {
    this.core.redo();
  }

  /** Hides the context menu and resets any associated selection state. */
  @Method()
  async hideContextMenu() {
    this.core.store.state.pointers.clear();
    this.core.store.state.isContextMenuVisible = false;
    this.core.store.objects?.remove(o => o instanceof KritzelSelectionBox);
    this.core.store.setSelectionBox(null);
    this.core.store.objects?.clearLocalSelectionBox();
    this.core.store.state.isSelecting = false;
    this.core.store.state.isEnabled = true;
    this.emitContextMenuStateChange();
    this.core.rerender();
  }

  /**
   * Programmatically opens the context menu at a specified world-coordinate position.
   * If `objectId` is provided and found, the object context menu is shown for that object.
   * If no `objectId` is provided but a selection group already exists, the object context menu is shown.
   * Otherwise, the global context menu is shown.
   * @param options.x - The X position in world (canvas) coordinates.
   * @param options.y - The Y position in world (canvas) coordinates.
   * @param options.objectId - Optional ID of an object to select and show the object context menu for.
   */
  @Method()
  async openContextMenu(options: { x: number; y: number; objectId?: string }) {
    this.contextMenuHandler.open(options);
    this.emitContextMenuStateChange();
  }

  /**
   * Retrieves a canvas object by its unique ID.
   * @param id - The object's unique identifier.
   * @returns The matching object, or `null` if not found.
   */
  @Method()
  async getObjectById<T extends KritzelBaseObject>(id: string): Promise<T | null> {
    const object = this.core.store.allObjects.find(obj => obj.id === id) as T | undefined;
    return object || null;
  }

  /** Returns all objects on the canvas across all layers. */
  @Method()
  async getAllObjects<T extends KritzelBaseObject>(): Promise<T[]> {
    return this.core.store.allObjects as T[];
  }

  /**
   * Returns all objects that match the given predicate function.
   * Excludes internal selection-related objects (selection groups and selection boxes).
   * @param predicate - A filter function called for each object. Return `true` to include.
   * @returns An array of matching objects.
   *
   * @example
   * ```ts
   * // Find all text objects
   * const texts = await engine.findObjects(obj => obj.__class__ === 'KritzelText');
   *
   * // Find objects at a point
   * const hits = await engine.findObjects(obj => obj.hitTest(100, 200));
   *
   * // Combine criteria
   * const filtered = await engine.findObjects(obj => obj.__class__ === 'KritzelPath' && obj.opacity < 0.5);
   * ```
   */
  @Method()
  async findObjects<T extends KritzelBaseObject>(predicate: (obj: KritzelBaseObject<Element>) => boolean): Promise<T[]> {
    return this.core.store.allNonSelectionObjects.filter(predicate) as T[];
  }

  /** Returns the total number of objects on the canvas. */
  @Method()
  async getObjectsTotalCount(): Promise<number> {
    return this.core.store.totalObjectCount;
  }

  /**
   * Adds a new object to the canvas. The object will be assigned an ID, core reference, and z-index automatically.
   * @param object - The object instance to add.
   * @returns The added object.
   */
  @Method()
  async addObject<T extends KritzelBaseObject>(object: T): Promise<T | null> {
    this.core.deselectAllObjects();

    object.id = object.generateId();
    object._core = this.core;
    object.scale = object.scale ?? this.core.store.state.scale;
    object.zIndex = this.core.store.currentZIndex;
    object.workspaceId = this.core.store.state.activeWorkspace!.id;

    if (KritzelClassHelper.isInstanceOf<KritzelImage>(object, 'KritzelImage')) {
      await object.prepareForInsert();
    }

    // Handle KritzelText: recreate the editor now that _core is available
    // The editor's dispatchTransaction callback needs _core for persisting changes
    if (KritzelClassHelper.isInstanceOf<KritzelText>(object, 'KritzelText')) {
      const pendingContent = object.content;
      object.editor = object.createEditor();
      if (pendingContent) {
        object.setContent(pendingContent);
      }
    }

    // Handle KritzelGroup: flush pending children (recursively for nested groups) into the store
    if (KritzelClassHelper.isInstanceOf<KritzelGroup>(object, 'KritzelGroup') && object._pendingChildren.length > 0) {
      // Build a map of old ID → new ID across all nesting levels so we can
      // remap anchor references regardless of how deeply nested the line is.
      const idRemapping = new Map<string, string>();
      const allFlushedChildren: KritzelBaseObject<any>[] = [];

      const flushGroup = (group: KritzelGroup): void => {
        if (group._pendingChildren.length === 0) {
          return;
        }

        const pending = group._pendingChildren;
        group._pendingChildren = [];
        group.childIds = [];

        pending.forEach(child => {
          const oldId = child.id;
          child.id = child.generateId();
          child._core = this.core;
          child.scale = child.scale ?? this.core.store.state.scale;
          child.zIndex = this.core.store.currentZIndex;
          child.workspaceId = this.core.store.state.activeWorkspace!.id;

          idRemapping.set(oldId, child.id);
          group.childIds.push(child.id);
          allFlushedChildren.push(child);

          // Recurse into nested groups before inserting so grandchildren get
          // proper IDs and `childIds` references before the parent is added.
          if (KritzelClassHelper.isInstanceOf<KritzelGroup>(child, 'KritzelGroup')) {
            flushGroup(child);
          }
        });
      };

      flushGroup(object);

      // Remap anchor references in lines across all flushed descendants
      allFlushedChildren.forEach(child => {
        if (KritzelClassHelper.isInstanceOf<KritzelLine>(child, 'KritzelLine')) {
          if (child.startAnchor && idRemapping.has(child.startAnchor.objectId)) {
            child.startAnchor = { objectId: idRemapping.get(child.startAnchor.objectId)! };
          }
          if (child.endAnchor && idRemapping.has(child.endAnchor.objectId)) {
            child.endAnchor = { objectId: idRemapping.get(child.endAnchor.objectId)! };
          }
        }
      });

      // Insert all flushed descendants into the store
      allFlushedChildren.forEach(child => {
        this.core.addObject(child);
      });

      // finalize() recurses into nested groups so all bounding boxes/snapshots align
      object.finalize();

      // Rebuild anchor index so anchored lines are tracked
      this.core.anchorManager.rebuildIndex();
    }

    this.core.addObject(object);
    this.core.rerender();

    // Wait for the object to be fully rendered and mounted before resolving.
    // First rAF: Stencil processes the render and calls ref callbacks (mount).
    // Second rAF: mounted objects (e.g. KritzelText) run adjustSizeOnInput
    // to compute actual dimensions from the DOM.
    await new Promise<void>(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    this.emitObjectsChange();
    this.emitObjectsAdded([object]);

    return object;
  }

  /**
   * Adds multiple objects to the canvas in a single batch operation.
   * All objects are inserted within one Yjs transaction (single undo step),
   * triggering only one rerender cycle. Intended for programmatic streaming
   * scenarios where per-object overhead would cause stutter.
   * @param objects - The object instances to add.
   * @returns The added objects.
   */
  @Method()
  async addObjects<T extends KritzelBaseObject>(objects: T[]): Promise<T[]> {
    if (objects.length === 0) {
      return [];
    }

    for (const object of objects) {
      object._core = this.core;
      if (KritzelClassHelper.isInstanceOf<KritzelImage>(object, 'KritzelImage')) {
        await object.prepareForInsert();
      }
    }

    this.core.store.objects.transaction(() => {
      for (const object of objects) {
        object.id = object.generateId();
        object._core = this.core;
        object.scale = object.scale ?? this.core.store.state.scale;
        object.zIndex = this.core.store.currentZIndex;
        object.workspaceId = this.core.store.state.activeWorkspace!.id;

        if (KritzelClassHelper.isInstanceOf<KritzelText>(object, 'KritzelText')) {
          const pendingContent = object.content;
          object.editor = object.createEditor();
          if (pendingContent) {
            object.setContent(pendingContent);
          }
        }

        if (KritzelClassHelper.isInstanceOf<KritzelGroup>(object, 'KritzelGroup') && object._pendingChildren.length > 0) {
          const idRemapping = new Map<string, string>();
          const allFlushedChildren: KritzelBaseObject<any>[] = [];

          const flushGroup = (group: KritzelGroup): void => {
            if (group._pendingChildren.length === 0) {
              return;
            }

            const pending = group._pendingChildren;
            group._pendingChildren = [];
            group.childIds = [];

            pending.forEach(child => {
              const oldId = child.id;
              child.id = child.generateId();
              child._core = this.core;
              child.scale = child.scale ?? this.core.store.state.scale;
              child.zIndex = this.core.store.currentZIndex;
              child.workspaceId = this.core.store.state.activeWorkspace!.id;

              idRemapping.set(oldId, child.id);
              group.childIds.push(child.id);
              allFlushedChildren.push(child);

              if (KritzelClassHelper.isInstanceOf<KritzelGroup>(child, 'KritzelGroup')) {
                flushGroup(child);
              }
            });
          };

          flushGroup(object);

          allFlushedChildren.forEach(child => {
            if (KritzelClassHelper.isInstanceOf<KritzelLine>(child, 'KritzelLine')) {
              if (child.startAnchor && idRemapping.has(child.startAnchor.objectId)) {
                child.startAnchor = { objectId: idRemapping.get(child.startAnchor.objectId)! };
              }
              if (child.endAnchor && idRemapping.has(child.endAnchor.objectId)) {
                child.endAnchor = { objectId: idRemapping.get(child.endAnchor.objectId)! };
              }
            }
          });

          allFlushedChildren.forEach(child => {
            this.core.addObject(child);
          });

          object.finalize();
          this.core.anchorManager.rebuildIndex();
        }

        this.core.addObject(object);
      }
    });

    this.core.rerender();

    await new Promise<void>(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    this.emitObjectsChange();
    this.emitObjectsAdded(objects);

    return objects;
  }

  /**
   * Updates properties of an existing canvas object.
   * @param object - The object to update.
   * @param updatedProperties - A partial set of properties to apply.
   * @returns The updated object.
   */
  @Method()
  async updateObject<T extends KritzelBaseObject>(object: T, updatedProperties: Partial<T>): Promise<T | null> {
    this.core.deselectAllObjects();

    this.core.updateObject(object, updatedProperties);
    this.core.rerender();
    this.emitObjectsChange();
    this.emitObjectsUpdated([{ object, changedProperties: Object.keys(updatedProperties) }]);

    return object;
  }

  /**
   * Removes an object from the canvas.
   * @param object - The object to remove.
   * @returns The removed object.
   */
  @Method()
  async removeObject<T extends KritzelBaseObject>(object: T): Promise<T | null> {
    const objectsMap = this.core.store.objects;
    if (!objectsMap) {
      return null;
    }

    this.core.deselectAllObjects();

    objectsMap.remove(o => o.id === object.id);
    this.core.rerender();
    this.emitObjectsChange();
    this.emitObjectsRemoved([object]);

    return object;
  }

  /**
   * Removes multiple objects from the canvas in a single batch operation.
   * All removals happen within one Yjs transaction (single undo step),
   * triggering only one rerender cycle. Intended for programmatic streaming
   * scenarios where per-object overhead would cause stutter.
   * @param objects - The objects to remove.
   * @returns The removed objects.
   */
  @Method()
  async removeObjects<T extends KritzelBaseObject>(objects: T[]): Promise<T[]> {
    const objectsMap = this.core.store.objects;
    if (!objectsMap || objects.length === 0) {
      return [];
    }

    objectsMap.transaction(() => {
      for (const object of objects) {
        this.core.removeObject(object);
      }
    });

    this.core.rerender();
    this.emitObjectsChange();
    this.emitObjectsRemoved(objects);

    return objects;
  }

  /** Returns the currently selected objects. Returns an empty array if nothing is selected. */
  @Method()
  async getSelectedObjects(): Promise<KritzelBaseObject<any>[]> {
    const selectionGroup = this.core.store.selectionGroup;
    return selectionGroup ? selectionGroup.objects : [];
  }

  /** Returns all registered keyboard shortcuts (without action/condition) for display in a help UI. */
  @Method()
  async getDisplayableShortcuts(): Promise<Omit<KritzelShortcut, 'action' | 'condition'>[]> {
    return this.keyHandler.getDisplayableShortcuts();
  }

  /**
   * Programmatically selects the given objects. Switches to the selection tool automatically.
   * @param objects - The objects to select.
   */
  @Method()
  async selectObjects(objects: KritzelBaseObject[]) {
    const selectionTool = this.core.toolRegistry.getTool('selection');
    if (!selectionTool) {
      return;
    }

    this.core.store.state.activeTool?.onDeactivate();
    this.core.store.setState('activeTool', selectionTool);
    this.core.deselectAllObjects();
    this.core.selectObjects(objects);
  }

  /** Selects all objects currently visible in the viewport. Switches to the selection tool automatically. */
  @Method()
  async selectAllObjectsInViewport() {
    const selectionTool = this.core.toolRegistry.getTool('selection');
    if (!selectionTool) {
      return;
    }

    this.core.store.state.activeTool?.onDeactivate();
    this.core.store.setState('activeTool', selectionTool);
    this.core.deselectAllObjects();
    this.core.selectAllObjectsInViewport();
  }

  /** Deselects all currently selected objects. */
  @Method()
  async clearSelection() {
    this.core.clearSelection();
  }

  /**
   * Pans and zooms the viewport to center on the given object.
   * @param object - The object to center in the viewport.
   * @returns The centered object.
   */
  @Method()
  async centerObjectInViewport(object: KritzelBaseObject) {
    object.centerInViewport();

    this.core.updateObject(object, object);
    this.core.rerender();

    return object;
  }

  /**
   * Pans the viewport to center on the given object without changing the zoom level.
   * Unlike `centerObjectInViewport`, this moves the camera — not the object.
   * @param object - The object whose center the viewport should pan to.
   */
  @Method()
  async panToObject(object: KritzelBaseObject): Promise<void> {
    this.viewport.panTo(object.centerX, object.centerY);
  }

  /**
   * Pans and zooms the viewport to fit the nearest content, with padding.
   * Useful when the user has panned away from all objects.
   * @returns `true` if content was found and the viewport was adjusted, `false` otherwise.
   */
  @Method()
  async backToContent(): Promise<boolean> {
    return this.viewport.centerFitNearestContent(20);
  }

  /**
   * Pans and zooms the viewport to fit ALL objects on the canvas, including those not currently rendered.
   * Calculates the combined bounding box of all objects and centers the viewport to show them.
   * @param animate - Whether to animate the viewport transition (default: true).
   * @returns `true` if objects were found and the viewport was adjusted, `false` otherwise.
   */
  @Method()
  async centerAllObjects(animate = true): Promise<boolean> {
    return this.viewport.centerFitAllObjects(animate);
  }

  /**
   * Pans and zooms the viewport to fit the provided objects.
   * Calculates the combined bounding box of the given objects and centers the viewport to show them.
   * @param objects - The objects to center and fit in the viewport.
   * @param animate - Whether to animate the viewport transition (default: true).
   * @returns `true` if objects were provided and the viewport was adjusted, `false` otherwise.
   */
  @Method()
  async centerObjects(objects: KritzelBaseObject[], animate = true): Promise<boolean> {
    return this.viewport.centerFitObjects(objects, animate);
  }

  /**
   * Sets the viewport to center on the given world coordinates at the specified scale.
   * @param x - X position in world coordinates to center on.
   * @param y - Y position in world coordinates to center on.
   * @param scale - Target scale level.
   */
  @Method()
  async setViewport(x: number, y: number, scale: number): Promise<void> {
    this.viewport.setViewport(x, y, scale);
  }

  /**
   * Pans the viewport to center on the given world coordinates without changing the scale.
   * @param x - X position in world coordinates to center on.
   * @param y - Y position in world coordinates to center on.
   */
  @Method()
  async panTo(x: number, y: number): Promise<void> {
    this.viewport.panTo(x, y);
  }

  /**
   * Zooms the viewport to the given scale level.
   * Optionally centers on a world point; if omitted, zooms around the viewport center.
   * @param scale - Target scale level.
   * @param worldX - Optional X position in world coordinates to center on.
   * @param worldY - Optional Y position in world coordinates to center on.
   */
  @Method()
  async zoomTo(scale: number, worldX?: number, worldY?: number): Promise<void> {
    this.viewport.zoomTo(scale, worldX, worldY);
  }

  /**
   * Zooms in by a fixed step, centered on the current viewport center, with a smooth animation.
   * @param factor - Multiplicative zoom-in step.
   * @param duration - Animation duration in milliseconds.
   */
  @Method()
  async zoomIn(factor: number, duration: number): Promise<void> {
    this.viewport.zoomIn(factor, duration);
  }

  /**
   * Zooms out by a fixed step, centered on the current viewport center, with a smooth animation.
   * @param factor - Multiplicative zoom-out step.
   * @param duration - Animation duration in milliseconds.
   */
  @Method()
  async zoomOut(factor: number, duration: number): Promise<void> {
    this.viewport.zoomOut(factor, duration);
  }

  /**
   * Returns the current viewport state including position, scale, and dimensions.
   * @returns The current viewport state.
   */
  @Method()
  async getViewport(): Promise<KritzelViewportState> {
    return this.viewport.getViewport();
  }

  /**
   * Converts screen-relative pixel coordinates to world coordinates.
   * @param x - X position in screen pixels (relative to the engine element).
   * @param y - Y position in screen pixels (relative to the engine element).
   * @returns World coordinates { x, y }.
   */
  @Method()
  async screenToWorld(x: number, y: number): Promise<{ x: number; y: number }> {
    return this.viewport.screenToWorld(x, y);
  }

  /**
   * Converts world coordinates to screen-relative pixel coordinates.
   * @param x - X position in world coordinates.
   * @param y - Y position in world coordinates.
   * @returns Screen coordinates { x, y } relative to the engine element.
   */
  @Method()
  async worldToScreen(x: number, y: number): Promise<{ x: number; y: number }> {
    return this.viewport.worldToScreen(x, y);
  }

  /** Returns all objects currently visible within the viewport bounds. */
  @Method()
  async getObjectsInViewport(): Promise<KritzelBaseObject[]> {
    return this.core.getObjectsInViewport();
  }

  /**
   * Captures a screenshot of the current viewport as a data URL.
   * @param format - The image format: `'png'` (default) or `'svg'`.
   * @returns A data URL string of the captured image.
   */
  @Method()
  async getScreenshot(format: 'png' | 'svg' = 'png'): Promise<string | null> {
    if (!this.host) return null;

    // Save critical state before screenshot to restore after
    const savedState = {
      objects: this.core.store.objects,
      activeWorkspace: this.core.store.state.activeWorkspace,
      workspaces: this.core.store.state.workspaces,
      activeTool: this.core.store.state.activeTool,
      isReady: this.core.store.state.isReady,
      translateX: this.core.store.state.translateX,
      translateY: this.core.store.state.translateY,
      scale: this.core.store.state.scale,
    };

    const screenshotOptions: Record<string, unknown> = {
      filter: (node: HTMLElement) => {
        // Exclude the context menu, debug panel, and awareness cursors from the screenshot
        if (node.tagName === 'KRITZEL-CONTEXT-MENU') {
          return false;
        }
        if (node.tagName === 'KRITZEL-AWARENESS-CURSORS') {
          return false;
        }
        if (node.classList && node.classList.contains('debug-panel')) {
          return false;
        }
        return true;
      },
    };

    try {
      if (format === 'svg') {
        return await toSvg(this.host, screenshotOptions);
      }

      return await toPng(this.host, screenshotOptions);
    } finally {
      // Restore state after screenshot in case cloning caused any side effects
      this.core.store.state.objects = savedState.objects;
      this.core.store.state.activeWorkspace = savedState.activeWorkspace;
      this.core.store.state.workspaces = savedState.workspaces;
      this.core.store.state.activeTool = savedState.activeTool;
      this.core.store.state.isReady = savedState.isReady;
      this.core.store.state.translateX = savedState.translateX;
      this.core.store.state.translateY = savedState.translateY;
      this.core.store.state.scale = savedState.scale;
      this.core.rerender();
    }
  }

  /**
   * Exports the current viewport as a PNG file and triggers a browser download.
   */
  @Method()
  async exportViewportAsPng(): Promise<void> {
    try {
      const activeWorkspaceName = this.core.store.state?.activeWorkspace?.name || 'workspace';
      // timestamp format: YYYY-MM-DDTHH-mm-ss-sssZ, clearing colons/dots for safe filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${activeWorkspaceName}-${timestamp}.png`;

      const dataUrl = await this.getScreenshot('png');
      if (!dataUrl) {
        console.error('Failed to export viewport as PNG: screenshot could not be generated');
        return;
      }

      this.triggerDataUrlDownload(dataUrl, filename);
    } catch (error) {
      console.error('Failed to export viewport as PNG:', error);
    }
  }

  /**
   * Exports the current viewport as an SVG file and triggers a browser download.
   */
  @Method()
  async exportViewportAsSvg(): Promise<void> {
    try {
      const activeWorkspaceName = this.core.store.state?.activeWorkspace?.name || 'workspace';
      // timestamp format: YYYY-MM-DDTHH-mm-ss-sssZ, clearing colons/dots for safe filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${activeWorkspaceName}-${timestamp}.svg`;

      const dataUrl = await this.getScreenshot('svg');
      if (!dataUrl) {
        console.error('Failed to export viewport as SVG: screenshot could not be generated');
        return;
      }

      this.triggerDataUrlDownload(dataUrl, filename);
    } catch (error) {
      console.error('Failed to export viewport as SVG:', error);
    }
  }

  /**
   * Returns export formats supported by the currently selected object.
   * Only returns formats when exactly one object is selected.
   */
  @Method()
  async getSelectedObjectSupportedExportFormats(): Promise<KritzelObjectExportFormat[]> {
    const selected = this.getSingleSelectedExportableObject();
    if (!selected) {
      return [];
    }

    return selected.getSupportedExportFormats();
  }

  /**
   * Checks whether the currently selected object supports a specific export format.
   * Returns false when none or multiple objects are selected.
   */
  @Method()
  async canExportSelectedObjectAs(format: KritzelObjectExportFormat): Promise<boolean> {
    const selected = this.getSingleSelectedExportableObject();
    if (!selected) {
      return false;
    }

    return selected.getSupportedExportFormats().includes(format);
  }

  /**
   * Exports the currently selected object in the requested format and triggers a file download.
   * Only supports single selection.
   */
  @Method()
  async exportSelectedObject(format: KritzelObjectExportFormat): Promise<void> {
    const selected = this.getSingleSelectedExportableObject();
    if (!selected) {
      return;
    }

    try {
      const dataUrl = await selected.exportAs(format, this.getObjectExportContext());
      if (!dataUrl) {
        console.error(`Failed to export selected object as ${format}: export returned no data URL`);
        return;
      }

      const activeWorkspaceName = this.core.store.state?.activeWorkspace?.name || 'workspace';
      const objectName = selected.__class__.replace(/^Kritzel/, '').toLowerCase() || 'object';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${activeWorkspaceName}-${objectName}-${timestamp}.${format}`;

      this.triggerDataUrlDownload(dataUrl, filename);
    } catch (error) {
      console.error(`Failed to export selected object as ${format}:`, error);
    }
  }

  /**
   * Exports the current workspace and all its objects as a JSON string.
   * The exported data includes workspace metadata (id, name, viewport) and all canvas objects.
   * @returns A JSON string representing the complete workspace state.
   */
  @Method()
  async exportAsJson(): Promise<string> {
    const workspace = this.core.store.state.activeWorkspace;
    if (!workspace) {
      throw new Error('Cannot export workspace: no active workspace is loaded');
    }

    await this.core.initializeAssetStorage();

    const serialized = workspace.serialize({ includeObjects: true }) as WorkspaceJsonExportPayload;
    const exportMode = this.getWorkspaceExportMode();
    const { objects, ...workspaceWithoutObjects } = serialized;
    const payload: WorkspaceJsonExportPayload = {
      ...workspaceWithoutObjects,
      exportMode,
      ...(objects !== undefined ? { objects } : {}),
    };

    if (exportMode === 'portable') {
      const portableAssets = await this.collectPortableAssets(payload.objects);
      if (Object.keys(portableAssets).length > 0) {
        payload.assets = portableAssets;
      }
    } else {
      delete payload.assets;
    }

    return JSON.stringify(payload, null, 2);
  }

  /**
   * Imports a workspace from a JSON string into a new workspace.
   * Creates a new workspace with the imported data and automatically switches to it.
   * @param json - A JSON string containing workspace data (from exportAsJson).
   * @throws Error if the JSON is invalid or the format version is incompatible.
   */
  @Method()
  async importFromJson(json: string): Promise<void> {
    const data = JSON.parse(json) as WorkspaceJsonExportPayload;

    // Validate the import data
    if (!data.__class__ || data.__class__ !== 'KritzelWorkspace') {
      throw new Error('Invalid workspace data: missing or incorrect __class__ identifier');
    }

    await this.core.initializeAssetStorage();
    await this.restorePortableAssets(data);

    if (data.version && data.version !== WORKSPACE_EXPORT_VERSION) {
      console.warn(`Workspace version mismatch: expected ${WORKSPACE_EXPORT_VERSION}, got ${data.version}`);
    }

    // Create a new workspace with a fresh ID but use the imported name
    const newWorkspaceId = ObjectHelper.generateUUID();
    const importedName = this.getImportedWorkspaceName(data.name);
    const importedViewport = this.getImportedWorkspaceViewport(data.viewport);

    const newWorkspace = new KritzelWorkspace({
      id: newWorkspaceId,
      name: importedName,
      viewport: importedViewport,
    });

    // Save the new workspace
    this.core.createWorkspace(newWorkspace);
    this.syncVisibleWorkspacesToState();
    this.workspacesChange.emit(this.getVisibleWorkspaces());

    // Switch to the new workspace
    this.core.beforeWorkspaceChange();
    await this.core.initializeWorkspace(newWorkspace);

    // Revive and add objects to the new workspace
    if (data.objects && Array.isArray(data.objects)) {
      const reviver = new KritzelReviver(this.core);
      for (const objData of data.objects) {
        const revivedObj = reviver.revive<KritzelBaseObject>(objData);
        if (revivedObj) {
          // Update workspaceId to the new workspace's ID
          revivedObj.workspaceId = newWorkspaceId;
          this.core.addObject(revivedObj);
        }
      }
    }

    // Rerender to apply changes
    this.core.rerender();

    // Emit event so the editor can sync its state
    this.activeWorkspaceChange.emit(newWorkspace);
  }

  /**
   * Loads objects from a workspace JSON string into the current workspace.
   * Unlike importFromJson, this does not create a new workspace - it adds objects to the existing one.
   * Useful for initializing a workspace with pre-existing content after the editor is ready.
   * @param json - A JSON string containing workspace data (from exportAsJson).
   * @returns The number of objects loaded.
   * @throws Error if the JSON is invalid or the format version is incompatible.
   */
  @Method()
  async loadObjectsFromJson(json: string): Promise<number> {
    const data = JSON.parse(json) as WorkspaceJsonExportPayload;

    // Validate the import data
    if (!data.__class__ || data.__class__ !== 'KritzelWorkspace') {
      throw new Error('Invalid workspace data: missing or incorrect __class__ identifier');
    }

    await this.core.initializeAssetStorage();
    await this.restorePortableAssets(data);

    if (data.version && data.version !== WORKSPACE_EXPORT_VERSION) {
      console.warn(`Workspace version mismatch: expected ${WORKSPACE_EXPORT_VERSION}, got ${data.version}`);
    }

    const activeWorkspace = this.core.store.state.activeWorkspace;
    if (!activeWorkspace) {
      throw new Error('Cannot load objects: no active workspace is loaded');
    }

    const currentWorkspaceId = activeWorkspace.id;
    let loadedCount = 0;

    // Revive and add objects to the current workspace
    if (data.objects && Array.isArray(data.objects)) {
      const reviver = new KritzelReviver(this.core);
      const objectsMap = this.core.store.objects;

      const insertRevivedObjects = () => {
        for (const objData of data.objects!) {
          const revivedObj = reviver.revive<KritzelBaseObject>(objData);
          if (!revivedObj) {
            continue;
          }

          // Update workspaceId to the current workspace's ID
          revivedObj.workspaceId = currentWorkspaceId;
          this.core.addObject(revivedObj);
          loadedCount++;
        }
      };

      if (objectsMap) {
        objectsMap.transaction(() => {
          insertRevivedObjects();
        });
      } else {
        insertRevivedObjects();
      }
    }

    // Rerender to apply changes
    this.core.rerender();

    return loadedCount;
  }

  private getWorkspaceExportMode(): WorkspaceExportMode {
    return this.core.assetResolver.hasRemoteProvider ? 'lightweight' : 'portable';
  }

  private async collectPortableAssets(serializedObjects?: unknown[]): Promise<Record<string, string>> {
    if (!Array.isArray(serializedObjects) || serializedObjects.length === 0) {
      return {};
    }

    const assetIds = new Set<string>();
    for (const serializedObject of serializedObjects) {
      if (!serializedObject || typeof serializedObject !== 'object') {
        continue;
      }

      const maybeImage = serializedObject as { __class__?: string; assetId?: unknown };
      if (maybeImage.__class__ === 'KritzelImage' && typeof maybeImage.assetId === 'string' && maybeImage.assetId.length > 0) {
        assetIds.add(maybeImage.assetId);
      }
    }

    const assets: Record<string, string> = {};
    for (const assetId of assetIds) {
      try {
        const blob = await this.core.assetResolver.fetchBlob(assetId);
        assets[assetId] = await this.blobToDataUrl(blob);
      } catch (error) {
        console.warn(`[Kritzel] Failed to embed asset ${assetId} in portable workspace export:`, error);
      }
    }

    return assets;
  }

  private async restorePortableAssets(data: WorkspaceJsonExportPayload): Promise<void> {
    const assets = data.assets;
    if (!assets || typeof assets !== 'object') {
      return;
    }

    for (const [assetId, dataUrl] of Object.entries(assets)) {
      if (!assetId || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
        continue;
      }

      try {
        const blob = await this.dataUrlToBlob(dataUrl);
        await this.core.assetResolver.put(blob, {
          id: assetId,
          mimeType: blob.type || 'application/octet-stream',
          kind: 'image',
        });
      } catch (error) {
        console.warn(`[Kritzel] Failed to restore embedded asset ${assetId} from portable workspace import:`, error);
      }
    }
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error ?? new Error('Failed to read blob as data URL'));
      reader.readAsDataURL(blob);
    });
  }

  private async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return response.blob();
  }

  private triggerDataUrlDownload(dataUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }

  private getSingleSelectedExportableObject(): (KritzelBaseObject & KritzelExportable) | null {
    const selectedObjects = this.core.store.selectionGroup?.objects ?? [];
    if (selectedObjects.length !== 1) {
      return null;
    }

    const [selected] = selectedObjects;
    if (!ObjectHelper.isKritzelExportable(selected)) {
      return null;
    }

    return selected as KritzelBaseObject & KritzelExportable;
  }

  private getObjectExportContext(): KritzelObjectExportContext {
    return {
      getObjectAsSvgDataUrl: async (object, options) => {
        const svg = await this.getObjectAsSvgMarkup(object, options?.rasterSafeForCanvas ?? false);
        return svg ? this.svgMarkupToDataUrl(svg) : null;
      },
      getObjectAsPngDataUrl: async object => {
        const svg = await this.getObjectAsSvgMarkup(object, true);
        return svg ? this.svgMarkupToPngDataUrl(svg) : null;
      },
    };
  }

  private async getObjectAsSvgMarkup(object: KritzelBaseObject, rasterSafeForCanvas: boolean): Promise<string | null> {
    const imageDataUrls = await KritzelSvgExportHelper.resolveImageDataUrls([object], this.core.assetResolver);
    const svg = KritzelSvgExportHelper.generateSvg([object], {
      theme: this.theme,
      rasterSafeForCanvas,
      imageDataUrls,
    });

    return svg || null;
  }

  private svgMarkupToDataUrl(svgMarkup: string): string {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
  }

  private async svgMarkupToPngDataUrl(svgMarkup: string): Promise<string> {
    const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    const svgBlobUrl = URL.createObjectURL(svgBlob);

    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = err => reject(err);
        element.src = svgBlobUrl;
      });

      const width = Math.max(1, Math.ceil(img.naturalWidth || img.width));
      const height = Math.max(1, Math.ceil(img.naturalHeight || img.height));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Could not create 2D canvas context for PNG export');
      }

      context.drawImage(img, 0, 0, width, height);
      return canvas.toDataURL('image/png');
    } finally {
      URL.revokeObjectURL(svgBlobUrl);
    }
  }

  private getImportedWorkspaceName(rawName: unknown): string {
    if (typeof rawName === 'string' && rawName.trim().length > 0) {
      return rawName;
    }
    return 'Imported Workspace';
  }

  private getImportedWorkspaceViewport(rawViewport: unknown): { centerWorldX: number; centerWorldY: number; scale: number } {
    if (!rawViewport || typeof rawViewport !== 'object') {
      return { centerWorldX: 0, centerWorldY: 0, scale: 1 };
    }

    const viewport = rawViewport as {
      centerWorldX?: unknown;
      centerWorldY?: unknown;
      scale?: unknown;
      translateX?: unknown;
      translateY?: unknown;
    };

    if (typeof viewport.centerWorldX === 'number' && typeof viewport.centerWorldY === 'number') {
      const scale = typeof viewport.scale === 'number' && viewport.scale > 0 ? viewport.scale : 1;
      return {
        centerWorldX: viewport.centerWorldX,
        centerWorldY: viewport.centerWorldY,
        scale,
      };
    }

    if (typeof viewport.translateX === 'number' || typeof viewport.translateY === 'number') {
      const scale = typeof viewport.scale === 'number' && viewport.scale > 0 ? viewport.scale : 1;
      return {
        centerWorldX: -(typeof viewport.translateX === 'number' ? viewport.translateX : 0) / scale,
        centerWorldY: -(typeof viewport.translateY === 'number' ? viewport.translateY : 0) / scale,
        scale,
      };
    }

    return { centerWorldX: 0, centerWorldY: 0, scale: 1 };
  }

  /**
   * Exports the current workspace as a JSON file and triggers a browser download.
   * @param filename - Optional custom filename (without extension). Defaults to workspace name with timestamp.
   */
  @Method()
  async downloadAsJson(filename?: string): Promise<void> {
    try {
      const json = await this.exportAsJson();
      const activeWorkspaceName = this.core.store.state?.activeWorkspace?.name || 'workspace';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const finalFilename = filename || `${activeWorkspaceName}-${timestamp}`;

      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.download = `${finalFilename}.json`;
      link.href = url;
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download workspace as JSON:', error);
    }
  }

  /**
   * Opens a file picker dialog and imports the selected JSON file into the workspace.
   * This method creates a hidden file input, triggers the browser's file chooser,
   * reads the selected JSON file, and imports it using importFromJson.
   * @returns A promise that resolves when the import is complete or rejects on error/cancel.
   */
  @Method()
  async importFromFile(): Promise<void> {
    return new Promise((resolve, reject) => {
      const fileInput = document.createElement('input');
      this.activeImportFileInput = fileInput;
      fileInput.type = 'file';
      fileInput.accept = '.json,application/json';
      fileInput.style.display = 'none';

      const cleanup = () => {
        if (this.activeImportFileInput === fileInput) {
          this.activeImportFileInput = undefined;
          this.cancelActiveImport = undefined;
        }
        fileInput.removeEventListener('change', handleChange);
        fileInput.removeEventListener('cancel', handleCancel);
        fileInput.remove();
      };

      const handleChange = async (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (!file) {
          cleanup();
          resolve();
          return;
        }

        try {
          const reader = new FileReader();
          reader.onload = async e => {
            try {
              const json = e.target?.result as string;
              await this.importFromJson(json);
              cleanup();
              resolve();
            } catch (error) {
              cleanup();
              console.error('Failed to import workspace from file:', error);
              reject(error);
            }
          };
          reader.onerror = () => {
            cleanup();
            console.error('Failed to read file:', reader.error);
            reject(reader.error);
          };
          reader.readAsText(file);
        } catch (error) {
          cleanup();
          console.error('Failed to process file:', error);
          reject(error);
        }
      };

      const handleCancel = () => {
        cleanup();
        resolve();
      };

      this.cancelActiveImport = handleCancel;

      fileInput.addEventListener('change', handleChange);
      fileInput.addEventListener('cancel', handleCancel);
      document.body.appendChild(fileInput);
      fileInput.click();
    });
  }

  /** Cancels an active file picker opened by importFromFile. */
  @Method()
  async cancelImportFromFile(): Promise<void> {
    this.cancelActiveImport?.();
    this.activeImportFileInput?.remove();
    this.activeImportFileInput = undefined;
    this.cancelActiveImport = undefined;
  }

  /**
   * Switches the active workspace in the engine by ID.
   * @param id - The unique ID of the workspace to activate
   */
  @Method()
  async setActiveWorkspace(id: string): Promise<void> {
    const workspace = this.findVisibleWorkspace(id);
    if (!workspace) {
      console.warn(`[KritzelEngine] No workspace found with ID: ${id}`);
      return;
    }

    await this.switchToWorkspaceById(id);
  }

  /**
   * Creates a new workspace and emits a `workspacesChange` event.
   * Emits `activeWorkspaceChange` if the created workspace is activated.
    * @param workspace - The workspace instance to create.
   * @returns The created workspace.
   */
  @Method()
  async createWorkspace(workspace: KritzelWorkspace): Promise<KritzelWorkspace | null> {
    const createdWorkspace = await this.core.createWorkspace(workspace);
    this.syncVisibleWorkspacesToState();
    this.workspacesChange.emit(this.getVisibleWorkspaces());

    const activeWorkspace = this.core.store.state.activeWorkspace;
    if (activeWorkspace && activeWorkspace.id === createdWorkspace.id) {
      this.activeWorkspaceChange.emit(activeWorkspace);
    }

    return createdWorkspace;
  }

  /**
   * Applies a workspace as declared and emits a `workspacesChange` event.
   * Metadata and viewport are always applied. When `workspace.objects` is set it is treated as the
   * complete desired object set (`undefined` leaves objects untouched, `[]` removes them all);
   * updating objects of a non-active workspace requires a configured sync provider.
   * @param workspace - The workspace describing the desired state.
   */
  @Method()
  async updateWorkspace(workspace: KritzelWorkspace): Promise<void> {
    if (this.isWorkspaceCatalogControlled() && !this.findVisibleWorkspace(workspace.id)) {
      console.warn(`[KritzelEngine] Cannot update workspace outside the controlled catalog: ${workspace.id}`);
      return;
    }

    const isActive = this.core.store.state.activeWorkspace?.id === workspace.id;
    const objectsDiff = await this.core.updateWorkspace(workspace);
    this.syncVisibleWorkspacesToState();
    this.workspacesChange.emit(this.getVisibleWorkspaces());

    if (!objectsDiff || !isActive) {
      return;
    }

    if (objectsDiff.added.length > 0) {
      this.emitObjectsAdded(objectsDiff.added);
    }
    if (objectsDiff.removed.length > 0) {
      this.emitObjectsRemoved(objectsDiff.removed);
    }
    if (objectsDiff.updated.length > 0) {
      this.emitObjectsUpdated(objectsDiff.updated.map(object => ({ object, changedProperties: [] })));
    }
    if (objectsDiff.added.length > 0 || objectsDiff.removed.length > 0 || objectsDiff.updated.length > 0) {
      this.emitObjectsChange();
    }
  }

  /**
   * Deletes a workspace and emits a `workspacesChange` event.
   * @param workspace - The workspace to delete.
   */
  @Method()
  async deleteWorkspace(workspace: KritzelWorkspace): Promise<void> {
    if (this.isWorkspaceCatalogControlled() && !this.findVisibleWorkspace(workspace.id)) {
      console.warn(`[KritzelEngine] Cannot delete workspace outside the controlled catalog: ${workspace.id}`);
      return;
    }

    await this.core.deleteWorkspace(workspace);
    this.syncVisibleWorkspacesToState();
    this.workspacesChange.emit(this.getVisibleWorkspaces());
  }

  /** Returns all available workspaces. */
  @Method()
  async getWorkspaces(): Promise<KritzelWorkspace[]> {
    return this.getVisibleWorkspaces();
  }

  /** Returns the currently active workspace. */
  @Method()
  async getActiveWorkspace(): Promise<KritzelWorkspace> {
    const activeWorkspace = this.core.store.state.activeWorkspace;
    if (!activeWorkspace) {
      throw new Error('No active workspace is loaded');
    }

    return activeWorkspace;
  }

  /**
   * Gets whether the active workspace is publicly accessible.
   * @returns True if the workspace is public, false otherwise
   */
  @Method()
  async getIsPublic(): Promise<boolean> {
    return this.core.getIsPublic();
  }

  /**
   * Loads a shared workspace by token.
   * If the workspace exists locally, it switches to it.
   * If it doesn't exist, it adds it to the local workspaces list and then switches to it.
   * @param token - The connection token identifying the shared workspace
   */
  @Method()
  async loadSharedWorkspace(token: string): Promise<void> {
    const workspaceId = token;

    let workspace = this.core.getWorkspaces().find(w => w.id === workspaceId);

    if (!workspace) {
      workspace = new KritzelWorkspace({ id: workspaceId, name: 'Shared Workspace' });
      workspace.isPublic = true;
      this.core.createWorkspace(workspace);
    } else {
      workspace.isPublic = true;
    }

    this.syncVisibleWorkspacesToState();
    this.workspacesChange.emit(this.getVisibleWorkspaces());

    if (this.isWorkspaceCatalogControlled() && !this.findVisibleWorkspace(workspace.id)) {
      console.warn(`[KritzelEngine] Cannot load shared workspace outside the controlled catalog: ${workspace.id}`);
      return;
    }

    this.core.beforeWorkspaceChange();
    await this.initializeWorkspaceIfNeeded(workspace);
    this.activeWorkspaceChange.emit(this.core.store.state.activeWorkspace!);
  }

  /**
   * Reinitializes sync by performing a full teardown and re-initialization.
   * Destroys the current Yjs documents and providers, then rebuilds everything
   * from the current syncConfig. Data reloads from IndexedDB nearly instantly.
   * Call this after updating the syncConfig prop (e.g. after authentication state changes).
   */
  @Method()
  async reinitSync(): Promise<void> {
    this.core.setSyncConfig(this.syncConfig);
    this.core.setAssetStorageConfig(this.assetStorageConfig);
    this.core.store.objects?.clearCursorPosition();
    this.core.store.objects?.destroy();
    this.core.appStateMap.destroy();
    this.core.assetResolver.destroy();
    this._isYjsInitialized = false;
    this._isAssetStorageInitialized = false;
    await this.initializeSyncAndWorkspace();
  }

  /**
   * Persists the given settings object to localStorage using the namespaced storage key.
   * @param settings - The settings configuration to persist.
   */
  @Method()
  async saveSettings(settings: KritzelSettingsConfig): Promise<void> {
    const key = this.core.getStorageKey('kritzel-settings');
    localStorage.setItem(key, JSON.stringify(settings));
  }

  /**
   * Loads the persisted settings object from localStorage.
   * @returns The stored settings, or null if nothing is stored or the value is invalid.
   */
  @Method()
  async loadSettings(): Promise<Partial<KritzelSettingsConfig> | null> {
    const key = this.core.getStorageKey('kritzel-settings');
    const stored = localStorage.getItem(key);
    if (!stored) {
      return null;
    }
    try {
      return JSON.parse(stored) as Partial<KritzelSettingsConfig>;
    } catch {
      return null;
    }
  }

  /**
   * Registers additional locale definitions (with optional partial term overrides).
   * @param locales - The locale definitions to register.
   */
  @Method()
  async registerLocales(locales: KritzelLocale[]): Promise<void> {
    this.core.localizationManager.registerLocales(locales);
    this.core.localizationManager.setLocale(this.core.localizationManager.currentLocale);
  }

  /**
   * Declaratively configures the full locale catalog, replacing the available
   * locale set. Pass `undefined` to restore the built-in locales (en/de/fr).
   * @param locales - The full locale catalog, or `undefined` for built-ins.
   */
  @Method()
  async configureLocales(locales?: KritzelLocale[]): Promise<void> {
    this.core.localizationManager.configureLocales(locales);
    this.core.localizationManager.setLocale(this.core.localizationManager.resolveActiveLocale(this.locale));
  }

  /**
   * Sets the active locale (language) and re-renders the UI.
   * @param code - The locale code to activate, e.g. 'de'.
   */
  @Method()
  async setLocale(code: LocaleCode): Promise<void> {
    this.locale = code;
    this.core.localizationManager.setLocale(code);
  }

  /**
   * Gets the currently active locale code.
   */
  @Method()
  async getLocale(): Promise<LocaleCode> {
    return this.core.localizationManager.currentLocale;
  }

  /**
   * Gets the list of available locale codes (built-in and registered).
   */
  @Method()
  async getAvailableLocales(): Promise<LocaleCode[]> {
    return this.core.localizationManager.getAvailableLocales();
  }

  /**
   * Gets the list of available locales as `{ code, label }` options for a selector.
   */
  @Method()
  async getAvailableLocaleOptions(): Promise<{ code: LocaleCode; label: string }[]> {
    return this.core.localizationManager.getAvailableLocaleOptions();
  }

  /**
   * Resolves a term key to its translated string for the active locale.
   * @param key - The term key to resolve.
   * @param vars - Optional values for `{placeholder}` interpolation.
   */
  @Method()
  async t(key: KritzelTermKey, vars?: KritzelTermVars): Promise<string> {
    return this.core.localizationManager.translate(key, vars);
  }

  /**
   * Resolves every known term key for the active locale into a flat map.
   * Useful for UI layers that need to localize many strings at once.
   */
  @Method()
  async getResolvedTerms(): Promise<Partial<Record<KritzelTermKey, string>>> {
    return this.core.localizationManager.getAllTerms();
  }

  core: KritzelCore;
  viewport!: KritzelViewport;
  contextMenuHandler!: KritzelContextMenuHandler;
  keyHandler!: KritzelKeyHandler;

  private _lastHadSelectionGroup: boolean = false;
  private _isViewportReady: boolean = false;
  private _isYjsInitialized: boolean = false;
  private _isAssetStorageInitialized: boolean = false;
  private _isResolvingActiveWorkspaceId: boolean = false;
  private _stateChangeListenersRegistered: boolean = false;
  private _workspaceInitializationPromise: Promise<void> | null = null;
  private _workspaceInitializationTargetKey: string | null = null;
  private _syncInitPromise: Promise<void> | null = null;
  private _toolsInitPromise: Promise<void> | null = null;
  private _toolsRevision: number = 0;
  private _syncConfigRevision: number = 0;
  private _assetStorageConfigRevision: number = 0;
  private _hasLoggedUnlicensedWelcomeBanner: boolean = false;
  private _previousVisibleDynamicObjects: Set<string> = new Set();
  private _revealedImageKeys: Set<string> = new Set();
  private _sceneBootstrapOpacity: number = 1;
  private _sceneBootstrapTransitionEnabled: boolean = false;
  private _sceneBootstrapTransitionTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly _defaultUndoState: KritzelUndoState = {
    canUndo: false,
    canRedo: false,
    undoStackSize: 0,
    redoStackSize: 0,
  };

  /** Returns a tool registered in this engine instance. */
  @Method()
  async getTool(toolName: string): Promise<KritzelBaseTool | null> {
    await this.registerConfiguredTools();
    return this.core.toolRegistry.getTool(toolName);
  }

  private async registerConfiguredTools(): Promise<void> {
    if (this._toolsInitPromise) {
      return this._toolsInitPromise;
    }

    this._toolsInitPromise = (async () => {
      do {
        const revision = this._toolsRevision;
        for (const definition of this.tools) {
          let toolClass = definition.tool;
          if (typeof toolClass !== 'function') {
            toolClass = toolClass.constructor as KritzelToolDefinition['tool'];
          }

          await this.registerTool(definition.name, toolClass, definition.config);
        }

        if (revision === this._toolsRevision) {
          break;
        }
      } while (true);
    })();

    try {
      await this._toolsInitPromise;
    } finally {
      this._toolsInitPromise = null;
    }
  }

  private setLoadingState(isLoading: boolean): void {
    if (this.core.store.state.isLoading === isLoading) {
      return;
    }

    this.core.store.state.isLoading = isLoading;
    this.isLoadingChange.emit(isLoading);
  }

  private isNetworkAvailable(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine;
  }

  private emitContextMenuStateChange(): void {
    this.contextMenuStateChange.emit({
      isVisible: this.core.store.state.isContextMenuVisible,
      isObjectMenu: !!this.core.store.selectionGroup,
      items: this.core.store.state.contextMenuItems,
      objects: this.core.store.selectionGroup?.objects || [],
      position: {
        x: this.core.store.state.contextMenuX,
        y: this.core.store.state.contextMenuY,
      },
      worldPosition: {
        x: this.core.store.state.contextMenuWorldX,
        y: this.core.store.state.contextMenuWorldY,
      },
    });
  }

  private applyToolConfig(tool: KritzelBaseTool, toolConfig: KritzelTextToolConfig | KritzelBrushToolConfig | KritzelLineToolConfig | KritzelShapeToolConfig): void {
    const normalizedToolConfig = this.normalizeToolConfig(toolConfig);

    Object.entries(normalizedToolConfig).forEach(([key, value]) => {
      (tool as unknown as Record<string, unknown>)[key] = value;
    });
  }

  private normalizeToolConfig(
    toolConfig: KritzelTextToolConfig | KritzelBrushToolConfig | KritzelLineToolConfig | KritzelShapeToolConfig,
  ): KritzelTextToolConfig | KritzelBrushToolConfig | KritzelLineToolConfig | KritzelShapeToolConfig {
    if (!this.isTextToolConfig(toolConfig)) {
      return toolConfig;
    }

    return {
      ...toolConfig,
      availableFonts: resolveTextToolAvailableFonts(toolConfig.availableFonts),
    };
  }

  private isTextToolConfig(
    toolConfig: KritzelTextToolConfig | KritzelBrushToolConfig | KritzelLineToolConfig | KritzelShapeToolConfig,
  ): toolConfig is KritzelTextToolConfig {
    return 'fontFamily' in toolConfig && 'size' in toolConfig && 'color' in toolConfig;
  }

  /** Built-in tool classes of this bundle keyed by their tool type. */
  private static readonly BUILT_IN_TOOL_CLASSES: Partial<Record<KritzelToolType, new (core: KritzelCore) => KritzelBaseTool>> = {
    selection: KritzelSelectionTool,
    brush: KritzelBrushTool,
    eraser: KritzelEraserTool,
    line: KritzelLineTool,
    shape: KritzelShapeTool,
    text: KritzelTextTool,
    image: KritzelImageTool,
  };

  /**
   * Resolves a tool class to the internal built-in class when a foreign copy is passed.
   * Classes from another compiled copy of the library (dual-package hazard, e.g. built-ins
   * re-exported by a framework wrapper) would otherwise break `instanceof` checks.
   */
  private resolveToolClass(toolClass: new (core: KritzelCore) => KritzelBaseTool): new (core: KritzelCore) => KritzelBaseTool {
    if (toolClass.prototype instanceof KritzelBaseTool) {
      return toolClass;
    }

    try {
      const probe = new toolClass(this.core);
      return KritzelEngine.BUILT_IN_TOOL_CLASSES[probe.toolType] ?? toolClass;
    } catch {
      return toolClass;
    }
  }

  get isSelecting() {
    return this.core.store.state.activeTool?.toolType === 'selection' && this.core.store.state.isSelecting;
  }

  get isSelectionActive() {
    return this.core.store.state.activeTool?.toolType === 'selection' && this.core.store.selectionGroup !== null;
  }

  constructor() {
    this.core = new KritzelCore(this);
  }

  disconnectedCallback() {
    this.throttledPointerMoveMulti.cancel();
    this._revealedImageKeys.clear();

    if (this._sceneBootstrapTransitionTimer !== null) {
      clearTimeout(this._sceneBootstrapTransitionTimer);
      this._sceneBootstrapTransitionTimer = null;
    }

    // Unmount all remaining dynamic objects
    if (this.core.store.allObjects) {
      this.core.store.allObjects.forEach(object => {
        if (KritzelClassHelper.isInstanceOf<any>(object, 'KritzelDynamicObject')) {
          (object as any).unmount();
        }
      });
    }

    // Clear cursor position in awareness before destroying
    this.core.store.objects?.clearCursorPosition();

    // Clean up current workspace's ObjectMap
    if (this.core.store.objects) {
      this.core.store.objects.destroy();
    }

    // Clean up AppStateMap (workspaces Y.Doc)
    this.core.appStateMap.destroy();

    // Clean up managers
    this.core.cursorManager.cleanup();
    this.core.themeManager.cleanup();
    this.core.licenseManager.destroy();
  }

  componentWillLoad() {
    this._toolsRevision++;
    void this.registerConfiguredTools();
    this.core.setEditorId(this.editorId);
    if (this.themes && this.themes.length > 0) {
      this.core.themeManager.registerThemes(this.themes);
    }

    const editorElement = this.host.closest('kritzel-editor') as HTMLElement;
    this.core.themeManager.injectThemeEarly(editorElement || this.host);

    this.core.localizationManager.configureLocales(this.locales);
    this.core.localizationManager.setFallbackLocale(this.fallbackLocale);
    this.core.localizationManager.setLocale(this.core.localizationManager.resolveActiveLocale(this.locale));

    this.core.licenseManager.validate(this.licenseKey);
    this.core.licenseManager.startPeriodicValidation();

    this.core.setUser(this.user);
    this.validateScaleMax(this.scaleMax);
    this.validateScaleMin(this.scaleMin);
    this.core.store.state.lockDrawingScale = this.lockDrawingScale;
    this.core.store.state.viewportBoundaryLeft = this.viewportBoundaryLeft;
    this.core.store.state.viewportBoundaryRight = this.viewportBoundaryRight;
    this.core.store.state.viewportBoundaryTop = this.viewportBoundaryTop;
    this.core.store.state.viewportBoundaryBottom = this.viewportBoundaryBottom;
    if (this.debugInfo) {
      this.core.store.state.debugInfo = this.debugInfo;
      this.core.assetResolver.setShowInfo(this.debugInfo.showAssetResolverInfo);
    }
  }

  async componentDidLoad() {
    setTimeout(async () => {
      this.contextMenuHandler = new KritzelContextMenuHandler(this.core, this.globalContextMenuItems ?? [], this.objectContextMenuItems ?? []);
      this.keyHandler = new KritzelKeyHandler(this.core);
      this.viewport = new KritzelViewport(this.core, this.host);
      this._isViewportReady = true;

      // Initialize cursor manager with target element and shadow root
      this.core.cursorManager.setTargetElement(this.cursorTarget || document.body);
      if (this.host.shadowRoot) {
        this.core.cursorManager.setShadowRoot(this.host.shadowRoot);
      }

      // Initialize theme manager with kritzel-editor as target element
      const editorElement = this.host.closest('kritzel-editor') as HTMLElement;
      this.core.themeManager.setTargetElement(editorElement || this.host);

      // Initialize sync config and Yjs
      await this.registerConfiguredTools();
      await this.initializeSyncAndWorkspace();

      if (this.core.store.state.isReady === false) {
        this.core.store.state.isReady = true;
        this.logUnlicensedWelcomeBanner();
        this.isEngineReady.emit(this.core.store.state);
      }
    }, 50);
  }

  private async initializeSyncAndWorkspace() {
    // Deduplicate concurrent calls (e.g. @Watch firing during componentWillLoad
    // while componentDidLoad also calls this method).
    if (this._syncInitPromise) {
      return this._syncInitPromise;
    }

    this._syncInitPromise = this.doInitializeSyncAndWorkspace();

    try {
      await this._syncInitPromise;
    } finally {
      this._syncInitPromise = null;
    }
  }

  /**
   * Initializes the asset storage layer with the latest config. Mirrors
   * the in-flight replay logic of {@link doInitializeSyncAndWorkspace} for
   * `assetStorageConfig` prop updates that arrive while init is running.
   */
  private async initializeAssetStorage() {
    if (this._isAssetStorageInitialized) {
      return;
    }

    const revisionAtStart = this._assetStorageConfigRevision;

    this.core.setAssetStorageConfig(this.assetStorageConfig);
    await this.core.initializeAssetStorage();

    // If assetStorageConfig changed mid-flight, replay once with the latest
    // value so late prop updates are not lost.
    if (revisionAtStart !== this._assetStorageConfigRevision) {
      this.core.assetResolver.destroy();
      this.core.setAssetStorageConfig(this.assetStorageConfig);
      await this.core.initializeAssetStorage();
    }

    this._isAssetStorageInitialized = true;
  }

  private logUnlicensedWelcomeBanner(): void {
    if (this.core.licenseManager.isLicensed || this._hasLoggedUnlicensedWelcomeBanner) {
      return;
    }

    this._hasLoggedUnlicensedWelcomeBanner = true;

    console.info('%c👋 Welcome to Kritzel', 'color: #007AFF; font-weight: 700;');
    console.info(`This version of Kritzel is not licensed. Get a license at: https://kritzel.io`);
  }

  private async doInitializeSyncAndWorkspace() {
    // Capture sync config revision to detect prop updates that happen while
    // initialization is in-flight.
    const syncConfigRevisionAtStart = this._syncConfigRevision;

    // Always apply the latest sync and asset storage configs (including undefined).
    this.core.setSyncConfig(this.syncConfig);
    this.core.setAssetStorageConfig(this.assetStorageConfig);

    // Initialize Yjs document and persistence layer (only once)
    if (!this._isYjsInitialized) {
      await this.core.initializeYjs();

      // If syncConfig changed while initializeYjs was running, replay Yjs
      // initialization once with the latest configuration.
      if (syncConfigRevisionAtStart !== this._syncConfigRevision) {
        this.core.appStateMap.destroy();
        this.core.setSyncConfig(this.syncConfig);
        this.core.setAssetStorageConfig(this.assetStorageConfig);
        await this.core.initializeYjs();
      }

      this._isYjsInitialized = true;
    }

    // Initialize the asset storage layer if a config has been provided.
    // When the prop arrives later, the @Watch('assetStorageConfig') handler
    // will trigger initializeAssetStorage() instead.
    if (!this._isAssetStorageInitialized && this.assetStorageConfig) {
      await this.initializeAssetStorage();
    }

    await this.reconcileProvidedWorkspaces();
    await this.initializeStartupWorkspace();
    await this.waitForRemoteAppStateIfEmpty();

    if (this.activeWorkspaceId) {
      const startupWorkspace = this.core.getWorkspaces().find(ws => ws.id === this.activeWorkspaceId);

      if (startupWorkspace) {
        await this.initializeWorkspaceIfNeeded(startupWorkspace);
      } else {
        // Workspace ID was provided but not found – fall back to existing workspaces
        // (last-active, then newest created) instead of leaving activeWorkspace null.
        await this.initializeWorkspaceIfNeeded();
      }
    } else {
      // Resolve startup workspace, preferring explicit workspace object when provided.
      const startupWorkspace = await this.resolveStartupWorkspace();
      await this.initializeWorkspaceIfNeeded(startupWorkspace);
    }

    // Emit initial active workspace once startup initialization has completed
    const initialActiveWorkspace = this.core.store.state.activeWorkspace;
    if (initialActiveWorkspace) {
      this.activeWorkspaceChange.emit(initialActiveWorkspace);
    }

    // Register callback for remote workspace changes (only once)
    if (!this._stateChangeListenersRegistered) {
      this.core.appStateMap.onRemoteChange(() => {
        this.syncVisibleWorkspacesToState();
        this.workspacesChange.emit(this.getVisibleWorkspaces());
        this.tryResolveActiveWorkspaceFromId();
      });
      this._registerStateChangeListeners();
      this._stateChangeListenersRegistered = true;
    }

    this.tryResolveActiveWorkspaceFromId();
  }

  private async initializeStartupWorkspace(): Promise<void> {
    if (this.isWorkspaceCatalogControlled()) {
      const visibleWorkspaces = this.getVisibleWorkspaces();

      if (this.activeWorkspaceId) {
        const startupWorkspace = visibleWorkspaces.find(ws => ws.id === this.activeWorkspaceId);

        if (startupWorkspace) {
          await this.initializeWorkspaceIfNeeded(startupWorkspace);
          this.syncVisibleWorkspacesToState();
          return;
        }

        console.warn(`[KritzelEngine] No workspace found with ID: ${this.activeWorkspaceId}`);
      }

      if (visibleWorkspaces.length > 0) {
        await this.initializeWorkspaceIfNeeded(visibleWorkspaces[0]);
      } else {
        await this.initializeWorkspaceIfNeeded(undefined, { skipFallbackCreation: true });
      }

      this.syncVisibleWorkspacesToState();
      return;
    }
  }

/**
   * On a cold start the remote workspace list may still be in flight; creating a
   * fallback workspace before it arrives would pollute the synced app state.
   */
  private async waitForRemoteAppStateIfEmpty(): Promise<void> {
    if (this.core.getWorkspaces().length > 0) {
      return;
    }

    if (!this.core.appStateMap.hasNetworkSyncProvider || !this.isNetworkAvailable()) {
      return;
    }

    await this.core.appStateMap.whenNetworkSynced();
  }

  private async resolveStartupWorkspace(): Promise<KritzelWorkspace> {
    if (this.activeWorkspaceId) {
      const workspaceById = this.core.getWorkspaces().find(ws => ws.id === this.activeWorkspaceId);

      if (workspaceById) {
        await this.initializeWorkspaceIfNeeded(workspaceById);
        return;
      }

      // Workspace ID was provided but not found – fall back to existing workspaces
      // (last-active, then newest created) instead of leaving activeWorkspace null.
      await this.initializeWorkspaceIfNeeded();
      return;
    }

    await this.initializeWorkspaceIfNeeded();
  }


  private async ensureActiveWorkspaceIsVisible(): Promise<void> {
    if (!this.isWorkspaceCatalogControlled()) {
      return;
    }

    const activeWorkspaceId = this.core.store.state.activeWorkspace?.id;
    if (activeWorkspaceId && this.findVisibleWorkspace(activeWorkspaceId)) {
      this.syncVisibleWorkspacesToState();
      return;
    }

    await this.initializeStartupWorkspace();
  }

  private async reconcileProvidedWorkspaces(): Promise<void> {
    if (!this.isWorkspaceCatalogControlled()) {
      return;
    }

    const providerWorkspaces = this.core.getWorkspaces();
    for (const workspace of this.getProvidedWorkspaces()) {
      const existingWorkspace = providerWorkspaces.find(existing => existing.id === workspace.id);

      if (!existingWorkspace) {
        await this.core.createWorkspace(workspace);
        continue;
      }

      if (this.hasWorkspaceMetadataChanged(existingWorkspace, workspace)) {
        await this.core.updateWorkspace(this.cloneWorkspaceMetadata(workspace));
      }
    }

    this.syncVisibleWorkspacesToState();
  }

  private isWorkspaceCatalogControlled(): boolean {
    return this.workspaces !== undefined;
  }

  private getProvidedWorkspaces(): KritzelWorkspace[] {
    return this.workspaces ?? [];
  }

  private getVisibleWorkspaces(): KritzelWorkspace[] {
    if (!this.isWorkspaceCatalogControlled()) {
      return this.core.getWorkspaces();
    }

    const providerWorkspaces = this.core.getWorkspaces();

    return this.getProvidedWorkspaces().map(workspace => providerWorkspaces.find(existing => existing.id === workspace.id) ?? workspace);
  }

  private findVisibleWorkspace(workspaceId: string): KritzelWorkspace | undefined {
    return this.getVisibleWorkspaces().find(workspace => workspace.id === workspaceId);
  }

  private syncVisibleWorkspacesToState(): void {
    this.core.store.state.workspaces = this.getVisibleWorkspaces();
  }

  private hasWorkspaceMetadataChanged(existingWorkspace: KritzelWorkspace, providedWorkspace: KritzelWorkspace): boolean {
    return (
      existingWorkspace.name !== providedWorkspace.name ||
      existingWorkspace.isPublic !== providedWorkspace.isPublic ||
      existingWorkspace.viewport.centerWorldX !== providedWorkspace.viewport.centerWorldX ||
      existingWorkspace.viewport.centerWorldY !== providedWorkspace.viewport.centerWorldY ||
      existingWorkspace.viewport.scale !== providedWorkspace.viewport.scale
    );
  }

  private cloneWorkspaceMetadata(workspace: KritzelWorkspace): KritzelWorkspace {
    const clonedWorkspace = workspace.clone();
    clonedWorkspace.objects = undefined;
    return clonedWorkspace;
  }

  private tryResolveActiveWorkspaceFromId(): void {
    if (!this.activeWorkspaceId || this._isResolvingActiveWorkspaceId) {
      return;
    }

    if (this.core.store.state.activeWorkspace?.id === this.activeWorkspaceId) {
      return;
    }

    this._isResolvingActiveWorkspaceId = true;
    void this.switchToWorkspaceById(this.activeWorkspaceId, false).finally(() => {
      this._isResolvingActiveWorkspaceId = false;
    });
  }

  private async switchToWorkspaceById(workspaceId: string, logIfMissing: boolean = true): Promise<void> {
    const workspace = this.findVisibleWorkspace(workspaceId);
    if (!workspace) {
      if (logIfMissing) {
        console.warn(`[KritzelEngine] No workspace found with ID: ${workspaceId}`);
      }
      return;
    }

    if (this.core.store.state.activeWorkspace?.id === workspace.id) {
      return;
    }

    this.core.beforeWorkspaceChange();
    await this.initializeWorkspaceIfNeeded(workspace);
    this.activeWorkspaceChange.emit(this.core.store.state.activeWorkspace!);
  }

  private async initializeWorkspaceIfNeeded(workspace?: KritzelWorkspace, options?: { skipFallbackCreation?: boolean }): Promise<void> {
    const targetWorkspaceId = workspace?.id ?? null;
    const targetKey = targetWorkspaceId ?? (options?.skipFallbackCreation ? '__NO_FALLBACK__' : '__AUTO__');

    if (targetWorkspaceId && this.core.store.state.activeWorkspace?.id === targetWorkspaceId) {
      return;
    }

    if (this._workspaceInitializationPromise && this._workspaceInitializationTargetKey === targetKey) {
      await this._workspaceInitializationPromise;
      return;
    }

    this.setLoadingState(true);
    const initializationPromise = this.core.initializeWorkspace(workspace, options);
    const objectsMap = this.core.store.objects;
    this._workspaceInitializationPromise = initializationPromise;
    this._workspaceInitializationTargetKey = targetKey;

    try {
      await initializationPromise;
      await objectsMap?.whenNetworkSynced();

    } finally {
      // Only the most recent init clears loading state to prevent race conditions
      if (this._workspaceInitializationPromise === initializationPromise) {
        this._workspaceInitializationPromise = null;
        this._workspaceInitializationTargetKey = null;
        this.setLoadingState(false);
      }
    }
  }

  emitObjectsChange() {
    const objectsMap = this.core.store.objects;
    const selectedObjects = this.core.store.selectedObjects as KritzelBaseObject[];

    if (!objectsMap) {
      this.objectsChange.emit([]);
      this.undoStateChange.emit(this._defaultUndoState);

      if (this._lastHadSelectionGroup) {
        this._lastHadSelectionGroup = false;
        this.objectsSelectionChange.emit(selectedObjects);
      }

      return;
    }

    const objects = this.core.store.allObjects as KritzelBaseObject<HTMLElement | SVGElement>[];
    const undoState = objectsMap.undoState;
    const hasSelectionGroup = this.core.store.selectionGroup !== null;

    this.objectsChange.emit(objects);
    this.undoStateChange.emit(undoState);

    if (this._lastHadSelectionGroup !== hasSelectionGroup) {
      this._lastHadSelectionGroup = hasSelectionGroup;
      this.objectsSelectionChange.emit(selectedObjects);
    }
  }

  emitObjectsAdded(objects: KritzelBaseObject<any>[]) {
    this.objectsAdded.emit({ objects });
  }

  emitObjectsRemoved(objects: KritzelBaseObject<any>[]) {
    this.objectsRemoved.emit({ objects });
  }

  emitObjectsUpdated(objects: { object: KritzelBaseObject<any>; changedProperties: string[] }[]) {
    this.objectsUpdated.emit({ objects });
  }

  emitAwarenessChange(states: Map<number, Record<string, any>>) {
    this.awarenessChange.emit(states);
  }

  emitObjectsInViewportChange() {
    const visibleObjects = this.core.store.objectsInViewport;
    this.objectsInViewportChange.emit(visibleObjects);
  }

  private _registerStateChangeListeners() {
    this.core.store.onStateChange('activeTool', this._handleActiveToolChange.bind(this));
  }

  private _handleActiveToolChange(activeTool: KritzelBaseTool | null) {
    if (activeTool?.toolType !== 'selection') {
      this.core.clearSelection();
      this.core.store.objects?.remove(o => o instanceof KritzelSelectionBox);
      this.core.store.setSelectionBox(null);
      this.core.store.objects?.clearLocalSelectionBox();
      this.core.store.state.isSelecting = false;
      this.core.store.state.isResizeHandleSelected = false;
      this.core.store.state.isRotationHandleSelected = false;
    }

    if (activeTool?.toolType !== 'text') {
      this.core.resetActiveText();
    }

    if (activeTool?.toolType !== 'shape') {
      this.core.resetActiveShape();
    }

    this.core.store.state.skipContextMenu = false;
    if (activeTool) {
      this.activeToolChange.emit(activeTool);
    }
    KritzelKeyboardHelper.forceHideKeyboard();

    this.core.rerender();
  }

  private getObjectEffectiveOpacity(object: KritzelBaseObject<any>): { multiplied: number; overridden: string } {
    const safeObjectOpacity = Number.isFinite(object.opacity) ? object.opacity : 1;
    const multiplied = (object.markedForRemoval ? 0.5 : 1) * safeObjectOpacity;
    const overridden = (object.markedForRemoval ? 0.5 : safeObjectOpacity).toString();

    return { multiplied, overridden };
  }

  private getSelectionHandleCapabilities(object: KritzelBaseObject<any>): { canRenderResizeHandles: boolean; canRenderRotationHandle: boolean } {
    const selectedObjects = KritzelClassHelper.isInstanceOf<KritzelSelectionGroup>(object, 'KritzelSelectionGroup') ? object.objects : [object];

    return {
      canRenderResizeHandles: selectedObjects.every(selectedObject => selectedObject.isResizable !== false),
      canRenderRotationHandle: selectedObjects.every(selectedObject => selectedObject.isRotatable !== false),
    };
  }

  private getImageRevealKey(image: KritzelImage): string | null {
    if (image.assetId) {
      return `asset:${image.assetId}`;
    }

    if (image.id) {
      return `object:${image.id}`;
    }

    return null;
  }

  private shouldAnimateImageFirstReveal(image: KritzelImage): boolean {
    if (image.loadState !== 'ready') {
      return false;
    }

    const revealKey = this.getImageRevealKey(image);
    if (!revealKey) {
      return false;
    }

    if (this._revealedImageKeys.has(revealKey)) {
      return false;
    }

    this._revealedImageKeys.add(revealKey);
    return true;
  }

  render() {
    if (!this.viewport) {
      return <Host></Host>;
    }

    const currentTheme = this.core.themeManager.getStoredTheme();
    const computedStyle = window.getComputedStyle(this.host);
    const baseHandleSizePx = computedStyle.getPropertyValue('--kritzel-selection-handle-size').trim() || '6px';
    const baseHandleSize = parseFloat(baseHandleSizePx);
    const baseHandleTouchSize = baseHandleSize * 2 < 14 ? 14 : baseHandleSize;
    const viewportCenterX = this.core.store.state.viewportWidth / 2 + this.core.store.state.translateX;
    const viewportCenterY = this.core.store.state.viewportHeight / 2 + this.core.store.state.translateY;
    const visibleObjects = this.core.store.objectsInViewport;

    const getObjectWrapperPointerEvents = (object: KritzelBaseObject<any>): 'none' | 'auto' => {
      if (this.core.store.state.isScaling) {
        return 'none';
      }

      if (KritzelClassHelper.isInstanceOf<KritzelSelectionGroup>(object, 'KritzelSelectionGroup')) {
        return 'none';
      }

      return 'auto';
    };

    const getSelectionGroupOverlayPointerEvents = (object: KritzelBaseObject<any>): 'none' | 'auto' => {
      if (object.markedForRemoval) {
        return 'none';
      }

      if (!KritzelClassHelper.isInstanceOf<KritzelSelectionGroup>(object, 'KritzelSelectionGroup')) {
        return 'auto';
      }

      if (object.objects.length === 1 && KritzelClassHelper.isInstanceOf<KritzelDynamicObject>(object.objects[0], 'KritzelDynamicObject')) {
        return 'none';
      }

      return 'auto';
    };

    // Track visible dynamic objects and unmount culled ones
    const currentVisibleDynamicObjects = new Set<string>();
    visibleObjects.forEach(object => {
      if (KritzelClassHelper.isInstanceOf<any>(object, 'KritzelDynamicObject')) {
        currentVisibleDynamicObjects.add(object.id);
      }
    });

    // Unmount dynamic objects that left the viewport
    this._previousVisibleDynamicObjects.forEach(id => {
      if (!currentVisibleDynamicObjects.has(id)) {
        const object = this.core.store.objects.findById(id);
        if (object && KritzelClassHelper.isInstanceOf<any>(object, 'KritzelDynamicObject')) {
          (object as any).unmount();
        }
      }
    });

    // Update tracking set for next render
    this._previousVisibleDynamicObjects = currentVisibleDynamicObjects;

    this.core.cursorManager.applyCursor();

    if (this.core.store.state.hasViewportChanged) {
      this.viewportChange.emit(this.viewport.getViewport());
      if (this.core.store.totalObjectCount > 0) {
        this.emitObjectsInViewportChange();
      }
    }

    return (
      <Host>
        {this.core.store.state.debugInfo.showViewportInfo && (
          <div
            class="debug-panel"
            style={{
              color: 'var(--kritzel-global-text-primary)',
            }}
          >
            <div>ActiveWorkspaceId: {this.core.store.state?.activeWorkspace?.id}</div>
            <div>ActiveWorkspaceName: {this.core.store.state?.activeWorkspace?.name}</div>
            <div>TranslateX: {this.core.store.state?.translateX}</div>
            <div>TranslateY: {this.core.store.state?.translateY}</div>
            <div>ViewportWidth: {this.core.store.state?.viewportWidth}</div>
            <div>ViewportHeight: {this.core.store.state?.viewportHeight}</div>
            <div>PointerCount: {this.core.store.state.pointers.size}</div>
            <div>Scale: {this.core.store.state?.scale}</div>
            <div>ActiveTool: {this.core.store.state?.activeTool?.name}</div>
            <div>HasViewportChanged: {this.core.store.state?.hasViewportChanged ? 'true' : 'false'}</div>
            <div>IsEnabled: {this.core.store.state?.isEnabled ? 'true' : 'false'}</div>
            <div>IsScaling: {this.core.store.state?.isScaling ? 'true' : 'false'}</div>
            <div>IsPanning: {this.core.store.state?.isPanning ? 'true' : 'false'}</div>
            <div>IsSelecting: {this.isSelecting ? 'true' : 'false'}</div>
            <div>IsSelectionActive: {this.isSelectionActive ? 'true' : 'false'}</div>
            <div>IsResizeHandleSelected: {this.core.store.state.isResizeHandleSelected ? 'true' : 'false'}</div>
            <div>IsRotationHandleSelected: {this.core.store.state.isRotationHandleSelected ? 'true' : 'false'}</div>
            <div>IsRotationHandleHovered: {this.core.store.state.isRotationHandleHovered ? 'true' : 'false'}</div>
            <div>IsDrawing: {this.core.store.state.isDrawing ? 'true' : 'false'}</div>
            <div>IsWriting: {this.core.store.state.isWriting ? 'true' : 'false'}</div>
            <div>IsPointerDown: {this.core.store.isPointerDown ? 'true' : 'false'}</div>
            <div>PointerX: {this.core.store.state?.pointerX}</div>
            <div>PointerY: {this.core.store.state?.pointerY}</div>
            <div>TotalObjects: {this.core.store.totalObjectCount}</div>
            <div>ObjectsInViewport: {this.core.store.objectsInViewport.length}</div>
            <div>SelectedObjects: {this.core.store.selectionGroup?.objects.length || 0}</div>
            <div>
              ViewportCenter: ({viewportCenterX.toFixed(2)}, {viewportCenterY.toFixed(2)})
            </div>
          </div>
        )}

        <div
          id="origin"
          class="origin"
          style={{
            transform: `matrix(${this.core.store.state?.scale}, 0, 0, ${this.core.store.state?.scale}, ${this.core.store.state?.translateX}, ${this.core.store.state?.translateY})`,
            opacity: this._sceneBootstrapOpacity.toString(),
            transition: this._sceneBootstrapTransitionEnabled ? 'opacity 220ms ease-out' : 'none',
            willChange: this._sceneBootstrapTransitionEnabled ? 'opacity' : undefined,
          }}
        >
          {visibleObjects?.map(object => {
            const { multiplied: effectiveOpacity, overridden: effectiveOpacityString } = this.getObjectEffectiveOpacity(object);

            return (
              <div
                key={object.id}
                id={object.id}
                class="object"
                style={{
                  transform: object?.transformationMatrix,
                  transformOrigin: 'top left',
                  position: 'absolute',
                  // The object wrapper establishes its own stacking context (transform + z-index),
                  // so the selection-line handles inside it cannot escape above the snap/anchor
                  // layers (z-index 9999/9998) rendered later at the origin level. Lift the
                  // selected line's wrapper above those layers so its handles always paint on top.
                  zIndex: this.core.displaySelectionLineUI(object) ? '10001' : object.zIndex.toString(),
                  pointerEvents: getObjectWrapperPointerEvents(object),
                }}
              >
                {KritzelClassHelper.isInstanceOf<KritzelPath>(object, 'KritzelPath') && (
                  <svg
                    ref={el => el && object.mount(el)}
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      height: object?.totalHeight + 'px',
                      width: object?.totalWidth + 'px',
                      left: '0',
                      top: '0',
                      position: 'absolute',
                      transform: object.rotationDegrees !== 0 ? `rotate(${object.rotationDegrees}deg)` : undefined,
                      transformOrigin: object.rotationDegrees !== 0 ? `${object.totalWidth / 2}px ${object.totalHeight / 2}px` : undefined,
                      pointerEvents: object.markedForRemoval ? 'none' : 'auto',
                      overflow: 'visible',
                    }}
                    viewBox={object?.viewBox}
                  >
                    <path
                      d={object?.d}
                      fill={KritzelColorHelper.applyOpacity(object.fill, effectiveOpacity, currentTheme)}
                      stroke={KritzelColorHelper.applyOpacity(object?.stroke, effectiveOpacity, currentTheme)}
                      shape-rendering={object.isLowRes() ? 'optimizeSpeed' : 'auto'}
                    />
                  </svg>
                )}

                {KritzelClassHelper.isInstanceOf<KritzelLine>(object, 'KritzelLine') && (
                  <svg
                    ref={el => el && object.mount(el)}
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      height: object?.totalHeight + 'px',
                      width: object?.totalWidth + 'px',
                      left: '0',
                      top: '0',
                      position: 'absolute',
                      transform: object.rotationDegrees !== 0 ? `rotate(${object.rotationDegrees}deg)` : undefined,
                      transformOrigin: object.rotationDegrees !== 0 ? `${object.totalWidth / 2}px ${object.totalHeight / 2}px` : undefined,
                      pointerEvents: object.markedForRemoval ? 'none' : 'auto',
                      overflow: 'visible',
                    }}
                    viewBox={object?.viewBox}
                  >
                    {(object.hasStartArrow || object.hasEndArrow) && (
                      <defs>
                        {object.hasStartArrow && (
                          <marker
                            id={object.startMarkerId}
                            markerWidth={object.getArrowSize('start')}
                            markerHeight={object.getArrowSize('start')}
                            refX={0}
                            refY={object.getArrowSize('start') / 2}
                            orient="auto-start-reverse"
                            markerUnits="userSpaceOnUse"
                          >
                            <path
                              d={object.getArrowPath(object.arrows?.start?.style)}
                              fill={KritzelColorHelper.applyOpacity(object.getArrowFill('start'), effectiveOpacity)}
                              transform={`scale(${object.getArrowSize('start') / 10})`}
                            />
                          </marker>
                        )}
                        {object.hasEndArrow && (
                          <marker
                            id={object.endMarkerId}
                            markerWidth={object.getArrowSize('end')}
                            markerHeight={object.getArrowSize('end')}
                            refX={0}
                            refY={object.getArrowSize('end') / 2}
                            orient="auto"
                            markerUnits="userSpaceOnUse"
                          >
                            <path
                              d={object.getArrowPath(object.arrows?.end?.style)}
                              fill={KritzelColorHelper.applyOpacity(object.getArrowFill('end'), effectiveOpacity)}
                              transform={`scale(${object.getArrowSize('end') / 10})`}
                            />
                          </marker>
                        )}
                      </defs>
                    )}
                    <path
                      d={this.core.anchorManager.computeClippedLinePath(object)}
                      fill="none"
                      stroke="transparent"
                      stroke-width={Math.max(object?.strokeWidth || 0, 10)}
                      stroke-linecap="round"
                    />
                    <path
                      d={this.core.anchorManager.computeClippedLinePath(object)}
                      fill="none"
                      stroke={KritzelColorHelper.applyOpacity(object?.stroke, effectiveOpacity, currentTheme)}
                      stroke-width={object?.strokeWidth}
                      stroke-linecap="round"
                      marker-start={object.hasStartArrow ? `url(#${object.startMarkerId})` : undefined}
                      marker-end={object.hasEndArrow ? `url(#${object.endMarkerId})` : undefined}
                    />
                  </svg>
                )}

                {KritzelClassHelper.isInstanceOf<KritzelImage>(object, 'KritzelImage') && object.loadState === 'ready' && (
                  <img
                    ref={el => el && object.mount(el)}
                    class={this.shouldAnimateImageFirstReveal(object) ? 'kritzel-image-object kritzel-image-object--first-reveal' : 'kritzel-image-object'}
                    src={object.resolvedSrc || object.src}
                    style={{
                      position: 'absolute',
                      left: '0',
                      top: '0',
                      width: object.totalWidth + 'px',
                      height: object.totalHeight + 'px',
                      transform: object.rotationDegrees !== 0 ? `rotate(${object.rotationDegrees}deg)` : undefined,
                      transformOrigin: object.rotationDegrees !== 0 ? `${object.totalWidth / 2}px ${object.totalHeight / 2}px` : undefined,
                      opacity: effectiveOpacityString,
                      pointerEvents: object.markedForRemoval ? 'none' : 'auto',
                      backgroundColor: KritzelColorHelper.resolveThemeColor(object.backgroundColor, currentTheme),
                      borderColor: KritzelColorHelper.resolveThemeColor(object.borderColor, currentTheme),
                      borderWidth: object.borderWidth + 'px',
                      borderStyle: 'solid',
                      padding: object.padding + 'px',
                      overflow: 'visible',
                      userSelect: 'none',
                      imageRendering: this.core.store.state.isScaling || this.core.store.state.isPanning ? 'pixelated' : 'auto',
                    }}
                    draggable={false}
                    decoding="async"
                    loading="eager"
                    onDragStart={e => e.preventDefault()}
                  />
                )}

                {KritzelClassHelper.isInstanceOf<KritzelImage>(object, 'KritzelImage') && object.loadState !== 'ready' && (
                  <div
                    ref={() => object.ensureLoaded()}
                    style={{
                      position: 'absolute',
                      left: '0',
                      top: '0',
                      width: object.totalWidth + 'px',
                      height: object.totalHeight + 'px',
                      transform: object.rotationDegrees !== 0 ? `rotate(${object.rotationDegrees}deg)` : undefined,
                      transformOrigin: object.rotationDegrees !== 0 ? `${object.totalWidth / 2}px ${object.totalHeight / 2}px` : undefined,
                      opacity: effectiveOpacityString,
                      pointerEvents: object.markedForRemoval ? 'none' : 'auto',
                      backgroundColor: KritzelColorHelper.resolveThemeColor({ light: '#e5e7eb', dark: '#2a2a2a' }, currentTheme),
                      borderColor:
                        object.loadState === 'error'
                          ? KritzelColorHelper.resolveThemeColor({ light: '#9ca3af', dark: '#6b7280' }, currentTheme)
                          : KritzelColorHelper.resolveThemeColor(object.borderColor, currentTheme),
                      borderWidth: object.loadState === 'error' ? '1px' : object.borderWidth + 'px',
                      borderStyle: 'solid',
                      padding: object.padding + 'px',
                      overflow: 'hidden',
                      userSelect: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <kritzel-icon
                      name={object.loadState === 'error' ? 'imageOff' : 'image'}
                      size={Math.max(16, Math.min(object.totalWidth, object.totalHeight) * 0.3)}
                      style={{
                        color: KritzelColorHelper.resolveThemeColor({ light: '#9ca3af', dark: '#6b7280' }, currentTheme),
                      }}
                    ></kritzel-icon>
                  </div>
                )}

                {KritzelClassHelper.isInstanceOf<KritzelDynamicObject>(object, 'KritzelDynamicObject') && (
                  <div
                    ref={el => el && object.mount(el)}
                    style={{
                      position: 'absolute',
                      left: '0',
                      top: '0',
                      width: object.totalWidth + 'px',
                      height: object.totalHeight + 'px',
                      transform: object.rotationDegrees !== 0 ? `rotate(${object.rotationDegrees}deg)` : undefined,
                      transformOrigin: object.rotationDegrees !== 0 ? `${object.totalWidth / 2}px ${object.totalHeight / 2}px` : undefined,
                      opacity: effectiveOpacityString,
                      pointerEvents: object.markedForRemoval ? 'none' : 'auto',
                      backgroundColor: KritzelColorHelper.resolveThemeColor(object.backgroundColor, currentTheme),
                      borderColor: KritzelColorHelper.resolveThemeColor(object.borderColor, currentTheme),
                      borderWidth: object.borderWidth + 'px',
                      borderStyle: 'solid',
                      padding: object.padding + 'px',
                      overflow: 'visible',
                      display: 'block',
                    }}
                  ></div>
                )}

                {KritzelClassHelper.isInstanceOf<KritzelSelectionGroup>(object, 'KritzelSelectionGroup') && !this.core.displaySelectionLineUI(object) && (
                  <div
                    ref={el => el && object.mount(el)}
                    style={{
                      position: 'absolute',
                      left: '0',
                      top: '0',
                      width: object.totalWidth + 'px',
                      height: object.totalHeight + 'px',
                      transform: object.rotationDegrees !== 0 ? `rotate(${object.rotationDegrees}deg)` : undefined,
                      transformOrigin: object.rotationDegrees !== 0 ? `${object.totalWidth / 2}px ${object.totalHeight / 2}px` : undefined,
                      opacity: object.markedForRemoval ? '0.5' : object.opacity.toString(),
                      pointerEvents: getSelectionGroupOverlayPointerEvents(object),
                    }}
                  ></div>
                )}

                {KritzelClassHelper.isInstanceOf<KritzelSelectionBox>(object, 'KritzelSelectionBox') && (
                  <div
                    ref={el => el && object.mount(el)}
                    style={{
                      position: 'absolute',
                      left: '0',
                      top: '0',
                      width: object.totalWidth + 'px',
                      height: object.totalHeight + 'px',
                      transform: object.rotationDegrees !== 0 ? `rotate(${object.rotationDegrees}deg)` : undefined,
                      transformOrigin: object.rotationDegrees !== 0 ? `${object.totalWidth / 2}px ${object.totalHeight / 2}px` : undefined,
                      opacity: object.markedForRemoval ? '0.5' : object.opacity.toString(),
                      pointerEvents: object.markedForRemoval ? 'none' : 'auto',
                      backgroundColor: KritzelColorHelper.resolveThemeColor(object.backgroundColor, currentTheme),
                      borderColor: KritzelColorHelper.resolveThemeColor(object.borderColor, currentTheme),
                      borderWidth: object.borderWidth + 'px',
                      borderStyle: 'solid',
                    }}
                  ></div>
                )}

                {KritzelClassHelper.isInstanceOf<KritzelText>(object, 'KritzelText') && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '0',
                      top: '0',
                      width: object.totalWidth + 'px',
                      height: object.totalHeight + 'px',
                      transform: object.rotationDegrees !== 0 ? `rotate(${object.rotationDegrees}deg)` : undefined,
                      transformOrigin: object.rotationDegrees !== 0 ? `${object.totalWidth / 2}px ${object.totalHeight / 2}px` : undefined,
                      opacity: effectiveOpacityString,
                      pointerEvents: object.markedForRemoval ? 'none' : 'auto',
                    }}
                  >
                    <div
                      id="text-object"
                      ref={el => el && object.mount(el)}
                      onPointerDown={e => object.handlePointerDown(e)}
                      onPointerMove={e => object.handlePointerMove(e)}
                      onPointerUp={e => object.handlePointerUp(e)}
                      style={{
                        minWidth: object.initialWidth + 'px',
                        minHeight: object.initialHeight + 'px',
                        maxWidth: '500px',
                        height: 'auto',
                        width: 'max-content',
                        transformOrigin: 'top left',
                        transform: `scale(${object.scaleFactor})`,
                        backgroundColor: KritzelColorHelper.resolveThemeColor(object.backgroundColor, currentTheme),
                        overflow: 'visible',
                      }}
                    ></div>
                  </div>
                )}

                {KritzelClassHelper.isInstanceOf<KritzelShape>(object, 'KritzelShape') &&
                  (() => {
                    const fillResolved = KritzelColorHelper.resolveThemeColor(object.fillColor, currentTheme);
                    const strokeResolved = KritzelColorHelper.resolveThemeColor(object.strokeColor, currentTheme);
                    const isFilled = !!fillResolved && fillResolved !== 'transparent';
                    const strokeMatchesFill = isFilled && strokeResolved === fillResolved;

                    return (
                      <div
                        ref={el => el && object.mount(el)}
                        onPointerDown={e => object.handlePointerDown(e)}
                        onPointerMove={e => object.handlePointerMove(e)}
                        onPointerUp={e => object.handlePointerUp(e)}
                        style={{
                          position: 'absolute',
                          left: '0',
                          top: '0',
                          width: object.totalWidth + 'px',
                          height: object.totalHeight + 'px',
                          transform: object.rotationDegrees !== 0 ? `rotate(${object.rotationDegrees}deg)` : undefined,
                          transformOrigin: object.rotationDegrees !== 0 ? `${object.totalWidth / 2}px ${object.totalHeight / 2}px` : undefined,
                          pointerEvents: object.markedForRemoval ? 'none' : 'auto',
                          overflow: 'visible',
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          style={{
                            position: 'absolute',
                            top: '0',
                            left: '0',
                            width: '100%',
                            height: '100%',
                            overflow: 'visible',
                            pointerEvents: 'none',
                          }}
                          viewBox={object.viewBox}
                          preserveAspectRatio="none"
                        >
                          <path
                            d={object.getSvgPath()}
                            fill={KritzelColorHelper.applyOpacity(object.fillColor, effectiveOpacity, currentTheme)}
                            stroke={strokeMatchesFill ? 'none' : KritzelColorHelper.applyOpacity(object.strokeColor, effectiveOpacity, currentTheme)}
                            stroke-width={strokeMatchesFill ? 0 : object.strokeWidth}
                          />
                        </svg>
                        <div
                          ref={el => el && object.mountTextEditor(el)}
                          style={{
                            position: 'absolute',
                            top: '0',
                            left: '0',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            overflow: 'hidden',
                            pointerEvents: object.isEditing ? 'auto' : 'none',
                          }}
                        ></div>
                      </div>
                    );
                  })()}

                {this.core.store.state.debugInfo.showObjectInfo && (
                  <div
                    style={{
                      pointerEvents: 'none',
                      position: 'absolute',
                      left: `${object.totalWidth}px`,
                      top: '0',
                      zIndex: (object.zIndex + 2).toString(),
                      color: 'var(--kritzel-global-text-primary)',
                    }}
                  >
                    <div style={{ whiteSpace: 'nowrap', fontSize: '10px' }}>Id: {object.id}</div>
                    <div style={{ whiteSpace: 'nowrap', fontSize: '10px' }}>userId: {object.userId}</div>
                    <div style={{ whiteSpace: 'nowrap', fontSize: '10px' }}>width: {object.width}</div>
                    <div style={{ whiteSpace: 'nowrap', fontSize: '10px' }}>height: {object.height}</div>
                    <div style={{ whiteSpace: 'nowrap', fontSize: '10px' }}>translateX: {object.translateX}</div>
                    <div style={{ whiteSpace: 'nowrap', fontSize: '10px' }}>translateY: {object.translateY}</div>
                    <div style={{ whiteSpace: 'nowrap', fontSize: '10px' }}>scale: {object.scale}</div>
                    <div style={{ whiteSpace: 'nowrap', fontSize: '10px' }}>rotationDegrees: {object.rotationDegrees}</div>
                    <div style={{ whiteSpace: 'nowrap', fontSize: '10px' }}>zIndex: {object.zIndex}</div>
                    <div style={{ whiteSpace: 'nowrap', fontSize: '10px' }}>isSelected: {object.isSelected ? 'true' : 'false'}</div>

                    {KritzelClassHelper.isInstanceOf<KritzelDynamicObject>(object, 'KritzelDynamicObject') && (
                      <div>
                        <div style={{ whiteSpace: 'nowrap', fontSize: '10px' }}>isInteractive: {object.isInteractive ? 'true' : 'false'}</div>
                      </div>
                    )}

                    {KritzelClassHelper.isInstanceOf<KritzelImage>(object, 'KritzelImage') && (
                      <div>
                        <div style={{ whiteSpace: 'nowrap', fontSize: '10px' }}>assetId: {object.assetId}</div>
                        <div style={{ whiteSpace: 'nowrap', fontSize: '10px' }}>mimeType: {object.mimeType}</div>
                      </div>
                    )}
                  </div>
                )}

                {(this.core.displaySelectionGroupUI(object) || this.core.displaySelectionLineUI(object)) &&
                  (() => {
                    const isSelectionGroup = KritzelClassHelper.isInstanceOf<KritzelSelectionGroup>(object, 'KritzelSelectionGroup');
                    const localClientId = this.core.store.objects?.localClientId;

                    const awarenessStates = this.core.store.objects?.awareness?.getStates();
                    const isRemoteSelection =
                      isSelectionGroup &&
                      // Different user
                      ((object.userId != null && this.core.user?.id != null && object.userId !== this.core.user.id) ||
                        // Same user but different client that is still actively connected (e.g. same account on another device)
                        (object.userId != null &&
                          this.core.user?.id != null &&
                          object.userId === this.core.user.id &&
                          object.clientId != null &&
                          localClientId != null &&
                          object.clientId !== localClientId &&
                          awarenessStates?.has(object.clientId) === true));

                    let remoteUserColor: string | undefined;
                    if (isRemoteSelection) {
                      if (awarenessStates) {
                        // Try direct lookup by clientId first (most precise)
                        if (isSelectionGroup && object.clientId != null) {
                          remoteUserColor = (awarenessStates.get(object.clientId) as any)?.user?.color;
                        }
                        // Fall back to userId match (for selection groups without clientId)
                        if (!remoteUserColor) {
                          for (const state of awarenessStates.values()) {
                            if ((state.user as any)?.id === object.userId) {
                              remoteUserColor = (state.user as any).color;
                              break;
                            }
                          }
                        }
                      }
                    }

                    const selectionBorderColor =
                      remoteUserColor ?? (KritzelColorHelper.resolveThemeColor(object.borderColor, currentTheme) || 'var(--kritzel-selection-border-color, #007AFF)');

                    const selectionHandleStrokeColor = remoteUserColor ?? 'var(--kritzel-selection-handle-stroke-color, #007AFF)';
                    const lineObject = object as KritzelLine;
                    const activeSnapCandidate = this.core.store.state.snapCandidate;
                    const previewSnapCandidate = this.core.store.state.snapPreviewCandidate;
                    const isStartHandleSnapped = lineObject.startAnchor != null;
                    const isEndHandleSnapped = lineObject.endAnchor != null;
                    const highlightedSnapCandidate = activeSnapCandidate ?? previewSnapCandidate;
                    const isStartHandleSnapPreview = highlightedSnapCandidate?.endpoint === 'start';
                    const isEndHandleSnapPreview = highlightedSnapCandidate?.endpoint === 'end';
                    const isStartHandleHighlighted = isStartHandleSnapped || isStartHandleSnapPreview;
                    const isEndHandleHighlighted = isEndHandleSnapped || isEndHandleSnapPreview;
                    const selectionOverlayZIndex = this.core.displaySelectionLineUI(object) ? '10000' : (object.zIndex + 1).toString();
                    const handleScale = object.scale ?? 1;
                    const { canRenderResizeHandles, canRenderRotationHandle } = this.getSelectionHandleCapabilities(object);

                    return (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                          zIndex: selectionOverlayZIndex,
                          height: object?.totalHeight.toString(),
                          width: object?.totalWidth.toString(),
                          left: '0',
                          top: '0',
                          position: 'absolute',
                          transform: `rotate(${object.rotationDegrees}deg)`,
                          transformOrigin: `${object.totalWidth / 2}px ${object.totalHeight / 2}px`,
                          overflow: 'visible',
                          pointerEvents: 'none',
                        }}
                      >
                        {this.core.displaySelectionGroupUI(object) && (
                          <g class="selection-group-ui" style={{ pointerEvents: 'none' }}>
                            {(() => {
                              const remoteLineObject =
                                isRemoteSelection &&
                                KritzelClassHelper.isInstanceOf<KritzelSelectionGroup>(object, 'KritzelSelectionGroup') &&
                                object.objects.length === 1 &&
                                KritzelClassHelper.isInstanceOf<KritzelLine>(object.objects[0], 'KritzelLine')
                                  ? (object.objects[0] as KritzelLine)
                                  : null;

                              if (remoteLineObject) {
                                return (
                                  <g class="selection-line-borders">
                                    <path
                                      class="selection-line-border"
                                      d={this.core.anchorManager.computeClippedLinePath(remoteLineObject, true)}
                                      style={{
                                        stroke: selectionBorderColor,
                                        strokeWidth: `calc(var(--kritzel-selection-border-width, 2px) * ${object.scale} / ${this.core.store.state?.scale})`,
                                        strokeLinecap: 'round',
                                        fill: 'none',
                                      }}
                                    />
                                  </g>
                                );
                              }

                              return (
                                <g class="selection-group-borders">
                                  <line
                                    x1="0"
                                    y1="0"
                                    x2={object.totalWidth}
                                    y2="0"
                                    style={{
                                      stroke: selectionBorderColor,
                                      strokeWidth: `calc(var(--kritzel-selection-border-width, 2px) * ${object.scale} / ${this.core.store.state?.scale})`,
                                      strokeLinecap: 'square',
                                    }}
                                  />
                                  <line
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2={object.totalHeight}
                                    style={{
                                      stroke: selectionBorderColor,
                                      strokeWidth: `calc(var(--kritzel-selection-border-width, 2px) * ${object.scale} / ${this.core.store.state?.scale})`,
                                      strokeLinecap: 'square',
                                    }}
                                  />
                                  <line
                                    x1="0"
                                    y1={object.totalHeight}
                                    x2={object.totalWidth}
                                    y2={object.totalHeight}
                                    style={{
                                      stroke: selectionBorderColor,
                                      strokeWidth: `calc(var(--kritzel-selection-border-width, 2px) * ${object.scale} / ${this.core.store.state?.scale})`,
                                      strokeLinecap: 'square',
                                    }}
                                  />
                                  <line
                                    x1={object.totalWidth}
                                    y1="0"
                                    x2={object.totalWidth}
                                    y2={object.totalHeight}
                                    style={{
                                      stroke: selectionBorderColor,
                                      strokeWidth: `calc(var(--kritzel-selection-border-width, 2px) * ${object.scale} / ${this.core.store.state?.scale})`,
                                      strokeLinecap: 'square',
                                    }}
                                  />
                                </g>
                              );
                            })()}

                            {!this.isSelecting && !isRemoteSelection && (
                              <g class="selection-group-handles" style={{ pointerEvents: 'auto' }}>
                                {canRenderResizeHandles && (
                                  <g>
                                    <rect
                                      class="resize-handle top-left"
                                      x={`${(-(baseHandleSize - 1) * handleScale) / this.core.store.state?.scale}`}
                                      y={`${(-(baseHandleSize - 1) * handleScale) / this.core.store.state?.scale}`}
                                      width={`${((baseHandleSize - 1) * 2 * handleScale) / this.core.store.state?.scale}`}
                                      height={`${((baseHandleSize - 1) * 2 * handleScale) / this.core.store.state?.scale}`}
                                      style={{
                                        fill: 'var(--kritzel-selection-handle-color, #ffffff)',
                                        stroke: selectionHandleStrokeColor,
                                        strokeWidth: `calc(2px * ${handleScale} / ${this.core.store.state?.scale})`,
                                        paintOrder: 'fill',
                                      }}
                                    />
                                    <rect
                                      class="resize-handle-overlay top-left"
                                      x={`${(-baseHandleTouchSize * handleScale) / this.core.store.state?.scale}`}
                                      y={`${(-baseHandleTouchSize * handleScale) / this.core.store.state?.scale}`}
                                      width={`${(baseHandleTouchSize * 2 * handleScale) / this.core.store.state?.scale}`}
                                      height={`${(baseHandleTouchSize * 2 * handleScale) / this.core.store.state?.scale}`}
                                      style={{
                                        fill: 'transparent',
                                        paintOrder: 'fill',
                                      }}
                                    />

                                    <rect
                                      class="resize-handle top-right"
                                      x={`${object.totalWidth - ((baseHandleSize - 1) * handleScale) / this.core.store.state?.scale}`}
                                      y={`${(-(baseHandleSize - 1) * handleScale) / this.core.store.state?.scale}`}
                                      width={`${((baseHandleSize - 1) * 2 * handleScale) / this.core.store.state?.scale}`}
                                      height={`${((baseHandleSize - 1) * 2 * handleScale) / this.core.store.state?.scale}`}
                                      style={{
                                        fill: 'var(--kritzel-selection-handle-color, #ffffff)',
                                        stroke: selectionHandleStrokeColor,
                                        strokeWidth: `calc(2px * ${handleScale} / ${this.core.store.state?.scale})`,
                                        paintOrder: 'fill',
                                      }}
                                    />
                                    <rect
                                      class="resize-handle-overlay top-right"
                                      x={`${object.totalWidth - (baseHandleTouchSize * handleScale) / this.core.store.state?.scale}`}
                                      y={`${(-baseHandleTouchSize * handleScale) / this.core.store.state?.scale}`}
                                      width={`${(baseHandleTouchSize * 2 * handleScale) / this.core.store.state?.scale}`}
                                      height={`${(baseHandleTouchSize * 2 * handleScale) / this.core.store.state?.scale}`}
                                      style={{
                                        fill: 'transparent',
                                        paintOrder: 'fill',
                                      }}
                                    />

                                    <rect
                                      class="resize-handle bottom-left"
                                      x={`${(-(baseHandleSize - 1) * handleScale) / this.core.store.state?.scale}`}
                                      y={`${object.totalHeight - ((baseHandleSize - 1) * handleScale) / this.core.store.state?.scale}`}
                                      width={`${((baseHandleSize - 1) * 2 * handleScale) / this.core.store.state?.scale}`}
                                      height={`${((baseHandleSize - 1) * 2 * handleScale) / this.core.store.state?.scale}`}
                                      style={{
                                        fill: 'var(--kritzel-selection-handle-color, #ffffff)',
                                        stroke: selectionHandleStrokeColor,
                                        strokeWidth: `calc(2px * ${handleScale} / ${this.core.store.state?.scale})`,
                                        paintOrder: 'fill',
                                      }}
                                    />
                                    <rect
                                      class="resize-handle-overlay bottom-left"
                                      x={`${(-baseHandleTouchSize * handleScale) / this.core.store.state?.scale}`}
                                      y={`${object.totalHeight - (baseHandleTouchSize * handleScale) / this.core.store.state?.scale}`}
                                      width={`${(baseHandleTouchSize * 2 * handleScale) / this.core.store.state?.scale}`}
                                      height={`${(baseHandleTouchSize * 2 * handleScale) / this.core.store.state?.scale}`}
                                      style={{
                                        fill: 'transparent',
                                        paintOrder: 'fill',
                                      }}
                                    />

                                    <rect
                                      class="resize-handle bottom-right"
                                      x={`${object.totalWidth - ((baseHandleSize - 1) * handleScale) / this.core.store.state?.scale}`}
                                      y={`${object.totalHeight - ((baseHandleSize - 1) * handleScale) / this.core.store.state?.scale}`}
                                      width={`${((baseHandleSize - 1) * 2 * handleScale) / this.core.store.state?.scale}`}
                                      height={`${((baseHandleSize - 1) * 2 * handleScale) / this.core.store.state?.scale}`}
                                      style={{
                                        fill: 'var(--kritzel-selection-handle-color, #ffffff)',
                                        stroke: selectionHandleStrokeColor,
                                        strokeWidth: `calc(2px * ${handleScale} / ${this.core.store.state?.scale})`,
                                        paintOrder: 'fill',
                                      }}
                                    />
                                    <rect
                                      class="resize-handle-overlay bottom-right"
                                      x={`${object.totalWidth - (baseHandleTouchSize * handleScale) / this.core.store.state?.scale}`}
                                      y={`${object.totalHeight - (baseHandleTouchSize * handleScale) / this.core.store.state?.scale}`}
                                      width={`${(baseHandleTouchSize * 2 * handleScale) / this.core.store.state?.scale}`}
                                      height={`${(baseHandleTouchSize * 2 * handleScale) / this.core.store.state?.scale}`}
                                      style={{
                                        fill: 'transparent',
                                        paintOrder: 'fill',
                                      }}
                                    />
                                  </g>
                                )}

                                {canRenderRotationHandle && (
                                  <g>
                                    <line
                                      x1={object.totalWidth / 2}
                                      y1="0"
                                      x2={object.totalWidth / 2}
                                      y2={-((15 * handleScale) / this.core.store.state?.scale)}
                                      style={{
                                        stroke: selectionBorderColor,
                                        strokeWidth: `calc(var(--kritzel-selection-border-width, 2px) * ${handleScale} / ${this.core.store.state?.scale})`,
                                      }}
                                    />
                                    <circle
                                      class="rotation-handle"
                                      cx={object.totalWidth / 2}
                                      cy={-((15 * handleScale) / this.core.store.state?.scale)}
                                      r={`${((baseHandleSize - 1) * handleScale) / this.core.store.state?.scale}`}
                                      style={{
                                        fill: 'var(--kritzel-selection-handle-color, #ffffff)',
                                        stroke: selectionHandleStrokeColor,
                                        strokeWidth: `calc(2px * ${handleScale} / ${this.core.store.state?.scale})`,
                                        paintOrder: 'fill',
                                      }}
                                    />
                                    <circle
                                      class="rotation-handle-overlay"
                                      cx={object.totalWidth / 2}
                                      cy={-((15 * handleScale) / this.core.store.state?.scale)}
                                      r={`${(baseHandleTouchSize * handleScale) / this.core.store.state?.scale}`}
                                      style={{
                                        fill: 'transparent',
                                        paintOrder: 'fill',
                                      }}
                                    />
                                  </g>
                                )}
                              </g>
                            )}
                          </g>
                        )}

                        {this.core.displaySelectionLineUI(object) && KritzelClassHelper.isInstanceOf<KritzelLine>(object, 'KritzelLine') && (
                          <g class="selection-line-ui" style={{ pointerEvents: 'none' }}>
                            <g class="selection-line-borders">
                              <path
                                class="selection-line-border"
                                d={this.core.anchorManager.computeClippedLinePath(object, true)}
                                style={{
                                  stroke: selectionBorderColor,
                                  strokeWidth: `calc(var(--kritzel-selection-border-width, 2px) * ${object.scale} / ${this.core.store.state?.scale})`,
                                  strokeLinecap: 'round',
                                  fill: 'none',
                                }}
                              />
                            </g>

                            {!this.isSelecting && !isRemoteSelection && (
                              <g class="selection-line-handles" style={{ pointerEvents: 'auto' }}>
                                <circle
                                  class="selection-line-handle start"
                                  cx={object.startX - object.x}
                                  cy={object.startY - object.y}
                                  r={`${((baseHandleSize - 1) * object.scale) / this.core.store.state?.scale}`}
                                  style={{
                                    fill: isStartHandleHighlighted ? selectionHandleStrokeColor : 'var(--kritzel-selection-handle-color, #000000)',
                                    stroke: selectionHandleStrokeColor,
                                    strokeWidth: `calc(2px * ${object.scale} / ${this.core.store.state?.scale})`,
                                    paintOrder: 'fill',
                                  }}
                                />
                                <circle
                                  class="selection-line-handle-overlay start"
                                  data-testid="line-handle-start"
                                  cx={object.startX - object.x}
                                  cy={object.startY - object.y}
                                  r={`${(baseHandleTouchSize * object.scale) / this.core.store.state?.scale}`}
                                  style={{
                                    fill: 'transparent',
                                    paintOrder: 'fill',
                                  }}
                                />

                                <circle
                                  class="selection-line-handle center"
                                  cx={
                                    object.controlX !== undefined
                                      ? (object.startX + 2 * object.controlX + object.endX) / 4 - object.x
                                      : (object.startX - object.x + object.endX - object.x) / 2
                                  }
                                  cy={
                                    object.controlY !== undefined
                                      ? (object.startY + 2 * object.controlY + object.endY) / 4 - object.y
                                      : (object.startY - object.y + object.endY - object.y) / 2
                                  }
                                  r={`${((baseHandleSize - 1) * object.scale) / this.core.store.state?.scale}`}
                                  style={{
                                    fill: 'var(--kritzel-selection-handle-color, #000000)',
                                    stroke: selectionHandleStrokeColor,
                                    strokeWidth: `calc(2px * ${object.scale} / ${this.core.store.state?.scale})`,
                                    paintOrder: 'fill',
                                  }}
                                />
                                <circle
                                  class="selection-line-handle-overlay center"
                                  data-testid="line-handle-center"
                                  cx={
                                    object.controlX !== undefined
                                      ? (object.startX + 2 * object.controlX + object.endX) / 4 - object.x
                                      : (object.startX - object.x + object.endX - object.x) / 2
                                  }
                                  cy={
                                    object.controlY !== undefined
                                      ? (object.startY + 2 * object.controlY + object.endY) / 4 - object.y
                                      : (object.startY - object.y + object.endY - object.y) / 2
                                  }
                                  r={`${(baseHandleTouchSize * object.scale) / this.core.store.state?.scale}`}
                                  style={{
                                    fill: 'transparent',
                                    paintOrder: 'fill',
                                  }}
                                />

                                <circle
                                  class="selection-line-handle end"
                                  cx={object.endX - object.x}
                                  cy={object.endY - object.y}
                                  r={`${((baseHandleSize - 1) * object.scale) / this.core.store.state?.scale}`}
                                  style={{
                                    fill: isEndHandleHighlighted ? selectionHandleStrokeColor : 'var(--kritzel-selection-handle-color, #000000)',
                                    stroke: selectionHandleStrokeColor,
                                    strokeWidth: `calc(2px * ${object.scale} / ${this.core.store.state?.scale})`,
                                    paintOrder: 'fill',
                                  }}
                                />
                                <circle
                                  class="selection-line-handle-overlay end"
                                  data-testid="line-handle-end"
                                  cx={object.endX - object.x}
                                  cy={object.endY - object.y}
                                  r={`${(baseHandleTouchSize * object.scale) / this.core.store.state?.scale}`}
                                  style={{
                                    fill: 'transparent',
                                    paintOrder: 'fill',
                                  }}
                                />
                              </g>
                            )}
                          </g>
                        )}
                      </svg>
                    );
                  })()}
              </div>
            );
          })}

          {/* Snap indicator for line anchoring */}
          {(() => {
            const data = this.core.anchorManager.getSnapIndicatorRenderData() ?? this.core.anchorManager.getSnapPreviewRenderData();
            if (!data) return null;

            const isActiveSnap = this.core.anchorManager.getSnapIndicatorRenderData() != null;

            return (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="snap-indicator"
                style={{
                  position: 'absolute',
                  left: '0',
                  top: '0',
                  width: '1px',
                  height: '1px',
                  pointerEvents: 'none',
                  zIndex: '9999',
                  overflow: 'visible',
                }}
              >
                <g>
                  {/* Dashed line from edge to center */}
                  {/* Dashed line from edge to center */}
                  {data.snapLinePath ? (
                    <path
                      d={data.snapLinePath}
                      fill="none"
                      style={{
                        stroke: isActiveSnap ? 'var(--kritzel-snap-line-stroke, rgba(0, 0, 0, 0.2))' : 'var(--kritzel-snap-line-stroke, rgba(0, 0, 0, 0.12))',
                        strokeWidth: data.lineStrokeWidth,
                        strokeDasharray: data.dashArray,
                        strokeLinecap: 'round',
                      }}
                    />
                  ) : (
                    data.edgeX !== undefined &&
                    data.edgeY !== undefined && (
                      <line
                        x1={data.edgeX}
                        y1={data.edgeY}
                        x2={data.centerX}
                        y2={data.centerY}
                        style={{
                          stroke: isActiveSnap ? 'var(--kritzel-snap-line-stroke, rgba(0, 0, 0, 0.2))' : 'var(--kritzel-snap-line-stroke, rgba(0, 0, 0, 0.12))',
                          strokeWidth: data.lineStrokeWidth,
                          strokeDasharray: data.dashArray,
                          strokeLinecap: 'round',
                        }}
                      />
                    )
                  )}
                  {/* Center indicator circle */}
                  <circle
                    cx={data.centerX}
                    cy={data.centerY}
                    r={data.indicatorRadius}
                    style={{
                      fill: isActiveSnap
                        ? 'var(--kritzel-snap-indicator-fill, rgba(59, 130, 246, 0.3))'
                        : 'var(--kritzel-snap-indicator-fill-inactive, var(--kritzel-snap-indicator-fill, rgba(59, 130, 246, 0.18)))',
                      stroke: isActiveSnap
                        ? 'var(--kritzel-snap-indicator-stroke, #007bff)'
                        : 'var(--kritzel-snap-indicator-stroke-inactive, var(--kritzel-snap-indicator-stroke, rgba(59, 130, 246, 0.5)))',
                      strokeWidth: data.indicatorStrokeWidth,
                    }}
                  />
                </g>
              </svg>
            );
          })()}

          {/* Anchor lines for selected line objects - show dashed lines from edge to center */}
          {(() => {
            const data = this.core.anchorManager.getAnchorLinesRenderData();
            if (!data) return null;

            return (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="anchor-lines"
                style={{
                  position: 'absolute',
                  left: '0',
                  top: '0',
                  width: '1px',
                  height: '1px',
                  pointerEvents: 'none',
                  zIndex: '9998',
                  overflow: 'visible',
                }}
              >
                {data.startAnchorViz && (
                  <g class="anchor-line-start">
                    {data.startAnchorViz.pathD ? (
                      <path
                        d={data.startAnchorViz.pathD}
                        style={{
                          stroke: 'var(--kritzel-snap-line-stroke, rgba(0, 0, 0, 0.3))',
                          strokeWidth: `${data.lineStrokeWidth}`,
                          strokeDasharray: data.dashArray,
                          strokeLinecap: 'round',
                          fill: 'none',
                        }}
                      />
                    ) : (
                      <line
                        x1={data.startAnchorViz.edgeX}
                        y1={data.startAnchorViz.edgeY}
                        x2={data.startAnchorViz.centerX}
                        y2={data.startAnchorViz.centerY}
                        style={{
                          stroke: 'var(--kritzel-snap-line-stroke, rgba(0, 0, 0, 0.3))',
                          strokeWidth: `${data.lineStrokeWidth}`,
                          strokeDasharray: data.dashArray,
                          strokeLinecap: 'round',
                        }}
                      />
                    )}
                    <circle
                      cx={data.startAnchorViz.centerX}
                      cy={data.startAnchorViz.centerY}
                      r={data.indicatorRadius}
                      style={{
                        fill: 'var(--kritzel-snap-indicator-fill, rgba(59, 130, 246, 0.3))',

                        stroke: 'var(--kritzel-snap-indicator-stroke, #007bff)',
                        strokeWidth: data.indicatorStrokeWidth,
                      }}
                    />
                  </g>
                )}
                {data.endAnchorViz && (
                  <g class="anchor-line-end">
                    {data.endAnchorViz.pathD ? (
                      <path
                        d={data.endAnchorViz.pathD}
                        style={{
                          stroke: 'var(--kritzel-snap-line-stroke, rgba(0, 0, 0, 0.2))',
                          strokeWidth: `${data.lineStrokeWidth}`,
                          strokeDasharray: data.dashArray,
                          strokeLinecap: 'round',
                          fill: 'none',
                        }}
                      />
                    ) : (
                      <line
                        x1={data.endAnchorViz.edgeX}
                        y1={data.endAnchorViz.edgeY}
                        x2={data.endAnchorViz.centerX}
                        y2={data.endAnchorViz.centerY}
                        style={{
                          stroke: 'var(--kritzel-snap-line-stroke, rgba(0, 0, 0, 0.2))',
                          strokeWidth: `${data.lineStrokeWidth}`,
                          strokeDasharray: data.dashArray,
                          strokeLinecap: 'round',
                        }}
                      />
                    )}
                    <circle
                      cx={data.endAnchorViz.centerX}
                      cy={data.endAnchorViz.centerY}
                      r={data.indicatorRadius}
                      style={{
                        fill: 'var(--kritzel-snap-indicator-fill, rgba(59, 130, 246, 0.3))',
                        stroke: 'var(--kritzel-snap-indicator-stroke, #007bff)',
                        strokeWidth: data.indicatorStrokeWidth,
                      }}
                    />
                  </g>
                )}
              </svg>
            );
          })()}
        </div>

        {this.core.store.objects?.hasAwareness && <kritzel-awareness-cursors core={this.core}></kritzel-awareness-cursors>}

        {this.core.store.state?.activeTool?.toolType === 'eraser' && !this.core.store.state.isScaling && <kritzel-cursor-trail core={this.core}></kritzel-cursor-trail>}

        {!this.core.licenseManager.isLicensed && <kritzel-watermark core={this.core} label={this.core.localizationManager.translate('watermark.poweredBy')}></kritzel-watermark>}
      </Host>
    );
  }
}
