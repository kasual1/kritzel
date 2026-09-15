import * as Y from 'yjs';
import { KritzelMigration } from '../interfaces/migration.interface';

export interface KritzelMigrationResult {
  migrated: boolean;
  fromVersion: number;
  toVersion: number;
}

export interface KritzelMigrationOptions {
  quiet?: boolean;
}

/**
 * Runs pending schema migrations on a Y.Doc.
 *
 * Reads the current `schemaVersion` from the metadata map (defaults to 0 for
 * documents that predate the migration system), filters and sorts pending
 * migrations, and executes them in a single `'migration'`-origin transaction.
 *
 * The `'migration'` origin is:
 * - NOT tracked by the UndoManager (which only tracks `'local'` and `'temporary'`)
 * - Distinguishable in observers so they can skip re-processing migration writes
 *
 * @param ydoc - The Y.Doc to migrate
 * @param metadataMap - The metadata Y.Map that stores the schemaVersion
 * @param maps - Named Y.Maps available for migration logic (e.g. `{ workspaces }` or `{ objects }`)
 * @param migrations - The ordered array of migration definitions
 * @param currentVersion - The target schema version defined in code
 * @param options - Optional configuration (e.g. `{ quiet: true }` to suppress console logs)
 * @returns A result object indicating whether migrations ran and the version range
 */
export function runMigrations(
  ydoc: Y.Doc,
  metadataMap: Y.Map<any>,
  maps: Record<string, Y.Map<any>>,
  migrations: KritzelMigration[],
  currentVersion: number,
  options?: KritzelMigrationOptions,
): KritzelMigrationResult {
  const quiet = options?.quiet ?? true;
  const docVersion: number = metadataMap.get('schemaVersion') ?? 0;

  if (docVersion >= currentVersion) {
    return { migrated: false, fromVersion: docVersion, toVersion: docVersion };
  }

  const pending = migrations
    .filter(m => m.fromVersion >= docVersion && m.toVersion <= currentVersion)
    .sort((a, b) => a.fromVersion - b.fromVersion);

  if (!quiet) {
    console.log(`[Kritzel] Running ${pending.length} migration(s) from v${docVersion} to v${currentVersion}`);
  }

  ydoc.transact(() => {
    for (const migration of pending) {
      if (!quiet) {
        console.log(`[Kritzel] Migrating v${migration.fromVersion} → v${migration.toVersion}`);
      }
      migration.migrate(ydoc, maps);
    }
    metadataMap.set('schemaVersion', currentVersion);
  }, 'migration');

  if (!quiet) {
    console.log(`[Kritzel] Migrations complete. Schema now at v${currentVersion}`);
  }

  return { migrated: true, fromVersion: docVersion, toVersion: currentVersion };
}
