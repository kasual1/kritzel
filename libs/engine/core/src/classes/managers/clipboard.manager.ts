import { KritzelCore } from '../core/core.class';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelImage } from '../objects/image.class';
import { KritzelText } from '../objects/text.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelGroup } from '../objects/group.class';
import { KritzelLine } from '../objects/line.class';
import { KritzelClassHelper } from '../../helpers/class.helper';
import { KritzelZOrderHelper } from '../../helpers/z-order.helper';
import { KritzelReviver } from '../core/reviver.class';
import { KritzelPasteIntentProviderRegistry } from '../registries/paste-intent-provider.registry';
import { KritzelEventPasteIntentProvider } from '../providers/paste-intent/event-paste-intent.provider';
import { KritzelNavigatorPasteIntentProvider } from '../providers/paste-intent/navigator-paste-intent.provider';
import { KritzelIosPasteIntentProvider } from '../providers/paste-intent/ios-paste-intent.provider';
import { KritzelClipboardPayload, PasteIntent, SerializedClipboardObject, CLIPBOARD_PAYLOAD_PREFIX } from './clipboard.types';
import imageCompression from 'browser-image-compression';
import { KritzelImageFileHelper } from '../../helpers/image-file.helper';

export type { PasteIntent } from './clipboard.types';

/**
 * Manages clipboard operations (copy/cut/paste) for a core instance.
 *
 * The system clipboard is the preferred source of truth: copy serializes the current
 * selection into a Kritzel payload, paste reads + revives it.
 *
 * A copy also mirrors the payload into an in-memory session buffer. On platforms where
 * eventless programmatic clipboard access is unavailable (notably iOS Safari, where the
 * context menu triggers copy/paste without a native ClipboardEvent), the session buffer
 * is used as the fallback source so internal object copy/paste keeps working.
 */
export class KritzelClipboardManager {
  private readonly _core: KritzelCore;
  private readonly _pasteIntentRegistry: KritzelPasteIntentProviderRegistry;

  /**
   * In-memory mirror of the most recent copy payload. Acts as the fallback clipboard
   * source when the system clipboard cannot be read programmatically (e.g. iOS Safari
   * context-menu paste). Reset is not required; a new copy overwrites it.
   */
  private _sessionClipboardPayload: KritzelClipboardPayload | null = null;

  /**
   * In-memory cascade offset (world units) applied to successive pastes of the same
   * clipboard content so they don't stack exactly on top of each other. Reset on copy/cut.
   */
  private _pasteOffset = 0;

  constructor(core: KritzelCore) {
    this._core = core;
    this._pasteIntentRegistry = new KritzelPasteIntentProviderRegistry(this._core);

    // Provider order is intentional: iOS eventless path should short-circuit,
    // native paste events remain preferred, and async navigator APIs are fallback.
    this._pasteIntentRegistry.register(new KritzelIosPasteIntentProvider());
    this._pasteIntentRegistry.register(new KritzelEventPasteIntentProvider());
    this._pasteIntentRegistry.register(new KritzelNavigatorPasteIntentProvider());
  }

  /**
   * The most recent copy payload mirrored in memory, used as a fallback clipboard
   * source when the system clipboard cannot be read programmatically.
   */
  get sessionClipboardPayload(): KritzelClipboardPayload | null {
    return this._sessionClipboardPayload;
  }

  /**
   * Serializes an object for the clipboard payload. Groups additionally embed their
   * (recursively serialized) children under `__children__` so the payload is self-contained.
   */
  private serializeForClipboard(object: KritzelBaseObject<any>): SerializedClipboardObject {
    const serialized = (typeof object.serialize === 'function' ? object.serialize() : object) as SerializedClipboardObject;

    if (KritzelClassHelper.isInstanceOf<KritzelGroup>(object, 'KritzelGroup')) {
      serialized.__children__ = object.children.map(child => this.serializeForClipboard(child));
    }

    return serialized;
  }

