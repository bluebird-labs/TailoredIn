#!/usr/bin/env tsx
/**
 * `pnpm dev:set-password <email> <password>`
 *
 * Sets the password for an account, creating the account if it doesn't exist.
 * Reads database config from environment (load via --env-file=.env.local).
 */
import { MikroORM } from '@mikro-orm/postgresql';
import { env, envInt, Logger } from '@tailoredin/core';
import { hash } from 'argon2';
import { createOrmConfig } from '../src/db/orm-config.js';

const log = Logger.create('set-password');

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  log.error('Usage: pnpm dev:set-password <email> <password>');
  process.exit(1);
}

const dbConfig = {
  timezone: env('TZ'),
  user: env('POSTGRES_USER'),
  password: env('POSTGRES_PASSWORD'),
  dbName: env('POSTGRES_DB'),
  schema: env('POSTGRES_SCHEMA'),
  host: env('POSTGRES_HOST'),
  port: envInt('POSTGRES_PORT')
};

const orm = await MikroORM.init(createOrmConfig(dbConfig));

try {
  const conn = orm.em.getConnection();

  const profiles = await conn.execute<{ id: string }[]>(`SELECT id FROM profiles WHERE email = ?`, [email]);
  if (profiles.length === 0) {
    log.error(`No profile found with email: ${email}`);
    process.exit(1);
  }
  const profileId = profiles[0].id;

  const passwordHash = await hash(password);

  const existing = await conn.execute<{ id: string }[]>(`SELECT id FROM accounts WHERE profile_id = ?`, [profileId]);

  if (existing.length > 0) {
    await conn.execute(`UPDATE accounts SET email = ?, password_hash = ?, updated_at = NOW() WHERE id = ?`, [
      email,
      passwordHash,
      existing[0].id
    ]);
    log.info(`Updated password for ${email}`);
  } else {
    const id = crypto.randomUUID();
    await conn.execute(
      `INSERT INTO accounts (id, email, password_hash, profile_id, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [id, email, passwordHash, profileId]
    );
    log.info(`Created account for ${email}`);
  }
} finally {
  await orm.close();
}
