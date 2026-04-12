#!/usr/bin/env bash
# PostToolUse hook for EnterWorktree: copies .env from main worktree into newly created worktree
set -euo pipefail

input=$(cat)
wt=$(echo "$input" | jq -r '.cwd')
main=$(git worktree list --porcelain 2>/dev/null | head -1 | sed 's/^worktree //')

if [ -n "$main" ] && [ -f "$main/.env" ] && [ -d "$wt" ] && [ "$main" != "$wt" ]; then
  cp "$main/.env" "$wt/.env"
fi

exit 0
