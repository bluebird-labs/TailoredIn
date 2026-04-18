import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getBackupDirectory, Logger } from '@tailoredin/core';
import type { OrmDbConfig } from '../src/db/orm-config.js';

const log = Logger.create('database-backup');

export function backupDatabase(dbConfig: OrmDbConfig, containerName: string, _repoRoot: string): string {
  const backupDir = getBackupDirectory();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${dbConfig.dbName}_${timestamp}.sql`;
  const filePath = resolve(backupDir, fileName);

  log.info(`Backing up ${dbConfig.dbName} → ${fileName}`);

  const result = spawnSync(
    'docker',
    ['exec', '-e', `PGPASSWORD=${dbConfig.password}`, containerName, 'pg_dump', '-U', dbConfig.user, dbConfig.dbName],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );

  if (result.status !== 0) {
    const stderr = result.stderr.toString().trim();
    throw new Error(`pg_dump failed (exit ${result.status}): ${stderr}`);
  }

  writeFileSync(filePath, result.stdout);

  log.info(`Backup saved: ${filePath}`);
  return filePath;
}
