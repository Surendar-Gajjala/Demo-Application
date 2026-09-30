#!/usr/bin/env bash
# Runs db/tests/verify.sql against the running postgres container.
# Usage (from repo root): bash db/run-verify.sh
set -euo pipefail
cd "$(dirname "$0")/.."

docker compose exec -T postgres sh -c \
  'psql -v ON_ERROR_STOP=1 -q -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  < db/tests/verify.sql
