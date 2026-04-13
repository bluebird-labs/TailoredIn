#!/usr/bin/env bash
# PostToolUse hook for EnterWorktree: copies .env.wt, trusts mise, and installs deps
set -euo pipefail

input=$(cat)
wt=$(echo "$input" | jq -r '.cwd')
main=$(git worktree list --porcelain 2>/dev/null | head -1 | sed 's/^worktree //')

if [ -n "$main" ] && [ -d "$wt" ] && [ "$main" != "$wt" ]; then
  if [ -f "$main/.env.wt" ]; then
    cp "$main/.env.wt" "$wt/.env"
  fi
  cd "$wt"
  mise trust
  bun install
fi

exit 0
