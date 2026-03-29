import { Migration } from '@mikro-orm/migrations';

export class Migration20250303150253_enhanced_skills extends Migration {
  public override async up(): Promise<void> {
    this.addSql(`create type "skill_affinity" as enum ('expert', 'interest', 'avoid');`);
    this.addSql(`alter table "skills" drop constraint "skills_name_key";`);

    // noinspection SqlWithoutWhere
    this.addSql(`delete
                 from "skills";`);
    this.addSql(`alter table "skills"
        add column "key"      text             not null,
        add column "affinity" "skill_affinity" not null default 'expert',
        add column "variants" text[]           not null;`);
    this.addSql(`alter table "skills"
        add constraint "skills_key_unique" unique ("key");`);
  }

  public override async down(): Promise<void> {
    this.addSql(`alter table "skills"
        drop constraint "skills_key_unique";`);
    this.addSql(`alter table "skills"
        drop column "key",
        drop column "affinity",
        drop column "variants";`);

    this.addSql(`alter table "skills"
        add constraint "skills_name_key" unique ("name");`);

    this.addSql(`drop type "skill_affinity";`);
  }
}
