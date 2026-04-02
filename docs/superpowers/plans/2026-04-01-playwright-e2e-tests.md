# Playwright E2E Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a self-contained Playwright e2e test suite that boots Testcontainers Postgres + API + Vite, runs browser-based tests against real UI/API/DB, and integrates into CI.

**Architecture:** A standalone `e2e/` directory at the repo root with its own `package.json` (not a workspace member). `global-setup.ts` spins up a Testcontainers Postgres, runs MikroORM migrations + seeds, starts the Elysia API and Vite dev server programmatically, then Playwright runs Chromium-based tests against the live app. `global-teardown.ts` cleans everything up.

**Tech Stack:** Playwright Test, Testcontainers, MikroORM (migrations/seeds), Vite (programmatic API), Elysia, Bun

**Spec:** `docs/superpowers/specs/2026-04-01-playwright-e2e-tests.md`

---

## File Structure

```
e2e/
  package.json                 ← Playwright + testcontainers deps
  tsconfig.json                ← TypeScript config for e2e
  playwright.config.ts         ← Playwright runner configuration
  support/
    global-setup.ts            ← Testcontainers + API + Vite boot
    global-teardown.ts         ← Cleanup
    server-state.ts            ← Read/write server ports to temp file
  tests/
    resume/
      headlines.spec.ts        ← CRUD headlines via table + dialog
      education.spec.ts        ← CRUD education entries via cards + dialog
    jobs/
      job-list.spec.ts         ← Job list loads, filtering works
```

---

## Task 1: Scaffold `e2e/` package

**Files:**
- Create: `e2e/package.json`
- Create: `e2e/tsconfig.json`
- Modify: `package.json` (root — add `test:e2e` scripts)

- [ ] **Step 1: Create `e2e/package.json`**

```json
{
  "name": "e2e",
  "private": true,
  "scripts": {
    "test": "bunx playwright test",
    "test:ui": "bunx playwright test --ui",
    "test:headed": "bunx playwright test --headed"
  },
  "devDependencies": {
    "@playwright/test": "^1.50.0",
    "testcontainers": "^10.0.0"
  }
}
```

Note: This package is deliberately NOT listed in root `package.json` `workspaces` — e2e tests should not run with `bun run test`.

- [ ] **Step 2: Create `e2e/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": ".",
    "paths": {
      "@tailoredin/infrastructure/*": ["../infrastructure/src/*"],
      "@tailoredin/infrastructure": ["../infrastructure/src/index.ts"]
    }
  },
  "include": ["**/*.ts"]
}
```

- [ ] **Step 3: Add root scripts**

Add to root `package.json` scripts:

```json
"test:e2e": "bun run --cwd e2e test",
"test:e2e:ui": "bun run --cwd e2e test:ui",
"test:e2e:headed": "bun run --cwd e2e test:headed"
```

- [ ] **Step 4: Install dependencies**

```bash
cd e2e && bun install
bunx playwright install chromium
```

- [ ] **Step 5: Commit**

```bash
git add e2e/package.json e2e/tsconfig.json e2e/bun.lock package.json
git commit -m "chore: scaffold e2e package with Playwright + Testcontainers"
```

---

## Task 2: Server state helper

**Files:**
- Create: `e2e/support/server-state.ts`

This module reads/writes a temporary JSON file that global-setup writes and playwright.config.ts + global-teardown read. It stores the dynamically allocated ports.

- [ ] **Step 1: Create `e2e/support/server-state.ts`**

```typescript
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const STATE_PATH = join(import.meta.dirname, '..', '.server-state.json');

export type ServerState = {
  webPort: number;
  apiPort: number;
  dbPort: number;
  containerId: string;
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
```

- [ ] **Step 2: Add `.server-state.json` to `.gitignore`**

Append to root `.gitignore`:

```
e2e/.server-state.json
```

- [ ] **Step 3: Commit**

```bash
git add e2e/support/server-state.ts .gitignore
git commit -m "feat(e2e): add server state helper for port sharing"
```

---

## Task 3: Global setup — Testcontainers + API + Vite

**Files:**
- Create: `e2e/support/global-setup.ts`

This is the core infrastructure file. It:
1. Starts a Postgres container via Testcontainers
2. Runs MikroORM migrations + DatabaseSeeder
3. Starts the Elysia API server (by importing `api/src/index.ts` with env overrides)
4. Starts a Vite dev server programmatically
5. Writes ports to the server state file

