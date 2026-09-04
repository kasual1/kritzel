import { KritzelEngine } from '../../components/core/kritzel-engine/kritzel-engine';
import { DEFAULT_ENGINE_CONFIG } from '../../configs/default-engine-config';
import { AlignmentHelper } from '../../helpers/alignment.helper';
import { KritzelAlignment } from '../../enums/alignment.enum';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelSelectionBox } from '../objects/selection-box.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelGroup } from '../objects/group.class';
import { KritzelLine } from '../objects/line.class';
import { KritzelToolRegistry } from '../registries/tool.registry';
import { KritzelStore } from './store.class';
import { KritzelWorkspace, KritzelWorkspaceConfig } from './workspace.class';
import { KritzelObjectMap } from '../structures/object-map.structure';
import { KritzelSyncConfig } from '../../interfaces/sync-config.interface';
import { KritzelAssetStorageConfig } from '../../interfaces/asset-storage-config.interface';
import { KritzelAssetResolver } from '../providers/assets/asset-resolver.class';
import { KritzelAppStateMap } from '../structures/app-state-map.structure';
import { KritzelAnchorManager } from '../managers/anchor.manager';
import { KritzelCursorManager } from '../managers/cursor.manager';
import { KritzelThemeManager } from '../managers/theme.manager';
import { KritzelLocalizationManager } from '../managers/localization.manager';
import { KritzelLicenseManager } from '../managers/license.manager';
import { KritzelBrowserPermissionManager } from '../managers/browser-permission.manager';
import { KritzelClipboardManager } from '../managers/clipboard.manager';
import { KritzelClassHelper } from '../../helpers/class.helper';
import { IKritzelUser } from '../../interfaces/user.interface';

interface InitializeWorkspaceOptions {
  /**
   * When true, no fallback workspace will be created if there is no provided workspace,
   * no last active workspace, and no recent workspace.
   */
  skipFallbackCreation?: boolean;
}

/**
 * Central orchestrator class for the Kritzel canvas system.
 * Manages workspaces, objects, selection, clipboard operations, and coordinates
 * between the engine, store, and various managers.
 */
export class KritzelCore {
  /** The underlying Kritzel engine component */
  private readonly _kritzelEngine: KritzelEngine;
  /** State management store */
  private readonly _store: KritzelStore;
  /** Optional sync configuration for collaborative features */
  private _syncConfig?: KritzelSyncConfig;
  /** Optional asset storage configuration for image / binary payloads */
  private _assetStorageConfig?: KritzelAssetStorageConfig;
  /** Resolves and stores binary assets referenced by canvas objects */
  private readonly _assetResolver: KritzelAssetResolver;
  /** App state map for persistent workspace storage */
  private readonly _appStateMap: KritzelAppStateMap;
  /** Manager for line anchor points and connections */
  private readonly _anchorManager: KritzelAnchorManager;
  /** Manager for cursor states and appearance */
  private readonly _cursorManager: KritzelCursorManager;
  /** Manager for theme styling */
  private readonly _themeManager: KritzelThemeManager;
  /** Manager for localization / translated UI strings */
  private readonly _localizationManager: KritzelLocalizationManager;
  /** Manager for license validation and watermark gating */
  private readonly _licenseManager: KritzelLicenseManager;
  /** Manager for browser permission checks and permission prompts */
  private readonly _permissionManager: KritzelBrowserPermissionManager;
  /** Manager for clipboard copy/cut/paste orchestration */
  private readonly _clipboardManager: KritzelClipboardManager;
  /** Per-core registry of drawing tools (one instance per editor). */
  private readonly _toolRegistry: KritzelToolRegistry;
  /** Optional unique identifier for namespacing storage keys across multiple editor instances */
  private _editorId?: string;
  /** Current user for awareness broadcasting */
  private _user?: IKritzelUser;

  /**
   * Gets the Kritzel engine instance.
   * @returns The KritzelEngine managing rendering and events
   */
  get engine(): KritzelEngine {
    return this._kritzelEngine;
  }

  /**
   * Gets the state store instance.
   * @returns The KritzelStore managing application state
   */
  get store(): KritzelStore {
    return this._store;
  }

  /**
   * Gets the app state map for workspace persistence.
   * @returns The KritzelAppStateMap for storing workspace data
   */
  get appStateMap(): KritzelAppStateMap {
    return this._appStateMap;
  }

  /**
   * Gets the anchor manager for line connections.
   * @returns The KritzelAnchorManager for managing line anchors
   */
  get anchorManager(): KritzelAnchorManager {
    return this._anchorManager;
  }

  /**
   * Gets the cursor manager.
   * @returns The KritzelCursorManager for managing cursor states
   */
  get cursorManager(): KritzelCursorManager {
    return this._cursorManager;
  }

  /**
   * Gets the theme manager.
   * @returns The KritzelThemeManager for managing visual themes
   */
  get themeManager(): KritzelThemeManager {
    return this._themeManager;
  }

  /**
   * Gets the localization manager.
   * @returns The KritzelLocalizationManager for resolving translated UI strings
   */
  get localizationManager(): KritzelLocalizationManager {
    return this._localizationManager;
  }

  /**
   * Gets the license manager.
   * @returns The KritzelLicenseManager for validating licenses and gating the watermark
   */
  get licenseManager(): KritzelLicenseManager {
    return this._licenseManager;
  }

  /**
   * Gets the browser permission manager.
   * @returns The KritzelBrowserPermissionManager for browser permission checks and requests
   */
  get permissionManager(): KritzelBrowserPermissionManager {
    return this._permissionManager;
  }

  /**
   * Gets the tool registry scoped to this core instance.
   * @returns The KritzelToolRegistry owned by this core
   */
  get toolRegistry(): KritzelToolRegistry {
    return this._toolRegistry;
  }

  /**
   * Gets the clipboard manager scoped to this core instance.
   * @returns The KritzelClipboardManager owned by this core
   */
  get clipboardManager(): KritzelClipboardManager {
    return this._clipboardManager;
  }

  /**
   * Gets the editor ID used for namespacing storage keys.
   * @returns The editor ID or undefined if not set
   */
  get editorId(): string | undefined {
    return this._editorId;
  }

