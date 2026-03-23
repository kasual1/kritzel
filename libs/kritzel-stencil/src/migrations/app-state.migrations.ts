import * as Y from 'yjs';
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
export const APP_STATE_MIGRATIONS: KritzelMigration[] = [
  {
    fromVersion: 1,
    toVersion: 2,
    /**
     * Converts workspace viewport from screen-space { translateX, translateY }
     * to device-independent world-space { centerWorldX, centerWorldY }.
     *
     * Since viewport dimensions are not available during migration, uses the
     * approximation: centerWorld = -translate / scale (world coordinate at screen origin).
     */
    migrate(_ydoc: Y.Doc, maps: Record<string, Y.Map<any>>): void {
      const workspacesMap = maps['workspaces'];
      if (!workspacesMap) return;

      workspacesMap.forEach((serialized, key) => {
        const viewport = serialized?.viewport;
        if (!viewport) return;

        // Idempotency: skip if already migrated
        if ('centerWorldX' in viewport) return;

        const scale = viewport.scale ?? 1;
        const translateX = viewport.translateX ?? 0;
        const translateY = viewport.translateY ?? 0;

        const migrated = {
          ...serialized,
          viewport: {
            centerWorldX: -translateX / scale || 0,
            centerWorldY: -translateY / scale || 0,
            scale,
          },
        };

        workspacesMap.set(key, migrated);
      });
    },
  },
];
