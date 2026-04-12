import { Migration } from '@mikro-orm/migrations';

export class Migration_20260510000000_drop_ordinal_update_normalization extends Migration {
  public override async up(): Promise<void> {
    // 1. Drop ordinal column from skill_categories — display order is now
    //    handled by a hardcoded array in the frontend, not by the database.
    this.addSql(`ALTER TABLE "skill_categories" DROP COLUMN IF EXISTS "ordinal";`);

    // 2. Recompute normalized_label on skill_categories using the new slug rule:
    //    lowercase → replace runs of non-alphanumeric chars with single hyphen → trim hyphens.
    this.addSql(`
      UPDATE "skill_categories" SET "normalized_label" =
        TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(TRIM("label")), '[^a-z0-9]+', '-', 'g'));
    `);

    // 3. Recompute normalized_label on skills using the same rule, with a
    //    pre-normalization map for C-family languages whose names contain
    //    symbols that the general rule would collapse into ambiguous slugs.
    //    See core/src/normalizeLabel.ts for the TypeScript equivalent.
    this.addSql(`
      UPDATE "skills" SET "normalized_label" = CASE "label"
        WHEN 'C' THEN 'c-lang'
        WHEN 'C++' THEN 'cpp'
        WHEN 'C#' THEN 'csharp'
        WHEN 'F#' THEN 'fsharp'
        WHEN 'Objective-C' THEN 'objective-c'
        WHEN 'Objective-C++' THEN 'objective-cpp'
        ELSE TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(TRIM("label")), '[^a-z0-9]+', '-', 'g'))
      END;
    `);
  }

  public override async down(): Promise<void> {
    // Re-add ordinal column (default 0 for existing rows)
    this.addSql(`ALTER TABLE "skill_categories" ADD COLUMN "ordinal" INTEGER NOT NULL DEFAULT 0;`);

    // Revert normalized_label to the old rule (strip spaces/hyphens/underscores, preserve +#./@&)
    this.addSql(`
      UPDATE "skill_categories" SET "normalized_label" =
        REGEXP_REPLACE(LOWER(TRIM("label")), '[\\s\\-_]', '', 'g');
    `);

    this.addSql(`
      UPDATE "skills" SET "normalized_label" =
        REGEXP_REPLACE(LOWER(TRIM("label")), '[\\s\\-_]', '', 'g');
    `);
  }
}
