import { Migration } from '@mikro-orm/migrations';

export class Migration_20260404000000_domain_rethink extends Migration {
  override async up(): Promise<void> {
    // 1. Tags vocabulary
    this.addSql(`
      CREATE TABLE "tags" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" text NOT NULL,
        "dimension" text NOT NULL CHECK ("dimension" IN ('ROLE', 'SKILL')),
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "tags_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "tags_name_dimension_unique" UNIQUE ("name", "dimension")
      );
    `);

    // 2. Profiles
    this.addSql(`
      CREATE TABLE "profiles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "email" text NOT NULL,
        "first_name" text NOT NULL,
        "last_name" text NOT NULL,
        "phone" text NULL,
        "location" text NULL,
        "linkedin_url" text NULL,
        "github_url" text NULL,
        "website_url" text NULL,
        CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
      );
    `);

    // 3. Experiences
    this.addSql(`
      CREATE TABLE "experiences" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
        "title" text NOT NULL,
        "company_name" text NOT NULL,
        "company_website" text NULL,
        "location" text NOT NULL DEFAULT '',
        "start_date" text NOT NULL,
        "end_date" text NOT NULL,
        "summary" text NULL,
        "ordinal" integer NOT NULL DEFAULT 0,
        CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
      );
    `);
    this.addSql(`CREATE INDEX "experiences_profile_id_idx" ON "experiences"("profile_id");`);

    // 4. Bullets
    this.addSql(`
      CREATE TABLE "bullets" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "experience_id" uuid NOT NULL REFERENCES "experiences"("id") ON DELETE CASCADE,
        "content" text NOT NULL,
        "ordinal" integer NOT NULL DEFAULT 0,
        CONSTRAINT "bullets_pkey" PRIMARY KEY ("id")
      );
    `);
    this.addSql(`CREATE INDEX "bullets_experience_id_idx" ON "bullets"("experience_id");`);

    // 5. Bullet tags (join table)
    this.addSql(`
      CREATE TABLE "bullet_tags" (
        "bullet_id" uuid NOT NULL REFERENCES "bullets"("id") ON DELETE CASCADE,
        "tag_id" uuid NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
        CONSTRAINT "bullet_tags_pkey" PRIMARY KEY ("bullet_id", "tag_id")
      );
    `);

    // 6. Bullet variants
    this.addSql(`
      CREATE TABLE "bullet_variants" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "bullet_id" uuid NOT NULL REFERENCES "bullets"("id") ON DELETE CASCADE,
        "text" text NOT NULL,
        "angle" text NOT NULL,
        "source" text NOT NULL CHECK ("source" IN ('llm', 'manual')),
        "approval_status" text NOT NULL DEFAULT 'PENDING' CHECK ("approval_status" IN ('PENDING', 'APPROVED', 'REJECTED')),
        CONSTRAINT "bullet_variants_pkey" PRIMARY KEY ("id")
      );
    `);
    this.addSql(`CREATE INDEX "bullet_variants_bullet_id_idx" ON "bullet_variants"("bullet_id");`);

    // 7. Bullet variant tags (join table)
    this.addSql(`
      CREATE TABLE "bullet_variant_tags" (
        "bullet_variant_id" uuid NOT NULL REFERENCES "bullet_variants"("id") ON DELETE CASCADE,
        "tag_id" uuid NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
        CONSTRAINT "bullet_variant_tags_pkey" PRIMARY KEY ("bullet_variant_id", "tag_id")
      );
    `);

    // 8. Projects
    this.addSql(`
      CREATE TABLE "projects" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
        "name" text NOT NULL,
        "description" text NULL,
        "url" text NULL,
        "start_date" text NOT NULL,
        "end_date" text NULL,
        "ordinal" integer NOT NULL DEFAULT 0,
        CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
      );
    `);
    this.addSql(`CREATE INDEX "projects_profile_id_idx" ON "projects"("profile_id");`);

    // 9. Project tags (join table)
    this.addSql(`
      CREATE TABLE "project_tags" (
        "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
        "tag_id" uuid NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
        CONSTRAINT "project_tags_pkey" PRIMARY KEY ("project_id", "tag_id")
      );
    `);

    // 10. Headlines
    this.addSql(`
      CREATE TABLE "headlines" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
        "label" text NOT NULL,
        "summary_text" text NOT NULL,
        CONSTRAINT "headlines_pkey" PRIMARY KEY ("id")
      );
    `);
    this.addSql(`CREATE INDEX "headlines_profile_id_idx" ON "headlines"("profile_id");`);

    // 11. Headline tags (join table — role tags only)
    this.addSql(`
      CREATE TABLE "headline_tags" (
        "headline_id" uuid NOT NULL REFERENCES "headlines"("id") ON DELETE CASCADE,
        "tag_id" uuid NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
        CONSTRAINT "headline_tags_pkey" PRIMARY KEY ("headline_id", "tag_id")
      );
    `);

    // 12. Education
    this.addSql(`
      CREATE TABLE "educations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
        "degree_title" text NOT NULL,
        "institution_name" text NOT NULL,
        "graduation_year" integer NOT NULL,
        "location" text NULL,
        "honors" text NULL,
        "ordinal" integer NOT NULL DEFAULT 0,
        CONSTRAINT "educations_pkey" PRIMARY KEY ("id")
      );
    `);
    this.addSql(`CREATE INDEX "educations_profile_id_idx" ON "educations"("profile_id");`);

    // 13. Skill categories + items
    this.addSql(`
      CREATE TABLE "skill_categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
        "name" text NOT NULL,
        "ordinal" integer NOT NULL DEFAULT 0,
        CONSTRAINT "skill_categories_pkey" PRIMARY KEY ("id")
      );
    `);
    this.addSql(`CREATE INDEX "skill_categories_profile_id_idx" ON "skill_categories"("profile_id");`);

    this.addSql(`
      CREATE TABLE "skill_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "skill_category_id" uuid NOT NULL REFERENCES "skill_categories"("id") ON DELETE CASCADE,
        "name" text NOT NULL,
        "ordinal" integer NOT NULL DEFAULT 0,
        CONSTRAINT "skill_items_pkey" PRIMARY KEY ("id")
      );
    `);
    this.addSql(`CREATE INDEX "skill_items_skill_category_id_idx" ON "skill_items"("skill_category_id");`);

    // 14. Archetypes (new model)
    this.addSql(`
      CREATE TABLE "archetypes_v2" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
        "key" text NOT NULL,
        "label" text NOT NULL,
        "headline_id" uuid NOT NULL REFERENCES "headlines"("id"),
        "content_selection" jsonb NOT NULL DEFAULT '{}',
        CONSTRAINT "archetypes_v2_pkey" PRIMARY KEY ("id")
      );
    `);
    this.addSql(`CREATE INDEX "archetypes_v2_profile_id_idx" ON "archetypes_v2"("profile_id");`);

    // 15. Archetype tag weights
    this.addSql(`
      CREATE TABLE "archetype_tag_weights" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "archetype_id" uuid NOT NULL REFERENCES "archetypes_v2"("id") ON DELETE CASCADE,
        "tag_id" uuid NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
        "weight" real NOT NULL CHECK ("weight" >= 0 AND "weight" <= 1),
        CONSTRAINT "archetype_tag_weights_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "archetype_tag_weights_unique" UNIQUE ("archetype_id", "tag_id")
      );
    `);

    // 16. Job postings (new simplified model)
    this.addSql(`
      CREATE TABLE "job_postings" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "linkedin_url" text NOT NULL UNIQUE,
        "title" text NOT NULL,
        "company_name" text NOT NULL,
        "company_website" text NULL,
        "company_logo" text NULL,
        "company_industry" text NULL,
        "company_size" text NULL,
        "location" text NULL,
        "salary" text NULL,
        "description" text NOT NULL,
        "requirements" jsonb NOT NULL DEFAULT '{}',
        "archetype_matches" jsonb NOT NULL DEFAULT '[]',
        "scraped_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id")
      );
    `);
  }

  override async down(): Promise<void> {
    this.addSql('DROP TABLE IF EXISTS "archetype_tag_weights" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "archetypes_v2" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "job_postings" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "headline_tags" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "project_tags" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "bullet_variant_tags" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "bullet_variants" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "bullet_tags" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "bullets" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "experiences" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "projects" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "headlines" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "educations" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "skill_items" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "skill_categories" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "tags" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "profiles" CASCADE;');
  }
}
