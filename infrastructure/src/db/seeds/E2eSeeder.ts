import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import { JobDataSeeder } from './JobDataSeeder.js';
import { ResumeDataSeeder } from './ResumeDataSeeder.js';
import { SkillsSeeder } from './SkillsSeeder.js';

/**
 * Destructive seeder for E2E tests.
 *
 * Truncates all tables and re-seeds with full fixture data (skills, resume, jobs).
 * Do NOT run against a production or development database.
 *
 * Used by: infrastructure/dev/e2e-start-servers.ts
 */
export class E2eSeeder extends Seeder {
  public async run(em: EntityManager): Promise<void> {
    await em.getConnection().execute(`
      TRUNCATE
        tailored_resumes, resume_profiles,
        accomplishments, experiences,
        headline_tags, headlines, educations, skill_items, skill_categories, profiles,
        job_status_updates, jobs, companies,
        skills
      CASCADE
    `);

    return this.call(em, [
      SkillsSeeder, // skills (no FK deps)
      ResumeDataSeeder, // user → resume data → archetypes
      JobDataSeeder // companies → jobs → job_status_updates
    ]);
  }
}
