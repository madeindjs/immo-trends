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
BUILD_FILE=/app/dvf.sqlite3

mkdir -p "$DATA_DIR"
rm -f "$DATA_DIR"/dvf.sqlite3.tmp.*

install_db() {
  echo "Copying built database into volume..."
  local tmp="$DATA_DIR/dvf.sqlite3.tmp.$$"

  # Copy (don't mv) across filesystems: a move between the container
  # overlay and the bind-mounted volume is a non-atomic copy. Build the
  # final file under a temporary name on the same volume, verify it, then
  # atomically rename it into place.
  cp "$BUILD_FILE" "$tmp"

  if ! sqlite3 "$tmp" 'PRAGMA quick_check;' >/dev/null 2>&1; then
    echo "Database integrity check failed after copy" >&2
    rm -f "$tmp"
    return 1
  fi

  mv "$tmp" "$DB_FILE"
  echo "Database installed successfully."
}

initialize() {
  echo "$DB_FILE not found or unusable, initializing database..."

  cd /app
  ./init.sh

  install_db

  echo "Removing downloaded CSV files to free space..."
  rm -f data/dvf.csv.gz data/dvf.csv

  # The build file lives in the overlay; it is safe to remove once copied.
  rm -f "$BUILD_FILE"
}

if [ ! -f "$DB_FILE" ]; then
  initialize
else
  echo "$DB_FILE found in volume, verifying database..."
  if sqlite3 "$DB_FILE" 'PRAGMA quick_check;' >/dev/null 2>&1; then
    echo "$DB_FILE is valid, skipping initialization."
  else
    echo "$DB_FILE is corrupted; backing it up and reinitializing..."
    mv "$DB_FILE" "$DB_FILE.corrupt.$(date +%s)"
    initialize
  fi
fi

exec node /app/.output/server/index.mjs
