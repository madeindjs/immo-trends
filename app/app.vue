<template>
  <ClientOnly>
    <div v-if="mapReady" class="drawer map">
      <input
        id="dvf-filter-drawer"
        type="checkbox"
        class="drawer-toggle"
      />

      <div class="drawer-content flex flex-col h-full">
        <div class="map-area relative flex-1 min-h-0">
          <LMap
            v-model:zoom="zoom"
            v-model:center="center"
            :use-global-leaflet="false"
            @ready="onMapReady"
          >
            <LTileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; <a href=&quot;https://www.openstreetmap.org/&quot;>OpenStreetMap</a> contributors"
              layer-type="base"
              name="OpenStreetMap"
            />
          </LMap>

          <button
            v-if="filters.codeIris"
            type="button"
            class="clear-zone-btn"
            aria-label="Effacer la zone IRIS"
            title="Effacer la zone"
            @click="clearSelectedZone"
          >
            Effacer la zone
          </button>

          <label
            for="dvf-filter-drawer"
            class="filter-control-btn"
            aria-label="Ouvrir les filtres"
            title="Filtres"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="size-4"
              aria-hidden="true"
            >
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
            </svg>
          </label>

          <div v-if="statusToast" class="toast toast-top toast-end z-[1000]">
            <div :class="['alert', statusToast.alertClass]">
              <span
                v-if="statusToast.showSpinner"
                class="loading loading-spinner loading-sm"
              />
              <span>{{ statusToast.message }}</span>
            </div>
          </div>

        </div>

        <DvfStatsPanel
          v-model:collapsed="statsPanelCollapsed"
          :stats="stats"
          :trends="trends"
          :loading="loading || trendsLoading"
          :error="trendsError"
          :zoom-too-low="zoomTooLowForData"
          :filters-valid="filtersAreValid()"
          @hover-month="hoveredTrendMonth = $event"
        />
      </div>

      <div class="drawer-side z-[1001]">
        <label
          for="dvf-filter-drawer"
          aria-label="Fermer les filtres"
          class="drawer-overlay"
        />
        <DvfFilterPanel v-model="filters" />
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="detailOpen"
        class="detail-drawer fixed inset-0 z-[1002]"
      >
        <button
          type="button"
          class="absolute inset-0 bg-black/40"
          aria-label="Fermer le détail"
          @click="closeDetail"
        />
        <div class="absolute inset-y-0 right-0 flex">
          <DvfDetailPanel
            :row="detailRow"
            :loading="detailLoading"
            :error="detailError"
            @close="closeDetail"
          />
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { Feature, FeatureCollection, Point, Polygon } from "geojson";
import type { GeoJSON, LatLngBounds, Layer, Map } from "leaflet";
import { MIN_FETCH_ZOOM } from "./composables/useDvfPoints.ts";
import { useIrisZones, type IrisZoneFeature } from "./composables/useIrisZones.ts";
import { pricePerSqmToColor } from "./utils/dvf-color.ts";
import { buildDvfPopupContent } from "./utils/dvf-popup.ts";
import type { DvfMapPoint } from "../types.ts";
import { calculatePricePerSqm } from "../scripts/draw.utils.ts";
import type { DvfPointFilters } from "./composables/useDvfPoints.ts";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  getDefaultFilters,
  normalizeCenter,
} from "./utils/url-state.ts";

type LeafletModule = typeof import("leaflet/dist/leaflet-src.esm");

const STATS_PANEL_STORAGE_KEY = "immo-trends.stats-panel-collapsed";

type DvfFeatureProperties = {
  rowid: number;
  id_mutation: string;
  date_mutation: string;
  valeur_fonciere: string;
  type_local: string;
  surface_reelle_bati: number | null;
  nombre_pieces_principales: number | null;
  code_postal: string;
  nom_commune: string;
  adresse_numero: string;
  adresse_suffixe: string;
  adresse_nom_voie: string;
};

function toFeature(point: DvfMapPoint): Feature<Point, DvfFeatureProperties> {
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [point.longitude, point.latitude],
    },
    properties: {
      rowid: point.rowid,
      id_mutation: point.id_mutation,
      date_mutation: point.date_mutation,
      valeur_fonciere: point.valeur_fonciere,
      type_local: point.type_local,
      surface_reelle_bati: point.surface_reelle_bati,
      nombre_pieces_principales: point.nombre_pieces_principales,
      code_postal: point.code_postal,
      nom_commune: point.nom_commune,
      adresse_numero: point.adresse_numero,
      adresse_suffixe: point.adresse_suffixe,
      adresse_nom_voie: point.adresse_nom_voie,
    },
  };
}

