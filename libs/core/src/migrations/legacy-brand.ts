/**
 * Compatibility with data written while this library had a former name.
 *
 * The library was called Kritzel, then Updraw, and is now called Upmade. Documents, settings, local
 * databases, clipboard payloads and iframe content saved under a former name still use its spelling.
 * This module is the only place that knows those legacy names; everything else imports them from here.
 */

/** A former name of the library, in the spellings that persisted data uses. */
export interface UpmadeLegacyBrand {
  /** Lowercase spelling, used in storage keys, document and database names, events and attributes (e.g. `updraw`). */
  readonly name: string;
  /** Capitalized spelling, the prefix of serialized class names (e.g. `Updraw` in `UpdrawPath`). */
  readonly className: string;
}

/**
 * Former names of the library, newest first. Where the same data exists under more than one of them,
 * the newer one wins: it was written later, often by a version that had already read the older data.
 */
export const LEGACY_BRANDS: readonly UpmadeLegacyBrand[] = [
  { name: 'updraw', className: 'Updraw' },
  { name: 'kritzel', className: 'Kritzel' },
];

const BRAND = 'upmade';

const CLASS_PREFIX = 'Upmade';

const NAME_PREFIX = `${BRAND}-`;

/** Class name prefixes of serialized objects written under a former name (e.g. `UpdrawPath`, `KritzelPath`), newest first. */
export const LEGACY_CLASS_PREFIXES: readonly string[] = LEGACY_BRANDS.map(brand => brand.className);

/** Legacy class names whose new name is not just the prefix swapped. */
const LEGACY_CLASS_RENAMES: Readonly<Record<string, string>> = {
  // Renamed to `KritzelDynamicObject` by schema v3, while the library was still called Kritzel.
  KritzelCustomElement: 'UpmadeDynamicObject',
};

/** Prefixes of storage keys and document/database names written under a former name, newest first. */
export const LEGACY_NAME_PREFIXES: readonly string[] = LEGACY_BRANDS.map(brand => `${brand.name}-`);

/** localStorage keys the library reads, without the brand prefix. */
const STORAGE_KEYS: readonly string[] = ['settings', 'active-workspace-id', 'app-state-instance-id'];

/** localStorage keys that are copied from their legacy names, with or without an `-<editorId>` suffix, newest first. */
export const LEGACY_STORAGE_KEYS: readonly string[] = LEGACY_NAME_PREFIXES.flatMap(prefix => STORAGE_KEYS.map(key => prefix + key));

/** Prefixes of clipboard payloads copied under a former name, newest first. */
export const LEGACY_CLIPBOARD_PAYLOAD_PREFIXES: readonly string[] = LEGACY_BRANDS.map(brand => `${brand.name}-clipboard/v1:`);

/** Default IndexedDB databases of `IndexedDBAssetProvider` under a former name, newest first. */
export const LEGACY_ASSET_DB_NAMES: readonly string[] = LEGACY_NAME_PREFIXES.map(prefix => `${prefix}assets`);

/** Globals that iframe content used to read and write its state (e.g. `updraw.state`, `kritzel.setState()`). */
export const LEGACY_IFRAME_GLOBALS: readonly string[] = LEGACY_BRANDS.map(brand => brand.name);

/** Events that iframe content used to listen to for state changes from the host. */
export const LEGACY_IFRAME_STATE_EVENTS: readonly string[] = LEGACY_BRANDS.map(brand => `${brand.name}statechange`);

/** Attributes that iframe content used to give elements stable ids for agents, newest first. */
export const LEGACY_ELEMENT_ID_ATTRIBUTES: readonly string[] = LEGACY_BRANDS.map(brand => `data-${brand.name}-id`);

/** CSS custom properties, without the brand prefix, that saved iframe and dynamic object content may reference. */
const CONTENT_CSS_VARIABLES: readonly string[] = ['iframe-default-cursor', 'iframe-pointer-cursor', 'content-border-radius'];