- [ ] **Step 1: Create `e2e/support/global-setup.ts`**

```typescript
import type { FullConfig } from '@playwright/test';
import { MikroORM } from '@mikro-orm/postgresql';
import { GenericContainer, Wait } from 'testcontainers';
import { createServer, type ViteDevServer } from 'vite';
import { createOrmConfig } from '../../infrastructure/src/db/orm-config.js';
import { DatabaseSeeder } from '../../infrastructure/src/db/seeds/DatabaseSeeder.js';
import { writeServerState } from './server-state.js';

// These get set during setup and read during teardown via the state file
let viteServer: ViteDevServer | null = null;

export default async function globalSetup(_config: FullConfig): Promise<() => Promise<void>> {
  const apiPort = 18000 + Math.floor(Math.random() * 1000);
  const webPort = 15173 + Math.floor(Math.random() * 1000);

  // 1. Start Postgres via Testcontainers
  console.log('[e2e] Starting Postgres container...');
  const container = await new GenericContainer('postgres:17-alpine')
    .withEnvironment({
      POSTGRES_USER: 'test',
      POSTGRES_PASSWORD: 'test',
      POSTGRES_DB: 'test'
    })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage(/ready to accept connections/, 2))
    .start();

  const dbPort = container.getMappedPort(5432);
  const dbHost = container.getHost();
  console.log(`[e2e] Postgres running on ${dbHost}:${dbPort}`);

  // 2. Run migrations + seeds
  console.log('[e2e] Running migrations and seeds...');
  const ormConfig = createOrmConfig({
    timezone: 'UTC',
    user: 'test',
    password: 'test',
    dbName: 'test',
    schema: 'public',
    host: dbHost,
    port: dbPort
  });
  const orm = await MikroORM.init(ormConfig);
  await orm.migrator.up();
  await orm.seeder.seed(DatabaseSeeder);
  await orm.close(true);

  // 3. Start API server
  console.log(`[e2e] Starting API on port ${apiPort}...`);

  // Set env vars BEFORE importing the API module (it reads them at import time)
  process.env.TZ = 'UTC';
  process.env.POSTGRES_USER = 'test';
  process.env.POSTGRES_PASSWORD = 'test';
  process.env.POSTGRES_DB = 'test';
  process.env.POSTGRES_SCHEMA = 'public';
  process.env.POSTGRES_HOST = dbHost;
  process.env.POSTGRES_PORT = String(dbPort);
  process.env.API_PORT = String(apiPort);
  // Disable services that need external credentials
  process.env.HEADLESS = 'true';
  process.env.SLOW_MO = '0';

  // Dynamic import so env vars are set first
  await import('../../api/src/index.js');

  // Wait for API to be ready
  await waitForHealth(`http://localhost:${apiPort}/health`);
  console.log('[e2e] API ready');

  // 4. Start Vite dev server
  console.log(`[e2e] Starting Vite on port ${webPort}...`);
  viteServer = await createServer({
    root: new URL('../../web', import.meta.url).pathname,
    server: {
      port: webPort,
      proxy: {
        '/api': {
          target: `http://localhost:${apiPort}`,
          rewrite: (p: string) => p.replace(/^\/api/, '')
        }
      }
    }
  });
  await viteServer.listen();
  console.log(`[e2e] Vite ready at http://localhost:${webPort}`);

  // 5. Write state for playwright.config.ts and global-teardown.ts
  writeServerState({
    webPort,
    apiPort,
    dbPort,
    containerId: container.getId()
  });

  // Return teardown function
  return async () => {
    console.log('[e2e] Tearing down...');
    if (viteServer) {
      await viteServer.close();
    }
    // API server (Elysia) doesn't expose a clean stop — process exit will clean it up
    await container.stop();
    console.log('[e2e] Teardown complete');
  };
}

