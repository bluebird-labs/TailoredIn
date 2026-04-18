import { Migration } from '@mikro-orm/migrations';

export class Migration20260501000000_fix_enum_data extends Migration {
  public override async up(): Promise<void> {
    // companies.industry
    this.addSql(`UPDATE companies SET industry = 'software' WHERE industry = 'developer-tools';`);
    this.addSql(`UPDATE companies SET industry = 'martech' WHERE industry = 'market-research';`);
    this.addSql(`UPDATE companies SET industry = 'software' WHERE industry = 'saas';`);
    this.addSql(`UPDATE companies SET industry = 'cybersecurity' WHERE industry = 'security';`);

    // companies.stage
    this.addSql(`UPDATE companies SET stage = 'series_a' WHERE stage = 'series-a';`);
    this.addSql(`UPDATE companies SET stage = 'series_b' WHERE stage = 'series-b';`);
    this.addSql(`UPDATE companies SET stage = 'unknown' WHERE stage IN ('acquired', 'funded', 'unknown');`);

    // companies.status
    this.addSql(`UPDATE companies SET status = 'running' WHERE status = 'active';`);
    this.addSql(`UPDATE companies SET status = 'unknown' WHERE status IS NULL;`);

    // job_descriptions.level
    this.addSql(`UPDATE job_descriptions SET level = 'director' WHERE level = 'head';`);
    this.addSql(`UPDATE job_descriptions SET level = 'senior' WHERE level = 'mid_senior';`);
    this.addSql(`UPDATE job_descriptions SET level = 'unknown' WHERE level = 'other';`);

    // job_descriptions.source
    this.addSql(`UPDATE job_descriptions SET source = 'linkedin' WHERE source = 'linkedin-search';`);
    this.addSql(`UPDATE job_descriptions SET source = 'referral' WHERE source = 'recruiter';`);

    // Fill any remaining NULLs in enum columns with 'unknown'
    this.addSql(`UPDATE companies SET business_type = 'unknown' WHERE business_type IS NULL;`);
    this.addSql(`UPDATE companies SET industry = 'unknown' WHERE industry IS NULL;`);
    this.addSql(`UPDATE companies SET stage = 'unknown' WHERE stage IS NULL;`);
    this.addSql(`UPDATE job_descriptions SET level = 'unknown' WHERE level IS NULL;`);
    this.addSql(`UPDATE job_descriptions SET location_type = 'unknown' WHERE location_type IS NULL;`);
  }

  public override async down(): Promise<void> {
    // Data migration — not reversible
  }
}
