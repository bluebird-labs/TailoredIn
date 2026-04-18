import { Migration } from '@mikro-orm/migrations';

export class Migration_20260505000000_allow_zero_bullets_on_experience extends Migration {
  override async up(): Promise<void> {
    this.addSql('ALTER TABLE "experiences" DROP CONSTRAINT IF EXISTS "experiences_bullet_min_check";');
    this.addSql('ALTER TABLE "experiences" ADD CONSTRAINT "experiences_bullet_min_check" CHECK ("bullet_min" >= 0);');
  }

  override async down(): Promise<void> {
    this.addSql('ALTER TABLE "experiences" DROP CONSTRAINT IF EXISTS "experiences_bullet_min_check";');
    this.addSql('ALTER TABLE "experiences" ADD CONSTRAINT "experiences_bullet_min_check" CHECK ("bullet_min" > 0);');
  }
}
