import type { DvfBounds } from "./dvf-db.ts";
import { DEFAULT_IRIS_LIMIT, MAX_IRIS_LIMIT } from "./iris-db.ts";

export type IrisQueryParams = {
  north: string | string[] | undefined;
  south: string | string[] | undefined;
  east: string | string[] | undefined;
  west: string | string[] | undefined;
  limit?: string | string[] | undefined;
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

function parseOptionalLimit(value: string | string[] | undefined): number {
  const raw = firstValue(value);
  if (raw === undefined || raw === "") {
    return DEFAULT_IRIS_LIMIT;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error("Invalid numeric parameter: limit");
  }

  return Math.min(Math.floor(parsed), MAX_IRIS_LIMIT);
}

export function parseIrisQuery(
  query: IrisQueryParams,
): { bounds: DvfBounds; limit: number } {
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
    limit: parseOptionalLimit(query.limit),
  };
}
