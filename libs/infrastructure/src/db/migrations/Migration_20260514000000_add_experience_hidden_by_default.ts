import { Migration } from '@mikro-orm/migrations';

export class Migration_20260514000000_add_experience_hidden_by_default extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE experiences
        ADD COLUMN hidden_by_default BOOLEAN NOT NULL DEFAULT false;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE experiences DROP COLUMN hidden_by_default;
    `);
  }
}
