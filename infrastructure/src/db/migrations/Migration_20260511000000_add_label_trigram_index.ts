import { Migration } from '@mikro-orm/migrations';

export class Migration_20260511000000_add_label_trigram_index extends Migration {
  public override async up(): Promise<void> {
    this.addSql(`CREATE INDEX "skills_label_trgm_idx" ON "skills" USING GIN (label gin_trgm_ops);`);
  }

  public override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "skills_label_trgm_idx";`);
  }
}
