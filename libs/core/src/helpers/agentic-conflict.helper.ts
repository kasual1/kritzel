import type { KritzelCore } from '../classes/core/core.class';
import type { KritzelObjectMap } from '../classes/structures/object-map.structure';
import type { KritzelBaseObject } from '../classes/objects/base-object.class';
import { KritzelGroup } from '../classes/objects/group.class';
import { KritzelSelectionGroup } from '../classes/objects/selection-group.class';
import { KritzelSelectionBox } from '../classes/objects/selection-box.class';
import type { KritzelAgenticActionFailureReason } from '../interfaces/agentic-action.interface';

type AnyObject = KritzelBaseObject<any>;
type ObjectMap = KritzelObjectMap<AnyObject>;

/** Who owns a stored selection group. `'stale'` groups (left behind by a closed tab) are ignored. */
export type KritzelSelectionGroupOwner = 'human' | 'collaborator' | 'stale';

/** Selection and interaction state of the user and collaborators, computed once per frame. */
export interface KritzelAgenticFrameCache {
  /** Objects (with relatives) in the local user's selection. */
  humanSelectedIds: Set<string>;
  /** Whether the local user is dragging, resizing, rotating or pressing a handle right now. */
  humanGestureActive: boolean;
  /** Objects (with relatives) a collaborator has selected or is drawing. */
  collaboratorIds: Set<string>;
  /** Whether awareness shows other clients. */
  hasRemotePeers: boolean;
}

/** Whether an object is a selection group or the marquee box. */
export function isSelectionObject(object: unknown): boolean {
  return object instanceof KritzelSelectionGroup || object instanceof KritzelSelectionBox;
}

/** Child ID -> the group directly containing it. */
export type KritzelParentIndex = Map<string, KritzelGroup>;

/** Builds the child-to-parent index of all groups with one scan of the map. */
export function buildParentIndex(map: ObjectMap): KritzelParentIndex {
  const index: KritzelParentIndex = new Map();
  const groups = map.filter(o => o instanceof KritzelGroup) as unknown as KritzelGroup[];
  for (const group of groups) {
    for (const childId of group.childIds) {
      // First group wins, like a linear search.
      if (!index.has(childId)) {
        index.set(childId, group);
      }
    }
  }
  return index;
}

/** The group directly containing an object, if any. */
export function findParentGroup(map: ObjectMap, objectId: string, parents?: KritzelParentIndex): KritzelGroup | null {
  if (parents) {
    return parents.get(objectId) ?? null;
  }
  const groups = map.filter(o => o instanceof KritzelGroup) as unknown as KritzelGroup[];
  for (const group of groups) {
    if (group.childIds.includes(objectId)) {
      return group;
    }
  }
  return null;
}

/** Whether an object is not inside a group. */
export function isTopLevel(map: ObjectMap, objectId: string): boolean {
  return findParentGroup(map, objectId) === null;
}

/** The IDs plus all group descendants and ancestors. */
export function expandWithRelatives(map: ObjectMap, ids: Iterable<string>, parents: KritzelParentIndex = buildParentIndex(map)): Set<string> {
  const result = new Set<string>();
  for (const id of ids) {
    result.add(id);
    const object = map.findById(id);
    if (object instanceof KritzelGroup) {
      KritzelGroup.collectDescendantIds(object, result);
    }
    let parent = parents.get(id) ?? null;
    const seen = new Set<string>();
    while (parent && !seen.has(parent.id)) {
      seen.add(parent.id);
      result.add(parent.id);
      parent = parents.get(parent.id) ?? null;
    }
  }
  return result;
}

/** The IDs plus all group descendants (no ancestors). */
export function collectWithDescendants(map: ObjectMap, ids: Iterable<string>): Set<string> {
  const result = new Set<string>();
  for (const id of ids) {
    result.add(id);
    const object = map.findById(id);
    if (object instanceof KritzelGroup) {
      KritzelGroup.collectDescendantIds(object, result);
    }
  }
  return result;
}

/** IDs of lines anchored to any of the objects. */
export function collectAnchoredLines(core: KritzelCore, ids: Iterable<string>): Set<string> {
  const lines = new Set<string>();
  for (const id of ids) {
    for (const entry of core.anchorManager.getLinesAnchoredTo(id)) {
      lines.add(entry.lineId);
    }
  }
  return lines;
}

/**
 * Decides who owns a stored selection group. Groups carry the doc client ID of the tab that created
 * them; `store.selectionGroup` is not used because without a user it can return another tab's group.
 */
