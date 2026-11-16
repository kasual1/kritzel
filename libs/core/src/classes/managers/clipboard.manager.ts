import { UpmadeCore } from '../core/core.class';
import { UpmadeBaseObject } from '../objects/base-object.class';
import { UpmadeImage } from '../objects/image.class';
import { UpmadeText } from '../objects/text.class';
import { UpmadeSelectionGroup } from '../objects/selection-group.class';
import { UpmadeGroup } from '../objects/group.class';
import { UpmadeLine } from '../objects/line.class';
import { UpmadeZOrderHelper } from '../../helpers/z-order.helper';
import { UpmadeReviver } from '../core/reviver.class';
import { UpmadePasteIntentProviderRegistry } from '../registries/paste-intent-provider.registry';
import { UpmadeEventPasteIntentProvider } from '../providers/paste-intent/event-paste-intent.provider';
import { UpmadeNavigatorPasteIntentProvider } from '../providers/paste-intent/navigator-paste-intent.provider';
import { UpmadeIosPasteIntentProvider } from '../providers/paste-intent/ios-paste-intent.provider';
import { UpmadeClipboardPayload, PasteIntent, SerializedClipboardObject, CLIPBOARD_PAYLOAD_PREFIX } from './clipboard.types';
import imageCompression from 'browser-image-compression';
import { UpmadeImageFileHelper } from '../../helpers/image-file.helper';

export type { PasteIntent } from './clipboard.types';

/**
 * Manages clipboard operations (copy/cut/paste) for a core instance.
 *
 * The system clipboard is the preferred source of truth: copy serializes the current
 * selection into an Upmade payload, paste reads + revives it.
 *
 * A copy also mirrors the payload into an in-memory session buffer. On platforms where
 * eventless programmatic clipboard access is unavailable (notably iOS Safari, where the
 * context menu triggers copy/paste without a native ClipboardEvent), the session buffer
 * is used as the fallback source so internal object copy/paste keeps working.
 */
export class UpmadeClipboardManager {
  private readonly _core: UpmadeCore;
  private readonly _pasteIntentRegistry: UpmadePasteIntentProviderRegistry;

  /**
   * In-memory mirror of the most recent copy payload. Acts as the fallback clipboard
   * source when the system clipboard cannot be read programmatically (e.g. iOS Safari
   * context-menu paste). Reset is not required; a new copy overwrites it.
   */
  private _sessionClipboardPayload: UpmadeClipboardPayload | null = null;

  /**
   * In-memory cascade offset (world units) applied to successive pastes of the same
   * clipboard content so they don't stack exactly on top of each other. Reset on copy/cut.
   */
  private _pasteOffset = 0;

  constructor(core: UpmadeCore) {
    this._core = core;
    this._pasteIntentRegistry = new UpmadePasteIntentProviderRegistry(this._core);

    // Provider order is intentional: iOS eventless path should short-circuit,
    // native paste events remain preferred, and async navigator APIs are fallback.
    this._pasteIntentRegistry.register(new UpmadeIosPasteIntentProvider());
    this._pasteIntentRegistry.register(new UpmadeEventPasteIntentProvider());
    this._pasteIntentRegistry.register(new UpmadeNavigatorPasteIntentProvider());
  }

  /**
   * The most recent copy payload mirrored in memory, used as a fallback clipboard
   * source when the system clipboard cannot be read programmatically.
   */
  get sessionClipboardPayload(): UpmadeClipboardPayload | null {
    return this._sessionClipboardPayload;
  }

  /**
   * Serializes an object for the clipboard payload. Groups additionally embed their
   * (recursively serialized) children under `__children__` so the payload is self-contained.
   */
  private serializeForClipboard(object: UpmadeBaseObject<any>): SerializedClipboardObject {
    const serialized = (typeof object.serialize === 'function' ? object.serialize() : object) as SerializedClipboardObject;

    if (object instanceof UpmadeGroup) {
      serialized.__children__ = object.children.map(child => this.serializeForClipboard(child));
    }

    return serialized;
  }

  private serializeClipboardPayload(payload: UpmadeClipboardPayload): string {
    return `${CLIPBOARD_PAYLOAD_PREFIX}${JSON.stringify(payload)}`;
  }

