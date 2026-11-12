import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { KritzelReviver } from '../core/reviver.class';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelLine } from '../objects/line.class';
import { KritzelSelectionBox } from '../objects/selection-box.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import type { KritzelCore } from '../core/core.class';
import { ISyncProvider } from '../../interfaces/sync-provider.interface';
import { KritzelSyncConfig } from '../../interfaces/sync-config.interface';
import { DEFAULT_SYNC_CONFIG } from '../../configs/default-sync.config';
import { KritzelUndoState } from '../../interfaces/undo-state.interface';
import { KritzelDocumentType } from '../../interfaces/document-metadata.interface';
import { CURRENT_WORKSPACE_SCHEMA_VERSION } from '../../constants/schema.constants';
import { KritzelQuadtree } from './quadtree.structure';
import { IKritzelUser } from '../../interfaces/user.interface';
import { runMigrations } from '../../helpers/migration.helper';
import { WORKSPACE_MIGRATIONS } from '../../migrations/workspace.migrations';
import { KritzelUserColorHelper } from '../../helpers/user-color.helper';
import { ObjectHelper } from '../../helpers/object.helper';
import { KritzelAgentOrigin } from './agent-origin.class';
import type { KritzelObjectChangeSource } from '../../interfaces/object-change-event.interface';
import type { KritzelAwarenessAgent } from '../../interfaces/agent.interface';
import { KritzelEventHelper } from '../../helpers/event.helper';

/** Per-agent history of an agentic cursor. */
interface KritzelAgentHistory {
  origin: KritzelAgentOrigin;
  undoManager: Y.UndoManager;
  /** Set while this agent's undo/redo runs, so the resulting events carry a source. */
  historyAction: 'undo' | 'redo' | null;
  /** Set while a rollback runs; its events are not emitted. */
  suppressEvents: boolean;
}

/** Result of an agent undo or redo. */
export interface KritzelAgentHistoryResult {
  /** `'empty'`: nothing to undo/redo. `'conflict'`: the step was fully superseded by other changes and dropped. */
  status: 'done' | 'empty' | 'conflict';
  /** IDs of the objects the step touched. */
  objectIds: string[];
}

/**
 * A synchronized object map that stores and manages drawable objects on the canvas.
 * This structure integrates with Yjs for real-time collaboration and persistence,
 * uses a quadtree for efficient spatial queries, and provides undo/redo functionality.
 *
 * @template T - The type of objects stored, must extend KritzelBaseObject
 */
export class KritzelObjectMap<T extends KritzelBaseObject<any>> {
  private quadtree: KritzelQuadtree<T>;
  private _ydoc: Y.Doc | null = null;
  private _objectsMap: Y.Map<any> | null = null;
  private _metadataMap: Y.Map<any> | null = null;
  private _providers: ISyncProvider[] = [];
  private _undoManager: Y.UndoManager | null = null;
  private _reviver: KritzelReviver | null = null;
  private _core: KritzelCore | null = null;
  private _workspaceId: string | null = null;
  private _isReady: boolean = false;
  private _temporaryItemsCount: number = 0;
  private _idMap: Map<string, T> = new Map();
  private _awareness: Awareness | null = null;
  private _networkSyncPromise: Promise<void> | null = null;
  /** When true this map is a background worker: it never renders, emits, or wires awareness. */
  private _headless: boolean = false;

  // Store observer/listener references for cleanup
  private _objectsObserver: ((event: Y.YMapEvent<any>) => void) | null = null;
  private _stackItemAddedHandler: ((event: any) => void) | null = null;
  private _stackItemPoppedHandler: ((event: any) => void) | null = null;
  private _awarenessChangeHandler: ((change: { added: number[]; updated: number[]; removed: number[] }, origin: string) => void) | null = null;
  private _awarenessChangeCallbacks: ((states: Map<number, Record<string, any>>) => void)[] = [];
  private _objectsChangeCallbacks: (() => void)[] = [];
  private _localObjectsChangeCallbacks: ((keys: Set<string>) => void)[] = [];
  private _lastAwarenessEmitTime: number = 0;
  private _awarenessEmitTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly AWARENESS_THROTTLE_INTERVAL = 100; // milliseconds

  /**
   * While greater than zero, update() only modifies local state (quadtree + idMap)
   * without writing to Yjs. Used during drag operations to avoid
   * redundant full serializations of every child object per frame.
   */
  private _localOnlyDepth = 0;

  /** Stack of agent origins; writes use the top one instead of `'local'`. */
  private _originStack: KritzelAgentOrigin[] = [];
  /** Objects whose local writes go to an agent's running action (see `routeLocalWrites`). */
  private readonly _routedObjects = new Map<string, KritzelAgentOrigin>();
  /** Routed objects a running `transaction()` changed: written once it ends. */
  private readonly _deferredRoutedWrites = new Map<string, KritzelAgentOrigin>();
  /** Nesting depth of `transaction()`. */
  private _transactionDepth = 0;
  /** Per-agent histories, keyed by agentic cursor ID. */
  private _agents = new Map<string, KritzelAgentHistory>();
  private _beforeDestroyCallbacks: (() => void)[] = [];
  private _historyClearedCallbacks: (() => void)[] = [];
  /** Object the local user is drawing; also tracked without awareness. */
  private _localActiveDrawingObjectId: string | null = null;
  /** Stack item meta key holding the object IDs an agent step touched. */
  private static readonly AGENT_IDS_META = 'kritzel:objectIds';
  /** Stack item meta key holding the group (e.g. a chat prompt) of steps moved to the user's history. */
  private static readonly ACTOR_GROUP_META = 'kritzel:actorGroup';

  /**
   * Tracks whether we're currently executing inside a `transaction()`
   * callback. While true, `markUndoBoundary()` is a no-op so nested
   * insert/remove calls don't split the in-progress undo step.
   */
  private _inTransaction = false;

  /**
   * Indicates whether the object map has been initialized and is ready for use.
   * @returns `true` if providers are connected and the map is operational
   */
  get isReady(): boolean {
    return this._isReady;
  }

  /**
   * Promise that settles when network providers finish connecting.
   * Resolves immediately if no network providers. Awaited by the loading overlay.
   */
  whenNetworkSynced(): Promise<void> {
    return this._networkSyncPromise ?? Promise.resolve();
  }

  /**
   * Whether this map runs detached from the rendered canvas.
   */
  get isHeadless(): boolean {
    return this._headless;
  }

  /**
   * Returns the Yjs Awareness instance, if a network provider is available.
   */
  get awareness(): Awareness | null {
    return this._awareness;
  }

  /**
   * Whether a network awareness instance is available.
   */
  get hasAwareness(): boolean {
    return !!this._awareness;
  }

  /**
   * Returns the local client ID from the awareness instance.
   * Used to filter out the local user when rendering remote cursors.
   */
  get localClientId(): number | null {
    return this._awareness?.clientID ?? null;
  }

  /**
   * The Yjs client ID of this document. Equals the awareness client ID whenever awareness exists,
   * and also identifies this tab when there is no awareness.
   */
  get docClientId(): number | null {
    return this._ydoc?.clientID ?? null;
  }

  /** ID of the object the local user is currently drawing, also without awareness. */
  get localActiveDrawingObjectId(): string | null {
    return this._localActiveDrawingObjectId;
  }

  /** The agent origin writes currently use, or `null` for regular `'local'` writes. */
  get activeAgentOrigin(): KritzelAgentOrigin | null {
    return this._originStack.length > 0 ? this._originStack[this._originStack.length - 1] : null;
  }

  /** Origin for persisted writes. */
  private get writeOrigin(): 'local' | KritzelAgentOrigin {
    return this.activeAgentOrigin ?? 'local';
  }

