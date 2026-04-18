import { Migration } from '@mikro-orm/migrations';

/**
 * Purge migration — drops all tables and columns for removed subsystems:
 * jobs, skills, tags, resume generation, company briefs.
 *
 * Also cleans up columns on kept tables:
 * - accomplishments: drop skill_tags
 * - companies: drop ignored, make linkedin_link nullable
 * - headline_tags join table: drop entirely (tags subsystem removed)
 */
export class Migration_20260412000000_purge_job_skill_tag_resume extends Migration {
  override async up(): Promise<void> {
    // ── 1. Drop join tables first (FK dependencies) ──────────────────────
    this.addSql('DROP TABLE IF EXISTS "headline_tags" CASCADE;');

    // ── 2. Drop job subsystem ────────────────────────────────────────────
    this.addSql('DROP TABLE IF EXISTS "job_status_updates" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "jobs" CASCADE;');
    this.addSql('DROP TYPE IF EXISTS "job_status" CASCADE;');

    // ── 3. Drop skill subsystem ──────────────────────────────────────────
    this.addSql('DROP TABLE IF EXISTS "skill_items" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "skill_categories" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "skills" CASCADE;');
    this.addSql('DROP TYPE IF EXISTS "skill_affinity" CASCADE;');

    // ── 4. Drop tag subsystem ────────────────────────────────────────────
    this.addSql('DROP TABLE IF EXISTS "tags" CASCADE;');

    // ── 5. Drop resume generation subsystem ──────────────────────────────
    this.addSql('DROP TABLE IF EXISTS "tailored_resumes" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "resume_profiles" CASCADE;');

    // ── 6. Drop company briefs ───────────────────────────────────────────
    this.addSql('DROP TABLE IF EXISTS "company_briefs" CASCADE;');

    // ── 7. Clean up kept tables ──────────────────────────────────────────

    // accomplishments: drop skill_tags JSONB column
    this.addSql('ALTER TABLE "accomplishments" DROP COLUMN IF EXISTS "skill_tags";');

    // companies: drop ignored flag, make linkedin_link nullable
    this.addSql('ALTER TABLE "companies" DROP COLUMN IF EXISTS "ignored";');
    this.addSql('ALTER TABLE "companies" ALTER COLUMN "linkedin_link" DROP NOT NULL;');

    // Keep the unique constraint — Postgres allows multiple NULLs with UNIQUE
    // No change needed: companies_linkedin_link_key remains intact
  }

  override async down(): Promise<void> {
    // Reverse column changes on kept tables
    this.addSql('ALTER TABLE "accomplishments" ADD COLUMN "skill_tags" jsonb NOT NULL DEFAULT \'[]\';');
    this.addSql('ALTER TABLE "companies" ADD COLUMN "ignored" boolean NOT NULL DEFAULT false;');
    this.addSql('ALTER TABLE "companies" ALTER COLUMN "linkedin_link" SET NOT NULL;');

    // Note: dropped tables and types would need full recreation — not implemented.
    // Use a database backup to restore if needed.
  }
}
