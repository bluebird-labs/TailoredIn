import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const STATE_PATH = join(import.meta.dirname, '..', '.server-state.json');

export type ServerState = {
  webPort: number;
  apiPort: number;
  dbPort: number;
};

export function writeServerState(state: ServerState): void {
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

export function readServerState(): ServerState {
  if (!existsSync(STATE_PATH)) {
    throw new Error('Server state file not found. Did global-setup run?');
  }
  return JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
}

export function deleteServerState(): void {
  if (existsSync(STATE_PATH)) {
    unlinkSync(STATE_PATH);
  }
}
