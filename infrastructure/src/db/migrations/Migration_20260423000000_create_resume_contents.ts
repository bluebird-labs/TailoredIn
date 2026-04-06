import { Migration } from '@mikro-orm/migrations';

export class Migration20260423000000_create_resume_contents extends Migration {
  public override async up(): Promise<void> {
    this.addSql(`
      create table "resume_contents" (
        "id" uuid not null default gen_random_uuid(),
        "profile_id" uuid not null references "profiles"("id") on delete cascade,
        "job_description_id" uuid not null references "job_descriptions"("id") on delete cascade,
        "headline" text not null,
        "experiences" jsonb not null,
        "prompt" text not null,
        "schema" jsonb,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        constraint "resume_contents_pkey" primary key ("id")
      );
    `);
    this.addSql(
      'create index "resume_contents_jd_created" on "resume_contents" ("job_description_id", "created_at" desc);'
    );
  }

  public override async down(): Promise<void> {
    this.addSql('drop table if exists "resume_contents" cascade;');
  }
}
