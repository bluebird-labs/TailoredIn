import { Migration } from '@mikro-orm/migrations';

export class Migration20260423000001_drop_resume_output_from_jd extends Migration {
  public override async up(): Promise<void> {
    this.addSql('alter table "job_descriptions" drop column if exists "resume_output";');
  }

  public override async down(): Promise<void> {
    this.addSql('alter table "job_descriptions" add column "resume_output" jsonb;');
  }
}
