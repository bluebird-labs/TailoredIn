#!/usr/bin/env bun
/**
 * `bun down` — Stop the full dev environment.
 *
 * 1. Kills any running API + web dev server processes
 * 2. Stops PostgreSQL via Docker Compose
 * 3. In a worktree: removes Docker volume + deletes generated .env
 *
 * Idempotent: safe to call multiple times.
 */
import { Logger } from '@tailoredin/core';
import { resolveDevContext } from './DevContext.js';
import { composeDown, isContainerRunning } from './DockerCompose.js';
import { deleteEnvFile, envFileExists } from './EnvFile.js';

const log = Logger.create('down');

const ctx = resolveDevContext();

log.info(`Stopping dev environment (${ctx.mode} mode${ctx.worktreeName ? `: ${ctx.worktreeName}` : ''})`);

// Kill any running dev server processes (best-effort)
log.info('Stopping dev servers...');
Bun.spawnSync(['pkill', '-f', 'bun.*api/src/index.ts'], { stdout: 'ignore', stderr: 'ignore' });
Bun.spawnSync(['pkill', '-f', 'bun.*--cwd web dev'], { stdout: 'ignore', stderr: 'ignore' });

if (ctx.mode === 'worktree') {
  if (!envFileExists() && !isContainerRunning(ctx.containerName)) {
    log.info('Nothing to tear down.');
    process.exit(0);
  }

  log.info('Stopping PostgreSQL and removing volume...');
  composeDown(ctx);

  if (envFileExists()) {
    log.info('Removing generated .env...');
    deleteEnvFile();
  }
} else {
  if (!isContainerRunning(ctx.containerName)) {
    log.info('Nothing to tear down.');
    process.exit(0);
  }

  log.info('Stopping PostgreSQL...');
  composeDown(ctx);
}

log.info('Done.');
