---
allowed-tools: Bash(bun wt:up), Bash(bun wt:down), Bash(bun wt:fresh), Bash(bun run typecheck), Bash(bun run check), Bash(bun run check:fix), Bash(bun run test), Bash(bun run dep:check), Bash(cat .wt-session.json), Bash(curl *), Bash(git status:*), Bash(git diff:*)
description: Start worktree dev environment, run quality checks, and enter a test/feedback loop
---

## Context

- Current directory: !`pwd`
- Git branch: !`git branch --show-current`
- Session exists: !`test -f .wt-session.json && echo "YES" || echo "NO"`
- Pending changes: !`git status --short`

## Your task

Run quality checks, spin up the worktree dev environment, and enter a manual test/feedback loop with the user. Follow these steps exactly.

---

### Step 1 — Automated quality checks

Run these checks in order. Fix any issues before proceeding. If auto-fix resolves everything, continue. If issues remain that require judgment, STOP and ask.

1. `bun run check:fix` — auto-fix lint/format
2. `bun run typecheck` — fix any type errors before continuing
3. `bun run test` — fix any failing tests before continuing
4. `bun run dep:check` — fix any architecture violations before continuing

After all checks pass, tell the user:
> ✅ All automated quality checks pass. Starting the dev environment...

---

### Step 2 — Start the dev environment

**Port & volume stability:** Throughout this QA session, maintain the same ports and Docker volume. Never run `bun wt:down` to tear down and recreate — use `bun wt:fresh` if a restart is needed, which preserves the same port allocations and Docker volume.

**If the session already exists** (`.wt-session.json` is present), read it:
```
cat .wt-session.json
```
Then check if the API is responding:
```
curl -s -o /dev/null -w "%{http_code}" http://localhost:<apiPort>/
```
- If the API responds (any HTTP status): skip to Step 3 using the existing ports.
- If the API does not respond: run `bun wt:fresh` in the background to restart cleanly (preserves ports and volume), then continue below.

**If the session does not exist**, start the environment:

1. Run `bun wt:up` in the background (it is a blocking foreground process that spawns servers).

2. Poll for `.wt-session.json` every 2 seconds, up to 60 seconds. Once it exists, read it:
   ```
   cat .wt-session.json
   ```

3. Poll for the API to respond every 3 seconds, up to 60 seconds:
   ```
   curl -s -o /dev/null -w "%{http_code}" http://localhost:<apiPort>/
   ```

4. **Find the actual Vite web URL.** The `webPort` in `.wt-session.json` is the *requested* port, but Vite auto-increments if it's already taken (e.g., 5173 → 5174). Read the `bun wt:up` background task output and grep for the actual URL:
   ```
   grep -o 'http://localhost:[0-9]*/' <background-task-output-file>
   ```
   Look for the line containing `➜  Local:` — that's Vite's actual URL. Use that URL for the web app, NOT the session file's `webPort`.

5. Once the API responds, present this to the user:

> **Dev environment is up!**
>
> | Service | URL |
> |---------|-----|
> | Web app | **{actual Vite URL from step 4}** |
> | API     | http://localhost:{apiPort} |
> | Database | localhost:{dbPort} |
>
> Open the web app in your browser and test the changes. Tell me what needs fixing or say **"looks good"** when you're satisfied.

---

### Step 3 — Test/feedback loop

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
   > Changes applied. Servers have auto-reloaded — please test again at **{actual Vite URL}** and let me know how it looks.

6. **Repeat** from step 1 of this loop.

---

### Step 4 — Final verification

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
> 2. **Tear down** — run `bun wt:down` to stop servers and remove the database
> 3. **Land** — run `/land` to merge this branch into main

Act on the user's choice:
- **Tear down**: run `bun wt:down` and confirm completion.
- **Land**: tell the user to run `/land` separately (do not run it from this command).
- **Keep running**: confirm and end.
