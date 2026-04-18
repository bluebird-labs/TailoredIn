import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE_DIR = join(tmpdir(), 'tailoredin');

function getTmpSubdirectory(subdirectory: string, ...segments: string[]): string {
  const dir = join(BASE_DIR, subdirectory, ...segments);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function getLogDirectory(...segments: string[]): string {
  return getTmpSubdirectory('logs', ...segments);
}

export function getBackupDirectory(...segments: string[]): string {
  return getTmpSubdirectory('backups', ...segments);
}
