import { Migration } from '@mikro-orm/migrations';

export class Migration_20260402000000_experience_as_positions extends Migration {
  override async up(): Promise<void> {
    // 1. Create resume_positions table
    this.addSql(`
      CREATE TABLE "resume_positions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "resume_company_id" uuid NOT NULL,
        "title" text NOT NULL DEFAULT '',
        "start_date" text NOT NULL DEFAULT '',
        "end_date" text NOT NULL DEFAULT '',
        "summary" text NULL,
        "ordinal" integer NOT NULL DEFAULT 0,
        CONSTRAINT "resume_positions_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "resume_positions_company_fkey"
          FOREIGN KEY ("resume_company_id") REFERENCES "resume_companies"("id")
          ON UPDATE CASCADE ON DELETE CASCADE
      );
    `);
    this.addSql(`CREATE INDEX "resume_positions_resume_company_id_idx" ON "resume_positions"("resume_company_id");`);

    // 2. Create one position per company (no promotion)
    this.addSql(`
      INSERT INTO "resume_positions" ("id", "resume_company_id", "title", "start_date", "end_date", "summary", "ordinal", "created_at", "updated_at")
      SELECT gen_random_uuid(), "id", COALESCE("job_title", ''), "joined_at", "left_at", NULL, 0, "created_at", "updated_at"
      FROM "resume_companies"
      WHERE "promoted_at" IS NULL;
    `);

    // For companies WITH promotion: position 0 = most recent role (promoted_at → left_at)
    this.addSql(`
      INSERT INTO "resume_positions" ("id", "resume_company_id", "title", "start_date", "end_date", "summary", "ordinal", "created_at", "updated_at")
      SELECT gen_random_uuid(), "id", COALESCE("job_title", ''), "promoted_at", "left_at", NULL, 0, "created_at", "updated_at"
      FROM "resume_companies"
      WHERE "promoted_at" IS NOT NULL;
    `);

    // For companies WITH promotion: position 1 = earlier role (joined_at → promoted_at)
    this.addSql(`
      INSERT INTO "resume_positions" ("id", "resume_company_id", "title", "start_date", "end_date", "summary", "ordinal", "created_at", "updated_at")
      SELECT gen_random_uuid(), "id", COALESCE("job_title", ''), "joined_at", "promoted_at", NULL, 1, "created_at", "updated_at"
      FROM "resume_companies"
      WHERE "promoted_at" IS NOT NULL;
    `);

    // 3. Add resume_position_id to resume_bullets and populate
    this.addSql(`ALTER TABLE "resume_bullets" ADD COLUMN "resume_position_id" uuid NULL;`);

    // Map bullets to the most recent position (ordinal 0) for their company
    this.addSql(`
      UPDATE "resume_bullets" b
      SET "resume_position_id" = (
        SELECT p."id" FROM "resume_positions" p
        WHERE p."resume_company_id" = b."resume_company_id"
        ORDER BY p."ordinal" ASC
        LIMIT 1
      );
    `);

    this.addSql(`ALTER TABLE "resume_bullets" ALTER COLUMN "resume_position_id" SET NOT NULL;`);
    this.addSql(`
      ALTER TABLE "resume_bullets" ADD CONSTRAINT "resume_bullets_position_fkey"
        FOREIGN KEY ("resume_position_id") REFERENCES "resume_positions"("id")
        ON UPDATE CASCADE ON DELETE CASCADE;
    `);
    this.addSql(`CREATE INDEX "resume_bullets_resume_position_id_idx" ON "resume_bullets"("resume_position_id");`);

    // 4. Drop old resume_company_id from resume_bullets
    this.addSql(`ALTER TABLE "resume_bullets" DROP COLUMN "resume_company_id";`);

    // 5. Add resume_position_id to archetype_positions and populate
    this.addSql(`ALTER TABLE "archetype_positions" ADD COLUMN "resume_position_id" uuid NULL;`);

    // Map each archetype_position to the most recent position (ordinal 0) of its company
    this.addSql(`
      UPDATE "archetype_positions" ap
      SET "resume_position_id" = (
        SELECT p."id" FROM "resume_positions" p
        WHERE p."resume_company_id" = ap."resume_company_id"
        ORDER BY p."ordinal" ASC
        LIMIT 1
      );
    `);

    this.addSql(`ALTER TABLE "archetype_positions" ALTER COLUMN "resume_position_id" SET NOT NULL;`);
    this.addSql(`
      ALTER TABLE "archetype_positions" ADD CONSTRAINT "archetype_positions_position_fkey"
        FOREIGN KEY ("resume_position_id") REFERENCES "resume_positions"("id")
        ON UPDATE CASCADE ON DELETE CASCADE;
    `);
    this.addSql(`CREATE INDEX "archetype_positions_resume_position_id_idx" ON "archetype_positions"("resume_position_id");`);

    // 6. Make override fields nullable on archetype_positions
    this.addSql(`ALTER TABLE "archetype_positions" ALTER COLUMN "job_title" DROP NOT NULL;`);
    this.addSql(`ALTER TABLE "archetype_positions" ALTER COLUMN "start_date" DROP NOT NULL;`);
    this.addSql(`ALTER TABLE "archetype_positions" ALTER COLUMN "end_date" DROP NOT NULL;`);
    this.addSql(`ALTER TABLE "archetype_positions" ALTER COLUMN "role_summary" DROP NOT NULL;`);

    // 7. Drop old FK column from archetype_positions
    this.addSql(`ALTER TABLE "archetype_positions" DROP COLUMN "resume_company_id";`);

    // 8. Drop position-specific columns from resume_companies
    this.addSql(`ALTER TABLE "resume_companies" DROP COLUMN "job_title";`);
    this.addSql(`ALTER TABLE "resume_companies" DROP COLUMN "joined_at";`);
    this.addSql(`ALTER TABLE "resume_companies" DROP COLUMN "left_at";`);
    this.addSql(`ALTER TABLE "resume_companies" DROP COLUMN "promoted_at";`);
  }

