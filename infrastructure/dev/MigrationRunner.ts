import { MikroORM } from '@mikro-orm/postgresql';
import { Logger } from '@tailoredin/core';
import { createOrmConfig, type OrmDbConfig } from '../src/db/orm-config.js';
import { backupDatabase } from './DatabaseBackup.js';

const log = Logger.create('migration-runner');

export type MigrationOptions = {
  dbConfig: OrmDbConfig;
  containerName: string;
  repoRoot: string;
};

/**
 * Run all pending MikroORM migrations programmatically.
 * Creates a pg_dump backup before applying if there are pending migrations.
 */
export async function runMigrations({ dbConfig, containerName, repoRoot }: MigrationOptions): Promise<void> {
  const orm = await MikroORM.init(createOrmConfig(dbConfig));
  try {
    const pending = await orm.migrator.getPending();
    if (pending.length === 0) {
      log.info('No pending migrations.');
      return;
    }

    log.info(`${pending.length} pending migration(s) — creating backup first...`);
    backupDatabase(dbConfig, containerName, repoRoot);

    const result = await orm.migrator.up();
    for (const m of result) log.info(`Applied: ${m.name}`);
  } finally {
    await orm.close(true);
  }
}
