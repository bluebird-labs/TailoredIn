#!/usr/bin/env bun
/**
 * `bun wt:seed` — Run seeds in the worktree database.
 */
import { Logger } from '@tailoredin/core';
import { requireWorktree } from './ContextGuard.js';
import { resolveDevContext } from './DevContext.js';
import { runSeeds } from './SeedRunner.js';
import { readSession, toOrmConfig } from './WorktreeSession.js';

const log = Logger.create('wt:seed');

const ctx = resolveDevContext();
requireWorktree(ctx);

const session = await readSession();
log.info(`Running seeds on ${session.dbName}...`);
await runSeeds(toOrmConfig(session));
