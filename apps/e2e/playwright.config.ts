import { resolve } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const authStatePath = resolve(import.meta.dirname, '.auth-state.json');

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : [['html', { open: 'on-failure' }]],

  globalSetup: './support/global-setup.ts',
  globalTeardown: './support/global-teardown.ts',

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    storageState: authStatePath,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
