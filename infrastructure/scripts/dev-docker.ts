#!/usr/bin/env tsx
/**
 * Start PostgreSQL via Docker Compose and wait for readiness.
 * Reads POSTGRES_PORT, GIT_BRANCH from environment (set by dev:env, passed through by turbo).
 */
import { execSync } from 'node:child_process';
import { Logger } from '@tailoredin/core';
import {
  assertDockerRunning,
  composeUp,
  isContainerRunning,
  resolveComposeContext,
  waitForPostgres
} from './DockerCompose.js';

const log = Logger.create('dev:docker');
const repoRoot = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
const branch = process.env.GIT_BRANCH ?? (execSync('git branch --show-current').toString().trim() || 'detached');

assertDockerRunning();

const ctx = resolveComposeContext(branch, repoRoot);

if (isContainerRunning(ctx.containerName)) {
  log.info('Database container already running.');
} else {
  log.info('Starting PostgreSQL...');
  composeUp(ctx);
}

log.info('Waiting for PostgreSQL...');
await waitForPostgres(ctx.containerName);
log.info('PostgreSQL ready.');
