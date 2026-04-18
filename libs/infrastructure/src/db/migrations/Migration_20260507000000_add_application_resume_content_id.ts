import { Migration } from '@mikro-orm/migrations';

export class Migration_20260507000000_add_application_resume_content_id extends Migration {
  public override async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE "applications" ADD COLUMN "resume_content_id" uuid REFERENCES "resume_contents"("id") ON DELETE SET NULL;`
    );
  }

  public override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "applications" DROP COLUMN IF EXISTS "resume_content_id";`);
  }
}
