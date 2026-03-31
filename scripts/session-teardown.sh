#!/usr/bin/env bash
#
# Tears down the session environment: stops containers, removes volumes.
#
# Usage:
#   session-teardown.sh <worktree_path>
#   session-teardown.sh .claude/worktrees/my-feature

set -euo pipefail

WORKTREE_PATH="${1:-.}"
SESSION_NAME="$(basename "$(cd "$WORKTREE_PATH" && pwd)")"
REPO_ROOT="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"

echo "==> Tearing down session: ${SESSION_NAME}"

cd "$WORKTREE_PATH"

if [ -f .env.session ]; then
  echo "==> Stopping PostgreSQL container..."
  docker compose -f "$REPO_ROOT/compose.session.yaml" --env-file .env.session down -v
  echo "==> Session ${SESSION_NAME} torn down."
else
  echo "Warning: No .env.session found in ${WORKTREE_PATH} — nothing to tear down." >&2
fi
