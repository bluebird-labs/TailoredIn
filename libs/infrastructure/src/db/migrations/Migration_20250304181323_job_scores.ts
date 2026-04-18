import { Migration } from '@mikro-orm/migrations';

export class Migration20250304181323_job_scores extends Migration {
  public override async up(): Promise<void> {
    // Previously created score_job_skills, score_job_salary, and match_job_skills functions.
    // These are now inlined as CTEs in JobScoringQueries.ts (Kysely).
    // No-op: keeps migration history consistent.
  }

  public override async down(): Promise<void> {
    // No-op
  }
}
