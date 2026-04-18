import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dirname, '../../..');
const BASE_DIR = join(REPO_ROOT, '.local');

function getSubdirectory(subdirectory: string, ...segments: string[]): string {
  const dir = join(BASE_DIR, subdirectory, ...segments);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function getLogDirectory(...segments: string[]): string {
  return getSubdirectory('logs', ...segments);
}

export function getBackupDirectory(...segments: string[]): string {
  return getSubdirectory('backups', ...segments);
}
