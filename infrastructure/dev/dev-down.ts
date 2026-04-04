#!/usr/bin/env bun
/**
 * `bun dev:down` — Stop the dev environment (main branch only).
 *
 * 1. Kills any running API + web dev server processes
 * 2. Stops PostgreSQL via Docker Compose (preserves volume)
 *
 * Idempotent: safe to call multiple times.
 */
import { Logger } from '@tailoredin/core';
import { requireMain } from './ContextGuard.js';
import { resolveDevContext } from './DevContext.js';
import { composeDown, isContainerRunning } from './DockerCompose.js';

const log = Logger.create('dev:down');

const ctx = resolveDevContext();
requireMain(ctx);

log.info('Stopping dev environment (main)');

// Kill any running dev server processes (best-effort)
log.info('Stopping dev servers...');
Bun.spawnSync(['pkill', '-f', 'bun.*api/src/index.ts'], { stdout: 'ignore', stderr: 'ignore' });
Bun.spawnSync(['pkill', '-f', 'bun.*--cwd web dev'], { stdout: 'ignore', stderr: 'ignore' });

if (!isContainerRunning(ctx.containerName)) {
  log.info('Nothing to tear down.');
  process.exit(0);
}

log.info('Stopping PostgreSQL...');
composeDown(ctx, false);

log.info('Done.');
