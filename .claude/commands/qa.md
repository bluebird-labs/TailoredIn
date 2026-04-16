---
allowed-tools: Bash(bun run typecheck), Bash(bun run check), Bash(bun run check:fix), Bash(bun run test), Bash(bun run dep:check), Bash(git status:*), Bash(git diff:*)
description: Run quality checks, open a dev terminal, and enter a test/feedback loop
---

## Context

- Current directory: !`pwd`
- Git branch: !`git branch --show-current`
- Pending changes: !`git status --short`
## Your task

Run quality checks and enter a manual test/feedback loop. A dev terminal has been opened in the worktree directory — the user can start `bun wt:up` there while checks run.

---

### Step 1 — Automated quality checks

Run these checks in order. Fix any issues before proceeding. If auto-fix resolves everything, continue. If issues remain that require judgment, STOP and ask.

1. `bun run check:fix` — auto-fix lint/format
2. `bun run typecheck` — fix any type errors before continuing
3. `bun run test` — fix any failing tests before continuing
4. `bun run dep:check` — fix any architecture violations before continuing

After all checks pass, tell the user:
> ✅ All automated quality checks pass. Let me know when the dev environment is up and you've started testing, or say **"ready"** to continue.

---

### Step 2 — Test/feedback loop

Enter a loop. On each iteration:

1. **Wait for user feedback.** The user will describe what they tested and what needs fixing.

2. **If the user is satisfied** (e.g., "looks good", "done", "ship it"), exit the loop → go to Step 4.

3. **Fix the reported issues.** Make code changes as needed. The API server (`--watch`) and web server (Vite HMR) auto-reload — no server restart needed.

4. **Run quick checks after each fix:**
   ```
   bun run check:fix
   bun run typecheck
   ```
   Fix any issues. Do NOT run the full test suite on every iteration — only typecheck and lint.

5. **Tell the user to re-test:**
   > Changes applied. Servers have auto-reloaded — please re-test and let me know how it looks.

6. **Repeat** from step 1 of this loop.

---

### Step 3 — Final verification

Run the full quality suite:

```
bun run check:fix
bun run typecheck
bun run test
bun run dep:check
```

Report the results. If everything passes, ask:

> **All quality checks pass.** What would you like to do?
> 1. **Keep running** — leave the environment up for more testing
> 2. **Land** — run `/land` to merge this branch into main

Act on the user's choice:
- **Land**: tell the user to run `/land` separately (do not run it from this command).
- **Keep running**: confirm and end.
