import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDocumentId1773340000000 implements MigrationInterface {
  name = 'AddDocumentId1773340000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "documents" ADD "id" varchar(255)
    `);
    await queryRunner.query(`
      UPDATE "documents" SET "id" = "name"
    `);
    await queryRunner.query(`
      ALTER TABLE "documents"
      ALTER COLUMN "id" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "documents"
      DROP CONSTRAINT "PK_documents"
    `);
    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD CONSTRAINT "PK_documents" PRIMARY KEY ("id")
    `);
    await queryRunner.query(`
      ALTER TABLE "documents" DROP COLUMN "name"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD "name" varchar(255)
    `);
    await queryRunner.query(`
      UPDATE "documents" SET "name" = "id"
    `);
    await queryRunner.query(`
      ALTER TABLE "documents"
      ALTER COLUMN "name" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "documents"
      DROP CONSTRAINT "PK_documents"
    `);
    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD CONSTRAINT "PK_documents" PRIMARY KEY ("name")
    `);
    await queryRunner.query(`
      ALTER TABLE "documents" DROP COLUMN "id"
    `);
  }
}
