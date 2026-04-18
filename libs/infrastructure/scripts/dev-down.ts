#!/usr/bin/env tsx
/**
 * `pnpm dev:down` — Stop Docker PostgreSQL.
 *
 * Reads .dev-state.json for the branch/project name, stops Docker Compose.
 * Dev servers are managed by turbo (Ctrl+C propagates SIGINT).
 *
 * Flags:
 *   --clean        Remove Docker volumes (skipped on main/master for safety)
 *   --force-clean  Remove Docker volumes even on main/master
 */
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { Logger } from '@tailoredin/core';
import { composeDown, resolveComposeContext } from './DockerCompose.js';

const log = Logger.create('dev:down');

const repoRoot = resolve(import.meta.dirname, '../../..');
const statePath = resolve(repoRoot, '.dev-state.json');
const clean = process.argv.includes('--clean');
const forceClean = process.argv.includes('--force-clean');

if (!existsSync(statePath)) {
  log.info('No .dev-state.json found — nothing to tear down.');
  process.exit(0);
}

const state = JSON.parse(readFileSync(statePath, 'utf-8'));

if (state.branch) {
  const ctx = resolveComposeContext(state.branch, repoRoot);
  const isMainBranch = state.branch === 'main' || state.branch === 'master';
  const removeVolumes = forceClean || (clean && !isMainBranch);

  if (clean && isMainBranch && !forceClean) {
    log.warn('Ignoring --clean on main branch to protect data. Use --force-clean to override.');
  }

  log.info('Stopping PostgreSQL...');
  composeDown(ctx, removeVolumes);
}

unlinkSync(statePath);
log.info('Done.');
