#!/usr/bin/env bun
/**
 * `bun dev:up` — Start the dev database and run migrations.
 *
 * Worktree-aware: on main uses .env + compose.yaml (static ports),
 * in a worktree copies main's .env, patches ports, and starts an isolated container.
 *
 * Idempotent: safe to call multiple times.
 */
import { env, envInt, Logger } from '@tailoredin/core';
import type { OrmDbConfig } from '../src/db/orm-config.js';
import { resolveDevContext } from './DevContext.js';
import { assertDockerRunning, composeDown, composeUp, isContainerRunning, waitForPostgres } from './DockerCompose.js';
import { deleteEnvFile, envFileExists, readPorts, type SessionPorts, writeWorktreeEnv } from './EnvFile.js';
import { runMigrations, runSeeds } from './MigrationRunner.js';
import { findFreePort } from './PortFinder.js';

const log = Logger.create('dev-up');

// ── Resolve context ────────────────────────────────────────────────

const ctx = resolveDevContext();

log.info(`Dev environment (${ctx.mode} mode${ctx.worktreeName ? `: ${ctx.worktreeName}` : ''})`);

// ── Preflight ──────────────────────────────────────────────────────

assertDockerRunning();

// ── Handle "already running" ───────────────────────────────────────

if (isContainerRunning(ctx.containerName)) {
  log.info('Database already running — running migrations...');

  let ports: SessionPorts | null = null;
  if (ctx.mode === 'worktree') {
    if (!envFileExists()) {
      throw new Error('Container is running but .env is missing. Run `bun dev:down` first, then `bun dev:up`.');
    }
    ports = await readPorts();
  }

  await runMigrationsForContext(ports);
  done(ports);
  process.exit(0);
}

// ── Handle stale worktree state ────────────────────────────────────

if (ctx.mode === 'worktree' && envFileExists()) {
  log.info('Stale .env found (container not running) — cleaning up...');
  composeDown(ctx);
  deleteEnvFile();
}

// ── Worktree: allocate ports + write .env ──────────────────────────

let ports: SessionPorts | null = null;

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

// ── Start database ─────────────────────────────────────────────────

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

// ── Migrations ─────────────────────────────────────────────────────

log.info('Running migrations...');
try {
  await runMigrationsForContext(ports);
} catch (e) {
  if (ctx.mode === 'worktree') teardownWorktree();
  throw e;
}

// ── Seeds (fresh worktree only) ────────────────────────────────────

if (ctx.mode === 'worktree' && ports) {
  log.info('Seeding database...');
  try {
    await runSeeds(worktreeDbConfig(ports));
  } catch (e) {
    teardownWorktree();
    throw e;
  }
}

// ── Done ───────────────────────────────────────────────────────────

done(ports);

// ── Helpers ────────────────────────────────────────────────────────

function worktreeDbConfig(sessionPorts: SessionPorts): OrmDbConfig {
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

async function runMigrationsForContext(sessionPorts: SessionPorts | null): Promise<void> {
  const dbConfig =
    ctx.mode === 'worktree' && sessionPorts
      ? worktreeDbConfig(sessionPorts)
      : {
          timezone: env('TZ'),
          user: env('POSTGRES_USER'),
          password: env('POSTGRES_PASSWORD'),
          dbName: env('POSTGRES_DB'),
          schema: env('POSTGRES_SCHEMA'),
          host: env('POSTGRES_HOST'),
          port: envInt('POSTGRES_PORT')
        };

  await runMigrations(dbConfig);
}

function done(sessionPorts: SessionPorts | null): void {
  if (ctx.mode === 'worktree' && sessionPorts) {
    log.info(`Session "${ctx.worktreeName}" ready!`);
    log.info(`  API: http://localhost:${sessionPorts.api}`);
    log.info(`  Web: http://localhost:${sessionPorts.web}`);
    log.info(`  DB:  localhost:${sessionPorts.db} (tailoredin_${ctx.worktreeName})`);
    log.info('  Start servers: bun run dev');
  } else {
    log.info('Database ready!');
    log.info(`  DB: localhost:${env('POSTGRES_PORT')} (${env('POSTGRES_DB')})`);
    log.info('  Start servers: bun run dev');
  }
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
