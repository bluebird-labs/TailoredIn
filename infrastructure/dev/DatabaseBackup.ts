import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Logger } from '@tailoredin/core';
import type { OrmDbConfig } from '../src/db/orm-config.js';

const log = Logger.create('database-backup');

/**
 * Create a pg_dump backup of the database via `docker exec`.
 * Returns the absolute path of the generated `.sql` file.
 */
export function backupDatabase(dbConfig: OrmDbConfig, containerName: string, repoRoot: string): string {
  const backupDir = resolve(repoRoot, 'backups');
  mkdirSync(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${dbConfig.dbName}_${timestamp}.sql`;
  const filePath = resolve(backupDir, fileName);

  log.info(`Backing up ${dbConfig.dbName} → ${fileName}`);

  const result = Bun.spawnSync(
    [
      'docker',
      'exec',
      '-e',
      `PGPASSWORD=${dbConfig.password}`,
      containerName,
      'pg_dump',
      '-U',
      dbConfig.user,
      dbConfig.dbName
    ],
    { stdout: 'pipe', stderr: 'pipe' }
  );

  if (result.exitCode !== 0) {
    const stderr = result.stderr.toString().trim();
    throw new Error(`pg_dump failed (exit ${result.exitCode}): ${stderr}`);
  }

  writeFileSync(filePath, result.stdout);

  log.info(`Backup saved: ${filePath}`);
  return filePath;
}
