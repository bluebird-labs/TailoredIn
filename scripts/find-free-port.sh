#!/usr/bin/env bash
#
# Finds the first available TCP port starting from a given base.
#
# Usage:
#   find-free-port.sh [base_port]
#
# Outputs the first free port. Searches up to base+100 before giving up.

set -euo pipefail

BASE=${1:-3000}
PORT=$BASE

while lsof -iTCP:"$PORT" -sTCP:LISTEN &>/dev/null; do
  PORT=$((PORT + 1))
  if [ "$PORT" -gt $((BASE + 100)) ]; then
    echo "No free port found in range ${BASE}-${PORT}" >&2
    exit 1
  fi
done

echo "$PORT"
