#!/bin/bash
set -euo pipefail

if [ ! -f /app/dvf.sqlite3 ]; then
  echo "dvf.sqlite3 not found, initializing database..."
  cd /app
  ./init.sh
else
  echo "dvf.sqlite3 already exists, skipping initialization."
fi

exec node /app/.output/server/index.mjs
