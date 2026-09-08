import * as Y from 'yjs';
import { KritzelWorkspace } from '../core/workspace.class';
import type { KritzelCore } from '../core/core.class';
import { ISyncProvider } from '../../interfaces/sync-provider.interface';
import { KritzelSyncConfig } from '../../interfaces/sync-config.interface';
import { DEFAULT_SYNC_CONFIG } from '../../configs/default-sync.config';
import { KritzelDocumentType } from '../../interfaces/document-metadata.interface';
import { APP_STATE_INSTANCE_ID_STORAGE_KEY } from '../../constants/storage.constants';
import { CURRENT_APP_STATE_SCHEMA_VERSION } from '../../constants/schema.constants';
import { ObjectHelper } from '../../helpers/object.helper';
import { runMigrations } from '../../helpers/migration.helper';
import { APP_STATE_MIGRATIONS } from '../../migrations/app-state.migrations';

/**
 * Manages the application state for workspaces with Yjs-based synchronization support.
 * This class provides a synchronized map of workspaces that can be shared across
 * multiple clients using configurable sync providers (e.g., WebSocket, WebRTC).
 */
export class KritzelAppStateMap {
  private map: Map<string, KritzelWorkspace>;
  private _ydoc: Y.Doc | null = null;
  private _workspacesMap: Y.Map<any> | null = null;
  private _metadataMap: Y.Map<any> | null = null;
  private _providers: ISyncProvider[] = [];
  private _core: KritzelCore | null = null;
  private _isReady: boolean = false;
  private _onRemoteChangeCallback: (() => void) | null = null;
  private _workspacesObserver: ((event: Y.YMapEvent<any>) => void) | null = null;
  private _networkSyncPromise: Promise<void> | null = null;

  /**
   * Indicates whether the app state map has been initialized and is ready for use.
   * @returns True if initialized and all providers are connected, false otherwise.
   */
  get isReady(): boolean {
    return this._isReady;
  }

  /**
   * Settles when network providers finish their initial sync (or fail/time out).
   * Resolves immediately when no network providers are configured.
   */
  whenNetworkSynced(): Promise<void> {
    return this._networkSyncPromise ?? Promise.resolve();
  }

  /**
   * Indicates whether any configured sync provider replicates over the network.
   * Used by the engine to warn when a matching remote asset storage
   * provider is missing (images would otherwise only exist locally).
   */
  get hasNetworkSyncProvider(): boolean {
    return this._providers.some(p => p.type === 'network');
  }

  /**
   * Creates a new KritzelAppStateMap instance with an empty workspace map.
   */
  constructor() {
    this.map = new Map<string, KritzelWorkspace>();
  }

  /**
   * Registers a callback function to be invoked when remote changes are received.
   * This allows external code to react to workspace changes from other clients.
   * @param callback - The function to call when remote changes occur.
   */
  onRemoteChange(callback: () => void): void {
    this._onRemoteChangeCallback = callback;
  }

