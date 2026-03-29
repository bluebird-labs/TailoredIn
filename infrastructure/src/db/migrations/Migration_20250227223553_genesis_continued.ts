import { Migration } from '@mikro-orm/migrations';

export class Migration20250227223553_genesis_continued extends Migration {
  public override async up(): Promise<void> {
    this.addSql(`alter table "jobs"
        drop constraint "job_company_id_fkey";`);

    this.addSql(`alter table "job_status_updates"
        drop constraint "job_status_update_job_id_fkey";`);

    this.addSql(`alter table "companies"
        alter column "id" drop default;`);
    this.addSql(`alter table "companies"
        alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "companies"
        alter column "id" set default uuid_generate_v4();`);
    this.addSql(`alter table "companies"
        alter column "created_at" type timestamptz using ("created_at"::timestamptz);`);
    this.addSql(`alter table "companies"
        alter column "updated_at" type timestamptz using ("updated_at"::timestamptz);`);

    this.addSql(`alter table "jobs"
        alter column "id" drop default;`);
    this.addSql(`alter table "jobs"
        alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "jobs"
        alter column "id" set default uuid_generate_v4();`);
    this.addSql(`alter table "jobs"
        alter column "created_at" type timestamptz using ("created_at"::timestamptz);`);
    this.addSql(`alter table "jobs"
        alter column "updated_at" type timestamptz using ("updated_at"::timestamptz);`);
    this.addSql(`alter table "jobs"
        add constraint "jobs_company_id_foreign" foreign key ("company_id") references "companies" ("id") on update cascade;`);

    this.addSql(`alter table "job_status_updates"
        alter column "id" drop default;`);
    this.addSql(`alter table "job_status_updates"
        alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "job_status_updates"
        alter column "id" set default uuid_generate_v4();`);
    this.addSql(`alter table "job_status_updates"
        alter column "created_at" type timestamptz using ("created_at"::timestamptz);`);
    this.addSql(`alter table "job_status_updates"
        add constraint "job_status_updates_job_id_foreign" foreign key ("job_id") references "jobs" ("id") on update cascade;`);

    this.addSql(`alter table "skills"
        alter column "id" drop default;`);
    this.addSql(`alter table "skills"
        alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "skills"
        alter column "id" set default uuid_generate_v4();`);
  }

  public override async down(): Promise<void> {
    this.addSql(`alter table "job_status_updates"
        drop constraint "job_status_updates_job_id_foreign";`);

    this.addSql(`alter table "jobs"
        drop constraint "jobs_company_id_foreign";`);

    this.addSql(`alter table "companies"
        alter column "id" drop default;`);
    this.addSql(`alter table "companies"
        alter column "id" drop default;`);
    this.addSql(`alter table "companies"
        alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "companies"
        alter column "created_at" type timestamp(3) using ("created_at"::timestamp(3));`);
    this.addSql(`alter table "companies"
        alter column "updated_at" type timestamp(3) using ("updated_at"::timestamp(3));`);

    this.addSql(`alter table "job_status_updates"
        drop column "updated_at";`);

    this.addSql(`alter table "job_status_updates"
        alter column "id" drop default;`);
    this.addSql(`alter table "job_status_updates"
        alter column "id" drop default;`);
    this.addSql(`alter table "job_status_updates"
        alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "job_status_updates"
        alter column "created_at" type timestamp(3) using ("created_at"::timestamp(3));`);
    this.addSql(`alter table "job_status_updates"
        add constraint "job_status_update_job_id_fkey" foreign key ("job_id") references "jobs" ("id") on update cascade on delete restrict;`);

    this.addSql(`alter table "jobs"
        drop column "applicants_count";`);

    this.addSql(`alter table "jobs"
        alter column "id" drop default;`);
    this.addSql(`alter table "jobs"
        alter column "id" drop default;`);
    this.addSql(`alter table "jobs"
        alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "jobs"
        alter column "created_at" type timestamp(3) using ("created_at"::timestamp(3));`);
    this.addSql(`alter table "jobs"
        alter column "updated_at" type timestamp(3) using ("updated_at"::timestamp(3));`);
    this.addSql(`alter table "jobs"
        add constraint "job_company_id_fkey" foreign key ("company_id") references "companies" ("id") on update cascade on delete restrict;`);

    this.addSql(`alter table "skills"
        drop column "created_at",
        drop column "updated_at";`);

    this.addSql(`alter table "skills"
        alter column "id" drop default;`);
    this.addSql(`alter table "skills"
        alter column "id" drop default;`);
    this.addSql(`alter table "skills"
        alter column "id" type uuid using ("id"::text::uuid);`);
  }
}
