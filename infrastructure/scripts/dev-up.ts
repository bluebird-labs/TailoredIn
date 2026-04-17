#!/usr/bin/env tsx
/**
 * `pnpm dev:up` — Start the full dev environment.
 *
 * Supports two profiles:
 *   --profile local       (default) Docker Postgres, branch-based port allocation
 *   --profile production   Read .env.production, no Docker
 *
 * Idempotent: safe to call multiple times. Ctrl+C stops everything.
 */
import { execSync, spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { envInt, Logger } from '@tailoredin/core';
import {
  assertDockerRunning,
  composeUp,
  isContainerRunning,
  resolveComposeContext,
  waitForPostgres
} from './DockerCompose.js';
import { runMigrations } from './MigrationRunner.js';
import { checkPnpmInstall } from './PnpmInstall.js';
import { portsForBranch, projectName } from './ports.js';
import { runSeeds } from './SeedRunner.js';

const log = Logger.create('dev:up');

// ── Parse CLI args ──────────────────────────────────────────────────

const profileArg = process.argv.find((_, i, a) => a[i - 1] === '--profile') ?? 'local';
if (profileArg !== 'local' && profileArg !== 'production') {
  log.error(`Unknown profile: ${profileArg}. Use --profile local|production`);
  process.exit(1);
}

const repoRoot = resolve(import.meta.dirname, '../..');

if (profileArg === 'local') {
  await startLocal();
} else {
  await startProduction();
}

// ── Local profile ───────────────────────────────────────────────────

async function startLocal(): Promise<void> {
  const branch = execSync('git branch --show-current').toString().trim() || 'detached';
  const ports = portsForBranch(branch);
  const project = projectName(branch);

  log.info(`Profile: local | Branch: ${branch} | Ports: DB=${ports.dbPort} API=${ports.apiPort} Web=${ports.webPort}`);

  // Generate .env.local
  const envVars: Record<string, string> = {
    APP_PROFILE: 'local',
    NODE_ENV: 'development',
    POSTGRES_HOST: 'localhost',
    POSTGRES_PORT: String(ports.dbPort),
    POSTGRES_USER: 'postgres',
    POSTGRES_PASSWORD: 'postgres',
    POSTGRES_DB: 'tailored_in',
    POSTGRES_SCHEMA: 'public',
    TZ: 'UTC',
    API_PORT: String(ports.apiPort),
    JWT_SECRET: 'dev-secret-key-minimum-length-32-characters-ok',
    JWT_EXPIRES_IN_SECONDS: '604800',
    CLAUDE_API_KEY: process.env.CLAUDE_API_KEY ?? 'missing_api_key'
  };

  const envContent = Object.entries(envVars)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  writeFileSync(resolve(repoRoot, '.env.local'), `${envContent}\n`);
  Object.assign(process.env, envVars);

  checkPnpmInstall();
  assertDockerRunning();

  // Start or verify database
  const ctx = resolveComposeContext(branch, repoRoot);

  if (isContainerRunning(ctx.containerName)) {
    log.info('Database already running.');
  } else {
    log.info('Starting PostgreSQL...');
    composeUp(ctx);
    log.info('Waiting for PostgreSQL...');
    await waitForPostgres(ctx.containerName);
  }

  // Migrations + seeds
  const dbConfig = {
    timezone: envVars.TZ,
    user: envVars.POSTGRES_USER,
    password: envVars.POSTGRES_PASSWORD,
    dbName: envVars.POSTGRES_DB,
    schema: envVars.POSTGRES_SCHEMA,
    host: envVars.POSTGRES_HOST,
    port: ports.dbPort
  };

  log.info('Running migrations...');
  await runMigrations({ dbConfig, containerName: ctx.containerName, repoRoot });

  log.info('Running seeds...');
  await runSeeds(dbConfig);

  // Start dev servers
  log.info('Starting dev servers...');

  const apiProc = spawn('npx', ['tsx', '--watch', 'api/src/main.ts'], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env
  });

  const webProc = spawn('pnpm', ['--filter', '@tailoredin/web', 'run', 'dev', '--port', String(ports.webPort)], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env
  });

  log.info('Dev environment ready!');
  log.info(`  DB: localhost:${ports.dbPort} (${envVars.POSTGRES_DB})`);
  log.info(`  API: http://localhost:${ports.apiPort}`);
  log.info(`  Web: http://localhost:${ports.webPort}`);

  // Write state file
  writeFileSync(
    resolve(repoRoot, '.dev-state.json'),
    JSON.stringify(
      {
        profile: 'local',
        branch,
        pids: { api: apiProc.pid, web: webProc.pid },
        ports: { db: ports.dbPort, api: ports.apiPort, web: ports.webPort },
        projectName: project
      },
      null,
      2
    )
  );

  // Signal handling
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

  await Promise.race([
    new Promise<void>(res =>
      apiProc.on('exit', code => {
        if (code !== 0) log.error(`API exited with code ${code}`);
        res();
      })
    ),
    new Promise<void>(res =>
      webProc.on('exit', code => {
        if (code !== 0) log.error(`Web exited with code ${code}`);
        res();
      })
    )
  ]);
  shutdown();
}

// ── Production profile ──────────────────────────────────────────────

async function startProduction(): Promise<void> {
  const envFile = resolve(repoRoot, '.env.production');
  try {
    readFileSync(envFile, 'utf-8');
  } catch {
    log.error('.env.production not found. Create it from .env.production.example');
    process.exit(1);
  }

  log.info('Profile: production');

  // Load .env.production into process.env
  const lines = readFileSync(envFile, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    const value = trimmed.slice(eqIdx + 1);
    process.env[key] = value;
  }

  const apiPort = envInt('API_PORT');
  const childEnv = { ...process.env };

  const apiProc = spawn('npx', ['tsx', 'api/src/main.ts'], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: childEnv
  });

  const webProc = spawn('pnpm', ['--filter', '@tailoredin/web', 'run', 'dev'], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: childEnv
  });

  writeFileSync(
    resolve(repoRoot, '.dev-state.json'),
    JSON.stringify(
      {
        profile: 'production',
        pids: { api: apiProc.pid, web: webProc.pid },
        ports: { api: apiPort }
      },
      null,
      2
    )
  );

  log.info(`API: http://localhost:${apiPort}`);

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

  await Promise.race([
    new Promise<void>(res => apiProc.on('exit', () => res())),
    new Promise<void>(res => webProc.on('exit', () => res()))
  ]);
  shutdown();
}
