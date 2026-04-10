---
allowed-tools: Bash(bun run check:fix), Bash(bun run typecheck), Bash(bun run test), Bash(bun run dep:check), Bash(bun run knip), Bash(bun run --cwd infrastructure test:integration), Bash(bun e2e:test), Bash(git status:*), Bash(git diff:*)
description: Make every code check green — lint, types, tests, architecture, dead code, integration, e2e
---

## Context

- Current directory: !`pwd`
- Git branch: !`git branch --show-current`
- Pending changes: !`git status --short`

## Your task

Make **every** code check green. Fix all issues — even if they come from a previous session or are unrelated to recent changes. No check is optional.

---

### Step 1 — Lint & format

```
bun run check:fix
```

Auto-fixes most issues. If any remain, fix them manually before continuing.

---

### Step 2 — Type checking

```
bun run typecheck
```

Fix all type errors before continuing.

---

### Step 3 — Unit tests

```
bun run test
```

Fix all failing tests before continuing.

---

### Step 4 — Architecture boundaries

```
bun run dep:check
```

Fix any dependency violations before continuing.

---

### Step 5 — Dead code & unused exports

```
bun run knip
```

Remove unused exports, unused dependencies, and dead code before continuing.

---

### Step 6 — Integration tests

```
bun run --cwd infrastructure test:integration
```

Fix all failing integration tests before continuing. These use Testcontainers (real Postgres) — allow up to 120s for the run.

---

### Step 7 — End-to-end tests

```
bun e2e:test
```

Fix all failing e2e tests before continuing. These use Playwright — allow up to 5 minutes for the run.

---

### Completion

Once **all 7 checks are green**, report:

> **All checks pass.**

Then list what was fixed (if anything), grouped by check. If nothing needed fixing, say so.
