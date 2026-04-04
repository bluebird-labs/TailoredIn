# Plan: Add safe seeding to `bun up`

## Context

`bun up` starts the full dev environment: installs deps, starts Postgres, runs migrations, then launches servers. The safe `DatabaseSeeder` (which only upserts reference skills) should also run automatically so the dev DB is always seeded without manual intervention. This mirrors the migration step — idempotent and safe on existing data.

---

## Approach

Mirror the existing `MigrationRunner.ts` pattern: add a `SeedRunner.ts` that runs `DatabaseSeeder` programmatically via `orm.getSeeder()`, then call it in `up.ts` between migrations and server startup.

---

## Files to change

### 1. Create `infrastructure/dev/SeedRunner.ts`

```typescript
import { MikroORM } from '@mikro-orm/postgresql';
import { Logger } from '@tailoredin/core';
import { DatabaseSeeder } from '../src/db/seeds/DatabaseSeeder.js';
import { createOrmConfig, type OrmDbConfig } from '../src/db/orm-config.js';

const log = Logger.create('seed-runner');

export async function runSeeds(dbConfig: OrmDbConfig): Promise<void> {
  const orm = await MikroORM.init(createOrmConfig(dbConfig));
  try {
    await orm.getSeeder().seed(DatabaseSeeder);
    log.info('Seeds applied.');
  } finally {
    await orm.close(true);
  }
}
```

### 2. Update `infrastructure/dev/up.ts`

- Import `runSeeds` from `./SeedRunner.js`
- Add a seed step after the migration block (line 111), before `// ── Start dev servers ──`:

```typescript
// ── Seeds ─────────────────────────────────────────────────────────

log.info('Running seeds...');
try {
  await runSeedsForContext(ports);
} catch (e) {
  if (ctx.mode === 'worktree') teardownWorktree();
  throw e;
}
```

- Add helper (alongside `runMigrationsForContext`):

```typescript
async function runSeedsForContext(sessionPorts: SessionPorts | null): Promise<void> {
  await runSeeds(dbConfigForContext(sessionPorts));
}
```

- Update the top-of-file JSDoc comment to include step 3.5: "Runs seeds"

---

## Verification

1. Run `bun up` on a fresh worktree — confirm "Running seeds..." and "Seeds applied." log lines appear after migrations
2. Run `bun up` again — confirm idempotent (no errors, "Seeds applied." again)
3. Query the DB: `SELECT count(*) FROM skills;` — should be 126
