import { KritzelCore } from '../core/core.class';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelImage } from '../objects/image.class';
import { KritzelText } from '../objects/text.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelGroup } from '../objects/group.class';
import { KritzelLine } from '../objects/line.class';
import { KritzelClassHelper } from '../../helpers/class.helper';
import { KritzelReviver } from '../core/reviver.class';
import imageCompression from 'browser-image-compression';

const CLIPBOARD_PAYLOAD_PREFIX = 'kritzel-clipboard/v1:';

interface KritzelClipboardPayload {
  version: 1;
  sourceWorkspaceId?: string;
  copiedObjectIdMapping: Array<[string, string]>;
  objects: ReturnType<KritzelBaseObject<any>['serialize']>[];
}

export type PasteIntent =
  | { type: 'kritzel_objects'; payload: KritzelClipboardPayload | null; isLocalFallback: boolean }
  | { type: 'image_files'; files: File[] }
  | { type: 'plain_text'; text: string }
  | { type: 'unknown' };

interface MaterializedPasteResult {
  copiedObjects: KritzelBaseObject<any>[];
  originalIdMapping: Map<string, string> | null | undefined;
}

/**
 * Manages clipboard operations (copy/cut/paste) for a core instance.
 */
export class KritzelClipboardManager {
  private readonly _core: KritzelCore;

  constructor(core: KritzelCore) {
    this._core = core;
  }

  private createClipboardPayload(): KritzelClipboardPayload | null {
    const copiedObjects = this._core.store.state.copiedObjects;
    if (!copiedObjects || copiedObjects.length === 0) {
      return null;
    }

    return this.buildClipboardPayloadFromObjects(copiedObjects, this._core.store.state.copiedObjectIdMapping);
  }

  private buildClipboardPayloadFromObjects(
    copiedObjects: KritzelBaseObject<any>[],
    copiedObjectIdMapping: Map<string, string> | null | undefined,
  ): KritzelClipboardPayload {
    return {
      version: 1,
      sourceWorkspaceId: this._core.store.state.activeWorkspace?.id,
      copiedObjectIdMapping: copiedObjectIdMapping ? Array.from(copiedObjectIdMapping.entries()) : [],
      objects: copiedObjects.map(object => this.serializeClipboardObject(object)),
    };
  }

  private serializeClipboardObject(object: KritzelBaseObject<any>): ReturnType<KritzelBaseObject<any>['serialize']> {
    if (typeof object.serialize === 'function') {
      return object.serialize();
    }

    return object as ReturnType<KritzelBaseObject<any>['serialize']>;
  }

  private serializeClipboardPayload(payload: KritzelClipboardPayload): string {
    return `${CLIPBOARD_PAYLOAD_PREFIX}${JSON.stringify(payload)}`;
  }

