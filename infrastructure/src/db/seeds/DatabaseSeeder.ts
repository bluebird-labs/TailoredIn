import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import { SkillsSeeder } from './SkillsSeeder.js';

/**
 * Production-safe root seeder — run via: bun run db:seed
 *
 * Only refreshes reference data that is safe to run against any database:
 *   - Skills: upserted (no existing data is deleted or overwritten)
 *
 * Does NOT touch: profiles, experiences, education, headlines, skill categories,
 * resume profiles, jobs, or companies.
 *
 * For a full fixture seed (E2E tests only), use E2eSeeder.
 */
export class DatabaseSeeder extends Seeder {
  public async run(em: EntityManager): Promise<void> {
    return this.call(em, [SkillsSeeder]);
  }
}
