import { Migration } from '@mikro-orm/migrations';

export class Migration_20260427000000_add_education_hidden_by_default extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE educations
        ADD COLUMN hidden_by_default BOOLEAN NOT NULL DEFAULT false;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE educations DROP COLUMN hidden_by_default;
    `);
  }
}
