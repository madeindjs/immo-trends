import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  pointInGeoJsonGeometry,
  type GeoJsonGeometry,
} from "./point-in-polygon.ts";

const rootDir = path.join(import.meta.dirname, "..");
const dbPath = path.join(rootDir, "dvf.sqlite3");
const BATCH_SIZE = 50_000;

type IrisRow = {
  code_iris: string;
  geometry: string;
};

function ensureCodeIrisColumn(db: DatabaseSync): void {
  const columns = db
    .prepare("PRAGMA table_info(dvf)")
    .all() as Array<{ name: string }>;

  if (!columns.some((column) => column.name === "code_iris")) {
    db.exec("ALTER TABLE dvf ADD COLUMN code_iris TEXT");
  }

  const indexesSql = fs.readFileSync(path.join(rootDir, "indexes.sql"), "utf8");
  db.exec(indexesSql);
}

function loadIrisByCommune(db: DatabaseSync): Map<string, IrisRow[]> {
  const rows = db
    .prepare("SELECT code_iris, insee_com, geometry FROM iris")
    .all() as Array<IrisRow & { insee_com: string }>;

  const byCommune = new Map<string, IrisRow[]>();

  for (const row of rows) {
    const communeRows = byCommune.get(row.insee_com) ?? [];
    communeRows.push({
      code_iris: row.code_iris,
      geometry: row.geometry,
    });
    byCommune.set(row.insee_com, communeRows);
  }

  return byCommune;
}

function findCodeIris(
  longitude: number,
  latitude: number,
  codeCommune: string,
  irisByCommune: Map<string, IrisRow[]>,
): string | null {
  const candidates = irisByCommune.get(codeCommune);
  if (!candidates) {
    return null;
  }

  for (const candidate of candidates) {
    const geometry = JSON.parse(candidate.geometry) as GeoJsonGeometry;
    if (pointInGeoJsonGeometry(longitude, latitude, geometry)) {
      return candidate.code_iris;
    }
  }

  return null;
}

async function joinDvfIris(): Promise<void> {
  const db = new DatabaseSync(dbPath);
  ensureCodeIrisColumn(db);

  const irisCount = (
    db.prepare("SELECT COUNT(*) AS count FROM iris").get() as { count: number }
  ).count;

  if (irisCount === 0) {
    throw new Error("iris table is empty. Run scripts/import-iris.ts first.");
  }

  const irisByCommune = loadIrisByCommune(db);
  const selectBatch = db.prepare(`
    SELECT rowid, latitude, longitude, code_commune
    FROM dvf
    WHERE latitude IS NOT NULL
      AND longitude IS NOT NULL
      AND code_iris IS NULL
    LIMIT ?
  `);
  const updateRow = db.prepare("UPDATE dvf SET code_iris = ? WHERE rowid = ?");

  let processed = 0;
  let matched = 0;
  let unmatched = 0;

  while (true) {
    const batch = selectBatch.all(BATCH_SIZE) as Array<{
      rowid: number;
      latitude: number;
      longitude: number;
      code_commune: string;
    }>;

    if (batch.length === 0) {
      break;
    }

    db.exec("BEGIN");

    for (const row of batch) {
      const codeIris = findCodeIris(
        row.longitude,
        row.latitude,
        row.code_commune,
        irisByCommune,
      );

      if (codeIris) {
        updateRow.run(codeIris, row.rowid);
        matched++;
      } else {
        unmatched++;
      }
    }

    db.exec("COMMIT");
    processed += batch.length;
    console.log(
      `Joined ${processed} DVF rows (${matched} matched, ${unmatched} unmatched).`,
    );
  }

  db.close();
  console.log(
    `DVF→IRIS join complete: ${matched} matched, ${unmatched} unmatched.`,
  );
}

await joinDvfIris();
