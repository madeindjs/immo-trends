#!/bin/bash
wget -r --no-parent https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/
gzip -d adresse.data.gouv.fr/data/ban/adresses/latest/csv/*.gz

# wget https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-france.csv.gz
# gzip -d adresses-france.csv.gz