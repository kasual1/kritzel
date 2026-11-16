/** localStorage key prefixes of the app's earlier brands, newest first. */
const LEGACY_KEY_PREFIXES = ['updraw_', 'kritzel_'] as const;
const KEY_PREFIX = 'upmade_';

/**
 * The app's own keys worth carrying over, without the brand prefix: the guest user (auth-storage.ts), the
 * cached public config (config.service.ts) and the Welcome markers `welcome_initialized:<userId>` (editor.ts).
 * `user` is left out because the user resolver rewrites it on every start.
 */
const MIGRATED_KEYS: readonly string[] = ['guest_user', 'public_config'];
const MIGRATED_KEY_PREFIXES: readonly string[] = ['welcome_initialized:'];

/**
 * Copies the app's localStorage entries from an earlier brand (`updraw_…`, then `kritzel_…`) to their `upmade_…`
 * key when that key is missing, so the newer brand's value wins. Legacy keys are kept, as the libraries do for
 * theirs. The guest user matters most: its id names the guest's app-state document, and a new id would hide
 * the workspaces the libraries import from the legacy IndexedDB databases. This only helps while the app stays
 * on the same origin; another origin cannot read these keys.
 */
export function migrateLegacyStorageKeys(storage: Storage = localStorage): void {
  try {
    const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
    for (const legacyPrefix of LEGACY_KEY_PREFIXES) {
      for (const legacyKey of keys) {
        if (!legacyKey?.startsWith(legacyPrefix)) {
          continue;
        }
        const name = legacyKey.slice(legacyPrefix.length);
        if (!isMigrated(name)) {
          continue;
        }
        const value = storage.getItem(legacyKey);
        if (value !== null && storage.getItem(KEY_PREFIX + name) === null) {
          storage.setItem(KEY_PREFIX + name, value);
        }
      }
    }
  } catch {
    // Storage blocked or full: start without the legacy values, as on a new device.
  }
}

function isMigrated(name: string): boolean {
  return MIGRATED_KEYS.includes(name) || MIGRATED_KEY_PREFIXES.some((prefix) => name.startsWith(prefix));
}
