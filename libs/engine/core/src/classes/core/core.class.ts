import type { KritzelEngineHost } from '../../interfaces/engine-host.interface';
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
import { KritzelWorkspace } from './workspace.class';
import { KritzelObjectMap } from '../structures/object-map.structure';
import { KritzelSyncConfig } from '../../interfaces/sync-config.interface';
import { KritzelAssetStorageConfig } from '../../interfaces/asset-storage-config.interface';
import { KritzelAssetResolver } from '../providers/assets/asset-resolver.class';
import { KritzelAppStateMap } from '../structures/app-state-map.structure';
import { KritzelAnchorManager } from '../managers/anchor.manager';
import { KritzelCursorManager } from '../managers/cursor.manager';
import { KritzelThemeManager } from '../managers/theme.manager';
import { KritzelLocalizationManager } from '../managers/localization.manager';
import { KritzelBrowserPermissionManager } from '../managers/browser-permission.manager';
import { KritzelClipboardManager } from '../managers/clipboard.manager';
import { KritzelAgenticCursorManager } from '../managers/agentic-cursor.manager';
import { KritzelObjectTitlebarManager } from '../managers/object-titlebar.manager';
import { KritzelObjectConfigManager } from '../managers/object-config.manager';
import { KritzelClassHelper } from '../../helpers/class.helper';
import { ObjectHelper } from '../../helpers/object.helper';
import { KritzelZOrderHelper, KritzelZOrderItem, KritzelZOrderOperation } from '../../helpers/z-order.helper';
import { IKritzelUser } from '../../interfaces/user.interface';
import type { KritzelText } from '../objects/text.class';
import type { KritzelImage } from '../objects/image.class';

interface InitializeWorkspaceOptions {
  /**
   * When true, no fallback workspace will be created if there is no provided workspace,
   * no last active workspace, and no recent workspace.
   */
  skipFallbackCreation?: boolean;
}

/** Objects affected by reconciling a workspace's declared object set. */
export interface KritzelWorkspaceObjectsDiff {
  added: KritzelBaseObject<any>[];
  updated: KritzelBaseObject<any>[];
  removed: KritzelBaseObject<any>[];
}

/**
 * Central orchestrator class for the Kritzel canvas system.
 * Manages workspaces, objects, selection, clipboard operations, and coordinates
 * between the engine, store, and various managers.
 */
export class KritzelCore {
  /** The underlying Kritzel engine component */
  private readonly _kritzelEngine: KritzelEngineHost;
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
  /** Manager for browser permission checks and permission prompts */
  private readonly _permissionManager: KritzelBrowserPermissionManager;
  /** Manager for clipboard copy/cut/paste orchestration */
  private readonly _clipboardManager: KritzelClipboardManager;
  /** Manager for programmatically controlled (agentic) cursors */
  private readonly _agenticCursorManager: KritzelAgenticCursorManager;
  /** Manager for titlebars rendered above objects */
  private readonly _objectTitlebarManager: KritzelObjectTitlebarManager;
  private readonly _objectConfigManager: KritzelObjectConfigManager;
  /** Per-core registry of drawing tools (one instance per editor). */
  private readonly _toolRegistry: KritzelToolRegistry;
  /** Optional unique identifier for namespacing storage keys across multiple editor instances */
  private _editorId?: string;
  /** Current user for awareness broadcasting */
  private _user?: IKritzelUser;