  /**
   * Routes the local user's writes to an object through an agent origin until the returned function is called:
   * they then belong to that agent's running action, e.g. the user moving a placeholder the action waits to fill,
   * so rolling the action back or undoing it covers them too. Inside `transaction()` they are written right after
   * it, in a transaction of their own. @internal
   */
  routeLocalWrites(objectId: string, origin: KritzelAgentOrigin): () => void {
    this._routedObjects.set(objectId, origin);
    return () => {
      if (this._routedObjects.get(objectId) === origin) {
        this._routedObjects.delete(objectId);
      }
    };
  }

  /** The origin a local write to an object is routed through, if any (see `routeLocalWrites`). */
  private routedOrigin(objectId: string): KritzelAgentOrigin | undefined {
    return this.activeAgentOrigin ? undefined : this._routedObjects.get(objectId);
  }

  /** Writes the routed objects a `transaction()` changed, each in a transaction with its origin. */
  private flushRoutedWrites(): void {
    if (this._deferredRoutedWrites.size === 0) {
      return;
    }
    const writes = Array.from(this._deferredRoutedWrites);
    this._deferredRoutedWrites.clear();
    for (const [id, origin] of writes) {
      const object = this._idMap.get(id);
      this._ydoc?.transact(() => {
        if (object && this.isPersistable(object)) {
          this._objectsMap?.set(id, object.serialize());
        } else if (!object) {
          this._objectsMap?.delete(id);
        }
      }, origin);
    }
  }

  /**
   * Whether a Yjs transaction or its observer phase is running. Undo managers must not be
   * driven from inside one: Yjs would record the resulting changes as part of the running undo.
   */
  get isInsideYjsCallback(): boolean {
    const doc = this._ydoc as (Y.Doc & { _transaction: unknown; _transactionCleanups: unknown[] }) | null;
    return !!doc && (doc._transaction !== null || doc._transactionCleanups.length > 0);
  }

  /**
   * Runs `fn` with an agent origin: every write inside goes to that agent's history instead of the
   * user's. `fn` must be synchronous so the origin never leaks to other code.
   */
  withOrigin<R>(origin: KritzelAgentOrigin, fn: () => R): R {
    if (!origin) {
      throw new TypeError('An agent origin is required.');
    }
    this._originStack.push(origin);
    try {
      const result = fn();
      if (result && typeof (result as unknown as PromiseLike<unknown>).then === 'function') {
        throw new TypeError('withOrigin callbacks must be synchronous.');
      }
      return result;
    } finally {
      this._originStack.pop();
    }
  }

  /**
   * Sets the local user identity in the awareness state.
   * This broadcasts the user's identity to all connected peers.
   */
  setLocalUser(user?: IKritzelUser): void {
    if (!this._awareness || !user) {
      return;
    }
    const displayName = user.displayName || user.firstName || 'Anonymous';
    this._awareness.setLocalStateField('user', {
      id: user.id,
      displayName,
      color: user.color || KritzelUserColorHelper.generateColorFromName(displayName),
    });
  }

  /**
   * Shares the agents of this client with collaborators (awareness field `agents`); `null` or an
   * empty list removes the field. No-op without awareness and for background maps.
   */
  setLocalAgents(agents: KritzelAwarenessAgent[] | null): void {
    if (!this._awareness || this._headless) {
      return;
    }
    this._awareness.setLocalStateField('agents', agents && agents.length > 0 ? agents : null);
  }

  /**
   * Updates the local cursor position in the awareness state.
   * This broadcasts the cursor position to all connected peers.
   */
  updateCursorPosition(x: number, y: number): void {
    if (!this._awareness) {
      return;
    }
    this._awareness.setLocalStateField('cursor', { x, y });
  }

  /**
   * Clears the local cursor position (e.g., when the pointer leaves the canvas).
   */
  clearCursorPosition(): void {
    if (!this._awareness) {
      return;
    }
    this._awareness.setLocalStateField('cursor', null);
  }

  /**
   * Sets the ID of the object currently being drawn by the local user.
   * Remote clients use this to derive cursor position from the object's latest
   * coordinates instead of the throttled awareness cursor, reducing desync.
   * Pass `null` when drawing ends.
   */
  setActiveDrawingObject(objectId: string | null): void {
    this._localActiveDrawingObjectId = objectId;
    if (!this._awareness) {
      return;
    }
    this._awareness.setLocalStateField('activeObjectId', objectId);
  }

  /**
   * Broadcasts the local user's selection box bounds via awareness.
   * Remote clients use this to render the selection rectangle in the user's color.
   */
  setLocalSelectionBox(box: { x: number; y: number; width: number; height: number }): void {
    if (!this._awareness) {
      return;
    }
    this._awareness.setLocalStateField('selectionBox', box);
  }

  /**
   * Clears the local selection box from awareness (e.g., when selection completes or is cancelled).
   */
  clearLocalSelectionBox(): void {
    if (!this._awareness) {
      return;
    }
    this._awareness.setLocalStateField('selectionBox', null);
  }

  /**
   * Removes selection groups whose owner is no longer present in awareness.
   * Called when remote clients disconnect to prevent orphaned selection groups
   * from persisting in the workspace state.
   */
  removeOrphanedSelectionGroups(): void {
    if (!this._awareness) {
      return;
    }

    const states = this._awareness.getStates();
    const activeUserIds = new Set<string>();
    states.forEach(state => {
      const userId = (state.user as { id?: string } | undefined)?.id;
      if (userId) {
        activeUserIds.add(userId);
      }
    });

    const localUserId = this._core?.user?.id;

    const orphanedGroups = this.quadtree.filter(
      o => o instanceof KritzelSelectionGroup
        && o.userId != null
        && o.userId !== localUserId
        && !activeUserIds.has(o.userId),
    );

    for (const group of orphanedGroups) {
      this.quadtree.remove(o => o.id === group.id);
      this._idMap.delete(group.id);

      if (this._objectsMap) {
        this._ydoc!.transact(() => {
          this._objectsMap!.delete(group.id);
        }, 'local');
      }
    }

    if (orphanedGroups.length > 0) {
      this._core?.store.invalidateSelectionCache();
      this.requestRerender();
    }
  }

  /** Rerenders the canvas unless this map is running headless. */
  private requestRerender(): void {
    if (this._headless) {
      return;
    }
    this._core?.rerender();
  }

  /**
   * Registers a callback to be invoked when the awareness state changes.
   * The callback receives the full awareness states map.
   */
  onAwarenessChange(callback: (states: Map<number, Record<string, any>>) => void): () => void {
    this._awarenessChangeCallbacks.push(callback);

    return () => {
      this._awarenessChangeCallbacks = this._awarenessChangeCallbacks.filter(existingCallback => existingCallback !== callback);
    };
  }

  /**
   * Registers a callback for object changes written with the user's (`'local'`/`'temporary'`)
   * origin, with the changed object IDs. Agent writes and remote changes are not included.
   * Used to stop agentic actions when the user or host code changes one of their objects.
   */
  onLocalObjectsChange(callback: (keys: Set<string>) => void): () => void {
    this._localObjectsChangeCallbacks.push(callback);
    return () => {
      this._localObjectsChangeCallbacks = this._localObjectsChangeCallbacks.filter(existing => existing !== callback);
    };
  }

  /**
   * Registers a callback to be invoked when remote object changes are received.
   * Used by the awareness cursors component to re-derive cursor positions
   * from the latest object data when a remote user is actively drawing.
   */
  onObjectsChange(callback: () => void): () => void {
    this._objectsChangeCallbacks.push(callback);

    return () => {
      this._objectsChangeCallbacks = this._objectsChangeCallbacks.filter(existingCallback => existingCallback !== callback);
    };
  }

  /**
   * Returns the Yjs UndoManager instance for managing undo/redo operations.
   * @returns The UndoManager instance, or `null` if not initialized
   */
  get undoManager(): Y.UndoManager | null {
    return this._undoManager;
  }

