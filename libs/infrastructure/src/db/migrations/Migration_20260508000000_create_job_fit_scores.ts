import { Migration } from '@mikro-orm/migrations';

export class Migration_20260508000000_create_job_fit_scores extends Migration {
  public override async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE "job_fit_scores" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "profile_id" UUID NOT NULL REFERENCES "profiles"("id"),
        "job_description_id" UUID NOT NULL REFERENCES "job_descriptions"("id") ON DELETE CASCADE,
        "overall" INTEGER NOT NULL,
        "summary" TEXT NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    this.addSql(
      `CREATE INDEX "idx_job_fit_scores_jd_id" ON "job_fit_scores"("job_description_id");`
    );
    this.addSql(
      `CREATE UNIQUE INDEX "idx_job_fit_scores_profile_jd" ON "job_fit_scores"("profile_id", "job_description_id");`
    );

    this.addSql(`
      CREATE TABLE "job_fit_requirements" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "job_fit_score_id" UUID NOT NULL REFERENCES "job_fit_scores"("id") ON DELETE CASCADE,
        "requirement" TEXT NOT NULL,
        "coverage" TEXT NOT NULL,
        "reasoning" TEXT NOT NULL,
        "ordinal" INTEGER NOT NULL
      );
    `);
    this.addSql(
      `CREATE INDEX "idx_job_fit_requirements_score_id" ON "job_fit_requirements"("job_fit_score_id");`
    );
  }

  public override async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "job_fit_requirements";`);
    this.addSql(`DROP TABLE IF EXISTS "job_fit_scores";`);
  }
}
