import { Migration } from '@mikro-orm/migrations';

export class Migration_20260420000000_add_resume_output_to_job_descriptions extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE job_descriptions
        ADD COLUMN resume_output JSONB NULL;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE job_descriptions DROP COLUMN resume_output;
    `);
  }
}