export function classifySelectionGroup(map: ObjectMap, core: KritzelCore, group: KritzelSelectionGroup): KritzelSelectionGroupOwner {
  if (group.clientId != null) {
    if (group.clientId === map.docClientId) {
      return 'human';
    }
    const awareness = map.awareness;
    // A live peer (another person, or another device of the same account) is a collaborator.
    if (awareness?.getStates().has(group.clientId)) {
      return 'collaborator';
    }
    // Not a live peer: the group the user's tools treat as the local selection is the user's,
    // e.g. a selection restored after a reload that still carries the previous session's client ID.
    // Only when the user ID proves it: without a user, store.selectionGroup can be another tab's group.
    const localUserId = core.user?.id;
    if (localUserId && group.userId === localUserId && core.store.selectionGroup === group) {
      return 'human';
    }
    return awareness ? 'stale' : 'collaborator';
  }
  // Groups saved before client IDs were stamped without awareness.
  const localUserId = core.user?.id;
  if (localUserId) {
    return group.userId === localUserId ? 'human' : 'collaborator';
  }
  return group.userId == null ? 'human' : 'collaborator';
}

/** Computes the selection and interaction state of the user and collaborators. */
export function buildFrameCache(core: KritzelCore, map: ObjectMap): KritzelAgenticFrameCache {
  const state = core.store.state;
  const humanSelected: string[] = [];
  const collaborator: string[] = [];

  const groups = map.filter(o => o instanceof KritzelSelectionGroup) as unknown as KritzelSelectionGroup[];
  for (const group of groups) {
    const owner = classifySelectionGroup(map, core, group);
    if (owner === 'human') {
      humanSelected.push(...group.objectIds);
    } else if (owner === 'collaborator') {
      collaborator.push(...group.objectIds);
    }
  }

  let hasRemotePeers = false;
  const awareness = map.awareness;
  if (awareness) {
    const states = awareness.getStates();
    hasRemotePeers = states.size > 1;
    states.forEach((clientState, clientId) => {
      if (clientId === map.localClientId) {
        return;
      }
      const activeObjectId = (clientState as { activeObjectId?: unknown }).activeObjectId;
      if (typeof activeObjectId === 'string') {
        collaborator.push(activeObjectId);
      }
    });
  }

  // The handle-selected flags stay set after a gesture ends, so they only count while a pointer is down.
  const pointerDown = (state.pointers?.size ?? 0) > 0;
  const parents = buildParentIndex(map);
  return {
    humanSelectedIds: expandWithRelatives(map, humanSelected, parents),
    humanGestureActive: !!(
      state.isDragging ||
      state.isResizing ||
      state.isRotating ||
      state.isLineHandleDragging ||
      (pointerDown && (state.isResizeHandleSelected || state.isRotationHandleSelected || state.isLineHandleSelected))
    ),
    collaboratorIds: expandWithRelatives(map, collaborator, parents),
    hasRemotePeers,
  };
}

interface EditableObject {
  isEditing?: boolean;
  uneditedObject?: unknown;
}

/** Whether the local user is interacting with the object outside of selection gestures. */
function isLocalEdit(core: KritzelCore, map: ObjectMap, object: AnyObject): boolean {
  const state = core.store.state;
  const editable = object as unknown as EditableObject;
  if (editable.isEditing && editable.uneditedObject) {
    return true;
  }
  if (core.objectTitlebarManager?.editingTitle?.ownerId === object.id) {
    return true;
  }
  if (state.isErasing && object.markedForRemoval) {
    return true;
  }
  if (state.isSelecting && object.isSelected) {
    return true;
  }
  return !!state.isDrawing && map.localActiveDrawingObjectId === object.id;
}

/**
 * Checks one object a running or starting action depends on. First match wins.
 * @param knownInstance - The instance the action saw before; a different instance means someone else replaced it.
 * @param isClaimedByOtherAgent - Whether another cursor claims the object.
 */
export function detectObjectConflict(
  core: KritzelCore,
  map: ObjectMap,
  cache: KritzelAgenticFrameCache,
  id: string,
  knownInstance: AnyObject | undefined,
  isClaimedByOtherAgent: boolean,
): KritzelAgenticActionFailureReason | null {
  const object = map.findById(id);
  if (!object) {
    return 'object-removed';
  }
  if (knownInstance && knownInstance !== object) {
    return 'conflict';
  }
  if (isLocalEdit(core, map, object)) {
    return 'user-interaction';
  }
  if (cache.humanSelectedIds.has(id)) {
    return cache.humanGestureActive ? 'user-interaction' : 'user-selected';
  }
  const editable = object as unknown as EditableObject;
  if (cache.collaboratorIds.has(id) || (editable.isEditing && !editable.uneditedObject && cache.hasRemotePeers)) {
    return 'collaborator-editing';
  }
  if (isClaimedByOtherAgent) {
    return 'claimed-by-agent';
  }
  return null;
}
