import { Migration } from '@mikro-orm/migrations';

export class Migration20260424000000_add_resume_layout_controls extends Migration {
  public override async up(): Promise<void> {
    this.addSql(
      `alter table "resume_contents" add column "hidden_education_ids" jsonb not null default '[]'::jsonb;`
    );
  }

  public override async down(): Promise<void> {
    this.addSql('alter table "resume_contents" drop column "hidden_education_ids";');
  }
}