  /**
   * Builds a namespaced storage key.
   * When editorId is set, appends it after the base prefix:
   * e.g. 'kritzel-settings' → 'kritzel-settings-homepage'
   * @param base - The base key name (e.g. 'kritzel-settings')
   * @returns The namespaced key
   */
  getStorageKey(base: string): string {
    return this._editorId ? `${base}-${this._editorId}` : base;
  }

  /**
   * Gets the current user.
   */
  get user(): IKritzelUser | undefined {
    return this._user;
  }

  /**
   * Sets the current user and propagates to the active object map's awareness.
   */
  setUser(user?: IKritzelUser): void {
    this._user = user;
    this._store.setLocalUserId(user?.id ?? null);
    this._store.objects?.setLocalUser(user);
  }

  /**
   * Creates a new KritzelCore instance.
   * Initializes the store with default configuration and sets up all managers.
   * @param kritzelEngine - The KritzelEngine component to orchestrate
   * @param editorId - Optional unique identifier for namespacing storage keys
   */
  constructor(kritzelEngine: KritzelEngine, editorId?: string) {
    this._kritzelEngine = kritzelEngine;
    this._editorId = editorId;
    this._store = new KritzelStore(DEFAULT_ENGINE_CONFIG);
    this._appStateMap = new KritzelAppStateMap();
    this._anchorManager = new KritzelAnchorManager(this);
    this._cursorManager = new KritzelCursorManager(this);
    this._themeManager = new KritzelThemeManager(this);
    this._localizationManager = new KritzelLocalizationManager(this);
    this._licenseManager = new KritzelLicenseManager(this);
    this._permissionManager = new KritzelBrowserPermissionManager(this);
    this._clipboardManager = new KritzelClipboardManager(this);
    this._toolRegistry = new KritzelToolRegistry(this);
    this._assetResolver = new KritzelAssetResolver();
    this._assetResolver.setShowInfo(this._store.state.debugInfo?.showAssetResolverInfo ?? false);
  }

  /**
   * Gets the asset resolver responsible for storing and resolving
   * binary payloads (images, etc.) referenced by canvas objects.
   */
  get assetResolver(): KritzelAssetResolver {
    return this._assetResolver;
  }

  /**
   * Sets the synchronization configuration for collaborative features.
   * @param config - The sync configuration or undefined to disable sync
   */
  setSyncConfig(config?: KritzelSyncConfig): void {
    this._syncConfig = config;
  }

  /**
   * Sets the asset storage configuration used for image / binary payloads.
   * Takes effect on the next `initializeYjs` call (or on explicit
   * `initializeAssets` if invoked directly).
   */
  setAssetStorageConfig(config?: KritzelAssetStorageConfig): void {
    this._assetStorageConfig = config;
  }

  /**
   * Sets the editor ID for namespacing storage keys.
   * Must be called before any storage initialization (e.g., in componentWillLoad).
   * Re-initializes the theme manager to pick up the new storage key.
   * @param editorId - The unique identifier for this editor instance
   */
  setEditorId(editorId?: string): void {
    this._editorId = editorId;
    // Re-create theme manager so it picks up the new storage key
    (this as any)._themeManager = new KritzelThemeManager(this);
    // Re-create localization manager so it picks up the new storage key
    (this as any)._localizationManager = new KritzelLocalizationManager(this);
  }

  /**
   * Initializes the Yjs document for collaborative editing.
   * Sets up the app state map with the current sync configuration.
   *
   * Asset storage is initialized separately via {@link initializeAssetStorage}
   * so that it can be deferred until the `assetStorageConfig` prop arrives,
   * mirroring the lazy-init pattern used for sync config.
   */
  async initializeYjs(): Promise<void> {
    await this._appStateMap.initialize(this, this._syncConfig);
  }

  /**
   * Initializes the asset storage layer with the current asset storage
   * configuration. Safe to call multiple times: subsequent calls are
   * no-ops because {@link KritzelAssetResolver.init} is idempotent.
   * To apply a new configuration after initialization, destroy the
   * resolver first or use {@link KritzelEngine.reinitSync}.
   */
  async initializeAssetStorage(): Promise<void> {
    await this._assetResolver.init(this._assetStorageConfig);
    this.warnIfAssetStorageMismatched();
  }

  /**
   * Emits a single warning when the sync config declares at least one
   * network provider but the asset storage config has none. In that
   * scenario images added on this device will not be available to
   * other devices, yielding a broken cross-device experience.
   */
  private warnIfAssetStorageMismatched(): void {
    if (!this._appStateMap.hasNetworkSyncProvider) return;
    if (this._assetResolver.hasRemoteProvider) return;
    console.warn(
      '[Kritzel] A network sync provider is configured, but no remote asset storage provider ' +
        'was found. Images added on this device will only be available locally and will appear ' +
        'broken on other devices. Configure a remote asset provider (e.g. HttpAssetProvider) ' +
        'via the `assetStorage` prop to enable cross-device image sync.',
    );
  }

  /**
   * Load all workspaces from app state map
   */
  private loadWorkspacesFromAppState(): KritzelWorkspace[] {
    return this._appStateMap.allWorkspaces();
  }

  /**
   * Save a workspace to app state map
   */
  private saveWorkspaceToAppState(workspace: KritzelWorkspace): void {
    if (this._appStateMap.has(workspace.id)) {
      this._appStateMap.update(workspace);
    } else {
      this._appStateMap.insert(workspace);
    }
  }

  /**
   * Delete a workspace from app state map
   */
  private deleteWorkspaceFromAppState(workspaceId: string): void {
    this._appStateMap.remove(w => w.id === workspaceId);
  }

