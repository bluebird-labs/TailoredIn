import { Migration } from '@mikro-orm/migrations';

export class Migration20260425000000_add_sought_expertise extends Migration {
  public override async up(): Promise<void> {
    this.addSql('alter table "job_descriptions" add column "sought_hard_skills" jsonb default null;');
    this.addSql('alter table "job_descriptions" add column "sought_soft_skills" jsonb default null;');
  }

  public override async down(): Promise<void> {
    this.addSql('alter table "job_descriptions" drop column "sought_hard_skills";');
    this.addSql('alter table "job_descriptions" drop column "sought_soft_skills";');
  }
}
