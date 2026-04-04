#!/usr/bin/env bun
/**
 * `bun wt:down` — Stop the worktree dev environment.
 *
 * 1. Kills any running API + web dev server processes
 * 2. Stops PostgreSQL and removes the Docker volume
 * 3. Deletes .wt-session.json
 *
 * Idempotent: safe to call multiple times.
 */
import { Logger } from '@tailoredin/core';
import { requireWorktree } from './ContextGuard.js';
import { resolveDevContext } from './DevContext.js';
import { composeDown, isContainerRunning } from './DockerCompose.js';
import { deleteSession, readSession, sessionExists, toProcessEnv } from './WorktreeSession.js';

const log = Logger.create('wt:down');

const ctx = resolveDevContext();
requireWorktree(ctx);

log.info(`Stopping worktree environment: ${ctx.worktreeName}`);

// Kill any running dev server processes (best-effort)
log.info('Stopping dev servers...');
Bun.spawnSync(['pkill', '-f', 'bun.*api/src/index.ts'], { stdout: 'ignore', stderr: 'ignore' });
Bun.spawnSync(['pkill', '-f', 'bun.*--cwd web dev'], { stdout: 'ignore', stderr: 'ignore' });

if (!sessionExists() && !isContainerRunning(ctx.containerName)) {
  log.info('Nothing to tear down.');
  process.exit(0);
}

if (sessionExists()) {
  const session = await readSession();
  Object.assign(process.env, toProcessEnv(session));
}

log.info('Stopping PostgreSQL and removing volume...');
composeDown(ctx, true);

if (sessionExists()) {
  log.info('Removing .wt-session.json...');
  deleteSession();
}

log.info('Done.');
