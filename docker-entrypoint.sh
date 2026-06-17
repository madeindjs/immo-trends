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
  cd "$DATA_DIR"
  # init.sh writes the archive into ./data/ and the SQLite database into
  # the current directory (./dvf.sqlite3 == /app/data/dvf.sqlite3).
  /app/init.sh
  echo "Removing downloaded files to free space..."
  rm -rf data dvf.csv dvf.csv.gz
else
  echo "$DB_FILE found in volume, skipping initialization."
fi

exec node /app/.output/server/index.mjs
