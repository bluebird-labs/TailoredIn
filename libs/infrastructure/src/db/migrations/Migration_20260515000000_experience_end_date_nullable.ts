import { Migration } from '@mikro-orm/migrations';

export class Migration_20260515000000_experience_end_date_nullable extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE experiences ALTER COLUMN end_date DROP NOT NULL;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`
      UPDATE experiences SET end_date = to_char(now(), 'YYYY-MM') WHERE end_date IS NULL;
      ALTER TABLE experiences ALTER COLUMN end_date SET NOT NULL;
    `);
  }
}
