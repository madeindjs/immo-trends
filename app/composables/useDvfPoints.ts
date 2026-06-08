import type { LatLngBounds } from "leaflet";
import type { DvfMapPoint, DvfMapStats } from "../../types.ts";

export const MIN_FETCH_ZOOM = 10;
const DEBOUNCE_MS = 300;

type DvfApiResponse = {
  points: DvfMapPoint[];
  truncated: boolean;
  stats: DvfMapStats;
};

const EMPTY_STATS: DvfMapStats = {
  averagePricePerSqm: null,
  minPricePerSqm: null,
  maxPricePerSqm: null,
};

type DvfFilters = {
  typeLocal?: string;
  year?: string;
};

function isAbortError(error: unknown): boolean {
  if (error instanceof Error && error.name === "AbortError") {
    return true;
  }

  const cause = error instanceof Error ? error.cause : undefined;
  return cause instanceof DOMException && cause.name === "AbortError";
}

export function useDvfPoints(filters: DvfFilters = {}) {
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

  async function fetchForBounds(bounds: LatLngBounds, zoom: number): Promise<void> {
    cancelPending();

    if (zoom < MIN_FETCH_ZOOM) {
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
        query: {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
          ...(filters.typeLocal ? { type_local: filters.typeLocal } : {}),
          ...(filters.year ? { year: filters.year } : {}),
        },
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

  function scheduleFetch(bounds: LatLngBounds, zoom: number): void {
    cancelPending();

    debounceTimer = setTimeout(() => {
      debounceTimer = undefined;
      void fetchForBounds(bounds, zoom);
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
