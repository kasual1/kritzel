import type { QueryRunner } from 'typeorm';
import * as Y from 'yjs';
import {
  mergeDocumentData,
  normalizeLegacyClassName,
  renameLegacyClasses,
  renameLegacyClassesInDocument,
  toCurrentDocumentId,
  toLegacyDocumentId,
} from './legacy-brand';
import { RenameLegacyBrandDocumentIds1794575000000 } from './migrations/1794575000000-RenameLegacyBrandDocumentIds';

// Pre-rebrand names, as stored in existing documents.
const LEGACY_WORKSPACE_ID = 'kritzel-workspace-1';
const LEGACY_APP_STATE_ID = 'kritzel-app-state-user-1';
const LEGACY_PATH = 'KritzelPath';
const LEGACY_GROUP = 'KritzelGroup';
const LEGACY_CUSTOM_ELEMENT = 'KritzelCustomElement';
const LEGACY_DYNAMIC_OBJECT = 'KritzelDynamicObject';
const LEGACY_WORKSPACE = 'KritzelWorkspace';

interface FakeDocumentRow {
  id: string;
  data: Buffer | null;
  public: boolean;
  type: string;
  user_id: string | null;
}

function encodeDocument(build: (doc: Y.Doc) => void): Buffer {
  const doc = new Y.Doc();
  build(doc);
  const update = Buffer.from(Y.encodeStateAsUpdate(doc));
  doc.destroy();
  return update;
}

function decodeDocument(data: Uint8Array) {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, data);
  const json = {
    objects: doc.getMap('objects').toJSON(),
    workspaces: doc.getMap('workspaces').toJSON(),
    metadata: doc.getMap('metadata').toJSON(),
  };
  doc.destroy();
  return json;
}

function createWorkspaceDocument(objects: Record<string, unknown>): Buffer {
  return encodeDocument((doc) => {
    doc.getMap('metadata').set('type', 'workspace');
    const map = doc.getMap('objects');
    for (const [key, value] of Object.entries(objects)) {
      map.set(key, value);
    }
  });
}

function row(
  id: string,
  data: Buffer | null,
  overrides: Partial<FakeDocumentRow> = {},
): FakeDocumentRow {
  return {
    id,
    data,
    public: false,
    type: 'workspace',
    user_id: 'user-1',
    ...overrides,
  };
}

/** In-memory stand-in for the "documents" table, answering exactly the statements the migration issues. */
function createQueryRunner(rows: FakeDocumentRow[]) {
  const documents = new Map(rows.map((entry) => [entry.id, { ...entry }]));

  const execute = (sql: string, params: unknown[]): unknown => {
    const statement = sql.replace(/\s+/g, ' ').trim();
    const sortedIds = () => [...documents.keys()].sort();

    if (
      statement ===
      'SELECT "id" FROM "documents" WHERE "id" LIKE $1 ORDER BY "id"'
    ) {
      const prefix = String(params[0]).replace(/%$/, '');
      return sortedIds()
        .filter((id) => id.startsWith(prefix))
        .map((id) => ({ id }));
    }
    if (statement === 'SELECT "id" FROM "documents" ORDER BY "id"') {
      return sortedIds().map((id) => ({ id }));
    }
    if (
      statement === 'SELECT "data", "user_id" FROM "documents" WHERE "id" = $1'
    ) {
      const found = documents.get(String(params[0]));
      return found ? [{ data: found.data, user_id: found.user_id }] : [];
    }
    if (statement === 'SELECT 1 FROM "documents" WHERE "id" = $1') {
      return documents.has(String(params[0])) ? [{ '?column?': 1 }] : [];
    }
    if (statement === 'UPDATE "documents" SET "id" = $1 WHERE "id" = $2') {
      const [newId, oldId] = params as [string, string];
      if (documents.has(newId)) {
        throw new Error(`duplicate key value violates "PK_documents"`);
      }
      const found = documents.get(oldId);
      if (found) {
        documents.delete(oldId);
        documents.set(newId, { ...found, id: newId });
      }
      return [];
    }
    if (statement === 'UPDATE "documents" SET "data" = $1 WHERE "id" = $2') {
      const [data, id] = params as [Buffer, string];
      const found = documents.get(id);
      if (found) {
        found.data = data;
      }
      return [];
    }
    if (statement === 'DELETE FROM "documents" WHERE "id" = $1') {
      documents.delete(String(params[0]));
      return [];
    }
    throw new Error(`Unexpected query: ${statement}`);
  };
  const query = jest.fn((sql: string, params: unknown[] = []) =>
    Promise.resolve(execute(sql, params)),
  );

  const dataUpdates = () =>
    query.mock.calls.filter(([sql]) => sql.includes('SET "data"')).length;

  return {
    queryRunner: { query } as unknown as QueryRunner,
    documents,
    dataUpdates,
  };
}

