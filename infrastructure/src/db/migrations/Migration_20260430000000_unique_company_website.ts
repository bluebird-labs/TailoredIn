import { Migration } from '@mikro-orm/migrations';

export class Migration20260430000000_unique_company_website extends Migration {
  public override async up(): Promise<void> {
    this.addSql('create unique index "companies_website_key" on "companies" ("website");');
  }

  public override async down(): Promise<void> {
    this.addSql('drop index "companies_website_key";');
  }
}
