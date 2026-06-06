-- SQLite normalization script for DVF data
-- This script transforms the raw year tables into a normalized database schema

-- Step 1: Create communes reference table from distinct values across all years
CREATE TABLE communes AS
SELECT DISTINCT 
    "Code commune" as id,
    "Commune" as name,
    "Code departement" as department_code
FROM (
    SELECT "Code commune", "Commune", "Code departement" FROM "2021" WHERE "Code commune" IS NOT NULL AND "Code commune" != ''
    UNION SELECT "Code commune", "Commune", "Code departement" FROM "2022" WHERE "Code commune" IS NOT NULL AND "Code commune" != ''
    UNION SELECT "Code commune", "Commune", "Code departement" FROM "2023" WHERE "Code commune" IS NOT NULL AND "Code commune" != ''
    UNION SELECT "Code commune", "Commune", "Code departement" FROM "2024" WHERE "Code commune" IS NOT NULL AND "Code commune" != ''
    UNION SELECT "Code commune", "Commune", "Code departement" FROM "2025" WHERE "Code commune" IS NOT NULL AND "Code commune" != ''
);

CREATE UNIQUE INDEX idx_communes_id ON communes(id);

-- Step 2: Create nature_mutation reference table
CREATE TABLE nature_mutation AS
SELECT DISTINCT "Nature mutation" as id, "Nature mutation" as name
FROM (
    SELECT "Nature mutation" FROM "2021" WHERE "Nature mutation" IS NOT NULL AND "Nature mutation" != ''
    UNION SELECT "Nature mutation" FROM "2022" WHERE "Nature mutation" IS NOT NULL AND "Nature mutation" != ''
    UNION SELECT "Nature mutation" FROM "2023" WHERE "Nature mutation" IS NOT NULL AND "Nature mutation" != ''
    UNION SELECT "Nature mutation" FROM "2024" WHERE "Nature mutation" IS NOT NULL AND "Nature mutation" != ''
    UNION SELECT "Nature mutation" FROM "2025" WHERE "Nature mutation" IS NOT NULL AND "Nature mutation" != ''
);

CREATE UNIQUE INDEX idx_nature_mutation_id ON nature_mutation(id);

-- Step 3: Create the main dvf table by merging all years with proper types
CREATE TABLE dvf AS
-- 2021
SELECT 
    "No disposition" as disposition_number,
    -- Convert date from DD/MM/YYYY to YYYY-MM-DD
    substr("Date mutation", 7, 4) || '-' || substr("Date mutation", 4, 2) || '-' || substr("Date mutation", 1, 2) as mutation_date,
    nm.id as nature_mutation_id,
    -- Valeur fonciere: "468000,00" -> 468000 (extract integer part before comma)
    CAST(SUBSTR(COALESCE("Valeur fonciere", '0'), 1, INSTR(COALESCE("Valeur fonciere", '0'), ',') - 1) AS INTEGER) as property_value,
    "Code postal" as postal_code,
    c.id as commune_id,
    "Code departement" as department_code,
    -- Sum all surface lot columns (handle comma as decimal point)
    CAST(COALESCE(REPLACE("Surface Carrez du 1er lot", ',', '.'), '0') AS REAL) +
    CAST(COALESCE(REPLACE("Surface Carrez du 2eme lot", ',', '.'), '0') AS REAL) +
    CAST(COALESCE(REPLACE("Surface Carrez du 3eme lot", ',', '.'), '0') AS REAL) +
    CAST(COALESCE(REPLACE("Surface Carrez du 4eme lot", ',', '.'), '0') AS REAL) +
    CAST(COALESCE(REPLACE("Surface Carrez du 5eme lot", ',', '.'), '0') AS REAL) as total_surface_carrez,
    -- Nombre pieces principales: convert to integer
    CAST(COALESCE("Nombre pieces principales", '0') AS INTEGER) as main_rooms_count,
    "Type local" as property_type,
    "Code type local" as property_type_code,
    -- Surface terrain: convert to float (comma to dot)
    CAST(REPLACE(COALESCE("Surface terrain", '0'), ',', '.') AS REAL) as land_area,
    '2021' as year
