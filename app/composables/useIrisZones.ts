import type { LatLngBounds } from "leaflet";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import type { IrisZoneProperties } from "../../server/utils/iris-db.ts";

export const MIN_IRIS_ZOOM = 9;
const DEBOUNCE_MS = 300;

export type IrisZoneFeature = Feature<Polygon, IrisZoneProperties>;

type IrisApiResponse = FeatureCollection<Polygon, IrisZoneProperties>;

function isAbortError(error: unknown): boolean {
  if (error instanceof Error && error.name === "AbortError") {
    return true;
  }

  const cause = error instanceof Error ? error.cause : undefined;
  return cause instanceof DOMException && cause.name === "AbortError";
}

export function useIrisZones() {
  const zones = ref<IrisZoneFeature[]>([]);
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
  ): Promise<void> {
    cancelPending();

    if (zoom < MIN_IRIS_ZOOM) {
      zones.value = [];
      error.value = null;
      return;
    }

    const controller = new AbortController();
    abortController = controller;
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<IrisApiResponse>("/api/iris", {
        query: {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        },
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return;
      }

      zones.value = response.features as IrisZoneFeature[];
    } catch (fetchError) {
      if (controller.signal.aborted || isAbortError(fetchError)) {
        return;
      }

      zones.value = [];
      error.value =
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load IRIS zones";
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
    zones,
    loading,
    error,
    cancelPending,
    fetchForBounds,
    scheduleFetch,
  };
}
