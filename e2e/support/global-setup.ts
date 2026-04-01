import type { FullConfig } from '@playwright/test';
import { MikroORM } from '@mikro-orm/postgresql';
import { GenericContainer, Wait } from 'testcontainers';
import { createServer, type ViteDevServer } from 'vite';
import { createOrmConfig } from '../../infrastructure/src/db/orm-config.js';
import { DatabaseSeeder } from '../../infrastructure/src/db/seeds/DatabaseSeeder.js';
import { writeServerState } from './server-state.js';

let viteServer: ViteDevServer | null = null;

export default async function globalSetup(_config: FullConfig): Promise<() => Promise<void>> {
  const apiPort = 18000 + Math.floor(Math.random() * 1000);
  const webPort = 15173 + Math.floor(Math.random() * 1000);

  // 1. Start Postgres via Testcontainers
  console.log('[e2e] Starting Postgres container...');
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
  console.log(`[e2e] Postgres running on ${dbHost}:${dbPort}`);

  // 2. Run migrations + seeds
  console.log('[e2e] Running migrations and seeds...');
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
  await orm.seeder.seed(DatabaseSeeder);
  await orm.close(true);

  // 3. Start API server
  console.log(`[e2e] Starting API on port ${apiPort}...`);

  // Set ALL env vars BEFORE importing the API module.
  // api/src/container.ts reads these eagerly via env()/envInt()/envBool():
  //   - DB: TZ, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_SCHEMA, POSTGRES_HOST, POSTGRES_PORT
  //   - Scraper: LINKEDIN_EMAIL, LINKEDIN_PASSWORD, HEADLESS, SLOW_MO
  //   - Optional: OPENAI_API_KEY, OPENAI_PROJECT_ID (uses envOptional, safe to omit)
  //   - Port: API_PORT (read from process.env directly)
  process.env.TZ = 'UTC';
  process.env.POSTGRES_USER = 'test';
  process.env.POSTGRES_PASSWORD = 'test';
  process.env.POSTGRES_DB = 'test';
  process.env.POSTGRES_SCHEMA = 'public';
  process.env.POSTGRES_HOST = dbHost;
  process.env.POSTGRES_PORT = String(dbPort);
  process.env.API_PORT = String(apiPort);
  process.env.LINKEDIN_EMAIL = 'test@test.com';
  process.env.LINKEDIN_PASSWORD = 'test';
  process.env.HEADLESS = 'true';
  process.env.SLOW_MO = '0';

  // Dynamic import so env vars are set first
  await import('../../api/src/index.js');

  // Wait for API to be ready
  await waitForHealth(`http://localhost:${apiPort}/health`);
  console.log('[e2e] API ready');

  // 4. Start Vite dev server
  console.log(`[e2e] Starting Vite on port ${webPort}...`);
  viteServer = await createServer({
    root: new URL('../../web', import.meta.url).pathname,
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
  console.log(`[e2e] Vite ready at http://localhost:${webPort}`);

  // 5. Write state for playwright.config.ts and global-teardown.ts
  writeServerState({
    webPort,
    apiPort,
    dbPort,
    containerId: container.getId()
  });

  // Return teardown function
  return async () => {
    console.log('[e2e] Tearing down...');
    if (viteServer) {
      await viteServer.close();
    }
    await container.stop();
    console.log('[e2e] Teardown complete');
  };
}

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
