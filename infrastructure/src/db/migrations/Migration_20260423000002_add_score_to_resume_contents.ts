import { Migration } from '@mikro-orm/migrations';

export class Migration_20260423000002_add_score_to_resume_contents extends Migration {
  public override async up(): Promise<void> {
    this.addSql(`ALTER TABLE "resume_contents" ADD COLUMN "score" jsonb;`);
  }

  public override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "resume_contents" DROP COLUMN IF EXISTS "score";`);
  }
}
