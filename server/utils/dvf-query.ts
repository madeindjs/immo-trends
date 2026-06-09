import type { DvfTrendGroupBy } from "../../types.ts";
import {
  DEFAULT_DVF_LIMIT,
  MAX_DVF_LIMIT,
  type DvfBounds,
  type DvfQueryFilters,
} from "./dvf-db.ts";

export type DvfQueryParams = {
  north?: string | string[] | undefined;
  south?: string | string[] | undefined;
  east?: string | string[] | undefined;
  west?: string | string[] | undefined;
  limit?: string | string[] | undefined;
  type_local?: string | string[] | undefined;
  year?: string | string[] | undefined;
  year_min?: string | string[] | undefined;
  year_max?: string | string[] | undefined;
  surface_min?: string | string[] | undefined;
  surface_max?: string | string[] | undefined;
  surface_terrain_min?: string | string[] | undefined;
  surface_terrain_max?: string | string[] | undefined;
  price_per_sqm_min?: string | string[] | undefined;
  price_per_sqm_max?: string | string[] | undefined;
  group_by?: string | string[] | undefined;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function allValues(value: string | string[] | undefined): string[] {
  if (value === undefined) {
    return [];
  }

  const rawValues = Array.isArray(value) ? value : [value];
  return rawValues
    .flatMap((entry) => entry.split(","))
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function parseRequiredNumber(
  name: string,
  value: string | string[] | undefined,
): number {
  const raw = firstValue(value);
  if (raw === undefined || raw === "") {
    throw new Error(`Missing required parameter: ${name}`);
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric parameter: ${name}`);
  }

  return parsed;
}

function parseOptionalLimit(
  value: string | string[] | undefined,
): number {
  const raw = firstValue(value);
  if (raw === undefined || raw === "") {
    return DEFAULT_DVF_LIMIT;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error("Invalid numeric parameter: limit");
  }

  return Math.min(Math.floor(parsed), MAX_DVF_LIMIT);
}

function parseOptionalYear(
  name: string,
  value: string | string[] | undefined,
): string | undefined {
  const raw = firstValue(value);
  if (raw === undefined || raw === "") {
    return undefined;
  }

  if (!/^\d{4}$/.test(raw)) {
    throw new Error(`Invalid year parameter: ${name}`);
  }

  return raw;
}

function parseOptionalTypeLocals(
  value: string | string[] | undefined,
): string[] | undefined {
  const parsed = allValues(value);
  if (parsed.length === 0) {
    return undefined;
  }

  return parsed;
}

function parseOptionalPositiveNumber(
  name: string,
  value: string | string[] | undefined,
): number | undefined {
  const raw = firstValue(value);
  if (raw === undefined || raw === "") {
    return undefined;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid numeric parameter: ${name}`);
  }

  return parsed;
}

function assertRangeOrder(
  minName: string,
  maxName: string,
  min: number | undefined,
  max: number | undefined,
): void {
  if (min != null && max != null && min > max) {
    throw new Error(
      `Invalid range: ${minName} must be less than or equal to ${maxName}`,
    );
  }
}

const VALID_TREND_GROUP_BY = new Set<DvfTrendGroupBy>([
  "month",
  "quarter",
  "year",
]);

function parseOptionalTrendGroupBy(
  value: string | string[] | undefined,
): DvfTrendGroupBy {
  const raw = firstValue(value);
  if (raw === undefined || raw === "") {
    return "month";
  }

  if (!VALID_TREND_GROUP_BY.has(raw as DvfTrendGroupBy)) {
    throw new Error(
      "Invalid group_by parameter: expected month, quarter, or year",
    );
  }

  return raw as DvfTrendGroupBy;
}

export function parseDvfQuery(
  query: DvfQueryParams,
): { bounds: DvfBounds; filters: DvfQueryFilters } {
  const north = parseRequiredNumber("north", query.north);
  const south = parseRequiredNumber("south", query.south);
  const east = parseRequiredNumber("east", query.east);
  const west = parseRequiredNumber("west", query.west);

  if (south > north) {
    throw new Error("Invalid bounds: south must be less than or equal to north");
  }

  if (west > east) {
    throw new Error("Invalid bounds: west must be less than or equal to east");
  }

  const year = parseOptionalYear("year", query.year);
  const yearMin = parseOptionalYear("year_min", query.year_min) ?? year;
  const yearMax = parseOptionalYear("year_max", query.year_max) ?? year;

  if (yearMin && yearMax && yearMin > yearMax) {
    throw new Error("Invalid year range: year_min must be less than or equal to year_max");
  }

  const surfaceMin = parseOptionalPositiveNumber(
    "surface_min",
    query.surface_min,
  );
  const surfaceMax = parseOptionalPositiveNumber(
    "surface_max",
    query.surface_max,
  );
  const surfaceTerrainMin = parseOptionalPositiveNumber(
    "surface_terrain_min",
    query.surface_terrain_min,
  );
  const surfaceTerrainMax = parseOptionalPositiveNumber(
    "surface_terrain_max",
    query.surface_terrain_max,
  );
  const pricePerSqmMin = parseOptionalPositiveNumber(
    "price_per_sqm_min",
    query.price_per_sqm_min,
  );
  const pricePerSqmMax = parseOptionalPositiveNumber(
    "price_per_sqm_max",
    query.price_per_sqm_max,
  );

  assertRangeOrder("surface_min", "surface_max", surfaceMin, surfaceMax);
  assertRangeOrder(
    "surface_terrain_min",
    "surface_terrain_max",
    surfaceTerrainMin,
    surfaceTerrainMax,
  );
  assertRangeOrder(
    "price_per_sqm_min",
    "price_per_sqm_max",
    pricePerSqmMin,
    pricePerSqmMax,
  );

  return {
    bounds: { north, south, east, west },
    filters: {
      limit: parseOptionalLimit(query.limit),
      typeLocals: parseOptionalTypeLocals(query.type_local),
      yearMin,
      yearMax,
      surfaceMin,
      surfaceMax,
      surfaceTerrainMin,
      surfaceTerrainMax,
      pricePerSqmMin,
      pricePerSqmMax,
    },
  };
}

export function parseDvfTrendsQuery(
  query: DvfQueryParams,
): { bounds: DvfBounds; filters: DvfQueryFilters; groupBy: DvfTrendGroupBy } {
  const { bounds, filters } = parseDvfQuery(query);

  return {
    bounds,
    filters,
    groupBy: parseOptionalTrendGroupBy(query.group_by),
  };
}
