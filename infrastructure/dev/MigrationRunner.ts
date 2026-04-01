import { MikroORM } from '@mikro-orm/postgresql';
import { Logger } from '@tailoredin/core';
import { createOrmConfig, type OrmDbConfig } from '../src/db/orm-config.js';

const log = Logger.create('migration-runner');

/**
 * Run all pending MikroORM migrations programmatically.
 * Initialises the ORM, runs migrations, then closes the connection.
 */
export async function runMigrations(dbConfig: OrmDbConfig): Promise<void> {
  const orm = await MikroORM.init(createOrmConfig(dbConfig));
  try {
    const result = await orm.migrator.up();
    if (result.length === 0) {
      log.info('No pending migrations.');
    } else {
      for (const m of result) log.info(`Applied: ${m.name}`);
    }
  } finally {
    await orm.close(true);
  }
}

/**
 * Run the DatabaseSeeder to populate a fresh database.
 * Initialises the ORM, runs the root seeder, then closes the connection.
 */
export async function runSeeds(dbConfig: OrmDbConfig): Promise<void> {
  const orm = await MikroORM.init(createOrmConfig(dbConfig));
  try {
    await orm.seeder.seed('DatabaseSeeder');
    log.info('Seeds applied.');
  } finally {
    await orm.close(true);
  }
}
