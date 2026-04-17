#!/usr/bin/env tsx
/**
 * Run pending database migrations.
 * Reads DB config from environment (passed through by turbo's passThroughEnv).
 */
import { execSync } from 'node:child_process';
import { env, envInt, Logger } from '@tailoredin/core';
import { resolveComposeContext } from './DockerCompose.js';
import { runMigrations } from './MigrationRunner.js';

const log = Logger.create('dev:migrate');
const repoRoot = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
const branch = process.env.GIT_BRANCH ?? (execSync('git branch --show-current').toString().trim() || 'detached');

const dbConfig = {
  timezone: env('TZ'),
  user: env('POSTGRES_USER'),
  password: env('POSTGRES_PASSWORD'),
  dbName: env('POSTGRES_DB'),
  schema: env('POSTGRES_SCHEMA'),
  host: env('POSTGRES_HOST'),
  port: envInt('POSTGRES_PORT')
};

const ctx = resolveComposeContext(branch, repoRoot);

log.info('Running migrations...');
await runMigrations({ dbConfig, containerName: ctx.containerName, repoRoot });
log.info('Done.');
