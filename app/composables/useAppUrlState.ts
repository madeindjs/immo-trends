import type { Ref } from "vue";
import type { DvfPointFilters } from "./useDvfPoints.ts";
import {
  buildUrlQuery,
  normalizeCenter,
  parseUrlState,
  urlQueriesEqual,
  type MapViewState,
  type UrlQuery,
} from "../utils/url-state.ts";

const FILTER_DEBOUNCE_MS = 300;

type AppUrlRefs = {
  zoom: Ref<number>;
  center: Ref<[number, number]>;
  filters: Ref<DvfPointFilters>;
};

type UseAppUrlStateOptions = {
  getMapViewState?: () => MapViewState;
  onAppliedFromUrl?: () => void;
};

function toRouteQuery(query: UrlQuery): Record<string, string | string[]> {
  const routeQuery: Record<string, string | string[]> = {};

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      routeQuery[key] = value;
    }
  }

  return routeQuery;
}

function getCurrentMapView(
  refs: AppUrlRefs,
  getMapViewState?: () => MapViewState,
): MapViewState {
  if (getMapViewState) {
    return getMapViewState();
  }

  return {
    zoom: refs.zoom.value,
    center: normalizeCenter(refs.center.value),
  };
}

function getCurrentQuery(
  refs: AppUrlRefs,
  filters: DvfPointFilters,
  getMapViewState?: () => MapViewState,
): UrlQuery {
  const mapView = getCurrentMapView(refs, getMapViewState);
  return buildUrlQuery({ ...mapView, filters });
}

function applyState(
  state: ReturnType<typeof parseUrlState>,
  refs: AppUrlRefs,
): void {
  refs.zoom.value = state.zoom;
  refs.center.value = state.center;
  refs.filters.value = state.filters;
}

export function useAppUrlState(
  refs: AppUrlRefs,
  options: UseAppUrlStateOptions = {},
) {
  const route = useRoute();
  const router = useRouter();

  let filterDebounceTimer: ReturnType<typeof setTimeout> | undefined;
  let isSyncingFromUrl = false;

  function pushUrlState(): void {
    if (isSyncingFromUrl) {
      return;
    }

    const nextQuery = getCurrentQuery(
      refs,
      refs.filters.value,
      options.getMapViewState,
    );

    if (urlQueriesEqual(nextQuery, route.query as UrlQuery)) {
      return;
    }

    void router.push({ query: toRouteQuery(nextQuery) });
  }

  function syncFromRoute(): void {
    const parsed = parseUrlState(route.query as UrlQuery);
    const currentQuery = getCurrentQuery(
      refs,
      refs.filters.value,
      options.getMapViewState,
    );
    const parsedQuery = buildUrlQuery(parsed);

    if (urlQueriesEqual(currentQuery, parsedQuery)) {
      return;
    }

    isSyncingFromUrl = true;
    applyState(parsed, refs);
    nextTick(() => {
      isSyncingFromUrl = false;
      options.onAppliedFromUrl?.();
    });
  }

  function initializeFromUrl(): void {
    applyState(parseUrlState(route.query as UrlQuery), refs);
  }

  function scheduleFilterUrlPush(): void {
    if (filterDebounceTimer) {
      clearTimeout(filterDebounceTimer);
    }

    filterDebounceTimer = setTimeout(() => {
      filterDebounceTimer = undefined;
      pushUrlState();
    }, FILTER_DEBOUNCE_MS);
  }

  function pushMapState(): void {
    pushUrlState();
  }

  watch(
    refs.filters,
    () => {
      scheduleFilterUrlPush();
    },
    { deep: true },
  );

  watch(
    () => route.query,
    () => {
      syncFromRoute();
    },
    { deep: true },
  );

  onBeforeUnmount(() => {
    if (filterDebounceTimer) {
      clearTimeout(filterDebounceTimer);
    }
  });

  return {
    initializeFromUrl,
    pushMapState,
  };
}
