#!/usr/bin/env bun
/**
 * `bun dev:set-password` / `bun wt:set-password`
 *
 * Sets the password for an account, creating the account if it doesn't exist.
 * Looks up the profile by email and links the account to it.
 *
 * Usage: bun dev:set-password <email> <password>
 */
import { MikroORM } from '@mikro-orm/postgresql';
import { Logger } from '@tailoredin/core';
import { createOrmConfig, type OrmDbConfig } from '../src/db/orm-config.js';
import { resolveDevContext } from './DevContext.js';
import { readSession, toOrmConfig } from './WorktreeSession.js';

const log = Logger.create('set-password');

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  log.error('Usage: bun dev:set-password <email> <password>');
  process.exit(1);
}

const ctx = resolveDevContext();
let dbConfig: OrmDbConfig;

if (ctx.mode === 'worktree') {
  const session = await readSession();
  dbConfig = toOrmConfig(session);
} else {
  const { env, envInt } = await import('@tailoredin/core');
  dbConfig = {
    timezone: env('TZ'),
    user: env('POSTGRES_USER'),
    password: env('POSTGRES_PASSWORD'),
    dbName: env('POSTGRES_DB'),
    schema: env('POSTGRES_SCHEMA'),
    host: env('POSTGRES_HOST'),
    port: envInt('POSTGRES_PORT')
  };
}

const orm = await MikroORM.init(createOrmConfig(dbConfig));

try {
  const conn = orm.em.getConnection();

  const profiles = await conn.execute<{ id: string }[]>(`SELECT id FROM profiles WHERE email = ?`, [email]);
  if (profiles.length === 0) {
    log.error(`No profile found with email: ${email}`);
    process.exit(1);
  }
  const profileId = profiles[0].id;

  const hash = await Bun.password.hash(password);

  const existing = await conn.execute<{ id: string }[]>(`SELECT id FROM accounts WHERE profile_id = ?`, [profileId]);

  if (existing.length > 0) {
    await conn.execute(`UPDATE accounts SET email = ?, password_hash = ?, updated_at = NOW() WHERE id = ?`, [
      email,
      hash,
      existing[0].id
    ]);
    log.info(`Updated password for ${email}`);
  } else {
    const id = crypto.randomUUID();
    await conn.execute(
      `INSERT INTO accounts (id, email, password_hash, profile_id, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [id, email, hash, profileId]
    );
    log.info(`Created account for ${email}`);
  }
} finally {
  await orm.close();
}
