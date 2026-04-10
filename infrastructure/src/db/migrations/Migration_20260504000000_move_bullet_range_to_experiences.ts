import { Migration } from '@mikro-orm/migrations';

export class Migration20260504000000_move_bullet_range_to_experiences extends Migration {
  public override async up(): Promise<void> {
    // 1. Add bullet_min / bullet_max columns with safe defaults
    this.addSql('ALTER TABLE "experiences" ADD COLUMN "bullet_min" integer NOT NULL DEFAULT 2;');
    this.addSql('ALTER TABLE "experiences" ADD COLUMN "bullet_max" integer NOT NULL DEFAULT 5;');

    // 2. Copy per-experience overrides into the new columns
    this.addSql(`
      UPDATE "experiences" e
      SET "bullet_min" = o."bullet_min", "bullet_max" = o."bullet_max"
      FROM "experience_generation_overrides" o
      WHERE e."id" = o."experience_id";
    `);

    // 3. For experiences without overrides, inherit from their profile's generation_settings
    this.addSql(`
      UPDATE "experiences" e
      SET "bullet_min" = gs."bullet_min", "bullet_max" = gs."bullet_max"
      FROM "generation_settings" gs
      WHERE e."profile_id" = gs."profile_id"
        AND e."id" NOT IN (SELECT "experience_id" FROM "experience_generation_overrides");
    `);

    // 4. Remove the column defaults (domain layer manages values)
    this.addSql('ALTER TABLE "experiences" ALTER COLUMN "bullet_min" DROP DEFAULT;');
    this.addSql('ALTER TABLE "experiences" ALTER COLUMN "bullet_max" DROP DEFAULT;');

    // 5. Add check constraints
    this.addSql('ALTER TABLE "experiences" ADD CONSTRAINT "experiences_bullet_min_check" CHECK ("bullet_min" > 0);');
    this.addSql(
      'ALTER TABLE "experiences" ADD CONSTRAINT "experiences_bullet_max_check" CHECK ("bullet_max" >= "bullet_min");'
    );

    // 6. Drop the overrides table
    this.addSql('DROP TABLE IF EXISTS "experience_generation_overrides" CASCADE;');

    // 7. Remove overrides check constraints that were added in the check_constraints migration
    // (they refer to the now-dropped table, so this is a no-op but keeps things clean)
  }

  public override async down(): Promise<void> {
    // 1. Recreate the overrides table
    this.addSql(`
      CREATE TABLE "experience_generation_overrides" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "experience_id" uuid NOT NULL REFERENCES "experiences"("id") ON DELETE CASCADE,
        "bullet_min" int NOT NULL,
        "bullet_max" int NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "experience_generation_overrides_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "experience_generation_overrides_experience_id_unique" UNIQUE ("experience_id")
      );
    `);

    // 2. Move non-default values back into overrides
    this.addSql(`
      INSERT INTO "experience_generation_overrides" ("experience_id", "bullet_min", "bullet_max")
      SELECT "id", "bullet_min", "bullet_max"
      FROM "experiences"
      WHERE "bullet_min" != 2 OR "bullet_max" != 5;
    `);

    // 3. Drop the columns and constraints from experiences
    this.addSql('ALTER TABLE "experiences" DROP CONSTRAINT IF EXISTS "experiences_bullet_min_check";');
    this.addSql('ALTER TABLE "experiences" DROP CONSTRAINT IF EXISTS "experiences_bullet_max_check";');
    this.addSql('ALTER TABLE "experiences" DROP COLUMN "bullet_min";');
    this.addSql('ALTER TABLE "experiences" DROP COLUMN "bullet_max";');
  }
}
