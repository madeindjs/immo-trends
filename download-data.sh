#!/bin/bash

mkdir -p data

while IFS=: read -r year url; do
  year=$(echo "$year" | tr -d '" ')
  url=$(echo "$url" | tr -d '" ')
  if [[ -n "$year" && -n "$url" ]]; then
    echo "Downloading $year..."
    tmpdir=$(mktemp -d)
    tmpfile="$tmpdir/download"
    
    curl -L -s "$url" -o "$tmpfile"
    
    # Check if it's a zip file
    if file "$tmpfile" | grep -q "Zip archive"; then
      unzip -o -q "$tmpfile" -d "$tmpdir"
      # Find the extracted file
      extracted=$(find "$tmpdir" -type f \( -name "*.txt" -o -name "*.csv" \) | head -1)
      if [[ -n "$extracted" ]]; then
        mv "$extracted" "data/${year}.csv"
      else
        echo "Warning: Could not find extracted file for $year"
        mv "$tmpfile" "data/${year}.csv"
      fi
    else
      mv "$tmpfile" "data/${year}.csv"
    fi
    
    rm -rf "$tmpdir"
  fi
done < <(jq -r 'to_entries[] | "\(.key):\(.value)"' dvf-sources.json)
