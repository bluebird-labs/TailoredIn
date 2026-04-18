import { Migration } from '@mikro-orm/migrations';

export class Migration_20260416000000_add_company_description extends Migration {
  public override async up(): Promise<void> {
    this.addSql(`ALTER TABLE "companies" ADD COLUMN "description" TEXT;`);
  }

  public override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "companies" DROP COLUMN "description";`);
  }
}
