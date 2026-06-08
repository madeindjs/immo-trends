import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { DvfBounds } from "./dvf-db.ts";

export const defaultDbPath = path.join(process.cwd(), "dvf.sqlite3");
export const DEFAULT_IRIS_LIMIT = 500;
export const MAX_IRIS_LIMIT = 1000;

export type IrisZoneProperties = {
  code_iris: string;
  insee_com: string;
  nom_com: string | null;
  nom_iris: string | null;
  typ_iris: string | null;
};

export type IrisFeature = {
  type: "Feature";
  properties: IrisZoneProperties;
  geometry: unknown;
};

export type IrisFeatureCollection = {
  type: "FeatureCollection";
  features: IrisFeature[];
};

type IrisDbRow = IrisZoneProperties & {
  geometry: string;
};

export function isIrisDbAvailable(dbPath: string = defaultDbPath): boolean {
  if (!fs.existsSync(dbPath)) {
    return false;
  }

  const db = new DatabaseSync(dbPath, { readOnly: true });

  try {
    const table = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'iris'",
      )
      .get() as { name: string } | undefined;

    return table?.name === "iris";
  } finally {
    db.close();
  }
}

export function queryIrisInBounds(
  bounds: DvfBounds,
  limit: number = DEFAULT_IRIS_LIMIT,
  dbPath: string = defaultDbPath,
): IrisFeatureCollection {
  const db = new DatabaseSync(dbPath, { readOnly: true });

  try {
    const sql = `
      SELECT
        code_iris,
        insee_com,
        nom_com,
        nom_iris,
        typ_iris,
        geometry
      FROM iris
      WHERE max_lat >= ?
        AND min_lat <= ?
        AND max_lng >= ?
        AND min_lng <= ?
      LIMIT ?
    `;

    const rows = db
      .prepare(sql)
      .all(bounds.south, bounds.north, bounds.west, bounds.east, limit) as IrisDbRow[];

    return {
      type: "FeatureCollection",
      features: rows.map((row) => ({
        type: "Feature",
        properties: {
          code_iris: row.code_iris,
          insee_com: row.insee_com,
          nom_com: row.nom_com,
          nom_iris: row.nom_iris,
          typ_iris: row.typ_iris,
        },
        geometry: JSON.parse(row.geometry),
      })),
    };
  } finally {
    db.close();
  }
}

export function queryIrisByCode(
  codeIris: string,
  dbPath: string = defaultDbPath,
): IrisFeature | null {
  const db = new DatabaseSync(dbPath, { readOnly: true });

  try {
    const row = db
      .prepare(
        `
        SELECT
          code_iris,
          insee_com,
          nom_com,
          nom_iris,
          typ_iris,
          geometry
        FROM iris
        WHERE code_iris = ?
      `,
      )
      .get(codeIris) as IrisDbRow | undefined;

    if (!row) {
      return null;
    }

    return {
      type: "Feature",
      properties: {
        code_iris: row.code_iris,
        insee_com: row.insee_com,
        nom_com: row.nom_com,
        nom_iris: row.nom_iris,
        typ_iris: row.typ_iris,
      },
      geometry: JSON.parse(row.geometry),
    };
  } finally {
    db.close();
  }
}