  private parseClipboardPayload(text: string | null | undefined): KritzelClipboardPayload | null {
    if (!text || !text.startsWith(CLIPBOARD_PAYLOAD_PREFIX)) {
      return null;
    }

    try {
      const parsed = JSON.parse(text.slice(CLIPBOARD_PAYLOAD_PREFIX.length)) as KritzelClipboardPayload;
      if (parsed?.version !== 1 || !Array.isArray(parsed.objects)) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  private async writeBrowserClipboardPayload(payload: KritzelClipboardPayload, event?: ClipboardEvent): Promise<void> {
    const serialized = this.serializeClipboardPayload(payload);

    if (event?.clipboardData) {
      event.clipboardData.setData('text/plain', serialized);
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(serialized);
    } catch {
      // Ignore clipboard permission failures and keep the local clipboard working.
    }
  }

  private reviveClipboardObjects(payload: KritzelClipboardPayload): KritzelBaseObject<any>[] {
    const reviver = new KritzelReviver(this._core);
    return payload.objects
      .map(object => reviver.revive<KritzelBaseObject<any>>(object))
      .filter((object): object is KritzelBaseObject<any> => object != null);
  }

  /**
   * Evaluates the clipboard event to determine exactly what the user is trying to paste.
   * Returns a PasteIntent covering the 3 main cases: Kritzel objects, Images, or Plain text.
   */
  private async determinePasteIntent(event?: ClipboardEvent): Promise<PasteIntent> {
    if (event?.clipboardData) {
      const data = event.clipboardData;

      // 1. Check for Image Files
      if (data.files && data.files.length > 0) {
        const imageFiles = Array.from(data.files).filter(f => f.type.startsWith('image/'));
        if (imageFiles.length > 0) {
          return { type: 'image_files', files: imageFiles };
        }
      }

      // 2 & 3. Check text/plain (Kritzel payload vs generic plain text)
      if (data.types.includes('text/plain')) {
        const text = data.getData('text/plain');
        const payload = this.parseClipboardPayload(text);
        
        if (payload) {
          return { type: 'kritzel_objects', payload, isLocalFallback: false };
        } else if (text.trim().length > 0) {
          return { type: 'plain_text', text };
        }
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
      // Fallback for programmatic paste (when there is no standard ClipboardEvent)
      try {
        const text = await navigator.clipboard.readText();
        const payload = this.parseClipboardPayload(text);
        if (payload) {
          return { type: 'kritzel_objects', payload, isLocalFallback: false };
        }
      } catch {
        // Ignore read errors
      }
    }

    // Fallback to purely local copied objects (e.g., if clipboard read is blocked)
    if (this._core.store.state.copiedObjects && this._core.store.state.copiedObjects.length > 0) {
      // We don't have a strict payload, but we know it's kritzel objects from local state
      return { type: 'kritzel_objects', payload: null, isLocalFallback: true };
    }

    return { type: 'unknown' };
  }

  /**
   * Copies currently selected objects into internal clipboard state.
   */
  copy(event?: ClipboardEvent): void {
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

    const payload = this.createClipboardPayload();
    if (payload) {
      void this.writeBrowserClipboardPayload(payload, event);
    }
  }

  /**
   * Cuts currently selected objects (copy then delete).
   */
  cut(event?: ClipboardEvent): void {
    const selectionGroup = this._core.store.selectionGroup;
    if (!selectionGroup) {
      return;
    }

    this.copy(event);
    this._core.delete();
  }

  private async materializeKritzelObjects(intent: Extract<PasteIntent, { type: 'kritzel_objects' }>): Promise<MaterializedPasteResult> {
    if (intent.isLocalFallback) {
      return {
        copiedObjects: this._core.store.state.copiedObjects!,
        originalIdMapping: this._core.store.state.copiedObjectIdMapping,
      };
    } else {
      return {
        copiedObjects: this.reviveClipboardObjects(intent.payload!),
        originalIdMapping: new Map(intent.payload!.copiedObjectIdMapping),
      };
    }
  }

  private async materializeImageFiles(intent: Extract<PasteIntent, { type: 'image_files' }>): Promise<MaterializedPasteResult | null> {
    try {
      const preparePromises = intent.files.map(async file => {
        // Use the default image compression size of 1200
        const compressed = await imageCompression(file, { maxWidthOrHeight: 1200 });
        return KritzelImage.fromBlob(this._core, compressed);
      });
      
      return {
        copiedObjects: await Promise.all(preparePromises),
        originalIdMapping: new Map(),
      };
    } catch (err) {
      console.error('Failed to import pasted image files:', err);
      return null;
    }
  }

  private async materializePlainText(intent: Extract<PasteIntent, { type: 'plain_text' }>): Promise<MaterializedPasteResult | null> {
    const textObject = KritzelText.create(this._core);

    const paragraphs = intent.text.split('\n').map(line => {
      if (line.length === 0) {
        return { type: 'paragraph' }; // Empty paragraph
      }
      return {
        type: 'paragraph',
        content: [{ type: 'text', text: line }]
      };
    });

    textObject.setContent({
      type: 'doc',
      content: paragraphs
    });

    return {
      copiedObjects: [textObject],
      originalIdMapping: new Map()
    };
  }

  /**
   * Pastes objects from clipboard with optional explicit world coordinates.
   */
  async paste(x?: number, y?: number, event?: ClipboardEvent): Promise<void> {
    const pasteIntent = await this.determinePasteIntent(event);

    let materializedResult: MaterializedPasteResult | null = null;

    if (pasteIntent.type === 'kritzel_objects') {
      materializedResult = await this.materializeKritzelObjects(pasteIntent);
    } else if (pasteIntent.type === 'image_files') {
      materializedResult = await this.materializeImageFiles(pasteIntent);
    } else if (pasteIntent.type === 'plain_text') {
      materializedResult = await this.materializePlainText(pasteIntent);
    }

    if (!materializedResult || !materializedResult.copiedObjects || materializedResult.copiedObjects.length === 0) {
      return;
    }

    await this.insertMaterializedObjects(materializedResult.copiedObjects, materializedResult.originalIdMapping, pasteIntent, x, y);
  }

  private async insertMaterializedObjects(
    copiedObjects: KritzelBaseObject<any>[],
    originalIdMapping: Map<string, string> | null | undefined,
    pasteIntent: PasteIntent,
    x?: number,
    y?: number
  ): Promise<void> {
    const activeWorkspace = this._core.store.state.activeWorkspace;
    if (!activeWorkspace) {
      return;
    }

    // Determine if we should center the objects in the viewport.
    // This happens if the user specifically pasted from a different workspace, 
    // OR if we're inserting brand new external items (like images or text).
    const isDifferentWorkspace = copiedObjects.some(obj => obj.workspaceId !== activeWorkspace.id);
    const isNewExternalContent = pasteIntent.type !== 'kritzel_objects';
    const shouldCenterInViewport = isDifferentWorkspace || isNewExternalContent;

    const minX = Math.min(...copiedObjects.map(obj => obj.translateX));
    const minY = Math.min(...copiedObjects.map(obj => obj.translateY));

    let pasteX: number;
    let pasteY: number;

    if (x !== undefined && y !== undefined) {
      pasteX = x;
      pasteY = y;
    } else if (shouldCenterInViewport) {
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

    if (shouldCenterInViewport) {
      if (x !== undefined && y !== undefined) {
        selectionGroup.updatePosition(x, y);
      } else {
        selectionGroup.centerInViewport();
      }
    }

    this._core.addSelectionGroup(selectionGroup);

    this._core.engine.viewport?.bringIntoViewIfNeeded(selectionGroup);

    this._core.store.state.isSelecting = false;

    // Use a double requestAnimationFrame to ensure the browser has fully rendered the DOM,
    // and objects like KritzelText have executed their own internal size-adjustment rAF calls.
    await new Promise<void>(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    // Re-evaluate bounding box dimensions now that any DOM nodes (like ProseMirror text editors)
    // have mounted and calculated their actual bounds.
    selectionGroup.refreshObjectDimensions();
    
    // We should update it if the centerInViewport or width adjustments changed it significantly
    if (shouldCenterInViewport) {
      selectionGroup.centerInViewport();
    }
    
    this._core.engine.emitObjectsChange();
    this._core.rerender();

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

      const refreshedPayload = this.buildClipboardPayloadFromObjects(newCopiedObjects, newIdMapping);
      void this.writeBrowserClipboardPayload(refreshedPayload);
    }

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
