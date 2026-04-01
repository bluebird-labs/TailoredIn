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
        archetype_tag_weights, archetypes,
        bullet_variant_tags, bullet_variants, bullet_tags, bullets, experiences,
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
