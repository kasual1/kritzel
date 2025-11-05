import { KritzelBaseObject } from '../objects/base-object.class';
import { YjsDocumentManager } from '../core/yjs-document.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelSelectionBox } from '../objects/selection-box.class';
import { KritzelPath } from '../objects/path.class';

export class KritzelObjectMap<T extends KritzelBaseObject<any>> {
  private map: Map<string, T>;
  private yjsManager: YjsDocumentManager | null = null;
  private workspaceId: string | null = null;
  private syncEnabled: boolean = true;

  constructor() {
    this.map = new Map<string, T>();
  }

  /**
   * Connect this ObjectMap to a Yjs document manager
   */
  connect(yjsManager: YjsDocumentManager, workspaceId: string): void {
    this.yjsManager = yjsManager;
    this.workspaceId = workspaceId;
  }

  /**
   * Disconnect from Yjs (for temporary operations)
   */
  disconnect(): void {
    this.yjsManager = null;
    this.workspaceId = null;
  }

  /**
   * Enable or disable automatic syncing to Yjs
   */
  setSyncEnabled(enabled: boolean): void {
    this.syncEnabled = enabled;
  }

  /**
   * Load objects from Yjs for the current workspace
   */
  loadFromYjs(): void {
    if (!this.yjsManager || !this.workspaceId) {
      return;
    }

    const objects = this.yjsManager.getObjectsByWorkspace<T>(this.workspaceId);
    this.map.clear();
    objects.forEach(obj => {
      this.map.set(obj.id, obj);
    });
  }

  reset(): void {
    this.map.clear();
    
    // If connected to Yjs, also clear objects for this workspace
    if (this.yjsManager && this.workspaceId && this.syncEnabled) {
      this.yjsManager.deleteObjectsByWorkspace(this.workspaceId);
    }
  }

  insert(object: T): boolean {
    if (!object.id) {
      return false;
    }
    this.map.set(object.id, object);
    
    // Sync to Yjs if connected and object should be persisted
    if (this.yjsManager && this.workspaceId && this.syncEnabled && this.shouldPersist(object)) {
      this.yjsManager.setObject(object);
    }
    
    return true;
  }

  update(object: T): boolean {
    if (!object.id || !this.map.has(object.id)) {
      return false;
    }
    this.map.set(object.id, object);
    
    // Sync to Yjs if connected and object should be persisted
    if (this.yjsManager && this.workspaceId && this.syncEnabled && this.shouldPersist(object)) {
      this.yjsManager.setObject(object);
    }
    
    return true;
  }

  remove(predicate: (object: T) => boolean): void {
    for (const [id, object] of this.map) {
      if (predicate(object)) {
        this.map.delete(id);
        
        // Sync deletion to Yjs if connected and object should be persisted
        if (this.yjsManager && this.workspaceId && this.syncEnabled && this.shouldPersist(object)) {
          this.yjsManager.deleteObject(this.workspaceId, id);
        }
      }
    }
  }

  filter(predicate: (object: T) => boolean): T[] {
    const results: T[] = [];
    for (const object of this.map.values()) {
      if (predicate(object)) {
        results.push(object);
      }
    }
    return results;
  }

  allObjects(): T[] {
    return Array.from(this.map.values());
  }

  private shouldPersist(object: T): boolean {

    if (object instanceof KritzelSelectionGroup) {
      return false;
    }

    if (object instanceof KritzelSelectionBox) {
      return false;
    }
    
    if (object instanceof KritzelPath) {

      if(object.isDrawing) {
        return false;
      }

    }
    
    return true;
  }
}
