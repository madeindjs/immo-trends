// @ts-check
const path = require("path");
const fs = require("fs");
const readline = require("readline");
const Database = require("better-sqlite3");
const ProgressBar = require("progress");
const { execSync } = require("child_process");
const { parseDateFr, parseIntFr, parseFloatFr } = require("./import-data-helpers");

// Actual field names from the CSV files
const fields = [
  "Identifiant de document",
  "Reference document",
  "1 Articles CGI",
  "2 Articles CGI",
  "3 Articles CGI",
  "4 Articles CGI",
  "5 Articles CGI",
  "No disposition",
  "Date mutation",
  "Nature mutation",
  "Valeur fonciere",
  "No voie",
  "B/T/Q",
  "Type de voie",
  "Code voie",
  "Voie",
  "Code postal",
  "Commune",
  "Code departement",
  "Code commune",
  "Prefixe de section",
  "Section",
  "No plan",
  "No Volume",
  "1er lot",
  "Surface Carrez du 1er lot",
  "2eme lot",
  "Surface Carrez du 2eme lot",
  "3eme lot",
  "Surface Carrez du 3eme lot",
  "4eme lot",
  "Surface Carrez du 4eme lot",
  "5eme lot",
  "Surface Carrez du 5eme lot",
  "Nombre de lots",
  "Code type local",
  "Type local",
  "Identifiant local",
  "Surface reelle bati",
  "Nombre pieces principales",
  "Nature culture",
  "Nature culture speciale",
  "Surface terrain"
];

// Field indices
const dateMutationIndex = fields.indexOf("Date mutation");
const natureMutationIndex = fields.indexOf("Nature mutation");
const valeurFonciereIndex = fields.indexOf("Valeur fonciere");
const codePostalIndex = fields.indexOf("Code postal");
const communeIndex = fields.indexOf("Commune");
const codeCommuneIndex = fields.indexOf("Code commune");
const codeDepartementIndex = fields.indexOf("Code departement");
const typeLocalIndex = fields.indexOf("Type local");
const codeTypeLocalIndex = fields.indexOf("Code type local");
const noDispositionIndex = fields.indexOf("No disposition");
const noVoieIndex = fields.indexOf("No voie");
const voieIndex = fields.indexOf("Voie");
const btqIndex = fields.indexOf("B/T/Q");
const typeVoieIndex = fields.indexOf("Type de voie");
const codeVoieIndex = fields.indexOf("Code voie");
const noPlanIndex = fields.indexOf("No plan");
const noVolumeIndex = fields.indexOf("No Volume");
const lot1Index = fields.indexOf("1er lot");
const lot2Index = fields.indexOf("2eme lot");
const lot3Index = fields.indexOf("3eme lot");
const lot4Index = fields.indexOf("4eme lot");
const lot5Index = fields.indexOf("5eme lot");
const surfaceCarrez1Index = fields.indexOf("Surface Carrez du 1er lot");
const surfaceCarrez2Index = fields.indexOf("Surface Carrez du 2eme lot");
const surfaceCarrez3Index = fields.indexOf("Surface Carrez du 3eme lot");
const surfaceCarrez4Index = fields.indexOf("Surface Carrez du 4eme lot");
const surfaceCarrez5Index = fields.indexOf("Surface Carrez du 5eme lot");
const nombrePiecesIndex = fields.indexOf("Nombre pieces principales");
const surfaceTerrainIndex = fields.indexOf("Surface terrain");
const surfaceReelleBatiIndex = fields.indexOf("Surface reelle bati");
const nombreLotsIndex = fields.indexOf("Nombre de lots");
const identifiantDocumentIndex = fields.indexOf("Identifiant de document");
const referenceDocumentIndex = fields.indexOf("Reference document");
const articles1Index = fields.indexOf("1 Articles CGI");
const articles2Index = fields.indexOf("2 Articles CGI");
const articles3Index = fields.indexOf("3 Articles CGI");
const articles4Index = fields.indexOf("4 Articles CGI");
const articles5Index = fields.indexOf("5 Articles CGI");
const prefixeSectionIndex = fields.indexOf("Prefixe de section");
const sectionIndex = fields.indexOf("Section");
const identifiantLocalIndex = fields.indexOf("Identifiant local");
const natureCultureIndex = fields.indexOf("Nature culture");
const natureCultureSpecialeIndex = fields.indexOf("Nature culture speciale");

