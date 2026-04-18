import { Migration } from '@mikro-orm/migrations';

export class Migration_20260417000000_create_applications_and_job_descriptions extends Migration {
  public override async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE "job_descriptions" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "company_id" UUID NOT NULL REFERENCES "companies"("id"),
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "url" TEXT,
        "location" TEXT,
        "salary_min" INTEGER,
        "salary_max" INTEGER,
        "salary_currency" TEXT,
        "level" TEXT,
        "location_type" TEXT,
        "source" TEXT NOT NULL,
        "posted_at" TIMESTAMP(3),
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    this.addSql(`CREATE INDEX "idx_job_descriptions_company_id" ON "job_descriptions"("company_id");`);

    this.addSql(`
      CREATE TABLE "applications" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "profile_id" UUID NOT NULL REFERENCES "profiles"("id"),
        "company_id" UUID NOT NULL REFERENCES "companies"("id"),
        "job_description_id" UUID REFERENCES "job_descriptions"("id") ON DELETE SET NULL,
        "status" TEXT NOT NULL DEFAULT 'draft',
        "notes" TEXT,
        "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    this.addSql(`CREATE INDEX "idx_applications_profile_id" ON "applications"("profile_id");`);
    this.addSql(`CREATE INDEX "idx_applications_company_id" ON "applications"("company_id");`);
    this.addSql(`CREATE INDEX "idx_applications_status" ON "applications"("status");`);
  }

  public override async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "applications";`);
    this.addSql(`DROP TABLE IF EXISTS "job_descriptions";`);
  }
}
