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
}

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
        await queryRunner.query(
          `UPDATE "documents" SET "id" = $1 WHERE "id" = $2`,
          [targetId, legacyId],
        );
        continue;
      }

      // Both names exist: keep the target row (owner, visibility, type) and merge the legacy state into it.
      const legacy = await this.findData(queryRunner, legacyId);
      let merged: Uint8Array | null;
      try {
        merged = mergeDocumentData(legacy?.data ?? null, target.data);
      } catch (error) {
        console.warn(
          `[${this.name}] Could not merge "${legacyId}" into "${targetId}", leaving it in place:`,
          error,
        );
        continue;
      }
      if (merged && merged !== target.data) {
        await queryRunner.query(
          `UPDATE "documents" SET "data" = $1 WHERE "id" = $2`,
          [toBuffer(merged), targetId],
        );
      }
      await queryRunner.query(`DELETE FROM "documents" WHERE "id" = $1`, [
        legacyId,
      ]);
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

  /** Reverses the id rename only. Renamed `__class__` values and merged documents are kept. */
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
      `SELECT "data" FROM "documents" WHERE "id" = $1`,
      [id],
    )) as DocumentDataRow[];
    return rows[0] ?? null;
  }
}

function toBuffer(data: Uint8Array): Buffer {
  return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
}
