#!/bin/bash
set -euo pipefail

if [ ! -f /app/dvf.sqlite3 ]; then
  echo "dvf.sqlite3 not found, initializing database..."
  cd /app
  ./init.sh
  echo "Removing downloaded files to free space..."
  rm -f data/dvf.csv.gz data/dvf.csv
else
  echo "dvf.sqlite3 already exists, skipping initialization."
fi

exec node /app/.output/server/index.mjs
