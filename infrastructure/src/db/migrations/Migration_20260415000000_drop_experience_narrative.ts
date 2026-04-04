import { Migration } from '@mikro-orm/migrations';

export class Migration_20260415000000_drop_experience_narrative extends Migration {
  public override async up(): Promise<void> {
    this.addSql(`ALTER TABLE "experiences" DROP COLUMN "narrative";`);
  }

  public override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "experiences" ADD COLUMN "narrative" TEXT;`);
  }
}
