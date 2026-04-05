import { Migration } from '@mikro-orm/migrations';

export class Migration_20260418000000_add_experience_company_link extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE experiences
        ADD COLUMN company_id UUID NULL REFERENCES companies(id) ON DELETE SET NULL;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE experiences DROP COLUMN company_id;
    `);
  }
}