describe('legacy brand helpers', () => {
  it('maps document ids between the legacy and current prefix', () => {
    expect(toCurrentDocumentId(LEGACY_WORKSPACE_ID)).toBe('updraw-workspace-1');
    expect(toCurrentDocumentId('updraw-workspace-1')).toBeNull();
    expect(toLegacyDocumentId('updraw-workspace-1')).toBe(LEGACY_WORKSPACE_ID);
    expect(toLegacyDocumentId('other-workspace-1')).toBeNull();
  });

  it('normalizes legacy class names', () => {
    expect(normalizeLegacyClassName(LEGACY_CUSTOM_ELEMENT)).toBe(
      'UpdrawDynamicObject',
    );
    expect(normalizeLegacyClassName(LEGACY_DYNAMIC_OBJECT)).toBe(
      'UpdrawDynamicObject',
    );
    expect(normalizeLegacyClassName(LEGACY_PATH)).toBe('UpdrawPath');
    expect(normalizeLegacyClassName('UpdrawPath')).toBe('UpdrawPath');
    expect(normalizeLegacyClassName('constructor')).toBe('constructor');
  });

  it('renames nested classes without mutating the input', () => {
    const group = {
      __class__: LEGACY_GROUP,
      id: 'group-1',
      children: [
        { __class__: LEGACY_CUSTOM_ELEMENT, id: 'child-1', html: '<p></p>' },
        { __class__: 'UpdrawText', id: 'child-2' },
      ],
      style: { stroke: '#000' },
    };
    const snapshot = JSON.parse(JSON.stringify(group)) as unknown;

    const renamed = renameLegacyClasses(group) as typeof group;

    expect(group).toEqual(snapshot);
    expect(renamed).toEqual({
      __class__: 'UpdrawGroup',
      id: 'group-1',
      children: [
        { __class__: 'UpdrawDynamicObject', id: 'child-1', html: '<p></p>' },
        { __class__: 'UpdrawText', id: 'child-2' },
      ],
      style: { stroke: '#000' },
    });
    expect(renamed.children[1]).toBe(group.children[1]);
    expect(renamed.style).toBe(group.style);
  });

  it('returns the same reference when nothing is legacy', () => {
    const value = { __class__: 'UpdrawPath', points: [[0, 0]] };
    expect(renameLegacyClasses(value)).toBe(value);
  });

  it('renames classes in the objects and workspaces maps of a document', () => {
    const data = encodeDocument((doc) => {
      doc.getMap('metadata').set('type', 'state');
      doc.getMap('objects').set('path-1', {
        __class__: LEGACY_PATH,
        id: 'path-1',
      });
      doc.getMap('workspaces').set('workspace-1', {
        __class__: LEGACY_WORKSPACE,
        id: 'workspace-1',
        name: 'Board',
      });
    });

    const renamed = renameLegacyClassesInDocument(data);

    expect(renamed).not.toBeNull();
    expect(decodeDocument(renamed!)).toEqual({
      objects: { 'path-1': { __class__: 'UpdrawPath', id: 'path-1' } },
      workspaces: {
        'workspace-1': {
          __class__: 'UpdrawWorkspace',
          id: 'workspace-1',
          name: 'Board',
        },
      },
      metadata: { type: 'state' },
    });
  });

  it('returns null for a document without legacy classes', () => {
    const data = createWorkspaceDocument({
      'path-1': { __class__: 'UpdrawPath', id: 'path-1' },
    });
    expect(renameLegacyClassesInDocument(data)).toBeNull();
  });

  it('merges legacy and current document state', () => {
    const legacy = createWorkspaceDocument({ a: { id: 'a' } });
    const target = createWorkspaceDocument({ b: { id: 'b' } });

    expect(mergeDocumentData(null, target)).toBe(target);
    expect(mergeDocumentData(legacy, null)).toBe(legacy);
    expect(mergeDocumentData(null, null)).toBeNull();
    expect(decodeDocument(mergeDocumentData(legacy, target)!).objects).toEqual({
      a: { id: 'a' },
      b: { id: 'b' },
    });
  });
});