async function waitForHealth(url: string, timeoutMs = 15_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not ready yet
    }
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error(`Health check at ${url} timed out after ${timeoutMs}ms`);
}
```

**Important notes:**
- The API module (`api/src/index.ts`) reads env vars at import time via `env()` from `@tailoredin/core`, so we must set `process.env` before the dynamic `import()`.
- The API container uses `PlaywrightJobScraper` and `PlaywrightWebColorService` which need `LINKEDIN_EMAIL`/`LINKEDIN_PASSWORD` and `HEADLESS` — the scraper won't be called during e2e tests, but the DI container still binds it. If this causes a startup error, we'll need to conditionally skip those bindings or provide dummy values. We set `HEADLESS=true` and `SLOW_MO=0` to satisfy the config. For LinkedIn credentials, we may need to provide dummy values — check if `env()` throws on missing keys at container construction time. If it does, set dummy values:
  ```typescript
  process.env.LINKEDIN_EMAIL = 'test@test.com';
  process.env.LINKEDIN_PASSWORD = 'test';
  ```

- [ ] **Step 2: Verify the setup boots correctly**

```bash
cd e2e && bun run support/global-setup.ts
```

Expected: Postgres starts, migrations run, API listens, Vite serves. Fix any missing env vars or import issues.

- [ ] **Step 3: Commit**

```bash
git add e2e/support/global-setup.ts
git commit -m "feat(e2e): global setup — Testcontainers + API + Vite boot"
```

---

## Task 4: Global teardown

**Files:**
- Create: `e2e/support/global-teardown.ts`

Note: If `globalSetup` returns a teardown function (as written above), Playwright uses that. This file is a fallback for the config-based `globalTeardown` approach. Playwright supports both — we'll use the return-function approach from Task 3 and keep this as a safety net.

- [ ] **Step 1: Create `e2e/support/global-teardown.ts`**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add e2e/support/global-teardown.ts
git commit -m "feat(e2e): global teardown safety net"
```

---

## Task 5: Playwright configuration

**Files:**
- Create: `e2e/playwright.config.ts`

