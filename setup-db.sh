#!/bin/bash
set -e

# Setup SQLite database from DVF CSV files
# This script:
# 1. Creates data directory if it doesn't exist
# 2. Downloads missing data files using download-data.sh
# 3. Creates a fresh SQLite database
# 4. Imports all CSV files as year tables
# 5. Runs normalization SQL to create proper schema

mkdir -p data

# Download data (download-data.sh checks if files exist before downloading)
./download-data.sh

# Database file
DB="immo-trends.db"

# Remove existing database to start fresh
if [ -f "$DB" ]; then
    echo "Removing existing database: $DB"
    rm "$DB"
fi

echo "Creating database: $DB"

# Import each CSV file as a table named by year
for csv in data/*.csv; do
    # Skip non-CSV files (like .~lock files)
    if [[ "$csv" == *.*~* ]] || [[ "$csv" != *.csv ]]; then
        continue
    fi
    
    # Extract year from filename (e.g., "2025.csv" -> "2025")
    year=$(basename "$csv" .csv)
    
    echo "Importing $csv as table $year..."
    
    # Import using sqlite3
    # .mode csv: interpret input as CSV
    # .separator |: use pipe as field separator
    # .import: import the file into a table
    sqlite3 "$DB" ".mode csv" ".separator |" ".import $csv $year"
    
    echo "  Imported $(sqlite3 "$DB" "SELECT COUNT(*) FROM \"$year\";") rows"
done

# Run normalization
echo "Running normalization..."
sqlite3 "$DB" < normalize.sql

echo "Database setup complete: $DB"

# Show summary
sqlite3 "$DB" "SELECT 'dvf', COUNT(*) FROM dvf UNION ALL SELECT 'communes', COUNT(*) FROM communes UNION ALL SELECT 'nature_mutation', COUNT(*) FROM nature_mutation;"
