import { spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { Logger } from '@tailoredin/core';

const log = Logger.create('pnpm-install');

export function checkPnpmInstall(): void {
  const lockfile = resolve('.', 'pnpm-lock.yaml');
  const nodeModules = resolve('.', 'node_modules');

  if (!existsSync(nodeModules)) {
    log.info('node_modules missing — running pnpm install...');
    const result = spawnSync('pnpm', ['install'], { stdio: 'inherit' });
    if (result.status !== 0) throw new Error('pnpm install failed.');
    return;
  }

  if (existsSync(lockfile)) {
    const lockMtime = statSync(lockfile).mtimeMs;
    const nmMtime = statSync(nodeModules).mtimeMs;
    if (lockMtime > nmMtime) {
      log.info('pnpm-lock.yaml is newer than node_modules — running pnpm install...');
      const result = spawnSync('pnpm', ['install'], { stdio: 'inherit' });
      if (result.status !== 0) throw new Error('pnpm install failed.');
    }
  }
}
