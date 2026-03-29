import { Migration } from '@mikro-orm/migrations';

export class Migration20250227223351_genesis extends Migration {
  public override async up(): Promise<void> {
    this.addSql(`create extension if not exists "uuid-ossp";`);

    this.addSql(
      `create type "job_status" as enum ('new', 'unfit', 'later', 'applied', 'recruiter_screen', 'technical_screen', 'on_site', 'offer', 'rejected', 'no_news', 'expired', 'low_salary', 'retired', 'hm_screen', 'duplicate');`
    );
    this.addSql(`create table "companies"
                 (
                     "id"            uuid        not null default uuid_generate_v4(),
                     "created_at"    timestamptz not null default CURRENT_TIMESTAMP,
                     "updated_at"    timestamptz not null default CURRENT_TIMESTAMP,
                     "name"          text        not null,
                     "logo_url"      text        null,
                     "linkedin_link" text        not null,
                     "ignored"       boolean     not null default false,
                     constraint "companies_pkey" primary key ("id")
                 );`);
    this.addSql(`alter table "companies"
        add constraint "companies_linkedin_link_key" unique ("linkedin_link");`);

    this.addSql(`create table "jobs"
                 (
                     "id"               uuid         not null default uuid_generate_v4(),
                     "created_at"       timestamptz  not null default CURRENT_TIMESTAMP,
                     "updated_at"       timestamptz  not null default CURRENT_TIMESTAMP,
                     "linkedin_id"      text         not null,
                     "company_id"       uuid         not null,
                     "title"            text         not null,
                     "linkedin_link"    text         not null,
                     "type"             text         null,
                     "level"            text         null,
                     "remote"           text         null,
                     "posted_at"        timestamp(3) null,
                     "is_repost"        boolean      null,
                     "location_raw"     text         not null,
                     "salary_low"       int          null,
                     "salary_high"      int          null,
                     "salary_raw"       text         null,
                     "description"      text         not null,
                     "description_html" text         not null,
                     "applicants_count" int          null,
                     "description_fts"  tsvector generated always as (to_tsvector('english'::regconfig, description)) stored null,
                     "status"           "job_status" not null default 'new',
                     constraint "jobs_pkey" primary key ("id")
                 );`);
    this.addSql(`alter table "jobs"
        add constraint "jobs_linkedin_id_key" unique ("linkedin_id");`);
    this.addSql(`create index "description_fts_idx" on "jobs" ("description_fts");`);

    this.addSql(`create table "job_status_updates"
                 (
                     "id"         uuid         not null default uuid_generate_v4(),
                     "created_at" timestamptz  not null default CURRENT_TIMESTAMP,
                     "updated_at" timestamptz  not null default CURRENT_TIMESTAMP,
                     "job_id"     uuid         not null,
                     "status"     "job_status" not null,
                     constraint "job_status_updates_pkey" primary key ("id")
                 );`);

    this.addSql(`create table "skills"
                 (
                     "id"         uuid        not null default uuid_generate_v4(),
                     "created_at" timestamptz not null default CURRENT_TIMESTAMP,
                     "updated_at" timestamptz not null default CURRENT_TIMESTAMP,
                     "name"       text        not null,
                     constraint "skills_pkey" primary key ("id")
                 );`);
    this.addSql(`alter table "skills"
        add constraint "skills_name_key" unique ("name");`);

    this.addSql(`alter table "jobs"
        add constraint "job_company_id_fkey" foreign key ("company_id") references "companies" ("id") on update cascade;`);

    this.addSql(`alter table "job_status_updates"
        add constraint "job_status_update_job_id_fkey" foreign key ("job_id") references "jobs" ("id") on update cascade;`);
  }
}
