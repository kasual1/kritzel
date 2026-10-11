import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1773339500000 implements MigrationInterface {
  name = 'InitialSchema1773339500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "googleId" varchar NOT NULL,
        "email" varchar NOT NULL,
        "name" varchar NOT NULL,
        "picture" varchar,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_googleId" UNIQUE ("googleId"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "documents" (
        "name" varchar(255) NOT NULL,
        "data" bytea NOT NULL,
        "public" boolean NOT NULL DEFAULT false,
        "type" varchar(20) NOT NULL DEFAULT 'state',
        "user_id" varchar(255),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_documents" PRIMARY KEY ("name")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "documents"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
