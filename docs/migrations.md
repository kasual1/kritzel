# Migrations

Kritzel uses a versioned schema migration system to evolve the data stored in Yjs documents (Y.Docs) over time. There are two independent migration pipelines — one for the **app-state** document (workspace list & settings) and one for each **workspace** document (drawable objects on the canvas).

## Overview

Each Y.Doc carries a `schemaVersion` number inside its `metadata` Y.Map. When a document is loaded, the system compares the stored version against the current version defined in code. If the document is behind, pending migrations are executed in order inside a single Yjs transaction.

### Key Properties

- **Sequential**: Migrations run in `fromVersion` order, each upgrading the document by exactly one version.
- **Idempotent**: Every migration must be safe to run more than once. In a collaborative environment multiple clients may execute the same migration concurrently due to Yjs CRDT merging.
- **Non-undoable**: Migrations run inside a `'migration'`-origin transaction, which is intentionally excluded from the UndoManager (it only tracks `'local'` and `'temporary'` origins).

## Architecture

```
constants/schema.constants.ts        ← current version numbers
interfaces/migration.interface.ts    ← KritzelMigration interface
helpers/migration.helper.ts          ← runMigrations() function
migrations/app-state.migrations.ts   ← app-state migration list
migrations/workspace.migrations.ts   ← workspace migration list
```

### `KritzelMigration` Interface

```ts
interface KritzelMigration {
  fromVersion: number;
  toVersion: number;  // must equal fromVersion + 1
  migrate(ydoc: Y.Doc, maps: Record<string, Y.Map<any>>): void;
}
```

### `runMigrations()` Function

```ts
function runMigrations(
  ydoc: Y.Doc,
  metadataMap: Y.Map<any>,
  maps: Record<string, Y.Map<any>>,
  migrations: KritzelMigration[],
  currentVersion: number,
  options?: { quiet?: boolean },
): KritzelMigrationResult;
```

The function:

1. Reads `schemaVersion` from the metadata map (defaults to `0` for documents that predate the migration system).
2. Filters and sorts pending migrations.
3. Executes them inside a single `'migration'`-origin transaction.
4. Stamps the new `schemaVersion` on the metadata map.

### Where Migrations Run

| Document type | Triggered in | Maps passed |
|---|---|---|
| App-state | `KritzelAppStateMap` structure (on load) | `{ workspaces }` |
| Workspace | `KritzelObjectMap` structure (on load) | `{ objects }` |

## How to Add a New Migration

### App-State Migration

1. **Bump the version** in `constants/schema.constants.ts`:

   ```ts
   export const CURRENT_APP_STATE_SCHEMA_VERSION = 2; // was 1
   ```

2. **Add a migration entry** in `migrations/app-state.migrations.ts`:

   ```ts
   export const APP_STATE_MIGRATIONS: KritzelMigration[] = [
     {
       fromVersion: 1,
       toVersion: 2,
       migrate(_ydoc, maps) {
         // maps.workspaces is the Y.Map containing workspace entries
         maps.workspaces.forEach((value: any, key: string) => {
           if (value.newField === undefined) {
             maps.workspaces.set(key, { ...value, newField: 'default' });
           }
         });
       },
     },
   ];
   ```

### Workspace Migration

1. **Bump the version** in `constants/schema.constants.ts`:

   ```ts
   export const CURRENT_WORKSPACE_SCHEMA_VERSION = 2; // was 1
   ```

2. **Add a migration entry** in `migrations/workspace.migrations.ts`:

   ```ts
   export const WORKSPACE_MIGRATIONS: KritzelMigration[] = [
     {
       fromVersion: 1,
       toVersion: 2,
       migrate(_ydoc, maps) {
         // maps.objects is the Y.Map containing drawable objects
         maps.objects.forEach((value: any, key: string) => {
           if (value.newProp === undefined) {
             maps.objects.set(key, { ...value, newProp: 0 });
           }
         });
       },
     },
   ];
   ```

## Writing Idempotent Migrations

Because multiple clients can run the same migration concurrently, guard every mutation with a condition that makes re-application a no-op:

```ts
// Good — idempotent
maps.objects.forEach((value: any, key: string) => {
  if (!value.migrated) {
    maps.objects.set(key, { ...value, migrated: true });
  }
});

// Bad — NOT idempotent (doubles the value every run)
maps.objects.forEach((value: any, key: string) => {
  maps.objects.set(key, { ...value, score: value.score * 2 });
});
```

## Debugging

Pass `{ quiet: false }` to `runMigrations()` to enable console logging of each migration step. The logs follow the format:

```
[Kritzel] Running 2 migration(s) from v0 to v2
[Kritzel] Migrating v0 → v1
[Kritzel] Migrating v1 → v2
[Kritzel] Migrations complete. Schema now at v2
```

The `debugInfo.showMigrationInfo` flag on the editor can also be used to surface migration state.
