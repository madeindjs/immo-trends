#!/bin/bash

set -euo pipefail

DVF_API_URL="https://www.data.gouv.fr/api/1/datasets/r/d7933994-2c66-4131-a4da-cf7cd18040a4"
DVF_ARCHIVE="data/dvf.csv.gz"
IRIS_RESOURCE="CONTOURS-IRIS_3-0__GPKG_LAMB93_FXX_2024-01-01"
IRIS_ARCHIVE="data/${IRIS_RESOURCE}.7z"
IRIS_GPKG="data/CONTOURS-IRIS.gpkg"
IRIS_NDJSON="data/iris.ndjson"

mkdir -p data

file_size() {
  wc -c <"$1" | tr -d ' '
}

is_valid_gzip_archive() {
  local archive="$1"
  local expected_size="${2:-}"

  [[ -f "$archive" ]] || return 1
  gzip -t "$archive" 2>/dev/null || return 1

  if [[ -n "$expected_size" ]]; then
    [[ "$(file_size "$archive")" == "$expected_size" ]]
  fi
}

is_valid_7z_archive() {
  local archive="$1"
  local expected_size="${2:-}"

  [[ -f "$archive" ]] || return 1
  7z t "$archive" >/dev/null 2>&1 || return 1

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

  if is_valid_gzip_archive "$DVF_ARCHIVE" "$expected_size"; then
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

  if ! is_valid_gzip_archive "$DVF_ARCHIVE" "$expected_size"; then
    echo "Download failed: $DVF_ARCHIVE is incomplete or corrupt" >&2
    exit 1
  fi
}

# Download the CSV.gz file from <https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres-geolocalisees>
download_dvf

# Unzip it
gunzip -f -k "$DVF_ARCHIVE"

# Import into SQLite and build map query indexes
sqlite3 dvf.sqlite3 <init.sql

download_iris() {
  local iris_url="https://data.geopf.fr/telechargement/download/CONTOURS-IRIS-PE/CONTOURS-IRIS-PE_3-0__GPKG_WGS84G_FRA_2026-01-01/CONTOURS-IRIS-PE_3-0__GPKG_WGS84G_FRA_2026-01-01.7z"
  local expected_size
  expected_size=$(
    curl -fsI -L "$iris_url" |
      awk 'tolower($1) == "content-length:" { len = $2 } END { gsub(/\r/, "", len); print len }'
  )

  if is_valid_7z_archive "$IRIS_ARCHIVE" "$expected_size"; then
    echo "Using existing $IRIS_ARCHIVE"
    return 0
  fi

  if [[ -f "$IRIS_ARCHIVE" ]]; then
    if [[ -n "$expected_size" && "$(file_size "$IRIS_ARCHIVE")" -lt "$expected_size" ]]; then
      echo "Resuming download of $IRIS_ARCHIVE ($(file_size "$IRIS_ARCHIVE") / $expected_size bytes)..."
    else
      rm -f "$IRIS_ARCHIVE"
      echo "Downloading $IRIS_ARCHIVE..."
    fi
  else
    echo "Downloading $IRIS_ARCHIVE..."
  fi

  curl -fL -C - \
    --retry 5 \
    --retry-all-errors \
    --retry-delay 5 \
    -o "$IRIS_ARCHIVE" \
    "$iris_url"

  if ! is_valid_7z_archive "$IRIS_ARCHIVE" "$expected_size"; then
    echo "Download failed: $IRIS_ARCHIVE is incomplete or corrupt" >&2
    exit 1
  fi
}

import_iris() {
  if [[ ! -f "$IRIS_NDJSON" || "$IRIS_ARCHIVE" -nt "$IRIS_NDJSON" ]]; then
    echo "Extracting $IRIS_ARCHIVE..."
    rm -f "$IRIS_GPKG" "$IRIS_NDJSON"
    7z x -y -o"data" "$IRIS_ARCHIVE"

    local extracted_gpkg
    extracted_gpkg=$(find data -maxdepth 2 -name "*.gpkg" | head -n 1)
    if [[ -z "$extracted_gpkg" ]]; then
      echo "No GPKG file found in $IRIS_ARCHIVE" >&2
      exit 1
    fi

    cp "$extracted_gpkg" "$IRIS_GPKG"

    echo "Converting IRIS GPKG to WGS84 NDJSON..."
    ogr2ogr \
      -t_srs EPSG:4326 \
      -dim XY \
      -lco COORDINATE_PRECISION=6 \
      -f GeoJSONSeq \
      "$IRIS_NDJSON" \
      "$IRIS_GPKG"
  else
    echo "Using existing $IRIS_NDJSON"
  fi

  echo "Importing IRIS zones into dvf.sqlite3..."
  node --experimental-strip-types scripts/import-iris.ts

  echo "Joining DVF transactions to IRIS zones..."
  node --experimental-strip-types scripts/join-dvf-iris.ts
}

# Download and import IRIS contours
download_iris
import_iris
