import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  moveLegacyDocumentIds,
  renameLegacyClassesInDocuments,
  revertDocumentIdMove,
} from '../legacy-brand-migration';
import {
  KRITZEL_DOCUMENT_ID_PREFIX,
  UPDRAW_DOCUMENT_ID_PREFIX,
} from '../legacy-brand';

/**
 * First rebrand (Kritzel → Updraw, run in production on 2026-11-13): moves `kritzel-…` documents to `updraw-…`,
 * merging the Yjs state when both ids exist, and renames legacy `__class__` values to the current ones.
 * RenameUpdrawDocumentIds1794783600000 then moves the documents on to `upmade-…`. The ids stop at `updraw-…` so
 * that a database which has run neither migration gets the same precedence as production (oldest row wins).
 * Production has recorded this migration as run: never change its class name, `name` or timestamp.
 */
export class RenameLegacyBrandDocumentIds1794575000000 implements MigrationInterface {
  name = 'RenameLegacyBrandDocumentIds1794575000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await moveLegacyDocumentIds(
      queryRunner,
      this.name,
      [KRITZEL_DOCUMENT_ID_PREFIX],
      UPDRAW_DOCUMENT_ID_PREFIX,
    );
    await renameLegacyClassesInDocuments(queryRunner, this.name);
  }

  /**
   * Reverses the id rename only. Renamed `__class__` values, merged documents and rows set aside after a
   * conflict are kept, so clients from before the rename cannot read the documents again: to roll back,
   * restore the database backup taken before the move (see apps/app/docs/rebrand-cutover.md).
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await revertDocumentIdMove(
      queryRunner,
      UPDRAW_DOCUMENT_ID_PREFIX,
      KRITZEL_DOCUMENT_ID_PREFIX,
    );
  }
}
