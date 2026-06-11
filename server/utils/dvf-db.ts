import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getMedian, getPriceStats } from "../../scripts/draw.utils.ts";
import type {
  DvfMapPoint,
  DvfMapStats,
  DvfPriceTrendPoint,
  DvfRowDetail,
  DvfTrendGroupBy,
} from "../../types.ts";

export type DvfBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type DvfQueryFilters = {
  typeLocals?: string[];
  yearMin?: string;
  yearMax?: string;
  surfaceMin?: number;
  surfaceMax?: number;
  surfaceTerrainMin?: number;
  surfaceTerrainMax?: number;
  pricePerSqmMin?: number;
  pricePerSqmMax?: number;
  roomsMin?: number;
  roomsMax?: number;
  limit: number;
};

export const DEFAULT_DVF_LIMIT = 2000;
export const MAX_DVF_LIMIT = 5000;

export const defaultDbPath = path.join(process.cwd(), "dvf.sqlite3");

const EMPTY_STATS: DvfMapStats = {
  medianPricePerSqm: null,
  minPricePerSqm: null,
  maxPricePerSqm: null,
};

type DvfMapPointRow = {
  rowid: number;
  id_mutation: string;
  date_mutation: string;
  valeur_fonciere: string;
  type_local: string;
  surface_reelle_bati: number | null;
  surface_terrain: number | null;
  nombre_pieces_principales: number | null;
  code_postal: string;
  nom_commune: string;
  adresse_numero: string;
  adresse_suffixe: string;
  adresse_nom_voie: string;
  latitude: number;
  longitude: number;
};

type DvfPricePerSqmRow = {
  price_per_sqm: number;
};

type DvfSpatialFilters = Pick<
  DvfQueryFilters,
  | "typeLocals"
  | "yearMin"
  | "yearMax"
  | "surfaceMin"
  | "surfaceMax"
  | "surfaceTerrainMin"
  | "surfaceTerrainMax"
  | "pricePerSqmMin"
  | "pricePerSqmMax"
  | "roomsMin"
  | "roomsMax"
>;

function buildWhereClause(
  bounds: DvfBounds,
  filters: DvfSpatialFilters,
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

  if (filters.typeLocals && filters.typeLocals.length > 0) {
    const placeholders = filters.typeLocals.map(() => "?").join(", ");
    conditions.push(`type_local IN (${placeholders})`);
    params.push(...filters.typeLocals);
  }

  if (filters.yearMin) {
    conditions.push("date_mutation >= ?");
    params.push(`${filters.yearMin}-01-01`);
  }

  if (filters.yearMax) {
    conditions.push("date_mutation <= ?");
    params.push(`${filters.yearMax}-12-31`);
  }

  if (filters.surfaceMin != null) {
    conditions.push("surface_reelle_bati >= ?");
    params.push(filters.surfaceMin);
  }

  if (filters.surfaceMax != null) {
    conditions.push("surface_reelle_bati <= ?");
    params.push(filters.surfaceMax);
  }

  if (filters.surfaceTerrainMin != null) {
    conditions.push("surface_terrain >= ?");
    params.push(filters.surfaceTerrainMin);
  }

  if (filters.surfaceTerrainMax != null) {
    conditions.push("surface_terrain <= ?");
    params.push(filters.surfaceTerrainMax);
  }

  if (filters.pricePerSqmMin != null || filters.pricePerSqmMax != null) {
    conditions.push("surface_reelle_bati > 0");
    conditions.push("CAST(valeur_fonciere AS REAL) > 0");

    if (filters.pricePerSqmMin != null) {
      conditions.push(
        "CAST(valeur_fonciere AS REAL) / surface_reelle_bati >= ?",
      );
      params.push(filters.pricePerSqmMin);
    }

    if (filters.pricePerSqmMax != null) {
      conditions.push(
        "CAST(valeur_fonciere AS REAL) / surface_reelle_bati <= ?",
      );
      params.push(filters.pricePerSqmMax);
    }
  }

  if (filters.roomsMin != null) {
    conditions.push("nombre_pieces_principales >= ?");
    params.push(filters.roomsMin);
  }

  if (filters.roomsMax != null) {
    conditions.push("nombre_pieces_principales <= ?");
    params.push(filters.roomsMax);
  }

  return { conditions, params };
}

