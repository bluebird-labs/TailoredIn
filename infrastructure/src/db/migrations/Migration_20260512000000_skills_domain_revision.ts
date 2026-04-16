import { Migration } from '@mikro-orm/migrations';

export class Migration_20260512000000_skills_domain_revision extends Migration {
  public override async up(): Promise<void> {
    // 1. Add parent_id to skill_categories
    this.addSql(`ALTER TABLE "skill_categories" ADD COLUMN "parent_id" uuid REFERENCES "skill_categories"("id");`);

    // 2. Rename type → kind, add new columns to skills
    this.addSql(`ALTER TABLE "skills" RENAME COLUMN "type" TO "kind";`);

    this.addSql(`ALTER TABLE "skills"
      ADD COLUMN "technical_domains" jsonb NOT NULL DEFAULT '[]',
      ADD COLUMN "conceptual_aspects" jsonb NOT NULL DEFAULT '[]',
      ADD COLUMN "architectural_patterns" jsonb NOT NULL DEFAULT '[]',
      ADD COLUMN "mind_name" text,
      ADD COLUMN "runtime_environments" jsonb,
      ADD COLUMN "build_tools" jsonb,
      ADD COLUMN "paradigms" jsonb,
      ADD COLUMN "supported_languages" jsonb,
      ADD COLUMN "specific_to_frameworks" jsonb,
      ADD COLUMN "adapter_for_tool_or_service" jsonb,
      ADD COLUMN "implements_patterns" jsonb,
      ADD COLUMN "solves_application_tasks" jsonb,
      ADD COLUMN "associated_application_domains" jsonb,
      ADD COLUMN "deployment_types" jsonb,
      ADD COLUMN "groups" jsonb;
    `);

    // 3. Migrate existing kind values: language → programming_language, technology → tool
    this.addSql(`UPDATE "skills" SET "kind" = 'programming_language' WHERE "kind" = 'language';`);
    this.addSql(`UPDATE "skills" SET "kind" = 'tool' WHERE "kind" = 'technology';`);

    // 4. Add indexes on skills
    this.addSql(`CREATE INDEX "skills_kind_idx" ON "skills" ("kind");`);
    this.addSql(`CREATE INDEX "skills_mind_name_idx" ON "skills" ("mind_name") WHERE "mind_name" IS NOT NULL;`);

    // 5. Create concepts table
    this.addSql(`
      CREATE TABLE "concepts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "label" text NOT NULL,
        "normalized_label" text NOT NULL UNIQUE,
        "kind" text NOT NULL,
        "category" text,
        "mind_name" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    this.addSql(`CREATE INDEX "concepts_kind_idx" ON "concepts" ("kind");`);

    // 6. Create skill_dependencies table
    this.addSql(`
      CREATE TABLE "skill_dependencies" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "skill_id" uuid NOT NULL REFERENCES "skills"("id") ON DELETE CASCADE,
        "implied_skill_id" uuid NOT NULL REFERENCES "skills"("id") ON DELETE CASCADE,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        UNIQUE ("skill_id", "implied_skill_id"),
        CHECK ("skill_id" != "implied_skill_id")
      );
    `);

    // 7. Create concept_dependencies table
    this.addSql(`
      CREATE TABLE "concept_dependencies" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "skill_id" uuid NOT NULL REFERENCES "skills"("id") ON DELETE CASCADE,
        "concept_id" uuid NOT NULL REFERENCES "concepts"("id") ON DELETE CASCADE,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        UNIQUE ("skill_id", "concept_id")
      );
    `);
  }

  public override async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "concept_dependencies";`);
    this.addSql(`DROP TABLE IF EXISTS "skill_dependencies";`);
    this.addSql(`DROP TABLE IF EXISTS "concepts";`);

    this.addSql(`DROP INDEX IF EXISTS "skills_mind_name_idx";`);
    this.addSql(`DROP INDEX IF EXISTS "skills_kind_idx";`);

    this.addSql(`UPDATE "skills" SET "kind" = 'language' WHERE "kind" = 'programming_language';`);
    this.addSql(`UPDATE "skills" SET "kind" = 'technology' WHERE "kind" NOT IN ('language');`);

    this.addSql(`ALTER TABLE "skills"
      DROP COLUMN "technical_domains",
      DROP COLUMN "conceptual_aspects",
      DROP COLUMN "architectural_patterns",
      DROP COLUMN "mind_name",
      DROP COLUMN "runtime_environments",
      DROP COLUMN "build_tools",
      DROP COLUMN "paradigms",
      DROP COLUMN "supported_languages",
      DROP COLUMN "specific_to_frameworks",
      DROP COLUMN "adapter_for_tool_or_service",
      DROP COLUMN "implements_patterns",
      DROP COLUMN "solves_application_tasks",
      DROP COLUMN "associated_application_domains",
      DROP COLUMN "deployment_types",
      DROP COLUMN "groups";
    `);

    this.addSql(`ALTER TABLE "skills" RENAME COLUMN "kind" TO "type";`);
    this.addSql(`ALTER TABLE "skill_categories" DROP COLUMN "parent_id";`);
  }
}