  /**
   * Gets the Kritzel engine instance.
   * @returns The engine component managing rendering and events
   */
  get engine(): KritzelEngineHost {
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
   * Gets the object titlebar manager.
   * @returns The KritzelObjectTitlebarManager resolving titlebars rendered above objects
   */
  get objectTitlebarManager(): KritzelObjectTitlebarManager {
    return this._objectTitlebarManager;
  }

  /**
   * Gets the object config manager.
   * @returns The KritzelObjectConfigManager resolving the engine's `objectConfig` per object
   */
  get objectConfigManager(): KritzelObjectConfigManager {
    return this._objectConfigManager;
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
   * Gets the agentic cursor manager.
   * @returns The KritzelAgenticCursorManager for programmatically controlled cursors
   */
  get agenticCursorManager(): KritzelAgenticCursorManager {
    return this._agenticCursorManager;
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
   * @param kritzelEngine - The engine component to orchestrate
   * @param editorId - Optional unique identifier for namespacing storage keys
   */
  constructor(kritzelEngine: KritzelEngineHost, editorId?: string) {
    this._kritzelEngine = kritzelEngine;
    this._editorId = editorId;
    this._store = new KritzelStore(DEFAULT_ENGINE_CONFIG);
    this._appStateMap = new KritzelAppStateMap();
    this._anchorManager = new KritzelAnchorManager(this);
    this._cursorManager = new KritzelCursorManager(this);
    this._themeManager = new KritzelThemeManager(this);
    this._localizationManager = new KritzelLocalizationManager(this);
    this._permissionManager = new KritzelBrowserPermissionManager(this);
    this._clipboardManager = new KritzelClipboardManager(this);
    this._agenticCursorManager = new KritzelAgenticCursorManager(this);
    this._objectTitlebarManager = new KritzelObjectTitlebarManager(this);
    this._objectConfigManager = new KritzelObjectConfigManager(this);
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
   * resolver first or use the engine's `reinitSync` method.
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
    await this.seedWorkspaceObjects(activeWorkspace, objectsMap);

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

  private async seedWorkspaceObjects(workspace: KritzelWorkspace, objectsMap: KritzelObjectMap<KritzelBaseObject<any>>): Promise<void> {
    if (!workspace.objects?.length) {
      return;
    }

    const pendingObjects = workspace.objects.filter(object => !objectsMap.findById(object.id));

    // Mirrors engine.addObject()/addObjects(): image asset upload is async and must
    // happen before the (synchronous) Yjs transaction that inserts the objects.
    for (const object of pendingObjects) {
      object._core = this;
      if (KritzelClassHelper.isInstanceOf<KritzelImage>(object, 'KritzelImage')) {
        await object.prepareForInsert();
      }
    }

    objectsMap.transaction(() => {
      for (const object of pendingObjects) {
        this.prepareObjectForWorkspace(object, workspace.id, this._store.currentZIndex, this._store.state.scale);
        objectsMap.insert(object);
      }
    });
  }

  /**
   * Mirrors engine.addObject() runtime initialization for consumer-constructed objects.
   */
  private prepareObjectForWorkspace(object: KritzelBaseObject<any>, workspaceId: string, zIndex: number, scaleFallback: number): void {
    object._core = this;
    object.scale = object.scale ?? scaleFallback;
    object.zIndex = zIndex;

    // Recreate the text editor now that _core is available for persistence callbacks
    if (KritzelClassHelper.isInstanceOf<KritzelText>(object, 'KritzelText')) {
      const pendingContent = object.content;
      object.editor = object.createEditor();
      if (pendingContent) {
        object.setContent(pendingContent);
      }
    }

    if (KritzelClassHelper.isInstanceOf<KritzelGroup>(object, 'KritzelGroup')) {
      object.updateWorkspaceId(workspaceId);
    } else {
      object.workspaceId = workspaceId;
    }
  }

  /**
   * Applies `desiredObjects` as the complete object set of an object map.
   * Objects are matched by ID: unknown IDs are added, known IDs are updated (replacing the live
   * instance when a different one is passed), and objects absent from the list are removed.
   * @param objectsMap - The map to reconcile
   * @param workspaceId - The workspace the objects belong to
   * @param desiredObjects - The desired object set
   * @param nextZIndex - Supplies the z-index for newly added objects
   * @param scaleFallback - Scale applied to objects that do not define one
   * @returns The objects that were added, updated and removed
   */
  private async reconcileWorkspaceObjects(
    objectsMap: KritzelObjectMap<KritzelBaseObject<any>>,
    workspaceId: string,
    desiredObjects: KritzelBaseObject<any>[],
    nextZIndex: () => number,
    scaleFallback: number,
  ): Promise<KritzelWorkspaceObjectsDiff> {
    const existingObjects = objectsMap.allObjects().filter(o => !(o instanceof KritzelSelectionGroup) && !(o instanceof KritzelSelectionBox));
    const existingById = new Map(existingObjects.map(object => [object.id, object]));
    const desiredIds = new Set<string>();
    const diff: KritzelWorkspaceObjectsDiff = { added: [], updated: [], removed: [] };

    // Assign IDs up front so the insert-vs-update lookup below is stable, and so the
    // async image-prepare pass and the (synchronous) transaction agree on identity.
    for (const object of desiredObjects) {
      if (!object.id) {
        object.id = object.generateId();
      }
    }

    // Mirrors engine.addObject()/addObjects(): image asset upload is async and must
    // happen before the (synchronous) Yjs transaction that inserts the objects.
    for (const object of desiredObjects) {
      const existingObject = existingById.get(object.id);
      const isNewOrReplaced = !existingObject || existingObject !== object;

      if (isNewOrReplaced && KritzelClassHelper.isInstanceOf<KritzelImage>(object, 'KritzelImage')) {
        object._core = this;
        await object.prepareForInsert();
      }
    }

    objectsMap.transaction(() => {
      for (const object of desiredObjects) {
        desiredIds.add(object.id);

        const existingObject = existingById.get(object.id);

        if (!existingObject) {
          this.prepareObjectForWorkspace(object, workspaceId, nextZIndex(), scaleFallback);
          objectsMap.insert(object);
          diff.added.push(object);
          continue;
        }

        if (existingObject === object) {
          objectsMap.update(object);
          diff.updated.push(object);
          continue;
        }

        // Same ID but a different instance: swap the live object for the incoming one
        this.detachObject(existingObject);
        objectsMap.remove(o => o.id === object.id);
        this.prepareObjectForWorkspace(object, workspaceId, object.zIndex ?? nextZIndex(), scaleFallback);
        objectsMap.insert(object);
        diff.updated.push(object);
      }

      for (const object of existingObjects) {
        if (desiredIds.has(object.id)) {
          continue;
        }

        this.detachObject(object);
        objectsMap.remove(o => o.id === object.id);
        diff.removed.push(object);
      }
    });

    return diff;
  }

  /**
   * Releases runtime resources held by an object that is about to leave the canvas.
   * Unlike removeObject() this never cascades into group children, so the reconciled
   * object set stays exactly what the caller declared.
   */
  private detachObject(object: KritzelBaseObject<any>): void {
    if (ObjectHelper.isKritzelEmbeddedObject(object)) {
      object.unmount();
    }
    object.isMounted = false;
  }

  /**
   * Returns the next free z-index within an object map.
   */
  private nextZIndexOf(objectsMap: KritzelObjectMap<KritzelBaseObject<any>>): number {
    const objects = objectsMap.allObjects().filter(o => !(o instanceof KritzelSelectionGroup) && !(o instanceof KritzelSelectionBox));
    return Math.max(0, ...objects.map(o => o.zIndex)) + 1;
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
      .sort(KritzelZOrderHelper.compareStackOrder);
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
   * @param workspace - The workspace instance to create
   * @returns The created workspace instance
   */
  async createWorkspace(workspace: KritzelWorkspace): Promise<KritzelWorkspace> {
    workspace._core = this;
    workspace.createdAt = new Date();
    workspace.updatedAt = new Date();
    this.saveWorkspaceToAppState(workspace);
    this._store.state.workspaces = this.loadWorkspacesFromAppState();

    return workspace;
  }

  /**
   * Applies a workspace as declared: metadata, viewport, and — when `workspace.objects` is set —
   * the complete object set. A `undefined` object list leaves existing objects untouched, an empty
   * list removes them all. Objects of non-active workspaces are written through a background
   * object map and therefore require a configured sync provider.
   * @param workspace - The workspace describing the desired state
   * @returns The object changes that were applied, or null if objects were not touched
   */
  async updateWorkspace(workspace: KritzelWorkspace): Promise<KritzelWorkspaceObjectsDiff | null> {
    const isActive = this._store.state.activeWorkspace?.id === workspace.id;
    const desiredObjects = workspace.objects;

    workspace._core = this;

    // Never persist the declared object set into the app state entry
    workspace.objects = undefined;

    workspace.updatedAt = new Date();
    this.saveWorkspaceToAppState(workspace);

    // Keep metadata map in sync when the active workspace's name changes
    if (isActive) {
      this._store.objects?.setWorkspaceName(workspace.name);
    }

    const workspaces = this._store.state.workspaces;
    const index = workspaces.findIndex(w => w.id === workspace.id);

    if (index !== -1) {
      workspaces[index] = workspace;
      this._store.state.workspaces = workspaces;
    }

    if (isActive) {
      this.applyWorkspaceViewport(workspace);
      this._store.state.activeWorkspace = workspace;
    }

    if (!desiredObjects) {
      return null;
    }

    return isActive ? this.applyObjectsToActiveWorkspace(workspace, desiredObjects) : this.applyObjectsToInactiveWorkspace(workspace, desiredObjects);
  }

  /**
   * Moves the live viewport to the workspace's declared viewport.
   * Compared against the persisted viewport rather than the live one, so a workspace that was
   * read and passed back unchanged (e.g. a rename) never snaps the canvas.
   */
  private applyWorkspaceViewport(workspace: KritzelWorkspace): void {
    const viewport = workspace.viewport;
    if (!viewport) {
      return;
    }

    const scale = viewport.scale ?? 1;
    const centerWorldX = viewport.centerWorldX ?? 0;
    const centerWorldY = viewport.centerWorldY ?? 0;

    const persistedViewport = this._store.state.activeWorkspace?.viewport;
    if (persistedViewport && persistedViewport.scale === scale && persistedViewport.centerWorldX === centerWorldX && persistedViewport.centerWorldY === centerWorldY) {
      return;
    }

    // Drop the debounced save of the outgoing viewport so it cannot overwrite the new one
    this._kritzelEngine?.viewport?.cancelPendingUpdates();

    this._store.state.translateX = this._store.state.viewportWidth / 2 - centerWorldX * scale;
    this._store.state.translateY = this._store.state.viewportHeight / 2 - centerWorldY * scale;
    this._store.state.scale = scale;

    const activeWorkspace = this._store.state.activeWorkspace;
    if (activeWorkspace) {
      activeWorkspace.viewport = { centerWorldX, centerWorldY, scale };
    }
  }

  private async applyObjectsToActiveWorkspace(workspace: KritzelWorkspace, desiredObjects: KritzelBaseObject<any>[]): Promise<KritzelWorkspaceObjectsDiff | null> {
    const objectsMap = this._store.objects;
    if (!objectsMap) {
      return null;
    }

    this.clearSelection();

    const diff = await this.reconcileWorkspaceObjects(objectsMap, workspace.id, desiredObjects, () => this._store.currentZIndex, this._store.state.scale);

    this._anchorManager.rebuildIndex();
    this.rerender();

    return diff;
  }

  /**
   * Applies objects to a workspace that is not currently open by loading its document into a
   * background object map, reconciling, and disposing it again.
   */
  private async applyObjectsToInactiveWorkspace(workspace: KritzelWorkspace, desiredObjects: KritzelBaseObject<any>[]): Promise<KritzelWorkspaceObjectsDiff | null> {
    if (!this._syncConfig?.providers?.length) {
      console.warn(
        `[KritzelCore] Cannot update the objects of workspace '${workspace.id}' because it is not active and no sync provider is configured. ` +
          'Configure a sync provider, or activate the workspace before updating its objects.',
      );
      return null;
    }

    const objectsMap = new KritzelObjectMap<KritzelBaseObject<any>>();

    try {
      await objectsMap.initialize(this, workspace.id, this._syncConfig, { headless: true, workspaceName: workspace.name });
      await objectsMap.whenNetworkSynced();

      return await this.reconcileWorkspaceObjects(objectsMap, workspace.id, desiredObjects, () => this.nextZIndexOf(objectsMap), this._store.state.scale);
    } finally {
      objectsMap.destroy();
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

    if (ObjectHelper.isKritzelEmbeddedObject(object)) {
      object.unmount();
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
      if (ObjectHelper.isKritzelEmbeddedObject(object)) {
        object.setIsInteractive(true);
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
      if (ObjectHelper.isKritzelEmbeddedObject(object)) {
        object.setIsInteractive(false);
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
   * Collects every object of the workspace (not limited by viewport boundaries) for z-order planning.
   * @returns The objects by id and their z-order view in store order.
   */
  private getZOrderItems(): { objects: Map<string, KritzelBaseObject<any>>; items: KritzelZOrderItem[] } {
    const objects = new Map<string, KritzelBaseObject<any>>();
    const items: KritzelZOrderItem[] = [];

    for (const object of this._store.objects?.allObjects() ?? []) {
      if (object instanceof KritzelSelectionGroup || object instanceof KritzelSelectionBox || objects.has(object.id)) {
        continue;
      }
      objects.set(object.id, object);
      items.push(KritzelZOrderHelper.toItem(object));
    }

    return { objects, items };
  }

  /**
   * Persists planned zIndex values as a single undo step.
   * @param updates - New zIndex values keyed by object id
   * @param objects - Store instances by id
   * @param inTransaction - Optional additional work that belongs to the same undo step
   * @returns The updated objects
   */
  private applyZIndexUpdates(updates: Map<string, number>, objects: Map<string, KritzelBaseObject<any>>, inTransaction?: () => void): KritzelBaseObject<any>[] {
    const updated: KritzelBaseObject<any>[] = [];
    if (updates.size === 0 && !inTransaction) {
      return updated;
    }

    this._store.objects.stopUndoCapturing();
    this._store.objects.transaction(() => {
      inTransaction?.();
      updates.forEach((zIndex, id) => {
        const object = objects.get(id);
        if (object) {
          this.updateObject(object, { zIndex });
          updated.push(object);
        }
      });
    });
    this._store.objects.stopUndoCapturing();

    if (updated.length > 0) {
      this.engine.emitObjectsUpdated(updated.map(object => ({ object, changedProperties: ['zIndex'] })));
    }

    return updated;
  }

  /**
   * Applies a z-order operation to an object or the current selection.
   * Groups move as one layer together with all of their descendants; a grouped object moves within its group.
   * @param operation - The z-order operation
   * @param object - Optional specific object; defaults to all selected objects
   */
  private reorder(operation: KritzelZOrderOperation, object?: KritzelBaseObject<any>): void {
    const roots = object ? [object] : this._store.selectionGroup?.objects || [];
    const { objects, items } = this.getZOrderItems();
    const updates = KritzelZOrderHelper.reorder(items, roots.map(root => root.id), operation);

    if (this.applyZIndexUpdates(updates, objects).length > 0) {
      this.engine.emitObjectsChange();
    }

    this.rerender();
  }

  /**
   * Moves objects one layer forward, past the next layer above them.
   * Groups move as one layer together with all of their descendants.
   * @param object - Optional specific object to move; defaults to all selected objects
   */
  bringForward(object?: KritzelBaseObject<any>) {
    this.reorder('forward', object);
  }

  /**
   * Moves objects one layer backward, past the next layer below them.
   * Groups move as one layer together with all of their descendants.
   * @param object - Optional specific object to move; defaults to all selected objects
   */
  sendBackward(object?: KritzelBaseObject<any>) {
    this.reorder('backward', object);
  }

  /**
   * Moves objects to the very front of the z-order stack, preserving their relative order.
   * Groups move as one layer together with all of their descendants.
   * @param object - Optional specific object to move; defaults to all selected objects
   */
  bringToFront(object?: KritzelBaseObject<any>) {
    this.reorder('front', object);
  }

  /**
   * Moves objects to the very back of the z-order stack, preserving their relative order.
   * Groups move as one layer together with all of their descendants.
   * @param object - Optional specific object to move; defaults to all selected objects
   */
  sendToBack(object?: KritzelBaseObject<any>) {
    this.reorder('back', object);
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
   * Groups objects into a KritzelGroup as a single undo step.
   * Requires at least 2 objects. The grouped objects become one contiguous layer at the position of the
   * topmost object; objects stacked in between end up below the group.
   * Objects inside a common group are grouped within it; objects from different groups are grouped at the
   * level that contains all of them, so every object keeps a single parent.
   * Selected objects that end up in the group are replaced by the group in the selection.
   * @param objects - The objects to group, resolved by id. Objects that are not in the workspace are skipped
   *   with a warning.
   * @returns The created group, or null when nothing was grouped
   */
  group(objects: KritzelBaseObject<any>[]): KritzelGroup | null {
    const { objects: storeObjects, items } = this.getZOrderItems();
    const rootIds = this.resolveObjects(objects ?? [], storeObjects, 'group').map(obj => obj.id);
    const plan = KritzelZOrderHelper.planGroup(items, rootIds);
    if (!plan) {
      console.warn('[KritzelCore] Cannot group: at least two objects that are not nested in each other are required.');
      return null;
    }

    // Create a group from the objects, ordered bottom to top
    const group = KritzelGroup.createFromObjects(this, plan.childIds.map(id => storeObjects.get(id)));
    if (plan.groupZIndex !== null) {
      group.zIndex = plan.groupZIndex;
    }

    // A nested group takes its parent's frame, so the parent's bounds and transforms stay unchanged
    const parent = plan.parentId ? (storeObjects.get(plan.parentId) as KritzelGroup) : null;
    if (parent) {
      group.rotation = parent.rotation;
      group.finalize();
    }

    // Add the group to the object store together with the restacked members
    this.applyZIndexUpdates(plan.updates, storeObjects, () => {
      this.addObject(group);
      if (parent) {
        this.replaceChildIds(parent, plan.childIds, [group.id]);
      }
    });

    // Selected members (and their descendants) are now part of the group, which takes their place
    const groupedIds = this.collectSubtreeIds(plan.childIds, storeObjects);
    this.replaceInSelection(object => (groupedIds.has(object.id) ? [group] : null));

    this.engine.emitObjectsChange();
    this.rerender();
    return group;
  }

  /**
   * Ungroups KritzelGroup objects as a single undo step.
   * Children are extracted and take the group's place, keeping their stacking order. A nested group's
   * children stay in its parent group. Dissolved groups in the selection are replaced by their children.
   * @param groups - The groups to ungroup, resolved by id. Entries that are not groups or not in the workspace
   *   are skipped with a warning.
   * @returns The extracted children
   */
  ungroup(groups: KritzelGroup[]): KritzelBaseObject<any>[] {
    const { objects, items } = this.getZOrderItems();
    const toDissolve = this.resolveObjects(groups ?? [], objects, 'ungroup').filter(obj => {
      const isGroup = KritzelClassHelper.isInstanceOf<KritzelGroup>(obj, 'KritzelGroup');
      if (!isGroup) {
        console.warn(`[KritzelCore] Cannot ungroup object '${obj.id}': it is not a KritzelGroup.`);
      }
      return isGroup;
    }) as KritzelGroup[];
    if (toDissolve.length === 0) {
      return [];
    }

    // Tied children get unique values so they keep their stacking order
    const updates = KritzelZOrderHelper.planUngroup(items, toDissolve.map(group => group.id));

    const childrenByGroup = new Map<string, KritzelBaseObject<any>[]>();
    this.applyZIndexUpdates(updates, objects, () => {
      toDissolve.forEach(group => {
        // Get children before removing the group
        const children = group.ungroup();
        childrenByGroup.set(group.id, children);

        // A nested group's children stay in its parent group
        const parent = KritzelGroup.findParentGroup(this, group.id);
        if (parent) {
          this.replaceChildIds(parent, [group.id], children.map(child => child.id));
        }

        // Remove the group from the store (but keep children)
        this.removeObject(group, true);
      });
    });

    // Each dissolved group in the selection is replaced by its children
    this.replaceInSelection(object => childrenByGroup.get(object.id) ?? null, new Set(childrenByGroup.keys()));

    this.engine.emitObjectsChange();
    this.rerender();

    const children = new Map<string, KritzelBaseObject<any>>();
    childrenByGroup.forEach(groupChildren => groupChildren.forEach(child => !childrenByGroup.has(child.id) && children.set(child.id, child)));
    return [...children.values()];
  }

  /**
   * Resolves objects passed to the public API by id to their current store instances, so stale references work.
   * Objects that are not in the workspace (or are selection helpers) are skipped with a warning.
   * @param candidates - Objects to resolve
   * @param objects - Store instances by id
   * @param action - Name of the calling action, used in the warning
   */
  private resolveObjects(candidates: KritzelBaseObject<any>[], objects: Map<string, KritzelBaseObject<any>>, action: string): KritzelBaseObject<any>[] {
    const resolved = new Map<string, KritzelBaseObject<any>>();
    for (const candidate of candidates) {
      const object = candidate ? objects.get(candidate.id) : undefined;
      if (!object) {
        console.warn(`[KritzelCore] Cannot ${action} object '${candidate?.id}': it is not in the active workspace.`);
        continue;
      }
      resolved.set(object.id, object);
    }
    return [...resolved.values()];
  }

  /**
   * Collects the given ids together with the ids of all of their descendants.
   * @param rootIds - Ids to start from
   * @param objects - Store instances by id
   */
  private collectSubtreeIds(rootIds: string[], objects: Map<string, KritzelBaseObject<any>>): Set<string> {
    const ids = new Set<string>();
    const visit = (id: string) => {
      if (ids.has(id)) {
        return;
      }
      ids.add(id);
      const object = objects.get(id);
      if (object && KritzelClassHelper.isInstanceOf<KritzelGroup>(object, 'KritzelGroup')) {
        object.childIds.forEach(visit);
      }
    };
    rootIds.forEach(visit);
    return ids;
  }

  /**
   * Replaces objects of the current selection and selects the result. Leaves the selection alone when no
   * selected object is replaced.
   * @param replace - Returns the objects that take a selected object's place, or null to keep it
   * @param excludedIds - Ids that must not be selected afterwards (e.g. removed objects)
   */
  private replaceInSelection(replace: (object: KritzelBaseObject<any>) => KritzelBaseObject<any>[] | null, excludedIds: Set<string> = new Set()): void {
    const selected = this._store.selectionGroup?.objects ?? [];
    let changed = false;
    const selection = new Map<string, KritzelBaseObject<any>>();
    for (const object of selected) {
      const replacement = replace(object);
      changed ||= replacement !== null;
      // Each object once (addOrRemove toggles)
      (replacement ?? [object]).forEach(obj => !excludedIds.has(obj.id) && selection.set(obj.id, obj));
    }
    if (!changed) {
      return;
    }

    this.removeSelectionGroup();
    if (selection.size === 0) {
      return;
    }

    const newSelectionGroup = KritzelSelectionGroup.create(this);
    selection.forEach(object => newSelectionGroup.addOrRemove(object));
    newSelectionGroup.isSelected = true;
    if (selection.size === 1) {
      newSelectionGroup.rotation = [...selection.values()][0].rotation;
    }
    this.addSelectionGroup(newSelectionGroup);
  }

  /**
   * Replaces children of a group, keeping the position of the first replaced child, and persists the group.
   * @param group - The group whose children change
   * @param removedIds - Ids of the children to replace
   * @param addedIds - Ids of the children to insert in their place
   */
  private replaceChildIds(group: KritzelGroup, removedIds: string[], addedIds: string[]): void {
    const removed = new Set(removedIds);
    const index = group.childIds.findIndex(id => removed.has(id));
    const childIds = group.childIds.filter(id => !removed.has(id));
    childIds.splice(index === -1 ? childIds.length : Math.min(index, childIds.length), 0, ...addedIds);

    group.childIds = childIds;
    group.finalize();
    this._store.objects.update(group);
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
      return !KritzelClassHelper.isInstanceOf<KritzelLine>(object, 'KritzelLine');
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
      return !KritzelClassHelper.isInstanceOf<KritzelLine>(selectedObject, 'KritzelLine');
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
    if (!KritzelClassHelper.isInstanceOf<KritzelLine>(object, 'KritzelLine')) {
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
      return KritzelClassHelper.isInstanceOf<KritzelLine>(selectedObject, 'KritzelLine') && selectedObject.id === object.id;
    }

    return false;
  }
}
