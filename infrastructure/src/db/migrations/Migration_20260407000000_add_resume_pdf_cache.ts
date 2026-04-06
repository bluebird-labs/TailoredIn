import { Migration } from '@mikro-orm/migrations';

export class Migration_20260407000000_add_resume_pdf_cache extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE job_descriptions
        ADD COLUMN resume_pdf BYTEA NULL,
        ADD COLUMN resume_pdf_theme TEXT NULL;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE job_descriptions
        DROP COLUMN resume_pdf,
        DROP COLUMN resume_pdf_theme;
    `);
  }
}
