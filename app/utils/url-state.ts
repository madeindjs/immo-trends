import type { DvfPointFilters } from "../composables/useDvfPoints.ts";

export type MapViewState = {
  zoom: number;
  center: [number, number];
};

export type AppUrlState = MapViewState & {
  filters: DvfPointFilters;
};

export type UrlQuery = Record<string, string | string[] | undefined>;

export const DEFAULT_ZOOM = 6;
export const DEFAULT_CENTER: [number, number] = [46.6, 2.4];
export const DEFAULT_YEAR_MIN = 2014;
export const DEFAULT_TYPE_LOCALS = ["Appartement", "Maison"] as const;

export const DEFAULT_MAP_VIEW: MapViewState = {
  zoom: DEFAULT_ZOOM,
  center: DEFAULT_CENTER,
};

export function getDefaultYearMax(): number {
  return new Date().getFullYear();
}

export function getDefaultFilters(): DvfPointFilters {
  return {
    typeLocals: [...DEFAULT_TYPE_LOCALS],
    yearMin: DEFAULT_YEAR_MIN,
    yearMax: getDefaultYearMax(),
    surfaceMin: null,
    surfaceMax: null,
    pricePerSqmMin: null,
    pricePerSqmMax: null,
  };
}

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

function roundCoord(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function isValidCoordPair(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng);
}

export function normalizeCenter(center: unknown): [number, number] {
  if (Array.isArray(center) && center.length >= 2) {
    const lat = Number(center[0]);
    const lng = Number(center[1]);
    if (isValidCoordPair(lat, lng)) {
      return [roundCoord(lat), roundCoord(lng)];
    }
  }

  if (center != null && typeof center === "object") {
    const point = center as { lat?: unknown; lng?: unknown };
    const lat = Number(point.lat);
    const lng = Number(point.lng);
    if (isValidCoordPair(lat, lng)) {
      return [roundCoord(lat), roundCoord(lng)];
    }
  }

  return DEFAULT_CENTER;
}

function normalizeZoom(zoom: number): number {
  return Number.isFinite(zoom) ? zoom : DEFAULT_ZOOM;
}

function parseOptionalNumber(
  value: string | string[] | undefined,
): number | undefined {
  const raw = firstValue(value);
  if (raw === undefined || raw === "") {
    return undefined;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return parsed;
}

function parseOptionalYear(
  value: string | string[] | undefined,
): number | undefined {
  const raw = firstValue(value);
  if (raw === undefined || raw === "") {
    return undefined;
  }

  if (!/^\d{4}$/.test(raw)) {
    return undefined;
  }

  return Number(raw);
}

function parseOptionalPositiveNumber(
  value: string | string[] | undefined,
): number | null {
  const parsed = parseOptionalNumber(value);
  if (parsed === undefined || parsed < 0) {
    return null;
  }

  return parsed;
}

function typeLocalsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

function normalizeQueryValue(
  value: string | string[] | undefined,
): string | string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.length === 1 ? value[0] : [...value].sort();
  }

  return value;
}

export function parseUrlState(query: UrlQuery): AppUrlState {
  const defaults = getDefaultFilters();

  const zoom = parseOptionalNumber(query.zoom) ?? DEFAULT_ZOOM;
  const lat = parseOptionalNumber(query.lat);
  const lng = parseOptionalNumber(query.lng);
  const center: [number, number] =
    lat !== undefined && lng !== undefined
      ? [roundCoord(lat), roundCoord(lng)]
      : DEFAULT_CENTER;

  const typeLocals = allValues(query.type_local);
  const yearMin = parseOptionalYear(query.year_min) ?? defaults.yearMin;
  const yearMax = parseOptionalYear(query.year_max) ?? defaults.yearMax;

  return {
    zoom,
    center,
    filters: {
      typeLocals: typeLocals.length > 0 ? typeLocals : [...defaults.typeLocals],
      yearMin,
      yearMax,
      surfaceMin: parseOptionalPositiveNumber(query.surface_min),
      surfaceMax: parseOptionalPositiveNumber(query.surface_max),
      pricePerSqmMin: parseOptionalPositiveNumber(query.price_per_sqm_min),
      pricePerSqmMax: parseOptionalPositiveNumber(query.price_per_sqm_max),
    },
  };
}

export function buildUrlQuery(state: AppUrlState): UrlQuery {
  const defaults = getDefaultFilters();
  const query: UrlQuery = {};
  const zoom = normalizeZoom(state.zoom);
  const center = normalizeCenter(state.center);

  if (zoom !== DEFAULT_ZOOM) {
    query.zoom = String(zoom);
  }

  if (center[0] !== DEFAULT_CENTER[0] || center[1] !== DEFAULT_CENTER[1]) {
    query.lat = String(center[0]);
    query.lng = String(center[1]);
  }

  if (!typeLocalsEqual(state.filters.typeLocals, defaults.typeLocals)) {
    query.type_local = [...state.filters.typeLocals];
  }

  if (state.filters.yearMin !== defaults.yearMin) {
    query.year_min = String(state.filters.yearMin);
  }

  if (state.filters.yearMax !== defaults.yearMax) {
    query.year_max = String(state.filters.yearMax);
  }

  if (state.filters.surfaceMin != null) {
    query.surface_min = String(state.filters.surfaceMin);
  }

  if (state.filters.surfaceMax != null) {
    query.surface_max = String(state.filters.surfaceMax);
  }

  if (state.filters.pricePerSqmMin != null) {
    query.price_per_sqm_min = String(state.filters.pricePerSqmMin);
  }

  if (state.filters.pricePerSqmMax != null) {
    query.price_per_sqm_max = String(state.filters.pricePerSqmMax);
  }

  return query;
}

export function urlQueriesEqual(a: UrlQuery, b: UrlQuery): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);

  for (const key of keys) {
    const left = normalizeQueryValue(a[key]);
    const right = normalizeQueryValue(b[key]);

    if (left === undefined && right === undefined) {
      continue;
    }

    if (left === undefined || right === undefined) {
      return false;
    }

    if (Array.isArray(left) && Array.isArray(right)) {
      if (left.length !== right.length) {
        return false;
      }

      const sortedLeft = [...left].sort();
      const sortedRight = [...right].sort();
      if (!sortedLeft.every((value, index) => value === sortedRight[index])) {
        return false;
      }
      continue;
    }

    if (left !== right) {
      return false;
    }
  }

  return true;
}
