#!/usr/bin/env tsx
/**
 * `pnpm dev:up` — Generate .env.local, ensure deps installed, then hand off to turbo.
 *
 * This script does two things turbo cannot:
 * 1. Generate `.env.local` with branch-based ports
 * 2. Load env vars into the process tree so turbo inherits them
 *
 * Then it execs turbo. All orchestration (Docker → migrate → seed → dev servers)
 * lives in turbo.json's dependsOn chain.
 */
import { execSync, spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Logger } from '@tailoredin/core';
import { config } from 'dotenv';
import { checkPnpmInstall } from './PnpmInstall.js';
import { portsForBranch, projectName } from './ports.js';

const log = Logger.create('dev:env');
const repoRoot = resolve(import.meta.dirname, '../../..');

config({ path: resolve(repoRoot, '.env') });

const branch = execSync('git branch --show-current').toString().trim() || 'detached';
const ports = portsForBranch(branch);

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
  VITE_PORT: String(ports.webPort),
  JWT_SECRET: 'dev-secret-key-minimum-length-32-characters-ok',
  JWT_EXPIRES_IN_SECONDS: '604800',
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY ?? 'missing_api_key',
  GIT_BRANCH: branch
};

const envContent = Object.entries(envVars)
  .map(([k, v]) => `${k}=${v}`)
  .join('\n');
writeFileSync(resolve(repoRoot, '.env.local'), `${envContent}\n`);

writeFileSync(
  resolve(repoRoot, '.dev-state.json'),
  JSON.stringify(
    {
      branch,
      ports: { db: ports.dbPort, api: ports.apiPort, web: ports.webPort },
      projectName: projectName(branch)
    },
    null,
    2
  )
);

log.info(`Branch: ${branch} | DB=${ports.dbPort} API=${ports.apiPort} Web=${ports.webPort}`);

Object.assign(process.env, envVars);

checkPnpmInstall();

const result = spawnSync('pnpm', ['turbo', 'run', 'dev'], {
  stdio: 'inherit',
  env: process.env,
  cwd: repoRoot
});

process.exit(result.status ?? 1);
