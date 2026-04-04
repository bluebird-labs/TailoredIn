import { existsSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import type { OrmDbConfig } from '../src/db/orm-config.js';
import type { DevContext } from './DevContext.js';
import { findFreePort } from './PortFinder.js';

const SESSION_FILE = '.wt-session.json';

export interface WorktreeSession {
  dbPort: number;
  apiPort: number;
  webPort: number;
  dbName: string;
  projectName: string;
  containerName: string;
}

function sessionPath(): string {
  return resolve(SESSION_FILE);
}

export function sessionExists(): boolean {
  return existsSync(sessionPath());
}

export async function allocateSession(ctx: DevContext): Promise<WorktreeSession> {
  const dbPort = await findFreePort(5432);
  const apiPort = await findFreePort(8000);
  const webPort = await findFreePort(5173);
  const dbName = `tailoredin_${ctx.worktreeName}`;

  return {
    dbPort,
    apiPort,
    webPort,
    dbName,
    projectName: ctx.projectName,
    containerName: ctx.containerName
  };
}

export async function readSession(): Promise<WorktreeSession> {
  const path = sessionPath();
  if (!existsSync(path)) {
    throw new Error('.wt-session.json not found. Run `bun wt:up` first.');
  }
  return JSON.parse(await Bun.file(path).text()) as WorktreeSession;
}

export async function writeSession(session: WorktreeSession): Promise<void> {
  await Bun.write(sessionPath(), JSON.stringify(session, null, 2));
}

export function deleteSession(): void {
  try {
    unlinkSync(sessionPath());
  } catch {
    // Already gone.
  }
}

export function toOrmConfig(session: WorktreeSession): OrmDbConfig {
  return {
    timezone: 'UTC',
    user: 'postgres',
    password: 'postgres',
    dbName: session.dbName,
    schema: 'public',
    host: 'localhost',
    port: session.dbPort
  };
}

export function toProcessEnv(session: WorktreeSession): Record<string, string> {
  return {
    TZ: 'UTC',
    POSTGRES_USER: 'postgres',
    POSTGRES_PASSWORD: 'postgres',
    POSTGRES_DB: session.dbName,
    POSTGRES_SCHEMA: 'public',
    POSTGRES_HOST: 'localhost',
    POSTGRES_PORT: String(session.dbPort),
    API_PORT: String(session.apiPort),
    VITE_PORT: String(session.webPort),
    COMPOSE_PROJECT_NAME: session.projectName
  };
}
