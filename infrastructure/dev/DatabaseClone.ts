import { Logger } from '@tailoredin/core';
import { isContainerRunning } from './DockerCompose.js';

const log = Logger.create('database-clone');

const DEV_CONTAINER = 'tailored-in-postgres-1';
const DEV_DB_NAME = 'tailored_in';
const PG_USER = 'postgres';
const PG_PASSWORD = 'postgres';

/**
 * Clone the dev database into a worktree Postgres container via piped pg_dump | psql.
 *
 * Returns `true` on success, `false` if the dev DB is unavailable or the clone fails.
 */
export async function cloneDevDatabase(wtContainerName: string, wtDbName: string): Promise<boolean> {
  if (!isContainerRunning(DEV_CONTAINER)) {
    log.warn(`Dev DB container (${DEV_CONTAINER}) is not running — cannot clone.`);
    return false;
  }

  log.info(`Cloning ${DEV_DB_NAME} → ${wtDbName}...`);

  const pgDump = Bun.spawn(
    [
      'docker',
      'exec',
      '-e',
      `PGPASSWORD=${PG_PASSWORD}`,
      DEV_CONTAINER,
      'pg_dump',
      '-U',
      PG_USER,
      '--no-owner',
      '--no-privileges',
      DEV_DB_NAME
    ],
    { stdout: 'pipe', stderr: 'pipe' }
  );

  const psql = Bun.spawn(
    ['docker', 'exec', '-i', '-e', `PGPASSWORD=${PG_PASSWORD}`, wtContainerName, 'psql', '-U', PG_USER, '-d', wtDbName],
    { stdin: pgDump.stdout, stdout: 'pipe', stderr: 'pipe' }
  );

  // Wait for both processes to finish
  const [dumpExitCode, psqlExitCode] = await Promise.all([pgDump.exited, psql.exited]);

  if (dumpExitCode !== 0) {
    const stderr = await new Response(pgDump.stderr).text();
    log.error(`pg_dump failed (exit ${dumpExitCode}): ${stderr}`);
    return false;
  }

  if (psqlExitCode !== 0) {
    const stderr = await new Response(psql.stderr).text();
    log.error(`psql restore failed (exit ${psqlExitCode}): ${stderr}`);
    return false;
  }

  log.info('Clone complete.');
  return true;
}
