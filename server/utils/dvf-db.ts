import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { DvfMapPoint, DvfMapStats } from "../../types.ts";

export type DvfBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type DvfQueryFilters = {
  typeLocal?: string;
  year?: string;
  limit: number;
};

export const DEFAULT_DVF_LIMIT = 2000;
export const MAX_DVF_LIMIT = 5000;

export const defaultDbPath = path.join(process.cwd(), "dvf.sqlite3");

const EMPTY_STATS: DvfMapStats = {
  averagePricePerSqm: null,
  minPricePerSqm: null,
  maxPricePerSqm: null,
};

type DvfMapPointRow = {
  id_mutation: string;
  date_mutation: string;
  valeur_fonciere: string;
  type_local: string;
  surface_reelle_bati: number | null;
  code_postal: string;
  nom_commune: string;
  adresse_nom_voie: string;
  latitude: number;
  longitude: number;
};

type DvfStatsRow = {
  average_price_per_sqm: number | null;
  min_price_per_sqm: number | null;
  max_price_per_sqm: number | null;
};

function buildWhereClause(
  bounds: DvfBounds,
  filters: Pick<DvfQueryFilters, "typeLocal" | "year">,
): { conditions: string[]; params: Array<string | number> } {
  const conditions = [
    "latitude BETWEEN ? AND ?",
    "longitude BETWEEN ? AND ?",
    "latitude IS NOT NULL",
    "longitude IS NOT NULL",
  ];
  const params: Array<string | number> = [
    bounds.south,
    bounds.north,
    bounds.west,
    bounds.east,
  ];

  if (filters.typeLocal) {
    conditions.push("type_local = ?");
    params.push(filters.typeLocal);
  }

  if (filters.year) {
    conditions.push("strftime('%Y', date_mutation) = ?");
    params.push(filters.year);
  }

  return { conditions, params };
}

function queryPricePerSqmStats(
  db: DatabaseSync,
  bounds: DvfBounds,
  filters: Pick<DvfQueryFilters, "typeLocal" | "year">,
): DvfMapStats {
  const { conditions, params } = buildWhereClause(bounds, filters);

  const sql = `
    SELECT
      AVG(CAST(valeur_fonciere AS REAL) / surface_reelle_bati) AS average_price_per_sqm,
      MIN(CAST(valeur_fonciere AS REAL) / surface_reelle_bati) AS min_price_per_sqm,
      MAX(CAST(valeur_fonciere AS REAL) / surface_reelle_bati) AS max_price_per_sqm
    FROM dvf
    WHERE ${conditions.join(" AND ")}
      AND surface_reelle_bati > 0
      AND CAST(valeur_fonciere AS REAL) > 0
  `;

  const row = db.prepare(sql).get(...params) as DvfStatsRow | undefined;

  if (
    row?.average_price_per_sqm == null ||
    row.min_price_per_sqm == null ||
    row.max_price_per_sqm == null
  ) {
    return EMPTY_STATS;
  }

  return {
    averagePricePerSqm: row.average_price_per_sqm,
    minPricePerSqm: row.min_price_per_sqm,
    maxPricePerSqm: row.max_price_per_sqm,
  };
}

export function isDbAvailable(dbPath: string = defaultDbPath): boolean {
  return fs.existsSync(dbPath);
}

export function queryDvfInBounds(
  bounds: DvfBounds,
  filters: DvfQueryFilters,
  dbPath: string = defaultDbPath,
): { points: DvfMapPoint[]; truncated: boolean; stats: DvfMapStats } {
  const db = new DatabaseSync(dbPath);

  try {
    const { conditions, params } = buildWhereClause(bounds, filters);
    const stats = queryPricePerSqmStats(db, bounds, filters);

    const pointParams = [...params, filters.limit];
    const sql = `
      SELECT
        id_mutation,
        date_mutation,
        valeur_fonciere,
        type_local,
        surface_reelle_bati,
        code_postal,
        nom_commune,
        adresse_nom_voie,
        latitude,
        longitude
      FROM dvf
      WHERE ${conditions.join(" AND ")}
      LIMIT ?
    `;

    const rows = db.prepare(sql).all(...pointParams) as DvfMapPointRow[];

    return {
      points: rows,
      truncated: rows.length === filters.limit,
      stats,
    };
  } finally {
    db.close();
  }
}
