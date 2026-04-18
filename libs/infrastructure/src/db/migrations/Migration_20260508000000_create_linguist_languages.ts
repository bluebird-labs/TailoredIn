import { Migration } from '@mikro-orm/migrations';

// TODO: This migration must run after the Block 2 domain tables migration (skills + skill_categories).
// Adjust the timestamp ordering once Block 2 lands.

export class Migration_20260508000000_create_linguist_languages extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE "linguist_languages" (
        "linguist_name"        text NOT NULL,
        "linguist_type"        text NOT NULL,
        "color"                text,
        "aliases"              jsonb DEFAULT '[]',
        "extensions"           jsonb DEFAULT '[]',
        "interpreters"         jsonb DEFAULT '[]',
        "tm_scope"             text,
        "ace_mode"             text,
        "codemirror_mode"      text,
        "codemirror_mime_type" text,
        "linguist_language_id" integer,
        "linguist_group"       text,
        "linguist_version"     text NOT NULL,
        "created_at"           timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"           timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "linguist_languages_pkey" PRIMARY KEY ("linguist_name")
      );
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "linguist_languages";`);
  }
}
