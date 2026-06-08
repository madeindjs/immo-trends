import type { LatLngBounds } from "leaflet";
import type { DvfPointFilters } from "../composables/useDvfPoints.ts";

export function buildDvfQueryParams(
  bounds: LatLngBounds,
  filters: DvfPointFilters,
): Record<string, string | number | string[]> {
  const query: Record<string, string | number | string[]> = {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest(),
    year_min: String(filters.yearMin),
    year_max: String(filters.yearMax),
  };

  if (filters.typeLocals.length > 0) {
    query.type_local = filters.typeLocals;
  }

  if (filters.surfaceMin != null) {
    query.surface_min = filters.surfaceMin;
  }

  if (filters.surfaceMax != null) {
    query.surface_max = filters.surfaceMax;
  }

  if (filters.pricePerSqmMin != null) {
    query.price_per_sqm_min = filters.pricePerSqmMin;
  }

  if (filters.pricePerSqmMax != null) {
    query.price_per_sqm_max = filters.pricePerSqmMax;
  }

  return query;
}
