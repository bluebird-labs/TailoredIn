import { Migration } from '@mikro-orm/migrations';

/**
 * Adds a required, unique `domain_name` column to `companies`.
 *
 * Existing companies get their domain_name extracted from their website URL.
 * Companies without a website are deleted along with all associated data
 * (applications, job descriptions, resume contents, company briefs).
 *
 * ⚠️ DESTRUCTIVE — deleted rows cannot be restored by the down() migration.
 */
export class Migration_20260501000000_add_company_domain_name extends Migration {
  public override async up(): Promise<void> {
    // 1. Delete applications for companies without a website (FK is RESTRICT)
    this.addSql(`
      DELETE FROM "applications"
      WHERE "company_id" IN (SELECT "id" FROM "companies" WHERE "website" IS NULL);
    `);

    // 2. Delete job descriptions for companies without a website (FK is RESTRICT)
    //    This cascades to resume_contents via ON DELETE CASCADE
    this.addSql(`
      DELETE FROM "job_descriptions"
      WHERE "company_id" IN (SELECT "id" FROM "companies" WHERE "website" IS NULL);
    `);

    // 3. Delete companies without a website
    //    company_briefs cascade automatically (ON DELETE CASCADE)
    //    experiences.company_id gets nullified (ON DELETE SET NULL)
    this.addSql(`
      DELETE FROM "companies" WHERE "website" IS NULL;
    `);

    // 4. Add domain_name column (nullable initially for backfill)
    this.addSql(`
      ALTER TABLE "companies" ADD COLUMN "domain_name" TEXT;
    `);

    // 5. Backfill domain_name from website URL
    //    Strips protocol, www. prefix, and everything after the host (port, path, query, fragment)
    this.addSql(`
      UPDATE "companies"
      SET "domain_name" = regexp_replace(
        regexp_replace("website", '^https?://(www\.)?', ''),
        '[:/\?#].*$', ''
      );
    `);

    // 6. Add NOT NULL constraint
    this.addSql(`
      ALTER TABLE "companies" ALTER COLUMN "domain_name" SET NOT NULL;
    `);

    // 7. Add unique index
    this.addSql(`
      CREATE UNIQUE INDEX "companies_domain_name_key" ON "companies" ("domain_name");
    `);
  }

  public override async down(): Promise<void> {
    this.addSql('DROP INDEX IF EXISTS "companies_domain_name_key";');
    this.addSql('ALTER TABLE "companies" DROP COLUMN "domain_name";');
  }
}
