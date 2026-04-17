#!/usr/bin/env tsx
/**
 * `pnpm dev:down` — Stop the dev environment.
 *
 * 1. Reads .dev-state.json for PIDs and profile
 * 2. Kills API + web processes
 * 3. If local profile: stops Docker (--clean removes volumes)
 * 4. Deletes .dev-state.json
 */
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { Logger } from '@tailoredin/core';
import { composeDown, resolveComposeContext } from './DockerCompose.js';

const log = Logger.create('dev:down');

const repoRoot = resolve(import.meta.dirname, '../..');
const statePath = resolve(repoRoot, '.dev-state.json');
const clean = process.argv.includes('--clean');

if (!existsSync(statePath)) {
  log.info('No .dev-state.json found — nothing to tear down.');
  process.exit(0);
}

const state = JSON.parse(readFileSync(statePath, 'utf-8'));

// Kill processes by stored PIDs
log.info('Stopping dev servers...');
for (const [name, pid] of Object.entries(state.pids ?? {}) as [string, number][]) {
  try {
    process.kill(pid, 'SIGTERM');
    log.info(`Killed ${name} (PID ${pid})`);
  } catch {
    log.info(`${name} (PID ${pid}) already stopped`);
  }
}

// Stop Docker if local profile
if (state.profile === 'local' && state.branch) {
  const ctx = resolveComposeContext(state.branch, repoRoot);
  log.info('Stopping PostgreSQL...');
  composeDown(ctx, clean);
}

unlinkSync(statePath);
log.info('Done.');
