import type { FullConfig } from '@playwright/test';
import { deleteServerState } from './server-state.js';

export default async function globalTeardown(_config: FullConfig): Promise<void> {
  deleteServerState();
}
