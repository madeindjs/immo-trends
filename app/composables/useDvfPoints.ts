import type { LatLngBounds } from "leaflet";
import type { DvfMapPoint, DvfMapStats } from "../../types.ts";
import { buildDvfQueryParams } from "../utils/dvf-query.ts";

export const MIN_FETCH_ZOOM = 10;
const DEBOUNCE_MS = 300;

type DvfApiResponse = {
  points: DvfMapPoint[];
  truncated: boolean;
  stats: DvfMapStats;
};

const EMPTY_STATS: DvfMapStats = {
  medianPricePerSqm: null,
  minPricePerSqm: null,
  maxPricePerSqm: null,
};

export type DvfPointFilters = {
  typeLocals: string[];
  yearMin: number;
  yearMax: number;
  surfaceMin: number | null;
  surfaceMax: number | null;
  pricePerSqmMin: number | null;
  pricePerSqmMax: number | null;
  codeIris: string | null;
  irisLabel: string | null;
};

function isAbortError(error: unknown): boolean {
  if (error instanceof Error && error.name === "AbortError") {
    return true;
  }

  const cause = error instanceof Error ? error.cause : undefined;
  return cause instanceof DOMException && cause.name === "AbortError";
}

export function useDvfPoints() {
  const points = ref<DvfMapPoint[]>([]);
  const stats = ref<DvfMapStats>({ ...EMPTY_STATS });
  const loading = ref(false);
  const error = ref<string | null>(null);
  const truncated = ref(false);

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let abortController: AbortController | undefined;

  function cancelPending(): void {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = undefined;
    }

    abortController?.abort();
    abortController = undefined;
    loading.value = false;
  }

  async function fetchForBounds(
    bounds: LatLngBounds,
    zoom: number,
    filters: DvfPointFilters,
  ): Promise<void> {
    cancelPending();

    if (zoom < MIN_FETCH_ZOOM && filters.codeIris == null) {
      points.value = [];
      stats.value = { ...EMPTY_STATS };
      truncated.value = false;
      error.value = null;
      return;
    }

    if (filters.typeLocals.length === 0) {
      points.value = [];
      stats.value = { ...EMPTY_STATS };
      truncated.value = false;
      error.value = null;
      return;
    }

    const controller = new AbortController();
    abortController = controller;
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<DvfApiResponse>("/api/dvf", {
        query: buildDvfQueryParams(bounds, filters),
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return;
      }

      points.value = response.points;
      stats.value = response.stats;
      truncated.value = response.truncated;
    } catch (fetchError) {
      if (controller.signal.aborted || isAbortError(fetchError)) {
        return;
      }

      points.value = [];
      stats.value = { ...EMPTY_STATS };
      truncated.value = false;
      error.value =
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load DVF points";
    } finally {
      if (!controller.signal.aborted) {
        loading.value = false;
        abortController = undefined;
      }
    }
  }

  function scheduleFetch(
    bounds: LatLngBounds,
    zoom: number,
    filters: DvfPointFilters,
  ): void {
    cancelPending();

    debounceTimer = setTimeout(() => {
      debounceTimer = undefined;
      void fetchForBounds(bounds, zoom, filters);
    }, DEBOUNCE_MS);
  }

  return {
    points,
    stats,
    loading,
    error,
    truncated,
    cancelPending,
    fetchForBounds,
    scheduleFetch,
  };
}
