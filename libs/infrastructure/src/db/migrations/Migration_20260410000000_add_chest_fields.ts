import { Migration } from '@mikro-orm/migrations';

export class Migration_20260410000000_add_chest_fields extends Migration {
  public override async up(): Promise<void> {
    // Bullets: verbose description + status
    this.addSql(`ALTER TABLE "bullets" ADD COLUMN "verbose_description" TEXT;`);
    this.addSql(`ALTER TABLE "bullets" ADD COLUMN "status" VARCHAR(20) NOT NULL DEFAULT 'active';`);

    // Experiences: long-form narrative
    this.addSql(`ALTER TABLE "experiences" ADD COLUMN "narrative" TEXT;`);

    // Headlines: status
    this.addSql(`ALTER TABLE "headlines" ADD COLUMN "status" VARCHAR(20) NOT NULL DEFAULT 'active';`);

    // Tailored resumes: LLM-generated bullet content
    this.addSql(`ALTER TABLE "tailored_resumes" ADD COLUMN "generated_content" JSONB;`);
  }

  public override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "bullets" DROP COLUMN "verbose_description";`);
    this.addSql(`ALTER TABLE "bullets" DROP COLUMN "status";`);
    this.addSql(`ALTER TABLE "experiences" DROP COLUMN "narrative";`);
    this.addSql(`ALTER TABLE "headlines" DROP COLUMN "status";`);
    this.addSql(`ALTER TABLE "tailored_resumes" DROP COLUMN "generated_content";`);
  }
}
