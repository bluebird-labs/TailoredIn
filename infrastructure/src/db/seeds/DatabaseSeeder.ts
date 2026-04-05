import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';

/**
 * Production-safe root seeder — run via: bun run db:seed
 *
 * Upserts reference data. Safe to run multiple times.
 */
export class DatabaseSeeder extends Seeder {
  public async run(_em: EntityManager): Promise<void> {
    // No reference data to seed at this time.
  }
}
