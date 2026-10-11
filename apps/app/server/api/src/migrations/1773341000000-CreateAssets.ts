import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAssets1773341000000 implements MigrationInterface {
  name = 'CreateAssets1773341000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "assets" (
        "id" varchar(255) NOT NULL,
        "user_id" varchar(255) NOT NULL,
        "mime_type" varchar(127) NOT NULL,
        "size" integer NOT NULL,
        "width" integer,
        "height" integer,
        "filename" varchar(255),
        "storage_key" varchar(512) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_assets" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_assets_user_id" ON "assets" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_assets_user_id"`);
    await queryRunner.query(`DROP TABLE "assets"`);
  }
}
