import { Migration } from '@mikro-orm/migrations';

export class Migration20260331000000_add_company_classification extends Migration {
  public override async up(): Promise<void> {
    this.addSql('ALTER TABLE companies ADD COLUMN business_type TEXT NULL');
    this.addSql('ALTER TABLE companies ADD COLUMN industry TEXT NULL');
    this.addSql('ALTER TABLE companies ADD COLUMN stage TEXT NULL');
  }

  public override async down(): Promise<void> {
    this.addSql('ALTER TABLE companies DROP COLUMN business_type');
    this.addSql('ALTER TABLE companies DROP COLUMN industry');
    this.addSql('ALTER TABLE companies DROP COLUMN stage');
  }
}