  /**
   * Returns the unique identifier of the workspace this object map belongs to.
   * @returns The workspace ID, or `null` if not initialized
   */
  get workspaceId(): string | null {
    return this._workspaceId;
  }

  /**
   * Returns the current state of the undo/redo system.
   * @returns An object containing undo/redo availability and stack sizes
   */
  get undoState(): KritzelUndoState {
    return {
      canUndo: this._undoManager ? this._undoManager.canUndo() : false,
      canRedo: this._undoManager ? this._undoManager.canRedo() : false,
      undoStackSize: this._undoManager ? this._undoManager.undoStack.length : 0,
      redoStackSize: this._undoManager ? this._undoManager.redoStack.length : 0,
    };
  }

  /**
   * Returns the total number of objects stored in the map.
   * @returns The count of all objects in the quadtree
   */
  get totalCount(): number {
    return this.quadtree.size;
  }

  /**
   * Retrieves an object from the map by its ID in O(1) time.
   * @param id - The ID of the object to find
   * @returns The object if found, or undefined
   */
  findById(id: string): T | undefined {
    return this._idMap.get(id);
  }

  /**
   * Creates a new KritzelObjectMap instance with an empty quadtree.
   * The map must be initialized with `initialize()` before use.
   */
  constructor() {
    this.quadtree = new KritzelQuadtree<T>(
      {
        x: -Infinity,
        y: -Infinity,
        z: 0,
        width: Infinity,
        height: Infinity,
      },
      8
    );
  }

  /**
   * Initializes the object map with Yjs document, sync providers, and undo manager.
   * This must be called before using any other methods on the object map.
   *
   * @param core - The KritzelCore instance that owns this object map
   * @param workspaceId - A unique identifier for the workspace, used to namespace the Yjs document
   * @param config - Optional sync configuration; defaults to DEFAULT_SYNC_CONFIG if not provided
   * @param options - Optional behavior flags
   * @param options.headless - Run detached from the rendered canvas (no rerenders, events, or awareness)
   * @param options.workspaceName - Workspace name to write into document metadata; defaults to the active workspace's name
   * @returns A promise that resolves when all providers are connected and the map is ready
   */
  async initialize(
    core: KritzelCore,
    workspaceId: string,
    config?: KritzelSyncConfig,
    options?: { headless?: boolean; workspaceName?: string },
  ): Promise<void> {
    this._core = core;
    this._workspaceId = workspaceId;
    this._headless = options?.headless ?? false;
    this._reviver = new KritzelReviver(core);

    // Create a dedicated Y.Doc for this workspace
    this._ydoc = new Y.Doc();
    this._objectsMap = this._ydoc.getMap('objects');
    this._metadataMap = this._ydoc.getMap('metadata');

    const docName = core.editorId ? `kritzel-workspace-${core.editorId}-${workspaceId}` : `kritzel-workspace-${workspaceId}`;
    const finalConfig = config ?? DEFAULT_SYNC_CONFIG;

    // Instantiate providers from configuration
    const showSyncProviderInfo = !!core.store?.state?.debugInfo?.showSyncProviderInfo;
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
      console.info(`[Kritzel] Workspace sync providers initialized for ${docName}: ${providerList || 'none'}`);
    }

    // captureTimeout is effectively infinite — undo-step boundaries are
    // marked explicitly via markUndoBoundary() in insert/remove/reset and
    // at stroke/gesture boundaries in the tools. This prevents a single
    // brush stroke from being split when the user pauses after pointerdown.
    this._undoManager = new Y.UndoManager([this._objectsMap], {
      captureTimeout: Number.MAX_SAFE_INTEGER,
      trackedOrigins: new Set(['local', 'temporary']),
      ignoreRemoteMapChanges: true,
    });

    // Store handler references for cleanup
    this._stackItemAddedHandler = event => {
      if (event.type === 'undo') {
        // Track if this was a temporary item
        if (event.origin === 'temporary') {
          this._temporaryItemsCount++;
        }
      }
    };

    this._stackItemPoppedHandler = event => {
      if (event.type === 'undo') {
        // Reduce temporary count when items are undone
        if (event.origin === 'temporary' && this._temporaryItemsCount > 0) {
          this._temporaryItemsCount--;
        }
      }
    };

    this._undoManager.on('stack-item-added', this._stackItemAddedHandler);
    this._undoManager.on('stack-item-popped', this._stackItemPoppedHandler);

    // Observe changes to objects and sync with application state
    this._objectsObserver = event => {
      this.handleObjectsChange(event);
    };
    this._objectsMap.observe(this._objectsObserver);

    // Separate local providers (IndexedDB, BroadcastChannel) from network providers (Hocuspocus, WebSocket)
    // Local providers are awaited so data is available immediately; network providers sync in the background
    // via Yjs observers that are already registered above.
    const localProviders = this._providers.filter(p => p.type === 'local');
    const networkProviders = this._providers.filter(p => p.type === 'network');

    // Await local providers for immediate data availability
    const localResults = await Promise.allSettled(localProviders.map(p => p.connect()));
    if (showSyncProviderInfo) {
      const connectedLocalCount = localResults.filter(result => result.status === 'fulfilled').length;
      console.info(`[Kritzel] Workspace local providers connected: ${connectedLocalCount}/${localProviders.length}`);
    }
    localResults.forEach((result, i) => {
      if (showSyncProviderInfo && result.status === 'rejected') {
        console.error(`[Kritzel] Sync provider "${localProviders[i]?.constructor.name}" failed to connect:`, result.reason);
      }
    });

    // Connect network providers in the background (remote data arrives via Yjs observers)
    if (showSyncProviderInfo && networkProviders.length > 0) {
      console.info(`[Kritzel] Workspace network providers connecting in background: ${networkProviders.length}`);
    }
    const networkConnectPromises = networkProviders.map(provider =>
      provider.connect().catch(err => {
        if (showSyncProviderInfo) {
          console.error(`[Kritzel] Network sync provider "${provider.constructor.name}" failed to connect:`, err);
        }
      }),
    );
    // Network sync awaited by loading overlay to show remote workspace hydration
    this._networkSyncPromise = networkConnectPromises.length > 0 ? Promise.allSettled(networkConnectPromises).then(() => undefined) : null;
    this._isReady = true;

    // Find the first provider that exposes awareness: network providers first, then local ones that opt in
    // (BroadcastSyncProvider.with({ awareness: true })). Awareness exists right after construction.
    for (const provider of [...networkProviders, ...localProviders]) {
      if (provider.awareness) {
        this._awareness = provider.awareness;
        break;
      }
    }

    // Subscribe to awareness changes
    if (this._awareness && !this._headless) {
      this._awarenessChangeHandler = (change: { added: number[]; updated: number[]; removed: number[] }) => {
        // Clean up selection groups belonging to disconnected users
        if (change.removed.length > 0) {
          this.removeOrphanedSelectionGroups();
        }

        const now = Date.now();
        const timeSinceLastEmit = now - this._lastAwarenessEmitTime;

        // Clear any pending timeout since we have a new event
        if (this._awarenessEmitTimeout !== null) {
          clearTimeout(this._awarenessEmitTimeout);
          this._awarenessEmitTimeout = null;
        }

        if (timeSinceLastEmit >= this.AWARENESS_THROTTLE_INTERVAL) {
          // Enough time has passed, emit immediately
          this._lastAwarenessEmitTime = now;
          const states = this._awareness!.getStates();
          for (const callback of this._awarenessChangeCallbacks) {
            callback(states);
          }
        } else {
          // Schedule emission for the remaining time
          const delayMs = this.AWARENESS_THROTTLE_INTERVAL - timeSinceLastEmit;
          this._awarenessEmitTimeout = setTimeout(() => {
            this._lastAwarenessEmitTime = Date.now();
            this._awarenessEmitTimeout = null;
            const states = this._awareness!.getStates();
            for (const callback of this._awarenessChangeCallbacks) {
              callback(states);
            }
          }, delayMs);
          if (typeof this._awarenessEmitTimeout.unref === 'function') {
            this._awarenessEmitTimeout.unref();
          }
        }
      };
      this._awareness.on('change', this._awarenessChangeHandler);
    }

