// Steps shared by the migrations that move stored documents to a new brand's names. Kept next to
// legacy-brand.ts rather than in ./migrations, where TypeORM loads every file as a migration.
import type { QueryRunner } from 'typeorm';
import {
  mergeDocumentData,
  renameLegacyClassesInDocument,
  replaceDocumentIdPrefix,
} from './legacy-brand';

interface DocumentIdRow {
  id: string;
}

interface DocumentDataRow {
  data: Buffer | null;
  user_id: string | null;
}

/** Prefix for a document that took a legacy document's new id first and is set aside. */
const CONFLICT_ID_PREFIX = 'rename-conflict-';

/**
 * Moves every document whose id starts with one of `fromPrefixes` to `toPrefix`. When the new id is taken, the
 * legacy row counts as the original document: a row of the same owner is merged into it, a row of another owner
 * is set aside as `rename-conflict-…`, and a pair that cannot be merged is left in place with a warning.
 * @param fromPrefixes - Newest brand first: a later prefix's rows are older, so moving them last lets them win
 *   over the rows an earlier prefix moved onto the same id.
 */
export async function moveLegacyDocumentIds(
  queryRunner: QueryRunner,
  migrationName: string,
  fromPrefixes: readonly string[],
  toPrefix: string,
): Promise<void> {
  for (const fromPrefix of fromPrefixes) {
    const legacyRows = await findIdsWithPrefix(queryRunner, fromPrefix);
    for (const { id: legacyId } of legacyRows) {
      const targetId = replaceDocumentIdPrefix(legacyId, fromPrefix, toPrefix);
      if (targetId) {
        await moveDocument(queryRunner, migrationName, legacyId, targetId);
      }
    }
  }
}

async function moveDocument(
  queryRunner: QueryRunner,
  migrationName: string,
  legacyId: string,
  targetId: string,
): Promise<void> {
  const target = await findData(queryRunner, targetId);
  if (!target) {
    await renameDocument(queryRunner, legacyId, targetId);
    return;
  }

  const legacy = await findData(queryRunner, legacyId);
  if (!legacy) {
    return;
  }

  // Both ids exist. The legacy row is the original document, so its owner, visibility and type are kept.
  if (legacy.user_id !== target.user_id) {
    // Someone else created the new id first (document ids appear in share links): never merge their
    // content into the original document. Set their row aside and give the id to the original.
    const conflictId = await freeConflictId(queryRunner, targetId);
    console.warn(
      `[${migrationName}] "${targetId}" belongs to another user; moved it to "${conflictId}" and renamed "${legacyId}" to "${targetId}".`,
    );
    await renameDocument(queryRunner, targetId, conflictId);
    await renameDocument(queryRunner, legacyId, targetId);
    return;
  }

  // Same owner, e.g. a fallback document a new client created before the move: merge both states.
  let merged: Uint8Array | null;
  try {
    merged = mergeDocumentData(legacy.data, target.data);
  } catch (error) {
    console.warn(
      `[${migrationName}] Could not merge "${legacyId}" into "${targetId}", leaving both in place:`,
      error,
    );
    return;
  }
  await queryRunner.query(`DELETE FROM "documents" WHERE "id" = $1`, [
    targetId,
  ]);
  await renameDocument(queryRunner, legacyId, targetId);
  if (merged && merged !== legacy.data) {
    await queryRunner.query(
      `UPDATE "documents" SET "data" = $1 WHERE "id" = $2`,
      [toBuffer(merged), targetId],
    );
  }
}

/** Renames legacy `__class__` values to the current ones in every stored document; undecodable ones are skipped. */
export async function renameLegacyClassesInDocuments(
  queryRunner: QueryRunner,
  migrationName: string,
): Promise<void> {
  const rows = (await queryRunner.query(
    `SELECT "id" FROM "documents" ORDER BY "id"`,
  )) as DocumentIdRow[];
  for (const { id } of rows) {
    const row = await findData(queryRunner, id);
    if (!row?.data) {
      continue;
    }

    let renamed: Uint8Array | null;
    try {
      renamed = renameLegacyClassesInDocument(row.data);
    } catch (error) {
      console.warn(
        `[${migrationName}] Could not decode "${id}", leaving its class names unchanged:`,
        error,
      );
      continue;
    }
    if (renamed) {
      await queryRunner.query(
        `UPDATE "documents" SET "data" = $1 WHERE "id" = $2`,
        [toBuffer(renamed), id],
      );
    }
  }
}

/** Moves `fromPrefix…` ids back to `toPrefix…`, skipping ids whose old name is taken again. Ids only. */
export async function revertDocumentIdMove(
  queryRunner: QueryRunner,
  fromPrefix: string,
  toPrefix: string,
): Promise<void> {
  const rows = await findIdsWithPrefix(queryRunner, fromPrefix);
  for (const { id } of rows) {
    const legacyId = replaceDocumentIdPrefix(id, fromPrefix, toPrefix);
    if (!legacyId || (await exists(queryRunner, legacyId))) {
      continue;
    }
    await renameDocument(queryRunner, id, legacyId);
  }
}

async function renameDocument(
  queryRunner: QueryRunner,
  fromId: string,
  toId: string,
): Promise<void> {
  await queryRunner.query(`UPDATE "documents" SET "id" = $1 WHERE "id" = $2`, [
    toId,
    fromId,
  ]);
}

async function freeConflictId(
  queryRunner: QueryRunner,
  id: string,
): Promise<string> {
  let candidate = `${CONFLICT_ID_PREFIX}${id}`;
  for (let attempt = 2; await exists(queryRunner, candidate); attempt++) {
    candidate = `${CONFLICT_ID_PREFIX}${attempt}-${id}`;
  }
  return candidate;
}

async function findIdsWithPrefix(
  queryRunner: QueryRunner,
  prefix: string,
): Promise<DocumentIdRow[]> {
  return (await queryRunner.query(
    `SELECT "id" FROM "documents" WHERE "id" LIKE $1 ORDER BY "id"`,
    [`${prefix}%`],
  )) as DocumentIdRow[];
}

async function exists(queryRunner: QueryRunner, id: string): Promise<boolean> {
  const rows = (await queryRunner.query(
    `SELECT 1 FROM "documents" WHERE "id" = $1`,
    [id],
  )) as unknown[];
  return rows.length > 0;
}

async function findData(
  queryRunner: QueryRunner,
  id: string,
): Promise<DocumentDataRow | null> {
  const rows = (await queryRunner.query(
    `SELECT "data", "user_id" FROM "documents" WHERE "id" = $1`,
    [id],
  )) as DocumentDataRow[];
  return rows[0] ?? null;
}

function toBuffer(data: Uint8Array): Buffer {
  return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
}
