import { Migration } from '@mikro-orm/migrations';

export class Migration_20260407000000_archetype_headline_text extends Migration {
  override async up(): Promise<void> {
    // Add headline_text column with empty default
    this.addSql(`ALTER TABLE "archetypes" ADD COLUMN "headline_text" text NOT NULL DEFAULT ''`);

    // Populate from linked headlines
    this.addSql(`
      UPDATE "archetypes" a
      SET "headline_text" = h."summary_text"
      FROM "headlines" h
      WHERE a."headline_id" = h."id"
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "archetypes" DROP COLUMN "headline_text"`);
  }
}
