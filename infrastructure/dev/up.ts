#!/usr/bin/env bun
/**
 * `bun up` — One command to start the full dev environment.
 *
 * 1. Checks if `bun install` is needed (lockfile vs node_modules freshness)
 * 2. Starts PostgreSQL via Docker Compose
 * 3. Runs all pending migrations
 * 4. Runs the safe DatabaseSeeder (upserts reference data)
 * 5. Spawns API + web dev servers as child processes
 *
 * Worktree-aware: on main uses .env (static ports),
 * in a worktree allocates free ports and generates an isolated .env.
 *
 * Idempotent: safe to call multiple times. Ctrl+C stops everything.
 */
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { env, envInt, Logger } from '@tailoredin/core';
import type { OrmDbConfig } from '../src/db/orm-config.js';
import { resolveDevContext } from './DevContext.js';
import { assertDockerRunning, composeDown, composeUp, isContainerRunning, waitForPostgres } from './DockerCompose.js';
import { deleteEnvFile, envFileExists, readPorts, type SessionPorts, writeWorktreeEnv } from './EnvFile.js';
import { runMigrations } from './MigrationRunner.js';
import { findFreePort } from './PortFinder.js';
import { runSeeds } from './SeedRunner.js';

const log = Logger.create('up');

// ── Check dependencies ────────────────────────────────────────────

checkBunInstall();

// ── Resolve context ───────────────────────────────────────────────

const ctx = resolveDevContext();

log.info(`Dev environment (${ctx.mode} mode${ctx.worktreeName ? `: ${ctx.worktreeName}` : ''})`);

// ── Preflight ─────────────────────────────────────────────────────

assertDockerRunning();

// ── Start or verify database ──────────────────────────────────────

let ports: SessionPorts | null = null;

if (isContainerRunning(ctx.containerName)) {
  log.info('Database already running.');

  if (ctx.mode === 'worktree') {
    if (!envFileExists()) {
      throw new Error('Container is running but .env is missing. Run `bun down` first, then `bun up`.');
    }
    ports = await readPorts();
  }
} else {
  // Handle stale worktree state
  if (ctx.mode === 'worktree' && envFileExists()) {
    log.info('Stale .env found (container not running) — cleaning up...');
    composeDown(ctx);
    deleteEnvFile();
  }

  // Worktree: allocate ports + write .env
  if (ctx.mode === 'worktree') {
    log.info('Allocating ports...');
    const db = await findFreePort(5432);
    const api = await findFreePort(8000);
    const web = await findFreePort(5173);
    ports = { db, api, web };
    log.info(`Ports: DB=${db}  API=${api}  Web=${web}`);

    log.info('Writing .env (merged from main + worktree overrides)...');
    await writeWorktreeEnv(ctx.repoRoot, {
      POSTGRES_HOST: 'localhost',
      POSTGRES_PORT: String(db),
      POSTGRES_USER: 'postgres',
      POSTGRES_PASSWORD: 'postgres',
      POSTGRES_DB: `tailoredin_${ctx.worktreeName}`,
      POSTGRES_SCHEMA: 'public',
      API_PORT: String(api),
      VITE_PORT: String(web),
      COMPOSE_PROJECT_NAME: ctx.projectName
    });
  }

  // Start database
  log.info('Starting PostgreSQL...');
  try {
    composeUp(ctx);
  } catch (e) {
    if (ctx.mode === 'worktree') teardownWorktree();
    throw e;
  }

  log.info('Waiting for PostgreSQL...');
  try {
    await waitForPostgres(ctx.containerName);
  } catch (e) {
    if (ctx.mode === 'worktree') teardownWorktree();
    throw e;
  }
}

// ── Migrations ────────────────────────────────────────────────────

log.info('Running migrations...');
try {
  await runMigrationsForContext(ports);
} catch (e) {
  if (ctx.mode === 'worktree') teardownWorktree();
  throw e;
}

// ── Seeds ─────────────────────────────────────────────────────────

log.info('Running seeds...');
try {
  await runSeedsForContext(ports);
} catch (e) {
  if (ctx.mode === 'worktree') teardownWorktree();
  throw e;
}

// ── Start dev servers ─────────────────────────────────────────────

log.info('Starting dev servers...');

const envFile = resolve(ctx.workingDir, '.env');

const apiProc = Bun.spawn(['bun', `--env-file=${envFile}`, '--watch', 'api/src/index.ts'], {
  cwd: ctx.workingDir,
  stdout: 'inherit',
  stderr: 'inherit'
});

const webProc = Bun.spawn(['bun', `--env-file=${envFile}`, 'run', '--cwd', 'web', 'dev'], {
  cwd: ctx.workingDir,
  stdout: 'inherit',
  stderr: 'inherit'
});

if (ctx.mode === 'worktree' && ports) {
  log.info(`Session "${ctx.worktreeName}" ready!`);
  log.info(`  API: http://localhost:${ports.api}`);
  log.info(`  Web: http://localhost:${ports.web}`);
  log.info(`  DB:  localhost:${ports.db} (tailoredin_${ctx.worktreeName})`);
} else {
  log.info('Dev environment ready!');
  log.info(`  DB: localhost:${env('POSTGRES_PORT')} (${env('POSTGRES_DB')})`);
}

// ── Signal handling ───────────────────────────────────────────────

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

// Keep parent alive until a child exits
await Promise.race([apiProc.exited, webProc.exited]);
shutdown();

// ── Helpers ───────────────────────────────────────────────────────

function checkBunInstall(): void {
  const lockfile = resolve('.', 'bun.lock');
  const nodeModules = resolve('.', 'node_modules');

  if (!existsSync(nodeModules)) {
    log.info('node_modules missing — running bun install...');
    const result = Bun.spawnSync(['bun', 'install'], { stdout: 'inherit', stderr: 'inherit' });
    if (result.exitCode !== 0) throw new Error('bun install failed.');
    return;
  }

  if (existsSync(lockfile)) {
    const lockMtime = statSync(lockfile).mtimeMs;
    const nmMtime = statSync(nodeModules).mtimeMs;
    if (lockMtime > nmMtime) {
      log.info('bun.lock is newer than node_modules — running bun install...');
      const result = Bun.spawnSync(['bun', 'install'], { stdout: 'inherit', stderr: 'inherit' });
      if (result.exitCode !== 0) throw new Error('bun install failed.');
    }
  }
}

function dbConfigForContext(sessionPorts: SessionPorts | null): OrmDbConfig {
  if (ctx.mode === 'worktree' && sessionPorts) {
    return {
      timezone: 'UTC',
      user: 'postgres',
      password: 'postgres',
      dbName: `tailoredin_${ctx.worktreeName}`,
      schema: 'public',
      host: 'localhost',
      port: sessionPorts.db
    };
  }
  return {
    timezone: env('TZ'),
    user: env('POSTGRES_USER'),
    password: env('POSTGRES_PASSWORD'),
    dbName: env('POSTGRES_DB'),
    schema: env('POSTGRES_SCHEMA'),
    host: env('POSTGRES_HOST'),
    port: envInt('POSTGRES_PORT')
  };
}

async function runMigrationsForContext(sessionPorts: SessionPorts | null): Promise<void> {
  await runMigrations(dbConfigForContext(sessionPorts));
}

async function runSeedsForContext(sessionPorts: SessionPorts | null): Promise<void> {
  await runSeeds(dbConfigForContext(sessionPorts));
}

function teardownWorktree(): void {
  log.warn('Cleaning up after failure...');
  try {
    composeDown(ctx);
  } catch {
    /* best effort */
  }
  deleteEnvFile();
}
