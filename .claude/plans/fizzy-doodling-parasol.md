# Plan: Project Hygiene & Session Workflow

## Context

The project has many individual `bun run` scripts but no single "verify everything" command. NODE_ENV isn't configured in Bun's config. Session-end behavior (unstaged files, diagrams, destructive migrations) isn't codified. This plan adds the missing glue to keep the project pristine between sessions.

## Changes

### 1. NODE_ENV in `bunfig.toml`

**File:** `bunfig.toml`

Add environment variable sections so every command gets the right NODE_ENV automatically:

```toml
[run.env]
NODE_ENV = "development"

[test]
coverageThreshold = 0.8

[test.env]
NODE_ENV = "test"
```

Also add `NODE_ENV` to `.env.example` for documentation.

---

### 2. `bun verify` — full health check script

**New file:** `scripts/verify.ts`

Runs all checks sequentially, stopping on first failure, with clear step headers:

```
Step 1/7: typecheck
Step 2/7: check (Biome lint + format)
Step 3/7: dep:check (architecture boundaries)
Step 4/7: knip (dead code)
Step 5/7: test:coverage (unit tests)
Step 6/7: test:integration (Testcontainers)
Step 7/7: test:e2e (Playwright)
```

Implementation: spawn each step via `Bun.spawn`, stream stdout/stderr, exit on non-zero. Print elapsed time per step and total.

**File:** `package.json` — add script:
```json
"verify": "bun run scripts/verify.ts"
```

---

### 3. `bun fresh` — restart everything

**File:** `package.json` — add script:
```json
"fresh": "bun down && bun up"
```

No new files needed.

---

### 4. CLAUDE.md updates

**File:** `CLAUDE.md`

#### 4a. Rewrite Commands section

Reorganize around the primary commands (`up`, `down`, `fresh`, `verify`) with secondary commands below. Emphasize the simplified surface.

#### 4b. Add "Session Hygiene" section

New section with three rules:

1. **Unstaged files**: Before ending a session, run `git status`. If there are unstaged or untracked files, ask the user what to do with each (commit, stash, discard). Never leave files dangling silently.

2. **Destructive migrations**: Never run `db:migration:up` without asking first. When asking, state whether the migration includes data deletion (DROP TABLE, DROP COLUMN, DELETE, TRUNCATE). Show the migration SQL if destructive.

3. **Session-end checklist**: `bun verify` → `bun run domain:diagram && bun run db:diagram` → commit diagram changes → `git status` → resolve any remaining unstaged files.

#### 4c. Add `NODE_ENV` to Environment Variables section

Note that `bunfig.toml` sets `NODE_ENV=development` for `bun run` and `NODE_ENV=test` for `bun test`. Production overrides at deploy time.

---

### 5. Diagram flow

Diagrams are NOT part of `bun verify` (they're generation, not validation). The CLAUDE.md session-end checklist says: after verify passes, run diagrams, commit any changes.

---

## Files Modified

| File | Change |
|------|--------|
| `bunfig.toml` | Add `[run.env]` and `[test.env]` sections |
| `package.json` | Add `verify` and `fresh` scripts |
| `scripts/verify.ts` | **New** — sequential runner for all checks |
| `.env.example` | Add `NODE_ENV` |
| `CLAUDE.md` | Rewrite Commands, add Session Hygiene, update Env Vars |

## Verification

1. `bun run verify` — should run all 7 steps and pass (or fail on first broken step)
2. `bun fresh` — should stop and restart the dev environment
3. Check `bunfig.toml` is picked up: `bun run -e 'console.log(process.env.NODE_ENV)'` should print `development`
4. Review CLAUDE.md for completeness of new guidance
