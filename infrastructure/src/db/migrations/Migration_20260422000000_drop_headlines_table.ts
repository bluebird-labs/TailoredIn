import { Migration } from '@mikro-orm/migrations';

export class Migration20260422000000_drop_headlines_table extends Migration {
  public override async up(): Promise<void> {
    this.addSql('drop table if exists "headlines" cascade;');
  }

  public override async down(): Promise<void> {
    this.addSql(`
      create table "headlines" (
        "id" uuid not null default gen_random_uuid(),
        "profile_id" uuid not null references "profiles"("id") on delete cascade,
        "label" text not null,
        "summary_text" text not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        constraint "headlines_pkey" primary key ("id")
      );
    `);
    this.addSql('create index "headlines_profile_id_index" on "headlines" ("profile_id");');
  }
}
