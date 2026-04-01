import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import { JobDataSeeder } from './JobDataSeeder.js';
import { ResumeDataSeeder } from './ResumeDataSeeder.js';
import { SkillsSeeder } from './SkillsSeeder.js';

/**
 * Root seeder that orchestrates all seeders in dependency order.
 * Run via: bunx mikro-orm seeder:run
 */
export class DatabaseSeeder extends Seeder {
  public async run(em: EntityManager): Promise<void> {
    await em.getConnection().execute(`
      TRUNCATE
        archetype_position_bullets, archetype_positions, archetype_education,
        archetype_skill_categories, archetype_skill_items, archetypes,
        resume_bullets, resume_positions, resume_company_locations, resume_companies,
        resume_skill_items, resume_skill_categories, resume_education, resume_headlines,
        headline_tags, headlines, educations, skill_items, skill_categories, profiles,
        users,
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
