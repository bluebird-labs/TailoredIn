import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { Logger } from '@tailoredin/core';

const log = Logger.create('bun-install');

/**
 * Ensure node_modules is up-to-date with bun.lock.
 * Runs `bun install` if node_modules is missing or stale.
 */
export function checkBunInstall(): void {
  const lockfile = resolve('.', 'bun.lock');
  const nodeModules = resolve('.', 'node_modules');

  if (!existsSync(nodeModules)) {
    log.info('node_modules missing — running bun install...');
    const result = Bun.spawnSync(['bun', 'install'], { stdout: 'inherit', stderr: 'inherit' });
    if (result.exitCode !== 0) throw new Error('bun install failed.');
    return;
  }

  if (existsSync(lockfile)) {
    const lockMtime = statSync(lockfile).mtimeMs;
    const nmMtime = statSync(nodeModules).mtimeMs;
    if (lockMtime > nmMtime) {
      log.info('bun.lock is newer than node_modules — running bun install...');
      const result = Bun.spawnSync(['bun', 'install'], { stdout: 'inherit', stderr: 'inherit' });
      if (result.exitCode !== 0) throw new Error('bun install failed.');
    }
  }
}
