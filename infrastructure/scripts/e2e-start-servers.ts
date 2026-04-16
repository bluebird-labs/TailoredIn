#!/usr/bin/env bun
/**
 * Boots Testcontainers Postgres + API + Vite for e2e tests.
 * Lives in infrastructure/scripts/ so Bun resolves @mikro-orm/* from
 * infrastructure/node_modules (correct versions).
 *
 * Writes server state to e2e/.server-state.json, then keeps running until killed.
 * Prints "E2E_READY <webPort> <apiPort> <dbPort>" to stdout when ready.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { MikroORM } from '@mikro-orm/postgresql';
import { Logger } from '@tailoredin/core';
import { GenericContainer, Wait } from 'testcontainers';
import { createServer } from 'vite';
import { createOrmConfig } from '../src/db/orm-config.js';
import { E2eSeeder } from '../src/db/seeds/E2eSeeder.js';

const log = Logger.create('e2e');
const REPO_ROOT = resolve(import.meta.dirname, '../..');
const STATE_PATH = resolve(REPO_ROOT, 'e2e/.server-state.json');

const apiPort = 18000 + Math.floor(Math.random() * 1000);
const webPort = 15173 + Math.floor(Math.random() * 1000);

// 1. Start Postgres via Testcontainers
log.info('Starting Postgres container...');
const container = await new GenericContainer('postgres:17-alpine')
  .withEnvironment({
    POSTGRES_USER: 'test',
    POSTGRES_PASSWORD: 'test',
    POSTGRES_DB: 'test'
  })
  .withExposedPorts(5432)
  .withWaitStrategy(Wait.forLogMessage(/ready to accept connections/, 2))
  .start();

const dbPort = container.getMappedPort(5432);
const dbHost = container.getHost();
log.info(`Postgres running on ${dbHost}:${dbPort}`);

// 2. Run migrations + seeds
log.info('Running migrations and seeds...');
const ormConfig = createOrmConfig({
  timezone: 'UTC',
  user: 'test',
  password: 'test',
  dbName: 'test',
  schema: 'public',
  host: dbHost,
  port: dbPort
});
const orm = await MikroORM.init(ormConfig);
await orm.migrator.up();
await orm.seeder.seed(E2eSeeder);
await orm.close(true);

// 3. Start API server
log.info(`Starting API on port ${apiPort}...`);

// Set ALL env vars BEFORE importing the API module.
// api/src/container.ts reads these eagerly via env()/envInt()/envBool().
process.env.TZ = 'UTC';
process.env.POSTGRES_USER = 'test';
process.env.POSTGRES_PASSWORD = 'test';
process.env.POSTGRES_DB = 'test';
process.env.POSTGRES_SCHEMA = 'public';
process.env.POSTGRES_HOST = dbHost;
process.env.POSTGRES_PORT = String(dbPort);
process.env.API_PORT = String(apiPort);
process.env.JWT_SECRET = 'e2e-test-secret-key-minimum-length-32-chars';
process.env.JWT_EXPIRES_IN_SECONDS = '3600';
process.env.LINKEDIN_EMAIL = 'test@test.com';
process.env.LINKEDIN_PASSWORD = 'test';
process.env.HEADLESS = 'true';
process.env.SLOW_MO = '0';

await import('../../api/src/index.js');
await waitForHealth(`http://localhost:${apiPort}/health`);
log.info('API ready');

// 4. Start Vite dev server
log.info(`Starting Vite on port ${webPort}...`);
const viteServer = await createServer({
  root: resolve(REPO_ROOT, 'web'),
  server: {
    port: webPort,
    proxy: {
      '/api': {
        target: `http://localhost:${apiPort}`,
        rewrite: (p: string) => p.replace(/^\/api/, '')
      }
    }
  }
});
await viteServer.listen();
log.info(`Vite ready at http://localhost:${webPort}`);

// 5. Write state + signal readiness (stdout for global-setup.ts, stderr for humans)
writeFileSync(STATE_PATH, JSON.stringify({ webPort, apiPort, dbPort }, null, 2));
// biome-ignore lint/suspicious/noConsole: stdout signal parsed by global-setup.ts
console.log(`E2E_READY ${webPort} ${apiPort} ${dbPort}`);

// Keep alive until killed
process.on('SIGTERM', async () => {
  log.info('Shutting down...');
  await viteServer.close();
  await container.stop();
  process.exit(0);
});

async function waitForHealth(url: string, timeoutMs = 15_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not ready yet
    }
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error(`Health check at ${url} timed out after ${timeoutMs}ms`);
}