    // Initialize document metadata (only if not already set by a previous client)
    const workspaceName = options?.workspaceName ?? core.store?.state?.activeWorkspace?.name ?? '';
    this.initializeMetadata('workspace', workspaceId, workspaceName);

    // Run any pending schema migrations before loading data
    const quietMigrations = !core.store?.state?.debugInfo?.showMigrationInfo;
    runMigrations(this._ydoc, this._metadataMap, { objects: this._objectsMap }, WORKSPACE_MIGRATIONS, CURRENT_WORKSPACE_SCHEMA_VERSION, { quiet: quietMigrations });

    // Load objects from Yjs
    this.loadFromYjs();
  }

  /**
   * Handles changes to the Yjs objects map, synchronizing remote changes with local state.
   * For local changes, only triggers a re-render. For remote changes, deserializes objects
   * and updates the quadtree, handling SelectionGroups specially to maintain correct dimensions.
   *
   * @param event - The Yjs map event containing information about changed keys and their actions
   */
  private handleObjectsChange(event: Y.YMapEvent<any>): void {
    const origin = event.transaction.origin;

    // Agent changes are local too: the instances are already up to date. Record the changed
    // keys for the running action and keep selection frames that contain them in sync.
    if (origin instanceof KritzelAgentOrigin) {
      origin.recordKeyChanges(event.changes.keys as Map<string, { action: 'add' | 'update' | 'delete' }>);
      this.refreshSelectionGroupsContaining(new Set(event.keysChanged), new Set());
      this.requestRerender();
      return;
    }

    // Skip Map updates for local changes (already done), but still trigger re-render
    // 'temporary' is also a local change that shouldn't be re-deserialized
    if (origin === 'local' || origin === 'temporary') {
      if (this._agents.size > 0 || this._localObjectsChangeCallbacks.length > 0) {
        const keys = new Set<string>(event.keysChanged);
        // A local write saved the whole instance, including any pending agent changes:
        // agents must not write these objects again when they commit.
        this._agents.forEach(agent => agent.origin.forgetLocalOnly(keys));
        this._localObjectsChangeCallbacks.forEach(callback => KritzelEventHelper.callListener(() => callback(keys), 'Local objects change callback'));
      }
      this.requestRerender();
      return;
    }

    // Skip migration transactions — data will be loaded fresh via loadFromYjs()
    if (event.transaction.origin === 'migration') {
      return;
    }

    const changedKeys = Array.from(event.keysChanged);
    const objectsToUpdate: any[] = [];
    const selectionGroupsToUpdate: KritzelSelectionGroup[] = [];
    const objectsToDelete: any[] = [];

    // The reverse anchor index (targetObjectId -> anchored lines) is derived runtime
    // state that is NOT synced via Yjs. When line anchor connections arrive through a
    // remote change it must be rebuilt, otherwise getLinesAnchoredTo/updateAnchorsForObject
    // return stale/empty results on this client (e.g. anchored lines fail to follow a
    // locally-moved target, leaving selection UI and anchors visually offset).
    let anchorIndexNeedsRebuild = false;

    changedKeys.forEach(key => {
      const change = event.changes.keys.get(key);

      if (change && change.action === 'delete') {
        objectsToDelete.push(key);
        if (this._idMap.get(key) instanceof KritzelLine) {
          anchorIndexNeedsRebuild = true;
        }
      } else {
        const serialized = this._objectsMap?.get(key);
        if (serialized) {
          const object = this._reviver?.revive(serialized);

          // Separate SelectionGroups to process them after regular objects
          if (object instanceof KritzelSelectionGroup) {
            selectionGroupsToUpdate.push(object);
          } else {
            objectsToUpdate.push(object);
            if (object instanceof KritzelLine) {
              anchorIndexNeedsRebuild = true;
            }
          }
        }
      }
    });

    // Delete objects from local map
    objectsToDelete.forEach(objectId => {
      const existingObject = this._idMap.get(objectId);
      if (existingObject instanceof KritzelSelectionGroup) {
        // Remote deletion of a selection group must also clear the transient
        // selection flags it had applied to its children locally.
        existingObject.deselectAllChildren?.();
      }

      // Deletes from collaborators, undo/redo and agent rollbacks never pass through
      // core.removeObject(), and the viewport sweep can no longer find the object once it
      // is gone: release iframes and renderers here, or their listeners leak.
      if (ObjectHelper.isKritzelEmbeddedObject(existingObject)) {
        existingObject.unmount();
      }

      this.quadtree.remove(o => o.id === objectId);
      this._idMap.delete(objectId);
    });

    // Track which objects are added vs updated for granular events
    const addedObjects: KritzelBaseObject<any>[] = [];
    const updatedObjects: KritzelBaseObject<any>[] = [];

    // First, update or insert regular objects
    objectsToUpdate.forEach(object => {
      const existed = this._idMap.has(object.id);
      if (existed) {
        const previous = this._idMap.get(object.id);
        if (previous && typeof object.adoptTransientStateFrom === 'function') {
          object.adoptTransientStateFrom(previous);
        }
        this.quadtree.reindex(object);
        this._idMap.set(object.id, object);
        updatedObjects.push(object);
      } else {
        this.quadtree.insert(object);
        this._idMap.set(object.id, object);
        addedObjects.push(object);
      }
    });

    // Then, update or insert SelectionGroups
    const updatedSelectionGroupIds = new Set<string>();
    selectionGroupsToUpdate.forEach(object => {
      const existed = this._idMap.has(object.id);
      if (existed) {
        const previous = this._idMap.get(object.id);
        if (previous && typeof (object as any).adoptTransientStateFrom === 'function') {
          (object as any).adoptTransientStateFrom(previous);
        }
        this.quadtree.reindex(object as unknown as T);
        this._idMap.set(object.id, object as unknown as T);
      } else {
        this.quadtree.insert(object as unknown as T);
        this._idMap.set(object.id, object as unknown as T);
      }
      updatedSelectionGroupIds.add(object.id);

      // After undo/redo, the SelectionGroup's dimensions may be stale because:
      // 1. The serialized state contains the old bounding box
      // 2. The child objects have been reverted to their previous positions
      // We need to invalidate the cache and recalculate dimensions
      // skipPersist=true prevents creating new undo entries
      object.invalidateObjectsCache();
      object.refreshObjectDimensions(undefined, true);
      object.captureUnchangedSnapshots();
      // Update quadtree again with corrected dimensions
      this.quadtree.reindex(object as unknown as T);
    });

    // If regular objects were changed but their SelectionGroup wasn't explicitly updated,
    // we still need to refresh that SelectionGroup's dimensions
    if (objectsToUpdate.length > 0 || objectsToDelete.length > 0) {
      const changedObjectIds = new Set<string>([
        ...objectsToUpdate.map(o => o.id),
        ...objectsToDelete
      ]);
      this.refreshSelectionGroupsContaining(changedObjectIds, updatedSelectionGroupIds);
    }

    if (this._headless) {
      return;
    }

    // Changes made by an agent's undo/redo carry that agent as source; its rollbacks are silent.
    const agent = this.findAgentByUndoManager(origin);
    const suppressEvents = !!agent?.suppressEvents;
    const source: KritzelObjectChangeSource | undefined = agent?.historyAction
      ? { type: 'agent', agentId: agent.origin.agentId, actionType: agent.historyAction }
      : undefined;

    // Rebuild the anchor index if any line anchor connections may have changed, so that
    // subsequent local operations (moving a target, refreshing selection UI) resolve the
    // correct anchored lines on this client.
    if (anchorIndexNeedsRebuild) {
      this._core?.anchorManager.rebuildIndex();
    }

    // Invalidate the store's selection cache so it fetches the updated SelectionGroup
    this._core?.store.invalidateSelectionCache();

    this._core?.rerender();

    // Emit granular lifecycle events
    if (!suppressEvents) {
      if (addedObjects.length > 0) {
        if (source) {
          this._core?.engine.emitObjectsAdded(addedObjects, source);
        } else {
          this._core?.engine.emitObjectsAdded(addedObjects);
        }
      }
      if (objectsToDelete.length > 0) {
        // For deleted objects we only have IDs, not the full objects
        // Create minimal object references with the IDs
        const removedObjects = objectsToDelete.map(id => ({ id } as KritzelBaseObject<any>));
        if (source) {
          this._core?.engine.emitObjectsRemoved(removedObjects, source);
        } else {
          this._core?.engine.emitObjectsRemoved(removedObjects);
        }
      }
      if (updatedObjects.length > 0) {
        const updated = updatedObjects.map(obj => ({ object: obj, changedProperties: [] as string[] }));
        if (source) {
          this._core?.engine.emitObjectsUpdated(updated, source);
        } else {
          this._core?.engine.emitObjectsUpdated(updated);
        }
      }
    }

    // Notify subscribers of remote object changes (e.g., awareness cursors)
    for (const callback of this._objectsChangeCallbacks) {
      callback();
    }
  }

  /**
   * Refreshes the frame of every stored selection group that contains one of `changedIds`.
   * Snapshots are not recaptured while the user is transforming, so a running drag, resize
   * or rotation keeps its stable starting point.
   */
  private refreshSelectionGroupsContaining(changedIds: Set<string>, skipGroupIds: Set<string>): void {
    if (changedIds.size === 0) {
      return;
    }
    const state = this._core?.store?.state;
    const isTransforming = !!state && (state.isDragging || state.isResizing || state.isRotating);
    const selectionGroups = this.quadtree.filter(
      o => o instanceof KritzelSelectionGroup && !skipGroupIds.has(o.id),
    ) as unknown as KritzelSelectionGroup[];

    for (const selectionGroup of selectionGroups) {
      if (!selectionGroup.objectIds.some(id => changedIds.has(id))) {
        continue;
      }
      selectionGroup.invalidateObjectsCache();
      selectionGroup.refreshObjectDimensions(undefined, true);
      if (!isTransforming) {
        selectionGroup.captureUnchangedSnapshots();
      }
      // Update quadtree with corrected dimensions
      this.quadtree.reindex(selectionGroup as unknown as T);
    }
  }

  /**
   * Initializes document metadata if not already set.
   * Uses 'metadata' transaction origin which is NOT tracked by the UndoManager.
   */
  private initializeMetadata(type: KritzelDocumentType, workspaceId: string, workspaceName: string): void {
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
        this._metadataMap?.set('schemaVersion', CURRENT_WORKSPACE_SCHEMA_VERSION);
      }
      this._metadataMap?.set('workspaceId', workspaceId);
      this._metadataMap?.set('workspaceName', workspaceName);
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
   * This change is synced to all connected clients and the server,
   * but is NOT tracked by the UndoManager.
   */
  setIsPublic(isPublic: boolean): void {
    if (!this._metadataMap || !this._ydoc) {
      return;
    }

    this._ydoc?.transact(() => {
      this._metadataMap?.set('isPublic', isPublic);
    }, 'metadata');
  }

  /**
   * Returns the document type stored in metadata.
   */
  getDocumentType(): KritzelDocumentType {
    return this._metadataMap?.get('type') ?? 'workspace';
  }

  /**
   * Returns the workspace name stored in metadata.
   */
  getWorkspaceName(): string {
    return this._metadataMap?.get('workspaceName') ?? '';
  }

  /**
   * Sets the workspace name in metadata.
   * This change is synced to all connected clients and the server,
   * but is NOT tracked by the UndoManager.
   */
  setWorkspaceName(name: string): void {
    if (!this._metadataMap || !this._ydoc) {
      return;
    }

    this._ydoc?.transact(() => {
      this._metadataMap?.set('workspaceName', name);
    }, 'metadata');
  }

  /**
   * Returns the workspace ID stored in metadata.
   */
  getMetadataWorkspaceId(): string {
    return this._metadataMap?.get('workspaceId') ?? '';
  }

  /**
     * Executes a callback within a Yjs transaction, grouping multiple operations
     * into a single undo step. All changes made within the callback will be
     * tracked as a single 'local' origin transaction.
     *
     * @param callback - The function containing operations to execute within the transaction
     */
  transaction(callback: () => void): void {
    if (this._ydoc) {
      this._inTransaction = true;
      this._transactionDepth++;
      try {
        this._ydoc.transact(callback, this.writeOrigin);
      } finally {
        this._inTransaction = false;
        if (--this._transactionDepth === 0) {
          this.flushRoutedWrites();
        }
      }
    }
  }

  /**
   * Closes the current undo stack item so the next tracked change starts
   * a new one. Call at gesture/stroke boundaries (e.g. drag/resize/rotate
   * end, brush/line/shape stroke end).
   *
   * No-op while a transaction() is open.
   */
  stopUndoCapturing(): void {
    this.markUndoBoundary();
  }

  /**
   * Internal: closes the current undo stack item. No-op while inside a
   * transaction() so wrapped multi-op work stays a single undo step.
   */
  private markUndoBoundary(): void {
    // Agent writes never close the user's undo step; agent boundaries are set by the action runner.
    if (this._inTransaction || this.activeAgentOrigin) {
      return;
    }
    this._undoManager?.stopCapturing();
  }

  /**
   * Executes a callback where all update() calls only modify local state
   * (quadtree + idMap) without writing to Yjs. This avoids expensive full
   * serializations during continuous operations like dragging many objects.
   *
   * Objects updated inside this callback must be persisted later
   * (e.g., via a normal update() call at drag end).
   *
   * @param callback - The function containing operations to execute locally
   */
  withLocalUpdatesOnly<R>(callback: () => R): R {
    this._localOnlyDepth++;
    try {
      return callback();
    } finally {
      this._localOnlyDepth--;
    }
  }

  /**
   * Loads all objects from the Yjs objects map into the local quadtree.
   * Clears the existing quadtree and repopulates it by deserializing each
   * object stored in the Yjs map.
   */
  loadFromYjs(): void {
    if (!this._objectsMap || !this._reviver) {
      return;
    }

    this.quadtree.reset();
    this._idMap.clear();

    const localUserId = this._core?.user?.id;
    const staleSelectionGroupIds: string[] = [];

    this._objectsMap.forEach((serialized, key) => {
      const object = this._reviver?.revive<T>(serialized);

      // Remove remote selection groups on startup — they are transient UI state
      // that should not survive an app restart. The owning user's session is gone.
      if (object instanceof KritzelSelectionGroup && object.userId != null && object.userId !== localUserId) {
        staleSelectionGroupIds.push(key);
        return;
      }

      if(!object) {
        return;
      }

      this.quadtree.insert(object);
      this._idMap.set(object.id, object);
    });

    // Clean up stale remote selection groups from Yjs
    if (staleSelectionGroupIds.length > 0) {
      this._ydoc!.transact(() => {
        for (const id of staleSelectionGroupIds) {
          this._objectsMap!.delete(id);
        }
      }, 'local');
    }
  }

  /**
   * Resets the object map by clearing both the local quadtree and the Yjs objects map.
   * This removes all objects from the workspace. The operation is tracked as a 'local'
   * transaction for undo/redo purposes.
   */
  reset(): void {
    this.quadtree.reset();
    this._idMap.clear();
    this.markUndoBoundary();
    this._ydoc?.transact(() => {
      this._objectsMap?.clear();
    }, this.writeOrigin);
  }

  /**
   * Inserts a new object into both the local quadtree and the Yjs objects map.
   * The object must have a valid ID. Non-persistable objects (like SelectionBox)
   * are only added to the quadtree, not to Yjs.
   *
   * @param object - The object to insert; must have a valid `id` property
   * @returns `true` if the object was successfully inserted, `false` if the object has no ID
   */
  insert(object: T): boolean {
    if (!object.id) {
      return false;
    }
    this.quadtree.insert(object);
    this._idMap.set(object.id, object);

    if (this._objectsMap && this.isPersistable(object)) {
      const serialized = object.serialize();
      this.markUndoBoundary();
      this._ydoc?.transact(() => {
        this._objectsMap?.set(object.id, serialized);
      }, this.writeOrigin);
    }

    return true;
  }

  /**
   * Updates an existing object in both the local quadtree and the Yjs objects map.
   * The object must already exist in the map. Supports temporary updates that can
   * be consolidated later (e.g., for incremental text input).
   *
   * @param object - The object with updated properties; must have a valid `id` that exists in the map
   * @param options - Optional settings for the update operation
   * @param options.temporary - If `true`, marks this as a temporary change that can be consolidated
   *                            with other temporary changes into a single undo step
   * @returns `true` if the object was successfully updated, `false` if the object doesn't exist or has no ID
   */
  update(object: T, options: { temporary?: boolean; skipReindex?: boolean } = {}): boolean {
    if (!object.id) {
      return false;
    }
    const existed = this._idMap.has(object.id);
    if (!existed) {
      return false;
    }
    const localOnly = this._localOnlyDepth > 0;
    if (localOnly || options.skipReindex) {
      this.quadtree.update(object);
    } else {
      this.quadtree.reindex(object);
    }
    this._idMap.set(object.id, object);

    if (localOnly) {
      // Remember agent changes that still have to be written when the action commits.
      this.activeAgentOrigin?.markLocalOnly(object.id);
    }

    if (!localOnly && this._objectsMap && this.isPersistable(object)) {
      const serialized = object.serialize();

      const routed = this.routedOrigin(object.id);
      if (routed && this._transactionDepth > 0) {
        // Written after the transaction, under its own origin.
        this._deferredRoutedWrites.set(object.id, routed);
        return true;
      }
      // Inside an agent scope even 'temporary' writes (e.g. text input) go to the agent's history.
      const origin = this.activeAgentOrigin ?? routed ?? (options.temporary ? 'temporary' : 'local');

      this._ydoc?.transact(() => {
        this._objectsMap?.set(object.id, serialized);
      }, origin);
    }

    return true;
  }

  /**
   * Removes objects matching the given predicate from both the quadtree and Yjs map.
   * Each removal is tracked as a separate 'local' transaction for undo/redo.
   *
   * @param predicate - A function that returns `true` for objects that should be removed
   */
  remove(predicate: (object: T) => boolean): void {
    const objectsToRemove = this.quadtree.filter(predicate);
    if (objectsToRemove.length === 0) {
      return;
    }
    this.markUndoBoundary();
    for (const object of objectsToRemove) {
      this.quadtree.remove(o => o.id === object.id);
      this._idMap.delete(object.id);

      if (this._objectsMap && this.isPersistable(object)) {
        const routed = this.routedOrigin(object.id);
        if (routed && this._transactionDepth > 0) {
          this._deferredRoutedWrites.set(object.id, routed);
          continue;
        }
        this._ydoc?.transact(() => {
          this._objectsMap?.delete(object.id);
        }, routed ?? this.writeOrigin);
      }
    }
  }

  /**
   * Filters objects in the quadtree based on a predicate function.
   *
   * @param predicate - A function that returns `true` for objects to include in the result
   * @returns An array of objects that match the predicate
   */
  filter(predicate: (object: T) => boolean): T[] {
    return this.quadtree.filter(predicate);
  }

  /**
   * Returns all objects stored in the quadtree.
   *
   * @returns An array containing all objects in the map
   */
  allObjects(): T[] {
    return this.quadtree.allObjects();
  }

  /**
   * Queries the quadtree for objects within or intersecting a given 3D range.
   * This is an efficient spatial query that avoids iterating over all objects.
   *
   * @param range - The bounding box to query
   * @param range.x - The x-coordinate of the range's origin
   * @param range.y - The y-coordinate of the range's origin
   * @param range.z - The z-coordinate (layer) of the range's origin
   * @param range.width - The width of the range
   * @param range.height - The height of the range
   * @param range.depth - Optional depth for 3D queries
   * @returns An array of objects within or intersecting the specified range
   */
  query(range: { x: number; y: number; z: number; width: number; height: number; depth?: number }): T[] {
    return this.quadtree.query(range);
  }

  /**
   * Determines whether an object should be persisted to the Yjs document.
   * Certain objects like SelectionBox are transient and should not be synced.
   *
   * @param object - The object to check for persistability
   * @returns `true` if the object should be persisted, `false` otherwise
   */
  private isPersistable(object: T): boolean {
    if (object instanceof KritzelSelectionBox) {
      return false;
    }

    return true;
  }

  /**
   * Undoes the last operation if possible.
   * Reverts the most recent change in the undo stack and emits an objects change event.
   */
  undo(): void {
    if (this._undoManager && this._undoManager.canUndo()) {
      this._undoManager.undo();
      this._core?.anchorManager.rebuildIndex();
      this._core?.engine.emitObjectsChange();
    }
  }

  /**
   * Redoes the last undone operation if possible.
   * Reapplies the most recent change from the redo stack and emits an objects change event.
   */
  redo(): void {
    if (this._undoManager && this._undoManager.canRedo()) {
      this._undoManager.redo();
      this._core?.anchorManager.rebuildIndex();
      this._core?.engine.emitObjectsChange();
    }
  }

  /**
   * Checks whether an undo operation is available.
   *
   * @returns `true` if there are operations in the undo stack, `false` otherwise
   */
  canUndo(): boolean {
    return this._undoManager ? this._undoManager.canUndo() : false;
  }

  /**
   * Checks whether a redo operation is available.
   *
   * @returns `true` if there are operations in the redo stack, `false` otherwise
   */
  canRedo(): boolean {
    return this._undoManager ? this._undoManager.canRedo() : false;
  }

  /**
   * Clears all undo and redo history.
   * After calling this, no undo or redo operations will be available.
   * Also resets the temporary items counter.
   */
  clearHistory(): void {
    if (this._undoManager) {
      this._undoManager.clear();
      this._temporaryItemsCount = 0;
    }
    this._agents.forEach(agent => agent.undoManager.clear());
    this._historyClearedCallbacks.forEach(callback => KritzelEventHelper.callListener(callback, 'onHistoryCleared callback'));
  }

  /**
   * Registers a callback that runs after `clearHistory()`, e.g. to update what agents report as undoable.
   * @returns A function that unregisters the callback
   */
  onHistoryCleared(callback: () => void): () => void {
    this._historyClearedCallbacks.push(callback);
    return () => {
      this._historyClearedCallbacks = this._historyClearedCallbacks.filter(existing => existing !== callback);
    };
  }

  // ─── Agent histories ─────────────────────────────────────────────────────────

  /**
   * Returns the origin of an agentic cursor, creating its history on first use.
   * Returns `null` when the map is not initialized or headless.
   */
  getAgentOrigin(cursorId: string): KritzelAgentOrigin | null {
    if (!this._objectsMap || !this._ydoc || this._headless) {
      return null;
    }
    let agent = this._agents.get(cursorId);
    if (!agent) {
      const origin = new KritzelAgentOrigin(cursorId);
      const undoManager = new Y.UndoManager([this._objectsMap], {
        captureTimeout: Number.MAX_SAFE_INTEGER,
        // Track exactly this origin instance (never the class: Yjs also matches origin.constructor).
        trackedOrigins: new Set<unknown>([origin]),
        // Agent undo never overwrites keys someone else changed since.
        ignoreRemoteMapChanges: false,
      });
      agent = { origin, undoManager, historyAction: null, suppressEvents: false };
      this._agents.set(cursorId, agent);
    }
    return agent.origin;
  }

  /** Closes the current step of an agent's history, so the next change starts a new step. */
  stopAgentCapturing(cursorId: string): void {
    this._agents.get(cursorId)?.undoManager.stopCapturing();
  }

  /** Number of steps in an agent's undo stack. */
  getAgentUndoStackLength(cursorId: string): number {
    return this._agents.get(cursorId)?.undoManager.undoStack.length ?? 0;
  }

  /** Undo state of an agent's history. */
  getAgentUndoState(cursorId: string): KritzelUndoState {
    const undoManager = this._agents.get(cursorId)?.undoManager;
    return {
      canUndo: !!undoManager && undoManager.undoStack.length > 0,
      canRedo: !!undoManager && undoManager.redoStack.length > 0,
      undoStackSize: undoManager?.undoStack.length ?? 0,
      redoStackSize: undoManager?.redoStack.length ?? 0,
    };
  }

  /** Stores the object IDs touched by an agent's newest step on that step. */
  tagLastAgentStackItem(cursorId: string, objectIds: string[]): void {
    const stack = this._agents.get(cursorId)?.undoManager.undoStack;
    if (stack && stack.length > 0) {
      stack[stack.length - 1].meta.set(KritzelObjectMap.AGENT_IDS_META, [...objectIds]);
    }
  }

  /** Object IDs touched by the newest step of an agent's undo or redo stack. */
  peekAgentObjectIds(cursorId: string, stack: 'undo' | 'redo'): string[] {
    const undoManager = this._agents.get(cursorId)?.undoManager;
    const items = stack === 'undo' ? undoManager?.undoStack : undoManager?.redoStack;
    if (!items || items.length === 0) {
      return [];
    }
    const ids = items[items.length - 1].meta.get(KritzelObjectMap.AGENT_IDS_META) as string[] | undefined;
    return ids ? [...ids] : [];
  }

  /** Undoes the newest step of an agent's history. Older steps are never touched. */
  undoAgent(cursorId: string): KritzelAgentHistoryResult {
    return this.applyAgentHistory(cursorId, 'undo');
  }

  /** Redoes the newest undone step of an agent's history. */
  redoAgent(cursorId: string): KritzelAgentHistoryResult {
    return this.applyAgentHistory(cursorId, 'redo');
  }

  /**
   * Reverts every agent step recorded after `undoLengthBefore` without emitting events,
   * and makes them non-redoable. Used to roll back an aborted action.
   * @returns `true` if something was rolled back
   */
  rollbackAgent(cursorId: string, undoLengthBefore: number): boolean {
    this.assertNotInsideYjsCallback();
    const agent = this._agents.get(cursorId);
    if (!agent) {
      return false;
    }
    const undoManager = agent.undoManager;
    undoManager.stopCapturing();
    if (undoManager.undoStack.length <= undoLengthBefore) {
      return false;
    }
    // Isolate the action's steps so popping can never fall through to older steps.
    const older = undoManager.undoStack.splice(0, undoLengthBefore);
    agent.suppressEvents = true;
    try {
      while (undoManager.undoStack.length > 0) {
        undoManager.undo();
      }
    } finally {
      agent.suppressEvents = false;
      undoManager.undoStack.unshift(...older);
    }
    // The aborted action must not be redoable.
    undoManager.clear(false, true);
    this._core?.anchorManager.rebuildIndex();
    this.requestRerender();
    return true;
  }

  /**
   * Takes an agent's redo steps aside while an action runs. Yjs would otherwise clear (and release)
   * them on the action's first write, so a rolled-back action could not leave the history as it was.
   * @returns The steps to pass to `resumeAgentRedo`
   */
  suspendAgentRedo(cursorId: string): unknown[] {
    const undoManager = this._agents.get(cursorId)?.undoManager;
    return undoManager ? undoManager.redoStack.splice(0) : [];
  }

  /**
   * Ends `suspendAgentRedo`. With `restore`, the steps become redoable again (after a rollback);
   * otherwise they are discarded properly, as a new change does.
   */
  resumeAgentRedo(cursorId: string, steps: unknown[], restore: boolean): void {
    const undoManager = this._agents.get(cursorId)?.undoManager;
    if (!undoManager || steps.length === 0) {
      return;
    }
    if (restore) {
      undoManager.redoStack.unshift(...(steps as typeof undoManager.redoStack));
      return;
    }
    undoManager.redoStack.unshift(...(steps as typeof undoManager.redoStack));
    undoManager.clear(false, true);
  }

  /**
   * Moves the steps an actor recorded after `fromLength` into the user's undo stack, as one step, so
   * changes made on the user's behalf undo like the user's own. The step goes to `userIndex` (the length of
   * the user's stack when the action started), but never above pending temporary items (typing that is
   * consolidated later). With a `group`, it merges into the step below when that one has the same group, so
   * all actions of one prompt undo together. The user's redo stack is cleared, like after any new change.
   * @returns `true` if a step was moved
   */
  moveActorStepToUser(actorId: string, options: { fromLength: number; userIndex: number; group?: string }): boolean {
    const agent = this._agents.get(actorId);
    const userUndo = this._undoManager;
    if (!agent || !userUndo) {
      return false;
    }
    const actorUndo = agent.undoManager;
    actorUndo.stopCapturing();
    const from = Math.max(0, options.fromLength);
    if (actorUndo.undoStack.length <= from) {
      return false;
    }

    const items = actorUndo.undoStack.splice(from);
    const ids = new Set<string>();
    items.forEach(item => ((item.meta.get(KritzelObjectMap.AGENT_IDS_META) as string[] | undefined) ?? []).forEach(id => ids.add(id)));
    const step = items[0];
    if (items.length > 1) {
      step.insertions = Y.mergeDeleteSets(items.map(item => item.insertions));
      step.deletions = Y.mergeDeleteSets(items.map(item => item.deletions));
    }

    // A new change invalidates what the user could redo.
    userUndo.clear(false, true);
    const stack = userUndo.undoStack;
    const top = Math.max(0, stack.length - this._temporaryItemsCount);
    const index = Math.min(Math.max(0, options.userIndex), top);
    const below = index > 0 ? stack[index - 1] : undefined;

    if (options.group !== undefined && below && below.meta.get(KritzelObjectMap.ACTOR_GROUP_META) === options.group) {
      below.insertions = Y.mergeDeleteSets([below.insertions, step.insertions]);
      below.deletions = Y.mergeDeleteSets([below.deletions, step.deletions]);
      const merged = new Set<string>((below.meta.get(KritzelObjectMap.AGENT_IDS_META) as string[] | undefined) ?? []);
      ids.forEach(id => merged.add(id));
      below.meta.set(KritzelObjectMap.AGENT_IDS_META, Array.from(merged));
    } else {
      step.meta.set(KritzelObjectMap.AGENT_IDS_META, Array.from(ids));
      if (options.group !== undefined) {
        step.meta.set(KritzelObjectMap.ACTOR_GROUP_META, options.group);
      } else {
        step.meta.delete(KritzelObjectMap.ACTOR_GROUP_META);
      }
      stack.splice(index, 0, step);
    }
    if (index >= stack.length - 1 - this._temporaryItemsCount) {
      // The moved step is the user's newest: their next change must not merge into it.
      userUndo.stopCapturing();
    }
    return true;
  }

  /** Destroys the history of an agentic cursor. */
  disposeAgent(cursorId: string): void {
    const agent = this._agents.get(cursorId);
    if (agent) {
      agent.undoManager.destroy();
      this._agents.delete(cursorId);
    }
  }

  /**
   * Registers a callback that runs at the start of `destroy()`, while the map is still usable.
   * @returns A function that unregisters the callback
   */
  onBeforeDestroy(callback: () => void): () => void {
    this._beforeDestroyCallbacks.push(callback);
    return () => {
      this._beforeDestroyCallbacks = this._beforeDestroyCallbacks.filter(existing => existing !== callback);
    };
  }

  private applyAgentHistory(cursorId: string, direction: 'undo' | 'redo'): KritzelAgentHistoryResult {
    this.assertNotInsideYjsCallback();
    const agent = this._agents.get(cursorId);
    const undoManager = agent?.undoManager;
    const stack = direction === 'undo' ? undoManager?.undoStack : undoManager?.redoStack;
    if (!agent || !undoManager || !stack || stack.length === 0) {
      return { status: 'empty', objectIds: [] };
    }
    undoManager.stopCapturing();
    const objectIds = (stack[stack.length - 1].meta.get(KritzelObjectMap.AGENT_IDS_META) as string[] | undefined) ?? [];

    // Isolate the top step: Yjs keeps popping until a step changes something, which would
    // otherwise apply older steps that were never conflict-checked.
    const older = stack.splice(0, stack.length - 1);
    agent.historyAction = direction;
    let item: unknown = null;
    try {
      item = direction === 'undo' ? undoManager.undo() : undoManager.redo();
    } finally {
      agent.historyAction = null;
      stack.unshift(...older);
    }

    if (!item) {
      // The step was fully superseded by other changes; Yjs dropped it.
      return { status: 'conflict', objectIds: [...objectIds] };
    }

    const target = direction === 'undo' ? undoManager.redoStack : undoManager.undoStack;
    if (target.length > 0) {
      target[target.length - 1].meta.set(KritzelObjectMap.AGENT_IDS_META, [...objectIds]);
    }
    this._core?.anchorManager.rebuildIndex();
    this._core?.engine.emitObjectsChange();
    return { status: 'done', objectIds: [...objectIds] };
  }

  private findAgentByUndoManager(origin: unknown): KritzelAgentHistory | null {
    if (!origin || this._agents.size === 0) {
      return null;
    }
    for (const agent of this._agents.values()) {
      if (agent.undoManager === origin) {
        return agent;
      }
    }
    return null;
  }

  private assertNotInsideYjsCallback(): void {
    if (this.isInsideYjsCallback) {
      throw new Error('Agent history cannot be changed from inside a Yjs transaction or observer.');
    }
  }

  /**
   * Consolidates all temporary items in the undo stack into a single undo item.
   * This is useful when you want to merge multiple incremental changes (e.g., individual
   * keystrokes during text editing) into a single undoable action.
   *
   * The method works by undoing all temporary items and then redoing them within
   * a single 'local' transaction, effectively merging them into one undo step.
   * After consolidation, the temporary items counter is reset to zero.
   *
   * @example
   * // After multiple temporary text updates
   * objectMap.update(textObject, { temporary: true }); // keystroke 1
   * objectMap.update(textObject, { temporary: true }); // keystroke 2
   * objectMap.consolidateTemporaryItems(); // merge into single undo step
   */
  consolidateTemporaryItems(): void {
    if (!this._undoManager || this._temporaryItemsCount === 0) {
      return;
    }

    // Get current stack length
    const stackLength = this._undoManager.undoStack.length;

    if (stackLength === 0) {
      this._temporaryItemsCount = 0;
      return;
    }

    // Stop tracking temporarily
    this._undoManager.stopCapturing();

    // The temporary items should be at the end of the stack
    // We'll need to undo them all, then redo as a single transaction
    const itemsToConsolidate = Math.min(this._temporaryItemsCount, stackLength);

    if (itemsToConsolidate > 1) {
      // Store the current state before undoing
      const undoneItems: any[] = [];

      // Undo all temporary items
      for (let i = 0; i < itemsToConsolidate; i++) {
        if (this._undoManager.canUndo()) {
          undoneItems.push(this._undoManager.undoStack[this._undoManager.undoStack.length - 1]);
          this._undoManager.undo();
        }
      }

      // Now redo them all as a single 'local' transaction
      // This will consolidate them into one undo item
      this._ydoc?.transact(() => {
        for (let i = itemsToConsolidate - 1; i >= 0; i--) {
          if (this._undoManager?.canRedo()) {
            this._undoManager.redo();
          }
        }
      }, 'local');
    } else if (itemsToConsolidate === 1) {
      // If only one temporary item, just change its origin to 'local'
      // This is implicit - next transaction will be separate
    }

    this._temporaryItemsCount = 0;
  }

  /**
   * Removes all temporary items from the undo stack without consolidating them.
   * Use this to discard temporary changes completely when they should not be
   * preserved in the undo history (e.g., when cancelling an operation).
   *
   * Unlike `consolidateTemporaryItems`, this method does not preserve the changes
   * as a single undo step - it simply removes them from history entirely.
   */
  clearTemporaryItems(): void {
    if (!this._undoManager || this._temporaryItemsCount === 0) {
      return;
    }

    const stackLength = this._undoManager.undoStack.length;
    const itemsToRemove = Math.min(this._temporaryItemsCount, stackLength);

    // Remove items from the end of the stack
    for (let i = 0; i < itemsToRemove; i++) {
      if (this._undoManager.undoStack.length > 0) {
        this._undoManager.undoStack.pop();
      }
    }

    this._temporaryItemsCount = 0;
  }

  /**
   * Hot-swaps sync providers on the existing Y.Doc without destroying the document,
   * objects, undo manager, or quadtree. Tears down old awareness subscriptions,
  /**
   * Destroys the object map and releases all resources.
   * This removes all observers, destroys the undo manager, disconnects all providers,
   * and destroys the Yjs document. After calling this, the object map cannot be used.
   */
  destroy(): void {
    // Let owners (e.g. running agentic actions) clean up while the map is still usable
    const beforeDestroyCallbacks = this._beforeDestroyCallbacks;
    this._beforeDestroyCallbacks = [];
    beforeDestroyCallbacks.forEach(callback => KritzelEventHelper.callListener(callback, 'onBeforeDestroy callback'));

    // Destroy agent histories
    this._agents.forEach(agent => agent.undoManager.destroy());
    this._agents.clear();
    this._originStack = [];
    this._localOnlyDepth = 0;
    this._localActiveDrawingObjectId = null;

    // Unobserve the objects map
    if (this._objectsMap && this._objectsObserver) {
      this._objectsMap.unobserve(this._objectsObserver);
      this._objectsObserver = null;
    }

    // Remove undo manager event listeners
    if (this._undoManager) {
      if (this._stackItemAddedHandler) {
        this._undoManager.off('stack-item-added', this._stackItemAddedHandler);
        this._stackItemAddedHandler = null;
      }
      if (this._stackItemPoppedHandler) {
        this._undoManager.off('stack-item-popped', this._stackItemPoppedHandler);
        this._stackItemPoppedHandler = null;
      }
      this._undoManager.destroy();
      this._undoManager = null;
    }

    // Reset quadtree
    this.quadtree.reset();
    this._idMap.clear();

    // Clean up awareness
    if (this._awareness && this._awarenessChangeHandler) {
      this._awareness.off('change', this._awarenessChangeHandler);
      this._awarenessChangeHandler = null;
    }
    if (this._awarenessEmitTimeout !== null) {
      clearTimeout(this._awarenessEmitTimeout);
      this._awarenessEmitTimeout = null;
    }
    this._awareness = null;
    this._awarenessChangeCallbacks = [];
    this._localObjectsChangeCallbacks = [];

    // Destroy providers (destroy handles disconnection internally)
    this._providers.forEach(p => {
      p.destroy();
    });
    this._providers = [];

    // Clear object map references
    this._objectsMap = null;
    this._metadataMap = null;

    // Destroy Y.Doc
    if (this._ydoc) {
      this._ydoc.destroy();
      this._ydoc = null;
    }

    // Clear remaining references
    this._core = null;
    this._reviver = null;
    this._workspaceId = null;
    this._isReady = false;
    this._temporaryItemsCount = 0;
  }
}