  override async down(): Promise<void> {
    // Re-add columns to resume_companies
    this.addSql(`ALTER TABLE "resume_companies" ADD COLUMN "job_title" text NULL;`);
    this.addSql(`ALTER TABLE "resume_companies" ADD COLUMN "joined_at" text NOT NULL DEFAULT '';`);
    this.addSql(`ALTER TABLE "resume_companies" ADD COLUMN "left_at" text NOT NULL DEFAULT '';`);
    this.addSql(`ALTER TABLE "resume_companies" ADD COLUMN "promoted_at" text NULL;`);

    // Re-add resume_company_id to archetype_positions
    this.addSql(`ALTER TABLE "archetype_positions" ADD COLUMN "resume_company_id" uuid NULL;`);
    this.addSql(`
      UPDATE "archetype_positions" ap
      SET "resume_company_id" = (
        SELECT p."resume_company_id" FROM "resume_positions" p WHERE p."id" = ap."resume_position_id"
      );
    `);
    this.addSql(`ALTER TABLE "archetype_positions" ALTER COLUMN "resume_company_id" SET NOT NULL;`);
    this.addSql(`ALTER TABLE "archetype_positions" ALTER COLUMN "job_title" SET NOT NULL;`);
    this.addSql(`ALTER TABLE "archetype_positions" ALTER COLUMN "start_date" SET NOT NULL;`);
    this.addSql(`ALTER TABLE "archetype_positions" ALTER COLUMN "end_date" SET NOT NULL;`);
    this.addSql(`ALTER TABLE "archetype_positions" ALTER COLUMN "role_summary" SET NOT NULL;`);
    this.addSql(`ALTER TABLE "archetype_positions" DROP COLUMN "resume_position_id";`);

    // Re-add resume_company_id to resume_bullets
    this.addSql(`ALTER TABLE "resume_bullets" ADD COLUMN "resume_company_id" uuid NULL;`);
    this.addSql(`
      UPDATE "resume_bullets" b
      SET "resume_company_id" = (
        SELECT p."resume_company_id" FROM "resume_positions" p WHERE p."id" = b."resume_position_id"
      );
    `);
    this.addSql(`ALTER TABLE "resume_bullets" ALTER COLUMN "resume_company_id" SET NOT NULL;`);
    this.addSql(`ALTER TABLE "resume_bullets" DROP COLUMN "resume_position_id";`);

    // Restore company-level fields from first position
    this.addSql(`
      UPDATE "resume_companies" c
      SET "job_title" = p."title", "joined_at" = p."start_date", "left_at" = p."end_date"
      FROM "resume_positions" p
      WHERE p."resume_company_id" = c."id" AND p."ordinal" = 0;
    `);

    // Drop positions table
    this.addSql(`DROP TABLE "resume_positions";`);
  }
}
