import { type ChildProcess, spawn } from 'node:child_process';
import { resolve } from 'node:path';
import type { FullConfig } from '@playwright/test';
import { deleteServerState } from './server-state.js';

let serverProcess: ChildProcess | null = null;

/**
 * Playwright globalSetup — spawns `bun run infrastructure/dev/e2e-start-servers.ts`.
 *
 * The server script lives in infrastructure/dev/ (not e2e/) so that Bun resolves
 * @mikro-orm/*, @tailoredin/*, testcontainers, and vite from the workspace — not
 * from e2e/node_modules which only has @playwright/test.
 */
export default async function globalSetup(_config: FullConfig): Promise<() => Promise<void>> {
  const repoRoot = resolve(import.meta.dirname, '../..');
  const scriptPath = resolve(repoRoot, 'infrastructure/dev/e2e-start-servers.ts');

  const { webPort, process: proc } = await new Promise<{ webPort: number; process: ChildProcess }>(
    (resolvePromise, reject) => {
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
          resolvePromise({ webPort: Number(match[1]), process: child });
        }
      });

      child.on('error', reject);
      child.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          reject(new Error(`e2e-start-servers.ts exited with code ${code}`));
        }
      });

      setTimeout(() => reject(new Error('Server startup timed out after 120s')), 120_000);
    }
  );

  serverProcess = proc;
  process.env.E2E_BASE_URL = `http://localhost:${webPort}`;

  return async () => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      await new Promise<void>((r) => {
        serverProcess!.on('exit', () => r());
        setTimeout(r, 10_000);
      });
    }
    deleteServerState();
  };
}