const mapReady = ref(false);
const zoom = ref(DEFAULT_ZOOM);
const center = ref<[number, number]>(DEFAULT_CENTER);
const mapInstance = shallowRef<Map | null>(null);
const leafletModule = shallowRef<LeafletModule | null>(null);
const dvfLayer = shallowRef<GeoJSON | null>(null);
const irisLayer = shallowRef<GeoJSON | null>(null);
const {
  zones: irisZones,
  cancelPending: cancelIrisPending,
  scheduleFetch: scheduleIrisFetch,
} = useIrisZones();
const {
  points,
  stats,
  loading,
  error,
  truncated,
  cancelPending,
  scheduleFetch,
} = useDvfPoints();
const {
  trends,
  loading: trendsLoading,
  error: trendsError,
  cancelPending: cancelTrendsPending,
  scheduleFetch: scheduleTrendsFetch,
} = useDvfTrends();
const {
  row: detailRow,
  loading: detailLoading,
  error: detailError,
  fetchDetail,
  clear: clearDetail,
  cancelPending: cancelDetailPending,
} = useDvfDetail();

const filters = ref<DvfPointFilters>(getDefaultFilters());
const detailOpen = ref(false);
const statsPanelCollapsed = ref(loadStatsPanelCollapsed());
const hoveredTrendMonth = ref<string | null>(null);
const { initializeFromUrl, pushMapState } = useAppUrlState(
  {
    zoom,
    center,
    filters,
  },
  {
    getMapViewState: () => {
      const map = mapInstance.value;
      if (map) {
        const { lat, lng } = map.getCenter();
        return {
          zoom: map.getZoom(),
          center: [lat, lng] as [number, number],
        };
      }

      return {
        zoom: zoom.value,
        center: normalizeCenter(center.value),
      };
    },
    onAppliedFromUrl: () => {
      if (mapInstance.value) {
        refreshData();
      }
    },
  },
);

