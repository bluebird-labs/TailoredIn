import { Migration } from '@mikro-orm/migrations';

export class Migration_20260509000000_create_skill_tables extends Migration {
  public override async up(): Promise<void> {
    // Enable trigram extension for fuzzy search
    this.addSql(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

    // Skill categories (lightweight grouping aggregate)
    this.addSql(`
      CREATE TABLE "skill_categories" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "label" TEXT NOT NULL,
        "normalized_label" TEXT NOT NULL UNIQUE,
        "ordinal" INTEGER NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Skills (global catalog entries)
    this.addSql(`
      CREATE TABLE "skills" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "label" TEXT NOT NULL,
        "normalized_label" TEXT NOT NULL UNIQUE,
        "type" TEXT NOT NULL,
        "category_id" UUID REFERENCES "skill_categories"("id"),
        "description" TEXT,
        "aliases" JSONB NOT NULL DEFAULT '[]',
        "search_text" TEXT NOT NULL DEFAULT '',
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Trigger function to maintain search_text from label + alias labels
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

    // GIN trigram index on search_text for fuzzy typeahead
    this.addSql(`CREATE INDEX "skills_search_trgm_idx" ON "skills" USING GIN (search_text gin_trgm_ops);`);

    // Experience-skill join table (child of Experience)
    this.addSql(`
      CREATE TABLE "experience_skills" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "experience_id" UUID NOT NULL REFERENCES "experiences"("id") ON DELETE CASCADE,
        "skill_id" UUID NOT NULL REFERENCES "skills"("id"),
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.addSql(`CREATE UNIQUE INDEX "experience_skills_experience_skill_unique" ON "experience_skills"("experience_id", "skill_id");`);
  }

  public override async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "experience_skills";`);
    this.addSql(`DROP TRIGGER IF EXISTS skills_search_text_update ON "skills";`);
    this.addSql(`DROP FUNCTION IF EXISTS skills_search_text_trigger();`);
    this.addSql(`DROP TABLE IF EXISTS "skills";`);
    this.addSql(`DROP TABLE IF EXISTS "skill_categories";`);
    this.addSql(`DROP EXTENSION IF EXISTS pg_trgm;`);
  }
}
