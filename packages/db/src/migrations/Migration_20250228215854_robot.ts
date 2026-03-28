import { Migration } from '@mikro-orm/migrations';

export class Migration20250228215854_robot extends Migration {
  public override async up(): Promise<void> {
    this.addSql(`alter table "companies"
        add column "website" text null default null;`);

    this.addSql(`alter table "jobs"
        add column "apply_link" text null default null;`);
  }

  public override async down(): Promise<void> {
    this.addSql(`alter table "companies"
        drop column "website";`);

    this.addSql(`alter table "jobs"
        drop column "apply_link";`);
  }
}