function loadStatsPanelCollapsed(): boolean {
  try {
    return localStorage.getItem(STATS_PANEL_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function saveStatsPanelCollapsed(collapsed: boolean): void {
  localStorage.setItem(STATS_PANEL_STORAGE_KEY, String(collapsed));
}

const zoomTooLowForData = computed(
  () =>
    filters.value.codeIris == null &&
    (mapInstance.value?.getZoom() ?? zoom.value) < MIN_FETCH_ZOOM,
);

function filtersAreValid(): boolean {
  const {
    typeLocals,
    yearMin,
    yearMax,
    surfaceMin,
    surfaceMax,
    pricePerSqmMin,
    pricePerSqmMax,
  } = filters.value;

  if (typeLocals.length === 0 || yearMin > yearMax) {
    return false;
  }

  if (surfaceMin != null && surfaceMax != null && surfaceMin > surfaceMax) {
    return false;
  }

  if (
    pricePerSqmMin != null &&
    pricePerSqmMax != null &&
    pricePerSqmMin > pricePerSqmMax
  ) {
    return false;
  }

  return true;
}

function getMutationMonth(dateMutation: string): string {
  return dateMutation.slice(0, 7);
}

function getVisiblePoints(): DvfMapPoint[] {
  if (hoveredTrendMonth.value === null) {
    return points.value;
  }

  return points.value.filter(
    (point) =>
      getMutationMonth(point.date_mutation) === hoveredTrendMonth.value,
  );
}

function openDetail(rowid: number): void {
  detailOpen.value = true;
  void fetchDetail(rowid);
}

function closeDetail(): void {
  detailOpen.value = false;
  clearDetail();
}

function buildFeatureCollection(): FeatureCollection<
  Point,
  DvfFeatureProperties
> {
  return {
    type: "FeatureCollection",
    features: getVisiblePoints().map(toFeature),
  };
}

function buildIrisFeatureCollection(): FeatureCollection<
  Polygon,
  IrisZoneFeature["properties"]
> {
  return {
    type: "FeatureCollection",
    features: irisZones.value,
  };
}

function formatIrisLabel(properties: IrisZoneFeature["properties"]): string {
  const irisName = properties.nom_iris ?? properties.code_iris;
  const communeName = properties.nom_com ?? properties.insee_com;
  return `${irisName}, ${communeName}`;
}

function selectIrisZone(feature: IrisZoneFeature, layer: Layer): void {
  filters.value = {
    ...filters.value,
    codeIris: feature.properties.code_iris,
    irisLabel: formatIrisLabel(feature.properties),
  };

  const map = mapInstance.value;
  if (map) {
    const bounds = (layer as Layer & { getBounds?: () => LatLngBounds }).getBounds?.();
    if (bounds) {
      map.fitBounds(bounds, { padding: [24, 24] });
    }
  }

  refreshData();
}

function clearSelectedZone(): void {
  filters.value = {
    ...filters.value,
    codeIris: null,
    irisLabel: null,
  };
  refreshData();
}

async function getLeaflet(): Promise<LeafletModule> {
  if (!leafletModule.value) {
    leafletModule.value = await import("leaflet/dist/leaflet-src.esm");
  }

  return leafletModule.value;
}

async function renderPoints(): Promise<void> {
  const map = mapInstance.value;
  if (!map) {
    return;
  }

  const L = await getLeaflet();

  if (dvfLayer.value) {
    map.removeLayer(dvfLayer.value);
    dvfLayer.value = null;
  }

  if (points.value.length === 0) {
    return;
  }

  dvfLayer.value = L.geoJSON(buildFeatureCollection(), {
    pointToLayer(feature, latlng) {
      const properties = feature.properties as DvfFeatureProperties;
      const pricePerSqm = calculatePricePerSqm(
        properties.valeur_fonciere,
        properties.surface_reelle_bati,
      );
      const { fillColor, color } = pricePerSqmToColor(pricePerSqm, stats.value);

      return L.circleMarker(latlng, {
        radius: 5,
        color,
        weight: 1,
        fillColor,
        fillOpacity: 0.8,
      });
    },
    onEachFeature(feature, layer) {
      const properties = feature.properties as DvfFeatureProperties;

      layer.bindPopup(buildDvfPopupContent(properties), {
        closeButton: false,
        autoPan: false,
      });
      const handleOpenDetail = (event: { originalEvent: Event }): void => {
        event.originalEvent.stopPropagation();
        openDetail(properties.rowid);
      };

      layer.on("mouseover", (event) => {
        event.target.openPopup();
      });
      layer.on("mouseout", (event) => {
        event.target.closePopup();
      });
      layer.on("click", handleOpenDetail);
      layer.on("popupopen", () => {
        const popupContent = layer
          .getPopup()
          ?.getElement()
          ?.querySelector(".dvf-popup");

        if (popupContent instanceof HTMLElement) {
          popupContent.classList.add("dvf-popup-clickable");
          popupContent.addEventListener("click", (mouseEvent) => {
            mouseEvent.stopPropagation();
            openDetail(properties.rowid);
          });
        }
      });
    },
  });

  dvfLayer.value.addTo(map);
}

async function renderIrisZones(): Promise<void> {
  const map = mapInstance.value;
  if (!map) {
    return;
  }

  const L = await getLeaflet();

  if (irisLayer.value) {
    map.removeLayer(irisLayer.value);
    irisLayer.value = null;
  }

  if (irisZones.value.length === 0) {
    return;
  }

  const selectedCode = filters.value.codeIris;

  irisLayer.value = L.geoJSON(buildIrisFeatureCollection(), {
    style(feature) {
      const isSelected =
        selectedCode != null &&
        feature?.properties?.code_iris === selectedCode;

      return {
        color: isSelected ? "#1d4ed8" : "#64748b",
        weight: isSelected ? 2.5 : 1,
        fillColor: isSelected ? "#3b82f6" : "#94a3b8",
        fillOpacity: isSelected ? 0.25 : 0.08,
      };
    },
    onEachFeature(feature, layer) {
      const zoneFeature = feature as IrisZoneFeature;
      layer.on("click", (event) => {
        event.originalEvent.stopPropagation();
        selectIrisZone(zoneFeature, layer);
      });
    },
  });

  irisLayer.value.addTo(map);
}

type StatusToast = {
  message: string;
  alertClass: string;
  showSpinner?: boolean;
};

const statusToast = computed((): StatusToast | null => {
  if (loading.value) {
    return {
      message: "Chargement des transactions DVF…",
      alertClass: "alert-info",
      showSpinner: true,
    };
  }

  if (error.value) {
    return {
      message: error.value,
      alertClass: "alert-error",
    };
  }

  if (!filtersAreValid()) {
    return {
      message: "Ajustez les filtres pour afficher les transactions DVF.",
      alertClass: "alert-warning",
    };
  }

  if ((mapInstance.value?.getZoom() ?? zoom.value) < MIN_FETCH_ZOOM) {
    return {
      message: "Zoomez pour afficher les transactions DVF.",
      alertClass: "alert-warning",
    };
  }

  const zonePrefix =
    filters.value.codeIris && filters.value.irisLabel
      ? `Zone : ${filters.value.irisLabel} — `
      : "";

  if (truncated.value) {
    return {
      message: `${zonePrefix}${points.value.length} transactions affichées (résultats tronqués).`,
      alertClass: "alert-success",
    };
  }

  if (points.value.length > 0) {
    return {
      message: `${zonePrefix}${points.value.length} transactions affichées.`,
      alertClass: "alert-success",
    };
  }

  if (filters.value.codeIris && filters.value.irisLabel) {
    return {
      message: `Zone : ${filters.value.irisLabel} — aucune transaction DVF.`,
      alertClass: "alert-info",
    };
  }

  return {
    message: "Aucune transaction DVF dans cette zone.",
    alertClass: "alert-info",
  };
});

function refreshData(): void {
  const map = mapInstance.value;
  if (!map) {
    return;
  }

  const bounds = map.getBounds();
  const currentZoom = map.getZoom();
  scheduleIrisFetch(bounds, currentZoom);
  scheduleFetch(bounds, currentZoom, filters.value);
  scheduleTrendsFetch(bounds, currentZoom, filters.value);
}

function syncIrisLabelFromZones(): void {
  const codeIris = filters.value.codeIris;
  if (!codeIris || filters.value.irisLabel) {
    return;
  }

  const matchingZone = irisZones.value.find(
    (zone) => zone.properties.code_iris === codeIris,
  );

  if (matchingZone) {
    filters.value = {
      ...filters.value,
      irisLabel: formatIrisLabel(matchingZone.properties),
    };
  }
}

function invalidateMapSize(): void {
  mapInstance.value?.invalidateSize();
}

watch([points, stats, hoveredTrendMonth], () => {
  void renderPoints();
});

watch([irisZones, () => filters.value.codeIris], () => {
  syncIrisLabelFromZones();
  void renderIrisZones();
});

watch(filters, () => {
  refreshData();
}, { deep: true });

watch(statsPanelCollapsed, (collapsed) => {
  saveStatsPanelCollapsed(collapsed);
  nextTick(() => {
    invalidateMapSize();
  });
});

onBeforeUnmount(() => {
  cancelDetailPending();
  cancelIrisPending();
  const map = mapInstance.value;
  if (map && dvfLayer.value) {
    map.removeLayer(dvfLayer.value);
  }
  if (map && irisLayer.value) {
    map.removeLayer(irisLayer.value);
  }
});

onMounted(() => {
  initializeFromUrl();
  mapReady.value = true;
});

function onMapReady(map: Map): void {
  mapInstance.value = map;

  const handleViewportChange = () => {
    const { lat, lng } = map.getCenter();
    zoom.value = map.getZoom();
    center.value = [lat, lng];
    pushMapState();
    refreshData();
  };

  const handleMoveStart = () => {
    cancelPending();
    cancelTrendsPending();
    cancelIrisPending();
  };

  map.on("movestart", handleMoveStart);
  map.on("zoomstart", handleMoveStart);
  map.on("moveend", handleViewportChange);
  map.on("zoomend", handleViewportChange);
  refreshData();
  void renderPoints();
  void renderIrisZones();
}
</script>

<style>
html,
body,
#__nuxt {
  height: 100%;
  margin: 0;
}
</style>

<style scoped>
.map {
  height: 100vh;
  width: 100vw;
}

.drawer-content {
  position: relative;
  height: 100%;
}

.map-area {
  width: 100%;
}

.filter-control-btn {
  position: absolute;
  top: 74px;
  left: 10px;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  background: #fff;
  color: #333;
  cursor: pointer;
}

.filter-control-btn:hover {
  background: #f4f4f4;
}

.clear-zone-btn {
  position: absolute;
  top: 74px;
  left: 50px;
  z-index: 1000;
  display: flex;
  align-items: center;
  height: 30px;
  padding: 0 10px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  background: #fff;
  color: #333;
  font-size: 12px;
  cursor: pointer;
}

.clear-zone-btn:hover {
  background: #f4f4f4;
}

:global(.leaflet-popup-content .dvf-popup) {
  line-height: 1.4;
}

:global(.leaflet-popup-content .dvf-popup-clickable) {
  cursor: pointer;
}
</style>
