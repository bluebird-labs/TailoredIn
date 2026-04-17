import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const LOG_DIR = join(tmpdir(), 'tailoredin', 'logs');

export function getLogDirectory(...segments: string[]): string {
  const dir = join(LOG_DIR, ...segments);
  mkdirSync(dir, { recursive: true });
  return dir;
}
