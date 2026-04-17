import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { Logger } from '@tailoredin/core';
import { projectName } from './ports.js';

const log = Logger.create('docker-compose');

export interface ComposeContext {
  composeFile: string;
  projectName: string;
  composeProjectDir: string;
  containerName: string;
}

function composeArgs(ctx: ComposeContext): string[] {
  return [
    'docker',
    'compose',
    '-f',
    ctx.composeFile,
    '-p',
    ctx.projectName,
    '--project-directory',
    ctx.composeProjectDir
  ];
}

export function assertDockerRunning(): void {
  const result = spawnSync('docker', ['info'], { stdio: 'ignore' });
  if (result.status !== 0) {
    throw new Error('Docker is not running. Start Docker Desktop and try again.');
  }
}

export function composeUp(ctx: ComposeContext): void {
  const args = [...composeArgs(ctx), 'up', '-d'];
  log.info(`Starting: ${args.join(' ')}`);
  const result = spawnSync(args[0], args.slice(1), { stdio: 'inherit', env: process.env });
  if (result.status !== 0) {
    throw new Error(`docker compose up failed (exit ${result.status}).`);
  }
}

export function composeDown(ctx: ComposeContext, removeVolumes: boolean): void {
  const args = [...composeArgs(ctx), 'down'];
  if (removeVolumes) args.push('-v');

  log.info(`Stopping: ${args.join(' ')}`);
  const result = spawnSync(args[0], args.slice(1), { stdio: 'inherit', env: process.env });
  if (result.status !== 0) {
    log.warn(`docker compose down exited with code ${result.status}`);
  }
}

export function isContainerRunning(containerName: string): boolean {
  const result = spawnSync('docker', ['inspect', '--format', '{{.State.Running}}', containerName], {
    stdio: ['ignore', 'pipe', 'ignore']
  });
  return result.status === 0 && result.stdout.toString().trim() === 'true';
}

export async function waitForPostgres(containerName: string, timeoutSeconds = 30): Promise<void> {
  for (let i = 1; i <= timeoutSeconds; i++) {
    const result = spawnSync('docker', ['exec', containerName, 'pg_isready', '-U', 'postgres'], {
      stdio: 'ignore'
    });
    if (result.status === 0) return;
    await new Promise(r => setTimeout(r, 1000));
  }

  log.error(`PostgreSQL did not become ready within ${timeoutSeconds}s. Container logs:`);
  spawnSync('docker', ['logs', '--tail', '20', containerName], { stdio: 'inherit' });

  throw new Error(`PostgreSQL not ready after ${timeoutSeconds}s.`);
}

export function resolveComposeContext(branch: string, repoRoot: string): ComposeContext {
  const name = projectName(branch);
  return {
    composeFile: resolve(repoRoot, 'compose.yaml'),
    projectName: name,
    composeProjectDir: repoRoot,
    containerName: `${name}-postgres-1`
  };
}
