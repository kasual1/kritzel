import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  DOCUMENT_ID_PREFIX,
  LEGACY_DOCUMENT_ID_PREFIX,
  mergeDocumentData,
  renameLegacyClassesInDocument,
  toCurrentDocumentId,
  toLegacyDocumentId,
} from '../legacy-brand';

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
 * Moves documents saved under the pre-rebrand id prefix (see ../legacy-brand) to `updraw-…`, merging the
 * Yjs state when both ids exist, and renames legacy `__class__` values inside the stored Yjs documents.
 * No client holds a replica of these documents on the new origin, so rewriting them here is safe.
 */
export class RenameLegacyBrandDocumentIds1794575000000 implements MigrationInterface {
  name = 'RenameLegacyBrandDocumentIds1794575000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const legacyRows = await this.findIdsWithPrefix(
      queryRunner,
      LEGACY_DOCUMENT_ID_PREFIX,
    );

    for (const { id: legacyId } of legacyRows) {
      const targetId = toCurrentDocumentId(legacyId);
      if (!targetId) {
        continue;
      }

      const target = await this.findData(queryRunner, targetId);
      if (!target) {
        await this.renameDocument(queryRunner, legacyId, targetId);
        continue;
      }

      const legacy = await this.findData(queryRunner, legacyId);
      if (!legacy) {
        continue;
      }

      // Both ids exist. The legacy row is the original document, so its owner, visibility and type are kept.
      if (legacy.user_id !== target.user_id) {
        // Someone else created the new id first (document ids appear in share links): never merge their
        // content into the original document. Set their row aside and give the id to the original.
        const conflictId = await this.freeConflictId(queryRunner, targetId);
        console.warn(
          `[${this.name}] "${targetId}" belongs to another user; moved it to "${conflictId}" and renamed "${legacyId}" to "${targetId}".`,
        );
        await this.renameDocument(queryRunner, targetId, conflictId);
        await this.renameDocument(queryRunner, legacyId, targetId);
        continue;
      }

      // Same owner, e.g. a fallback document a new client created before the move: merge both states.
      let merged: Uint8Array | null;
      try {
        merged = mergeDocumentData(legacy.data, target.data);
      } catch (error) {
        console.warn(
          `[${this.name}] Could not merge "${legacyId}" into "${targetId}", leaving both in place:`,
          error,
        );
        continue;
      }
      await queryRunner.query(`DELETE FROM "documents" WHERE "id" = $1`, [
        targetId,
      ]);
      await this.renameDocument(queryRunner, legacyId, targetId);
      if (merged && merged !== legacy.data) {
        await queryRunner.query(
          `UPDATE "documents" SET "data" = $1 WHERE "id" = $2`,
          [toBuffer(merged), targetId],
        );
      }
    }

    const rows = (await queryRunner.query(
      `SELECT "id" FROM "documents" ORDER BY "id"`,
    )) as DocumentIdRow[];
    for (const { id } of rows) {
      const row = await this.findData(queryRunner, id);
      if (!row?.data) {
        continue;
      }

      let renamed: Uint8Array | null;
      try {
        renamed = renameLegacyClassesInDocument(row.data);
      } catch (error) {
        console.warn(
          `[${this.name}] Could not decode "${id}", leaving its class names unchanged:`,
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

  /**
   * Reverses the id rename only. Renamed `__class__` values, merged documents and rows set aside after a
   * conflict are kept, so clients from before the rename cannot read the documents again: to roll back,
   * restore the database backup taken before the move (see apps/app/docs/rebrand-cutover.md).
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    const rows = await this.findIdsWithPrefix(queryRunner, DOCUMENT_ID_PREFIX);

    for (const { id } of rows) {
      const legacyId = toLegacyDocumentId(id);
      if (!legacyId || (await this.exists(queryRunner, legacyId))) {
        continue;
      }
      await queryRunner.query(
        `UPDATE "documents" SET "id" = $1 WHERE "id" = $2`,
        [legacyId, id],
      );
    }
  }

  private async renameDocument(
    queryRunner: QueryRunner,
    fromId: string,
    toId: string,
  ): Promise<void> {
    await queryRunner.query(
      `UPDATE "documents" SET "id" = $1 WHERE "id" = $2`,
      [toId, fromId],
    );
  }

  private async freeConflictId(
    queryRunner: QueryRunner,
    id: string,
  ): Promise<string> {
    let candidate = `${CONFLICT_ID_PREFIX}${id}`;
    for (
      let attempt = 2;
      await this.exists(queryRunner, candidate);
      attempt++
    ) {
      candidate = `${CONFLICT_ID_PREFIX}${attempt}-${id}`;
    }
    return candidate;
  }

  private async findIdsWithPrefix(
    queryRunner: QueryRunner,
    prefix: string,
  ): Promise<DocumentIdRow[]> {
    return (await queryRunner.query(
      `SELECT "id" FROM "documents" WHERE "id" LIKE $1 ORDER BY "id"`,
      [`${prefix}%`],
    )) as DocumentIdRow[];
  }

  private async exists(queryRunner: QueryRunner, id: string): Promise<boolean> {
    const rows = (await queryRunner.query(
      `SELECT 1 FROM "documents" WHERE "id" = $1`,
      [id],
    )) as unknown[];
    return rows.length > 0;
  }

  private async findData(
    queryRunner: QueryRunner,
    id: string,
  ): Promise<DocumentDataRow | null> {
    const rows = (await queryRunner.query(
      `SELECT "data", "user_id" FROM "documents" WHERE "id" = $1`,
      [id],
    )) as DocumentDataRow[];
    return rows[0] ?? null;
  }
}

function toBuffer(data: Uint8Array): Buffer {
  return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
}
