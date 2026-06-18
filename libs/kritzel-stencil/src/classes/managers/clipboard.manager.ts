import { KritzelCore } from '../core/core.class';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelGroup } from '../objects/group.class';
import { KritzelLine } from '../objects/line.class';
import { KritzelClassHelper } from '../../helpers/class.helper';

/**
 * Manages clipboard operations (copy/cut/paste) for a core instance.
 */
export class KritzelClipboardManager {
  private readonly _core: KritzelCore;

  constructor(core: KritzelCore) {
    this._core = core;
  }

  /**
   * Copies currently selected objects into internal clipboard state.
   */
  copy(): void {
    const selectionGroup = this._core.store.selectionGroup;
    if (!selectionGroup) {
      return;
    }

    const idMapping = new Map<string, string>();
    const copiedObjects = selectionGroup.objects
      .sort((a, b) => a.zIndex - b.zIndex)
      .map(obj => {
        const copiedObj = obj.copy() as KritzelBaseObject<any>;
        // Map: newId -> originalId
        idMapping.set(copiedObj.id, obj.id);
        return copiedObj;
      });

    this._core.store.state.copiedObjects = copiedObjects;
    this._core.store.state.copiedObjectIdMapping = idMapping;
  }

  /**
   * Cuts currently selected objects (copy then delete).
   */
  cut(): void {
    const selectionGroup = this._core.store.selectionGroup;
    if (!selectionGroup) {
      return;
    }

    this.copy();
    this._core.delete();
  }

  /**
   * Pastes objects from clipboard with optional explicit world coordinates.
   */
  paste(x?: number, y?: number): void {
    const copiedObjects = this._core.store.state.copiedObjects;
    if (!copiedObjects || copiedObjects.length === 0) {
      return;
    }

    const activeWorkspace = this._core.store.state.activeWorkspace;
    if (!activeWorkspace) {
      return;
    }

    const originalIdMapping = this._core.store.state.copiedObjectIdMapping;

    const isDifferentWorkspace = copiedObjects.some(obj => obj.workspaceId !== activeWorkspace.id);

    const minX = Math.min(...copiedObjects.map(obj => obj.translateX));
    const minY = Math.min(...copiedObjects.map(obj => obj.translateY));

    let pasteX: number;
    let pasteY: number;

    if (x !== undefined && y !== undefined) {
      pasteX = x;
      pasteY = y;
    } else if (isDifferentWorkspace) {
      pasteX = minX;
      pasteY = minY;
    } else {
      pasteX = minX + 25 / this._core.store.state.scale;
      pasteY = minY + 25 / this._core.store.state.scale;
    }

    const offsetX = pasteX - minX;
    const offsetY = pasteY - minY;

    this._core.removeSelectionGroup();
    this._core.removeSelectionBox();

    const selectionGroup = KritzelSelectionGroup.create(this._core);

    const originalToNewIdMap = new Map<string, string>();
    if (originalIdMapping) {
      originalIdMapping.forEach((originalId, copiedId) => {
        originalToNewIdMap.set(originalId, copiedId);
      });
    }

    const baseZIndex = this._core.store.currentZIndex;

    this._core.store.objects.transaction(() => {
      const flushPendingChildren = (group: KritzelGroup, parentZIndex: number): void => {
        if (group._pendingChildren.length === 0) {
          return;
        }

        const pendingChildren = group._pendingChildren;
        group._pendingChildren = [];

        pendingChildren.forEach((child, childIndex) => {
          if (child.workspaceId !== activeWorkspace.id) {
            child.workspaceId = activeWorkspace.id;
          }

          child.updatePosition(child.translateX + offsetX, child.translateY + offsetY);
          child.zIndex = parentZIndex + childIndex + 1;

          if (KritzelClassHelper.isInstanceOf<KritzelGroup>(child, 'KritzelGroup')) {
            flushPendingChildren(child, child.zIndex);
          }

          this._core.addObject(child);
        });

        group.finalize();
      };

      const newlyAddedObjects: KritzelBaseObject<any>[] = [];

      copiedObjects.forEach((obj, i) => {
        if (obj.workspaceId !== activeWorkspace.id) {
          obj.workspaceId = activeWorkspace.id;
        }

        obj.updatePosition(obj.translateX + offsetX, obj.translateY + offsetY);
        obj.zIndex = baseZIndex + i;

        if (KritzelClassHelper.isInstanceOf<KritzelGroup>(obj, 'KritzelGroup')) {
          flushPendingChildren(obj, obj.zIndex);
        }

        this._core.addObject(obj);
        newlyAddedObjects.push(obj);

        selectionGroup.addOrRemove(obj);
      });

      this._core.engine.emitObjectsAdded(newlyAddedObjects);

      copiedObjects.forEach(obj => {
        if (KritzelClassHelper.isInstanceOf<KritzelLine>(obj, 'KritzelLine')) {
          let updated = false;

          if (obj.startAnchor && originalToNewIdMap.has(obj.startAnchor.objectId)) {
            obj.startAnchor = { objectId: originalToNewIdMap.get(obj.startAnchor.objectId)! };
            updated = true;
          }

          if (obj.endAnchor && originalToNewIdMap.has(obj.endAnchor.objectId)) {
            obj.endAnchor = { objectId: originalToNewIdMap.get(obj.endAnchor.objectId)! };
            updated = true;
          }

          if (updated) {
            this._core.store.objects.update(obj);
          }
        }
      });
    });

    this._core.anchorManager.rebuildIndex();

    selectionGroup.isSelected = true;

    if (copiedObjects.length === 1) {
      selectionGroup.rotation = copiedObjects[0].rotation;
    }

    if (isDifferentWorkspace) {
      if (x !== undefined && y !== undefined) {
        selectionGroup.updatePosition(x, y);
      } else {
        selectionGroup.centerInViewport();
      }
    }

    this._core.addSelectionGroup(selectionGroup);

    this._core.engine.viewport?.bringIntoViewIfNeeded(selectionGroup);

    this._core.store.state.isSelecting = false;

    requestAnimationFrame(() => {
      const newSelectionGroup = this._core.store.selectionGroup;
      if (newSelectionGroup) {
        const newIdMapping = new Map<string, string>();
        const newCopiedObjects = newSelectionGroup.objects
          .sort((a, b) => a.zIndex - b.zIndex)
          .map(obj => {
            const copiedObj = obj.copy() as KritzelBaseObject<any>;
            newIdMapping.set(copiedObj.id, obj.id);
            return copiedObj;
          });

        this._core.store.state.copiedObjects = newCopiedObjects;
        this._core.store.state.copiedObjectIdMapping = newIdMapping;
      }
    });

    this._core.store.setState('activeTool', this._core.toolRegistry.getTool('selection'));

    this._core.engine.emitObjectsChange();
    this._core.rerender();
  }

  /**
   * Returns copied objects currently in clipboard state.
   */
  getCopiedObjects(): KritzelBaseObject<any>[] {
    return this._core.store.state.copiedObjects || [];
  }

  /**
   * Clears clipboard state.
   */
  clear(): void {
    this._core.store.state.copiedObjects = null;
    this._core.store.state.copiedObjectIdMapping = null;
  }

  destroy(): void {
    this.clear();
  }
}
