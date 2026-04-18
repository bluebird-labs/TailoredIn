import { Migration } from '@mikro-orm/migrations';

export class Migration_20260406000000_cleanup extends Migration {
  override async up(): Promise<void> {
    // 1. Drop old v1 archetypes (name collision with rename target)
    this.addSql('DROP TABLE IF EXISTS "archetype_position_bullets" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "archetype_positions" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "archetype_education" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "archetype_skill_categories" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "archetype_skill_items" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "archetypes" CASCADE;');

    // 2. Rename archetypes_v2 → archetypes
    this.addSql('ALTER TABLE "archetypes_v2" RENAME TO "archetypes";');
    this.addSql('ALTER INDEX "archetypes_v2_pkey" RENAME TO "archetypes_pkey";');
    this.addSql('ALTER INDEX "archetypes_v2_profile_id_idx" RENAME TO "archetypes_profile_id_idx";');

    // 3. Drop old resume tables
    this.addSql('DROP TABLE IF EXISTS "resume_bullets" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "resume_positions" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "resume_company_locations" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "resume_companies" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "resume_skill_items" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "resume_skill_categories" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "resume_education" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "resume_headlines" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "users" CASCADE;');

    // 4. Drop orphaned tables (never used in new model)
    this.addSql('DROP TABLE IF EXISTS "project_tags" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "projects" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "job_postings" CASCADE;');
  }

  override async down(): Promise<void> {
    // Reverse rename
    this.addSql('ALTER TABLE "archetypes" RENAME TO "archetypes_v2";');
    this.addSql('ALTER INDEX "archetypes_pkey" RENAME TO "archetypes_v2_pkey";');
    this.addSql('ALTER INDEX "archetypes_profile_id_idx" RENAME TO "archetypes_v2_profile_id_idx";');
    // Note: dropped tables would need full recreation — not implemented
  }
}