  /**
   * Initializes the app state map with Yjs synchronization.
   * Creates a dedicated Y.Doc for app state, sets up workspace observation,
   * instantiates and connects all configured sync providers, and loads existing workspaces.
   * @param core - The KritzelCore instance for triggering re-renders and accessing the store.
   * @param config - Optional sync configuration specifying providers. Defaults to DEFAULT_SYNC_CONFIG.
   * @returns A promise that resolves when all providers are connected and the state is loaded.
   */
  async initialize(core: KritzelCore, config?: KritzelSyncConfig): Promise<void> {
    this._core = core;

    // Create a dedicated Y.Doc for app state (workspaces)
    this._ydoc = new Y.Doc();
    this._workspacesMap = this._ydoc.getMap('workspaces');
    this._metadataMap = this._ydoc.getMap('metadata');

    const instanceId = config?.appStateId ?? this.getOrCreateAppStateInstanceId(core);
    const docName = core.editorId ? `kritzel-app-state-${core.editorId}-${instanceId}` : `kritzel-app-state-${instanceId}`;
   
    const finalConfig = config ?? DEFAULT_SYNC_CONFIG;

    // Instantiate providers from configuration
    const showSyncProviderInfo = !!core.store.state.debugInfo.showSyncProviderInfo;
    const quiet = !showSyncProviderInfo;
    for (const providerConfig of finalConfig.providers) {
      let provider: ISyncProvider;

      // Check if it's a class constructor or a factory
      if (typeof providerConfig === 'function') {
        // It's a class constructor
        provider = new providerConfig(docName, this._ydoc, { quiet });
      } else {
        // It's a factory with a create method
        provider = providerConfig.create(docName, this._ydoc, { quiet });
      }

      this._providers.push(provider);
    }

    if (showSyncProviderInfo) {
      const providerList = this._providers.map(p => `${p.constructor.name} (${p.type})`).join(', ');
      console.info(`[Kritzel] App-state sync providers initialized for ${docName}: ${providerList || 'none'}`);
    }

    // Observe changes to workspaces and sync with application state
    this._workspacesObserver = event => {
      this.handleWorkspacesChange(event);
    };
    this._workspacesMap.observe(this._workspacesObserver);

    // Separate local providers (IndexedDB, BroadcastChannel) from network providers (Hocuspocus, WebSocket)
    // Local providers are awaited so data is available immediately; network providers sync in the background
    // via Yjs observers that are already registered above.
    const localProviders = this._providers.filter(p => p.type === 'local');
    const networkProviders = this._providers.filter(p => p.type === 'network');

    // Await local providers for immediate data availability
    const localResults = await Promise.allSettled(localProviders.map(p => p.connect()));
    if (showSyncProviderInfo) {
      const connectedLocalCount = localResults.filter(result => result.status === 'fulfilled').length;
      console.info(`[Kritzel] App-state local providers connected: ${connectedLocalCount}/${localProviders.length}`);
    }
    localResults.forEach((result, i) => {
      if (showSyncProviderInfo && result.status === 'rejected') {
        console.error(`[Kritzel] Sync provider "${localProviders[i]?.constructor.name}" failed to connect:`, result.reason);
      }
    });

    // Connect network providers in the background (remote data arrives via Yjs observers)
    if (showSyncProviderInfo && networkProviders.length > 0) {
      console.info(`[Kritzel] App-state network providers connecting in background: ${networkProviders.length}`);
    }
    const networkConnectPromises = networkProviders.map(provider =>
      provider.connect().catch(err => {
        if (showSyncProviderInfo) {
          console.error(`[Kritzel] Network sync provider "${provider.constructor.name}" failed to connect:`, err);
        }
      }),
    );

    if (networkConnectPromises.length > 0) {
      this._networkSyncPromise = Promise.allSettled(networkConnectPromises).then(() => undefined);
    }

    this._isReady = true;

    // Run any pending schema migrations before loading data
    const quietMigrations = !core.store.state.debugInfo.showMigrationInfo;
    runMigrations(this._ydoc, this._metadataMap, { workspaces: this._workspacesMap }, APP_STATE_MIGRATIONS, CURRENT_APP_STATE_SCHEMA_VERSION, { quiet: quietMigrations });

    // Initialize document metadata (only if not already set by a previous client)
    this.initializeMetadata('state');

    // Load workspaces from Yjs
    this.loadFromYjs();
  }

  /**
   * Resolves a stable instance identifier for the app-state document.
   * The id is persisted in localStorage and reused across remounts/reloads.
   * @param core - The core instance used to namespace the storage key by editorId.
   * @returns A stable instance identifier.
   * @throws Error when localStorage is unavailable or inaccessible.
   */
  private getOrCreateAppStateInstanceId(core: KritzelCore): string {
    const storage = globalThis.localStorage;

    if (!storage) {
      throw new Error('[KritzelAppStateMap] localStorage is unavailable. Cannot persist app-state document identity.');
    }

    const storageKey = core.getStorageKey(APP_STATE_INSTANCE_ID_STORAGE_KEY);

    let instanceId: string | null;
    try {
      instanceId = storage.getItem(storageKey);
    } catch {
      throw new Error('[KritzelAppStateMap] Failed to read app-state instance id from localStorage.');
    }

    if (instanceId) {
      return instanceId;
    }

    const generatedInstanceId = ObjectHelper.generateUUID();

    try {
      storage.setItem(storageKey, generatedInstanceId);
    } catch {
      throw new Error('[KritzelAppStateMap] Failed to persist app-state instance id to localStorage.');
    }

    return generatedInstanceId;
  }

