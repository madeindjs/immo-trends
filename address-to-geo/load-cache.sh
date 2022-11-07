#!/bin/bash


if [[ ! -d adresse.data.gouv.fr ]]; then
  # echo "/tmp exists";
  wget -r --no-parent https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/
  gzip -d adresse.data.gouv.fr/data/ban/adresses/latest/csv/*.gz
fi

if [ ! -f france.sqlite ]; then
  for csv_file in adresse.data.gouv.fr/data/ban/adresses/latest/csv/*.csv; do
    table=$(basename "$csv_file" | sed -e "s/\.csv//")

    if [[ $table = adresses-* ]] && [[ $table != adresses-france ]]
    then
      echo "- importing $table..."
      sqlite3 france.sqlite << EOF
.separator ";"
.import $csv_file $table
EOF
    fi
  done
fi