FROM "2021"
LEFT JOIN communes c ON "2021"."Code commune" = c.id
LEFT JOIN nature_mutation nm ON "2021"."Nature mutation" = nm.id

UNION ALL

-- 2022
SELECT 
    "No disposition" as disposition_number,
    substr("Date mutation", 7, 4) || '-' || substr("Date mutation", 4, 2) || '-' || substr("Date mutation", 1, 2) as mutation_date,
    nm.id as nature_mutation_id,
    CAST(SUBSTR(COALESCE("Valeur fonciere", '0'), 1, INSTR(COALESCE("Valeur fonciere", '0'), ',') - 1) AS INTEGER) as property_value,
    "Code postal" as postal_code,
    c.id as commune_id,
    "Code departement" as department_code,
    CAST(COALESCE(REPLACE("Surface Carrez du 1er lot", ',', '.'), '0') AS REAL) +
    CAST(COALESCE(REPLACE("Surface Carrez du 2eme lot", ',', '.'), '0') AS REAL) +
    CAST(COALESCE(REPLACE("Surface Carrez du 3eme lot", ',', '.'), '0') AS REAL) +
    CAST(COALESCE(REPLACE("Surface Carrez du 4eme lot", ',', '.'), '0') AS REAL) +
    CAST(COALESCE(REPLACE("Surface Carrez du 5eme lot", ',', '.'), '0') AS REAL) as total_surface_carrez,
    CAST(COALESCE("Nombre pieces principales", '0') AS INTEGER) as main_rooms_count,
    "Type local" as property_type,
    "Code type local" as property_type_code,
    CAST(REPLACE(COALESCE("Surface terrain", '0'), ',', '.') AS REAL) as land_area,
    '2022' as year
FROM "2022"
LEFT JOIN communes c ON "2022"."Code commune" = c.id
LEFT JOIN nature_mutation nm ON "2022"."Nature mutation" = nm.id

UNION ALL

-- 2023
SELECT 
    "No disposition" as disposition_number,
    substr("Date mutation", 7, 4) || '-' || substr("Date mutation", 4, 2) || '-' || substr("Date mutation", 1, 2) as mutation_date,
    nm.id as nature_mutation_id,
    CAST(SUBSTR(COALESCE("Valeur fonciere", '0'), 1, INSTR(COALESCE("Valeur fonciere", '0'), ',') - 1) AS INTEGER) as property_value,
    "Code postal" as postal_code,
    c.id as commune_id,
    "Code departement" as department_code,
    CAST(COALESCE(REPLACE("Surface Carrez du 1er lot", ',', '.'), '0') AS REAL) +
    CAST(COALESCE(REPLACE("Surface Carrez du 2eme lot", ',', '.'), '0') AS REAL) +
    CAST(COALESCE(REPLACE("Surface Carrez du 3eme lot", ',', '.'), '0') AS REAL) +
    CAST(COALESCE(REPLACE("Surface Carrez du 4eme lot", ',', '.'), '0') AS REAL) +
    CAST(COALESCE(REPLACE("Surface Carrez du 5eme lot", ',', '.'), '0') AS REAL) as total_surface_carrez,
    CAST(COALESCE("Nombre pieces principales", '0') AS INTEGER) as main_rooms_count,
    "Type local" as property_type,
    "Code type local" as property_type_code,
    CAST(REPLACE(COALESCE("Surface terrain", '0'), ',', '.') AS REAL) as land_area,
    '2023' as year
FROM "2023"
LEFT JOIN communes c ON "2023"."Code commune" = c.id
LEFT JOIN nature_mutation nm ON "2023"."Nature mutation" = nm.id

UNION ALL