describe('RenameLegacyBrandDocumentIds migration', () => {
  const migration = new RenameLegacyBrandDocumentIds1794575000000();

  it('renames legacy documents and their classes', async () => {
    const { queryRunner, documents } = createQueryRunner([
      row(
        LEGACY_WORKSPACE_ID,
        createWorkspaceDocument({
          'group-1': {
            __class__: LEGACY_GROUP,
            id: 'group-1',
            children: [{ __class__: LEGACY_CUSTOM_ELEMENT, id: 'child-1' }],
          },
        }),
        { public: true, user_id: 'owner' },
      ),
    ]);

    await migration.up(queryRunner);

    expect([...documents.keys()]).toEqual(['updraw-workspace-1']);
    const migrated = documents.get('updraw-workspace-1')!;
    expect(migrated).toMatchObject({ public: true, user_id: 'owner' });
    expect(decodeDocument(migrated.data!).objects).toEqual({
      'group-1': {
        __class__: 'UpdrawGroup',
        id: 'group-1',
        children: [{ __class__: 'UpdrawDynamicObject', id: 'child-1' }],
      },
    });
  });

  it('merges a target of the same owner into the original document, keeping its metadata', async () => {
    const { queryRunner, documents } = createQueryRunner([
      row(
        LEGACY_WORKSPACE_ID,
        createWorkspaceDocument({
          'path-1': { __class__: LEGACY_PATH, id: 'path-1' },
        }),
        { user_id: 'owner', public: true },
      ),
      row(
        'updraw-workspace-1',
        createWorkspaceDocument({
          'path-2': { __class__: 'UpdrawPath', id: 'path-2' },
        }),
        { user_id: 'owner', public: false, type: 'state' },
      ),
    ]);

    await migration.up(queryRunner);

    expect([...documents.keys()]).toEqual(['updraw-workspace-1']);
    const merged = documents.get('updraw-workspace-1')!;
    expect(merged).toMatchObject({
      user_id: 'owner',
      public: true,
      type: 'workspace',
    });
    expect(decodeDocument(merged.data!).objects).toEqual({
      'path-1': { __class__: 'UpdrawPath', id: 'path-1' },
      'path-2': { __class__: 'UpdrawPath', id: 'path-2' },
    });
  });

  it('sets a target created by another user aside instead of merging it', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const squatted = createWorkspaceDocument({
      'path-2': { __class__: 'UpdrawPath', id: 'path-2' },
    });
    const { queryRunner, documents } = createQueryRunner([
      row(
        LEGACY_WORKSPACE_ID,
        createWorkspaceDocument({
          'path-1': { __class__: LEGACY_PATH, id: 'path-1' },
        }),
        { user_id: 'owner', public: true },
      ),
      row('updraw-workspace-1', squatted, { user_id: 'someone-else' }),
      row('rename-conflict-updraw-workspace-1', null, { user_id: 'x' }),
    ]);

    await migration.up(queryRunner);

    expect([...documents.keys()].sort()).toEqual([
      'rename-conflict-2-updraw-workspace-1',
      'rename-conflict-updraw-workspace-1',
      'updraw-workspace-1',
    ]);
    const original = documents.get('updraw-workspace-1')!;
    expect(original).toMatchObject({ user_id: 'owner', public: true });
    expect(decodeDocument(original.data!).objects).toEqual({
      'path-1': { __class__: 'UpdrawPath', id: 'path-1' },
    });
    expect(documents.get('rename-conflict-2-updraw-workspace-1')).toMatchObject(
      {
        user_id: 'someone-else',
        data: squatted,
      },
    );
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('handles documents without data', async () => {
    const target = createWorkspaceDocument({ b: { id: 'b' } });
    const { queryRunner, documents, dataUpdates } = createQueryRunner([
      row(LEGACY_WORKSPACE_ID, null),
      row('updraw-workspace-1', target),
      row(LEGACY_APP_STATE_ID, null, { type: 'state' }),
    ]);

    await migration.up(queryRunner);

    expect([...documents.keys()].sort()).toEqual([
      'updraw-app-state-user-1',
      'updraw-workspace-1',
    ]);
    // The original (legacy) row is kept and receives the target's state.
    expect(documents.get('updraw-workspace-1')!.data).toEqual(target);
    expect(documents.get('updraw-app-state-user-1')!.data).toBeNull();
    expect(dataUpdates()).toBe(1);
  });

  it('only rewrites documents that contain legacy classes', async () => {
    const current = createWorkspaceDocument({
      'path-1': { __class__: 'UpdrawPath', id: 'path-1' },
    });
    const { queryRunner, documents, dataUpdates } = createQueryRunner([
      row('updraw-workspace-1', current),
    ]);

    await migration.up(queryRunner);

    expect(dataUpdates()).toBe(0);
    expect(documents.get('updraw-workspace-1')!.data).toBe(current);
  });

  it('leaves undecodable documents in place', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const corrupt = Buffer.from([1, 2, 3]);
    const target = createWorkspaceDocument({ b: { id: 'b' } });
    const { queryRunner, documents, dataUpdates } = createQueryRunner([
      row(LEGACY_WORKSPACE_ID, corrupt),
      row('updraw-workspace-1', target),
    ]);

    await migration.up(queryRunner);

    expect([...documents.keys()]).toEqual([
      LEGACY_WORKSPACE_ID,
      'updraw-workspace-1',
    ]);
    expect(documents.get('updraw-workspace-1')!.data).toBe(target);
    expect(dataUpdates()).toBe(0);
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it('reverts the id rename unless the legacy id exists', async () => {
    const { queryRunner, documents } = createQueryRunner([
      row('updraw-workspace-1', null),
      row('updraw-app-state-user-1', null),
      row(LEGACY_APP_STATE_ID, null),
      row('other-document', null),
    ]);

    await migration.down(queryRunner);

    expect([...documents.keys()].sort()).toEqual([
      LEGACY_APP_STATE_ID,
      LEGACY_WORKSPACE_ID,
      'other-document',
      'updraw-app-state-user-1',
    ]);
  });
});
