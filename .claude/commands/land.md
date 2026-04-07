---
allowed-tools: Bash(bun run check:fix), Bash(bun run typecheck), Bash(bun run test), Bash(bun run dep:check), Bash(bun wt:down), Bash(git rebase:*), Bash(git push:*), Bash(git status:*), Bash(git log:*), Bash(git branch:*), Bash(git diff:*), Bash(git merge:*), Bash(git commit:*), Bash(git add:*), Bash(git fetch:*), Bash(git rev-parse:*), Bash(git worktree:*), Bash(git -C:*), Bash(gh pr create:*), Bash(gh pr merge:*), Bash(gh pr checks:*), Bash(gh pr view:*)
description: Run quality checks, commit changes, and land the current branch into main
---

## Context

- Current directory: !`pwd`
- Current branch: !`git branch --show-current`
- Main repo path: !`git rev-parse --git-common-dir | sed 's|/\.git.*||'`
- Pending changes: !`git status --short`
- Commits ahead of main: !`git log main..HEAD --oneline`
- Worktree session active: !`test -f .wt-session.json && echo "yes" || echo "no"`

## Your task

Land the current branch into main. Follow these phases in order.

---

### Phase 1 — Detect environment

Determine whether you are running inside a worktree or on the main repo:

- **Worktree:** current directory contains `.claude/worktrees/`. Note the **main repo path** (from context above), the **branch name**, and the **worktree absolute path** (current directory).
- **Not a worktree:** you are on the main repo. The local flow will use `git checkout main` instead of `git -C`.

If there are no commits ahead of main, report "Nothing to land" and stop.

---

### Phase 2 — Quality checks

Run these checks in order. Fix any issues before proceeding — even if unrelated to your changes. If auto-fix resolves everything, continue. If issues remain that require judgment, STOP and ask.

1. `bun run check:fix` — auto-fix lint/format
2. `bun run typecheck` — fix any type errors
3. `bun run test` — fix any failing tests
4. `bun run dep:check` — fix any architecture violations

---

### Phase 3 — Commit uncommitted changes

Check `git status`. If there are uncommitted changes (staged or unstaged):

1. Review the changes with `git diff` and `git diff --cached`
2. Create one or more conventional-commit-style commits (e.g., `fix(lint): resolve biome warnings`, `feat(web): add download button`)
3. Group logically related changes into the same commit; separate unrelated changes into different commits

If the working tree is clean, skip this phase.

---

### Phase 4 — Choose landing strategy

Ask the user:

> **How do you want to land this branch?**
> - **Remote (PR)** — Create/update PR, wait for CI, squash-merge via GitHub
> - **Local** — Squash-merge locally and push main directly

Then follow the matching flow.

---

### Phase 5a — Remote flow

1. **Rebase on latest main:**
   ```
   git fetch origin main
   git rebase origin/main
   ```
   If rebase conflicts occur, STOP and ask for help.

2. **Force-push the rebased branch:**
   ```
   git push --force-with-lease
   ```
   If the branch has never been pushed, use `git push -u origin HEAD` instead.

3. **Create a PR** (if one doesn't already exist):
   ```
   gh pr create --fill
   ```
   If a PR already exists, skip this step.

4. **Wait for CI to pass.** Poll every 30 seconds:
   ```
   gh pr checks
   ```
   - All checks pass → proceed to step 5.
   - Any check fails → STOP, show the failure, and ask for help.
   - Maximum 20 attempts (10 minutes). If still pending, STOP and report status.

5. **Squash-merge the PR:**
   ```
   gh pr merge --squash --delete-branch
   ```

6. **Cleanup** → go to Phase 6.

---

### Phase 5b — Local flow

Use `MAIN` as shorthand for the main repo path, `BRANCH` for the current branch name, and `WTPATH` for the worktree absolute path.

1. **Rebase on latest main:**
   ```
   git fetch origin main
   git rebase origin/main
   ```
   If rebase conflicts occur, STOP and ask for help.

2. **Check that main repo is clean:**
   ```
   git -C MAIN status --short
   ```
   If there are uncommitted changes in the main repo, STOP and warn the user.

3. **Pull latest main in the main repo:**
   ```
   git -C MAIN pull origin main
   ```

4. **Squash-merge the branch into main:**
   ```
   git -C MAIN merge --squash BRANCH
   ```

5. **Compose the squash commit message** from the list of commits being squashed (from `git log main..HEAD --oneline` in the worktree). Format:

   ```
   <title summarizing the changes>

   Squashed commits:
   - <commit 1 message>
   - <commit 2 message>
   - ...
   ```

   Then commit:
   ```
   git -C MAIN commit -m "<composed message>"
   ```

6. **Push main:**
   ```
   git -C MAIN push origin main
   ```

7. **Cleanup** → go to Phase 6.

---

### Phase 6 — Cleanup

1. **Stop worktree servers** (if worktree session is active):
   ```
   bun wt:down
   ```
   If this fails, proceed anyway — servers may already be stopped.

2. **Remove the worktree** (from the main repo):
   ```
   git -C MAIN worktree remove WTPATH --force
   ```
   This also deletes the worktree branch.

3. **Delete the remote branch** (if it was pushed):
   ```
   git -C MAIN push origin --delete BRANCH
   ```
   If the remote branch doesn't exist, skip this.

4. **Report completion** with the squash commit hash and a summary of landed changes.

---

### Non-worktree local flow

If Phase 1 determined you are NOT in a worktree, replace Phase 5b steps 2–6 with:

```
git checkout main
git pull origin main
git merge --squash <branch>
git commit -m "<composed message>"
git push origin main
git branch -D <branch>
```

Skip Phase 6 (no worktree to clean up).
