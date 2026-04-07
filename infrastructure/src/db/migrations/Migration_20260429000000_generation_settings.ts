import { Migration } from '@mikro-orm/migrations';

export class Migration20260429000000_generation_settings extends Migration {
  public override async up(): Promise<void> {
    this.addSql(`
      create table "generation_settings" (
        "id" uuid not null default gen_random_uuid(),
        "profile_id" uuid not null references "profiles"("id") on delete cascade,
        "model_tier" text not null default 'balanced',
        "bullet_min" int not null default 2,
        "bullet_max" int not null default 5,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        constraint "generation_settings_pkey" primary key ("id"),
        constraint "generation_settings_profile_id_unique" unique ("profile_id")
      );
    `);

    this.addSql(`
      create table "generation_prompts" (
        "id" uuid not null default gen_random_uuid(),
        "generation_settings_id" uuid not null references "generation_settings"("id") on delete cascade,
        "scope" text not null check ("scope" in ('resume', 'headline', 'experience')),
        "content" text not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        constraint "generation_prompts_pkey" primary key ("id"),
        constraint "generation_prompts_settings_scope_unique" unique ("generation_settings_id", "scope")
      );
    `);

    this.addSql(`
      create table "experience_generation_overrides" (
        "id" uuid not null default gen_random_uuid(),
        "experience_id" uuid not null references "experiences"("id") on delete cascade,
        "bullet_min" int not null,
        "bullet_max" int not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        constraint "experience_generation_overrides_pkey" primary key ("id"),
        constraint "experience_generation_overrides_experience_id_unique" unique ("experience_id")
      );
    `);

    // Seed generation_settings for all existing profiles
    this.addSql(`
      insert into "generation_settings" ("profile_id")
      select "id" from "profiles"
      where "id" not in (select "profile_id" from "generation_settings");
    `);
  }

  public override async down(): Promise<void> {
    this.addSql('drop table if exists "experience_generation_overrides" cascade;');
    this.addSql('drop table if exists "generation_prompts" cascade;');
    this.addSql('drop table if exists "generation_settings" cascade;');
  }
}
