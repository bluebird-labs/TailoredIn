import { Migration } from '@mikro-orm/migrations';

export class Migration_20260513000000_skill_search_words extends Migration {
  public override async up(): Promise<void> {
    // 1. Per-word search table: one lowercased word per row, mapped to its skill.
    this.addSql(`
      CREATE TABLE "skill_search_terms" (
        "skill_id" uuid NOT NULL REFERENCES "skills"("id") ON DELETE CASCADE,
        "word" text NOT NULL,
        "kind" text NOT NULL CHECK ("kind" IN ('label','alias')),
        PRIMARY KEY ("skill_id", "word", "kind")
      );
    `);

    this.addSql(`CREATE INDEX "skill_search_terms_skill_id_idx" ON "skill_search_terms" ("skill_id");`);
    this.addSql(
      `CREATE INDEX "skill_search_terms_word_trgm_idx" ON "skill_search_terms" USING GIN ("word" gin_trgm_ops);`
    );

    // 2. Trigger: rebuild a skill's word rows whenever its label or aliases change.
    this.addSql(`
      CREATE OR REPLACE FUNCTION skills_rebuild_search_terms() RETURNS trigger AS $$
      BEGIN
        DELETE FROM skill_search_terms WHERE skill_id = NEW.id;

        INSERT INTO skill_search_terms (skill_id, word, kind)
        SELECT NEW.id, word, 'label'
        FROM regexp_split_to_table(lower(NEW.label), '[^a-z0-9+#]+') AS word
        WHERE length(word) >= 1
        ON CONFLICT DO NOTHING;

        INSERT INTO skill_search_terms (skill_id, word, kind)
        SELECT NEW.id, word, 'alias'
        FROM jsonb_array_elements(NEW.aliases) AS elem,
             regexp_split_to_table(lower(elem->>'label'), '[^a-z0-9+#]+') AS word
        WHERE elem ? 'label' AND length(word) >= 1
        ON CONFLICT DO NOTHING;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    this.addSql(`
      CREATE TRIGGER skills_rebuild_search_terms_trg
        AFTER INSERT OR UPDATE OF label, aliases ON skills
        FOR EACH ROW EXECUTE FUNCTION skills_rebuild_search_terms();
    `);

    // 3. Backfill existing rows by triggering the AFTER UPDATE trigger.
    this.addSql(`UPDATE "skills" SET "label" = "label";`);

    // 4. Drop the old concatenated search_text infrastructure.
    this.addSql(`DROP TRIGGER IF EXISTS skills_search_text_update ON "skills";`);
    this.addSql(`DROP FUNCTION IF EXISTS skills_search_text_trigger();`);
    this.addSql(`DROP INDEX IF EXISTS "skills_search_trgm_idx";`);
    this.addSql(`DROP INDEX IF EXISTS "skills_label_trgm_idx";`);
    this.addSql(`ALTER TABLE "skills" DROP COLUMN IF EXISTS "search_text";`);
  }

  public override async down(): Promise<void> {
    // Recreate the old search_text column + trigger + indexes.
    this.addSql(`ALTER TABLE "skills" ADD COLUMN "search_text" text NOT NULL DEFAULT '';`);

    this.addSql(`
      CREATE OR REPLACE FUNCTION skills_search_text_trigger() RETURNS trigger AS $$
      BEGIN
        NEW.search_text := NEW.label || ' ' || COALESCE(
          (SELECT string_agg(elem->>'label', ' ') FROM jsonb_array_elements(NEW.aliases) AS elem),
          ''
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    this.addSql(`
      CREATE TRIGGER skills_search_text_update
        BEFORE INSERT OR UPDATE OF label, aliases ON skills
        FOR EACH ROW EXECUTE FUNCTION skills_search_text_trigger();
    `);

    this.addSql(`
      UPDATE "skills" SET "search_text" = "label" || ' ' || COALESCE(
        (SELECT string_agg(elem->>'label', ' ') FROM jsonb_array_elements("aliases") AS elem),
        ''
      );
    `);

    this.addSql(`CREATE INDEX "skills_search_trgm_idx" ON "skills" USING GIN ("search_text" gin_trgm_ops);`);
    this.addSql(`CREATE INDEX "skills_label_trgm_idx" ON "skills" USING GIN ("label" gin_trgm_ops);`);

    // Drop the new per-word infrastructure.
    this.addSql(`DROP TRIGGER IF EXISTS skills_rebuild_search_terms_trg ON "skills";`);
    this.addSql(`DROP FUNCTION IF EXISTS skills_rebuild_search_terms();`);
    this.addSql(`DROP TABLE IF EXISTS "skill_search_terms";`);
  }
}
