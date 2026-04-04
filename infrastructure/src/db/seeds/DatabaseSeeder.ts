import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';

/**
 * Production-safe root seeder — run via: bun run db:seed
 *
 * Currently a no-op after the purge of skills/jobs/resume seeders.
 * Add new seeders here as reference data is introduced.
 */
export class DatabaseSeeder extends Seeder {
  public async run(_em: EntityManager): Promise<void> {
    // No seeders to run after purge
  }
}
