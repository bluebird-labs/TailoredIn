import { Migration } from '@mikro-orm/migrations';

export class Migration_20260426000000_add_experience_company_accent extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE experiences
        ADD COLUMN company_accent TEXT NULL;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE experiences DROP COLUMN company_accent;
    `);
  }
}
