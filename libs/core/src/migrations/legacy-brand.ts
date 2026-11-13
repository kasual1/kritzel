/**
 * Compatibility with data written while this library was called Kritzel.
 *
 * Documents, settings, local databases, clipboard payloads and iframe content saved before the
 * rename still use the old spelling. This module is the only place that knows those legacy names;
 * everything else imports them from here.
 */

/** Class name prefix of serialized objects written before the rename (e.g. `KritzelPath`). */
export const LEGACY_CLASS_PREFIX = 'Kritzel';

const CLASS_PREFIX = 'Updraw';

/** Legacy class names whose new name is not just the prefix swapped. */
const LEGACY_CLASS_RENAMES: Readonly<Record<string, string>> = {
  KritzelCustomElement: 'UpdrawDynamicObject',
};

/** Prefix of storage keys and document/database names written before the rename. */
export const LEGACY_NAME_PREFIX = 'kritzel-';

const NAME_PREFIX = 'updraw-';

/** localStorage keys that are copied from their legacy name, with or without an `-<editorId>` suffix. */
export const LEGACY_STORAGE_KEYS: readonly string[] = ['kritzel-settings', 'kritzel-active-workspace-id', 'kritzel-app-state-instance-id'];

/** Prefix of clipboard payloads written before the rename. */
export const LEGACY_CLIPBOARD_PAYLOAD_PREFIX = 'kritzel-clipboard/v1:';

/** Default IndexedDB database of `IndexedDBAssetProvider` before the rename. */
export const LEGACY_ASSET_DB_NAME = 'kritzel-assets';

/** Global that iframe content used to read and write its state (`kritzel.state`, `kritzel.setState()`). */
export const LEGACY_IFRAME_GLOBAL = 'kritzel';

/** Event that iframe content used to listen to for state changes from the host. */
export const LEGACY_IFRAME_STATE_EVENT = 'kritzelstatechange';

/** Attribute that iframe content used to give elements stable ids for agents. */
export const LEGACY_ELEMENT_ID_ATTRIBUTE = 'data-kritzel-id';

/** CSS custom properties that saved iframe and dynamic object content may reference, mapped to their new names. */
export const LEGACY_CONTENT_CSS_VARIABLES: Readonly<Record<string, string>> = {
  '--kritzel-iframe-default-cursor': '--updraw-iframe-default-cursor',
  '--kritzel-iframe-pointer-cursor': '--updraw-iframe-pointer-cursor',
  '--kritzel-content-border-radius': '--updraw-content-border-radius',
};

/**
 * Returns whether a serialized `__class__` value was written before the rename.
 * @param className - The `__class__` value to check
 */
export function isLegacyClassName(className: unknown): className is string {
  return typeof className === 'string' && className.startsWith(LEGACY_CLASS_PREFIX);
}

/**
 * Maps a serialized `__class__` value written before the rename to its current name
 * (e.g. `KritzelPath` → `UpdrawPath`). Other values are returned unchanged.
 * @param className - The `__class__` value to normalize
 * @returns The current class name
 */
export function normalizeLegacyClassName(className: string): string {
  if (!isLegacyClassName(className)) {
    return className;
  }
  return LEGACY_CLASS_RENAMES[className] ?? CLASS_PREFIX + className.slice(LEGACY_CLASS_PREFIX.length);
}

/**
 * Returns the name a document, database or storage key had before the rename
 * (e.g. `updraw-workspace-<id>` → `kritzel-workspace-<id>`).
 * Useful for servers that store documents by name and need to find documents saved by older versions.
 * @param name - A current name starting with `updraw-`
 * @returns The legacy name, or `null` when the name does not use the `updraw-` prefix
 */
export function toLegacyDocumentName(name: string): string | null {
  return name.startsWith(NAME_PREFIX) ? LEGACY_NAME_PREFIX + name.slice(NAME_PREFIX.length) : null;
}

/**
 * Copies settings, the last active workspace and the app-state instance id from their legacy
 * localStorage keys to the current keys, including editor-scoped keys (`<key>-<editorId>`).
 * A key is only copied when the current key does not exist yet. Legacy keys are kept, so older
 * versions running on the same origin keep working. Safe to call any number of times.
 * @param storage - The storage to migrate. Defaults to `globalThis.localStorage`.
 */
export function migrateLegacyStorageKeys(storage?: Storage | null): void {
  let target: Storage | null | undefined = storage;
  try {
    target ??= typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage;
    if (!target) {
      return;
    }

    const legacyKeys: string[] = [];
    for (let i = 0; i < target.length; i++) {
      const key = target.key(i);
      if (key && LEGACY_STORAGE_KEYS.some(base => key === base || key.startsWith(`${base}-`))) {
        legacyKeys.push(key);
      }
    }

    for (const legacyKey of legacyKeys) {
      const key = NAME_PREFIX + legacyKey.slice(LEGACY_NAME_PREFIX.length);
      const value = target.getItem(legacyKey);
      if (value !== null && target.getItem(key) === null) {
        target.setItem(key, value);
      }
    }
  } catch {
    // Storage can be unavailable (privacy mode, sandboxed iframes); there is nothing to migrate then.
  }
}
