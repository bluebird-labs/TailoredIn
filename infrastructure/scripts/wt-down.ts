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
import { deleteSession, readSession, sessionExists, toProcessEnv, type WorktreeSession } from './WorktreeSession.js';

const log = Logger.create('wt:down');

const ctx = resolveDevContext();
requireWorktree(ctx);

log.info(`Stopping worktree environment: ${ctx.worktreeName}`);

// Read session once (if it exists) for PIDs and env
let session: WorktreeSession | null = null;
if (sessionExists()) {
  session = await readSession();
}

if (!session && !isContainerRunning(ctx.containerName)) {
  log.info('Nothing to tear down.');
  process.exit(0);
}

// Kill only this worktree's dev server processes using stored PIDs
if (session) {
  log.info('Stopping dev servers...');
  for (const pid of [session.apiPid, session.webPid]) {
    if (pid) {
      try {
        process.kill(pid, 'SIGTERM');
      } catch {
        // Process already exited
      }
    }
  }

  Object.assign(process.env, toProcessEnv(session));
}

log.info('Stopping PostgreSQL and removing volume...');
composeDown(ctx, true);

if (session) {
  log.info('Removing .wt-session.json...');
  deleteSession();
}

log.info('Done.');