- [ ] **Step 1: Create `e2e/playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test';
import { readServerState } from './support/server-state.js';

function getBaseURL(): string {
  try {
    const state = readServerState();
    return `http://localhost:${state.webPort}`;
  } catch {
    // Fallback for `playwright install` and other non-test commands
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
```

- [ ] **Step 2: Verify config loads**

```bash
cd e2e && bunx playwright test --list
```

This will trigger global-setup, list available tests (none yet), and run global-teardown. Confirms the full lifecycle works.

- [ ] **Step 3: Commit**

```bash
git add e2e/playwright.config.ts
git commit -m "feat(e2e): Playwright configuration with dynamic baseURL"
```

---

## Task 6: First e2e test — Headlines CRUD

**Files:**
- Create: `e2e/tests/resume/headlines.spec.ts`

This test exercises the Headlines page (`/resume/headlines`): create a headline, verify it appears in the table, edit it, verify update, delete it, verify removal.

**Key selectors** (from `web/src/routes/resume/headlines.tsx`):
- Page heading: `h1` with text "Headlines"
- Add button: button with text "Add Headline"
- Table rows: `<TableRow>` with label in first cell
- Edit button: ghost button with `Pencil` icon per row
- Delete button: ghost button with `Trash2` icon per row
- Dialog: `DialogTitle` with "Add Headline" / "Edit Headline"
- Form fields: `Label` input (`id="label"`), `Summary` textarea (`id="summaryText"`)
- Save button: button with text "Save"
- Delete confirm: button with text "Delete" (destructive variant)
- Toast: `sonner` Toaster — text "Headline created" / "Headline updated" / "Headline deleted"

- [ ] **Step 1: Create `e2e/tests/resume/headlines.spec.ts`**

```typescript
import { expect, test } from '@playwright/test';

test.describe('Headlines CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/resume/headlines');
    await expect(page.getByRole('heading', { name: 'Headlines' })).toBeVisible();
  });

  test('creates a new headline', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Headline' }).click();
    await expect(page.getByRole('heading', { name: 'Add Headline' })).toBeVisible();

    await page.getByLabel('Label').fill('E2E Test Engineer');
    await page.getByLabel('Summary').fill('Automated testing specialist with Playwright expertise.');
    await page.getByRole('button', { name: 'Save' }).click();

    // Verify toast and table update
    await expect(page.getByText('Headline created')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'E2E Test Engineer' })).toBeVisible();
  });

  test('edits an existing headline', async ({ page }) => {
    // First create one
    await page.getByRole('button', { name: 'Add Headline' }).click();
    await page.getByLabel('Label').fill('Temp Headline');
    await page.getByLabel('Summary').fill('Temporary summary.');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Headline created')).toBeVisible();

    // Click edit on the row we just created
    const row = page.getByRole('row').filter({ hasText: 'Temp Headline' });
    await row.getByRole('button').first().click(); // Pencil icon (first action button)
    await expect(page.getByRole('heading', { name: 'Edit Headline' })).toBeVisible();

    await page.getByLabel('Label').clear();
    await page.getByLabel('Label').fill('Updated Headline');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Headline updated')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Updated Headline' })).toBeVisible();
  });

  test('deletes a headline', async ({ page }) => {
    // First create one
    await page.getByRole('button', { name: 'Add Headline' }).click();
    await page.getByLabel('Label').fill('To Delete');
    await page.getByLabel('Summary').fill('Will be deleted.');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Headline created')).toBeVisible();

    // Click delete on the row
    const row = page.getByRole('row').filter({ hasText: 'To Delete' });
    await row.getByRole('button').nth(1).click(); // Trash icon (second action button)

    // Confirm deletion in the dialog
    await expect(page.getByText('Are you sure you want to delete')).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByText('Headline deleted')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'To Delete' })).not.toBeVisible();
  });

  test('persists headlines across page reload', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Headline' }).click();
    await page.getByLabel('Label').fill('Persistent Headline');
    await page.getByLabel('Summary').fill('Should survive reload.');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Headline created')).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Headlines' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Persistent Headline' })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the test**

```bash
cd e2e && bunx playwright test tests/resume/headlines.spec.ts
```

Expected: All 4 tests pass. If selectors don't match the actual DOM, adjust them using `bunx playwright test --headed` or `bunx playwright test --ui` to debug visually.

- [ ] **Step 3: Commit**

```bash
git add e2e/tests/resume/headlines.spec.ts
git commit -m "test(e2e): Headlines CRUD — create, edit, delete, persistence"
```

---

## Task 7: Education CRUD test

**Files:**
- Create: `e2e/tests/resume/education.spec.ts`

The Education page (`/resume/education`) uses cards (not a table) and a form dialog. Key UI from `web/src/routes/resume/education.tsx` + `web/src/components/resume/education/`:
- Page heading: "Education"
- Add button: "Add Entry"
- Cards: `EducationCard` components with edit buttons
- Dialog: `EducationFormDialog` with form fields

- [ ] **Step 1: Read the education form dialog to understand field names**

Check `web/src/components/resume/education/education-form-dialog.tsx` for form field labels/ids.

- [ ] **Step 2: Create `e2e/tests/resume/education.spec.ts`**

```typescript
import { expect, test } from '@playwright/test';

test.describe('Education CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/resume/education');
    await expect(page.getByRole('heading', { name: 'Education' })).toBeVisible();
  });

  test('creates a new education entry', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Entry' }).click();

    // Fill in the form — field labels come from the EducationFormDialog component
    // Adjust these selectors based on actual form field labels after Step 1
    await page.getByLabel('School').fill('MIT');
    await page.getByLabel('Degree').fill('M.S. Computer Science');
    await page.getByLabel('Field of Study').fill('Artificial Intelligence');

    await page.getByRole('button', { name: 'Save' }).click();

    // Verify the card appears
    await expect(page.getByText('MIT')).toBeVisible();
    await expect(page.getByText('M.S. Computer Science')).toBeVisible();
  });

  test('deletes an education entry', async ({ page }) => {
    // Create one first
    await page.getByRole('button', { name: 'Add Entry' }).click();
    await page.getByLabel('School').fill('E2E University');
    await page.getByLabel('Degree').fill('B.S. Testing');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('E2E University')).toBeVisible();

    // Find the card and delete it — adjust selector based on EducationCard structure
    const card = page.locator('[data-testid]').filter({ hasText: 'E2E University' });
    // If no data-testid, use text-based locator:
    const deleteButton = page.getByText('E2E University').locator('..').locator('..').getByRole('button', { name: /delete/i });
    await deleteButton.click();

    // Confirm if there's a confirmation dialog
    const confirmButton = page.getByRole('button', { name: 'Delete' });
    if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmButton.click();
    }

    await expect(page.getByText('E2E University')).not.toBeVisible();
  });
});
```

**Note:** The exact form field labels and card structure will need to be verified by reading `EducationFormDialog` and `EducationCard`. Adjust selectors in Step 1. The test above is a template — the implementer MUST read the component files and fix labels before running.

- [ ] **Step 3: Run the test**

```bash
cd e2e && bunx playwright test tests/resume/education.spec.ts
```

- [ ] **Step 4: Commit**

```bash
git add e2e/tests/resume/education.spec.ts
git commit -m "test(e2e): Education CRUD — create and delete entries"
```

---

## Task 8: Job list test

**Files:**
- Create: `e2e/tests/jobs/job-list.spec.ts`

The Jobs page (`/jobs`) displays a table of seeded jobs with filtering by view (triage/pipeline/archive/all). The `DatabaseSeeder` seeds jobs via `JobDataSeeder`, so the list should have data on first load.

- [ ] **Step 1: Create `e2e/tests/jobs/job-list.spec.ts`**

```typescript
import { expect, test } from '@playwright/test';

test.describe('Job List', () => {
  test('loads and displays seeded jobs', async ({ page }) => {
    await page.goto('/jobs');

    // The jobs table should render with seeded data
    await expect(page.getByRole('heading', { name: /jobs/i })).toBeVisible();

    // Table should have at least one row (seeded by JobDataSeeder)
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible();
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('navigates to job detail', async ({ page }) => {
    await page.goto('/jobs');

    // Click on the first job row — should navigate to /jobs/:id
    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();

    // Should navigate to a job detail page
    await expect(page).toHaveURL(/\/jobs\/[a-f0-9-]+/);
  });

  test('switches between views', async ({ page }) => {
    await page.goto('/jobs');

    // The view selector should be visible — try switching to "all" view
    // Adjust selector based on actual view switcher UI (tabs, select, etc.)
    const viewSelector = page.getByRole('combobox').first();
    if (await viewSelector.isVisible({ timeout: 2000 }).catch(() => false)) {
      await viewSelector.click();
      await page.getByRole('option', { name: /all/i }).click();
      // URL should update with view param
      await expect(page).toHaveURL(/view=all/);
    }
  });
});
```

- [ ] **Step 2: Run the test**

```bash
cd e2e && bunx playwright test tests/jobs/job-list.spec.ts
```

- [ ] **Step 3: Commit**

```bash
git add e2e/tests/jobs/job-list.spec.ts
git commit -m "test(e2e): Job list — loads seeded data, navigation, view switching"
```

---

## Task 9: CI integration

**Files:**
- Modify: `.github/workflows/ci.yaml`

- [ ] **Step 1: Add e2e test job to CI workflow**

Add after the existing `test-integration` job in `.github/workflows/ci.yaml`:

```yaml
  test-e2e:
    name: E2E Tests
    needs: changes
    if: needs.changes.outputs.src == 'true' || needs.changes.outputs.deps == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-bun
      - name: Install e2e dependencies
        run: cd e2e && bun install
      - name: Install Playwright browsers
        run: cd e2e && bunx playwright install chromium --with-deps
      - name: Run e2e tests
        run: bun run test:e2e
      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: e2e/playwright-report/
          retention-days: 14
```

- [ ] **Step 2: Add `e2e/playwright-report/` to `.gitignore`**

Append to root `.gitignore`:

```
e2e/playwright-report/
e2e/test-results/
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yaml .gitignore
git commit -m "ci: add Playwright e2e test job with report artifact upload"
```

---

## Task 10: Verify end-to-end locally

This is a manual verification task — run the full suite and fix any issues.

- [ ] **Step 1: Run the full suite**

```bash
bun run test:e2e
```

Expected: All tests pass. Testcontainers starts Postgres, migrations run, API + Vite boot, Chromium tests run, teardown cleans up.

- [ ] **Step 2: Run in headed mode for visual verification**

```bash
bun run test:e2e:headed
```

Verify: Browser opens, navigates to pages, interacts with forms, and closes.

- [ ] **Step 3: Run with UI mode**

```bash
bun run test:e2e:ui
```

Verify: Playwright UI opens showing all tests. Can run individual tests, see traces, step through actions.

- [ ] **Step 4: Fix any issues discovered**

Iterate on selectors, timing, or setup issues until all tests pass reliably.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "fix(e2e): adjustments from local verification"
```

---

## Verification

After all tasks are complete:

1. **Local run:** `bun run test:e2e` — all tests green
2. **Headed run:** `bun run test:e2e:headed` — visually confirm browser interactions
3. **CI dry run:** Push branch, verify the `test-e2e` job runs and passes in GitHub Actions
4. **Report artifact:** Download the Playwright HTML report from the CI artifact and verify it shows test results
5. **Isolation check:** Run `bun run test` (unit tests) — confirm e2e tests are NOT included (since `e2e/` is not a workspace member)
