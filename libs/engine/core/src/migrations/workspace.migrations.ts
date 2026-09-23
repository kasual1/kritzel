import { KritzelMigration } from '../interfaces/migration.interface';

const LEGACY_CUSTOM_ELEMENT_CLASS = 'KritzelCustomElement';
const DYNAMIC_OBJECT_CLASS = 'KritzelDynamicObject';

/**
 * Rewrites the `__class__` discriminator in-place, recursing into nested children of groups.
 * @returns True if anything was renamed.
 */
function renameCustomElementClass(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.reduce<boolean>((changed, entry) => renameCustomElementClass(entry) || changed, false);
  }

  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  let changed = false;

  if (record.__class__ === LEGACY_CUSTOM_ELEMENT_CLASS) {
    record.__class__ = DYNAMIC_OBJECT_CLASS;
    changed = true;
  }

  for (const key of Object.keys(record)) {
    if (key === '__class__') continue;
    changed = renameCustomElementClass(record[key]) || changed;
  }

  return changed;
}

/**
 * Ordered list of schema migrations for workspace Y.Docs.
 * Each migration transforms the document from one schema version to the next.
 *
 * To add a new migration:
 * 1. Bump CURRENT_WORKSPACE_SCHEMA_VERSION in constants/schema.constants.ts
 * 2. Append a new entry with fromVersion = old version, toVersion = new version
 * 3. Implement the migrate() function — it must be idempotent
 */
export const WORKSPACE_MIGRATIONS: KritzelMigration[] = [
  {
    fromVersion: 1,
    toVersion: 2,
    migrate(_ydoc, _maps) {
      // No-op: adds optional userId property to objects.
      // Existing objects without userId are valid (field is optional).
    },
  },
  {
    fromVersion: 2,
    toVersion: 3,
    /**
     * Renames the `KritzelCustomElement` type discriminator to `KritzelDynamicObject`,
     * including objects nested inside serialized groups.
     */
    migrate(_ydoc, maps) {
      const objectsMap = maps['objects'];
      if (!objectsMap) return;

      objectsMap.forEach((serialized, key) => {
        if (!serialized || typeof serialized !== 'object') return;

        // JSON round-trip instead of structuredClone: Yjs rejects cross-realm plain objects.
        const clone = JSON.parse(JSON.stringify(serialized));

        if (renameCustomElementClass(clone)) {
          objectsMap.set(key, clone);
        }
      });
    },
  },
];
