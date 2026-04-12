#!/usr/bin/env bun
/**
 * `bun wt:up` — Start an isolated dev environment for a worktree.
 *
 * No `.env` dependency — all config stored in `.wt-session.json`.
 *
 * 1. Allocates free ports for DB, API, and web
 * 2. Starts an isolated PostgreSQL container
 * 3. Runs migrations + seeds against the worktree database
 * 4. Spawns API + web dev servers with explicit env vars
 *
 * Idempotent: safe to call multiple times. Ctrl+C stops servers.
 */
import { Logger } from '@tailoredin/core';
import { checkBunInstall } from './BunInstall.js';
import { requireWorktree } from './ContextGuard.js';
import { cloneDevDatabase } from './DatabaseClone.js';
import { resolveDevContext } from './DevContext.js';
import { assertDockerRunning, composeDown, composeUp, isContainerRunning, waitForPostgres } from './DockerCompose.js';
import { runMigrations } from './MigrationRunner.js';
import { runSeeds } from './SeedRunner.js';
import {
  allocateSession,
  deleteSession,
  readSession,
  sessionExists,
  toOrmConfig,
  toProcessEnv,
  type WorktreeSession,
  writeSession
} from './WorktreeSession.js';

const log = Logger.create('wt:up');

// ── Preflight ────────────────────────────────────────────────────

const ctx = resolveDevContext();
requireWorktree(ctx);

log.info(`Worktree environment: ${ctx.worktreeName}`);

checkBunInstall();
assertDockerRunning();

// ── Start or verify database ─────────────────────────────────────

let session: WorktreeSession;

if (isContainerRunning(ctx.containerName)) {
  log.info('Database already running.');
  if (!sessionExists()) {
    throw new Error('Container is running but .wt-session.json is missing. Run `bun wt:down` first, then `bun wt:up`.');
  }
  session = await readSession();
} else {
  // Handle stale session state
  if (sessionExists()) {
    log.info('Stale .wt-session.json found (container not running) — cleaning up...');
    const staleSession = await readSession();
    Object.assign(process.env, toProcessEnv(staleSession));
    composeDown(ctx, true);
    deleteSession();
  }

  log.info('Allocating ports...');
  session = await allocateSession(ctx);
  log.info(`Ports: DB=${session.dbPort}  API=${session.apiPort}  Web=${session.webPort}`);

  await writeSession(session);

  // Set process.env for docker compose variable substitution
  Object.assign(process.env, toProcessEnv(session));

  log.info('Starting PostgreSQL...');
  try {
    composeUp(ctx);
  } catch (e) {
    teardown();
    throw e;
  }

  log.info('Waiting for PostgreSQL...');
  try {
    await waitForPostgres(ctx.containerName);
  } catch (e) {
    teardown();
    throw e;
  }
}

// ── Database: clone dev or migrate + seed ────────────────────────

const ormConfig = toOrmConfig(session);

let cloned = false;

log.info('Attempting to clone dev database...');
try {
  cloned = await cloneDevDatabase(ctx.containerName, session.dbName);
} catch (e) {
  log.warn(`Clone failed: ${e instanceof Error ? e.message : e}`);
}

// Always run migrations — the clone may be behind the worktree's migration set
log.info('Running migrations...');
try {
  await runMigrations({ dbConfig: ormConfig, containerName: ctx.containerName, repoRoot: ctx.repoRoot });
} catch (e) {
  teardown();
  throw e;
}

if (!cloned) {
  log.info('No clone available — running seeds...');
  try {
    await runSeeds(ormConfig);
  } catch (e) {
    teardown();
    throw e;
  }
}

// ── Start dev servers ────────────────────────────────────────────

log.info('Starting dev servers...');

const childEnv = { ...process.env, BUN_CONFIG_NO_DOT_ENV: '1', ...toProcessEnv(session) };

const apiProc = Bun.spawn(['bun', '--watch', 'api/src/index.ts'], {
  cwd: ctx.workingDir,
  env: childEnv,
  stdout: 'inherit',
  stderr: 'inherit'
});

const webProc = Bun.spawn(['bun', 'run', '--cwd', 'web', 'dev'], {
  cwd: ctx.workingDir,
  env: childEnv,
  stdout: 'inherit',
  stderr: 'inherit'
});

// Persist PIDs so wt:down can kill only this worktree's servers
session.apiPid = apiProc.pid;
session.webPid = webProc.pid;
await writeSession(session);

log.info(`Session "${ctx.worktreeName}" ready!`);
log.info(`  API: http://localhost:${session.apiPort}`);
log.info(`  Web: http://localhost:${session.webPort}`);
log.info(`  DB:  localhost:${session.dbPort} (${session.dbName})`);

// ── Signal handling ──────────────────────────────────────────────

let shuttingDown = false;

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  log.info('Shutting down servers...');
  apiProc.kill();
  webProc.kill();
}

process.on('SIGINT', () => {
  shutdown();
  process.exit(0);
});
process.on('SIGTERM', () => {
  shutdown();
  process.exit(0);
});

const exitCode = await Promise.race([
  apiProc.exited.then(code => ({ process: 'API', code })),
  webProc.exited.then(code => ({ process: 'Web', code }))
]);
if (exitCode.code !== 0) {
  log.error(`${exitCode.process} server exited with code ${exitCode.code}`);
}
shutdown();

// ── Helpers ──────────────────────────────────────────────────────

function teardown(): void {
  log.warn('Cleaning up after failure...');
  try {
    Object.assign(process.env, toProcessEnv(session));
    composeDown(ctx, true);
  } catch (error) {
    log.warn('Teardown cleanup failed', { error });
  }
  deleteSession();
}
