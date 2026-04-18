import { Migration } from '@mikro-orm/migrations';

export class Migration_20260403000000_add_job_indexes extends Migration {
  override async up(): Promise<void> {
    this.addSql(`CREATE INDEX "jobs_status_idx" ON "jobs" ("status");`);
    this.addSql(`CREATE INDEX "jobs_company_id_idx" ON "jobs" ("company_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX "jobs_status_idx";`);
    this.addSql(`DROP INDEX "jobs_company_id_idx";`);
  }
}