const dataFolder = path.join(__dirname, "data");
const dbPath = path.join(__dirname, "immo-trends.db");

/**
 * Extract year from filename
 * @param {string} filename
 * @returns {number | null}
 */
function extractYear(filename) {
  const match = filename.match(/(\d{4})/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Get string value from row at index
 * @param {string[]} row
 * @param {number} index
 * @returns {string | undefined}
 */
function getString(row, index) {
  const value = row[index];
  return value === '' ? undefined : value;
}

// Dynamically discover files in data directory
const files = {};
const dirents = fs.readdirSync(dataFolder, { withFileTypes: true });
for (const dirent of dirents) {
  if (dirent.isFile() && dirent.name.endsWith('.csv')) {
    // Only match files named exactly like YYYY.csv (e.g., 2021.csv, 2022.csv)
    const match = dirent.name.match(/^(\d{4})\.csv$/);
    if (match) {
      const year = parseInt(match[1], 10);
      files[year] = path.join(dataFolder, dirent.name);
    }
  }
}

function initializeDatabase(db) {
  // Enable WAL mode for better write performance
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA synchronous = NORMAL;");
  db.exec("PRAGMA cache_size = -20000;");
  db.exec("PRAGMA foreign_keys = ON;");

  // Drop old transactions table
  db.exec("DROP TABLE IF EXISTS transactions;");
  db.exec("DROP TABLE IF EXISTS idx_year;");
  db.exec("DROP TABLE IF EXISTS idx_zip_code;");
  db.exec("DROP TABLE IF EXISTS idx_year_zip;");
  db.exec("DROP TABLE IF EXISTS idx_kind;");

  // Create lookup tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS communes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      code TEXT,
      code_postal TEXT,
      code_departement TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS nature_mutations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )
  `);

  // Create main dvf table with all fields
  db.exec(`
    CREATE TABLE IF NOT EXISTS dvf (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL,
      date_mutation DATE,
      nature_mutation_id INTEGER,
      valeur_fonciere INTEGER,
      code_postal TEXT,
      commune_id INTEGER,
      code_departement TEXT,
      code_commune TEXT,
      type_local TEXT,
      code_type_local TEXT,
      no_disposition TEXT,
      no_voie TEXT,
      voie TEXT,
      btq TEXT,
      type_voie TEXT,
      code_voie TEXT,
      surface_carrez_1 REAL,
      surface_carrez_2 REAL,
      surface_carrez_3 REAL,
      surface_carrez_4 REAL,
      surface_carrez_5 REAL,
      nombre_pieces_principales INTEGER,
      surface_terrain REAL,
      surface_reelle_bati REAL,
      nombre_lots INTEGER,
      identifiant_document TEXT,
      reference_document TEXT,
      articles_1_cgi TEXT,
      articles_2_cgi TEXT,
      articles_3_cgi TEXT,
      articles_4_cgi TEXT,
      articles_5_cgi TEXT,
      no_plan TEXT,
      no_volume TEXT,
      lot_1 TEXT,
      lot_2 TEXT,
      lot_3 TEXT,
      lot_4 TEXT,
      lot_5 TEXT,
      prefixe_section TEXT,
      section TEXT,
      identifiant_local TEXT,
      nature_culture TEXT,
      nature_culture_speciale TEXT,
      lat REAL,
      lng REAL,
      FOREIGN KEY (commune_id) REFERENCES communes(id),
      FOREIGN KEY (nature_mutation_id) REFERENCES nature_mutations(id)
    )
  `);

  // Create indexes
  db.exec("CREATE INDEX IF NOT EXISTS idx_dvf_year ON dvf(year)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_dvf_commune_id ON dvf(commune_id)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_dvf_nature_mutation_id ON dvf(nature_mutation_id)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_dvf_date_mutation ON dvf(date_mutation)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_dvf_code_postal ON dvf(code_postal)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_dvf_year_postal ON dvf(year, code_postal)");
}

/**
 * Get or insert a commune into the database
 * @param {Database.Database} db
 * @param {Map<string, number>} cache
 * @param {string} name
 * @param {string} code
 * @param {string} codePostal
 * @param {string} codeDepartement
 * @returns {number | null}
 */
function getOrInsertCommune(db, cache, name, code, codePostal, codeDepartement) {
  if (!name) return null;
  
  const cacheKey = `${name}|${code}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  // Try to find existing commune by name
  let communeId = db.prepare("SELECT id FROM communes WHERE name = ?").get(name);
  
  if (!communeId) {
    // Insert new commune
    const result = db.prepare(`
      INSERT INTO communes (name, code, code_postal, code_departement)
      VALUES (?, ?, ?, ?)
    `).run(name, code || null, codePostal || null, codeDepartement || null);
    communeId = { id: result.lastInsertRowid };
  }
  
  cache.set(cacheKey, communeId.id);
  return communeId.id;
}

/**
 * Get or insert a nature mutation into the database
 * @param {Database.Database} db
 * @param {Map<string, number>} cache
 * @param {string} name
 * @returns {number | null}
 */
function getOrInsertNatureMutation(db, cache, name) {
  if (!name) return null;
  
  if (cache.has(name)) {
    return cache.get(name);
  }

  // Try to find existing nature mutation
  let mutationId = db.prepare("SELECT id FROM nature_mutations WHERE name = ?").get(name);
  
  if (!mutationId) {
    // Insert new nature mutation
    const result = db.prepare(`
      INSERT INTO nature_mutations (name)
      VALUES (?)
    `).run(name);
    mutationId = { id: result.lastInsertRowid };
  }
  
  cache.set(name, mutationId.id);
  return mutationId.id;
}

function importFile(db, year, filepath) {
  const filename = path.basename(filepath);
  console.log(`  Importing ${filename}...`);

  const input = fs.createReadStream(filepath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input });

  // In-memory caches for lookups
  const communeCache = new Map();
  const natureMutationCache = new Map();

  let lineCount = 0;
  let inserted = 0;

  // Prepare insert statement for dvf
  const insertStmt = db.prepare(`
    INSERT INTO dvf (
      year, date_mutation, nature_mutation_id, valeur_fonciere,
      code_postal, commune_id, code_departement, code_commune, type_local,
      code_type_local, no_disposition, no_voie, voie, btq, type_voie,
      code_voie, surface_carrez_1, surface_carrez_2, surface_carrez_3,
      surface_carrez_4, surface_carrez_5, nombre_pieces_principales,
      surface_terrain, surface_reelle_bati, nombre_lots, identifiant_document,
      reference_document, articles_1_cgi, articles_2_cgi, articles_3_cgi,
      articles_4_cgi, articles_5_cgi, no_plan, no_volume, lot_1, lot_2,
      lot_3, lot_4, lot_5, prefixe_section, section, identifiant_local,
      nature_culture, nature_culture_speciale, lat, lng
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  // Start transaction for bulk inserts
  db.exec("BEGIN TRANSACTION");

  return new Promise((resolve, reject) => {
    rl.on('line', (rowString) => {
      lineCount++;

      // Skip header and empty lines
      if (lineCount === 1 || !rowString.trim()) {
        return;
      }
      
      // Log progress every 10000 lines
      if (lineCount % 10000 === 0) {
        process.stdout.write(`\r  Processing ${filename}: ${lineCount} lines...`);
      }

      const row = rowString.split("|");

      try {
        // Parse date mutation
        const dateMutation = parseDateFr(getString(row, dateMutationIndex));

        // Get nature mutation id
        const natureMutation = getString(row, natureMutationIndex);
        const natureMutationId = natureMutation 
          ? getOrInsertNatureMutation(db, natureMutationCache, natureMutation)
          : null;

        // Get commune id
        const commune = getString(row, communeIndex);
        const codeCommune = getString(row, codeCommuneIndex);
        const codePostal = getString(row, codePostalIndex);
        const codeDepartement = getString(row, codeDepartementIndex);
        const communeId = commune 
          ? getOrInsertCommune(db, communeCache, commune, codeCommune, codePostal, codeDepartement)
          : null;

        // Parse integer fields
        const valeurFonciere = parseIntFr(getString(row, valeurFonciereIndex));
        const nombrePieces = parseIntFr(getString(row, nombrePiecesIndex));
        const nombreLots = parseIntFr(getString(row, nombreLotsIndex));

        // Parse float fields
        const surfaceCarrez1 = parseFloatFr(getString(row, surfaceCarrez1Index));
        const surfaceCarrez2 = parseFloatFr(getString(row, surfaceCarrez2Index));
        const surfaceCarrez3 = parseFloatFr(getString(row, surfaceCarrez3Index));
        const surfaceCarrez4 = parseFloatFr(getString(row, surfaceCarrez4Index));
        const surfaceCarrez5 = parseFloatFr(getString(row, surfaceCarrez5Index));
        const surfaceTerrain = parseFloatFr(getString(row, surfaceTerrainIndex));
        const surfaceReelleBati = parseFloatFr(getString(row, surfaceReelleBatiIndex));

        // Get all other fields as strings
        const typeLocal = getString(row, typeLocalIndex);
        const codeTypeLocal = getString(row, codeTypeLocalIndex);
        const noDisposition = getString(row, noDispositionIndex);
        const noVoie = getString(row, noVoieIndex);
        const voie = getString(row, voieIndex);
        const btq = getString(row, btqIndex);
        const typeVoie = getString(row, typeVoieIndex);
        const codeVoie = getString(row, codeVoieIndex);
        const noPlan = getString(row, noPlanIndex);
        const noVolume = getString(row, noVolumeIndex);
        const lot1 = getString(row, lot1Index);
        const lot2 = getString(row, lot2Index);
        const lot3 = getString(row, lot3Index);
        const lot4 = getString(row, lot4Index);
        const lot5 = getString(row, lot5Index);
        const prefixeSection = getString(row, prefixeSectionIndex);
        const section = getString(row, sectionIndex);
        const identifiantLocal = getString(row, identifiantLocalIndex);
        const identifiantDocument = getString(row, identifiantDocumentIndex);
        const referenceDocument = getString(row, referenceDocumentIndex);
        const articles1 = getString(row, articles1Index);
        const articles2 = getString(row, articles2Index);
        const articles3 = getString(row, articles3Index);
        const articles4 = getString(row, articles4Index);
        const articles5 = getString(row, articles5Index);
        const natureCulture = getString(row, natureCultureIndex);
        const natureCultureSpeciale = getString(row, natureCultureSpecialeIndex);

        // Insert into dvf table
        insertStmt.run(
          year, dateMutation, natureMutationId, valeurFonciere,
          codePostal, communeId, codeDepartement, codeCommune, typeLocal,
          codeTypeLocal, noDisposition, noVoie, voie, btq, typeVoie,
          codeVoie, surfaceCarrez1, surfaceCarrez2, surfaceCarrez3,
          surfaceCarrez4, surfaceCarrez5, nombrePieces,
          surfaceTerrain, surfaceReelleBati, nombreLots, identifiantDocument,
          referenceDocument, articles1, articles2, articles3,
          articles4, articles5, noPlan, noVolume, lot1, lot2,
          lot3, lot4, lot5, prefixeSection, section, identifiantLocal,
          natureCulture, natureCultureSpeciale, null, null
        );
        inserted++;
      } catch (err) {
        // Skip errors
        if (inserted % 1000 === 0) {
          console.error(`Error on line ${lineCount}:`, err.message);
        }
      }
    });

    rl.on('close', () => {
      db.exec("COMMIT TRANSACTION");
      console.log(`  Inserted ${inserted} records for ${year}`);
      resolve();
    });

    rl.on('error', reject);
  });
}

async function importData() {
  console.log("Initializing database...");
  const db = new Database(dbPath);
  
  initializeDatabase(db);

  const years = Object.keys(files).map(Number).sort((a, b) => a - b);
  
  if (years.length === 0) {
    console.log("No data files found in", dataFolder);
    db.close();
    return;
  }

  console.log(`Found ${years.length} years of data: ${years.join(', ')}`);

  for (const year of years) {
    const filepath = files[year];
    await importFile(db, year, filepath);
  }

  db.close();
  console.log("Import complete!");
}

importData().catch(console.error);
