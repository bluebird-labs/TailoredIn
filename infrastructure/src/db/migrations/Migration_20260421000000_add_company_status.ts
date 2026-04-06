import { Migration } from '@mikro-orm/migrations';

export class Migration20260421000000_add_company_status extends Migration {
  public override async up(): Promise<void> {
    this.addSql('alter table "companies" add column "status" text null;');
  }

  public override async down(): Promise<void> {
    this.addSql('alter table "companies" drop column "status";');
  }
}
