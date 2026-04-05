import { Migration } from '@mikro-orm/migrations';

export class Migration_20260419000000_add_raw_text_to_job_descriptions extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE job_descriptions
        ADD COLUMN raw_text TEXT NULL;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE job_descriptions DROP COLUMN raw_text;
    `);
  }
}
