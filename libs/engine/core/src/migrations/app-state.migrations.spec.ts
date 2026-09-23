import * as Y from 'yjs';
import { APP_STATE_MIGRATIONS } from './app-state.migrations';
import { runMigrations } from '../helpers/migration.helper';

describe('APP_STATE_MIGRATIONS', () => {
  describe('v1 → v2: viewport translateX/Y to centerWorldX/Y', () => {
    const migration = APP_STATE_MIGRATIONS.find(m => m.fromVersion === 1 && m.toVersion === 2)!;

    it('should be defined', () => {
      expect(migration).toBeDefined();
      expect(migration.fromVersion).toBe(1);
      expect(migration.toVersion).toBe(2);
    });

    it('should convert translateX/translateY to centerWorldX/centerWorldY', () => {
      const ydoc = new Y.Doc();
      const workspacesMap = ydoc.getMap('workspaces');

      workspacesMap.set('ws-1', {
        id: 'ws-1',
        name: 'Test',
        viewport: { translateX: -200, translateY: -100, scale: 2 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      migration.migrate(ydoc, { workspaces: workspacesMap });

      const result = workspacesMap.get('ws-1') as any;
      // centerWorldX = -(-200) / 2 = 100
      // centerWorldY = -(-100) / 2 = 50
      expect(result.viewport).toEqual({ centerWorldX: 100, centerWorldY: 50, scale: 2 });
    });

    it('should handle zero translate values', () => {
      const ydoc = new Y.Doc();
      const workspacesMap = ydoc.getMap('workspaces');

      workspacesMap.set('ws-1', {
        id: 'ws-1',
        name: 'Test',
        viewport: { translateX: 0, translateY: 0, scale: 1 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      migration.migrate(ydoc, { workspaces: workspacesMap });

      const result = workspacesMap.get('ws-1') as any;
      expect(result.viewport).toEqual({ centerWorldX: 0, centerWorldY: 0, scale: 1 });
    });

    it('should handle workspaces with no viewport', () => {
      const ydoc = new Y.Doc();
      const workspacesMap = ydoc.getMap('workspaces');

      workspacesMap.set('ws-1', {
        id: 'ws-1',
        name: 'Test',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      migration.migrate(ydoc, { workspaces: workspacesMap });

      const result = workspacesMap.get('ws-1') as any;
      expect(result.viewport).toBeUndefined();
    });

    it('should be idempotent — skip if already migrated', () => {
      const ydoc = new Y.Doc();
      const workspacesMap = ydoc.getMap('workspaces');

      workspacesMap.set('ws-1', {
        id: 'ws-1',
        name: 'Test',
        viewport: { centerWorldX: 100, centerWorldY: 50, scale: 2 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      migration.migrate(ydoc, { workspaces: workspacesMap });

      const result = workspacesMap.get('ws-1') as any;
      expect(result.viewport).toEqual({ centerWorldX: 100, centerWorldY: 50, scale: 2 });
    });

    it('should handle multiple workspaces', () => {
      const ydoc = new Y.Doc();
      const workspacesMap = ydoc.getMap('workspaces');

      workspacesMap.set('ws-1', {
        id: 'ws-1',
        name: 'First',
        viewport: { translateX: -100, translateY: -200, scale: 1 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      workspacesMap.set('ws-2', {
        id: 'ws-2',
        name: 'Second',
        viewport: { translateX: 0, translateY: 0, scale: 0.5 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      migration.migrate(ydoc, { workspaces: workspacesMap });

      const result1 = workspacesMap.get('ws-1') as any;
      expect(result1.viewport).toEqual({ centerWorldX: 100, centerWorldY: 200, scale: 1 });

      const result2 = workspacesMap.get('ws-2') as any;
      expect(result2.viewport).toEqual({ centerWorldX: 0, centerWorldY: 0, scale: 0.5 });
    });

    it('should handle missing workspaces map gracefully', () => {
      const ydoc = new Y.Doc();

      expect(() => migration.migrate(ydoc, {})).not.toThrow();
    });
  });

  describe('runMigrations integration', () => {
    it('should run v1→v2 migration via runMigrations helper', () => {
      const ydoc = new Y.Doc();
      const metadataMap = ydoc.getMap('metadata');
      const workspacesMap = ydoc.getMap('workspaces');

      metadataMap.set('schemaVersion', 1);
      workspacesMap.set('ws-1', {
        id: 'ws-1',
        name: 'Test',
        viewport: { translateX: -300, translateY: -150, scale: 3 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const result = runMigrations(ydoc, metadataMap, { workspaces: workspacesMap }, APP_STATE_MIGRATIONS, 2);

      expect(result.migrated).toBe(true);
      expect(result.fromVersion).toBe(1);
      expect(result.toVersion).toBe(2);
      expect(metadataMap.get('schemaVersion')).toBe(2);

      const ws = workspacesMap.get('ws-1') as any;
      // centerWorldX = -(-300) / 3 = 100
      // centerWorldY = -(-150) / 3 = 50
      expect(ws.viewport).toEqual({ centerWorldX: 100, centerWorldY: 50, scale: 3 });
    });

    it('should skip migration when already at target version', () => {
      const ydoc = new Y.Doc();
      const metadataMap = ydoc.getMap('metadata');
      const workspacesMap = ydoc.getMap('workspaces');

      metadataMap.set('schemaVersion', 2);

      const result = runMigrations(ydoc, metadataMap, { workspaces: workspacesMap }, APP_STATE_MIGRATIONS, 2);

      expect(result.migrated).toBe(false);
    });
  });
});
