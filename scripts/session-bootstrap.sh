#!/usr/bin/env bash
#
# Bootstraps a fully isolated dev environment for the current worktree.
#
# Assumes it runs inside an existing worktree (e.g. triggered by EnterWorktree
# hook or invoked manually). Does NOT create worktrees.
#
# What it does:
#   1. Trusts mise and installs tools
#   2. Allocates free ports for DB, API, and Web
#   3. Generates a .env.session file
#   4. Installs dependencies
#   5. Starts an isolated PostgreSQL container
#   6. Runs migrations + seeds
#   7. Starts API + Web dev servers in the background
#
# Usage:
#   cd .claude/worktrees/my-feature && scripts/session-bootstrap.sh
#   # or triggered automatically via PostToolUse hook on EnterWorktree

set -euo pipefail

SESSION_NAME="$(basename "$(pwd)")"
# In a worktree, --show-toplevel returns the worktree root, not the main repo.
# Use --git-common-dir to find the shared .git dir and derive the main repo root.
REPO_ROOT="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"

echo "==> Bootstrapping session: ${SESSION_NAME}"

# 1. Trust mise in the worktree, install tools, and activate in this shell
echo "==> Installing tools via mise..."
mise trust
mise install
eval "$(mise activate bash)"

# 2. Allocate free ports
echo "==> Allocating ports..."
DB_PORT=$("$REPO_ROOT/scripts/find-free-port.sh" 5432)
API_PORT=$("$REPO_ROOT/scripts/find-free-port.sh" 8000)
WEB_PORT=$("$REPO_ROOT/scripts/find-free-port.sh" 5173)
echo "    DB=$DB_PORT  API=$API_PORT  Web=$WEB_PORT"

# 3. Generate .env.session in the worktree
echo "==> Writing .env.session..."
cat > .env.session <<EOF
POSTGRES_HOST=localhost
POSTGRES_PORT=$DB_PORT
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=tailoredin_${SESSION_NAME}
POSTGRES_SCHEMA=public
API_PORT=$API_PORT
VITE_PORT=$WEB_PORT
TZ=UTC
COMPOSE_PROJECT_NAME=tailoredin-${SESSION_NAME}
BUN_ENV_FILE=.env.session
EOF

# 4. Install dependencies (needed before migrations can run)
echo "==> Installing dependencies..."
bun install --frozen-lockfile

# 5. Start PostgreSQL with unique project name + volume
echo "==> Starting PostgreSQL (project: tailoredin-${SESSION_NAME})..."
docker compose -f "$REPO_ROOT/compose.session.yaml" --env-file .env.session up -d

# 6. Wait for PostgreSQL, run migrations + seeds
"$REPO_ROOT/scripts/session-db-setup.sh" "$DB_PORT" "tailoredin_${SESSION_NAME}"

# 7. Start dev servers (background)
echo "==> Starting dev servers..."
BUN_ENV_FILE=.env.session bun run dev &

echo "==> Session ${SESSION_NAME} ready!"
echo "    API: http://localhost:${API_PORT}"
echo "    Web: http://localhost:${WEB_PORT}"
echo "    DB:  localhost:${DB_PORT}"
