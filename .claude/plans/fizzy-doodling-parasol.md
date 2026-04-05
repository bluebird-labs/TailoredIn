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

### 2. `bun fresh` — restart everything

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

3. **Session-end checklist**: `bun run domain:diagram && bun run db:diagram` → commit diagram changes → `git status` → resolve any remaining unstaged files.

#### 4c. Add `NODE_ENV` to Environment Variables section

Note that `bunfig.toml` sets `NODE_ENV=development` for `bun run` and `NODE_ENV=test` for `bun test`. Production overrides at deploy time.

---

### 5. Diagram flow

Diagrams are generation, not validation — they're run as part of the session-end checklist, not as quality checks.

---

## Files Modified

| File | Change |
|------|--------|
| `bunfig.toml` | Add `[run.env]` and `[test.env]` sections |
| `package.json` | Add `fresh` script |
| `.env.example` | Add `NODE_ENV` |
| `CLAUDE.md` | Rewrite Commands, add Session Hygiene, update Env Vars |

## Verification

1. `bun fresh` — should stop and restart the dev environment
3. Check `bunfig.toml` is picked up: `bun run -e 'console.log(process.env.NODE_ENV)'` should print `development`
4. Review CLAUDE.md for completeness of new guidance
