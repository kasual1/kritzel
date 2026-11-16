import type { QueryRunner } from 'typeorm';
import * as Y from 'yjs';
import {
  mergeDocumentData,
  normalizeLegacyClassName,
  renameLegacyClasses,
  renameLegacyClassesInDocument,
  replaceDocumentIdPrefix,
} from './legacy-brand';
import { RenameLegacyBrandDocumentIds1794575000000 } from './migrations/1794575000000-RenameLegacyBrandDocumentIds';
import { RenameUpdrawDocumentIds1794783600000 } from './migrations/1794783600000-RenameUpdrawDocumentIds';

// Names of the earlier brands, as stored in existing documents: Kritzel (oldest), then Updraw.
const LEGACY_WORKSPACE_ID = 'kritzel-workspace-1';
const LEGACY_APP_STATE_ID = 'kritzel-app-state-user-1';
const LEGACY_PATH = 'KritzelPath';
const LEGACY_GROUP = 'KritzelGroup';
const LEGACY_CUSTOM_ELEMENT = 'KritzelCustomElement';
const LEGACY_DYNAMIC_OBJECT = 'KritzelDynamicObject';
const LEGACY_WORKSPACE = 'KritzelWorkspace';
const UPDRAW_WORKSPACE_ID = 'updraw-workspace-1';
const UPDRAW_APP_STATE_ID = 'updraw-app-state-user-1';
const UPDRAW_PATH = 'UpdrawPath';
const UPDRAW_GROUP = 'UpdrawGroup';
const UPDRAW_DYNAMIC_OBJECT = 'UpdrawDynamicObject';
const UPDRAW_WORKSPACE = 'UpdrawWorkspace';
const WORKSPACE_ID = 'upmade-workspace-1';

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
  it('swaps the prefix of document ids', () => {
    expect(
      replaceDocumentIdPrefix(UPDRAW_WORKSPACE_ID, 'updraw-', 'upmade-'),
    ).toBe(WORKSPACE_ID);
    expect(
      replaceDocumentIdPrefix(LEGACY_WORKSPACE_ID, 'kritzel-', 'updraw-'),
    ).toBe(UPDRAW_WORKSPACE_ID);
    expect(
      replaceDocumentIdPrefix(LEGACY_WORKSPACE_ID, 'updraw-', 'upmade-'),
    ).toBeNull();
    expect(
      replaceDocumentIdPrefix('other-workspace-1', 'upmade-', 'updraw-'),
    ).toBeNull();
  });

  it('normalizes legacy class names', () => {
    expect(normalizeLegacyClassName(LEGACY_CUSTOM_ELEMENT)).toBe(
      'UpmadeDynamicObject',
    );
    expect(normalizeLegacyClassName(LEGACY_DYNAMIC_OBJECT)).toBe(
      'UpmadeDynamicObject',
    );
    expect(normalizeLegacyClassName(LEGACY_PATH)).toBe('UpmadePath');
    expect(normalizeLegacyClassName(UPDRAW_DYNAMIC_OBJECT)).toBe(
      'UpmadeDynamicObject',
    );
    expect(normalizeLegacyClassName(UPDRAW_PATH)).toBe('UpmadePath');
    expect(normalizeLegacyClassName('UpmadePath')).toBe('UpmadePath');
    expect(normalizeLegacyClassName('constructor')).toBe('constructor');
  });

  it('renames nested classes without mutating the input', () => {
    const group = {
      __class__: LEGACY_GROUP,
      id: 'group-1',
      children: [
        { __class__: LEGACY_CUSTOM_ELEMENT, id: 'child-1', html: '<p></p>' },
        { __class__: 'UpmadeText', id: 'child-2' },
        { __class__: UPDRAW_DYNAMIC_OBJECT, id: 'child-3' },
      ],
      style: { stroke: '#000' },
    };
    const snapshot = JSON.parse(JSON.stringify(group)) as unknown;

    const renamed = renameLegacyClasses(group) as typeof group;

    expect(group).toEqual(snapshot);
    expect(renamed).toEqual({
      __class__: 'UpmadeGroup',
      id: 'group-1',
      children: [
        { __class__: 'UpmadeDynamicObject', id: 'child-1', html: '<p></p>' },
        { __class__: 'UpmadeText', id: 'child-2' },
        { __class__: 'UpmadeDynamicObject', id: 'child-3' },
      ],
      style: { stroke: '#000' },
    });
    expect(renamed.children[1]).toBe(group.children[1]);
    expect(renamed.style).toBe(group.style);
  });

  it('returns the same reference when nothing is legacy', () => {
    const value = { __class__: 'UpmadePath', points: [[0, 0]] };
    expect(renameLegacyClasses(value)).toBe(value);
  });

  it('renames classes of both legacy brands in the objects and workspaces maps of a document', () => {
    const data = encodeDocument((doc) => {
      doc.getMap('metadata').set('type', 'state');
      doc.getMap('objects').set('path-1', {
        __class__: LEGACY_PATH,
        id: 'path-1',
      });
      doc.getMap('objects').set('path-2', {
        __class__: UPDRAW_PATH,
        id: 'path-2',
      });
      doc.getMap('workspaces').set('workspace-1', {
        __class__: LEGACY_WORKSPACE,
        id: 'workspace-1',
        name: 'Board',
      });
      doc.getMap('workspaces').set('workspace-2', {
        __class__: UPDRAW_WORKSPACE,
        id: 'workspace-2',
        name: 'Notes',
      });
    });

    const renamed = renameLegacyClassesInDocument(data);

    expect(renamed).not.toBeNull();
    expect(decodeDocument(renamed!)).toEqual({
      objects: {
        'path-1': { __class__: 'UpmadePath', id: 'path-1' },
        'path-2': { __class__: 'UpmadePath', id: 'path-2' },
      },
      workspaces: {
        'workspace-1': {
          __class__: 'UpmadeWorkspace',
          id: 'workspace-1',
          name: 'Board',
        },
        'workspace-2': {
          __class__: 'UpmadeWorkspace',
          id: 'workspace-2',
          name: 'Notes',
        },
      },
      metadata: { type: 'state' },
    });
  });

  it('returns null for a document without legacy classes', () => {
    const data = createWorkspaceDocument({
      'path-1': { __class__: 'UpmadePath', id: 'path-1' },
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

function workspaceObjects(
  documents: Map<string, FakeDocumentRow>,
  id: string,
): unknown {
  return decodeDocument(documents.get(id)!.data!).objects;
}

describe('RenameLegacyBrandDocumentIds migration (Kritzel → Updraw)', () => {
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

    // The ids stop at updraw-…; RenameUpdrawDocumentIds moves them on.
    expect([...documents.keys()]).toEqual([UPDRAW_WORKSPACE_ID]);
    expect(documents.get(UPDRAW_WORKSPACE_ID)).toMatchObject({
      public: true,
      user_id: 'owner',
    });
    expect(workspaceObjects(documents, UPDRAW_WORKSPACE_ID)).toEqual({
      'group-1': {
        __class__: 'UpmadeGroup',
        id: 'group-1',
        children: [{ __class__: 'UpmadeDynamicObject', id: 'child-1' }],
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
        UPDRAW_WORKSPACE_ID,
        createWorkspaceDocument({
          'path-2': { __class__: UPDRAW_PATH, id: 'path-2' },
        }),
        { user_id: 'owner', public: false, type: 'state' },
      ),
    ]);

    await migration.up(queryRunner);

    expect([...documents.keys()]).toEqual([UPDRAW_WORKSPACE_ID]);
    expect(documents.get(UPDRAW_WORKSPACE_ID)).toMatchObject({
      user_id: 'owner',
      public: true,
      type: 'workspace',
    });
    expect(workspaceObjects(documents, UPDRAW_WORKSPACE_ID)).toEqual({
      'path-1': { __class__: 'UpmadePath', id: 'path-1' },
      'path-2': { __class__: 'UpmadePath', id: 'path-2' },
    });
  });

  it('sets a target created by another user aside instead of merging it', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const squatted = createWorkspaceDocument({
      'path-2': { __class__: 'UpmadePath', id: 'path-2' },
    });
    const { queryRunner, documents } = createQueryRunner([
      row(
        LEGACY_WORKSPACE_ID,
        createWorkspaceDocument({
          'path-1': { __class__: LEGACY_PATH, id: 'path-1' },
        }),
        { user_id: 'owner', public: true },
      ),
      row(UPDRAW_WORKSPACE_ID, squatted, { user_id: 'someone-else' }),
      row('rename-conflict-updraw-workspace-1', null, { user_id: 'x' }),
    ]);

    await migration.up(queryRunner);

    expect([...documents.keys()].sort()).toEqual([
      'rename-conflict-2-updraw-workspace-1',
      'rename-conflict-updraw-workspace-1',
      UPDRAW_WORKSPACE_ID,
    ]);
    expect(documents.get(UPDRAW_WORKSPACE_ID)).toMatchObject({
      user_id: 'owner',
      public: true,
    });
    expect(workspaceObjects(documents, UPDRAW_WORKSPACE_ID)).toEqual({
      'path-1': { __class__: 'UpmadePath', id: 'path-1' },
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
      row(UPDRAW_WORKSPACE_ID, target),
      row(LEGACY_APP_STATE_ID, null, { type: 'state' }),
    ]);

    await migration.up(queryRunner);

    expect([...documents.keys()].sort()).toEqual([
      UPDRAW_APP_STATE_ID,
      UPDRAW_WORKSPACE_ID,
    ]);
    // The original (legacy) row is kept and receives the target's state.
    expect(documents.get(UPDRAW_WORKSPACE_ID)!.data).toEqual(target);
    expect(documents.get(UPDRAW_APP_STATE_ID)!.data).toBeNull();
    expect(dataUpdates()).toBe(1);
  });

  it('only rewrites documents that contain legacy classes', async () => {
    const current = createWorkspaceDocument({
      'path-1': { __class__: 'UpmadePath', id: 'path-1' },
    });
    const { queryRunner, documents, dataUpdates } = createQueryRunner([
      row(WORKSPACE_ID, current),
    ]);

    await migration.up(queryRunner);

    expect(dataUpdates()).toBe(0);
    expect(documents.get(WORKSPACE_ID)!.data).toBe(current);
  });

  it('leaves undecodable documents in place', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const corrupt = Buffer.from([1, 2, 3]);
    const target = createWorkspaceDocument({ b: { id: 'b' } });
    const { queryRunner, documents, dataUpdates } = createQueryRunner([
      row(LEGACY_WORKSPACE_ID, corrupt),
      row(UPDRAW_WORKSPACE_ID, target),
    ]);

    await migration.up(queryRunner);

    expect([...documents.keys()]).toEqual([
      LEGACY_WORKSPACE_ID,
      UPDRAW_WORKSPACE_ID,
    ]);
    expect(documents.get(UPDRAW_WORKSPACE_ID)!.data).toBe(target);
    expect(dataUpdates()).toBe(0);
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it('reverts the id rename unless the legacy id exists', async () => {
    const { queryRunner, documents } = createQueryRunner([
      row(UPDRAW_WORKSPACE_ID, null),
      row(UPDRAW_APP_STATE_ID, null),
      row(LEGACY_APP_STATE_ID, null),
      row(WORKSPACE_ID, null),
      row('other-document', null),
    ]);

    await migration.down(queryRunner);

    expect([...documents.keys()].sort()).toEqual([
      LEGACY_APP_STATE_ID,
      LEGACY_WORKSPACE_ID,
      'other-document',
      UPDRAW_APP_STATE_ID,
      WORKSPACE_ID,
    ]);
  });
});

describe('RenameUpdrawDocumentIds migration (Updraw → Upmade)', () => {
  const migration = new RenameUpdrawDocumentIds1794783600000();

  it('renames Updraw documents and their classes', async () => {
    const { queryRunner, documents } = createQueryRunner([
      row(
        UPDRAW_WORKSPACE_ID,
        createWorkspaceDocument({
          'group-1': {
            __class__: UPDRAW_GROUP,
            id: 'group-1',
            children: [{ __class__: UPDRAW_DYNAMIC_OBJECT, id: 'child-1' }],
          },
        }),
        { public: true, user_id: 'owner' },
      ),
      row(UPDRAW_APP_STATE_ID, null, { type: 'state' }),
      row('other-document', null),
    ]);

    await migration.up(queryRunner);

    expect([...documents.keys()].sort()).toEqual([
      'other-document',
      'upmade-app-state-user-1',
      WORKSPACE_ID,
    ]);
    expect(documents.get(WORKSPACE_ID)).toMatchObject({
      public: true,
      user_id: 'owner',
    });
    expect(workspaceObjects(documents, WORKSPACE_ID)).toEqual({
      'group-1': {
        __class__: 'UpmadeGroup',
        id: 'group-1',
        children: [{ __class__: 'UpmadeDynamicObject', id: 'child-1' }],
      },
    });
  });

  it('moves Kritzel documents left over by the first migration and renames their classes', async () => {
    const { queryRunner, documents } = createQueryRunner([
      row(
        LEGACY_WORKSPACE_ID,
        createWorkspaceDocument({
          'element-1': { __class__: LEGACY_CUSTOM_ELEMENT, id: 'element-1' },
        }),
        { user_id: 'owner' },
      ),
    ]);

    await migration.up(queryRunner);

    expect([...documents.keys()]).toEqual([WORKSPACE_ID]);
    expect(documents.get(WORKSPACE_ID)).toMatchObject({ user_id: 'owner' });
    expect(workspaceObjects(documents, WORKSPACE_ID)).toEqual({
      'element-1': { __class__: 'UpmadeDynamicObject', id: 'element-1' },
    });
  });

  it('merges both legacy rows and an Upmade row of the same owner, keeping the oldest row', async () => {
    const { queryRunner, documents } = createQueryRunner([
      row(
        LEGACY_WORKSPACE_ID,
        createWorkspaceDocument({
          'path-1': { __class__: LEGACY_PATH, id: 'path-1' },
        }),
        { user_id: 'owner', public: true, type: 'workspace' },
      ),
      row(
        UPDRAW_WORKSPACE_ID,
        createWorkspaceDocument({
          'path-2': { __class__: UPDRAW_PATH, id: 'path-2' },
        }),
        { user_id: 'owner', public: false, type: 'state' },
      ),
      row(
        WORKSPACE_ID,
        createWorkspaceDocument({
          'path-3': { __class__: 'UpmadePath', id: 'path-3' },
        }),
        { user_id: 'owner', public: false, type: 'unknown' },
      ),
    ]);

    await migration.up(queryRunner);

    expect([...documents.keys()]).toEqual([WORKSPACE_ID]);
    expect(documents.get(WORKSPACE_ID)).toMatchObject({
      user_id: 'owner',
      public: true,
      type: 'workspace',
    });
    expect(workspaceObjects(documents, WORKSPACE_ID)).toEqual({
      'path-1': { __class__: 'UpmadePath', id: 'path-1' },
      'path-2': { __class__: 'UpmadePath', id: 'path-2' },
      'path-3': { __class__: 'UpmadePath', id: 'path-3' },
    });
  });

  it('gives the id to the oldest row and sets the rows of other owners aside', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const updrawRow = createWorkspaceDocument({
      'path-2': { __class__: UPDRAW_PATH, id: 'path-2' },
    });
    const upmadeRow = createWorkspaceDocument({
      'path-3': { __class__: 'UpmadePath', id: 'path-3' },
    });
    const { queryRunner, documents } = createQueryRunner([
      row(
        LEGACY_WORKSPACE_ID,
        createWorkspaceDocument({
          'path-1': { __class__: LEGACY_PATH, id: 'path-1' },
        }),
        { user_id: 'kritzel-owner', public: true },
      ),
      row(UPDRAW_WORKSPACE_ID, updrawRow, { user_id: 'updraw-owner' }),
      row(WORKSPACE_ID, upmadeRow, { user_id: 'upmade-owner' }),
    ]);

    await migration.up(queryRunner);

    expect([...documents.keys()].sort()).toEqual([
      'rename-conflict-2-upmade-workspace-1',
      'rename-conflict-upmade-workspace-1',
      WORKSPACE_ID,
    ]);
    expect(documents.get(WORKSPACE_ID)).toMatchObject({
      user_id: 'kritzel-owner',
      public: true,
    });
    expect(workspaceObjects(documents, WORKSPACE_ID)).toEqual({
      'path-1': { __class__: 'UpmadePath', id: 'path-1' },
    });
    expect(documents.get('rename-conflict-upmade-workspace-1')).toMatchObject({
      user_id: 'upmade-owner',
      data: upmadeRow,
    });
    expect(documents.get('rename-conflict-2-upmade-workspace-1')!.user_id).toBe(
      'updraw-owner',
    );
    expect(
      workspaceObjects(documents, 'rename-conflict-2-upmade-workspace-1'),
    ).toEqual({ 'path-2': { __class__: 'UpmadePath', id: 'path-2' } });
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it('leaves a Kritzel row in place when it still cannot be merged', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const corrupt = Buffer.from([1, 2, 3]);
    const { queryRunner, documents } = createQueryRunner([
      row(LEGACY_WORKSPACE_ID, corrupt),
      row(
        UPDRAW_WORKSPACE_ID,
        createWorkspaceDocument({
          'path-2': { __class__: UPDRAW_PATH, id: 'path-2' },
        }),
      ),
    ]);

    await migration.up(queryRunner);

    expect([...documents.keys()]).toEqual([LEGACY_WORKSPACE_ID, WORKSPACE_ID]);
    expect(documents.get(LEGACY_WORKSPACE_ID)!.data).toBe(corrupt);
    expect(workspaceObjects(documents, WORKSPACE_ID)).toEqual({
      'path-2': { __class__: 'UpmadePath', id: 'path-2' },
    });
    // One failed merge and one undecodable document in the class pass.
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it('reverts its id rename to updraw-… unless that id exists', async () => {
    const { queryRunner, documents } = createQueryRunner([
      row(WORKSPACE_ID, null),
      row('upmade-app-state-user-1', null),
      row(UPDRAW_APP_STATE_ID, null),
      row(LEGACY_WORKSPACE_ID, null),
    ]);

    await migration.down(queryRunner);

    expect([...documents.keys()].sort()).toEqual([
      LEGACY_WORKSPACE_ID,
      UPDRAW_APP_STATE_ID,
      UPDRAW_WORKSPACE_ID,
      'upmade-app-state-user-1',
    ]);
  });
});

describe('both rebrand migrations in sequence', () => {
  const migrations = [
    new RenameLegacyBrandDocumentIds1794575000000(),
    new RenameUpdrawDocumentIds1794783600000(),
  ];

  async function runAll(queryRunner: QueryRunner): Promise<void> {
    for (const migration of migrations) {
      await migration.up(queryRunner);
    }
  }

  it('moves a database from before the Kritzel rename to Upmade names', async () => {
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
        { user_id: 'owner', public: true },
      ),
      row(LEGACY_APP_STATE_ID, null, { type: 'state' }),
    ]);

    await runAll(queryRunner);

    expect([...documents.keys()].sort()).toEqual([
      'upmade-app-state-user-1',
      WORKSPACE_ID,
    ]);
    expect(documents.get(WORKSPACE_ID)).toMatchObject({
      user_id: 'owner',
      public: true,
    });
    expect(workspaceObjects(documents, WORKSPACE_ID)).toEqual({
      'group-1': {
        __class__: 'UpmadeGroup',
        id: 'group-1',
        children: [{ __class__: 'UpmadeDynamicObject', id: 'child-1' }],
      },
    });
  });

  it('keeps the oldest row as the original, as the new migration alone does', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const rows = () => [
      row(
        LEGACY_WORKSPACE_ID,
        createWorkspaceDocument({
          'path-1': { __class__: LEGACY_PATH, id: 'path-1' },
        }),
        { user_id: 'kritzel-owner', public: true },
      ),
      row(
        UPDRAW_WORKSPACE_ID,
        createWorkspaceDocument({
          'path-2': { __class__: UPDRAW_PATH, id: 'path-2' },
        }),
        { user_id: 'updraw-owner' },
      ),
      row(
        WORKSPACE_ID,
        createWorkspaceDocument({
          'path-3': { __class__: 'UpmadePath', id: 'path-3' },
        }),
        { user_id: 'upmade-owner' },
      ),
    ];
    const sequence = createQueryRunner(rows());
    const single = createQueryRunner(rows());

    await runAll(sequence.queryRunner);
    await migrations[1].up(single.queryRunner);

    for (const { documents } of [sequence, single]) {
      expect(documents.get(WORKSPACE_ID)).toMatchObject({
        user_id: 'kritzel-owner',
        public: true,
      });
      expect(workspaceObjects(documents, WORKSPACE_ID)).toEqual({
        'path-1': { __class__: 'UpmadePath', id: 'path-1' },
      });
      const owners = [...documents.values()].map((entry) => entry.user_id);
      expect(owners.sort()).toEqual([
        'kritzel-owner',
        'updraw-owner',
        'upmade-owner',
      ]);
    }
    expect(
      [...sequence.documents.values()].some((entry) =>
        /^(kritzel|updraw)-/.test(entry.id),
      ),
    ).toBe(false);
    warn.mockRestore();
  });

  it('only has to move the Updraw ids on a database that ran the first migration', async () => {
    const { queryRunner, documents, dataUpdates } = createQueryRunner([
      // As left by the first migration in production: updraw-… ids and Updraw class names.
      row(
        UPDRAW_WORKSPACE_ID,
        createWorkspaceDocument({
          'path-1': { __class__: UPDRAW_PATH, id: 'path-1' },
        }),
      ),
      row('rename-conflict-updraw-workspace-2', null, { user_id: 'x' }),
    ]);

    await migrations[1].up(queryRunner);

    expect([...documents.keys()].sort()).toEqual([
      'rename-conflict-updraw-workspace-2',
      WORKSPACE_ID,
    ]);
    expect(workspaceObjects(documents, WORKSPACE_ID)).toEqual({
      'path-1': { __class__: 'UpmadePath', id: 'path-1' },
    });
    expect(dataUpdates()).toBe(1);
  });

  it('reverts both id renames in reverse order', async () => {
    const { queryRunner, documents } = createQueryRunner([
      row(LEGACY_WORKSPACE_ID, null),
    ]);

    await runAll(queryRunner);
    expect([...documents.keys()]).toEqual([WORKSPACE_ID]);

    await migrations[1].down(queryRunner);
    await migrations[0].down(queryRunner);
    expect([...documents.keys()]).toEqual([LEGACY_WORKSPACE_ID]);
  });
});
