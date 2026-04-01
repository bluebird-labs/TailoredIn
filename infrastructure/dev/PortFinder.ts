import { createServer } from 'node:net';

/**
 * Find a free TCP port starting from `base`, scanning up to `base + maxAttempts`.
 * Uses a brief listen+close on 127.0.0.1 to confirm availability.
 */
export async function findFreePort(base: number, maxAttempts = 100): Promise<number> {
  for (let port = base; port <= base + maxAttempts; port++) {
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No free port found in range ${base}–${base + maxAttempts}`);
}

function isPortFree(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen(port, '0.0.0.0');
  });
}