-- 2024
SELECT 
    "No disposition" as disposition_number,
    substr("Date mutation", 7, 4) || '-' || substr("Date mutation", 4, 2) || '-' || substr("Date mutation", 1, 2) as mutation_date,
    nm.id as nature_mutation_id,
    CAST(SUBSTR(COALESCE("Valeur fonciere", '0'), 1, INSTR(COALESCE("Valeur fonciere", '0'), ',') - 1) AS INTEGER) as property_value,
    "Code postal" as postal_code,
    c.id as commune_id,
    "Code departement" as department_code,
    CAST(COALESCE(REPLACE("Surface Carrez du 1er lot", ',', '.'), '0') AS REAL) +
    CAST(COALESCE(REPLACE("Surface Carrez du 2eme lot", ',', '.'), '0') AS REAL) +
    CAST(COALESCE(REPLACE("Surface Carrez du 3eme lot", ',', '.'), '0') AS REAL) +
    CAST(COALESCE(REPLACE("Surface Carrez du 4eme lot", ',', '.'), '0') AS REAL) +
    CAST(COALESCE(REPLACE("Surface Carrez du 5eme lot", ',', '.'), '0') AS REAL) as total_surface_carrez,
    CAST(COALESCE("Nombre pieces principales", '0') AS INTEGER) as main_rooms_count,
    "Type local" as property_type,
    "Code type local" as property_type_code,
    CAST(REPLACE(COALESCE("Surface terrain", '0'), ',', '.') AS REAL) as land_area,
    '2024' as year
FROM "2024"
LEFT JOIN communes c ON "2024"."Code commune" = c.id
LEFT JOIN nature_mutation nm ON "2024"."Nature mutation" = nm.id

UNION ALL

-- 2025
SELECT 
    "No disposition" as disposition_number,
    substr("Date mutation", 7, 4) || '-' || substr("Date mutation", 4, 2) || '-' || substr("Date mutation", 1, 2) as mutation_date,
    nm.id as nature_mutation_id,
    CAST(SUBSTR(COALESCE("Valeur fonciere", '0'), 1, INSTR(COALESCE("Valeur fonciere", '0'), ',') - 1) AS INTEGER) as property_value,
    "Code postal" as postal_code,
    c.id as commune_id,
    "Code departement" as department_code,
    CAST(COALESCE(REPLACE("Surface Carrez du 1er lot", ',', '.'), '0') AS REAL) +
    CAST(COALESCE(REPLACE("Surface Carrez du 2eme lot", ',', '.'), '0') AS REAL) +
    CAST(COALESCE(REPLACE("Surface Carrez du 3eme lot", ',', '.'), '0') AS REAL) +
    CAST(COALESCE(REPLACE("Surface Carrez du 4eme lot", ',', '.'), '0') AS REAL) +
    CAST(COALESCE(REPLACE("Surface Carrez du 5eme lot", ',', '.'), '0') AS REAL) as total_surface_carrez,
    CAST(COALESCE("Nombre pieces principales", '0') AS INTEGER) as main_rooms_count,
    "Type local" as property_type,
    "Code type local" as property_type_code,
    CAST(REPLACE(COALESCE("Surface terrain", '0'), ',', '.') AS REAL) as land_area,
    '2025' as year
FROM "2025"
LEFT JOIN communes c ON "2025"."Code commune" = c.id
LEFT JOIN nature_mutation nm ON "2025"."Nature mutation" = nm.id;

-- Step 4: Create indexes for query performance
CREATE INDEX idx_dvf_year ON dvf(year);
CREATE INDEX idx_dvf_commune_id ON dvf(commune_id);
CREATE INDEX idx_dvf_postal_code ON dvf(postal_code);
CREATE INDEX idx_dvf_property_type ON dvf(property_type);
CREATE INDEX idx_dvf_nature_mutation_id ON dvf(nature_mutation_id);
CREATE INDEX idx_dvf_mutation_date ON dvf(mutation_date);
CREATE INDEX idx_dvf_year_postal ON dvf(year, postal_code);

-- Step 5: Clean up - drop temporary year tables
DROP TABLE IF EXISTS "2021";
DROP TABLE IF EXISTS "2022";
DROP TABLE IF EXISTS "2023";
DROP TABLE IF EXISTS "2024";
DROP TABLE IF EXISTS "2025";

-- Step 6: Optimize database file
VACUUM;
