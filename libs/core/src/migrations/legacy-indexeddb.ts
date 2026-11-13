import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

/**
 * Transaction origin of content imported from a database written before the rename.
 * It is not one of the origins the undo manager tracks, so the import cannot be undone, and it is
 * not the persistence provider itself, so the current IndexedDB provider stores the imported state.
 */
export const LEGACY_IMPORT_ORIGIN = Symbol('updraw-legacy-import');

const IMPORT_MARKER_PREFIX = 'updraw-legacy-import:';

/**
 * Returns whether the content of a legacy database was already imported in this browser.
 * @param legacyName - Name of the legacy database
 */
export function isLegacyDatabaseImported(legacyName: string): boolean {
  try {
    return globalThis.localStorage?.getItem(IMPORT_MARKER_PREFIX + legacyName) != null;
  } catch {
    return false;
  }
}

/**
 * Remembers that the content of a legacy database was imported, so it is not read again.
 * @param legacyName - Name of the legacy database
 */
export function markLegacyDatabaseImported(legacyName: string): void {
  try {
    globalThis.localStorage?.setItem(IMPORT_MARKER_PREFIX + legacyName, String(Date.now()));
  } catch {
    // Without storage the import simply runs again next time; importing is idempotent.
  }
}

/**
 * Returns whether an IndexedDB database exists, without creating it.
 * Uses `indexedDB.databases()` where available and otherwise opens the database and aborts the
 * upgrade transaction that a missing database triggers, so no empty database is left behind.
 * @param name - Name of the database
 */
export async function indexedDbExists(name: string): Promise<boolean> {
  if (typeof indexedDB === 'undefined') {
    return false;
  }

  if (typeof indexedDB.databases === 'function') {
    try {
      const databases = await indexedDB.databases();
      return databases.some(database => database.name === name);
    } catch {
      // Fall through to the open probe.
    }
  }

  return new Promise<boolean>(resolve => {
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(name);
    } catch {
      resolve(false);
      return;
    }
    let missing = false;
    request.onupgradeneeded = event => {
      if (event.oldVersion === 0) {
        missing = true;
        request.transaction?.abort();
      }
    };
    request.onsuccess = () => {
      request.result.close();
      resolve(!missing);
    };
    request.onerror = event => {
      // Aborting the upgrade of a missing database ends here; keep it from surfacing as an error.
      event.preventDefault?.();
      resolve(false);
    };
    request.onblocked = () => resolve(false);
  });
}

/**
 * Merges a Yjs document stored by y-indexeddb under a legacy name into `doc`.
 * The legacy database is left untouched, so older versions on the same origin keep working.
 * Merging is idempotent: content that `doc` already has is not duplicated.
 * @param legacyName - Name the document's database had before the rename
 * @param doc - The document to merge the legacy content into
 * @returns Whether a legacy database existed and was merged
 */
export async function importLegacyIndexedDbDocument(legacyName: string, doc: Y.Doc): Promise<boolean> {
  if (isLegacyDatabaseImported(legacyName) || !(await indexedDbExists(legacyName))) {
    return false;
  }

  const legacyDoc = new Y.Doc();
  const legacyPersistence = new IndexeddbPersistence(legacyName, legacyDoc);
  try {
    await legacyPersistence.whenSynced;
    Y.applyUpdate(doc, Y.encodeStateAsUpdate(legacyDoc), LEGACY_IMPORT_ORIGIN);
    markLegacyDatabaseImported(legacyName);
    return true;
  } finally {
    await legacyPersistence.destroy();
    legacyDoc.destroy();
  }
}