  /**
   * Initializes or switches to a workspace.
   * Handles workspace loading from app state, localStorage preferences,
   * viewport state restoration, and ObjectMap initialization.
   * @param workspace - Optional workspace to switch to; if not provided, uses last active or most recent
    * @param options - Optional initialization behavior flags
   */
    async initializeWorkspace(workspace?: KritzelWorkspace, options?: InitializeWorkspaceOptions): Promise<void> {
    // Load all workspaces from app state map
    const workspaces = this.loadWorkspacesFromAppState();
      const shouldCreateEditorScopedFallback = !workspace && !!this._editorId;

    // Find newest created workspace (tie-break by most recently updated)
    const newestCreatedWorkspace = workspaces.length > 0
      ? [...workspaces].sort((a, b) => {
          const diff = b.createdAt.getTime() - a.createdAt.getTime();
          return diff !== 0 ? diff : b.updatedAt.getTime() - a.updatedAt.getTime();
        })[0]
      : null;

    // Check localStorage for last active workspace
    const lastActiveWorkspaceId = localStorage.getItem(this.getStorageKey('kritzel-active-workspace-id'));
    const lastActiveWorkspace = lastActiveWorkspaceId ? workspaces.find(w => w.id === lastActiveWorkspaceId) : null;

    let activeWorkspace: KritzelWorkspace;

    if (workspace) {
      // Use provided workspace
      activeWorkspace = workspace;
      const existing = workspaces.find(w => w.id === workspace.id);
      if (!existing) {
        // New workspace, save it
        activeWorkspace._core = this;
        this.saveWorkspaceToAppState(activeWorkspace);
      }
    } else if (lastActiveWorkspace) {
      // Use last active workspace from localStorage
      activeWorkspace = lastActiveWorkspace;
    } else if (newestCreatedWorkspace && !shouldCreateEditorScopedFallback) {
      // Use newest created workspace
      activeWorkspace = newestCreatedWorkspace;
    } else if (options?.skipFallbackCreation) {
      this._store.state.workspaces = workspaces;
      this._store.state.activeWorkspace = null;
      this.rerender();
      return;
    } else {
      // Create fallback workspace
      activeWorkspace = new KritzelWorkspace({ name: 'New Workspace' });
      activeWorkspace._core = this;
      this.saveWorkspaceToAppState(activeWorkspace);
    }

    // Save active workspace ID to localStorage
    localStorage.setItem(this.getStorageKey('kritzel-active-workspace-id'), activeWorkspace.id);

    // Destroy old ObjectMap if switching workspaces
    if (this._store.objects && this._store.objects.isReady) {
      this._store.objects.destroy();
    }

    // Create new ObjectMap with its own Y.Doc for this workspace
    const objectsMap = new KritzelObjectMap();
    // Assign immediately so the UI shows an empty state while loading,
    // instead of showing the old workspace's objects with the new workspace's viewport
    this._store.state.objects = objectsMap;

    // Set active workspace
    this._store.state.activeWorkspace = activeWorkspace;
    this._store.state.workspaces = this.loadWorkspacesFromAppState();

    // Set viewport from workspace (convert world-space center to screen-space translate)
    const viewport = activeWorkspace.viewport ?? { centerWorldX: 0, centerWorldY: 0, scale: 1 };
    const scale = viewport.scale ?? 1;
    const viewportWidth = this._store.state.viewportWidth;
    const viewportHeight = this._store.state.viewportHeight;
    this._store.state.translateX = viewportWidth / 2 - (viewport.centerWorldX ?? 0) * scale;
    this._store.state.translateY = viewportHeight / 2 - (viewport.centerWorldY ?? 0) * scale;
    this._store.state.scale = scale;

    await objectsMap.initialize(this, activeWorkspace.id, this._syncConfig);

    // Set local user in awareness after object map is initialized
    if (this._user) {
      objectsMap.setLocalUser(this._user);
    }

    // Forward awareness changes to the engine as events
    objectsMap.onAwarenessChange(states => {
      this.engine.emitAwarenessChange(states);
    });

    // Rebuild anchor index after loading objects
    this._anchorManager.rebuildIndex();

    this.engine.emitObjectsChange();

    this.rerender();
  }

  /**
   * Loads a shared workspace by token.
   * If the workspace exists locally, it switches to it.
   * If it doesn't exist, it adds it to the local workspaces list and then switches to it.
   * @param token - The connection token identifying the shared workspace
   */
  async loadSharedWorkspace(token: string): Promise<void> {
    const workspaceId = token;
    const name = 'Shared Workspace';

    // Token is the workspace ID
    let workspace = this.getWorkspaces().find(w => w.id === workspaceId);

    if (!workspace) {
      // Create it if it doesn't exist locally
      workspace = new KritzelWorkspace({ id: workspaceId, name });
      workspace.isPublic = true;
      this.createWorkspace(workspace);
    } else {
      // If it exists, ensure isPublic is correct
      workspace.isPublic = true;
    }

    // Now switch to it
    await this.initializeWorkspace(workspace);
  }

  /**
   * Gets all objects currently visible within the viewport bounds.
   * Excludes selection-related objects and sorts by z-index.
   * @returns Array of visible objects sorted by z-index ascending
   */
  getObjectsInViewport(): KritzelBaseObject<any>[] {
    const viewportBounds = {
      x: -this._store.state.translateX / this._store.state.scale,
      y: -this._store.state.translateY / this._store.state.scale,
      z: this._store.state.scale,
      width: this._store.state.viewportWidth / this._store.state.scale,
      height: this._store.state.viewportHeight / this._store.state.scale,
      depth: 100,
    };

    if(!this._store.objects) {
      return [];
    }

    return this._store.objects
      .query(viewportBounds)
      .filter(obj => !(obj instanceof KritzelSelectionGroup) && !(obj instanceof KritzelSelectionBox))
      .sort((a, b) => a.zIndex - b.zIndex);
  }

  /**
   * Forces a rerender of the engine component.
   * Increments forceUpdate counter to trigger Stencil's reactivity.
   */
  rerender() {
    if (this._kritzelEngine) {
      this._kritzelEngine.forceUpdate++;
    }
  }

  /**
   * Finds an object in the store by its unique identifier.
   * @param id - The unique ID of the object to find
   * @returns The found object or null if not found
   */
  findObjectById(id: string): KritzelBaseObject<any> | null {
    for (const object of this._store.allObjects) {
      if (object.id === id) {
        return object;
      }
    }
    return null;
  }

  /**
   * Gets all workspaces from the app state map.
   * @returns Array of all available workspaces
   */
  getWorkspaces(): KritzelWorkspace[] {
    return this.loadWorkspacesFromAppState();
  }

