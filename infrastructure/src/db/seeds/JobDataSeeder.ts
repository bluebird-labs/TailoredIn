import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import { Logger } from '@tailoredin/core';
import { companies } from './data/companies.js';
import { jobStatusUpdates } from './data/job-status-updates.js';
import { jobs } from './data/jobs.js';

const BATCH_SIZE = 500;

/**
 * Seeds companies, jobs, and job_status_updates from typed TypeScript data.
 * Data is inserted in FK order: companies → jobs → job_status_updates.
 */
export class JobDataSeeder extends Seeder {
  private readonly log = Logger.create('JobDataSeeder');

  public async run(em: EntityManager): Promise<void> {
    const connection = em.getConnection();

    // Drop the GIN index — some job descriptions exceed btree max row size.
    await connection.execute('DROP INDEX IF EXISTS "description_fts_idx"');

    this.log.info(`Inserting ${companies.length} companies...`);
    await batchInsert(connection, 'companies', companies, BATCH_SIZE);

    this.log.info(`Inserting ${jobs.length} jobs...`);
    await batchInsert(connection, 'jobs', jobs, 100); // smaller batches — large description fields

    this.log.info(`Inserting ${jobStatusUpdates.length} job status updates...`);
    await batchInsert(connection, 'job_status_updates', jobStatusUpdates, BATCH_SIZE);

    // Recreate as GIN index (correct type for tsvector columns)
    await connection.execute(
      'CREATE INDEX IF NOT EXISTS "description_fts_idx" ON "jobs" USING gin ("description_fts")'
    );

    this.log.info('Job data seeded successfully.');
  }
}

async function batchInsert(
  connection: ReturnType<EntityManager['getConnection']>,
  table: string,
  rows: Record<string, unknown>[],
  batchSize: number
): Promise<void> {
  if (rows.length === 0) return;

  const columns = Object.keys(rows[0]);
  const colList = columns.map(c => `"${c}"`).join(', ');

  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const batch = rows.slice(offset, offset + batchSize);
    const values: unknown[] = [];
    const rowPlaceholders: string[] = [];

    for (const row of batch) {
      const placeholders = columns.map(() => '?');
      rowPlaceholders.push(`(${placeholders.join(', ')})`);
      for (const col of columns) values.push(row[col] ?? null);
    }

    await connection.execute(`INSERT INTO "${table}" (${colList}) VALUES ${rowPlaceholders.join(', ')}`, values);
  }
}
