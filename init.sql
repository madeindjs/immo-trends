DROP TABLE IF EXISTS "dvf";

CREATE TABLE "dvf"(
  "id_mutation" TEXT,
  "date_mutation" DATE,
  "numero_disposition" TEXT,
  "nature_mutation" TEXT,
  "valeur_fonciere" TEXT,
  "adresse_numero" TEXT,
  "adresse_suffixe" TEXT,
  "adresse_nom_voie" TEXT,
  "adresse_code_voie" TEXT,
  "code_postal" TEXT,
  "code_commune" TEXT,
  "nom_commune" TEXT,
  "code_departement" TEXT,
  "ancien_code_commune" TEXT,
  "ancien_nom_commune" TEXT,
  "id_parcelle" TEXT,
  "ancien_id_parcelle" TEXT,
  "numero_volume" TEXT,
  "lot1_numero" TEXT,
  "lot1_surface_carrez" FLOAT,
  "lot2_numero" TEXT,
  "lot2_surface_carrez" FLOAT,
  "lot3_numero" TEXT,
  "lot3_surface_carrez" FLOAT,
  "lot4_numero" TEXT,
  "lot4_surface_carrez" FLOAT,
  "lot5_numero" TEXT,
  "lot5_surface_carrez" FLOAT,
  "nombre_lots" INTEGER,
  "code_type_local" TEXT,
  "type_local" TEXT,
  "surface_reelle_bati" INTEGER,
  "nombre_pieces_principales" INTEGER,
  "code_nature_culture" TEXT,
  "nature_culture" TEXT,
  "code_nature_culture_speciale" TEXT,
  "nature_culture_speciale" TEXT,
  "surface_terrain" INTEGER,
  "longitude" FLOAT,
  "latitude" FLOAT,
  "code_iris" TEXT
);

.import -skip 1 -csv data/dvf.csv dvf

DELETE FROM dvf WHERE type_local IS NULL;

.read indexes.sql
