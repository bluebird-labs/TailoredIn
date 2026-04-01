import type { FullConfig } from '@playwright/test';
import { deleteServerState, readServerState } from './server-state.js';

export default async function globalTeardown(_config: FullConfig): Promise<void> {
  try {
    const state = readServerState();
    console.log(`[e2e] Global teardown — cleaning up (ports: web=${state.webPort}, api=${state.apiPort})`);
  } catch {
    // State file already cleaned up by setup's teardown function
  } finally {
    deleteServerState();
  }
}
