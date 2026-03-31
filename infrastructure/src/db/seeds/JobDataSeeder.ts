import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import { Logger } from '@tailoredin/core';

/**
 * Seeds companies, jobs, and job_status_updates from SQL dump files.
 * Data is loaded in FK order: companies → jobs → job_status_updates.
 * The jobs.sql file is gzip-compressed to stay under GitHub's 100 MB limit.
 */
export class JobDataSeeder extends Seeder {
  private readonly log = Logger.create('JobDataSeeder');

  public async run(em: EntityManager): Promise<void> {
    const dataDir = resolve(import.meta.dirname, 'data');
    const connection = em.getConnection();

    // Drop the btree index on the tsvector column — some job descriptions
    // exceed the btree max row size. Recreate as GIN after loading.
    await connection.execute('DROP INDEX IF EXISTS "description_fts_idx"');

    const files = ['companies.sql', 'jobs.sql.gz', 'job_status_updates.sql'] as const;

    for (const file of files) {
      const filePath = resolve(dataDir, file);
      const sql = file.endsWith('.gz')
        ? gunzipSync(readFileSync(filePath)).toString('utf-8')
        : readFileSync(filePath, 'utf-8');
      this.log.info(`Loading ${file}...`);
      await connection.execute(sql);
      this.log.info(`Loaded ${file}.`);
    }

    // Recreate as a GIN index (correct type for tsvector columns)
    await connection.execute('CREATE INDEX "description_fts_idx" ON "jobs" USING gin ("description_fts")');

    this.log.info('Job data seeded successfully.');
  }
}
