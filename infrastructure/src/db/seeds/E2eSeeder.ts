import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';

/**
 * Destructive seeder for E2E tests.
 *
 * Truncates all tables and re-seeds with full fixture data.
 * Do NOT run against a production or development database.
 *
 * Used by: infrastructure/dev/e2e-start-servers.ts
 */
export class E2eSeeder extends Seeder {
  public async run(em: EntityManager): Promise<void> {
    await em.getConnection().execute(`
      TRUNCATE
        accomplishments, experiences,
        headlines, educations, profiles,
        companies
      CASCADE
    `);

    // No seeders to call after purge — add new fixture seeders here as needed
  }
}
