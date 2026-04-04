import { Migration } from '@mikro-orm/migrations';

export class Migration_20260413000000_add_profile_about extends Migration {
  override async up(): Promise<void> {
    this.addSql('ALTER TABLE "profiles" ADD COLUMN "about" text NULL;');
  }

  override async down(): Promise<void> {
    this.addSql('ALTER TABLE "profiles" DROP COLUMN "about";');
  }
}
