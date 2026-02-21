import * as Y from 'yjs';
import { KritzelWorkspace } from '../core/workspace.class';
import type { KritzelCore } from '../core/core.class';
import { ISyncProvider } from '../../interfaces/sync-provider.interface';
import { KritzelSyncConfig } from '../../interfaces/sync-config.interface';
import { DEFAULT_SYNC_CONFIG } from '../../configs/default-sync.config';

export class KritzelAppStateMap {
  private map: Map<string, KritzelWorkspace>;
  private _ydoc: Y.Doc | null = null;
  private _workspacesMap: Y.Map<any> | null = null;
  private _providers: ISyncProvider[] = [];
  private _core: KritzelCore | null = null;
  private _isReady: boolean = false;
  private _onRemoteChangeCallback: (() => void) | null = null;
  private _workspacesObserver: ((event: Y.YMapEvent<any>) => void) | null = null;

  get isReady(): boolean {
    return this._isReady;
  }

  constructor() {
    this.map = new Map<string, KritzelWorkspace>();
  }

  onRemoteChange(callback: () => void): void {
    this._onRemoteChangeCallback = callback;
  }

  async initialize(core: KritzelCore, config?: KritzelSyncConfig): Promise<void> {
    this._core = core;

    // Create a dedicated Y.Doc for app state (workspaces)
    this._ydoc = new Y.Doc();
    this._workspacesMap = this._ydoc.getMap('workspaces');

    const docName = 'kritzel-app-state';
    const finalConfig = config ?? DEFAULT_SYNC_CONFIG;

    // Instantiate providers from configuration
    for (const providerConfig of finalConfig.providers) {
      let provider: ISyncProvider;

      // Check if it's a class constructor or a factory
      if (typeof providerConfig === 'function') {
        // It's a class constructor
        provider = new providerConfig(docName, this._ydoc);
      } else {
        // It's a factory with a create method
        provider = providerConfig.create(docName, this._ydoc);
      }

      this._providers.push(provider);
    }

    // Observe changes to workspaces and sync with application state
    this._workspacesObserver = event => {
      this.handleWorkspacesChange(event);
    };
    this._workspacesMap.observe(this._workspacesObserver);

    // Connect all providers in parallel
    await Promise.all(this._providers.map(p => p.connect()));
    this._isReady = true;

    // Load workspaces from Yjs
    this.loadFromYjs();
  }

  private handleWorkspacesChange(event: Y.YMapEvent<any>): void {
    // Skip Map updates for local changes (already done), but still trigger re-render
    if (event.transaction.origin === 'local') {
      this._core?.rerender();
      return;
    }

    const changedKeys = Array.from(event.keysChanged);
    const workspacesToUpdate = [];
    const workspacesToDelete = [];

    changedKeys.forEach(key => {
      const change = event.changes.keys.get(key);

      if (change && change.action === 'delete') {
        workspacesToDelete.push(key);
      } else {
        const serialized = this._workspacesMap.get(key);
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

  private reviveWorkspace(serialized: any): KritzelWorkspace {
    const workspace = new KritzelWorkspace(
      serialized.id,
      serialized.name,
      serialized.viewport
    );
    workspace._core = this._core;
    workspace.createdAt = new Date(serialized.createdAt);
    workspace.updatedAt = new Date(serialized.updatedAt);
    return workspace;
  }

  transaction(callback: () => void): void {
    if (this._ydoc) {
      this._ydoc.transact(callback, 'local');
    }
  }

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

  reset(): void {
    this.map.clear();
    this._ydoc.transact(() => {
      this._workspacesMap.clear();
    }, 'local');
  }

  insert(workspace: KritzelWorkspace): boolean {
    if (!workspace.id) {
      return false;
    }
    this.map.set(workspace.id, workspace);

    if (this._workspacesMap) {
      const serialized = workspace.serialize();
      this._ydoc.transact(() => {
        this._workspacesMap.set(workspace.id, serialized);
      }, 'local');
    }

    return true;
  }

  update(workspace: KritzelWorkspace): boolean {
    if (!workspace.id || !this.map.has(workspace.id)) {
      return false;
    }

    this.map.set(workspace.id, workspace);

    if (this._workspacesMap) {
      const serialized = workspace.serialize();
      this._ydoc.transact(() => {
        this._workspacesMap.set(workspace.id, serialized);
      }, 'local');
    }

    return true;
  }

  remove(predicate: (workspace: KritzelWorkspace) => boolean): boolean {
    const workspaceToRemove = Array.from(this.map.values()).find(predicate);

    if (!workspaceToRemove) {
      return false;
    }

    this.map.delete(workspaceToRemove.id);

    if (this._workspacesMap) {
      this._ydoc.transact(() => {
        this._workspacesMap.delete(workspaceToRemove.id);
      }, 'local');
    }

    return true;
  }

  get(id: string): KritzelWorkspace | undefined {
    return this.map.get(id);
  }

  allWorkspaces(): KritzelWorkspace[] {
    return Array.from(this.map.values());
  }

  filter(predicate: (workspace: KritzelWorkspace) => boolean): KritzelWorkspace[] {
    return Array.from(this.map.values()).filter(predicate);
  }

  find(predicate: (workspace: KritzelWorkspace) => boolean): KritzelWorkspace | undefined {
    return Array.from(this.map.values()).find(predicate);
  }

  has(id: string): boolean {
    return this.map.has(id);
  }

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

    // Destroy Y.Doc
    if (this._ydoc) {
      this._ydoc.destroy();
      this._ydoc = null;
    }

    // Clear remaining references
    this._core = null;
    this._onRemoteChangeCallback = null;
    this._isReady = false;
  }
}
