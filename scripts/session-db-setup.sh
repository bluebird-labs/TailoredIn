#!/usr/bin/env bash
#
# Waits for PostgreSQL to be ready, then runs migrations and seeds.
#
# Usage:
#   session-db-setup.sh <port> <db_name>

set -euo pipefail

# Ensure mise-managed tools (bun) are in PATH
if command -v mise &>/dev/null; then
  eval "$(mise activate bash)"
fi

DB_PORT="$1"
DB_NAME="$2"
COMPOSE_PROJECT="${3:-tailoredin-${DB_NAME#tailoredin_}}"
CONTAINER="${COMPOSE_PROJECT}-postgres-1"

echo "==> Waiting for PostgreSQL on port ${DB_PORT} (container: ${CONTAINER})..."
for i in $(seq 1 30); do
  if docker exec "$CONTAINER" pg_isready -U postgres &>/dev/null; then
    echo "    PostgreSQL ready after ${i}s"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "Error: PostgreSQL did not become ready within 30s" >&2
    exit 1
  fi
  sleep 1
done

echo "==> Running migrations..."
POSTGRES_HOST=localhost POSTGRES_PORT="$DB_PORT" POSTGRES_USER=postgres \
  POSTGRES_PASSWORD=postgres POSTGRES_DB="$DB_NAME" POSTGRES_SCHEMA=public TZ=UTC \
  bun run --cwd infrastructure migration:up

echo "==> Seeding reference data..."
(cd infrastructure && \
  POSTGRES_HOST=localhost POSTGRES_PORT="$DB_PORT" POSTGRES_USER=postgres \
  POSTGRES_PASSWORD=postgres POSTGRES_DB="$DB_NAME" POSTGRES_SCHEMA=public TZ=UTC \
  bunx mikro-orm seeder:run --class SkillsSeeder && \
  POSTGRES_HOST=localhost POSTGRES_PORT="$DB_PORT" POSTGRES_USER=postgres \
  POSTGRES_PASSWORD=postgres POSTGRES_DB="$DB_NAME" POSTGRES_SCHEMA=public TZ=UTC \
  bunx mikro-orm seeder:run --class ResumeDataSeeder)

echo "==> Database ready: ${DB_NAME} on port ${DB_PORT}"
