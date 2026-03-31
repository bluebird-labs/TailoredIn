import { existsSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';

const ENV_FILE = '.env';

export type SessionPorts = { db: number; api: number; web: number };

export function envFilePath(): string {
  return resolve(ENV_FILE);
}

export function envFileExists(): boolean {
  return existsSync(envFilePath());
}

/**
 * Read the main repo's `.env`, override port/DB values with worktree-specific
 * values, and write the merged result to the worktree's `.env`.
 */
export async function writeWorktreeEnv(repoRoot: string, overrides: Record<string, string>): Promise<void> {
  const mainEnvPath = resolve(repoRoot, '.env');
  const mainVars = existsSync(mainEnvPath) ? parseEnvFile(await Bun.file(mainEnvPath).text()) : {};
  const merged = { ...mainVars, ...overrides };
  const lines = Object.entries(merged).map(([k, v]) => `${k}=${v}`);
  lines.push(''); // trailing newline
  await Bun.write(envFilePath(), lines.join('\n'));
}

/**
 * Read ports from an existing `.env` file.
 * Used when the container is already running and we need to recover port info.
 */
export async function readPorts(): Promise<SessionPorts> {
  const vars = parseEnvFile(await Bun.file(envFilePath()).text());
  return {
    db: Number(vars.POSTGRES_PORT),
    api: Number(vars.API_PORT),
    web: Number(vars.VITE_PORT)
  };
}

export function deleteEnvFile(): void {
  try {
    unlinkSync(envFilePath());
  } catch {
    // Already gone.
  }
}

function parseEnvFile(text: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq > 0) env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return env;
}
