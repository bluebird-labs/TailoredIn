#!/usr/bin/env bash
#
# Backs up the TailoredIn PostgreSQL database to a timestamped .sql.gz file.
#
# Usage:
#   ./scripts/db-backup.sh                  # backs up to .local/backups/
#   ./scripts/db-backup.sh /path/to/dir     # backs up to custom directory
#
# Requires: docker CLI with access to the tailored-in-postgres-1 container.

set -euo pipefail

CONTAINER="tailored-in-postgres-1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="${1:-${REPO_ROOT}/.local/backups}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
FILENAME="tailoredin-${TIMESTAMP}.sql.gz"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Verify container is running
if ! docker inspect "$CONTAINER" --format '{{.State.Running}}' 2>/dev/null | grep -q true; then
  echo "Error: Container '$CONTAINER' is not running." >&2
  exit 1
fi

# Dump all databases (custom format is smaller, but .sql.gz is more portable)
echo "Backing up to ${BACKUP_DIR}/${FILENAME}..."
docker exec "$CONTAINER" pg_dumpall -U postgres | gzip > "${BACKUP_DIR}/${FILENAME}"

# Prune backups older than 30 days
find "$BACKUP_DIR" -name "tailoredin-*.sql.gz" -mtime +30 -delete 2>/dev/null || true

SIZE=$(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)
echo "Done. Backup: ${BACKUP_DIR}/${FILENAME} (${SIZE})"
