import { defineConfig, devices } from '@playwright/test';
import { readServerState } from './support/server-state.js';

function getBaseURL(): string {
  try {
    const state = readServerState();
    return `http://localhost:${state.webPort}`;
  } catch {
    return 'http://localhost:5173';
  }
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['github']]
    : [['html', { open: 'on-failure' }]],

  globalSetup: './support/global-setup.ts',
  globalTeardown: './support/global-teardown.ts',

  use: {
    baseURL: getBaseURL(),
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
