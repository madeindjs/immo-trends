// @ts-check
const path = require("path");
const fs = require("fs");
const readline = require("readline");
const Database = require("better-sqlite3");
const ProgressBar = require("progress");
const { execSync } = require("child_process");

const fields =
  "Code service CH|Reference document|1 Articles CGI|2 Articles CGI|3 Articles CGI|4 Articles CGI|5 Articles CGI|No disposition|Date mutation|Nature mutation|Valeur fonciere|No voie|B/T/Q|Type de voie|Code voie|Voie|Code postal|Commune|Code departement|Code commune|Prefixe de section|Section|No plan|No Volume|1er lot|Surface Carrez du 1er lot|2eme lot|Surface Carrez du 2eme lot|3eme lot|Surface Carrez du 3eme lot|4eme lot|Surface Carrez du 4eme lot|5eme lot|Surface Carrez du 5eme lot|Nombre de lots|Code type local|Type local|Identifiant local|Surface reelle bati|Nombre pieces principales|Nature culture|Nature culture speciale|Surface terrain".split(
    "|"
  );

const surface1Index = fields.indexOf("Surface Carrez du 1er lot");
const surface2Index = fields.indexOf("Surface Carrez du 2eme lot");
const surface3Index = fields.indexOf("Surface Carrez du 3eme lot");
const surface4Index = fields.indexOf("Surface Carrez du 4eme lot");
const surface5Index = fields.indexOf("Surface Carrez du 5eme lot");
const zipCodeIndex = fields.indexOf("Code postal");
const priceIndex = fields.indexOf("Valeur fonciere");
const kindIndex = fields.indexOf("Type local");

const dataFolder = path.join(__dirname, "data");
const dbPath = path.join(__dirname, "immo-trends.db");

/**
 * Extract year from filename
 * Handles patterns: "2021.csv", "2021.txt", "valeursfoncieres-2016-s2.txt", etc.
 * @param {string} filename
 * @returns {number | null}
 */
function extractYear(filename) {
  const match = filename.match(/(\d{4})/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * @param {string} number
 * @returns {number}
 */
function parseNumberFr(number) {
  return parseInt(number.split(",")[0]);
}

/**
 * @param {string[]} row
 * @param {number} index
 */
function getNumber(row, index) {
  const surface = row[index];
  return surface ? parseNumberFr(surface) : undefined;
}

/**
 * @param {string[]} row
 * @param {number} index
 */
const getString = (row, index) => row[index];

// Dynamically discover files in data directory
const files = {};
const dirents = fs.readdirSync(dataFolder, { withFileTypes: true });
for (const dirent of dirents) {
  if (dirent.isFile()) {
    const year = extractYear(dirent.name);
    if (year) {
      files[year] = path.join(dataFolder, dirent.name);
    }
  }
}

function initializeDatabase(db) {
  // Enable WAL mode for better write performance
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA synchronous = NORMAL;");
  db.exec("PRAGMA cache_size = -20000;"); // 20MB cache
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL,
      zip_code TEXT NOT NULL,
      kind TEXT NOT NULL,
      surface INTEGER,
      price INTEGER,
      price_per_sqm REAL
    )
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_year ON transactions(year)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_zip_code ON transactions(zip_code)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_year_zip ON transactions(year, zip_code)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_kind ON transactions(kind)`);
}

function importFile(db, year, filepath) {
  const total = parseInt(execSync(`wc -l < ${filepath}`).toString().trim());
  const filename = path.basename(filepath);
  const bar = new ProgressBar(`IMPORT ${year} :bar (ETA :eta s)`, { total, width: 40 });

  const input = fs.createReadStream(filepath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input });

  let lineCount = 0;
  let inserted = 0;

  const insertStmt = db.prepare(`
    INSERT INTO transactions (year, zip_code, kind, surface, price, price_per_sqm) 
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  // Start transaction for bulk inserts
  db.exec("BEGIN TRANSACTION");

  return new Promise((resolve, reject) => {
    rl.on('line', (rowString) => {
      lineCount++;
      bar.tick();

      // Skip header and empty lines
      if (lineCount === 1 || !rowString.trim()) {
        return;
      }

      const row = rowString.split("|");
      const kind = getString(row, kindIndex);

      if (kind !== "Appartement") {
        return;
      }

      const surface =
        (getNumber(row, surface1Index) ?? 0) +
        (getNumber(row, surface2Index) ?? 0) +
        (getNumber(row, surface3Index) ?? 0) +
        (getNumber(row, surface4Index) ?? 0) +
        (getNumber(row, surface5Index) ?? 0);

      if (!surface || surface <= 0) {
        return;
      }

      const price = getNumber(row, priceIndex);
      if (!price || price <= 0) {
        return;
      }

      const zipCode = getString(row, zipCodeIndex);
      if (!zipCode) {
        return;
      }

      const pricePerSqm = price / surface;

      try {
        insertStmt.run(year, zipCode, kind, surface, price, pricePerSqm);
        inserted++;
      } catch (err) {
        // Skip duplicates and errors
      }
    });

    rl.on('close', () => {
      db.exec("COMMIT TRANSACTION");
      console.log(`  Inserted ${inserted} Appartement records for ${year}`);
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
