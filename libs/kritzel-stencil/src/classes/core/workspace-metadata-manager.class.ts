import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { KritzelReviver } from './reviver.class';
import { KritzelWorkspace } from './workspace.class';
import { KritzelCore } from './core.class';

/**
 * Manages workspace metadata (list of workspaces) using a dedicated Y.Doc
 * This is separate from individual workspace object data
 */
export class WorkspaceMetadataManager {
  private readonly _ydoc: Y.Doc;
  private readonly _persistenceProvider: IndexeddbPersistence;
  private readonly _workspacesMap: Y.Map<any>;
  private readonly _reviver: KritzelReviver;
  private _isReady: boolean = false;
  private _core: KritzelCore;

  constructor(core: KritzelCore, docName: string = 'kritzel-workspaces') {
    this._core = core;
    this._reviver = new KritzelReviver(core);

    this._ydoc = new Y.Doc();
    this._workspacesMap = this._ydoc.getMap('workspaces');

    this._persistenceProvider = new IndexeddbPersistence(docName, this._ydoc);
    console.info('Workspace metadata IndexedDB Persistence initialized');

    // Observe changes to _workspacesMap and sync with application state
    this._workspacesMap.observe(event => {
      this.handleWorkspacesChange(event);
    });
  }

  private handleWorkspacesChange(event: Y.YMapEvent<any>): void {
    // Skip local changes (already updated in the store)
    if (event.transaction.origin === 'local') {
      return;
    }

    // Update the workspaces list in the store
    this._core.store.state.workspaces = this.getAllWorkspaces();
    
    // Notify the engine to emit workspacesChange event
    if (this._core.engine) {
      this._core.engine.workspacesChange.emit(this._core.store.state.workspaces);
    }
  }

  async initialize(): Promise<void> {
    return new Promise(resolve => {
      this._persistenceProvider.on('synced', () => {
        resolve();
        this._isReady = true;
      });
    });
  }

  get isReady(): boolean {
    return this._isReady;
  }

  setWorkspace(workspace: KritzelWorkspace): void {
    const serialized = workspace.serialize();
    
    // Tag as local transaction to avoid redundant processing
    this._ydoc.transact(() => {
      this._workspacesMap.set(serialized.id, serialized);
    }, 'local');
  }

  getWorkspace(id: string): KritzelWorkspace | null {
    const serialized = this._workspacesMap.get(id);
    if (!serialized) return null;
    return this._reviver.revive<KritzelWorkspace>(serialized);
  }

  getAllWorkspaces(): KritzelWorkspace[] {
    const workspaces: KritzelWorkspace[] = [];
    this._workspacesMap.forEach(value => {
      workspaces.push(this._reviver.revive<KritzelWorkspace>(value));
    });
    return workspaces;
  }

  deleteWorkspace(id: string): void {
    // Tag as local transaction to avoid redundant processing
    this._ydoc.transact(() => {
      this._workspacesMap.delete(id);
    }, 'local');
  }

  /**
   * Execute a transaction on the workspace metadata
   */
  transaction(callback: () => void): void {
    this._ydoc.transact(callback, 'local');
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this._persistenceProvider.destroy();
    this._ydoc.destroy();
  }
}
