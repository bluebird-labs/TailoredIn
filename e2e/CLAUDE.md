# e2e/ — End-to-End Tests

Playwright E2E tests that run against a fully ephemeral environment (Testcontainers PostgreSQL, real API + web servers).

## Running tests

```bash
pnpm e2e:test           # headless, from repo root
pnpm e2e:test:headed    # visible browser
pnpm e2e:test:ui        # Playwright UI mode
```

All commands can be run from any branch — the environment is fully self-contained.

## How it works

1. **Global setup** (`support/global-setup.ts`) spawns `infrastructure/scripts/e2e-start-servers.ts`
2. The server script starts a Testcontainers PostgreSQL instance, runs migrations + seeds, and launches API + web servers on dynamic ports
3. The server emits `E2E_READY <webPort> <apiPort> <dbPort>` on stdout — global setup captures this and sets `E2E_BASE_URL`
4. Global setup authenticates by calling `POST /auth/login` on the API, then saves a Playwright `storageState` file (`.auth-state.json`) with the JWT in localStorage
5. All tests automatically load this storage state, so they are pre-authenticated as `jane@example.com`
6. **Global teardown** kills the server process and cleans up state files (`.server-state.json`, `.auth-state.json`)

## Test structure

```
e2e/tests/
├── navigation.spec.ts       ← Page navigation, routing
├── profile.spec.ts          ← Profile display and editing
├── education.spec.ts        ← Education CRUD
├── experiences.spec.ts      ← Experience CRUD
└── accomplishments.spec.ts  ← Accomplishment CRUD within experiences
```

## Configuration

- **Browser**: Chromium only (`playwright.config.ts`)
- **Parallelism**: Fully parallel; 2 workers on CI
- **Retries**: 1 on CI, 0 locally
- **Artifacts**: Traces on first retry, screenshots on failure
- **Reporter**: GitHub reporter on CI, HTML locally (opens on failure)

## Test data

Tests run against seeded data from `infrastructure/src/db/seeds/`. The E2E seeder provides a minimal but complete dataset covering all entity types.

## CI integration

The GitHub Actions CI pipeline (`ci.yaml`) runs E2E tests as a separate job with:
- Browser installation step (`pnpm exec playwright install --with-deps chromium`)
- Artifact upload for test results
- Path filtering — only runs when relevant files change

## Adding a new test

1. Create `e2e/tests/<feature>.spec.ts`
2. Use `test` and `expect` from `@playwright/test`
3. Navigate using `page.goto('/<route>')` — `baseURL` is set automatically
4. Keep tests independent — each test should work regardless of execution order

## Important notes

- The `e2e/` package only has `@playwright/test` as a dependency — all server infrastructure lives in `infrastructure/scripts/`
- Do **not** import from `@tailoredin/*` packages in test files — interact only through the browser
- Dynamic ports avoid conflicts when running alongside `dev:up`
