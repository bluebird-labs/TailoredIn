#!/usr/bin/env bun
/**
 * `bun dev:down` — Stop the dev database.
 *
 * On main: stops compose (preserves named volume).
 * In a worktree: stops compose, removes Docker volume, deletes generated .env.
 *
 * Idempotent: safe to call multiple times.
 */
import { Logger } from '@tailoredin/core';
import { resolveDevContext } from './DevContext.js';
import { composeDown, isContainerRunning } from './DockerCompose.js';
import { deleteEnvFile, envFileExists } from './EnvFile.js';

const log = Logger.create('dev-down');

const ctx = resolveDevContext();

log.info(`Stopping dev environment (${ctx.mode} mode${ctx.worktreeName ? `: ${ctx.worktreeName}` : ''})`);

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
