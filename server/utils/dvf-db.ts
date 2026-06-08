import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { DvfMapPoint } from "../../types.ts";

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

export function isDbAvailable(dbPath: string = defaultDbPath): boolean {
  return fs.existsSync(dbPath);
}

export function queryDvfInBounds(
  bounds: DvfBounds,
  filters: DvfQueryFilters,
  dbPath: string = defaultDbPath,
): { points: DvfMapPoint[]; truncated: boolean } {
  const db = new DatabaseSync(dbPath);

  try {
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

    params.push(filters.limit);

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

    const stmt = db.prepare(sql);
    const rows = stmt.all(...params) as DvfMapPointRow[];

    return {
      points: rows,
      truncated: rows.length === filters.limit,
    };
  } finally {
    db.close();
  }
}