  private async writeBrowserClipboardPayload(payload: UpmadeClipboardPayload, event?: ClipboardEvent): Promise<void> {
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
  private reviveClipboardObject(serialized: SerializedClipboardObject): UpmadeBaseObject<any> | null {
    const reviver = new UpmadeReviver(this._core);
    const { __children__, ...objectData } = serialized;
    const revived = reviver.revive<UpmadeBaseObject<any>>(objectData);

    if (!revived) {
      return null;
    }

    if (__children__ && revived instanceof UpmadeGroup) {
      const children = __children__.map(child => this.reviveClipboardObject(child)).filter((child): child is UpmadeBaseObject<any> => child != null);

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
  private regenerateIdsAndRemapAnchors(topLevel: UpmadeBaseObject<any>[]): void {
    const all: UpmadeBaseObject<any>[] = [];
    const hasOnlyTopLevelLines = topLevel.length > 0 && topLevel.every(object => object instanceof UpmadeLine);

    const collect = (objects: UpmadeBaseObject<any>[]): void => {
      for (const object of objects) {
        all.push(object);
        if (object instanceof UpmadeGroup) {
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
      if (object instanceof UpmadeGroup) {
        object.childIds = object.childIds.map(id => idMap.get(id) ?? id);
      }

      if (object instanceof UpmadeLine) {
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

    const payload: UpmadeClipboardPayload = {
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

  private materializeUpmadeObjects(intent: Extract<PasteIntent, { type: 'upmade_objects' }>): UpmadeBaseObject<any>[] {
    return this.reviveCopies(intent.payload.objects);
  }

  /**
   * Copies of objects, not inserted yet: fresh IDs at every nesting level, group children pending, and lines
   * anchored to copied objects anchored to the copies instead. Insert them with {@link insertCopies}.
   */
  createCopies(objects: UpmadeBaseObject<any>[]): UpmadeBaseObject<any>[] {
    return this.reviveCopies(objects.map(object => this.serializeForClipboard(object)));
  }

  private reviveCopies(serialized: SerializedClipboardObject[]): UpmadeBaseObject<any>[] {
    const objects = serialized.map(object => this.reviveClipboardObject(object)).filter((object): object is UpmadeBaseObject<any> => object != null);
    this.regenerateIdsAndRemapAnchors(objects);
    return objects;
  }

  /**
   * Inserts copies into the active workspace, moved by the offset, with their group children: stacked above all
   * other objects in their original order, each group as one contiguous layer. Emits no events and leaves the
   * selection alone; call it inside the caller's transaction.
   * @returns Every inserted object, group children before their group.
   */
  insertCopies(copies: UpmadeBaseObject<any>[], offsetX: number, offsetY: number): UpmadeBaseObject<any>[] {
    const workspaceId = this._core.store.state.activeWorkspace!.id;

    // Stack the copies above everything in their original order; each group becomes one contiguous layer.
    const getPendingChildren = (group: UpmadeGroup) => group._pendingChildren;
    const sortByStackOrder = (objects: UpmadeBaseObject<any>[]) =>
      objects
        .map(object => ({ object, anchor: UpmadeZOrderHelper.stackAnchor(object, getPendingChildren) }))
        .sort((a, b) => a.anchor - b.anchor)
        .map(({ object }) => object);
    const sortPendingChildren = (object: UpmadeBaseObject<any>): void => {
      if (object instanceof UpmadeGroup) {
        object._pendingChildren.forEach(sortPendingChildren);
        object._pendingChildren = sortByStackOrder(object._pendingChildren);
      }
    };
    copies.forEach(sortPendingChildren);
    let nextZIndex = this._core.store.currentZIndex;
    sortByStackOrder(copies).forEach(obj => (nextZIndex = UpmadeZOrderHelper.allocate(obj, nextZIndex, getPendingChildren)));

    const inserted: UpmadeBaseObject<any>[] = [];
    const insert = (object: UpmadeBaseObject<any>): void => {
      if (object.workspaceId !== workspaceId) {
        object.workspaceId = workspaceId;
      }
      object.updatePosition(object.translateX + offsetX, object.translateY + offsetY);

      if (object instanceof UpmadeGroup && object._pendingChildren.length > 0) {
        const pendingChildren = object._pendingChildren;
        object._pendingChildren = [];
        pendingChildren.forEach(insert);
        object.finalize();
      }

      this._core.addObject(object);
      inserted.push(object);
    };
    copies.forEach(insert);

    this._core.anchorManager.rebuildIndex();
    return inserted;
  }

  private async materializeImageFiles(intent: Extract<PasteIntent, { type: 'image_files' }>): Promise<UpmadeBaseObject<any>[] | null> {
    try {
      const scale = this._core.store.state.scale;
      const offset = 25 / scale;
      const preparePromises = intent.files.map(async (file, index) => {
        const preparedFile = await this.prepareImageFile(file);
        return UpmadeImage.fromBlob(this._core, preparedFile, {
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
    if (UpmadeImageFileHelper.isGifFile(file)) {
      return file;
    }

    return imageCompression(file, { maxWidthOrHeight: 1200 });
  }

  private async materializePlainText(intent: Extract<PasteIntent, { type: 'plain_text' }>): Promise<UpmadeBaseObject<any>[] | null> {
    const textObject = UpmadeText.create(this._core);

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

    let objects: UpmadeBaseObject<any>[] | null = null;

    if (pasteIntent.type === 'upmade_objects') {
      objects = this.materializeUpmadeObjects(pasteIntent);
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

  private async insertMaterializedObjects(copiedObjects: UpmadeBaseObject<any>[], pasteIntent: PasteIntent, x?: number, y?: number): Promise<void> {
    const activeWorkspace = this._core.store.state.activeWorkspace;
    if (!activeWorkspace) {
      return;
    }

    // Determine if we should center the objects in the viewport.
    // This happens if the user specifically pasted from a different workspace,
    // OR if we're inserting brand new external items (like images or text).
    const isDifferentWorkspace = copiedObjects.some(obj => obj.workspaceId !== activeWorkspace.id);
    const isNewExternalContent = pasteIntent.type !== 'upmade_objects';
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

    const selectionGroup = UpmadeSelectionGroup.create(this._core);

    this._core.store.objects.transaction(() => {
      this.insertCopies(copiedObjects, offsetX, offsetY);
      copiedObjects.forEach(obj => selectionGroup.addOrRemove(obj));
      this._core.engine.emitObjectsAdded(copiedObjects);
    });

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
    // and objects like UpmadeText have executed their own internal size-adjustment rAF calls.
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
