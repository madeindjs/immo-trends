#!/bin/bash
set -euo pipefail

# The SQLite database is persisted in a named Docker volume mounted at
# /app/data (see docker-compose.yml). We mount on a directory rather than
# directly on the SQLite file: when a volume target does not exist in the
# image, Docker materializes an empty directory at that path, which would
# otherwise trap us writing dvf.sqlite3 *inside* that directory instead of
# at the path the app reads.
#
# On first deploy, the volume is empty and /app/data/dvf.sqlite3 is
# absent: the entrypoint runs init.sh to bootstrap the database. On
# subsequent deploys the file already exists in the volume, the entrypoint
# skips the download, and the Nuxt server starts immediately. This
# avoids re-downloading and re-importing the ~6 GB dataset on every
# image release.

DATA_DIR=/app/data
DB_FILE="$DATA_DIR/dvf.sqlite3"

if [ ! -f "$DB_FILE" ]; then
  echo "$DB_FILE not found in volume, initializing database..."
  mkdir -p "$DATA_DIR"
  cd /app
  ./init.sh
  echo "Moving dvf.sqlite3 into volume..."
  mv /app/dvf.sqlite3 "$DB_FILE"
  echo "Removing downloaded files to free space..."
  rm -f data/dvf.csv.gz data/dvf.csv
else
  echo "$DB_FILE found in volume, skipping initialization."
fi

exec node /app/.output/server/index.mjs
