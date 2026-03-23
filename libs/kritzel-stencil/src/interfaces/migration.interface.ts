import * as Y from 'yjs';

/**
 * Describes a single schema migration step for a Y.Doc.
 * Migrations transform the data stored in Yjs maps from one schema version to another.
 *
 * Each migration must be idempotent — in a collaborative environment, multiple clients
 * may execute the same migration concurrently due to Yjs CRDT merging.
 */
export interface KritzelMigration {
  /** The schema version this migration upgrades from. */
  fromVersion: number;
  /** The schema version this migration upgrades to. Must equal fromVersion + 1. */
  toVersion: number;
  /** Mutates the Yjs maps in-place to transform data from fromVersion to toVersion. */
  migrate(ydoc: Y.Doc, maps: Record<string, Y.Map<any>>): void;
}