  private serializeClipboardPayload(payload: KritzelClipboardPayload): string {
    return `${CLIPBOARD_PAYLOAD_PREFIX}${JSON.stringify(payload)}`;
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

  /**
   * Revives a single serialized clipboard object (and its embedded group children).
   * IDs are NOT regenerated here; see regenerateIdsAndRemapAnchors.
   */
  private reviveClipboardObject(serialized: SerializedClipboardObject): KritzelBaseObject<any> | null {
    const reviver = new KritzelReviver(this._core);
    const { __children__, ...objectData } = serialized;
    const revived = reviver.revive<KritzelBaseObject<any>>(objectData);

    if (!revived) {
      return null;
    }

    if (__children__ && KritzelClassHelper.isInstanceOf<KritzelGroup>(revived, 'KritzelGroup')) {
      const children = __children__.map(child => this.reviveClipboardObject(child)).filter((child): child is KritzelBaseObject<any> => child != null);

      revived._pendingChildren = children;
      revived.childIds = children.map(child => child.id);
    }

    return revived;
  }

  /**
   * Assigns fresh unique IDs to every revived object (including nested group children),
   * keeping group.childIds in sync and remapping line anchors that reference copied
   * siblings to their new IDs. Anchors pointing at objects outside the pasted set are
   * left untouched so they stay connected to the existing object.
   */
  private regenerateIdsAndRemapAnchors(topLevel: KritzelBaseObject<any>[]): void {
    const all: KritzelBaseObject<any>[] = [];
    const hasOnlyTopLevelLines = topLevel.length > 0 && topLevel.every(object => KritzelClassHelper.isInstanceOf<KritzelLine>(object, 'KritzelLine'));

    const collect = (objects: KritzelBaseObject<any>[]): void => {
      for (const object of objects) {
        all.push(object);
        if (KritzelClassHelper.isInstanceOf<KritzelGroup>(object, 'KritzelGroup')) {
          collect(object._pendingChildren);
        }
      }
    };
    collect(topLevel);

    const idMap = new Map<string, string>();
    for (const object of all) {
      const newId = object.generateId();
      idMap.set(object.id, newId);
      object.id = newId;
      object.isMounted = false;
    }

    for (const object of all) {
      if (KritzelClassHelper.isInstanceOf<KritzelGroup>(object, 'KritzelGroup')) {
        object.childIds = object.childIds.map(id => idMap.get(id) ?? id);
      }

      if (KritzelClassHelper.isInstanceOf<KritzelLine>(object, 'KritzelLine')) {
        if (object.startAnchor && idMap.has(object.startAnchor.objectId)) {
          object.startAnchor = { objectId: idMap.get(object.startAnchor.objectId)! };
        } else if (hasOnlyTopLevelLines) {
          object.startAnchor = undefined;
        }
        if (object.endAnchor && idMap.has(object.endAnchor.objectId)) {
          object.endAnchor = { objectId: idMap.get(object.endAnchor.objectId)! };
        } else if (hasOnlyTopLevelLines) {
          object.endAnchor = undefined;
        }
      }
    }
  }

  /**
   * Copies currently selected objects into internal clipboard state.
   */
  copy(event?: ClipboardEvent): void {
    const selectionGroup = this._core.store.selectionGroup;
    if (!selectionGroup) {
      return;
    }

    const payload: KritzelClipboardPayload = {
      version: 1,
      sourceWorkspaceId: this._core.store.state.activeWorkspace?.id,
      objects: selectionGroup.objects.sort((a, b) => a.zIndex - b.zIndex).map(obj => this.serializeForClipboard(obj)),
    };

    // A fresh copy resets the cascade so the first paste lands at the default offset.
    this._pasteOffset = 0;

    // Mirror the payload in memory so eventless paste still works where the system
    // clipboard is not programmatically accessible (e.g. iOS Safari context menu).
    this._sessionClipboardPayload = payload;

    void this.writeBrowserClipboardPayload(payload, event);
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

  private materializeKritzelObjects(intent: Extract<PasteIntent, { type: 'kritzel_objects' }>): KritzelBaseObject<any>[] {
    const objects = intent.payload.objects.map(object => this.reviveClipboardObject(object)).filter((object): object is KritzelBaseObject<any> => object != null);

    this.regenerateIdsAndRemapAnchors(objects);

    return objects;
  }

  private async materializeImageFiles(intent: Extract<PasteIntent, { type: 'image_files' }>): Promise<KritzelBaseObject<any>[] | null> {
    try {
      const scale = this._core.store.state.scale;
      const offset = 25 / scale;
      const preparePromises = intent.files.map(async (file, index) => {
        const preparedFile = await this.prepareImageFile(file);
        return KritzelImage.fromBlob(this._core, preparedFile, {
          translateX: index * offset,
          translateY: index * offset,
        });
      });

      return await Promise.all(preparePromises);
    } catch (err) {
      console.error('Failed to import pasted image files:', err);
      return null;
    }
  }

  private async prepareImageFile(file: File): Promise<File> {
    if (KritzelImageFileHelper.isGifFile(file)) {
      return file;
    }

    return imageCompression(file, { maxWidthOrHeight: 1200 });
  }

  private async materializePlainText(intent: Extract<PasteIntent, { type: 'plain_text' }>): Promise<KritzelBaseObject<any>[] | null> {
    const textObject = KritzelText.create(this._core);

    const paragraphs = intent.text.split('\n').map(line => {
      if (line.length === 0) {
        return { type: 'paragraph' }; // Empty paragraph
      }
      return {
        type: 'paragraph',
        content: [{ type: 'text', text: line }],
      };
    });

    textObject.setContent({
      type: 'doc',
      content: paragraphs,
    });

    return [textObject];
  }

  /**
   * Pastes objects from clipboard with optional explicit world coordinates.
   */
  async paste(x?: number, y?: number, event?: ClipboardEvent): Promise<void> {
    const pasteIntent = await this._pasteIntentRegistry.resolve(event);

    let objects: KritzelBaseObject<any>[] | null = null;

    if (pasteIntent.type === 'kritzel_objects') {
      objects = this.materializeKritzelObjects(pasteIntent);
    } else if (pasteIntent.type === 'image_files') {
      objects = await this.materializeImageFiles(pasteIntent);
    } else if (pasteIntent.type === 'plain_text') {
      objects = await this.materializePlainText(pasteIntent);
    }

    if (!objects || objects.length === 0) {
      return;
    }

    await this.insertMaterializedObjects(objects, pasteIntent, x, y);
  }

  private async insertMaterializedObjects(copiedObjects: KritzelBaseObject<any>[], pasteIntent: PasteIntent, x?: number, y?: number): Promise<void> {
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
    const hasExplicitPastePosition = x !== undefined && y !== undefined;

    const minX = Math.min(...copiedObjects.map(obj => obj.translateX));
    const minY = Math.min(...copiedObjects.map(obj => obj.translateY));

    let pasteX: number;
    let pasteY: number;

    const step = 25 / this._core.store.state.scale;

    if (x !== undefined && y !== undefined) {
      pasteX = x;
      pasteY = y;
    } else if (shouldCenterInViewport) {
      pasteX = minX;
      pasteY = minY;
    } else {
      pasteX = minX + step + this._pasteOffset;
      pasteY = minY + step + this._pasteOffset;
      // Advance the cascade so the next same-content paste is offset further.
      this._pasteOffset += step;
    }

    const offsetX = pasteX - minX;
    const offsetY = pasteY - minY;

    this._core.removeSelectionGroup();
    this._core.removeSelectionBox();

    const selectionGroup = KritzelSelectionGroup.create(this._core);

    // Stack the pasted objects above everything in their original order; each group becomes one contiguous layer.
    const getPendingChildren = (group: KritzelGroup) => group._pendingChildren;
    const sortByStackOrder = (objects: KritzelBaseObject<any>[]) =>
      objects
        .map(object => ({ object, anchor: KritzelZOrderHelper.stackAnchor(object, getPendingChildren) }))
        .sort((a, b) => a.anchor - b.anchor)
        .map(({ object }) => object);
    const sortPendingChildren = (object: KritzelBaseObject<any>): void => {
      if (KritzelClassHelper.isInstanceOf<KritzelGroup>(object, 'KritzelGroup')) {
        object._pendingChildren.forEach(sortPendingChildren);
        object._pendingChildren = sortByStackOrder(object._pendingChildren);
      }
    };
    copiedObjects.forEach(sortPendingChildren);
    let nextZIndex = this._core.store.currentZIndex;
    sortByStackOrder(copiedObjects).forEach(obj => (nextZIndex = KritzelZOrderHelper.allocate(obj, nextZIndex, getPendingChildren)));

    this._core.store.objects.transaction(() => {
      const flushPendingChildren = (group: KritzelGroup): void => {
        if (group._pendingChildren.length === 0) {
          return;
        }

        const pendingChildren = group._pendingChildren;
        group._pendingChildren = [];

        pendingChildren.forEach(child => {
          if (child.workspaceId !== activeWorkspace.id) {
            child.workspaceId = activeWorkspace.id;
          }

          child.updatePosition(child.translateX + offsetX, child.translateY + offsetY);

          if (KritzelClassHelper.isInstanceOf<KritzelGroup>(child, 'KritzelGroup')) {
            flushPendingChildren(child);
          }

          this._core.addObject(child);
        });

        group.finalize();
      };

      const newlyAddedObjects: KritzelBaseObject<any>[] = [];

      copiedObjects.forEach(obj => {
        if (obj.workspaceId !== activeWorkspace.id) {
          obj.workspaceId = activeWorkspace.id;
        }

        obj.updatePosition(obj.translateX + offsetX, obj.translateY + offsetY);

        if (KritzelClassHelper.isInstanceOf<KritzelGroup>(obj, 'KritzelGroup')) {
          flushPendingChildren(obj);
        }

        this._core.addObject(obj);
        newlyAddedObjects.push(obj);

        selectionGroup.addOrRemove(obj);
      });

      this._core.engine.emitObjectsAdded(newlyAddedObjects);
    });

    this._core.anchorManager.rebuildIndex();

    selectionGroup.isSelected = true;

    if (copiedObjects.length === 1) {
      selectionGroup.rotation = copiedObjects[0].rotation;
    }

    if (shouldCenterInViewport && !hasExplicitPastePosition) {
      selectionGroup.centerInViewport();
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
    if (shouldCenterInViewport && !hasExplicitPastePosition) {
      selectionGroup.centerInViewport();
    }

    this._core.engine.emitObjectsChange();
    this._core.rerender();

    this._core.store.setState('activeTool', this._core.toolRegistry.getTool('selection'));

    this._core.engine.emitObjectsChange();
    this._core.rerender();
  }
}
