import { Migration } from '@mikro-orm/migrations';

export class Migration_20260506000000_add_application_reasons extends Migration {
  public override async up(): Promise<void> {
    this.addSql(`ALTER TABLE "applications" ADD COLUMN "archive_reason" text;`);
    this.addSql(`ALTER TABLE "applications" ADD COLUMN "withdraw_reason" text;`);
  }

  public override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "applications" DROP COLUMN IF EXISTS "archive_reason";`);
    this.addSql(`ALTER TABLE "applications" DROP COLUMN IF EXISTS "withdraw_reason";`);
  }
}
