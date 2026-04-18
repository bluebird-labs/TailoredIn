import { Migration } from '@mikro-orm/migrations';

export class Migration20260329000000_resume_data extends Migration {
  public override async up(): Promise<void> {
    // 1. users
    this.addSql(`create table "users"
                 (
                     "id"               uuid        not null default uuid_generate_v4(),
                     "created_at"       timestamptz not null default CURRENT_TIMESTAMP,
                     "updated_at"       timestamptz not null default CURRENT_TIMESTAMP,
                     "email"            text        not null,
                     "first_name"       text        not null,
                     "last_name"        text        not null,
                     "phone_number"     text        null,
                     "github_handle"    text        null,
                     "linkedin_handle"  text        null,
                     "location_label"   text        null,
                     constraint "users_pkey" primary key ("id"),
                     constraint "users_email_key" unique ("email")
                 );`);

    // 2. resume_companies
    this.addSql(`create table "resume_companies"
                 (
                     "id"               uuid        not null default uuid_generate_v4(),
                     "created_at"       timestamptz not null default CURRENT_TIMESTAMP,
                     "updated_at"       timestamptz not null default CURRENT_TIMESTAMP,
                     "user_id"          uuid        not null,
                     "company_name"     text        not null,
                     "company_mention"  text        null,
                     "website_url"      text        null,
                     "business_domain"  text        not null,
                     "joined_at"        text        not null,
                     "left_at"          text        not null,
                     "promoted_at"      text        null,
                     constraint "resume_companies_pkey" primary key ("id"),
                     constraint "resume_companies_user_id_fkey"
                         foreign key ("user_id") references "users" ("id")
                         on update cascade on delete cascade
                 );`);
    this.addSql(`create index "resume_companies_user_id_idx" on "resume_companies" ("user_id");`);

    // 3. resume_company_locations
    this.addSql(`create table "resume_company_locations"
                 (
                     "id"                 uuid        not null default uuid_generate_v4(),
                     "created_at"         timestamptz not null default CURRENT_TIMESTAMP,
                     "updated_at"         timestamptz not null default CURRENT_TIMESTAMP,
                     "resume_company_id"  uuid        not null,
                     "location_label"     text        not null,
                     "ordinal"            int         not null default 0,
                     constraint "resume_company_locations_pkey" primary key ("id"),
                     constraint "resume_company_locations_company_fkey"
                         foreign key ("resume_company_id") references "resume_companies" ("id")
                         on update cascade on delete cascade
                 );`);
    this.addSql(`create index "resume_company_locations_resume_company_id_idx" on "resume_company_locations" ("resume_company_id");`);

    // 4. resume_bullets
    this.addSql(`create table "resume_bullets"
                 (
                     "id"                uuid        not null default uuid_generate_v4(),
                     "created_at"        timestamptz not null default CURRENT_TIMESTAMP,
                     "updated_at"        timestamptz not null default CURRENT_TIMESTAMP,
                     "resume_company_id" uuid        not null,
                     "content"           text        not null,
                     "ordinal"           int         not null default 0,
                     constraint "resume_bullets_pkey" primary key ("id"),
                     constraint "resume_bullets_company_fkey"
                         foreign key ("resume_company_id") references "resume_companies" ("id")
                         on update cascade on delete cascade
                 );`);
    this.addSql(`create index "resume_bullets_resume_company_id_idx" on "resume_bullets" ("resume_company_id");`);

    // 5. resume_education
    this.addSql(`create table "resume_education"
                 (
                     "id"               uuid        not null default uuid_generate_v4(),
                     "created_at"       timestamptz not null default CURRENT_TIMESTAMP,
                     "updated_at"       timestamptz not null default CURRENT_TIMESTAMP,
                     "user_id"          uuid        not null,
                     "degree_title"     text        not null,
                     "institution_name" text        not null,
                     "graduation_year"  text        not null,
                     "location_label"   text        not null,
                     "ordinal"          int         not null default 0,
                     constraint "resume_education_pkey" primary key ("id"),
                     constraint "resume_education_user_id_fkey"
                         foreign key ("user_id") references "users" ("id")
                         on update cascade on delete cascade
                 );`);
    this.addSql(`create index "resume_education_user_id_idx" on "resume_education" ("user_id");`);

    // 6. resume_skill_categories
    this.addSql(`create table "resume_skill_categories"
                 (
                     "id"             uuid        not null default uuid_generate_v4(),
                     "created_at"     timestamptz not null default CURRENT_TIMESTAMP,
                     "updated_at"     timestamptz not null default CURRENT_TIMESTAMP,
                     "user_id"        uuid        not null,
                     "category_name"  text        not null,
                     "ordinal"        int         not null default 0,
                     constraint "resume_skill_categories_pkey" primary key ("id"),
                     constraint "resume_skill_categories_user_id_fkey"
                         foreign key ("user_id") references "users" ("id")
                         on update cascade on delete cascade,
                     constraint "resume_skill_categories_user_id_category_name_key"
                         unique ("user_id", "category_name")
                 );`);
    this.addSql(`create index "resume_skill_categories_user_id_idx" on "resume_skill_categories" ("user_id");`);

    // 7. resume_skill_items
    this.addSql(`create table "resume_skill_items"
                 (
                     "id"           uuid        not null default uuid_generate_v4(),
                     "created_at"   timestamptz not null default CURRENT_TIMESTAMP,
                     "updated_at"   timestamptz not null default CURRENT_TIMESTAMP,
                     "category_id"  uuid        not null,
                     "skill_name"   text        not null,
                     "ordinal"      int         not null default 0,
                     constraint "resume_skill_items_pkey" primary key ("id"),
                     constraint "resume_skill_items_category_fkey"
                         foreign key ("category_id") references "resume_skill_categories" ("id")
                         on update cascade on delete cascade
                 );`);
    this.addSql(`create index "resume_skill_items_category_id_idx" on "resume_skill_items" ("category_id");`);

    // 8. resume_headlines
    this.addSql(`create table "resume_headlines"
                 (
                     "id"              uuid        not null default uuid_generate_v4(),
                     "created_at"      timestamptz not null default CURRENT_TIMESTAMP,
                     "updated_at"      timestamptz not null default CURRENT_TIMESTAMP,
                     "user_id"         uuid        not null,
                     "headline_label"  text        not null,
                     "summary_text"    text        not null,
                     constraint "resume_headlines_pkey" primary key ("id"),
                     constraint "resume_headlines_user_id_fkey"
                         foreign key ("user_id") references "users" ("id")
                         on update cascade on delete cascade
                 );`);
    this.addSql(`create index "resume_headlines_user_id_idx" on "resume_headlines" ("user_id");`);

    // 9. archetypes
    this.addSql(`create table "archetypes"
                 (
                     "id"                     uuid        not null default uuid_generate_v4(),
                     "created_at"             timestamptz not null default CURRENT_TIMESTAMP,
                     "updated_at"             timestamptz not null default CURRENT_TIMESTAMP,
                     "user_id"                uuid        not null,
                     "archetype_key"          text        not null,
                     "archetype_label"        text        not null,
                     "archetype_description"  text        null,
                     "headline_id"            uuid        not null,
                     "social_networks"        text[]      not null default '{}',
                     constraint "archetypes_pkey" primary key ("id"),
                     constraint "archetypes_user_id_archetype_key_key"
                         unique ("user_id", "archetype_key"),
                     constraint "archetypes_user_id_fkey"
                         foreign key ("user_id") references "users" ("id")
                         on update cascade on delete cascade,
                     constraint "archetypes_headline_id_fkey"
                         foreign key ("headline_id") references "resume_headlines" ("id")
                         on update cascade
                 );`);
    this.addSql(`create index "archetypes_user_id_idx" on "archetypes" ("user_id");`);

    // 10. archetype_education
    this.addSql(`create table "archetype_education"
                 (
                     "id"            uuid        not null default uuid_generate_v4(),
                     "created_at"    timestamptz not null default CURRENT_TIMESTAMP,
                     "updated_at"    timestamptz not null default CURRENT_TIMESTAMP,
                     "archetype_id"  uuid        not null,
                     "education_id"  uuid        not null,
                     "ordinal"       int         not null default 0,
                     constraint "archetype_education_pkey" primary key ("id"),
                     constraint "archetype_education_archetype_id_education_id_key"
                         unique ("archetype_id", "education_id"),
                     constraint "archetype_education_archetype_fkey"
                         foreign key ("archetype_id") references "archetypes" ("id")
                         on update cascade on delete cascade,
                     constraint "archetype_education_education_fkey"
                         foreign key ("education_id") references "resume_education" ("id")
                         on update cascade on delete cascade
                 );`);

    // 11. archetype_skill_categories
    this.addSql(`create table "archetype_skill_categories"
                 (
                     "id"            uuid        not null default uuid_generate_v4(),
                     "created_at"    timestamptz not null default CURRENT_TIMESTAMP,
                     "updated_at"    timestamptz not null default CURRENT_TIMESTAMP,
                     "archetype_id"  uuid        not null,
                     "category_id"   uuid        not null,
                     "ordinal"       int         not null default 0,
                     constraint "archetype_skill_categories_pkey" primary key ("id"),
                     constraint "archetype_skill_categories_archetype_id_category_id_key"
                         unique ("archetype_id", "category_id"),
                     constraint "archetype_skill_categories_archetype_fkey"
                         foreign key ("archetype_id") references "archetypes" ("id")
                         on update cascade on delete cascade,
                     constraint "archetype_skill_categories_category_fkey"
                         foreign key ("category_id") references "resume_skill_categories" ("id")
                         on update cascade on delete cascade
                 );`);

    // 12. archetype_skill_items
    this.addSql(`create table "archetype_skill_items"
                 (
                     "id"            uuid        not null default uuid_generate_v4(),
                     "created_at"    timestamptz not null default CURRENT_TIMESTAMP,
                     "updated_at"    timestamptz not null default CURRENT_TIMESTAMP,
                     "archetype_id"  uuid        not null,
                     "item_id"       uuid        not null,
                     "ordinal"       int         not null default 0,
                     constraint "archetype_skill_items_pkey" primary key ("id"),
                     constraint "archetype_skill_items_archetype_id_item_id_key"
                         unique ("archetype_id", "item_id"),
                     constraint "archetype_skill_items_archetype_fkey"
                         foreign key ("archetype_id") references "archetypes" ("id")
                         on update cascade on delete cascade,
                     constraint "archetype_skill_items_item_fkey"
                         foreign key ("item_id") references "resume_skill_items" ("id")
                         on update cascade on delete cascade
                 );`);

    // 13. archetype_positions
    this.addSql(`create table "archetype_positions"
                 (
                     "id"                    uuid        not null default uuid_generate_v4(),
                     "created_at"            timestamptz not null default CURRENT_TIMESTAMP,
                     "updated_at"            timestamptz not null default CURRENT_TIMESTAMP,
                     "archetype_id"          uuid        not null,
                     "resume_company_id"     uuid        not null,
                     "job_title"             text        not null,
                     "display_company_name"  text        not null,
                     "location_label"        text        not null,
                     "start_date"            text        not null,
                     "end_date"              text        not null,
                     "role_summary"          text        not null,
                     "ordinal"               int         not null default 0,
                     constraint "archetype_positions_pkey" primary key ("id"),
                     constraint "archetype_positions_archetype_fkey"
                         foreign key ("archetype_id") references "archetypes" ("id")
                         on update cascade on delete cascade,
                     constraint "archetype_positions_company_fkey"
                         foreign key ("resume_company_id") references "resume_companies" ("id")
                         on update cascade on delete cascade
                 );`);
    this.addSql(`create index "archetype_positions_archetype_id_idx" on "archetype_positions" ("archetype_id");`);
    this.addSql(`create index "archetype_positions_resume_company_id_idx" on "archetype_positions" ("resume_company_id");`);

    // 14. archetype_position_bullets
    this.addSql(`create table "archetype_position_bullets"
                 (
                     "id"           uuid        not null default uuid_generate_v4(),
                     "created_at"   timestamptz not null default CURRENT_TIMESTAMP,
                     "updated_at"   timestamptz not null default CURRENT_TIMESTAMP,
                     "position_id"  uuid        not null,
                     "bullet_id"    uuid        not null,
                     "ordinal"      int         not null default 0,
                     constraint "archetype_position_bullets_pkey" primary key ("id"),
                     constraint "archetype_position_bullets_position_id_bullet_id_key"
                         unique ("position_id", "bullet_id"),
                     constraint "archetype_position_bullets_position_fkey"
                         foreign key ("position_id") references "archetype_positions" ("id")
                         on update cascade on delete cascade,
                     constraint "archetype_position_bullets_bullet_fkey"
                         foreign key ("bullet_id") references "resume_bullets" ("id")
                         on update cascade on delete cascade
                 );`);
    this.addSql(`create index "archetype_position_bullets_position_id_idx" on "archetype_position_bullets" ("position_id");`);
  }

  public override async down(): Promise<void> {
    this.addSql(`drop table if exists "archetype_position_bullets" cascade;`);
    this.addSql(`drop table if exists "archetype_positions" cascade;`);
    this.addSql(`drop table if exists "archetype_skill_items" cascade;`);
    this.addSql(`drop table if exists "archetype_skill_categories" cascade;`);
    this.addSql(`drop table if exists "archetype_education" cascade;`);
    this.addSql(`drop table if exists "archetypes" cascade;`);
    this.addSql(`drop table if exists "resume_headlines" cascade;`);
    this.addSql(`drop table if exists "resume_skill_items" cascade;`);
    this.addSql(`drop table if exists "resume_skill_categories" cascade;`);
    this.addSql(`drop table if exists "resume_education" cascade;`);
    this.addSql(`drop table if exists "resume_bullets" cascade;`);
    this.addSql(`drop table if exists "resume_company_locations" cascade;`);
    this.addSql(`drop table if exists "resume_companies" cascade;`);
    this.addSql(`drop table if exists "users" cascade;`);
  }
}
