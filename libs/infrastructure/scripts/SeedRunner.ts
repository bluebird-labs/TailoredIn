import { MikroORM } from '@mikro-orm/postgresql';
import { Logger } from '@tailoredin/core';
import { createOrmConfig, type OrmDbConfig } from '../src/db/orm-config.js';
import { DatabaseSeeder } from '../src/db/seeds/DatabaseSeeder.js';

const log = Logger.create('seed-runner');

/**
 * Run the production-safe DatabaseSeeder programmatically.
 * Only upserts reference data (skills) — safe on existing databases.
 */
export async function runSeeds(dbConfig: OrmDbConfig): Promise<void> {
  const orm = await MikroORM.init(createOrmConfig(dbConfig));
  try {
    await orm.seeder.seed(DatabaseSeeder);
    log.info('Seeds applied.');
  } finally {
    await orm.close(true);
  }
}
