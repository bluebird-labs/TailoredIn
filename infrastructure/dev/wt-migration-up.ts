#!/usr/bin/env bun
/**
 * `bun wt:migration:up` — Run pending migrations in the worktree database.
 */
import { Logger } from '@tailoredin/core';
import { requireWorktree } from './ContextGuard.js';
import { resolveDevContext } from './DevContext.js';
import { runMigrations } from './MigrationRunner.js';
import { readSession, toOrmConfig } from './WorktreeSession.js';

const log = Logger.create('wt:migration:up');

const ctx = resolveDevContext();
requireWorktree(ctx);

const session = await readSession();
log.info(`Running migrations on ${session.dbName}...`);
await runMigrations(toOrmConfig(session));
