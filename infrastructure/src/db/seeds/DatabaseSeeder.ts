import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import { companies } from './data/companies.js';

/**
 * Production-safe root seeder — run via: bun run db:seed
 *
 * Upserts reference data (companies). Safe to run multiple times.
 */
export class DatabaseSeeder extends Seeder {
  public async run(em: EntityManager): Promise<void> {
    const conn = em.getConnection();

    for (const c of companies) {
      await conn.execute(
        `INSERT INTO companies (id, name, description, website, logo_url, linkedin_link, business_type, industry, stage, created_at, updated_at)
         VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [c.id, c.name, c.website, c.logo_url, c.linkedin_link, c.business_type, c.industry, c.stage]
      );
    }
  }
}
