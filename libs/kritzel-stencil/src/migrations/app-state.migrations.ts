import { KritzelMigration } from '../interfaces/migration.interface';

/**
 * Ordered list of schema migrations for the app-state Y.Doc.
 * Each migration transforms the document from one schema version to the next.
 *
 * To add a new migration:
 * 1. Bump CURRENT_APP_STATE_SCHEMA_VERSION in constants/schema.constants.ts
 * 2. Append a new entry with fromVersion = old version, toVersion = new version
 * 3. Implement the migrate() function — it must be idempotent
 */
export const APP_STATE_MIGRATIONS: KritzelMigration[] = [];
