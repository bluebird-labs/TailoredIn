#!/usr/bin/env bun
/**
 * `bun dev:up` — Start the full dev environment (main branch only).
 *
 * 1. Checks if `bun install` is needed
 * 2. Starts PostgreSQL via Docker Compose
 * 3. Runs all pending migrations
 * 4. Runs the DatabaseSeeder
 * 5. Spawns API + web dev servers
 *
 * Reads config from `.env` via Bun's `--env-file` loading.
 * Idempotent: safe to call multiple times. Ctrl+C stops everything.
 */
import { resolve } from 'node:path';
import { env, envInt, Logger } from '@tailoredin/core';
import { checkBunInstall } from './BunInstall.js';
import { requireMain } from './ContextGuard.js';
import { resolveDevContext } from './DevContext.js';
import { assertDockerRunning, composeUp, isContainerRunning, waitForPostgres } from './DockerCompose.js';
import { runMigrations } from './MigrationRunner.js';
import { runSeeds } from './SeedRunner.js';

const log = Logger.create('dev:up');

// ── Preflight ────────────────────────────────────────────────────

const ctx = resolveDevContext();
requireMain(ctx);

log.info('Dev environment (main)');

checkBunInstall();
assertDockerRunning();

// ── Start or verify database ─────────────────────────────────────

if (isContainerRunning(ctx.containerName)) {
  log.info('Database already running.');
} else {
  log.info('Starting PostgreSQL...');
  composeUp(ctx);
  log.info('Waiting for PostgreSQL...');
  await waitForPostgres(ctx.containerName);
}

// ── Migrations + seeds ───────────────────────────────────────────

const dbConfig = {
  timezone: env('TZ'),
  user: env('POSTGRES_USER'),
  password: env('POSTGRES_PASSWORD'),
  dbName: env('POSTGRES_DB'),
  schema: env('POSTGRES_SCHEMA'),
  host: env('POSTGRES_HOST'),
  port: envInt('POSTGRES_PORT')
};

log.info('Running migrations...');
await runMigrations(dbConfig);

log.info('Running seeds...');
await runSeeds(dbConfig);

// ── Start dev servers ────────────────────────────────────────────

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

log.info('Dev environment ready!');
log.info(`  DB: localhost:${env('POSTGRES_PORT')} (${env('POSTGRES_DB')})`);

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

await Promise.race([apiProc.exited, webProc.exited]);
shutdown();
