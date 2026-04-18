import { Migration } from '@mikro-orm/migrations';

export class Migration_20260405000000_nullable_archetype_headline extends Migration {
  override async up(): Promise<void> {
    this.addSql('ALTER TABLE "archetypes_v2" ALTER COLUMN "headline_id" DROP NOT NULL;');
  }

  override async down(): Promise<void> {
    this.addSql('ALTER TABLE "archetypes_v2" ALTER COLUMN "headline_id" SET NOT NULL;');
  }
}