  /**
   * Switches the active workspace in the editor by ID.
   * @param workspaceId - The unique ID of the workspace to activate
   */
  async setActiveWorkspace(workspaceId: string): Promise<void> {
    const workspaces = this.getWorkspaces();
    const target = workspaces.find(w => w.id === workspaceId);
    if (!target) {
      console.warn(`[KritzelCore] Cannot set active workspace: No workspace found with ID '${workspaceId}'`);
      return;
    }

    this.beforeWorkspaceChange();
    await this.initializeWorkspace(target);
  }

  /**
   * Creates a new workspace and saves it to the app state.
   * Accepts either a KritzelWorkspace instance or a configuration object.
   * Optionally seeds initial objects and automatically activates the workspace.
   * @param workspaceOrConfig - The workspace instance or configuration options
   * @returns The created workspace instance
   */
  async createWorkspace(workspaceOrConfig: KritzelWorkspace | KritzelWorkspaceConfig): Promise<KritzelWorkspace> {
    const workspace = workspaceOrConfig instanceof KritzelWorkspace
      ? workspaceOrConfig
      : new KritzelWorkspace(workspaceOrConfig);

    const config = workspaceOrConfig instanceof KritzelWorkspace
      ? undefined
      : workspaceOrConfig;

    workspace._core = this;
    workspace.createdAt = new Date();
    workspace.updatedAt = new Date();
    this.saveWorkspaceToAppState(workspace);
    this._store.state.workspaces = this.loadWorkspacesFromAppState();

    const shouldActivate = config?.activate ?? false;
    const seedObjects = config?.objects;

    if (shouldActivate) {
      await this.setActiveWorkspace(workspace.id);
      if (seedObjects && seedObjects.length > 0) {
        for (const obj of seedObjects) {
          await this.engine.addObject(obj);
        }
      }
    } else if (seedObjects && seedObjects.length > 0) {
      // Seed objects into inactive workspace via a temporary KritzelObjectMap
      const tempMap = new KritzelObjectMap();
      await tempMap.initialize(this, workspace.id, this._syncConfig);
      for (const obj of seedObjects) {
        obj.workspaceId = workspace.id;
        tempMap.insert(obj);
      }
      tempMap.destroy();
    }

    return workspace;
  }

  /**
   * Updates an existing workspace in the app state.
   * Sets the update timestamp and refreshes the local workspaces list.
   * @param workspace - The workspace with updated properties
   */
  updateWorkspace(workspace: KritzelWorkspace): void {
    workspace.updatedAt = new Date();
    this.saveWorkspaceToAppState(workspace);

    // Keep metadata map in sync when the active workspace's name changes
    if (this._store.state.activeWorkspace?.id === workspace.id) {
      this._store.objects?.setWorkspaceName(workspace.name);
    }

    const workspaces = this._store.state.workspaces;
    const index = workspaces.findIndex(w => w.id === workspace.id);

    if (index !== -1) {
      workspaces[index] = workspace;
      this._store.state.workspaces = workspaces;
    }
  }

  /**
   * Deletes a workspace and its associated data.
   * Handles cleanup of active workspace ObjectMap if deleting the current workspace.
   * Also deletes the workspace's IndexedDB database.
   * @param workspace - The workspace to delete
   */
  deleteWorkspace(workspace: KritzelWorkspace): void {
    // If deleting the active workspace, need to handle ObjectMap cleanup
    if (this._store.state.activeWorkspace?.id === workspace.id) {
      this.engine.viewport?.cancelPendingUpdates();
      this._store.objects?.destroy();
    }

    this.deleteWorkspaceFromAppState(workspace.id);
    this._store.state.workspaces = this.loadWorkspacesFromAppState();

    // Also delete the workspace's IndexedDB database
    const dbName = this._editorId
      ? `kritzel-workspace-${this._editorId}-${workspace.id}`
      : `kritzel-workspace-${workspace.id}`;
    window.indexedDB.deleteDatabase(dbName);
  }

  /**
   * Persists the current viewport state to the active workspace.
   * Converts screen-space translate values to device-independent world-space center coordinates.
   * Validates that the workspace still exists before saving.
   * @param translateX - The X translation of the viewport
   * @param translateY - The Y translation of the viewport
   * @param scale - The zoom scale of the viewport
   */
  updateWorkspaceViewport(translateX: number, translateY: number, scale: number): void {
    const activeWorkspace = this._store.state.activeWorkspace;
    if (!activeWorkspace) {
      return;
    }

    // Check if the workspace is still valid (not deleted)
    const isValid = this._store.state.workspaces.some(w => w.id === activeWorkspace.id);
    if (!isValid) {
      return;
    }

    // Convert screen-space translate to device-independent world-space center
    const viewportWidth = this._store.state.viewportWidth;
    const viewportHeight = this._store.state.viewportHeight;
    const centerWorldX = (viewportWidth / 2 - translateX) / scale;
    const centerWorldY = (viewportHeight / 2 - translateY) / scale;

    activeWorkspace.viewport = { centerWorldX, centerWorldY, scale };
    activeWorkspace.updatedAt = new Date();
    this.saveWorkspaceToAppState(activeWorkspace);
  }

