import {
  DEFAULT_DVF_LIMIT,
  MAX_DVF_LIMIT,
  type DvfBounds,
  type DvfQueryFilters,
} from "./dvf-db.ts";

export type DvfQueryParams = {
  north: string | string[] | undefined;
  south: string | string[] | undefined;
  east: string | string[] | undefined;
  west: string | string[] | undefined;
  limit?: string | string[] | undefined;
  type_local?: string | string[] | undefined;
  year?: string | string[] | undefined;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
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
  value: string | string[] | undefined,
): string | undefined {
  const raw = firstValue(value);
  if (raw === undefined || raw === "") {
    return undefined;
  }

  if (!/^\d{4}$/.test(raw)) {
    throw new Error("Invalid year parameter: expected 4-digit year");
  }

  return raw;
}

function parseOptionalTypeLocal(
  value: string | string[] | undefined,
): string | undefined {
  const raw = firstValue(value);
  if (raw === undefined || raw === "") {
    return undefined;
  }

  return raw;
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

  return {
    bounds: { north, south, east, west },
    filters: {
      limit: parseOptionalLimit(query.limit),
      typeLocal: parseOptionalTypeLocal(query.type_local),
      year: parseOptionalYear(query.year),
    },
  };
}
