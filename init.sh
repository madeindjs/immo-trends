#!/bin/bash

set -euo pipefail

DVF_API_URL="https://www.data.gouv.fr/api/1/datasets/r/d7933994-2c66-4131-a4da-cf7cd18040a4"
DVF_ARCHIVE="data/dvf.csv.gz"

mkdir -p data

file_size() {
  wc -c < "$1" | tr -d ' '
}

is_valid_archive() {
  local archive="$1"
  local expected_size="${2:-}"

  [[ -f "$archive" ]] || return 1
  gzip -t "$archive" 2>/dev/null || return 1

  if [[ -n "$expected_size" ]]; then
    [[ "$(file_size "$archive")" == "$expected_size" ]]
  fi
}

download_dvf() {
  local expected_size
  expected_size=$(
    curl -fsI -L "$DVF_API_URL" |
      awk 'tolower($1) == "content-length:" { len = $2 } END { gsub(/\r/, "", len); print len }'
  )

  if is_valid_archive "$DVF_ARCHIVE" "$expected_size"; then
    echo "Using existing $DVF_ARCHIVE"
    return 0
  fi

  if [[ -f "$DVF_ARCHIVE" ]]; then
    if [[ -n "$expected_size" && "$(file_size "$DVF_ARCHIVE")" -lt "$expected_size" ]]; then
      echo "Resuming download of $DVF_ARCHIVE ($(file_size "$DVF_ARCHIVE") / $expected_size bytes)..."
    else
      rm -f "$DVF_ARCHIVE"
      echo "Downloading $DVF_ARCHIVE..."
    fi
  else
    echo "Downloading $DVF_ARCHIVE..."
  fi

  curl -fL -C - \
    --retry 5 \
    --retry-all-errors \
    --retry-delay 5 \
    -o "$DVF_ARCHIVE" \
    "$DVF_API_URL"

  if ! is_valid_archive "$DVF_ARCHIVE" "$expected_size"; then
    echo "Download failed: $DVF_ARCHIVE is incomplete or corrupt" >&2
    exit 1
  fi
}

# Download the CSV.gz file from <https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres-geolocalisees>
download_dvf

# Unzip it
gunzip -f -k "$DVF_ARCHIVE"

# Import into SQLite and build map query indexes
sqlite3 dvf.sqlite3 < init.sql
