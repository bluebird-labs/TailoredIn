import { Logger } from '@tailoredin/core';
import type { DevContext } from './DevContext.js';

const log = Logger.create('docker-compose');

function composeArgs(ctx: DevContext): string[] {
  const args = ['docker', 'compose', '-f', ctx.composeFile, '-p', ctx.projectName, '--project-directory', ctx.composeProjectDir];

  // In worktree mode, prevent docker compose from reading the repo root's .env
  // (which contains main-branch ports). Worktree env vars are set via process.env.
  if (ctx.mode === 'worktree') {
    args.push('--env-file', '/dev/null');
  }

  return args;
}

/** Throws if Docker daemon is not reachable. */
export function assertDockerRunning(): void {
  const result = Bun.spawnSync(['docker', 'info'], { stdout: 'ignore', stderr: 'ignore' });
  if (result.exitCode !== 0) {
    throw new Error('Docker is not running. Start Docker Desktop and try again.');
  }
}

/** Start services via docker compose. */
export function composeUp(ctx: DevContext): void {
  const args = [...composeArgs(ctx), 'up', '-d'];
  log.info(`Starting: ${args.join(' ')}`);
  const result = Bun.spawnSync(args, { stdout: 'inherit', stderr: 'inherit', env: process.env });
  if (result.exitCode !== 0) {
    throw new Error(`docker compose up failed (exit ${result.exitCode}).`);
  }
}

/**
 * Stop services. Pass `removeVolumes: true` to also remove Docker volumes (worktree teardown).
 */
export function composeDown(ctx: DevContext, removeVolumes: boolean): void {
  const args = [...composeArgs(ctx), 'down'];
  if (removeVolumes) args.push('-v');

  log.info(`Stopping: ${args.join(' ')}`);
  const result = Bun.spawnSync(args, { stdout: 'inherit', stderr: 'inherit', env: process.env });
  if (result.exitCode !== 0) {
    log.warn(`docker compose down exited with code ${result.exitCode}`);
  }
}

/** Check if the postgres container is currently running. */
export function isContainerRunning(containerName: string): boolean {
  const result = Bun.spawnSync(['docker', 'inspect', '--format', '{{.State.Running}}', containerName], {
    stdout: 'pipe',
    stderr: 'ignore'
  });
  return result.exitCode === 0 && result.stdout.toString().trim() === 'true';
}

/**
 * Wait for PostgreSQL to accept connections. Polls `pg_isready` inside the container.
 * On timeout, prints the last 20 lines of container logs for diagnostics.
 */
export async function waitForPostgres(containerName: string, timeoutSeconds = 30): Promise<void> {
  for (let i = 1; i <= timeoutSeconds; i++) {
    const result = Bun.spawnSync(['docker', 'exec', containerName, 'pg_isready', '-U', 'postgres'], {
      stdout: 'ignore',
      stderr: 'ignore'
    });
    if (result.exitCode === 0) return;
    await Bun.sleep(1000);
  }

  log.error(`PostgreSQL did not become ready within ${timeoutSeconds}s. Container logs:`);
  Bun.spawnSync(['docker', 'logs', '--tail', '20', containerName], {
    stdout: 'inherit',
    stderr: 'inherit'
  });

  throw new Error(`PostgreSQL not ready after ${timeoutSeconds}s.`);
}
