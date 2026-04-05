# Worktree DB Clone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On `wt:up`, clone the running dev database into the worktree's Postgres container instead of running migrations + seeds from scratch.

**Architecture:** A new `DatabaseClone.ts` module pipes `pg_dump` output from the dev container's stdout directly into `psql` on the worktree container's stdin using Bun's subprocess API. `wt-up.ts` calls this first, falling back to migrations + seeds if the dev DB isn't available.

**Tech Stack:** Bun subprocess API, `pg_dump`/`psql` (available inside the postgres:17-alpine container)

**Spec:** `docs/superpowers/specs/2026-04-05-worktree-db-clone-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `infrastructure/dev/DatabaseClone.ts` | Create | `cloneDevDatabase()` — pg_dump from dev, psql into worktree |
| `infrastructure/dev/wt-up.ts` | Modify (lines 90-108) | Replace migrations+seeds with clone-then-fallback |

---

### Task 1: Create `DatabaseClone.ts`

**Files:**
- Create: `infrastructure/dev/DatabaseClone.ts`

- [ ] **Step 1: Create `DatabaseClone.ts` with `cloneDevDatabase()`**

```typescript
import { Logger } from '@tailoredin/core';
import { isContainerRunning } from './DockerCompose.js';

const log = Logger.create('database-clone');

const DEV_CONTAINER = 'tailored-in-postgres-1';
const DEV_DB_NAME = 'tailored_in';
const PG_USER = 'postgres';
const PG_PASSWORD = 'postgres';

/**
 * Clone the dev database into a worktree Postgres container via piped pg_dump | psql.
 *
 * Returns `true` on success, `false` if the dev DB is unavailable or the clone fails.
 */
export function cloneDevDatabase(wtContainerName: string, wtDbName: string): boolean {
  if (!isContainerRunning(DEV_CONTAINER)) {
    log.warn(`Dev DB container (${DEV_CONTAINER}) is not running — cannot clone.`);
    return false;
  }

  log.info(`Cloning ${DEV_DB_NAME} → ${wtDbName}...`);

  const pgDump = Bun.spawn(
    [
      'docker', 'exec',
      '-e', `PGPASSWORD=${PG_PASSWORD}`,
      DEV_CONTAINER,
      'pg_dump', '-U', PG_USER, '--no-owner', '--no-privileges', DEV_DB_NAME
    ],
    { stdout: 'pipe', stderr: 'pipe' }
  );

  const psql = Bun.spawn(
    [
      'docker', 'exec', '-i',
      '-e', `PGPASSWORD=${PG_PASSWORD}`,
      wtContainerName,
      'psql', '-U', PG_USER, '-d', wtDbName
    ],
    { stdin: pgDump.stdout, stdout: 'pipe', stderr: 'pipe' }
  );

  // Wait for both processes to finish (psql finishes after pg_dump closes the pipe)
  const psqlExitCode = psql.exitCode;
  const dumpExitCode = pgDump.exitCode;

  if (dumpExitCode !== 0) {
    const stderr = new TextDecoder().decode(pgDump.stderr as unknown as ArrayBuffer);
    log.error(`pg_dump failed (exit ${dumpExitCode}): ${stderr}`);
    return false;
  }

  if (psqlExitCode !== 0) {
    const stderr = new TextDecoder().decode(psql.stderr as unknown as ArrayBuffer);
    log.error(`psql restore failed (exit ${psqlExitCode}): ${stderr}`);
    return false;
  }

  log.info('Clone complete.');
  return true;
}
```

Note: `Bun.spawn` returns a subprocess with a readable `stdout` stream. Passing `pgDump.stdout` as `psql`'s `stdin` creates a direct pipe — no intermediate file, no shell. Accessing `.exitCode` blocks until the process finishes.

- [ ] **Step 2: Verify types compile**

Run: `bun run typecheck`
Expected: All packages exit with code 0

- [ ] **Step 3: Verify lint passes**

Run: `bun run check`
Expected: No new errors (existing info-level lint on `SalaryRange` is pre-existing)

- [ ] **Step 4: Commit**

```bash
git add infrastructure/dev/DatabaseClone.ts
git commit -m "feat: add DatabaseClone module for piped pg_dump→psql cloning"
```

---

### Task 2: Wire clone into `wt-up.ts`

**Files:**
- Modify: `infrastructure/dev/wt-up.ts:1-6` (add import)
- Modify: `infrastructure/dev/wt-up.ts:90-108` (replace migrations+seeds block)

- [ ] **Step 1: Add import at top of `wt-up.ts`**

After the existing imports (line 6), add:

```typescript
import { cloneDevDatabase } from './DatabaseClone.js';
```

- [ ] **Step 2: Replace the migrations+seeds block**

Replace lines 90-108 (the `// ── Migrations + seeds` section):

```typescript
// ── Database: clone dev or migrate + seed ────────────────────────

let dbReady = false;

log.info('Attempting to clone dev database...');
try {
  dbReady = cloneDevDatabase(ctx.containerName, session.dbName);
} catch (e) {
  log.warn(`Clone failed: ${e instanceof Error ? e.message : e}`);
}

if (!dbReady) {
  log.warn('Falling back to migrations + seeds.');

  log.info('Running migrations...');
  try {
    await runMigrations({ dbConfig: ormConfig, containerName: ctx.containerName, repoRoot: ctx.repoRoot });
  } catch (e) {
    teardown();
    throw e;
  }

  log.info('Running seeds...');
  try {
    await runSeeds(ormConfig);
  } catch (e) {
    teardown();
    throw e;
  }
}
```

- [ ] **Step 3: Verify types compile**

Run: `bun run typecheck`
Expected: All packages exit with code 0

- [ ] **Step 4: Verify lint passes**

Run: `bun run check`
Expected: No new errors

- [ ] **Step 5: Commit**

```bash
git add infrastructure/dev/wt-up.ts
git commit -m "feat: wt:up clones dev DB, falls back to migrations+seeds"
```

---

### Task 3: Manual verification

- [ ] **Step 1: Start dev environment**

Run: `bun dev:up`
Expected: Dev DB is running with your data on `tailored-in-postgres-1`

- [ ] **Step 2: Start a worktree and run `wt:up`**

From a worktree directory, run: `bun wt:up`
Expected:
- Log shows "Cloning tailored_in → tailoredin_<name>..."
- Log shows "Clone complete."
- Worktree DB has same tables and data as dev DB
- Dev servers start normally

- [ ] **Step 3: Verify fallback — stop dev DB, run `wt:up` from a fresh worktree**

Stop dev: `bun dev:down`
From a different worktree (or after `bun wt:down`): `bun wt:up`
Expected:
- Log shows "Dev DB container (tailored-in-postgres-1) is not running — cannot clone."
- Log shows "Falling back to migrations + seeds."
- Worktree DB has empty schema from migrations (no dev data, as expected)

- [ ] **Step 4: Commit plan and spec docs**

```bash
git add docs/
git commit -m "docs: worktree DB clone spec and implementation plan"
```
