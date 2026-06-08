import type { LatLngBounds } from "leaflet";
import type { DvfPriceTrendPoint, DvfTrendsResponse } from "../../types.ts";
import type { DvfPointFilters } from "./useDvfPoints.ts";
import { MIN_FETCH_ZOOM } from "./useDvfPoints.ts";
import { buildDvfQueryParams } from "../utils/dvf-query.ts";

const DEBOUNCE_MS = 300;

function isAbortError(error: unknown): boolean {
  if (error instanceof Error && error.name === "AbortError") {
    return true;
  }

  const cause = error instanceof Error ? error.cause : undefined;
  return cause instanceof DOMException && cause.name === "AbortError";
}

export function useDvfTrends() {
  const trends = ref<DvfPriceTrendPoint[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

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

    if (zoom < MIN_FETCH_ZOOM) {
      trends.value = [];
      error.value = null;
      return;
    }

    if (filters.typeLocals.length === 0) {
      trends.value = [];
      error.value = null;
      return;
    }

    const controller = new AbortController();
    abortController = controller;
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<DvfTrendsResponse>("/api/dvf-trends", {
        query: buildDvfQueryParams(bounds, filters),
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return;
      }

      trends.value = response.trends;
    } catch (fetchError) {
      if (controller.signal.aborted || isAbortError(fetchError)) {
        return;
      }

      trends.value = [];
      error.value =
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load DVF trends";
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
    trends,
    loading,
    error,
    cancelPending,
    fetchForBounds,
    scheduleFetch,
  };
}