  /**
   * Handles changes to the Yjs workspaces map.
   * For local changes, only triggers a re-render. For remote changes, synchronizes
   * the local map with the Yjs state by adding, updating, or deleting workspaces.
   * @param event - The Yjs map event containing information about changed keys.
   */
  private handleWorkspacesChange(event: Y.YMapEvent<any>): void {
    // Skip Map updates for local changes (already done), but still trigger re-render
    if (event.transaction.origin === 'local') {
      this._core?.rerender();
      return;
    }

    // Skip migration transactions — data will be loaded fresh via loadFromYjs()
    if (event.transaction.origin === 'migration') {
      return;
    }

    const changedKeys = Array.from(event.keysChanged);
    const workspacesToUpdate: any[] = [];
    const workspacesToDelete: any[] = [];

    changedKeys.forEach(key => {
      const change = event.changes.keys.get(key);

      if (change && change.action === 'delete') {
        workspacesToDelete.push(key);
      } else {
        const serialized = this._workspacesMap!.get(key);
        if (serialized) {
          const workspace = this.reviveWorkspace(serialized);
          workspacesToUpdate.push(workspace);
        }
      }
    });

    // Delete workspaces from local map
    workspacesToDelete.forEach(workspaceId => {
      this.map.delete(workspaceId);
    });

    // Update or insert workspaces
    workspacesToUpdate.forEach(workspace => {
      this.map.set(workspace.id, workspace);
    });

    // Update the store's workspace list to reflect remote changes
    if (this._core?.store) {
      this._core.store.state.workspaces = this.allWorkspaces();
    }

    // Notify about remote changes
    if (this._onRemoteChangeCallback) {
      this._onRemoteChangeCallback();
    }

    this._core?.rerender();
  }

  /**
   * Reconstructs a KritzelWorkspace instance from its serialized form.
   * Restores all properties including id, name, viewport, and timestamps.
   * Handles both legacy { translateX, translateY } and new { centerWorldX, centerWorldY } viewport formats.
   * @param serialized - The serialized workspace data object.
   * @returns A fully reconstructed KritzelWorkspace instance.
   */
  private reviveWorkspace(serialized: any): KritzelWorkspace {
    let viewport = serialized.viewport;

    // Backward compatibility: convert legacy translateX/translateY to centerWorldX/centerWorldY
    if (viewport && 'translateX' in viewport && !('centerWorldX' in viewport)) {
      const scale = viewport.scale ?? 1;
      viewport = {
        centerWorldX: -(viewport.translateX ?? 0) / scale,
        centerWorldY: -(viewport.translateY ?? 0) / scale,
        scale,
      };
    }

    const workspace = new KritzelWorkspace(
      serialized.id,
      serialized.name,
      viewport
    );
    if (this._core) {
      workspace._core = this._core;
    }
    workspace.createdAt = new Date(serialized.createdAt);
    workspace.updatedAt = new Date(serialized.updatedAt);
    workspace.isPublic = serialized.isPublic ?? false;
    return workspace;
  }

  /**
   * Initializes document metadata if not already set.
   * Uses 'metadata' transaction origin to avoid triggering remote sync callbacks for local state.
   */
  private initializeMetadata(type: KritzelDocumentType): void {
    if (!this._metadataMap || !this._ydoc) {
      return;
    }

    this._ydoc.transact(() => {
      if (!this._metadataMap?.get('type')) {
        this._metadataMap?.set('type', type);
      }
      if (this._metadataMap?.get('isPublic') === undefined) {
        this._metadataMap?.set('isPublic', false);
      }
      if (this._metadataMap?.get('schemaVersion') === undefined) {
        this._metadataMap?.set('schemaVersion', CURRENT_APP_STATE_SCHEMA_VERSION);
      }
    }, 'metadata');
  }

  /**
   * Returns whether the document is publicly accessible.
   */
  getIsPublic(): boolean {
    return this._metadataMap?.get('isPublic') ?? false;
  }

  /**
   * Sets whether the document is publicly accessible.
   * This change is synced to all connected clients and the server.
   */
  setIsPublic(isPublic: boolean): void {
    if (!this._metadataMap || !this._ydoc) {
      return;
    }

    this._ydoc.transact(() => {
      this._metadataMap?.set('isPublic', isPublic);
    }, 'metadata');
  }

  /**
   * Returns the document type stored in metadata.
   */
  getDocumentType(): KritzelDocumentType {
    return this._metadataMap?.get('type') ?? 'state';
  }

  /**
   * Executes a callback within a Yjs transaction marked as 'local'.
   * This allows batching multiple Yjs operations and identifying them as local changes.
   * @param callback - The function containing Yjs operations to execute within the transaction.
   */
  transaction(callback: () => void): void {
    if (this._ydoc) {
      this._ydoc.transact(callback, 'local');
    }
  }

  /**
   * Loads all workspaces from the Yjs map into the local map.
   * Clears the existing local map and repopulates it by reviving each serialized workspace.
   * This is typically called during initialization or when a full sync is needed.
   */
  loadFromYjs(): void {
    if (!this._workspacesMap) {
      return;
    }

    this.map.clear();
    this._workspacesMap.forEach((serialized, key) => {
      const workspace = this.reviveWorkspace(serialized);
      this.map.set(key, workspace);
    });
  }