function queryPricePerSqmStats(
  db: DatabaseSync,
  bounds: DvfBounds,
  filters: DvfSpatialFilters,
): DvfMapStats {
  const { conditions, params } = buildWhereClause(bounds, filters);

  const sql = `
    SELECT
      CAST(valeur_fonciere AS REAL) / surface_reelle_bati AS price_per_sqm
    FROM dvf
    WHERE ${conditions.join(" AND ")}
      AND surface_reelle_bati > 0
      AND CAST(valeur_fonciere AS REAL) > 0
  `;

  const rows = db.prepare(sql).all(...params) as DvfPricePerSqmRow[];
  const prices = rows
    .map((row) => row.price_per_sqm)
    .filter((price): price is number => price != null && Number.isFinite(price));
  const stats = getPriceStats(prices);

  if (!stats) {
    return EMPTY_STATS;
  }

  return {
    medianPricePerSqm: stats.median,
    minPricePerSqm: stats.min,
    maxPricePerSqm: stats.max,
  };
}

export function isDbAvailable(dbPath: string = defaultDbPath): boolean {
  return fs.existsSync(dbPath);
}

type DvfTrendPriceRow = {
  month: string;
  price_per_sqm: number;
};

function trendPeriodSql(groupBy: DvfTrendGroupBy): string {
  switch (groupBy) {
    case "quarter":
      return `strftime('%Y', date_mutation) || '-Q' || CAST((CAST(strftime('%m', date_mutation) AS INTEGER) + 2) / 3 AS TEXT)`;
    case "year":
      return `strftime('%Y', date_mutation)`;
    default:
      return `strftime('%Y-%m', date_mutation)`;
  }
}

export function queryDvfPriceTrends(
  bounds: DvfBounds,
  filters: DvfSpatialFilters,
  dbPath: string = defaultDbPath,
  groupBy: DvfTrendGroupBy = "month",
): DvfPriceTrendPoint[] {
  const db = new DatabaseSync(dbPath);

  try {
    const { conditions, params } = buildWhereClause(bounds, filters);
    const validityClause =
      "surface_reelle_bati > 0 AND CAST(valeur_fonciere AS REAL) > 0";

    const pricesSql = `
      SELECT
        ${trendPeriodSql(groupBy)} AS month,
        CAST(valeur_fonciere AS REAL) / surface_reelle_bati AS price_per_sqm
      FROM dvf
      WHERE ${conditions.join(" AND ")}
        AND ${validityClause}
    `;

    const priceRows = db.prepare(pricesSql).all(...params) as DvfTrendPriceRow[];
    const pricesByPeriod = new Map<string, number[]>();

    for (const row of priceRows) {
      if (row.month == null || row.price_per_sqm == null) {
        continue;
      }

      const prices = pricesByPeriod.get(row.month) ?? [];
      prices.push(row.price_per_sqm);
      pricesByPeriod.set(row.month, prices);
    }

    return [...pricesByPeriod.entries()]
      .sort(([periodA], [periodB]) => periodA.localeCompare(periodB))
      .map(([month, rawPrices]) => {
        const prices = rawPrices.filter(
          (price): price is number => price != null && Number.isFinite(price),
        );

        return {
          month,
          medianPricePerSqm: prices.length > 0 ? getMedian(prices) : null,
          count: prices.length,
        };
      });
  } finally {
    db.close();
  }
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
        rowid,
        id_mutation,
        date_mutation,
        valeur_fonciere,
        type_local,
        surface_reelle_bati,
        surface_terrain,
        nombre_pieces_principales,
        code_postal,
        nom_commune,
        adresse_numero,
        adresse_suffixe,
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

export function queryDvfByRowid(
  rowid: number,
  dbPath: string = defaultDbPath,
): DvfRowDetail | null {
  const db = new DatabaseSync(dbPath);

  try {
    const row = db
      .prepare("SELECT rowid, * FROM dvf WHERE rowid = ?")
      .get(rowid) as DvfRowDetail | undefined;

    return row ?? null;
  } finally {
    db.close();
  }
}