  /**
   * Gets whether the active workspace is publicly accessible.
   * @returns True if the workspace is public, false otherwise
   */
  getIsPublic(): boolean {
    return this._store.state.activeWorkspace?.isPublic ?? false;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Object Management Methods
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Adds an object to the current workspace's object map.
   * @param object - The object to add to the canvas
   */
  addObject(object: KritzelBaseObject<any>): void {
    this._store.objects.insert(object);
  }

  /**
   * Removes an object from the workspace.
   * Handles recursive deletion of group children (unless preserved),
   * cleans up line anchors, and removes from the object map.
   * @param object - The object to remove
   * @param preserveChildren - If true and object is a group, children are kept; defaults to false
   */
  removeObject(object: KritzelBaseObject<any>, preserveChildren: boolean = false): void {
    // Handle KritzelGroup: recursively delete all children first (unless preserveChildren is true)
    if (KritzelClassHelper.isInstanceOf<KritzelGroup>(object, 'KritzelGroup') && !preserveChildren) {
      // Get children before removing the group
      const children = [...object.children];
      children.forEach(child => {
        this.removeObject(child);
      });
    }

    // Unmount dynamic objects before removal
    if (KritzelClassHelper.isInstanceOf<any>(object, 'KritzelDynamicObject')) {
      (object as any).unmount();
    }

    // Handle anchor cleanup
    if (KritzelClassHelper.isInstanceOf<KritzelLine>(object, 'KritzelLine')) {
      // If removing a line, clean up its anchor index entries
      this._anchorManager.handleLineDeleted(object.id);
    } else {
      // If removing a non-line object, detach any lines anchored to it
      this._anchorManager.handleObjectDeleted(object.id);
    }

    object.isMounted = false;
    this._store.objects.remove(o => o.id === object.id);
  }

  /**
   * Updates properties on an object and persists the changes.
   * Calls the object's onAfterUpdate hook with changed property keys.
   * @typeParam T - The type of the object being updated
   * @param object - The object to update
   * @param updatedProperties - Partial object containing properties to update
   */
  updateObject<T extends KritzelBaseObject<any>>(object: T, updatedProperties: Partial<T>): void {
    const changedKeys: string[] = [];

    for (const key in updatedProperties) {
      if (updatedProperties.hasOwnProperty(key)) {
        const value = updatedProperties[key as keyof T];
        if (value !== undefined) {
          (object as any)[key] = value;
          changedKeys.push(key);
        }
      }
    }

    object.onAfterUpdate(changedKeys);
    this._store.objects.update(object);
  }

  /**
   * Adds a selection group to the canvas.
   * Removes any existing selection group and selection box first.
   * Triggers the selection change event.
   * @param selectionGroup - The selection group to add
   */
  addSelectionGroup(selectionGroup: KritzelSelectionGroup): void {
    this.removeLocalSelectionGroups();
    this.removeSelectionBox();

    for (const object of selectionGroup.objects ?? []) {
      if (KritzelClassHelper.isInstanceOf<KritzelBaseObject<any>>(object, 'KritzelDynamicObject')) {
        const dynamicObject = object as KritzelBaseObject<any> & { setIsInteractive?: (isInteractive: boolean) => void };
        if (typeof dynamicObject.setIsInteractive === 'function') {
          dynamicObject.setIsInteractive(true);
        } else {
          dynamicObject.isInteractive = true;
        }
      }
    }

    this._store.objects.insert(selectionGroup);
    this._store.setSelectionGroup(selectionGroup);
    this._kritzelEngine.triggerSelectionChange();
  }

  /**
   * Returns whether the provided selection group belongs to the local user context.
   * Local groups are either explicitly owned by the current user or have no user ID.
   */
  private isLocalSelectionGroup(selectionGroup: KritzelSelectionGroup): boolean {
    const localUserId = this._user?.id;
    return localUserId == null || selectionGroup.userId === localUserId || selectionGroup.userId == null;
  }

  /**
   * Applies deselection teardown side effects to a selection group before removal.
   */
  private teardownSelectionGroup(selectionGroup: KritzelSelectionGroup): void {
    selectionGroup.deselectAllChildren?.();

    for (const object of selectionGroup.objects ?? []) {
      if (KritzelClassHelper.isInstanceOf<KritzelBaseObject<any>>(object, 'KritzelDynamicObject')) {
        const dynamicObject = object as KritzelBaseObject<any> & { setIsInteractive?: (isInteractive: boolean) => void };
        if (typeof dynamicObject.setIsInteractive === 'function') {
          dynamicObject.setIsInteractive(false);
        } else {
          dynamicObject.isInteractive = false;
        }
      }
    }
  }

  /**
   * Removes all local selection groups from the store, including orphaned groups
   * that are no longer referenced by store.selectionGroup.
   * @returns True when at least one local selection group was removed
   */
  private removeLocalSelectionGroups(): boolean {
    const allSelectionGroupsInStore = this._store.objects
      .allObjects()
      .filter((object): object is KritzelSelectionGroup => {
        return object instanceof KritzelSelectionGroup || KritzelClassHelper.isInstanceOf<KritzelSelectionGroup>(object, 'KritzelSelectionGroup');
      });

    const allLocalSelectionGroups = allSelectionGroupsInStore.filter(selectionGroup => this.isLocalSelectionGroup(selectionGroup));

    const currentSelectionGroup = this._store.selectionGroup;
    if (
      currentSelectionGroup &&
      this.isLocalSelectionGroup(currentSelectionGroup) &&
      !allLocalSelectionGroups.some(group => group.id === currentSelectionGroup.id)
    ) {
      allLocalSelectionGroups.push(currentSelectionGroup);
    }

    if (allLocalSelectionGroups.length === 0) {
      return false;
    }

    for (const selectionGroup of allLocalSelectionGroups) {
      this.teardownSelectionGroup(selectionGroup);
    }

    const localSelectionGroupIds = new Set(allLocalSelectionGroups.map(group => group.id));

    this._store.objects.remove(object => localSelectionGroupIds.has(object.id));
    this._store.setSelectionGroup(null);
    return true;
  }

  /**
   * Removes the current selection group from the canvas.
   * Clears the cached reference and triggers the selection change event.
   */
  removeSelectionGroup(): void {
    const removedAnySelectionGroup = this.removeLocalSelectionGroups();
    if (removedAnySelectionGroup) {
      this._kritzelEngine.triggerSelectionChange();
    }
  }

  /**
   * Removes the current selection box from the canvas.
   * Clears the cached reference.
   */
  removeSelectionBox(): void {
    const selectionBox = this._store.selectionBox;
    if (selectionBox) {
      this._store.objects.remove(object => object.id === selectionBox.id);
      this._store.setSelectionBox(null);
      this._store.objects.clearLocalSelectionBox();
    }
  }

  /**
   * Deselects all objects by removing the selection group.
   * Triggers a rerender.
   */
  deselectAllObjects(): void {
    this.removeSelectionGroup();
    this.rerender();
  }

  /**
   * Deletes all objects in the current selection group.
   * Removes the selection group and emits viewport change event.
   */
  delete() {
    const selectionGroup = this._store.selectionGroup;
    if (!selectionGroup) {
      return;
    }

    // Seal the selection group's creation into its own undo step so Yjs
    // doesn't collapse create+delete of the SG into a no-op on undo.
    this._store.objects.stopUndoCapturing();

    this._store.objects.transaction(() => {
      selectionGroup.objects.forEach(obj => this.removeObject(obj));
      this.removeSelectionGroup();
    });

    // Close the deletion step so subsequent unrelated changes start a new step.
    this._store.objects.stopUndoCapturing();

    this.engine.emitObjectsInViewportChange();
    this.rerender();
  }

  /**
   * Undoes the last action in the history stack.
   */
  undo(): void {
    this._store.objects?.undo();
  }

  /**
   * Redoes the last undone action from the history stack.
   */
  redo(): void {
    this._store.objects?.redo();
  }

  /**
   * Deletes a specific object by its ID.
   * Emits viewport change event and triggers rerender.
   * @param id - The unique ID of the object to delete
   */
  deleteObject(id: string) {
    const object = this.findObjectById(id);
    if (object) {
      this.removeObject(object);
      this.engine.emitObjectsInViewportChange();
      this.rerender();
    }
  }

  /**
   * Moves objects one step forward in the z-order stack.
   * @param object - Optional specific object to move; defaults to all selected objects
   */
  bringForward(object?: KritzelBaseObject<any>) {
    const selectionGroup = this._store.selectionGroup;
    const objects = object ? [object] : selectionGroup?.objects || [];
    const allNonSelectionObjectsWithoutCurrent = this._store.allNonSelectionObjects.filter(o => objects.findIndex(obj => obj.id === o.id) === -1);
    const max = allNonSelectionObjectsWithoutCurrent.length > 0 ? Math.max(...allNonSelectionObjectsWithoutCurrent.map(obj => obj.zIndex)) + 1 : 0;

    objects.forEach(obj => {
      if (obj.zIndex !== max) {
        this.updateObject(obj, { zIndex: obj.zIndex + 1 });
      }
    });

    this.rerender();
  }

  /**
   * Moves objects one step backward in the z-order stack.
   * @param object - Optional specific object to move; defaults to all selected objects
   */
  sendBackward(object?: KritzelBaseObject<any>) {
    const selectionGroup = this._store.selectionGroup;
    const objects = object ? [object] : selectionGroup?.objects || [];
    const allNonSelectionObjectsWithoutCurrent = this._store.allNonSelectionObjects.filter(o => objects.findIndex(obj => obj.id === o.id) === -1);
    const min = allNonSelectionObjectsWithoutCurrent.length > 0 ? Math.min(...allNonSelectionObjectsWithoutCurrent.map(obj => obj.zIndex)) - 1 : 0;

    objects.forEach(obj => {
      if (obj.zIndex !== min) {
        this.updateObject(obj, { zIndex: obj.zIndex - 1 });
      }
    });

    this.rerender();
  }

  /**
   * Moves objects to the very front of the z-order stack.
   * @param object - Optional specific object to move; defaults to all selected objects
   */
  bringToFront(object?: KritzelBaseObject<any>) {
    const selectionGroup = this._store.selectionGroup;
    const objects = object ? [object] : selectionGroup?.objects || [];
    const allNonSelectionObjectsWithoutCurrent = this._store.allNonSelectionObjects.filter(o => objects.findIndex(obj => obj.id === o.id) === -1);
    const max = Math.max(...allNonSelectionObjectsWithoutCurrent.map(obj => obj.zIndex)) + 1;

    objects.forEach(obj => {
      this.updateObject(obj, { zIndex: max });
    });

    this.rerender();
  }

  /**
   * Moves objects to the very back of the z-order stack.
   * @param object - Optional specific object to move; defaults to all selected objects
   */
  sendToBack(object?: KritzelBaseObject<any>) {
    const selectionGroup = this._store.selectionGroup;
    const objects = object ? [object] : selectionGroup?.objects || [];
    const allNonSelectionObjectsWithoutCurrent = this._store.allNonSelectionObjects.filter(o => objects.findIndex(obj => obj.id === o.id) === -1);
    const min = Math.min(...allNonSelectionObjectsWithoutCurrent.map(obj => obj.zIndex)) - 1;

    objects.forEach(obj => {
      this.updateObject(obj, { zIndex: min });
    });

    this.rerender();
  }

  /**
   * Aligns objects within the current selection group based on the specified alignment type.
   * Requires at least 2 objects to be selected.
   * @param alignment The alignment type to apply
   */
  alignObjects(alignment: KritzelAlignment): void {
    const selectionGroup = this._store.selectionGroup;
    if (!selectionGroup || selectionGroup.objects.length < 2) {
      return;
    }

    const objects = selectionGroup.objects;
    const alignedPositions = AlignmentHelper.calculateAlignedPositions(objects, alignment);

    this._store.objects.transaction(() => {
      for (const obj of objects) {
        const newPosition = alignedPositions.get(obj.id);
        if (newPosition) {
          this.updateObject(obj, {
            translateX: newPosition.translateX,
            translateY: newPosition.translateY,
          } as Partial<typeof obj>);
        }
      }
    });

    selectionGroup.refreshObjectDimensions();
    this.rerender();
  }

  /**
   * Groups the currently selected objects into a KritzelGroup.
   * Requires at least 2 objects to be selected.
   */
  group(): void {
    const selectionGroup = this._store.selectionGroup;
    if (!selectionGroup || selectionGroup.objects.length < 2) {
      return;
    }

    // Create a group from the selected objects
    const group = KritzelGroup.createFromObjects(this, selectionGroup.objects);

    // Add the group to the object store
    this.addObject(group);

    // Remove the selection group and create a new one with just the group
    this.removeSelectionGroup();

    const newSelectionGroup = KritzelSelectionGroup.create(this);
    newSelectionGroup.addOrRemove(group);
    newSelectionGroup.isSelected = true;
    newSelectionGroup.rotation = group.rotation;
    this.addSelectionGroup(newSelectionGroup);

    this.engine.emitObjectsChange();
    this.rerender();
  }

  /**
   * Ungroups any KritzelGroup objects in the current selection.
   * Children are extracted and become top-level objects.
   */
  ungroup(): void {
    const selectionGroup = this._store.selectionGroup;
    if (!selectionGroup) {
      return;
    }

    const groups = selectionGroup.objects.filter(obj => KritzelClassHelper.isInstanceOf<KritzelGroup>(obj, 'KritzelGroup')) as KritzelGroup[];
    if (groups.length === 0) {
      return;
    }

    // Collect all children from all groups
    const allChildren: KritzelBaseObject<any>[] = [];
    const nonGroupObjects = selectionGroup.objects.filter(obj => !KritzelClassHelper.isInstanceOf<KritzelGroup>(obj, 'KritzelGroup'));

    groups.forEach(group => {
      // Get children before removing the group
      const children = group.ungroup();
      allChildren.push(...children);

      // Remove the group from the store (but keep children)
      this.removeObject(group, true);
    });

    // Create a new selection group with all the ungrouped children and non-group objects
    this.removeSelectionGroup();

    const newSelectionGroup = KritzelSelectionGroup.create(this);
    [...allChildren, ...nonGroupObjects].forEach(child => {
      newSelectionGroup.addOrRemove(child);
    });
    newSelectionGroup.isSelected = true;
    this.addSelectionGroup(newSelectionGroup);

    this.engine.emitObjectsChange();
    this.rerender();
  }

  /**
   * Creates a selection from the given objects.
   * Clears existing selection, creates a selection group, and marks objects as selected.
   * @param objects - Array of objects to select; no-op if empty
   */
  selectObjects(objects: KritzelBaseObject<any>[]) {
    if (objects.length === 0) {
      return;
    }

    const selectionGroup = KritzelSelectionGroup.create(this);
    objects.forEach(obj => {
      obj.isSelected = false;
      selectionGroup.addOrRemove(obj);
    });

    selectionGroup.isSelected = true;

    if (objects.length === 1) {
      selectionGroup.rotation = selectionGroup.objects[0].rotation;
    }

    this.addSelectionGroup(selectionGroup);
    this.rerender();
  }

  /**
   * Selects all objects in the workspace.
   * Excludes selection-related objects.
   * Switches to selection tool.
   */
  selectAllObjects() {
    const allObjects = this._store.objects
      .allObjects()
      .filter(o => !(o instanceof KritzelSelectionGroup) && !(o instanceof KritzelSelectionBox));

    if (allObjects.length > 0) {
      const selectionGroup = KritzelSelectionGroup.create(this);

      allObjects.forEach(obj => {
        obj.isSelected = false;
        selectionGroup.addOrRemove(obj);
      });

      selectionGroup.isSelected = true;

      this._store.state.isSelecting = false;

      if (allObjects.length === 1) {
        selectionGroup.rotation = selectionGroup.objects[0].rotation;
      }

      this.addSelectionGroup(selectionGroup);
      this._store.setState('activeTool', this._toolRegistry.getTool('selection'));
      this.rerender();
    }
  }

  /**
   * Selects all objects currently visible in the viewport.
   * Excludes selection-related objects.
   * Switches to selection tool.
   */
  selectAllObjectsInViewport() {
    const viewportBounds = {
      x: -this._store.state.translateX / this._store.state.scale,
      y: -this._store.state.translateY / this._store.state.scale,
      z: this._store.state.scale,
      width: this._store.state.viewportWidth / this._store.state.scale,
      height: this._store.state.viewportHeight / this._store.state.scale,
      depth: 100,
    };

    const objectsInViewport = this._store.objects
      .query(viewportBounds)
      .filter(o => o.isInViewport())
      .filter(o => !(o instanceof KritzelSelectionGroup) && !(o instanceof KritzelSelectionBox));

    if (objectsInViewport.length > 0) {
      const selectionGroup = KritzelSelectionGroup.create(this);

      objectsInViewport.forEach(obj => {
        obj.isSelected = false;
        selectionGroup.addOrRemove(obj);
      });

      selectionGroup.isSelected = true;

      this._store.state.isSelecting = false;

      if (objectsInViewport.length === 1) {
        selectionGroup.rotation = selectionGroup.objects[0].rotation;
      }

      this.addSelectionGroup(selectionGroup);
      this._store.setState('activeTool', this._toolRegistry.getTool('selection'));
      this.rerender();
    }
  }

  /**
   * Clears all selection state.
   * Removes selection group and box, resets selection-related flags.
   */
  clearSelection() {
    this.removeSelectionGroup();

    const localUserId = this._user?.id;
    this._store.objects.remove(o =>
      o instanceof KritzelSelectionBox ||
      (o instanceof KritzelSelectionGroup && (localUserId == null || o.userId === localUserId || o.userId == null)),
    );
    this._store.setSelectionBox(null);
    this._store.setSelectionGroup(null);

    for (const object of this._store.allNonSelectionObjects) {
      if (object.isSelected) {
        object.isSelected = false;
      }
    }

    this._store.state.isSelecting = false;
    this._store.state.isResizeHandleSelected = false;
    this._store.state.isRotationHandleSelected = false;
    this._store.state.isLineHandleSelected = false;
    this._store.state.isLineHandleDragging = false;
    this._store.state.lineHandleType = undefined;

    this.rerender();
  }

  /**
   * Resets the active text object.
   * Deletes empty text objects or saves non-empty ones.
   */
  resetActiveText() {
    const activeText = this._store.activeText;
    if (activeText) {
      if (activeText.isEmpty) {
        this.deleteObject(activeText.id);
      } else {
        activeText.save();
      }
    }
  }

  /**
   * Resets the active shape object by saving it.
   */
  resetActiveShape() {
    const activeShape = this._store.activeShape;
    if (activeShape) {
      activeShape.save();
    }
  }

  /**
   * Gets the topmost object at a pointer event location that matches a selector.
   * Performs hit testing to verify the object is actually under the pointer.
   * @param event - The pointer event with client coordinates
   * @param selector - CSS selector to match elements; defaults to '.object'
   * @returns The matched object or null if none found or hit test fails
   */
  getObjectFromPointerEvent(event: PointerEvent, selector = '.object'): KritzelBaseObject<any> | null {
    const shadowRoot = this._store.state.host?.shadowRoot;
    if (!shadowRoot) return null;

    const clientX = event.clientX;
    const clientY = event.clientY;

    const elementAtPoint = shadowRoot.elementFromPoint(clientX, clientY);
    if (!elementAtPoint) return null;

    const selectedObject = elementAtPoint.closest(selector) as HTMLElement | null;

    if (selectedObject) {
      const foundObject = this._store.allObjects.find(object => selectedObject.id === object.id);

      if (!foundObject) return null;

      const isHit = foundObject.hitTest(clientX, clientY);
      return isHit ? foundObject : null;
    }

    return null;
  }

  /**
   * Gets all objects at a pointer event location that match a selector.
   * Returns objects sorted by z-index (highest first) for proper layering.
   * @param event - The pointer event with client coordinates
   * @param selector - CSS selector to match elements; defaults to '.object'
   * @returns Array of matched objects sorted by z-index descending
   */
  getObjectsFromPointerEvent(event: PointerEvent, selector = '.object'): KritzelBaseObject<any>[] {
    const shadowRoot = this._store.state.host?.shadowRoot;
    if (!shadowRoot) return [];

    const clientX = event.clientX;
    const clientY = event.clientY;

    const elementsAtPoint = shadowRoot.elementsFromPoint(clientX, clientY);
    if (!elementsAtPoint || elementsAtPoint.length === 0) return [];

    const objectIds = new Set<string>();

    elementsAtPoint.forEach(element => {
      const selectedObject = element.closest(selector) as HTMLElement | null;
      if (selectedObject && selectedObject.id) {
        objectIds.add(selectedObject.id);
      }
    });

    if (objectIds.size > 0) {
      return this._store.allObjects.filter(object => objectIds.has(object.id)).sort((a, b) => b.zIndex - a.zIndex);
    }

    return [];
  }

  /**
   * Get all elements at a pointer position that match a given selector.
   * Uses elementsFromPoint to find overlapped elements.
   */
  getElementsAtPoint(event: PointerEvent, selector: string): Element[] {
    const shadowRoot = this._store.state.host?.shadowRoot;
    if (!shadowRoot) return [];

    const elementsAtPoint = shadowRoot.elementsFromPoint(event.clientX, event.clientY);
    if (!elementsAtPoint || elementsAtPoint.length === 0) return [];

    return elementsAtPoint.filter(el => el.matches(selector));
  }

  /**
   * Check if any element at the pointer position matches the given selector.
   * Useful for detecting hover states on overlapped elements.
   */
  isPointerOverElement(event: PointerEvent, selector: string): boolean {
    return this.getElementsAtPoint(event, selector).length > 0;
  }

  /**
   * Converts a pointer event to canvas (world) coordinates.
   * Accounts for host element offset and viewport transform.
   * @param event - The pointer event with client coordinates
   * @returns Object with x and y in canvas coordinates
   */
  getCanvasPoint(event: PointerEvent): { x: number; y: number } {
    if (!this._store.state.host) {
      return { x: 0, y: 0 };
    }

    const hostRect = this._store.state.host.getBoundingClientRect();

    const xRelativeToHost = event.clientX - hostRect.left;
    const yRelativeToHost = event.clientY - hostRect.top;

    const xWithoutTranslate = xRelativeToHost - this._store.state.translateX;
    const yWithoutTranslate = yRelativeToHost - this._store.state.translateY;

    const worldX = xWithoutTranslate / this._store.state.scale;
    const worldY = yWithoutTranslate / this._store.state.scale;

    return { x: worldX, y: worldY };
  }

  /**
   * Prepares the engine for a workspace change.
   * Cancels pending viewport updates, saves current viewport state,
   * resets active text, clears selection, and switches to selection tool.
   */
  beforeWorkspaceChange() {
    // Cancel any pending debounced viewport updates to prevent them from
    // saving the old workspace's viewport to the new workspace
    this._kritzelEngine.viewport?.cancelPendingUpdates();

    // Immediately save the current workspace's viewport before switching
    const currentWorkspace = this._store.state.activeWorkspace;
    if (currentWorkspace) {
      this.updateWorkspaceViewport(
        this._store.state.translateX,
        this._store.state.translateY,
        this._store.state.scale
      );
    }

    this.resetActiveText();
    this.clearSelection();
    this._store.setState('activeTool', this._toolRegistry.getTool('selection'));
  }

  /**
   * Determines whether to display the selection group UI for an object.
   * Hides UI for single KritzelLine selections (they have their own UI).
   * @param object - The object to check
   * @returns True if selection group UI should be displayed
   */
  displaySelectionGroupUI(object: KritzelBaseObject<any>): boolean {
    if (!object.isSelected) {
      return false;
    }

    // Remote selection groups always show group UI (border only, no handles)
    if (object instanceof KritzelSelectionGroup && this._user?.id != null && object.userId != null && object.userId !== this._user.id) {
      return true;
    }

    const selectionGroup = this._store.selectionGroup;
    if (!selectionGroup) {
      // During selection phase (no group yet), hide UI for KritzelLine objects
      return !(object instanceof KritzelLine);
    }

    // Once a local selection group exists, only the selection-group object
    // should render group UI (children remain selected but don't render handles).
    if (!(object instanceof KritzelSelectionGroup) || object.id !== selectionGroup.id) {
      return false;
    }

    // Show UI if selection contains more than one object
    if (selectionGroup.objects.length > 1) {
      return true;
    }

    // Hide UI if selection contains a single KritzelLine
    if (selectionGroup.objects.length === 1) {
      const selectedObject = selectionGroup.objects[0];
      return !(selectedObject instanceof KritzelLine);
    }

    return true;
  }

  /**
   * Determines whether to display the line-specific selection UI for an object.
   * Shows line UI only for single KritzelLine selections.
   * @param object - The object to check
   * @returns True if line selection UI should be displayed
   */
  displaySelectionLineUI(object: KritzelBaseObject<any>): boolean {
    // Only show line UI on KritzelLine objects, not on selection groups
    if (!(object instanceof KritzelLine)) {
      return false;
    }

    // During selection phase (no group yet), show line UI if line is selected
    const selectionGroup = this._store.selectionGroup;
    if (!selectionGroup) {
      return object.isSelected;
    }

    if (!selectionGroup.isSelected) {
      return false;
    }

    // Show UI only if selection contains exactly one KritzelLine and it's this object
    if (selectionGroup.objects.length === 1) {
      const selectedObject = selectionGroup.objects[0];
      return selectedObject instanceof KritzelLine && selectedObject.id === object.id;
    }

    return false;
  }
}