  /**
   * Resets the app state by clearing both the local map and the Yjs workspaces map.
   * This operation is performed within a local transaction to avoid triggering remote sync callbacks.
   */
  reset(): void {
    this.map.clear();
    this._ydoc?.transact(() => {
      this._workspacesMap?.clear();
    }, 'local');
  }

  /**
   * Inserts a new workspace into both the local map and the Yjs map.
   * The workspace is serialized before being stored in Yjs for synchronization.
   * @param workspace - The workspace to insert.
   * @returns True if the workspace was successfully inserted, false if it has no id.
   */
  insert(workspace: KritzelWorkspace): boolean {
    if (!workspace.id) {
      return false;
    }
    this.map.set(workspace.id, workspace);

    if (this._workspacesMap) {
      const serialized = workspace.serialize();
      this._ydoc?.transact(() => {
        this._workspacesMap?.set(workspace.id, serialized);
      }, 'local');
    }

    return true;
  }

  /**
   * Updates an existing workspace in both the local map and the Yjs map.
   * The workspace must already exist in the map to be updated.
   * @param workspace - The workspace with updated data.
   * @returns True if the workspace was successfully updated, false if it doesn't exist or has no id.
   */
  update(workspace: KritzelWorkspace): boolean {
    if (!workspace.id || !this.map.has(workspace.id)) {
      return false;
    }

    this.map.set(workspace.id, workspace);

    if (this._workspacesMap) {
      const serialized = workspace.serialize();
      this._ydoc?.transact(() => {
        this._workspacesMap?.set(workspace.id, serialized);
      }, 'local');
    }

    return true;
  }

  /**
   * Removes a workspace matching the given predicate from both the local map and the Yjs map.
   * Only the first matching workspace will be removed.
   * @param predicate - A function that returns true for the workspace to remove.
   * @returns True if a matching workspace was found and removed, false otherwise.
   */
  remove(predicate: (workspace: KritzelWorkspace) => boolean): boolean {
    const workspaceToRemove = Array.from(this.map.values()).find(predicate);

    if (!workspaceToRemove) {
      return false;
    }

    this.map.delete(workspaceToRemove.id);

    if (this._workspacesMap) {
      this._ydoc?.transact(() => {
        this._workspacesMap?.delete(workspaceToRemove.id);
      }, 'local');
    }

    return true;
  }

  /**
   * Retrieves a workspace by its unique identifier.
   * @param id - The unique identifier of the workspace to retrieve.
   * @returns The workspace if found, undefined otherwise.
   */
  get(id: string): KritzelWorkspace | undefined {
    return this.map.get(id);
  }

  /**
   * Returns all workspaces currently stored in the map.
   * @returns An array containing all workspaces.
   */
  allWorkspaces(): KritzelWorkspace[] {
    return Array.from(this.map.values());
  }

  /**
   * Filters workspaces based on a predicate function.
   * @param predicate - A function that returns true for workspaces to include.
   * @returns An array of workspaces that match the predicate.
   */
  filter(predicate: (workspace: KritzelWorkspace) => boolean): KritzelWorkspace[] {
    return Array.from(this.map.values()).filter(predicate);
  }

  /**
   * Finds the first workspace matching the given predicate.
   * @param predicate - A function that returns true for the workspace to find.
   * @returns The first matching workspace, or undefined if no match is found.
   */
  find(predicate: (workspace: KritzelWorkspace) => boolean): KritzelWorkspace | undefined {
    return Array.from(this.map.values()).find(predicate);
  }

  /**
   * Checks if a workspace with the given id exists in the map.
   * @param id - The unique identifier of the workspace to check.
   * @returns True if a workspace with the given id exists, false otherwise.
   */
  has(id: string): boolean {
    return this.map.has(id);
  }

  /**
   * Destroys the app state map and releases all resources.
   * Unobserves the Yjs workspaces map, disconnects and destroys all sync providers,
   * clears all maps, destroys the Y.Doc, and resets all internal references.
   * This should be called when the app state map is no longer needed.
   */
  destroy(): void {
    // Unobserve the workspaces map
    if (this._workspacesMap && this._workspacesObserver) {
      this._workspacesMap.unobserve(this._workspacesObserver);
      this._workspacesObserver = null;
    }

    // Disconnect and destroy all providers
    this._providers.forEach(p => {
      p.disconnect();
      p.destroy();
    });
    this._providers = [];

    // Clear maps
    this.map.clear();
    this._workspacesMap = null;
    this._metadataMap = null;

    // Destroy Y.Doc
    if (this._ydoc) {
      this._ydoc.destroy();
      this._ydoc = null;
    }

    // Clear remaining references
    this._core = null;
    this._onRemoteChangeCallback = null;
    this._networkSyncPromise = null;
    this._isReady = false;
  }
}
