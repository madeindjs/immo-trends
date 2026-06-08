import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const rootDir = path.join(import.meta.dirname, "..");

const sampleIrisZones = [
  {
    code_iris: "014260001",
    insee_com: "01426",
    nom_com: "Val-Revermont",
    nom_iris: "centre",
    typ_iris: "H",
    min_lat: 46.32,
    max_lat: 46.33,
    min_lng: 5.38,
    max_lng: 5.39,
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [5.38, 46.32],
          [5.39, 46.32],
          [5.39, 46.33],
          [5.38, 46.33],
          [5.38, 46.32],
        ],
      ],
    },
  },
  {
    code_iris: "010420001",
    insee_com: "01042",
    nom_com: "Bey",
    nom_iris: "bourg",
    typ_iris: "H",
    min_lat: 46.223,
    max_lat: 46.225,
    min_lng: 4.843,
    max_lng: 4.845,
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [4.843, 46.223],
          [4.845, 46.223],
          [4.845, 46.225],
          [4.843, 46.225],
          [4.843, 46.223],
        ],
      ],
    },
  },
] as const;

export function createSampleDb(): string {
  const dbPath = path.join(
    os.tmpdir(),
    `dvf-test-${process.pid}-${Date.now()}.sqlite3`,
  );
  const schema = fs
    .readFileSync(path.join(rootDir, "init.sql"), "utf8")
    .split(".import")[0]
    .trim();
  const csvPath = path.join(rootDir, "test-data", "dvf.sample.csv");

  const db = new DatabaseSync(dbPath);
  db.exec(schema);
  db.exec(fs.readFileSync(path.join(rootDir, "iris.sql"), "utf8"));
  db.close();

  const indexesPath = path.join(rootDir, "indexes.sql");
  execSync(
    `sqlite3 "${dbPath}" ".mode csv" ".import ${csvPath} dvf" "DELETE FROM dvf WHERE type_local IS NULL;" ".read ${indexesPath}"`,
    { stdio: "pipe" },
  );

  const seededDb = new DatabaseSync(dbPath);
  const insertIris = seededDb.prepare(`
    INSERT INTO iris (
      code_iris,
      insee_com,
      nom_com,
      nom_iris,
      typ_iris,
      min_lat,
      max_lat,
      min_lng,
      max_lng,
      geometry
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const zone of sampleIrisZones) {
    insertIris.run(
      zone.code_iris,
      zone.insee_com,
      zone.nom_com,
      zone.nom_iris,
      zone.typ_iris,
      zone.min_lat,
      zone.max_lat,
      zone.min_lng,
      zone.max_lng,
      JSON.stringify(zone.geometry),
    );
  }

  seededDb.exec(`
    UPDATE dvf
    SET code_iris = '014260001'
    WHERE code_commune = '01426' AND latitude IS NOT NULL;

    UPDATE dvf
    SET code_iris = '010420001'
    WHERE code_commune = '01042' AND latitude IS NOT NULL;
  `);
  seededDb.close();

  return dbPath;
}

export function removeSampleDb(dbPath: string): void {
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
}