/** CSS custom properties that saved iframe and dynamic object content may reference, mapped to their new names. */
export const LEGACY_CONTENT_CSS_VARIABLES: Readonly<Record<string, string>> = Object.fromEntries(
  LEGACY_BRANDS.flatMap(brand => CONTENT_CSS_VARIABLES.map(name => [`--${brand.name}-${name}`, `--${BRAND}-${name}`])),
);

/** Returns the legacy class name prefix a `__class__` value starts with, if any. */
function legacyClassPrefixOf(className: string): string | undefined {
  return LEGACY_CLASS_PREFIXES.find(prefix => className.startsWith(prefix));
}

/**
 * Returns whether a serialized `__class__` value was written under a former name.
 * @param className - The `__class__` value to check
 */
export function isLegacyClassName(className: unknown): className is string {
  return typeof className === 'string' && legacyClassPrefixOf(className) !== undefined;
}

/**
 * Maps a serialized `__class__` value written under a former name to its current name
 * (e.g. `UpdrawPath` or `KritzelPath` → `UpmadePath`). Other values are returned unchanged.
 * @param className - The `__class__` value to normalize
 * @returns The current class name
 */
export function normalizeLegacyClassName(className: string): string {
  const prefix = typeof className === 'string' ? legacyClassPrefixOf(className) : undefined;
  if (prefix === undefined) {
    return className;
  }
  return LEGACY_CLASS_RENAMES[className] ?? CLASS_PREFIX + className.slice(prefix.length);
}

/**
 * Returns the names a document, database or storage key had under the library's former names, newest first
 * (e.g. `upmade-workspace-<id>` → `['updraw-workspace-<id>', 'kritzel-workspace-<id>']`).
 * Useful for servers that store documents by name and need to find documents saved by older versions.
 * @param name - A current name starting with `upmade-`
 * @returns The legacy names, or an empty array when the name does not use the `upmade-` prefix
 */
export function toLegacyDocumentNames(name: string): string[] {
  if (!name.startsWith(NAME_PREFIX)) {
    return [];
  }
  const rest = name.slice(NAME_PREFIX.length);
  return LEGACY_NAME_PREFIXES.map(prefix => prefix + rest);
}

/**
 * Returns the name a document, database or storage key had before the latest rename
 * (e.g. `upmade-workspace-<id>` → `updraw-workspace-<id>`).
 * @deprecated Use {@link toLegacyDocumentNames}, which also returns the older `kritzel-` name.
 * @param name - A current name starting with `upmade-`
 * @returns The legacy name, or `null` when the name does not use the `upmade-` prefix
 */
export function toLegacyDocumentName(name: string): string | null {
  return toLegacyDocumentNames(name)[0] ?? null;
}

/**
 * Copies settings, the last active workspace and the app-state instance id from their legacy
 * localStorage keys to the current keys, including editor-scoped keys (`<key>-<editorId>`).
 * A key is only copied when the current key does not exist yet, and legacy names are tried newest
 * first, so an `updraw-` value wins over a `kritzel-` one. Legacy keys are kept, so older versions
 * running on the same origin keep working. Safe to call any number of times.
 * @param storage - The storage to migrate. Defaults to `globalThis.localStorage`.
 */
export function migrateLegacyStorageKeys(storage?: Storage | null): void {
  let target: Storage | null | undefined = storage;
  try {
    target ??= typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage;
    if (!target) {
      return;
    }

    const keys: string[] = [];
    for (let i = 0; i < target.length; i++) {
      const key = target.key(i);
      if (key) {
        keys.push(key);
      }
    }

    for (const legacyPrefix of LEGACY_NAME_PREFIXES) {
      for (const legacyKey of keys) {
        const base = legacyKey.startsWith(legacyPrefix) ? legacyKey.slice(legacyPrefix.length) : null;
        if (base === null || !STORAGE_KEYS.some(key => base === key || base.startsWith(`${key}-`))) {
          continue;
        }
        const key = NAME_PREFIX + base;
        const value = target.getItem(legacyKey);
        if (value !== null && target.getItem(key) === null) {
          target.setItem(key, value);
        }
      }
    }
  } catch {
    // Storage can be unavailable (privacy mode, sandboxed iframes); there is nothing to migrate then.
  }
}
