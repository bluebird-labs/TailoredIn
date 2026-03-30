import { Migration } from '@mikro-orm/migrations';

export class Migration20260330000000_drop_scoring_functions extends Migration {
  public override async up(): Promise<void> {
    this.addSql('DROP FUNCTION IF EXISTS match_job_skills CASCADE');
    this.addSql('DROP FUNCTION IF EXISTS score_job_skills CASCADE');
    this.addSql('DROP FUNCTION IF EXISTS score_job_salary CASCADE');
  }

  public override async down(): Promise<void> {
    // Functions were previously created manually and are now inlined as CTEs
    // in JobScoringQueries.ts. No restore needed.
  }
}
