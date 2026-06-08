import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { DatabaseSync } from "node:sqlite";
import {
  computeGeometryBbox,
  type GeoJsonGeometry,
} from "./point-in-polygon.ts";

const rootDir = path.join(import.meta.dirname, "..");
const dbPath = path.join(rootDir, "dvf.sqlite3");
const ndjsonPath = path.join(rootDir, "data", "iris.ndjson");

type IrisProperties = {
  code_iris: string;
  insee_com: string;
  nom_com: string | null;
  nom_iris: string | null;
  typ_iris: string | null;
};

type GeoJsonFeature = {
  type: "Feature";
  properties: Record<string, string | null | undefined>;
  geometry: GeoJsonGeometry;
};

function normalizeProperty(
  properties: Record<string, string | null | undefined>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = properties[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return null;
}

function parseFeatureProperties(
  properties: Record<string, string | null | undefined>,
): IrisProperties | null {
  const inseeCom = normalizeProperty(properties, [
    "insee_com",
    "INSEE_COM",
    "DEPCOM",
  ]);
  const irisCode = normalizeProperty(properties, ["iris", "IRIS"]);
  const codeIris =
    normalizeProperty(properties, ["code_iris", "CODE_IRIS", "DCOMIRIS"]) ??
    (inseeCom && irisCode ? `${inseeCom}${irisCode}` : null);

  if (!codeIris || !inseeCom) {
    return null;
  }

  return {
    code_iris: codeIris,
    insee_com: inseeCom,
    nom_com: normalizeProperty(properties, ["nom_com", "NOM_COM"]),
    nom_iris: normalizeProperty(properties, ["nom_iris", "NOM_IRIS"]),
    typ_iris: normalizeProperty(properties, ["typ_iris", "TYP_IRIS"]),
  };
}

function ensureIrisSchema(db: DatabaseSync): void {
  const irisSql = fs.readFileSync(path.join(rootDir, "iris.sql"), "utf8");
  db.exec(irisSql);
}

async function importIris(): Promise<void> {
  if (!fs.existsSync(ndjsonPath)) {
    throw new Error(`Missing IRIS NDJSON file: ${ndjsonPath}`);
  }

  const db = new DatabaseSync(dbPath);
  ensureIrisSchema(db);

  db.exec("DELETE FROM iris");

  const insert = db.prepare(`
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

  const stream = readline.createInterface({
    input: fs.createReadStream(ndjsonPath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  let imported = 0;
  let skipped = 0;

  for await (const line of stream) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      continue;
    }

    const feature = JSON.parse(trimmed) as GeoJsonFeature;
    if (feature.type !== "Feature" || feature.geometry == null) {
      skipped++;
      continue;
    }

    const properties = parseFeatureProperties(feature.properties ?? {});
    if (!properties) {
      skipped++;
      continue;
    }

    const bbox = computeGeometryBbox(feature.geometry);
    insert.run(
      properties.code_iris,
      properties.insee_com,
      properties.nom_com,
      properties.nom_iris,
      properties.typ_iris,
      bbox.minLat,
      bbox.maxLat,
      bbox.minLng,
      bbox.maxLng,
      JSON.stringify(feature.geometry),
    );
    imported++;
  }

  db.close();
  console.log(`Imported ${imported} IRIS zones (${skipped} skipped).`);
}

await importIris();
