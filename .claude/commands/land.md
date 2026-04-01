---
allowed-tools: Bash(git rebase:*), Bash(git push:*), Bash(git status:*), Bash(git log:*), Bash(git branch:*), Bash(git diff:*), Bash(gh pr create:*), Bash(gh pr merge:*), Bash(gh pr checks:*), Bash(gh pr view:*)
description: Rebase on main, create PR, wait for CI green, then merge
---

## Context

- Current branch: !`git branch --show-current`
- Current status: !`git status --short`
- Commits ahead of main: !`git log main..HEAD --oneline`

## Your task

Land the current branch into main. Follow these steps exactly:

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

3. **Create a PR** (if one doesn't already exist):
   ```
   gh pr create --fill
   ```
   If a PR already exists, skip this step.

4. **Wait for CI to pass.** Poll every 30 seconds:
   ```
   gh pr checks
   ```
   - If all checks pass: proceed to step 5.
   - If any check fails: STOP, show the failure, and ask for help.
   - Maximum 20 attempts (10 minutes). If still pending after that, STOP and report status.

5. **Merge the PR:**
   ```
   gh pr merge --squash --delete-branch
   ```

6. **Report completion** with the merged PR URL.