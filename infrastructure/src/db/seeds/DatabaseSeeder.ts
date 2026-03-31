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
    return this.call(em, [
      SkillsSeeder, // skills (no FK deps)
      ResumeDataSeeder, // user → resume data → archetypes
      JobDataSeeder // companies → jobs → job_status_updates
    ]);
  }
}
