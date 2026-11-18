import * as Y from 'yjs';

/**
 * Names of earlier brands that can still be found in stored documents: Kritzel (renamed to Updraw on
 * 2026-11-13), then Updraw (renamed to Upmade). Used by the RenameLegacyBrandDocumentIds and
 * RenameUpdrawDocumentIds migrations; keep every legacy string in this block.
 */
export const KRITZEL_DOCUMENT_ID_PREFIX = 'kritzel-';
export const UPDRAW_DOCUMENT_ID_PREFIX = 'updraw-';
/** Legacy document id prefixes, newest brand first (the order RenameUpdrawDocumentIds moves them in). */
export const LEGACY_DOCUMENT_ID_PREFIXES = [
  UPDRAW_DOCUMENT_ID_PREFIX,
  KRITZEL_DOCUMENT_ID_PREFIX,
] as const;
export const DOCUMENT_ID_PREFIX = 'upmade-';
export const LEGACY_CLASS_NAME_PREFIXES = ['Updraw', 'Kritzel'] as const;
export const CLASS_NAME_PREFIX = 'Upmade';
/** Legacy classes whose new name is more than a prefix swap. */
export const LEGACY_CLASS_NAME_RENAMES: ReadonlyMap<string, string> = new Map([
  ['KritzelCustomElement', 'UpmadeDynamicObject'],
]);

/** Y.Doc maps whose values are serialized objects with a `__class__` discriminator. */
export const CLASS_NAME_MAPS = ['objects', 'workspaces'] as const;
const CLASS_NAME_KEY = '__class__';

/** `<fromPrefix>…` → `<toPrefix>…`; null when the id doesn't start with `fromPrefix`. */
export function replaceDocumentIdPrefix(
  id: string,
  fromPrefix: string,
  toPrefix: string,
): string | null {
  return id.startsWith(fromPrefix)
    ? toPrefix + id.slice(fromPrefix.length)
    : null;
}

/**
 * Maps a legacy `__class__` value (`Kritzel*`, `Updraw*`) to its current name; other names are returned
 * unchanged.
 */
export function normalizeLegacyClassName(name: string): string {
  const renamed = LEGACY_CLASS_NAME_RENAMES.get(name);
  if (renamed) {
    return renamed;
  }
  const prefix = LEGACY_CLASS_NAME_PREFIXES.find((legacy) =>
    name.startsWith(legacy),
  );
  return prefix ? CLASS_NAME_PREFIX + name.slice(prefix.length) : name;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Renames legacy `__class__` values in a serialized object, recursing into nested plain objects and
 * arrays (e.g. group children). Never mutates its input: returns the same reference when nothing
 * changed, otherwise a copy of the changed branches.
 */
export function renameLegacyClasses(value: unknown): unknown {
  if (Array.isArray(value)) {
    const entries: unknown[] = value;
    let next: unknown[] | null = null;
    entries.forEach((entry, index) => {
      const renamed = renameLegacyClasses(entry);
      if (renamed !== entry) {
        next ??= [...entries];
        next[index] = renamed;
      }
    });
    return next ?? entries;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  let next: Record<string, unknown> | null = null;
  for (const [key, entry] of Object.entries(value)) {
    const renamed =
      key === CLASS_NAME_KEY && typeof entry === 'string'
        ? normalizeLegacyClassName(entry)
        : renameLegacyClasses(entry);
    if (renamed !== entry) {
      next ??= { ...value };
      next[key] = renamed;
    }
  }
  return next ?? value;
}

/**
 * Decodes a stored Yjs update and renames legacy `__class__` values in the `objects` and
 * `workspaces` maps.
 * @returns The re-encoded document, or null when nothing had to change.
 */
export function renameLegacyClassesInDocument(
  data: Uint8Array,
): Uint8Array | null {
  const doc = new Y.Doc();
  try {
    Y.applyUpdate(doc, data);
    let changed = false;
    doc.transact(() => {
      for (const mapName of CLASS_NAME_MAPS) {
        const map = doc.getMap<unknown>(mapName);
        for (const [key, value] of Array.from(map.entries())) {
          const renamed = renameLegacyClasses(value);
          if (renamed !== value) {
            map.set(key, renamed);
            changed = true;
          }
        }
      }
    });
    return changed ? Y.encodeStateAsUpdate(doc) : null;
  } finally {
    doc.destroy();
  }
}

/** Merges the stored state of a legacy document into the state of its renamed counterpart. */
export function mergeDocumentData(
  legacyData: Uint8Array | null,
  targetData: Uint8Array | null,
): Uint8Array | null {
  if (!legacyData) {
    return targetData;
  }
  if (!targetData) {
    return legacyData;
  }
  return Y.mergeUpdates([legacyData, targetData]);
}
