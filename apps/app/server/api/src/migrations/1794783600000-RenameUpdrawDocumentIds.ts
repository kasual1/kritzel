import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  moveLegacyDocumentIds,
  revertDocumentIdMove,
} from '../legacy-brand-migration';
import {
  DOCUMENT_ID_PREFIX,
  LEGACY_DOCUMENT_ID_PREFIXES,
  UPDRAW_DOCUMENT_ID_PREFIX,
} from '../legacy-brand';

/**
 * Second rebrand (Updraw → Upmade): moves `updraw-…` documents, and any `kritzel-…` ones the first migration
 * left behind (it skips pairs it cannot merge), to `upmade-…` with the same conflict policy.
 *
 * Unlike the first migration it leaves `Kritzel*` and `Updraw*` `__class__` values as they are: the libraries
 * read them under either name and objects heal to `Upmade*` when they are written again. The app keeps its
 * origin, so browsers hold replicas of these documents (imported under the `upmade-…` names), some with edits
 * made during the maintenance window. Rewriting an object here would add a new Yjs item concurrent with those
 * edits: merging such a replica would bring back objects it deleted and drop about half of its changes.
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
  }

  /**
   * Reverses the id rename only, and only to `updraw-…`: rows this migration moved from `kritzel-…` come back as
   * `updraw-…` too. Merged documents, rows set aside after a conflict and objects the Upmade app wrote (as
   * `Upmade*`, which the Updraw app cannot read) are kept: to roll back, restore the database backup taken before
   * the move (see apps/app/docs/rebrand-cutover.md).
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await revertDocumentIdMove(
      queryRunner,
      DOCUMENT_ID_PREFIX,
      UPDRAW_DOCUMENT_ID_PREFIX,
    );
  }
}
