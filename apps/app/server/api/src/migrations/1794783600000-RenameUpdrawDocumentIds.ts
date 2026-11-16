import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  moveLegacyDocumentIds,
  renameLegacyClassesInDocuments,
  revertDocumentIdMove,
} from '../legacy-brand-migration';
import {
  DOCUMENT_ID_PREFIX,
  LEGACY_DOCUMENT_ID_PREFIXES,
  UPDRAW_DOCUMENT_ID_PREFIX,
} from '../legacy-brand';

/**
 * Second rebrand (Updraw → Upmade): moves `updraw-…` documents, and any `kritzel-…` ones the first migration
 * left behind (it skips pairs it cannot merge), to `upmade-…` with the same conflict policy, then renames
 * `Kritzel*` and `Updraw*` `__class__` values to `Upmade*`. Browsers keep replicas of these documents, which the
 * libraries import under the `upmade-…` names; the renames are ordinary Yjs updates, so those replicas merge.
 */
export class RenameUpdrawDocumentIds1794783600000 implements MigrationInterface {
  name = 'RenameUpdrawDocumentIds1794783600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await moveLegacyDocumentIds(
      queryRunner,
      this.name,
      LEGACY_DOCUMENT_ID_PREFIXES,
      DOCUMENT_ID_PREFIX,
    );
    await renameLegacyClassesInDocuments(queryRunner, this.name);
  }

  /**
   * Reverses the id rename only, and only to `updraw-…`: rows this migration moved from `kritzel-…` come back as
   * `updraw-…` too. Renamed `__class__` values, merged documents and rows set aside after a conflict are kept, so
   * the Updraw app cannot read the documents again: to roll back, restore the database backup taken before the
   * move (see apps/app/docs/rebrand-cutover.md).
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await revertDocumentIdMove(
      queryRunner,
      DOCUMENT_ID_PREFIX,
      UPDRAW_DOCUMENT_ID_PREFIX,
    );
  }
}
