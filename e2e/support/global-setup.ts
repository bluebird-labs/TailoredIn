import { type ChildProcess, spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { FullConfig } from '@playwright/test';
import { deleteServerState } from './server-state.js';

let serverProcess: ChildProcess | null = null;

const AUTH_STATE_PATH = resolve(import.meta.dirname, '..', '.auth-state.json');

/**
 * Playwright globalSetup — spawns `bun run infrastructure/scripts/e2e-start-servers.ts`.
 *
 * The server script lives in infrastructure/scripts/ (not e2e/) so that Bun resolves
 * @mikro-orm/*, @tailoredin/*, testcontainers, and vite from the workspace — not
 * from e2e/node_modules which only has @playwright/test.
 */
export default async function globalSetup(_config: FullConfig): Promise<() => Promise<void>> {
  const repoRoot = resolve(import.meta.dirname, '../..');
  const scriptPath = resolve(repoRoot, 'infrastructure/scripts/e2e-start-servers.ts');

  const { webPort, apiPort, process: proc } = await new Promise<{
    webPort: number;
    apiPort: number;
    process: ChildProcess;
  }>((resolvePromise, reject) => {
    const child = spawn('bun', ['run', scriptPath], {
      stdio: ['ignore', 'pipe', 'inherit'],
      cwd: repoRoot,
      env: { ...process.env, NODE_ENV: 'test', BUN_CONFIG_NO_DOT_ENV: '1' }
    });

    let stdout = '';

    child.stdout!.on('data', (data: Buffer) => {
      stdout += data.toString();
      const match = stdout.match(/E2E_READY (\d+) (\d+) (\d+)/);
      if (match) {
        resolvePromise({ webPort: Number(match[1]), apiPort: Number(match[2]), process: child });
      }
    });

    child.on('error', reject);
    child.on('exit', code => {
      if (code !== 0 && code !== null) {
        reject(new Error(`e2e-start-servers.ts exited with code ${code}`));
      }
    });

    setTimeout(() => reject(new Error('Server startup timed out after 120s')), 120_000);
  });

  serverProcess = proc;
  process.env.E2E_BASE_URL = `http://localhost:${webPort}`;

  // Authenticate via the API and save token as Playwright storageState
  const token = await authenticate(apiPort);
  saveAuthState(`http://localhost:${webPort}`, token);

  return async () => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      await new Promise<void>(r => {
        serverProcess!.on('exit', () => r());
        setTimeout(r, 10_000);
      });
    }
    deleteServerState();
  };
}

/**
 * Calls POST /auth/login on the API server and returns the JWT token.
 */
async function authenticate(apiPort: number): Promise<string> {
  const res = await fetch(`http://localhost:${apiPort}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'jane@example.com', password: 'password123' })
  });

  if (!res.ok) {
    throw new Error(`Authentication failed: ${res.status} ${await res.text()}`);
  }

  const body = (await res.json()) as { data: { token: string } };
  return body.data.token;
}

/**
 * Writes a Playwright storageState JSON file that injects the JWT into localStorage.
 */
function saveAuthState(origin: string, token: string): void {
  const state = {
    cookies: [],
    origins: [
      {
        origin,
        localStorage: [{ name: 'tailoredin_jwt', value: token }]
      }
    ]
  };
  writeFileSync(AUTH_STATE_PATH, JSON.stringify(state, null, 2));
}
