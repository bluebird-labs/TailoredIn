import { Migration } from '@mikro-orm/migrations';

export class Migration_20260330100000_resume_company_job_title extends Migration {
  override async up(): Promise<void> {
    this.addSql(`ALTER TABLE "resume_companies" ADD COLUMN "job_title" text NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "resume_companies" DROP COLUMN "job_title";`);
  }
}
