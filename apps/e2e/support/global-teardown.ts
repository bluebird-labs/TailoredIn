import { existsSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import type { FullConfig } from '@playwright/test';
import { deleteServerState } from './server-state.js';

const AUTH_STATE_PATH = resolve(import.meta.dirname, '..', '.auth-state.json');

export default async function globalTeardown(_config: FullConfig): Promise<void> {
  deleteServerState();
  if (existsSync(AUTH_STATE_PATH)) {
    unlinkSync(AUTH_STATE_PATH);
  }
}
