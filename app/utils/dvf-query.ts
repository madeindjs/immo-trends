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

  return query;
}
