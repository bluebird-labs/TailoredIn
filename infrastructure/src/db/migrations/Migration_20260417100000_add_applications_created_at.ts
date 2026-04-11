import { Migration } from '@mikro-orm/migrations';

export class Migration_20260417100000_add_applications_created_at extends Migration {
  public override async up(): Promise<void> {
    this.addSql(`ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`);
  }

  public override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "applications" DROP COLUMN IF EXISTS "created_at";`);
  }
}
