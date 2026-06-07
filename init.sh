#!/bin/bash

set -e

# Create data directory if it doesn't exist
mkdir -p data

# Download the CSV.gz file if it doesn't exist from <https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres-geolocalisees>
if [ ! -f data/dvf.csv.gz ]; then
  curl -L -o data/dvf.csv.gz "https://www.data.gouv.fr/api/1/datasets/r/d7933994-2c66-4131-a4da-cf7cd18040a4"
fi

# Unzip it
gunzip -f -k data/dvf.csv.gz

# Import into SQLite
sqlite3 dvf.sqlite3 <init.sql

